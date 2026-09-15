const CACHE_NAME = 'tareas-app-v2';
const OFFLINE_URL = './offline.html';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
];

// Instalación: cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Solicitudes de navegación (documentos HTML): Network First → caché offline
  if (event.request.mode === 'navigate' ||
      (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Cache First para assets locales y recursos externos conocidos
  if (
    url.origin === self.location.origin ||
    url.origin === 'https://cdnjs.cloudflare.com'
  ) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then((cachedResponse) => {
          // Devolver caché inmediatamente, pero también intentar actualizar en segundo plano
          const networkResponse = fetch(event.request).then((networkResp) => {
            if (networkResp && networkResp.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResp.clone());
              });
            }
            return networkResp;
          }).catch(() => null);
          return cachedResponse || networkResponse;
        })
    );
    return;
  }

  // Network First para todo lo demás
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Manejar mensajes (para actualizaciones manuales)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

