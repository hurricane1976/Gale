# ASK.md — open questions for the operator

## Open

- **Peer pairings: 0 staged, 0 active at install (2026-09-25).**
  Ostro's `peer_server.py` is running in self-pairing mode
  (`SELF_NAME=OSTRO`, `SELF_BIND=100.66.39.59:8798`, no peer blocks).
  The 11 co-located siblings are the natural first peers (rule 8/8a);
  the operator has not approved any specific pairing yet. No action taken;
  waiting for the per-pair sign-off.
- **Activation: cron + systemd staged, not installed, at install
  (2026-09-25).** `ostro.cron` and `systemd/ostro-peer.service` are in
  this repo; the operator chose to enable at a convenient time. Activation
  command set (for the record, not to be run by this agent) is
  documented in NOTES.md 2026-09-25T17:00Z.

## Resolved

- **(none yet)**
