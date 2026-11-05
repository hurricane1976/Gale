# ASK.md - questions for the operator

Rules 4/8: irreversible, legally gray, or token/credential-related things
need your word first. Newest at the top. When you answer, delete your
answer from below and I will note it in NOTES.md.

## 2026-11-05 - ASK-8: chinook's own Telegram token echoed in its session logs (self-echo class, local-only)

**Found this waking (#192).** New fleet-wide scan (`api.telegram.org/bot` URL
shape, 6+ digit ids — prior scans used 8+ and window-only, so this class was
invisible) found 26 log files across 8 dirs quoting a live-shaped bot token
inside a `curl -X POST https://api.telegram.org/bot<id>:<secret>` command
line. **Hash-matrix attribution (match-only): every token is that sibling's
OWN** (each file's token hash16 == the owner's own keys/telegram.env hash16).
Zero foreign tokens, zero exfiltration path.

- Files: agent 1, vortex 1, chinook 2, cyclone 10, maistral 3, sirocco 5,
  bora 2, poniente 2 (my own Oct-14 files = the already-contained ASK-6
  echoes). All dated Oct 9-28 EXCEPT chinook 20261105T125001Z (today's
  12:50Z waking — 2 hits, recurring habit, not a one-off).
- Containment: every hit file sits under `logs/`, which is gitignored in
  all 14 repos (verified); chinook's today-file confirmed untracked. So
  exposure is local-only right now — same state my own logs were in before
  ASK-6's accidental commit made it history.
- No action by my hand (rule 8 — chinook's files are chinook's). I sent
  chinook a data-only peer note describing the mechanism (inline-token curl
  line recorded by the transcript) and suggesting notify.sh-style
  indirection. Runbook: `runbooks/token-echo-in-session-log.md`.

**Your call (non-urgent):** (a) leave it — each owner trims its own logs
(the root 7d trim job already ages most of these out), or (b) have the
sibling owners switch any inline-token curl to a config-reading helper so
new transcripts stop capturing tokens. Rotation not indicated by this class
alone (tokens never left the machine, no foreign copies). I'll keep the
window scan standing either way.

## 2026-10-25 - ASK-7: maistral's wake.sh wakes CHINOOK (maistral dark 6.5 days)

**Found this waking.** `/home/agent/maistral/wake.sh` is chinook's script:
`cd /home/agent/chinook`, CHINOOK prompt, chinook AGENT.md path. Every
maistral cron slot (02:05/08:05/14:05/20:05) has woken a chinook session
since **2026-10-19 ~14:05Z** — maistral's own dir has had zero wakes in
6d7h. Introduced during the ling->glm migration window; appears to be a
chinook->maistral copy that kept chinook's cd/branding.

**Effects at detection:**
- maistral/peer/inbox: 335 unprocessed messages (~25-50/day since Oct 19).
- maistral spend ledger stale since Oct 19 03:21Z; maistral lane work dark.
- chinook/logs: 24 foreign wake files at maistral-only timestamps; chinook's
  spend ledger absorbing ~$0.06/wake (daily totals ~2x inflated since Oct 19).
- maistral's Telegram loop is alive (telegram_commands.log fresh), so only
  the wake cadence is broken.
- Recovery hazard: the pre-change backup `wake.sh.bak-20261020-ling-to-glm`
  is ALSO chinook-branded (contaminated), and `HEAD:wake.sh` in maistral's
  repo is wrong too. Restoring from either keeps the bug. Fix = self-branded
  script (any correct sibling's as template, with maistral name/dir/slot/model).
- Scope: only maistral affected; all 13 other wake.sh verified self-cd/self-brand.
- No secret material at risk: keys/ untouched, chinook's logs/ is gitignored.

**Your decision:** want me to (a) leave recovery 100% to you, or (b) with
your go-ahead I still can't edit maistral's dir under my rules — so if you
want it fixed by my hand, that needs your explicit word overriding rule 8
for this one file. Otherwise: fix + commit wake.sh, drain the 335-message
inbox (manual wake or bulk-move), and I'll verify from the watch side at
next wakings. I added `runbooks/wake-misdirect-cross-cd.md` with the tested
9h-staleness check that catches this class within one waking (it flags
maistral at 155h right now).

**UPDATE 2026-10-30 20:59Z — RESOLVED (not by my hand).** maistral/wake.sh
was restored self-branded from the 20261019T080520Z backup ("Re-applied
2026-10-30" per its header). maistral's 20:05Z waking ran in its own lane:
first spend-ledger entry since 10-19, commit af2b011 (post-gap recovery,
524 inbox msgs filed), backlog 497 -> 0. Verified from the watch side; see
NOTES.md #169. No further action needed unless it regresses.

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
