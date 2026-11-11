// Admin-only editing of news, sponsors, team and site images (?type=...)
const { db, isAdmin, BASE } = require('../_lib');
const TIERS = ['Title Partner', 'Principal Partners', 'Technical Partners'];
 
// images may come from Supabase Storage (admin uploads) or the repo's images/ folder
const img = s => {
  if (s && !(s.startsWith(BASE + '/storage/v1/object/public/product-images/') || s.startsWith('images/')))
    throw new Error('Bad image URL');
  return s || null;
};
const TYPES = {
  news: { order: 'created_at.desc', required: ['title'],
    fields: { tag: s => s.slice(0, 30), title: s => s.slice(0, 160), date_label: s => s.slice(0, 30), image_url: img } },
  sponsors: { order: 'sort.asc,created_at.asc', required: ['name', 'tier'], sorted: true,
    fields: { name: s => s.slice(0, 60), tier: s => { if (!TIERS.includes(s)) throw new Error('Bad tier'); return s; } } },
  team: { order: 'sort.asc,created_at.asc', required: ['name'], sorted: true,
    fields: { name: s => s.slice(0, 60), role: s => s.slice(0, 60), info: s => s.slice(0, 80), image_url: img } },
  // fixed set of slots (hero1-3, about): can be changed but not added or deleted
  site_images: { order: 'key.asc', required: [], fixed: true, fields: { image_url: img } },
};
 
module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Not logged in' });
  try {
    const type = req.query.type, T = TYPES[type];
    if (!T) throw new Error('Unknown type');
    const id = req.query.id && encodeURIComponent(req.query.id);
    const where = (T.fixed ? 'key=eq.' : 'id=eq.') + id;
    const clean = (b = {}) => {
      const p = {};
      for (const [k, f] of Object.entries(T.fields)) if (b[k] !== undefined) p[k] = f(String(b[k]).trim());
      if (b.active !== undefined && !T.fixed) p.active = !!b.active;
      for (const k of T.required) if (k in p && !p[k]) throw new Error(k + ' is required');
      return p;
    };
    if (req.method === 'GET') return res.json(await db(`/${type}?order=${T.order}`));
    if (req.method === 'POST' && !T.fixed) {
      const p = clean(req.body);
      for (const k of T.required) if (!p[k]) throw new Error(k + ' is required');
      p.id = type[0] + Date.now().toString(36);
      if (T.sorted) p.sort = Math.floor(Date.now() / 1000);   // new items go last
      return res.json((await db('/' + type, { method: 'POST', body: JSON.stringify(p) }))[0]);
    }
    if (req.method === 'PATCH' && id) return res.json((await db(`/${type}?${where}`, { method: 'PATCH', body: JSON.stringify(clean(req.body)) }))[0]);
    if (req.method === 'DELETE' && id && !T.fixed) { await db(`/${type}?${where}`, { method: 'DELETE' }); return res.json({ ok: true }); }
    res.status(405).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
};
 
