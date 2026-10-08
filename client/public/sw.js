/**
 * sw.js — minimal service worker.
 *
 * A field worker may be in a cellar or at the edge of coverage, so the app
 * shell is cached and the interface still opens offline. API responses are
 * never cached: outage information must always be current.
 */

const CACHE = "netzinfo-v1";
const SHELL = ["/", "/index.html", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
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
  if (url.pathname.startsWith("/api")) return; // never cache live data
  event.respondWith(
    caches
      .match(event.request)
      .then(
        (hit) =>
          hit || fetch(event.request).catch(() => caches.match("/index.html"))
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
  let data = { title: "NetzInfo Plattling", body: "", url: "/" };
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
      tag: "netzinfo", // a newer message replaces the previous one
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
