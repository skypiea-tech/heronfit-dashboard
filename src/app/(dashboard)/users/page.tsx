"use client";

import React, { useEffect, useState } from "react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client
import { Dialog } from "@headlessui/react";
import { differenceInYears, format } from "date-fns";

// Define a type for user data (adjust according to your Supabase schema)
interface User {
  id: string;
  name: string; // Will be derived from first_name and last_name
  email: string;
  user_role: "STUDENT" | "FACULTY/STAFF" | "PUBLIC"; // Updated to match the actual roles
  status: "active" | "idle" | "inactive"; // Updated to include idle status
  bookings: number; // This will likely need to be fetched from a bookings table
  last_active: string; // This will likely be a timestamp and need formatting
  avatar?: string | null;
  first_name?: string;
  last_name?: string;
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

// Add new interface for user details
interface UserDetails extends User {
  first_name: string;
  last_name: string;
  email_address: string;
  birthday: string;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  contact?: string;
  role_status?: string;
  avatar?: string | null;
}

// Helper function to format time difference
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds <= 0) {
    return "Just now";
  }
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

// Helper function to get initials for avatar placeholder
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Add ViewUserDetails component
const ViewUserDetails = ({ user, isOpen, onClose }: { user: UserDetails | null, isOpen: boolean, onClose: () => void }) => {
  if (!user) return null;

  const calculateAge = (birthday: string) => {
    if (!birthday) return "";
    return `${differenceInYears(new Date(), new Date(birthday))} years old`;
  };

  const formatBirthday = (birthday: string) => {
    if (!birthday) return "";
    const date = new Date(birthday);
    return `${format(date, "MMMM d, yyyy")} (${calculateAge(birthday)})`;
  };

  const convertWeight = (weight: number) => {
    const kg = weight;
    const lbs = (weight * 2.20462).toFixed(1);
    return `${kg} kg (${lbs} lbs)`;
  };

  const convertHeight = (height: number) => {
    const cm = height;
    const totalInches = height / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${cm} cm (${feet}'${inches}" ft)`;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <Dialog.Title className="text-2xl font-semibold mb-6 text-gray-900 pr-8">
            User Details
          </Dialog.Title>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex justify-center mb-8">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-64 h-64 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                />
              ) : (
                <div className="w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center text-4xl font-medium text-primary border-4 border-primary/20 shadow-lg">
                  {getInitials(user.first_name, user.last_name)}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              {/* Name and Email Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">First Name</label>
                    <p className="mt-1 text-base font-medium text-gray-900">{user.first_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Name</label>
                    <p className="mt-1 text-base font-medium text-gray-900">{user.last_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-base text-gray-900">{user.email_address}</p>
                </div>
              </div>

              {/* Personal Info Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Birthday</label>
                    <p className="mt-1 text-base text-gray-900">{formatBirthday(user.birthday)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Gender</label>
                    <p className="mt-1 text-base text-gray-900 capitalize">{user.gender}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Weight</label>
                    <p className="mt-1 text-base text-gray-900">{convertWeight(user.weight)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Height</label>
                    <p className="mt-1 text-base text-gray-900">{convertHeight(user.height)}</p>
                  </div>
                </div>
              </div>

              {/* Goals and Contact Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Goals & Contact</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Goal</label>
                  <p className="mt-1 text-base text-gray-900 capitalize">{user.goal.replace(/_/g, ' ')}</p>
                </div>

                {user.contact && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500">Contact</label>
                    <p className="mt-1 text-base text-gray-900">{user.contact}</p>
                  </div>
                )}
              </div>

              {/* Role Information Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">User Role</label>
                    <p className="mt-1 text-base text-gray-900">{user.user_role}</p>
                  </div>
                  {user.role_status && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Role Status</label>
                      <p className="mt-1 text-base text-gray-900">{user.role_status}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

// ConfirmChangesModal component
const ConfirmChangesModal = ({ open, onClose, onConfirm, changes }: { open: boolean, onClose: () => void, onConfirm: () => void, changes: { field: string, oldValue: string | number | undefined | null, newValue: string | number | undefined | null }[] }) => (
  <Dialog open={open} onClose={onClose} className="fixed inset-0 z-20 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen">
      <div className="fixed inset-0 bg-black opacity-30" />
      <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 p-6">
        <Dialog.Title className="text-xl font-semibold mb-4 text-gray-900">Confirm Changes</Dialog.Title>
        <div className="mb-6">
          <p className="mb-2 text-gray-700">You are about to make the following changes:</p>
          <ul className="space-y-2">
            {changes.map((change, idx) => (
              <li key={idx} className="text-sm text-gray-800">
                <span className="font-medium text-gray-600">{change.field}:</span> <span className="text-red-600 line-through">{change.oldValue === '' ? <em>empty</em> : String(change.oldValue)}</span> <span className="mx-2">→</span> <span className="text-green-700 font-semibold">{change.newValue === '' ? <em>empty</em> : String(change.newValue)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-6 py-2 border border-primary rounded-md bg-primary text-white text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  </Dialog>
);

// EditUserDetails component
const EditUserDetails = ({ user, isOpen, onClose, onConfirm }: { user: UserDetails | null, isOpen: boolean, onClose: () => void, onConfirm: (updated: Partial<UserDetails>) => void }) => {
  const [form, setForm] = useState<Partial<UserDetails>>(user || {});
  const [showConfirm, setShowConfirm] = useState(false);
  const [changes, setChanges] = useState<{ field: string, oldValue: string | number | undefined | null, newValue: string | number | undefined | null }[]>([]);
  useEffect(() => { setForm(user || {}); }, [user]);

  if (!user) return null;

  const handleChange = (field: keyof UserDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fieldLabels: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email_address: 'Email',
    birthday: 'Birthday',
    gender: 'Gender',
    weight: 'Weight',
    height: 'Height',
    goal: 'Goal',
    contact: 'Contact',
    user_role: 'User Role',
    role_status: 'Role Status',
  };

  const handleShowConfirm = () => {
    // Compare user and form, build changes array
    const changed: { field: string, oldValue: string | number | undefined | null, newValue: string | number | undefined | null }[] = [];
    (Object.keys(fieldLabels) as (keyof UserDetails)[]).forEach((key) => {
      if (form[key] !== user[key]) {
        changed.push({
          field: fieldLabels[key],
          oldValue: user[key],
          newValue: form[key],
        });
      }
    });
    setChanges(changed);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onConfirm(form);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="absolute top-4 right-4">
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <Dialog.Title className="text-2xl font-semibold mb-6 text-gray-900 pr-8">Edit User</Dialog.Title>
            <div className="space-y-6">
              <div className="flex justify-center mb-8">
                {user.avatar ? (
                  <img src={user.avatar} alt={`${user.first_name} ${user.last_name}`} className="w-64 h-64 rounded-full object-cover border-4 border-primary/20 shadow-lg" />
                ) : (
                  <div className="w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center text-4xl font-medium text-primary border-4 border-primary/20 shadow-lg">
                    {getInitials(user.first_name, user.last_name)}
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base font-medium text-gray-900" value={form.first_name || ''} onChange={e => handleChange('first_name', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base font-medium text-gray-900" value={form.last_name || ''} onChange={e => handleChange('last_name', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.email_address || ''} onChange={e => handleChange('email_address', e.target.value)} />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Birthday</label>
                      <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.birthday || ''} onChange={e => handleChange('birthday', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Gender</label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.gender || ''} onChange={e => handleChange('gender', e.target.value)}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Weight (kg)</label>
                      <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.weight || ''} onChange={e => handleChange('weight', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Height (cm)</label>
                      <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.height || ''} onChange={e => handleChange('height', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Goals & Contact</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Goal</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.goal || ''} onChange={e => handleChange('goal', e.target.value)}>
                      <option value="lose_weight">Lose Weight</option>
                      <option value="build_muscle">Build Muscle</option>
                      <option value="general_fitness">General Fitness</option>
                      <option value="improve_endurance">Improve Endurance</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500">Contact</label>
                    <input type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.contact || ''} onChange={e => handleChange('contact', e.target.value)} />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">User Role</label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.user_role || ''} onChange={e => handleChange('user_role', e.target.value)}>
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY/STAFF">Faculty/Staff</option>
                        <option value="PUBLIC">Public</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Role Status</label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900" value={form.role_status || ''} onChange={e => handleChange('role_status', e.target.value)}>
                        <option value="UNVERIFIED">Unverified</option>
                        <option value="VERIFIED">Verified</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">Cancel</button>
                <button onClick={handleShowConfirm} className="px-6 py-2 border border-primary rounded-md bg-primary text-white text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">Confirm Edit</button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      <ConfirmChangesModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        changes={changes}
      />
    </>
  );
};

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("default");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDetails | null>(null);

  // Filter users based on search term and filters
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);
    
    // Handle status filtering
    let matchesStatus = true;
    if (statusFilter === "default") {
      matchesStatus = user.status === "active" || user.status === "idle";
    } else if (statusFilter) {
      matchesStatus = user.status === statusFilter;
    }

    // Handle role filtering with flexible matching for FACULTY/STAFF
    const matchesRole = !roleFilter || 
      (roleFilter === "FACULTY/STAFF" 
        ? ["FACULTY/STAFF", "STAFF", "FACULTY", "STAFF/FACULTY"].includes(user.user_role)
        : user.user_role === roleFilter);

    return matchesSearch && matchesStatus && matchesRole;
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // First fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email_address, has_session, user_role, avatar");

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
        const fetchedUsers: User[] = (usersData || []).map((user) => {
          const lastActivity = lastActivityMap[user.id];
          let status: "active" | "idle" | "inactive" = "inactive";
          
          if (lastActivity) {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            if (lastActivity >= oneDayAgo) {
              status = "active";
            } else if (lastActivity >= sixMonthsAgo) {
              status = "idle";
            } else {
              status = "inactive";
            }
          }

          return {
          id: user.id,
          name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User",
          email: user.email_address || "No email provided",
          user_role: user.user_role || "PUBLIC",
            status: status,
          bookings: sessionCounts[user.id] || 0,
          last_active: lastActivityMap[user.id] ? formatTimeAgo(lastActivityMap[user.id]) : "Never",
            avatar: user.avatar || null,
            first_name: user.first_name || "",
            last_name: user.last_name || ""
          };
        });

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

  const handleViewUser = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      if (userData) {
        setSelectedUser(userData as UserDetails);
        setIsViewDetailsOpen(true);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleEditUser = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (userError) throw userError;
      if (userData) {
        setEditUser(userData as UserDetails);
        setIsEditDetailsOpen(true);
      }
    } catch {
      // error handled in catch
    }
  };

  const handleConfirmEdit = async (updated: Partial<UserDetails>) => {
    if (!editUser) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: updated.first_name,
          last_name: updated.last_name,
          email_address: updated.email_address,
          birthday: updated.birthday,
          gender: updated.gender,
          weight: updated.weight,
          height: updated.height,
          goal: updated.goal,
          contact: updated.contact,
          user_role: updated.user_role,
          role_status: updated.role_status,
        })
        .eq("id", editUser.id);
      if (error) throw error;
      setIsEditDetailsOpen(false);
      setEditUser(null);
      window.location.reload();
    } catch {
      alert("Failed to update user. Please try again.");
    }
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
          <select 
            className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="inactive">Inactive</option>
            <option value="" className="border-t border-gray-200 mt-2 pt-2">All Statuses</option>
          </select>
          <select 
            className="border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-primary focus:border-primary"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY/STAFF">Faculty/Staff</option>
            <option value="PUBLIC">Public</option>
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No users found matching the current filters
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-b-0 text-sm text-text"
              >
                <td className="py-4 pr-2 flex items-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-gray-600 font-medium text-xs">
                        {getInitials(user.name, "2")}
                      </div>
                    )}
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
                          : ["FACULTY/STAFF", "STAFF", "FACULTY", "STAFF/FACULTY"].includes(user.user_role)
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                      {["FACULTY/STAFF", "STAFF", "FACULTY", "STAFF/FACULTY"].includes(user.user_role) 
                        ? "FACULTY/STAFF" 
                        : user.user_role}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <span
                      className={`inline-flex items-center justify-center w-20 px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                          : user.status === "idle"
                          ? "bg-yellow-100 text-yellow-800"
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
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleViewUser(user.id)}
                    >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button className="text-yellow-600 hover:text-yellow-800" onClick={() => handleEditUser(user.id)}>
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
              ))
            )}
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

      <ViewUserDetails 
        user={selectedUser}
        isOpen={isViewDetailsOpen}
        onClose={() => {
          setIsViewDetailsOpen(false);
          setSelectedUser(null);
        }}
      />

      <EditUserDetails
        user={editUser}
        isOpen={isEditDetailsOpen}
        onClose={() => { setIsEditDetailsOpen(false); setEditUser(null); }}
        onConfirm={handleConfirmEdit}
      />
    </div>
  );
};

export default UserManagementPage;
