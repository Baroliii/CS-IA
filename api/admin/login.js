const crypto = require('crypto');
const { db, makeToken } = require('../_lib');
 
const MAX_FAILS = 5, LOCK_MINUTES = 15;
 
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)
      return res.status(500).json({ error: 'Server not configured: ADMIN_PASSWORD or SESSION_SECRET is missing in Vercel' });
 
    // Rate limit per IP address: 5 wrong passwords -> locked out for 15 minutes
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = encodeURIComponent(ip);
    const row = (await db('/login_attempts?ip=eq.' + key))[0];
    if (row && row.locked_until && new Date(row.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(row.locked_until) - Date.now()) / 60000);
      return res.status(429).json({ error: `Too many attempts. Try again in ${mins} minute(s).` });
    }
 
    const a = Buffer.from(String((req.body || {}).password || ''));
    const b = Buffer.from(process.env.ADMIN_PASSWORD);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      const fails = (row && !row.locked_until ? row.fails : 0) + 1;
      const lock = fails >= MAX_FAILS;
      await db('/login_attempts', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ ip, fails: lock ? 0 : fails, locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null }),
      });
      return res.status(401).json({ error: lock ? `Too many attempts. Locked for ${LOCK_MINUTES} minutes.` : 'Wrong password' });
    }
 
    if (row) await db('/login_attempts?ip=eq.' + key, { method: 'DELETE' });
    res.setHeader('Set-Cookie', `vd_admin=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Login error: ' + e.message });
  }
};
 
