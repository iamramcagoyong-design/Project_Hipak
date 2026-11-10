// Tiny JSON-file database (no native modules, runs anywhere).
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DIR, 'db.json');
fs.mkdirSync(DIR, { recursive: true });

const defaults = {
  products: [
    { id: 1, name: 'Purple Haze Pod Kit', category: 'Device', price: 899, stock: 15, image: '', description: 'Compact pod starter kit.' },
    { id: 2, name: 'Grape Ice 30ml', category: 'E-Juice', price: 350, stock: 40, image: '', description: 'Cold grape, smooth hit.' },
    { id: 3, name: 'Mango Orange 30ml', category: 'E-Juice', price: 350, stock: 25, image: '', description: 'Sweet mango with citrus finish.' }
  ],
  orders: [],
  settings: {
    gcash: { name: 'Puffin Dose', number: '09452117917' },
    maya: { name: 'Puffin Dose', number: '09857938596' }
  },
  seq: { products: 3, orders: 0 }
};

let data;
function load() {
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { data = JSON.parse(JSON.stringify(defaults)); save(); }
}
function save() { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); }
load();

function collection(name) {
  return {
    all: () => data[name],
    find: id => data[name].find(r => r.id === Number(id)),
    create(rec) { rec.id = ++data.seq[name]; data[name].push(rec); save(); return rec; },
    update(id, patch) {
      const r = this.find(id); if (!r) return null;
      Object.assign(r, patch, { id: r.id }); save(); return r;
    },
    remove(id) {
      const i = data[name].findIndex(r => r.id === Number(id));
      if (i < 0) return false; data[name].splice(i, 1); save(); return true;
    }
  };
}
const settings = { get: () => data.settings, set(v) { data.settings = v; save(); return v; } };
module.exports = { collection, settings };
