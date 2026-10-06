# ASK.md — open questions for the operator

## Open

- **Second fleet model migration `ollama/qwen3.8:27b` →
  `opencode/muse-spark-1.3-contributor-free` (2026-10-06 ~14:44Z) — PENDING
  (flagged 2026-10-06T16:49Z).** Between the 12:49Z and 16:49Z wakings, all
  10 open-weight cohort dirs had `wake.sh` + `opencode.json` swapped
  qwen→muse-spark (ostro + 9 checked siblings all mtime 14:44Z; coordinated
  sweep, same class as the 10-05 ~15:38Z migration). `wake.sh:1` claims
  "2026-10-06 operator-directed" but `check_replies` shows no Telegram
  sign-off on record. Unlike the 10-05 migration, `AGENT.md` was NOT
  updated — Ostro + 8 siblings now carry internal drift (live pins =
  muse-spark vs `AGENT.md:7` = qwen; tramontane AGENT.md already says
  muse-spark, so it is consistent). Pre-migration qwen state preserved in
  `.bak-20261006muse` files; LAN Ollama + shim still serve qwen3.8:27b.
  Disposition: link/config left live (reverting mid-session on the new
  model would create drift; AGENT.md untouched per rule 6). Requesting
  ratification plus direction on reconciling `AGENT.md` (update prose to
  muse-spark, or revert pins to qwen). Details in NOTES.md (16:49Z entry).
  (The 10-05 migration item below stays RESOLVED-BY-REVERT — superseded,
  not reopened; this is a new migration, new item.)

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

## Resolved

- **Fleet model migration `ollama/qwen3.8:27b` →
  `opencode/muse-spark-1.3-contributor-free` (2026-10-05 ~15:38Z) — RESOLVED-BY-REVERT
  (flagged 2026-10-05T16:48Z, operator-reverted 2026-10-05T23:47Z).**
  Between the flagged waking (16:48Z) and this one (2026-10-06T00:55Z),
  the operator reverted all 10 open-weight cohort dirs (bora, chinook,
  cyclone, levante, maistral, ostro, poniente, sirocco, tramontane, vortex)
  back to `ollama/qwen3.8:27b` in `opencode.json` + `wake.sh` + `AGENT.md`
  (verified this waking: `oc="ollama/qwen3.8:27b"` everywhere; `wake.sh`
  carries an operator-directed header comment; `.bak-20261005qwen` files
  preserve the pre-revert muse-spark state). LAN Ollama confirmed live both
  ways: `192.168.1.197:11434/api/tags` serves `qwen3.8:27b` (Q4_K_M, 27.3B,
  ctx 262144, vision/tools/thinking); LAN shim `127.0.0.1:11435/v1/models`
  same. The 20:48Z "LAN Ollama UNREACHABLE" observation was resolved by the
  revert. No ratification outstanding — the operator acted directly.

- **Cyclone model/runner drift — RESOLVED-BY-REVERT (filed 2026-09-25,
  re-stated 2026-10-05T16:48Z; cleared 2026-10-06T00:55Z).** With the
  cohort revert, `cyclone/AGENT.md:7`, `cyclone/opencode.json` and
  `cyclone/wake.sh` all agree on `ollama/qwen3.8:27b` (verified this
  waking). No drift remains.

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
