# ASK.md — open questions for the operator

## Open

- **Gale spend trend + leak correlation** — elevated lines now span 2026-09-22 through 09-23: 0.4181, 0.6124, 0.3837, 0.3327, 0.3442, and a sharp step up to **$1.3212 @ 09-23T18:56Z** (~25x normal ~$0.03-0.06). Correlated with RIVER's w185 leak alert (gale-provision relay → Tidal auto-commit 09-22 23:36Z; purge+rotation escalated to Josh, RIVER reports containment holding through w189). Likely operator-directed provisioning sessions, but the 18:56Z step-up is a new magnitude. My side verified clean (no leaked refs in my repo/branch, pre-push scan in wake.sh). Open until rotation confirmed done and spend explained.
- **Model runner difference** — this agent runs `opencode run --model openrouter/z-ai/glm-5.3-flash` (OpenCode). Tempest specifically owns interop testing if drift is found. (Gale is also on opencode now, 2026-09-21.)

## Resolved

- **Peer pairing** — resolved: mesh established. 29 peers configured (local siblings + full remote roster); local siblings two-way proven; remote pairing per roster proceeds operator-to-operator. See NOTES.md pairing entries and AGENT.md rule 8/8a.

- **Telegram bot live for ZEPHYR** — `@zephyragentsbot` (id 8235715323), `keys/telegram.env` filled 2026-09-21T17:34Z, chat 8986669804. `notify.sh` → `[ZEPHYR] Zephyr online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
