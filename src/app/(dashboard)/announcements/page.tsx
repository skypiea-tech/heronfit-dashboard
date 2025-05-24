"use client";

import React, { useState, useEffect } from "react";
import {
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon, // for Alert type
  InformationCircleIcon, // for Information type
  CalendarIcon, // for scheduled status/date
  ClockIcon, // for scheduled time
} from "@heroicons/react/24/outline";

// Define types for data
interface Announcement {
  id: string;
  title: string;
  type: "information" | "alert";
  message: string;
  targetAudience: string[]; // e.g., ['all', 'students']
  date: string;
  time: string;
  status: "sent" | "scheduled";
}

const AnnouncementManagementPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the new announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    type: "information",
    message: "",
    targetAudience: ["all"], // Default to All Users
    scheduleForLater: false,
    scheduledDate: "",
    scheduledTime: "",
  });

  // Dummy data for announcement history
  const dummyAnnouncements: Announcement[] = [
    {
      id: "ann001",
      title: "Gym Maintenance Notice",
      type: "alert",
      message:
        "The gym will be closed for maintenance on May 26th from 6 AM to 10 AM.",
      targetAudience: ["all"],
      date: "2025-05-23",
      time: "2:30 PM",
      status: "sent",
    },
    {
      id: "ann002",
      title: "Faculty Exclusive Hours",
      type: "information",
      message:
        "Reminder: Faculty exclusive hours are from 12 PM to 1 PM daily.",
      targetAudience: ["all", "faculty"],
      date: "2025-05-22",
      time: "10:15 AM",
      status: "sent",
    },
    {
      id: "ann003",
      title: "Summer Schedule Changes",
      type: "information",
      message: "Starting June 1st, gym hours will be extended until 9 PM.",
      targetAudience: ["all"],
      date: "2025-05-24",
      time: "8:00 AM",
      status: "scheduled",
    },
    // Add more dummy data as needed
  ];

  useEffect(() => {
    // For now, use dummy data
    setAnnouncements(dummyAnnouncements);
    setLoading(false);
    // TODO: Implement Supabase data fetching here later
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setNewAnnouncement({
        ...newAnnouncement,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setNewAnnouncement({
        ...newAnnouncement,
        [name]: value,
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
      targetAudience: options.length > 0 ? [options[0]] : [], // Keep only the first selected for simplicity based on current UI
    });
  };

  const handleSendAnnouncement = () => {
    // TODO: Implement logic to send or schedule announcement via Supabase
    console.log("Sending Announcement:", newAnnouncement);
    // After sending/scheduling, you might want to clear the form
    // setNewAnnouncement({ ... });
    // And refetch/update the announcement history
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-text">Loading announcements...</div>
    );
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Announcement Management</h1>
      <p className="text-body text-lg mb-6">
        Create and manage announcements for gym users.
      </p>

      {/* Create New Announcement */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-header mb-4">Create New Announcement</h2>
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary focus:border-primary"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary focus:border-primary"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary focus:border-primary"
          ></textarea>
        </div>
        <div className="flex justify-between items-center mb-4">
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="all">All Users</option>
              {/* Add other audience options based on PRD/Supabase data */}
              <option value="students">Students</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              id="scheduleForLater"
              name="scheduleForLater"
              type="checkbox"
              checked={newAnnouncement.scheduleForLater}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary focus:border-primary"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSendAnnouncement}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PaperAirplaneIcon
              className="-ml-1 mr-2 h-5 w-5"
              aria-hidden="true"
            />
            Send Now
          </button>
        </div>
      </div>

      {/* Announcement History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-header mb-4">Announcement History</h2>
        <p className="text-body text-gray-600 mb-6">
          View and manage previously sent announcements
        </p>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {announcement.type === "alert" ? (
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
                  ) : (
                    <InformationCircleIcon className="w-6 h-6 text-blue-500 mr-3" />
                  )}
                  <div>
                    <h3 className="font-medium text-text">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {announcement.message}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    title="Edit Announcement"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    title="Delete Announcement"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-3">
                {announcement.status === "scheduled" && (
                  <CalendarIcon className="w-4 h-4 mr-1" />
                )}
                {announcement.status === "scheduled" && (
                  <span className="mr-3">
                    {announcement.date} {announcement.time}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    announcement.status === "sent"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {announcement.status}
                </span>
                <div className="ml-3 flex space-x-1">
                  {announcement.targetAudience.map((audience) => (
                    <span
                      key={audience}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        audience === "all"
                          ? "bg-gray-200 text-gray-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagementPage;
