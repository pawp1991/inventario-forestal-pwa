const CACHE_NAME = 'inventario-forestal-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Archivos en caché');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.log('Service Worker: Error en caché', error);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché viejo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si está en caché, devolverlo
                if (response) {
                    return response;
                }
                
                // Si no está en caché, hacer petición de red
                return fetch(event.request)
                    .then((response) => {
                        // Verificar si es una respuesta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar la respuesta
                        const responseToCache = response.clone();
                        
                        // Guardar en caché para futuras peticiones
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Si falla la red, mostrar página offline básica
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});