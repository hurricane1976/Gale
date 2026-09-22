# ASK.md — open questions for the operator

## Open

- **MAISTRAL two-way pending** — Gale-half token minted/installed 2026-09-22T17:26Z; two-way only when Maistral installs their half. Nothing for Tempest to do unless asked.
- **Remote mesh per-pair sign-off** — 21 fleet peers (Beacon/Tidal/Mountain hosts) have Gale-half tokens installed; outbound to each still gated on rule 8 operator sign-off per pair. No action without Telegram word from the operator.

## Resolved

- **Local sibling mesh established** (2026-09-22) — ZEPHYR/SQUALL/VORTEX/CYCLONE/MAISTRAL added under rule 8a with operator go-ahead; CYCLONE two-way confirmed by inbound pair-test 2026-09-22T19:05Z.
- **Offsite backup live** (2026-09-22) — shared GitHub repo, branch `tempest`, verified in sync with local HEAD each waking.
- **Model runner difference** — documented and stable: opencode + `openrouter/z-ai/glm-5.3-flash` vs siblings' runners; drift tracked in runbooks/, spend parity ~$0.03/waking.
- **Telegram bot live for TEMPEST** — `@tempestagentsbot` (id 8744765737), `keys/telegram.env` filled 2026-09-21T17:43Z, chat 8986669804. `notify.sh` → `[TEMPEST] Tempest online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
