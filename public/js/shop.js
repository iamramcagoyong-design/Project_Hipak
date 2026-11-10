const $ = id => document.getElementById(id);
const peso = n => '\u20B1' + Number(n).toLocaleString();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let products = [], cart = {}, pay = {};

function toast(m) { const t = $('toast'); t.textContent = m; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 3200); }
async function api(url, opt) {
  const r = await fetch(url, opt && { headers: { 'Content-Type': 'application/json' }, ...opt });
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Error'); return d;
}

// ---- Age gate (no login) ----
if (localStorage.getItem('pd_18') !== 'yes') $('ageGate').classList.add('open');
$('ageYes').onclick = () => { localStorage.setItem('pd_18', 'yes'); $('ageGate').classList.remove('open'); };
$('ageNo').onclick = () => { location.href = 'https://www.google.com'; };

// ---- Products ----
async function load() {
  products = await api('/api/products'); pay = await api('/api/payment');
  $('products').innerHTML = products.length ? products.map(p => `
    <div class="card"><div class="img">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : '\uD83D\uDCA8'}</div>
    <div class="body"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3>
    <small>${esc(p.description)}</small><div class="price">${peso(p.price)}</div>
    <small>${p.stock > 0 ? p.stock + ' in stock' : 'Out of stock'}</small>
    <button data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Add to cart</button></div></div>`).join('')
    : '<p>No products yet.</p>';
}
$('products').onclick = e => {
  const id = e.target.dataset.add; if (!id) return;
  const p = products.find(x => x.id == id); cart[id] = Math.min((cart[id] || 0) + 1, p.stock);
  renderCart(); toast('Added to cart');
};

// ---- Cart ----
function renderCart() {
  const ids = Object.keys(cart); let total = 0;
  $('cartCount').textContent = ids.reduce((s, i) => s + cart[i], 0);
  $('cartLines').innerHTML = ids.length ? ids.map(i => {
    const p = products.find(x => x.id == i); total += p.price * cart[i];
    return `<div class="cartline"><span>${esc(p.name)} x${cart[i]}</span><span>${peso(p.price * cart[i])} <button class="sm danger" data-rm="${i}">x</button></span></div>`;
  }).join('') : '<p>Cart is empty.</p>';
  $('cartTotal').textContent = peso(total); showPay();
}
function showPay() {
  const m = document.querySelector('input[name=pm]:checked').value, a = pay[m] || {};
  $('payInfo').innerHTML = `Send <b>${$('cartTotal').textContent}</b> to <b>${m === 'gcash' ? 'GCash' : 'Maya'}</b>:<br>${esc(a.name)} - <b>${esc(a.number)}</b><br>Then type the reference number from your receipt below.`;
}
document.querySelectorAll('input[name=pm]').forEach(r => r.onchange = showPay);
$('cartLines').onclick = e => { if (e.target.dataset.rm) { delete cart[e.target.dataset.rm]; renderCart(); } };
$('openCart').onclick = () => { renderCart(); $('cartModal').classList.add('open'); };
$('closeCart').onclick = () => $('cartModal').classList.remove('open');

$('placeOrder').onclick = async () => {
  try {
    const o = await api('/api/orders', { method: 'POST', body: JSON.stringify({
      name: $('cName').value, phone: $('cPhone').value, address: $('cAddr').value,
      method: document.querySelector('input[name=pm]:checked').value, reference: $('cRef').value,
      items: Object.keys(cart).map(id => ({ id: Number(id), qty: cart[id] })) }) });
    cart = {}; renderCart(); $('cartModal').classList.remove('open');
    alert(`Order #${o.id} received (${peso(o.total)}).\nWe will verify your payment. Track it with Order # ${o.id} and your phone number.`);
    load();
  } catch (e) { toast(e.message); }
};

$('trBtn').onclick = async () => {
  try { const o = await api(`/api/orders/${$('trId').value}/track?phone=${encodeURIComponent($('trPhone').value)}`);
    $('trOut').innerHTML = `Order #${o.id}: <span class="badge ${o.status}">${o.status}</span>`; }
  catch (e) { $('trOut').textContent = e.message; }
};
load();
