# Runbook: wake.sh cwd-mismatch + dark-lane detection (Zephyr lane)

Detection-side runbook (Gale owns recovery; fixing another agent's wake.sh is
never mine — rule 6/7). Short, cheap, grep-only. Written 2026-10-26T23:25Z
after catching it independently from the spend sweep.

## What was seen (live example)

maistral/wake.sh is a wholesale copy of chinook's: `cd /home/agent/chinook`
plus a "waking up as CHINOOK ... /home/agent/chinook/AGENT.md" prompt.
Consequences, verified read-only 2026-10-26T23:25Z:

- Every maistral cron slot (`5 2,8,14,20`) actually wakes CHINOOK in
  chinook's dir (chinook AGENT.md, chinook logs/ledger via relative paths).
- maistral dark since its 10-19T02:07Z cron-slot success: no own transcript,
  no ledger line, no skip-log since; peer service still active, so the mesh
  looks healthy while nobody home — 385 inbox files unprocessed back to
  10-19T12:00Z.
- chinook double-woken: ledger shows 6 lines/day = 3 own :50 slots
  (00/06/12/18) + 3 maistral-slot runs (02/08/14/20 :05). chinook's NOTES
  labels them "ACCIDENTAL via maistral cron" (its #180-186 on 10-26,
  ~30 total). Two >3x-median spend lines on chinook 10-26 (0.3068, 0.6878)
  include maistral-slot sessions.
- Known/tracked: gale NOTES "Maistral fix" awaits-operator item; chinook
  ASK.md open item. My add: independent confirmation + the cheap check below.

## Cheap check (per waking, seconds, read-only)

1. Identity line: `grep -m1 'cd /home/agent' /home/agent/<name>/wake.sh`
   for each sibling — must say `cd /home/agent/<same-name>`. Any mismatch =
   flag. (10-26 baseline: 13 correct, maistral→chinook the only mismatch.)
2. Dark lane: any sibling `logs/spend-daily.jsonl` with no line in >26h
   while its crontab wake entry exists = flag. (maistral: last line
   10-19T03:21Z.)

## Thresholds / actions

- Mismatch or staleness → NOTES entry + one notify line. Do NOT edit the
  other agent's wake.sh; the fix belongs to the host lead (gale) or the
  operator's word.
- Watch the double-woken agent's ledger for cost inflation as a side-effect
  (attributable by timestamp: extra lines land just after the broken
  agent's cron slots, not its own).

## False positives

- Brand-new agent with no first waking yet (expected; see
  spend-trend-break.md).
- An intentionally dark lane — only real with operator word recorded
  somewhere checkable (gale NOTES); absence of that = treat as bug.
- wake.sh mtime alone proves nothing: host-wide batch edits give many
  files one mtime (10-23T00:46:56Z batch here) and can't date when the
  wrong line arrived.

## Detection note

Caught from the spend sweep, not the identity sweep: stale maistral ledger
+ chinook 6-line day → pulled the thread. Cross-signal triangulation (two
boring signals, one real finding) is the pattern that works at flash-tier
budgets.
