const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tk = n => '৳' + Number(n || 0).toLocaleString('en-US');
let S = { products: [], categories: [], banners: [], set: {} };
let lang = localStorage.getItem('bdzz_lang') || 'en';
const TR = {
  en: { home: 'Home', all: 'All products', cart: 'Cart', search: 'Search products', go: 'Search', hello: 'Hotline', cats: 'All categories',
    offer: "Today's Offer", genuine: 'Original & genuine', top: 'Top selling products', you: 'Just for you', more: 'Shop more',
    add: 'Add to cart', buy: 'Buy now', stock: 'In stock', out: 'Out of stock', sold: 'sold', left: 'left', desc: 'Description', size: 'Option',
    empty: 'Nothing here yet.', ecart: 'Your cart is empty.', checkout: 'Checkout', place: 'Place order (Cash on delivery)',
    name: 'Full name', phone: 'Mobile number', addr: 'Full address', note: 'Note (optional)', sub: 'Subtotal', del: 'Delivery', total: 'Total',
    done: 'Order placed!', doneT: 'Thank you. We will call you to confirm. Your order number:', p1: 'Cash on delivery', p2: 'Delivery all over Bangladesh',
    p3: 'Easy returns', p4: '100% genuine products', care: 'Customer care', contact: 'Contact', sort: 'Sort', newest: 'Newest', lo: 'Price: low to high', hi: 'Price: high to low',
    results: 'results for', remove: 'Remove', continue: 'Continue shopping', wa: 'WhatsApp' },
  bn: { home: 'হোম', all: 'সব পণ্য', cart: 'কার্ট', search: 'পণ্য খুঁজুন', go: 'খুঁজুন', hello: 'হটলাইন', cats: 'সব ক্যাটেগরি',
    offer: 'আজকের অফার', genuine: 'অরিজিনাল ও আসল', top: 'সবচেয়ে বেশি বিক্রিত', you: 'আপনার জন্য', more: 'আরও দেখুন',
    add: 'কার্টে যোগ করুন', buy: 'এখনই কিনুন', stock: 'স্টকে আছে', out: 'স্টক নেই', sold: 'বিক্রি', left: 'বাকি', desc: 'বিবরণ', size: 'অপশন',
    empty: 'এখানে কিছু নেই।', ecart: 'আপনার কার্ট খালি।', checkout: 'চেকআউট', place: 'অর্ডার করুন (ক্যাশ অন ডেলিভারি)',
    name: 'পুরো নাম', phone: 'মোবাইল নম্বর', addr: 'সম্পূর্ণ ঠিকানা', note: 'নোট (ঐচ্ছিক)', sub: 'সাবটোটাল', del: 'ডেলিভারি', total: 'সর্বমোট',
    done: 'অর্ডার সম্পন্ন!', doneT: 'ধন্যবাদ। কনফার্ম করতে আমরা কল করব। আপনার অর্ডার নম্বর:', p1: 'ক্যাশ অন ডেলিভারি', p2: 'সারা দেশে ডেলিভারি',
    p3: 'সহজ রিটার্ন', p4: '১০০% আসল পণ্য', care: 'কাস্টমার কেয়ার', contact: 'যোগাযোগ', sort: 'সাজান', newest: 'নতুন', lo: 'দাম: কম থেকে বেশি', hi: 'দাম: বেশি থেকে কম',
    results: 'ফলাফল:', remove: 'বাদ দিন', continue: 'কেনাকাটা চালিয়ে যান', wa: 'হোয়াটসঅ্যাপ' }
};
const t = k => TR[lang][k] || TR.en[k] || k;
const cname = c => (lang === 'bn' && c.nameBn) ? c.nameBn : c.name;
const getCart = () => JSON.parse(localStorage.getItem('bdzz_cart') || '[]');
const setCart = c => { localStorage.setItem('bdzz_cart', JSON.stringify(c)); renderCartCount(); };
const P = id => S.products.find(p => p.id === id);
const C = id => S.categories.find(c => c.id === id);
const childrenOf = id => S.categories.filter(c => c.parent === id);
const catIds = id => [id, ...childrenOf(id).map(c => c.id)];

