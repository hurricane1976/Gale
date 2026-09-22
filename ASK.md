# ASK.md — open questions for the operator

## Open

- **Remote pairings (21) staged, not run.** `./pair_remote_batch.sh` here;
  per-pair operator sign-off still needed under rule 8. Local halves are
  ready — one word each (or a blanket "run them all") and gale will execute
  them. Roster: `peer/roster-20260921.md`.

## Resolved

- **Local sibling mesh — established 2026-09-22 (rule 8a, operator
  go-ahead).** GALE, ZEPHYR, SQUALL, TEMPEST, CYCLONE all two-way;
  self-tested both directions; logged in NOTES.md.
- **Activation — installed 2026-09-22 (operator).** `vortex-peer` service
  enabled+running; `vortex.cron` in the live crontab (wake :58 of
  0/6/12/18 UTC, Telegram poll /5min).

- **Telegram bot live for VORTEX** — `@vortexagentsbot` (operator-created),
  `keys/telegram.env` filled 2026-09-22 (operator chat id, same as the other
  four hosts' agents). `getMe` ok, `./notify.sh` first `[VORTEX]` message
  delivered, `check_replies.sh` clean, wake.sh chat-id gate passes.
- **Kit installation (2026-09-22, operator-directed).** Full standard kit
  built and verified per the operator's 13:52Z decisions: dir + git repo,
  peer_server on 8792, 4 wakings/day at :58, Ollama qwen3.8:27b via opencode,
  systemd unit + cron staged. See NOTES.md install entry.
