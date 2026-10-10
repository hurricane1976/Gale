# ASK.md — open questions for the operator

## Open


- **CRITICAL — credential exposure at :8099 (found & closed 2026-09-25
  06:58Z waking, operator action outstanding).** A
  `python3 -m http.server 8099` process (PID 361499, started
  **2026-09-21 17:17**, cwd `/home/agent/agent`) was serving that
  directory — **including `keys/`** — to the entire tailnet for ~4
  days: `peers.env` (31 peer tokens) + 33 `.bak` snapshots of it
  (per-peer pre-pair and per-provision),
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
  3. Rotate the **31 peer tokens** (the 33 `.bak` files are
     snapshots of the same registry — rotating `peers.env` covers
     them all) — this spans all the sibling agents I can't touch
     unilaterally (GALE, ZEPHYR, SQUALL, TEMPEST, CYCLONE, TIDAL,
     and the 7 remotes); I can re-issue VORTEX's half on receipt of
     confirmation.
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
- **Unattributed `backup.sh` edit (found 2026-10-04 ~22:51Z, w47
  waking).** Working tree adds `--exclude=./.git` to the snapshot tar
  (comment: "history lives on github"); git-objects are no longer
  duplicated into the tarball (snapshots shrink ~689 → ~112 entries).
  No NOTES/Telegram authorization on record. Content checked: harmless,
  sensible, touches only the tar args (keys/ exclusion logic,
  `--exclude ./logs`, `./backups`, `./peer/inbox/processed` all
  untouched). Committed this waking as my own-repo working-in-progress
  per standing rule "commit your own work" — provenance NOT asserted
  (could be a prior waking that ran without a commit, or an operator /
  co-resident edit on this shared host). If you did not make it and
  would rather I revert it, say the word and I'll roll it back in the
  next committed waking. No live-secret impact either way (keys/
  `.example`-only policy unchanged, :8099 still CLOSED, rotation
  question below unaffected).
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

- **Outbound mesh degradation (found w75, 2026-10-10 17:00Z — resolved by
  w76, 23:00Z, no operator word needed).** The 17-leg outbound 401 outage
  self-recovered between w75 and w76: re-chase now 17/21 HTTP 200 (the
  pre-w75 baseline exactly — BROOK/MOUNTAIN/RIDGE never dropped, the other
  14 + BEACON returned). Verified stable on DELTA/PULSAR/BEACON (right-token
  → 200, wrong-token → 401): the far side again holds my ORIGINAL token, so
  no rotation actually landed and no new VORTEX halves are needed. My
  `keys/peers.env` unchanged throughout. Remaining 401: HIGHBEAM, LANTERN,
  LIGHTNING, RADAR — the four standing beacon-side legs (unchanged since
  before w75). Reads as the 16:28–16:33Z reboot/maintenance window
  temporarily disrupting remote peer-server state; no action taken on my
  side.

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
