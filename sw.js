const CACHE = "stillpoint-v6";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.svg"
];
const OPTIONAL_AUDIO = [
  "./audio/stillpoint-sit.mp3",
  "./audio/stillpoint-box.mp3",
  "./audio/stillpoint-wind.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      for (const url of OPTIONAL_AUDIO) {
        try {
          await cache.add(url);
        } catch (err) {
          // Audio optional for shell install.
        }
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const response = await fetch(request);
        // Skip Partial Content (206) — Cache.put fails on range responses.
        if (
          response &&
          response.ok &&
          response.status !== 206 &&
          new URL(request.url).origin === self.location.origin
        ) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        if (request.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        throw err;
      }
    })()
  );
});
