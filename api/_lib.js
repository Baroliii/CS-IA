
// Shared helpers (the leading underscore stops Vercel exposing this as a route)
const crypto = require('crypto');
const KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
// Tolerate a pasted URL with a trailing slash or '/rest/v1' on the end
const BASE = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
 
async function db(path, opts = {}) {
  const r = await fetch(BASE + '/rest/v1' + path, {
    ...opts,
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(t);
  return t ? JSON.parse(t) : null;
}
 
const sign = v => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(v).digest('hex');
 
// Session token = expiry timestamp + HMAC signature. Can't be forged without SESSION_SECRET.
function makeToken() { const exp = Date.now() + 8 * 3600 * 1000; return exp + '.' + sign(String(exp)); }
 
function isAdmin(req) {
  const m = (req.headers.cookie || '').match(/vd_admin=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
 
module.exports = { db, makeToken, isAdmin };
 
