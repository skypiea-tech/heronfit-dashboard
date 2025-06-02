"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DateTime } from "luxon";
// Importing placeholder icons if needed, but charting libraries often handle their own visuals
// import { ChartBarIcon, ChartPieIcon, ChartLineIcon } from '@heroicons/react/24/outline';

// Import Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Place type declarations at the top
type AnalyticsRow = { start_time_of_day: string; hourly_occupancy: number };
type BookingRow = { booking_time: string; session_date: string; status: string };
type AllBookingRow = { user_id: string; booking_time: string; session_date: string };

// Define types for data (based on screenshot/PRD)
interface SummaryMetric {
  value: string;
  description: string;
  change?: string;
  changeType?: "increase" | "decrease";
}

interface WeeklyData {
  day: string;
  bookings: number;
  attendance: number;
}

interface DailyOccupancyPoint {
  time: string;
  occupancy: number;
}

interface UserTypeData {
  type: string;
  percentage: number;
  color: string;
}

interface MonthlyData {
  month: string;
  value: number;
}

interface Insight {
  label: string;
  value: string;
}

// Dummy data based on the screenshot - Moved outside the component
const dummySummaryMetrics: SummaryMetric[] = [
  {
    value: "1,247",
    description: "Total Bookings This Month",
    change: "+12%",
    changeType: "increase",
  },
  {
    value: "43",
    description: "Average Daily Attendance",
    change: "+8%",
    changeType: "increase",
  },
  {
    value: "7.2%",
    description: "No-Show Rate",
    change: "-2.1%",
    changeType: "decrease",
  },
  {
    value: "89%",
    description: "Peak Utilization",
    change: "+5%",
    changeType: "increase",
  },
];

const dummyWeeklyData: WeeklyData[] = [
  { day: "Mon", bookings: 45, attendance: 42 },
  { day: "Tue", bookings: 55, attendance: 48 },
  { day: "Wed", bookings: 38, attendance: 35 },
  { day: "Thu", bookings: 62, attendance: 58 },
  { day: "Fri", bookings: 50, attendance: 45 },
  { day: "Sat", bookings: 35, attendance: 30 },
  { day: "Sun", bookings: 30, attendance: 28 },
];

const dummyMonthlyTrendsData: MonthlyData[] = [
  { month: "Jan", value: 400 },
  { month: "Feb", value: 380 },
  { month: "Mar", value: 450 },
  { month: "Apr", value: 500 },
  { month: "May", value: 480 },
  // Add more months
];

const dummyPeakHours: Insight[] = [
  { label: "Morning Peak", value: "8:00 - 9:00 AM" },
  { label: "Afternoon Peak", value: "2:00 - 3:00 PM" },
  { label: "Lowest Usage", value: "12:00 - 1:00 PM" },
];

const dummyBookingInsights: Insight[] = [
  { label: "Average Booking Lead Time", value: "1.5 days" },
  { label: "Cancellation Rate", value: "12%" },
  { label: "Same-day Bookings", value: "35%" },
];

const dummyUserEngagement: Insight[] = [
  { label: "Regular Users (5+ bookings/month)", value: "78%" },
  { label: "New Users This Month", value: "23" },
  { label: "Return Rate", value: "85%" },
];

