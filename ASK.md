# ASK.md — open questions for the operator

## Open

- **Host reboot pending (operator-gated)** — `/var/run/reboot-required` live since 2026-09-23T14:08Z, re-touched 2026-09-24T15:21Z (**fourth waking with the flag**, unchanged since 15:21Z). Running kernel 5.15.0-191 vs installed 5.15.0-194.204. Reboot is never agent-initiated (kills all 10 co-resident sibling peers + crons simultaneously — host inventory now 11 agents incl. new TRAMONTANE on 8791); needs operator scheduling/coordination. Post-reboot verification checklist is in `runbooks/reboot-required.md` — Squall will run it at the first waking after any reboot.
- **Anomalous waking logs + spend spikes, THREE sessions (review requested)** — updated 2026-09-25T06:40Z after ledger↔entry reconciliation (procedure now in `runbooks/mangled-rules.md`). 2026-09-24 had three suspect sessions, not one: (a) **07:11:09Z spend $2.8613 (~25x normal $0.03-0.13) with NO NOTES entry and NO commit — silent expensive session**, newly found this waking; (b) 12:56:53Z session (commit e728f4c, normal spend $0.1329) wrote the fabricated `~13:00Z` NOTES entry (nonexistent `MBsv2.man-*`/`squall-backup-*` snapshot names, nonexistent `.verify` dir, "33 scripts"/telemetry/pagerduty/PR-214/rev-8821 vocabulary, disk 9%/76% vs actual 27-38%, mem 345MB vs 50Gi avail — note: low spend does NOT certify an entry); (c) 19:15:08Z session (commit c5e7ec5, spend $3.3977, 607 steps, 18:54→19:15Z) wrote the fabricated "Waking #32 2026-09-25 01:00Z" entry timestamped ~6h in its own future. It also left 83 peer messages unprocessed. All three commits touched NOTES.md only (no rule/config/executable tampering verified; the backups those sessions actually created, `squall-20260924T125619Z.tar.gz`/`squall-20260924T190517Z.tar.gz`, are valid archives — artifact lies, not artifact corruption). No credentials in any session log. Looks like hallucinated/drifted sessions, not injection — but flagging for operator awareness. The three entries should be treated as unreliable; verified state is in the entries around them.



## Resolved

- **Pairing complete (fleet mesh)** — 21 peer blocks installed 2026-09-21T18:06Z (Gale half via operator's pair_peer.sh); inbound hellos and two-way pair confirms received from many peers (MEADOW explicitly confirmed SQUALL<->MEADOW two-way 18:57Z). Any *new* peer or remote re-pairing still needs rule 8 sign-off.
- **Model runner difference resolved** — Gale converted to opencode; Squall now runs `openrouter/z-ai/glm-5.3-flash`, same runner and model as Gale (operator-applied change committed this waking).
- **Telegram bot live for SQUALL** — `@squalagentsbot` (id 8767866746), `keys/telegram.env` filled 2026-09-21T17:40Z, chat 8986669804. `notify.sh` → `[SQUALL] Squall online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
