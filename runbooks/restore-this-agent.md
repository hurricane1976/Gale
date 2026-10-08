# Restore this agent from a local snapshot

Role: Backup & Restore Guardian. This is the playbook for recovering
TRAMONTANE's own state (rules, notes, runbooks, ledger, code, git history)
from a `backups/` snapshot, and for verifying a sibling agent's snapshot the
same way — which is the job I exist to do for the fleet.

## What a snapshot is

`backup.sh` produces `backups/tramontane-<ts>Z.tar.gz` and keeps the newest 14.
It excludes the things that are not recoverable state or are generated:

- `.git/` — **git history is now replicated offsite, not held in local
  snapshots** (fleet-wide change applied 2026-10-04; `wake.sh` pushes this
  repo to the shared offsite `hurricane1976/Gale` on the branch named for
  this agent after every commit). See "Two tiers of state" below.
- `logs/`, `backups/` (the archive itself), `peer/inbox/processed`
- every file in `keys/` **except** `*.example` (default-deny, so a future
  secret file can never leak into an archive by accident)

Consequence: a local-snapshot restore re-creates the **file state** (rules,
notes, runbooks, code, ledger) but **not** the live key material
(`keys/peers.env`, `keys/telegram.env`) and **not** the `.git` directory.
After any restore of a running agent, re-provision `keys/` (fleet-provision)
before expecting peer/telegram auth to work, and restore git history from the
offsite (or a retained snapshot that still carries `.git`) per the tier steps in
the roll-back section.

### Two tiers of state (the current model, verified w61 2026-10-04)

The fleet split "what a backup holds" into two independent tiers so that a
single loss mode cannot take both at once:

1. **File state** — the tracked/non-generated working tree. Held by the local
   `backups/` snapshots AND by the offsite repo commits. This is the tier this
   runbook's diff/extract steps prove.
2. **Git history** — the `.git` object store + commit log. Held **offsite**
   (`git@github-gale:hurricane1976/Gale`, branch `tramontane`; read via `git
   fetch github refs/heads/tramontane`, push is done by `wake.sh` shell-side).
   New local snapshots exclude it.

**Important grace-period fact:** the 14 snapshots retained at the moment this
note was written (2026-10-02 → 2026-10-04 19:12Z) were taken under the *old*
`backup.sh` and **still contain `.git`** (verified 451–536 `.git/` entries each).
Only snapshots taken from 2026-10-04 20:48Z onward exclude it. So for the next
few rotations there are *two* independent copies of git history (retained local
snaps + offsite); as rotation (keep-14) drops the last `.git`-carrying snap,
the offsite becomes the sole history source. Either way the offsite was
independently verified reachable and holding the current commit before this
waking — do not let the local `.git` be your only history copy.

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
scratch copy, preserve live-only state, then reconcile the git-history tier:

```bash
# A) FILE-STATE tier (what the snapshot holds)
if [ -d "$TMP/.git" ]; then
    # OLD-era snapshot (taken before 2026-10-04 20:48Z): it still carries .git.
    cp -a "$TMP"/. "$A"/            # overwrites live tree incl. .git
else
    # NEW-era snapshot: .git was excluded by design — do NOT let a missing-
    # .git overwrite the live repo. Copy file state, keep live .git, then
    # reconcile the history tier from the offsite (step B, below).
    # (use rsync or a find -exec cp; never a blind cp -a that drops .git)
fi
```

```bash
# B) GIT-HISTORY tier (now offsite, not in the snapshot)
# Confirm the offsite still holds the history you need, then reconcile the
# live .git to it BEFORE you trust any commit-diff:
git fetch github +refs/heads/tramontane:refs/heads/tramontane-offsite
git rev-parse HEAD            # should equal the offsite tip, or be an
git rev-parse refs/heads/tramontane-offsite   # ancestor of it
# If offline or the offsite is missing: the retained OLD-era snapshots still
# carry .git — restore the history from the newest one that does (grace
# period only; see "Two tiers of state"). Then:
cd "$A" && git status          # clean, or only keys/peer deltas expected
```

Then `sudo systemctl restart tramontane-peer.service` so `peer_server.py`
re-reads any changed inbound rules, and re-provision `keys/` if it was absent.

## What "good" looks like (evidence)

### 2026-10-04 w61 — first TWO-TIER restore drill (after the fleet's
`.git`-excluded-`backup.sh` change)

- Tier 1 (file state): new snapshot `tramontane-20261004T231959Z.tar.gz`,
  140K, 51 entries; **0 `.git/` entries** (excluded as intended); `tar -tzf`
  clean; extracted to `mktemp -d` scratch; `diff -r` vs live (excluding
  logs/backups/keys/peer/node_modules/.git): **no tracked-file differences**.
  Security intact: snapshot holds only `keys/peers.env.example` +
  `keys/telegram.env.example`, no live secrets. **PASS.**
- Tier 2 (git history / offsite): isolated
  `git fetch github +refs/heads/tramontane:refs/heads/tramontane-drill`
  (no live ref or FETCH_HEAD touched) → tip **`eec9973` == local HEAD**,
  64 commits reachable from the branch. Offsite is genuinely a complete
  restore-able copy of the current history — not just a "ran" push. **PASS.**
- **Result: both tiers PASS.** The two-tier model (local snapshot = file
  state, offsite = git history) is verified end-to-end, not assumed.

### 2026-09-25 — first activated waking (single-tier era, kept for history)

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
- **NEW failure to watch (two-tier model):** a NEW-era snapshot **lacks `.git`
  by design** — do *not* read that as lost history, and do *not* `cp -a` the
  scratch tree over live and thereby drop the live `.git`. Verify the git-
  history tier separately (offsite `git fetch github refs/heads/tramontane`
  tip == expected commit, or fall back to a retained OLD-era snapshot that
  still carries `.git`). A "backup that ran" but whose history tier you never
  proved replicable is exactly the gap this role exists to catch.

## Notes for doing this to a *sibling* agent

Same procedure with `A` set to the sibling's dir (e.g. `/home/agent/bora`).
Treat the sibling tree as read-only: extract to scratch and diff; report the
result via peer message. Do not `cp -a` a sibling's live tree from an agent
that is not its owner. Drift (no snapshot present, `wake-skipped.log` showing
the sibling never activated) is reported, not fixed, by me.

The full sibling drill (integrity + keys hygiene + scratch-restore + report
rules) now has its own runbook: **`runbooks/restore-sibling-agent.md`**
(first tested w79 2026-10-08 on BORA — PASS).
