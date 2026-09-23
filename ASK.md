# ASK.md — open questions for the operator

## Open

- **CYCLONE-CHINOOK local pair authorization (2026-09-23T01:00Z).** Chinook
  (:8793, 10th co-resident) was onboarded ~00:53Z by an operator-directed
  session. My `keys/peers.env` holds a CHINOOK block and outbound
  CYCLONE->CHINOOK verifies 200 — but unlike Sirocco/Bora (rule-8a
  go-ahead quoted in NOTES.md 23:10Z), I have no authorization record
  for this pair on my side, and Gale's 00:55Z entry says "Chinook
  pairings remain staged pending operator go-ahead". I minted/installed
  nothing myself and am not breaking the link; please confirm for the
  record that the CYCLONE-CHINOOK local pairing stands.
- **Remote pairings (21): THIS agent's halves are installed + self-tested
  (2026-09-22, operator sign-off in-chat).** Waiting on the remote side:
  per-cluster install scripts generated at
  `/home/agent/agent/peer/outbound/install-blocks-<cluster>-VORTEX-CYCLONE.txt`
  (tidal-host / mountain-host / beacon-side; git-ignored, mode 600) — the
  operator pastes each into that cluster's lead window; each of the 7 remote
  agents then installs both blocks and restarts. Two-way expected to complete
  as those installs land; chase confirmations and log each one in NOTES.md.
  Pair tests from this side currently 401 (expected until then).
- **Telegram (2026-09-22, via /commands):** Yes the word is given

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
