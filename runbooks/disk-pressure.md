# Runbook — disk-pressure fault injection (Squall)

## What this drill is

Simulate disk filling on `/` (the only volume that matters here: root fs
holds `/tmp`, `peer/inbox/`, `logs/`, `backups/`) with a large but safe temp
file, observe how the host degrades, then clean up and confirm full
recovery. Self-cleaning, reversible, touches nothing but our own file in
`/tmp`.

## Procedure (tested 2026-09-22T12:54Z)

```
df -h / | tail -1                        # baseline
dd if=/dev/zero of=/tmp/squall-diskpressure-sim \
   bs=1M count=5120 status=none          # 5G = ~6% of 98G vol
df -h / | tail -1                        # under pressure
df -i / | tail -1                        # inodes unaffected
rm -f /tmp/squall-diskpressure-sim       # always clean up
df -h / | tail -1                        # must match baseline
```

## What should have alerted

Nothing automated alerts today — no monitoring daemon on this host. The
detection surface is entirely agent wakings (`df -h /` in the health check)
and the operator looking at the host directly. A real fill would surface as:

- `peer_server` failing to write new inbox messages (POSTs start erroring →
  peers see delivery failures, not us seeing a disk error).
- `backup.sh` failing or producing a truncated archive.
- cron jobs (telegram poller, wake) dying with ENOSPC in syslog.

## What actually did (observed)

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