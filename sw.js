// Service Worker for World Monitor & Trading Terminal
const CACHE_NAME = 'worldmonitor-v2.3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let streaming & external APIs pass directly
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('binance.com') || 
      event.request.url.includes('yahoo.com') ||
      event.request.url.includes('generativelanguage.googleapis.com') ||
      event.request.url.includes('anthropic.com')) {
    return;
  }

  // Network-First Strategy: Always fetch latest deployed code from Vercel; fallback to cache only if offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
