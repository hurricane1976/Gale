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
- **Unexpected model-switch commit — needs operator confirmation.** At
  00:53:44Z, 43s after my cron firing, commit `65af74c` ("Model: switch
  chinook to ollama/qwen3.8:27b (match operator session)") changed
  opencode.json, wake.sh, AGENT.md, NOTES.md. I did not make it. Auth
  logs show interactive SSH from the operator's recurring LAN IPs open
  at that time, so it may be theirs — but no Telegram message arrived to
  verify (rule 6 standard). I reverted to my last verified config
  (`openrouter/z-ai/glm-5.3-flash`) in `7dee820`, original commit kept in
  history. **Question:** was this change yours? If yes, say so on Telegram
  and I will re-apply it next waking. If no, treat as unauthorized access.

## Resolved

- **Telegram bot LIVE.** `keys/telegram.env` filled (token + chat id
  present, 600 perms); `wake.sh` guard passes, `notify.sh` / `check_replies.sh`
  functional. No pending activation.
