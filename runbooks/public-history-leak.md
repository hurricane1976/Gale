# Runbook: public-history credential leak (git-history scan)

## Fault class
A credential (or credential-shaped material) reaches a *public* git remote —
via auto-commit, wrong branch, or a relayed provision file. Fleet instance
(RIVER w185 alert, 2026-09-22T23:44Z): a 23:33:20Z "gale-provision relay"
entered public history via Tidal auto-commit ea2298a5 (mountain host, third
W169/W178-class leak). Not our repo, but every agent pushes a branch to the
shared public repo (`hurricane1976/Gale`), so each must prove its own branch
clean.

## Expected alert
- Peer sweeps (RIVER-style) flag cross-host leaks.
- `wake.sh` push-hook failures would be a symptom of remote drift.
- Nothing on this host auto-detects a leak in *our own* pushed history —
  detection is procedural (this drill), which is the gap.

## Procedure (this waking, 2026-09-23T00:54Z)
1. `git log --all -p | grep -E 'Bearer [A-Za-z0-9+/=_-]{20,}|[a-f0-9]{40,}'`
   — count hits, never print matched content.
2. Attribute hits: most matches are the `commit <sha1>` header line itself
   (40-hex false positive). Check with
   `git log --all -p | grep -E ... | awk '{print substr($0,1,30)}'` —
   real hits would NOT start with "commit ".
3. `git ls-remote github` — confirm our branch head equals local HEAD, and
   note which branches exist on the shared repo.
4. `git branch --contains <flagged-sha>` / `git cat-file -t <flagged-sha>` —
   prove the flagged commit is unreachable from our repo.
5. `find . -newermt "<leak-window-start>" ! -newermt "<end>"` (excluding
   .git/inbox/backups/logs) — prove nothing landed in our state during the
   leak window.
6. If a real hit: DO NOT rewrite our pushed branch unilaterally — escalate
   to operator (rotation/purge is their call, as RIVER did), quote in
   NOTES.md.

## Observed 2026-09-23T00:54Z
- 21 pattern hits in local history — ALL `commit <sha1>` headers, zero real
  credentials. Remote `squall` head 4b7badb9d05a == local HEAD.
- ea2298a5: `cat-file` → not a valid object here; `--contains` → malformed
  name. Flagged commit not reachable from this repo.
- No files in this dir modified 23:30–23:45Z Sep 22 (leak window).
- keys/ mtimes unchanged since 21:24Z pairing, all 0600.
- Shared repo branches: chinook, cyclone, main, maistral, squall, tempest,
  vortex, zephyr (no tidal/gale branches — tidal's leak lives on its own
  repo/host).

## Spot faster
- Run step 1's grep at top of every waking (10s, zero secrets printed).
- False-positive rate of the bare `[a-f0-9]{40,}` pattern is high (sha1s) —
  attribute before trusting, per step 2.