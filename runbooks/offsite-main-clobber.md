# Offsite backup: shared-repo branch clobber

**Class:** the fleet's shared GitHub repo (`hurricane1976/Gale`, one branch
per agent, plus `main`) had its `main` branch silently replaced by a
sibling's repo lineage. Offsite backup kept "succeeding" from the sibling's
point of view while the clobbered agent lost its offsite copy without any
alert firing.

## What happened (found 2026-10-23T06:20Z)

- Gale's wake.sh pushed bare `git push github main` since 2026-09-22.
- Gale's wakings since ~2026-10-17 committed on branch `gale-nav-fix`
  (local `main` went stale at 2026-10-16), so those pushes either no-op'd
  or — once remote main changed — failed non-fast-forward.
- Chinook's repo lineage (unrelated git roots, author `chinook@gale-agent`,
  "waking #N" commit style) landed on remote `main` between ~2026-10-17 and
  2026-10-20T20:05Z (last foreign commit `fa4d148`). Chinook's hook was
  later fixed to `main:chinook`, so the clobbering stopped on its own —
  but the damage to `main` persisted, and nothing alerts on remote git
  state, so it sat unnoticed for ~3 days.
- Net effect: every Gale commit from 2026-09-28 to 2026-10-23 had **no
  offsite copy**. Local repo + backups/ tarballs were the only copies.

## How to spot it sooner

- `git ls-remote github refs/heads/main` and compare the tip against local
  `main` — author/tree mismatch means clobber. Cheap enough to eyeball on
  any waking that touches git.
- A daily `git push` success/failure is not enough: a stale local branch
  makes pushes "succeed" as no-ops forever. Check that the pushed ref
  actually moved (or push to an agent-named branch that always advances).
- Fleet-level: `roster_check.py`-style drift checking could compare each
  remote branch tip's author email against the expected agent.

## Fix applied (2026-10-23, Gale-side only)

1. Pushed Gale's full lineage to a new remote branch `refs/heads/gale`
   (`git push github main:gale`) — additive, no shared state touched.
2. wake.sh hook: `git push github main` -> `git push github main:gale`
   (fleet convention: one branch per agent; independent of the main
   dispute; ends the daily non-ff failures).
3. Widened the local fetch refspec from `+refs/heads/main` to
   `+refs/heads/*` so future fetches see sibling branches and a clobber
   becomes visible immediately.

## Deliberately NOT done without the operator (rule 4)

- Force-restoring remote `main` to Gale's lineage. Safety analysis done
  (remote main's Chinook tip is an ancestor of `refs/heads/chinook`, so
  nothing of Chinook's would be lost), but overwriting a shared ref that
  currently holds another agent's offsite history is the operator's call.
  Ready-to-run: `git push github main:main --force` from this repo.
- Fixing Maistral's buggy hook (`git push github main:chinook` — collides
  with Chinook's branch; Maistral currently has no working offsite backup
  because its pushes fail non-ff). Sibling's file, rule 7: reported, not
  edited.

## Related near-miss worth keeping

- Local `main` went stale because wakings switched to a feature branch and
  never merged back. If you must work on a branch, either merge to main at
  the end of the session or make the push hook push the *current* branch
  (not a hardcoded one).
