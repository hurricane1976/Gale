# Runbook: peer pairing — staging, minting, install, verification

Scope: every step from "we want two-way inbox with peer X" to "both
directions verified, records closed". Bora never mints tokens on its own
initiative (rule 8); this file documents the approved paths and the
verification Bora owns.

## The three approval paths

| Path | What it covers | Gate |
|---|---|---|
| Rule 8 (default) | Any remote peer pairing or rotation | Per-pair operator Telegram sign-off, chat id verified |
| Rule 8a | Co-located siblings on THIS host only | Operator go-ahead for that specific pair; Bora may mint + install both halves directly |
| Rule 8b | Named fleet-provisioning scope (onboarding a named agent, rotating named pairs, retiring a named agent) | One operator approval per scope; the pinned `fleet-provision` tool acts within exactly that scope |

Anything outside the approved scope falls back to rule 8. A generated
remote half is NOT an installed pairing — it closes only when the far side
imports it through its own process.

## Staging (always allowed, unattended)
1. Choose a name for the block: `pairout/for_<PEER>.txt` (or
   `for_<LEAD>.txt` when one block serves several siblings under a shared
   lead).
2. Mint via the approved path. `pairout/` is gitignored; files mode 600.
   Never paste a token into chat, NOTES.md, or any commit.
3. Record in NOTES.md (token **hash** only, e.g. `sha256:<first16>…`) which
   pair, when, and which rule authorized it. Commit.
4. Stage the peer entry in `keys/peers.env` (timestamped backup of the
   file first: `cp peers.env peers.env.bak-<UTC>`).

## Install
- **Remote peer:** the block goes to the far side out-of-band (operator or
  its lead). Far side runs `./install_peer_block.sh for_<PEER>.txt`, which
  appends to its `keys/peers.env` and restarts its peer service. Bora
  never ssh's or edits a remote box (rule 7).
- **8a co-located sibling:** Bora installs both halves directly, restarts
  both listeners, self-tests both directions, then logs siblings + time +
  operator authorization in NOTES.md.

## Verification (Bora's job)
- **Inbound (strongest signal):** the peer lands a message in
  `peer/inbox/` — see `peer-401-onboarding.md`: the peer's half is
  installed the moment one of its messages reaches us, even when our
  outbound curl is egress-blocked (timeouts are 000, not auth failures).
- **Outbound:** `./send_to_peer.sh <PEER> "pair-test"`. HTTP 200 = pass;
  true 401 = far half not installed (fix flow in `peer-401-onboarding.md`);
  timeout = inconclusive, fall back to the inbound signal or ask a lead.
- Both directions green → close the pair in ASK.md and NOTES.md with the
  date and the 200/200 result.

## Retiring a pair (inverse)
1. Operator revocation decision (rule 8 gated); both halves removed from
   each side's `peers.env` by the owning agent.
2. Move `keypair` entries out of `keys/peers.env` only after both halves
   are gone; shred the `pairout/` block (`shred -u`) — its job is done.
3. Update ASK.md/NOTES.md; commit.

## Lessons
- 2026-09-27: HIGHBEAM was on the "still 401" holdout list for weeks
  because Bora's outbound curl was egress-blocked (read as a timeout).
  Inbound probe arrival is the pass signal — check the inbox first.
- 2026-09-29: `pairout/*` live tokens were committed + pushed to the
  github remote before gitignore existed (rule-3 exposure, operator
  decision pending per ASK.md). Stage gitignore in the pairing dir BEFORE
  any token material is written.
- 2026-09-28: 21/21 remote mesh closed under rule 8b scope in one batch
  (operator Telegram 1790623763). Batch scope approval is the efficient
  path for fleet-wide work; use it, within its exact named scope.
