// api/analytics.js — Admin analytics dashboard endpoint
// GET /api/analytics?range=7|30|90
// Protected by admin role in app_metadata

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new Error('No autenticado.');
  const token = auth.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Token inválido.');
  if (user.app_metadata?.role !== 'admin') throw new Error('Solo el administrador puede acceder.');
  return user;
}

async function checkInstagramToken() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { valid: null, error: 'Token no configurado' };
  try {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    if (appId && appSecret) {
      const url = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data?.is_valid) {
        const expiresAt = json.data.expires_at ? new Date(json.data.expires_at * 1000) : null;
        const daysLeft = expiresAt ? Math.floor((expiresAt - Date.now()) / 86400000) : null;
        return { valid: true, expiresAt: expiresAt?.toISOString() ?? null, daysLeft };
      }
      return { valid: false, error: 'Token inválido según Meta' };
    }
    // Fallback: just ping the API
    const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${token}`);
    if (res.ok) return { valid: true, expiresAt: null, daysLeft: null };
    return { valid: false, error: 'Token rechazado por Instagram' };
  } catch (e) {
    return { valid: null, error: 'No se pudo verificar' };
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await verifyAdmin(req);
  } catch (e) {
    return res.status(e.message.includes('Solo el') ? 403 : 401).json({ error: e.message });
  }

  const days = parseInt(req.query.range ?? '30', 10);
  const validDays = [7, 30, 90].includes(days) ? days : 30;
  const now = new Date();
  const since = new Date(now.getTime() - validDays * 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sinceStr = since.toISOString();
  const since7dStr = since7d.toISOString();
  const since30dStr = since30d.toISOString();

  try {
    const [
      totalUsersResult,
      newUsersResult,
      subStatusResult,
      activeUsers7dResult,
      activeUsers30dResult,
      topUniversitiesResult,
      dailySignupsResult,
      ramosResult,
      tasksCreatedResult,
      tasksCompletedResult,
      notebooksResult,
      blocksResult,
      dailyActivityResult,
      aiMessagesResult,
      aiMemoryResult,
      instPublishedResult,
      instPendingResult,
      instProcessingResult,
      instErrorResult,
      instPipelineResult,
      instByDayResult,
      feedbackResult,
      feedbackTotalResult,
      tokenStatusResult,
    ] = await Promise.allSettled([
      // users
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
      supabase.from('profiles').select('subscription_status'),
      supabase.rpc('get_active_users_count', { since: since7dStr }),
      supabase.rpc('get_active_users_count', { since: since30dStr }),
      supabase.rpc('get_top_universities', { limit_n: 8 }),
      supabase.rpc('get_daily_signups', { since: sinceStr }),
      // engagement
      supabase.from('ramos').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', true).gte('created_at', sinceStr),
      supabase.from('learning_models').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
      supabase.from('aprender_blocks').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
      supabase.rpc('get_daily_activity', { since: sinceStr }),
      // ai
      supabase.from('aprender_block_chats').select('*', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', sinceStr),
      supabase.from('aprender_block_memory').select('*', { count: 'exact', head: true }).gte('updated_at', sinceStr),
      // instagram
      supabase.from('instagram_queue').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', sinceStr),
      supabase.from('instagram_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('instagram_queue').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
      supabase.from('instagram_queue').select('*', { count: 'exact', head: true }).eq('status', 'error'),
      supabase.from('instagram_queue').select('id, caption, scheduled_at, image_urls').eq('status', 'pending').order('scheduled_at').limit(10),
      supabase.from('instagram_queue').select('published_at').eq('status', 'published').gte('published_at', sinceStr),
      // feedback
      supabase.from('feedback').select('message, page_url, created_at').gte('created_at', sinceStr).order('created_at', { ascending: false }).limit(20),
      supabase.from('feedback').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
      // instagram token
      checkInstagramToken(),
    ]);

    const val = (result, field = 'count') =>
      result.status === 'fulfilled' && result.value ? (result.value[field] ?? null) : null;

    const data = (result) =>
      result.status === 'fulfilled' && result.value ? (result.value.data ?? []) : [];

    // Subscription breakdown
    const subRows = data(subStatusResult);
    const subscriptionBreakdown = subRows.reduce((acc, { subscription_status }) => {
      const key = subscription_status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Instagram published by day
    const publishedRows = data(instByDayResult);
    const byDayMap = {};
    for (const row of publishedRows) {
      if (!row.published_at) continue;
      const day = row.published_at.slice(0, 10);
      byDayMap[day] = (byDayMap[day] || 0) + 1;
    }
    const publishedByDay = Object.entries(byDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }));

    // Content pipeline (caption preview)
    const pipeline = data(instPipelineResult).map((p) => ({
      id: p.id,
      caption_preview: (p.caption || '').substring(0, 80),
      scheduled_at: p.scheduled_at,
      image_count: Array.isArray(p.image_urls) ? p.image_urls.length : 0,
    }));

    // Task completion rate
    const tasksCreated = val(tasksCreatedResult) ?? 0;
    const tasksCompleted = val(tasksCompletedResult) ?? 0;
    const taskCompletionRate = tasksCreated > 0
      ? Math.round((tasksCompleted / tasksCreated) * 1000) / 10
      : 0;

    const tokenStatus = tokenStatusResult.status === 'fulfilled'
      ? tokenStatusResult.value
      : { valid: null, error: 'No se pudo verificar' };

    const response = {
      period: { days: validDays, since: sinceStr, until: now.toISOString() },
      users: {
        total: val(totalUsersResult) ?? 0,
        new: val(newUsersResult) ?? 0,
        active7d: val(activeUsers7dResult, 'data') ?? 0,
        active30d: val(activeUsers30dResult, 'data') ?? 0,
        subscriptionBreakdown,
        topUniversities: data(topUniversitiesResult),
      },
      growth: {
        dailySignups: data(dailySignupsResult),
      },
      engagement: {
        ramosCreated: val(ramosResult) ?? 0,
        tasksCreated,
        tasksCompleted,
        taskCompletionRate,
        notebooksCreated: val(notebooksResult) ?? 0,
        blocksCreated: val(blocksResult) ?? 0,
        dailyActivity: data(dailyActivityResult),
      },
      ai: {
        messagesTotal: val(aiMessagesResult) ?? 0,
        sessionsWithMemory: val(aiMemoryResult) ?? 0,
      },
      instagram: {
        published: val(instPublishedResult) ?? 0,
        pending: val(instPendingResult) ?? 0,
        processing: val(instProcessingResult) ?? 0,
        error: val(instErrorResult) ?? 0,
        publishedByDay,
        contentPipeline: pipeline,
        tokenStatus,
      },
      feedback: {
        total: val(feedbackTotalResult) ?? 0,
        recent: data(feedbackResult),
      },
      generatedAt: now.toISOString(),
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('[analytics] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
