'use strict';

const CACHE_VERSION = 'v1';
const CACHE_NAME = CACHE_VERSION;

const contentToCache = [
    '/zazen-timer/',
    '/zazen-timer/index.html',
    '/zazen-timer/sw.js',
    '/zazen-timer/manifest.json',
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