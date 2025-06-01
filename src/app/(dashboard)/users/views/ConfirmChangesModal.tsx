import React from "react";
import { Dialog } from "@headlessui/react";

interface Change {
  field: string;
  oldValue: string | number | undefined | null;
  newValue: string | number | undefined | null;
}

interface ConfirmChangesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: Change[];
}

export const ConfirmChangesModal = ({ open, onClose, onConfirm, changes }: ConfirmChangesModalProps) => (
  <Dialog open={open} onClose={onClose} className="fixed inset-0 z-20 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen">
      <div className="fixed inset-0 bg-black opacity-30" />
      <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 p-6">
        <Dialog.Title className="text-xl font-semibold mb-4 text-gray-900">Confirm Changes</Dialog.Title>
        <div className="mb-6">
          <p className="mb-2 text-gray-700">You are about to make the following changes:</p>
          <ul className="space-y-2">
            {changes.map((change, idx) => (
              <li key={idx} className="text-sm text-gray-800">
                <span className="font-medium text-gray-600">{change.field}:</span>{" "}
                <span className="text-red-600 line-through">
                  {change.oldValue === "" ? <em>empty</em> : String(change.oldValue)}
                </span>{" "}
                <span className="mx-2">→</span>{" "}
                <span className="text-green-700 font-semibold">
                  {change.newValue === "" ? <em>empty</em> : String(change.newValue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 border border-primary rounded-md bg-primary text-white text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </Dialog>
); 