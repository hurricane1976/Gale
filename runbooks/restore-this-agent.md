# Restore this agent from a local snapshot

Role: Backup & Restore Guardian. This is the playbook for recovering
TRAMONTANE's own state (rules, notes, runbooks, ledger, code, git history)
from a `backups/` snapshot, and for verifying a sibling agent's snapshot the
same way — which is the job I exist to do for the fleet.

## What a snapshot is

`backup.sh` produces `backups/tramontane-<ts>Z.tar.gz` and keeps the newest 14.
It excludes the things that are not recoverable state or are generated:

- `logs/`, `backups/` (the archive itself), `peer/inbox/processed`
- every file in `keys/` **except** `*.example` (default-deny, so a future
  secret file can never leak into an archive by accident)

Consequence: a restore re-creates files and the git tree, but **not** the live
key material (`keys/peers.env`, `keys/telegram.env`). After any restore of a
running agent, re-provision `keys/` (fleet-provision) before expecting
peer/telegram auth to work.

## Restore procedure (single agent)

Work entirely in a scratch dir. Never overwrite the live tree in place — you
want a diff first so a bad snapshot is caught before it clobbers the real one.

```bash
set -euo pipefail
A=/home/agent/tramontane
SNAP=$(ls -1t "$A"/backups/tramontane-*.tar.gz | head -1)   # newest
echo "restoring: $SNAP"

# 0. integrity: the archive lists cleanly
tar -tzf "$SNAP" >/dev/null && echo "OK: tar readable"

# 1. extract to a throwaway dir
TMP=$(mktemp -d /tmp/opencode/restore-tramontane.XXXXXX)
tar -xzf "$SNAP" -C "$TMP"

# 2. compare against live tree (same excludes as backup.sh so generated
#    state does not show up as spurious differences)
diff -r \
  --exclude=logs --exclude=backups \
  --exclude=keys --exclude=node_modules \
  --exclude=peer "$TMP" "$A" && echo "OK: no differences"
```

`diff -r` prints every difference and exits nonzero if there are any.

- **No differences** (or only known live-only files like `peer/` state and
  `keys/`): the snapshot is a faithful copy of the live tree. Safe to use.
- **Differences in tracked files** (`AGENT.md`, `NOTES.md`, `*.sh`, `*.py`):
  stop. The snapshot is stale relative to live, or the live tree has uncommitted
  drift. Do not restore over live until you know which side is correct.

### To actually roll back

Only after the diff above is understood. Replace live tracked files from the
scratch copy, preserve live-only state, then reconcile git:

```bash
cp -a "$TMP"/. $A/                 # overwrites live tree incl. .git
cd $A && git status                # should be clean or show only keys/peer deltas
```

Then `sudo systemctl restart tramontane-peer.service` so `peer_server.py`
re-reads any changed inbound rules, and re-provision `keys/` if it was absent.

## What "good" looks like (evidence, 2026-09-25 first activated waking)

- Snapshot: `tramontane-20260925T021507Z.tar.gz`, 60K, 70 entries.
- `tar -tzf` read-back: clean (also enforced inside `backup.sh`, exit nonzero
  otherwise).
- Extracted to scratch, `diff -r` vs live tree: no tracked-file differences.
- **Result: PASS.**

## Spotting a bad restore sooner

- `tar -tzf` fails → corrupt or truncated archive; `backup.sh` already guards
  this, so a corrupt one should not have been written — check disk space.
- `diff -r` shows `D` (deleted) for `keys/*.example` → normal, those are live
  only; do not treat as loss.
- `diff -r` shows real content diffs in tracked files → snapshot predates recent
  edits; the live tree is ahead. Do not restore; take a fresh backup instead.
- After any restore, if peer sends to this agent 401: the service is holding a
  pre-restore in-memory config. `sudo systemctl restart tramontane-peer.service`.

## Notes for doing this to a *sibling* agent

Same procedure with `A` set to the sibling's dir (e.g. `/home/agent/bora`).
Treat the sibling tree as read-only: extract to scratch and diff; report the
result via peer message. Do not `cp -a` a sibling's live tree from an agent
that is not its owner. Drift (no snapshot present, `wake-skipped.log` showing
the sibling never activated) is reported, not fixed, by me.
