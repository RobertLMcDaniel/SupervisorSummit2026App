const CACHE_NAME = 'supervisor-summit-2026-v13-20260428';

const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json?v=20260414-2',
  'icons/icon-192.png?v=20260414-2',
  'icons/icon-512.png?v=20260414-2',
  'icons/altamonte-logo.png?v=20260414-2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const url = new URL(request.url);

  const isNavigation = request.mode === 'navigate';
  const isHtml = request.destination === 'document' || url.pathname.endsWith('.html');
  const isJson = url.pathname.endsWith('.json');
  const isImage = request.destination === 'image';
  const isVideo = request.destination === 'video' || url.pathname.endsWith('.mp4');
  const isServiceWorker = url.pathname.endsWith('service-worker.js');

  // Never cache the service worker file itself
  if (isServiceWorker) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Always fetch fresh HTML/pages first
  if (isNavigation || isHtml) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('index.html', responseClone);
          });
          return networkResponse;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Always fetch fresh JSON first
  if (isJson) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Network first for videos
  if (isVideo) {
    event.respondWith(
      fetch(request, { cache: 'reload' })
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Network first for images
  if (isImage) {
    event.respondWith(
      fetch(request, { cache: 'reload' })
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache first for everything else
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});
