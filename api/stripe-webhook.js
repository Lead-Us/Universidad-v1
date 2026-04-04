// POST /api/stripe-webhook
// Stripe sends events here. Verifies signature and updates Supabase.
// Add this URL in Stripe Dashboard → Webhooks.
// Events to listen for: checkout.session.completed, customer.subscription.deleted

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Required to read raw body for signature verification
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Collect raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers['stripe-signature'],
      webhookSecret,
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      const userId         = session.metadata?.supabase_user_id;
      const customerId     = session.customer;
      const subscriptionId = session.subscription;
      if (userId) {
        await supabaseAdmin.from('profiles').update({
          subscription_status:    'active',
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
          updated_at:             new Date().toISOString(),
        }).eq('id', userId);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId   = subscription.customer;
    await supabaseAdmin.from('profiles').update({
      subscription_status: 'cancelled',
      updated_at:          new Date().toISOString(),
    }).eq('stripe_customer_id', customerId);
  }

  return res.status(200).json({ received: true });
};
