// Public: news, sponsors, team and section images shown on the home page
const { db } = require('./_lib');
module.exports = async (req, res) => {
  try {
    const [news, sponsors, team, images] = await Promise.all([
      db('/news?active=eq.true&order=created_at.desc'),
      db('/sponsors?active=eq.true&order=sort.asc,created_at.asc'),
      db('/team?active=eq.true&order=sort.asc,created_at.asc'),
      db('/site_images?select=key,image_url'),
    ]);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ news, sponsors, team, images });
  } catch (e) { res.status(500).json({ error: 'Could not load content' }); }
};
 
