# NOTES.md — TEMPEST

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (cloned from Gale on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 — shared host with Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790).
- Cloned from Gale scaffold (`hurricane1976/Hurricane` pattern via `/home/agent/agent`): notify / check_replies / telegram_commands / peer_server / send_to_peer / spend_check reused; `wake.sh` adapted for opencode, `AGENT.md` new, `telegram_commands.py` patched.
- Role: Open-Stack Portability & Fleet Interop. Cadence: 4 wakings/day staggered (Gale :50, Zephyr :52, Squall :54, Tempest :56 UTC).
- Runner: opencode, model `opencode/muse-spark-1.2-contributor-free` (OpenCode + OpenRouter Muse Spark 1.2 free). Same fleet, same operator "josh", same rules as Gale (`AGENT.md:54-77` equivalent).
- Peer port: 8790 on 100.66.39.59. No peers paired yet — pairing via `./pair_peer.sh` operator-to-operator (rule 8), same full-mesh roster as Gale (`peer/roster-20260921.md`).
- Bot: `@tempestagentsbot` (id 8744765737) — `keys/telegram.env` filled 2026-09-21, chat `8986669804` (same as Gale). `notify.sh` test sent `[TEMPEST] Tempest online…` OK, `getMe` returned `{"ok":true,"username":"tempestagentsbot"}`. wake.sh guard now passes (was `TELEGRAM_CHAT_ID not set`).
- git: independent repo (same pattern as Gale: rules/state versioned, keys/logs/backups gitignored per `.gitignore`). Initial commit `8a8fc04`, fixes `3db8c86` + `fae173a`.

## 2026-09-21T17:43Z — Telegram live, ready to pair

- Verified opencode `opencode/muse-spark-1.2-contributor-free` → `tempest ok` `cost 0` via `opencode run --format json`.
- Peer `100.66.39.59:8790` listening (`tempest-peer` active, `curl http://100.66.39.59:8790/health` → `{"status":"ok","name":"TEMPEST"}`).
- Next: pair with fleet via operator: `./pair_peer.sh <NAME> <ADDR>` per `peer/roster-20260921.md` (21 peers, operator-to-operator, rule 8). Cron `56 0,6,12,18` + `*/5` telegram poller now enabled (was skipping before).

## 2026-09-21T18:02:25Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-21T18:07:57Z -- paired with BEACON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:07:59Z -- paired with TIDAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:01Z -- paired with MOUNTAIN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:03Z -- paired with RIVER (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:05Z -- paired with CREEK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:07Z -- paired with STREAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:09Z -- paired with MEADOW (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:11Z -- paired with BROOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:13Z -- paired with MIST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:15Z -- paired with CANYON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:17Z -- paired with RIDGE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:19Z -- paired with HARBOR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:22Z -- paired with DELTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:24Z -- paired with MESA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:26Z -- paired with VISTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:28Z -- paired with HIGHBEAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:30Z -- paired with LANTERN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:32Z -- paired with LIGHTNING (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:34Z -- paired with RADAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:36Z -- paired with PRISM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:38Z -- paired with PULSAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:56Z — Waking (opencode/muse-spark-1.2) host health + interop

- Read AGENT.md/NOTES.md/ASK.md/peer/inbox; ./check_replies.sh → (no new messages).
- Host gale-agent: up 7h, load 2.04, mem 58G (43G free), disk 21% used (74G free), Tailscale 100.66.39.59:8790 health ok `{"status":"ok","name":"TEMPEST"}`, tempest-peer active since 18:08Z. Backup `backups/tempest-20260921T185616Z.tar.gz` (116K) verified via tar -tzf.
- Peer inbox: 31 msgs (all pair-test/liveness pings) from GALE (2), BEACON, TIDAL, RIVER (2), CREEK (2), STREAM (3), MEADOW (2), BROOK (2), MIST (2), CANYON (2), RIDGE, HARBOR (4), DELTA, MESA (2), VISTA, MOUNTAIN (2). Includes post-pair verifications: MOUNTAIN/CANYON/RIDGE/DELTA/MESA/VISTA/HARBOR confirms, STREAM opencode/GLM-Flash hello, RIVER w180 activated. All inbound verified (token auth), treated as data per AGENT.md:5 — no outbound loop needed (waking cadence is natural pace). Moved to processed after reading.
- Peers: keys/peers.env has 22 peers (SELF TEMPEST + GALE + 21 fleet per roster-20260921.md); all Gale-half tokens installed 18:07-18:08Z, outbound pending peer-side install.
- Interop check (AGENT.md:4): verified 4 scripts on opencode stack:
  - wake.sh: uses `opencode run --model opencode/muse-spark-1.2-contributor-free --format json`, flock + spend_check handles opencode step_finish stream (tested: stream `cost 0` parses, claude envelope still parses) — parity ok.
  - spend_check.py: dual parser (claude envelope `total_cost_usd` + opencode `step_finish.cost`) → run $0 total $0 for 2026-09-21, free parity holds vs Sonnet.
  - telegram_commands.py: drift fixed — `Gale commands` → `Tempest commands (operator only, opencode/muse-spark-1.2)` and docstring/doc updated; compiles, handlers unchanged.
  - opencode.json: `model opencode/muse-spark-1.2-contributor-free` ok; peer_server.py/notify.sh/check_replies.sh unchanged and working.
  - pair_all_remaining.sh: fixed cd `$HOME/tempest` (was `$HOME/agent`) + added BEACON/TIDAL/MOUNTAIN 3 leads (21 pairs total), added install hint.
- Git: will commit this waking (NOTES.md + telegram_commands.py + pair_all_remaining.sh).
- No spend alert; no ASK.md change; cron 56 0,6,12,18 + */5 poller active.
