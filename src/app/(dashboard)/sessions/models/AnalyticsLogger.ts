import { supabase } from '@/lib/supabaseClient';

/**
 * Log analytics for a completed session/timeslot (hourly).
 * Call this at the end of each timeslot.
 */
export async function logHourlySessionAnalytics({
  date,
  start_time_of_day,
  end_time_of_day,
  hourly_occupancy,
  daily_occupancy,
  booked_count,
  no_show_count,
  cancelled_count,
  waitlist_count,
  peak_time,
  max_capacity,
}: {
  date: string; // YYYY-MM-DD
  start_time_of_day: string; // "HH:MM"
  end_time_of_day: string;   // "HH:MM"
  hourly_occupancy: number;
  daily_occupancy: number;
  booked_count: number;
  no_show_count: number;
  cancelled_count: number;
  waitlist_count: number;
  peak_time: string; // "HH:MM"
  max_capacity: number;
}) {
  const { error } = await supabase.from('analytics').insert([
    {
      date,
      start_time_of_day,
      end_time_of_day,
      hourly_occupancy,
      daily_occupancy,
      booked_count,
      no_show_count,
      cancelled_count,
      waitlist_count,
      peak_time,
      max_capacity,
    },
  ]);
  if (error) {
    throw new Error('Failed to log hourly analytics: ' + error.message);
  }
}

/**
 * Log daily summary analytics (e.g., after gym closes or last timeslot ends).
 * This can be used for daily rollup if needed.
 */
export async function logDailyAnalyticsSummary({
  date,
  total_occupancy,
  total_booked,
  total_no_shows,
  total_cancellations,
  total_waitlist,
  peak_occupancy,
  peak_time,
  max_capacity,
}: {
  date: string;
  total_occupancy: number;
  total_booked: number;
  total_no_shows: number;
  total_cancellations: number;
  total_waitlist: number;
  peak_occupancy: number;
  peak_time: string;
  max_capacity: number;
}) {
  // Optionally, you can insert a special row or a separate table for daily summary
  // Here, we insert a row with start/end time as '00:00'/'23:59' to indicate daily summary
  const { error } = await supabase.from('analytics').insert([
    {
      date,
      start_time_of_day: '00:00',
      end_time_of_day: '23:59',
      hourly_occupancy: peak_occupancy, // or average if preferred
      daily_occupancy: total_occupancy,
      booked_count: total_booked,
      no_show_count: total_no_shows,
      cancelled_count: total_cancellations,
      waitlist_count: total_waitlist,
      peak_time,
      max_capacity,
    },
  ]);
  if (error) {
    throw new Error('Failed to log daily analytics: ' + error.message);
  }
}

/**
 * Check the analytics table for the latest date/hour, and for each missing hour since then (up to now),
 * aggregate session_occurrences data and log it to the analytics table.
 * This allows the system to fill in analytics for any missed hours automatically.
 */
