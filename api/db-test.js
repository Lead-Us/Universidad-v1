// GET /api/db-test — tries multiple Supabase connection URLs, delete after migration
import postgres from 'postgres';

const PASS = 'sypfo3-Torbot-zagguv';
const REF  = 'kxstenolowfaubyoxovx';

const URLS = [
  `postgresql://postgres.${REF}:${PASS}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${PASS}@${REF}.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${PASS}@db.${REF}.supabase.co:5432/postgres`,
];

export default async function handler(req, res) {
  const results = [];
  for (const url of URLS) {
    const label = url.split('@')[1];
    const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 8, idle_timeout: 5 });
    try {
      const r = await sql`SELECT current_user`;
      await sql.end();
      results.push({ url: label, ok: true, user: r[0].current_user });
      // Found working connection - return it
      return res.status(200).json({ working: label, user: r[0].current_user, results });
    } catch (e) {
      try { await sql.end({ timeout: 1 }); } catch {}
      results.push({ url: label, ok: false, error: e.message });
    }
  }
  return res.status(500).json({ error: 'All connections failed', results });
}
