// SHFT Service Worker — App shell caching strategy
// IMPORTANT: Bump version when data files change to force refresh on all devices
const CACHE_NAME = "shft-v5";

// App shell files to pre-cache
const APP_SHELL = [
  "/",
  "/play",
  "/manifest.json",
];

// Data files to cache — 5-letter only
const DATA_FILES = [
  "/data/words-5.json",
  "/data/graph-5.json",
  "/data/common-5.json",
  "/data/unchainable-5.json",
  "/data/daily-puzzles.json",
];

// Install: pre-cache app shell and force activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// Activate: delete ALL old caches (forces fresh data on version bump)
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
  // Take control of all open tabs immediately
  self.clients.claim();
});

// Fetch: network-first for data files (ensures fresh data), cache-first for fonts
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for data files — always try to get fresh data,
  // fall back to cache only when offline
  if (DATA_FILES.some((file) => url.pathname === file)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline — serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for fonts (they never change)
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

  // Network-first for pages
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
});
