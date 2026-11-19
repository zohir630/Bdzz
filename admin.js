const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tk = n => '৳' + Number(n || 0).toLocaleString('en-US');
let tab = 'products', D = { products: [], categories: [], banners: [], orders: [], settings: [] }, imgs = [], filter = '';

/* ---------- auth ---------- */
function loginView(msg) {
  $('#root').innerHTML = `<form class="login" onsubmit="doLogin(event)"><h2 style="margin-bottom:12px">bdzz Admin</h2>
  ${DB.useFB ? '' : '<p class="sm" style="margin-bottom:10px">ডেমো মোড: ডিফল্ট পাসওয়ার্ড <b>admin123</b> (Settings থেকে বদলান)।</p>'}
  ${msg ? `<p style="color:#dc2626;margin-bottom:8px">${esc(msg)}</p>` : ''}
  ${DB.useFB ? '<div class="fl">Email<input name="email" type="email" required></div>' : ''}
  <div class="fl">Password<input name="pw" type="password" required></div><button class="btn" style="width:100%">Login</button></form>`;
}
window.doLogin = async e => {
  e.preventDefault(); const f = new FormData(e.target);
  if (DB.useFB) { try { await DB.fauth.signInWithEmailAndPassword(f.get('email'), f.get('pw')); } catch (er) { loginView('Login failed: ' + er.message); } }
  else { if (f.get('pw') === (localStorage.getItem('bdzz_adminpw') || 'admin123')) { sessionStorage.setItem('bdzz_admin', '1'); start(); } else loginView('ভুল পাসওয়ার্ড'); }
};
window.logout = () => { if (DB.useFB) DB.fauth.signOut(); sessionStorage.removeItem('bdzz_admin'); loginView(); };

/* ---------- data ---------- */
async function load() {
  await DB.seedDemo();
  for (const k of Object.keys(D)) D[k] = await DB.list(k);
  D.orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
async function start() { await load(); render(); }
const cname = id => (D.categories.find(c => c.id === id) || {}).name || '—';

/* ---------- image resize -> data URL ---------- */
function shrink(file, max, q) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', q)); }; im.src = r.result; };
    r.readAsDataURL(file);
  });
}
const showPrev = () => { $('#prev').innerHTML = imgs.map((s, i) => `<div><img src="${s}"><b onclick="imgs.splice(${i},1);showPrev()">×</b></div>`).join(''); };
window.imgs = imgs; window.showPrev = showPrev;
window.pickImgs = async (inp, max, w, q) => {
  for (const f of inp.files) { if (imgs.length >= max) break; imgs.push(await shrink(f, w, q)); }
  inp.value = ''; showPrev();
};

/* ---------- layout ---------- */
const TABS = [['products', '📦 Products'], ['categories', '🗂️ Categories'], ['banners', '🖼️ Banners'], ['orders', '🧾 Orders'], ['settings', '⚙️ Settings']];
function render() {
  $('#root').innerHTML = `<div class="adm"><aside class="side"><h3>bdz<b>z</b> admin</h3>
  ${TABS.map(([k, l]) => `<a class="${tab === k ? 'on' : ''}" onclick="tab='${k}';filter='';render()">${l}</a>`).join('')}
  <a href="index.html" target="_blank">🌐 View shop</a><a onclick="logout()">🚪 Logout</a></aside><section class="mainA" id="pane"></section></div>`;
  ({ products: pProducts, categories: pCats, banners: pBanners, orders: pOrders, settings: pSettings })[tab]();
}
window.render = render; window.tab = tab;
Object.defineProperty(window, 'tab', { get: () => tab, set: v => tab = v });
Object.defineProperty(window, 'filter', { get: () => filter, set: v => filter = v });
const modal = html => { $('#mbody').innerHTML = html; $('#modal').classList.add('on'); };
window.closeM = () => $('#modal').classList.remove('on');
window.del = async (col, id) => { if (!confirm('Delete?')) return; await DB.remove(col, id); await load(); render(); };
const fl = (label, inner) => `<div class="fl">${label}${inner}</div>`;

