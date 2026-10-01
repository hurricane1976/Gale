# Runbook: syslog spam / audit flood (REAL fault, attributed 2026-10-01)

## What happened (real, not injected)

Found 2026-10-01T18:40Z while attributing disk creep 53%→56% (+3G/6h — largest window yet):

- `/var/log/syslog` = **6.2G and growing live**, `syslog.1` 1.1G (rotated Sep-27), `kern.log` 222M + `kern.log.1` 244M, `lastlog` 163M. Rate ≈ **1.3G/day** since ~Sep-27.
- Driver: `snap.rocketchat-server.rocketchat-mongo` (MongoDB FTDC telemetry, `comm=ftdc`, pid 3470) is **AppArmor-DENIED every ~5s** reading `/proc/pressure/{cpu,memory,io}`, `/proc/<pid>/net/*`, `/proc/vmstat`, `/proc/snmp`, `/proc/sockstat`. Each denial → kernel `audit: type=1400` line → rsyslog → syslog. Audit counter passed 2.8M events; kernel logs `kauditd_printk_skb: N callbacks suppressed` (rate exceeds the kernel print budget).
- Secondary consumers of the same spam: promtail→loki (`/var/lib/loki` 54M Sep-28 → 503M Oct-1, ≈130M/day) and journald (flat at 4.1G — riding its implicit ~4GiB cap).
- Host inventory change: **rocketchat-server** snap 8.5.1 rev 1788 (`rocketchat-mongo` + `rocketchat-server` services running) — never appeared in any prior waking inventory; not previously seen. First syslog.1 archive is only 1.1G for its full week, so the flood may have started mid-cycle after the snap landed.

Also found during attribution (separate, minor): `/tmp` = 2.1G of hidden `.{16hex}-00000000.so` files (363 entries, 14M each ≈ 5G logical, hardlink-deduped), owned by uid 1000, created continuously since Sep-28 (70–127/day) — looks like a per-session runtime JIT/extraction cache written by the agents' shared runner, no cleanup mechanism, none open at check time (lsof clean). Contributing but bounded.

## What should alert, and what actually does

- **Nothing on the host alerts on any of this.** No log-size monitor, no audit-rate monitor, no /tmp sweeper. Detection surface remains: agent `df` at waking cadence (~6h blind max) + operator eyes. The creep only showed up as `df` % ticks — and % alone can mask GB movement (the 12:40Z waking even read "53% flat" when the GB number was the better signal).
- Real-fill end state: same as the disk-pressure drill findings (peer_server inbox write failures, backup truncation, ENOSPC in cron jobs) — but this one is **genuinely in progress at ~1.3–2G/day**, not a sim. At the observed pace, a 42G free pool gives weeks of headroom, so it is urgent-but-not-critical; the trend is what matters.

## How to spot it faster (spot-checks, run at waking if disk ticks up)

1. `df -h /` — if used-GB moved ≥2G since last waking, don't stop at %: attribute immediately.
2. `du -sh /var/log/syslog /var/log/journal /var/lib/loki /tmp` — the four known movers.
3. `ls -lhS /var/log | head` — big plain files; syslog at 6G+ was invisible in earlier dir-level scans because it sat between the journal (tracked) and small rotated logs.
4. `tail -c 4000 /var/log/syslog | tail -15` — sample the tail; here it shows the apparmor/fcdc pattern directly.
5. Rate histogram: `tail -c 2000000 /var/log/syslog | grep -c apparmor` vs a byte-count sanity check (~250B/line ⇒ ~60 lines/s at 6.2G/4.75d).
6. /tmp dotfiles: `ls -1 /tmp/.*.so | wc -l` (was 0 before Sep-28, 363 at first measurement) — if a runtime cache is unbounded, this number is the tripwire.

## Fix options (operator's call — host config, not agent-owned)

1. Fix the AppArmor profile for the mongo snap so FTDC can read `/proc/pressure/*`, `/proc/*/net/*`, `/proc/vmstat` (the known upstream fix for this exact mongo-snap noise pattern), or
2. Disable FTDC telemetry on the mongo instance (server parameter), or
3. Stop rsyslog from materializing the audit spam (journald/rsyslog filter or audit rule suppressing that denial), and
4. Whatever is chosen, also set a deliberate `SystemMaxUse` for journald + a loki retention limit (the standing ASK.md item) — spam inflow makes retention caps load-bearing, not cosmetic.
5. /tmp: either add a tmpfiles.d age rule for `/tmp/.*.so` or clear them at next quiet window (none open at last check); confirm no live session is holding one first (lsof).

## Cross-references

- `runbooks/disk-pressure.md` — sim-side of the same fault class (fill symptoms, detection latency).
- `runbooks/usb-disk-eio.md` — unrelated earlier creep scare, correctly excluded this waking (sda2/sdb device filtering).
- ASK.md — root-caused creep item with fix options, operator-gated.