export async function logMissingHourlyAnalytics() {
  // 1. Get the latest analytics entry
  const { data: latest, error: latestErr } = await supabase
    .from('analytics')
    .select('date, start_time_of_day')
    .order('date', { ascending: false })
    .order('start_time_of_day', { ascending: false })
    .limit(1);
  if (latestErr) throw latestErr;

  // 2. Determine the next hour to log
  let nextDate: string;
  let nextHour: number;
  if (latest && latest.length > 0) {
    nextDate = latest[0].date;
    nextHour = parseInt(latest[0].start_time_of_day.slice(0, 2), 10) + 1;
    if (nextHour >= 24) {
      // Move to next day
      const d = new Date(nextDate);
      d.setDate(d.getDate() + 1);
      nextDate = d.toISOString().slice(0, 10);
      nextHour = 0;
    }
  } else {
    // If no analytics yet, start from today 00:00
    const now = new Date();
    nextDate = now.toISOString().slice(0, 10);
    nextHour = 0;
  }

  // 3. For each hour from nextDate/nextHour up to now, log analytics
  const now = new Date();
  let currentDate = nextDate;
  let currentHour = nextHour;
  while (true) {
    const currentDateTime = new Date(`${currentDate}T${String(currentHour).padStart(2, '0')}:00:00`);
    if (currentDateTime >= now) break;

    // Aggregate session_occurrences for this hour
    const startTime = String(currentHour).padStart(2, '0') + ':00';
    const endTime = String(currentHour + 1).padStart(2, '0') + ':00';
    const { data: occs, error: occErr } = await supabase
      .from('session_occurrences')
      .select('booked_slots, attended_count, override_capacity, status, waitlist_count, cancelled_count, start_time_of_day, max_capacity')
      .eq('date', currentDate)
      .gte('start_time_of_day', startTime)
      .lt('start_time_of_day', endTime);
    if (occErr) throw occErr;

    // Aggregate values
    let hourly_occupancy = 0, booked_count = 0, attended_count = 0, no_show_count = 0, cancelled_count = 0, waitlist_count = 0;
    let peak_time = startTime;
    let max_occupancy = 0;
    let max_capacity = 0;
    (occs || []).forEach(occ => {
      const occVal = (occ.booked_slots || 0) + (occ.attended_count || 0) + (occ.override_capacity || 0);
      hourly_occupancy += occVal;
      booked_count += occ.booked_slots || 0;
      attended_count += occ.attended_count || 0;
      cancelled_count += occ.cancelled_count || 0;
      waitlist_count += occ.waitlist_count || 0;
      max_capacity = Math.max(max_capacity, occ.max_capacity || 0);
      const occTime = occ.start_time_of_day || startTime;
      if (occVal > max_occupancy) {
        max_occupancy = occVal;
        peak_time = occTime;
      }
    });
    no_show_count = booked_count - attended_count;

    // Insert analytics row
    await logHourlySessionAnalytics({
      date: currentDate,
      start_time_of_day: startTime,
      end_time_of_day: endTime,
      hourly_occupancy,
      daily_occupancy: 0, // Can be filled in by another process if needed
      booked_count,
      no_show_count,
      cancelled_count,
      waitlist_count,
      peak_time,
      max_capacity,
    });

    // Move to next hour
    currentHour++;
    if (currentHour >= 24) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      currentDate = d.toISOString().slice(0, 10);
      currentHour = 0;
    }
  }
}

/**
 * Debug function to log analytics for all slots in the current day.
 * This is useful for testing and development.
 */
export async function debugLogAnalyticsForTodaySlots() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const DEFAULT_DEBUG_MAX_CAPACITY = 50;
  
  // Get all slots for today
  const { data: slots, error: slotsError } = await supabase
    .from('session_occurrences')
    .select('*')
    .eq('date', today)
    .order('start_time_of_day', { ascending: true });

  if (slotsError) throw slotsError;
  if (!slots) return;

  // Log analytics for each slot
  for (const slot of slots) {
    const [hours, minutes] = slot.start_time_of_day.split(':');
    const endTime = `${String(parseInt(hours) + 1).padStart(2, '0')}:${minutes}`;
    
    await logHourlySessionAnalytics({
      date: today,
      start_time_of_day: slot.start_time_of_day,
      end_time_of_day: endTime,
      hourly_occupancy: (slot.booked_slots || 0) + (slot.attended_count || 0) + (slot.override_capacity || 0),
      daily_occupancy: 0,
      booked_count: slot.booked_slots || 0,
      no_show_count: (slot.booked_slots || 0) - (slot.attended_count || 0),
      cancelled_count: slot.cancelled_count || 0,
      waitlist_count: slot.waitlist_count || 0,
      peak_time: slot.start_time_of_day,
      max_capacity: DEFAULT_DEBUG_MAX_CAPACITY, // Use default debug max capacity
    });
  }
} 