# Runbook: wake.sh misdirect (cross-cd / wrong-dir wake)

## Incident class
A sibling's `wake.sh` cds into (or was copied from) a *different* sibling's
directory, so the cron slot for agent A actually wakes agent B. A wakes
nothing; B gets double sessions. First seen 2026-10-19 (maistral), detected
2026-10-25 20:55Z.

## What happened (2026-10-19 -> 2026-10-25)
- `/home/agent/maistral/wake.sh` became chinook's script (`cd /home/agent/chinook`,
  CHINOOK prompt, chinook AGENT.md path) during the ling->glm model-migration
  window. Onset: between maistral's last good wake evidence (08:05/09:20Z Oct 19)
  and the first misdirected wake log in chinook/logs (20261019T140501Z; chinook
  ledger first continuous maistral-slot entry 14:06:30Z Oct 19).
- Effects at detection: 6d7h of zero wakes in maistral's dir; 335 unprocessed
  messages in maistral/peer/inbox (~25-50/day accumulating); maistral spend
  ledger stale since Oct 19; 24 extra chinook sessions in chinook/logs at
  maistral-only timestamps (T02/08/14/20:05); ~$0.06/wake recorded under
  chinook's ledger (chinook daily totals ~2x inflated).
- Aggravating: the pre-change backup (`wake.sh.bak-20261020-ling-to-glm`) is
  ALSO chinook-branded — the contamination predates or includes the backup, so
  restoring from it does not fix the bug. `git show HEAD:wake.sh` in maistral's
  repo is wrong too (committed), and the glm model edit is uncommitted (` M`).
- Scope check: only maistral cross-wired; all 13 other wake.sh scripts correctly
  self-cd and self-brand (checked 2026-10-25 20:55Z).

## Cheap check that caught it
During a routine fresh-log sweep, a wake file timestamped T200501Z (a
maistral-only slot) appeared in chinook/logs/. Any wake-file timestamp from
agent A's slot pattern landing in agent B's logs dir is this incident class.

One-liner (run from any dir; read-only):
```
for d in /home/agent/*/; do n=$(basename $d); [ -x "$d/wake.sh" ] || continue; \
  newest=$(find $d/logs -name '2*.json' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-); \
  age_h=$(( ($(date +%s) - $(stat -c %Y "$newest" 2>/dev/null || echo 0)) / 3600 )); \
  echo "$n newest_wake_age_h=$age_h file=$(basename "$newest" 2>/dev/null)"; done
```
Threshold: every fleet agent wakes every 6h. `newest_wake_age_h > 9`
(1.5x interval) = that agent's own dir is not being woken = this incident
(or cron loss). Cross-check foreign slots:
```
for d in /home/agent/*/logs; do ls $d | grep -oE '^2[0-9]+T[0-9]+' ; done
```
— then compare each dir's file-timestamp HHMM pattern against the owner's
crontab slot. A wake-file timestamp that matches a *foreign* sibling's cron
slot inside this dir = misdirect confirmed, and names the source slot.

## Thresholds to catch it sooner
1. Per-waking sweep (all agents): newest wake artifact in their own logs/
   older than 9h -> flag. Catches a dead/misdirected wake within one waking.
2. Any wake-file in a logs/ dir whose HHMM does not match the owner's cron
   slots -> flag with both names. Catches it the same day it starts.
3. Backup-content spot check: when a model/config migration creates
   `*.bak-*` files, verify the bak is self-branded (grep `cd /home/agent/<self>`
   and the prompt name). The Oct-20 maistral bak was contaminated and useless
   for recovery.

## Recovery (owner: the affected dir's owner / operator — not the watcher)
1. Restore a self-branded wake.sh: take any correct sibling script
   (e.g. ostro's) and substitute dir name, agent name in PROMPT, AGENT.md
   path, model line, port/slot references; or hand-edit maistral's. Do NOT
   restore from `wake.sh.bak-20261020-ling-to-glm` (chinook-branded).
2. Commit the fixed wake.sh (maistral's repo currently also has an
   uncommitted model edit — land both together).
3. Drain maistral/peer/inbox (335 msgs at detection) or let its next wake
   drain; verify spend ledger records again on the next wake.
4. Optionally note chinook's ledger inflation period (Oct 19 14:06Z onward)
   so capacity/spend baselines can be corrected.

## Watcher-side actions taken 2026-10-25
Flagged to operator (ASK-7 + Telegram). Data-only notices left for maistral
and chinook. Did not edit either dir (read-only rule).