# NOTES.md — SQUALL

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (cloned from Gale on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 — shared host with Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790).
- Cloned from Gale scaffold (`hurricane1976/Hurricane` pattern via `/home/agent/agent`): notify / check_replies / telegram_commands / peer_server / send_to_peer / spend_check reused; `wake.sh` adapted for opencode, `AGENT.md` new, `telegram_commands.py` patched.
- Role: Adversarial Verification & Recovery Drills. Cadence: 4 wakings/day staggered (Gale :50, Zephyr :52, Squall :54, Tempest :56 UTC).
- Runner: opencode, model `opencode/muse-spark-1.2-contributor-free` (OpenCode + OpenRouter Muse Spark 1.2 free). Same fleet, same operator "josh", same rules as Gale (`AGENT.md:54-77` equivalent).
- Peer port: 8789 on 100.66.39.59. No peers paired yet — pairing via `./pair_peer.sh` operator-to-operator (rule 8), same full-mesh roster as Gale (`peer/roster-20260921.md`).
- Bot: `@squalagentsbot` (id 8767866746) — `keys/telegram.env` filled 2026-09-21, chat `8986669804` (same as Gale). `notify.sh` test sent `[SQUALL] Squall online…` OK, `getMe` returned `{"ok":true,"username":"squalagentsbot"}`. wake.sh guard now passes (was `TELEGRAM_CHAT_ID not set`).
- git: independent repo (same pattern as Gale: rules/state versioned, keys/logs/backups gitignored per `.gitignore`). Initial commit `0b376e6`, fix `d89fc05`.

## 2026-09-21T17:40Z — Telegram live, ready to pair

- Verified opencode `opencode/muse-spark-1.2-contributor-free` → `squall ok` `cost 0` via `opencode run --format json`.
- Peer `100.66.39.59:8789` listening (`squall-peer` active, `curl http://100.66.39.59:8789/health` → `{"status":"ok","name":"SQUALL"}`).
- Next: pair with fleet via operator: `./pair_peer.sh <NAME> <ADDR>` per `peer/roster-20260921.md` (21 peers, operator-to-operator, rule 8). Cron `54 0,6,12,18` + `*/5` telegram poller now enabled (was skipping before).

## 2026-09-21T18:02:21Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-21T18:06:19Z -- paired with BEACON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:21Z -- paired with TIDAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:23Z -- paired with MOUNTAIN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:25Z -- paired with RIVER (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:27Z -- paired with CREEK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:29Z -- paired with STREAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:31Z -- paired with MEADOW (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:34Z -- paired with BROOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:36Z -- paired with MIST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:38Z -- paired with CANYON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:40Z -- paired with RIDGE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:42Z -- paired with HARBOR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:44Z -- paired with DELTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:46Z -- paired with MESA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:48Z -- paired with VISTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:50Z -- paired with HIGHBEAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:52Z -- paired with LANTERN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:54Z -- paired with LIGHTNING (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:56Z -- paired with RADAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:58Z -- paired with PRISM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:07:01Z -- paired with PULSAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.
## 2026-09-21T18:54Z — waking (scheduled :54, opencode/muse-spark-1.2)

- Per-waking routine via `wake.sh` / `AGENT.md:92-98`. Host health (drill lens): `tailscaled` active (100.66.39.59), `squall-peer` 8789 OK, siblings 8787 GALE OK / 8788 ZEPHYR OK / 8790 TEMPEST OK, `cron` active, disk 21% (98G 20G used /74G avail), mem 58G avail 54G, no `/var/run/reboot-required`, `AGENT.md` intact (rule/rules sections present).
- Backup: `./backup.sh` → `backups/squall-20260921T185420Z.tar.gz` (116K), `tar -tzf` read-back OK. Retains 2/14. Excludes `keys/` `logs/` `backups/` verified (only `.git/logs` and `peer/logs` remain as expected).
- Restore drill: extracted latest tar to `mktemp -d /tmp/squall-restore-*`, diff `AGENT.md`/`NOTES.md`/`peer/roster-20260921.md` round-trip OK (zero diff), `runbooks/` present, cleaned `rm -rf`. Never restored over live state (AGENT.md 2.1).
- Fault injection (safe, reversible, AGENT.md 2.2): disk-pressure sim `dd 10M /tmp/squall-diskpressure-*` + cleanup → avail unchanged 21%; mangled-rules detection `AGENT.md` contains `## The rules` and `## Your role` → pass; `peer_server` 401 replay not needed (runbooks/peer-401.md covers); reboot-required flag check → absent.
- Spend: `spend_check.py` 2026-09-21 total $0.0000 (free tier), drill cost 0, OK.
- Peers: inbox 28 files reviewed (27 `peer/inbox/*.json` + 0 processed + 0 quarantine) — all pair-test / liveness / link-verification hellos from GALE, BEACON, TIDAL, RIVER/CREEK/STREAM/MEADOW/BROOK/MIST/CANYON/RIDGE/HARBOR/DELTA/MESA/VISTA etc. No `Bearer` tokens, no credential-injection pattern (cf. `runbooks/peer-credential-injection.md`). Treated as data per AGENT.md rule 5. No new operator Telegram (`./check_replies.sh` → no new messages). Will move processed entries to `peer/inbox/processed/` to avoid reprocessing.
- Pairing: local `keys/peers.env` has Gale half for 21 peers (BEACON/TIDAL/MOUNTAIN + 18 roster entries) installed 18:06Z; inbound hellos post-18:32Z from RIVER, STREAM (:8790 Opencode/GLM-Flash), BROOK, etc. confirm some remote halves now live. Outbound still `outbound untested` until operator confirms two-way — no token mint/rotate (AGENT.md rule 8) and no file edits outside `/home/agent/squall`.
- `pair_all_remaining.sh` fix (cd `~/squall` not `~/agent`, include 3 leads BEACON/TIDAL/MOUNTAIN) validated here and committed this waking — operator batch pair helper now correct for SQUALL host.
- Next waking: continue backup/restore cadence; watch for operator pairing confirmations for two-way.


