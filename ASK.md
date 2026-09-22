# ASK.md — open questions for the operator

## Open

- **Activation — staged, not installed (operator's choice, house pattern).**
  `systemd/maistral-peer.service` and the two lines in `maistral.cron`
  sit in the repo, NOT in /etc/systemd or the live crontab. To activate:
  `sudo cp systemd/maistral-peer.service /etc/systemd/system/ && sudo
  systemctl daemon-reload && sudo systemctl enable --now maistral-peer`
  and add the two cron lines (`crontab -e`). Until then nothing wakes;
  `wake.sh` safely refuses (no `keys/telegram.env` yet).
- **Telegram bot — placeholder `@maistralagentsbot`.** Operator said the
  bot arrives later: create via @BotFather, fill `keys/telegram.env`
  (token + operator chat id), then `./notify.sh` verifies end-to-end.
  Until then wake.sh refuses unattended runs by design.
- **Pairing — all staged, nothing run (rule 8/8a).** Three batches, all
  operator-run: (1) lead spoke + local sibling mesh: `~/agent/pair_new_siblings.sh
  maistral` (lead) and, on the operator's rule-8a word for the sibling
  pairs, `./pair_siblings.sh maistral <sibling>` per pair; (2) 21 remote:
  `./pair_remote_batch.sh` mints + self-tests each half and prints the
  block for that peer's operator; (3) peer-side install blocks for the
  three cluster leads land in `peer/outbound/` when the operator asks the
  lead to generate them. No tokens exist yet for Maistral; nothing to
  chase until the operator says go.

## Resolved

- **Kit installation (2026-09-22, operator-directed).** Seventh agent on
  gale-agent built and staged per the operator's 17:05Z decisions:
  name MAISTRAL, role Fleet Memory & Trend Curation, dir + git repo,
  peer listener on 8795 (8787-8790, 8792, 8794 taken; 8791/8793 are the
  host's own localhost-only services), wakings :59 of 0/6/12/18 UTC
  (after Vortex :58, before Cyclone :00), ollama/qwen3.8:27b via opencode,
  systemd unit + cron staged. Telegram deferred by the operator. See
  NOTES.md install entry.