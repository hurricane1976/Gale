# Disk creep — detection side

Zephyr's lane: catch disk growth early at waking, name the source, flag.
Gale owns host recovery; the operator decides host-level config changes
(journald caps, vacuums). Never delete another agent's files.

## Per-waking check (cheap, ~10s)

```
df -h / | tail -1                              # baseline number for NOTES
sudo du -xh --max-depth=1 / 2>/dev/null | sort -rh | head -8   # find the mover
sudo du -xh --max-depth=1 /var 2>/dev/null | sort -rh | head -5
sudo journalctl --disk-usage                   # journald share
sudo du -sh /tmp 2>/dev/null                   # SUDO du, not plain: /tmp/snap-private-tmp is root-owned and invisible to non-sudo (cost: one 6h window of ~2G misattributed on 10-01)
```

If a dir jumped, drill one level (du -sh on its children) before flagging —
name the file/dirs, sizes, and mtimes so the operator can act without
re-investigating.

## Thresholds (from 2026-09-21→24 history)

- Steady creep <1G/waking: note in NOTES, no escalation.
- **>2G per 6h block or >1.5%/df-step: identify source same waking**, flag
  to operator in notify.
- /var/log/journal >4G: flag a journald cap (SystemMaxUse) as a suggestion.
- Any filesystem >85%: page the operator immediately.

## Known-good patterns (false positives)

- One-day drops of multi-GB build/download artifacts in /tmp/opencode
  (ollama.tar.zst, zeek-* on 09-24): operator/sibling session work, not a
  leak; /tmp self-clears on reboot. Confirm mtimes are recent and owner is
  the shared `agent` user, then note and move on.
- **Hidden /tmp `.so` runtime artifacts** (found 09-25: 314 files, 2.2G,
  names like `.9adb*-00000000.so`, 14M each, owner `agent`, dated 09-21→25,
  accumulating several/day): sibling opencode/claude runtime shared-object
  drops directly in /tmp (NOT inside /tmp/opencode — `du -d1 /tmp` under
  a glob-blind listing hides them; the /tmp total line carries the truth).
  Same class as /tmp/opencode churn: not a leak, reclaims on reboot, never
  delete. But unlike the churn dir they ACCUMULATE (no same-day cleanup) —
  worth naming in the escalation record when /tmp file total passes 3G.
- Backup retention (14 snapshots) and processed inbox growth are bounded;
  they plateau by design.
- `du /tmp` includes systemd-private-* dirs (8K each, ignore).
- **kern.log apparmor audit spam** (found 2026-10-01T00:20Z: 430M across
  kern.log + kern.log.1; 610k/707k lines = `apparmor="DENIED"` from
  profile `snap.rocketchat-server.rocketchat-mongo`, wekan +2.8k,
  nextcloud +477): ~7.4k lines/h at inspection (~10M/6h), heavier earlier
  post-boot. Not a leak; host-level fix (apparmor profile or audit rule).
  Cheap check: `grep -o 'profile="[^"]*"' /var/log/kern.log | sort | uniq -c | sort -rn | head -3`.

## Escalation record

- 2026-09-24: 29%→31%→34% (+3G in 6h) — journald 3.9G steady (~1.3G/day)
  + 2.4G one-day /tmp/opencode tooling drop. Flagged; suggested journald
  cap; /tmp portion reclaims on reboot (RIVER's pending reboot window).
- 2026-09-25: 34%→38% (+4G in 9.5h) — journald 4.0G (crossed the >4G
  suggest-cap threshold above; cap suggestion re-flagged). /tmp/opencode
  churns: prior day's ollama/zeek artifacts gone, replaced by ~2.9G of new
  sibling-session scrape artifacts (beacon_*.html/json, backup_listing.txt).
  Treat /tmp/opencode as a rolling churn dir: check owner+mtimes each time,
  never delete; the durable grower is journald.
- 2026-09-25 (06:20Z waking): 38% holds but 35G→36G in <2h; full
  accounting: /var 15G (journald 4.1G, snapd 4.4G, snap 3.0G, grafana
  508M), /usr 5.6G, **/tmp 5.0G (2.9G /tmp/opencode churn + 2.2G hidden
  `.so` runtime artifacts, 314 files — see FP section)**, /home 1.9G.
  du-vs-df gap (~8G) = ext4 reserved blocks + rounding, not a mover.
   All three growers are reboot-reclaimable or cap-fixable; no single
   runaway. Standing ask: journald SystemMaxUse cap.
- 2026-10-01T00:20Z: 49%→52% (+2G/6h). Loki syslog spam rate stepped back
  to ~117M/h (the prior waking's ~10M/h ease did NOT hold — treat single
  waking eases as unconfirmed until repeated). kern.log named as a second
  spam source (see FP section). opencode.db 1.64G (+0.14G/6h, slow).
- 2026-10-01T18:20Z: 53%→56% (+3G/6h, growers fully accounted ~0.9G +
  ~2.1G): **(a) loki debug-spam STOPPED at 16:06:36Z** — loki restarted at
  exactly that instant (ExecMainStartTimestamp; new PID), last
  `level=debug` line same second; tail now `level=info` ~22 lines/min.
  Reads as the operator applying the fix; VERIFY the stop holds next waking
  before closing the item (same rule as eases above, but a process restart
  + level change is stronger evidence than rate drift). Syslog stock
  remains 7.4G on disk — rotation/cleanup still needed. **(b) NEW grower
  class named: puppeteer headless-Chrome profiles in
  `/tmp/snap-private-tmp/snap.chromium/tmp/` — 2.2G, 72 dirs, ~11 spawned
  per hour (~30M each, profile never exits/cleans) — pattern correlates
  with gale's `website/tools/` synthetics cron (*/5, seen in host crontab
  10-01). Root-owned dir: only visible to `sudo du /tmp` (plain du
  undercounted by exactly this amount — check method fixed above).** (c)
  claude CLI auto-update version binaries accumulate ~232M each (~2d
  cadence, 4 on disk = 930M).
