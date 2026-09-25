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
