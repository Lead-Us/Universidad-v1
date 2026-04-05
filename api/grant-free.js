// POST /api/grant-free
// Body: { email }  — grants free subscription to the target user
// Protected: caller must be the ADMIN_EMAIL
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'Email requerido.' });

  // Verify caller is admin
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autenticado.' });

  const SUPABASE_URL          = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_EMAIL           = process.env.ADMIN_EMAIL;

  if (!SERVICE_ROLE_KEY || !ADMIN_EMAIL) {
    return res.status(500).json({ error: 'Servidor no configurado. Agrega SUPABASE_SERVICE_ROLE_KEY y ADMIN_EMAIL en Vercel.' });
  }

  // Admin client (service role)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the calling user via JWT
  const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller) return res.status(401).json({ error: 'Token inválido.' });
  if (caller.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Solo el administrador puede otorgar acceso gratuito.' });
  }

  // Find target user by email in auth.users
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return res.status(500).json({ error: listErr.message });

  const target = users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
  if (!target) {
    return res.status(404).json({ error: `No se encontró un usuario con ese correo. Pídele que cree su cuenta primero.` });
  }

  // Update profiles row
  const { error: updateErr } = await admin
    .from('profiles')
    .update({ subscription_status: 'free' })
    .eq('id', target.id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  return res.status(200).json({ ok: true, message: `✓ Acceso gratuito otorgado a ${email}` });
}
