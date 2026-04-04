// GET /api/stripe-verify-session?session_id=...
// Verifies a Stripe checkout session is paid and updates Supabase profile.
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Supabase admin client (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const userId         = session.metadata?.supabase_user_id;
    const customerId     = session.customer;
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    if (!userId) {
      return res.status(400).json({ error: 'No user ID in session metadata' });
    }

    // Update profiles row
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status:    'active',
        stripe_customer_id:     customerId,
        stripe_subscription_id: subscriptionId,
        updated_at:             new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update subscription status' });
    }

    return res.status(200).json({ status: 'active' });
  } catch (err) {
    console.error('Verify session error:', err);
    return res.status(500).json({ error: err.message });
  }
};
