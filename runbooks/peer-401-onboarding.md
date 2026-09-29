# Runbook: peer onboarding stuck at 401

Incident class: a fleet peer exists and we want two-way inbox exchange, but
one direction (usually inbound to us) returns 401 while the rest of the
link is healthy.

## What it looks like
- `curl` to the peer's inbox accepts our signed POSTs (or we accept theirs)
  on exactly one direction; the other direction returns `401 unauthorized`.
- Peer-to-peer chat works for 16/21 pairs; the holdouts share this symptom.
- Everything else is healthy: both services up, tailnet reach confirmed,
  no rate limits, no cert errors.

## Root cause (known pattern)
Inbox auth is token-pair based. Each side holds one half of a shared token.
If the peer's half was never installed into their `keys/peers.env` (or
their service was not restarted after install), their inbound check fails
with 401 while their outbound token — minted on our side — still works.

## Fix flow
1. **Confirm staging exists.** `pairout/for_<LEAD>.txt` holds the block the
   peer must install (mode 600, never committed, never pasted in chat).
   If no block exists, the operator runs `./pair_peer.sh <PEER> <ADDR>`
   first (rule 8: an operator or lead mints; Bora never mints tokens).
2. **Lead or operator installs on the peer's box:**
   `./install_peer_block.sh <for_*.txt>`
   which appends the token half to that box's `keys/peers.env` and
   restarts its peer service.
3. **Re-verify, both directions.** Note: from Bora's sandbox, direct
   `curl` to peer inboxes often just times out (egress restriction seen
   2026-09-27: all peers 000/timeout while inbound deliveries land fine).
   A timeout is therefore NOT a 401 and NOT proof of failure:
   - inbound: peer lands a message in `peer/inbox/` → their half
     **is** installed; this is the strongest evidence and works even
     when outbound is blocked.
   - outbound: try `./send_to_peer.sh <PEER> "..."`. If it times out,
     ask the peer (via their standing probe cadence or a lead) to fire
     a message at us within a few minutes and confirm it landed — or
     have the lead verify on their side. Only a clean 401 from the
     other direction is true auth evidence.
4. **Close the loop in records:** update `ASK.md` (move peer from
   "still 401" to "closed") and append a dated line to `NOTES.md`
   with the date and the 200/200 verification.

## How to spot it sooner
- Any time a peer's name appears in a 401 in `check_replies.sh` output or
  in test-send results, treat it as "token half never installed", not a
  network or auth-bug issue — don't burn time on certs/restarts before
  checking `keys/peers.env` on the far side.
- The pairout blocks are the source of truth for what each lead still owes.

## Lesson (2026-09-27 14h waking)
Inbound delivery from a holdout peer is itself the pass signal: the
peer's half is installed the moment a message reaches our inbox from
it. HIGHBEAM's 12:18Z probe arriving after weeks on the holdout list
is exactly this. Check the inbox before re-running failed curl-based
verifications — outbound curl from Bora may simply be egress-blocked.

## Credential hygiene note (2026-09-29 02h waking)
`pairout/*` blocks contain live shared tokens. They are gitignored and
untracked (fixed 2026-09-29 after an earlier session committed them and
pushed to `github/bora` — see ASK.md escalation). Keep them mode 600,
off-terminal, and never in git history. Rotation of already-exposed
tokens is an operator call (rule 8); Bora does not mint or rotate.

## Current holdouts (as of 2026-09-29)
None — mesh 21/21 outbound. Closed 2026-09-28 ~19:35Z:
LANTERN, LIGHTNING, PRISM, RADAR (operator installed far-side halves;
`send_to_peer.sh` → 200 on all 4). HIGHBEAM closed earlier (09-27,
inbound probing = pass signal). This runbook remains the reference for
any future peer stuck at 401.
