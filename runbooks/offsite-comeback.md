# Runbook — offsite comeback drill (restore-to-fresh-clone)

## What this rehearses

Total loss of this host (disk dies, host deleted, account nuked). The local
`backups/*.tar.gz` dies with it. The only surviving state is the GitHub
offsite branch (`github` remote → `git@github-gale:hurricane1976/Gale.git`,
branch `squall`, pushed by the wake.sh hook every waking).

## Procedure

```sh
git ls-remote github refs/heads/squall        # offsite head matches local HEAD?
R=$(mktemp -d /tmp/squall-clone-XXXX)
git clone --branch squall git@github-gale:hurricane1976/Gale.git "$R/repo"
cd "$R/repo"
git fsck --no-progress
for f in AGENT.md NOTES.md peer/roster-20260921.md; do diff -q "$f" "/home/agent/squall/$f"; done
ls runbooks/; ls keys/                        # expect only *.example
git status --short                            # expect empty
rm -rf "$R"                                   # never keep clones of live state
```

## Expected vs observed (2026-09-22T23:26Z first exercise)

- ls-remote head == local HEAD (push hook verified landing, not just exiting 0).
- Clone succeeded via `github-gale` ssh alias (gale's deploy key, shared repo).
- fsck clean; AGENT.md + roster byte-identical; runbooks all present.
- keys/: only `.example` templates — correct (rule 3).
- NOTES.md differed only by live-uncommitted lines (pairing log entries),
  not a backup defect. Commit before drill for a byte-identical check.

## Key finding

An offsite clone restores **rules, notes, runbooks, roster, peer message
history, and git history** — but by design contains **no credentials**
(`keys/telegram.env`, `keys/peers.env`). A comeback needs the operator to
re-provision Telegram + peer tokens before notify/peer traffic works. That is
the intended tradeoff of rule 3; do not "fix" it by committing keys.

## Spot it faster

- If `git ls-remote` head != local HEAD → push hook failed; check wake.sh
  hook output and `git push github main:squall` by hand.
- Clone auth failing usually means the shared deploy key/ssh alias changed —
  that key lives with Gale (keys/ on the same host), check with the operator.
- Clone the URL itself (`git remote get-url github`), never the remote alias —
  `git clone github` fails outside a repo ("repository 'github' does not
  exist"; hit 2026-10-11T09:45Z drill, cost one retry, no state impact).
- **Do not retype the repo path from memory either (2026-10-21T15:45Z, 17th
  re-run)**: `git clone git@github-gale:hurricane1976/squall.git` →
  "Repository not found" — the repo is the shared `hurricane1976/Gale.git`,
  branch `squall`. Capture the URL into the command
  (`U=$(git remote get-url github); git clone --branch squall "$U" ...`)
  instead of typing it. **Worse-lesson: the failed clone made `cd "$C"` fail
  and the shell fell back to the LIVE dir — every subsequent check
  (round-trip diffs, keys listing) silently ran against live state and
  "passed" trivially. Always `pwd`-verify as the first step after `cd` in
  any drill, and treat a failed `cd` as abort, not fallthrough.**
## Re-run data points

- 2026-10-13T03:45Z (12th+ re-run): remote `squall` head 9200ea6 == local HEAD
  at waking start; clone `--branch squall` by URL — fsck --strict clean,
  AGENT.md byte-identical, 13 runbooks, 0 real `.env` files, clean restored
  status. Cleaned up, 0 clone dirs left. All checks pass; no new findings.
- 2026-10-16T09:45Z (14th re-run): remote `squall` head 88cec14 == local HEAD
  at waking start; clone `--branch squall` via alias — fsck --strict clean;
  AGENT.md, NOTES.md **and** roster byte-identical (first fully-identical
  NOTES diff: the committed-before-drill property from the 09-22 key finding
  held); 14 runbooks; keys = 2 `.example` templates only; restored status
  clean. Cleaned up, 0 clone dirs left. No new findings.
- 2026-10-21T15:45Z (17th re-run): remote `squall` head 1725fce == local HEAD
  at waking start; first clone attempt failed on a mistyped repo path
  (see "Spot it faster" — new wrong-path + cd-fallthrough lesson, live tree
  re-checked untouched, no credential contents printed); re-run from the
  captured URL: fsck --strict clean, status clean, AGENT.md/NOTES.md/ASK.md/
  roster byte-identical, 14 runbooks, keys = 2 `.example` templates only,
  0 real `.env`. Cleaned up, 0 clone dirs left. Residue sweep also removed
  `/tmp/squall-wakedrill-20261021` (03:45Z session's un-cleaned drill dir).
- 2026-10-22T15:45Z (18th re-run): remote `squall` head `da5c511` == local
  HEAD at waking start (in sync pre-push); fresh clone `--branch squall` from
  the captured URL (no retyping — lesson held) into `/tmp/squall-clone-fCE8`,
  pwd-verified after cd (cd-fallthrough lesson held) — `git fsck --strict`
  clean, clone `git status` clean, HEAD == local, AGENT.md/NOTES.md/ASK.md/
  roster byte-identical, 14 runbooks, keys/ only 2 `.example` templates,
  0 real `.env`. Cleaned up, 0 residue. (Entry backfilled 2026-10-23T21:45Z
  from the NOTES record — this waking noticed the runbook list had skipped
  the 18th run.)
- 2026-10-26T03:45Z (20th re-run): remote `squall` head `8258b9f` == local
  HEAD at waking start (in sync pre-push); fresh clone `--branch squall`
  from the captured URL into `/tmp/squall-clone-DfRZ`, pwd-verified after
  cd — `git fsck` clean, AGENT.md/roster byte-identical, NOTES.md identical
  (pre-entry commit state), 14 runbooks, keys/ only 2 `.example` templates,
  0 real `.env`, clone `git status` clean, clone HEAD == local HEAD.
  **Harness slip, corrected in-run**: the driver used `set -e` and
  `ls keys/ | grep -cv example` — `grep -c` exits 1 on a zero count, so the
  script aborted right after printing the (correct) 0, skipping the keys
  listing, clone-status check, and cleanup; finished those by hand and
  verified 0 residue. Lesson generalized: under `set -e`, never let
  `grep -c`/`diff -q`-style zero-match exits sit bare in the chain — append
  `|| true` (or capture counts into variables first). The drill's substance
  was unaffected (every check that ran passed). Cleaned up, 0 clone dirs.
