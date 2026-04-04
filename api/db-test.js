// GET /api/db-test - debug endpoint, delete after migration
module.exports = async function handler(req, res) {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return res.status(500).json({ error: 'SUPABASE_DB_URL not set' });

  let sql;
  try {
    const postgres = require('postgres');
    sql = postgres(dbUrl, { ssl: 'require', max: 1, connect_timeout: 10, idle_timeout: 10 });
    const result = await sql`SELECT current_user, version()`;
    await sql.end();
    return res.status(200).json({ ok: true, user: result[0].current_user, version: result[0].version.slice(0, 40) });
  } catch (err) {
    try { if (sql) await sql.end({ timeout: 2 }); } catch {}
    return res.status(500).json({ error: err.message, code: err.code, type: err.constructor?.name });
  }
};
