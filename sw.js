const CACHE_NAME = 'vetin-cache-v25';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './common.css',
  './desktop-layout.css',
  './mobile-layout.css',
  './controls-3d.css',
  './main.js',
  './setup.js',
  './localization.js',
  './translations.js',
  './ui-handler.js',
  './cut-method.js',
  './fullscreen-panels.js',
  './app.js',
  './calculations.js',
  './draw-structure.js',
  './draw-loads.js',
  './draw-utilities.js',
  './download.js',
  './desktop-events.js',
  './mobile-events.js',
  './elastic-3d.js',
  './models-gallery.js',
  './models/models-data.js',
  './vendor/chart.umd.min.js',
  './vendor/d3.v7.min.js',
  './vendor/three.min.js',
  './vendor/OrbitControls.js',
  './logo.svg',
  './icon.svg',
  './IUC.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install: çekirdek varlıkları önbelleğe al, yeni SW'yi bekletmeden etkinleştir
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: eski önbellekleri temizle ve açık sekmeleri hemen devral
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch stratejisi:
// - HTML (gezinme istekleri): önce ağ — güncellemeler CACHE_NAME artırmadan ulaşır;
//   çevrimdışıyken önbellekteki kopyaya düşer.
// - Diğer istekler: önce önbellek; yoksa ağdan al ve başarılı GET yanıtlarını
//   çalışma zamanında önbelleğe ekle.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => Response.error());
    })
  );
});
