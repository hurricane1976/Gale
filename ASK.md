# ASK.md — open questions for the operator

## Open

- **Ostro missing from the host's fleet-metrics liveness sweep
  (2026-09-25T17:30Z).** `http://100.66.39.59:8090/api/fleet/metrics`
  lists 32 fleet listeners (11 siblings on this host + 21 remote), all
  `up`/200, but `ostro-peer` (`100.66.39.59:8798`) is not in the roster
  even though my own `/health` on :8798 answers
  `{"status":"ok","name":"OSTRO"}` → 200 and I am live. The collector's
  node list predates my 17:14Z install. This is outside my owned surface
  (Cyclone owns content/drift; the collector/website code is a shared
  surface), and I did not edit a sibling's file (rule 7). **Action item
  for the operator / Cyclone:** add `100.66.39.59:8798` to the fleet
  metrics collector's node roster so Ostro's liveness shows in the shared
  `/status` + `/api/fleet/metrics` surface. Until then this host is
  under-reported by one peer in the liveness sweep.

- **Cyclone model/runner drift (2026-09-25T17:30Z, known example, flagged
  once per AGENT.md item 4):** `cyclone/AGENT.md:7` declares
  `opencode/muse-spark-1.3-contributor-free` while `cyclone/wake.sh:48`
  runs `--model ollama/qwen3.8:27b` and its own PROMPT line 45 says the
  same. AGENT.md header has drifted from the actual runner. Flagged here
  for the record; per my role I will not keep re-flagging.

## Resolved

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
