# ASK.md — open questions for the operator

## Open

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
