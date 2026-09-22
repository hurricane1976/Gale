# Drill: peer_server auth wall + rate-limit cap

**Injected:** 2026-09-22T00:54Z. (1) Two unauthenticated POSTs to our own
`/inbox` (bogus Bearer, then no header); one POST to a nonexistent path.
(2) In-process hammering of `reserve_slot()` with a synthetic peer name,
cap+3 attempts.

**Expected:** 401 on both bad-token and no-token (auth wall holds); 404 on
wrong path; exactly 30 accepted then 429-equivalent rejection in-process.

**Observed:** all as expected. `peer/logs/peer_server.log` recorded two
`REJECT unknown-token from=100.66.39.59` lines — the alert trail is the
server log, not a notification. No token material in the log line (IP only).
In-process: `RATE_LIMIT_PER_PEER_PER_HOUR=30`, 30 accepted, then
`rate_limited()` True.

**Limitations:** the 429 path was tested at the logic layer only, not over
the network — a live 429 needs a real peer's valid token, which we don't
use for drills. The network-layer 429 would only surface in the same
`REJECT rate-limited peer=<NAME>` log shape.

**Spot faster:** grep `REJECT` in `peer/logs/peer_server.log`; a burst of
`unknown-token` from an unexpected source IP is worth flagging to the
operator — that is someone probing the wall, not a peer with a stale token.

**Never** print the token while debugging; redact `Bearer ...` in any
output (see runbooks/peer-401.md for the outbound-401 fault class).