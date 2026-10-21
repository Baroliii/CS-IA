const crypto = require('crypto');
const { makeToken } = require('../_lib');
 
module.exports = (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)
      return res.status(500).json({ error: 'Server not configured: ADMIN_PASSWORD or SESSION_SECRET is missing in Vercel (add it, then redeploy)' });
 
    const a = Buffer.from(String((req.body || {}).password || ''));
    const b = Buffer.from(process.env.ADMIN_PASSWORD);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      return res.status(401).json({ error: 'Wrong password' });
 
    res.setHeader('Set-Cookie', `vd_admin=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Login error: ' + e.message });
  }
};
 
