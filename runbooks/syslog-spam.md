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
6. /tmp dotfiles: `ls -1 /tmp/.*.so | wc -l` (was 0 before Sep-28, 363 at first measurement) — if a runtime cache is unbounded, this number is the tripwire. **Count with this glob form (or `find /tmp -maxdepth 1 -name '.*.so'`) — a plain `ls /tmp/ | grep` silently returns 0 because the files are dotfiles (2026-10-08T03:45Z waking briefly read 954→0 that way; find showed 1027).**
7. **Watched counter drops to 0 → suspect the measuring command first.** A non-sudo find/ls/du over root-700 paths does not error loudly — it silently skips the subtree and returns 0/small (2026-10-09T15:45Z: plain `find /tmp/snap-private-tmp ...` read 0 puppeteer dirs vs the true sudo count 63; agent-user `du -sh /tmp` read 6.5G vs sudo 9.8G). Re-run the runbook-verbatim sudo command before recording any "cleaned up" conclusion.

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
- 2026-10-03T00:40Z: **leak PAUSED — 331 dirs (+8), profiles 12G flat, /tmp
  15G flat** — but df 58G→62G (+4G) with the known components flat, so
  attribution ran per this runbook's method and found a NEW dominant mover:
  **docker image pull for `gale-homeassistant`** (Home Assistant container,
  ghcr 2026.9.4, image 3.44GB, container created ~20:40Z Oct-2 = 2h after
  the 18:40Z waking; docker.service active, containerd namespace `moby`).
  The 3.3G under /var/lib/containerd is docker's, NOT orphaned garbage —
  check `sudo docker system df` before calling containerd content
  reclaimable (first guess after empty `ctr images list` in default/k8s.io
  namespaces was wrong; the blobs live in the `moby` namespace). New
  inventory/growth components this waking, none alerting anywhere:
  **opencode.db 2.0G** (`~agent/.local/share/opencode/`, born Sep-21,
  shared by all 14 agents' runners, actively written, no retention/vacuum
  — steady growth component nothing tracks); **.codex 2.3G** (Codex CLI
  runner footprint, first session rollout 2026-10-02T17:54Z — new runner
  on this host); microk8s snap installed but INACTIVE (no containerd
  socket — ruled out as the containerd writer); sibling backups ~300M,
  network-monitor traffic.jsonl 75M. Rocketchat-mongo denials presumed
  continuing (kern.log 280M flat vs 281M — steady-state rate). Syslog
  post-rotation fill steady (~75M/day); loki 514M flat.
- 2026-10-03T12:40Z: cleanup holding — 0 profile dirs, /tmp 2.9G (down from
  3.4G); df flat 52G. kern.log +12M/6h (rocketchat slow rate); syslog fill
  ~75M/day; loki/opencode.db/.codex/docker HA all flat.
- 2026-10-03T18:40Z: **RECURRENCE — 19 profile dirs, /tmp 2.9G→4.3G
  (+1.4G/6h), df 52G→54G (+2G/6h).** The one-shot cleanup did not stop the
  source: Mountain site-build latency checks burst 14:08–18:01Z in the same
  window. Confirms the Oct-2 hypothesis — one-shot deletion buys time only;
  the durable fix is a tmpfiles.d age rule (or build-side cleanup / source
  pause). Tripwire count went 0→19; re-flagged via notify. kern.log 315M
  (+23M/6h); syslog 138M (~80M/day); syslog.1.gz 717M unchanged; loki 519M.
- 2026-10-04T12:40Z: puppeteer PAUSED — 19 dirs unchanged, /tmp 5G (581
  `.{16hex}-00000000.so` cache files, 363 at Oct-1, still no sweeper). df
  61%/56G used (+~1G/6h, slow band). NEW WATCH: **loki 522M→1G** in one
  window (likely ingesting the 00:00Z-rotated syslog files — the retention
  ask now has a growth datapoint); **opencode.db 2.1G→3G** (~+0.9G/day,
  accelerating vs the ~2G/12d pace — shared by all 14 agents); .codex
  2.3G→3G. kern.log current 25M + kern.log.1 326M (rocketchat slow rate).
  loki/opencode.db retention asks stand with the operator.
