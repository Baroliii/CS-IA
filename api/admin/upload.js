// Admin-only: receives a (client-resized) JPEG as base64 and stores it in Supabase Storage
const crypto = require('crypto');
const { isAdmin, BASE } = require('../_lib');
const KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
 
module.exports = async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Not logged in' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec((req.body || {}).data || '');
    if (!m) throw new Error('Image must be a JPEG');
    const buf = Buffer.from(m[1], 'base64');
    if (buf.length > 3 * 1024 * 1024) throw new Error('Image too large (max 3 MB)');
    if (buf[0] !== 0xFF || buf[1] !== 0xD8) throw new Error('Not a valid JPEG');   // check real file signature
    const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.jpg';
    const r = await fetch(`${BASE}/storage/v1/object/product-images/${name}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'image/jpeg' },
      body: buf,
    });
    if (!r.ok) throw new Error('Upload failed: ' + (await r.text()));
    res.json({ url: `${BASE}/storage/v1/object/public/product-images/${name}` });
  } catch (e) { res.status(400).json({ error: e.message }); }
};
 
