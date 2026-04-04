// POST /api/stripe-create-checkout
// Body: { userId, email, returnUrl }
// Returns: { url } — Stripe hosted checkout URL

const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, email, returnUrl } = req.body ?? {};

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email are required' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return res.status(500).json({ error: 'STRIPE_PRICE_ID not configured' });
  }

  try {
    const baseUrl = returnUrl || process.env.VITE_APP_URL || 'https://universidadv1.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      customer_email:       email,
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      metadata: {
        supabase_user_id: userId,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/checkout/cancelled`,
      locale:      'es-419',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
};
