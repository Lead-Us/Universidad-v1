// api/weekly-metrics.js — Vercel cron (weekly Monday 09:00 CLT = 12:00 UTC)
// Queries Supabase for KPI metrics and logs a report
// Protected by CRON_SECRET header

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Auth check for cron calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = weekAgo.toISOString();

    // Run all queries in parallel
    const [
      { count: newUsers },
      { count: totalUsers },
      { count: ramosCreated },
      { count: tasksCreated },
      { count: tasksCompleted },
      { count: cuadernosCreated },
      { count: bloquesCreated },
      { count: aiMessages },
      { count: aiSessionsWithMemory },
      { count: instagramPublished },
      { count: instagramPending },
      { data: feedbackData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('ramos').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', true).gte('updated_at', weekStart),
      supabase.from('learning_models').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('aprender_blocks').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('aprender_block_chats').select('*', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', weekStart),
      supabase.from('aprender_block_memory').select('*', { count: 'exact', head: true }).gte('updated_at', weekStart),
      supabase.from('instagram_queue').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', weekStart),
      supabase.from('instagram_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('feedback').select('page, message, created_at').gte('created_at', weekStart).order('created_at', { ascending: false }).limit(50),
    ]);

    const report = {
      period: { start: weekStart, end: now.toISOString() },
      growth: { newUsers, totalUsers },
      engagement: { ramosCreated, tasksCreated, tasksCompleted, cuadernosCreated, bloquesCreated },
      ai: { aiMessages, aiSessionsWithMemory },
      instagram: { published: instagramPublished, pending: instagramPending },
      feedback: feedbackData || [],
      generatedAt: now.toISOString(),
    };

    console.log('[weekly-metrics]', JSON.stringify(report, null, 2));

    return res.status(200).json({ ok: true, report });
  } catch (err) {
    console.error('[weekly-metrics] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
