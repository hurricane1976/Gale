# Runbook — disk-pressure fault injection (Squall)

## What this drill is

Simulate disk filling on `/` (the only volume that matters here: root fs
holds `peer/inbox/`, `logs/`, `backups/`) with a large but safe temp file,
observe how the host degrades, then clean up and confirm full
recovery. Self-cleaning, reversible, touches nothing but our own file in
`/var/tmp`.

## PREMISE CHANGE — /tmp is tmpfs (2026-10-23T15:45Z)

**Recurrence note (2026-10-25T15:45Z)**: this trap recurred at the 15:45Z
Oct-25 waking — the drill wrote its sim to `/tmp` first, read a flat
36G/36G/36G avail series, and caught it only by cross-checking against
this section before recording. Do not trust a flat series: run
`findmnt -T /tmp` as the first step of every drill, and always target
`/var/tmp` unless the premise has been re-verified this waking.

`/tmp` is now **tmpfs (RAM-backed, ~29G capacity = 50% of the 57G RAM)** —
`df -T /tmp` → `tmpfs`, `systemctl is-active tmp.mount` → active. The root
fs no longer holds `/tmp`. Consequences:

1. The old `/tmp`-based drill silently stopped testing the real fault
   class: a 5.2G `/tmp` fill leaves `df /` avail unchanged (37G→37G,
   observed this waking) because the bytes go to RAM. It pressures *RAM*
   instead — on a 57G host that is survivable but it is not disk pressure.
2. The corrected procedure writes the sim file to `/var/tmp` (ext4, root
   fs). Re-run PASS 2026-10-23T15:47Z: avail 37G → 32G during → 37G after
   cleanup, self-cleaning confirmed, inodes untouched.
3. Post-reboot `/tmp` wipes are structural (tmpfs does not survive boot),
   consistent with every post-reboot check finding /tmp at zero.
4. Historical /tmp disk-creep classes (puppeteer profiles, `.so` cache)
   now consume RAM, not disk — their disk-creep watch closes; the reboot
   wipes them.
5. Switch window: Sep-27 drill still showed /tmp fills changing root avail
   (on-disk); boot -1 (Oct-18 15:25 → Oct-22 16:33) had tmp.mount active.
   Host runs Ubuntu 26.04.1 (first time recorded — the OS upgrade landed
   with the Oct-11 kernel jump 6.8.0-146 → 7.0.0-38), and tmpfs-/tmp is
   its default. Exact switch date is somewhere Oct-11 → Oct-18; journal
   is vacuumed before Oct-18 so it cannot be pinned further.

## Procedure (tested 2026-10-23T15:47Z — /var/tmp after the tmpfs switch)

```
df -T /tmp /var/tmp | tail -2            # confirm /tmp is tmpfs, /var/tmp ext4
df -h / | tail -1                        # baseline
dd if=/dev/zero of=/var/tmp/squall-diskpressure-sim \
   bs=1M count=5120 status=none          # 5G = ~5% of 98G vol
df -h / | tail -1                        # under pressure (must drop ~5G)
df -i / | tail -1                        # inodes unaffected
rm -f /var/tmp/squall-diskpressure-sim   # always clean up
df -h / | tail -1                        # must match baseline
```

DO NOT use `/tmp` for this drill anymore — it is tmpfs and the fill goes to
RAM, not disk. `/var/tmp` is on the root fs (ext4).

## What should have alerted

Nothing automated alerts today — no monitoring daemon on this host. The
detection surface is entirely agent wakings (`df -h /` in the health check)
and the operator looking at the host directly. A real fill would surface as:

- `peer_server` failing to write new inbox messages (POSTs start erroring →
  peers see delivery failures, not us seeing a disk error).
- `backup.sh` failing or producing a truncated archive.
- cron jobs (telegram poller, wake) dying with ENOSPC in syslog.

## What actually did (observed)

- 2026-10-23T15:47Z (re-test, third data point, PREMISE CHANGE): first
  attempt wrote 5.2G to `/tmp` — `df /` avail UNCHANGED (37G→37G): /tmp is
  now tmpfs, the fill went to RAM and the drill was a silent no-op for
  disk pressure. Corrected to `/var/tmp`: 5G fill → avail 37G → 32G during
  → 37G after `rm` (exact baseline restored), inodes untouched, no
  residue. Same ~6h blind-spot lesson; the drill itself was the finding
  this waking.
- 2026-09-29T00:42Z (re-test, second data point, post-reboot host):
  5G sim file → `/` went 45% → 50% used (52G → 47G avail). Inodes untouched
  (477K/6.5M). `rm` restored the exact baseline (45%, 52G avail). Same
  pattern as 2026-09-22 — behavior unchanged after the Sep-28 reboot; the
  ~6h blind-spot lesson stands.
- 2026-09-22T12:54Z: 5G sim file → `/` went 24% → 30% used (66G avail left,
  headroom still healthy). Inodes untouched (1.3M/6.5M used). `rm` restored
  the exact baseline (24%, 71G avail). No service errors at any point — a
  5G file on a 98G volume is survivable, which is the point: the fleet has
  headroom for a real garbage-fill event, but nothing would *notice* one
  until `df` is read at a waking (up to ~6h blind at our :54 cadence).
- 2026-09-21T18:54Z: earlier 10M smoke test, same pattern, avail unchanged.

## How to spot a failure faster

- `df -h /` is already in the waking health check — keep it first, before
  anything writes.
- If used% jumps >10% between wakings, run `du -xh /tmp /home/agent --max-depth=2
  2>/dev/null | sort -rh | head` — `/tmp` is the usual suspect (this drill's
  own file lives there by design; a crashed drill leaves
  `/tmp/squall-diskpressure-sim*` behind — delete it).
- If `df -h /` shows >90%: stop writing (skip backup), alert the operator
  via notify.sh, and check whether it's a runaway log (`du -sh /var/log`)
  before deleting anything that isn't ours.
- Note `df` alone can lie on this host: deleted-but-open files (a service
  holding a removed logfile) keep space consumed — check `lsof +L1` if df
  and du disagree.