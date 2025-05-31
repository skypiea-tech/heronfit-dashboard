"use client";

import React, { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface AnnouncementFormProps {
  onAnnouncementAdded: () => void;
  addAnnouncement: (announcementData: {
    title?: string | null;
    content: string;
    target_audience?: string | null;
    type?: string | null;
    published_at?: string | null;
  }) => Promise<{ data: any; error: any }>;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  onAnnouncementAdded,
  addAnnouncement,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [type, setType] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newAnnouncement = {
      title: title || null,
      content,
      target_audience: targetAudience || null,
      type: type || null,
      published_at:
        scheduleForLater && publishedAt
          ? new Date(publishedAt).toISOString()
          : null,
    };

    try {
      const result = await addAnnouncement(newAnnouncement);

      if (result.error) {
        setError(result.error.message);
      } else {
        setTitle("");
        setContent("");
        setTargetAudience("");
        setType("");
        setPublishedAt("");
        setScheduleForLater(false);
        onAnnouncementAdded();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-bold">Create New Announcement</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
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
              id="type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select Type</option>
              <option value="information">Information</option>
              <option value="alert">Alert</option>
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
          >
            Message
          </label>
          <textarea
            id="content"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label
              htmlFor="targetAudience"
              className="block text-sm font-medium text-gray-700"
            >
              Target Audience
            </label>
            <select
              id="targetAudience"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            >
              <option value="">Select Audience</option>
              <option value="all">All Users</option>
              <option value="students">Students</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="flex items-center h-full">
            <input
              id="scheduleForLater"
              name="scheduleForLater"
              type="checkbox"
              checked={scheduleForLater}
              onChange={(e) => setScheduleForLater(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="scheduleForLater"
              className="ml-2 block text-sm text-gray-900"
            >
              Schedule for later
            </label>
          </div>
        </div>

        {scheduleForLater && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="publishedAtDate"
                className="block text-sm font-medium text-gray-700"
              >
                Schedule Date
              </label>
              <input
                type="date"
                id="publishedAtDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={publishedAt.split("T")[0] || ""}
                onChange={(e) =>
                  setPublishedAt(
                    e.target.value +
                      (publishedAt.split("T")[1]
                        ? `T${publishedAt.split("T")[1]}`
                        : "")
                  )
                }
                required={scheduleForLater}
              />
            </div>
            <div>
              <label
                htmlFor="publishedAtTime"
                className="block text-sm font-medium text-gray-700"
              >
                Schedule Time
              </label>
              <input
                type="time"
                id="publishedAtTime"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={publishedAt.split("T")[1] || ""}
                onChange={(e) =>
                  setPublishedAt(
                    (publishedAt.split("T")[0] || "") + "T" + e.target.value
                  )
                }
                required={scheduleForLater}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={
              loading ||
              !content ||
              !title ||
              (scheduleForLater && !publishedAt)
            }
          >
            <PaperAirplaneIcon
              className="-ml-1 mr-2 h-5 w-5"
              aria-hidden="true"
            />
            {loading ? "Sending..." : "Send Now"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">Error: {error}</p>}
      </form>
    </div>
  );
};

export default AnnouncementForm;
