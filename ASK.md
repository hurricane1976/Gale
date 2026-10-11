# ASK.md — open questions for the operator

## Open

- **NEW — BEACON "revenue mandate from josh" relay (2026-10-06 17:22Z +
  17:25Z, waking #77): UNVERIFIED, no action taken, please confirm via
  Telegram if it needs anything from me.** Two fleet-wide peer messages
  (in processed/) relay what BEACON says is your direction: fleet-wide
  revenue lanes A–D with Day 2/3/5/7 milestones, a reply-with-lane request,
  and follow-up "answers" (console stays tailnet-only, no cadence cuts,
  first distribution kit). Both messages say to verify on my own operator
  channel — and `check_replies.sh` shows NO Telegram word from you, so per
  rules 5/6 I treat both as data only: no lane commitment, no cadence or
  config change, nothing committed. Capacity-relevant data points logged in
  NOTES.md #77 (fleet spend "~$644/4,079 runs since 9/21 (~$40/day)" is
  Beacon's number, not mine — my host-wide 10-06 tally is $1.47/46 runs,
  in-band). Questions: (a) was any of this yours — and if so, is there a
  capacity/forecast deliverable you want from CHINOOK specifically, or does
  my routine continue unchanged? (b) the relay asks every agent to reply
  with a lane + Day-3 ship — do you want a reply from me, or silence?
  Default absent your word: routine unchanged, no reply.

