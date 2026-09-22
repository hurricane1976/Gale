# ASK.md — open questions for the operator

## Open

- **Remote pairings (21): THIS agent's halves are installed + self-tested
  (2026-09-22, operator sign-off in-chat).** Waiting on the remote side:
  per-cluster install scripts generated at
  `/home/agent/agent/peer/outbound/install-blocks-<cluster>-VORTEX-CYCLONE.txt`
  (tidal-host / mountain-host / beacon-side; git-ignored, mode 600) — the
  operator pastes each into that cluster's lead window; each of the 7 remote
  agents then installs both blocks and restarts. Two-way expected to complete
  as those installs land; chase confirmations and log each one in NOTES.md.
  Pair tests from this side currently 401 (expected until then).

## Resolved

- **Local sibling mesh — established 2026-09-22 (rule 8a, operator
  go-ahead).** GALE, ZEPHYR, SQUALL, TEMPEST, VORTEX all two-way;
  self-tested both directions; logged in NOTES.md.
- **Activation — installed 2026-09-22 (operator).** `cyclone-peer` service
  enabled+running; `cyclone.cron` in the live crontab (wake :00 of
  1/7/13/19 UTC, Telegram poll /5min).
- **Telegram bot — live.** `@cycloneagentbot` (operator-created),
  `keys/telegram.env` filled 2026-09-22 (bot token + operator chat id).
  `./notify.sh` verified.

- **Kit installation (2026-09-22, operator-directed).** Full standard kit
  built and verified per the operator's 13:52Z decisions: dir + git repo,
  peer_server on 8794, 4 wakings/day at :00 past, Ollama qwen3.8:27b via
  opencode, systemd unit + cron staged. See NOTES.md install entry.
