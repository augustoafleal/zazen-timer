const VERSION = "v2";

const CACHE_NAME = `zazen-timer-${VERSION}`;

const APP_STATIC_RESOURCES = [
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
    "/zazen-timer/assets/tailwind-bb7505027a39c560.css",
    "/zazen-timer/assets/tailwind-bb7505027a39c560.css.br",
    "/zazen-timer/assets/zazen_timer-a5e3712dbf3adeb8.js",
    "/zazen-timer/assets/zazen_timer-a5e3712dbf3adeb8.js.br",
    "/zazen-timer/assets/zazen_timer_bg-616109dfa4b1abfe.wasm",
    "/zazen-timer/assets/zazen_timer_bg-616109dfa4b1abfe.wasm.br",
    "/zazen-timer/assets/zen_bell-42d354ce545048ce.mp3",
    "/zazen-timer/assets/zen_bell-42d354ce545048ce.mp3.br"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
      await clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response(null, { status: 404 });
    })()
  );
});