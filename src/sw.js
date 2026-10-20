// 오프라인 지원: 페이지는 네트워크 우선(실패 시 캐시), 정적 파일은 캐시 우선.
const CACHE = 'app-__VERSION__';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  const store = (response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  };
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(store).catch(() => caches.match(request, { ignoreSearch: true })));
  } else {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then(store)));
  }
});
