/* sw.js - PWA shell cache (pra gabriela) */
const CACHE_VERSION = "pwa-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./firebase.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE_VERSION ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

/**
 * Cache-first for static same-origin assets (css/js/icons/html).
 * Network-first for everything else (Firebase, gstatic, etc).
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // only handle GET
  if (req.method !== "GET") return;

  // same-origin static
  const isSameOrigin = url.origin === self.location.origin;
  const isStatic =
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/");

  if (isSameOrigin && isStatic) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      const fresh = await fetch(req);
      // best-effort cache
      try { cache.put(req, fresh.clone()); } catch {}
      return fresh;
    })());
    return;
  }

  // network-first for everything else (auth/firestore)
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch (e) {
      // if offline, try cached navigation fallback
      if (req.mode === "navigate") {
        const cache = await caches.open(CACHE_VERSION);
        const cachedIndex = await cache.match("./index.html", { ignoreSearch: true });
        if (cachedIndex) return cachedIndex;
      }
      throw e;
    }
  })());
});
