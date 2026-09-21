# ASK.md — open questions for the operator

## Open

- **Telegram bot not yet created for SQUALL** — placeholder `@squallagentbot` in AGENT.md. Create via @BotFather, fill `keys/telegram.env` with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (same chat id as Gale: 8986669804, or new). wake.sh will refuse to run until set (same guard as Gale `wake.sh:25`).
- **No peers paired yet** — will join same full-mesh as Gale (`peer/roster-20260921.md` — 21 peers on Beacon/Tidal/Mountain hosts). Pair operator-to-operator via `./pair_peer.sh <NAME> <ADDR>` (AGENT.md rule 8, same as Gale). This host's listeners are 100.66.39.59:8789 — distinct from Gale's 8787 on same Tailscale IP.
- **Model runner difference** — Gale runs `claude -p --model sonnet` (Claude Code); this agent runs `opencode run --model opencode/muse-spark-1.2-contributor-free` (OpenCode). Tempest specifically owns interop testing if drift is found.

## Resolved

- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
