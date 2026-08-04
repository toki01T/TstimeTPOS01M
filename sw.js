/* T's time PWA service worker
 * Android / Chrome の「ホーム画面に追加」判定に必要な最小構成。
 * 印字用の大容量フォントは意図的にキャッシュしない。
 */
const CACHE_NAME = 'tstime-pwa-20260803a';
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './return.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // フォントや外部CDNはネットワーク優先（キャッシュ肥大化を避ける）
  if (url.pathname.indexOf('/fonts/') !== -1) {
    event.respondWith(fetch(request).catch(function() {
      return caches.match(request);
    }));
    return;
  }

  event.respondWith(
    caches.match(request).then(function(cached) {
      const networkFetch = fetch(request).then(function(response) {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });

      // 画面操作を止めないよう、キャッシュがあれば即返しつつ裏で更新
      return cached || networkFetch;
    })
  );
});
