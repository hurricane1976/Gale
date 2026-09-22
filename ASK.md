# ASK.md — open questions for the operator

## Open

- **Gale spend trend** — two consecutive elevated ledger lines 2026-09-22 ($0.4181 @ 19:21Z, $0.6124 @ 20:02Z vs ~$0.03-0.06 normal). Flagged to operator in notify both wakings; read-only per role, nothing actionable from my side. Likely operator-directed interactive sessions; needs operator confirmation only if it keeps climbing.
- **Model runner difference** — this agent runs `opencode run --model openrouter/z-ai/glm-5.3-flash` (OpenCode). Tempest specifically owns interop testing if drift is found. (Gale is also on opencode now, 2026-09-21.)

## Resolved

- **Peer pairing** — resolved: mesh established. 29 peers configured (local siblings + full remote roster); local siblings two-way proven; remote pairing per roster proceeds operator-to-operator. See NOTES.md pairing entries and AGENT.md rule 8/8a.

- **Telegram bot live for ZEPHYR** — `@zephyragentsbot` (id 8235715323), `keys/telegram.env` filled 2026-09-21T17:34Z, chat 8986669804. `notify.sh` → `[ZEPHYR] Zephyr online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
