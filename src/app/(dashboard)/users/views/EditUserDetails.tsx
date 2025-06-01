import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { UserDetails } from "../models/User";
import { RoleStatus } from "../models/UserRole";
import { ConfirmChangesModal } from "./ConfirmChangesModal";

interface EditUserDetailsProps {
  user: UserDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updated: Partial<UserDetails>) => void;
}

// Helper function to get initials for avatar placeholder
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const EditUserDetails = ({ user, isOpen, onClose, onConfirm }: EditUserDetailsProps) => {
  const [form, setForm] = useState<Partial<UserDetails>>(user || {});
  const [showConfirm, setShowConfirm] = useState(false);
  const [changes, setChanges] = useState<{ field: string, oldValue: string | number | undefined | null, newValue: string | number | undefined | null }[]>([]);

  useEffect(() => { setForm(user || {}); }, [user]);

  if (!user) return null;

  const handleChange = (field: keyof UserDetails, value: string | RoleStatus | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fieldLabels: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email_address: 'Email',
    birthday: 'Birthday',
    gender: 'Gender',
    weight: 'Weight',
    height: 'Height',
    goal: 'Goal',
    contact: 'Contact',
    user_role: 'User Role',
    role_status: 'Role Status',
  };

  const handleShowConfirm = () => {
    // Compare user and form, build changes array
    const changed: { field: string, oldValue: string | number | undefined | null, newValue: string | number | undefined | null }[] = [];
    (Object.keys(fieldLabels) as (keyof UserDetails)[]).forEach((key) => {
      if (form[key] !== user[key]) {
        changed.push({
          field: fieldLabels[key],
          oldValue: user[key],
          newValue: form[key],
        });
      }
    });
    setChanges(changed);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onConfirm(form);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
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
              Edit User
            </Dialog.Title>
            <div className="space-y-6">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base font-medium text-gray-900"
                        value={form.first_name || ''}
                        onChange={e => handleChange('first_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base font-medium text-gray-900"
                        value={form.last_name || ''}
                        onChange={e => handleChange('last_name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                      value={form.email_address || ''}
                      onChange={e => handleChange('email_address', e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Birthday</label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                        value={form.birthday || ''}
                        onChange={e => handleChange('birthday', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Gender</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                        value={form.gender || ''}
                        onChange={e => handleChange('gender', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Weight (kg)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                        value={form.weight || ''}
                        onChange={e => handleChange('weight', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Height (cm)</label>
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                        value={form.height || ''}
                        onChange={e => handleChange('height', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Goals & Contact</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Goal</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                      value={form.goal || ''}
                      onChange={e => handleChange('goal', e.target.value)}
                    >
                      <option value="lose_weight">Lose Weight</option>
                      <option value="build_muscle">Build Muscle</option>
                      <option value="general_fitness">General Fitness</option>
                      <option value="improve_endurance">Improve Endurance</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500">Contact</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                      value={form.contact || ''}
                      onChange={e => handleChange('contact', e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">User Role</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                        value={form.user_role || ''}
                        onChange={e => handleChange('user_role', e.target.value)}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY/STAFF">Faculty/Staff</option>
                        <option value="PUBLIC">Public</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Role Status</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900"
                        value={form.role_status || ''}
                        onChange={e => {
                          const value = e.target.value || null;
                          handleChange('role_status', value as RoleStatus);
                        }}
                      >
                        <option value="UNVERIFIED">Unverified</option>
                        <option value="VERIFIED">Verified</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShowConfirm}
                  className="px-6 py-2 border border-primary rounded-md bg-primary text-white text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Confirm Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      <ConfirmChangesModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        changes={changes}
      />
    </>
  );
}; 