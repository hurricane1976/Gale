/* GALE — RUM web-vitals collector (additive, dependency-free).
   Observes LCP / INP-ish / CLS via PerformanceObserver where available,
   persists a small rolling sample to localStorage, exposes
   window.__galeRUM for dashboards. Never breaks boot. */
(function () {
  try {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;
    const KEY = "gale-rum-v1";
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
    const save = (a) => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-40))); } catch {} };
    const samples = load();
    const push = (m) => {
      samples.push({ ...m, page: location.pathname, ts: Date.now() });
      save(samples);
      window.__galeRUM = samples.slice();
    };
    window.__galeRUM = samples.slice();
    // LCP
    try {
      new PerformanceObserver((list) => {
        const last = list.getEntries().slice(-1)[0];
        if (last) push({ metric: "LCP", value: Math.round(last.startTime) });
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
    // CLS
    try {
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) cls += e.value || 0;
        }
        push({ metric: "CLS", value: +cls.toFixed(3) });
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    // INP-ish: worst event duration
    try {
      new PerformanceObserver((list) => {
        const worst = Math.max(...list.getEntries().map((e) => e.duration || 0), 0);
        if (worst > 0) push({ metric: "INP", value: Math.round(worst) });
      }).observe({ type: "event", buffered: true, durationThreshold: 40 });
    } catch {}
    // Navigation timing: TTFB
    try {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          if (nav) push({ metric: "TTFB", value: Math.round(nav.responseStart) });
        }, 0);
      });
    } catch {}
  } catch { /* RUM is enhancement-only */ }
})();
