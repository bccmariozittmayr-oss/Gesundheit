/* Service Worker: macht die App offline nutzbar und zeigt Benachrichtigungen an.
   Bei jeder Änderung an den App-Dateien die VERSION hochzählen, sonst bleibt die alte Fassung im Cache. */
const VERSION = 'gesundheit-v2026.09.08-14';
const FILES = ['./', './index.html', './daten.js', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './lib/zxing-0.21.3.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('gesundheit-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Netz zuerst (damit Updates ankommen), sonst Cache
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  const base = new URL('./', self.location.href).pathname;
  const rel = './' + u.pathname.slice(base.length);
  if (!FILES.includes(rel === './' ? './' : rel)) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request)));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => { if (list.length) return list[0].focus(); return clients.openWindow('./'); }));
});
