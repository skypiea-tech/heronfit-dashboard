import { supabase } from "@/lib/supabaseClient";

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }

  return data;
}

export async function addAnnouncement(announcementData: {
  title?: string | null;
  content: string;
  target_audience?: string | null;
  type?: string | null;
  published_at?: string | null;
}) {
  const { data, error } = await supabase
    .from("announcements")
    .insert([announcementData])
    .select();

  if (error) {
    console.error("Error adding announcement:", error);
    throw error;
  }

  return data;
}

// Add other model functions here later
