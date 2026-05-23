const CACHE_NAME = 'vetin-cache-v18';
const ASSETS = [
  './',
  './index.html',
  './common.css',
  './desktop-layout.css',
  './mobile-layout.css',
  './controls-3d.css',
  './main.js',
  './setup.js',
  './localization.js',
  './translations.js',
  './ui-handler.js',
  './app.js',
  './calculations.js',
  './draw-structure.js',
  './draw-loads.js',
  './draw-utilities.js',
  './download.js',
  './desktop-events.js',
  './mobile-events.js',
  './elastic-3d.js',
  './logo.svg',
  './icon.svg',
  './IUC.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
