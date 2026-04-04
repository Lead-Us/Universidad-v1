// GET /api/db-test — tries all known Supabase connection formats
import postgres from 'postgres';

const PASS = 'sypfo3-Torbot-zagguv';
const REF  = 'kxstenolowfaubyoxovx';

const URLS = [
  // Direct host variations
  `postgresql://postgres:${PASS}@db.${REF}.supabase.co:5432/postgres`,
  `postgresql://postgres:${PASS}@${REF}.supabase.co:5432/postgres`,
  `postgresql://postgres:${PASS}@${REF}.supabase.co:6543/postgres`,
  // Supavisor - more regions
  `postgresql://postgres.${REF}:${PASS}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-us-east-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${PASS}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
];

export default async function handler(req, res) {
  const results = [];
  for (const url of URLS) {
    const label = url.replace(PASS, '***').split('@')[1];
    const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 6, idle_timeout: 3 });
    try {
      const r = await sql`SELECT current_user`;
      await sql.end();
      results.push({ url: label, ok: true, user: r[0].current_user });
      return res.status(200).json({ working: label, results });
    } catch (e) {
      try { await sql.end({ timeout: 1 }); } catch {}
      results.push({ url: label, ok: false, error: e.message.slice(0, 60) });
    }
  }
  return res.status(500).json({ error: 'All failed', results });
}
