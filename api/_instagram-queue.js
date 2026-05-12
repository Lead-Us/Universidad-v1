// POST /api/instagram-queue   → add a post to the queue
// GET  /api/instagram-queue   → list pending posts
// Body (POST): { imageUrls: string[], caption: string, scheduledAt: ISO string }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for server-side writes
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { imageUrls, caption, scheduledAt } = req.body;

    if (!imageUrls?.length || !caption || !scheduledAt) {
      return res.status(400).json({ error: 'imageUrls[], caption, and scheduledAt required' });
    }

    const { data, error } = await supabase
      .from('instagram_queue')
      .insert({
        image_urls:   imageUrls,
        caption,
        scheduled_at: scheduledAt,
        status:       'pending',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, post: data });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('instagram_queue')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ posts: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
