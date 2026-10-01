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
const CACHE_VERSION = "gale-v13";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_ASSETS = [
  "/",
  "/index.html", "/fleet.html", "/status.html", "/metrics.html",
  "/observability.html", "/ollama.html", "/agora.html", "/weather.html",
  "/network.html", "/404.html",
  "/gale.css", "/fleet-tidal.css", "/mobile.css", "/cinematic.css", "/fonts.css", "/assets/fonts/inter.woff2", "/assets/fonts/fraunces.woff2", "/assets/fonts/jetbrains-mono.woff2",
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
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request))
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

/* ---- Web Push (gale_push.py): fleet crit alerts reach the lock screen;
   the payload's count badges the app icon (Badging API, where supported). ---- */
self.addEventListener("push", (event) => {
  // receipt beacon: did the SW even SEE the push? (fire-and-forget fetch,
  // must not block or fail the waitUntil chain)
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* keep defaults */ }
  const title = data.title || "GALE — fleet alert";
  event.waitUntil((async () => {
    try {
      await fetch("api/push/receipt", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seen: true, title,
          has_body: !!data.body, sev: data.sev || null,
          ts: new Date().toISOString() }) });
    } catch { /* beacon is best-effort */ }
    // showNotification FIRST and alone -- on iOS, if anything before it in
    // the waitUntil chain rejects or hangs, the push is consumed silently
    // (Apple shows nothing and reports nothing). Badge after, best-effort.
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
      if (self.navigator && self.navigator.setAppBadge && data.count != null) {
        await self.navigator.setAppBadge(Math.max(1, data.count));
      }
    } catch { /* badge is cosmetic */ }
  })());
});
self.addEventListener("push", (event) => { /* legacy handler removed -- single push listener above */ });

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
  // version handshake so the page can verify the ACTIVE sw has push support.
  // (self.PushManager doesn't exist in worker scope and the SW global has no
  // "push" property -- the honest check is feature-detection on the
  // ServiceWorkerGlobalScope: PushEvent constructor presence, which every
  // push-capable browser defines and old ones don't.)
  // Reply via broadcast (clients.matchAll) instead of event.source/MessagePort
  // transfer -- iOS home-screen PWAs have been unreliable with port transfer.
  if (event.data === "gale:ping") {
    self.clients.matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "gale:pong", version: CACHE_VERSION,
            push: typeof PushEvent !== "undefined" });
        }
      })
      .catch(() => {});
  }
});

/* ---- Offline wake queue (Background Sync). A "wake agent" tapped with no
   signal is stored in IndexedDB and replayed when connectivity returns --
   but only within WAKE_TTL_MS, since waking an agent 3 hours late on a
   stale tap would be a surprise. The server allowlist/flock still decides. */
const WAKE_TTL_MS = 15 * 60 * 1000;
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open("gale-sw", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("wakeq", { autoIncrement: true });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
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
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "gale:queue-wake" && event.data.agent) {
    event.waitUntil(queueWake(String(event.data.agent), false));
  }
});
