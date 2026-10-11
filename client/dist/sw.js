/**
 * sw.js — minimal service worker.
 *
 * A field worker may be in a cellar or at the edge of coverage, so the app
 * shell is cached and the interface still opens offline. API responses are
 * never cached: outage information must always be current.
 */

const CACHE = 'netzinfo-v1';
const SHELL = ['/', '/index.html', '/icon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api')) return;                 // never cache live data
  event.respondWith(caches.match(event.request)
    .then((hit) => hit || fetch(event.request).catch(() => caches.match('/index.html'))));
});
