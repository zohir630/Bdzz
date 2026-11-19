# bdzz — অনলাইন শপ + এডমিন প্যানেল

ফাইল: `index.html` (শপ), `admin.html` (এডমিন), `config.js` (Firebase কনফিগ)।

## ১. দ্রুত টেস্ট (ডেমো মোড)
`config.js` ফাঁকা থাকলে সাইট ব্রাউজারের localStorage-এ চলে। `admin.html` খুলে পাসওয়ার্ড `admin123` দিন।
**সতর্কতা:** এই মোডে ডেটা শুধু আপনার ব্রাউজারে থাকে, কাস্টমাররা আপনার যোগ করা প্রোডাক্ট দেখবে না।

## ২. আসল ব্যবহার (GitHub Pages + Firebase, ফ্রি)
1. https://console.firebase.google.com এ প্রজেক্ট খুলুন।
2. **Build > Firestore Database** চালু করুন (Production mode)।
3. **Build > Authentication > Sign-in method** এ Email/Password চালু করে **Users** ট্যাবে নিজের এডমিন ইমেইল-পাসওয়ার্ড দিয়ে ইউজার বানান।
4. **Project settings > Your apps > Web (</>)** থেকে config কপি করে `config.js` এ বসান।
5. **Firestore > Rules** এ নিচের রুল দিন (`YOUR_ADMIN_EMAIL` বদলান):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function admin() { return request.auth != null && request.auth.token.email == 'YOUR_ADMIN_EMAIL'; }
    match /{col}/{id} {
      allow read: if col in ['products','categories','banners','settings'] || admin();
      allow create: if col == 'orders';
      allow write: if admin();
    }
  }
}
```
6. **Authentication > Settings > Authorized domains** এ `YOURNAME.github.io` যোগ করুন।

## ৩. GitHub এ হোস্ট
রিপোজিটরিতে ফাইলগুলো আপলোড করুন → **Settings > Pages > Deploy from branch (main, / root)**।
শপ: `https://YOURNAME.github.io/REPO/` · এডমিন: `.../admin.html`

## এডমিন থেকে যা করা যায়
প্রোডাক্ট যোগ/এডিট/ডিলিট (ছবি, দাম, ডিসকাউন্ট, স্টক, সাইজ অপশন), ক্যাটেগরি ও সাব-ক্যাটেগরি, হোম ব্যানার, অর্ডার দেখা ও স্ট্যাটাস বদলানো, শপের নাম/ফোন/ডেলিভারি চার্জ সেটিংস।
