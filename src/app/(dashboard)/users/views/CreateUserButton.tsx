import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { UserModel, UserFormData } from "../models/User";
import { differenceInYears } from "date-fns";

export const CreateUserButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "password">("form");
  const [formData, setFormData] = useState<UserFormData>({
    first_name: "",
    last_name: "",
    email_address: "",
    birthday: "",
    gender: "prefer_not_to_say",
    weight: "",
    weight_unit: "kg",
    height: "",
    height_unit: "cm",
    goal: "general_fitness",
    user_role: "PUBLIC",
  });
  const [password, setPassword] = useState("");
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthday: string) => {
    if (!birthday) return "";
    return `${differenceInYears(new Date(), new Date(birthday))} years old`;
  };

  const generatePassword = () => {
    const firstName = formData.first_name.split(" ")[0].toLowerCase();
    const lastName = formData.last_name.split(" ")[0].toLowerCase();
    const birthYear = new Date(formData.birthday).getFullYear();
    return `${firstName}${lastName}${birthYear}`;
  };

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await UserModel.createUser(formData, useGeneratedPassword ? generatePassword() : password);
      setIsOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
        Add User
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              {step === "form" ? "Create New User" : "Set Password"}
            </Dialog.Title>

            {step === "form" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Birthday</label>
                  <input
                    type="date"
                    required
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                  {formData.birthday && (
                    <p className="mt-1 text-sm text-gray-500">{calculateAge(formData.birthday)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as UserFormData["gender"] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                      <select
                        value={formData.weight_unit}
                        onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value as "kg" | "lbs" })}
                        className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Height</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      />
                      <select
                        value={formData.height_unit}
                        onChange={(e) => setFormData({ ...formData, height_unit: e.target.value as "cm" | "ft" })}
                        className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      >
                        <option value="cm">cm</option>
                        <option value="ft">ft</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal</label>
                  <select
                    required
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value as UserFormData["goal"] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="general_fitness">General Fitness</option>
                    <option value="improve_endurance">Improve Endurance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact (Optional)</label>
                  <input
                    type="tel"
                    value={formData.contact || ""}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">User Role</label>
                  <select
                    required
                    value={formData.user_role}
                    onChange={(e) => setFormData({ ...formData, user_role: e.target.value as UserFormData["user_role"] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY/STAFF">Faculty/Staff</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>

                {formData.user_role === "FACULTY/STAFF" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role Status</label>
                    <select
                      required
                      value={formData.role_status || "UNVERIFIED"}
                      onChange={(e) => setFormData({ ...formData, role_status: e.target.value as "UNVERIFIED" | "VERIFIED" })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="UNVERIFIED">Unverified</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep("password")}
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={useGeneratedPassword}
                        onChange={(e) => setUseGeneratedPassword(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="ml-2">Use generated password</span>
                    </label>
                  </div>
                  {useGeneratedPassword ? (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">Generated password:</p>
                      <p className="font-mono text-sm">{generatePassword()}</p>
                    </div>
                  ) : (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  )}
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setStep("form")}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {isLoading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}; 