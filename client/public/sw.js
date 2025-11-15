// Minimal service worker to enable PWA installability and basic offline caching.
// This is a very small, safe default. You can expand it to precache assets later.

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('fallback-cache');
    try { await cache.add('/'); } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy with a tiny fallback example for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request);
          return fresh;
        } catch (e) {
          // Fallback to cached root if offline and available
          const cache = await caches.open('fallback-cache');
          const cached = await cache.match('/');
          return cached || Response.error();
        }
      })()
    );
  }
});
