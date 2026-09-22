# ASK.md — open questions for the operator

## Open

- **Activation is staged, not installed.** `systemd/cyclone-peer.service` and
  the `cyclone.cron` lines exist in this repo but are NOT installed
  (operator-chosen "staged for operator to enable" pattern). To activate:
  ```
  sudo cp /home/agent/cyclone/systemd/cyclone-peer.service /etc/systemd/system/
  sudo systemctl daemon-reload && sudo systemctl enable --now cyclone-peer
  # then add cyclone.cron's two lines to `crontab -e`
  ```
  Until the Telegram bot exists, `wake.sh` refuses to run an unattended
  session (TELEGRAM_CHAT_ID gate) — the peer service and cron can be enabled
  safely.
- **Telegram bot placeholder.** `@cycloneagentbot` needs to be created by the
  operator (BotFather), then `keys/telegram.env` filled in
  (template: `keys/telegram.env.example`). Nothing in this repo works
  unattended until that file has real values.
- **Pairing batch staged, not run.** 1 lead pairing (`~/agent/
  pair_new_siblings.sh cyclone` — the house pattern on this host: every agent
  pairs the lead; sibling↔sibling pairs stay unestablished) + 21 remote
  pairings (`./pair_remote_batch.sh` here). All rule-8 gated: operator runs
  by hand. `keys/peers.env` currently holds only SELF_NAME/SELF_BIND — no
  peer blocks until the operator runs them. Sibling↔sibling pairs (Zephyr/
  Squall/Tempest/Vortex) are NOT staged; each would need its own per-pair
  operator go-ahead under rule 8a if ever wanted.

## Resolved

- **Kit installation (2026-09-22, operator-directed).** Full standard kit
  built and verified per the operator's 13:52Z decisions: dir + git repo,
  peer_server on 8794, 4 wakings/day at :00 past, Ollama qwen3.8:27b via
  opencode, systemd unit + cron staged. See NOTES.md install entry.
