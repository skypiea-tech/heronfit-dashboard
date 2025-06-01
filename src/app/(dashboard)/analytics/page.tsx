"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

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

const AnalyticsPage = () => {
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetric[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dailyOccupancyData, setDailyOccupancyData] = useState<DailyOccupancyPoint[]>([]);
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
        // 1. Summary Metrics
        const currentDate = new Date();
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const firstDay = `${yyyy}-${mm}-01`;
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10);

        const { count: totalBookings, error: totalBookingsErr } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('session_date', firstDay)
          .lte('session_date', lastDay);
        if (totalBookingsErr) throw totalBookingsErr;

        // Average daily attendance (bookings per day this month)
        const daysInMonth = new Date(yyyy, currentDate.getMonth() + 1, 0).getDate();
        const avgAttendance = totalBookings ? Math.round(totalBookings / daysInMonth) : 0;

        // No-show rate (bookings with status 'no-show' this month)
        const { count: noShowCount, error: noShowErr } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'no-show')
          .gte('session_date', firstDay)
          .lte('session_date', lastDay);
        if (noShowErr) throw noShowErr;
        const noShowRate = totalBookings ? `${((noShowCount || 0) / totalBookings * 100).toFixed(1)}%` : '0%';        // Peak utilization (max occupancy / max capacity for any session_occurrence this month)
        const { data: occs, error: occsErr } = await supabase
          .from('session_occurrences')
          .select('booked_slots, attended_count, override_capacity')
          .gte('date', firstDay)
          .lte('date', lastDay);
        if (occsErr) throw occsErr;
        let peakUtil = 0;
        const maxCapacityPerSlot = 15; // Hardcoded capacity per slot
        (occs || []).forEach(o => {
          const currentOccupancy = (o.booked_slots || 0) + (o.attended_count || 0) + (o.override_capacity || 0);
          const util = (currentOccupancy / maxCapacityPerSlot) * 100;
          if (util > peakUtil) peakUtil = util;
        });
        // Set summary metrics
        setSummaryMetrics([
          { value: totalBookings?.toLocaleString() || '0', description: 'Total Bookings This Month' },
          { value: avgAttendance.toString(), description: 'Average Daily Attendance' },
          { value: noShowRate, description: 'No-Show Rate' },
          { value: `${peakUtil.toFixed(0)}%`, description: 'Peak Utilization' },
        ]);

        // 2. Weekly Bookings vs Attendance (last 7 days) - Optimized to use a single query
        const sevenDaysAgo = new Date(currentDate);
        sevenDaysAgo.setDate(currentDate.getDate() - 6);
        const dateStr = sevenDaysAgo.toISOString().slice(0, 10);
        
        const { data: weeklyBookings, error: weeklyErr } = await supabase
          .from('bookings')
          .select('session_date, status')
          .gte('session_date', dateStr)
          .lte('session_date', currentDate.toISOString().slice(0, 10));
        
        if (weeklyErr) throw weeklyErr;

        // Process the data in memory instead of multiple queries
        const weekly: WeeklyData[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(currentDate);
          d.setDate(currentDate.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const day = d.toLocaleDateString('en-US', { weekday: 'short' });
          
          const dayBookings = weeklyBookings?.filter(b => b.session_date === dateStr) || [];
          const bookings = dayBookings.length;
          const attendance = dayBookings.filter(b => b.status === 'confirmed').length;
          
          weekly.push({ day, bookings, attendance });
        }
        setWeeklyData(weekly);

        // 3. Daily Occupancy Pattern (today, by hour)
        const occToday = (await supabase
          .from('session_occurrences')
          .select('start_time, booked_slots, attended_count, override_capacity')
          .eq('date', currentDate.toISOString().slice(0, 10))
        ).data || [];
        setDailyOccupancyData(
          occToday.map(o => ({
            time: o.start_time?.slice(0, 5) || '',
            occupancy: (o.booked_slots || 0) + (o.attended_count || 0) + (o.override_capacity || 0),
          }))
        );

        // 4. User Type Distribution (from users table)
        const { data: users, error: usersErr } = await supabase
          .from('users')
          .select('user_role');
        if (usersErr) throw usersErr;
        const typeCounts: Record<string, number> = {};
        (users || []).forEach(u => {
          let t = u.user_role || 'Unknown';
          // Group staff and faculty variations under FACULTY/STAFF
          if (['STAFF', 'FACULTY', 'STAFF/FACULTY', 'FACULTY_STAFF', 'STAFF_FACULTY', 'FACULTY-STAFF', 'STAFF-FACULTY'].includes(t)) {
            t = 'FACULTY/STAFF';
          }
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const totalUsers = (users || []).length;
        setUserTypeData(
          Object.entries(typeCounts).map(([type, count], i) => ({
            type,
            percentage: totalUsers ? Math.round((count / totalUsers) * 100) : 0,
            color: ["#443dff", "#dddbff", "#2f27ce", "#8884d8"][i % 4],
          }))
        );

        // 5. Monthly Booking Trends (last 6 months)
        const monthly: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthStr = d.toISOString().slice(0, 7);
          const { count: value, error: mErr } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .gte('session_date', `${monthStr}-01`)
            .lte('session_date', `${monthStr}-31`);
          if (mErr) throw mErr;
          monthly.push({ month: d.toLocaleString('en-US', { month: 'short' }), value: value || 0 });
        }
        setMonthlyTrendsData(monthly);        // 6. Generate insights based on the data
        const peakHoursData: Insight[] = [];
        if (dailyOccupancyData.length > 0) {
          const peakTime = dailyOccupancyData.reduce((prev, current) =>
            prev.occupancy > current.occupancy ? prev : current
          );
          peakHoursData.push({ label: "Peak Time", value: `${peakTime.time} (${peakTime.occupancy} people)` });
        }
        if (weeklyData.length > 0) {
          const avgBookings = weeklyData.reduce((sum, day) => sum + day.bookings, 0) / weeklyData.length;
          peakHoursData.push({ label: "Avg Daily Bookings", value: `${avgBookings.toFixed(1)}` });
        }
        setPeakHours(peakHoursData);

        const bookingInsightsData: Insight[] = [];
        if (totalBookings && noShowCount !== undefined) {
          const confirmationRate = ((totalBookings - (noShowCount || 0)) / totalBookings * 100).toFixed(1);
          bookingInsightsData.push({ label: "Confirmation Rate", value: `${confirmationRate}%` });
        }
        if (weeklyData.length > 0) {
          const totalWeeklyBookings = weeklyData.reduce((sum, day) => sum + day.bookings, 0);
          const totalWeeklyAttendance = weeklyData.reduce((sum, day) => sum + day.attendance, 0);
          const attendanceRate = totalWeeklyBookings > 0 ? ((totalWeeklyAttendance / totalWeeklyBookings) * 100).toFixed(1) : '0';
          bookingInsightsData.push({ label: "Weekly Attendance Rate", value: `${attendanceRate}%` });
        }
        setBookingInsights(bookingInsightsData);

        const engagementData: Insight[] = [];
        if (users && users.length > 0) {
          engagementData.push({ label: "Total Registered Users", value: users.length.toString() });
        }
        if (totalBookings) {
          const avgBookingsPerUser = users && users.length > 0 ? (totalBookings / users.length).toFixed(1) : '0';
          engagementData.push({ label: "Avg Bookings/User", value: avgBookingsPerUser });
        }
        setUserEngagement(engagementData);
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
  }, []); // Set dependency array to empty for stable behavior

  if (loading) {
    return <div className="p-6 text-center text-text">Loading analytics...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Analytics & Reports</h1>
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
            Weekly Bookings vs Attendance
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
                data={dailyOccupancyData} // Use state variable
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="occupancy"
                  stroke="#443dff"
                  activeDot={{ r: 8 }}
                  name="Occupancy"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>        {/* User Type Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">
            User Type Distribution
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
                  dataKey="percentage"                  label={({ type, percentage }) =>
                    `${type}: ${percentage}%`
                  }
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Booking Trends (Line Chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Monthly Booking Trends</h2>
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
          <h2 className="text-xl font-header mb-4">Peak Hours</h2>
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