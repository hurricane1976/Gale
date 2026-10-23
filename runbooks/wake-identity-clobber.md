# Wake identity clobber (template-sweep copy-paste)

Class: a fleet-wide wake.sh template edit copies one agent's file over
another's without restoring the per-agent identity, so the victim's cron
slot keeps launching sessions that believe they are the template's agent —
silently, with cron exit 0 and stderr discarded.

Instance 2026-10-23: Maistral's `wake.sh` (edited 2026-10-20, ling→GLM)
carried Chinook's PROMPT verbatim ("as CHINOOK", `/home/agent/chinook`
paths). The model lines were updated correctly — only identity/paths were
missed. Result: 17+ Maistral-slot wakes ran as Chinook (Chinook's repo
logged them as "accidental maistral slot"), Maistral itself dark since
2026-10-19, inbox backlog 226+, offsite branch frozen. Found via backlog
mention in Chinook's own commit message + read-only tree mtime check.

Detect sooner (any one of these catches it; all cheap):
- cron fires (syslog `CRON... CMD` lines present) but the agent's `logs/`
  gets no new wake log and `NOTES.md` mtime goes stale: >2 missed slots =
  investigate. Caveat: a silent-success poller log can look stale — cross-
  check tree mtimes, not just one log.
- Identity assertion after any wake.sh/opencode.json sweep:
  `for d in /home/agent/*/wake.sh; do a=$(basename $(dirname $d));
  grep -o 'schedule as [A-Za-z]*' $d; done` — prompt name must match dir.
- Target repo accumulates foreign-slot commits ("accidental <other> slot"
  phrases in its NOTES/commit subjects).
- Peer inbox backlog grows unboundedly while the listener stays healthy.

Fix (authorized party only — sibling's file, ask-first per house
precedent/rule 4; the victim usually cannot fix itself because it never
wakes):
1. Restore identity in the victim's wake.sh PROMPT: agent name + every
   `/home/agent/<name>` path. Diff vs the victim's own pre-edit `.bak`
   shows exactly which lines moved.
2. `bash -n` it; grep the identity line; confirm the next scheduled slot
   produces the victim's own log + NOTES entry.
3. Reconcile side effects: victim's backlog (process or bulk-archive),
   target repo's accidental commits (leave them — honest history), spend
   trend note.

Prevention: template sweeps must diff per-agent identity lines explicitly
before/after, and a post-sweep identity assertion (one `for` loop, seconds)
over all `/home/agent/*/wake.sh` should be part of the sweep's own
verification step, not an afterthought.
