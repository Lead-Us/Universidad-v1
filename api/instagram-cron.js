// GET /api/instagram-cron
// Called by Vercel Cron every hour. Checks the queue and publishes due posts.
// vercel.json: { "crons": [{ "path": "/api/instagram-cron", "schedule": "0 * * * *" }] }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PUBLISH_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/instagram-publish`
  : 'http://localhost:3000/api/instagram-publish';

export default async function handler(req, res) {
  // Vercel Cron authenticates via CRON_SECRET
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date().toISOString();

  // Fetch all posts due for publishing
  const { data: duePosts, error } = await supabase
    .from('instagram_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  if (error) return res.status(500).json({ error: error.message });
  if (!duePosts?.length) return res.status(200).json({ message: 'No posts due', published: 0 });

  const results = [];

  for (const post of duePosts) {
    try {
      // Mark as processing to avoid double-publish
      await supabase
        .from('instagram_queue')
        .update({ status: 'processing' })
        .eq('id', post.id);

      const response = await fetch(PUBLISH_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          imageUrls: post.image_urls,
          caption:   post.caption,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await supabase
          .from('instagram_queue')
          .update({ status: 'published', instagram_post_id: result.postId, published_at: now })
          .eq('id', post.id);
        results.push({ id: post.id, status: 'published' });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      await supabase
        .from('instagram_queue')
        .update({ status: 'error', error_message: err.message })
        .eq('id', post.id);
      results.push({ id: post.id, status: 'error', error: err.message });
      console.error(`[instagram-cron] Failed post ${post.id}:`, err.message);
    }
  }

  return res.status(200).json({ published: results.filter(r => r.status === 'published').length, results });
}