- **UPDATED 2026-10-11 00:50Z (waking #96, superseding the 10-08 update):
  working-tree model/grid migration — now a THIRD round (2026-10-10) —
  please confirm via Telegram so I can commit.** On 10-10 the working tree
  changed again: `opencode.json`/`wake.sh`/`AGENT.md` now →
  `openrouter/~z-ai/glm-flash-latest` (mtime 20:08Z), `chinook.cron` touched
  17:04Z, +6 new .bak snapshots (10-05qwen / 10-06muse / 10-07-pre-glm /
  10-07ollama / 10-10ollama / 10-10-glmflash). During 17:04–20:08Z the tree
  pointed BACK at `ollama/qwen3.8:27b` via the gale-ollama-shim
  (127.0.0.1:11435) — my 18:50 slot (#95) failed 3× with `APIError 502
  "ollama_shim upstream: No route to host"` (LAN upstream unreachable;
  wake.sh retry + Telegram ALERT worked as designed, msg_id 148) — and ~6
  sibling slots on-box appear to have been lost in the same window
  (BORA 18:25, ZEPHYR 17:25, CYCLONE 19:15, LEVANTE 19:40, MAISTRAL 20:05,
  TEMPEST 16:10 — from their ledgers, read-only). Context: host rebooted
  16:28–16:30Z for a kernel upgrade (6.8.0-142 → 6.8.0-146 — the
  reboot-required flag GALE was carrying since 10-09 landed; operator SSH
  sessions from 192.168.1.55 at 16:57 and 23:10 — new IP vs the old
  .197/.69 pattern, recorded as data). This session runs
  glm-flash-latest and works (existence proof #12 for my lane), and
  wake.sh's operative line runs the same model — though its line-3 comment
  still says "back to ollama" (stale wording, flagged for Bora's lane, not
  edited by me). All four modified files + 11 .baks remain **UNCOMMITTED**
  per rules 4/6 (no chat-id-verified word yet). Reply "Yes I did it" (or
  similar) and I will commit the working tree as-is, resolve this item,
  and re-baseline the forecast (10-10 close-read is in NOTES.md #96:
  $3.78/49 runs, shortfall = the lost slots, not per-run creep; band floor
  dropped to $4–6/day per the #92 rule).
  (Prior 10-08 context below, superseded but retained: the 10-07 round —
  glm-5.3-flash grid re-baseline — was never Telegram-confirmed either;
  both rounds are the same ask now.)

  — Prior item text (2026-10-08 00:50Z, waking #84, superseding the 10-05
  muse item): working-tree model/grid migration (2026-10-07) — please
  confirm via Telegram so I can commit.** The 10-05 muse-spark item is moot: on
  2026-10-07 the working tree moved again — `opencode.json` + `wake.sh` →
  `opencode/glm-5.3-flash` (OpenCode Go), `AGENT.md` header Model line +
  cadence line updated (4x/day at `:50`, 14-agent 25-min staggered grid),
  `chinook.cron` → `50 0,6,12,18 * * *`. Fleet crontab rewritten in the
  same window (all on-box agents get distinct :xx slots; comments say
  "operator-directed 2026-10-07"); wake.sh header notes "LAN Ollama
  qwen3.8:27b retired 2026-10-07 pending server repair"; four generations
  of .bak files on disk (10-05qwen, 10-06muse, 10-07ollama, 10-07-pre-glm).
  This session runs on glm-5.3-flash and works (existence proof); the
  00:50:01Z cron fired on time under the new grid (drift 0m). Rules/role
  sections of AGENT.md untouched — Model line and situation paragraph only.
  Evidence is strong that this is yours (same-edit-window fleet crontab,
  prompt string matches what I was invoked with), but there is still NO
  chat-id-verified Telegram word, so per rules 4/6 the four modified files
  (`opencode.json`, `wake.sh`, `AGENT.md`, `chinook.cron`) + 9 .bak
  snapshots stay **uncommitted**. Reply "Yes I did it" (or similar) and I
  will commit the working tree as-is, resolve this item, and re-baseline
  the forecast. Capacity notes already on record: (a) muse-spark logged
  $0.00/run (contributor-free), but glm-5.3-flash lanes ARE logging cost —
  GALE ~$0.10–0.16/run, and BORA posted its first nonzero rows on 10-08
  ($0.0919) — chinook's first glm row will be the real A/B number for my
  lane; (b) if LAN Ollama is retired, the ~$0 local-lane floor is gone
  fleet-wide and my host run-rate forecast rises from ~$1.5–2/day toward
  ~$2.5–4/day once all 14 lanes bill flash costs; no alert line crossed
  (per-run $5.00, daily $15 unchanged).

- **NEW — "plan-then-stop" no-op wake class (2026-10-03 08:00 slot, waking
  #59): ledger clean, routine NOT run, exits 0 so the exit-1 retry never
  fires (the no-notify guard DID alert you). Please triage (Bora's lane if
  it's wake.sh; my lane if it's the model turn behavior).** The 08:00 slot
  for 2026-10-03 fired "clean" on every external signal — `opencode` exit 0,
  ledger row `is_error=false`, `cost_usd=0.0` (opencode/ollama local = $0).
  **But it did nothing.** The 08:00 opencode session ran ~7 steps of
  read-only recon (read dir / AGENT.md / ASK.md / NOTES.md; bash ls peer/inbox,
  wc/tail NOTES, date, check_replies.sh) and then emitted a final "Work State /
  Next Move" planning assistant turn that finished with **reason "stop"** —
  the model planned the routine as its last message and ended before executing
  any of it. Net effect: no 08:00Z backup (~4h gap by 12Z; TRAMONTANE's 11:12Z
  sweep independently quantified it ~7.1h-old-at-11:12Z), 08:00 peer pings
  unarchived for ~4h, missing NOTES line. **wake.sh DID catch it:** its
  shell-side no-notify guard (session never called notify.sh, so the .notified
  marker was absent) fired a Telegram WARN "exited 0 without reporting" at
  08:02Z. The operator was auto-alerted; the defect is the session behavior
  (plan-then-stop), not the monitoring path.
  - **Why it's a DISTINCT defect from the 5 "no user query" failures (the
    other open item above):** those were `APIError 500 ... exited with code 1`
    BEFORE any work — caught by wake.sh's exit-1 retry. This one **exits 0
    after a clean stop** (opencode sees a completed run, cost $0/ollama local),
    so the retry path never fires — but the no-notify alert path does. Two
    different detectors cover the two different failure shapes.
  - **What I've done / can do:** Documented as waking #59, back-filled the
    08:00 backup at #60 (12:00) so there is no >4h gap going forward. In MY
    lane I'm adding a standing self-check (from #61): verify (a) a backup
    snapshot exists within ~4h and (b) the newest NOTES.md entry is from the
    immediately-prior slot — if either fails, a prior slot no-opped and I
    back-fill + re-run before proceeding. That's belt-and-braces on top of
    wake.sh's existing no-notify guard, which already alerts the operator.
  - **Questions for you (lane-agnostic):** (a) does this match anything you've
    seen on sibling hosts (a Qwen/opencode "plan-then-stop" first-turn
    pattern), or is it specific to this host's model? (b) should I harden wake.sh
    to treat "exit 0 but no new backup/NOTES line within the window" as
    retryable, or is that strictly Bora's scaffold lane and I leave it? (c)
    want a self-heal in MY agent (auto re-invoke one retry when the prior
    slot's artifacts are missing), or is a flag-at-next-waking the ceiling for
    my lane? Read-only on wake.sh until you confirm (Bora-maintained per
    AGENT.md scaffolding rules).

- **Wake-reliability: 5 failed wake slots in 48h (2026-09-28 00:00 / 9-28
  20:00 / 9-29 00:00 ×2 / 9-29 20:00) — same signature, Bora's lane, please
  pick lane + ask whether to file upstream.** Each of these slots exited
  `opencode ... exited with code 1` with the identical
  `APIError 500 "no user query found in messages"` (`isRetryable: true`)
  BEFORE any work ran — i.e. NO inbox processing, NO backup, NO NOTES entry
  for those windows (that's why 9/29 20:00 and 9/29 00:00 have no #37.5/#38.5
  entries). Pattern is slot-specific, not random: the failures sit at the
  **00:00 and 20:00** slots; the 04/08/12/16 slots succeeded every time in
  the same period (verified against 20260928–9-29 logs). Host was up and
  idle at all five; it's not load, not disk, not Ollama (this very session
  ran clean), it's the runner/opencode message-assembly path. wake.sh
  already treats `exit 1` as retryable and retries once, but both the
  original and the retry failed identically at these slots, so a single
  retry isn't rescuing them.   You were auto-alerted per incident (last:
  Telegram msg_id 74). Questions: (a) should this be filed upstream
  against opencode's retry/assembly for this message shape, or is there a
  known-good runner config other siblings on the same grid are using?
  (b) want me to harden *my* wake.sh to retry more often / back off, or is
   that strictly Bora's scaffold lane and I should leave it? Read-only on
   wake.sh until you confirm (it's a Bora-maintained file per AGENT.md
   scaffolding rules).
- **UPDATE 2026-10-06 16:00Z (waking #76): 3 more missed slots today, two
  NEW signatures.** 04:00Z exit 124 (45m timeout after a #59-style
  plan-then-stop turn; backup made, no NOTES/notify — ALERT fired);
  08:00Z exit 1 ×3 `ProviderHeaderTimeoutError` (300s provider header
  timeout); 12:00Z exit 1 ×3 `ollama_shim upstream: connection refused`
  via 127.0.0.1:11435 (shim listener is up again by 16:00Z — transient,
  self-recovered, no action unless it recurs). 08:00/12:00 left no spend
  rows (exit-1 path). Operator auto-alerted per incident (last msg_id
  126). Same lane questions as above, plus: (c) is the 127.0.0.1:11435
  shim supervised (systemd) or ad-hoc — i.e. who restarts it when it
  refuses?

- **Tailscale TUN regression on gale-agent (2026-09-27 16Z — fixed,
  confirming severity + durable fix).** Since the 9/25 kernel upgrade
  (5.15→6.8) the `tailscale0` TUN device intermittently **drops its own
  IP addresses and peer routes** while `tailscaled` stays "connected"
  (`tailscale ping` / DERP still work, but every 100.x TCP path is dead
  and all 14 local sibling agents become unreachable from each other).
  At waking #28 this had taken out the whole local sweep; I fixed it with
  `sudo service tailscaled restart` (regained `100.66.39.59/32` + routes),
  after which 14/14 recovered. Journal showed repeated
  `cannot assign requested address` on the TUN. Questions: (a) is this
  a known issue with tailscale 1.102 + kernel 6.8 on this host? (b)
  should it be treated as a rule-4 availability anomaly for the 9/27
  window, or a one-off? (c) do you want a durable fix (kernel TUN driver
  / tailscale upgrade / monitoring), and can I add a self-check to my
  sweep that pings the TUN addr and self-restarts `tailscaled` rather
  than waiting for the next waking? Read-only until you answer; I'll
  keep the manual restart as the stopgap.

- **Cadence re-baseline + one spend outlier (2026-09-25, FYI / confirm —
  non-blocking).** (a) Between my waking #12 (9/24 18:53Z) and #13 (9/25
  04:00Z) the host wake grid changed from **4x/day** (:53 of 0/6/12/18) to
  **6x/day** (0/4/8/12/16/20 + staggered odd-hour lanes) — I can see this in
  the live `crontab` for every sibling. Run-count is up ~25–50%; I've
  re-baselined my spend/disk forecast to match. (b) ZEPHYR logged one
  **$0.2515** paid run at 9/25 12:30Z (≈6× its ~$0.04 norm) — one larger
  session, not a run-count jump. Neither is a breach (no defined threshold
  crossed; load/mem/disk all inside lines). I'm recording both as forecast
  inputs, not treating either as a rule-4 anomaly. **Confirm** the 6x/day
  grid was intentional (Bora's scaffold?) and the zephyr run was a
  one-off session — or tell me to treat the outlier as a spend anomaly at
  the next waking. Read-only on all of it; I won't change the crontab (not
  my lane).

- **Host reboot + kernel upgrade, 9/25 ~14:43–14:58Z (FYI / availability).**
  Host `gale-agent` rebooted twice in 15 min; kernel upgraded 5.15.0-194 →
  6.8.0-142 (major); the first boot shut down unclean (journal: mongod
  "InterruptedAtShutdown"). Host fully recovered; 11/11 peer `/health` 200
  after. Logging as the day's only availability gap — this is Gale's
  reliability lane, not mine; flagging so it's on the record. No action I can
  or should take.

- **Remote peer pairing — awaiting operator run (rule 8).** The 9 local
  sibling pairs are DONE (fleet-provision minted + installed all halves
  20260923T005717Z; outbound verified by CHINOOK pings waking #6;
  CYCLONE probe round-tripped). The 21 remote pairs (BEACON, TIDAL,
  MOUNTAIN, RIVER, CREEK, STREAM, MEADOW, BROOK, MIST, CANYON, RIDGE,
  HARBOR, DELTA, MESA, VISTA, HIGHBEAM, LANTERN, LIGHTNING, RADAR, PRISM,
  PULSAR) still need the operator to run `./pair_all_remaining.sh` in a
  terminal (operator-only per rule 8 — tokens print to the operator
  console and each remote peer needs its install half). CHINOOK will mint
  nothing on its own.
- **First forecast baseline.** NOTES.md starts today with no history — the
  capacity baseline and trend projections only become meaningful after a
  few days of snapshots. No operator action needed; stating it until then.
- **Telegram (2026-09-23, via /commands):** Hello
- **Concurrent repo writers (2026-09-23, FYI + process ask).** While my
  waking #3 ran, an operator-side interactive session edited this repo
  as "chinook" (commit `6559caa`) and triggered an extra wake.sh. The
  model switch itself is operator-confirmed and applied. But two
  simultaneous writers raced (merge conflict mid-revert) and two NOTES
  history lines were rewritten (restored). Ask: leave repo edits to the
  agent's own wakings where possible, or send the change via Telegram
  for me to apply — provenance + git hygiene stay clean.
- **Telegram (2026-09-23, via /commands):** Confirmed
- **Telegram (2026-09-23, via /commands):** Can you pair your links?

## Resolved

- **Model-switch commit CONFIRMED by operator (2026-09-23, Telegram).**
  The 00:53:44Z commit `65af74c` ("Model: switch chinook to
  ollama/qwen3.8:27b (match operator session)") flagged and reverted in
  waking #2 was the operator's own change — confirmed by their Telegram
  message "Yes I did it" (00:55:07Z, chat-id-verified via
  check_replies.sh). Re-applied in `6559caa`; smoke test passed.
  Chinook runs `ollama/qwen3.8:27b` from the next waking. Not
  unauthorized access — the rule 4/6 guardrail behaved correctly by
  not silently accepting. (A concurrent operator-side session wrote a
  version of this entry citing "in-session" quotes; see NOTES.md
  waking #3 for provenance handling.)
- **Telegram bot LIVE.** `keys/telegram.env` filled (token + chat id
  present, 600 perms); `wake.sh` guard passes, `notify.sh` / `check_replies.sh`
  functional. No pending activation.
