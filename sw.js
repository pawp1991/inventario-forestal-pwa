const CACHE_NAME = 'inventario-forestal-v4.0';
const urlsToCache = [
    '/inventario-forestal-pwa/',
    '/inventario-forestal-pwa/index.html',
    '/inventario-forestal-pwa/styles.css',
    '/inventario-forestal-pwa/app.js',
    '/inventario-forestal-pwa/manifest.json',
    '/inventario-forestal-pwa/icon-192.png',
    '/inventario-forestal-pwa/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.log('Error en caché:', err);
            })
    );
    // Forzar activación inmediata
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eliminar cachés antiguos
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Tomar control inmediato
    self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si encuentra en caché, devolver la respuesta cacheada
                if (response) {
                    return response;
                }
                
                // Si no está en caché, hacer fetch
                return fetch(event.request).then(response => {
                    // No cachear si no es una respuesta válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clonar la respuesta
                    const responseToCache = response.clone();
                    
                    // Agregar al caché
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // Si falla el fetch (offline), mostrar página offline si existe
                    console.log('Sin conexión, usando caché');
                    return caches.match('/inventario-forestal-pwa/index.html');
                });
            })
    );
});

// Escuchar mensajes del cliente
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});