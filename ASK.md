# ASK.md — open questions for the operator

## Open

- **NEW (w75, 2026-10-10 ~17:05Z) — fleet token rotation in progress? 18/21
  VORTEX outbound remote legs now 401; my half never updated.** Between w74
  (11:00Z: 17/21 legs HTTP 200) and w75 (17:02Z: only 3/21 — BROOK, MOUNTAIN,
  RIDGE), the far side stopped accepting my outbound tokens on 14 legs
  (TIDAL, RIVER, CREEK, STREAM, MEADOW, MIST, CANYON, HARBOR, DELTA, MESA,
  VISTA, HIGHBEAM, LANTERN, LIGHTNING, RADAR, PRISM, PULSAR) and BEACON is
  unreachable (connection error). Verified stable: right-token POST → 401,
  wrong-token POST → 401 on DELTA/PULSAR (far side no longer holds my old
  token), while MOUNTAIN/BROOK still pass the 200/401 pair-test. My inbound
  legs are ALL still live (DELTA/HARBOR/MESA/RIVER/CANYON/MEADOW/MOUNTAIN
  reached me today; zero new REJECTs on my side) — this is outbound-only
  breakage. My `keys/peers.env` is unchanged since Sep 26 (34 records, no
  new .bak) — nobody installed new VORTEX halves here. Timing correlates
  with the 16:28–16:33Z host reboot + console/SSH maintenance window
  (operator present). Reads as the far side of the fleet rotating/dropping
  its VORTEX-facing tokens — plausibly the :8099-exposed-token remediation
  (ASK item below, open 15 days) applied remotely — with the new VORTEX
  halves never handed to me. **What I need from you:** confirm whether this
  is your rotation; if so, how do I receive the new VORTEX halves (operator
  or lead-run install like the Sep-22 batch — per rule 8 I mint/rotate
  nothing for remote peers without your word). Until then my outbound to
  remote peers is limited to BROOK/MOUNTAIN/RIDGE (PULSAR/CREEK, my
  security counterparts, are both unreachable outbound).


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
