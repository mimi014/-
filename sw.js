// Service Worker for YouTube Transcriber
const CACHE_NAME = 'transcriber-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// インストール
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// アクティベート
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// フェッチ
self.addEventListener('fetch', (event) => {
    // API リクエストはキャッシュしない
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('youtube.com') ||
        event.request.url.includes('yt.lemnoslife.com') ||
        event.request.url.includes('invidious') ||
        event.request.url.includes('nadeko.net') ||
        event.request.url.includes('puffyan.us')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // 有効なレスポンスでなければキャッシュしない
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
