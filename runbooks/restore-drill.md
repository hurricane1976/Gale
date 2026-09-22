# Runbook — backup restore drill (Squall)

## What this drill is

Prove the fleet could actually come back from a copy of the newest
`backups/*.tar.gz` — not just that the archive lists (Gale's verify). We
restore into a scratch dir and check the round trip.

## Procedure (tested 2026-09-21T23:21Z)

```
RESTORE=$(mktemp -d /tmp/squall-restore-XXXXXX)
tar -xzf backups/<newest>.tar.gz -C "$RESTORE"
diff AGENT.md        "$RESTORE/AGENT.md"
diff NOTES.md        "$RESTORE/NOTES.md"
diff peer/roster-20260921.md "$RESTORE/peer/roster-20260921.md"
ls "$RESTORE/keys"   # must NOT exist
grep -rE 'TELEGRAM|Bearer|token' "$RESTORE" --include='*.env' -l   # nothing
rm -rf "$RESTORE"    # always clean up
```

## What should be true

- `AGENT.md` / `NOTES.md` / roster diff empty after round trip.
- No key material in the archive. Since 2026-09-22 the backup includes
  `keys/*.example` (placeholder templates, verified no secrets) so a
  restored git tree is clean; every other `keys/` file is excluded
  (default-deny in `backup.sh`). Restoring must never bring real key
  material back, and must never be restored over live state.
- The restored tree should also pass `git -C "$RESTORE" fsck` and show a
  clean `git status` — a restored repo that can't commit defeats the point.

## What actually did (latest runs)

- 2026-09-21T18:54Z: restore OK, zero diffs, cleaned.
- 2026-09-21T23:21Z: backup `squall-20260921T232156Z.tar.gz` (132K, 183
  files). `tar -tzf` scan: no `keys/`, no live `logs/`, no `backups/`
  recursion. Restore to `/tmp/squall-restore-*`: AGENT.md, NOTES.md,
  roster all diff-empty; no `keys/`; no `.env` files. Cleaned up.
- 2026-09-22T06:54Z (this waking): round-trip diffs clean, fsck clean, BUT
  restored `git status` showed `D keys/peers.env.example D
  keys/telegram.env.example` — backup excluded all of `keys/` while git
  tracks the two `*.example` templates, so a bare restore had a dirty tree
  and could not commit cleanly. Fixed `backup.sh` (default-deny: excludes
  every `keys/` file except `*.example`; real `peers.env`/`telegram.env`/
  `.bak-*` verified absent from the archive). Re-drill on
  `squall-20260922T065654Z.tar.gz`: no secrets, round-trip identical, fsck
  clean; only remaining item was `M backup.sh` because the fix itself was
  uncommitted at snapshot time — after committing, restores are clean.

## How to spot a failure faster

- If `diff` is non-empty: newest backup predates a rules change — check
  `git log` vs backup timestamp before trusting it.
- If any `keys/` file other than `*.example` appears in the archive:
  exclusion broke; treat the archive as sensitive, do not copy it anywhere,
  fix `backup.sh` and alert operator.
- If `backups/` shows up inside the archive: tar recursion — snapshots
  grow unbounded and waste quota.
- If restored `git status` is dirty: either a tracked file is missing from
  the archive (backup exclusion vs git tracking mismatch — the
  `keys/*.example` bug class) or live changes were uncommitted when the
  snapshot ran. Commit before backing up.
