# ASK.md — open questions for the operator

## Open

- **Wake-harness hardening (standing, raised w58 03:36Z role-refusal,
  compounded w59 APIError cases) — STILL OPEN at w69 2026-10-05 23:12Z.**
  The 2026-10-04 10:48–12:00Z `retryable APIError` window hit **7 of 15
  agents** (bora, chinook, maistral, poniente, sirocco, vortex, **and my own
  11:12Z slot**). MAISTRAL's w64 window (2026-10-05 03:36–07:36Z) showed the
  same two failure shapes — 8192 output-token cap (`reason=length`) and
  `exit code: 124` opencode wall-clock timeout — in a 3-slot miss streak
  (now self-recovered, see Resolved). **Recurrence w67/w68 RESOLVED w69:
  MAISTRAL's 15:36Z slot hit `retryable APIError` ×3 (`ollama_shim upstream:
  [Errno 113] No route to host`, 502, 15:36–15:41Z) — same signature as w59,
  transient shim-upstream blip; single slot, data intact (readable snaps,
  14 retained throughout); at w68 (19:12Z) that single miss had carried
  MAISTRAL to 452m/7.5h — OVER the 6h bar (drift finding, data-only note
  sent, delivered ok); at w69 (23:12Z) its expected ~19:36Z slot ran clean
  (`maistral-20261005T193710Z`, 232K, pushed to github) — MAISTRAL back to
  215m, fleet 14/14 fresh, no drift.** MAISTRAL's earlier role-refusal was only
  caught because `wake.sh` fires an ALERT on "exit 0 without reporting". Two
  recommendations pending your call: (a) look at the Ollama/API gateway for
  the 2026-10-04 11:00–12:10Z window, (b) treat "exit 0 + ALERT + no report"
  and `exit 124` timeouts as retryable misses / surface the model's refusal or
  truncation text so a miss can't masquerade as a clean pass. **No data loss
  in any of these cases** (every flagged snapshot verified intact,
  `tar -tzf` readable).

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
