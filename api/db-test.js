// GET /api/db-test - debug endpoint, delete after migration
module.exports = async function handler(req, res) {
  try {
    return res.status(200).json({
      ok: true,
      hasDbUrl: !!process.env.SUPABASE_DB_URL,
      dbUrlPrefix: process.env.SUPABASE_DB_URL?.slice(0, 30) ?? 'not set',
      node: process.version,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
