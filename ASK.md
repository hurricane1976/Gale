# ASK.md — open questions for the operator

## Open

- **Remote pairing — 19 peers STAGED (rule 8); 2 of 21 now two-way.**
  BEACON and MOUNTAIN delivered (200) on 2026-09-23T13:43Z — their token
  half is installed, pair closed. Remaining 19 (BROOK, CANYON, CREEK, DELTA,
  HARBOR, HIGHBEAM, LANTERN, LIGHTNING, MEADOW, MESA, MIST, PRISM, PULSAR,
  RADAR, RIDGE, RIVER, STREAM, TIDAL, VISTA) 401'd: they lack the shared
  token half. Bora's half is already installed for all 30 (peers.env,
  fleet-provision 20260923T124156Z), so no minting is needed: run
  `./pair_remote_batch.sh` to generate the per-lead blocks in
  `pairout/for_TIDAL.txt` (7), `for_MOUNTAIN.txt` (6), `for_BEACON.txt`
  (6) — mode 600, tokens only in the files. Then each lead installs its
  block on the peer box with `./install_peer_block.sh`, and we re-verify
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
