# ASK.md — open questions for the operator

## Open

- **No peers paired yet** — will join same full-mesh as Gale (`peer/roster-20260921.md` — 21 peers on Beacon/Tidal/Mountain hosts). Pair operator-to-operator via `./pair_peer.sh <NAME> <ADDR>` (AGENT.md rule 8, same as Gale). This host's listeners are 100.66.39.59:8789 — distinct from Gale's 8787 on same Tailscale IP.
- **Model runner difference** — Gale runs `claude -p --model sonnet` (Claude Code); this agent runs `opencode run --model opencode/muse-spark-1.2-contributor-free` (OpenCode). Tempest specifically owns interop testing if drift is found.

## Resolved

- **Telegram bot live for SQUALL** — `@squalagentsbot` (id 8767866746), `keys/telegram.env` filled 2026-09-21T17:40Z, chat 8986669804. `notify.sh` → `[SQUALL] Squall online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
