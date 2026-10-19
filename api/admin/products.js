// Admin-only CRUD. Every request must carry a valid signed session cookie.
const { db, isAdmin } = require('../_lib');
const CATS = ['Apparel', 'Accessories', 'Stickers'];
const STOCK = ['In Stock', 'Low Stock', 'Sold Out'];

// Validate everything server-side; never trust the browser.
function clean(b = {}) {
  const p = {};
  if (b.name !== undefined) p.name = String(b.name).trim().slice(0, 80);
  if (b.category !== undefined) { if (!CATS.includes(b.category)) throw new Error('Bad category'); p.category = b.category; }
  if (b.price_pence !== undefined) {
    const n = Math.round(Number(b.price_pence));
    if (!(n >= 50 && n <= 100000)) throw new Error('Price must be £0.50 to £1000');
    p.price_pence = n;
  }
  if (b.stock_status !== undefined) { if (!STOCK.includes(b.stock_status)) throw new Error('Bad stock status'); p.stock_status = b.stock_status; }
  if (b.active !== undefined) p.active = !!b.active;
  if (p.name === '') throw new Error('Name required');
  return p;
}

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Not logged in' });
  try {
    const id = req.query.id && encodeURIComponent(req.query.id);
    if (req.method === 'GET') return res.json(await db('/products?order=sort.asc,created_at.asc'));
    if (req.method === 'POST') {
      const p = clean(req.body);
      if (!p.name || p.price_pence === undefined || !p.category) throw new Error('Name, category and price required');
      p.id = 'p' + Date.now().toString(36);
      return res.json((await db('/products', { method: 'POST', body: JSON.stringify(p) }))[0]);
    }
    if (req.method === 'PATCH' && id) return res.json((await db('/products?id=eq.' + id, { method: 'PATCH', body: JSON.stringify(clean(req.body)) }))[0]);
    if (req.method === 'DELETE' && id) { await db('/products?id=eq.' + id, { method: 'DELETE' }); return res.json({ ok: true }); }
    res.status(405).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
};
