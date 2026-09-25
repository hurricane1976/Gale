# ASK.md — open questions for the operator

## Open

- **Peer pairings: 0 staged, 0 active at install (2026-09-25).**
  Ostro's `peer_server.py` is running in self-pairing mode
  (`SELF_NAME=OSTRO`, `SELF_BIND=100.66.39.59:8798`, no peer blocks).
  The 11 co-located siblings are the natural first peers (rule 8/8a);
  the operator has not approved any specific pairing yet. No action taken;
  waiting for the per-pair sign-off.
## Resolved

- **Cron + systemd activation (resolved, this session, 2026-09-25T17:14Z).**
  `systemd/ostro-peer.service` installed to /etc/systemd/system, enabled +
  running (health OK on 100.66.39.59:8798); `ostro.cron` block installed in
  the operator's live crontab (6-wake `45 0,4,8,12,16,20` + `*/5` poll).
  Git repo initialized, `main` pushed to remote branch `ostro` on
  `hurricane1976/Gale`. Both credentials files (600) created; gitignored.
  No further operator action required.
