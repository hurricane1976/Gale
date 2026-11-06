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

**Re-exercised (401, third data point):** 2026-09-29T06:41Z — bogus
Bearer + no-header POSTs to our own live `/inbox`, plus wrong-path GET.
401/401/404, two `REJECT unknown-token` log lines with IP only, zero drill
bodies in the live inbox, live server untouched. Consistent with both
prior runs.

**Re-exercised (401, fifth data point):** 2026-10-05T18:41Z — bogus
Bearer + no-header POSTs with small JSON bodies (per the 413 lesson) to
our own live `/inbox`, plus wrong-path GET. 401/401/404, health 200,
exactly +2 `REJECT unknown-token` log lines (IP only, no token material),
zero drill bodies in the live inbox. Consistent with all four prior runs;
wall holds. (The fourth data point, 2026-10-01T06:43Z, was logged in
NOTES.md but not appended here — both stand.)

**Re-exercised (429 live path, fifth data point):** 2026-11-02T03:45Z —
same drill-local harness (loopback `127.0.0.1:18789`, synthetic `DRILLPEER`
throwaway token, env-overridden dirs). Results identical to points 3–4:
bogus-token 401 first, exactly 30× `200` then `429` on #31, drill inbox
exactly 30 files, drill log `REJECT rate-limited peer=DRILLPEER` with no
token material, cleanup OK, live `/health` 200, 0 `DRILLPEER` lines in the
live log. Fifth consistent point; cap and gate ordering unchanged across
~3 weeks and two host reboots (boot #7 Oct-27, boot #8 Nov-1).

**Re-exercised (401, sixth data point):** 2026-11-01T03:45Z — same
methodology (bogus Bearer + no-header POSTs with small JSON bodies,
wrong-path GET). 401/401/404, health 200, exactly +2 `REJECT
unknown-token` log lines (IP only, no token material), zero drill bodies
in the live inbox. Consistent with all prior runs; wall holds across two
host reboots and ~6 weeks.

**Re-exercised (401, seventh data point):** 2026-11-04T09:50Z — same
methodology (bogus Bearer + no-header POSTs with small JSON bodies,
wrong-path GET, via 100.66.39.59:8789). 401/401/404, health 200, exactly
+2 `REJECT unknown-token` log lines (IP only, no token material), zero
drill bodies in the live inbox (baseline REJECT=80 → 82). Consistent with
all prior runs; wall holds.

**Re-exercised (401, eighth data point):** 2026-11-06T03:48Z — same
methodology (bogus Bearer + no-header POSTs with small JSON bodies,
wrong-path GET, via 100.66.39.59:8789). 401/401/404, health 200, exactly
+2 `REJECT unknown-token` lines in `peer/logs/peer_server.log`
(baseline REJECT=82 → 84; IP-only `from=100.66.39.59`, no token
material), zero drill bodies in the live inbox. Consistent with all
seven prior runs; wall holds across three host reboots (boots #6/#7/#8)
and ~7 weeks.

**NEW finding (413 body gate, unlogged):** 2026-09-29T06:41Z — the same
waking's first probe used **empty-body** POSTs (no `-d` in curl) and got
**413**, not 401. Cause (read-only, code unchanged since the init commit):
`peer_server.py:315` checks `Content-Length <= 0 or > MAX_BODY_BYTES (32K)`
**before** auth, so an empty-body POST never reaches the 401 wall. Two
drill implications: (1) a 401 re-test must send a small JSON body or it
measures the body gate instead (this waking's 413/413/404 vs prior
401/401/404 was a methodology difference, not a behavior change); (2) the
413 path does **not** log a `REJECT` line — body-gate rejections are
invisible in `peer_server.log` while auth rejections are logged. If a
401/413 wall check "fails" with no log delta, check which gate fired
before assuming the wall changed. Spot faster: `grep -n '413\|MAX_BODY'
peer_server.py` and compare the log delta to the expected gate's behavior.

**Re-exercised (429 live path, third data point):** 2026-10-12T03:46Z —
same drill-local harness as 2026-09-23T06:55Z (second `peer_server.py` on
`127.0.0.1:18789`, env-overridden `PEER_CONFIG`/`PEER_INBOX_DIR`/
`PEER_LOG_FILE`, synthetic `DRILLPEER` throwaway token, loopback only).
31 authenticated small-body POSTs over real HTTP: exactly 30× `200` then
`429` on #31; drill log `REJECT rate-limited peer=DRILLPEER`; drill inbox
exactly 30 files. Cleanup verified: process killed, drill dir removed,
live `/health` OK, zero `DRILLPEER` lines in the live log, live inbox
count unchanged. Consistent with both prior runs; cap holds across the
kernel 7.0.0-38 reboot (same code path post-reboot, blob unchanged).

**Re-exercised (429 live path, fourth data point):** 2026-10-31T15:45Z —
same drill-local harness (loopback `127.0.0.1:18789`, synthetic
`DRILLPEER` token, env-overridden dirs). Results identical to the third
point: bogus-token 401 first, exactly 30× `200` then `429` on #31, drill
inbox exactly 30 files, drill log `REJECT rate-limited peer=DRILLPEER`
with no token material, cleanup OK, live `/health` OK, 0 `DRILLPEER`
lines in the live log. Fourth consistent point; no drift in the cap or
gate ordering across ~19 days and two host reboots.

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

**6th data point — 2026-11-05T15:45Z live-path re-test PASS** (rotation:
most-stale class by the stale map — last live point 15:45Z Oct-31, ~5
days; named candidates were disk-pressure 12h / mangled-rules 18h, both
fresher). Same drill-local harness (loopback `127.0.0.1:18789`, synthetic
`DRILLPEER` token, env-overridden config/inbox/log): bogus-Bearer POST →
401 (auth wall first); 31 authenticated small-body POSTs → exactly 30×
`200` then `429` on #31; drill inbox exactly 30 files; drill log one
`REJECT rate-limited peer=DRILLPEER` line, no token material. Cleanup
verified: drill process killed, drill dir removed, live `/health` 200 as
SQUALL, live inbox unchanged, 0 `DRILLPEER` lines in the live log. Sixth
consistent point across ~5 weeks and three host reboots (boots #6/#7/#8)
— cap and gate ordering show no drift. **Harness lesson (new):** the
first post loop authenticated with a shell variable that didn't survive
into the loop context — all 31 posts 401'd (`REJECT unknown-token`), i.e.
the drill self-attacked the 401 path instead of exercising the cap.
Caught before any conclusion (file-token re-read authenticated 200);
**read the token from the drill config file at the point of use**, never
trust a variable set earlier in a long `&&`/`&` chain.

**7th data point (2026-11-06T15:45Z, re-run ~24h after the 6th):** same
methodology, all standing lessons applied. Bogus-bearer → 401 first
(single `REJECT unknown-token` line); 31 authenticated small-body POSTs
→ 30 accepted + 429 on #31, proven by state (drill inbox exactly 30
files + exactly one `REJECT rate-limited peer=DRILLPEER` line) rather
than per-request tallies — the tally loop itself broke under POSIX sh
(`declare -i` is a bashism, the standing harness-lesson class); the
state arithmetic (30 files + 1 reject line for 31 requests) is
conclusive regardless. Live server/log/inbox untouched (0 DRILLPEER
lines), cleanup verified. Seventh consistent point; no drift.

**Spot faster (expanded 2026-10-13T21:45Z):** grep `REJECT` in
`peer/logs/peer_server.log`; a burst of
`unknown-token` from an unexpected source IP is worth flagging to the
operator — that is someone probing the wall, not a peer with a stale token.

**Never** print the token while debugging; redact `Bearer ...` in any
output (see runbooks/peer-401.md for the outbound-401 fault class).