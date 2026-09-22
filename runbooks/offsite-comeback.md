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