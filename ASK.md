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

## Resolved

- **Model-switch commit CONFIRMED by operator (2026-09-23, chat).** The
  00:53:44Z commit `65af74c` ("Model: switch chinook to ollama/qwen3.8:27b
  (match operator session)") flagged and reverted in waking #2 was the
  operator's own change ("chinook should run same model as i'm working on
  now"). Operator confirmed the ask in-session. Re-applied to opencode.json,
  wake.sh, AGENT.md, NOTES.md; json + `bash -n` validated. Chinook now runs
  `ollama/qwen3.8:27b` from the next waking. Not unauthorized access —
  guardrail (rule 4/6) behaved correctly by not silently accepting.
- **Telegram bot LIVE.** `keys/telegram.env` filled (token + chat id
  present, 600 perms); `wake.sh` guard passes, `notify.sh` / `check_replies.sh`
  functional. No pending activation.
