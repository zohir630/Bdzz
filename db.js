/* ডেটা লেয়ার: Firebase Firestore (কনফিগ থাকলে) নয়তো localStorage (ডেমো মোড) */
(function () {
  const CFG = window.BDZZ_FIREBASE || {};
  const useFB = !!(CFG.apiKey && CFG.projectId && window.firebase);
  let fdb = null, fauth = null;
  if (useFB) {
    firebase.initializeApp(CFG);
    fdb = firebase.firestore();
    fauth = firebase.auth();
  }
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const lsGet = c => JSON.parse(localStorage.getItem('bdzz_' + c) || '[]');
  const lsSet = (c, v) => localStorage.setItem('bdzz_' + c, JSON.stringify(v));

  const DB = {
    useFB, fauth,
    async list(col) {
      if (useFB) {
        const s = await fdb.collection(col).get();
        return s.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      return lsGet(col);
    },
    async save(col, obj) {
      if (useFB) {
        const id = obj.id || fdb.collection(col).doc().id;
        const { id: _x, ...data } = obj;
        await fdb.collection(col).doc(id).set(data);
        return id;
      }
      const all = lsGet(col);
      if (!obj.id) obj.id = rid();
      const i = all.findIndex(x => x.id === obj.id);
      if (i >= 0) all[i] = obj; else all.push(obj);
      lsSet(col, all);
      return obj.id;
    },
    async remove(col, id) {
      if (useFB) return fdb.collection(col).doc(id).delete();
      lsSet(col, lsGet(col).filter(x => x.id !== id));
    },
    async seedDemo() {
      if (useFB || localStorage.getItem('bdzz_seeded')) return;
      const cats = [
        { id: 'shoes', name: 'Shoes', nameBn: 'জুতা', parent: '', order: 1 },
        { id: 'racket', name: 'Racket', nameBn: 'র‍্যাকেট', parent: '', order: 2 },
        { id: 'dress', name: 'Dress', nameBn: 'পোশাক', parent: '', order: 3 },
        { id: 'bag', name: 'Bag', nameBn: 'ব্যাগ', parent: '', order: 4 },
        { id: 'acc', name: 'Accessories', nameBn: 'এক্সেসরিজ', parent: '', order: 5 },
        { id: 'court-shoes', name: 'Court Shoes', nameBn: 'কোর্ট শু', parent: 'shoes', order: 1 },
        { id: 'slippers', name: 'Slippers', nameBn: 'স্লিপার', parent: 'shoes', order: 2 }
      ];
      lsSet('categories', cats);
      const mk = (name, cat, price, old, stock, sold, genuine) => ({
        id: rid(), name, category: cat, price, oldPrice: old, stock, sold, genuine,
        active: true, options: '', images: [], desc: 'Demo product. এডমিন থেকে এডিট বা ডিলিট করুন।'
      });
      lsSet('products', [
        mk('Demo Court Shoe A', 'court-shoes', 3500, 4000, 10, 7, true),
        mk('Demo Racket Pro', 'racket', 4500, 5300, 8, 3, true),
        mk('Demo Sports Tee', 'dress', 1200, 0, 25, 5, false),
        mk('Demo Slipper', 'slippers', 800, 0, 30, 2, false),
        mk('Demo Racket Bag', 'bag', 2500, 3000, 6, 1, true),
        mk('Demo Grip (3 pcs)', 'acc', 300, 0, 100, 12, false)
      ]);
      lsSet('settings', [{
        id: 'main', shopName: 'bdzz', tagline: 'Online shopping in Bangladesh',
        hotline: '+8801XXXXXXXXX', email: 'you@example.com', address: 'Your address, Bangladesh',
        facebook: '', whatsapp: '8801XXXXXXXXX', delivery: 100, notice: 'Welcome to bdzz!'
      }]);
      localStorage.setItem('bdzz_seeded', '1');
    }
  };
  window.DB = DB;
})();
           
