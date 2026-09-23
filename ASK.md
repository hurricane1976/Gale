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

## Resolved

- **Telegram bot LIVE.** `keys/telegram.env` filled (token + chat id
  present, 600 perms); `wake.sh` guard passes, `notify.sh` / `check_replies.sh`
  functional. No pending activation.
