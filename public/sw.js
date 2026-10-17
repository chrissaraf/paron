// PARON service worker: κρατά την εφαρμογή για να ανοίγει και χωρίς σύνδεση, και δείχνει τις ειδοποιήσεις στο κινητό.
// Τα δεδομένα (/api/) δεν αποθηκεύονται εδώ, πάνε πάντα στον server.
const CACHE = 'ergodo-v9';
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

// ειδοποίηση από τον server (κρυπτογραφημένη, μόνο αυτή η συσκευή τη διαβάζει)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'PARON', { body: d.body || '', icon: '/icon-192.png', tag: d.tag || undefined, renotify: !!d.tag, lang: 'el', data: { url: d.url || '/' } }));
});
// πάτημα στην ειδοποίηση: ανοίγει την εφαρμογή (ή τη φέρνει μπροστά) στη σωστή σελίδα
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => new URL(x.url).origin === self.location.origin);
    if (c) return (url !== c.url && c.navigate ? c.navigate(url).catch(() => c) : Promise.resolve(c)).then(x => (x || c).focus());
    return self.clients.openWindow(url);
  }));
});
// ο browser άλλαξε τα στοιχεία της συσκευής: γράφονται ξανά στον server
const u8 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(fetch('/api/push', { credentials: 'same-origin' }).then(r => r.json()).then(k => k.on && self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(k.key) })
    .then(s => fetch('/api/push/sub', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sub: s.toJSON(), old: e.oldSubscription && e.oldSubscription.endpoint }) }))).catch(() => {}));
});
