const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { settings } = require('../models/db');

// PUBLIC: customer places an order and submits GCash/Maya reference number
exports.create = (req, res) => {
  const { name, phone, address, method, reference, items } = req.body;
  if (!name || !phone || !address) return res.status(400).json({ error: 'Name, phone and address are required' });
  if (!['gcash', 'maya'].includes(method)) return res.status(400).json({ error: 'Choose GCash or Maya' });
  if (!reference || String(reference).trim().length < 6) return res.status(400).json({ error: 'Enter the payment reference number' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart is empty' });

  let total = 0; const lines = [];
  for (const it of items) {
    const p = Product.find(it.id); const qty = Math.floor(Number(it.qty));
    if (!p || !(qty > 0)) return res.status(400).json({ error: 'Invalid item in cart' });
    if (p.stock < qty) return res.status(400).json({ error: `Not enough stock for ${p.name}` });
    lines.push({ id: p.id, name: p.name, price: p.price, qty }); total += p.price * qty; // price from server, never from client
  }
  const order = Order.create({ name: String(name).trim(), phone: String(phone).trim(), address: String(address).trim(),
    method, reference: String(reference).trim(), items: lines, total, status: 'pending', createdAt: new Date().toISOString() });
  res.status(201).json({ id: order.id, total: order.total, status: order.status });
};

// PUBLIC: customer checks order status by id + phone
exports.track = (req, res) => {
  const o = Order.find(req.params.id);
  if (!o || o.phone !== String(req.query.phone || '').trim()) return res.status(404).json({ error: 'Order not found' });
  res.json({ id: o.id, status: o.status, total: o.total });
};

// ADMIN
exports.list = (req, res) => res.json(Order.all().slice().reverse());
exports.setStatus = (req, res) => {
  const o = Order.find(req.params.id); if (!o) return res.status(404).json({ error: 'Not found' });
  const next = req.body.status;
  if (!['pending', 'verified', 'rejected'].includes(next)) return res.status(400).json({ error: 'Bad status' });
  if (next === 'verified' && o.status !== 'verified') {          // deduct stock once, on verification
    for (const l of o.items) { const p = Product.find(l.id); if (p && p.stock < l.qty) return res.status(400).json({ error: `Not enough stock: ${l.name}` }); }
    o.items.forEach(l => { const p = Product.find(l.id); if (p) Product.update(p.id, { stock: p.stock - l.qty }); });
  }
  res.json(Order.update(o.id, { status: next }));
};
exports.remove = (req, res) => Order.remove(req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: 'Not found' });

// Payment accounts (GCash / Maya)
exports.getPayment = (req, res) => res.json(settings.get());
exports.setPayment = (req, res) => {
  const { gcash, maya } = req.body;
  res.json(settings.set({
    gcash: { name: String(gcash?.name || ''), number: String(gcash?.number || '') },
    maya: { name: String(maya?.name || ''), number: String(maya?.number || '') } }));
};
