"use client";

import React, { useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client

// Define a type for user data (adjust according to your Supabase schema)
interface User {
  id: string;
  name: string; // Will be derived from first_name and last_name
  email: string;
  user_type: string; // This might need to be fetched or inferred from another table/column
  status: "active" | "inactive"; // This might be derived from 'has_session' or another status column
  bookings: number; // This will likely need to be fetched from a bookings table
  last_active: string; // This will likely be a timestamp and need formatting
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dummy data based on the screenshot
  // const dummyUsers: User[] = [
  //   {
  //     id: "1",
  //     name: "John Silva",
  //     email: "john.silva@umak.edu.ph",
  //     user_type: "Student",
  //     status: "active",
  //     bookings: 15,
  //     last_active: "2 hours ago",
  //   },
  //   {
  //     id: "2",
  //     name: "Maria Santos",
  //     email: "maria.santos@umak.edu.ph",
  //     user_type: "Faculty",
  //     status: "active",
  //     bookings: 23,
  //     last_active: "1 day ago",
  //   },
  //   {
  //     id: "3",
  //     name: "Carlos Lopez",
  //     email: "carlos.lopez@umak.edu.ph",
  //     user_type: "Staff",
  //     status: "inactive",
  //     bookings: 8,
  //     last_active: "1 week ago",
  //   },
  //   {
  //     id: "4",
  //     name: "Ana Rodriguez",
  //     email: "ana.rodriguez@umak.edu.ph",
  //     user_type: "Student",
  //     status: "active",
  //     bookings: 31,
  //     last_active: "30 minutes ago",
  //   },
  //   {
  //     id: "5",
  //     name: "Miguel Torres",
  //     email: "miguel.torres@umak.edu.ph",
  //     user_type: "Student",
  //     status: "active",
  //     bookings: 12,
  //     last_active: "3 hours ago",
  //   },
  //   {
  //     id: "6",
  //     name: "Sofia Martinez",
  //     email: "sofia.martinez@umak.edu.ph",
  //     user_type: "Faculty",
  //     status: "active",
  //     bookings: 19,
  //     last_active: "2 days ago",
  //   },
  // ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // First fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email_address, has_session");

        if (usersError) throw usersError;

        // Then fetch session counts for all users
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select("user_id");

        if (sessionsError) throw sessionsError;

        // Create a map of user_id to session count
        const sessionCounts = sessionsData.reduce((acc: Record<string, number>, curr: { user_id: string }) => {
          acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
          return acc;
        }, {});

        // Map the fetched data to your User interface
        const fetchedUsers: User[] = usersData.map((user) => ({
          id: user.id,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
          email: user.email_address || "",
          user_type: "Unknown",
          status: user.has_session ? "active" : "inactive",
          bookings: sessionCounts[user.id] || 0,
          last_active: "N/A",
        }));

        setUsers(fetchedUsers);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Helper function to get initials for avatar placeholder
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <div className="p-6 text-center text-text">Loading users...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">User Management</h1>
      <p className="text-body text-lg mb-6">
        Manage registered users and their account status.
      </p>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary">
            <option value="">All Types</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-b text-left text-sm font-semibold text-gray-600">
              <th className="pb-2 pr-2">USER</th>
              <th className="pb-2 px-2">TYPE</th>
              <th className="pb-2 px-2">STATUS</th>
              <th className="pb-2 px-2">BOOKINGS</th>
              <th className="pb-2 px-2">LAST ACTIVE</th>
              <th className="pb-2 pl-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-b-0 text-sm text-text"
              >
                <td className="py-4 pr-2 flex items-center">
                  {/* Placeholder Avatar with Initials */}
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-600 font-medium text-xs">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.user_type === "Student"
                        ? "bg-blue-100 text-blue-800"
                        : user.user_type === "Faculty"
                        ? "bg-purple-100 text-purple-800"
                        : user.user_type === "Staff"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {user.user_type}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : user.status === "inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-2">{user.bookings}</td>
                <td className="py-4 px-2 text-gray-500">{user.last_active}</td>
                <td className="py-4 pl-2 flex items-center space-x-2">
                  {/* Action Icons */}
                  <button className="text-blue-600 hover:text-blue-800">
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-800">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  {user.status === "active" ? (
                    <button
                      className="text-red-600 hover:text-red-800"
                      title="Deactivate"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      className="text-green-600 hover:text-green-800"
                      title="Activate"
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

      {/* Pagination */}
      <div className="flex justify-end items-center mt-6 space-x-2">
        <p className="text-sm text-gray-600 mr-4">
          Showing 1 to {users.length} of {users.length} results
        </p>
        <button className="px-4 py-2 border border-gray-300 rounded-md text-text hover:bg-gray-200 transition-colors">
          Previous
        </button>
        <button className="px-4 py-2 border border-primary rounded-md bg-primary text-white hover:bg-accent transition-colors">
          1
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md text-text hover:bg-gray-200 transition-colors">
          Next
        </button>
      </div>
    </div>
  );
};

export default UserManagementPage;
