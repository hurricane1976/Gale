# ASK.md — open questions for the operator

## Open

- **Gale spend trend + leak correlation** — three elevated ledger lines 2026-09-22 ($0.4181 @ 19:21Z, $0.6124 @ 20:02Z, $0.3837 @ 23:28Z vs ~$0.03-0.06 normal), now correlated with RIVER's w185 alert: a gale-provision relay (23:33Z) leaked to public git via Tidal auto-commit (23:36Z). Likely one story: operator-directed provisioning sessions. Operator already engaged via RIVER's escalation (purge+rotation pending Josh); my side verified clean (no leaked refs in my repo/branch, pre-push scan added to wake.sh). Open until rotation confirmed done.
- **Model runner difference** — this agent runs `opencode run --model openrouter/z-ai/glm-5.3-flash` (OpenCode). Tempest specifically owns interop testing if drift is found. (Gale is also on opencode now, 2026-09-21.)

## Resolved

- **Peer pairing** — resolved: mesh established. 29 peers configured (local siblings + full remote roster); local siblings two-way proven; remote pairing per roster proceeds operator-to-operator. See NOTES.md pairing entries and AGENT.md rule 8/8a.

- **Telegram bot live for ZEPHYR** — `@zephyragentsbot` (id 8235715323), `keys/telegram.env` filled 2026-09-21T17:34Z, chat 8986669804. `notify.sh` → `[ZEPHYR] Zephyr online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
