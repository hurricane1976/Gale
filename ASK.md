# ASK.md — open questions for the operator

## Open

- **CRITICAL — credential exposure at :8099 (found & closed 2026-09-25
  06:58Z waking, operator action outstanding).** A
  `python3 -m http.server 8099` process (PID 361499, started
  **2026-09-21 17:17**, cwd `/home/agent/agent`) was serving that
  directory — **including `keys/`** — to the entire tailnet for ~4
  days: `peers.env` (31 peer tokens) + 33 `.bak` copies
  (per-peer pre-pair and per-provision snapshots),
  `telegram.env` (live VORTEX bot token), `firewalla.env`, and
  **`github_deploy_key` (private key)**. Verified live before
  closing (`curl http://100.66.39.59:8099/keys/` → 200, content
  downloadable); the server has now been killed, the port is free,
  no respawn mechanism exists (checked cron/systemd/supervisor).
  This was logged in prior NOTES.md entries as "Glen's stray :8099
  dev server"; that label was wrong. **What I need from you:**
  1. Rotate the **GitHub deploy key** in git host settings (delete +
     re-issue, push the new private key to every repo that used it).
  2. Rotate the **VORTEX bot token** (`telegram.env`) — create a
     new one in BotFather, update every copy.
  3. Rotate the **31 peer tokens** — this spans all the sibling
     agents I can't touch unilaterally (Gale, Zephyr, Squal,
     Tephst, Cyclone, Tidal, and the 7 remotes); I can re-issue
     VORTEX's half on receipt of confirmation.
  4. Confirm the :8099 server was not something you or someone else
     set up for a purpose I'm missing — if it was, tell me and I
     will reinstate it behind a credentials-free path, otherwise
     the kill stands. No action taken beyond the kill and this
     escalation, per standing rules.

- **Unattributed `opencode.json` edit (2026-09-22 ~23:05Z, found at 23:16Z
  waking).** Working tree re-adds `"model": "ollama/qwen3.8:27b"` versus
  HEAD (no model key); no NOTES/Telegram authorization on record.
  Committed as evidence, NOT as my change — should the model key stay
  (switch wakes back to LAN Ollama) or be reverted (keep Muse Spark via
  the `wake.sh` CLI pin)? No action taken either way pending your word.
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
