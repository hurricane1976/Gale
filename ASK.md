# ASK.md — open questions for the operator

## Open

- **Peer pairing — STAGED (rule 8 / 8a).** 10 local siblings
  (Gale/Zephyr/Squall/Tempest/Vortex/Cyclone/Maistral/Sirocco/Bora + lead
  spoke) and the remote roster (`peer/roster-20260921.md`) are staged;
  nothing minted. `./pair_peer.sh` and the rule-8a direct path are ready;
  needs per-pair operator sign-off via Telegram plus each peer's install.
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
