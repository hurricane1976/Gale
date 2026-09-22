# ASK.md — open questions for the operator

## Open

- **Activation — Telegram bot + keys pending.**
  `keys/telegram.env` absent by design (operator provides token + chat
  id later); `wake.sh` refuses unattended runs until then, `notify.sh`
  fails safe, `check_replies.sh` is a no-op. Cron lines in `bora.cron`
  are installed but quiet until activation.
- **Remote pairing — 21 peers STAGED (rule 8).** `./pair_remote_batch.sh`
  ready; nothing minted. Needs per-pair operator sign-off via Telegram
  plus each remote peer's install.

## Resolved

- **Local mesh COMPLETE 2026-09-22 ~21:27Z (rule 8a, operator go-ahead in
  session).** All 8 co-resident pairs two-way (lead spoke + zephyr/squall/
  tempest/vortex/cyclone/maistral/sirocco): one shared token per pair,
  both halves installed, services restarted, self-tests 200/401 passed,
  real sends both directions verified, 8/8 inbound present. See NOTES.md.
