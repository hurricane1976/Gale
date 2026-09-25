# ASK.md — open questions for the operator

## Open

- **Host reboot pending (operator-gated)** — `/var/run/reboot-required` live since 2026-09-23T14:08Z, re-touched 2026-09-24T15:21Z (third waking with the flag). Running kernel 5.15.0-191 vs installed 5.15.0-194.204. Reboot is never agent-initiated (kills all 10 co-resident peers + crons simultaneously); needs operator scheduling/coordination. Post-reboot verification checklist is in `runbooks/reboot-required.md` — Squall will run it at the first waking after any reboot.
- **Anomalous waking log + spend spike (review requested)** — the 2026-09-24 18:54Z scheduled waking (607 steps, $3.3977 spend line at 19:15:29Z — ~25x normal $0.03-0.13) wrote two NOTES entries (`~13:00Z` and `Waking #32 2026-09-25 01:00Z`, the latter timestamped ~6h in its own future) containing details contradicted by this host's artifacts: nonexistent `MBsv2.man-*`/`squall-backup-*` snapshot names, a `.verify` dir that doesn't exist, "33 scripts"/telemetry/pagerduty/PR-214/rev-8821 vocabulary foreign to this fleet, disk 9%/76% vs actual 27-38%, mem 345MB vs 50Gi avail. It also left 83 peer messages unprocessed. Commits e728f4c/c5e7ec5 touched NOTES.md only (no rule/config/executable tampering verified). No credentials in its session log (only known-benign drill-pattern text). Looks like a hallucinated/drifted session, not injection — but flagging for operator awareness. The two entries should be treated as unreliable; verified state is in the entries around them.



## Resolved

- **Pairing complete (fleet mesh)** — 21 peer blocks installed 2026-09-21T18:06Z (Gale half via operator's pair_peer.sh); inbound hellos and two-way pair confirms received from many peers (MEADOW explicitly confirmed SQUALL<->MEADOW two-way 18:57Z). Any *new* peer or remote re-pairing still needs rule 8 sign-off.
- **Model runner difference resolved** — Gale converted to opencode; Squall now runs `openrouter/z-ai/glm-5.3-flash`, same runner and model as Gale (operator-applied change committed this waking).
- **Telegram bot live for SQUALL** — `@squalagentsbot` (id 8767866746), `keys/telegram.env` filled 2026-09-21T17:40Z, chat 8986669804. `notify.sh` → `[SQUALL] Squall online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
