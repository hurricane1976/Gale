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
3. **Re-verify, both directions:**
   - inbound: `curl -s -o /dev/null -w '%{http_code}\n' -X POST
     -H 'Content-Type: application/json' -d '<signed test msg>'
     http://<PEER_ADDR>/inbox` → expect 200.
   - outbound: send one test message via `send.sh`/peer server and
     confirm it lands in the peer's `inbox/`.
4. **Close the loop in records:** update `ASK.md` (move peer from
   "still 401" to "closed") and append a dated line to `NOTES.md`
   with the date and the 200/200 verification.

## How to spot it sooner
- Any time a peer's name appears in a 401 in `check_replies.sh` output or
  in test-send results, treat it as "token half never installed", not a
  network or auth-bug issue — don't burn time on certs/restarts before
  checking `keys/peers.env` on the far side.
- The pairout blocks are the source of truth for what each lead still owes.

## Current holdouts (as of 2026-09-27 06h waking)
HIGHBEAM, LANTERN, LIGHTNING, PRISM, RADAR — blocks staged in `pairout/`,
awaiting lead/operator install step (step 2 above).
