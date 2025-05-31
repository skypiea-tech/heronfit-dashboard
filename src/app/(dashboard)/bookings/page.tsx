"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

// Define a type for booking data
interface Booking {
  id: string;
  booking_id: string;
  user_id: string; // Assuming a user ID link
  user_name: string;
  user_email: string; // To display user info like in the screenshot
  user_type: string; // To display user type like in the screenshot
  date: string;
  time_slot: string;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "waitlisted";
  ticket_id: string | null; // Ticket ID can be null for waitlisted or pending
  users?: {
    // Add optional users property
    user_name: string;
    user_email: string;
    user_type: string;
  } | null;
}

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Dummy data for summary counts and bookings
  // const summaryData = {
  //   totalBookings: 6,
  //   confirmed: 3,
  //   pending: 1,
  //   waitlisted: 1,
  // };

  // const dummyBookings: Booking[] = [
  //   {
  //     id: "bk001",
  //     booking_id: "BK001",
  //     user_id: "user1",
  //     user_name: "John Silva",
  //     user_email: "john.silva@umak.edu.ph",
  //     user_type: "Student",
  //     date: "2025-05-24",
  //     time_slot: "09:00 AM - 10:00 AM",
  //     status: "confirmed",
  //     ticket_id: "TK-240001",
  //   },
  //   {
  //     id: "bk002",
  //     booking_id: "BK002",
  //     user_id: "user2",
  //     user_name: "Maria Santos",
  //     user_email: "maria.santos@umak.edu.ph",
  //     user_type: "Faculty",
  //     date: "2025-05-24",
  //     time_slot: "10:30 AM - 11:30 AM",
  //     status: "pending",
  //     ticket_id: "TK-240002",
  //   },
  //   {
  //     id: "bk003",
  //     user_id: "user3",
  //     user_name: "Carlos Lopez",
  //     user_email: "carlos.lopez@umak.edu.ph",
  //     user_type: "Staff",
  //     date: "2025-05-24",
  //     time_slot: "02:00 PM - 03:00 PM",
  //     status: "confirmed",
  //     ticket_id: "TK-240003",
  //   },
  //   {
  //     id: "bk004",
  //     user_id: "user4",
  //     user_name: "Ana Rodriguez",
  //     user_email: "ana.rodriguez@umak.edu.ph",
  //     user_type: "Student",
  //     date: "2025-05-24",
  //     time_slot: "03:30 PM - 04:30 PM",
  //     status: "waitlisted",
  //     ticket_id: null,
  //   },
  //   // Add more dummy data as needed to match screenshot/requirements
  // ];

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted

    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, users(user_name, user_email, user_type)"); // Assuming a 'bookings' table and a 'users' table linked by user_id

      if (isMounted) {
        if (error) {
          console.error("Error fetching bookings:", error);
          // Handle error state, maybe display an error message
          setBookings([]);
        } else {
          // Map the fetched data to the Booking interface
          const fetchedBookings: Booking[] =
            data?.map((item: Booking) => ({
              id: item.id,
              booking_id: item.booking_id,
              user_id: item.user_id,
              user_name: item.users?.user_name || "", // Use optional chaining and provide a default empty string
              user_email: item.users?.user_email || "", // Use optional chaining and provide a default empty string
              user_type: item.users?.user_type || "", // Use optional chaining and provide a default empty string
              date: item.date,
              time_slot: item.time_slot,
              status: item.status,
              ticket_id: item.ticket_id,
            })) || [];
          setBookings(fetchedBookings);
        }
        setLoading(false);
      }
    };

    fetchBookings();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Helper function to get initials for avatar placeholder
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <div className="p-6 text-center text-text">Loading bookings...</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Booking Management</h1>
      <p className="text-body text-lg mb-6">
        Monitor and manage gym session bookings.
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-2xl font-bold text-text">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === "confirmed").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {bookings.filter((b) => b.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Waitlisted</p>
          <p className="text-2xl font-bold text-blue-600">
            {bookings.filter((b) => b.status === "waitlisted").length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
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
            {/* Add other date options if needed */}
          </select>
          <select className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary">
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
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
              <tr
                key={booking.id}
                className="border-b last:border-b-0 text-sm text-text"
              >
                <td className="py-4 pr-2 font-medium">{booking.booking_id}</td>
                <td className="py-4 px-2 flex items-center">
                  {/* Placeholder Avatar with Initials */}
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-600 font-medium text-xs">
                    {getInitials(booking.user_name)}
                  </div>
                  <div>
                    <p className="font-medium">{booking.user_name}</p>
                    <p className="text-gray-500 text-xs">{booking.user_type}</p>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <p>{booking.date}</p>
                  <p className="text-gray-500 text-xs">{booking.time_slot}</p>
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
                        : booking.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-2">
                  {booking.ticket_id ? booking.ticket_id : "-"}
                </td>
                <td className="py-4 pl-2 flex items-center space-x-2">
                  {/* Action Icons */}
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    title="View Details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  {booking.status === "pending" && (
                    <>
                      <button
                        className="text-green-600 hover:text-green-800"
                        title="Confirm Booking"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        title="Reject Booking"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <button
                      className="text-red-600 hover:text-red-800"
                      title="Cancel Booking"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                  {booking.status === "waitlisted" && (
                    // Maybe add an option to manually confirm from waitlist?
                    <button
                      className="text-green-600 hover:text-green-800"
                      title="Confirm from Waitlist"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Ticket Validation */}
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
