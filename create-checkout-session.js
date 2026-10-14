// Serverless function: creates a Stripe Checkout Session for the current cart.
// Deploy this whole folder to Vercel (or similar) — Vercel auto-detects
// anything under /api as a serverless function.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Server-side price list — the SOURCE OF TRUTH.
// The browser only ever sends product IDs + quantities; prices are looked up
// here so a customer can never tamper with the amount charged.
// Prices are in pence (GBP smallest unit): £22.00 -> 2200
const PRODUCTS = {
  p1: { name: 'Team Race Tee',        unit_amount: 2200 },
  p2: { name: 'Pit Crew Cap',         unit_amount: 1600 },
  p3: { name: 'VD-26 Team Jacket',    unit_amount: 5800 },
  p4: { name: 'Laptop Sticker Pack',  unit_amount: 600  },
  p5: { name: 'Steel Water Bottle',   unit_amount: 1400 },
  p6: { name: 'VD Lanyard',           unit_amount: 800  },
  p7: { name: 'Logo Sticker',         unit_amount: 300  },
  p8: { name: 'Race Weekend Hoodie',  unit_amount: 4500 },
};

module.exports = async (req, res) => {
  // Basic CORS (safe to leave open since this endpoint only creates a
  // Checkout Session — it never reads or exposes existing data)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body; // [{ id: 'p1', qty: 2 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const line_items = items.map(({ id, qty }) => {
      const product = PRODUCTS[id];
      if (!product) throw new Error(`Unknown product id: ${id}`);
      const quantity = Math.max(1, Math.min(50, parseInt(qty, 10) || 1));
      return {
        quantity,
        price_data: {
          currency: 'gbp',
          unit_amount: product.unit_amount,
          product_data: { name: product.name },
        },
      };
    });

    const origin = req.headers.origin || process.env.SITE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: { allowed_countries: ['GB', 'US', 'IE', 'FR', 'DE'] },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
