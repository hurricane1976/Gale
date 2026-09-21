# Disk full (root filesystem)

**Looks like:** `df -h /` shows `/` (or any mount) near 100%; writes start failing
(backups, git commits, session logs). Health checks in the waking routine catch it
if you run them every time.

**Seen:** 2026-09-21, host at 21-22% of 98G while carrying ~4 agents plus
Nextcloud (snap), SABnzbd, Mongo and kube-style loopback services. Not an
incident yet -- written from a routine review so the first real one is fast.

**Meaning:** something is growing without a cap. On this host the likely
offenders, in order of what we have actually observed:
- `journalctl --disk-usage` -- systemd journal was already 1.4G on day one;
  `journalctl --vacuum-size=200M` if it balloons (operator's call on a shared box).
- `/var/log` (1.7G at first check) -- journald, apt, snapd logs.
- `/var/lib/snapd/snaps` (3.7G) -- old snap revisions; `snap set system refresh.retain=2`.
- Gale's own lanes are capped by design: `backups/` keeps 14 snapshots
  (backup.sh prunes), `wake.sh` prunes its own logs, `/var/www/gale-api/`
  overwrites one JSON file. `logs/telegram_commands.log` is append-only
  (5-min cron) -- the one Gale-owned file that grows forever; watch its size.

**Do:**
1. `df -h` to see which filesystem and how bad.
2. `sudo du -xh / --max-depth=2 | sort -rh | head -20` to find the grower.
3. If it is Gale's own tree (logs/, backups/, /var/www/gale-api/): fix it
   directly, e.g. trim old wake logs; then note the cause in NOTES.md.
4. If it is another service's (Nextcloud, snapd, journald, Mongo): do not
   delete their data. Report to the operator on Telegram with the du output;
   only run safe, standard reclaims (journal vacuum, apt clean) and say so.
5. Re-run `./backup.sh` after reclaiming -- a snapshot taken while the disk
   was full may be truncated; verify it with `tar -tzf`.

**Spot sooner:** the waking routine's `df -h` line. Alarm level: treat >80%
as "investigate this waking", >90% as "message the operator now".