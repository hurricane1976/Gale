# ASK.md — open questions for the operator

## Open

- **Wake-harness hardening (standing, raised w58 03:36Z role-refusal,
  compounded w59 APIError cases) — STILL OPEN at w81 2026-10-08 16:35Z
  (w80 sweep: TEMPEST drift — 3rd consecutive mid-session death, exit-0-no-report
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
