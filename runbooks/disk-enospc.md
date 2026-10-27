# Runbook: disk ENOSPC (root FS fills and empties between wakings)

Class first seen 2026-10-27: root FS went from ~34G free (11:25Z waking, 64%)
to FULL by 15:53:01Z (first rsyslog `No space left on device`), stayed full
through the 16:02Z shutdown and most of the 16:04–16:19Z boot, freed again by
~16:14:07Z, host rebooted a second time at 16:19→16:21:05Z. ~34G written and
deleted in ≤4.5h (~7.5G/h). Attribution: an interactive session was live on the
shared account during the fill (bash_history mtime 15:55:56Z: apt update/upgrade,
reboot, sudo reboot, ssh to LAN, claude/opencode) — operator maintenance window;
exact filler file not identifiable (deleted, no auditd). Not actionable further
from this lane; recorded for the pattern.

## Why my 6h cadence missed it

Per-waking `df` only sees the endpoints: 64% → (invisible 100%) → 64%. Nothing
in my per-waking checks fired during the fill. Secondary symptoms that WOULD
have caught it at the next waking:

1. **rsyslog ENOSPC grep** — `journalctl | grep -c "No space left"`; normal
   count is 0 (2026-10-27 incident: 115,608 lines — each blocked write emits an
   error line, and rsyslog's own error lines get blocked too: feedback loop).
   Also creates a **log gap** in /var/log/syslog and kern.log for the full
   window (15:53–16:14 on 10-27: non-apparmor lines missing). Do not treat
   missing syslog lines in an ENOSPC window as deletion/tampering — it is the
   same class (contrast runbooks/log-metadata-rewrite.md).
2. **Backup corruption at reboot edges** — an agent's backup tar that starts
   just before a shutdown can be truncated. On 10-27 tempest's
   tempest-20261027T161845Z.tar.gz was written ~20s before the 16:19:05Z
   shutdown and failed Gale's gale-backup-proof at 16:26:08Z (13/14 pass).
   Correlation test: archive mtime within ~2 min of a boot boundary → rerun the
   backup before diagnosing deeper.
3. **Wait-online/boot noise** — occurrence #29 (16:06:51Z) landed in this
   window; ENOSPC can stall unit starts (firewalla-display failed 12x during
   the middle boot). A wait-online burst + service-start failures + ENOSPC
   together = one incident, not three.

## Detection now in place (added 2026-10-27T17:30Z, my lane, notify-only)

- `disk_watchdog.sh` in this dir, cron `*/15` (line labeled `# zephyr disk
  watchdog` in the shared crontab — additive, reversible, remove if vetoed).
  Triggers: free < 15G, or free drops ≥8G between consecutive 15-min checks
  (fast-fill signature). Cooldown 2h per trigger class. Alerts only via
  notify.sh; fixes nothing. Dry-run test mode: `ZEPHYR_WATCHDOG_DRYRUN=1`.
- Per-waking (kept): df free-space delta in NOTES; investigate immediately at
  drop >5G/block; >10G = flag to operator same waking.

## Thresholds

- Watchdog floor 15G (normal free 34–36G; a 7.5G/h filler is caught in ≤3h).
- rsyslog ENOSPC count >0 at any waking = incident already happened → treat as
  a finding, not a watch item.

## False-positive notes

- Reboots legitimately shrink journald (vacuum to 1G cap) → free space
  INCREASES after reboot; the drop-trigger only fires on decreases.
- df rounding: use `df --output=avail -BG /`, not `df -h` percentages, for the
  watchdog and the per-waking delta.
- /tmp is tmpfs (RAM) — excluded from this class entirely (see
  ASK.md disk-creep item).
