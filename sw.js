const CACHE_NAME = 'syndic-cache-v68'; // Incrémenter à chaque mise à jour de index.html
const LOCAL = ['./', './index.html', './manifest.json'];
const OPTIONAL = [
    './icon-192.png', './icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js'
];
const CACHEABLE_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

function shouldCache(url) {
    const u = new URL(url);
    return u.origin === self.location.origin || CACHEABLE_HOSTS.includes(u.hostname);
}

// Installation : fichiers locaux obligatoires, bibliothèques externes en "meilleur effort"
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
        await cache.addAll(LOCAL);
        await Promise.all(OPTIONAL.map(u =>
            fetch(new Request(u, u.startsWith('http') ? { mode: 'no-cors' } : {}))
                .then(r => cache.put(u, r)).catch(() => {})
        ));
    }));
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : null)))
            .then(() => self.clients.claim())
    );
});

// Réseau d'abord ; copie en cache au passage ; cache en secours hors ligne
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || !req.url.startsWith('http')) return;
    event.respondWith(
        fetch(req).then(res => {
            if (res && (res.ok || res.type === 'opaque') && shouldCache(req.url)) {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
            }
            return res;
        }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
    );
});
