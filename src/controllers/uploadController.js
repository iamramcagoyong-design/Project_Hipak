const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

exports.image = (req, res) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(req.body.data || '');
  if (!m) return res.status(400).json({ error: 'Only JPG, PNG or WEBP images are allowed' });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image too large (max 5MB)' });
  fs.mkdirSync(DIR, { recursive: true });
  const name = crypto.randomBytes(8).toString('hex') + '.' + EXT[m[1]];
  fs.writeFileSync(path.join(DIR, name), buf);
  res.status(201).json({ url: '/uploads/' + name });
};
