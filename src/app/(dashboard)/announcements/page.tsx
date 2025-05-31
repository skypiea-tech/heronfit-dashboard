"use client";

import React, { useState, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import AnnouncementList from "./components/AnnouncementList";
import AnnouncementForm from "./components/AnnouncementForm";
import {
  getAnnouncements,
  addAnnouncement,
  archiveAnnouncement,
} from "./models/announcementModel";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client
import type { Announcement } from "./components/AnnouncementList";

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

const AnnouncementsPage: React.FC = () => {
  // Use Announcement type for state
  const [activeAnnouncements, setActiveAnnouncements] = useState<
    Announcement[]
  >([]);
  const [archivedAnnouncements, setArchivedAnnouncements] = useState<
    Announcement[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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
    setError(null);
    try {
      const active = (await getAnnouncements({
        includeArchived: false,
      })) as Announcement[];
      const archived = (await getAnnouncements({
        includeArchived: true,
      })) as Announcement[];
      setActiveAnnouncements(active.filter((a) => !a.archived));
      setArchivedAnnouncements(archived.filter((a) => a.archived));
    } catch (err: any) {
      setError(err.message || "Failed to fetch announcements.");
      setActiveAnnouncements([]);
      setArchivedAnnouncements([]);
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
    } catch (err: unknown) {
      console.error("Error sending announcement:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to send announcement."); // Set error state
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleArchive = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await archiveAnnouncement(id, true);
      fetchAndSetAnnouncements();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to archive announcement."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await archiveAnnouncement(id, false);
      fetchAndSetAnnouncements();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to unarchive announcement."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading or error for initial fetch
  if (
    loading &&
    activeAnnouncements.length === 0 &&
    archivedAnnouncements.length === 0 &&
    !error
  ) {
    return (
      <div className="p-6 text-center text-gray-700">
        Loading announcements...
      </div> // Use gray-700 for text color
    );
  }
  // Show error if initial fetch failed
  if (
    error &&
    activeAnnouncements.length === 0 &&
    archivedAnnouncements.length === 0
  ) {
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
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={() => setShowArchived((prev) => !prev)}
            className="form-checkbox"
          />
          <span className="ml-2">Show Archived Announcements</span>
        </label>
      </div>
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
      {/* Announcement List */}
      <AnnouncementList
        announcements={activeAnnouncements}
        onArchive={handleArchive}
      />
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Archived Announcements</h2>
        <AnnouncementList
          announcements={archivedAnnouncements}
          onUnarchive={handleUnarchive}
        />
      </div>
    </div>
  );
};

export default AnnouncementsPage;
