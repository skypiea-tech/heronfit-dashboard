"use client";

import React, { useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client
import { Dialog } from "@headlessui/react";
import { differenceInYears } from "date-fns";

// Define a type for user data (adjust according to your Supabase schema)
interface User {
  id: string;
  name: string; // Will be derived from first_name and last_name
  email: string;
  user_role: "STUDENT" | "FACULTY/STAFF" | "PUBLIC"; // Updated to match the actual roles
  status: "active" | "inactive"; // This might be derived from 'has_session' or another status column
  bookings: number; // This will likely need to be fetched from a bookings table
  last_active: string; // This will likely be a timestamp and need formatting
}

// Add new interfaces for the form
interface UserFormData {
  first_name: string;
  last_name: string;
  email_address: string;
  birthday: string;
  gender: "male" | "female" | "prefer_not_to_say";
  weight: string;
  weight_unit: "kg" | "lbs";
  height: string;
  height_unit: "cm" | "ft";
  goal: "lose_weight" | "build_muscle" | "general_fitness" | "improve_endurance";
  contact?: string;
  user_role: "STUDENT" | "FACULTY/STAFF" | "PUBLIC";
  role_status?: "UNVERIFIED" | "VERIFIED";
}

// Helper function to format time difference
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'} ago`;
  }
};

