"use client";

import React from "react";
import {
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface Announcement {
  id: string;
  created_at: string;
  title?: string | null;
  content: string;
  target_audience?: string | null;
  type?: string | null;
  published_at?: string | null;
  archived?: boolean | null;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({
  announcements,
  onArchive,
  onUnarchive,
}) => {
  if (!announcements || announcements.length === 0) {
    return <p>No announcements found.</p>;
  }

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Announcement History</h2>
      <p className="text-gray-600 mb-6">
        View and manage previously sent announcements
      </p>
      <div className="space-y-4">
        {announcements.map((announcement) => {
          const createdAt = new Date(announcement.created_at);
          const publishedAt = announcement.published_at
            ? new Date(announcement.published_at)
            : null;
          const isScheduled = publishedAt && publishedAt > new Date();
          const status = isScheduled ? "scheduled" : "sent";

          return (
            <div
              key={announcement.id}
              className="border border-gray-200 rounded-md p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {announcement.type === "alert" ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  ) : (
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {announcement.content}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
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
                  {onArchive && !announcement.archived && (
                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Archive Announcement"
                      onClick={() => onArchive(announcement.id)}
                    >
                      Archive
                    </button>
                  )}
                  {onUnarchive && announcement.archived && (
                    <button
                      className="text-green-600 hover:text-green-800"
                      title="Unarchive Announcement"
                      onClick={() => onUnarchive(announcement.id)}
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-3">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span className="mr-3">{createdAt.toLocaleDateString()}</span>
                <span className="mr-3">
                  {createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    status === "sent"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  } mr-2`}
                >
                  {status}
                </span>

                {announcement.target_audience && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {announcement.target_audience}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementList;

export type { Announcement };
