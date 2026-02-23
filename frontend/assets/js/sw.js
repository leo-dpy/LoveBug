const CACHE_NAME = 'lovebug-v1';
const urlsToCache = [
    '/',
    '/pages/index.html',
    '/pages/home.html',
    '/pages/discover.html',
    '/pages/friends.html',
    '/pages/chat.html',
    '/pages/profile.html',
    '/assets/css/style.css',
    '/assets/css/home.css',
    '/assets/css/discover.css',
    '/assets/css/friends.css',
    '/assets/css/chat.css',
    '/assets/css/profile.css',
    '/assets/js/main.js',
    '/assets/js/home.js',
    '/assets/js/discover.js',
    '/assets/js/friends.js',
    '/assets/js/chat.js',
    '/assets/js/profile.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Stratégie "Network First, fallback to cache" pour éviter des bugs de données périmées avec l'API
    if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
        // Ne pas mettre en cache les appels API et WebSockets
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