function parse() {
  const h = location.hash.slice(1) || '/';
  const [path, q] = h.split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(q || '') };
}
function card(p) {
  const off = p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return `<a class="pc" href="#/product/${p.id}">
    ${off ? `<span class="tag">-${off}%</span>` : ''}${p.genuine ? '<span class="tag g">Original</span>' : ''}
    <div class="im">${p.images && p.images[0] ? `<img loading="lazy" src="${esc(p.images[0])}" alt="">` : '🛍️'}</div>
    <div class="bd"><div class="nm">${esc(p.name)}</div>
    <div class="pr">${tk(p.price)}${off ? `<s>${tk(p.oldPrice)}</s>` : ''}</div>
    <div class="sm">${p.stock > 0 ? (p.sold ? p.sold + ' ' + t('sold') : t('stock')) : t('out')}</div></div></a>`;
}
const grid = list => list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty">${t('empty')}</div>`;
const active = () => S.products.filter(p => p.active !== false);

function layout(inner) {
  const s = S.set, tops = S.categories.filter(c => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0));
  const name = esc(s.shopName || 'bdzz');
  return `
  <div class="topbar"><div class="wrap"><span class="l">${t('hello')}: ${esc(s.hotline || '')}</span>
  <span><a href="#/products">${t('all')}</a><a href="#/contact">${t('contact')}</a>
  <a href="#" onclick="setLang('${lang === 'en' ? 'bn' : 'en'}');return false">${lang === 'en' ? 'বাংলা' : 'English'}</a></span></div></div>
  <header class="head"><div class="wrap">
    <a class="logo" href="#/">${name.replace(/(z+)$/i, '<b>$1</b>')}</a>
    <form class="search" onsubmit="location.hash='#/products?q='+encodeURIComponent(this.q.value);return false">
      <input name="q" placeholder="${t('search')}"><button>${t('go')}</button></form>
    <div class="hact"><a class="cartb" href="#/cart">🛒 ${t('cart')}<span id="cc">0</span></a></div>
  </div></header>
  <nav class="nav"><div class="wrap">${tops.map(c => {
    const ch = childrenOf(c.id);
    return `<div class="it"><a href="#/category/${c.id}">${esc(cname(c))}</a>${ch.length ? `<div class="sub">${ch.map(x => `<a href="#/category/${x.id}">${esc(cname(x))}</a>`).join('')}</div>` : ''}</div>`;
  }).join('')}</div></nav>
  ${s.notice ? `<div class="notice">${esc(s.notice)}</div>` : ''}
  <main class="wrap">${inner}</main>
  <footer class="foot"><div class="wrap">
    <div><h4>${name}</h4><p>${esc(s.tagline || '')}</p><p>📍 ${esc(s.address || '')}</p><p>📞 ${esc(s.hotline || '')}</p><p>✉️ ${esc(s.email || '')}</p>
    ${s.facebook ? `<a href="${esc(s.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ''}</div>
    <div><h4>${t('care')}</h4><a href="#/cart">${t('cart')}</a><a href="#/products">${t('all')}</a><a href="#/contact">${t('contact')}</a></div>
    <div><h4>${t('cats')}</h4>${tops.map(c => `<a href="#/category/${c.id}">${esc(cname(c))}</a>`).join('')}</div>
  </div><div class="copy">© ${new Date().getFullYear()} ${name}. All rights reserved.</div></footer>
  <div class="bnav"><a href="#/">🏠<br>${t('home')}</a><a href="#/products">🗂️<br>${t('all')}</a><a href="#/cart">🛒<br>${t('cart')}</a></div>
  ${s.whatsapp ? `<a class="float" href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">💬 ${t('wa')}</a>` : ''}`;
}
function renderCartCount() { const e = $('#cc'); if (e) e.textContent = getCart().reduce((a, i) => a + i.qty, 0); }
window.setLang = l => { lang = l; localStorage.setItem('bdzz_lang', l); route(); };

/* ---------- pages ---------- */
let slideTimer;
function home() {
  const act = active();
  const tops = S.categories.filter(c => !c.parent).sort((a, b) => (a.order || 0) - (b.order || 0));
  const offers = act.filter(p => p.oldPrice > p.price).slice(0, 12);
  const gen = act.filter(p => p.genuine).slice(0, 12);
  const top = [...act].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 12);
  const bn = S.banners.filter(b => b.image).sort((a, b) => (a.order || 0) - (b.order || 0));
  const slider = bn.length
    ? `<div class="slider" id="sl">${bn.map((b, i) => `<a href="${esc(b.link || '#/')}"><img class="${i ? '' : 'on'}" src="${esc(b.image)}" alt="${esc(b.title || '')}"></a>`).join('')}<div class="dots">${bn.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div></div>`
    : `<div class="slider"><div class="hero"><h2>${esc(S.set.shopName || 'bdzz')}</h2><p>${esc(S.set.tagline || '')}</p></div></div>`;
  const sec = (title, list, href) => list.length ? `<section class="sec"><h2>${title}<a href="${href}">${t('more')} →</a></h2>${grid(list)}</section>` : '';
  const html = `${slider}
  <div class="cats">${tops.map(c => `<a class="cat" href="#/category/${c.id}"><div class="ci">${c.image ? `<img src="${esc(c.image)}" alt="">` : '🏷️'}</div>${esc(cname(c))}</a>`).join('')}</div>
  ${sec(t('offer'), offers, '#/products?sale=1')}${sec(t('genuine'), gen, '#/products?genuine=1')}${sec(t('top'), top, '#/products?top=1')}
  <section class="sec"><h2>${t('you')}</h2><div class="tabs" id="jt"><button class="on" data-c="">${t('all')}</button>${tops.map(c => `<button data-c="${c.id}">${esc(cname(c))}</button>`).join('')}</div><div id="jg">${grid(act.slice(0, 24))}</div></section>
  <div class="perks"><div><b>💵 ${t('p1')}</b></div><div><b>🚚 ${t('p2')}</b></div><div><b>↩️ ${t('p3')}</b></div><div><b>✅ ${t('p4')}</b></div></div>`;
  setTimeout(() => {
    $('#jt')?.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      document.querySelectorAll('#jt button').forEach(x => x.classList.toggle('on', x === b));
      const ids = b.dataset.c ? catIds(b.dataset.c) : null;
      $('#jg').innerHTML = grid(act.filter(p => !ids || ids.includes(p.category)).slice(0, 24));
    });
    clearInterval(slideTimer);
    const imgs = document.querySelectorAll('#sl img'), dots = document.querySelectorAll('#sl .dots i');
    if (imgs.length > 1) { let i = 0; const go = n => { i = n % imgs.length; imgs.forEach((x, k) => x.classList.toggle('on', k === i)); dots.forEach((x, k) => x.classList.toggle('on', k === i)); };
      dots.forEach((d, k) => d.onclick = () => go(k)); slideTimer = setInterval(() => go(i + 1), 4500); }
  });
  return html;
}
function listing(title, list, q) {
  const sort = q.get('sort') || 'new';
  if (sort === 'lo') list.sort((a, b) => a.price - b.price); else if (sort === 'hi') list.sort((a, b) => b.price - a.price);
  const base = location.hash.split('&sort=')[0].replace(/[?&]sort=[^&]*/, '');
  return `<div class="bc"><a href="#/">${t('home')}</a> / ${esc(title)}</div>
  <section class="sec"><h2>${esc(title)} <small class="sm">(${list.length})</small>
  <select onchange="goSort(this.value)"><option value="new">${t('newest')}</option><option value="lo" ${sort === 'lo' ? 'selected' : ''}>${t('lo')}</option><option value="hi" ${sort === 'hi' ? 'selected' : ''}>${t('hi')}</option></select></h2>${grid(list)}</section>`;
}
window.goSort = v => { const { parts, q } = parse(); q.set('sort', v); location.hash = '#/' + parts.join('/') + '?' + q.toString(); };
function products(q) {
  let l = active();
  const s = (q.get('q') || '').toLowerCase().trim();
  if (s) l = l.filter(p => (p.name + ' ' + (p.desc || '')).toLowerCase().includes(s));
  if (q.get('sale')) l = l.filter(p => p.oldPrice > p.price);
  if (q.get('genuine')) l = l.filter(p => p.genuine);
  if (q.get('top')) l = [...l].sort((a, b) => (b.sold || 0) - (a.sold || 0));
  return listing(s ? `${t('results')} "${q.get('q')}"` : t('all'), l, q);
}
function category(id, q) {
  const c = C(id); if (!c) return `<div class="empty">404</div>`;
  const subs = childrenOf(id);
  const ids = catIds(id);
  const h = listing(cname(c), active().filter(p => ids.includes(p.category)), q);
  return subs.length ? h.replace('<section class="sec">', `<div class="tabs">${subs.map(x => `<button onclick="location.hash='#/category/${x.id}'">${esc(cname(x))}</button>`).join('')}</div><section class="sec">`) : h;
}
let selOpt = '', selQty = 1;
function product(id) {
  const p = P(id); if (!p) return `<div class="empty">404</div>`;
  selOpt = ''; selQty = 1;
  const opts = (p.options || '').split(',').map(x => x.trim()).filter(Boolean);
  const c = C(p.category), imgs = p.images || [];
  const rel = active().filter(x => x.category === p.category && x.id !== p.id).slice(0, 6);
  setTimeout(() => {
    document.querySelectorAll('.thumbs img').forEach(i => i.onclick = () => $('#mainimg').src = i.src);
    document.querySelectorAll('.opts button').forEach(b => b.onclick = () => { selOpt = b.dataset.o; document.querySelectorAll('.opts button').forEach(x => x.classList.toggle('on', x === b)); });
  });
  return `<div class="bc"><a href="#/">${t('home')}</a> / ${c ? `<a href="#/category/${c.id}">${esc(cname(c))}</a> / ` : ''}${esc(p.name)}</div>
  <div class="pd"><div><div class="main">${imgs[0] ? `<img id="mainimg" src="${esc(imgs[0])}" alt="">` : '🛍️'}</div>
  ${imgs.length > 1 ? `<div class="thumbs">${imgs.map(i => `<img src="${esc(i)}" alt="">`).join('')}</div>` : ''}</div>
  <div><h1>${esc(p.name)}</h1>
  <div class="big">${tk(p.price)} ${p.oldPrice > p.price ? `<s class="sm">${tk(p.oldPrice)}</s>` : ''}</div>
  <p class="sm">${p.stock > 0 ? `${t('stock')} (${p.stock} ${t('left')})` : t('out')}</p>
  ${opts.length ? `<p style="margin-top:10px"><b>${t('size')}</b></p><div class="opts">${opts.map(o => `<button data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}
  <p style="margin:12px 0"><span class="qty"><button onclick="qtyChg(-1)">−</button><span id="q">1</span><button onclick="qtyChg(1)">+</button></span></p>
  <p style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn alt" onclick="addCart('${p.id}',false,${opts.length})" ${p.stock > 0 ? '' : 'disabled'}>${t('add')}</button>
  <button class="btn" onclick="addCart('${p.id}',true,${opts.length})" ${p.stock > 0 ? '' : 'disabled'}>${t('buy')}</button></p>
  <h3 style="margin-top:18px">${t('desc')}</h3><p style="white-space:pre-wrap">${esc(p.desc || '')}</p></div></div>
  ${rel.length ? `<section class="sec"><h2>You may also like</h2>${grid(rel)}</section>` : ''}`;
}
window.qtyChg = d => { selQty = Math.max(1, selQty + d); $('#q').textContent = selQty; };
window.addCart = (id, buy, hasOpts) => {
  if (hasOpts && !selOpt) return alert(t('size') + '?');
  const c = getCart(), i = c.find(x => x.id === id && x.opt === selOpt);
  if (i) i.qty += selQty; else c.push({ id, opt: selOpt, qty: selQty });
  setCart(c); location.hash = buy ? '#/checkout' : '#/cart';
};
function cartView() {
  const c = getCart().filter(i => P(i.id));
  if (!c.length) return `<div class="empty">${t('ecart')}<p><a class="btn" href="#/">${t('continue')}</a></p></div>`;
  const sub = c.reduce((a, i) => a + P(i.id).price * i.qty, 0);
  return `<div class="two"><div class="box"><table class="t">${c.map((i, k) => { const p = P(i.id); return `<tr><td width="60">${p.images?.[0] ? `<img class="thumb" src="${esc(p.images[0])}">` : '🛍️'}</td>
  <td><a href="#/product/${p.id}">${esc(p.name)}</a>${i.opt ? `<div class="sm">${esc(i.opt)}</div>` : ''}<div class="sm">${tk(p.price)}</div></td>
  <td><span class="qty"><button onclick="cartQ(${k},-1)">−</button><span>${i.qty}</span><button onclick="cartQ(${k},1)">+</button></span></td>
  <td><b>${tk(p.price * i.qty)}</b></td><td><button class="btn ghost sm2" onclick="cartQ(${k},-999)">✕</button></td></tr>`; }).join('')}</table></div>
  <div class="box"><div class="row"><span>${t('sub')}</span><b>${tk(sub)}</b></div><a class="btn" style="display:block;margin-top:12px" href="#/checkout">${t('checkout')}</a></div></div>`;
}
window.cartQ = (k, d) => { const c = getCart().filter(i => P(i.id)); c[k].qty += d; if (c[k].qty < 1) c.splice(k, 1); setCart(c); route(); };
function checkout() {
  const c = getCart().filter(i => P(i.id));
  if (!c.length) return cartView();
  const sub = c.reduce((a, i) => a + P(i.id).price * i.qty, 0), dl = Number(S.set.delivery || 0);
  return `<div class="two"><form class="box" onsubmit="placeOrder(event)">
  <h3 style="margin-bottom:12px">${t('checkout')}</h3>
  <div class="fl">${t('name')}<input name="name" required></div>
  <div class="fl">${t('phone')}<input name="phone" required pattern="01[0-9]{9}" placeholder="01XXXXXXXXX" inputmode="numeric"></div>
  <div class="fl">${t('addr')}<textarea name="address" rows="3" required></textarea></div>
  <div class="fl">${t('note')}<input name="note"></div>
  <button class="btn" style="width:100%">${t('place')}</button></form>
  <div class="box">${c.map(i => `<div class="row"><span>${esc(P(i.id).name)} ${i.opt ? '(' + esc(i.opt) + ')' : ''} × ${i.qty}</span><span>${tk(P(i.id).price * i.qty)}</span></div>`).join('')}
  <div class="row"><span>${t('sub')}</span><span>${tk(sub)}</span></div><div class="row"><span>${t('del')}</span><span>${tk(dl)}</span></div>
  <div class="row tot"><span>${t('total')}</span><span>${tk(sub + dl)}</span></div></div></div>`;
}
window.placeOrder = async e => {
  e.preventDefault();
  const f = new FormData(e.target), c = getCart().filter(i => P(i.id)), dl = Number(S.set.delivery || 0);
  const items = c.map(i => ({ id: i.id, name: P(i.id).name, opt: i.opt, qty: i.qty, price: P(i.id).price }));
  const sub = items.reduce((a, i) => a + i.price * i.qty, 0);
  const no = 'BZ' + Date.now().toString().slice(-7);
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try {
    await DB.save('orders', { orderNo: no, name: f.get('name'), phone: f.get('phone'), address: f.get('address'), note: f.get('note') || '', items, subtotal: sub, delivery: dl, total: sub + dl, status: 'pending', createdAt: Date.now() });
    setCart([]);
    $('main').innerHTML = `<div class="ok" style="margin:30px 0"><h2>✅ ${t('done')}</h2><p>${t('doneT')}</p><h1>${no}</h1><p><a class="btn" href="#/">${t('continue')}</a></p></div>`;
  } catch (err) { alert('Error: ' + err.message); btn.disabled = false; }
};
function contact() {
  const s = S.set;
  return `<div class="box" style="margin:14px 0"><h2>${t('contact')}</h2><p>📍 ${esc(s.address || '')}</p><p>📞 ${esc(s.hotline || '')}</p><p>✉️ ${esc(s.email || '')}</p>${s.facebook ? `<p><a href="${esc(s.facebook)}" target="_blank" rel="noopener">Facebook</a></p>` : ''}</div>`;
}

function route() {
  const { parts, q } = parse();
  let inner;
  const [a, b] = parts;
  if (!a) inner = home();
  else if (a === 'products') inner = products(q);
  else if (a === 'category') inner = category(b, q);
  else if (a === 'product') inner = product(b);
  else if (a === 'cart') inner = cartView();
  else if (a === 'checkout') inner = checkout();
  else if (a === 'contact') inner = contact();
  else inner = `<div class="empty">404</div>`;
  $('#app').innerHTML = layout(inner);
  document.documentElement.lang = lang;
  document.title = (S.set.shopName || 'bdzz') + ' — ' + (S.set.tagline || 'Online shopping');
  renderCartCount();
  if (a) window.scrollTo(0, 0);
}
(async function init() {
  $('#app').innerHTML = '<div class="empty">Loading…</div>';
  try {
    await DB.seedDemo();
    const [products, categories, banners, set] = await Promise.all(['products', 'categories', 'banners', 'settings'].map(c => DB.list(c)));
    S = { products, categories, banners, set: set.find(x => x.id === 'main') || set[0] || {} };
  } catch (e) { console.error(e); }
  window.addEventListener('hashchange', route);
  route();
})();
