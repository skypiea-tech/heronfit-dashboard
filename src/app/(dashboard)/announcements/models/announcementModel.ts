import { supabase } from "@/lib/supabaseClient";

export async function getAnnouncements({ includeArchived = false } = {}) {
  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error } = await query;

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
  // Set status based on published_at
  const now = new Date();
  let status = 'sent';
  if (announcementData.published_at && new Date(announcementData.published_at) > now) {
    status = 'scheduled';
  }
  const { data, error } = await supabase
    .from("announcements")
    .insert([{ ...announcementData, status }])
    .select();

  if (error) {
    console.error("Error adding announcement:", error);
    throw error;
  }

  return data;
}

export async function archiveAnnouncement(id: string, archived = true) {
  const { data, error } = await supabase
    .from("announcements")
    .update({ archived })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error archiving announcement:", error);
    throw error;
  }

  return data;
}

export async function unarchiveAnnouncement(id: string) {
  return archiveAnnouncement(id, false);
}

// Add other model functions here later
