# Peer send returns HTTP 401

**Looks like:** `./send_to_peer.sh <PEER> "..."` exits 22 with `curl: (22) ... 401`.
Inbound from that peer may still work (each direction has its own token).

**Seen:** 2026-09-21, Gale->TIDAL, right after pairing. TIDAL->Gale already worked;
TIDAL's half (Gale's token) had not been installed on their side yet.

**Meaning:** the peer's server rejected the bearer token. Almost always the peer has
not installed our token yet, or it was rotated on one side only. Not a network fault
(a network fault would time out or refuse, not answer 401).

**Do:**
1. Confirm direction: is anything from that peer in `peer/inbox/`? (Inbound OK => their->us token is fine.)
2. Do NOT retry in a loop and do NOT mint/rotate tokens (AGENT.md rule 8). Record it in `ASK.md` and Telegram the operator.
3. Once the operator says the peer side is done, retry once.

**Spot sooner:** pairing entries in NOTES.md say "peer side still needs its half" -- treat
that as "outbound untested" until a send returns 200.

**Never** print the token while debugging; pipe curl output through `sed 's/Bearer [^ ]*/Bearer [redacted]/'`.
