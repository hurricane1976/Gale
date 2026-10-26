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
## Harness lessons (2026-10-02T00:40Z re-test, 4th data point)

- Extracting the alert block: `sed -n '/^# A crashed session/,/^fi$/p'` grabs only
  the ALERT *determination* block — the *firing* block (`if [ -n "$ALERT" ]`)
  is a second block ending in its own `fi`. Use an awk two-`fi` range or extract
  the whole region.
- Stubbing the notify call: replacing only the `./notify.sh` command token in the
  line leaves the original argument tail attached, so the sourced line becomes
  `echo … ; touch "$NOTIFY_MARK" "wake.sh: WARNING: …"` — touch then CREATES a
  junk file named like the alert string in the harness cwd. If the harness runs
  with the live repo as cwd, drill residue lands in the live tree (this waking:
  3 junk files, committed by accident, then removed in a corrective commit).
  Run harnesses from their own drill dir, or replace the entire line.
- Filenames from bash `echo` of the alert string contain LITERAL `\n` (backslash-n,
  no `-e` flag) — `rm "$name"$'\n'` (real newline) does not match; xargs -0 over
  `git ls-files -z` is the reliable cleanup.

## Real occurrence: length-exhaustion quiet death (2026-10-02T12:40Z session)

First real firing of the ALERT on a session that did real work (not the Sep-26
refusal class): the 12:40Z cron session completed the whole routine per its run
log (`logs/20261002T124002Z.log` — creep attribution, backup 621 entries, restore
drill PASS, 429 drill with verified isolation) but died at the commit step with
**`out=0 reason=length`** — the runner exhausted its output budget, emitted zero
final tokens, exited 0. No NOTES entry, no commit, no notify. wake.sh's
quiet-death ALERT fired (`notify_last_response.txt` message_id 71, delivered ok).

- Signature: ledger line EXISTS with moderate cost ($0.1026) + run log shows
  completed work + `reason=length, out=0` + no commit after it. Distinct from
  the very-low-spend refusal class ($0.002) and the silent-expensive class
  ($2.86, no log evidence of work).
- Reconciliation: the run log is the entry of record for that session; its
  observations (logrotate compressed the syslog.1 flood, puppeteer leak resumed,
  429 5th data point) were carried into the 18:40Z waking's entry.
- Cleanup gap found: the session logged "Drill cleanup complete — no residue"
  but left `/tmp/squall-429drill/` (156K incl. synthetic `drill-peers.env`, mode
  600) — it killed the drill process but never removed the dir. Lesson: a
  session's own cleanup claims are not evidence; verify `/tmp/squall-*drill*`
  is empty at the next waking (now part of the standing sweep).
- Spot it faster: after each wake, if a ledger line has no matching committed
  NOTES entry, read the session's `.log` tail — `reason=length` means the
  session ran out of output, not that it did nothing.

## Re-test (2026-10-03T18:40Z, 5th data point)

Alert block extracted verbatim from live wake.sh (comment → second `fi`, 20
lines), stub notify at drill-dir root. A quiet-death exit-0-no-marker → ALERT;
B crash exit-3 → ALERT; C stale marker → ALERT; D healthy mid-run marker →
silent. 4/4 PASS, consistent with all four prior rehearsals; no false
positives. Live state untouched; drill dir + stub cleaned (0 residue).

- Harness precision lesson (new): the stale-marker case must set the marker's
  mtime *strictly before* run start. First attempt set `touch -d @$start`
  (mtime == RUN_START_EPOCH exactly) — the live condition is
  `mtime < RUN_START_EPOCH`, so the boundary case correctly does NOT alert and
  the harness mislabeled it a miss. Boundary equality is not staleness.
- Residue sweep per the standing procedure: `/tmp/squall-*drill*` empty after
  cleanup — verified.

## Re-test (2026-10-04T18:40Z, 6th data point)

Alert block extracted verbatim (lines 124–140 via awk two-`fi` range), stub
notify at drill-dir root. A quiet-death exit-0-no-marker → ALERT; B crash
exit-3 → ALERT; C stale marker (mtime strictly before run start) → ALERT;
D healthy mid-run marker → silent. 4/4 PASS, consistent with all five prior
rehearsals; no false positives. Cleaned (0 residue dirs).

