/* GALE — service worker. Plain script (not a module) for broadest browser
   support. Scope is the whole site (registered at "/").

   Strategy:
   - /api/* : never cached. This is a live monitoring dashboard; serving
     stale fleet/health data as if it were current would be actively
     misleading, so API calls always hit the network and simply fail
     offline rather than lie.
   - HTML navigations: network-first with navigationPreload (when the
     browser supports it the request races ahead of SW activation),
     falling back to the cached shell, then to offline.html so an
     uncached deep link still gets a real page instead of a browser error.
   - /assets/vendor/ (leaflet): cache-first — vendored libraries are
     pinned and immutable; no reason to revalidate them per view.
   - Static assets (css/js/icons): stale-while-revalidate.

   Bump CACHE_VERSION when shell assets change meaningfully -- the browser
   also re-checks this file byte-for-byte on its own schedule and updates
   if it differs, but a version bump forces immediate cache invalidation
   on activate. */
const CACHE_VERSION = "gale-v19";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const ASSET_META_CACHE = `${CACHE_VERSION}-asset-meta`;
const RUNTIME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // pass #5 #18

function metadataKey(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`);
}
async function recordCacheTime(request) {
  try {
    const metadata = await caches.open(ASSET_META_CACHE);
    await metadata.put(metadataKey(request), new Response(JSON.stringify({ cached_at: Date.now() }), { headers: { "Content-Type": "application/json" } }));
  } catch { /* cache timestamps improve diagnostics but never gate content caching */ }
}

const SHELL_ASSETS = [
  "/",
  "/index.html", "/fleet.html", "/status.html", "/metrics.html",
  "/observability.html", "/ollama.html", "/agora.html", "/galaxy.html", "/weather.html",
  "/network.html", "/reliability.html", "/operations.html", "/home.html",
  "/runbooks.html", "/404.html", "/offline.html",
  "/gale.css", "/fleet-tidal.css", "/mobile.css", "/cinematic.css", "/fonts.css", "/assets/fonts/inter.woff2", "/assets/fonts/fraunces.woff2", "/assets/fonts/jetbrains-mono.woff2",
  "/dist/main.js", "/dist/fleet.js", "/dist/activity.js", "/dist/cost.js",
  "/dist/drilldown.js", "/dist/hosts.js", "/dist/particles.js",
  "/dist/metrics.js", "/dist/network.js", "/dist/observability.js",
  "/dist/status.js", "/dist/weather.js", "/dist/agora.js", "/dist/ollama.js",
  "/shared.js", "/rum.js", "/boot-shared.js", "/lost-boot.js", "/runbooks-steps.js", "/offline.js",
  "/storm-scene.css",
  /* dynamically imported modules (never bundled): palette, cinematic layer,
     kiosk mode, WebGPU sky, and the 404 map scene must survive offline too */
  "/palette.js", "/cinematic.js", "/cinematic.css", "/kiosk.js", "/glsky.js", "/lost.js",
  "/assets/vendor/leaflet/leaflet.css", "/assets/vendor/leaflet/leaflet.js",
  "/manifest.json", "/favicon.ico", "/apple-touch-icon.png",
  "/icon-192.png", "/icon-512.png", "/icon-512-maskable.png", "/icon-192-maskable.png",
  "/pwa-screenshots/gale-mobile.jpg", "/pwa-screenshots/gale-wide.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      /* pass #5 #23: per-item precache instead of cache.addAll — one missing
         asset (a page renamed in a deploy, a screenshot dropped) used to fail
         the WHOLE shell install and leave the worker non-functional. Missing
         entries degrade to runtime caching instead of killing offline. */
      .then(async (cache) => {
        await Promise.all(SHELL_ASSETS.map(async (asset) => {
          try { await cache.add(new Request(asset, { cache: "reload" })); }
          catch (e) { console.warn(`sw: precache miss (non-fatal): ${asset}`, String(e).slice(0, 80)); }
        }));
      })
      .then(async () => {
        const shell = await caches.open(SHELL_CACHE);
        await Promise.all((await shell.keys()).map(recordCacheTime));
      })
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
      // startup prune (#4): over-TTL wake entries are dead weight when
      // Background Sync never fires (Safari/Firefox) — drop at activation.
      .then(async () => {
        try {
          const items = await tx("readonly", (s) => s.getAll());
          const keys = await tx("readonly", (s) => s.getAllKeys());
          for (let i = 0; i < (items || []).length; i++) {
            if (Date.now() - Number(items[i].at || 0) > WAKE_TTL_MS) {
              await tx("readwrite", (s) => s.delete(keys[i]));
            }
          }
        } catch { /* queue is optional */ }
      })
      /* pass #5 #18: prune runtime-cache entries older than 30 days so a
         long-lived PWA doesn't accumulate stale assets forever. */
      .then(async () => {
        try {
          const rt = await caches.open(RUNTIME_CACHE);
          const meta = await caches.open(ASSET_META_CACHE);
          const keys = await rt.keys();
          await Promise.all(keys.map(async (req) => {
            const m = await meta.match(metadataKey(req));
            if (!m) return;
            const { cached_at: at } = await m.json().catch(() => ({}));
            if (at && Date.now() - Number(at) > RUNTIME_MAX_AGE_MS) {
              await rt.delete(req); await meta.delete(metadataKey(req));
            }
          }));
        } catch { /* prune is best-effort */ }
      })
      .then(() => {
        /* pass #5 #12: navigationPreload lets the browser fire the
           navigation request while the SW is still starting up — shaves
           the SW-startup latency off the first navigation after launch. */
        if (self.registration.navigationPreload) {
          self.registration.navigationPreload.enable().catch(() => {});
        }
        return self.clients.claim();
      })
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
      /* pass #5 #12: consume the preloaded navigation response when the
         browser already issued it during SW startup. Falls back to a fresh
         fetch when preload wasn't enabled or already consumed. */
      event.preloadResponse
        .then((pre) => pre || fetch(request))
        .then((res) => {
          // only durable successes may enter the shell cache: a transient 500/404
          // HTML must never become the offline fallback for this URL (#1)
          if (res.ok) {
            const copy = res.clone();
            // register the write with waitUntil so SW termination can't drop it (#5)
            event.waitUntil(caches.open(SHELL_CACHE).then(async (c) => { await c.put(request, copy); await recordCacheTime(request); }));
          }
          return res;
        })
        // ignoreSearch: ?kiosk=20 and the bare path are the same shell page (#2).
        // Last resort (pass #5 #6): the dedicated offline.html shell — the
        // visitor still gets a real, navigable page instead of a dino.
        .catch(() => caches.match(request, { ignoreSearch: true })
          .then((r) => r || caches.match("/index.html", { ignoreSearch: true }))
          .then((r) => r || caches.match("/offline.html", { ignoreSearch: true })))
    );
    return;
  }

  // Vendored libraries (/assets/vendor/, leaflet): CACHE-FIRST. Pinned at
  // deploy time, immutable in practice; revalidating them per view just
  // burns tailnet round-trips (pass #5 #16).
  if (url.pathname.startsWith("/assets/vendor/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          event.waitUntil(caches.open(RUNTIME_CACHE).then(async (c) => { await c.put(request, copy); await recordCacheTime(request); }));
        }
        return res;
      }))
    );
    return;
  }

  // JS chunks + stylesheets: NETWORK-FIRST. These files are tiny and this
  // is a live dashboard -- a stale chunk can silently break or mislead (a
  // stale sw.js chunk once made push delivery look broken for an hour), and
  // a stale stylesheet layouts new markup wrong for a whole reload cycle
  // (observed: new sparkline panels rendered unstyled until the SWR caught
  // up on the SECOND load). Cache stays as the offline fallback only.
  if (url.pathname.startsWith("/dist/") || url.pathname.endsWith(".js")
      || url.pathname.endsWith(".css")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // pass #5 #17: only cache real same-origin successes — opaque
          // responses (no-cors cross-origin) can never be inspected and a
          // failed opaque insert poisons the cache entry for its lifetime.
          if (res && res.ok && res.type !== "opaque") {
            const copy = res.clone();
            event.waitUntil(caches.open(RUNTIME_CACHE).then(async (c) => { await c.put(request, copy); await recordCacheTime(request); }));
          }
          return res;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok && res.type !== "opaque") {
            const copy = res.clone();
            event.waitUntil(caches.open(RUNTIME_CACHE).then(async (c) => { await c.put(request, copy); await recordCacheTime(request); }));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* ---- Web Push (gale_push.py): fleet crit alerts reach the lock screen;
   the payload's count badges the app icon (Badging API, where supported). ---- */
self.addEventListener("push", (event) => {
  // receipt beacon: did the SW even SEE the push? (fire-and-forget fetch,
  // must not block or fail the waitUntil chain)
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* keep defaults */ }
  const title = data.title || "GALE — fleet alert";
  event.waitUntil((async () => {
    const opts = {
      body: data.body || "A fleet alert fired.",
      badge: "/icon-192.png",
      icon: "/icon-192.png",
      data: { url: data.url || "/status.html" },
    };
    if (data.sev === "crit") { opts.tag = "gale-crit"; opts.renotify = true; }
    // action buttons (Android/desktop; iOS ignores them and just shows the
    // tap target). Wake only when the push names an agent (server allowlist
    // still decides). A runbook link is optional.
    const actions = [{ action: "open", title: "Open" }];
    if (data.agent) actions.push({ action: "wake", title: `Wake ${String(data.agent).slice(0, 18)}` });
    if (data.runbook) actions.push({ action: "runbook", title: "Runbook" });
    opts.actions = actions.slice(0, (self.Notification && Notification.maxActions) || 2);
    opts.data.agent = data.agent || null;
    opts.data.runbook = data.runbook || null;
    try {
      await self.registration.showNotification(title, opts);
    } catch (e) {
      // a failing icon/badge fetch can reject showNotification on iOS --
      // retry bare (text-only), which always displays
      try { await self.registration.showNotification(title, {
        body: opts.body, data: opts.data }); } catch {}
    }
    try {
      // pass #5 #21: badge only for a real count — a 0 previously badge-"1".
      if (self.navigator && self.navigator.setAppBadge && Number(data.count) > 0) {
        await self.navigator.setAppBadge(Math.max(1, Number(data.count)));
      }
    } catch { /* badge is cosmetic */ }
    // receipt beacon AFTER showNotification: a slow/hanging beacon must never
    // hold the waitUntil chain past the push delivery window (#3; the comment
    // above always demanded this order). Fire-and-forget with a 3s deadline.
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 3000);
      await fetch("/api/push/receipt", { method: "POST", signal: ctl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true, title,
          has_body: !!data.body, sev: data.sev || null,
          ts: new Date().toISOString() }) });
      clearTimeout(timer);
    } catch { /* beacon is best-effort */ }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const nd = event.notification.data || {};
  if (event.action === "wake" && nd.agent) {
    // act without opening the app; queue for Background Sync if offline
    event.waitUntil(queueWake(nd.agent, true));
    return;
  }
  const url = (event.action === "runbook" && nd.runbook) || nd.url || "/status.html";
  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientList) {
      if (new URL(client.url).origin === self.location.origin && "focus" in client) {
        client.navigate(url).catch(() => {});
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});

/* Badge clears when the operator is actually looking at the site */
self.addEventListener("message", (event) => {
  if (event.data === "gale:clear-badge" && self.navigator && self.navigator.clearAppBadge) {
    try { self.navigator.clearAppBadge(); } catch {}
  }
  // page-detected update: activate a waiting worker immediately
  if (event.data === "gale:skip-waiting") self.skipWaiting();
  if (event.data === "gale:wake-queue-status") {
    event.waitUntil((async () => {
      try {
        const items = await tx("readonly", (store) => store.getAll());
        const ages = (items || []).map((item) => Math.max(0, Date.now() - Number(item.at || Date.now())));
        event.source?.postMessage({ type: "gale:wake-queue-status", count: ages.length, oldest_age_ms: Math.max(0, ...ages) });
      } catch { event.source?.postMessage({ type: "gale:wake-queue-status", unavailable: true }); }
    })());
  }
  // page asks the worker to drain the offline wake queue now (browsers without
  // Background Sync never fire the sync event, so the page triggers the drain
  // when connectivity returns — see shared.js connectivity hook)
  if (event.data === "gale:drain-wake-queue") {
    event.waitUntil(drainWakeQueue().catch(() => {}));
  }
  // offline-tapped wake queued by the page (same consolidated listener, #7)
  if (event.data && event.data.type === "gale:queue-wake" && event.data.agent) {
    event.waitUntil(queueWake(String(event.data.agent), false));
  }
  // version handshake so the page can verify the ACTIVE sw has push support.
  // (self.PushManager doesn't exist in worker scope and the SW global has no
  // "push" property -- the honest check is feature-detection on the
  // ServiceWorkerGlobalScope: PushEvent constructor presence, which every
  // push-capable browser defines and old ones don't.)
  // Reply via broadcast (clients.matchAll) instead of event.source/MessagePort
  // transfer -- iOS home-screen PWAs have been unreliable with port transfer.
  if (event.data === "gale:ping") {
    event.waitUntil((async () => {
      // pass #5 #15: pong carries shell cache entry counts so the
      // Reliability panel can show real offline-shell coverage.
      let shellCount = null, runtimeCount = null;
      try {
        shellCount = (await (await caches.open(SHELL_CACHE)).keys()).length;
        runtimeCount = (await (await caches.open(RUNTIME_CACHE)).keys()).length;
      } catch { /* counts are diagnostic only */ }
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" }).catch(() => []);
      for (const client of clients) {
        client.postMessage({ type: "gale:pong", version: CACHE_VERSION,
          push: typeof PushEvent !== "undefined",
          shell_count: shellCount, runtime_count: runtimeCount });
      }
    })());
  }
  // pass #5 #14: a page can ask the worker to (re)warm the shell — used
  // after reconnect so a restored tab gets fresh offline coverage.
  if (event.data === "gale:cache-warm") {
    event.waitUntil((async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(SHELL_ASSETS.map(async (asset) => {
        try { await cache.add(new Request(asset, { cache: "reload" })); } catch { /* best-effort */ }
      }));
    })());
  }
});

/* pass #5 #13: periodic background sync (Chromium-only, guarded) keeps the
   offline shell warm without a page being open. Registration failure is
   expected on Safari/Firefox — silent there, the activate-time prune and
   page-triggered drain already cover those engines. */
self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "gale-shell-warm") return;
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL_ASSETS.slice(0, 24).map(async (asset) => {
      try { await cache.add(new Request(asset, { cache: "reload" })); } catch { /* best-effort */ }
    }));
  })());
});

/* ---- Offline wake queue (Background Sync). A "wake agent" tapped with no
   signal is stored in IndexedDB and replayed when connectivity returns --
   but only within WAKE_TTL_MS, since waking an agent 3 hours late on a
   stale tap would be a surprise. The server allowlist/flock still decides. */
const WAKE_TTL_MS = 15 * 60 * 1000;
let idbPromise = null;
const idb = () => (idbPromise ||= new Promise((res, rej) => {
  const r = indexedDB.open("gale-sw", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("wakeq", { autoIncrement: true });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
}));
const tx = async (mode, fn) => {
  const db = await idb();
  return new Promise((res, rej) => {
    const t = db.transaction("wakeq", mode);
    const out = fn(t.objectStore("wakeq"));
    t.oncomplete = () => res(out && out.result);
    t.onerror = () => rej(t.error);
  });
};
async function postWake(agent) {
  const r = await fetch("/api/fleet/wake", { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent }) });
  return r.status < 500;
}
async function queueWake(agent, tryNow) {
  if (tryNow) { try { if (await postWake(agent)) return; } catch { /* offline: queue it */ } }
  await tx("readwrite", (s) => s.add({ agent, at: Date.now() }));
  if (self.registration.sync) { try { await self.registration.sync.register("gale-wake"); } catch {} }
}
async function drainWakeQueue() {
  const items = await tx("readonly", (s) => s.getAll());
  const keys = await tx("readonly", (s) => s.getAllKeys());
  for (let i = 0; i < (items || []).length; i++) {
    const it = items[i];
    if (Date.now() - it.at <= WAKE_TTL_MS) { if (!(await postWake(it.agent))) throw new Error("retry"); }
    await tx("readwrite", (s) => s.delete(keys[i]));
  }
}
self.addEventListener("sync", (event) => {
  if (event.tag === "gale-wake") event.waitUntil(drainWakeQueue());
});
