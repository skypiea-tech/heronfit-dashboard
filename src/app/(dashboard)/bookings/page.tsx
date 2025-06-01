"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        
        console.log("Bookings with users:", bookingsWithUsers);
        setBookings(bookingsWithUsers);
      }
      setLoading(false);
    };
    fetchBookings();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-text">Loading bookings...</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Booking Management</h1>
      <p className="text-body text-lg mb-6">Monitor and manage gym session bookings.</p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Waitlisted</p>
          <p className="text-2xl font-bold text-blue-600">{bookings.filter((b) => b.status === "waitlisted").length}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search bookings by user name or booking ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary">
            <option value="">Today</option>
          </select>
          <select className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary">
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled_by_user">Cancelled by User</option>
            <option value="cancelled_by_admin">Cancelled by Admin</option>
            <option value="completed">Completed</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto mb-6">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b text-left text-sm font-semibold text-gray-600">
              <th className="pb-2 pr-2">BOOKING ID</th>
              <th className="pb-2 px-2">USER</th>
              <th className="pb-2 px-2">DATE & TIME</th>
              <th className="pb-2 px-2">STATUS</th>
              <th className="pb-2 px-2">TICKET ID</th>
              <th className="pb-2 pl-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b last:border-b-0 text-sm text-text">
                <td className="py-4 pr-2 font-medium">{booking.id}</td>
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
                  <p>{booking.session_date}</p>
                  <p className="text-gray-500 text-xs">{`${booking.session_start_time} - ${booking.session_end_time}`}</p>
                </td>
                <td className="py-4 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : booking.status === "waitlisted"
                        ? "bg-blue-100 text-blue-800"
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
                  {booking.status === "waitlisted" && (
                    <button className="text-green-600 hover:text-green-800" title="Confirm from Waitlist">
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-header mb-4">Quick Ticket Validation</h2>
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
