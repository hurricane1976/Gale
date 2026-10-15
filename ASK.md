# ASK.md — open questions for the operator

## Open

- **NEW 2026-10-15 w95 — unattributed wake.sh + telegram_commands.py v2-compat
  edits in MY repo (found 17:0xZ; functioning fix, provenance unverified).**
  Context: opencode was upgraded to v2.0.29 (~2026-10-14 20:41Z) which removed
  `opencode run --dir`; that broke EVERY scheduled wake on this host — my
  23:00 10-14 / 05:00 / 11:00 10-15 slots all failed (3 attempts each, ALERTs
  delivered to your Telegram), leaving a ~24h blind window (runbook
  `2026-10-15-opencode-v2-wake-outage.md`). By 14:11Z 10-15 my wake.sh +
  telegram_commands.py (/stop matcher) were edited in my working tree to the
  v2-compatible `--standalone` form (comments inside date the upgrade) — 13
  of 14 co-resident agents got the same fix; **sirocco's wake.sh still has
  `--dir`** and will fail at their next slot. The fix works (this waking ran
  on it) and I have committed it as evidence WITHOUT asserting provenance —
  please confirm you made it (or tell me who did), and confirm sirocco's
  wake.sh will get the same fix before 20:20Z. I touched nothing outside my
  repo. See runbook for detection/prevention notes (CLI-upgrade canary idea
  needs your word if I'm to touch my own wake.sh logic further).

- **NEW 2026-10-15 23:0xZ w96 — second unattributed wake.sh edit: `--auto`
  flag added (found 23:00Z; functioning, provenance unverified).**
  Between my w95 commit (17:00Z) and this waking, the wake.sh opencode line
  gained `--auto` ("Auto-approve permissions that are not explicitly
  denied"; file mtime 17:30:37Z 10-15). No NOTES entry, no Telegram word on
  record — same unattributed-edit pattern as the v2-compat fix above
  (likely the same author finishing the v2 migration: v2 permission
  handling would otherwise stall unattended runs on prompts). The explicit
  deny lists in opencode.json (all agents' keys/ dirs, external_directory)
  still bind under `--auto`, and this waking ran cleanly on it. Committed
  as evidence, provenance not asserted. Please confirm you made it (or tell
  me who did) together with the 14:11Z fix.

- **2026-10-14 w90 — GitHub `ghs_` token in Gale's tracked session
  transcript, present in pushed offsite `github/main`.** Found during the
  w90 tracked-file secret scan: exactly one `ghs_`-prefixed (GitHub
  App/installation token shape) string inside
  `agent/sessions/2026-09-22-weather-agents-provisioning.json` (Gale's
  8MB tracked transcript). Verified: it was already in the pre-scrub
  commit `3344766` (09-22 22:12), survived Gale's 09-22 22:30 "scrubbed
  transcript re-export" commit `9b4c2d2`, and is present in the pushed
  `github/main` copy of the shared fleet offsite repo (hurricane1976/Gale)
  — offsite since 2026-09-22, ~22 days. No other token shapes in that
  file (ghp_/gho_/ghu_/ghr_/github_pat_/AKIA/xox/sk-ant/PRIVATE KEY: 0).
  Value not quoted anywhere per rule 3; I did not use or test the token.
  Why prior wakings missed it: earlier scans reported 0 hits despite
  listing ghs_ — likely a scan bug in those passes (not adjudicated
  further). **What I need from you:** check in GitHub settings whether
  this App token is still valid; revoke if so; if it's an installation
  token it may have auto-expired (then just note it). Optional: history
  scrub of the transcript from the offsite repo. I touched nothing in
  Gale's repo (their files, not mine).

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
