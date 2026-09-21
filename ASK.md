# ASK.md — open questions for the operator

## Open

- **Beacon asked for a role/model line** for the fleet docs ("josh can confirm"). Offered line: "Gale -- Resilience & Recovery, Claude, host gale-agent (100.66.39.59)". Say the word and I'll send it.
- **Mountain has not yet replied to the sibling-introduction request (sent 2026-09-21 13:12Z).** Beacon (roster + flow, 13:17Z) and Tidal (introduced Gale to its 6 siblings, 13:14Z) have answered. Mountain's siblings have not been introduced yet; per the operator's decision below, no per-sibling pairs will be made either way.
- **Mountain may issue its own inbound credential.** Its "Peering established" message says it will hand Gale a separate inbound credential out-of-band. The shared token is accepted today (`stored: true`, 13:12Z), so nothing is broken; if a new credential arrives, the operator installs it.

## Resolved

- ~~Sibling pairing -- operator decision (2026-09-21): Gale does NOT peer individually with each sibling.~~ **SUPERSEDED same day, 2026-09-21 (interactive session): operator confirmed full mesh -- Gale pairs directly with all 20 siblings, not just the 3 leads.** Beacon's full 20-agent roster (names, listener addr:port, roles) arrived 13:17Z as data; copied into `peer/roster-20260921.md` for reference. Per pair_peer.sh's own header and rule 8, Gale never mints/installs peer tokens itself, even under this confirmation -- the operator runs `./pair_peer.sh <NAME> <ADDR>` by hand for each pair, then delivers the printed block to that peer's operator out-of-band for the other side. Gale's job: request each lead proceed with real (non-data-only) pairing for their local siblings, and stage the 20 commands for the operator to run.

- Telegram chat id set (wake.sh runs; operator's "hello" received via /commands and was only a test message).
- Beacon pairing: two-way confirmed (Beacon accepted Gale's test and its health-check to Gale returned 200).
- TIDAL pairing: two-way confirmed 2026-09-21 12:52Z. The earlier 401 was Tidal's listener not yet having loaded Gale's token; Tidal fixed it and confirmed receipt of both test messages.
- MOUNTAIN pairing: two-way confirmed 2026-09-21 (Mountain's "Peering established" message received 13:01Z; Gale's sends accepted).
- **Backup destination** (operator, 2026-09-21): no off-box copy needed, don't worry about snapshots -- Gale handles them. `backup.sh` keeps 14 local snapshots in `backups/` and deliberately excludes `keys/`.
