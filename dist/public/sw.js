const CACHE_VERSION = 'v1';
const RUNTIME = 'runtime';

const CACHE_ASSETS = [
  "/",
  "index.html",
  "sw.js",
  "manifest.json",
  "assets/android-chrome-192x192-4023f549432eedb7.png",
  "assets/android-chrome-192x192-4023f549432eedb7.png.br",
  "assets/android-chrome-512x512-d8edb5f00453b3b5.png",
  "assets/android-chrome-512x512-d8edb5f00453b3b5.png.br",
  "assets/apple-touch-icon-a2ac4df99f1d4219.png",
  "assets/apple-touch-icon-a2ac4df99f1d4219.png.br",
  "assets/enso_circle-8116133f6f0a8d44.png",
  "assets/enso_circle-8116133f6f0a8d44.png.br",
  "assets/favicon-16x16-b221e8f3e4cda9e0.png",
  "assets/favicon-16x16-b221e8f3e4cda9e0.png.br",
  "assets/favicon-32x32-5085523058df8369.png",
  "assets/favicon-32x32-5085523058df8369.png.br",
  "assets/favicon-3c099ab66f83c54b.ico",
  "assets/favicon-3c099ab66f83c54b.ico.br",
  "assets/tailwind-147a47741be15eb1.css",
  "assets/tailwind-147a47741be15eb1.css.br",
  "assets/zazen_timer-9b45b4c5b98dbbbf.js",
  "assets/zazen_timer-9b45b4c5b98dbbbf.js.br",
  "assets/zazen_timer_bg-60ff2984bf572490.wasm",
  "assets/zazen_timer_bg-60ff2984bf572490.wasm.br",
  "assets/zen_bell-14d1252d9ad291da.wav",
  "assets/zen_bell-14d1252d9ad291da.wav.br"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_VERSION, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});