const AnalyticsPage = () => {
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dailyOccupancyData, setDailyOccupancyData] = useState<
    DailyOccupancyPoint[]
  >([]);
  const [userTypeData, setUserTypeData] = useState<UserTypeData[]>([]);
  const [monthlyTrendsData, setMonthlyTrendsData] = useState<MonthlyData[]>([]);
  const [peakHours, setPeakHours] = useState<Insight[]>([]);
  const [bookingInsights, setBookingInsights] = useState<Insight[]>([]);
  const [userEngagement, setUserEngagement] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user type distribution
        const { data: users, error: usersErr } = await supabase
          .from('users')
          .select('user_role');
        
        if (usersErr) throw usersErr;

        // Process user roles and calculate percentages
        const typeCounts: Record<string, number> = {};
        (users || []).forEach(u => {
          let t = u.user_role || 'Unknown';
          if (['STAFF', 'FACULTY', 'STAFF/FACULTY', 'FACULTY_STAFF', 'STAFF_FACULTY', 'FACULTY-STAFF', 'STAFF-FACULTY'].includes(t)) {
            t = 'FACULTY/STAFF';
          }
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });

        const totalUsers = (users || []).length;
        const userTypeData = Object.entries(typeCounts).map(([type, count], i) => ({
          type,
          percentage: totalUsers ? Math.round((count / totalUsers) * 100) : 0,
          color: ["#443dff", "#dddbff", "#2f27ce", "#8884d8"][i % 4],
        }));

        setUserTypeData(userTypeData);

        // Fetch today's hourly analytics from analytics table
        const today = new Date().toISOString().slice(0, 10);
        const { data: analyticsRows, error: analyticsErr } = await supabase
          .from('analytics')
          .select('start_time_of_day, hourly_occupancy')
          .eq('date', today)
          .order('start_time_of_day');
        if (analyticsErr) throw analyticsErr;

        // Define time slot ranges (labels must match what you want on the chart)
        const timeSlotRanges = [
          { start: '06:00', end: '07:00', label: '6-7 AM' },
          { start: '07:00', end: '08:00', label: '7-8 AM' },
          { start: '08:00', end: '09:00', label: '8-9 AM' },
          { start: '09:00', end: '10:00', label: '9-10 AM' },
          { start: '10:00', end: '11:00', label: '10-11 AM' },
          { start: '11:00', end: '12:00', label: '11-12 PM' },
          { start: '12:00', end: '13:00', label: '12-1 PM' },
          { start: '13:00', end: '14:00', label: '1-2 PM' },
          { start: '14:00', end: '15:00', label: '2-3 PM' },
          { start: '15:00', end: '16:00', label: '3-4 PM' },
          { start: '16:00', end: '17:00', label: '4-5 PM' },
          { start: '17:00', end: '18:00', label: '5-6 PM' },
          { start: '18:00', end: '19:00', label: '6-7 PM' },
        ];

        // Map analytics rows to a lookup by start_time_of_day
        const analyticsMap = new Map(
          (analyticsRows || []).map(row => [row.start_time_of_day?.slice(0,5), row.hourly_occupancy || 0])
        );

        // Build chart data for each slot
        const occupancyData = timeSlotRanges.map(range => {
          const occ = analyticsMap.get(range.start) || 0;
          return {
            time: range.label,
            occupancy: occ,
          };
        });
        setDailyOccupancyData(occupancyData);

        // Set other dummy data for now
        setSummaryMetrics(dummySummaryMetrics);
        setWeeklyData(dummyWeeklyData);
        setMonthlyTrendsData(dummyMonthlyTrendsData);
        setPeakHours(dummyPeakHours);
        setBookingInsights(dummyBookingInsights);
        setUserEngagement(dummyUserEngagement);
      } catch (err) {
        let msg = 'Failed to load analytics';
        if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchAdvancedAnalytics = async () => {
      // --- 1. PEAK HOURS ---
      const today = new Date().toISOString().slice(0, 10);
      const { data: analyticsRows } = await supabase
        .from('analytics')
        .select('start_time_of_day, hourly_occupancy')
        .eq('date', today);

      type Slot = { time: string; occupancy: number; hour: number };
      const slots: Slot[] = (analyticsRows || []).map((row: AnalyticsRow) => ({
        time: row.start_time_of_day,
        occupancy: row.hourly_occupancy || 0,
        hour: parseInt(row.start_time_of_day?.slice(0, 2), 10)
      }));

      // Morning: 6-12, Afternoon: 12-18
      const morningSlots = slots.filter(s => s.hour >= 6 && s.hour < 12);
      const afternoonSlots = slots.filter(s => s.hour >= 12 && s.hour < 18);
      const nonzeroSlots = slots.filter(s => s.occupancy > 0);

      const morningPeak = morningSlots.reduce<Slot | null>((max, s) => !max || s.occupancy > max.occupancy ? s : max, null);
      const afternoonPeak = afternoonSlots.reduce<Slot | null>((max, s) => !max || s.occupancy > max.occupancy ? s : max, null);
      const lowestUsage = nonzeroSlots.reduce<Slot | null>((min, s) => !min || s.occupancy < min.occupancy ? s : min, null);

      setPeakHours([
        { label: "Morning Peak", value: morningPeak ? `${morningPeak.time} (${morningPeak.occupancy})` : "N/A" },
        { label: "Afternoon Peak", value: afternoonPeak ? `${afternoonPeak.time} (${afternoonPeak.occupancy})` : "N/A" },
        { label: "Lowest Usage", value: lowestUsage ? `${lowestUsage.time} (${lowestUsage.occupancy})` : "N/A" },
      ]);

      // --- 2. BOOKING INSIGHTS ---
      // Get current month range
      const now = DateTime.now();
      const monthStart = now.startOf('month').toISODate();
      const monthEnd = now.endOf('month').toISODate();

      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time, session_date, status')
        .gte('session_date', monthStart)
        .lte('session_date', monthEnd);

      let totalLeadDays = 0, leadCount = 0, cancelCount = 0, sameDayCount = 0;
      (bookings || []).forEach((b: BookingRow) => {
        const bookingDate = DateTime.fromISO(b.booking_time);
        const sessionDate = DateTime.fromISO(b.session_date);
        const lead = sessionDate.diff(bookingDate, 'days').days;
        if (!isNaN(lead)) {
          totalLeadDays += lead;
          leadCount++;
        }
        if (b.status && b.status.startsWith('cancelled')) cancelCount++;
        if (bookingDate.hasSame(sessionDate, 'day')) sameDayCount++;
      });

      setBookingInsights([
        { label: "Average Booking Lead Time", value: leadCount ? (totalLeadDays / leadCount).toFixed(1) + " days" : "N/A" },
        { label: "Cancellation Rate", value: bookings && bookings.length ? ((cancelCount / bookings.length) * 100).toFixed(1) + "%" : "N/A" },
        { label: "Same-day Bookings", value: bookings && bookings.length ? ((sameDayCount / bookings.length) * 100).toFixed(1) + "%" : "N/A" },
      ]);

      // --- 3. USER ENGAGEMENT ---
      // Get all bookings for this and previous month
      const prevMonthStart = now.minus({ months: 1 }).startOf('month').toISODate();
      const prevMonthEnd = now.minus({ months: 1 }).endOf('month').toISODate();

      const { data: allBookings } = await supabase
        .from('bookings')
        .select('user_id, booking_time, session_date')
        .or(`and(session_date.gte.${monthStart},session_date.lte.${monthEnd}),and(session_date.gte.${prevMonthStart},session_date.lte.${prevMonthEnd})`);

      type UserBookingStats = { thisMonth: number; prevMonth: number; firstBooking: string };
      const userBookings: Record<string, UserBookingStats> = {};
      (allBookings || []).forEach((b: AllBookingRow) => {
        const uid = b.user_id;
        const sessionDate = DateTime.fromISO(b.session_date);
        if (!userBookings[uid]) userBookings[uid] = { thisMonth: 0, prevMonth: 0, firstBooking: b.session_date };
        if (sessionDate >= DateTime.fromISO(monthStart) && sessionDate <= DateTime.fromISO(monthEnd)) userBookings[uid].thisMonth++;
        if (sessionDate >= DateTime.fromISO(prevMonthStart) && sessionDate <= DateTime.fromISO(prevMonthEnd)) userBookings[uid].prevMonth++;
        if (b.session_date < userBookings[uid].firstBooking) userBookings[uid].firstBooking = b.session_date;
      });

      const regularUsers = Object.values(userBookings).filter((u: UserBookingStats) => u.thisMonth >= 5).length;
      const newUsers = Object.values(userBookings).filter((u: UserBookingStats) => DateTime.fromISO(u.firstBooking) >= DateTime.fromISO(monthStart)).length;
      const returningUsers = Object.values(userBookings).filter((u: UserBookingStats) => u.thisMonth > 0 && u.prevMonth > 0).length;
      const usersThisMonth = Object.values(userBookings).filter((u: UserBookingStats) => u.thisMonth > 0).length;

      setUserEngagement([
        { label: "Regular Users (5+ bookings/month)", value: usersThisMonth ? ((regularUsers / usersThisMonth) * 100).toFixed(1) + "%" : "N/A" },
        { label: "New Users This Month", value: String(newUsers) },
        { label: "Return Rate", value: usersThisMonth ? ((returningUsers / usersThisMonth) * 100).toFixed(1) + "%" : "N/A" },
      ]);
    };

    fetchAdvancedAnalytics();
  }, []);

  useEffect(() => {
    const fetchSummaryMetrics = async () => {
      const now = DateTime.now();
      const monthStart = now.startOf('month').toISODate();
      const monthEnd = now.endOf('month').toISODate();
      const prevMonthStart = now.minus({ months: 1 }).startOf('month').toISODate();
      const prevMonthEnd = now.minus({ months: 1 }).endOf('month').toISODate();

      // 1. Total Bookings This Month & Last Month
      const { count: bookingsThisMonthCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('session_date', monthStart)
        .lte('session_date', monthEnd);
      const { count: bookingsLastMonthCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('session_date', prevMonthStart)
        .lte('session_date', prevMonthEnd);
      const totalBookingsThisMonth = bookingsThisMonthCount || 0;
      const totalBookingsLastMonth = bookingsLastMonthCount || 0;
      const bookingsChange = totalBookingsLastMonth ? ((totalBookingsThisMonth - totalBookingsLastMonth) / totalBookingsLastMonth) * 100 : 0;

      // 2. Average Daily Attendance (from analytics table, sum hourly_occupancy per day, average over days)
      const { data: analyticsThisMonth } = await supabase
        .from('analytics')
        .select('date, hourly_occupancy')
        .gte('date', monthStart)
        .lte('date', monthEnd);
      const attendanceByDay: Record<string, number> = {};
      (analyticsThisMonth || []).forEach((row: { date: string; hourly_occupancy: number }) => {
        if (!attendanceByDay[row.date]) attendanceByDay[row.date] = 0;
        attendanceByDay[row.date] += row.hourly_occupancy || 0;
      });
      const attendanceDays = Object.keys(attendanceByDay).length;
      const avgAttendanceThisMonth = attendanceDays ? Math.round(Object.values(attendanceByDay).reduce((a, b) => a + b, 0) / attendanceDays) : 0;
      // Previous month
      const { data: analyticsLastMonth } = await supabase
        .from('analytics')
        .select('date, hourly_occupancy')
        .gte('date', prevMonthStart)
        .lte('date', prevMonthEnd);
      const attendanceByDayLast: Record<string, number> = {};
      (analyticsLastMonth || []).forEach((row: { date: string; hourly_occupancy: number }) => {
        if (!attendanceByDayLast[row.date]) attendanceByDayLast[row.date] = 0;
        attendanceByDayLast[row.date] += row.hourly_occupancy || 0;
      });
      const attendanceDaysLast = Object.keys(attendanceByDayLast).length;
      const avgAttendanceLastMonth = attendanceDaysLast ? Math.round(Object.values(attendanceByDayLast).reduce((a, b) => a + b, 0) / attendanceDaysLast) : 0;
      const attendanceChange = avgAttendanceLastMonth ? ((avgAttendanceThisMonth - avgAttendanceLastMonth) / avgAttendanceLastMonth) * 100 : 0;

      // 3. No-Show Rate (from session_occurrences: (booked_slots - attended_count) / booked_slots)
      const { data: occThisMonth } = await supabase
        .from('session_occurrences')
        .select('booked_slots, attended_count')
        .gte('date', monthStart)
        .lte('date', monthEnd);
      let totalBooked = 0, totalAttended = 0;
      (occThisMonth || []).forEach((row: { booked_slots: number; attended_count: number }) => {
        totalBooked += row.booked_slots || 0;
        totalAttended += row.attended_count || 0;
      });
      const noShowRateThisMonth = totalBooked ? ((totalBooked - totalAttended) / totalBooked) * 100 : 0;
      // Previous month
      const { data: occLastMonth } = await supabase
        .from('session_occurrences')
        .select('booked_slots, attended_count')
        .gte('date', prevMonthStart)
        .lte('date', prevMonthEnd);
      let totalBookedLast = 0, totalAttendedLast = 0;
      (occLastMonth || []).forEach((row: { booked_slots: number; attended_count: number }) => {
        totalBookedLast += row.booked_slots || 0;
        totalAttendedLast += row.attended_count || 0;
      });
      const noShowRateLastMonth = totalBookedLast ? ((totalBookedLast - totalAttendedLast) / totalBookedLast) * 100 : 0;
      const noShowChange = noShowRateLastMonth ? (noShowRateThisMonth - noShowRateLastMonth) : 0;

      // 4. Peak Utilization (max occupancy / max capacity, from analytics table)
      const { data: analyticsPeakThisMonth } = await supabase
        .from('analytics')
        .select('hourly_occupancy')
        .gte('date', monthStart)
        .lte('date', monthEnd);
      const peakThisMonth = Math.max(...(analyticsPeakThisMonth || []).map((row: { hourly_occupancy: number }) => row.hourly_occupancy || 0), 0);
      const { data: analyticsPeakLastMonth } = await supabase
        .from('analytics')
        .select('hourly_occupancy')
        .gte('date', prevMonthStart)
        .lte('date', prevMonthEnd);
      const peakLastMonth = Math.max(...(analyticsPeakLastMonth || []).map((row: { hourly_occupancy: number }) => row.hourly_occupancy || 0), 0);
      // Assume max capacity is 50 (or fetch from settings if dynamic)
      const maxCapacity = 50;
      const peakUtilizationThisMonth = maxCapacity ? (peakThisMonth / maxCapacity) * 100 : 0;
      const peakUtilizationLastMonth = maxCapacity ? (peakLastMonth / maxCapacity) * 100 : 0;
      const peakUtilChange = peakUtilizationLastMonth ? (peakUtilizationThisMonth - peakUtilizationLastMonth) : 0;

      setSummaryMetrics([
        {
          value: totalBookingsThisMonth.toLocaleString(),
          description: "Total Bookings This Month",
          change: `${bookingsChange >= 0 ? "+" : ""}${bookingsChange.toFixed(0)}%`,
          changeType: bookingsChange >= 0 ? "increase" : "decrease",
        },
        {
          value: avgAttendanceThisMonth.toLocaleString(),
          description: "Average Daily Attendance",
          change: `${attendanceChange >= 0 ? "+" : ""}${attendanceChange.toFixed(0)}%`,
          changeType: attendanceChange >= 0 ? "increase" : "decrease",
        },
        {
          value: `${noShowRateThisMonth.toFixed(1)}%`,
          description: "No-Show Rate",
          change: `${noShowChange >= 0 ? "+" : ""}${noShowChange.toFixed(1)}%`,
          changeType: noShowChange > 0 ? "increase" : "decrease",
        },
        {
          value: `${peakUtilizationThisMonth.toFixed(0)}%`,
          description: "Peak Utilization",
          change: `${peakUtilChange >= 0 ? "+" : ""}${peakUtilChange.toFixed(0)}%`,
          changeType: peakUtilChange >= 0 ? "increase" : "decrease",
        },
      ]);
    };
    fetchSummaryMetrics();
  }, []);

  useEffect(() => {
    const fetchWeeklyAndMonthlyTrends = async () => {
      // --- Weekly Bookings vs Attendance ---
      // Get start of current week (Monday)
      const now = DateTime.now();
      // ISO week: Monday is 1, Sunday is 7
      const weekStart = now.startOf('week').toISODate();
      const weekEnd = now.endOf('week').toISODate();
      // Bookings per day
      const { data: weekBookings } = await supabase
        .from('bookings')
        .select('session_date')
        .gte('session_date', weekStart)
        .lte('session_date', weekEnd);
      // Attendance per day (from session_occurrences)
      const { data: weekAttendance } = await supabase
        .from('session_occurrences')
        .select('date, attended_count')
        .gte('date', weekStart)
        .lte('date', weekEnd);
      // Build day-of-week map
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const bookingsByDay: Record<string, number> = {};
      const attendanceByDay: Record<string, number> = {};
      days.forEach(d => { bookingsByDay[d] = 0; attendanceByDay[d] = 0; });
      (weekBookings || []).forEach((b: { session_date: string }) => {
        const day = DateTime.fromISO(b.session_date).toFormat('ccc');
        if (bookingsByDay[day] !== undefined) bookingsByDay[day]++;
      });
      (weekAttendance || []).forEach((a: { date: string; attended_count: number }) => {
        const day = DateTime.fromISO(a.date).toFormat('ccc');
        if (attendanceByDay[day] !== undefined) attendanceByDay[day] += a.attended_count || 0;
      });
      const weeklyData = days.map(day => ({
        day,
        bookings: bookingsByDay[day],
        attendance: attendanceByDay[day],
      }));
      setWeeklyData(weeklyData);

      // --- Monthly Booking Trends ---
      // Last 6 months
      const months: string[] = [];
      const monthLabels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const dt = now.minus({ months: i });
        months.push(dt.toFormat('yyyy-MM'));
        monthLabels.push(dt.toFormat('LLL'));
      }
      const monthStart6 = now.minus({ months: 5 }).startOf('month').toISODate();
      const monthEndNow = now.endOf('month').toISODate();
      const { data: bookings6mo } = await supabase
        .from('bookings')
        .select('session_date')
        .gte('session_date', monthStart6)
        .lte('session_date', monthEndNow);
      // Count bookings per month
      const bookingsByMonth: Record<string, number> = {};
      months.forEach(m => { bookingsByMonth[m] = 0; });
      (bookings6mo || []).forEach((b: { session_date: string }) => {
        const m = DateTime.fromISO(b.session_date).toFormat('yyyy-MM');
        if (bookingsByMonth[m] !== undefined) bookingsByMonth[m]++;
      });
      const monthlyTrendsData = months.map((m, i) => ({
        month: monthLabels[i],
        value: bookingsByMonth[m],
      }));
      setMonthlyTrendsData(monthlyTrendsData);
    };
    fetchWeeklyAndMonthlyTrends();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-text">Loading analytics...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Booking Data</h1>
      <p className="text-body text-lg mb-6">
        Insights into gym usage, bookings, and user activity.
      </p>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {summaryMetrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <p className="text-3xl font-bold text-text">{metric.value}</p>
            <p className="text-gray-600 text-sm mb-2">{metric.description}</p>
            {metric.change && (
              <p
                className={`text-sm font-medium ${
                  metric.changeType === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metric.change} vs last month
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Bookings vs Attendance (Bar Chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">
            Session Attendance Reports
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData} // Use state variable
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#443dff" name="Bookings" />
                <Bar dataKey="attendance" fill="#2f27ce" name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Occupancy Pattern (Line Chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Daily Occupancy Pattern</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyOccupancyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 'auto']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} people`, 'Occupancy']}
                  labelFormatter={(label) => `Time Slot: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#443dff"
                  activeDot={{ r: 8 }}
                  name="Occupancy"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Type Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">
            User Activity Metrics
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData} // Use state variable
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  label={({ name, percentage }) =>
                    `${name}: ${(percentage * 1).toFixed(0)}%`
                  }
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props) => [
                    `${value.toFixed(0)}%`,
                    props.payload.type,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Booking Trends (Line Chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Data Visualization</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrendsData} // Use state variable
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#443dff"
                  activeDot={{ r: 8 }}
                  name="Bookings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Usage Reports</h2>
          <ul>
            {peakHours.map((insight, index) => (
              <li key={index} className="mb-2 text-body">
                <span className="font-medium">{insight.label}:</span>{" "}
                {insight.value}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Booking Insights</h2>
          <ul>
            {bookingInsights.map((insight, index) => (
              <li key={index} className="mb-2 text-body">
                <span className="font-medium">{insight.label}:</span>{" "}
                {insight.value}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">User Engagement</h2>
          <ul>
            {userEngagement.map((insight, index) => (
              <li key={index} className="mb-2 text-body">
                <span className="font-medium">{insight.label}:</span>{" "}
                {insight.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TODO: Add more sections as needed, e.g., detailed tables, filters */}
    </div>
  );
};

export default AnalyticsPage;
