import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { UserStatusModel, UserStatus, UserStatusOverride } from '../models/UserStatus';
import { supabase } from '@/lib/supabaseClient';

interface UserStatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentStatus: UserStatus | UserStatusOverride;
  lastActivity: Date | null;
  onStatusChange: () => void;
}

export const UserStatusPopup = ({
  isOpen,
  onClose,
  userId,
  currentStatus,
  lastActivity,
  onStatusChange,
}: UserStatusPopupProps) => {
  const handleStatusChange = async (newStatus: UserStatus | UserStatusOverride | null) => {
    try {
      if (newStatus === null) {
        // Auto-assign based on last activity
        const autoStatus = UserStatusModel.determineStatus(lastActivity);
        await supabase
          .from('users')
          .update({ activity_status: autoStatus })
          .eq('id', userId);
      } else {
        await supabase
          .from('users')
          .update({ activity_status: newStatus })
          .eq('id', userId);
      }
      onStatusChange();
      onClose();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const isCurrentStatus = (status: UserStatus | UserStatusOverride | null) => {
    if (status === null) return !currentStatus;
    return status === currentStatus;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Change User Status
                </Dialog.Title>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleStatusChange(null)}
                    className={`w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md ${
                      isCurrentStatus(null)
                        ? 'bg-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Auto-assign
                  </button>
                  <button
                    onClick={() => handleStatusChange(UserStatusModel.getOverrideStatus('active'))}
                    className={`w-full px-4 py-2 text-sm font-medium text-green-700 rounded-md ${
                      isCurrentStatus(UserStatusModel.getOverrideStatus('active'))
                        ? 'bg-green-200'
                        : 'bg-green-100 hover:bg-green-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleStatusChange(UserStatusModel.getOverrideStatus('idle'))}
                    className={`w-full px-4 py-2 text-sm font-medium text-yellow-700 rounded-md ${
                      isCurrentStatus(UserStatusModel.getOverrideStatus('idle'))
                        ? 'bg-yellow-200'
                        : 'bg-yellow-100 hover:bg-yellow-200'
                    }`}
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => handleStatusChange(UserStatusModel.getOverrideStatus('inactive'))}
                    className={`w-full px-4 py-2 text-sm font-medium text-red-700 rounded-md ${
                      isCurrentStatus(UserStatusModel.getOverrideStatus('inactive'))
                        ? 'bg-red-200'
                        : 'bg-red-100 hover:bg-red-200'
                    }`}
                  >
                    Inactive
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 