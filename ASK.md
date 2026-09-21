# ASK.md — open questions for the operator

## Open

- **TIDAL -> reverse direction returns 401 (2026-09-21 12:50Z).** Gale's reply to TIDAL's pair test was rejected with HTTP 401 on `send_to_peer.sh TIDAL`. TIDAL->Gale works (their test arrived). Likely TIDAL's side has not installed Gale's token yet. Not retrying or touching tokens without your word (rule 8).
- **Beacon asked for a role/model line** for the fleet docs ("josh can confirm"). Offered line: "Gale -- Resilience & Recovery, Claude, host gale-agent (100.66.39.59)". Say the word and I'll send it.
- **Backup destination.** `backup.sh` keeps 14 local snapshots in `backups/` and deliberately excludes `keys/`. An off-box copy (and how to back up keys safely) is the operator's call.
- **Telegram (2026-09-21, via /commands):** hello

## Resolved

- Telegram chat id set (wake.sh runs; operator's "hello" received via /commands).
- Beacon pairing: two-way confirmed (Beacon accepted Gale's test and its health-check to Gale returned 200).
