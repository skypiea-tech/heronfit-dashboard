"use client";

import React, { useState, useEffect } from "react";
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
  const [dailyOccupancyData, setDailyOccupancyData] = useState<
    DailyOccupancyPoint[]
  >([]);
  const [userTypeData, setUserTypeData] = useState<UserTypeData[]>([]);
  const [monthlyTrendsData, setMonthlyTrendsData] = useState<MonthlyData[]>([]);
  const [peakHours, setPeakHours] = useState<Insight[]>([]);
  const [bookingInsights, setBookingInsights] = useState<Insight[]>([]);
  const [userEngagement, setUserEngagement] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  // Dummy data based on the screenshot
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

  const dummyDailyOccupancyData: DailyOccupancyPoint[] = [
    { time: "6AM", occupancy: 5 },
    { time: "7AM", occupancy: 10 },
    { time: "8AM", occupancy: 22 },
    { time: "9AM", occupancy: 24 },
    { time: "10AM", occupancy: 19 },
    { time: "11AM", occupancy: 15 },
    { time: "12PM", occupancy: 8 },
    { time: "1PM", occupancy: 22 },
    { time: "2PM", occupancy: 28 },
    { time: "3PM", occupancy: 25 },
    { time: "4PM", occupancy: 20 },
    { time: "5PM", occupancy: 15 },
    { time: "6PM", occupancy: 10 },
  ];

  const dummyUserTypeData: UserTypeData[] = [
    { type: "Students", percentage: 65, color: "#443dff" }, // Primary color-ish
    { type: "Faculty", percentage: 25, color: "#dddbff" }, // Secondary color-ish
    { type: "Staff", percentage: 10, color: "#2f27ce" }, // A darker primary
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

  useEffect(() => {
    // For now, use dummy data
    setSummaryMetrics(dummySummaryMetrics);
    setWeeklyData(dummyWeeklyData);
    setDailyOccupancyData(dummyDailyOccupancyData);
    setUserTypeData(dummyUserTypeData);
    setMonthlyTrendsData(dummyMonthlyTrendsData);
    setPeakHours(dummyPeakHours);
    setBookingInsights(dummyBookingInsights);
    setUserEngagement(dummyUserEngagement);
    setLoading(false);
    // TODO: Implement Supabase data fetching here later
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-text">Loading analytics...</div>
    );
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
                data={dummyWeeklyData}
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
                data={dummyDailyOccupancyData}
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
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Type Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-1">
          <h2 className="text-xl font-header mb-4">User Type Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dummyUserTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                  labelLine={false}
                >
                  {dummyUserTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}%`,
                    props.payload.type,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Basic Legend (replace with chart library legend) */}
          <div className="flex justify-center space-x-4 mt-4">
            {dummyUserTypeData.map((userType, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-gray-700"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: userType.color }}
                ></span>
                {userType.type} ({userType.percentage}%)
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends (Line Chart) */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-1">
          <h2 className="text-xl font-header mb-4">Monthly Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dummyMonthlyTrendsData}
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
                  stroke="#2f27ce"
                  activeDot={{ r: 8 }}
                  name="Trend"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Peak Hours</h2>
          <div className="space-y-2">
            {peakHours.map((insight, index) => (
              <div key={index} className="flex justify-between text-text">
                <p className="text-gray-600 text-sm">{insight.label}</p>
                <p className="font-medium text-sm">{insight.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Insights */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">Booking Insights</h2>
          <div className="space-y-2">
            {bookingInsights.map((insight, index) => (
              <div key={index} className="flex justify-between text-text">
                <p className="text-gray-600 text-sm">{insight.label}</p>
                <p className="font-medium text-sm">{insight.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* User Engagement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-header mb-4">User Engagement</h2>
          <div className="space-y-2">
            {userEngagement.map((insight, index) => (
              <div key={index} className="flex justify-between text-text">
                <p className="text-gray-600 text-sm">{insight.label}</p>
                <p className="font-medium text-sm">{insight.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
