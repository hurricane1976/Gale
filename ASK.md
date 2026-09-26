# ASK.md — open questions for the operator

## Open

- **Ratification of the LEVANTE (2026-09-25T22:09Z) and PONIENTE
  (2026-09-26T01:20Z) peer pairings — PENDING (flagged 2026-09-26T04:52Z).**
  Neither pairing has an explicit operator sign-off recorded in Ostro's
  NOTES.md ("i sign off on all peer pairing rule 8/8a" of 2026-09-25T17:45Z
  covered the original 11 siblings only). Evidence collected at the 04:45Z
  waking strongly indicates the operator executed them by hand:
  poniente/keys/peers.env (NAME=OSTRO) carries the comment "minted … by the
  operator … via pair_peer.sh"; `/home/agent/.bash_history` (operator
  shell) shows install_peer_block.sh ×3 and pair_all_remaining.sh; both
  token halves are byte-identical (verified symmetric); pre-pairing backups
  exist; peer_server.log shows selftest ACCEPT + expected 401 REJECT.
  Disposition: link left live (reverting would be destructive without
  operator context); no new pairing actions taken. Requesting formal
  ratification (or instruction to revert) from the operator.
  Details in NOTES.md (04:52Z annotation).

- **Cyclone model/runner drift (2026-09-25T17:30Z, known example, flagged
  once per AGENT.md item 4):** `cyclone/AGENT.md:7` declares
  `opencode/muse-spark-1.3-contributor-free` while `cyclone/wake.sh:48`
  runs `--model ollama/qwen3.8:27b` and its own PROMPT line 45 says the
  same. AGENT.md header has drifted from the actual runner. Flagged here
  for the record; per my role I will not keep re-flagging.

## Resolved

- **Ostro missing from the host's fleet-metrics liveness sweep — RESOLVED
  (filed 2026-09-25T17:30Z, verified fixed 2026-09-25T18:47Z).**
  `/api/fleet/metrics` now lists 33 roster agents including
  `Ostro → 100.66.39.59:8798, state=up, code=200` (generated_at
  18:46:35Z, fresh). The collector's roster was updated between my last
  two wakings to include Ostro. No further action required.

- **Peer pairings (resolved 2026-09-25T17:45Z).** Operator signed off on
  rule 8/8a for all 11 co-located siblings; every pair minted, both halves
  installed, both services restarted, and each pair self-tested in BOTH
  directions (200/401, correct `from`, two-way marker delivered).
  Details in NOTES.md (2026-09-25T17:45Z). No further action required.

- **Cron + systemd activation (resolved, this session, 2026-09-25T17:14Z).**
  `systemd/ostro-peer.service` installed to /etc/systemd/system, enabled +
  running (health OK on 100.66.39.59:8798); `ostro.cron` block installed in
  the operator's live crontab (6-wake `45 0,4,8,12,16,20` + `*/5` poll).
  Git repo initialized, `main` pushed to remote branch `ostro` on
  `hurricane1976/Gale`. Both credentials files (600) created; gitignored.
  No further operator action required.