- New harness lesson: the drill harness must run under `sh` (dash) —
  `source ./block.sh` is a bashism that silently failed all four cases on the
  first attempt ("source: not found", harness bug not detector bug); use
  POSIX `. ./block.sh`. Same class as the clone-by-URL / flat-archive
  harness lessons: verify the harness itself before concluding anything
  about the detector.

## Re-test (2026-10-11T15:45Z, 9th data point)

Alert blocks extracted verbatim (lines 146–162: determination + firing;
the multi-line `./notify.sh "…" $TAIL` string spans 159–160 — the closing
`fi` is 162, not 161), stub notify at drill-dir root, POSIX sh, per-case
stub-log read. A quiet-death exit-0-no-marker → ALERT; B crash exit-3 →
ALERT; C stale marker → ALERT; D healthy mid-run marker → silent. 4/4 PASS
after harness fix (see below); no false positives. Cleaned (0 residue dirs).

- **New harness lesson (unset-variable contamination)**: the extracted block
  references variables defined EARLIER in wake.sh — `NOTIFY_MARK` (line 41)
  among them. First run left `NOTIFY_MARK` unset: `[ ! -f "" ]` is TRUE, so
  the elif fired on every case. A/B/C still read PASS (right answers, wrong
  reason — undetectable from the output), and the healthy case D false-
  positives. Rule for this drill: define EVERY variable the block references
  (`NOTIFY_MARK`, `JSON_FILE`, `LOG_FILE`, `TS`, `RUN_START_EPOCH`,
  `OPENCODE_EXIT`) before dotting it, and treat a first-pass-all-green with
  suspicion if the healthy case was never shown silent. D is the only case
  that exercises the marker-exists path — a harness that alerts on D is
  telling you the harness is broken, not the detector.
- Harness precision lesson (carried): stale marker must be strictly before
  run start; boundary equality is not staleness (confirmed again in D:
  mtime == RUN_START_EPOCH → silent).

## Re-test (2026-10-12T21:45Z, 10th data point)

Alert block extracted verbatim (lines 143–162 via `sed -n '143,162p'` — the
comment through the firing block's closing `fi`, 20 lines), every referenced
variable defined (`OPENCODE_EXIT`, `TS`, `RUN_START_EPOCH`, `LOG_FILE`,
`JSON_FILE`, `NOTIFY_MARK`), stub notify.sh at drill-dir root, POSIX sh.
A quiet-death exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale
marker (mtime strictly before run start) → ALERT; D healthy mid-run marker
→ silent. 4/4 PASS, consistent with all nine prior rehearsals; no false
positives (case D silent on first run — the unset-variable harness lesson is
now baked into the harness template). Cleaned (0 residue dirs; standing
sweep verified).

## Re-test (2026-10-13T21:45Z, 11th data point)

Alert block extracted verbatim (`sed -n '144,163p'` — determination + firing
through the closing `fi`), all referenced variables defined in a generated
`vars.sh` (`OPENCODE_EXIT`, `TS`, `RUN_START_EPOCH`, `LOG_FILE`, `JSON_FILE`,
`NOTIFY_MARK`), POSIX sh, per-case stub-log. A quiet-death exit-0-no-marker →
ALERT; B crash exit-3 → ALERT; C stale marker (mtime strictly before run
start) → ALERT; D healthy mid-run marker → **silent on first run** (template
holding). 4/4 PASS, consistent with all ten prior rehearsals. Harness note:
the alert block's `tail -c 1500 "$LOG_FILE"` errors noisily when LOG_FILE
doesn't exist — cosmetic, ALERT text already written before that line; next
harness should touch the log file first to keep output clean. Cleaned (0
residue dirs; standing sweep verified).

## Re-test (2026-10-09T09:45Z, 8th data point)

Alert logic extracted verbatim from live wake.sh (determination + firing
blocks), stub notify at drill-dir root, POSIX sh, per-case stub-log read.
A quiet-death exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale
marker → ALERT; D healthy mid-run marker → silent. 4/4 PASS, consistent
with all seven prior rehearsals; no false positives. Cleaned (0 residue
dirs). Most-stale rotation class at the time of the run (prior 06:40Z
Oct-6).

## Re-test (2026-10-16T03:45Z, 13th data point)

Alert block extracted verbatim (`sed -n '147,167p'` — comment through the
firing block's closing `fi`; line numbers shifted after the v2 `--standalone`
/ `--auto` wake.sh edits, re-locate with grep before extracting), all
referenced variables defined, POSIX sh, stub notify, LOG_FILE pre-touched.
A quiet-death exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale
marker (mtime strictly before run start) → ALERT; D healthy mid-run marker
(mtime == run start, boundary) → **silent**. 4/4 PASS, consistent with all
twelve prior rehearsals; no false positives; correct alert text verified per
case; stub notify fired exactly once per ALERT case and zero times on the
healthy case. Cleaned (0 residue dirs; standing sweep verified).

- **New harness lessons (two stub-wiring misses caught before recording)**:
  (1) capturing `ALERT` in a subshell is required when isolating cases — but
  the parent cannot read it; write the verdict to a per-case result file
  inside the subshell instead. (2) the block's `./notify.sh` is
  **cwd-relative**: with per-case subdirs the stub must be *copied into each
  case dir* — a single stub at the drill root is invisible from case cwds
  (extends the "stub at drill-dir root" lesson), and the stub's own log path
  must be `export`ed or the child process can't see it (first run logged 0
  calls with the verdict still correct — right answer from ALERT capture,
  silent stub failure; verify the stub actually logged before trusting a
  "PASS").

