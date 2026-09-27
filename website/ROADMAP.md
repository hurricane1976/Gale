# Gale website — advanced technique roadmap

Drafted 2026-09-27, after the Poniente/Levante roster-completeness fix,
fleet.html blue-theme unification, SSE activity feed, esbuild build
pipeline, and the Prometheus/Alertmanager/Loki/Uptime Kuma monitoring
stack. Ranked by impact for this specific site's architecture (vanilla ES
modules, Python `http.server` backend, static multi-page HTML).

1. **PWA (service worker + manifest)** — installable, offline-capable
   shell, real push notifications to a device instead of routing
   everything through Telegram. *(shipped 2026-09-27: manifest.json,
   sw.js, icons, registration in shared.js -- but see item 11: it won't
   actually register in a real browser until that's done, since the site
   is served over plain http:// on the tailnet IP, not a secure context.)*
2. **Extend SSE/WebSockets to every live panel** — *(shipped 2026-09-27:
   fleet_api.py now serves /metrics/stream, /alerts/stream and
   /observability/stream via a shared `_serve_sse` helper (pushes on
   change, heartbeats otherwise); metrics.js, observability.js and
   status.js (alerts strip + fleet 24h cards) consume them, each keeping
   the old setInterval poll as an automatic fallback when the stream
   fails or EventSource is missing.)*
3. **Islands architecture** — `tools/sync_roster.py` already treats the
   Gale cluster as a generated "island" inside static HTML. Formalizing
   that sitewide means near-zero JS shipped except where something is
   actually dynamic.
4. **Real Web Components design system (Shadow DOM)** — `<agent-card>`
   (shared.js) is light-DOM and proves the concept. Encapsulating
   stat-tiles/host-boards/topology-nodes the same way with Shadow DOM +
   constructable stylesheets avoids CSS specificity fights like the ones
   the fleet.html retheme had to route around.
5. **WebGL/WebGPU topology diagram** — the 91-edge mesh is hand-computed
   circular SVG (`tools/sync_roster.py`'s `gale_layout()`). A force-directed
   layout (d3-force) rendered via PixiJS/regl would scale to hundreds of
   nodes without hand-tuned geometry.
6. **TypeScript + schema validation on the Python<->JS boundary** — the
   Poniente/Levante bug was fundamentally a data-shape problem nobody
   caught. Zod/JSON-Schema validation at the API boundary catches that
   class of bug at build time.
7. **OpenTelemetry traces into the new Grafana/Loki stack** — the
   observability backend now exists; instrumenting `fleet_api.py` and the
   frontend with real traces (not just logs) makes a "waking" cycle
   traceable end-to-end.
8. **CSS Container Queries + `@scope`** — component-level responsiveness
   instead of page-level media queries.
9. **Fine-grained reactive state (signals)** — every page's `render()`
   re-stringifies and replaces `innerHTML` wholesale on every poll/push;
   a small signals primitive would cut wasted re-renders on high-frequency
   updates (SSE feed, live sparklines).
10. **Lighthouse CI + axe-core gating `build.mjs`** — accessibility/perf
    regressions fail the build instead of shipping silently.
11. **HTTPS on the tailnet address (blocks item 1 from actually working)**
    — service workers only run on a "secure context" (`https://` or
    `localhost`); the site is plain `http://100.66.39.59:8090`, so the PWA
    built for item 1 won't register in a real browser as-is. Tailscale can
    issue a real cert for free via MagicDNS (`tailscale cert
    gale-agent.<tailnet>.ts.net`); nginx then needs a TLS listener using
    it. *(shipped 2026-09-27: operator enabled MagicDNS + HTTPS on
    tail2f1671.ts.net; `tailscale cert` issued a Let's Encrypt cert for
    `gale-agent.tail2f1671.ts.net`, nginx serves it on port 8443 —
    https://gale-agent.tail2f1671.ts.net:8443/ — alongside the plain-http
    8090 listener. Cert renews via tailscale; cert/key live in
    /etc/nginx/ssl/.)*
