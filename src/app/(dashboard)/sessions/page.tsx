"use client";

import React, { useState, useEffect } from "react";
import {
  MinusCircleIcon,
  PlusCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/20/solid"; // For Live icon
import { supabase } from "@/lib/supabaseClient";

// Define types for data
interface SessionSummary {
  peakOccupancy: number;
  averageOccupancy: number;
  totalCheckIns: number;
  currentUtilization: string; // Or number if calculated dynamically
}

interface TimeSlot {
  id: string;
  time: string;
  current: number;
  capacity: number;
  status: "open" | "full";
}

const SessionManagementPage = () => {
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [maximumCapacity, setMaximumCapacity] = useState(0);
  const [summaryData, setSummaryData] = useState<SessionSummary | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;        const { data: occurrences, error: occErr } = await supabase
          .from("session_occurrences")
          .select(
            "id, start_time, end_time, booked_slots, attended_count, override_capacity, session_id, sessions(name)"
          )
          .eq("date", todayStr)
          .order("start_time", { ascending: true });
        if (occErr) throw occErr;
        
        const maxCapacityPerSlot = 15; // Hardcoded capacity per slot
        let peak = 0,
          total = 0,
          count = 0,
          checkIns = 0;
        
        const slots = (occurrences || []).map((occ) => {
          const current = (occ.booked_slots || 0) + (occ.attended_count || 0) + (occ.override_capacity || 0);
          const capacity = maxCapacityPerSlot;
          let status: "open" | "full" = current >= capacity ? "full" : "open";
          const start = occ.start_time?.slice(0, 5) || "";
          const end = occ.end_time?.slice(0, 5) || "";
          
          // Update summary calculations
          if (current > peak) peak = current;
          total += current;
          count++;
          checkIns += (occ.attended_count || 0);
          
          return {
            id: occ.id,
            time: `${start} - ${end}`,
            current,
            capacity,
            status,
          };
        });
        
        setTimeSlots(slots);
        setCurrentOccupancy(slots.reduce((sum, s) => sum + s.current, 0));
        setMaximumCapacity(maxCapacityPerSlot * slots.length);
        setSummaryData({
          peakOccupancy: peak,
          averageOccupancy: count ? Math.round(total / count) : 0,
          totalCheckIns: checkIns,
          currentUtilization:
            slots.length && total
              ? `${Math.round((total / (maxCapacityPerSlot * slots.length)) * 100)}%`
              : "0%",
        });
      } catch (err) {
        let msg = "Failed to load session data";
        if (
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string"
        ) {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const occupancyPercentage = maximumCapacity
    ? (currentOccupancy / maximumCapacity) * 100
    : 0;

  if (loading) {
    return (
      <div className="p-6 text-center text-text">Loading session data...</div>
    );
  }
  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Session Management</h1>
      <p className="text-body text-lg mb-6">
        Monitor and control real-time gym occupancy and session capacity.
      </p>

      {/* Top Section: Current Occupancy, Max Capacity, Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Gym Occupancy */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-header">Current Gym Occupancy</h2>
            <span className="text-sm font-medium text-primary flex items-center">
              <SparklesIcon className="w-4 h-4 mr-1" /> Live
            </span>
          </div>
          <div className="flex items-end mb-2">
            <p className="text-5xl font-bold text-text">{currentOccupancy}</p>
            <span className="text-2xl font-medium text-gray-500">
              /{maximumCapacity}
            </span>
          </div>
          <p className="text-gray-600 mb-4">People currently in gym</p>

          {/* Occupancy Level Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Occupancy Level</span>
              <span>{occupancyPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  occupancyPercentage > 80 ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Manual Check-in/out */}
          <div className="flex items-center justify-center space-x-6 text-gray-600 mt-6">
            <button
              className="flex items-center space-x-2 text-red-600 hover:text-red-800"
              title="Manual Check-out"
              // onClick={() => handleManualCheckInOut(-1)}
            >
              <MinusCircleIcon className="w-8 h-8" />
            </button>
            <span className="text-lg">Manual Check-in/out</span>
            <button
              className="flex items-center space-x-2 text-green-600 hover:text-green-800"
              title="Manual Check-in"
              // onClick={() => handleManualCheckInOut(1)}
            >
              <PlusCircleIcon className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Right Column: Max Capacity and Today's Summary */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Maximum Capacity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-header mb-4">Maximum Capacity</h2>
            <p className="text-4xl font-bold text-text mb-4">
              {maximumCapacity}
            </p>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-text hover:bg-gray-100 transition-colors">
              Edit Capacity
            </button>
          </div>

          {/* Today's Summary */}
          {summaryData && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-header mb-4">Today&apos;s Summary</h2>
              <div className="space-y-2 text-text">
                <div className="flex justify-between">
                  <p className="text-gray-600">Peak Occupancy</p>
                  <p className="font-medium">{summaryData.peakOccupancy}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Average Occupancy</p>
                  <p className="font-medium">{summaryData.averageOccupancy}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Total Check-ins</p>
                  <p className="font-medium">{summaryData.totalCheckIns}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Current Utilization</p>
                  <p className="font-medium">
                    {summaryData.currentUtilization}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Time Slots */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-header mb-4">Today&apos;s Time Slots</h2>
        <p className="text-body text-gray-600 mb-6">
          Monitor capacity for each time slot.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-text">{slot.time}</h3>
                <ClockIcon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex items-end mb-2">
                <p className="text-2xl font-bold text-text">{slot.current}</p>
                <span className="text-gray-500">/{slot.capacity}</span>
              </div>
              {/* Time Slot Occupancy Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full ${
                    slot.current / slot.capacity > 0.9
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${(slot.current / slot.capacity) * 100}%` }}
                ></div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  slot.status === "full"
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {slot.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionManagementPage;