## Re-test (2026-10-21T03:45Z, 14th data point)

Alert block extracted verbatim (anchor-checked, `sed -n '148,167p'` — comment
through the firing block's closing `fi`; line numbers held from the Oct-16
extraction), all referenced variables defined in the per-case driver
(`OPENCODE_EXIT`, `TS`, `RUN_START_EPOCH`, `LOG_FILE`, `JSON_FILE`,
`NOTIFY_MARK`), POSIX sh, stub notify copied into each case dir, LOG_FILE and
JSON_FILE pre-touched, verdicts read from stub.log contents. A quiet-death
exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale marker (mtime
strictly before run start) → ALERT; D healthy mid-run marker (strictly after
run start) → silent. 4/4 PASS + stub-fired-exactly-once check on A —
consistent with all thirteen prior rehearsals; no false positives. Drill run
entirely inside `/tmp/squall-wakedrill-*`; only live file touched was
wake.sh, read-only. Cleaned up (0 residue dirs; standing sweep verified —
the only `squall` match in /tmp is the live `systemd-private-*-squall-peer`
PrivateTmp dir, not residue).

## Re-test (2026-10-21T21:45Z, 15th data point)

Alert block re-located by grep post-model-swap and extracted verbatim
(`sed -n '151,167p'`, `ALERT=""` through the firing block's closing `fi`;
one line up vs the 03:45Z extraction — wake.sh's PROMPT/model lines
shifted the block, line numbers do NOT hold across edits), `sh -n` clean,
all referenced variables defined in the per-case driver, POSIX sh, stub
notify per case dir, LOG_FILE/JSON_FILE pre-touched. A quiet-death
exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale marker (mtime
−60s, strictly before run start) → ALERT; D healthy marker (mtime ==
run start boundary) → SILENT. 4/4 PASS + stub-fired-exactly-once
(grep-counted) on every ALERT case, 0 on healthy — consistent with all
fourteen prior rehearsals; no false positives. **Harness lessons this
run: (1) first case-C setup inverted the staleness (marker touched at
RUN_START+30 = healthy class, so it silently PASSED as a D duplicate) —
caught only by eyeballing the stub count against the expected verdict;
fix was to compute and PRINT the mtime offset in the verdict line, so
setup errors are self-evident rather than masked by a PASS-shaped
output. (2) `grep -c … || echo 0` double-prints zero (grep -c already
emits 0 and exits 1) — use `grep -c … || true` and read the single
line.** Cleaned up (0 residue; standing sweep verified).

## Re-test (2026-10-23T21:45Z, 16th data point)

Alert block re-located by grep and extracted verbatim (`sed -n '151,167p'` —
`ALERT=""` through the firing block's closing `fi`; line numbers shifted again
post-model-pin, re-locate each time), `sh -n` clean, all referenced variables
defined in the per-case driver (`OPENCODE_EXIT`, `TS`, `RUN_START_EPOCH`,
`LOG_FILE`, `JSON_FILE`, `NOTIFY_MARK`), POSIX sh, stub notify per case dir,
LOG_FILE/JSON_FILE pre-touched. A quiet-death exit-0-no-marker → ALERT;
B crash exit-3 → ALERT; C stale marker (mtime −60s, strictly before run
start) → ALERT; D healthy marker (mtime == run start boundary) → SILENT.
4/4 PASS; stub fired exactly once on every ALERT case and **zero times on the
healthy case (stub.log absent — absence itself is the proof of
non-invocation)**. Consistent with all fifteen prior rehearsals; no false
positives. Cleaned up (0 residue dirs; standing sweep verified).

