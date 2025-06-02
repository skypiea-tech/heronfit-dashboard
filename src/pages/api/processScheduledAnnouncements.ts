import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Find all scheduled announcements that should be sent now
  const now = new Date().toISOString();
  const { data: scheduled, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'scheduled')
    .lte('published_at', now);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!scheduled || scheduled.length === 0) {
    return res.status(200).json({ message: 'No scheduled announcements to send.' });
  }

  // Mark them as sent
  const ids = scheduled.map(a => a.id);
  const { error: updateError } = await supabase
    .from('announcements')
    .update({ status: 'sent' })
    .in('id', ids);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  // Here you could also trigger notifications, emails, etc.

  return res.status(200).json({ message: `Sent ${ids.length} announcements.`, ids });
}
