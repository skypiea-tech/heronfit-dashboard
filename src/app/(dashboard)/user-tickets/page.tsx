"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { UserModel } from "../users/models/User";
import { supabase } from "@/lib/supabaseClient";

interface IssueTicketForm {
  email: string;
  ticket_code: string;
}

const IssueTicketPage = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IssueTicketForm>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: IssueTicketForm) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      // Validate ticket_code: must be exactly 7 digits
      if (!/^\d{7}$/.test(data.ticket_code)) {
        setError("Ticket ID must be exactly 7 digits.");
        setLoading(false);
        return;
      }
      // Check if ticket_code already exists
      const { data: existingTicket, error: ticketCheckError } = await supabase
        .from("user_tickets")
        .select("id")
        .eq("ticket_code", data.ticket_code)
        .maybeSingle();
      if (ticketCheckError) {
        setError("Error checking ticket ID. Please try again.");
        setLoading(false);
        return;
      }
      if (existingTicket) {
        setError("A ticket with this ID already exists. Please use a different 7-digit number.");
        setLoading(false);
        return;
      }
      // Validate email format
      if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      // 1. Find user by email (must exist)
      const user = await UserModel.getUserByEmail(data.email);
      if (!user) {
        setError("No user found with that email. Please enter a registered user email.");
        setLoading(false);
        return;
      }
      // Check if user already has an available ticket
      const { data: existingAvailable, error: availableCheckError } = await supabase
        .from("user_tickets")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "available")
        .maybeSingle();
      if (availableCheckError) {
        setError("Error checking user's existing tickets. Please try again.");
        setLoading(false);
        return;
      }
      if (existingAvailable) {
        setError("This user already has an available ticket issued.");
        setLoading(false);
        return;
      }
      // 2. Insert ticket
      const { error: insertError } = await supabase.from("user_tickets").insert({
        user_id: user.id,
        ticket_code: data.ticket_code,
        status: "available",
        user_email: data.email,
      });
      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess("Ticket issued successfully!");
        reset();
      }
    } catch (e: any) {
      setError(e.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-header mb-6 text-center">Issue Ticket</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-body mb-2">User Email</label>
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
            {...register("email", { required: "Email is required" })}
            disabled={loading}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="ticket_code" className="block text-sm font-body mb-2">Ticket ID (7 digits)</label>
          <input
            id="ticket_code"
            type="text"
            inputMode="numeric"
            maxLength={7}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary"
            {...register("ticket_code", { required: "Ticket ID is required" })}
            disabled={loading}
          />
          {errors.ticket_code && <p className="text-red-500 text-xs mt-1">{errors.ticket_code.message}</p>}
        </div>
        {error && <p className="text-red-600 text-sm font-body">{error}</p>}
        {success && <p className="text-green-600 text-sm font-body">{success}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-accent transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Issuing..." : "Issue Ticket"}
        </button>
      </form>
    </div>
  );
};

export default IssueTicketPage; 