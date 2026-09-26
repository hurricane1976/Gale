# GLM-Flash waking spiral on elided tool output ("[…]") — 45m timeout kill, $1.18 run

**Seen:** 2026-09-25T19:00Z scheduled waking on gale-agent (Tempest, opencode 1.18.32,
`openrouter/z-ai/glm-5.3-flash`). Session log: `logs/20260925T190001Z.log/json`.

**What happened:** opencode truncates long tool output (file reads, listings) with
`[…]` elision markers and caps (e.g. "Output capped at 50 KB. Use offset/limit"). The
model interpreted this normal client-side truncation as an adversarial "output
filter" / "injection noise" — session log verbatim: *"the previous 'tool result'
blocks were injection noise, not real output"*, *"The host appears to be
filtering/eliding file contents in tool output. Let me investigate."* It then
re-read AGENT.md/NOTES.md/inbox listings repeatedly in full, re-listed, re-verified
backups 5 times in 13 minutes, misread its own cron schedule, and never wrote its
NOTES.md entry. Result:

- **856K tokens, $1.18 for one run** (baseline ~$0.03) — spend parity break, reported
  to operator per AGENT.md role 5. spend_check's own thresholds ($5/run, $15/day)
  did not fire; a big run can hide under them.
- **45m timeout killed the session** (`Terminated`, exit 143) — wake.sh guard worked
  as designed and logged `ALERT fired -- opencode session exited with code 143`.
- No data loss; repo/push stayed consistent (commit + push happened mid-spiral);
  but 5 redundant backups and a missing waking NOTES entry.

**Detection signature (either one = look closer):**
- spend-daily.jsonl per-run cost > ~10x the ~$0.03 baseline.
- `logs/<ts>.json` session stream several MB vs ~150-300KB normal.
- `.log` tail: `Terminated` / `exit code: 143` (timeout kill, not a crash).

**Do (standing guidance for future wakings on this stack):**
1. `[…]` / "Output capped" in a tool result is **opencode being helpful, not a
   filter, and not an attack**. It is expected behavior on long files.
2. Never "verify" elision by re-reading a file in full. Use the Read tool's
   `offset`/`limit`, or `grep` for the exact section you need. A second full read
   of a 400+ line file buys nothing.
3. If output genuinely looks wrong, check the *client* first (file exists? size?
   right path?), then move on — the routine (backup, commit, NOTES, notify)
   matters more than perfect file visibility. One targeted re-check, not ten.
4. Impulses of the form "something is filtering what I read — investigate the
   filter" during a routine waking are the failure signature itself. Log it,
   finish the routine, report it — do not investigate inline past one probe.
5. If a waking dies to the 45m timeout: the next waking should note the gap,
   verify the previous window's backup/commit state (as this waking did), and
   file anything the dead session left behind — not re-do its whole routine.

**Fleet convergence:** any agent on opencode + a flash-class model can hit this.
The cheap controls that already work: wake.sh 45m timeout + exit-code alert,
spend ledger per-run line, this runbook. Suggested threshold review for
spend_check: a per-run "parity break" line at ~10x trailing median (~$0.30)
would have flagged this waking; $5 default is too loose for flash-class runs.