/* ---------- products ---------- */
function pProducts() {
  const l = D.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
  $('#pane').innerHTML = `<h2>Products (${D.products.length})</h2><div class="bar"><button class="btn" onclick="editProduct()">+ Add product</button>
  <input placeholder="Search…" value="${esc(filter)}" oninput="filter=this.value;pProductsKeep()"></div>
  <div class="box" style="overflow:auto"><table class="t"><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th><th></th></tr>
  ${l.map(p => `<tr><td>${p.images?.[0] ? `<img class="thumb" src="${p.images[0]}">` : '<div class="thumb"></div>'}</td><td>${esc(p.name)}</td><td>${esc(cname(p.category))}</td>
  <td>${tk(p.price)}${p.oldPrice > p.price ? `<br><s class="sm">${tk(p.oldPrice)}</s>` : ''}</td><td>${p.stock ?? 0}</td><td>${p.sold ?? 0}</td>
  <td><span class="st">${p.active === false ? 'Hidden' : 'Live'}</span></td>
  <td><button class="btn alt sm2" onclick="editProduct('${p.id}')">Edit</button> <button class="btn red sm2" onclick="del('products','${p.id}')">Del</button></td></tr>`).join('') || '<tr><td colspan="8">No products</td></tr>'}</table></div>`;
}
window.pProductsKeep = () => { const v = filter; pProducts(); const i = $('.bar input'); i.focus(); i.setSelectionRange(v.length, v.length); };
window.editProduct = id => {
  const p = D.products.find(x => x.id === id) || { active: true, images: [], stock: 10 };
  imgs.length = 0; imgs.push(...(p.images || []));
  modal(`<h3 style="margin-bottom:12px">${id ? 'Edit' : 'Add'} product</h3><form onsubmit="saveProduct(event,'${id || ''}')">
  ${fl('Name', `<input name="name" required value="${esc(p.name)}">`)}
  <div class="g2">${fl('Category', `<select name="category" required><option value="">Select</option>${D.categories.map(c => `<option value="${c.id}" ${c.id === p.category ? 'selected' : ''}>${esc((c.parent ? '— ' : '') + c.name)}</option>`).join('')}</select>`)}
  ${fl('Price (৳)', `<input name="price" type="number" min="0" required value="${p.price ?? ''}">`)}
  ${fl('Old price (৳, for discount)', `<input name="oldPrice" type="number" min="0" value="${p.oldPrice || ''}">`)}
  ${fl('Stock', `<input name="stock" type="number" min="0" value="${p.stock ?? 0}">`)}
  ${fl('Sold count', `<input name="sold" type="number" min="0" value="${p.sold ?? 0}">`)}
  ${fl('Options (comma separated, e.g. 40,41,42)', `<input name="options" value="${esc(p.options || '')}">`)}</div>
  ${fl('Description', `<textarea name="desc" rows="4">${esc(p.desc || '')}</textarea>`)}
  ${fl('Images (max 4)', `<input type="file" accept="image/*" multiple onchange="pickImgs(this,4,700,.65)"><div class="prev" id="prev"></div>`)}
  <label><input type="checkbox" name="genuine" ${p.genuine ? 'checked' : ''}> Original / genuine badge</label><br>
  <label><input type="checkbox" name="active" ${p.active !== false ? 'checked' : ''}> Visible in shop</label>
  <p style="margin-top:14px;display:flex;gap:8px"><button class="btn">Save</button><button type="button" class="btn ghost" onclick="closeM()">Cancel</button></p></form>`);
  showPrev();
};
window.saveProduct = async (e, id) => {
  e.preventDefault(); const f = new FormData(e.target), old = D.products.find(x => x.id === id) || {};
  const o = { ...old, name: f.get('name'), category: f.get('category'), price: +f.get('price'), oldPrice: +f.get('oldPrice') || 0,
    stock: +f.get('stock'), sold: +f.get('sold'), options: f.get('options'), desc: f.get('desc'), images: [...imgs],
    genuine: !!f.get('genuine'), active: !!f.get('active'), updatedAt: Date.now() };
  if (id) o.id = id;
  try { await DB.save('products', o); } catch (er) { return alert('Save failed: ' + er.message + '\n(ছবি বড় হলে কম ছবি দিন)'); }
  closeM(); await load(); render();
};

