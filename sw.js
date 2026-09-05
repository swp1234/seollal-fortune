const RETIRED_PREFIX = 'seollal-fortune-';
const TARGET = '/fortune-cookie/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(RETIRED_PREFIX)).map((key) => caches.delete(key)));
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(clients.map((client) => client.navigate(TARGET)));
    await self.registration.unregister();
  })());
});
