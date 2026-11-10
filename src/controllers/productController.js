const Product = require('../models/productModel');

function clean(b) {
  const price = Number(b.price), stock = Number(b.stock);
  if (!b.name || !String(b.name).trim() || !(price >= 0) || !(stock >= 0)) return null;
  return { name: String(b.name).trim(), category: String(b.category || 'Other').trim(),
    price, stock: Math.floor(stock), image: String(b.image || '').trim(), description: String(b.description || '').trim() };
}
exports.list = (req, res) => res.json(Product.all());
exports.create = (req, res) => {
  const d = clean(req.body); if (!d) return res.status(400).json({ error: 'Invalid product data' });
  res.status(201).json(Product.create(d));
};
exports.update = (req, res) => {
  const d = clean(req.body); if (!d) return res.status(400).json({ error: 'Invalid product data' });
  const p = Product.update(req.params.id, d);
  p ? res.json(p) : res.status(404).json({ error: 'Not found' });
};
exports.remove = (req, res) =>
  Product.remove(req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found' });