/* ---------- categories ---------- */
function pCats() {
  $('#pane').innerHTML = `<h2>Categories</h2><div class="bar"><button class="btn" onclick="editCat()">+ Add category</button></div>
  <div class="box"><table class="t"><tr><th></th><th>Name</th><th>বাংলা</th><th>Parent</th><th>Order</th><th></th></tr>
  ${D.categories.sort((a, b) => (a.order || 0) - (b.order || 0)).map(c => `<tr><td>${c.image ? `<img class="thumb" src="${c.image}">` : ''}</td><td>${esc(c.name)}</td><td>${esc(c.nameBn || '')}</td><td>${esc(c.parent ? cname(c.parent) : '—')}</td><td>${c.order || 0}</td>
  <td><button class="btn alt sm2" onclick="editCat('${c.id}')">Edit</button> <button class="btn red sm2" onclick="del('categories','${c.id}')">Del</button></td></tr>`).join('')}</table></div>`;
}
window.editCat = id => {
  const c = D.categories.find(x => x.id === id) || {};
  imgs.length = 0; if (c.image) imgs.push(c.image);
  modal(`<h3 style="margin-bottom:12px">${id ? 'Edit' : 'Add'} category</h3><form onsubmit="saveCat(event,'${id || ''}')">
  <div class="g2">${fl('Name', `<input name="name" required value="${esc(c.name)}">`)}${fl('বাংলা নাম', `<input name="nameBn" value="${esc(c.nameBn || '')}">`)}
  ${fl('Parent category', `<select name="parent"><option value="">None (top level)</option>${D.categories.filter(x => !x.parent && x.id !== id).map(x => `<option value="${x.id}" ${x.id === c.parent ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`)}
  ${fl('Order', `<input name="order" type="number" value="${c.order || 0}">`)}</div>
  ${fl('Image (optional)', `<input type="file" accept="image/*" onchange="imgs.length=0;pickImgs(this,1,240,.7)"><div class="prev" id="prev"></div>`)}
  <p style="display:flex;gap:8px"><button class="btn">Save</button><button type="button" class="btn ghost" onclick="closeM()">Cancel</button></p></form>`);
  showPrev();
};
window.saveCat = async (e, id) => {
  e.preventDefault(); const f = new FormData(e.target), old = D.categories.find(x => x.id === id) || {};
  const o = { ...old, name: f.get('name'), nameBn: f.get('nameBn'), parent: f.get('parent'), order: +f.get('order'), image: imgs[0] || '' };
  o.id = id || (f.get('name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-3));
  await DB.save('categories', o); closeM(); await load(); render();
};

/* ---------- banners ---------- */
function pBanners() {
  $('#pane').innerHTML = `<h2>Home banners</h2><div class="bar"><button class="btn" onclick="editBanner()">+ Add banner</button></div>
  <div class="box"><table class="t"><tr><th>Image</th><th>Title</th><th>Link</th><th>Order</th><th></th></tr>
  ${D.banners.map(b => `<tr><td><img class="thumb" style="width:120px" src="${b.image}"></td><td>${esc(b.title || '')}</td><td>${esc(b.link || '')}</td><td>${b.order || 0}</td>
  <td><button class="btn alt sm2" onclick="editBanner('${b.id}')">Edit</button> <button class="btn red sm2" onclick="del('banners','${b.id}')">Del</button></td></tr>`).join('') || '<tr><td colspan="5">No banners (ডিফল্ট হিরো দেখাবে)</td></tr>'}</table></div>`;
}
window.editBanner = id => {
  const b = D.banners.find(x => x.id === id) || {};
  imgs.length = 0; if (b.image) imgs.push(b.image);
  modal(`<h3 style="margin-bottom:12px">${id ? 'Edit' : 'Add'} banner</h3><form onsubmit="saveBanner(event,'${id || ''}')">
  ${fl('Banner image (প্রস্থ ১৪০০px সাইজ ভালো, অনুপাত ১৬:৬)', `<input type="file" accept="image/*" onchange="imgs.length=0;pickImgs(this,1,1400,.6)"><div class="prev" id="prev"></div>`)}
  ${fl('Title', `<input name="title" value="${esc(b.title || '')}">`)}
  ${fl('Link (যেমন #/category/shoes)', `<input name="link" value="${esc(b.link || '')}">`)}
  ${fl('Order', `<input name="order" type="number" value="${b.order || 0}">`)}
  <p style="display:flex;gap:8px"><button class="btn">Save</button><button type="button" class="btn ghost" onclick="closeM()">Cancel</button></p></form>`);
  showPrev();
};
window.saveBanner = async (e, id) => {
  e.preventDefault(); if (!imgs[0]) return alert('ছবি দিন');
  const f = new FormData(e.target), o = { ...(D.banners.find(x => x.id === id) || {}), title: f.get('title'), link: f.get('link'), order: +f.get('order'), image: imgs[0] };
  if (id) o.id = id;
  try { await DB.save('banners', o); } catch (er) { return alert('Save failed: ' + er.message); }
  closeM(); await load(); render();
};

/* ---------- orders ---------- */
const STAT = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
function pOrders() {
  $('#pane').innerHTML = `<h2>Orders (${D.orders.length})</h2><div class="box" style="overflow:auto"><table class="t"><tr><th>No</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr>
  ${D.orders.map(o => `<tr><td><b>${esc(o.orderNo)}</b></td><td>${new Date(o.createdAt).toLocaleString()}</td><td>${esc(o.name)}<br><span class="sm">${esc(o.phone)}</span></td><td>${tk(o.total)}</td>
  <td><select onchange="setStatus('${o.id}',this.value)">${STAT.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
  <td><button class="btn alt sm2" onclick="viewOrder('${o.id}')">View</button> <button class="btn red sm2" onclick="del('orders','${o.id}')">Del</button></td></tr>`).join('') || '<tr><td colspan="6">No orders yet</td></tr>'}</table></div>`;
}
window.setStatus = async (id, v) => { const o = D.orders.find(x => x.id === id); o.status = v; await DB.save('orders', o); };
window.viewOrder = id => {
  const o = D.orders.find(x => x.id === id);
  modal(`<h3>Order ${esc(o.orderNo)}</h3><p>${esc(o.name)} · ${esc(o.phone)}</p><p>${esc(o.address)}</p>${o.note ? `<p><i>${esc(o.note)}</i></p>` : ''}
  <table class="t" style="margin:10px 0">${o.items.map(i => `<tr><td>${esc(i.name)} ${i.opt ? '(' + esc(i.opt) + ')' : ''}</td><td>× ${i.qty}</td><td>${tk(i.price * i.qty)}</td></tr>`).join('')}
  <tr><td colspan="2">Delivery</td><td>${tk(o.delivery)}</td></tr><tr><td colspan="2"><b>Total</b></td><td><b>${tk(o.total)}</b></td></tr></table>
  <button class="btn ghost" onclick="closeM()">Close</button> <button class="btn alt" onclick="window.print()">Print</button>`);
};

/* ---------- settings ---------- */
function pSettings() {
  const s = D.settings.find(x => x.id === 'main') || {};
  const F = [['shopName', 'Shop name'], ['tagline', 'Tagline'], ['hotline', 'Hotline'], ['email', 'Email'], ['address', 'Address'], ['facebook', 'Facebook link'],
    ['whatsapp', 'WhatsApp number (880…)'], ['delivery', 'Delivery charge (৳)'], ['notice', 'Top notice bar text']];
  $('#pane').innerHTML = `<h2>Settings</h2><form class="box" style="max-width:560px" onsubmit="saveSet(event)">${F.map(([k, l]) => fl(l, `<input name="${k}" value="${esc(s[k] ?? '')}">`)).join('')}
  ${DB.useFB ? '' : fl('Admin password (demo mode)', '<input name="adminpw" placeholder="নতুন পাসওয়ার্ড (ফাঁকা = অপরিবর্তিত)">')}
  <button class="btn">Save settings</button></form>`;
}
window.saveSet = async e => {
  e.preventDefault(); const f = new FormData(e.target), o = { id: 'main' };
  for (const [k, v] of f.entries()) if (k !== 'adminpw') o[k] = v;
  o.delivery = +o.delivery || 0;
  await DB.save('settings', o);
  if (f.get('adminpw')) localStorage.setItem('bdzz_adminpw', f.get('adminpw'));
  await load(); alert('Saved ✅');
};

/* ---------- boot ---------- */
if (DB.useFB) DB.fauth.onAuthStateChanged(u => u ? start() : loginView());
else sessionStorage.getItem('bdzz_admin') ? start() : loginView();
  
