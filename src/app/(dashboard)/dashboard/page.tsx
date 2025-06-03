"use client";

import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

interface Booking {
  id: string;
  user_id: string;
  status: string;
  session_start_time: string;
  session_end_time: string;
  session_date: string;
  ticket_id?: string;
  created_at: string;
  users?: {
    first_name?: string;
    last_name?: string;
    email_address?: string;
    avatar?: string;
  } | null;
}

// Add interface for yesterday's stats
interface YesterdayStats {
  activeUsers: number;
  bookingsToday: number;
  currentOccupancy: number;
  pendingApprovals: number;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DashboardPage = () => {
  const router = useRouter();
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
  });
  const [recentBookings, setRecentBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [gymStatusData, setGymStatusData] = React.useState<{
    gym_status: "gym_open" | "gym_closed";
    current_occupancy: number;
    pending_approvals: number;
  } | null>(null);
  const [nextSession, setNextSession] = React.useState<null | { start: string, end: string }>(null);
  const [currentTimePH, setCurrentTimePH] = React.useState<string>("");
  const [currentSessionOccupancy, setCurrentSessionOccupancy] = React.useState<number|null>(null);
  const [currentSessionTime, setCurrentSessionTime] = React.useState<string|null>(null);

  // Helper function to get yesterday's date in YYYY-MM-DD format
  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Function to fetch yesterday's stats
  const fetchYesterdayStats = async (): Promise<YesterdayStats> => {
    const yesterdayStr = getYesterdayDate();
    
    // Active users yesterday
    const { data: yesterdayActiveUsers, error: yesterdayActiveErr } = await supabase
      .from("bookings")
      .select("user_id", { count: "exact", head: true })
      .eq("session_date", yesterdayStr)
      .eq("status", "confirmed");
    if (yesterdayActiveErr) throw yesterdayActiveErr;

    // Bookings yesterday
    const { count: yesterdayBookings, error: yesterdayBookingsErr } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("session_date", yesterdayStr);
    if (yesterdayBookingsErr) throw yesterdayBookingsErr;

    // Occupancy yesterday
    const { data: yesterdayOccs, error: yesterdayOccErr } = await supabase
      .from("session_occurrences")
      .select("booked_slots, attended_count, override_capacity")
      .eq("date", yesterdayStr);
    if (yesterdayOccErr) throw yesterdayOccErr;
    const yesterdayOccupancy = (yesterdayOccs || []).reduce(
      (sum, o) => sum + (o.booked_slots || 0) + (o.attended_count || 0) + (o.override_capacity || 0),
      0
    );

    // Pending approvals yesterday
    const { count: yesterdayPending, error: yesterdayPendingErr } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("session_date", yesterdayStr);
    if (yesterdayPendingErr) throw yesterdayPendingErr;

    return {
      activeUsers: yesterdayActiveUsers?.length || 0,
      bookingsToday: yesterdayBookings || 0,
      currentOccupancy: yesterdayOccupancy,
      pendingApprovals: yesterdayPending || 0,
    };
  };

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

        // Fetch yesterday's stats first
        const yesterdayStats = await fetchYesterdayStats();

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

        // Current occupancy
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

        // Pending approvals: count bookings with status 'pending_attendance'
        const { count: pendingApprovals, error: pendingErr } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending_attendance");
        if (pendingErr) throw pendingErr;

        // Calculate percentage changes
        const percentActiveChange = calculatePercentageChange(
          activeUsersData?.length || 0,
          yesterdayStats.activeUsers
        );
        const percentBookingsChange = calculatePercentageChange(
          bookingsToday || 0,
          yesterdayStats.bookingsToday
        );
        const percentOccupancyChange = calculatePercentageChange(
          currentOccupancy,
          yesterdayStats.currentOccupancy
        );
        const percentPendingChange = calculatePercentageChange(
          pendingApprovals || 0,
          yesterdayStats.pendingApprovals
        );

        setStats({
          activeUsers: activeUsersData?.length || 0,
          bookingsToday: bookingsToday || 0,
          currentOccupancy,
          maxCapacity,
          pendingApprovals: pendingApprovals || 0,
          percentActiveChange,
          percentBookingsChange,
          percentOccupancyChange,
          percentPendingChange,
        });

        // Recent bookings (last 5) with user names
        const { data: recent, error: recentErr } = await supabase
          .from("bookings")
          .select(
            "id, user_id, status, session_start_time, session_end_time, session_date, ticket_id, created_at"
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
            .select("id, first_name, last_name, avatar, email_address")
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

  React.useEffect(() => {
    const fetchGymStatus = async () => {
      // Query for current session in Manila timezone
      const { data, error } = await supabaseAdmin.rpc('get_current_gym_status');
      if (!error && data && data.length > 0) {
        setGymStatusData(data[0]);
      } else {
        setGymStatusData({ gym_status: "gym_closed", current_occupancy: 0, pending_approvals: 0 });
      }
    };
    fetchGymStatus();
  }, []);

  React.useEffect(() => {
    // Update current time in Asia/Manila every 30 seconds
    const updateTime = () => {
      const now = new Date();
      // Convert to Asia/Manila time
      const phTime = now.toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true });
      setCurrentTimePH(phTime);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    // If gym is closed, fetch the next session for today
    const fetchNextSession = async () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;
      // Get current Manila time as string (HH:MM:SS)
      const nowPH = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const nowTime = nowPH.toTimeString().slice(0,8);
      // Find the next session_occurrence for today
      const { data: sessions, error } = await supabase
        .from('session_occurrences')
        .select('start_time_of_day, end_time_of_day')
        .eq('date', todayStr)
        .eq('status', 'scheduled')
        .gt('start_time_of_day', nowTime)
        .order('start_time_of_day', { ascending: true })
        .limit(1);
      if (!error && sessions && sessions.length > 0) {
        setNextSession({ start: sessions[0].start_time_of_day, end: sessions[0].end_time_of_day });
      } else {
        setNextSession(null);
      }
    };
    if (gymStatusData?.gym_status === 'gym_closed') {
      fetchNextSession();
    } else {
      setNextSession(null);
    }
  }, [gymStatusData]);

  React.useEffect(() => {
    // Find the current session occurrence for today and count confirmed bookings
    const fetchCurrentSessionOccupancy = async () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;
      // Get current Manila time as string (HH:MM:SS)
      const nowPH = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const nowTime = nowPH.toTimeString().slice(0,8);
      // Find the current session_occurrence for today
      const { data: sessions, error } = await supabase
        .from('session_occurrences')
        .select('id, start_time_of_day, end_time_of_day')
        .eq('date', todayStr)
        .eq('status', 'scheduled')
        .lte('start_time_of_day', nowTime)
        .gt('end_time_of_day', nowTime)
        .limit(1);
      if (!error && sessions && sessions.length > 0) {
        const session = sessions[0];
        setCurrentSessionTime(`${session.start_time_of_day} - ${session.end_time_of_day}`);
        // Count confirmed bookings for this session
        const { count, error: bookingsErr } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('session_occurrence_id', session.id)
          .eq('status', 'confirmed');
        setCurrentSessionOccupancy(bookingsErr ? 0 : (count ?? 0));
      } else {
        setCurrentSessionTime(null);
        setCurrentSessionOccupancy(null);
      }
    };
    fetchCurrentSessionOccupancy();
    const interval = setInterval(fetchCurrentSessionOccupancy, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Helper to format date as 'Month Day, Year'
  function formatSessionDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Helper to format time range in 12-hour format
  function formatTimeRange12h(start: string, end: string) {
    if (!start || !end) return "";
    const to12h = (t: string) => {
      const [h, m] = t.split(":");
      const hour = parseInt(h, 10);
      const minute = parseInt(m, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
    };
    return `${to12h(start)} - ${to12h(end)}`;
  }

  if (loading) {
    return <div className="p-6 text-center text-text">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="">
      <h1 className="text-3xl font-header mb-2">Dashboard</h1>
      <p className="text-body text-lg mb-6">
        Welcome back! Here&apos;s what&apos;s happening at UMak Gym today.
      </p>

      {/* --- Move summary cards to the top --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Users Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Current Active Users
            </h3>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
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
          <p className={`text-sm ${
            Math.abs(stats.percentActiveChange) < 1 
              ? 'text-yellow-500' 
              : stats.percentActiveChange > 0 
                ? 'text-green-500' 
                : 'text-red-500'
          }`}>
            {stats.percentActiveChange >= 0 ? '+' : ''}{stats.percentActiveChange.toFixed(0)}% from yesterday
          </p>
        </div>
        {/* Today's Bookings Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Today&apos;s Bookings
            </h3>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
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
          <p className={`text-sm ${
            Math.abs(stats.percentBookingsChange) < 1 
              ? 'text-yellow-500' 
              : stats.percentBookingsChange > 0 
                ? 'text-green-500' 
                : 'text-red-500'
          }`}>
            {stats.percentBookingsChange >= 0 ? '+' : ''}{stats.percentBookingsChange.toFixed(0)}% from yesterday
          </p>
        </div>
        {/* Current Occupancy Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Current Occupancy
            </h3>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
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
          {currentSessionOccupancy !== null ? (
            <>
              <div className="text-base text-gray-500 mb-1">Session: {currentSessionTime}</div>
              <p className="text-3xl font-bold text-text">{currentSessionOccupancy}</p>
            </>
          ) : (
            <p className="text-3xl font-bold text-text">Gym is not open</p>
          )}
        </div>
        {/* Pending Approvals Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Pending Approvals
            </h3>
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
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
            {gymStatusData?.gym_status === "gym_closed"
              ? 0
              : gymStatusData?.pending_approvals ?? 0}
          </p>
        </div>
      </div>

      {/* Manual Booking and Confirm Attendance - now below the stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Manual Booking (Left) */}
        <div className="bg-white p-4 rounded-lg shadow min-h-0">
          <h2 className="text-lg font-semibold mb-2">Manual Booking</h2>
          <ManualBookingForm />
        </div>
        {/* Confirm Attendance (Right) */}
        <div className="bg-white p-4 rounded-lg shadow min-h-0">
          <h2 className="text-lg font-semibold mb-2">Confirm Attendance</h2>
          <ConfirmAttendanceForm />
        </div>
      </div>

      {/* Recent Booking Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Booking Activity */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Recent Booking Activities
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
                    {/* Avatar or initials */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-4 flex items-center justify-center text-gray-600 font-medium text-base overflow-hidden">
                      {booking.users?.avatar ? (
                        <img src={booking.users.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span>
                          {booking.users?.first_name || booking.users?.last_name
                            ? `${booking.users?.first_name?.[0] || ''}${booking.users?.last_name?.[0] || ''}`.toUpperCase()
                            : <span className="text-xs">No Avatar</span>}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text">
                        {booking.users?.first_name && booking.users?.last_name
                          ? `${booking.users.first_name} ${booking.users.last_name}`
                          : `User ${booking.user_id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatSessionDate(booking.session_date)} • {formatTimeRange12h(booking.session_start_time, booking.session_end_time)}
                      </p>
                    </div>
                  </div>
                  <span className={`ml-4 font-medium text-sm ${
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
                      : booking.status === "pending_receipt_number"
                      ? "text-yellow-600"
                      : booking.status === "pending_attendance"
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}>
                    {booking.status === "confirmed"
                      ? "Confirmed"
                      : booking.status === "cancelled_by_user"
                      ? "Cancelled by User"
                      : booking.status === "cancelled_by_admin"
                      ? "Cancelled by Admin"
                      : booking.status === "pending_receipt_number"
                      ? "Pending Receipt Upload"
                      : booking.status === "pending_attendance"
                      ? "Pending Attendance"
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
              Quick Access Navigation
            </h2>
            <div className="space-y-2">
              <button 
                onClick={() => router.push('/sessions')}
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-accent transition-colors"
              >
                Manual Check-in
              </button>
              <button 
                onClick={() => router.push('/announcements')}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Send Announcement
              </button>
              <button 
                onClick={() => router.push('/analytics')}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

function ManualBookingForm() {
  const [email, setEmail] = React.useState("");
  const [receiptNumber, setReceiptNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    // Validate receipt number: must be exactly 7 digits
    if (!/^\d{7}$/.test(receiptNumber)) {
      setError("Receipt number must be exactly 7 digits.");
      setLoading(false);
      return;
    }
    try {
      // 1. Find user by email
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email_address", email)
        .single();
      if (userErr || !user) throw new Error("User not found");
      // 2. Find ticket by code and user
      const { data: ticket, error: ticketErr } = await supabase
        .from("user_tickets")
        .select("id, status")
        .eq("ticket_code", receiptNumber)
        .eq("user_id", user.id)
        .single();
      if (ticketErr || !ticket) throw new Error("Receipt not found for this user");
      if (ticket.status !== "available") throw new Error("Receipt is not available");
      // 3. Find the next available session (today, open slot)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const { data: sessionOcc, error: sessionErr } = await supabase
        .from("session_occurrences")
        .select("id, session_id, start_time_of_day, end_time_of_day, status")
        .eq("date", todayStr)
        .eq("status", "scheduled")
        .order("start_time_of_day", { ascending: true })
        .limit(1)
        .single();
      if (sessionErr || !sessionOcc) throw new Error("No available session today");
      // 4. Create booking (status: confirmed)
      const { error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          session_occurrence_id: sessionOcc.id,
          session_id: sessionOcc.session_id,
          session_start_time: sessionOcc.start_time_of_day,
          session_end_time: sessionOcc.end_time_of_day,
          session_date: todayStr,
          status: "confirmed",
          user_ticket_id: ticket.id,
        });
      if (bookingErr) throw new Error("Failed to create booking");
      // 5. Mark ticket as used
      await supabase
        .from("user_tickets")
        .update({ status: "used" })
        .eq("id", ticket.id);
      setSuccess("Booking created and confirmed successfully!");
    } catch (err: any) {
      setError(err.message || "Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="block text-sm font-medium mb-1">User Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Receipt Number</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={receiptNumber}
          onChange={e => setReceiptNumber(e.target.value.replace(/[^0-9]/g, ""))}
          maxLength={7}
          minLength={7}
          pattern="\d{7}"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded hover:bg-accent transition-colors"
        disabled={loading}
      >
        {loading ? "Booking..." : "Book Session"}
      </button>
      {success && <p className="text-green-600 mt-2">{success}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </form>
  );
}

function ConfirmAttendanceForm() {
  const [email, setEmail] = React.useState("");
  const [ticketId, setTicketId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      // 1. Find user by email
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email_address", email)
        .single();
      if (userErr || !user) throw new Error("User not found");
      // 2. Find user_ticket by ticket_code and user_id
      const { data: userTicket, error: ticketErr } = await supabase
        .from("user_tickets")
        .select("id")
        .eq("ticket_code", ticketId)
        .eq("user_id", user.id)
        .single();
      if (ticketErr || !userTicket) throw new Error("Ticket not found for this user");
      // 3. Find booking with pending_attendance and user_ticket_id
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("user_ticket_id", userTicket.id)
        .eq("status", "pending_attendance")
        .single();
      if (bookingErr || !booking) throw new Error("No pending attendance booking found for this user and ticket");
      // 4. Update booking status to confirmed
      const { error: updateErr } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);
      if (updateErr) throw new Error("Failed to confirm attendance");
      setSuccess("Attendance confirmed!");
    } catch (err: any) {
      setError(err.message || "Error confirming attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="block text-sm font-medium mb-1">User Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Receipt Number</label>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          value={ticketId}
          onChange={e => setTicketId(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded hover:bg-accent transition-colors"
        disabled={loading}
      >
        {loading ? "Confirming..." : "Confirm Attendance"}
      </button>
      {success && <p className="text-green-600 mt-2">{success}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </form>
  );
}
