// SHFT Service Worker — App shell caching strategy
const CACHE_NAME = "shft-v1";

// App shell files to pre-cache
const APP_SHELL = [
  "/",
  "/play",
  "/practice",
  "/manifest.json",
];

// Data files to cache on first use
const DATA_FILES = [
  "/data/words-3.json",
  "/data/words-4.json",
  "/data/words-5.json",
  "/data/words-6.json",
  "/data/graph-3.json",
  "/data/graph-4.json",
  "/data/graph-5.json",
  "/data/graph-6.json",
  "/data/daily-puzzles.json",
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for data files, network-first for pages
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache-first for data files (word lists, graphs, puzzles)
  if (DATA_FILES.some((file) => url.pathname === file)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Cache-first for fonts
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else (pages, API)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
});
