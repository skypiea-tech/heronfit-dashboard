"use client";

import React, { useState, useEffect } from "react";
import {
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon, // for Alert type
  InformationCircleIcon, // for Information type
  CalendarIcon, // for scheduled status/date
  ArrowLeftStartOnRectangleIcon, // Import logout icon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import AnnouncementList from "./components/AnnouncementList";
import AnnouncementForm from "./components/AnnouncementForm";
import { getAnnouncements, addAnnouncement } from "./models/announcementModel";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client

// Define types for data matching Supabase schema
interface SupabaseAnnouncement {
  id: string;
  created_at: string;
  title?: string | null;
  content: string;
  target_audience?: string | null;
  type?: string | null;
  published_at?: string | null;
}

// Define type for data used in the component's state/rendering
interface DisplayAnnouncement {
  id: string;
  title: string;
  type: "information" | "alert";
  message: string;
  targetAudience: string[];
  date: string;
  time: string;
  status: "sent" | "scheduled";
}

const AnnouncementsPage: React.FC = () => {
  // Use DisplayAnnouncement type for state
  const [announcements, setAnnouncements] = useState<DisplayAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the new announcement form - stays the same as it reflects form inputs
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    type: "information",
    message: "", // Using message for the main content input
    targetAudience: ["all"], // Default to All Users
    scheduleForLater: false,
    scheduledDate: "",
    scheduledTime: "",
    publishedAt: undefined as string | undefined,
  });

  const router = useRouter(); // Initialize useRouter

  // Function to fetch and transform announcements
  const fetchAndSetAnnouncements = async () => {
    setLoading(true);
    setError(null); // Reset error
    try {
      // Cast fetched data to SupabaseAnnouncement[]
      const data = (await getAnnouncements()) as SupabaseAnnouncement[]; // Fetch from Supabase
      if (data) {
        // Transform Supabase data to DisplayAnnouncement format
        const transformedData: DisplayAnnouncement[] = data.map((item) => {
          const createdAt = new Date(item.created_at);
          const publishedAt = item.published_at
            ? new Date(item.published_at)
            : null;
          const isScheduled = publishedAt && publishedAt > new Date();

          return {
            id: item.id,
            title: item.title || "No Title", // Use title from Supabase, default if null
            type: (item.type as "information" | "alert") || "information", // Cast/default type
            message: item.content, // Use content from Supabase for message
            // Split target_audience string into an array for rendering if it exists
            targetAudience: item.target_audience
              ? item.target_audience.split(",").map((item) => item.trim())
              : ["all"],
            date: createdAt.toLocaleDateString(),
            time: createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: isScheduled ? "scheduled" : "sent",
          };
        });
        setAnnouncements(transformedData);
      } else {
        setAnnouncements([]);
      }
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
      setError(err.message || "Failed to fetch announcements."); // Set error state
      setAnnouncements([]); // Clear announcements on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSetAnnouncements(); // Fetch data on component mount
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Correctly handle checkbox input
    if (type === "checkbox") {
      setNewAnnouncement((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setNewAnnouncement((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Special handling for scheduled date/time to combine into published_at in the form state
    if (name === "scheduledDate" || name === "scheduledTime") {
      setNewAnnouncement((prev) => {
        const datePart = name === "scheduledDate" ? value : prev.scheduledDate;
        const timePart = name === "scheduledTime" ? value : prev.scheduledTime;
        let publishedAtString = undefined;
        if (datePart && timePart) {
          publishedAtString = `${datePart}T${timePart}:00`;
        }
        return {
          ...prev,
          scheduledDate: datePart,
          scheduledTime: timePart,
          publishedAt: publishedAtString,
        };
      });
    }
  };

  const handleAudienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    // Simple handling for now, assuming single select based on screenshot, but PRD mentions groups
    setNewAnnouncement({
      ...newAnnouncement,
      // Store selected audience as a comma-separated string for the database, matching the Supabase schema assumption
      targetAudience: options.length > 0 ? [options[0]] : [], // Keep as array for form state display
    });
  };

  const handleSendAnnouncement = async () => {
    // Make async
    setLoading(true); // Indicate loading
    setError(null); // Reset error
    // Prepare data for Supabase insert
    const announcementDataForSupabase = {
      title: newAnnouncement.title || null, // Send null if empty
      content: newAnnouncement.message, // Use message for content
      target_audience: newAnnouncement.targetAudience[0] || null, // Assuming single audience string for DB
      type: newAnnouncement.type || null, // Send null if empty
      // Use the combined publishedAt string from the form state
      published_at: newAnnouncement.publishedAt
        ? new Date(newAnnouncement.publishedAt).toISOString()
        : null,
    };

    console.log("Attempting to add announcement:", announcementDataForSupabase);

    try {
      await addAnnouncement(announcementDataForSupabase); // Add to Supabase
      console.log("Announcement added successfully!");
      // After sending/scheduling, clear the form
      setNewAnnouncement({
        title: "",
        type: "information", // Reset to default type
        message: "",
        targetAudience: ["all"], // Reset to default audience
        scheduleForLater: false,
        scheduledDate: "",
        scheduledTime: "",
        publishedAt: undefined,
      });
      // And refetch/update the announcement history
      fetchAndSetAnnouncements();
    } catch (err: any) {
      console.error("Error sending announcement:", err);
      setError(err.message || "Failed to send announcement."); // Set error state
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      // Optionally display an error message to the user
    } else {
      console.log("Logged out successfully.");
      router.push("/login"); // Redirect to login page after logout
    }
  };

  // Show loading or error for initial fetch
  if (loading && announcements.length === 0 && !error) {
    return (
      <div className="p-6 text-center text-gray-700">
        Loading announcements...
      </div> // Use gray-700 for text color
    );
  }
  // Show error if initial fetch failed
  if (error && announcements.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading announcements: {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 text-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">Announcement Management</h1>{" "}
      {/* Use font-bold */}
      <p className="text-lg mb-6">
        Create and manage announcements for gym users.
      </p>
      {/* Create New Announcement */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Create New Announcement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={newAnnouncement.title}
              onChange={handleInputChange}
              placeholder="Enter announcement title..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use blue-500 for focus ring/border
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <select
              name="type"
              id="type"
              value={newAnnouncement.type}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use blue-500 for focus ring/border
            >
              <option value="information">Information</option>
              <option value="alert">Alert</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Message
          </label>
          <textarea
            name="message"
            id="message"
            rows={4}
            value={newAnnouncement.message}
            onChange={handleInputChange}
            placeholder="Enter your announcement message..."
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use blue-500 for focus ring/border
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-center">
          {" "}
          {/* Added mb-4 and items-center */}
          <div>
            <label
              htmlFor="targetAudience"
              className="block text-sm font-medium text-gray-700"
            >
              Target Audience
            </label>
            <select
              name="targetAudience"
              id="targetAudience"
              value={newAnnouncement.targetAudience[0]} // Assuming single select for now based on UI
              onChange={handleAudienceChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use blue-500 for focus ring/border
            >
              <option value="all">All Users</option>
              {/* Add other audience options based on PRD/Supabase data */}
              <option value="students">Students</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="flex items-center h-full">
            {" "}
            {/* Added h-full to stretch checkbox container */}
            <input
              id="scheduleForLater"
              name="scheduleForLater"
              type="checkbox"
              checked={newAnnouncement.scheduleForLater}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" // Use blue-600 for checkbox and blue-500 for focus
            />
            <label
              htmlFor="scheduleForLater"
              className="ml-2 block text-sm text-gray-900"
            >
              Schedule for later
            </label>
          </div>
        </div>
        {/* Schedule Date and Time (conditionally rendered) */}
        {newAnnouncement.scheduleForLater && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="scheduledDate"
                className="block text-sm font-medium text-gray-700"
              >
                Scheduled Date
              </label>
              <input
                type="date"
                name="scheduledDate"
                id="scheduledDate"
                value={newAnnouncement.scheduledDate}
                onChange={handleInputChange}
                required={newAnnouncement.scheduleForLater}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use blue-500 for focus ring/border
              />
            </div>
            <div>
              <label
                htmlFor="scheduledTime"
                className="block text-sm font-medium text-gray-700"
              >
                Scheduled Time
              </label>
              <input
                type="time"
                name="scheduledTime"
                id="scheduledTime"
                value={newAnnouncement.scheduledTime}
                onChange={handleInputChange}
                required={newAnnouncement.scheduleForLater}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500" // Use blue-500 for focus ring/border
              />
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSendAnnouncement}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" // Use indigo for button color matching screenshot
            disabled={
              loading ||
              !newAnnouncement.title ||
              !newAnnouncement.message ||
              (newAnnouncement.scheduleForLater &&
                (!newAnnouncement.scheduledDate ||
                  !newAnnouncement.scheduledTime))
            }
          >
            <PaperAirplaneIcon
              className="-ml-1 mr-2 h-5 w-5"
              aria-hidden="true"
            />
            Send Now
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm">
            Error sending announcement: {error}
          </p>
        )}{" "}
        {/* Display send error */}
      </div>
      {/* Announcement History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Announcement History</h2>
        <p className="text-gray-600 mb-6">
          View and manage previously sent announcements
        </p>
        {loading && announcements.length === 0 && !error && (
          <p>Loading announcements...</p>
        )}{" "}
        {/* Show loading specifically for list fetch */}
        {!loading && error && announcements.length === 0 && (
          <p className="text-red-500">Error loading announcements: {error}</p>
        )}{" "}
        {/* Show error specifically for list fetch */}
        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {announcement.type === "alert" ? (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" /> // Adjusted icon size
                    ) : (
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2" /> // Adjusted icon size
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {announcement.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    {" "}
                    {/* Added flex-shrink-0 */}
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      title="Edit Announcement"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      title="Delete Announcement"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-3">
                  {(announcement.date || announcement.time) && (
                    <CalendarIcon className="w-4 h-4 mr-1" />
                  )}
                  {(announcement.date || announcement.time) && (
                    <span className="mr-3">
                      {announcement.date} {announcement.time}
                    </span>
                  )}

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      announcement.status === "sent"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    } mr-2`}
                  >
                    {announcement.status}
                  </span>
                  <div className="ml-3 flex space-x-1">
                    {announcement.targetAudience.map(
                      (
                        audience,
                        index // Added index for key
                      ) => (
                        <span
                          key={audience + index} // Use index in key as audience might not be unique in this simplified structure
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            audience === "all"
                              ? "bg-gray-200 text-gray-800" // Use gray-200/800 for 'all'
                              : "bg-indigo-100 text-indigo-800" // Use indigo-100/800 for others
                          }`}
                        >
                          {audience}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && announcements.length === 0 && (
          <p>No announcements found.</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
