// Service worker de JUMA Cloud: cachea solo la "cáscara" de la app.
// Los datos (Supabase) NUNCA se cachean: siempre van a la red para no mostrar stock/caja viejos.
const CACHE = 'juma-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Supabase y otros: directo a la red
  if (req.mode === 'navigate') {
    // Páginas: red primero; si no hay internet, la app cacheada
    e.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  // Archivos estáticos (JS/CSS/iconos con hash): caché primero
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
