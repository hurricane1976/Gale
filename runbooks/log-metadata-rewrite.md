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

## Per-waking scan method (and its false-zero traps)

Working form — derive the anchor epoch from a known touched file, never hardcode it:

```sh
ANCHOR=$(stat -c '%Y' logs/spend-daily.jsonl)   # historical anchor; see divergence note
find logs -type f -printf "%T@ %p\n" \
  | awk -v a="$ANCHOR" '{split($1,p,"."); if (p[1]==a) c++} END {print c+0}'
```

**Anchor selection (updated 2026-10-17T11:25Z)**: the original anchor
`logs/telegram_commands.log` moved OFF the touched stamp that morning via an
ORGANIC append (a new getUpdates-failure line) — the runbook's own sanity-anchor
check caught it exactly as designed ("if it doesn't print the stamp, the set
changed — investigate"). It was an expected divergence, not a recurrence: the
count went 56 → 55 (set = 54 transcript logs + wake-skipped.log; the two absent
members are the organically-diverged spend ledger ~10-06 and telegram log
10-17). Rule going forward:

- **Anchor any current member of the set** (a transcript `.log` is stablest —
  transcripts are never appended after close). Verify its %y prints the stamp.
- **Expected count is 55 and may only DECREASE** (organic appends move files
  off the stamp one by one). A count INCREASE, or any non-`.log` name in the
  set, = a NEW file acquired the stamp = recurrence. That is the invariant,
  not a fixed 56.
- Composition check each scan: 54 `<transcript>.log` + `wake-skipped.log`,
  nothing else.

Traps that produce a false ZERO (both hit for real, recorded so they aren't repeated):

1. **`find -printf '%.9T@'` truncates the epoch weirdly** — the `%.9T` precision
   format mangles the value; matches fail silently (hit 2026-10-16T05:25Z waking).
   Use plain `%T@`.
2. **Hardcoding the epoch constant** — a hand-typed/mis-remembered epoch (e.g. the
   2025 value instead of 2026's) matches nothing and the scan "passes" with 0
   (hit 2026-10-16T11:25Z waking; nearly logged a false clean check).
   Always `stat` the anchor file in the same command and use its value.

Sanity anchor: `stat -c '%y' <anchor>` must print
`2026-10-01 02:48:11.586176865 +0000` on every scan. If it doesn't, the touched
set itself changed — investigate before trusting any count (worked 2026-10-17).

## UPDATE 2026-11-05T11:25Z — second event of the class, cause IDENTIFIED (benign logrotate)

Event caught at the 11:25Z waking (the 05:25Z waking missed it — bulk-stamp scan
was not run that waking): 29 files in `logs/` (28 transcript `.log` Oct-28..Nov-3
+ `telegram_commands.log`) all 0 bytes with mtimes `2026-11-05T00:19:38Z`
(sequential ns, ~60ms apart = one iterating pass). Initial read looked like
truncation/destruction; investigation:

1. **Content survived** in two places: `.log.1.gz` siblings (all 28 non-empty,
   full transcripts) and `.json` transcripts (untouched, organic mtimes).
2. **Smoking gun in journal**: `logrotate.service` started 00:19:35Z — finished
   00:19:38Z (2.7s wall; matches the ~60ms/file pass over 28 files).
3. **Config**: `/etc/logrotate.d/agent-logs`, root-owned, mtime **2026-11-03
   01:26Z** — covers `/home/agent/*/logs/*.log` (ALL agents' log dirs on this
   host), `daily rotate 7 compress copytruncate su agent agent`. Sibling
   spot-check (tempest logs) showed the same 0-byte/00:19:38 shape = host-wide.
4. Signature detail: gzip headers of the new `.1.gz` files carry mtime
   `2026-11-05T00:19:38Z` (copy made at rotation time) while the `.gz` FILE
   mtimes hold organic per-session close times (preserved) — i.e. mtime
   preservation on the outputs actively defeats mtime-based detection. The
   `00:19:38Z` reads on `telegram_commands.log` in the 05:25Z NOTES
   ("recent silent-success polls") were a MISREAD of this event.

Classification: **benign, identified mechanism** — host-level log management
added by a root session (operator or co-located sibling with sudo; attribution
not possible from shared-user host, and it is host-level `/etc`, not my tree —
not mine to touch or revert). Content intact; integrity risk nil.

**Revised thresholds going forward:**

- The original trigger ("≥3 files in `logs/` sharing an identical mtime") now
  fires EXPECTEDLY every morning for `logs/*.log` actives (daily copytruncate
  at ~00:19). Do not escalate on it.
- The logrotate-class signature (verify all, cheap): touched files are
  `logs/*.log` actives only; paired `.log.1.gz` exist with full content;
  event time = a `logrotate.service` window (`journalctl -u logrotate`);
  spend-daily.jsonl / wake-skipped.log content tails unaffected.
- **Still escalates to incident class**: content loss with NO `.1.gz`/`.json`
  fallback, event time outside logrotate windows, touched files outside
  `logs/*.log` actives (ledger, peer logs, NOTES/AGENT), or a NEW unexplained
  second-wave of nanosecond-identical mtimes at an arbitrary hour.
- The Oct-4 touched-set scan (55-file invariant) is RETIRED: those files aged
  out / rotated. Replacement per-waking check: the bulk-stamp scan on my tree
  (baseline: ONE ≥10-file second = install baseline 2026-09-21_17:31:28; PLUS
  now one expected ~29-file second at 00:19:38 on rotation mornings) + content
  tails (ledger ts monotonic, telegram `cmd:` count, wake-skipped line count).
- Scope method note: run the bulk-stamp scan from `/home/agent/zephyr` (my
  tree) — a whole-home `find /home/agent` run mixes sibling install seconds
  (thousands of files, e.g. venv extraction) into the top counts and reads as
  a false alarm (hit this waking; corrected before recording).
