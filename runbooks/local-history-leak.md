# Runbook: live credentials in LOCAL git history (ASK-6 class)

Detection-side runbook for the variant of offsite-commit-leak.md where the
secret never leaves the machine but sits recoverable in local git objects.
Poniente owns early warning fleet-wide; the repo owner does recovery;
operator owns rotation.

## What was seen (2026-10-22, this repo)

Commit 6d8da89 (2026-10-17 20:55Z) committed the entire live `keys/`
(peers.env with 13 sibling tokens, live telegram.env, 15 .bak snapshots)
plus the live Telegram token echoed inside 5 committed session logs and one
probable-real sk- string. Root cause: `keys/` and `logs/` were absent from
.gitignore; session logs were re-committed every waking, so the exposure
grew daily. Caught 5 days later — only because the fail-closed pre-push
secret scan fired while fixing an unrelated broken push refspec (539
pattern matches in the 49.8MB unpushed diff; blob-hash comparison proved
committed == live). The broken refspec had kept offsite clean since Sep-27
by accident; that is luck, not a control.

## Cheap checks (standing since 2026-10-22)

1. Per-waking tracked-sensitive count: `git ls-files | grep -cE
   '^(keys/|logs/|backups/|peer/(logs|inbox)/)'` → expect exactly 2 (the
   two .example files). Any other value = incident, caught at the FIRST
   waking after the bad commit (≤6h) instead of at the next push attempt.
2. `git status --ignored` + `git check-ignore keys/ logs/ backups/` —
   confirm the ignore set actually covers the secret-bearing paths; an
   ignore gap is the root cause of this whole class.
3. Pre-push secret scan (fail-closed, since 2026-09-23) + history-aware
   gate (since 2026-10-22): no unpushed commit may track a live keys/
   path. The gate latching (unpushed-touching-keys > 0) is itself the
   signal that history still carries the incident.
4. Session-log echo check: fixed-string count of every live token value
   from keys/ against the current waking's logs (count printed, never the
   match) → expect 0.
5. Fleet-wide history scan (added 2026-10-22 waking #139, read-only):
   for each sibling repo,
   `git -C <dir> log --all --diff-filter=A --name-only --pretty=format:`
   grep'd for `^keys/.*\.env$` (non-example) — catches the class in any
   sibling's history even when their index is clean. 2026-10-22 result:
   only poniente's own 16 ASK-6 paths; all 13 sibling histories clean.
   Cheap enough to run every waking.

## Thresholds / escalation

- Any tracked non-.example path under keys/, logs/, backups/: untrack
  same waking, .gitignore the class, notify operator (rule 4), file ASK.
- History carrying the incident: push stays BLOCKED (fail-closed) until
  the operator rules on purge (git filter-repo) and rotation; verify the
  latch every waking.
- Live-token echo in any log: record filename + hash only, hold all
  pushes, treat as incident.

## False-positive notes

- keys/*.env.example tracked is expected (that's the count of 2).
- Pattern-scan hits on prose/fixtures are noise; blob-hash equality
  between a committed blob and a live file is the only proof of a real
  leak.
- A latched push gate is loud and recoverable; silently pushing history
  that contains live keys is not. Fail closed.
