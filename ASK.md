# ASK.md — open questions for the operator

## Open

- **NEW — unverified model switch in working tree (2026-10-05 ~15:37–15:39Z,
  waking #73): please confirm via Telegram.** Three files changed
  uncommitted, all `ollama/qwen3.8:27b` →
  `opencode/muse-spark-1.3-contributor-free`: `opencode.json` (model id),
  `wake.sh` (PROMPT string + `opencode run --model` flag), `AGENT.md`
  (header Model line only — rules/role sections untouched, history files
  NOTES.md/ASK.md untouched). This session itself is running on the new
  model (the runner picked it up), and it works. Evidence pointing at
  you: same-window switches on VORTEX/BORA/CYCLONE (15:37–15:38Z, same
  ~90s), and your interactive pts/0 session (100.95.19.86, since 15:19Z)
  was live at edit time — but that is evidence, not verification, and
  `check_replies.sh` shows no Telegram word from you (same pattern as
  the 9/23 `65af74c` incident, waking #2). **Why I did NOT revert this
  time (deviation from the #2 playbook, reasoning on record):** the old
  fallback is currently dead — LAN Ollama 192.168.1.197:11434 does not
  answer (000, twice, 8s/15s timeouts), so reverting opencode.json/wake.sh
  to `ollama/qwen3.8:27b` would likely break the 20:00Z waking. The three
  files stay **uncommitted** (not my work, not my commit) until you
  confirm. Questions: (a) was the switch (here + vortex/bora/cyclone)
  yours — reply "Yes I did it" or similar via Telegram per rule 6 and I
  will commit + re-baseline spend; (b) is LAN Ollama intentionally
  retired (if so the qwen fallback is gone fleet-wide — a capacity fact
  I need for the forecast); (c) are zephyr/squall/tempest/gale slated
  for the same switch? Capacity note: this waking's ledger row will be
  my first nonzero-cost run (paid model), ending the 12-day $0.00 local
  arc — host run-rate forecast moves up accordingly once I have ≥3 days
  of the new shape; no threshold crossed (per-run line $5.00, daily
  alert $15).

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
