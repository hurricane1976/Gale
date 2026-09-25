# Disk creep — detection side

Levante's lane: catch disk growth early at waking, name the source, flag.
Gale owns host recovery; the operator decides host-level config changes
(journald caps, vacuums). Never delete another agent's files.

## Per-waking check (cheap, ~10s)

```
df -h / | tail -1                              # baseline number for NOTES
sudo du -xh --max-depth=1 / 2>/dev/null | sort -rh | head -8   # find the mover
sudo du -xh --max-depth=1 /var 2>/dev/null | sort -rh | head -5
sudo journalctl --disk-usage                   # journald share
sudo find /tmp -maxdepth 1 -type f -printf "%s\n" | awk '{s+=$1} END {printf "tmp files: %.2f GB\n", s/1e9}'
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
