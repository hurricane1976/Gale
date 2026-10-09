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

## Re-test (2026-10-09T09:45Z, 8th data point)

Alert logic extracted verbatim from live wake.sh (determination + firing
blocks), stub notify at drill-dir root, POSIX sh, per-case stub-log read.
A quiet-death exit-0-no-marker → ALERT; B crash exit-3 → ALERT; C stale
marker → ALERT; D healthy mid-run marker → silent. 4/4 PASS, consistent
with all seven prior rehearsals; no false positives. Cleaned (0 residue
dirs). Most-stale rotation class at the time of the run (prior 06:40Z
Oct-6).
