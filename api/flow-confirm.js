// GET /api/flow-confirm?token=...
// Verifies a Flow subscription payment token and updates Supabase profile.

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const FLOW_API = 'https://www.flow.cl/api';

function sign(params, secret) {
  const str = Object.keys(params).sort().map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

async function flowGet(path, params) {
  const apiKey    = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const all = { ...params, apiKey };
  all.s = sign(all, secretKey);
  const qs  = new URLSearchParams(all).toString();
  const res = await fetch(`${FLOW_API}${path}?${qs}`);
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token requerido' });

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const payment = await flowGet('/payment/getStatus', { token });

    if (payment.status !== 2) {
      return res.status(402).json({ error: 'Pago no completado', flowStatus: payment.status });
    }

    const userId     = payment.commerceOrder;
    const customerId = payment.customerId ?? null;

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { subscription_status: 'active', flow_customer_id: customerId },
    });

    // Also try profiles table (works after schema migration)
    supabaseAdmin.from('profiles').update({
      subscription_status: 'active',
      updated_at:          new Date().toISOString(),
    }).eq('id', userId).then(() => {}).catch(() => {});

    return res.status(200).json({ status: 'active' });
  } catch (err) {
    console.error('Flow confirm error:', err);
    return res.status(500).json({ error: err.message });
  }
}
