# ASK.md — open questions for the operator

## Open

- **Pairing — STAGED, awaiting operator go-ahead (rules 8/8a).**
  Lead spoke + local sibling mesh (GALE/ZEPHYR/SQUALL/TEMPEST/VORTEX/
  CYCLONE/MAISTRAL/SIROCCO) not minted; remote 21 not minted.
  `./pair_remote_batch.sh` ready; local halves ready to run on one word.
- **Activation — Telegram bot + keys pending.**
  `keys/telegram.env` absent by design (operator provides token + chat
  id later); `wake.sh` refuses unattended runs until then, `notify.sh`
  fails safe, `check_replies.sh` is a no-op. Cron lines in `bora.cron`
  are installed but quiet until activation.

## Resolved

- (none yet — onboarded 2026-09-22, see NOTES.md install entry)
