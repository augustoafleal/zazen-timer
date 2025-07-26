'use strict';

const CACHE_VERSION = 'v1';
const CACHE_NAME = CACHE_VERSION;

const contentToCache = [
    '/zazen-timer/',
    '/zazen-timer/index.html',
    '/zazen-timer/sw.js',
    '/zazen-timer/manifest.json',
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

self.addEventListener('install', function (event) {
    //console.log('[SW] Install event');
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            //console.log('[SW] Caching app shell and content');
            return cache.addAll(contentToCache);
        }).then(function () {
            //console.log('[SW] Skip waiting');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    //console.log('[SW] Activate event');
    event.waitUntil(
        self.clients.claim().then(function () {
            //console.log('[SW] Clients claimed');
        })
    );
});

self.addEventListener('fetch', function (event) {
    const url = event.request.url;
    const isAudio = url.endsWith('.mp3');

    if (!url.startsWith(self.location.origin)) {
        return;
    }

    if (isAudio) {
        //console.log(`[SW] Fetching audio: ${url}`);

        event.respondWith(
            caches.match(event.request).then(function (response) {
                if (!response) {
                    //console.log('[SW] Audio not found in cache, falling back to network');
                    return fetch(event.request);
                }

                const rangeHeader = event.request.headers.get('range');
                if (rangeHeader) {
                    //console.log('[SW] Range request detected:', rangeHeader);
                    return rangeable_resp(event.request, response);
                }

                //console.log('[SW] Returning full audio from cache');
                return response;
            })
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(function (response) {
                if (response) {
                    //console.log(`[SW] Cache hit: ${url}`);
                    return response;
                }

                //console.log(`[SW] Cache miss: ${url}, fetching from network`);
                return fetch(event.request).then(function (networkResponse) {
                    return caches.open(CACHE_NAME).then(function (cache) {
                        //console.log(`[SW] Caching new resource: ${url}`);
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    }
});

function rangeable_resp(request, resp) {
    let range = /^bytes=(\d*)-(\d*)$/gi.exec(request.headers.get('range'));
    if (range === null || (range[1] === '' && range[2] === '')) {
        //console.log('[SW] Invalid or empty Range header, returning full response');
        return resp;
    }

    return resp.arrayBuffer().then(function (ab) {
        const total = ab.byteLength;
        let start = Number(range[1]);
        let end = Number(range[2]);

        if (range[1] === '') {
            start = total - end;
            end = total - 1;
        }
        if (range[2] === '') {
            end = total - 1;
        }

        if (start > end || end >= total || start < 0) {
            //console.log('[SW] Invalid byte range, returning full response');
            return resp;
        }

        const headers = new Headers(resp.headers);
        headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
        headers.set('Content-Length', end - start + 1);
        headers.set('Accept-Ranges', 'bytes');

        //console.log(`[SW] Returning partial content: bytes ${start}-${end}/${total}`);

        return new Response(ab.slice(start, end + 1), {
            status: 206,
            statusText: 'Partial Content',
            headers: headers,
        });
    });
}