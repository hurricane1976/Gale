# ASK.md — open questions for the operator

## Open

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
