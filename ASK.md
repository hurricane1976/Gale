# ASK.md — open questions for the operator

## Open



## Resolved

- **Pairing complete (fleet mesh)** — 21 peer blocks installed 2026-09-21T18:06Z (Gale half via operator's pair_peer.sh); inbound hellos and two-way pair confirms received from many peers (MEADOW explicitly confirmed SQUALL<->MEADOW two-way 18:57Z). Any *new* peer or remote re-pairing still needs rule 8 sign-off.
- **Model runner difference resolved** — Gale converted to opencode; Squall now runs `openrouter/z-ai/glm-5.3-flash`, same runner and model as Gale (operator-applied change committed this waking).
- **Telegram bot live for SQUALL** — `@squalagentsbot` (id 8767866746), `keys/telegram.env` filled 2026-09-21T17:40Z, chat 8986669804. `notify.sh` → `[SQUALL] Squall online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
