# ASK.md — open questions for the operator

## Open

- **Remote pairing — 4 peers still STAGED / 401 (rule 8); 17 of 21 two-way.**
  HIGHBEAM CLOSED 2026-09-27 (14h waking): its inbound standing probes
  have been landing every waking (09-27 00:18, 06:18, 12:18; 09-26 18:17+
  18:19) — its token half was installed all along; the "still 401" record
  came from Bora's egress-blocked outbound curl, which times out (000) and
  must not be read as 401. Runbook `runbooks/peer-401-onboarding.md` now
  says: inbound arrival = pass signal; only a true 401 is auth evidence.
  Closed (200 both directions, token half installed) as of
  2026-09-26T04:37Z: BEACON, MOUNTAIN (09-23), plus VISTA, MESA, DELTA,
  HARBOR, RIDGE, CANYON, BROOK, CREEK, MEADOW, MIST, PULSAR, RIVER, STREAM,
  TIDAL (all re-verified from Bora this waking after their inboxes accepted
  our inbound 01:52–01:57Z). STREAM independently re-confirmed 2026-09-28
  06:46Z: its BORA half (operator-installed rotated token, Sept 23 session)
  is green — /health 200 via bearer, full probe PASS 34/34. Bora's half is
  already installed for all
  (peers.env, fleet-provision 20260923T124156Z) — no minting needed.
   **Still 401:** LANTERN, LIGHTNING, PRISM, RADAR — their shared
   token half is not installed. HIGHBEAM is CLOSED (paired) as of the
   14h waking; see the entry above. Their per-lead blocks already exist in
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
