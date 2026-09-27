/* GALE — service worker. Plain script (not a module) for broadest browser
   support. Scope is the whole site (registered at "/").

   Strategy:
   - /api/* : never cached. This is a live monitoring dashboard; serving
     stale fleet/health data as if it were current would be actively
     misleading, so API calls always hit the network and simply fail
     offline rather than lie.
   - HTML navigations: network-first, falling back to the cached shell so
     the app still opens offline (content may be stale, but that's an
     expected, visible tradeoff for a page load vs. a live data point).
   - Static assets (css/js/icons): stale-while-revalidate.

   Bump CACHE_VERSION when shell assets change meaningfully -- the browser
   also re-checks this file byte-for-byte on its own schedule and updates
   if it differs, but a version bump forces immediate cache invalidation
   on activate. */
const CACHE_VERSION = "gale-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_ASSETS = [
  "/",
  "/index.html", "/fleet.html", "/status.html", "/metrics.html",
  "/observability.html", "/ollama.html", "/agora.html", "/weather.html",
  "/network.html", "/404.html",
  "/gale.css", "/fleet-tidal.css",
  "/dist/main.js", "/dist/fleet.js", "/dist/activity.js", "/dist/cost.js",
  "/dist/drilldown.js", "/dist/hosts.js", "/dist/particles.js",
  "/dist/metrics.js", "/dist/network.js", "/dist/observability.js",
  "/dist/status.js", "/dist/weather.js", "/dist/agora.js", "/dist/ollama.js",
  "/shared.js",
  "/manifest.json", "/favicon.ico", "/apple-touch-icon.png",
  "/icon-192.png", "/icon-512.png", "/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((e) => console.warn("sw: shell precache failed (non-fatal)", e))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache live data

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
