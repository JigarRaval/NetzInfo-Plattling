/**
 * sw.js — minimal service worker.
 *
 * A field worker may be in a cellar or at the edge of coverage, so the app
 * shell is cached and the interface still opens offline. API responses are
 * never cached: outage information must always be current.
 *
 * Network-first for HTML to avoid serving stale cached versions on refresh.
 * Cache-first for static assets for offline support.
 */

const CACHE = "stadtwerke-v2";
const STATIC_ASSETS = ["/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API requests
  if (url.pathname.startsWith("/api")) return;

  // Network-first for HTML to always get fresh content
  if (url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches
      .match(event.request)
      .then(
        (hit) =>
          hit || fetch(event.request).then((response) => {
            // Cache successful responses for static assets
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, responseClone));
            }
            return response;
          }).catch(() => caches.match("/index.html"))
      )
  );
});

/**
 * Push notifications.
 *
 * The server sends { title, body, url }. The notification is shown even when
 * the application is closed, and tapping it opens the app.
 */
self.addEventListener("push", (event) => {
  let data = { title: "Stadtwerke Plattling", body: "", url: "/" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "stadtwerke", // a newer message replaces the previous one
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) if ("focus" in client) return client.focus();
      return self.clients.openWindow("/");
    })
  );
});
