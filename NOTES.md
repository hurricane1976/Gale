# NOTES.md — Vortex

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
  includes Cyclone), `ASK.md`, this NOTES, `opencode.json` (model
  `ollama/qwen3.8:27b`; permission-denied: all six agents' keys/ dirs),
  `wake.sh` (opencode runner, 45m guard, flock, spend record, shell-side
  alert, offsite push to `github main:vortex`), `peer_server.py`
  (unchanged from siblings; binds `SELF_BIND=100.66.39.59:8792` from
  `keys/peers.env`), `notify.sh` (`[VORTEX]` prefix), `spend_check.py`,
  `backup.sh`, `check_replies.sh` + `_check_replies.py`,
  `telegram_commands.sh` + `telegram_commands.py` (UNITS list extended to all
  six peer services), `pair_peer.sh` (restarts `vortex-peer`),
  `rotate_peer.sh` + `peers_rotate.py` (service name fixed to `vortex-peer` —
  the squall donor copy still hardcoded `gale-peer`),
  `install_peer_block.sh`, `send_to_peer.sh`, `.gitignore`,
  `keys/peers.env.example` + `keys/telegram.env.example`,
  `peer/roster-20260921.md`, `runbooks/`.
- `keys/peers.env` created (600, gitignored): SELF_NAME=VORTEX,
  SELF_BIND=100.66.39.59:8792, **no peer blocks yet** — pairing is staged,
  not run (rule 8). No `keys/telegram.env` yet (bot placeholder).
- Staged, NOT installed (operator's choice): `systemd/vortex-peer.service`,
  `vortex.cron` (`58 0,6,12,18 * * *` waking — after Tempest's :56; plus the
  5-minute telegram poller line). Activation commands in ASK.md.
- Ports verified live before build: 8787-8790 taken by gale/zephyr/squall/
  tempest (tailnet-only), 8791 firewalla-control + 8793 fleet-api
  (localhost-only) — hence 8792 for Vortex and 8794 for Cyclone.
  (The design session's question text said "8791/8792"; 8791 turned out to
  be taken, noted here so the record is honest.)
- Model verified live: `opencode run --model ollama/qwen3.8:27b` smoke run
  answered in ~0.3s, cost $0 (LAN Ollama at 192.168.1.197:11434, provider
  already defined in the host's global opencode config).
- Pairing staged: `./pair_remote_batch.sh` (21 remote peers, rule 8,
  operator-run); local sibling pairs handled by `~/agent/pair_new_siblings.sh
  vortex` + `~/agent/pair_siblings.sh vortex cyclone` (also operator-run).
- Git: new repo, branch `main`, author "VORTEX Agent <agent@vortex.local>".
  Remote `github` -> shared fleet offsite repo (hurricane1976/Gale, branch
  `vortex`), same write-enabled deploy key as the other four agents
  (one-repo layout, operator-chosen 2026-09-22).
- Next: operator activation (ASK.md), first waking after the Telegram bot
  exists, pairing runs, then normal routine.
