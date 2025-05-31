"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Import the Supabase client

// ===== DUMMY LOGIN CONFIGURATION - START =====
// To remove dummy login:
// 1. Delete this entire section
// 2. Remove the dummyLoginHdummyLoginHandlerandler import and usage below
const DUMMY_LOGIN_CONFIG = {
  enabled: true,
  credentials: {
    email: "admin@heronfit.com",
    password: "password"
  }
};

const dummyLoginHandler = async (email: string, password: string) => {
  if (!DUMMY_LOGIN_CONFIG.enabled) return null;
  
  if (email === DUMMY_LOGIN_CONFIG.credentials.email && 
      password === DUMMY_LOGIN_CONFIG.credentials.password) {
    localStorage.setItem('isDummyLogin', 'true');
    return true;
  }
  return null;
};
// ===== DUMMY LOGIN CONFIGURATION - END =====

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log("Attempting login with:", { email, password });

    try {
      // Try dummy login first if enabled
      const dummyLoginResult = await dummyLoginHandler(email, password);
      if (dummyLoginResult) {
        console.log("Dummy login successful!");
        router.push("/dashboard");
        return;
      }

      // Proceed with Supabase authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Supabase sign in error:", signInError);
        setError(signInError.message);
      } else if (data.user) {
        console.log("Login successful!", data.user);
        localStorage.removeItem('isDummyLogin');
        router.push("/dashboard");
      } else {
        setError("An unexpected error occurred during login.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-header text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-text text-sm font-body mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-text leading-tight focus:outline-none focus:ring-primary focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-text text-sm font-body mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-text mb-3 leading-tight focus:outline-none focus:ring-primary focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs italic mb-4 font-body">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-primary hover:bg-accent text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
