# Runbook: dead wakings + quiet-death detector (wake.sh)

## Fault class

A cron waking produces **no work**: the session exits 0 having done nothing
(refused bootstrap / stalled / rejected its first tool call), or crashes with
a non-zero exit and no report. State damage: inbox piles up, backups gap,
NOTES has no entry — the fleet's window of silence grows unseen unless the
shell-side detector catches it.

Real occurrences: 2026-09-26 00:40Z + 06:40Z (bootstrap-refusal pair, caught
by the ALERT both times; see mangled-rules.md for the refusal class).

## The detector (wake.sh:102-121)

After the opencode run, wake.sh alerts shell-side if:

1. `OPENCODE_EXIT != 0` — crash exit.
2. exit 0 AND `logs/.notified` missing — session never called notify.sh.
3. exit 0 AND `logs/.notified` mtime older than run start — marker exists
   but predates this run (stale, e.g. leftover from a previous waking that
   died after notifying).

`.notified` is touched by notify.sh itself (notify.sh:34), so condition 2/3
really mean "this session never reached its report step". The ALERT goes to
the operator via notify.sh with the log tail; it is logged, never fatal.

A healthy wake must therefore be silent — false positives would erode trust
in the signal.

## Rehearsal (2026-09-26T18:41Z, logic-layer, all stubbed — no model, no Telegram, no live state)

Method: copy wake.sh to /tmp/squall-wakedrill, sed three things — `cd`
target → drill dir, PATH → stubbin first, `git push github` → stub echo;
stub `notify.sh` (appends to local alerts.txt); stub `opencode` on stubbin.
Then per variant: run copy, grep alerts.txt.

| Variant | Setup | Expected | Result |
|---|---|---|---|
| A quiet death | stub exits 0, no marker | ALERT "exited 0 without reporting" | PASS |
| B crash | stub exits 3 | ALERT "exited with code 3" | PASS |
| C stale marker | `.notified` touched 1h before run | ALERT (mtime < run start) | PASS |
| D healthy wake | stub touches `logs/.notified` mid-run | silent | PASS |

Bonus live verification: with no `keys/telegram.env` in the drill dir, the
CHAT_ID guard refused the run and logged to `wake-skipped.log` — an
unreportable session cannot run at all (wake.sh:17-22), as designed.

Drill-harness note: do NOT pre-touch `.notified` to simulate a healthy wake —
a marker created before run start is correctly treated as stale (variant C).
The marker must be created *during* the run, exactly as notify.sh does.

## How to spot faster

- Operator-side: any `[Squall] wake.sh: WARNING` message is this detector.
- Agent-side, every waking: reconcile spend ledger lines ↔ NOTES entries
  (standing procedure in mangled-rules.md). Dead sessions are the
  very-low-spend signature ($0.001-0.002 vs $0.03-0.13 normal).
- `ls logs/` gaps: cron fires every 6h (:40); a missing `logs/<TS>.log`
  between fires means the waking never started at all (different class:
  cron/host failure, not dead session — check `systemctl status cron`).
- Two consecutive dead wakings = fleet-relevant (inbox/backup gap) — the
  next live waking must cover the gap and flag the recurrence.

## Related

- mangled-rules.md — bootstrap-refusal analysis + provenance verification.
- restore-drill.md — how to verify state integrity after a coverage gap.