- **New harness lesson (missing-stub.log arithmetic)**: on a healthy case the
  stub never runs, so `stub.log` does not exist and `COUNT="$(grep -c …
  "$STUB_LOG")"` is empty → `[ "" -ge 1 ]` throws `Illegal number:` (noisy
  but non-fatal; the verdict falls through to "silent" — which happens to be
  the right answer for D, but for the wrong reason). Fix: test file existence
  first — missing stub.log = stub never invoked (the D proof), present = read
  the count. Do not let an empty grep result silently stand in for a verdict.

## Re-test (2026-10-24T21:45Z, 17th data point)

Alert block re-located by grep and extracted verbatim (`sed -n '151,167p'` —
`ALERT=""` through the firing block's closing `fi`; line numbers held from the
Oct-23 extraction this time, but re-locate each run regardless), `sh -n` OK,
all referenced variables defined in the per-case driver (`OPENCODE_EXIT`, `TS`,
`RUN_START_EPOCH`, `LOG_FILE`, `JSON_FILE`, `NOTIFY_MARK`), POSIX sh, stub
notify AND block copied into each case dir, LOG_FILE/JSON_FILE pre-touched.
A quiet-death exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale marker
(mtime −60s) → ALERT; D healthy marker (mtime == run start boundary) → SILENT.
4/4 PASS; stub fired exactly once on every ALERT case and zero times on the
healthy case (stub.log absent = non-invocation proof); mtime offsets printed
in the verdict lines (C: −60s, D: 0s) so setup errors stay self-evident.
Consistent with all sixteen prior rehearsals; no false positives. Cleaned up
(0 residue dirs; standing sweep verified).

- **New harness lesson (block must live in the case dir)**: `. ./block.sh` is
  cwd-relative — the extracted block sits at the drill root but each case
  subshell `cd`s into its own dir, so the first run failed all four cases with
  `.: cannot open ./block.sh` (loud failure, no false PASSes; the detector
  never executed). Fix: `cp block.sh` into each case dir alongside the stub —
  same class as the 13th data point's per-case-stub lesson. Verify-the-harness-
  first held: the mismatch was visible as an error, not as a plausible verdict.

## Re-test (2026-10-25T21:45Z, 19th data point)

Alert block re-located by grep and extracted verbatim (`sed -n '151,167p'` —
`ALERT=""` through the firing block's closing `fi`; line numbers held from
the Oct-23/24 extractions, re-locate each run regardless), `sh -n` OK, all
referenced variables defined in the per-case driver (`OPENCODE_EXIT`, `TS`,
`RUN_START_EPOCH`, `LOG_FILE`, `JSON_FILE`, `NOTIFY_MARK`), POSIX sh, stub
notify AND block copied into each case dir, LOG_FILE/JSON_FILE pre-touched.
A quiet-death exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale
marker (mtime −60s) → ALERT; D healthy marker (mtime == run start boundary)
→ SILENT. 4/4 PASS; stub fired exactly once on every ALERT case and zero
times on the healthy case (stub.log absent = non-invocation proof); mtime
offsets printed in verdict lines (C: −60s, D: 0s) so setup errors stay
self-evident; verdicts read from the block's own `ALERT fired` LOG_FILE
evidence, not from driver assumptions. Consistent with all eighteen prior
rehearsals; no false positives. Cleaned up (0 residue dirs; standing sweep
verified — the only /tmp squall match is the live `systemd-private-*`
PrivateTmp dir, not residue).

## Re-test (2026-10-26T21:45Z, 20th data point)

Alert block re-located by grep (`ALERT` on line 151) and extracted verbatim
(`sed -n '151,167p'` — one line wider than prior runs: the `./notify.sh` call
spans TWO source lines (164–165, the `"…Log tail:` string wraps), so ending
at 166 leaves the firing block's closing `fi` out and `sh -n` fails with
`end of file unexpected (expecting "fi")` — the failure is the tell, re-locate
and re-check each run). `sh -n` OK after the widened range; all referenced
variables defined in the per-case driver; POSIX sh; stub notify copied into
each case dir; LOG_FILE/JSON_FILE pre-touched. A quiet-death exit-0-no-marker
→ ALERT; B crash exit-3 → ALERT; C stale marker (mtime −60s) → ALERT; D
healthy marker (mtime == run start boundary) → SILENT. 4/4 PASS; stub fired
exactly once on every ALERT case and zero times on the healthy case (grep
`STUB-NOTIFY-CALLED` count, not line count — the 14th-data-point lesson).

