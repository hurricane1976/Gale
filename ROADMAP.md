17. **Wake/GPU observability bridges + cadence heatmap** — *(shipped
    2026-09-28: tools/gpu_bridge.py + monitoring/gale-gpu.rules.yml --
    Ollama /api/ps + tags and the josh-desktop11 collector /gpu become
    gale_ollama_* / gale_gpu_* Prometheus metrics via the node_exporter
    textfile bridge (cron */5, atomic .prom write, up=0-not-absent on
    upstream failure); tools/wake_bridge.py + monitoring/gale-wake.rules.yml
    -- crontab cadence + fleet_api runs + /proc live-session ages become
    gale_wake_* metrics, filling the gap gale-hardware.yml deliberately
    left ("agent missed-wake ... not Prom"); GaleOllamaDown is the first
    critical-severity inference alert. Fleet-api gains the compact
    /api/fleet/wakes envelope (5 fields/run, 60s cache -- ~51KB vs ~1MB
    telemetry) with the full three-leg contract (gen_schema JSON Schema +
    payloads.js zod + check_schema in smoke). status.html grows the 14d
    wake-cadence heatmap (14 agents x 56 six-hour UTC slots; green depth =
    session minutes, red = error run; row html deliberately
    time-independent so patchList doesn't replace 840 cells per tick, and
    the first fetch rides requestIdleCallback off the paint path).
    gale-backend.json gains GPU + wake-SLO panels. A/B baseline audit
    (pre-change release snapshot on :8091) proved status.html's perf-gate
    flicker 58-63 is pre-existing box load, not the panel.)*
18. **Operator console + credential-drift bridge** — *(shipped 2026-09-28:
    status.html stops being read-only. tools/cred_bridge.py +
    monitoring/gale-cred.rules.yml automate Poniente's hand-run keys/
    audit -- drift is measured against a seeded baseline
    (cred-baseline.json, the sudoers.sha256 pattern) rather than absolute
    ideals, so the operator-owned matrix (11x775, levante 664) never
    false-pages; a chmod round-trip verified detection both ways. The
    console panel adds manual wake chips (POST /api/fleet/wake: agent
    allowlist, /proc live-session + wake.sh-flock single-instance checks,
    30min per-agent cooldown, 6/hour global cap, wake-manual.jsonl audit
    trail -- same no-login tailnet model as the agora POST) and the live
    ask queue (GET /api/fleet/asks parses both ASK.md dialects for counts
    + titles; bodies stay in the agents' files per index.html's redaction
    rule). Contracts third-leg complete: asksPayload zod + JSON Schema +
    check_schema + render-test + smoke guard assertions.)*
