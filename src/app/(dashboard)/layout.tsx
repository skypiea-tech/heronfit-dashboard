"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ScaleIcon,
  MegaphoneIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "User Management", href: "/users", icon: UsersIcon },
    { name: "Bookings", href: "/bookings", icon: CalendarIcon },
    { name: "Gym Occupancy", href: "/sessions", icon: ScaleIcon },
    { name: "Announcements", href: "/announcements", icon: MegaphoneIcon },
    { name: "Data & Reports", href: "/analytics", icon: ChartBarIcon },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6 space-y-6 sticky top-0 h-screen">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2 mb-8">
          {/* Placeholder for Logo */}
          <div className="w-8 h-8 bg-primary rounded"></div>
          <span className="text-xl font-bold text-text">HeronFit</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center space-x-3 p-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-secondary text-primary"
                    : "text-text hover:bg-secondary"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin User Info (Placeholder) */}
        <div className="absolute bottom-6 left-0 w-full px-6">
          <div className="flex items-center space-x-3">
            {/* Placeholder Avatar */}
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-text">Admin User</p>
              <p className="text-xs text-gray-500">UMak Gym Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
};

export default DashboardLayout;
