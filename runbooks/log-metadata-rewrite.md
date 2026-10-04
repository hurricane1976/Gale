# runbooks/log-metadata-rewrite.md — bulk mtime rewrite of runtime logs

## Incident (first seen 2026-10-04T00:20Z waking)

- 56 files in `logs/` — every wake-transcript `.log` except the then-current one,
  plus `spend-daily.jsonl`, `telegram_commands.log`, `wake-skipped.log` — all had
  mtime set to the **same nanosecond timestamp** `2026-10-01T02:48:11.586176865Z`.
- Window: between 2026-10-03T18:24:11Z (last organic write, spend line) and
  2026-10-04T00:20Z (observed). mtime PREDATES file content (spend ledger holds
  lines through 18:24:10Z Oct 3) — so this was a backward `touch`, not an organic
  write or a content restore.
- Content integrity verified: spend ledger 55 lines, monotonic, complete through
  the 18:24Z Oct 3 line; telegram log 10 lines matching its historical 9/25 04:25Z
  description (no new operator commands); wake-skipped.log historical line intact;
  transcript `.json`s, du/notify files, lock files untouched (real mtimes); git
  repo clean (no foreign commits, reflog clean; benign `.git` dir mtime 23:24Z Oct 3,
  no ref changes — likely gc).

## What cheap check caught it

Sweep mtime listing of `logs/` (already part of the routine transcript check) —
dozens of unrelated files sharing one sub-second-identical mtime, older than their
own content. Trivial to spot in any `ls -la logs/`.

## Detection thresholds going forward

1. Any ≥3 files in `logs/` sharing an identical mtime **to the nanosecond** = bulk-touch
   class. Flag, then verify content (do not assume tampering).
2. **Never use file mtime as the change detector for ledger/log files.** The
   "telegram log mtime unchanged since 9/25" check ran for ~9 wakings and was
   silently invalidated by this event. Use content tails instead:
   - spend ledger: last line's `ts`/cost vs expected post-waking line
   - telegram log: `grep -c "cmd:"` + tail lines
   - wake-skipped.log: line count
3. Content-vs-mtime contradiction (mtime older than newest content line) proves a
   backward touch. That is the cheap tell — record and flag, don't rewrite anything.

## FP notes

- Bulk restores / `cp` without `-p`, or `tar -x -m`, also produce uniform mtimes
  (= extraction time). Those set mtime = event time (plausible "recent" clock);
  here the set value (Oct 1 02:48) is neither the event window nor consistent with
  content — hence classified as a deliberate backward touch, mechanism unknown.
- Likely actor class: co-located sibling/operator session file op (shared account,
  attribution not possible from mtimes alone). Per rules: record, don't act, flag
  to operator (ASK.md item). No evidence of content alteration found.

## Follow-ups

- [ ] Operator confirmation whether a file op ran in `logs/` 18:24Z Oct 3–00:20Z Oct 4.
- [ ] Recurrence watch each waking: identical-mtime scan (one find command).
- [ ] If it recurs with content changes: escalate to incident class (integrity, not metadata).
