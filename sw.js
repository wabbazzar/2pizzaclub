// sw.js — 2pizzaclub service worker.
//
// Makes the installed PWA load instantly and work offline. Strategy is
// stale-while-revalidate: same-origin GETs are served from cache immediately,
// then refreshed in the background, so a deploy lands on the next visit. Media
// and model weights are streamed from the network (never cached here) to keep
// storage bounded and range-requests intact.
//
// Bump CACHE_VERSION to retire old caches on the next activate.

const CACHE_VERSION = 'v1';
const CACHE = `2pc-${CACHE_VERSION}`;

// App shell — precached on install so the first offline launch has everything
// the timeline needs to paint. bundle.json carries the whole corpus.
const SHELL = [
    '/',
    '/index.html',
    '/styles.css',
    '/evidence.js',
    '/dag.js',
    '/narrative.js',
    '/themes.js',
    '/search.js',
    '/timeline.js',
    '/mobile-nav.js',
    '/bundle.json',
    '/sources/evidence/manifest.json',
    '/sources/captures/manifest.json',
    '/chapters/narrative.json',
    '/manifest.webmanifest',
    '/icon.svg',
];

// Never cache these — large media / model weights / range-seekable files.
const BYPASS_EXT = /\.(webm|mkv|mp4|m4a|wav|onnx|srt|vtt)$/i;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            // addAll is atomic — one 404 fails the whole install — so add
            // individually and tolerate a missing optional file.
            .then((cache) => Promise.all(SHELL.map((u) => cache.add(u).catch(() => null))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only same-origin GETs. Let the browser handle cross-origin (fonts, CDN
    // imports), non-GET, and range/media requests directly.
    if (req.method !== 'GET') return;
    if (req.headers.has('range')) return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    if (BYPASS_EXT.test(url.pathname)) return;

    // Stale-while-revalidate: respond from cache if present, and in parallel
    // fetch a fresh copy to update the cache for next time.
    event.respondWith(
        caches.open(CACHE).then((cache) =>
            cache.match(req).then((cached) => {
                const network = fetch(req).then((res) => {
                    if (res && res.ok && res.type === 'basic') {
                        cache.put(req, res.clone());
                    }
                    return res;
                }).catch(() => cached);
                return cached || network;
            })
        )
    );
});
