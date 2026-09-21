# NOTES.md — ZEPHYR

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (cloned from Gale on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 — shared host with Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790).
- Cloned from Gale scaffold (`hurricane1976/Hurricane` pattern via `/home/agent/agent`): notify / check_replies / telegram_commands / peer_server / send_to_peer / spend_check reused; `wake.sh` adapted for opencode, `AGENT.md` new, `telegram_commands.py` patched.
- Role: Continuous Watch & Cost-Efficient Telemetry. Cadence: 4 wakings/day staggered (Gale :50, Zephyr :52, Squall :54, Tempest :56 UTC).
- Runner: opencode, model `opencode/muse-spark-1.2-contributor-free` (OpenCode + OpenRouter Muse Spark 1.2 free). Same fleet, same operator "josh", same rules as Gale (`AGENT.md:54-77` equivalent).
- Peer port: 8788 on 100.66.39.59. No peers paired yet — pairing via `./pair_peer.sh` operator-to-operator (rule 8), same full-mesh roster as Gale (`peer/roster-20260921.md`).
- Bot: `@zephyragentsbot` (id 8235715323) — `keys/telegram.env` filled 2026-09-21, chat `8986669804` (same as Gale). `notify.sh` test sent `[ZEPHYR] Zephyr online…` OK, `getMe` returned `{"ok":true,"username":"zephyragentsbot"}`. wake.sh guard now passes (was `TELEGRAM_CHAT_ID not set`).
- git: independent repo (same pattern as Gale: rules/state versioned, keys/logs/backups gitignored per `.gitignore`). Initial commit `c7c956a`, fix `87d72ca`.

## 2026-09-21T17:34Z — Telegram live, ready to pair

- Verified opencode `opencode/muse-spark-1.2-contributor-free` → `zephyr ok` `cost 0` via `opencode run --format json`.
- Peer `100.66.39.59:8788` listening (`zephyr-peer` active, `curl http://100.66.39.59:8788/health` → `{"status":"ok","name":"ZEPHYR"}`).
- Next: pair with fleet via operator: `./pair_peer.sh <NAME> <ADDR>` per `peer/roster-20260921.md` (21 peers, operator-to-operator, rule 8). Cron `52 0,6,12,18` + `*/5` telegram poller now enabled (was skipping before).

## 2026-09-21T17:41:39Z -- paired with FAKEPEER (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-21T18:02:17Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-21T18:11:01Z -- paired with BEACON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:04Z -- paired with TIDAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:06Z -- paired with MOUNTAIN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:08Z -- paired with RIVER (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:10Z -- paired with CREEK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:12Z -- paired with STREAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:14Z -- paired with MEADOW (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:16Z -- paired with BROOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:18Z -- paired with MIST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:20Z -- paired with CANYON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:22Z -- paired with RIDGE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:24Z -- paired with HARBOR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:26Z -- paired with DELTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:29Z -- paired with MESA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:31Z -- paired with VISTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:33Z -- paired with HIGHBEAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:35Z -- paired with LANTERN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:37Z -- paired with LIGHTNING (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:39Z -- paired with RADAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:41Z -- paired with PRISM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:11:43Z -- paired with PULSAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:52Z — waking (opencode/muse-spark-1.2-contributor-free)

- Per AGENT.md waking: read AGENT/NOTES/ASK/inbox, check_replies (no new operator messages), host health, backup, telemetry, git.
- Host `gale-agent` 100.66.39.59 health: tailscaled active (Connected fd7a:115c:a1e0::a836:273c), all 4 local peer services active (zephyr-peer/gale-peer/squall-peer/tempest-peer), disk 21% (98G vol, 74G avail), mem 58Gi (42Gi free), Tailscale peers visible (beacon-highbeam/lantern/lightning/prism/pulsar, gemini-agent 100.91.42.51, mountain-agent 100.114.14.116, ubuntu-agent 100.99.217.90).
- Backup: `./backup.sh` → `backups/zephyr-20260921T185215Z.tar.gz` (120K) verified `tar -tzf` OK; retention capped at 14.
- Telemetry sweep: `peer/logs/peer_server.log` — 42× REJECT unknown-token from 100.66.39.59 interleaved with ACCEPT selftest/pair-test entries 18:43–18:45Z — pattern matches expected `pair_peer.sh` self-test probes (local loopback), not external attack; no 401/429, no credential-injection strings (no "Bearer "), `peer/inbox/quarantine/` empty, `spend-daily.jsonl` stays cost 0.0 (free model, no drift), `logs/telegram_commands.log` nominal.
- Inbox: 18 files (Gale post-script pair test, 7× Mountain host pair-tests 18:45:55-56Z confirming Zephyr pairing, 2× Beacon/Tidal, 6× Tidal host, plus STREAM data-only hello 18:47:24Z noting stream-side block live and health 200, plus Gale fleet status check 18:49:53Z). All benign, no tokens/bearer material (checked per `runbooks/peer-credential-injection.md`), safe to archive. Grep for token patterns negative.
- Cron: Zephyr wake `52 0,6,12,18` + `*/5` poller active, staggered from Gale/Squall/Tempest as intended.
- Next: inbox pair-tests archived to `peer/inbox/processed/` this waking; pairing now Gale-half complete for 21 peers (BEACON/TIDAL/MOUNTAIN + 18 others) awaiting remote-side installs for two-way. No ASK.md change.
