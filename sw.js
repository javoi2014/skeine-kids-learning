/* Skeine Kids Learning - Service Worker (cache + update friendly) */

const CACHE = "skeine-kids-v6"; // bump this number anytime you want force-update

const ASSETS = [
  "/",                 // important
  "/index.html",
  "/app.js",
  "/manifest.webmanifest",
  "/icon.svg",
  // Optional (recommended icons for install)
  "/icon-192.png",
  "/icon-512.png",
  "/jayce.png",
  "/jayde.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // delete old caches
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
    // take control immediately
    await self.clients.claim();
  })());
});

// Network-first for HTML so updates appear immediately.
// Cache-first for everything else so it's fast/offline.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // HTML: network first (so updates show)
  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // Other assets: cache first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
