// Admin-only CRUD for news and sponsors (?type=news|sponsors)
const { db, isAdmin } = require('../_lib');
const TIERS = ['Title Partner', 'Principal Partners', 'Technical Partners'];
const TYPES = {
  news: { order: 'created_at.desc', required: ['title'],
    fields: { tag: s => s.slice(0, 30), title: s => s.slice(0, 160), date_label: s => s.slice(0, 30) } },
  sponsors: { order: 'sort.asc,created_at.asc', required: ['name', 'tier'],
    fields: { name: s => s.slice(0, 60), tier: s => { if (!TIERS.includes(s)) throw new Error('Bad tier'); return s; } } },
};

module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Not logged in' });
  try {
    const type = req.query.type, T = TYPES[type];
    if (!T) throw new Error('Unknown type');
    const id = req.query.id && encodeURIComponent(req.query.id);
    const clean = (b = {}) => {
      const p = {};
      for (const [k, f] of Object.entries(T.fields)) if (b[k] !== undefined) p[k] = f(String(b[k]).trim());
      if (b.active !== undefined) p.active = !!b.active;
      for (const k of T.required) if (k in p && !p[k]) throw new Error(k + ' is required');
      return p;
    };
    if (req.method === 'GET') return res.json(await db(`/${type}?order=${T.order}`));
    if (req.method === 'POST') {
      const p = clean(req.body);
      for (const k of T.required) if (!p[k]) throw new Error(k + ' is required');
      p.id = type[0] + Date.now().toString(36);
      if (type === 'sponsors') p.sort = Math.floor(Date.now() / 1000);
      return res.json((await db('/' + type, { method: 'POST', body: JSON.stringify(p) }))[0]);
    }
    if (req.method === 'PATCH' && id) return res.json((await db(`/${type}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(clean(req.body)) }))[0]);
    if (req.method === 'DELETE' && id) { await db(`/${type}?id=eq.${id}`, { method: 'DELETE' }); return res.json({ ok: true }); }
    res.status(405).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
};
