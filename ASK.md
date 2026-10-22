# ASK.md - questions for the operator

Rules 4/8: irreversible, legally gray, or token/credential-related things
need your word first. Newest at the top. When you answer, delete your
answer from below and I will note it in NOTES.md.

## 2026-10-22 - ASK-6: live credentials are in local git history (push blocked)

**What happened.** Commit `6d8da89` (2026-10-17 20:55Z, a "security wake"
session) committed my entire live `keys/` directory into git:
`peers.env` (all 13 sibling peer tokens, byte-identical to the live file
- blob-hash verified), `telegram.env` (live Telegram bot token, blob-hash
verified), and 15 `peers.env.bak-*` token snapshots. `keys/` and `logs/`
were never in my `.gitignore`, and session logs (`logs/*.json`, 273
files, tracked until today) are committed every waking. The live Telegram
bot token also appears quoted inside 5 committed session logs (Oct-2
self-incident echo + Oct 14/16/17 echoes - hash-matched, not pattern
noise). One more likely-real secret: an 80-char `sk-` string in the
Sep-28 session log (context = the vortex "coordinator's own key" echo).

**Why nothing leaked offsite.** My offsite push has been failing since
Sep 27 (`git push github main:poniente` vs local branch named
`poniente`). The last pushed commit `e48b019` is clean (only `.example`
files in keys/, zero logs/). The broken refspec accidentally protected
the fleet; the fail-closed pre-push scan then caught the whole thing
today (539 pattern matches in the 49.8MB unpushed diff) when I went to
fix the refspec.

**Contained this waking (local-only, reversible).** Untracked all of
keys/ (except .example), logs/, backups/, peer/logs/, peer/inbox/,
*.bak-*; .gitignore now covers all of them; wake.sh push refspec fixed
and the pre-push gate upgraded to a second, history-aware check (no
unpushed commit may track a live keys/ path). Push remains BLOCKED.

**Your decisions (I hold at each step):**
1. Purge local history (`git filter-repo` of keys/+logs/+baks) then
   force-push to restore the offsite tier? Offsite history is currently
   stale since Sep 27; tar snapshots are intact.
2. Rotate the Telegram bot token? (It has sat in local git objects for
   5 days; purge without `git gc` leaves it recoverable from old
   objects.)
3. Rotate the sibling peer tokens in peers.env?
4. Is the Sep-28 sk- string the coordinator's real key (rotate?).

## 2026-10-14 - Model change reversal

ASK-5 - opencode.json model was changed at 12:49 UTC today from
`freetoken/Qwen3.6-35B-A3B-NVFP4` (FreeToken LAN, zero external spend —
fleet migration 2026-10-13) to `openrouter/~z-ai/glm-flash-latest`. A
pre-change backup was created. This reverses the no-spend migration and
could incur external charges. Reverted to committed baseline pending your
word. Did you intend to switch back to GLM?

## 2026-09-26 - Standing up the Fleet Security & Credential-Hygiene Watch

ASK-2 - Pairing: 13 co-located siblings (ports 8787-8799) are staged for
rule-8a pairing (token mint + both halves installed + self-test each
direction). Go, and I will do them in one pass and self-test every pair.
Each pair still gets its own line in NOTES.md when it happens.

ASK-3 - Remote peers: 21 on Beacon/Tidal/Mountain remain gated on
per-pair sign-off as before. Nothing changes there for me; listing it so
the roster state is explicit.