Two new harness lessons (verify-the-harness-first class):
1. **Dot-source after `cd` breaks relative paths.** The 13th-data-point
   lesson said put the stub in each case dir — running the block from inside
   the case dir via `. ../alert-block.sh` then fails (`cannot open`: the
   relative path resolves from the case dir, not the drill root). Either
   dot-source the block by ABSOLUTE path, or copy the block into the case
   dir too. The first harness run failed all four cases on exactly this.
2. **Unquoted-heredoc variable interpolation poisons the child.** Building
   the driver in an UNquoted heredoc (`<<DRIVER` vs `<<'DRIVER'`) expanded
   `$D` at generation time into the outer shell's value — but the child
   `sh` process (fresh env, no `$D`) then saw `$D` → empty, producing
   paths like `/A.log` and `mkdir: Permission denied` at `/`. Use a quoted
   heredoc (or hardcode paths) for anything the child must re-evaluate.
   Both bugs were caught before any verdict was recorded — the all-fail
   signature is itself the tell (a harness that can't execute the block
   can only produce false "silent"s, per the 15th-data-point rule). The
   SECOND bug also left residue in the live tree: the first attempt ran
   the driver with cwd = live repo and RELATIVE paths (`$CASE.log`,
   `mkdir -p $CASE`), so `A/`–`D/` dirs + empty `.log`/`.json` files were
   created in the repo root before the failure surfaced — removed in a
   corrective step the same waking (git add was scoped to the intended
   files, so nothing residue-shaped was committed; residue class matches
   the 2026-10-02 junk-file incident). Standing rule reinforced: run drill
   drivers only from the drill dir, with absolute paths, AND cd-verify
   the cwd at driver start before any filesystem write.

Consistent with all nineteen prior rehearsals; no false positives. Cleaned
up (0 residue dirs; standing sweep verified).

## Class: runner-flag breakage (opencode v2 upgrade, 2026-10-14/15) — NOT a dead session

Three consecutive wakings (21:45Z Oct-14, 03:45Z + 09:45Z Oct-15) produced
no session at all: an opencode v2 upgrade (2026-10-14 20:41Z) removed the
`run --dir` flag, so every wake.sh attempt exited 1 (`Unrecognized flag:
--dir`), through 3 retries + fallback. Signature vs the refusal class: log
contains only ERROR/retry lines and "no cost in envelope, nothing to
record", ledger has NO line at all (no session ever ran — the Sep-26
refusal pair still recorded $0.002/$0.001). The shell-side ALERT fired
correctly all three times (crash path, exit 1 ≠ 0); operator fixed wake.sh
(`--standalone`, cwd-based) + telegram_commands.py `/stop` between 09:46Z
and 15:45Z Oct-15; fix verified live by the 15:45Z session running.
Spot-faster: on any wake log with zero model output and zero ledger line,
check `opencode --version` + the exact flag surface of `opencode run`
before suspecting model/refusal drift — runner upgrades can silently
change CLI surface.

## Subclass: completed-then-exit-1 retry duplicates a full waking (first observed 2026-10-16T09:45Z)

wake.sh's 3x exit-1 retry (ported 2026-09-28) re-runs the FULL waking with no
check for whether the prior attempt already did the work. First live instance:
the 09:45Z Oct-16 session ran to completion — committed 00a6b3f (09:51:16),
pushed offsite, notified (message_id 128), backup 094901Z, comeback drill PASS,
17 inbox processed — then exited 1 (retryable APIError, likely on the final
`--format json` emission), and the 30s-backoff retry launched a full duplicate
session at 09:52Z. Cost: one wasted model run (~$0.05 band) + one extra
operator Telegram; no state damage (the duplicate detected itself).

Spot-faster (standing pre-flight, cheap): before executing the full routine,
check `git log -1 --format='%h %ci'` — if the current :45 slot is already
committed, run a LIGHT pass instead (health glance, no second backup/drill,
short NOTES entry documenting the duplicate, commit, notify) and note the
retry in `logs/<slot>.log` terms. Ledger nuance: the errored attempt's spend
line may post late or not at all (is_error) — reconcile on the slot, not the
line count.
