// Sheen Bazaar Service Worker — enables app install + basic offline shell
// v2: only caches this site's own GET requests. v1 also tried to cache
// Google sign-in scripts, browser-extension requests and other sites, which
// threw errors in the console and could serve stale third-party files.
const CACHE = 'sheen-bazaar-v4';

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

// ── Push notifications (orders, offers, price drops) ──
// Badge number on the app icon: the server sends the exact unread count for
// logged-in customers; for guests we keep our own running count here.
const BADGE_KEY = '/__sb_badge__';
async function readBadge() {
  try { const r = await (await caches.open('sb-meta')).match(BADGE_KEY); return r ? Number(await r.text()) || 0 : 0; } catch { return 0; }
}
async function writeBadge(n) {
  try { await (await caches.open('sb-meta')).put(BADGE_KEY, new Response(String(n))); } catch { /* ignore */ }
  try {
    if (n > 0 && self.navigator.setAppBadge) await self.navigator.setAppBadge(n);
    else if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
  } catch { /* badges not supported on this device */ }
}

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  const title = data.title || 'Sheen Bazaar';
  e.waitUntil((async () => {
    const count = typeof data.badge === 'number' ? data.badge : (await readBadge()) + 1;
    await writeBadge(count);
    await self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      image: data.image || undefined,
      tag: data.tag || undefined,
      renotify: !!data.tag,
      vibrate: [80, 40, 80],
      timestamp: Date.now(),
      data: { url: data.url || '/' },
      actions: (data.url || '').startsWith('/products') || (data.url || '').startsWith('/offers')
        ? [{ action: 'open', title: '🛍️ Shop now' }]
        : [{ action: 'open', title: 'Open' }],
    });
  })());
});

// The app tells us when the user has seen their notifications
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'sb-badge') e.waitUntil(writeBadge(Number(e.data.count) || 0));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && 'focus' in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
