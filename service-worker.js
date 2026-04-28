const CACHE_NAME = 'supervisor-summit-2026-v18';

const STATIC_ASSETS = [
  './',
  'index.html?v=20260428-2',
  'manifest.json?v=20260428-2',
  'icons/icon-192.png?v=20260428-2',
  'icons/icon-512.png?v=20260428-2',
  'icons/altamonte-logo.png?v=20260428-2',
  'images/SUPERVISOR.png?v=20260428-2'
];

// Keep video files OUT of service worker cache so autoplay/load works properly
const BYPASS_CACHE_PATTERNS = [
  /\.mp4(\?|$)/i,
  /open\.spotify\.com/i
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Never cache videos or Spotify embeds
  if (BYPASS_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
    );
    return;
  }

  // Always try fresh index first so updates show immediately
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put('index.html?v=20260428-2', copy);
          });

          return response;
        })
        .catch(() =>
          caches.match('index.html?v=20260428-2')
            .then((cached) => cached || caches.match('./'))
        )
    );
    return;
  }

  // Standard cache-first for normal assets
  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request))
  );
});
