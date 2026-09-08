const CACHE_NAME = 'phs-app-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index_style.css',
  './index.js',
  './manifest.json',
  './favicon.ico',
  './PHS-LOGO.png',
  './photo/phs.jpg',
  './photo/phs_7.jpg',
  './photo/phs_5.jpg',
  './photo/phs_6.jpg',
  './photo/hoi.png'
];

// Service Worker Install and Cache Resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate & Remove Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetching Strategy: Dynamic Offline Fallback with Supabase Exception
self.addEventListener('fetch', (event) => {
  // Ignore Supabase and Google Analytics Requests from Caching
  if (
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('googletagmanager.com') ||
    event.request.url.includes('google-analytics.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
