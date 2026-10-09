# Runbook — rocketchat-snap apparmor DENIED log flood (detection side)

Incident class: a live snap's apparmor profile is too narrow for the snap's own
process, producing a continuous stream of `apparmor="DENIED"` kernel audit
lines that floods every rsyslog chain and evicts real kernel history from the
journald at its configured cap.

## What was seen (2026-10-09 23:30Z, Zephyr cheap watch)

- Source: `snap.rocketchat-server.rocketchat-mongo` profile, comm="ftdc",
  the snap's own mongo FTDC process reading `/proc/pressure/io`.
- Rate: 1100 DENIED lines / 10 min (~110/min, ~50M/day into kern.log+syslog).
- RocketChat 8.5.1 snap is live (0.0.0.0:3000) — not a leftover.
- Containment (working as configured): rsyslog `weekly` + `maxsize 500M`
  caps each chain file at ~500M; journald `SystemMaxUse=1G` pins disk usage
  at 968.4M. Total rsyslog ~2.1G + journal ~1G ≈ 3G; disk 56% used,
  42G free — no pressure. logrotate.service healthy (ran Oct 9 00:00,
  exit 0). 624K DENIED lines in the journal; pre-flood kernel history is
  already evicted by the cap.

## Cheap checks (all run as non-root, seconds)

1. Flood rate: `journalctl --since "10 min ago" --no-pager | grep -c 'apparmor="DENIED"'`
2. Journald cap: `journalctl --disk-usage` (compare against
   `grep SystemMaxUse /etc/systemd/journald.conf`)
3. rsyslog file sizes: `du -sh /var/log/kern.log /var/log/syslog /var/log/kern.log.1 /var/log/syslog.1`
4. logrotate liveness: `systemctl status logrotate.service -n 5` (must show a
   run within the last ~24h, exit 0) — do NOT infer "rotation stopped" from a
   current-file mtime; `weekly` + `maxsize` configs legitimately leave files
   untouched for days.

## Thresholds (alert via notify.sh)

- DENIED rate > 2000/10min sustained, or a second apparmor profile joins the
  top-DENIED list → alert (flood worsening / new denial class).
- Any single rsyslog file > 450M → note only (rotation window imminent at
  maxsize 500M); > 500M across all chains + disk free < 20G → alert.
- journald disk-usage > 980M **without** a configured SystemMaxUse cap →
  alert (unbounded journal growth; currently capped at 1G, so this is the
  misconfiguration trip-wire).
- logrotate.service no successful run in > 36h → alert.

## Fix side (NOT Zephyr — Gale/operator)

The canonical fix is widening the snap's apparmor profile to grant the
`ftdc` process read access to `/proc/pressure/io` (snap override file), or
the operator's call to remove/reconfigure the snap if port 3000 is unused.
Zephyr does not touch rocketchat, the snap, or rsyslog config — the live
service may be in use and log rotation config changes are recovery-side.
