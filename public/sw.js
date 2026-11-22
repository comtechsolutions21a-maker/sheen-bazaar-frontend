// Sheen Bazaar Service Worker — enables app install + basic offline shell
// v2: only caches this site's own GET requests. v1 also tried to cache
// Google sign-in scripts, browser-extension requests and other sites, which
// threw errors in the console and could serve stale third-party files.
const CACHE = 'sheen-bazaar-v2';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // other sites: let the browser handle it
  if (url.pathname.startsWith('/api/')) return;     // API: always live

  // Network-first, fall back to cache when offline
  e.respondWith(
    fetch(req).then(res => {
      if (res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('/') : undefined))
    )
  );
});
