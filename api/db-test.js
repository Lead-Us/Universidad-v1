// GET /api/db-test — verifies DB connection, delete after migration
import postgres from 'postgres';

export default async function handler(req, res) {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return res.status(500).json({ error: 'SUPABASE_DB_URL not set' });

  const sql = postgres(dbUrl, { ssl: 'require', max: 1, connect_timeout: 10, idle_timeout: 10 });
  try {
    const r = await sql`SELECT current_user, version()`;
    await sql.end();
    return res.status(200).json({ ok: true, user: r[0].current_user, version: r[0].version.slice(0, 50) });
  } catch (err) {
    try { await sql.end({ timeout: 2 }); } catch {}
    return res.status(500).json({ error: err.message, code: err.code });
  }
}
