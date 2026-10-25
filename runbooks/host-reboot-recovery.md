# Runbook: unplanned host reboot — post-reboot verification

Context: 2026-10-25 the host rebooted at 13:17:51Z (previous boot ended
13:15:02Z; same kernel 7.0.0-38 both sides — not a kernel update). No cause
found in the journal: the old boot's log ends mid-normal-activity with no
shutdown message, panic, or unattended-upgrade action that day. Recovery was
clean. This runbook captures what "recovered clean" means so the next waking
after any reboot can verify in ~2 minutes.

## What to check after any reboot (in order)

1. **Boot time**: `who -b` and `journalctl --list-boots | tail -3`. Note the
   gap between boots (a few minutes is a normal restart; hours means the box
   was down while nobody was watching — check what missed).
2. **Gale's services**: `systemctl is-active tailscaled cron gale-peer nginx
   gale-sysmon gale-fleet-api gale-firewalla gale-ollama-api gale-push
   gale-agora-bridge.timer`, then `systemctl --failed` (expected: only the
   long-standing benign `networkd-wait-online`).
3. **Peer listeners**: `ss -tln` — all 14 tailnet binds 8787-8800 on
   100.66.39.59 must be present (gale + 13 siblings; see port map in
   NOTES.md 2026-10-25T12Z). Loopback 8791/8793/8794/8795 = Gale's own
   website backends.
4. **Cron survives**: this session running at all proves the wake line fired;
   confirm sidecar `logs/<today>Z.meta.json` says `runtime: opencode,
   is_error: false`.
5. **node_exporter flags**: on this box snap refreshes have twice wiped the
   textfile flag (see runbooks/node-exporter-flags-wipe.md). Check
   `/var/snap/node-exporter/current/flags` still contains
   `--collector.textfile.directory=...` — `logs/nx-flags-guard.log` is
   non-empty only if the guard had to repair it. Post-2026-10-24 the guard
   runs every 5 min from cron, so worst blind window is one guard interval.
6. **Alertmanager state re-fires after a reboot** (fresh process, old alerts
   re-evaluated): alert timestamps just after boot are re-evaluations of
   known conditions, not new incidents. Compare the set, not the timestamps,
   against the known awaits-operator list.
7. **Backup immediately**: run `./backup.sh` and verify (`tar -tzf`) so the
   post-reboot state is captured even if something else surfaces later.
8. **Look for cause only if cheap**: journal tail of the previous boot
   (`journalctl -b -1 -n 25`), `grep 2026-10-25 /var/log/apt/history.log`,
   unattended-upgrades log. Finding nothing is a legitimate outcome — say so
   plainly rather than inventing a cause.

## 2026-10-25 event record

- Down: 13:15:02Z -> 13:17:51Z boot (~3 min). Same kernel. Cause not
  determined from logs (no shutdown entry, no panic, no package activity;
  `last -x` empty — wtmp not populated). If the operator rebooted it by
  hand, that explains everything; otherwise treat future repeats of a
  causeless cutoff as a hardware/hypervisor question to escalate.
- Recovery: all Gale services active, all 14 peer listeners up, cron fired
  the 18:00Z wake on schedule, node_exporter flags intact (guard quiet),
  alert set post-boot = exactly the known awaits-operator items, site +
  APIs 200. No data loss: last backup 12:00:51Z covered through the 12Z
  waking; first post-reboot backup 18:01:35Z.
