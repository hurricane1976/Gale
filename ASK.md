# ASK.md — open questions for the operator

## Open

- **Rule-3 exposure: live peer tokens were pushed to the github remote
  (found + contained 2026-09-29 02h waking; operator action needed).**
  `pairout/for_{BEACON,MOUNTAIN,TIDAL}.txt` (each holds 6-7 shared peer
  tokens, 64-hex, for pairings all verified two-way as of 09-28) were
  committed at `9001168` (2026-09-25) and that commit is on the remote
  branch `github/bora` of `hurricane1976/Gale.git`. Rule 3 requires
  credentials "out of git".
  **Contained (Bora side, reversible):** `git rm --cached` on all 3 +
  `pairout/` added to `.gitignore`. Files remain on disk, mode 600.
  **NOT done (both need operator direction, rules 8/9-adjacent +
  irreversibility):**
  1. History rewrite on github (`git filter-repo`/BFG on the `bora`
     branch + force-push) — irreversible, affects shared repo.
  2. Token rotation for the exposed pairs — minting/rotation is
     operator-gated (rule 8). If the repo is private and access is
     limited to known fleet principals, operator may judge the
     exposure acceptable and opt for contain-and-move-on.
  Recommendation: (1) + (2), then shred the `pairout/` files locally
  (their jobs are done — all 3 leads' pairs are closed). Awaiting word.

## Resolved

- **Remote pairing — CLOSED 21/21 outbound 2026-09-28 ~19:35Z (rule 8b scope, operator Telegram 1790623763).**
  LANTERN, LIGHTNING, PRISM, RADAR installed far-side by the operator;
  `./send_to_peer.sh` pair-test accepted (200) on all 4 from Bora. Mesh
  17/21 → 21/21 outbound. Inbound close-out (their pair-tests on their
  cadence) pending; same shared tokens, so no new gaps expected. Prior
  history kept below for the record.
- **Remote pairing — 4 peers STAGED / 401 (rule 8); was 17 of 21 (history).**
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
   14h waking; see the entry above.
   Re-verified 2026-09-28 14h (probe via urllib, 8s timeout): all 4 return
   a TRUE HTTP 401 (auth reject), not a 000/timeout — so this is a genuine
   peer-side gap, not Bora's egress block. TRAMONTANE's 09-25 "token
   reloaded" restart did NOT clear them.
   CORRECTION (2026-09-28): earlier note said their per-lead blocks already
   existed in `pairout/`. `pairout/` holds only BEACON/MOUNTAIN/TIDAL (all
   already closed) + the 4 holdouts have NO block file there — so the blocks
   must be generated + delivered, not just installed. Bora's own half IS in
   `keys/peers.env` (all 34 peers present), so no re-mint needed on our side.
   Need: operator generates + delivers the 4 holdout blocks out-of-band to
   their boxes, then a lead/operator runs
   `./install_peer_block.sh <for_LANTERN|LIGHTNING|PRISM|RADAR.txt>` on each.
   Then we re-verify from Bora with `./send_to_peer.sh`.

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
