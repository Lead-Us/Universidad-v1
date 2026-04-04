// GET /api/flow-webhook?token=...
// Flow calls this URL (urlConfirmation) when a subscription payment is processed.
// Must return HTTP 200. Updates Supabase subscription_status.
// Env vars: FLOW_API_KEY, FLOW_SECRET_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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

module.exports = async function handler(req, res) {
  // Flow sends GET for subscription confirmations
  const token = req.query.token || req.body?.token;
  if (!token) return res.status(200).end(); // Always return 200 to Flow

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const payment = await flowGet('/payment/getStatus', { token });

    if (payment.status === 2) {
      // Paid — activate via app_metadata (works without schema migration)
      const userId     = payment.commerceOrder;
      const customerId = payment.customerId ?? null;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { subscription_status: 'active', flow_customer_id: customerId },
      });
    } else if (payment.status === 5 || payment.status === 12) {
      // Reversed or cancelled — deactivate
      const userId = payment.commerceOrder;
      if (userId) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { subscription_status: 'cancelled' },
        });
      }
    }
  } catch (err) {
    console.error('Flow webhook error:', err);
    // Still return 200 so Flow doesn't retry indefinitely
  }

  return res.status(200).end();
};