// Add new components
const CreateUserButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "password">("form");
  const [formData, setFormData] = useState<UserFormData>({
    first_name: "",
    last_name: "",
    email_address: "",
    birthday: "",
    gender: "prefer_not_to_say",
    weight: "",
    weight_unit: "kg",
    height: "",
    height_unit: "cm",
    goal: "general_fitness",
    user_role: "PUBLIC",
  });
  const [password, setPassword] = useState("");
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthday: string) => {
    if (!birthday) return "";
    return `${differenceInYears(new Date(), new Date(birthday))} years old`;
  };

  const generatePassword = () => {
    const firstName = formData.first_name.split(" ")[0].toLowerCase();
    const lastName = formData.last_name.split(" ")[0].toLowerCase();
    const birthYear = new Date(formData.birthday).getFullYear();
    return `${firstName}${lastName}${birthYear}`;
  };

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email_address,
        password: useGeneratedPassword ? generatePassword() : password,
      });

      if (authError) throw authError;

      // 2. Insert user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email_address: formData.email_address,
        birthday: formData.birthday,
        gender: formData.gender,
        weight: formData.weight_unit === "lbs" 
          ? (parseFloat(formData.weight) * 0.453592).toFixed(2) 
          : formData.weight,
        height: formData.height_unit === "ft" 
          ? (parseFloat(formData.height) * 30.48).toFixed(2) 
          : formData.height,
        goal: formData.goal,
        contact: formData.contact || null,
        user_role: formData.user_role,
        role_status: formData.user_role === "FACULTY/STAFF" ? "UNVERIFIED" : null,
        has_session: null,
        avatar: null,
        verification_document_url: null,
      });

      if (profileError) throw profileError;

      setIsOpen(false);
      // Refresh the user list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
        Add User
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              {step === "form" ? "Create New User" : "Set Password"}
            </Dialog.Title>

            {step === "form" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Birthday</label>
                  <input
                    type="date"
                    required
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                  {formData.birthday && (
                    <p className="mt-1 text-sm text-gray-500">{calculateAge(formData.birthday)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as UserFormData["gender"] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                      <select
                        value={formData.weight_unit}
                        onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value as "kg" | "lbs" })}
                        className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Height</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                      <select
                        value={formData.height_unit}
                        onChange={(e) => setFormData({ ...formData, height_unit: e.target.value as "cm" | "ft" })}
                        className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="cm">cm</option>
                        <option value="ft">ft</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal</label>
                  <select
                    required
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value as UserFormData["goal"] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="general_fitness">General Fitness</option>
                    <option value="improve_endurance">Improve Endurance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact (Optional)</label>
                  <input
                    type="tel"
                    value={formData.contact || ""}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User Role</label>
                  <select
                    required
                    value={formData.user_role}
                    onChange={(e) => setFormData({ ...formData, user_role: e.target.value as UserFormData["user_role"] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY/STAFF">Faculty/Staff</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>

                {formData.user_role === "FACULTY/STAFF" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role Status</label>
                    <select
                      required
                      value={formData.role_status || "UNVERIFIED"}
                      onChange={(e) => setFormData({ ...formData, role_status: e.target.value as "UNVERIFIED" | "VERIFIED" })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="UNVERIFIED">Unverified</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep("password")}
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={useGeneratedPassword}
                        onChange={(e) => setUseGeneratedPassword(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Use generated password</span>
                    </label>
                  </div>
                  {useGeneratedPassword ? (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">Generated password:</p>
                      <p className="font-mono text-sm">{generatePassword()}</p>
                    </div>
                  ) : (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  )}
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setStep("form")}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {isLoading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
};

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Dummy data based on the screenshot
  // const dummyUsers: User[] = [
  //   {
  //     id: "1",
  //     name: "John Silva",
  //     email: "john.silva@umak.edu.ph",
  //     user_role: "Student",
  //     status: "active",
  //     bookings: 15,
  //     last_active: "2 hours ago",
  //   },
  //   {
  //     id: "2",
  //     name: "Maria Santos",
  //     email: "maria.santos@umak.edu.ph",
  //     user_role: "Faculty",
  //     status: "active",
  //     bookings: 23,
  //     last_active: "1 day ago",
  //   },
  //   {
  //     id: "3",
  //     name: "Carlos Lopez",
  //     email: "carlos.lopez@umak.edu.ph",
  //     user_role: "Staff",
  //     status: "inactive",
  //     bookings: 8,
  //     last_active: "1 week ago",
  //   },
  //   {
  //     id: "4",
  //     name: "Ana Rodriguez",
  //     email: "ana.rodriguez@umak.edu.ph",
  //     user_role: "Student",
  //     status: "active",
  //     bookings: 31,
  //     last_active: "30 minutes ago",
  //   },
  //   {
  //     id: "5",
  //     name: "Miguel Torres",
  //     email: "miguel.torres@umak.edu.ph",
  //     user_role: "Student",
  //     status: "active",
  //     bookings: 12,
  //     last_active: "3 hours ago",
  //   },
  //   {
  //     id: "6",
  //     name: "Sofia Martinez",
  //     email: "sofia.martinez@umak.edu.ph",
  //     user_role: "Faculty",
  //     status: "active",
  //     bookings: 19,
  //     last_active: "2 days ago",
  //   },
  // ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // First fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email_address, has_session, user_role");

        if (usersError) {
          throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        if (!usersData) {
          throw new Error("No user data received");
        }

        // Fetch sessions with created_at
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("bookings")
          .select("user_id, created_at");

        if (sessionsError) {
          throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
        }

        // Fetch workouts with timestamp
        const { data: workoutsData, error: workoutsError } = await supabase
          .from("workouts")
          .select("user_id, timestamp");

        if (workoutsError) {
          throw new Error(`Failed to fetch workouts: ${workoutsError.message}`);
        }

        // Create a map of user_id to session count
        const sessionCounts = (sessionsData || []).reduce((acc: Record<string, number>, curr: { user_id: string }) => {
          acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
          return acc;
        }, {});

        // Create a map of user_id to last activity timestamp
        const lastActivityMap: Record<string, Date> = {};
        
        // Process sessions timestamps
        (sessionsData || []).forEach((session) => {
          if (session.created_at) {
            const timestamp = new Date(session.created_at);
            if (!lastActivityMap[session.user_id] || timestamp > lastActivityMap[session.user_id]) {
              lastActivityMap[session.user_id] = timestamp;
            }
          }
        });

        // Process workouts timestamps
        (workoutsData || []).forEach((workout) => {
          if (workout.timestamp) {
            const timestamp = new Date(workout.timestamp);
            if (!lastActivityMap[workout.user_id] || timestamp > lastActivityMap[workout.user_id]) {
              lastActivityMap[workout.user_id] = timestamp;
            }
          }
        });

        // Map the fetched data to your User interface
        const fetchedUsers: User[] = usersData.map((user) => ({
          id: user.id,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
          email: user.email_address || "No email provided",
          user_role: user.user_role || "PUBLIC",
          status: user.has_session ? "active" : "inactive",
          bookings: sessionCounts[user.id] || 0,
          last_active: lastActivityMap[user.id] ? formatTimeAgo(lastActivityMap[user.id]) : "Never",
        }));

        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error in fetchUsers:", error);
        setError(error instanceof Error ? error.message : "An unexpected error occurred while fetching users");
      } finally {
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-header mb-2">User Management</h1>
          <p className="text-body text-lg">
            Manage registered users and their account status.
          </p>
        </div>
        <CreateUserButton />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredUsers.map((user) => (
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
                      user.user_role === "STUDENT"
                        ? "bg-blue-100 text-blue-800"
                        : user.user_role === "FACULTY/STAFF"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.user_role}
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
