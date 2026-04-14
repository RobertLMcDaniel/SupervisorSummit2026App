const CACHE_NAME = 'supervisor-summit-2026-v8';
const STATIC_ASSETS = [
  'index.html',
  'manifest.json?v=20260414-2',
  'icons/icon-192.png?v=20260414-2',
  'icons/icon-512.png?v=20260414-2',
  'icons/altamonte-logo.png?v=20260414-2',
  'data/speakers.json',
  'data/sessions/day1.json',
  'data/sessions/day2.json',
  'data/sessions/day3.json',
  'data/food/day1.json',
  'data/food/day2.json',
  'data/food/day3.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const isNavigation = request.mode === 'navigate';
  const isSameOrigin = new URL(request.url).origin === self.location.origin;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (isSameOrigin && networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (isNavigation) return caches.match('index.html');
          return Response.error();
        })
      )
  );
});