- 2026-10-09T15:45Z: **regrowth accelerating — 63 profile dirs (+30 vs the
  33 held at 03:45Z/09:45Z), /tmp 9.8G sudo-du (agent du reads 6.5G — see
  spot-check 7)**; df 55G→57G (+2G/6h, second consecutive +2G window).
  .so cache 1052→1067. Harness note: the 15:45Z waking first read the
  tripwire as 0 with plain `find` — root-700 blind spot, caught by
  re-running the verbatim sudo command before recording (spot-check 7
  added). AppArmor denials continue ~110/min (6572/hour in journald) while
  file logging oscillates again (syslog +1M/6h — slow window, 6th:
  fast→slow→fast→fast→slow); loki 564M, journal 1.0G pinned, rotated pile
  ~1.31G unchanged. Retention/apparmor/tmpfiles fixes all still open
  (operator-gated).
- 2026-10-09T21:45Z: **`.so`-cache SWEEP landed between wakings — 1067→139
  files, /tmp 9.8G→4.4G (−5.4G), df 57G→52G (first decline since Oct-5)**.
  Not agent-initiated — operator/sweeper. HOLD WATCH opened (the Oct-3
  puppeteer one-shot cleanup did not hold): 139 = new baseline, re-count
  each waking. **Puppeteer regrowth continued THROUGH the sweep — 63→77
  dirs** (+14/6h, ~3/4 of the way to the ~100 escalation line; the sweep
  spared it or it regrew). NEW mover: **.codex 3.6G→4.4G (+0.8G/6h, first
  acceleration)** — watch for a retention ask. AppArmor logging oscillation
  7th window (syslog 466→488M ≈ 88M/day, fast); denial source unaffected.
  journal 1.0G pinned; rotated pile ~1.31G unchanged; loki 567M flat.
- 2026-10-11T03:45Z: midnight rotation shifted the pile — syslog.1 578M
  (the whole Oct-10 file, day total 578M vs the ~88–188M/day band windows —
  bursty day), old flood now syslog.3.gz 717M + syslog.2.gz 16M; pile total
  ~1.65G (up from ~1.31G — retention call still pending). Current syslog
  12M + kern.log 7.4M at 03:45Z (~77M/day + ~47M/day pace, established
  band). Post-reboot (Oct-10 16:30Z) /tmp wiped: puppeteer 0 dirs AND
  org.chromium 0 at 03:45Z (regrowth not resumed ~11h in), `.so` cache
  23→42 (+19/11h ≈ 41/day, no sweeper), /tmp 277M. journal 1.0G pinned;
  loki 578M flat; .codex 4.5G flat; docker HA image 3.542GB unchanged.

- 2026-10-13T03:45Z: **tripwire CROSSED + lesson-7 recurrence confirmed in
  recent wakings.** Sudo-verbatim recount: **119 dirs total (55
  `puppeteer_dev_chrome_profile-*` + 54 `org.chromium.*`), 4.0G / 27,858
  files** in snap.chromium/tmp — +83 vs the 21:45Z reading of 36, the
  fastest rate observed; crosses the ~100 escalation line → operator
  notified. No live puppeteer/chromium process and no open files (lsof
  empty) at check time; cleanup stays operator's call. **Measurement
  artifact re-found live this waking**: unsudoed `find` over the root-700
  `/tmp/snap-private-tmp` (mode 700 root since 2026-10-11 21:00) silently
  returned 0 while sudo read 119 — the runbook-verbatim sudo command is the
  ONLY acceptable counter; any waking that recorded a drop-to-0 via an
  unsudoed count (e.g. the 03:45Z Oct-12 "30+19→0" reversal) must be read
  as measurement-artifact-suspect, and the recent "bursty reversal" series
  is only as good as its sudo labels. `.so` cache: 0 by BOTH sudo and
  unsudoed methods this window (genuinely clean, unlike the dir count).

