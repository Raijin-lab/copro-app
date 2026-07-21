const CACHE_NAME = 'syndic-cache-v23'; // On passe à la v10 pour forcer la purge
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Installation : on force le nouveau système à prendre le contrôle immédiatement
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// Activation : on supprime impitoyablement les anciens caches bloqués
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception : Stratégie "Network First" (Internet en priorité, puis hors-ligne en secours)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
