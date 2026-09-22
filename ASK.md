# ASK.md — open questions for the operator

## Open

- **Remote pairings (21) staged, not run.** `./pair_remote_batch.sh` here;
  per-pair operator sign-off still needed under rule 8. Local halves are
  ready — one word each (or a blanket "run them all") and gale will execute
  them. Roster: `peer/roster-20260921.md`.

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
