const crypto = require('crypto');
const { ADMIN_PASSWORD, SESSION_HOURS } = require('../../config');
const sessions = new Map(); // token -> expiry

function readCookie(req, name) {
  const m = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return m ? decodeURIComponent(m.split('=')[1]) : null;
}
function passwordOk(input) {
  const a = crypto.createHash('sha256').update(String(input)).digest();
  const b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}
function createSession(res) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_HOURS * 3600e3);
  res.setHeader('Set-Cookie', `pd_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`);
}
function destroySession(req, res) {
  sessions.delete(readCookie(req, 'pd_admin'));
  res.setHeader('Set-Cookie', 'pd_admin=; HttpOnly; Path=/; Max-Age=0');
}
function isAdmin(req) {
  const exp = sessions.get(readCookie(req, 'pd_admin'));
  return !!exp && exp > Date.now();
}
function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Admin login required' });
}
module.exports = { passwordOk, createSession, destroySession, isAdmin, requireAdmin };
