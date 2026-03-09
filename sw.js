const CACHE_NAME = 'seollal-fortune-v1';
const ASSETS = [
  '/seollal-fortune/',
  '/seollal-fortune/index.html',
  '/seollal-fortune/css/style.css',
  '/seollal-fortune/js/app.js',
  '/seollal-fortune/js/i18n.js',
  '/seollal-fortune/js/locales/ko.json',
  '/seollal-fortune/js/locales/en.json',
  '/seollal-fortune/js/locales/ja.json',
  '/seollal-fortune/js/locales/zh.json',
  '/seollal-fortune/js/locales/hi.json',
  '/seollal-fortune/js/locales/ru.json',
  '/seollal-fortune/js/locales/es.json',
  '/seollal-fortune/js/locales/pt.json',
  '/seollal-fortune/js/locales/id.json',
  '/seollal-fortune/js/locales/tr.json',
  '/seollal-fortune/js/locales/de.json',
  '/seollal-fortune/js/locales/fr.json',
  '/seollal-fortune/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
