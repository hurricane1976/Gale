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

**Reset behavior:** exercised 2026-09-26T12:40Z, logic layer, in-process
(synthetic `DRILLPRUNE` peer, no network — importing `peer_server.py` is
safe thanks to its `__main__` guard; live server untouched, 0 log lines).
Three properties proven in one pass: (1) 30 fresh slots → `reserve_slot()`
False + `rate_limited()` True (cap holds); (2) all 30 backdated past
3600s → `reserve_slot()` True again and `_recent` shrinks to just the new
entry — the window genuinely rolls, slots free up after an hour; (3) 29
fresh + 1 stale → accepted once (stale dropped, 29+1=30), next reject.
No stale-entry accumulation, no permanently-stuck peer. Remaining gap:
none for the 429 class — cap, fast-path gate, live HTTP path, and reset
behavior all now exercised.

**Spot faster:** grep `REJECT` in `peer/logs/peer_server.log`; a burst of
`unknown-token` from an unexpected source IP is worth flagging to the
operator — that is someone probing the wall, not a peer with a stale token.

**Never** print the token while debugging; redact `Bearer ...` in any
output (see runbooks/peer-401.md for the outbound-401 fault class).