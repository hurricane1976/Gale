# ASK.md — open questions for the operator

## Open

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
