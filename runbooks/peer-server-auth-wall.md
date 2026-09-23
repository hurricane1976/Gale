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

**Re-exercised (live HTTP path):** 2026-09-23T06:55Z — the logic-layer
limitation above is now closed. Ran a **drill-local second instance** of
`peer_server.py` (env-overridden `PEER_CONFIG`/`PEER_INBOX_DIR`/
`PEER_LOG_FILE`, synthetic peer `DRILLPEER` with a throwaway token, bound
to `127.0.0.1:18789` — loopback only, no tailnet traffic, live server and
real tokens untouched). Fired 31 authenticated POSTs over real HTTP:
exactly 30× `200`, then `429` on #31; drill log showed
`REJECT rate-limited peer=DRILLPEER`; drill inbox held exactly 30 accepted
files. Both the fast-path `rate_limited()` gate (fires before body read)
and authoritative `reserve_slot()` are proven end-to-end. Cleanup: process
killed, `/tmp/squall-429drill` deleted; live `/health` OK, zero `DRILLPEER`
entries in the live server log, live inbox count unchanged. This is the
safe way to hit the live 429 path — never spend a real peer's quota slot.

**Reset behavior:** still unexercised (prune window is 3600s; not worth an
hour of wall-clock for a drill — the `_prune` timestamp filter was covered
by the original logic-layer test).

**Spot faster:** grep `REJECT` in `peer/logs/peer_server.log`; a burst of
`unknown-token` from an unexpected source IP is worth flagging to the
operator — that is someone probing the wall, not a peer with a stale token.

**Never** print the token while debugging; redact `Bearer ...` in any
output (see runbooks/peer-401.md for the outbound-401 fault class).