"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const DashboardPage = () => {
  const [stats, setStats] = React.useState({
    activeUsers: 0,
    bookingsToday: 0,
    currentOccupancy: 0,
    maxCapacity: 0,
    pendingApprovals: 0,
    percentActiveChange: 0,
    percentBookingsChange: 0,
    percentOccupancyChange: 0,
    percentPendingChange: 0,
  });  const [recentBookings, setRecentBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Active users (users who have bookings today)
        const { data: activeUsersData, error: activeUsersErr } = await supabase
          .from("bookings")
          .select("user_id", { count: "exact", head: true })
          .eq("session_date", todayStr)
          .eq("status", "confirmed");
        if (activeUsersErr) throw activeUsersErr;

        // Bookings today
        const { count: bookingsToday, error: bookingsErr } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("session_date", todayStr);
        if (bookingsErr) throw bookingsErr;

        // Current occupancy (sum of booked_slots, attended_count, and override_capacity for today's session_occurrences)
        const { data: occs, error: occErr } = await supabase
          .from("session_occurrences")
          .select("booked_slots, attended_count, override_capacity")
          .eq("date", todayStr);
        if (occErr) throw occErr;
        const currentOccupancy = (occs || []).reduce(
          (sum, o) => sum + (o.booked_slots || 0) + (o.attended_count || 0) + (o.override_capacity || 0),
          0
        );
        const maxCapacity = 15;

        // Pending approvals (bookings with status 'pending')
        const { count: pendingApprovals, error: pendingErr } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        if (pendingErr) throw pendingErr;        // Recent bookings (last 5) with user names
        const { data: recent, error: recentErr } = await supabase
          .from("bookings")
          .select(
            "id, user_id, status, session_start_time, session_end_time, session_date, ticket_id"
          )
          .order("created_at", { ascending: false })
          .limit(5);
        if (recentErr) throw recentErr;

        // Fetch user information separately for the recent bookings
        let recentWithUsers = recent || [];
        if (recent && recent.length > 0) {
          const userIds = recent.map(booking => booking.user_id);
          const { data: usersData, error: usersErr } = await supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", userIds);
          
          if (usersErr) {
            console.error("Error fetching user data:", usersErr);
          } else {
            // Create a map of user_id to user data
            const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
            
            // Add user data to recent bookings
            recentWithUsers = recent.map(booking => ({
              ...booking,
              users: usersMap.get(booking.user_id) || null
            }));
          }
        }

        setStats({
          activeUsers: activeUsersData?.length || 0,
          bookingsToday: bookingsToday || 0,
          currentOccupancy,
          maxCapacity,
          pendingApprovals: pendingApprovals || 0,
          percentActiveChange: 0, // TODO: implement trend
          percentBookingsChange: 0,
          percentOccupancyChange: 0,
          percentPendingChange: 0,
        });
        setRecentBookings(recentWithUsers);
      } catch (err) {
        let msg = "Failed to load dashboard stats";
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string"
        ) {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-text">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="">
      <h1 className="text-3xl font-header mb-2">Dashboard Overview</h1>
      <p className="text-body text-lg mb-6">
        Welcome back! Here&apos;s what&apos;s happening at UMak Gym today.
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Users Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Active Users
            </h3>
            {/* Placeholder Icon */}
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              {/* Icon goes here */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A12.041 12.041 0 0 1 16 21.718c-2.276.447-4.642.593-7.003.593-.119 0-.237 0-.356-.003L4.502 20.118Z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">{stats.activeUsers}</p>
          <p className="text-sm text-gray-500">+12% from yesterday</p>
        </div>

        {/* Today's Bookings Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Today&apos;s Bookings
            </h3>
            {/* Placeholder Icon */}
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              {/* Icon goes here */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6-6h.008v.008h-.008v-.008ZM12 15h.008v.008H12V15Zm2.25 0h.008v.008h-.008V15Z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">{stats.bookingsToday}</p>
          <p className="text-sm text-gray-500">+5% from yesterday</p>
        </div>

        {/* Current Occupancy Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Current Occupancy
            </h3>
            {/* Placeholder Icon */}
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              {/* Icon goes here */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.177 3.75 11.437 4.688 11.245l10.52-1.75a.75.75 0 0 1 .472 1.206l-7.913 9.254a1.5 1.5 0 0 1-2.073.042l-2.824-2.824A1.5 1.5 0 0 1 3 13.125Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.25 5.625c0-.828.672-1.5 1.5-1.5h.75c.828 0 1.5.672 1.5 1.5v.75c0 .828-.672 1.5-1.5 1.5h-.75a1.5 1.5 0 0 1-1.5-1.5V5.625Z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">
            {stats.currentOccupancy} / {stats.maxCapacity}
          </p>
          <p className="text-sm text-gray-500">46% from yesterday</p>
        </div>

        {/* Pending Approvals Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Pending Approvals
            </h3>
            {/* Placeholder Icon */}
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              {/* Icon goes here */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-text">
            {stats.pendingApprovals}
          </p>
          <p className="text-sm text-red-500">-2 from yesterday</p>
        </div>
      </div>

      {/* Recent Booking Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Booking Activity */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Recent Booking Activity
          </h2>
          {/* Placeholder list of bookings */}
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No recent booking activity.
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center">
                    {/* Placeholder Avatar */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>                    <div>
                      <p className="font-medium text-text">
                        {booking.users?.first_name && booking.users?.last_name 
                          ? `${booking.users.first_name} ${booking.users.last_name}`
                          : `User ${booking.user_id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.session_date} • {booking.session_start_time}
                      </p>
                    </div>
                  </div>                  <span className={`text-sm font-semibold ${
                    booking.status === "confirmed"
                      ? "text-green-600"
                      : booking.status === "pending"
                      ? "text-yellow-600"
                      : booking.status === "waitlisted"
                      ? "text-blue-600"
                      : booking.status === "cancelled_by_user"
                      ? "text-red-600"
                      : booking.status === "cancelled_by_admin"
                      ? "text-red-700"
                      : "text-gray-600"
                  }`}>
                    {booking.status === "confirmed"
                      ? "Confirmed"
                      : booking.status === "cancelled_by_user"
                      ? "Cancelled by User"
                      : booking.status === "cancelled_by_admin"
                      ? "Cancelled by Admin"
                      : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions and System Status */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-accent transition-colors">
                Manual Check-in
              </button>
              <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors">
                Send Announcement
              </button>
              <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors">
                View Reports
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              System Status
            </h2>
            <div className="space-y-2 text-text">
              <div className="flex justify-between">
                <span>Mobile App</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Notifications</span>
                <span className="text-yellow-600 font-medium">Delayed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
