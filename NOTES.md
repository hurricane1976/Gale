# NOTES.md — Cyclone

## 2026-09-22T14:25Z -- installed (operator-directed interactive session)

- Context: operator asked 13:52Z to "build me 2 more agents" on this box; the
  design session (opencode, ollama qwen3.8:latest) produced the proposals and
  the operator's answers, then disconnected mid-build with nothing created.
  This session resumed and completed the build. Decisions on the record:
  Vortex = Security Sentinel & Threat Forensics, Cyclone = Production &
  Fleet Ops; both run `ollama/qwen3.8:27b` via opencode (first non-OpenRouter
  agents on this host — deliberate interop data point); full standard kit,
  **staged for operator to enable**; Gale's onboarding scope = prep + full
  pairing staging (42 remote pair commands, operator-executed).
- Kit (all files in this repo, mirrored from the squall/zephyr/tempest kit
  with per-agent adaptation): `AGENT.md` (role + rules, co-resident list now
  includes Vortex), `ASK.md`, this NOTES, `opencode.json` (model
  `ollama/qwen3.8:27b`; permission-denied: all six agents' keys/ dirs),
  `wake.sh` (opencode runner, 45m guard, flock, spend record, shell-side
  alert, offsite push to `github main:cyclone`), `peer_server.py`
  (unchanged from siblings; binds `SELF_BIND=100.66.39.59:8794` from
  `keys/peers.env`), `notify.sh` (`[CYCLONE]` prefix), `spend_check.py`,
  `backup.sh`, `check_replies.sh` + `_check_replies.py`,
  `telegram_commands.sh` + `telegram_commands.py` (UNITS list extended to all
  six peer services), `pair_peer.sh` (restarts `cyclone-peer`),
  `rotate_peer.sh` + `peers_rotate.py` (service name fixed to `cyclone-peer`,
  token env `CYCLONE_NEW_TOKEN` — the squall donor copy still hardcoded
  `gale-peer`/`GALE_NEW_TOKEN`), `install_peer_block.sh`, `send_to_peer.sh`,
  `.gitignore`, `keys/peers.env.example` + `keys/telegram.env.example`,
  `peer/roster-20260921.md`, `runbooks/`.
- `keys/peers.env` created (600, gitignored): SELF_NAME=CYCLONE,
  SELF_BIND=100.66.39.59:8794, **no peer blocks yet** — pairing is staged,
  not run (rule 8). No `keys/telegram.env` yet (bot placeholder).
- Staged, NOT installed (operator's choice): `systemd/cyclone-peer.service`,
  `cyclone.cron` (`0 1,7,13,19 * * *` waking — ":00 past" the hour after
  Vortex's :58; plus the 5-minute telegram poller line). Activation commands
  in ASK.md.
- Ports verified live before build: 8787-8790 taken by gale/zephyr/squall/
  tempest (tailnet-only), 8791 firewalla-control + 8793 fleet-api
  (localhost-only), 8792 Vortex — hence 8794 for Cyclone. (The design
  session's question text said "8791/8792"; 8791 turned out to be taken,
  noted here so the record is honest.)
- Model verified live: `opencode run --model ollama/qwen3.8:27b` smoke run
  answered in ~0.3s, cost $0 (LAN Ollama at 192.168.1.197:11434, provider
  already defined in the host's global opencode config).
- Pairing staged, matching this host's house pattern (every agent pairs the
  lead + the full remote fleet; sibling↔sibling pairs stay unestablished,
  same as Zephyr/Squall/Tempest): `./pair_remote_batch.sh` (21 remote
  peers) + `~/agent/pair_new_siblings.sh cyclone` (Gale lead spoke). 22
  pairings total, all rule-8 gated, operator-run. Sibling↔sibling pairs are
  NOT staged (would each need a per-pair rule-8a go-ahead; tooling exists at
  `~/agent/pair_siblings.sh`).
- Git: new repo, branch `main`, author "CYCLONE Agent <agent@cyclone.local>".
  Remote `github` -> shared fleet offsite repo (hurricane1976/Gale, branch
  `cyclone`), same write-enabled deploy key as the other four agents
  (one-repo layout, operator-chosen 2026-09-22).
- Next: operator activation (ASK.md), first waking after the Telegram bot
  exists, pairing runs, then normal routine.

## 2026-09-22T15:26:52Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:27:17Z -- paired with VORTEX (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:27:26Z -- paired with ZEPHYR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:30Z -- paired with SQUALL (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:34Z -- paired with TEMPEST (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:35Z -- local mesh complete; service + cron live

- Operator's rule-8a go-ahead (via gale, who executed on our behalf per the
  operator's delegation "gale should be able to set up their peer links,
  comms"): ALL four sibling pairs confirmed two-way (GALE, ZEPHYR, SQUALL,
  TEMPEST, VORTEX) — the "peer side pending" notes above are now complete.
- `systemd/cyclone-peer.service` enabled+running by the operator;
  `cyclone.cron` in the live crontab: wake at :00 of 1/7/13/19 UTC (4/day)
  + telegram_commands poll every 5 min.
- Remote pairings (21): gale-host halves INSTALLED + self-tested
  2026-09-22 (operator sign-off in chat); see the follow-up entry
  below. Remote halves await the lead-side installs; two-way
  checks pending per peer.

## 2026-09-22T15:56:32Z -- paired with TIDAL (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:36Z -- paired with RIVER (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:40Z -- paired with CREEK (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:44Z -- paired with STREAM (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:48Z -- paired with MEADOW (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:52Z -- paired with BROOK (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:56Z -- paired with MIST (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:01Z -- paired with MOUNTAIN (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:05Z -- paired with CANYON (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:09Z -- paired with RIDGE (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:13Z -- paired with HARBOR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:17Z -- paired with DELTA (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:21Z -- paired with MESA (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:25Z -- paired with VISTA (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:29Z -- paired with BEACON (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:34Z -- paired with HIGHBEAM (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:38Z -- paired with LANTERN (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:42Z -- paired with LIGHTNING (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:46Z -- paired with RADAR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:50Z -- paired with PRISM (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:54Z -- paired with PULSAR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T16:01Z -- 21 REMOTE pairings: gale-host halves INSTALLED + self-tested

- Operator sign-off given in-chat (2026-09-22, "run the batch, hand me
  pastable scripts per lead" = per-pair rule-8 authorizations for this
  agent's 21 remote peers). All 21 pair_peer.sh runs passed self-test
  (200 right-token / 401 wrong-token).
- Pair test to each of the 21 from this agent: HTTP 401 as expected until
  the remote halves install (far side pending).
- Deliverables: /home/agent/agent/peer/outbound/install-blocks-
  (tidal-host|mountain-host|beacon-side)-VORTEX-CYCLONE.txt (git-ignored;
  tokens on disk only, mode 600). Operator pastes each into that cluster's
  lead window (TIDAL / MOUNTAIN / BEACON). Lead-side instructions cover:
  install both blocks for each of the 7 agents, restart, self-test,
  two-way check, NOTES entry, stop+report on any non-200/401 result.
- Two-way completes only at the far side; as each confirmation lands,
  record it here.
