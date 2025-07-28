"use strict";

//console.log('WORKER: executing.');

var version = 'v1.0.0::';

var offlineFundamentals = [
    "/zazen-timer/",
    "/zazen-timer/index.html",
    "/zazen-timer/sw.js",
    "/zazen-timer/manifest.json",
    "/zazen-timer/assets/android-chrome-192x192-00e229331706da6e.png",
    "/zazen-timer/assets/android-chrome-192x192-00e229331706da6e.png.br",
    "/zazen-timer/assets/android-chrome-512x512-b465b1095964a27e.png",
    "/zazen-timer/assets/android-chrome-512x512-b465b1095964a27e.png.br",
    "/zazen-timer/assets/apple-touch-icon-5954c36cf87286a2.png",
    "/zazen-timer/assets/apple-touch-icon-5954c36cf87286a2.png.br",
    "/zazen-timer/assets/enso_circle-8116133f6f0a8d44.png",
    "/zazen-timer/assets/enso_circle-8116133f6f0a8d44.png.br",
    "/zazen-timer/assets/favicon-16x16-19a2cf29fcf333e1.png",
    "/zazen-timer/assets/favicon-16x16-19a2cf29fcf333e1.png.br",
    "/zazen-timer/assets/favicon-32x32-7459cfa09b5fb6c9.png",
    "/zazen-timer/assets/favicon-32x32-7459cfa09b5fb6c9.png.br",
    "/zazen-timer/assets/favicon-3c099ab66f83c54b.ico",
    "/zazen-timer/assets/favicon-3c099ab66f83c54b.ico.br",
    "/zazen-timer/assets/tailwind-783990df4970675f.css",
    "/zazen-timer/assets/tailwind-783990df4970675f.css.br",
    "/zazen-timer/assets/zazen_timer-ed7cd2f393e276e6.js",
    "/zazen-timer/assets/zazen_timer-ed7cd2f393e276e6.js.br",
    "/zazen-timer/assets/zazen_timer_bg-d6b8f6f8f8f3da96.wasm",
    "/zazen-timer/assets/zazen_timer_bg-d6b8f6f8f8f3da96.wasm.br",
    "/zazen-timer/assets/zen_bell-42d354ce545048ce.mp3",
    "/zazen-timer/assets/zen_bell-42d354ce545048ce.mp3.br"
];

self.addEventListener("install", function (event) {
  //console.log('WORKER: install event in progress.');
  event.waitUntil(
    caches
      .open(version + 'fundamentals')
      .then(function (cache) {
        return cache.addAll(offlineFundamentals);
      })
      .then(function () {
        //console.log('WORKER: install completed');
      })
  );
});

self.addEventListener("fetch", function (event) {
  //console.log('WORKER: fetch event in progress.');

  if (event.request.method !== 'GET') {
    //console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(function (cached) {
        var networked = fetch(event.request)
          .then(fetchedFromNetwork, unableToResolve)
          .catch(unableToResolve);

        //console.log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);
        return cached || networked;

        function fetchedFromNetwork(response) {
          var cacheCopy = response.clone();

          //console.log('WORKER: fetch response from network.', event.request.url);

          caches
            .open(version + 'pages')
            .then(function add(cache) {
              cache.put(event.request, cacheCopy);
            })
            .then(function () {
              //console.log('WORKER: fetch response stored in cache.', event.request.url);
            });

          return response;
        }

        function unableToResolve() {
          //console.log('WORKER: fetch request failed in both cache and network.');
          return new Response('<h1>Service Unavailable</h1>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/html'
            })
          });
        }
      })
  );
});

self.addEventListener("activate", function (event) {
  //console.log('WORKER: activate event in progress.');

  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return !key.startsWith(version);
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        //console.log('WORKER: activate completed.');
      })
  );
});
