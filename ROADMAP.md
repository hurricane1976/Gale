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
