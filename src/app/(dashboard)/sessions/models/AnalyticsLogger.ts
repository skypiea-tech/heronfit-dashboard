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
}: {
  date: string;
  total_occupancy: number;
  total_booked: number;
  total_no_shows: number;
  total_cancellations: number;
  total_waitlist: number;
  peak_occupancy: number;
  peak_time: string;
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
    },
  ]);
  if (error) {
    throw new Error('Failed to log daily analytics: ' + error.message);
  }
} 