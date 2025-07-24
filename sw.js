const CACHE_VERSION = 'v1';
const RUNTIME = 'runtime';

const CACHE_ASSETS = [
  "/zazen-timer",
  "/zazen-timer/index.html",
  "/zazen-timer/sw.js",
  "/zazen-timer/manifest.json",
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(self.skipWaiting())
  );
});

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

    if (event.request.headers.has('range')) {
      return;
    }

    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(response => {
          if (response.status === 206) {
            return response;
          }

          return caches.open(RUNTIME).then(cache => {
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        }).catch(error => {
          console.error('Erro no fetch:', error);
          throw error;
        });
      })
    );
  }
});