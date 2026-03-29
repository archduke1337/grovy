const CACHE_VERSION = "grovy-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = ["/offline.html", "/icons/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === "navigate";
}

function isRuntimeAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff|woff2)$/i.test(url.pathname);
}

async function networkThenCache(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function cacheThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await networkThenCache(request);
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (isNavigationRequest(request)) {
    event.respondWith(
      networkThenCache(request).catch(async () => {
        const cachedPage = await caches.match(request);
        if (cachedPage) return cachedPage;

        const offline = await caches.match("/offline.html");
        if (offline) return offline;

        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      })
    );
    return;
  }

  if (isRuntimeAsset(url)) {
    event.respondWith(cacheThenNetwork(request));
  }
});
