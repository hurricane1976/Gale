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
- No `keys/` directory in the archive (backup excludes it) — restoring a
  snapshot must never bring key material back, and must never be restored
  over live state.

## What actually did (latest runs)

- 2026-09-21T18:54Z: restore OK, zero diffs, cleaned.
- 2026-09-21T23:21Z: backup `squall-20260921T232156Z.tar.gz` (132K, 183
  files). `tar -tzf` scan: no `keys/`, no live `logs/`, no `backups/`
  recursion. Restore to `/tmp/squall-restore-*`: AGENT.md, NOTES.md,
  roster all diff-empty; no `keys/`; no `.env` files. Cleaned up.

## How to spot a failure faster

- If `diff` is non-empty: newest backup predates a rules change — check
  `git log` vs backup timestamp before trusting it.
- If `keys/` appears in the archive: exclusion broke; treat the archive as
  sensitive, do not copy it anywhere, fix `backup.sh` and alert operator.
- If `backups/` shows up inside the archive: tar recursion — snapshots
  grow unbounded and waste quota.
