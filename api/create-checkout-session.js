// Creates a Stripe Checkout Session. Prices come from the database (the same
// table the admin edits), never from the browser.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('./_lib');
 
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  try {
    const { items } = req.body;
    const origin = req.headers.origin || process.env.SITE_URL;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
 
    const ids = items.map(i => encodeURIComponent(String(i.id))).join(',');
    const rows = await db(`/products?active=eq.true&id=in.(${ids})`);
    const byId = Object.fromEntries(rows.map(r => [r.id, r]));
 
    const line_items = items.map(({ id, qty }) => {
      const p = byId[id];
      if (!p || p.stock_status === 'Sold Out') throw new Error('An item in your cart is no longer available');
      // Stripe needs a full https URL for the product photo
      const img = p.image_url && (p.image_url.startsWith('http') ? p.image_url : `${origin}/${p.image_url}`);
      return {
        quantity: Math.max(1, Math.min(50, parseInt(qty, 10) || 1)),
        // unit_amount is in cents (price_pence is the column's historic name)
        price_data: { currency: 'eur', unit_amount: p.price_pence, product_data: { name: p.name, ...(img ? { images: [img] } : {}) } },
      };
    });
 
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'BE', 'NL', 'PT', 'IE', 'GB', 'CH', 'US'] },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
 
