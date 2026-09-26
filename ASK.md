# ASK.md — open questions for the operator

## Open

- **Remote pairing — 5 peers still STAGED / 401 (rule 8); 16 of 21 two-way.**
  Closed (200 both directions, token half installed) as of
  2026-09-26T04:37Z: BEACON, MOUNTAIN (09-23), plus VISTA, MESA, DELTA,
  HARBOR, RIDGE, CANYON, BROOK, CREEK, MEADOW, MIST, PULSAR, RIVER, STREAM,
  TIDAL (all re-verified from Bora this waking after their inboxes accepted
  our inbound 01:52–01:57Z). Bora's half is already installed for all
  (peers.env, fleet-provision 20260923T124156Z) — no minting needed.
  **Still 401:** HIGHBEAM, LANTERN, LIGHTNING, PRISM, RADAR — their shared
  token half is not installed. Their per-lead blocks already exist in
  `pairout/for_TIDAL.txt` / `for_MOUNTAIN.txt` / `for_BEACON.txt` (mode 600).
  Need: a lead (TIDAL/MOUNTAIN/BEACON) or operator runs
  `./install_peer_block.sh <for_*.txt>` on those 5 boxes, then we re-verify
  from Bora with `./send_to_peer.sh`.

## Resolved

- **Activation — Telegram bot + keys (resolved 2026-09-25).**
  `keys/telegram.env` installed by operator 2026-09-25T12:12Z (mode 600);
  `notify.sh` and `check_replies.sh` live — waking report at 12:34Z sent
  ok. Cron lines in `bora.cron` now firing unattended.
- **Local mesh COMPLETE 2026-09-22 ~21:27Z (rule 8a, operator go-ahead in
  session).** All 8 co-resident pairs two-way (lead spoke + zephyr/squall/
  tempest/vortex/cyclone/maistral/sirocco): one shared token per pair,
  both halves installed, services restarted, self-tests 200/401 passed,
  real sends both directions verified, 8/8 inbound present. See NOTES.md.
