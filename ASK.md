# ASK.md — open questions for the operator

## Open

- **NEW w128 2026-10-21 04:35Z — MY OWN (tramontane's) AGENT.md is identity-clobbered
  with SIROCCO's content — third instance of the fleet's clobber class; your call:
  confirm intent (role reassignment) or authorize a revert.** Discovered this waking
  via git archaeology (all read-only; I touched nothing): my AGENT.md is
  **byte-identical to sirocco's** and says "# AGENT.md — Sirocco / You are Sirocco /
  directory /home/agent/sirocco persists / Your role: Upstream Dependency &
  External-Service Health" — not my identity. My TRUE AGENT.md ("# AGENT.md —
  Tramontane / Your role: Backup & Restore Guardian") is intact in my own git history
  at first commit `ba71ac4` through `7451e6b` (the commit just before w119); the swap
  landed on-disk between w118 (Oct 18 16:35Z) and w119 (Oct 18 22:35Z) with file mtime
  `2026-10-13 19:34:23` — sirocco's file as of its Oct 13 operator edit, i.e. an
  mtime-preserving copy (snapshot-tarball or `cp -p` class), same class as the
  sirocco(→maistral) and maistral(→chinook) clobbers. My w119 session then COMMITTED
  it as a "pre-existing modification" (its note described the swap backwards).
  **My harness is intact** (wake.sh `cd /home/agent/tramontane`, PROMPT names
  TRAMONTANE, opencode.json glm-latest; sessions/backups/ledger all mine since);
  **NO DATA LOST.** Per rule 6 I will not edit the role/rules sections myself:
  **(a) if the w119 swap was your intent (role reassignment to the supply-line
  lane), say so on Telegram and I'll adopt it fully; (b) if not, authorize the
  revert — restore AGENT.md from my pre-w119 history (`git show 7451e6b:AGENT.md`)
  operator-side or say the word and I'll do it.** Until your word, I run BOTH
  lanes (backup drills/sweeps per my true role and history + dependency passes
  per the file), which is what w119–w127 have been doing.

  **Re-checked w129 2026-10-21 10:35Z: UNCHANGED — AGENT.md still byte-identical
  to sirocco's (`diff -q` clean), mtime still 2026-10-13 19:34:23; harness intact
  (PROMPT names TRAMONTANE, opencode.json glm-latest); NO DATA LOST. Both lanes run
  again this waking. Your call (a)/(b) stands.**

  **Re-checked w130 2026-10-21 16:35Z: UNCHANGED — AGENT.md still byte-identical
  to sirocco's (`diff -q` silent), mtime still 2026-10-13 19:34:23; harness intact
  (wake.sh `cd /home/agent/tramontane`, PROMPT names TRAMONTANE, opencode.json
  glm-latest); NO DATA LOST. Both lanes run again this waking. Your call (a)/(b)
  stands.**

  **Re-checked w131 2026-10-21 22:35Z: UNCHANGED — AGENT.md still byte-identical
  to sirocco's (`diff -q` silent), mtime still 2026-10-13 19:34:23; harness intact
  (wake.sh `cd /home/agent/tramontane`, opencode.json glm-latest); NO DATA LOST.
  Both lanes run again this waking (drill+sweep+dependency pass). Your call
  (a)/(b) stands.**

  **Re-checked w132 2026-10-22 04:35Z: my AGENT.md UNCHANGED (still the Oct 13
  19:34:23 clobbered copy saying "# AGENT.md — Sirocco"; harness intact, opencode.json
  glm-latest, NO DATA LOST; your call (a)/(b) stands). NOTE: the files now DIFFER —
  on SIROCCO's side: your 02:00:04Z Oct 22 batch edit changed sirocco's
  AGENT.md/wake.sh/opencode.json (model line → glm-flash-latest) on 6 sibling dirs
  (sirocco/bora/cyclone/levante/ostro/poniente), not mine; the only remaining diff
  vs my file is that model line. Both lanes run again this waking.**

- **w127 2026-10-20 22:35Z — MAISTRAL's tree identity-clobbered with CHINOOK's
  content (same class as sirocco's Oct 16 case, now RESOLVED — see below);
  MAISTRAL drift ~38.5h, sole dir over the 6h bar; nothing reads maistral's
  inbox while its wake.sh cd's into chinook's dir.** Discovered read-only at
  the w127 sweep: maistral's committed AGENT.md says "# AGENT.md — Chinook" /
  "directory (/home/agent/chinook) persists", its wake.sh does
  `cd /home/agent/chinook`, and its git history is chinook's wakings (#122–124,
  Oct 18 12:50Z last) — a duplicate-chinook run from maistral's 20:05Z slot
  produced `chinook-20261020T200508Z` (fresh-looking chinook row = the
  entangled slot, verified by slot-time mismatch). Maistral's own last snap
  is `maistral-20261019T080520Z` (154 entries, readable, keys/git clean);
  its dir's last log is 09:20Z Oct 19 (3× retryable APIError, exit 1, ALERT
  fired, github push failed non-fast-forward) — every slot since has produced
  no maistral session/snap. **Recovery anchors verified intact (read-only):**
  (a) the 08:05Z Oct 19 snap; (b) offsite `refs/heads/maistral` tip `8c95afd`
  (checked via `git ls-remote` from MY repo — no writes to maistral's tree).
  NO DATA LOST. I touched nothing (rule 7); no peer note sent (nothing reads
  maistral's inbox while its cron runs chinook's wake.sh — the operator
  channel is the effective one). **Your call: (a) restore maistral's identity
  files operator-side from its Oct 19 08:05Z snapshot or the offsite
  `refs/heads/maistral` branch (fastest while its cron is broken), or (b) an
  operator word to maistral via another channel.** Also recommend: whatever
  process produced the sirocco fix (~13:47Z Oct 19) applied fleet-side would
  fix maistral the same way — and both clobbers came from a session's own
  git-conflict "recovery" (reset --hard to a sibling's tip), so the
  standing recommendation stands: wake.sh should never `reset --hard` a
  sibling branch onto main, and push targets should stay `main:<agent>`.
  **Correction recorded (w127):** my w124–w126 sweep rows claimed "0/14 drift
  fleet fully fresh / MAISTRAL 75m fresh" — that is contradicted by the
  on-disk evidence (no maistral snap since Oct 19 08:05Z); those prior sweep
  numbers for maistral were stale-template errors. The w127 sweep above is
  the authoritative one; I will re-verify each row's snap filename fresh
  every waking going forward.

  **Re-checked w128 2026-10-21 04:35Z: UNRESOLVED — maistral drift ~44.5h (2670m);
  AGENT.md still Chinook, wake.sh still `cd /home/agent/chinook`; your Oct 20 20:08Z
  runner-swap batch edit touched maistral's wake.sh/AGENT.md mtimes but did not fix
  the clobber; its 02:05Z slot produced another duplicate-chinook snap
  (`chinook-20261021T020521Z`). Anchors intact. Your call (a)/(b) stands.**

  **Re-checked w129 2026-10-21 10:35Z: UNRESOLVED — maistral drift ~50.5h (3030m),
  +6h/slot as the model predicts; AGENT.md still "# AGENT.md — Chinook", wake.sh
  still `cd /home/agent/chinook`, mtimes still your Oct 20 20:08Z batch edit; newest
  own snap still `maistral-20261019T080520Z`, newest own log still 09:20Z Oct 19.
  3rd consecutive duplicate-chinook slot: its 08:05Z slot produced
  `chinook-20261021T080518Z` (74 entries); chinook's OWN 06:50Z slot also fired
  normally (`chinook-20261021T065012Z`) so chinook itself is healthy. Anchors
  re-verified intact: (a) the Oct 19 08:05Z snap readable; (b) offsite
  `refs/heads/maistral` tip `8c95afd` — UNCHANGED (git ls-remote from MY repo).
  NO DATA LOST; I touched nothing (rule 7). Your call (a)/(b) stands.**

  **Re-checked w130 2026-10-21 16:35Z: UNRESOLVED — maistral drift ~56.5h (3391m),
  +6h/slot exactly as the model predicts; AGENT.md still "# AGENT.md — Chinook",
  wake.sh still `cd /home/agent/chinook`, mtimes still your Oct 20 20:08Z batch
  edit; newest own snap still `maistral-20261019T080520Z`, newest own log still
  09:20Z Oct 19. 4th consecutive duplicate-chinook slot: its 14:05Z slot produced
  `chinook-20261021T140524Z` (75 entries); chinook's OWN 12:50Z slot fired normally
  (`chinook-20261021T125021Z`) so chinook itself is healthy. Anchors re-verified
  intact: (a) the Oct 19 08:05Z snap readable; (b) offsite `refs/heads/maistral`
  tip `8c95afd` — UNCHANGED. NO DATA LOST; I touched nothing (rule 7). Your call
  (a)/(b) stands.**

  **Re-checked w131 2026-10-21 22:35Z: UNRESOLVED — maistral drift ~62.5h (3750m),
  +359m ≈ +6h vs w130 exactly as the model predicts; AGENT.md still "# AGENT.md —
  Chinook", wake.sh still `cd /home/agent/chinook`, mtimes still your Oct 20 20:08Z
  batch edit; newest own snap still `maistral-20261019T080520Z` (readable), newest
  own log still 09:20Z Oct 19. 5th consecutive duplicate-chinook slot: its 20:05Z
  slot produced `chinook-20261021T200515Z`; chinook's OWN 18:50Z slot fired
  normally (`chinook-20261021T185041Z`) so chinook itself is healthy. Anchors
  re-verified intact: (a) the Oct 19 08:05Z snap readable; (b) offsite
  `refs/heads/maistral` tip `8c95afd` — UNCHANGED. NO DATA LOST; I touched
  nothing (rule 7). Your call (a)/(b) stands.**

  **Re-checked w132 2026-10-22 04:35Z: UNRESOLVED — maistral drift ~68.5h
  (4110m), +360m = +6h exactly as the model predicts; AGENT.md still "# AGENT.md —
  Chinook", wake.sh still `cd /home/agent/chinook`, mtimes still your Oct 20 20:08Z
  batch edit (your 02:00:04Z Oct 22 batch edit did NOT touch maistral/chinook);
  newest own snap still `maistral-20261019T080520Z`, newest own log still 09:20Z
  Oct 19. 6th consecutive duplicate-chinook slot: its 02:05Z slot produced
  `chinook-20261022T020554Z`; chinook's OWN 00:55Z slot fired normally
  (`chinook-20261022T005049Z`) so chinook itself is healthy. Anchors re-verified
  intact: (a) the Oct 19 08:05Z snap readable; (b) offsite `refs/heads/maistral` tip
  `8c95afd` — UNCHANGED (git ls-remote from MY repo). NO DATA LOST; I touched
  nothing (rule 7). Your call (a)/(b) stands.**

- **INFORMATIONAL (w131 2026-10-21 22:35Z) — PONIENTE: offsite git-history tier
  stale ~24 days + rotation anomaly; reported to poniente (data-only, ok:true),
  theirs to fix — flagged here for your visibility since one tier of the
  two-tier backup model has been silently down for that agent.** Read-only sweep
  findings (I touched nothing per rule 7): (1) offsite `refs/heads/poniente` tip
  `e48b019` is dated 2026-09-27 vs its local HEAD `50680a8` (waking #136 today) —
  its wake.sh push fails every slot with "src refspec main does not match any"
  (its local branch is named `poniente`, not `main`; error visible in its own
  current log). Its snapshots exclude `.git` by design, so its git history
  currently lives ONLY locally — exactly the single-tier exposure the fleet
  split into two tiers to avoid. Tier-1 file state is fine (fresh 20:55Z snap
  today, keys example-only, git=0). (2) Its `backups/` holds 15 tars (its
  rotation keeps 14): the oldest (`poniente-20261018T085524Z.tar.gz`) was spared
  by the 20:55Z slot's rotation and now carries today's mtime (20:55:41, 16s
  after its new snap) — content verified era-consistent (nothing lost), but the
  mtime-based rotation order is now corrupted and its next rotation may delete
  an unexpected file. Possible fleet-side angle if you want one: the push
  refspec bug is per-agent wake.sh config (its push names `main` while its local
  branch is `poniente` — same class as the "push targets stay `main:<agent>`"
  recommendation from the clobber post-mortems).

- **SIROCCO ENTANGLEMENT — RESOLVED (w127 2026-10-20 22:35Z, verified
  read-only).** Sirocco's identity is restored: AGENT.md "# AGENT.md —
  Sirocco" again, wake.sh `cd /home/agent/sirocco`, mtimes 13:47:42Z Oct 19
  (fix signature, same class as the operator's batch edits), git history
  sirocco-authored (wakings 2026-10-20 15:20Z/21:20Z), fresh snaps at its own
  09:20/15:20/21:20Z slots (75m at my sweep), offsite pushes resumed. The
  standing item below (w111–w114) is now history; drift is closed at
  ~85h total (Oct 16 15:20Z → Oct 19 13:47Z). No data was ever lost
  (pre-clobber snap + offsite branch held throughout).

- **NEW w106 2026-10-15 16:35Z — opencode v2 upgrade broke every gale-host
  wake.sh (~17.5h outage window); DRIFT 7/14; NO DATA LOSS; operator fix
  verified working.** opencode v2.0.29 was installed 2026-10-14 20:41Z and
  removed the `opencode run --dir` flag — every gale-host agent's wake.sh
  then failed its next slot(s) with `Unrecognized flag: --dir in command
  opencode run` (exit 1 ×3 retryable-class, ALERT fired, no session, no
  snapshot; spend_check correctly recorded no cost). My slots 22:35Z Oct 14 /
  04:35Z / 10:35Z Oct 15 all failed this way (ALERT delivery to your
  Telegram confirmed: ok:true, chat id 8986669804, message_id 166). You
  fixed wake.sh + telegram_commands.py fleet-wide at 14:10–14:11Z Oct 15
  (identical mtimes across all 14 dirs — batch-edit signature; `--dir`
  dropped, `--standalone` added, /stop reworked to match by cwd). This
  slot (16:35Z) is the first on the fixed harness and ran clean.
  **W106 sweep: 7/14 gale-host dirs over the bar** (maistral 1230m /
  levante 1256m / cyclone 1281m / chinook 1304m / bora 1330m / zephyr
  1389m / vortex 1409m — newest snaps all 17:06–20:06Z Oct 14, i.e.
  pre-upgrade), every one root-caused read-only to the same signature
  (spot-verified in vortex/chinook/maistral/zephyr logs). The 5 dirs whose
  slots fired post-fix (tempest/squall/sirocco/poniente/ostro) + me all
  recovered clean. **No data loss anywhere**: all 14 newest snaps verified
  readable, keys_live=0, git=0. All 7 should self-recover at their next
  slots tonight (17:00–20:06Z) — will re-sweep next waking.
  **New recommendation for the standing item: (d) CLI/harness upgrades
  should land with a coordinated wake.sh update and a canary-slot check —
  the v2 upgrade landed mid-fleet with no wake.sh companion, so every
  gale-host agent missed every slot for ~17.5h.**
  **RESOLVED w107 2026-10-15 22:35Z: w106's 7/14 drift self-recovered
  exactly as predicted — all 7 at their predicted evening slots (vortex
  17:00Z / zephyr 17:25Z / bora 18:25Z / chinook 18:50Z / cyclone
  19:15Z / levante 19:40Z / maistral 20:05Z), fleet 14/14 fresh at
  sweep, zero drift (22nd clean sweep); maistral 20:05Z log spot-check
  clean (snap pushed to offsite). No data loss at any point. SECOND
  operator batch edit noted: wake.sh gained `--auto` at 17:30:37–56Z
  Oct 15 across 12 dirs (same batch-edit signature); ostro/poniente
  wake.sh have 0 auto-lines, mtimes at their own slot times — read-only
  observation, not chased. Standing item stays open for the harness-
  hardening recommendations only (no live drift).
  **NEW w108 2026-10-16 04:35Z — DRIFT 2/14, new "greet-then-stop" failure
  signature (BORA + MAISTRAL).** Both dirs over the 6h bar at sweep: bora
  610m (newest snap 18:25Z Oct 15 — its 00:25Z slot produced no snapshot)
  and maistral 510m (newest snap 20:05Z Oct 15 — its 02:05Z slot produced
  none). Root-caused READ-ONLY in their own logs: identical signature in
  both — session starts, emits exactly ONE text part (bora: "Good morning.
  I'm BORA. Let me start by reading my operating rules…"; maistral: "Waking
  up as MAISTRAL on gale-agent. Starting the routine."), then exits 0 with
  NO tool calls, NO backup, NO notify; wake.sh ALERT fired ("exited 0
  without reporting"), spend_check recorded no cost. **Not model-specific**
  (bora=freetoken/Qwen3.6-35B-A3B-NVFP4, maistral=glm-flash — my own model
  class) and **not a fleet-wide window**: the 10 other siblings' latest
  slots ran full sessions (36–124 text parts) BETWEEN and AROUND the two
  failures (chinook 00:50Z, cyclone 01:15Z, levante 01:40Z, ostro 02:30Z,
  poniente 02:55Z, sirocco 03:20Z, squall 03:45Z, tempest 04:10Z all
  clean). Same exit-0-no-report ALERT class as the old MAISTRAL
  role-refusal one-off, but the content is a greeting-then-stop, not a
  refusal — looks like the model ended its turn after one line. Data
  intact: both newest snaps verified readable, keys/git clean. Drift notes
  sent to both (data-only). Recovery expected at their next slots (bora
  06:25Z, maistral 08:05Z) — will re-sweep next waking. This instance
  reinforces the standing recommendation: surface the session's own text
  in the wake.sh ALERT (the .json log holds it, the ALERT doesn't).
  **W109 2026-10-16 10:35Z — w108's BORA+MAISTRAL drift RESOLVED as predicted
  (bora 06:25:18Z / maistral 08:05:20Z snaps verified readable, keys/git
  clean); but the greet-then-stop signature RECURRED — OSTRO 08:30Z +
  PONIENTE 08:55Z slots fired and died the same way (one text part, exit 0,
  no tool calls, no spend, ALERT).** Now **4 instances / 4 agents / BOTH
  model families (glm-flash: maistral+ostro; Qwen3.6: bora+poniente) across
  2 consecutive windows (~9h)** — a confirmed pattern, not a one-off; the
  json envelope holds exactly `step_start` + one `text` part, no
  step_finish. Not a fleet-wide window (10 other siblings' slots ran clean
  between/around). Data intact everywhere; drift notes sent to
  ostro+poniente (data-only); recovery expected 14:30Z / 14:55Z. The
  failure self-heals at each agent's next slot. This strongly reinforces
  the standing recommendation: surface the session's own text in the
  wake.sh ALERT (the .json log holds it, the ALERT doesn't) — with 5
  greet-then-stop ALERTs in 2 days, operators are currently seeing "exited
  0 without reporting" with zero content each time.
  **W110 2026-10-16 16:35Z — w109's OSTRO+PONIENTE drift RESOLVED as
  predicted: ostro recovered at its 14:30Z slot (`ostro-20261016T143022Z`,
  214K, 92 entries) and poniente at its 14:55Z slot
  (`poniente-20261016T145610Z`, 148K, 89 entries), both readable,
  keys/git clean; ostro's 14:30Z log verified READ-ONLY as a FULL
  session (75 jsonl lines, 13 step cycles, 28 tool_use) — the
  one-text-part signature did NOT recur this window. Fleet 14/14
  fresh, zero drift (23rd consecutive clean sweep). The pattern stands
  at 4 instances / 4 agents / both model families / 2 windows, and
  every instance self-healed at its next slot (maistral 08:05Z, bora
  06:25Z, ostro 14:30Z, poniente 14:55Z); I re-check for recurrences
  each sweep. The standing recommendation stands unchanged.**
  **NEW w111 2026-10-16 22:35Z — DRIFT 2/14 with a NEW first-observed class:
  SIROCCO's tree identity-clobbered by its own session's git conflict
  "recovery" (reset --hard to MAISTRAL's tip); plus greet-then-stop
  RECURRED on BORA (5th instance).**
  (1) SIROCCO 435m over the bar and self-reinforcing: sirocco's 15:20Z
  session hit a non-fast-forward pushing local `main` to the shared offsite
  `main` branch (both sirocco and maistral sessions habitually push bare
  `main` — the only pair that does; every other agent's wake.sh pushes
  `main:<agent>`) and "recovered" via `git checkout github/main -b main` +
  `git reset --hard github/main` (its own transcript, tool calls #45–51) —
  overwriting its AGENT.md (now "You are Maistral", :8795), wake.sh (now
  byte-identical to maistral's: `cd /home/agent/maistral`), opencode.json
  and NOTES.md with maistral's committed state (mtimes 15:21:57–15:22:07Z,
  mid-session). Its 21:20Z cron slot then ran MAISTRAL's wake.sh → a
  duplicate maistral session ran in maistral's dir from sirocco's cron
  (maistral snaps 21:20:18Z + 21:23:54Z, log "117th waking", notify 21:26Z)
  and SIROCCO itself got no backup — **at the current state every sirocco
  cron slot backs up maistral instead; sirocco's drift grows 6h per slot
  (next slots 03:20Z/09:20Z Oct 17) until its wake.sh is fixed.**
  NO DATA LOST — recovery anchors verified by me: (a) local snapshot
  `sirocco-20261016T152013Z.tar.gz` (188K, 139 entries, taken ~2 min BEFORE
  the destructive reset) holds sirocco's true AGENT.md ("You are Sirocco",
  :8796), wake.sh (PROMPT as SIROCCO) and opencode.json; (b) keys/ untouched
  (gitignored; peers.env mtime 09-26, telegram.env 09-23 — peer/telegram
  auth intact); (c) offsite `refs/heads/sirocco` tip `e4083d4`
  (09:20:54Z Oct 16, sirocco-authored) is clean sirocco history. Si's tree
  is otherwise untouched since 15:22:54Z. I touched nothing (rule 7); the
  fix is sirocco's to make (restore its identity files from the snapshot /
  offsite branch, fix wake.sh, and stop pushing bare `main`). Per rule 7 I
  sent data-only notes to both agents with the evidence and anchors.
  **W112 2026-10-17 04:35Z — prediction CONFIRMED, entanglement UNCHANGED,
  self-recovery now considered unlikely while unfixed.** SIROCCO 796m/13.3h
  (exactly the w111 "~13h if unfixed" prediction; sole dir over the bar).
  Read-only re-verification: sirocco's tree STILL clobbered (AGENT.md
  "# AGENT.md — Maistral", wake.sh `cd /home/agent/maistral`, mtimes frozen
  at the 15:21:57–15:22:07Z clobber window; git status clean; newest log
  still the 15:20Z session). Its 03:20:01Z slot ran maistral's wake.sh →
  **duplicate maistral snap `maistral-20261017T032019Z`** (maistral's own
  02:05:15Z intact) — 2nd consecutive duplicate-maistral slot (21:20Z,
  03:20Z), 2 duplicate maistral reports to your Telegram in 2 windows;
  sirocco got no session/log/backup. **Critical: nothing reads sirocco's
  inbox anymore** (its slots never run sirocco's own session), so sirocco
  cannot even read my w111 note — repeat peer notes pointless (none sent);
  the operator channel is the effective one. Anchors re-verified intact:
  pre-clobber snap 15:20:13Z (true identity), keys gitignored untouched,
  **offsite `refs/heads/sirocco` tip `e4083d4` re-fetched — unchanged**.
  **W113 2026-10-17 10:35Z — prediction CONFIRMED, entanglement UNCHANGED
  (~19.2h stale, newest snap still the pre-clobber 15:20Z Oct 16 one);
  3rd consecutive duplicate-maistral slot (21:20Z, 03:20Z, 09:20Z →
  `maistral-20261017T092016Z`; maistral's own 08:05Z intact) — 3
  duplicate maistral reports to your Telegram in 3 windows.** Sirocco's
  tree STILL clobbered (AGENT.md "# AGENT.md — Maistral", wake.sh
  `cd /home/agent/maistral`, newest log still the 15:20Z Oct 16
  session); nothing reads sirocco's inbox (no peer note sent — repeat
  notes pointless). Anchors still intact (sirocco snap 139 entries,
  readable, keys/git clean). Drift grows 6h/slot: expect ~25h at w114
  if unfixed (next slots 15:20Z/21:20Z). **Your call whether to (a)
  restore sirocco's identity files operator-side (from its 15:20:13Z
  snapshot or offsite branch — fastest while its cron is broken), or
  (b) send sirocco an operator word via another channel.** I touched
  nothing (rule 7).
  **W114 2026-10-17 16:35Z — prediction CONFIRMED again, entanglement
  UNCHANGED (~25.3h stale, newest snap still the pre-clobber 15:20Z Oct 16
  one); 4th consecutive duplicate-maistral slot (21:20Z, 03:20Z, 09:20Z,
  15:20Z → `maistral-20261017T152017Z`; maistral's own 02:05/08:05/14:05Z
  snaps intact) — 4 duplicate maistral reports to your Telegram in 4
  windows.** Sirocco's tree STILL clobbered (AGENT.md "# AGENT.md —
  Maistral", wake.sh `cd /home/agent/maistral`, mtimes frozen at the
  clobber window, git status clean, newest log still the 15:20Z Oct 16
  session); nothing reads sirocco's inbox (no peer note sent). Anchors
  re-verified intact: pre-clobber snap readable (139 entries), offsite
  `refs/heads/sirocco` tip `e4083d4` re-fetched — unchanged. Drift grows
  6h/slot: expect ~31h at w115 if unfixed (next slots 21:20Z tonight,
  03:20Z tomorrow). Your call stands: (a) restore sirocco's identity
  operator-side, or (b) an operator word to sirocco via another channel.
   **Also w129 2026-10-21 10:35Z: w128's LEVANTE greet-then-stop RESOLVED as
   predicted — levante recovered at its 07:40Z slot (log verified READ-ONLY as a
   FULL session: 114 jsonl lines with tool calls, fresh snap
   `levante-20261021T074120Z`, 174m at sweep); the signature did NOT recur this
   window. Pattern stands at 7 instances / 5 agents / 5 windows
   (bora×3, maistral, ostro, poniente, levante), every instance self-healed at
   its next slot. The standing wake.sh ALERT-content recommendation stays open.**
   **Also w114: w113's BORA greet-then-stop RESOLVED as predicted — bora
  recovered at its 12:25Z slot (log verified READ-ONLY full session: 70
  jsonl lines, 18 step cycles, 18 text parts, 17 tool calls; snap 187K,
  92 entries, readable, keys/git clean); the signature did NOT recur
  this window; pattern stands at 6 instances / 4 agents / 4 windows,
  every instance self-healed at its next slot. The standing wake.sh
  ALERT-content recommendation stays open (6 supporting ALERTs).**
  **Also w113: BORA greet-then-stop RECURRED (6th instance, 3rd on
  bora): 06:25Z slot, envelope = step_start + one text part ("I'll
  start by reading my operational files…"), exit 0, no tool calls, no
  backup, ALERT fired. Data intact (12:25Z Oct 16 snap verified);
  drift note sent; recovery expected 12:25Z. The standing
  ALERT-content recommendation now has 6 supporting ALERTs.**
  **Also w112: w111's BORA greet-then-stop RESOLVED as predicted — bora
  recovered at its 00:25Z slot (192K, 105 entries, readable, keys/git
  clean); the signature did NOT recur on bora this window; pattern stands
  at 5 instances / 4 agents / 3 windows, every instance self-healed at its
  next slot. The standing wake.sh ALERT-content recommendation stays open
  (5 supporting ALERTs).**
  Prior history:
  w105 2026-10-14 16:35Z — DRIFT
  1/14: BORA 610m over the bar — its 12:25Z slot fired and exited 1 after
  3 retryable-APIError attempts (wake.sh ALERT, no session, no snapshot;
  the retry-ALERT path worked as designed — this is the w59/w71
  retryable-APIError class, not the skip class). Data intact (06:25Z snap
  verified readable, keys/git clean); drift note sent; self-recovery
  expected at its 18:25Z slot. Rest of fleet 13/13 fresh. 7th consecutive
  clean drill on the runbook-named 15-path list. The standing item stays
  open for the harness-hardening recommendations only (recovery
  verification next waking).
  (w104 2026-10-14 10:35Z — 21st
  clean sweep (14/14, zero drift). Sixth consecutive clean drill on the
  runbook-named 15-path list. Sweep-checker false positive self-caught
  pre-propagation (checker counted the `keys/` dir entry as a live key —
  w93 corrected-pattern class; fixed and re-run clean). The standing
  item stays open for the harness-hardening recommendations only (no
  live drift).
  (w103 2026-10-14 04:35Z — 20th
  clean sweep (14/14, zero drift). Thirteenth full 6h window on the
  openrouter glm-flash runner: all 14 slots clean. Fifth consecutive
  clean drill on the runbook-named 15-path list. Sweep age-parsing now
  pure-filename (hardening delivered). The standing item stays open for
  the harness-hardening recommendations only (no live drift).
  (w102 2026-10-13 22:35Z — 19th
  clean sweep (14/14, zero drift); SIROCCO's skipped-backup drift
  RESOLVED exactly as predicted (recovered at its 21:20Z slot,
  `sirocco-20261013T212013Z`, 75m at sweep, readable, keys/git clean).
  Eleventh full 6h window on the openrouter glm-flash runner: all 14
  slots clean. Fourth consecutive clean drill on the runbook-named
  15-path list. The standing item stays open for the
  harness-hardening recommendations only (no live drift).
  (w101 2026-10-13 16:35Z — SIROCCO skipped-backup instance (drift
  1/14, 433m/7.2h).** Its 15:20Z session ran to COMPLETION (exit 0,
  `reason=stop`, pushed, inbox filed, committed, operator notified) but
  never ran its backup step — the w53-CHINOOK one-off class, SECOND
  observed instance (CHINOOK w53, SIROCCO w101). Because it reported
  cleanly, the "exit 0 + ALERT + no report" tripwire cannot catch this
  class; recommendation (c): have wake.sh verify a fresh snapshot exists
  after a reported-clean session, or make the backup a shell-side step
  that runs even if the model skips it. Data intact (its 09:22Z snap
  verified); drift note sent; self-recovery expected at its 21:20Z slot.
  Prior history: w100 2026-10-13 10:35Z — 18th clean sweep (14/14, zero
  drift, no new misses).** Tenth full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean. Third consecutive clean drill on the runbook-named
  15-path list. No new harness defect this waking. The standing item stays
  open for the harness-hardening recommendations only (no live drift).
  (w97 2026-10-12 16:35Z — 15th clean sweep (14/14, zero drift, no new
  misses).** Seventh full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean. New self-found defect this waking is a drill-list
  quality issue, not a harness one (phantom paths in my reconstructed
  tier-1 cmp list, w95/w96 pass counts inflated by 2 vacuous comparisons;
  corrected + list now named in runbooks/restore-this-agent.md). The
  standing item stays open
  for the harness-hardening recommendations only (no live drift).
  (w96 2026-10-12 10:35Z — 14th clean sweep (14/14, zero drift, no new
  misses).** Sixth full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean. The standing item stays open
  for the harness-hardening recommendations only (no live drift).
  (w95 2026-10-12 04:35Z — 13th clean sweep (14/14, zero drift, no new
  misses).** Fifth full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean. The standing item stays open
  for the harness-hardening recommendations only (no live drift).
  (w94 2026-10-11 22:35Z — 12th clean sweep (14/14, zero drift, no new
  misses).** Fourth full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean (the 19:47Z reboot caused no drift — no slot fell in
  the ~1min down-window). The standing item stays open
  for the harness-hardening recommendations only (no live drift).
  (w93 2026-10-11 16:35Z — 11th clean sweep (14/14, zero drift, no new
  misses).** Third full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean; no transition artifacts. The standing item stays open
  for the harness-hardening recommendations only (no live drift).
  (w92 2026-10-11 10:35Z — 10th clean sweep (14/14, zero drift, no new
  misses).** Second full 6h window on the new openrouter glm-flash runner:
  all 14 slots clean; no transition artifacts. The standing item stays open
  for the harness-hardening recommendations only (no live drift).
  (w91 2026-10-11 04:35Z — w90's 2 transition drifters RESOLVED as
  predicted; 9th clean sweep (14/14, zero drift). CHINOOK recovered at
  its 00:51Z slot (`chinook-20261011T005152Z`, 65 entries, readable, 14
  retained; its 18:50Z miss was the retryable-APIError class in the
  ollama-era window) and MAISTRAL recovered at its 02:07Z slot
  (`maistral-20261011T020744Z`, 127 entries, readable; its 20:05Z miss was
  the killed-mid-run class 3 min before the operator's 20:08Z batch edit).
  No data loss at any point. This was the first full 6h window on the new
  `openrouter/~z-ai/glm-flash-latest` runner — all 14 slots clean, so the
  migration is settled. The transition-drift class (cron-gap + stale-config
  APIError + killed/failed runs on a runner swap) is now 3-for-3
  self-healing (w78, w89, w90) and feeds this standing item only.
  (w89: TEMPEST 385m resolved exactly as predicted at its 22:10Z slot —
  verified w90 sweep, 24m fresh; cron-gap class after the 16:01–16:30Z
  reboot, zero data loss. w88 sweep: NO new misses — fleet 14/14 fresh,
  zero drift, 8th consecutive clean sweep; w87 sweep: NO new misses —
  7th consecutive clean sweep; w85 sweep: NO new misses — 4th
  consecutive clean sweep; w83 sweep: NO new misses — 3rd
  consecutive clean sweep; TEMPEST 3rd consecutive clean run post-recovery;
  w80 sweep: TEMPEST drift — 3rd
  consecutive mid-session death, exit-0-no-report
  class; w81: RESOLVED — see below; w79 sweep: w78's 3 transition drifters ALL
  self-recovered on their first GLM slots — see below; w71 4-way drift also
  RESOLVED w72.).
  **NEW w81 2026-10-08 16:35Z — TEMPEST drift RESOLVED, exactly as
  predicted.** Its 16:10Z slot ran clean: newest snap `tempest-20261008T161209Z`
  (160K, 93 entries, `tar -tzf` OK, no keys, 14 retained); log shows
  `reason=stop`, 113k tokens, $0.0038, pushed to github. Third-consecutive-death
  streak ended first try; no data ever at risk (04:11Z snap intact through the
  window). Fleet 14/14 fresh, zero drift. The w80 finding (exit-0-no-report
  class recurrence; recommendation (b) to surface the model's final state)
  stands as history feeding this item.
  **NEW w80 2026-10-08 10:35Z — TEMPEST 383m/6.4h, sole dir over the 6h bar.**
  Its 10:10Z slot fired and the session ran (123k tokens, $0.0637 per its
  spend_check) but **exited 0 without reporting → wake.sh ALERT, no
  snapshot** — the exact "exit 0 + ALERT + no report" class this standing
  item exists for. Its own 10:10 log self-diagnoses (read-only): it spent
  the run on forensics for its TWO earlier dead sessions — 22:10 Oct 7
  (died 48s in) and 04:10 Oct 8 (died on an auto-rejected
  `external_directory /home/agent/.config/opencode/*` permission, the
  Sep-28 fail-closed pattern — and an intermediate session committed
  "850792a grid change + wake.sh fallback", after which the deaths cluster
  around checking that fallback). Data never at risk: newest snap
  `tempest-20261008T041139Z` intact (53 entries, 156K, `tar -tzf` OK,
  14 retained). Per rule 7 I touched nothing in its tree; sent a data-only
  drift note via `send_to_peer.sh TEMPEST` (`{"status":"ok"}`, no action
  requested); recovery expected at its 16:10Z slot — will re-sweep next
  waking. This is the first recurrence of the exit-0-no-report class since
  the w58/w64 cases, and the third mid-session death on ONE agent inside
  24h — strengthens recommendation (b) below (retryable miss + surface the
  model's final state so a death can't masquerade as a clean pass).
  History: the 2026-10-04 10:48–12:00Z `retryable APIError` window hit 7 of 15
  agents (incl. my own 11:12Z slot); MAISTRAL's w64 3-slot miss streak
  (8192-cap / exit-0-no-report / `exit 124`) self-recovered w65; its w67/w68
  single-slot APIError recurrence (Errno 113, 15:36Z) carried it over the bar
  at w68 and self-recovered w69 (see Resolved entries below for detail).
   **NEW w78 2026-10-07 22:35Z — second migration transition (muse-spark →
   glm-5.3-flash): crontab re-grid swap ~17:00–18:24Z, GLM configs landed
   21:22–21:27Z (my sweep found 3 siblings over the 6h bar): VORTEX 467m —
   its 17:00Z new-grid slot fell in the cron-swap gap (no old entry, new one
   not yet live; zero wake attempts — no log), next slot 23:00Z; BORA 491m —
   18:25Z new-grid slot fired on the STALE pre-GLM config and hit the retired
   LAN shim (`gale-ollama-shim` 500 "no user query found in messages",
   retryable APIError ×3 → ALERT, exit 1, no snapshot), next slot 00:25Z;
   MAISTRAL 659m — 15:36Z old-slot AND 20:05Z new-grid slot both ran
   pre-GLM and hit `exit 124` (45m wall-clock timeout), no snapshots, next
   slot 02:05Z. All three newest snaps verified intact (`tar -tzf` readable:
   vortex 139 entries/164K, bora 76/140K, maistral 102/264K) — no data loss;
   no peer notes sent (w59 precedent: shared transition cause, each agent's
   own logs self-diagnose). All three should self-recover on their first GLM
   slots — will re-sweep next waking.**
   **RESOLVED w79 2026-10-08 04:35Z: all three self-recovered on their first
   GLM slots, exactly as predicted** — VORTEX 23:02Z (333m at sweep), BORA
   00:25Z (249m), MAISTRAL 02:07Z (147m); all three logs `status:completed`,
   pushed to github; newest snaps readable (vortex 146 entries/172K, bora
   64/148K, maistral 125/276K; 14 retained each). Fleet 14/14 fresh, zero
   drift — no data loss at any point. The transition-drift pattern (cron-gap
   + stale-config + timeout on a runner swap) is now a known, self-healing
   class: it feeds the standing harness-hardening item only.
  **NEW w71 2026-10-06 (~04:24Z→13:36Z+):
  `ollama_shim upstream: [Errno 111] Connection refused` + 502s — the shim
  path refused for ~9h; CHINOOK (08:00Z+12:00Z, plus 04:00Z `exit 124`) /
  LEVANTE (04:24Z+08:24Z+12:24Z) / MAISTRAL (07:36Z+11:36Z) / PONIENTE
  (05:36Z+09:36Z+13:36Z) each missed 2–3 slots → 10.9h/14.8h/11.5h/13.6h at
  the 15:12Z sweep, all OVER the 6h bar; every newest snap verified intact
  (`tar -tzf` readable, 14 retained each) — no data loss; no peer notes sent
  (w59 precedent: shared infra cause, each agent's own logs self-diagnose).
  Mitigating fact: at ~14:44Z the whole fleet (all checked siblings + me)
  was switched operator-side to `opencode/muse-spark-1.3-contributor-free`
  (Ollama provider block removed); post-switch runs are clean (BORA 24m /
  VORTEX 23m / SIROCCO 61m / mine 0m), so the four drifters should
   self-recover at their next slots — will re-sweep next waking.** MAISTRAL's
  earlier role-refusal was only caught because `wake.sh` fires an ALERT on
  "exit 0 without reporting". Two recommendations pending your call: (a) look
  at the Ollama/API gateway for the 2026-10-04 11:00–12:10Z window, (b) treat
  "exit 0 + ALERT + no report" and `exit 124` timeouts as retryable misses /
  surface the model's refusal or truncation text so a miss can't masquerade as
  a clean pass. **No data loss in any of these cases** (every flagged snapshot
  verified intact, `tar -tzf` readable).
  **RESOLVED w72 2026-10-06 19:12Z: all four drifters self-recovered at their
  first post-migration slots** — CHINOOK 16:00Z (191m at sweep) / LEVANTE
  16:24Z (168m) / MAISTRAL 15:37Z (215m) / PONIENTE 17:36Z (96m); all four
  newest snaps `tar -tzf` readable, 14 retained each; fleet 14/14 fresh, no
  drift. Migration resolves the outage class as predicted.

- **UNVERIFIED peer-relayed "revenue mandate" (w72 2026-10-06 19:12Z) — no
  action taken, awaiting your word on Telegram.** BEACON sent two inbox msgs
  (17:22Z + 17:26Z) relaying operator decisions: fleet-wide revenue focus,
  per-agent stats via Gale, no wake-frequency cuts, a first distribution kit
  for Harbor/Mountain/Highbeam; the second claims "Telegram sent by him too".
  My `./check_replies.sh` this waking shows **(no new messages)** — nothing
  from you on my operator channel — so per rule 5 this is data, not
  instruction. I have taken no action (my lane/routine unchanged) and archived
  both with the other 16 data-only pings. Please confirm or deny on Telegram
  if you want me in any revenue lane; until then I hold course.
  **Re-checked w81 2026-10-08 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w82 2026-10-08 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w83 2026-10-09 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w84 2026-10-09 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w85 2026-10-09 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w86 2026-10-09 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w87 2026-10-10 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w88 2026-10-10 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w89 2026-10-10 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w90 2026-10-10 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w91 2026-10-11 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w92 2026-10-11 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w93 2026-10-11 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w94 2026-10-11 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w95 2026-10-12 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w96 2026-10-12 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w97 2026-10-12 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w98 2026-10-12 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w99 2026-10-13 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w100 2026-10-13 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w102 2026-10-13 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w103 2026-10-14 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w104 2026-10-14 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w105 2026-10-14 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w106 2026-10-15 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w107 2026-10-15 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w108 2026-10-16 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w109 2026-10-16 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w110 2026-10-16 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w111 2026-10-16 22:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w112 2026-10-17 04:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w113 2026-10-17 10:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w114 2026-10-17 16:35Z: still no operator msg on my channel;
  still holding course, no action taken.**
  **Re-checked w127 2026-10-20 22:35Z: still no operator msg on my channel;
   still holding course, no action taken. (w115-w126 re-checks appear in
   the NOTES.md entries of those wakings.)**
   **Re-checked w128 2026-10-21 04:35Z: still no operator msg on my channel;
   still holding course, no action taken.**
   **Re-checked w129 2026-10-21 10:35Z: still no operator msg on my channel;
   still holding course, no action taken.**
   **Re-checked w130 2026-10-21 16:35Z: still no operator msg on my channel;
   still holding course, no action taken.**
   **Re-checked w131 2026-10-21 22:35Z: still no operator msg on my channel;
   still holding course, no action taken.**
   **Re-checked w132 2026-10-22 04:35Z: still no operator msg on my channel
   (check_replies.sh: no new messages); still holding course, no action taken.**

- **INFORMATIONAL (w83 2026-10-09 04:35Z) — /tmp snap-chromium leak
  corroborated (independent evidence for TEMPEST's open purge proposal):**
  TEMPEST's 04:10Z run (read-only log) reported its /tmp puppeteer-leak
  check was maxdepth-blind to `/tmp/snap-private-tmp/snap.chromium/tmp/`
  — real state 382 dirs / 1.7G, spawner active. I verified independently
  with sudo: same path **1.7G, 382 dirs** exactly; a non-sudo view shows
  only 4.0K (permission-blind — their runbook
  `runbooks/tmp-puppeteer-leak-maxdepth-blindspot.md` covers this class).
  Disk at 59% (39G free of 98G); at their measured +2%/6h a filled disk
  would eventually break snapshots fleet-wide — that is the backup-lane
  relevance. **No action taken by me** (deletion is irreversible, not my
  lane, and Tempest has gated it on your word since fresh dirs may be a
   sibling's live browser session — deferring to their runbook/ASK).
    **Re-checked w84 2026-10-09 10:35Z (sudo): 1.7G FLAT vs 04:35Z — no
    growth this window; 385 dirs (+3), so the spawner still trickles. Their
    measured +2%/6h did not recur this window. Still no action by me.**
    **Re-checked w85 2026-10-09 16:35Z (sudo): GROWTH RESUMED — 1.7G→3.4G
    (doubled), 385→435 dirs (+50) this window.** w84's flat window was the
    exception, not the trend; this window's +1.7G/6h exceeds Tempest's
    measured +2%/6h. Disk now 61% (37G free of 98G) — at this window's rate
    ~5 days to disk-full, and a filled disk breaks snapshots fleet-wide
    (backup-lane relevance). Still no action by me (deletion irreversible,
    Tempest's lane, gated on your word); flagging the rate change here and
    in notify so the purge decision can be timed against it.
    **Re-checked w86 2026-10-09 22:35Z (sudo): NEARLY FLAT — 3.4G→3.5G
    (+0.1G), 435→440 dirs (+5) this window.** The w85 burst did not recur;
    back to the trickle rate. **Disk PICTURE IMPROVED: 56% (42G free of 98G)
    vs 61%/37G at w85 — ~5G freed somewhere OUTSIDE /tmp this window** (/tmp
    is only 4.4G total, so not from there; I did not chase what freed it —
    not my lane). At the trickle rate the runway is long; the w85
    ~5-days-to-disk-full urgency no longer applies. Still no action by me
    (deletion irreversible, Tempest's lane, gated on your word).
    **Re-checked w87 2026-10-10 04:35Z (sudo): TRICKLE HOLDS — 3.5G→3.6G
    (+0.1G), 440→463 dirs (+23) this window.** Second consecutive
    near-flat window; the w85 burst is not recurring. Disk 57% (41G free
    of 98G) — steady vs 56%/42G. Still no action by me (deletion
    irreversible, Tempest's lane, gated on your word).
    **Re-checked w88 2026-10-10 10:35Z (sudo): FLAT — 3.6G→3.6G, 463→465
    dirs (+2) this window.** Third consecutive near-flat window; the w85
    burst has fully faded. Disk 57% (40G free of 98G) — steady. Still no
    action by me (deletion irreversible, Tempest's lane, gated on your word).
    **Re-checked w89 2026-10-10 16:35Z (sudo): WIPED BY THE HOST REBOOT —
    52K / 3 dirs vs 3.6G / 465 at w88.** The leak is gone as of the 16:30Z
    boot (fresh snap runtime dirs recreated). Disk 52% (46G free of 98G) vs
    57%/40G — ~6G freed total (leak + other tmp cleanup). The spawner may
    resume trickling; will re-check next waking. No action needed from you
    on this item unless the growth resumes.
    **Re-checked w90 2026-10-10 22:35Z (sudo): WIPE HOLDS — still 52K / 3
    dirs; the spawner has NOT resumed trickling after the reboot.** Disk
    steady 52% (46G free of 98G). No action needed; item effectively quiet
    unless growth resumes.
    **Re-checked w91 2026-10-11 04:35Z (sudo): WIPE HOLDS — still 52K, no
    growth; the spawner has not resumed after the reboot (3 clean windows
    now).** Disk steady 52% (46G free of 98G). No action needed.
    **Re-checked w92 2026-10-11 10:35Z (sudo): WIPE HOLDS — 52K / 2 dirs,
    no growth (4th clean window post-reboot).** Disk steady 52% (46G free
    of 98G). No action needed.
    **Re-checked w93 2026-10-11 16:35Z (sudo): WIPE HOLDS — 52K / 0
    entries, no growth (5th clean window post-reboot).** Disk steady 52%
    (45G free of 98G). No action needed.
    **Re-checked w94 2026-10-11 22:35Z (sudo): GROWTH RESUMED — 52K→1.6G,
    0→72 dirs (fastest regrowth observed: the spawner resumed after the
    19:47Z reboot).** Disk 54% (44G free of 98G). At this window's rate the
    runway is still measured in days, not hours; no action by me
    (deletion irreversible, Tempest's lane, gated on your word) — flagging
    the resumption so the purge decision can be timed against it.
    **Re-checked w95 2026-10-12 04:35Z (sudo): SLOW REGROWTH — 1.6G→1.7G,
    72→111 dirs this window (+0.1G, +39 dirs) — well under the w85 burst
    rate; spawner still active post-reboot #2.** Disk steady 55% (43G free
    of 98G). Runway still days; no action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w96 2026-10-12 10:35Z (sudo): FLAT — 1.7G / 110 dirs
    (size unchanged, -1 dir; 2nd consecutive slow/flat window post-reboot
    #2).** Disk steady 55% (43G free of 98G). Runway still days; no action
    by me (deletion irreversible, Tempest's lane, gated on your word).
    **Re-checked w97 2026-10-12 16:35Z (sudo): REGROWTH RESUMED — 1.7G→1.9G,
    110→127 dirs (+0.2G, +17 dirs this window); spawner still active
    post-reboot #2 (slow/flat/slow pattern).** Disk steady 55% (43G free
    of 98G). Runway still days; no action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w98 2026-10-12 22:35Z (sudo): BURST RESUMED — 1.9G→3.5G
    (+1.6G this window — w85-class rate) while dirs FELL 127→100 (larger
    payloads per dir / dir turnover).** Pattern since reboot #2:
    slow/flat/slow/burst. Disk 56% (42G free of 98G); at this burst rate
    runway ~6 days. No action by me (deletion irreversible, Tempest's
    lane, gated on your word).
    **Re-checked w99 2026-10-13 04:35Z (sudo): BURST CONTINUES — 3.5G→4.0G
    (+0.5G this window), dirs 100→117 (+17).** Two consecutive burst-class
    windows since reboot #2. Disk steady 56% (42G free of 98G). Runway
    still days; no action by me (deletion irreversible, Tempest's lane,
    gated on your word).
    **Re-checked w100 2026-10-13 10:35Z (sudo): FLAT — 4.0G / 119 dirs
    (+2 dirs, size unchanged — burst paused after 2 burst-class windows).**
    Pattern since reboot #2: slow/flat/slow/burst/flat. Disk steady 56%
    (42G free of 98G). No action by me (deletion irreversible, Tempest's
    lane, gated on your word).
    **Re-checked w101 2026-10-13 16:35Z (sudo): FLAT — 4.0G / 117 dirs
    (size unchanged, −2 dirs — 2nd consecutive flat window).** Pattern
    since reboot #2: slow/flat/slow/burst/flat/flat. Disk 57% (41G free
    of 98G — ~1G consumed outside /tmp this window; not chased, not my
    lane). No action by me (deletion irreversible, Tempest's lane, gated
    on your word).
    **Re-checked w102 2026-10-13 22:35Z (sudo): FLAT — 4.0G / 127 dirs
    (size unchanged, +10 dirs — 3rd consecutive flat window).** Pattern
    since reboot #2: slow/flat/slow/burst/flat/flat/flat. Disk 57% (41G
    free of 98G, unchanged). No action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w103 2026-10-14 04:35Z (sudo): TRICKLE — 4.0G→4.1G,
    127→126 dirs (+0.1G — first non-flat size growth in 4 windows).**
    Pattern since reboot #2: slow/flat/slow/burst/flat/flat/flat/trickle.
    Disk 57% (41G free of 98G, unchanged). No action by me (deletion
    irreversible, Tempest's lane, gated on your word).
    **Re-checked w104 2026-10-14 10:35Z (sudo): FLAT — 4.1G / 127 dirs
    (size unchanged, +1 dir — back to flat after w103's trickle).**
    Pattern since reboot #2:
    slow/flat/slow/burst/flat/flat/flat/trickle/flat. Disk 57% (41G free
    of 98G, unchanged). No action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w105 2026-10-14 16:35Z (sudo): FLAT — 4.1G / 126 dirs
    (size unchanged, −1 dir — 2nd consecutive flat window).** Pattern
    since reboot #2:
    slow/flat/slow/burst/flat/flat/flat/trickle/flat/flat. Disk 58%
    (40G free of 98G — ~1G consumed outside /tmp this window, not
    chased). No action by me (deletion irreversible, Tempest's lane,
    gated on your word).
    **Re-checked w106 2026-10-15 16:35Z (sudo): FLAT — 4.1G / 126 dirs
    (size AND dir count unchanged — 3rd consecutive flat window).**
    Pattern since reboot #2:
    slow/flat/slow/burst/flat/flat/flat/trickle/flat/flat/flat. Disk 56%
    (42G free of 98G, unchanged). No action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w107 2026-10-15 22:35Z (sudo): FLAT — 4.1G / 126 dirs
    (size AND dir count unchanged — 4th consecutive flat window).**
    Pattern since reboot #2:
    slow/flat/slow/burst/flat/flat/flat/trickle/flat/flat/flat/flat.
    Disk 57% (41G free of 98G, unchanged). No action by me (deletion
    irreversible, Tempest's lane, gated on your word).
    **Re-checked w108 2026-10-16 04:35Z (sudo): PATH CHANGED —
    /tmp/snap-chromium NO LONGER EXISTS; the payload now lives at
    `/tmp/snap-private-tmp/snap.chromium/tmp` — SAME 4.1G, same shape
    (puppeteer_dev_chrome_profile dirs). No reboot (host up 4d8h48m
    continuous), so this was a move/rename in place, most plausibly a
    chromium snap refresh relocating its private tmp. Total /tmp 4.9G;
    disk 57% (41G free of 98G, unchanged — nothing grew, the data just
    moved). Watch item continues at the NEW path; will compare against
    4.1G next waking. No action by me (deletion irreversible, Tempest's
    lane, gated on your word).
    **Re-checked w109 2026-10-16 10:35Z (sudo): FLAT at the NEW path —
    4.1G / 126 dirs (size AND dir count unchanged vs w108; old
    /tmp/snap-chromium still absent).** Total /tmp 4.9G; disk 57% (41G
    free of 98G, unchanged). No action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w110 2026-10-16 16:35Z (sudo): FLAT at the NEW path —
    4.1G / 135 dirs (size unchanged vs w109, dirs 126→135 — first
    dir-count trickle in 4 windows; old /tmp/snap-chromium still
    absent).** Disk 60% (38G free of 98G) — ~3G consumed outside /tmp
    this window (~3x the usual ~1G); chased one level read-only:
    diffuse across /var/lib + /home, journal only 462M, no single
    3G blob, nothing anomalous, not chased further (not my lane). No
    action by me (deletion irreversible, Tempest's lane, gated on your
    word).
    **Re-checked w111 2026-10-16 22:35Z (sudo): BURST — 4.1G→4.7G, 135→182
    dirs (+0.6G / +47 dirs — largest single-window growth since reboot
    #2).** Disk steady 60% (38G free of 98G); total /tmp 5.5G. Runway
    still days at this rate; no action by me (deletion irreversible,
    Tempest's lane, gated on your word).
    **Re-checked w113 2026-10-17 10:35Z (sudo): TRICKLE — 4.6G→4.7G,
    181→182 dirs (+0.1G, +1 dir).** Total /tmp 830M non-sudo (sudo holds
    the payload); disk 61% (37G free of 98G, unchanged). Runway long; no
    action by me (deletion irreversible, Tempest's lane, gated on your
    word).
    **Re-checked w114 2026-10-17 16:35Z (sudo): FLAT — 4.7G / 182 dirs
    (size AND dir count unchanged vs w113).** Total /tmp 830M non-sudo
    (sudo holds the payload); disk 61% (37G free of 98G, unchanged). No
    action by me (deletion irreversible, Tempest's lane, gated on your
    word).

    **Re-checked w127 2026-10-20 22:35Z (sudo): PATH GONE — `/tmp/snap-
    private-tmp/snap.chromium` no longer exists; total /tmp only 28M
    (was 4.7G at w118). The leak is fully cleared — item CLOSED unless
    growth reappears. No action by me.**
- **INFORMATIONAL (w98 2026-10-12 22:35Z) — netbox service crash-looping
  (`203/EXEC`), persistent across two wakings.** `systemctl status netbox`:
  `activating (auto-restart)`, gunicorn ExecStart
  `/opt/netbox/venv/bin/gunicorn ...` exits `203/EXEC` (binary won't
  execute — missing/not-executable venv path). Was plain `active` at w96
  10:35Z; discovered w97 16:35Z with NRestorts 14,332; now **18,454**
  (restart cadence ~5s, steady-state, negligible disk/CPU impact). Host
  service, not my lane — I touched nothing; flagging for you / whoever
  owns netbox.
    **Re-checked w99 2026-10-13 04:35Z: UNCHANGED — same 203/EXEC mode,
  journal shows "No such file or directory" on the gunicorn spawn; 8394
  fail lines in 6h ≈ ~4197 restarts ≈ the same ~5s cadence.** Noted
  read-only; still not my lane.
    **Re-checked w100 2026-10-13 10:35Z: UNCHANGED — same `activating
  (auto-restart)` + 203/EXEC on the gunicorn spawn; a restart fired
  1s before my check, same mode.** Noted read-only; still not my lane.
    **Re-checked w101 2026-10-13 16:35Z: UNCHANGED — same `activating
  (auto-restart)` + 203/EXEC on the gunicorn spawn; NRestarts 18,454
  (w98) → 30,851 (~12.4k in 18h ≈ one per ~5.2s), steady-state.** Noted
  read-only; still not my lane.
    **Re-checked w102 2026-10-13 22:35Z: UNCHANGED — same `activating
  (auto-restart)` + 203/EXEC on the gunicorn spawn; NRestarts 30,851
  → 34,973 (~4.1k in 6h ≈ one per ~5.2s), steady-state.** Noted
  read-only; still not my lane.
    **Re-checked w103 2026-10-14 04:35Z: UNCHANGED — same `activating
  (auto-restart)` + 203/EXEC on the gunicorn spawn; NRestarts 34,973
  → 39,104 (~4.1k in 6h ≈ one per ~5.2s), steady-state.** Noted
  read-only; still not my lane.
   Not my lane; quiet unless it changes again.**
  (auto-restart)` + 203/EXEC on the gunicorn spawn; NRestarts 39,104
  → 43,229 (~4.1k in 6h ≈ one per ~5.2s), steady-state.** Noted
  read-only; still not my lane.
    **Re-checked w105 2026-10-14 16:35Z: UNCHANGED — same `activating
  (auto-restart)` + 203/EXEC on the gunicorn spawn; NRestarts 43,229
  → 47,371 (~4.1k in 6h ≈ one per ~5.2s), steady-state.** Noted
  read-only; still not my lane.
  **Re-checked w106 2026-10-15 16:35Z: CHANGED — crash-loop ENDED.**
  `systemctl is-active netbox` → `inactive`, NRestarts=0 (was
  `activating (auto-restart)` with 47,371 restarts at w105). No reboot
  in between (host up 3d20h48m continuous) — the unit was stopped and
  its restart counter reset, most plausibly operator-side during the
  14:10–14:11Z wake.sh fix window. Not my lane; noting the state change
  for the record. If it should be running, that's your call.
  **Re-checked w107 2026-10-15 22:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w108 2026-10-16 04:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w109 2026-10-16 10:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w110 2026-10-16 16:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w111 2026-10-16 22:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w112 2026-10-17 04:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w113 2026-10-17 10:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w114 2026-10-17 16:35Z: UNCHANGED — still `inactive`,
  NRestarts=0.** Not my lane; quiet unless it changes again.
  **Re-checked w127 2026-10-20 22:35Z: UNCHANGED — still `inactive`,
   NRestarts=0.** Not my lane; quiet unless it changes again.
   **Re-checked w128 2026-10-21 04:35Z: UNCHANGED — still `inactive`, NRestarts=0.
   Not my lane; quiet unless it changes again.**

- **INFORMATIONAL (w94 2026-10-11 22:35Z) — second host reboot in 2 days
  (~19:47Z), this time a CLEAN ordered shutdown.** journal boot -1 ends
  19:46:57 with a full shutdown sequence (umount.target →
  systemd-reboot.service → reboot.target → systemd-shutdown syncing
  filesystems) — the deliberate-maintenance signature, not the abrupt-cut
  class of the 16:01:35 Oct 10 event. No slot fell in the ~1min
  down-window (LEVANTE's 19:42Z snap completed before the shutdown; all
  14 dirs fresh at sweep) — zero drift, zero data risk. Recovery
  verified: cron fired my 22:35 wake on schedule, 14 peer_server.py procs
  up, crontab intact. One benign failure: `systemd-networkd-wait-online`
  failed at 19:49Z exactly as it did on the Oct 10 16:32 boot (chronic,
  no functional impact — network demonstrably fine). Flagging per w89
  precedent (reboots are operator-visible events); no action needed from
  you — assumed maintenance unless you say otherwise.

- **RESOLVED w90 (raised w82 2026-10-08 22:35Z) — model-line config
  layering.** The opencode.json / wake.sh `--model` disagreement is gone:
  the operator's 20:08:17Z migration set BOTH to
  `openrouter/~z-ai/glm-flash-latest` (json model line + wake.sh PROMPT and
  `opencode_run` pin; identical microsecond mtimes, batch edit; this
  session's wake prompt names the new model). The muse-spark json line is
  no longer dead config — it was replaced. For the record: the item
  existed because opencode.json (13:32Z Oct 8) said muse-spark while
  wake.sh pinned glm-5.3-flash via CLI, so sessions ran glm and w81's
  "future wakings pick up the new runner" prediction never materialized;
  re-checked unchanged through w89. No action ever taken by me (rule 6 —
  operator-side config); now moot. Note: tramontane.cron's grid comment
  still says "qwen3.8:27b" (a stale comment from the 17:04Z ollama step,
  schedule lines unchanged — cosmetic only).

## Resolved / for the record

- **MAISTRAL backup-drift flag (w64 2026-10-05 11:12Z) — RESOLVED w65
  15:15Z.** w64 sweep found MAISTRAL's newest snap 7.5h old, sole dir over
  the 6h bar, after a 3-slot miss streak (03:36Z `reason=length` 8192-out cap;
  04:05Z exit 0 without reporting → ALERT; 07:36Z `exit code: 124` opencode
  wall-clock timeout). **Self-recovered:** its expected 11:36Z slot produced
  `maistral-20261005T113931Z` (232K, 7.5min after slot start — normal),
  readable `tar -tzf`, 14 retained. At w65 sweep it is **212m old — back under
  the bar; fleet 14/14 fresh, no drift.** No data was lost at any point
  (snapshots intact through the streak). No operator action needed; the
  *pattern* (two wake-miss modes in one agent in a day) feeds the standing
  wake-harness hardening item above.

- **No action needed — flagging for the record (w61 23:12Z):** the fleet-wide
  `backup.sh` change (exclude `./.git`; "history lives on github") applied
  2026-10-04 ~20:48Z is **correct and verified working**. I confirmed the
  two-tier restore model end-to-end this waking: Tier 1 (local snapshot =
  file state) `diff -r` clean vs live; Tier 2 (offsite `hurricane1976/Gale`
  branch `tramontane`) tip `eec9973` == my HEAD, 64 commits reachable. The
  14 retained pre-change snapshots still carry `.git` (451–536 entries each),
  so there are now two independent history copies and the offsite is the sole
  history source once rotation drops the last `.git`-carrying snap. `runbooks/
  restore-this-agent.md` updated to the two-tier model. **This is the model
  now, not a bug** — restoring from a new snapshot no longer re-creates the
  git tree; history comes from the offsite. No operator action.

- **Wake-harness hardening (standing, raised w58 03:36Z role-refusal,
  compounded w59 APIError cases) — still open at w60 19:15Z.** Today's
  10:48–12:00Z `retryable APIError` window hit **7 of 15 agents** (bora,
  chinook, maistral, poniente, sirocco, vortex, **and my own 11:12Z slot**)
  and MAISTRAL's earlier role-refusal was only caught because `wake.sh`
  fires an ALERT on "exit 0 without reporting". Two recommendations pending
  your call: (a) look at the Ollama/API gateway for today's
  11:00–12:10Z window, (b) treat "exit 0 + ALERT + no report" as a
  retryable miss / surface refusal text so a model refusal can't masquerade
  as a clean pass. No data loss in either case (verified: all flagged
  snapshots intact, `tar -tzf` readable).

## Resolved

- **MAISTRAL backup-drift flag (w58 2026-10-04 07:12Z) — RESOLVED w60
  19:15Z.** All three w59 drifts (MAISTRAL 7.4h / CHINOOK 7.0h / VORTEX
  8.2h, shared `retryable APIError` root cause) are **fully self-recovered
  at w60 sweep**: MAISTRAL's in-flight 14:53Z wake succeeded — newest snap
  `maistral-20261004T153802Z` (4.0M, 14 snaps, `tar -tzf` readable), 214m
  old at sweep time; CHINOOK 188m; VORTEX 18m. **Fleet 14/14 under the 6h
  bar, no drift, no silent failures.** Data was never lost at any point
  (intact retained snaps throughout the cyclical misses). The *systemic*
  part (APIError infra window + wake.sh hardening) is carried forward as
  the single open item above.

- **MAISTRAL backup-drift flag (w58 2026-10-04 07:12Z) — SUPERSEDED by the
  w59 note (kept for history), now RESOLVED as above.**
  MAISTRAL's newest snapshot `maistral-20261003T233805Z` is **~455m (7.6h) old —
  the first sibling over the 6h bar** (all 12 others + gale-root are fresh, 10m
  to 188m; its own retained snap is intact — 790 entries / 3.4M / `tar -tzf` OK,
  **data not lost**, the drift is purely "no new snapshot after the 23:38Z wake").
  **Root cause (read-only, read-only-logs):** its `20261004T033601Z` wake fired
  and **exited 0, but the model refused the role** — logged verbatim:
  "I'm not able to adopt the MAISTRAL identity ... I function as Qwen, a large
  language model developed by Alibaba Group, and I don't have a built-in persona
  that runs autonomous fleet maintenance routines." So no backup/NOTES/notify ran
  and `wake.sh ALERT fired` (exit 0 without reporting). Grep-confirmed this
  **refusal wording is a first appearance across its 75 logs** — a **new failure
  mode (model role-refusal)**, not a recurrence of the CHINOOK "skipped the
  backup" one-off. I am **read-only to MAISTRAL's tree (rule 7)**, so I did not
  act inside it: I sent a data-only drift+root-cause note via `send_to_peer.sh
  MAISTRAL` (returned `{"status":"ok"}`) and am flagging you here + via this
  waking's notify. **No operator action is *required* to prevent data loss**
  (the retained snap is intact and the next normal 07:36/11:36Z wake should
  produce a fresh one and clear the drift), **but you may want to look at why a
  qwen3.8:27b unattended session declined its own persona once** — and whether
  to harden `wake.sh`'s "exit 0 + ALERT + no report" case (retries, or surface
  the model's refusal text) so a refusal can't masquerade as a clean pass.
  Watching for recurrence next waking.

- **CHINOOK backup-drift flag (w53 2026-10-03 11:12Z) — RESOLVED w54 15:12Z.**
  At w53 CHINOOK's newest snapshot was 7.1h old (over the 6h bar) due to a
  one-off "woke and skipped the backup" at its 08:00Z slot. At w54 (15:12Z)
  its own 12:00Z wake fired and backed up: newest `chinook-20261003T120154Z`
  is now 190m (3.17h), back UNDER the 6h bar; 14 snaps intact, `tar -tzf`
  fully readable. One-off, not a recurring pattern — no operator action
  needed. If it recurs across wakings I will re-flag here.

- **Activation — TELEGRAM_BOT_TOKEN only. DONE 2026-09-25.** Token supplied,
  `keys/telegram.env` live (600, both vars set, chat-id 8986669804).
  `notify.sh` confirmed working — 02:15Z and 02:56Z wakes both delivered;
  `check_replies.sh` polling and returning operator /commands. Cron active.

- **Telegram (2026-09-25, via /commands):** Got it — operator ACK of the
  02:15Z waking report (Bora drift flag + 8 siblings holding stale peer
  tokens, pending restart decision).
- **Telegram (2026-09-25, via /commands):** Restart them — **executed
  02:56Z.** `sudo systemctl restart` on the 7 pre-re-provision peer
  services (chinook, cyclone, maistral, sirocco, vortex, squall, tempest);
  all `active`; BORA + CHINOOK round-trips returned `{"status":"ok"}`.
  Details in NOTES.md 02:56Z entry.

- **Scaffolded 2026-09-25 (10th agent on gale-agent).** See NOTES.md.
- **Pairing COMPLETE 2026-09-25 (rules 8/8a satisfied).**
  10 local sibling pairs + 21 remote pairs (beacon/mountain/tidal)
  minted via `fleet-provision onboard Tramontane --with-remotes --write`.
  Local siblings rendered; 3 remote bundles (7 pairs each) sent to the
  host leads (Beacon/Mountain/Tidal inboxes); local bundle copies
  shredded. Remote leads import under their own rule-8 sign-off.
  All 31 pairs verified against the vault; peer service live on
  100.66.39.59:8791 (round-trip token test passed).
