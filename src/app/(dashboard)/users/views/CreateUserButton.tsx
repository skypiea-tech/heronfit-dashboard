import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { PlusIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { UserFormData } from "../models/User";
import { differenceInYears } from "date-fns";
import { supabase } from "@/lib/supabaseClient";

export const CreateUserButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "password" | "otp">("form");
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
  const [otp, setOtp] = useState("");
  const [signupUserId, setSignupUserId] = useState<string | null>(null);
  const [otpResent, setOtpResent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  // Step 1: After password, send OTP
  const handleSendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setOtpResent(false);
    // Validation: email and password must not be empty
    if (!formData.email_address || !(useGeneratedPassword ? generatePassword() : password)) {
      setError("Email and password are required.");
      setIsLoading(false);
      setStep("otp"); // Always show OTP popup
      return;
    }
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email_address,
        password: useGeneratedPassword ? generatePassword() : password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            user_role: formData.user_role,
          },
        },
      });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("user already registered")) {
          setError("This email is already registered. Please use a different email or ask the user to log in.");
        } else {
          setError(signUpError.message || "Failed to send OTP");
        }
        setStep("otp"); // Always show OTP popup
        return;
      }
      if (data.user) setSignupUserId(data.user.id);
      setSuccessMessage("OTP sent! Ask the user for the code from their email.");
      setStep("otp"); // Always show OTP popup
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to send OTP");
      } else {
        setError("Failed to send OTP");
      }
      setStep("otp"); // Always show OTP popup
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setOtpResent(false);
    // Validation: email and password must not be empty
    if (!formData.email_address || !(useGeneratedPassword ? generatePassword() : password)) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }
    try {
      // Supabase does not have a direct resend, so we call signUp again
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email_address,
        password: useGeneratedPassword ? generatePassword() : password,
      });
      if (signUpError) {
        setError(signUpError.message || "Failed to resend OTP");
        return;
      }
      setOtpResent(true);
      setSuccessMessage("OTP resent! Ask the user for the new code from their email.");
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and insert profile
  const handleVerifyOtpAndCreateProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email_address,
        token: otp,
        type: "signup",
      });
      if (verifyError) throw verifyError;
      // Use the user id from the verified session/user
      const userId = data.user?.id || signupUserId;
      if (!userId) throw new Error("User ID not found after verification");
      // Insert into users table after OTP verification
      const userProfile = {
        id: userId,
        created_at: new Date().toISOString(),
        first_name: formData.first_name,
        last_name: formData.last_name,
        email_address: formData.email_address,
        birthday: formData.birthday || null,
        gender: formData.gender || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        goal: formData.goal || null,
        contact: formData.contact || null,
        has_session: null,
        avatar: null,
        user_role: formData.user_role,
        role_status: formData.role_status || (formData.user_role === "FACULTY/STAFF" ? "PENDING_VERIFICATION" : "VERIFIED"),
        verification_document_url: null,
        push_token: null,
      };
      // Upsert logic: insert if not exists, update if exists
      const { data: existing, error: selectError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();
      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 = No rows found, which is fine
        throw selectError;
      }
      let upsertError = null;
      if (existing) {
        // User exists, update
        const { error } = await supabase
          .from("users")
          .update(userProfile)
          .eq("id", userId);
        upsertError = error;
      } else {
        // User does not exist, insert
        const { error } = await supabase
          .from("users")
          .insert(userProfile);
        upsertError = error;
      }
      if (upsertError) throw upsertError;
      setSuccessMessage("User verified and profile created successfully!");
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "OTP verification failed");
      } else {
        setError("OTP verification failed");
      }
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
              {step === "form"
                ? "Create New User"
                : step === "password"
                ? "Set Password & Send OTP"
                : "Enter OTP from User's Email"}
            </Dialog.Title>

            {step === "form" && (
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
                {error && <div className="text-red-600 text-sm">{error}</div>}
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
            )}
            {step === "password" && (
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
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base text-gray-900 pr-10"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setStep("form")}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      await handleSendOtp();
                      console.log("Advancing to OTP step");
                      setStep("otp"); // Always show OTP step after button press
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              </div>
            )}
            {step === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                  <p className="text-sm text-gray-500 mb-2">
                    <b>Ask the user for the 6-digit code sent to {formData.email_address}.</b><br />
                    <span className="text-xs text-gray-400">The code expires after a few minutes. If the user didn&apos;t receive it, click Resend OTP.</span>
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
                {successMessage && <div className="text-green-600 text-sm">{successMessage}</div>}
                {otpResent && <div className="text-green-600 text-xs">OTP resent successfully!</div>}
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex justify-between items-center gap-4 mt-6">
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {isLoading ? "Resending..." : "Resend OTP"}
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep("password")}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerifyOtpAndCreateProfile}
                      disabled={isLoading}
                      className="px-4 py-2 border border-primary rounded-md bg-primary text-white text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {isLoading ? "Verifying..." : "Verify & Create User"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}; 