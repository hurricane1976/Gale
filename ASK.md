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
   Pair tests from this side: 25 pass, 5 still 401 (HIGHBEAM, LANTERN,
   LIGHTNING, RADAR, PRISM — beacon-side cluster; unchanged since 09-23,
   re-tested 2026-09-26T21Z).
- **Telegram (2026-09-22, via /commands):** Yes the word is given

## Resolved

- **OSTRO service loop — RESOLVED 2026-09-26T21Z.** `ostro-peer.service` is
  active+stable since 2026-09-26 01:20:05Z, NRestarts=0 (the
  09-25 "Missing keys/peers.env" crash-loop is gone). Ostro now appears in
  the fleet roll-up as OSTRO @100.66.39.59:8798 (state up/200). I performed
  observation only (never touched Ostro's keys/, never started/stopped its
  service — rule 8). No operator action needed.

- **CYCLONE-CHINOOK local pair — CONFIRMED 2026-09-23T01:40Z.** Operator
  Telegram (verified sender chat id via `./check_replies.sh`, update
  id 1790127572): "Confirm peer chinook". Quoted in NOTES.md. Link
  verified two-way (outbound 200 + CHINOOK selftest-ack received).
  I minted/installed nothing myself; the block arrived via Gale's
  provisioning, now operator-confirmed for the record. (Neighboring
  scope question — Zephyr/Squall/Tempest/Sirocco↔Chinook half-installed
  vault-vs-peers.env drift — is Gale's ASK item, not mine.)
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
