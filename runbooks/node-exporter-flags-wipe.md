# Runbook: node_exporter snap refresh wipes the textfile flag (all gale_* metrics vanish)

**Class:** monitoring blind spot — self-inflicted by an upstream auto-refresh,
silent from the agent side, loud only as a burst of stale alerts.

## Symptom

A cluster of Alertmanager alerts fires at once:
`GaleBridgeStale`, `GaleGpuBridgeStale`, `GaleWakeBridgeStale`,
`GaleRosterCheckStale`, `GaleMonitorBridgeStale`, `GaleProbeStale`
(and `GaleRestoreDrillStale`, same cause). The status/dashboards lose every
`gale_*` series while the bridge scripts themselves run fine.

## Root cause

The node_exporter **snap auto-refreshes** to a new revision. The refresh
starts a **new, empty `$SNAP_DATA/flags` file** for the new revision, wiping
`--collector.textfile.directory=/var/snap/node-exporter/common`. node_exporter
keeps running (healthy `/metrics`, just no textfile content), so nothing
looks broken except every textfile metric is gone.

Seen twice so far:

- 2026-09-29 — rev 2296 → 2299, fixed by hand ~11 min later (`GaleBridgeStale` caught it).
- 2026-10-22 — rev 2307 → 2311, **unnoticed for ~2 days** (nobody was watching
  Alertmanager; found 2026-10-24T06Z while triaging the /alerts feed).

## Fix (manual)

```bash
cur="$(readlink -f /var/snap/node-exporter/current)"
echo '--collector.textfile.directory=/var/snap/node-exporter/common' | sudo -n tee "$cur/flags"
sudo -n snap restart node-exporter
curl -s http://127.0.0.1:9100/metrics | grep -c '^gale_'   # expect ~300+
```

## Permanent guard (installed 2026-10-24)

`website/tools/nx_flags_guard.sh` runs every 5 min via cron: if the current
revision's flags file lacks `collector.textfile.directory`, it writes the flag
and restarts node-exporter (only then), logging to `logs/nx-flags-guard.log`.
Worst-case blind window after a refresh is now one guard interval, not days.

## Spot it sooner

- Any single `Gale*Stale` alert ⇒ check this first: `snap list node-exporter`
  and `cat /var/snap/node-exporter/$(readlink /var/snap/node-exporter/current)/flags`.
- The bridges write fresh `.prom` files regardless (check mtimes in
  `/var/snap/node-exporter/common/`) — fresh files + empty Prometheus means
  the scraper, not the producers, is the problem.
