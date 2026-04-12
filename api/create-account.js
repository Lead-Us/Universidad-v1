// POST /api/create-account { email, password, name? }
// Creates a new Supabase auth user and sets subscription_status = 'free'
// Protected: caller must be ADMIN_EMAIL

import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url            = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [];
  if (!url)            missing.push('VITE_SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length)  throw { status: 500, error: `Variables faltantes: ${missing.join(', ')}` };
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(admin, token) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!ADMIN_EMAIL) throw { status: 500, error: 'ADMIN_EMAIL no configurada.' };
  if (!token)       throw { status: 401, error: 'No autenticado.' };
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) throw { status: 401, error: 'Token inválido.' };
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
    throw { status: 403, error: 'Solo el administrador puede realizar esta acción.' };
  return user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  const token = (req.headers.authorization ?? '').replace('Bearer ', '');

  let admin;
  try { admin = getAdminClient(); } catch (e) {
    return res.status(e.status ?? 500).json({ error: e.error ?? e.message });
  }
  try { await verifyAdmin(admin, token); } catch (e) {
    return res.status(e.status ?? 401).json({ error: e.error ?? e.message });
  }

  const { email, password, name = '' } = req.body ?? {};
  if (!email)    return res.status(400).json({ error: 'Email requerido.' });
  if (!password) return res.status(400).json({ error: 'Contraseña requerida.' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

  // Create the auth user (email confirmed automatically)
  const { data: { user }, error: createErr } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: name ? { name } : {},
  });

  if (createErr) {
    const msg = createErr.message?.includes('already registered')
      ? `Ya existe un usuario con el correo "${email}".`
      : createErr.message;
    return res.status(400).json({ error: msg });
  }

  // Set subscription_status = 'free' in profiles
  // (the trigger may have already created the profile row — upsert to be safe)
  const profilePayload = {
    id: user.id,
    subscription_status: 'free',
    ...(name ? { name } : {}),
  };
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profileErr) {
    // Account was created but profile update failed — log and continue
    console.error('profile upsert error:', profileErr.message);
  }

  return res.status(200).json({
    ok: true,
    message: `Cuenta creada para ${email} con acceso gratuito.`,
    userId: user.id,
  });
}
