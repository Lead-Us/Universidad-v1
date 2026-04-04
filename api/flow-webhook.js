// GET /api/flow-webhook?token=...
// Flow calls this URL (urlConfirmation) when a subscription payment is processed.
// Must return HTTP 200.

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
  const token = req.query.token || req.body?.token;
  if (!token) return res.status(200).end();

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const payment = await flowGet('/payment/getStatus', { token });

    if (payment.status === 2) {
      const userId     = payment.commerceOrder;
      const customerId = payment.customerId ?? null;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { subscription_status: 'active', flow_customer_id: customerId },
      });
    } else if (payment.status === 5 || payment.status === 12) {
      const userId = payment.commerceOrder;
      if (userId) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { subscription_status: 'cancelled' },
        });
      }
    }
  } catch (err) {
    console.error('Flow webhook error:', err);
  }

  return res.status(200).end();
}
