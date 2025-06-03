"use client";

import React, { useState, useEffect } from "react";
import {
  MinusCircleIcon,
  PlusCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/20/solid"; // For Live icon
import {
  TimeSlot,
  fetchTodayTimeSlots,
  DEFAULT_MAXIMUM_CAPACITY,
  fetchTodaySummary,
  getCurrentGymOccupancy,
  debugLogAnalyticsForTodaySlots,
} from "./models/SessionModel";
import { logHourlySessionAnalytics } from "./models/AnalyticsLogger";

// Secret debug mode toggle - change this to true to make the button visible
const DEBUG_MODE = false;

const SessionManagementPage = () => {
  const [maximumCapacity, setMaximumCapacity] = useState(DEFAULT_MAXIMUM_CAPACITY);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<string>("");
  const [summaryData, setSummaryData] = useState({
    peakOccupancy: 0,
    averageOccupancy: 0,
    totalCheckIns: 0,
    currentUtilization: '0%',
  });
  const [currentSlotInfo, setCurrentSlotInfo] = useState<{ occupancy: number; slot: TimeSlot | null } | null>(null);
  const [editCapacityMode, setEditCapacityMode] = useState(false);
  const [pendingCapacity, setPendingCapacity] = useState<number>(maximumCapacity);

  // New state for editable occupancy, hints, and modal
  const [currentOccupancy, setCurrentOccupancy] = useState<number>(0);
  const [pendingOccupancy, setPendingOccupancy] = useState<number | null>(null);
  const [hint, setHint] = useState<string>("");
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [showDecreaseModal, setShowDecreaseModal] = useState(false);
  const [modalValue, setModalValue] = useState<number>(0);
  const [showMaxCapModal, setShowMaxCapModal] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTodayTimeSlots()
      .then((slots) => {
        setTimeSlots(slots);
        // Determine the date being shown
        type SlotWithDate = { date?: string };
        const slotsWithDate = slots as SlotWithDate[];
        if (slotsWithDate.length > 0 && slotsWithDate[0].date) {
          const dateStr = slotsWithDate[0].date!;
          const dateObj = new Date(dateStr);
          const formatted = dateObj.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          setDisplayDate(formatted);
        } else {
          // fallback to today
          const today = new Date();
          const formatted = today.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          setDisplayDate(formatted);
        }
        // Set current slot info
        const slotInfo = getCurrentGymOccupancy(slots);
        setCurrentSlotInfo(slotInfo);
        setCurrentOccupancy(slotInfo.occupancy ?? 0);
        setPendingOccupancy(slotInfo.occupancy ?? 0);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load session data.");
        setLoading(false);
      });
    // Fetch today's summary from DB
    fetchTodaySummary().then(setSummaryData);
  }, []);

  // Use currentSlotInfo for occupancy
  const occupancyPercentage = (currentOccupancy / maximumCapacity) * 100;
  const currentSlotTime = currentSlotInfo?.slot?.time;
  const slotBooked = currentSlotInfo?.slot?.current ?? 0;

  // Add effect to load persisted occupancy
  useEffect(() => {
    const loadPersistedOccupancy = async () => {
      if (currentSlotInfo?.slot) {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const key = `occupancy_${currentDate}_${currentSlotInfo.slot.time}`;
        const persisted = localStorage.getItem(key);
        if (persisted) {
          setCurrentOccupancy(parseInt(persisted, 10));
        }
      }
    };
    loadPersistedOccupancy();
  }, [currentSlotInfo]);

  // Add effect to persist occupancy changes
  useEffect(() => {
    if (currentSlotInfo?.slot) {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const key = `occupancy_${currentDate}_${currentSlotInfo.slot.time}`;
      localStorage.setItem(key, currentOccupancy.toString());
    }
  }, [currentOccupancy, currentSlotInfo]);

  // Handlers for plus/minus
  const handleIncrement = () => {
    if ((pendingOccupancy ?? currentOccupancy) >= maximumCapacity) {
      setHint("Cannot exceed gym maximum capacity.");
      return;
    }
    setPendingOccupancy((prev) => (prev ?? currentOccupancy) + 1);
    setHint("");
  };

  const handleDecrement = () => {
    const currentValue = pendingOccupancy ?? currentOccupancy;
    if (currentValue <= 0) {
      setHint("Cannot go below zero.");
      return;
    }
    
    // If trying to decrease below booked slots, show confirmation modal
    if (currentValue > slotBooked && currentValue - 1 < slotBooked) {
      setModalValue(slotBooked);
      setShowDecreaseModal(true);
      return;
    }
    
    setPendingOccupancy(currentValue - 1);
    setHint("");
  };

  // Modal confirm handler
  const handleModalConfirm = () => {
    setPendingOccupancy(modalValue);
    setShowBookedModal(false);
    setShowDecreaseModal(false);
    setHint("");
  };

  // Modal cancel handler
  const handleModalCancel = () => {
    setShowBookedModal(false);
    setShowDecreaseModal(false);
    setPendingOccupancy(null);
  };

  // Add new handler for confirming occupancy changes
  const handleConfirmOccupancy = async () => {
    if (pendingOccupancy === null) return;
    
    setCurrentOccupancy(pendingOccupancy);
    setPendingOccupancy(null);
    setHint("");

    // Log analytics for the current timeslot
    if (currentSlotInfo?.slot) {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const [hours, minutes] = currentSlotInfo.slot.time.split(':');
      
      try {
        await logHourlySessionAnalytics({
          date: currentDate,
          start_time_of_day: currentSlotInfo.slot.time,
          end_time_of_day: `${String(parseInt(hours) + 1).padStart(2, '0')}:${minutes}`,
          hourly_occupancy: pendingOccupancy,
          daily_occupancy: 0,
          booked_count: currentSlotInfo.slot.current || 0,
          no_show_count: 0,
          cancelled_count: 0,
          waitlist_count: 0,
          peak_time: currentSlotInfo.slot.time,
          max_capacity: maximumCapacity,
        });
      } catch (error) {
        console.error('Failed to log analytics:', error);
        setHint('Failed to log analytics. Please try again.');
      }
    }
  };

  // Add effect to log analytics when timeslot changes
  useEffect(() => {
    const checkAndLogTimeslot = async () => {
      if (currentSlotInfo?.slot) {
        const now = new Date();
        const [hours, minutes] = currentSlotInfo.slot.time.split(':');
        const slotEndTime = new Date();
        slotEndTime.setHours(parseInt(hours) + 1, parseInt(minutes), 0, 0);

        // If we're past the slot end time, log the final occupancy
        if (now >= slotEndTime) {
          const currentDate = now.toISOString().split('T')[0];
          try {
            await logHourlySessionAnalytics({
              date: currentDate,
              start_time_of_day: currentSlotInfo.slot.time,
              end_time_of_day: `${String(parseInt(hours) + 1).padStart(2, '0')}:${minutes}`,
              hourly_occupancy: currentOccupancy,
              daily_occupancy: 0,
              booked_count: currentSlotInfo.slot.current || 0,
              no_show_count: 0,
              cancelled_count: 0,
              waitlist_count: 0,
              peak_time: currentSlotInfo.slot.time,
              max_capacity: maximumCapacity,
            });
          } catch (error) {
            console.error('Failed to log analytics for ended timeslot:', error);
          }
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkAndLogTimeslot, 60000);
    return () => clearInterval(interval);
  }, [currentSlotInfo, currentOccupancy, maximumCapacity]);

  // Initialize pendingOccupancy when currentOccupancy changes
  useEffect(() => {
    setPendingOccupancy(currentOccupancy);
  }, [currentOccupancy]);

  // Handler for updating capacity
  const handleUpdateCapacity = () => {
    if (pendingCapacity < currentOccupancy) {
      setShowMaxCapModal(true);
      return;
    }
    setMaximumCapacity(pendingCapacity);
    setEditCapacityMode(false);
  };

  const handleForceUpdateCapacity = () => {
    setMaximumCapacity(pendingCapacity);
    setCurrentOccupancy(pendingCapacity);
    setEditCapacityMode(false);
    setShowMaxCapModal(false);
  };

  const handleCancelUpdateCapacity = () => {
    setShowMaxCapModal(false);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-text">Loading session data...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">{error}</div>
    );
  }

  return (
    <div className="p-6 bg-background text-text min-h-screen">
      <h1 className="text-3xl font-header mb-2">Session Management</h1>
      <p className="text-body text-lg mb-6">Monitor and manage gym session occupancy and capacity.</p>
      
      {/* Sneaky debug button */}
      <div className="fixed top-2 right-2">
        <button
          className={`px-4 py-2 rounded transition-all duration-300 ${
            DEBUG_MODE 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'opacity-0 hover:opacity-20'
          }`}
          disabled={debugLoading}
          onClick={async () => {
            setDebugLoading(true);
            try {
              await debugLogAnalyticsForTodaySlots();
              alert('Analytics log sent for all slots!');
            } catch (e) {
              alert('Failed to log analytics: ' + (e instanceof Error ? e.message : String(e)));
            } finally {
              setDebugLoading(false);
            }
          }}
          title="Debug: Log Analytics for All Slots"
        >
          {debugLoading ? 'Logging...' : '🔍'}
        </button>
      </div>


      {/* Top Section: Current Occupancy, Max Capacity, Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Gym Occupancy */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-header">Manual Occupancy Controls</h2>
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
          <p className="text-gray-600 mb-2">People currently in gym</p>
          {currentSlotTime && (
            <p className="text-xs text-gray-500 mb-4">Current slot: {currentSlotTime}</p>
          )}

          {/* Occupancy Level Bar */}
          <div className="mb-2">
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
          {hint && (
            <div className="text-xs text-red-500 mb-2">{hint}</div>
          )}

          {/* Manual Check-in/out */}
          <div className="flex flex-col items-center justify-center space-y-4 text-gray-600 mt-6">
            <div className="flex items-center space-x-6">
            <button
              className="flex items-center space-x-2 text-red-600 hover:text-red-800"
              title="Manual Check-out"
              onClick={handleDecrement}
            >
              <MinusCircleIcon className="w-8 h-8" />
            </button>
            <span className="text-lg">Manual Check-in/out</span>
            <button
              className="flex items-center space-x-2 text-green-600 hover:text-green-800"
              title="Manual Check-in"
              onClick={handleIncrement}
            >
              <PlusCircleIcon className="w-8 h-8" />
            </button>
            </div>
            {pendingOccupancy !== null && (
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium">Pending: {pendingOccupancy}</span>
                <button
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-accent transition-colors"
                  onClick={handleConfirmOccupancy}
                >
                  Confirm Occupancy
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={handleModalCancel}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Booked modal */}
          {showBookedModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                <h3 className="text-lg font-header mb-2">Decrease below booked sessions?</h3>
                <p className="text-sm text-gray-700 mb-4">
                  You are reducing below the number of booked sessions ({slotBooked}).<br />
                  How many should you decrease to?
                </p>
                <div className="flex items-center justify-center mb-4">
                  <button
                    className="px-2 py-1 text-lg border rounded-l bg-gray-100"
                    onClick={() => setModalValue(Math.max(0, modalValue - 1))}
                  >-</button>
                  <input
                    type="number"
                    min={0}
                    max={slotBooked}
                    value={modalValue}
                    onChange={e => setModalValue(Math.max(0, Math.min(slotBooked, Number(e.target.value))))}
                    className="w-16 text-center border-t border-b border-gray-300 text-lg"
                  />
                  <button
                    className="px-2 py-1 text-lg border rounded-r bg-gray-100"
                    onClick={() => setModalValue(Math.min(slotBooked, modalValue + 1))}
                  >+</button>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={handleModalCancel}
                  >Cancel</button>
                  <button
                    className="px-3 py-1 rounded bg-primary text-white hover:bg-accent"
                    onClick={handleModalConfirm}
                  >Confirm</button>
                </div>
              </div>
            </div>
          )}

          {/* Decrease below booked modal */}
          {showDecreaseModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                <h3 className="text-lg font-header mb-2">Warning: Decreasing Below Booked Sessions</h3>
                <p className="text-sm text-gray-700 mb-4">
                  You are attempting to decrease the occupancy below the number of booked sessions ({slotBooked}).<br />
                  This is not recommended as it may indicate missing check-ins.<br />
                  Are you sure you want to proceed?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={handleModalCancel}
                  >Cancel</button>
                  <button
                    className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                    onClick={handleModalConfirm}
                  >Proceed Anyway</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Max Capacity and Today's Summary */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Maximum Capacity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-header mb-4">Capacity Configuration</h2>
            {editCapacityMode ? (
              <>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={pendingCapacity}
                  onChange={e => setPendingCapacity(Number(e.target.value))}
                  className="w-full text-4xl font-bold text-text mb-4 border border-gray-300 rounded-md px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  className="w-full px-4 py-2 mt-2 border border-primary bg-primary text-white rounded-md hover:bg-accent transition-colors"
                  onClick={handleUpdateCapacity}
                >
                  Update Capacity
                </button>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold text-text mb-4">
                  {maximumCapacity}
                </p>
                <button
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-text hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setPendingCapacity(maximumCapacity);
                    setEditCapacityMode(true);
                  }}
                >
                  Edit Capacity
                </button>
              </>
            )}
          </div>

          {/* Max Capacity Modal */}
          {showMaxCapModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-lg font-header mb-2">Current occupancy exceeds new maximum</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Current gym occupancy (<b>{currentOccupancy}</b>) exceeds the new maximum capacity (<b>{pendingCapacity}</b>).<br />
                  What would you like to do?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    onClick={handleCancelUpdateCapacity}
                  >Cancel</button>
                  <button
                    className="px-3 py-1 rounded bg-primary text-white hover:bg-accent"
                    onClick={handleForceUpdateCapacity}
                  >Force Update</button>
                </div>
              </div>
            </div>
          )}

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
        <div className="flex items-center mb-4 gap-4">
          <h2 className="text-xl font-header">Session Attendance Tracking</h2>
          {displayDate && (
            <span className="text-sm text-gray-500 font-medium">{displayDate}</span>
          )}
        </div>
        <p className="text-body text-gray-600 mb-6">
          Monitor capacity for each time slot.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...timeSlots]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((slot) => (
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
