/* sw.js - PWA shell cache (pra gabriela) */
const CACHE_VERSION = "pwa-v7";
const APP_SHELL = [
  "./",
  "./index.html",
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
 * Cache-first para os assets buildados pelo Vite (JS/CSS com hash em
 * /assets/, ícones etc). Como o nome do arquivo muda a cada build, cacheamos
 * sob demanda em vez de depender de uma lista fixa.
 * Network-first para navegação e para tudo que não é same-origin (Firebase).
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // only handle GET
  if (req.method !== "GET") return;

  // nunca intercepta o dev server do Vite (HMR, módulos não empacotados,
  // @vite/client, @react-refresh etc.) — só existe em produção mesmo
  const isViteDevRequest =
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.searchParams.has("t") ||
    url.searchParams.has("import");
  if (isViteDevRequest) return;

  const isSameOrigin = url.origin === self.location.origin;
  const isBuiltAsset = isSameOrigin && url.pathname.startsWith("/assets/");
  const isIcon = isSameOrigin && url.pathname.startsWith("/icons/");
  const isStatic =
    isBuiltAsset ||
    isIcon ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".json");

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

  // network-first para navegação e chamadas externas (auth/firestore)
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (req.mode === "navigate") {
        const cache = await caches.open(CACHE_VERSION);
        try { cache.put("./index.html", fresh.clone()); } catch {}
      }
      return fresh;
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
