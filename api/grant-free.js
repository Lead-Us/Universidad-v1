// GET  /api/grant-free          — lista todos los usuarios con acceso gratuito
// POST /api/grant-free { email }             — otorga acceso gratuito
// POST /api/grant-free { email, action:'revoke' } — revoca acceso
// Protected: el llamante debe ser ADMIN_EMAIL

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url            = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!url)            missing.push('VITE_SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length)  throw { status: 500, error: `Variables de entorno faltantes en Vercel: ${missing.join(', ')}` };

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(admin, token) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!ADMIN_EMAIL) throw { status: 500, error: 'Variable ADMIN_EMAIL no configurada en Vercel.' };
  if (!token)       throw { status: 401, error: 'No autenticado.' };

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) throw { status: 401, error: 'Token inválido.' };
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
    throw { status: 403, error: 'Solo el administrador puede realizar esta acción.' };

  return user;
}

async function findUserByEmail(admin, email) {
  const { data: { users }, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw { status: 500, error: error.message };
  return users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim()) ?? null;
}

export default async function handler(req, res) {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');

  let admin;
  try {
    admin = getAdminClient();
  } catch (e) {
    return res.status(e.status ?? 500).json({ error: e.error ?? e.message });
  }

  try {
    await verifyAdmin(admin, token);
  } catch (e) {
    return res.status(e.status ?? 401).json({ error: e.error ?? e.message });
  }

  // ── GET: listar todos los usuarios con acceso gratuito ──────────────────────
  if (req.method === 'GET') {
    const { data: freeProfiles, error: profileErr } = await admin
      .from('profiles')
      .select('id, name, apellido1')
      .eq('subscription_status', 'free')
      .order('updated_at', { ascending: false });

    if (profileErr) return res.status(500).json({ error: profileErr.message });
    if (!freeProfiles?.length) return res.status(200).json({ users: [] });

    // Enrich with emails from auth.users
    const { data: { users: authUsers }, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) return res.status(500).json({ error: listErr.message });

    const authMap = Object.fromEntries(authUsers.map(u => [u.id, u.email]));
    const users   = freeProfiles.map(p => ({
      id:    p.id,
      email: authMap[p.id] ?? '(sin email)',
      name:  [p.name, p.apellido1].filter(Boolean).join(' ') || '(sin nombre)',
    }));

    return res.status(200).json({ users });
  }

  // ── POST: otorgar o revocar ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { email, action = 'grant' } = req.body ?? {};
    if (!email) return res.status(400).json({ error: 'Email requerido.' });

    const target = await findUserByEmail(admin, email).catch(e => {
      throw { status: e.status ?? 500, error: e.error ?? e.message };
    });

    if (!target) {
      return res.status(404).json({
        error: `No existe ningún usuario con el correo "${email}". El usuario debe registrarse primero.`,
      });
    }

    const newStatus = action === 'revoke' ? 'inactive' : 'free';
    const { error: updateErr } = await admin
      .from('profiles')
      .update({ subscription_status: newStatus })
      .eq('id', target.id);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    const verb = action === 'revoke' ? 'revocado a' : 'otorgado a';
    return res.status(200).json({ ok: true, message: `Acceso gratuito ${verb} ${email}` });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}
