const $ = id => document.getElementById(id);
const peso = n => '\u20B1' + Number(n).toLocaleString();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let products = [], editId = null;

function toast(m) { const t = $('toast'); t.textContent = m; t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 2800); }
async function api(url, method = 'GET', body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const d = await r.json();
  if (r.status === 401 && url !== '/api/admin/login') { $('loginBox').classList.add('open'); throw new Error(d.error); }
  if (!r.ok) throw new Error(d.error || 'Error'); return d;
}
const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message); } };

// ---- Auth ----
$('loginBtn').onclick = async () => {
  try { await api('/api/admin/login', 'POST', { password: $('pw').value }); $('pw').value = ''; $('loginErr').textContent = ''; $('loginBox').classList.remove('open'); init(); }
  catch (e) { $('loginErr').textContent = e.message; }
};
$('pw').onkeydown = e => { if (e.key === 'Enter') $('loginBtn').click(); };
$('logout').onclick = async () => { await api('/api/admin/logout', 'POST'); location.reload(); };

// ---- Tabs ----
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button,.panel').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); $(b.dataset.tab).classList.add('on');
});

// ---- Products CRUD ----
async function loadProducts() {
  products = await api('/api/products');
  $('prodRows').innerHTML = products.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${peso(p.price)}</td><td>${p.stock}</td>
    <td class="acts"><button class="sm" data-edit="${p.id}">Edit</button><button class="sm danger" data-del="${p.id}">Delete</button></td></tr>`).join('');
}
function setPrev(u) { const i = $('fPrev'); i.src = u || ''; i.style.display = u ? 'block' : 'none'; }
function resize(file) {   // shrink to max 800px JPEG before upload
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => no(new Error('Cannot read that image'));
    img.src = URL.createObjectURL(file);
  });
}
$('fFile').onchange = guard(async () => {
  const f = $('fFile').files[0]; if (!f) return;
  const r = await api('/api/upload', 'POST', { data: await resize(f) });
  $('fImg').value = r.url; setPrev(r.url); toast('Photo uploaded');
});
function clearForm() { editId = null; ['fName', 'fCat', 'fPrice', 'fStock', 'fImg', 'fDesc'].forEach(i => $(i).value = ''); $('formTitle').textContent = 'Add product'; $('fFile').value = ''; setPrev(''); }
$('cancelEdit').onclick = clearForm;
$('saveProd').onclick = guard(async () => {
  const body = { name: $('fName').value, category: $('fCat').value, price: $('fPrice').value, stock: $('fStock').value, image: $('fImg').value, description: $('fDesc').value };
  editId ? await api('/api/products/' + editId, 'PUT', body) : await api('/api/products', 'POST', body);
  toast('Saved'); clearForm(); loadProducts();
});
$('prodRows').onclick = guard(async e => {
  if (e.target.dataset.edit) {
    const p = products.find(x => x.id == e.target.dataset.edit); editId = p.id;
    $('fName').value = p.name; $('fCat').value = p.category; $('fPrice').value = p.price; $('fStock').value = p.stock; $('fImg').value = p.image; setPrev(p.image); $('fFile').value = ''; $('fDesc').value = p.description;
    $('formTitle').textContent = 'Edit product #' + p.id; scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (e.target.dataset.del && confirm('Delete this product?')) { await api('/api/products/' + e.target.dataset.del, 'DELETE'); loadProducts(); }
});

// ---- Orders: verify payments ----
async function loadOrders() {
  const orders = await api('/api/orders');
  $('orderRows').innerHTML = orders.map(o => `<tr><td>${o.id}<br><small>${new Date(o.createdAt).toLocaleString()}</small></td>
    <td>${esc(o.name)}<br>${esc(o.phone)}<br><small>${esc(o.address)}</small></td>
    <td>${o.items.map(i => `${esc(i.name)} x${i.qty}`).join('<br>')}<br><b>${peso(o.total)}</b></td>
    <td>${o.method === 'gcash' ? 'GCash' : 'Maya'}<br>Ref: <b>${esc(o.reference)}</b></td>
    <td><span class="badge ${o.status}">${o.status}</span></td>
    <td class="acts">${o.status !== 'verified' ? `<button class="sm ok" data-st="verified" data-id="${o.id}">Verify</button>` : ''}
    ${o.status === 'pending' ? `<button class="sm danger" data-st="rejected" data-id="${o.id}">Reject</button>` : ''}
    <button class="sm ghost" data-delo="${o.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="6">No orders yet.</td></tr>';
}
$('orderRows').onclick = guard(async e => {
  const d = e.target.dataset;
  if (d.st) { await api(`/api/orders/${d.id}/status`, 'PUT', { status: d.st }); toast('Order ' + d.st); loadOrders(); loadProducts(); }
  if (d.delo && confirm('Delete this order?')) { await api('/api/orders/' + d.delo, 'DELETE'); loadOrders(); }
});

// ---- Payment accounts ----
async function loadPay() {
  const s = await api('/api/payment');
  $('gName').value = s.gcash.name; $('gNum').value = s.gcash.number; $('mName').value = s.maya.name; $('mNum').value = s.maya.number;
}
$('savePay').onclick = guard(async () => {
  await api('/api/payment', 'PUT', { gcash: { name: $('gName').value, number: $('gNum').value }, maya: { name: $('mName').value, number: $('mNum').value } });
  toast('Payment accounts saved');
});

function init() { loadProducts(); loadOrders(); loadPay(); }
(async () => { const me = await api('/api/admin/me'); if (me.admin) { $('loginBox').classList.remove('open'); init(); } })();
