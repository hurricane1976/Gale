/* GALE — privacy-preserving, browser-local RUM. No URLs, text, identifiers,
   or payloads leave this browser. Samples stay in localStorage. */
(function () {
  try {
    if (typeof window === "undefined") return;
    const KEY = "gale-rum-v2", LIMIT = 120;
    const load = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(x) ? x.filter((s) => s && typeof s.metric === "string" && Number.isFinite(s.value) && typeof s.page === "string").slice(-LIMIT) : []; } catch { return []; } };
    const samples = load();
    const pageFiles = new Set(["index.html", "fleet.html", "status.html", "metrics.html", "observability.html", "ollama.html", "agora.html", "weather.html", "network.html", "reliability.html", "operations.html", "home.html", "runbooks.html", "404.html"]);
    const requestedPage = location.pathname.split("/").pop() || "index.html";
    const context = {
      page: pageFiles.has(requestedPage) ? requestedPage : "404.html",
      viewport: innerWidth < 600 ? "phone" : innerWidth < 1000 ? "tablet" : "desktop",
      motion: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full",
    };
    const publish = () => {
      try { localStorage.setItem(KEY, JSON.stringify(samples.slice(-LIMIT))); } catch {}
      window.__galeRUM = samples.slice();
    };
    const push = (metric, value, unit = "ms", extra = {}) => {
      if (!Number.isFinite(value)) return;
      samples.push({ metric, value: Math.round(value * 1000) / 1000, unit, ...context, ...extra, ts: Date.now() });
      if (samples.length > LIMIT) samples.splice(0, samples.length - LIMIT);
      publish();
    };
    window.__galeRUM = samples.slice();
    window.__galeRUMRecord = (metric, value, unit, scene) => push(metric, value, unit, scene ? { scene } : {});
    window.__galeRUMClear = () => { samples.length = 0; try { localStorage.removeItem(KEY); } catch {} publish(); };
    const recordVisualInventory = () => {
      push("VIS_CANVAS", document.querySelectorAll("canvas").length, "canvases");
      push("VIS_SVG", document.querySelectorAll("svg").length, "SVG");
      let motion = 0;
      try { motion = document.getAnimations ? document.getAnimations().filter((a) => a.playState === "running").length : 0; } catch {}
      push("VIS_MOTION", motion, "running animations");
      const images = [...document.images].filter((img) => { try { return new URL(img.currentSrc || img.src, location.href).origin === location.origin; } catch { return false; } });
      push("IMAGE_COUNT", images.length, "images");
      push("IMAGE_DIMENSION_MISSING", images.filter((img) => img.complete && (!img.naturalWidth || !img.naturalHeight)).length, "loaded images without intrinsic dimensions");
      const imageResources = performance.getEntriesByType("resource").filter((entry) => entry.initiatorType === "img" && (() => { try { return new URL(entry.name).origin === location.origin; } catch { return false; } })());
      push("IMAGE_TRANSFER_KB", imageResources.reduce((total, entry) => total + (entry.transferSize || 0), 0) / 1024, "KB");
      const scripts = performance.getEntriesByType("resource").filter((entry) => entry.initiatorType === "script" && (() => { try { return new URL(entry.name).origin === location.origin; } catch { return false; } })());
      push("MODULE_COUNT", scripts.length, "modules");
      push("MODULE_LOAD_MS", scripts.reduce((total, entry) => total + entry.duration, 0), "ms total");
      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 0;
      push("ROOT_FONT_SIZE", rootFont, "CSS px");
      push("VIS_EFFECTIVE_DPR", window.devicePixelRatio || 1, "device scale factor");
      const safe = document.createElement("div");
      safe.style.cssText = "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
      document.body.append(safe);
      const insets = getComputedStyle(safe);
      push("VIS_SAFE_AREA_TOTAL", [insets.paddingTop,insets.paddingRight,insets.paddingBottom,insets.paddingLeft].reduce((sum,value)=>sum+(parseFloat(value)||0),0), "CSS px");
      safe.remove();
    };
    addEventListener("load", () => setTimeout(recordVisualInventory, 1500), { once: true });
    addEventListener("pagehide", recordVisualInventory, { once: true });
    push("PAGE_VIEW", 1, "views");
    const observe = (type, callback, options = {}) => {
      try { if (window.PerformanceObserver) new PerformanceObserver((list) => callback(list.getEntries())).observe({ type, buffered: true, ...options }); } catch {}
    };
    observe("largest-contentful-paint", (es) => { const e = es.at(-1); if (e) push("LCP", e.startTime); });
    let cls = 0;
    observe("layout-shift", (es) => { for (const e of es) if (!e.hadRecentInput) cls += e.value || 0; push("CLS", cls, "score"); });
    observe("event", (es) => { const worst = Math.max(0, ...es.map((e) => e.duration || 0)); if (worst) push("INP", worst, "ms approx"); }, { durationThreshold: 40 });
    observe("long-animation-frame", (es) => { for (const e of es) push("LONG_ANIMATION_FRAME", e.duration, "ms"); });
    observe("paint", (es) => { const e = es.find((x) => x.name === "first-contentful-paint"); if (e) push("FCP", e.startTime); });
    observe("longtask", (es) => { for (const e of es) push("LONGTASK", e.duration); });
    if (document.fonts) {
      const fontsStarted = performance.now();
      document.fonts.ready.then(() => push("FONT_READY", performance.now() - fontsStarted));
      document.fonts.addEventListener("loadingerror", () => push("FONT_ERROR", 1, "count"));
    }
    addEventListener("error", (e) => { if (e instanceof ErrorEvent) push("JS_ERROR", 1, "count"); else if (e.target && e.target !== window) push("ASSET_ERROR", 1, "count"); }, true);
    addEventListener("unhandledrejection", () => push("REJECTION", 1, "count"));
    let offlineAt = navigator.onLine ? 0 : Date.now();
    addEventListener("offline", () => { offlineAt = Date.now(); push("OFFLINE", 1, "events"); });
    addEventListener("online", () => { push("ONLINE", 1, "events"); if (offlineAt) push("OFFLINE_DURATION", Date.now() - offlineAt, "ms"); offlineAt = 0; });
    document.addEventListener("webglcontextlost", () => push("WEBGL_LOSS", 1, "events"), true);
    addEventListener("error", (e) => {
      if (e instanceof ErrorEvent) return;
      const target = e.target;
      if (target && target.tagName === "IMG") push("IMAGE_ERROR", 1, "count");
    }, true);
    const decodedImageSrc = new WeakMap();
    const inspectImageDecode = (img) => {
      if (!img || img.tagName !== "IMG" || !img.complete || !img.naturalWidth || typeof img.decode !== "function") return;
      let src = "";
      try { const url = new URL(img.currentSrc || img.src, location.href); if (url.origin !== location.origin) return; src = url.pathname; } catch { return; }
      if (!src || decodedImageSrc.get(img) === src) return;
      decodedImageSrc.set(img, src);
      img.decode().catch(() => push("IMAGE_DECODE_ERROR", 1, "count"));
    };
    const inspectLoadedImages = () => [...document.images].forEach(inspectImageDecode);
    addEventListener("load", inspectLoadedImages, { once: true });
    document.addEventListener("load", (event) => inspectImageDecode(event.target), true);
    if (window.MutationObserver && document.documentElement) {
      new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === "IMG") inspectImageDecode(node);
        node.querySelectorAll?.("img").forEach(inspectImageDecode);
      }))).observe(document.documentElement, { childList: true, subtree: true });
    }
    if (window.EventSource) {
      const NativeEventSource = window.EventSource;
      window.EventSource = class extends NativeEventSource {
        constructor(url, options) {
          super(url, options);
          let route = "";
          try { const u = new URL(String(url), location.href); if (u.origin === location.origin && u.pathname.startsWith("/api/")) route = u.pathname.split("/").filter(Boolean).slice(0, 2).join("/"); } catch {}
          this.addEventListener("error", () => push("SSE_ERROR", 1, "events", route ? { route } : {}));
          this.addEventListener("open", () => push("SSE_OPEN", 1, "events", route ? { route } : {}));
        }
      };
    }
    if (window.fetch) {
      const nativeFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        let api = false, route = "";
        try {
          const href = input instanceof Request ? input.url : String(input);
          const u = new URL(href, location.href);
          api = u.origin === location.origin && u.pathname.startsWith("/api/");
          if (api) {
            const parts = u.pathname.split("/").filter(Boolean);
            route = parts.length > 1 ? `${parts[0]}/${parts[1]}` : "api/other";
          }
        } catch {}
        const started = performance.now();
        return nativeFetch(input, init).then((response) => {
          if (api) push("API_LATENCY", performance.now() - started, "ms", { route });
          if (api && !response.ok) {
            push("API_HTTP_ERROR", 1, "responses", { route });
            if (response.status >= 500) push("API_5XX", 1, "responses", { route });
            else if (response.status >= 400) push("API_4XX", 1, "responses", { route });
          }
          if (api && performance.now() - started > 1500) push("API_SLOW", 1, "responses >1.5s", { route });
          if (api) { const length = Number(response.headers.get("content-length")); if (Number.isFinite(length) && length >= 0) push("API_RESPONSE_BYTES", length, "bytes", { route }); }
          return response;
        }, (error) => {
          if (api && error?.name !== "AbortError") push("API_NETWORK_ERROR", 1, "failures", { route });
          throw error;
        });
      };
    }
    addEventListener("load", () => {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) { push("TTFB", nav.responseStart); push("DOM_READY", nav.domContentLoadedEventEnd); push("LOAD", nav.loadEventEnd); }
      const rs = performance.getEntriesByType("resource").filter((e) => { try { return new URL(e.name).origin === location.origin; } catch { return false; } });
      push("RESOURCE_KB", rs.reduce((n, e) => n + (e.transferSize || 0), 0) / 1024, "KB");
      push("RESOURCE_SLOW", rs.filter((e) => e.duration > 1500).length, "count >1.5s");
    }, { once: true });
    addEventListener("pagehide", publish, { once: true });
    document.addEventListener("visibilitychange", () => { if (document.hidden) publish(); });
  } catch { /* enhancement-only; never interrupts page boot */ }
})();
