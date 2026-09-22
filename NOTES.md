# NOTES.md — Maistral

Append-only operational log. One entry per waking / per event, newest at
the bottom. Facts with sources; no secrets (rule 3).

## 2026-09-22 -- built and staged (interactive session, Gale-side)

- Operator's 17:05Z word: "I want to create a 7th agent on this box. use
  the others as a guide on what i want. add to the fleet. suggest a role
  and name. i will provide telegram later" — then "i'm good with these
  suggestions" to the MAISTRAL proposal (name Maistral, role Fleet Memory
  & Trend Curation, port 8795, waking :59 of 0/6/12/18, qwen3.8:27b,
  staged-not-installed, pairing staged).
- Built from the cyclone donor kit (same construction as the
  vortex/cyclone onboard 2026-09-22T14:25Z): full standard kit with
  per-agent adaptation — AGENT.md (role + rules; co-resident list names
  all six housemates), ASK.md (activation/bot/pairing open items), this
  NOTES.md, opencode.json (model + permission-deny for all SEVEN keys
  dirs incl. this one), wake.sh (opencode + ollama model, same guards,
  offsite push `main:maistral`), peer_server.py (unchanged),
  notify.sh/spend_check.py/backup.sh/check_replies/_check_replies/
  telegram_commands (UNITS list now all seven peer services),
  pair_peer.sh + rotate_peer.sh + peers_rotate.py (MAISTRAL_NEW_TOKEN
  env var), install_peer_block.sh, send_to_peer.sh, keys/ (peers.env
  with SELF_NAME/SELF_BIND only, 600, gitignored; telegram.env NOT
  created — operator provides the bot later), systemd/maistral-peer.service,
  maistral.cron, runbooks/, peer/roster.
- **Staged, NOT installed** (operator's choice, same as vortex/cyclone):
  the systemd unit and the cron lines sit in the repo, not in
  /etc/systemd or the crontab. `wake.sh` verified to refuse unattended
  runs until keys/telegram.env exists (logs to logs/wake-skipped.log,
  exit 0) — the safe default.
- Port: verified live 8787-8790 (siblings), 8791 firewalla-control +
  8793 fleet-api (localhost-only), 8792 vortex, 8794 cyclone ->
  **8795 Maistral**.
- Model verified same as vortex/cyclone: `ollama/qwen3.8:27b` on the LAN
  Ollama at 192.168.1.197:11434 via the host's global opencode config.
- Ledger scaffold: `ledger/fleet-events.md` created (empty, with format
  header) — the role's primary artifact; first real entries land on the
  first waking once the mesh/API data starts flowing.
- Pairing: nothing run (rule 8/8a). `pair_remote_batch.sh` staged for
  the operator (21 remote); lead spoke via `~/agent/pair_new_siblings.sh
  maistral`; local sibling mesh waits on the operator's rule-8a word per
  pair. keys/peers.env holds SELF_NAME/SELF_BIND only.
- Offsite: pushed to the shared hurricane1976/Gale repo (branch
  `maistral`, same one-repo layout the other six use). Secret-pattern
  scan of the tracked tree clean before push; keys/ gitignored.