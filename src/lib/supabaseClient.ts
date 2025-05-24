import { createClient } from "@supabase/supabase-js";

// Replace with your actual Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are not set.");
  // Depending on your error handling strategy, you might want to throw an error or handle this differently.
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
