// Types for session data
export interface SessionSummary {
  peakOccupancy: number;
  averageOccupancy: number;
  totalCheckIns: number;
  currentUtilization: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  current: number;
  capacity: number;
  status: "open" | "full";
  category?: string;
}

// Dummy data that will be replaced with real data fetching later
export const dummySummary: SessionSummary = {
  peakOccupancy: 28,
  averageOccupancy: 18,
  totalCheckIns: 47,
  currentUtilization: "46%",
};

export const dummyTimeSlots: TimeSlot[] = [
  {
    id: "1",
    time: "07:00 - 08:00",
    current: 12,
    capacity: 25,
    status: "open",
  },
  {
    id: "2",
    time: "08:00 - 09:00",
    current: 23,
    capacity: 25,
    status: "open",
  },
  {
    id: "3",
    time: "09:00 - 10:00",
    current: 25,
    capacity: 25,
    status: "full",
  },
  {
    id: "4",
    time: "10:00 - 11:00",
    current: 18,
    capacity: 25,
    status: "open",
  },
  {
    id: "5",
    time: "11:00 - 12:00",
    current: 15,
    capacity: 25,
    status: "open",
  },
  {
    id: "6",
    time: "12:00 - 13:00",
    current: 0,
    capacity: 25,
    status: "open",
  },
  {
    id: "7",
    time: "13:00 - 14:00",
    current: 8,
    capacity: 25,
    status: "open",
  },
  {
    id: "8",
    time: "14:00 - 15:00",
    current: 22,
    capacity: 25,
    status: "open",
  },
  {
    id: "9",
    time: "15:00 - 16:00",
    current: 25,
    capacity: 25,
    status: "full",
  },
  {
    id: "10",
    time: "16:00 - 17:00",
    current: 20,
    capacity: 25,
    status: "open",
  },
];

// Constants
export const DEFAULT_MAXIMUM_CAPACITY = 50;
export const DEFAULT_CURRENT_OCCUPANCY = 23;

// Supabase client (assume env vars are set)
import { supabase } from '@/lib/supabaseClient';

// Helper: format time range
function formatTimeRange(start: string, end: string) {
  return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

// Types for Supabase join result
interface SessionJoin {
  start_time_of_day: string;
  end_time_of_day: string;
  capacity: number;
  category?: string;
}

type OccurrenceRecord = Record<string, unknown>;

// Fetch and process today's (or most recent) session occurrences for dashboard
export async function fetchTodayTimeSlots(): Promise<TimeSlot[]> {
  // 1. Get today in YYYY-MM-DD, but if Sunday, use Monday
  const today = new Date();
  const targetDate = new Date(today);
  if (today.getDay() === 0) { // Sunday
    targetDate.setDate(today.getDate() + 1); // Move to Monday
  }
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  // 2. Query for session_occurrences for target date, join sessions
  let { data: occurrences } = await supabase
    .from('session_occurrences')
    .select(`
      id,
      session_id,
      date,
      booked_slots,
      override_capacity,
      status,
      sessions:session_id (
        start_time_of_day,
        end_time_of_day,
        capacity,
        category
      )
    `)
    .eq('date', targetDateStr)
    .order('start_time_of_day', { foreignTable: 'sessions', ascending: true });

  // 3. If no data for target date, get most recent previous day with data
  if (!occurrences || occurrences.length === 0) {
    const { data: prev } = await supabase
      .from('session_occurrences')
      .select(`
        id,
        session_id,
        date,
        booked_slots,
        override_capacity,
        status,
        sessions:session_id (
          start_time_of_day,
          end_time_of_day,
          capacity,
          category
        )
      `)
      .lt('date', targetDateStr)
      .order('date', { ascending: false })
      .order('start_time_of_day', { foreignTable: 'sessions', ascending: true })
      .limit(20); // get up to 20, just in case
    if (prev && prev.length > 0) {
      // Only keep the most recent date
      const mostRecentDate = prev[0].date;
      occurrences = prev.filter((o: OccurrenceRecord) => o.date === mostRecentDate);
    } else {
      return [];
    }
  }

  // 4. Process into TimeSlot[]
  // TODO: Strongly type occurrences (from Supabase)
  return (occurrences as unknown as OccurrenceRecord[]).map((occ: OccurrenceRecord) => {
    // Supabase join may return sessions as an array
    const session: SessionJoin = Array.isArray(occ.sessions) ? (occ.sessions as SessionJoin[])[0] : (occ.sessions as SessionJoin);
    const capacity = occ.override_capacity || session.capacity;
    const booked = occ.booked_slots || 0;
    const status = booked >= capacity ? 'full' : 'open';
    return {
      id: occ.id as string,
      time: formatTimeRange(session.start_time_of_day, session.end_time_of_day),
      current: booked as number,
      capacity: capacity as number,
      status,
      category: session.category,
    };
  });
}

/**
 * Get the current gym occupancy based on the current time and today's time slots.
 * - If current time is within a slot, use that slot.
 * - If not, use the nearest slot (forward or backward).
 * Returns the slot and its occupancy (current).
 */
export function getCurrentGymOccupancy(timeSlots: TimeSlot[], now: Date = new Date()) {
  if (!timeSlots || timeSlots.length === 0) return { occupancy: 0, slot: null };

  // Helper to parse "HH:MM" to minutes since midnight
  function toMinutes(str: string) {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  }

  // Get current time in minutes since midnight
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Map slots to their start/end in minutes
  const slotsWithRange = timeSlots.map(slot => {
    const [start, end] = slot.time.split(" - ");
    return {
      ...slot,
      startMinutes: toMinutes(start),
      endMinutes: toMinutes(end),
    };
  });

  // 1. Try to find slot where now is within range
  let currentSlot = slotsWithRange.find(slot => nowMinutes >= slot.startMinutes && nowMinutes < slot.endMinutes);

  // 2. If not found, find the nearest slot (forward or backward)
  if (!currentSlot) {
    // Find the slot with the minimum absolute difference to now
    currentSlot = slotsWithRange.reduce((prev, curr) => {
      const prevDiff = Math.min(Math.abs(nowMinutes - prev.startMinutes), Math.abs(nowMinutes - prev.endMinutes));
      const currDiff = Math.min(Math.abs(nowMinutes - curr.startMinutes), Math.abs(nowMinutes - curr.endMinutes));
      return currDiff < prevDiff ? curr : prev;
    });
  }

  return {
    occupancy: currentSlot.current,
    slot: currentSlot,
  };
} 