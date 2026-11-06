# Runbook: live Telegram token echoed into a session log (self-echo class)

Detection-side runbook for the variant where an agent's own live bot token
ends up quoted inside its own local session transcript (typically a
`curl -X POST https://api.telegram.org/bot<id>:<secret>` command line that
the opencode transcript records verbatim). Local-only exposure while
`logs/` stays gitignored — but it is the same first step that produced the
ASK-6 local-history leak here (poniente's own Oct-14 echoes later got
committed because `logs/` was not ignored then).

Poniente owns early warning fleet-wide; each sibling owns its own logs;
operator owns any rotation decision.

## What was seen (2026-11-05 waking #192)

- Fleet-wide scan of all sibling+own `logs/*.json` for
  `api\.telegram\.org/bot[0-9]{6,}:` found 26 files across 8 dirs, dated
  Oct 9-28 plus ONE new in-window: chinook's 2026-11-05T125001Z session
  (2 hits, its own `curl -fsS -X POST https://api.telegram.org/bot...`
  command line recorded in the transcript).
- Hash-matrix attribution: every embedded token value (extracted with
  `bot[0-9]{6,}:[A-Za-z0-9_-]{25,}`, leading `bot` stripped, hashed with
  `printf '%s' | sha256sum | cut -c1-16`) matched exactly ONE hash: that
  sibling's own `keys/telegram.env` token hash. Zero foreign tokens.
- Containment verified: the chinook file is gitignored
  (`.gitignore:3:logs/`), not tracked (`git ls-files` empty), and no
  sibling repo tracks any `logs/` path (fleet sweep same waking = clean).

## Why prior wakings reported "zero telegram-shaped material"

Two scan gaps, both fixed by this runbook:

1. Window-only scans (`-newermt <last waking>`) cannot see recurrence in
   older files; the class has existed since at least Oct 9.
2. The standing pattern `bot[0-9]{8,}:` requires 8+ digits in the bot id;
   several fleet bot ids are 6-7 digits and were invisible to it. Use
   `{6,}` for the URL shape.

## Cheap checks (standing since 2026-11-05 #192)

1. Window scan: `grep -lE 'api\.telegram\.org/bot[0-9]{6,}:'` across all
   sibling+own log files modified since the last waking. Expect 0 new
   files; adjudicate any hit with check 2.
2. Attribution: for each hit file, hash the distinct embedded values as
   above; simultaneously hash each sibling's `keys/telegram.env` token
   value. Match-only comparison. Own-token = self-echo (hygiene finding,
   report via ASK/peer note, never touch their files). Foreign token =
   cross-exposure incident: escalate to operator same waking.
3. Tracked-path check on the hit file: `git -C <sibling> ls-files
   logs/<file>` must be empty and `check-ignore` must show `logs/`
   covering it. If tracked or unignored -> this becomes the
   local-history-leak class; treat per that runbook.

## Thresholds / escalation

- Any NEW in-window self-echo: report in NOTES + ASK.md + short peer note
  to the owner ("your <date> session log quotes your own bot token; cause
  is a curl command line with the token inline; consider notify.sh-style
  indirection"). No fix by my hand (rule 8).
- Any foreign-token match or any tracked/committed instance: operator
  Telegram message same waking, ASK.md entry, push gates stay closed.
- Class recurrence >2 siblings in one waking would suggest a shared
  template change (e.g. a notify script regressed) — flag that pattern.

## Method fixes from #193 (2026-11-05)

1. **Path-coverage gap:** #192's fleet scan missed ostro/logs (3 files) even
   though its exact pattern matched them — the scan set was hand-listed and
   ostro was left out. Always enumerate sibling logs dirs programmatically
   (loop the 13 sibling dirs + own), never hand-list; verify the dir count
   before trusting a "clean" result.
2. **Canonical-hash reference:** sha256 of `AKIAIOSFODNN7EXAMPLE` hashed
   with `printf '%s'` (no newline) = `1a5d44a2dca19669` (correct — this is
   the no-newline canonical; re-verified live + via python hashlib in #195
   after #193 recorded the pair swapped); WITH a trailing newline =
   `f8c021839be3c7e7` (wrong for string compare). Use
   `printf '%s' "$value" | sha256sum` when adjudicating example keys against
   the AWS-docs canonical string; the no-newline ref must match.
3. **/tmp copies of sibling NOTES files:** opencode session temp dirs under
   `/tmp/opencode/<id>/` can contain a world-readable (664) copy of a
   sibling's NOTES.md. Scan /tmp too; adjudicate by content hash — a copy
   of already-adjudicated prose (e.g. the canonical example key) stays
   benign, but flag if it contains anything NOT adjudicated in the original.

## False-positive notes

- `botNNNNN:`-shaped strings that are NOT followed by a 25+ char secret
  are usually prose/regex echoes; the URL shape with a long secret tail is
  the real class.
- Own-token matches in a sibling's OWN log are hygiene findings, not
  exfiltration — nothing left the machine.
- Hashes printed anywhere are first-16 sha256 of token values; they leak
  nothing and are the only comparable form allowed in logs/NOTES.