- 2026-10-16T21:45Z: **second crossing, now with a rising trend —
  escalated.** Sudo-verbatim: **179 dirs total (101 `puppeteer_dev_chrome_profile-*`
  + 70 `org.chromium.*` + 8 `lighthouse.*`), 4.7G** vs the 15:45Z reading of
  135 (66 `puppeteer_dev_chrome_profile-*` + 58 `org.*` + 8 `lighthouse.*`;
  4.1G at the 09:45Z method-fix baseline) = **+44 dirs/6h; the puppeteer-only
  subcount re-crossed the ~100 escalation line (66→101) on a rising trend,
  and the 179-dir total now exceeds the historical 139/159/183 territory** —
  entries newer than 15:49Z this window confirm ACTIVE
  accumulation (mid-window, matching the 18:00Z Mountain site-build latency
  burst pattern). Composition note: the `lighthouse.*` family (8 dirs) is a
  third class added to the counter since the 09:45Z method fix; total-dir
  comparisons across eras mix composition — subcounts are the honest trend
  signal. `.so` caches 115→0 again (the 15:45Z "sweep did not hold" churn
  continues — bursty both ways). /tmp 5.5G sudo-du. Operator notified with
  the trajectory; nothing touched by me (cleanup + source pause are
  operator's call per this runbook).

## 2026-10-26T03:45Z — rotation-cadence premise corrected (weekly + maxsize, not daily)

Prior waking entries modeled the rotated pile as a **daily midnight
rotation** ("Oct-24 midnight rotation", "Oct-25 midnight rotation", "single
.gz expected after the Oct-26 midnight rotation"). Wrong model. The actual
config — `/etc/logrotate.d/rsyslog`, unchanged since its Oct-01 23:35 mtime
(same date as the original flood root-cause; provenance never recorded in
NOTES until now) — is:

    /var/log/syslog mail.log kern.log auth.log user.log cron.log {
        rotate 4
        weekly
        maxsize 500M
        missingok
        notifempty
        compress
        delaycompress
        sharedscripts
        postrotate /usr/lib/rsyslog/rsyslog-rotate
    }

Rotation history reconstructed from file spans + `/var/lib/logrotate/status`
(root-readable; `sudo cat`):

- **Oct-18 00:33** — weekly rotation (kern.log.1 spans exactly Oct-18→Oct-25).
- **Oct-24 00:11** — syslog alone rotated early: it had grown to 505M ≥ the
  500M `maxsize` (≈6 days × ~85M/day since Oct-18). kern.log (312M) stayed.
- **Oct-25 00:19** — the weekly rotation came due (Oct-18 + 7d): rotated the
  whole family, including syslog's then-young 91.6M day-file. The 505M
  file shifted to syslog.2 and compressed (52.9M .gz — delaycompress keeps
  only .1 plain). This is why two consecutive "midnight rotations" existed
  and fooled the daily-cadence read.
- **Oct-26 00:07** — logrotate ran, rotated only nginx/cups (their own
  schedules). rsyslog family correctly untouched: weekly not due (next
  ~Nov-1), syslog 97M < 500M.

Consequences for the watch:

- Current syslog 106M "over the ~88M/day band" was an artifact of the wrong
  model — nothing is wrong; the file simply keeps growing until the next
  weekly slot or the 500M maxsize trigger (~day 6 at the current rate).
- The pile is **bounded by maxsize**: worst case ~590M per file before a
  forced rotation at the next daily 00:07 run. Not a creep emergency.
- `is-active pg14-main` returns `inactive` for the *nonexistent shorthand*
  — the real unit is `postgresql@14-main`; verify the unit name before
  recording a premise change (this waking nearly recorded one).

- **Nov-2 00:26** — logrotate ran and correctly did NOT rotate syslog:
  last rotation Nov-1 00:15:52 (status file), weekly slot not due again
  until ~Nov-8. The 21:45Z Nov-1 waking's "daily rotation due Nov-2"
  prediction was a model error — this runbook's own weekly+maxsize model
  was right all along. Fresh file 130.9M at 03:47Z ≈ ~114M/day, in-band.
  Next rotation: maxsize-forced ~Nov-5/6 (500M at ~114M/day) or weekly
  ~Nov-8, whichever comes first. Standing lesson: trust this runbook's
  rotation model over ad-hoc per-waking predictions.

## 2026-11-03T03:45Z — RESOLVED: rocketchat snap removed; denial flood over; journald cap tightened

- **`rocketchat-server` snap REMOVED from the host** (~01:00–01:24Z Nov-3,
  alongside `cups`) — the root-caused AppArmor denial flood is over.
  kern.log hourly denial counts: 6560/hr (22:00Z), 6570 (23:00Z), 6570
  (00:00Z), then 3152 in the 01:00 hour (removal window) → 845 (02:00Z) →
  648 in 03:00–03:45 ≈ **~14/min residual, ~2% of the old ~110/min band**.
- Residual source: `snap.node-exporter.node-exporter` reading
  `/proc/sys/kernel/hung_task_detect_count` every ~15s (DENIED, open) —
  cosmetic; not a creep driver at this rate.
- **`cups` snap also removed 01:24:09Z** — leftover failed unit
  `snap.cups.cups-browsed.service` (`not-found`, exit 143 on stop) is the
  tell; `systemctl reset-failed` clears it (operator's call). Future
  wakings: do not misread that unit as a new fault after this note.
- **journald.conf now `SystemMaxUse=200M` + `MaxRetentionSec=14d`** —
  journal 2.7G → 188M. The journald half of the retention ask is resolved
  (more aggressive than the 1G suggestion).
- **METHOD CAVEAT (new, standing): with a 200M journal cap, `journalctl
  --since` windows can no longer be trusted for historical event counts** —
  vacuum drops older entries (the 00:00–02:59Z Nov-3 "zero denials" hours
  were a vacuum artifact, not a quiet period). **kern.log per-hour greps
  (ISO timestamps, `grep -a -c "^2026-11-03T<h>:"`) are ground truth.**
- Rotated rsyslog pile aged down to ~502M visible (syslog.1 101M +
  syslog.2.gz 58M + kern.log.1 343M; syslog.3.gz/syslog.4.gz/kern.log.2.gz
  aged out through the rotate-4 window). Fresh syslog 239MB since Nov-1
  00:15 ≈ ~112M/day, in-band; no rotation since Nov-1 — weekly slot ~Nov-8,
  maxsize 500M would be hit ~Nov-5 at this rate (both paths live again).

## 2026-11-07T03:45Z — rotation-path model CORRECTED again: maxsize 500M = 500 MiB (524,288,000 bytes), not 500 decimal MB; and there are TWO daily logrotate runs

- The 21:45Z Nov-6 projection ("500M crossed ~17:00Z → rotation fires at
  the 00:01:37Z Nov-7 timer run") did NOT happen: the timer ran
  00:01:37–00:01:38Z Nov-7, exit 0, rotated nginx/error.log only; syslog
  stayed unrotated (syslog.1 still 101.4M, mtime Nov-1). Investigated
  before concluding any fault:
- **UNITS ERROR (the real cause)**: `logrotate -d` echoes the parsed
  constant — "log files >= 524288000 are rotated earlier" — so
  `maxsize 500M` = 500 × 1,048,576 = **524,288,000 BYTES (500 MiB)**, not
  500 decimal MB. Recent wakings measured in decimal MB, so every "500M
  threshold" projection was ~24MB (~8h at ~73M/day) early. At the
  00:01:37Z run syslog was ≈521.5 decimal MB (bounded by the consistent
  decimal-MB readings 514.4MB @21:45:35Z → 533.3MB @03:47Z, +18.9MB/6.03h)
  — **just under the real threshold: not rotating was CORRECT**.
- **SECOND DAILY RUN discovered**: `/etc/cron.daily/logrotate` also exists
  and runs via anacron (`anacron.timer` fires ~07:32Z ± RANDOM_DELAY 60min;
  cron.daily spool stamp 07:37Z Nov-6 proves the run). So logrotate runs
  **twice daily**: systemd timer ~00:01–01:30Z (RandomizedDelaySec=1h) and
  cron.daily ~07:32–08:32Z. Prior "next daily 00:07 run" models missed the
  second pass.
- **Verified live** (`sudo /usr/sbin/logrotate -d /etc/logrotate.conf`):
  with syslog at 533.3 decimal MB (508.5 MiB) > threshold, dry-run says
  "log needs rotating" for /var/log/syslog — mechanism healthy, rotation
  now due.
- **CORRECTED PROJECTION**: maxsize-path rotation at the cron.daily run
  **~07:35–08:35Z Nov-7** (weekly still not due until Nov-8 00:15+ →
  unambiguous maxsize-only attribution, the clean test the timer run
  couldn't give). Verify at 09:45Z: syslog.1 should be the ~545MB file
  (delaycompress keeps .1 plain), fresh syslog near zero. If NOT rotated
  by 09:45Z → real cron.daily/anacron fault, escalate.
- **Historical reconciliation**: the Oct-24 "rotated at 505M" entry above
  is consistent ONLY if that figure was MiB-based (`ls -h`/`du` style →
  529.5 decimal MB > threshold). Probe-unit drift between wakings (some
  MiB, some decimal MB) is the likely source of the whole projection
  confusion — **standing rule: compare maxsize in RAW BYTES
  (`stat -c %s` vs 524288000), never in human units**.

## 2026-11-07T09:45Z — cron.daily model CORRECTED: it no-ops under systemd

The 09:45Z Nov-7 verification found: cron.daily fired at **07:39:14Z**
(anacron stamp updated; journal `Job 'cron.daily' started … Normal exit
(1 job run)`) but **no rotation happened** — syslog 552,658,579 bytes,
`syslog.1` still Nov-1 00:15:56Z. The 09:45Z escalation trigger from the
03:45Z section fired, and the investigation corrected the model a third
time:

- **ROOT CAUSE — the "SECOND DAILY RUN" claim above is WRONG**:
  `/etc/cron.daily/logrotate` contains a systemd guard —
  `# skip in favour of systemd timer` + `if [ -d /run/systemd/system ];
  then exit 0`. On any systemd host the script **exits before running
  logrotate**. Anacron runs the job (stamp updates, journal clean) and the
  job is a no-op. **A cron.daily/anacron stamp is NOT evidence that
  logrotate ran.**
- **Corrected schedule: logrotate runs ONLY via the systemd timer**, once
  daily ~00:00–01:00Z (+RandomizedDelaySec). Last 00:01:37Z Nov-7, next
  **00:59:16Z Nov-8**.
- **Nov-7 00:01:37Z run missed the maxsize threshold by ~1.4 decimal MB**
  (interpolated ~522.9MB vs 524,288,000 bytes = 524.3 decimal MB, ~0.27%)
  — not rotating was CORRECT; 2nd data point for the unit-corrected
  threshold.
- **Mechanism verified healthy** (`sudo /usr/sbin/logrotate -d
  /etc/logrotate.conf`): "log needs rotating" for syslog at 552.7MB;
  parsed constant echoed again as `>= 524288000` (raw bytes); kern.log
  (129.7MB, <1 week) correctly not due.
- **Next rotation: Nov-8 00:59:16Z timer run — weekly due (last rotation
  2026-11-01 00:15 + 7d) AND maxsize satisfied (~610–630MB projected at
  ~77M/day). Conditions are CONCURRENT → maxsize-vs-weekly attribution
  cannot be disambiguated at that run; the clean maxsize-only test the
  03:45Z projection promised does not exist on this host.** Rotation is
  certain either way.
- **Transient**: syslog grows ~77MB/day until rotation → ~615–630MB peak,
  ~100MB over the 500MiB plateau — in-band (root fs 58%, 40G avail), no
  action.
- **Probe lesson**: `logrotate` lives in `/usr/sbin` — not in the agent
  user's PATH; bare `logrotate -d` exits 127 with EMPTY output (silent
  probe failure). Probe with `sudo /usr/sbin/logrotate -d
  /etc/logrotate.conf`.
- **Spot-faster**: before relying on any cron.daily run, READ the script
  (`cat /etc/cron.daily/logrotate`) for a systemd guard — the existence
  of `/etc/cron.daily/logrotate` says nothing about whether it runs.
  Model-lesson tally on this one watch item: (1) threshold-crossing
  conflated with rotation-firing (21:45Z Nov-6), (2) decimal-MB vs MiB
  units (03:45Z), (3) cron.daily counted as a real second run when it
  self-skips under systemd (this correction). Standing probes: raw-byte
  threshold compare, date-anchored greps, and now script-guard checks.
