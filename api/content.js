// Public: news and sponsors shown on the home page
const { db } = require('./_lib');
module.exports = async (req, res) => {
  try {
    const [news, sponsors] = await Promise.all([
      db('/news?active=eq.true&order=created_at.desc'),
      db('/sponsors?active=eq.true&order=sort.asc,created_at.asc'),
    ]);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ news, sponsors });
  } catch (e) { res.status(500).json({ error: 'Could not load content' }); }
};
