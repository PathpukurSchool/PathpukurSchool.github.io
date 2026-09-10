const CACHE_NAME = 'phs-v1';
const ASSETS_TO_CACHE = [
  '/app.html',
  '/PHS-LOGO.png',
  '/photo/master_login_image.jpg',
  '/photo/phs.jpg',
  '/photo/phs_1.jpg',
  '/photo/phs_2.jpg',
  '/photo/phs_3.jpg',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
