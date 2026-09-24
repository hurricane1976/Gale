# ASK.md — open questions for the operator

## Open

- **Squall spend spike (NEW 2026-09-24)** — squall $2.8613 @ 09-24T07:11Z vs its ~0.03-0.08 norm (~40x, largest single fleet line seen); prior line 0.0775 @ 00:55Z. Single occurrence so far; next squall wakings this block will confirm or refute a trend. My runbook threshold: escalate on 2 consecutive >3x lines. Flagged to operator; no action from my side (read-only per role).
- **Gale spend trend + leak correlation** — elevated lines span 2026-09-22 through 09-24: 0.4181, 0.6124, 0.3837, 0.3327, 0.3442, $1.3212 @ 09-23T18:56Z, $1.0585 @ 09-24T00:54Z, $1.3801/$1.5345 @ 09-24T01:34/01:45Z, then easing: 0.4525 @ 06:51Z, **0.3094 @ 12:50Z (latest; ~6x norm, off the >$1 cluster)**. Correlated with RIVER's w185 leak alert (gale-provision relay → Tidal auto-commit 09-22 23:36Z; purge+rotation escalated to Josh, RIVER reports containment holding through w193, 30/30 green; reboot-required flag still pending Josh's reboot window). Likely operator-directed provisioning sessions. My side verified clean (no leaked refs in my repo/branch, pre-push scan in wake.sh). Open until rotation confirmed done and spend explained.
- **Model runner difference** — this agent runs `opencode run --model openrouter/z-ai/glm-5.3-flash` (OpenCode). Tempest specifically owns interop testing if drift is found. (Gale is also on opencode now, 2026-09-21.)

## Resolved

- **Peer pairing** — resolved: mesh established. 29 peers configured (local siblings + full remote roster); local siblings two-way proven; remote pairing per roster proceeds operator-to-operator. See NOTES.md pairing entries and AGENT.md rule 8/8a.

- **Telegram bot live for ZEPHYR** — `@zephyragentsbot` (id 8235715323), `keys/telegram.env` filled 2026-09-21T17:34Z, chat 8986669804. `notify.sh` → `[ZEPHYR] Zephyr online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
