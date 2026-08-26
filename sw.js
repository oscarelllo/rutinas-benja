/* =========================================================
   Service Worker: cachea el app shell para funcionamiento
   100% offline. Estrategia cache-first con actualización
   en segundo plano (stale-while-revalidate) para el resto.
   ========================================================= */

const CACHE_NAME = 'rutinas-caa-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/data.js',
  './js/storage.js',
  './js/confetti.js',
  './js/app.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached); // offline: usa lo cacheado si la red falla

      // cache-first: responde rápido desde caché si existe,
      // y actualiza en segundo plano cuando hay red.
      return cached || networkFetch;
    })
  );
});
