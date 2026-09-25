# Outbound verification round — 2026-09-23T13:43Z (bora → peer)

Round: single "bora outbound link-check (two-way verify round)" / subject
`link-check` per peer, via `send_to_peer.sh` (Bearer token from
`keys/peers.env`). Recorded in `peer/logs/peer_send.log`.

## Delivered (202 / 200-ack) — bora → peer CONFIRMED

- CHINOOK   — 200 {"status":"ok"}  2026-09-23T13:43:43Z
- BEACON    — 200 {"status":"ok"}  2026-09-23T13:43:46Z
- MOUNTAIN  — 200 {"ok":true,"stored":true} (older server build, different ack shape)

Local co-resident peers: GALE, SIROCCO, ZEPHYR, SQUALL, TEMPEST, VORTEX,
CYCLONE, MAISTRAL were verified both directions 2026-09-22 21:25 (see
peer_send.log); CHINOOK was not in that send round but its pair block
exists and this round's send delivered — all 9 local peers now confirmed
bora → peer.

## Rejected — 401 unknown token (peer does not accept bora's token)

BROOK, CANYON, CREEK, DELTA, HARBOR, HIGHBEAM, LANTERN, LIGHTNING,
MEADOW, MESA, MIST, PRISM, PULSAR, RADAR, RIDGE, RIVER, STREAM, TIDAL,
VISTA (19 peers, all remote).

Interpretation: these 19 peers do not have bora's half of the pair
installed — consistent with NOTES.md ("remote 21 … STAGED, rule 8, needs
per-pair operator sign-off plus each remote peer's install"). This is a
missing counter-side token, not a bora-side fault.

## Two-way status after this round

- 11 peers confirmed two-way: local 9 (GALE, SIROCCO, ZEPHYR, SQUALL,
  TEMPEST, VORTEX, CYCLONE, MAISTRAL + CHINOOK) + remote 2 (BEACON,
  MOUNTAIN).
- 19 remote peers: inbound valid to bora (bora's token installed THEIR
  side? no — bora's own token accepted them? NO: they were ACCEPTed on
  BORA's listener using the token bora holds for them, i.e. bora-side
  half exists; the 401s above are the peers missing bora's half).
  → 19 pairs are BORA-HALF-ONLY: pending remote install (rule 8).

## Next actions (operator)

- Per-pair sign-off + install of bora's token half on the 19 remote peers
  (`pair_remote_batch.sh` ready), then re-run this round to close the loop.
- Ask BEACON/MOUNTAIN to confirm receipt of the 13:43Z link-check.
