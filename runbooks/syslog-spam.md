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

## Re-check 2026-10-02T00:40Z — rate dropped; attribution refined; NEW mover found

Re-ran the spot-checks this waking. Three changes, all verified before updating:

1. **Wekan snap is GONE** (`snap list` / `snap services` no longer list it; service
   inactive). The early flood's dominant contributor (11,443 of ~13K lines in a
   head sample of syslog.1 were `wekan.wekan`) no longer exists. Post-rotation
   syslog fill rate is now ~75M/day (2.1M in 40 min after the 00:00Z rotation)
   vs ~1.3G/day before — **the pre-rotation 1.3G/day was NOT all rocketchat**;
   wekan spam + rocketchat denials together made up the old rate. Runbook's
   original single-cause attribution was incomplete — refined here.
2. **Rocketchat-mongo AppArmor denials CONTINUE unchanged** (~110/min; 4,426
   DENIED events in the 40-min window after rotation; pid 3470, same FTDC
   pattern). The fix options below are still open. kern.log still growing
   (~244M, ≈88M/day) — the audit stream persists into kern.log + syslog.
   logrotate rotated syslog at 00:00Z: the 6.3G flood is now `syslog.1`
   (still on disk until retention kicks in — part of why the ASK retention
   item is load-bearing).
3. **NEW creep component, was invisible to non-sudo du**:
   `/tmp/snap-private-tmp/snap.chromium/tmp/` = **4.9G of leaked
   `puppeteer_dev_chrome_profile-*` dirs** (159 dirs, 81,800 files, uid agent).
   These are abandoned puppeteer launches of the snap chromium (site-build
   smoke/render/browser_checks runs leak their profile when a launch is
   killed/abandoned instead of closed). Creation is bursty (~15–35 profiles/hr
   during site-build hours, quiet otherwise; 87 created in the 18:40Z–00:40Z
   window). **Lesson: `du -sh /tmp` as the agent user CANNOT see
   /tmp/snap-private-tmp (root 700)** — the runbook's "/tmp 2.1G" figure
   understated /tmp by 4.9G; with sudo /tmp is ~7.0G. Spot-check 2 above must
   run with sudo or the chromium tmp component will be missed. This component,
   not /var/log, was the bulk of the +2G/6h df move this window (syslog was
   pre-rotated; kern.log only +22M).
4. Minor new noise, not a creep driver: `/opt/alert-webhook/receiver.py`
   (python3, service `gale-fleet-api`) logs SPAN/trace telemetry lines to
   syslog (~675 lines/40 min ≈ 24K/day) — counted in syslog composition
   alongside the audit lines (54% audit in the new syslog).

Updated spot-check: `sudo du -sh /tmp/snap-private-tmp/snap.chromium/tmp` alongside
the /var/log checks; `ls /tmp/snap-private-tmp/snap.chromium/tmp | grep -c puppeteer`
is the profile-leak tripwire (0 before Sep-28, 159 now). Cleanup of leaked
profiles is operator's call (they are agent-uid files; a tmpfiles.d age rule or a
sweep at a quiet window after confirming no live puppeteer run owns them).

## Cross-references

- `runbooks/disk-pressure.md` — sim-side of the same fault class (fill symptoms, detection latency).
- `runbooks/usb-disk-eio.md` — unrelated earlier creep scare, correctly excluded this waking (sda2/sdb device filtering).
- ASK.md — root-caused creep item with fix options, operator-gated.

## Trend log

- 2026-10-02T12:40Z (session died before NOTES; per its run log): logrotate
  compressed the 6.3G syslog.1 flood → ~717M `syslog.1.gz` (reclaimed ~5G) —
  the "awaiting operator vacuum" half self-addressed by default logrotate;
  puppeteer leak resumed (183 dirs, +0.8G).
- 2026-10-02T18:40Z: **leak ACCELERATED — 323 dirs (+140 in ~6h), 12G in
  profiles, /tmp total 15G; df 50G→58G (+8G/6h), the largest window yet.**
  Active creation observed at 18:40-18:41Z (mid-build). kern.log 281M
  (rocketchat denials continuing, pid 3470), syslog fill steady ~60M/day,
  loki 512M flat. At ~1.3G/h during build windows the root fs (~36G free)
  fills in roughly a day of continuous building — flagged urgent to the
  operator. Tripwire (`sudo ls ... | grep -c puppeteer`) caught the
  doubling exactly as designed.
