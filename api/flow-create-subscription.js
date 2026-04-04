// POST /api/flow-create-subscription
// Body: { userId, email, name }
// Returns: { url } — Flow hosted payment URL

import crypto from 'crypto';

const FLOW_API = 'https://www.flow.cl/api';
const PLAN_ID  = 'Universidad v1 - MES';

function sign(params, secret) {
  const str = Object.keys(params).sort().map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

async function flowPost(path, params) {
  const apiKey    = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const all = { ...params, apiKey };
  all.s = sign(all, secretKey);
  const res = await fetch(`${FLOW_API}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams(all).toString(),
  });
  return res.json();
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
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, email, name } = req.body ?? {};
  if (!userId || !email) return res.status(400).json({ error: 'userId y email son requeridos' });

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (req.headers.origin || 'https://universidadv1.vercel.app');

  try {
    let customerId;
    const customerRes = await flowPost('/customer/create', {
      name:       name || email.split('@')[0],
      email,
      externalId: userId,
    });

    if (customerRes.customerId) {
      customerId = customerRes.customerId;
    } else if (customerRes.code === 'F001') {
      const existing = await flowGet('/customer/getByExternalId', { externalId: userId });
      customerId = existing.customerId;
    } else {
      throw new Error(customerRes.message || 'Error al crear cliente en Flow');
    }

    if (!customerId) throw new Error('No se pudo obtener customerId de Flow');

    const subRes = await flowPost('/subscription/create', {
      planId:          PLAN_ID,
      customerId,
      urlConfirmation: `${baseUrl}/api/flow-webhook`,
      urlReturn:       `${baseUrl}/checkout/success`,
    });

    if (!subRes.url) throw new Error(subRes.message || 'Flow no devolvió URL de pago');

    return res.status(200).json({ url: subRes.url });
  } catch (err) {
    console.error('Flow create-subscription error:', err);
    return res.status(500).json({ error: err.message });
  }
}
