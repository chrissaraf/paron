// ERGODO service worker: κρατά την εφαρμογή για να ανοίγει και χωρίς σύνδεση.
// Τα δεδομένα (/api/) δεν αποθηκεύονται εδώ, πάνε πάντα στον server.
const CACHE = 'ergodo-v5';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (e.request.mode === 'navigate' || url.pathname === '/') {
    // πρώτα το δίκτυο, ώστε να φαίνεται πάντα η νέα έκδοση· χωρίς σύνδεση, η αποθηκευμένη
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put('/', c)); }
      return r;
    }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(e.request).then(m => m || fetch(e.request)));
});
