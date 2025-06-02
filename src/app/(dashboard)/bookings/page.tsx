"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
  FunnelIcon, // Added FunnelIcon
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Papa, { ParseResult } from "papaparse";

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

function getDayOfWeek(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// Helper to format time range in 12-hour format
function formatTimeRange12h(start: string, end: string) {
  const to12h = (t: string) => {
    const [h, m, s] = t.split(":");
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };
  return `${to12h(start)} - ${to12h(end)}`;
}

// Helper to format time in 12-hour format
function formatTime12h(timeStr: string) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

// Hardcoded session time slots (e.g., 6:00 AM to 4:00 PM, 1-hour increments)
const HARDCODED_SLOTS = [
  { start: "08:00:00", end: "09:00:00" },
  { start: "09:00:00", end: "10:00:00" },
  { start: "10:00:00", end: "11:00:00" },
  { start: "11:00:00", end: "12:00:00" },
  { start: "12:00:00", end: "13:00:00" },
  { start: "13:00:00", end: "14:00:00" },
  { start: "14:00:00", end: "15:00:00" },
  { start: "15:00:00", end: "16:00:00" },
];

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionDate, setSessionDate] = useState<Date | null>(null);
  const [allSlots, setAllSlots] = useState<any[]>([]); // All possible slots for selected date
  const [sessionsCsv, setSessionsCsv] = useState<any[]>([]); // Parsed CSV rows
  const [selectedStatus, setSelectedStatus] = useState<string>(""); // Added for status filtering

  // Load and parse sessions_rows.csv on mount
  useEffect(() => {
    fetch("/sessions_rows.csv")
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results: ParseResult<any>) => {
            setSessionsCsv(results.data);
          },
        });
      });
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      // Fetch all bookings
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
        setSessions([]);
      } else {
        const fetchedBookings: any[] = data || [];
        // Get unique user_ids
        const userIds = Array.from(new Set(fetchedBookings.map((b) => b.user_id)));
        // Fetch user details
        let usersMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: usersData, error: usersErr } = await supabase
            .from("users")
            .select("id, first_name, last_name, email_address, avatar")
            .in("id", userIds);
          if (usersErr) {
            console.error("Error fetching users:", usersErr);
          } else if (usersData) {
            usersMap = Object.fromEntries(usersData.map((u) => [u.id, u]));
          }
        }
        // Merge user info into bookings
        const bookingsWithUsers = fetchedBookings.map((b) => ({
          ...b,
          user: usersMap[b.user_id] || null,
        }));
        setBookings(bookingsWithUsers);
        // Group sessions by session_date, session_start_time, session_end_time
        const sessionMap = new Map();
        bookingsWithUsers.forEach((b) => {
          const key = `${b.session_date}|${b.session_start_time}|${b.session_end_time}`;
          if (!sessionMap.has(key)) {
            sessionMap.set(key, {
              session_date: b.session_date,
              session_start_time: b.session_start_time,
              session_end_time: b.session_end_time,
              session_id: b.session_id,
            });
          }
        });
        setSessions(Array.from(sessionMap.values()));
        // Auto-select first session
        if (sessionMap.size > 0 && !selectedSession) {
          setSelectedSession(Array.from(sessionMap.values())[0]);
        }
      }
      setLoading(false);
    };
    fetchBookings();
    // eslint-disable-next-line
  }, []);

  // Load all possible slots for the selected date
  useEffect(() => {
    if (!sessionDate || sessionsCsv.length === 0) {
      setAllSlots([]);
      return;
    }
    const dayOfWeek = getDayOfWeek(sessionDate);
    let slots = sessionsCsv.filter((row: any) => row.day_of_week === dayOfWeek && row.is_active === "true");
    // Remove any filter on end time to show all slots for the day
    slots.sort((a: any, b: any) => a.start_time_of_day.localeCompare(b.start_time_of_day));
    setAllSlots(
      slots.map((row: any) => ({
        session_date: sessionDate.toISOString().slice(0, 10),
        session_start_time: row.start_time_of_day,
        session_end_time: row.end_time_of_day,
        session_id: row.id,
        capacity: row.capacity,
        category: row.category,
      }))
    );
  }, [sessionDate, sessionsCsv]);

  // Helper to normalize time string to HH:MM:SS
  function normalizeTime(t: string) {
    if (!t) return '';
    const parts = t.split(":");
    if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    if (parts.length === 1) return `${parts[0].padStart(2, '0')}:00:00`;
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;
  }

  // Helper to get YYYY-MM-DD in local time
  function getLocalDateString(date: string | Date | null) {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Always use hardcoded slots for session buttons, using local date string
  const selectedDate = sessionDate || new Date();
  const sessionDateStr = getLocalDateString(selectedDate);
  const sessionButtons = HARDCODED_SLOTS.map((slot) => ({
    session_date: sessionDateStr,
    session_start_time: slot.start,
    session_end_time: slot.end,
  }));

  // Auto-select first session when sessionDate changes
  useEffect(() => {
    if (sessionButtons.length > 0) {
      setSelectedSession(sessionButtons[0]);
    }
    // eslint-disable-next-line
  }, [sessionDate]);

  // Bookings for selected session
  const filteredBookings = bookings
    .filter((booking) => {
      if (!selectedSession) return true;
      // Normalize times for robust comparison
      const bookingStart = normalizeTime(booking.session_start_time);
      const bookingEnd = normalizeTime(booking.session_end_time);
      const selectedStart = normalizeTime(selectedSession.session_start_time);
      const selectedEnd = normalizeTime(selectedSession.session_end_time);
      // Compare only the local date part for session_date
      const bookingDate = getLocalDateString(booking.session_date);
      const selectedDateStr = getLocalDateString(selectedSession.session_date);
      return (
        bookingDate === selectedDateStr &&
        bookingStart === selectedStart &&
        bookingEnd === selectedEnd
      );
    })
    .filter((booking) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        booking.id.toLowerCase().includes(term) ||
        (booking.user?.first_name && booking.user.first_name.toLowerCase().includes(term)) ||
        (booking.user?.last_name && booking.user.last_name.toLowerCase().includes(term)) ||
        (booking.user?.email_address && booking.user.email_address.toLowerCase().includes(term))
      );
    })
    .filter((booking) => {
      if (!selectedStatus) return true; // If no status is selected, show all
      return booking.status === selectedStatus;
    });

  if (loading) {
    return <div className="p-6 text-center text-text">Loading bookings...</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Comprehensive Booking Overview</h1>
      <p className="text-body text-lg mb-6">Monitor and manage gym session bookings.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-2xl font-bold text-text">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{bookings.filter((b) => b.status === "confirmed").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{bookings.filter((b) => b.status === "pending").length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{bookings.filter((b) => b.status === "cancelled_by_user" || b.status === "cancelled_by_admin").length}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search bookings by user name or booking ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      {/* Session List */}
      <div className="mb-8">
        <h2 className="text-xl font-header mb-2">Sessions</h2>
        <div className="flex flex-row items-center gap-1 mb-4 w-full">
          <div className="relative w-full max-w-xs">
            <DatePicker
              selected={sessionDate ?? new Date()}
              onChange={date => {
                setSessionDate(date);
                setSelectedSession(null);
              }}
              className="w-full border border-primary/40 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm bg-white text-gray-900 font-medium transition-all duration-150"
              calendarClassName="rounded-lg shadow-lg border border-primary/30 bg-white"
              dayClassName={date =>
                sessionDate && date.toDateString() === sessionDate.toDateString()
                  ? 'bg-primary text-white rounded-full'
                  : 'hover:bg-primary/10 rounded-full'
              }
              dateFormat="MMMM d, yyyy"
              isClearable={false}
              popperPlacement="bottom"
              showPopperArrow={false}
              todayButton="Today"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="relative flex-shrink-0" style={{ minWidth: '150px' }}>
            <select
              className="border border-primary/40 rounded-lg py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm bg-white text-gray-900 font-medium transition-all duration-150 min-w-[150px] text-left hover:bg-primary/10 relative appearance-none h-[44px]"
              value={selectedStatus} // Controlled component
              onChange={(e) => setSelectedStatus(e.target.value)} // Set selected status
            >
              <option value="">All Status</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="pending">🕒 Pending</option>
              <option value="cancelled_by_user">❌ Cancelled by User</option>
              <option value="cancelled_by_admin">🚫 Cancelled by Admin</option>
              <option value="completed">🏁 Completed</option>
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
              <FunnelIcon className="w-5 h-5" /> {/* Replaced calendar SVG with FunnelIcon */}
            </span>
          </div>
        </div>
        <div className="flex flex-row flex-nowrap overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-gray-100 w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          {sessionButtons.map((session, idx) => (
            <button
              key={idx}
              className={`px-5 py-2 rounded-lg border text-base font-semibold transition-colors shadow min-w-[150px] whitespace-nowrap ${selectedSession && session.session_date === selectedSession.session_date && session.session_start_time === selectedSession.session_start_time && session.session_end_time === selectedSession.session_end_time ? 'bg-primary text-white border-primary' : 'bg-white text-gray-800 border-gray-300 hover:bg-primary hover:text-white'}`}
              onClick={() => setSelectedSession(session)}
            >
              {formatTimeRange12h(session.session_start_time, session.session_end_time)}
            </button>
          ))}
        </div>
      </div>
      {/* Bookings Table */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto mb-6">
        <h2 className="text-xl font-header mb-4">Booking Administration</h2>
        {selectedSession && filteredBookings.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-lg">No bookings found.</div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b text-left text-sm font-semibold text-gray-600">
                <th className="pb-2 pr-2 w-60">BOOKING ID</th>
                <th className="pb-2 px-2 w-44">BOOKED AT</th>
                <th className="pb-2 px-2 w-56">USER</th>
                <th className="pb-2 px-2 w-44">DATE & TIME</th>
                <th className="pb-2 px-2 w-32">STATUS</th>
                <th className="pb-2 px-2 w-32">TICKET ID</th>
                <th className="pb-2 pl-2 w-32">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-b-0 text-sm text-text">
                    <td className="py-4 pr-2 font-medium">{booking.id}</td>
                    <td className="py-4 px-2">
                      <p>{booking.created_at ? formatSessionDate(booking.created_at) + ' • ' + formatTime12h(new Date(booking.created_at).toTimeString().slice(0,5)) : '-'}</p>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-600 font-medium text-base overflow-hidden">
                          {booking.user?.avatar ? (
                            <img src={booking.user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span>
                              {booking.user?.first_name || booking.user?.last_name
                                ? `${booking.user?.first_name?.[0] || ''}${booking.user?.last_name?.[0] || ''}`.toUpperCase()
                                : <span className="text-xs">No Avatar</span>}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-gray-900">
                            {booking.user?.first_name && booking.user?.last_name
                              ? `${booking.user.first_name} ${booking.user.last_name}`
                              : booking.user?.first_name
                              ? booking.user.first_name
                              : booking.user?.last_name
                              ? booking.user.last_name
                              : 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {booking.user?.email_address || ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <p>{formatSessionDate(booking.session_date)}</p>
                      <p className="text-gray-500 text-xs">{formatTimeRange12h(booking.session_start_time, booking.session_end_time)}</p>
                    </td>
                    <td className="py-4 px-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "cancelled_by_user"
                            ? "bg-red-100 text-red-800"
                            : booking.status === "cancelled_by_admin"
                            ? "bg-red-200 text-red-900"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {booking.status === "cancelled_by_user"
                          ? "Cancelled by User"
                          : booking.status === "cancelled_by_admin"
                          ? "Cancelled by Admin"
                          : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-2">{booking.ticket_id ? booking.ticket_id : "-"}</td>
                    <td className="py-4 pl-2 flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800" title="View Details">
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {booking.status === "pending" && (
                        <>
                          <button className="text-green-600 hover:text-green-800" title="Confirm Booking">
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button className="text-red-600 hover:text-red-800" title="Reject Booking">
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button className="text-red-600 hover:text-red-800" title="Cancel Booking">
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-header mb-4">Ticket ID Verification System</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Enter ticket ID to validate..."
            className="flex-1 pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button className="px-6 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors">
            Validate Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingManagementPage;
