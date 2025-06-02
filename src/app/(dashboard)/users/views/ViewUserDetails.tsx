import React from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { format, differenceInYears } from "date-fns";
import { UserDetails } from "../models/User";
import { UserRoleModel, RoleStatus } from "../models/UserRole";

interface ViewUserDetailsProps {
  user: UserDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get initials for avatar placeholder
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const ViewUserDetails = ({ user, isOpen, onClose }: ViewUserDetailsProps) => {
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
                    <p className="mt-1 text-base text-gray-900">{
                      UserRoleModel.getRoleLabel(
                        user.user_role === "FACULTY/STAFF" ? "FACULTY_STAFF" : user.user_role
                      )
                    }</p>
                  </div>
                  {user.role_status && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Role Status</label>
                      <p className="mt-1 text-base text-gray-900">{UserRoleModel.getRoleStatusLabel(user.role_status as RoleStatus)}</p>
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