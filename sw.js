const CACHE_VERSION = 'v1';
const RUNTIME = 'runtime';

const CACHE_ASSETS = [
  "/",
  "index.html",
  "sw.js",
  "manifest.json",
  "assets/enso_circle-8116133f6f0a8d44.png",
  "assets/enso_circle-8116133f6f0a8d44.png.br",
  "assets/favicon-3c099ab66f83c54b.ico",
  "assets/favicon-3c099ab66f83c54b.ico.br",
  "assets/tailwind-4f7c2d1dabd64638.css",
  "assets/tailwind-4f7c2d1dabd64638.css.br",
  "assets/tailwind-ca0824a65040d192.css",
  "assets/tailwind-ca0824a65040d192.css.br",
  "assets/zazen_timer-3cd22ddb266530f9.js",
  "assets/zazen_timer-3cd22ddb266530f9.js.br",
  "assets/zazen_timer_bg-17536424fad192e7.wasm",
  "assets/zazen_timer_bg-17536424fad192e7.wasm.br",
  "assets/zazen_timer_bg-4e2fa4ae45b2ce0a.wasm",
  "assets/zazen_timer_bg-4e2fa4ae45b2ce0a.wasm.br",
  "assets/zazen_timer_bg-a7c6b6785ee83e2f.wasm",
  "assets/zazen_timer_bg-a7c6b6785ee83e2f.wasm.br",
  "assets/zen_bell-14d1252d9ad291da.wav",
  "assets/zen_bell-14d1252d9ad291da.wav.br",
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