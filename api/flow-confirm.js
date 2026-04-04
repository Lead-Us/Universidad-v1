// GET /api/flow-confirm?token=...
// Verifies a Flow subscription payment token and updates Supabase profile.
// Called from the success page to confirm the subscription is active.
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
  if (req.method !== 'GET') return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token requerido' });

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    // Verify payment status with Flow
    const payment = await flowGet('/payment/getStatus', { token });

    // Flow status 2 = paid
    if (payment.status !== 2) {
      return res.status(402).json({ error: 'Pago no completado', flowStatus: payment.status });
    }

    // The commerceOrder contains our userId (set during subscription creation)
    // Flow also sends subscription info; we match by email via customerId
    // We look up the profile by flow_customer_id if available, else fall back to commerceOrder
    const customerId = payment.customerId ?? null;

    let updateQuery = supabaseAdmin.from('profiles').update({
      subscription_status:   'active',
      flow_customer_id:      customerId || null,
      flow_subscription_id:  payment.subscriptionId || null,
      updated_at:            new Date().toISOString(),
    });

    if (customerId) {
      // Match by Flow customer ID
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('flow_customer_id', customerId)
        .limit(1);

      if (profiles?.length) {
        await updateQuery.eq('flow_customer_id', customerId);
      } else {
        // Fallback: externalId = userId was set during customer creation
        await updateQuery.eq('id', payment.commerceOrder);
      }
    } else {
      await updateQuery.eq('id', payment.commerceOrder);
    }

    return res.status(200).json({ status: 'active' });
  } catch (err) {
    console.error('Flow confirm error:', err);
    return res.status(500).json({ error: err.message });
  }
};
