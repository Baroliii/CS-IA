// Public: list of active products for the shop page
const { db } = require('./_lib');
module.exports = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await db('/products?active=eq.true&order=sort.asc,created_at.asc'));
  } catch (e) { res.status(500).json({ error: 'Could not load products' }); }
};
