const auth = require('../middleware/auth');
exports.login = (req, res) => {
  if (!auth.passwordOk(req.body.password)) return res.status(401).json({ error: 'Wrong password' });
  auth.createSession(res); res.json({ ok: true });
};
exports.logout = (req, res) => { auth.destroySession(req, res); res.json({ ok: true }); };
exports.me = (req, res) => res.json({ admin: auth.isAdmin(req) });
