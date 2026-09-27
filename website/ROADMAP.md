# Gale website — advanced technique roadmap

Drafted 2026-09-27, after the Poniente/Levante roster-completeness fix,
fleet.html blue-theme unification, SSE activity feed, esbuild build
pipeline, and the Prometheus/Alertmanager/Loki/Uptime Kuma monitoring
stack. Ranked by impact for this specific site's architecture (vanilla ES
modules, Python `http.server` backend, static multi-page HTML).

1. **PWA (service worker + manifest)** — installable, offline-capable
   shell, real push notifications to a device instead of routing
   everything through Telegram. *(shipped 2026-09-27, finished today:
   manifest, sw.js, icons, registration — and with item 11's https origin
   live, the full stack now works end-to-end on iOS 27: installed Home-
   Screen app, VAPID web push to the lock screen (pywebpush-backed
   sender in gale_push.py after a hand-rolled RFC8291 impl proved
   undecryptable-by-Safari), app-icon badging via the Badging API, sw
   receipt/diag telemetry, self-service test endpoint. See
   gale_push.service + /api/push/*.)*
2. **Extend SSE/WebSockets to every live panel** — *(shipped 2026-09-27:
   fleet_api.py now serves /metrics/stream, /alerts/stream and
   /observability/stream via a shared `_serve_sse` helper (pushes on
   change, heartbeats otherwise); metrics.js, observability.js and
   status.js (alerts strip + fleet 24h cards) consume them, each keeping
   the old setInterval poll as an automatic fallback when the stream
   fails or EventSource is missing.)*
3. **Islands architecture** — *(shipped 2026-09-27: fleet.html's two
   generated regions — gale-mesh SVG block and the Gale-host member-card
   group — are fenced with `<!-- island:... start/end -->` markers and
   sync_roster.py swaps them in one bounded operation each, with the old
   regexes as fallback for pages predating the markers.)*
4. **Real Web Components design system (Shadow DOM)** — *(shipped
   2026-09-27: `<gale-stat>` in shared.js — shadow root + one shared
   constructable stylesheet, theme via inherited custom properties,
   container-query responsive inside the shadow tree; observability.html's
   stats panel renders through it via patchList.)*
5. **WebGL/WebGPU topology diagram** — *(shipped 2026-09-27:
   topology3d.js — force-directed WebGL view of the same roster, read from
   the SVG's own markup so there's no second roster to drift; orbit-drag,
   wheel zoom, hidden by default behind a "3d view" toggle, SVG remains
   the default/print view.)*
6. **TypeScript + schema validation on the Python<->JS boundary** —
   *(shipped 2026-09-27 in two halves: runtime zod tripwire in
   payloads.js (item 9 work), and tools/gen_schema.py +
   payloads.schema.json + tools/check_schema.py — the committed JSON
   Schema contract validated against LIVE responses in smoke.sh, so a
   backend shape change fails the pipeline. A full TS migration of the
   page scripts remains open as its own future effort.)*
7. **OpenTelemetry traces into the new Grafana/Loki stack** — *(shipped
   2026-09-27: W3C traceparent on every data fetch (tracedFetch in
   shared.js); fleet_api.py parses it, emits one OTel-shaped JSON span per
   request to the journal (promtail -> Loki) honoring the parent span;
   verified end-to-end with curl. Query in Grafana:
   `{unit="gale-fleet-api.service"} | json | trace_id="..."`. Upgrade path
   to OTLP/Tempo = swap emit_span.)*
8. **CSS Container Queries + `@scope`** — *(shipped 2026-09-27: stat/
   target grids are container roots; cards compact by their own inline
   size, not the page's; `@scope (.fleet-24h-card)` contains the
   mini-note override.)*
9. **Fine-grained reactive state (signals)** — *(shipped 2026-09-27:
   signal/effect/bindText/bindHTML in shared.js — microtask-batched,
   identity-diffed DOM writes; status.js's freshness pipeline (render,
   SSE, 1s ticker, unreachable writers) now flows through one signal.)*
10. **Lighthouse CI + axe-core gating `build.mjs`** — accessibility/perf
     regressions fail the build instead of shipping silently.
     *(shipped 2026-09-27: `tools/audit.mjs` + `npm run audit`, wired into
     smoke.sh; gates accessibility ≥ 0.9 (axe-core), best-practices ≥ 0.9,
     seo ≥ 0.5 (deliberately loose — robots.txt Disallow / is by design),
     performance ≥ 0.6; the run surfaced and fixed real color-contrast
     failures: `--text-faint` 4.36→5.82:1, wake-copy label → `--flag-soft`
     7.6:1.)*
11. **HTTPS on the tailnet address (blocks item 1 from actually working)**
    — service workers only run on a "secure context" (`https://` or
    `localhost`); the site is plain `http://100.66.39.59:8090`, so the PWA
    built for item 1 won't register in a real browser as-is. Tailscale can
    issue a real cert for free via MagicDNS (`tailscale cert
    gale-agent.<tailnet>.ts.net`); nginx then needs a TLS listener using
    it. *(shipped 2026-09-27: operator enabled MagicDNS + HTTPS on
    tail2f1671.ts.net; `tailscale cert` issued a Let's Encrypt cert for
    `gale-agent.tail2f1671.ts.net`, nginx serves it on ports 443 + 8443 —
    https://gale-agent.tail2f1671.ts.net/ — alongside the plain-http
    8090 listener. Cert renews via tailscale; cert/key live in
    /etc/nginx/ssl/.)*
