"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ScaleIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "User Management", href: "/users", icon: UsersIcon },
    { name: "Bookings", href: "/bookings", icon: CalendarIcon },
    { name: "Gym Occupancy", href: "/sessions", icon: ScaleIcon },
    { name: "Announcements", href: "/announcements", icon: MegaphoneIcon },
    { name: "Data & Reports", href: "/analytics", icon: ChartBarIcon },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      console.log("Logged out successfully.");
      router.push("/login");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Remove dummy login logic entirely for production security
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        if (!pathname.startsWith("/login")) {
          router.replace("/login");
        }
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    };
    checkAuth();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          if (!pathname.startsWith("/login")) {
            router.replace("/login");
          }
        } else {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text">
        <span>Loading...</span>
      </div>
    );
  }
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6 space-y-6 sticky top-0 h-screen flex flex-col">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2 mb-8">
          {/* Placeholder for Logo */}
          <div className="w-8 h-8 bg-primary rounded"></div>
          <span className="text-xl font-bold text-text">HeronFit</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-grow">
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
        <div className="mt-auto">
          <div className="flex items-center space-x-3 mb-6">
            {/* Placeholder Avatar */}
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-text">Admin User</p>
              <p className="text-xs text-gray-500">UMak Gym Staff</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 p-2 rounded-md transition-colors text-text hover:bg-secondary w-full"
          >
            <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
};

export default DashboardLayout;
