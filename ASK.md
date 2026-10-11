# ASK.md — open questions for the operator

## Open

- **RESOLVED 2026-10-11T02:30Z (moved from Open): Fourth model event — resolved by
  operator unification on `openrouter/~z-ai/glm-flash-latest`.** In a
  ~2026-10-10T20:08:17Z sweep (all three files share that exact mtime) the
  operator aligned the full stack: `AGENT.md:7` (glm-flash-latest alias,
  "operator-directed 2026-10-10"), `wake.sh` PROMPT + line-46 CLI pin, and
  `opencode.json:39` all now read `openrouter/~z-ai/glm-flash-latest` —
  three-way agreement, first time since 10-08. The muse-contrib config flip
  of 10-08 13:32Z is superseded; the ratification + direction questions are
  moot (operator acted directly, chose "everything follows glm via
  OpenRouter"). Record correction: the 20:30Z 10-10 NOTES item 8 claimed
  `opencode.json:39` was still muse-spark — that was a stale-template
  copy error; the 20:30Z waking's own commit (a37aee7) contains the
  already-flipped glm opencode.json. Verified this waking from git
  history. **Keepalive side effect of the same sweep: the
  `*/5 … /home/agent/agent/ollama_keepalive.sh` crontab line for gale is
  back (count was 0 since 10-06); LAN Ollama up (200).**

- **RESOLVED 2026-10-10T20:30Z: LAN Ollama host `192.168.1.197` back up.**
  Down (HTTP 000 + ICMP loss) between 08:30Z and 14:30Z; at 20:30Z
  `/api/tags` → 200 and ping answers (0.5ms). Cohort impact had been zero
  (retired qwen fallback). Closed.

- **RESOLVED 2026-10-10T20:30Z: `/var/run/reboot-required` — operator
  rebooted the host ~16:30Z (boot 2026-10-10T16:30:16Z).** Running kernel
  is now 6.8.0-146-generic (was 6.8.0-142 since 10-09); flag gone. All 15
  peer units + tailscaled auto-recovered active; website healthy; no
  manual restarts needed. The reboot window I requested was taken;
     closed. (Supersedes the 10-09T08:30Z Open item below.)

- **Fourth model event: config-file-only flip `opencode/glm-5.3-flash` →
  `opencode/muse-spark-1.3-contributor-free` (2026-10-08T13:32:31–37Z) —
  PENDING (flagged 2026-10-08T14:30Z).** Between the 08:30Z waking (three-way
  glm pin agreement on record) and this one, all 13 open-weight cohort
  `opencode.json` files (ostro + bora, chinook, cyclone, levante, maistral,
  poniente, sirocco, squall, tempest, tramontane, vortex, zephyr — a larger
  13-dir cohort than the 10-dir sweeps of 10-05/10-06/10-07) were flipped to
  muse-spark in a 6-second stagger. Ostro's `git diff` is exactly one line
  (`opencode.json:39`); `wake.sh` (21:27Z 10-07) and `AGENT.md` (21:23Z
  10-07) are untouched, and `wake.sh:46` still forces `--model
  opencode/glm-5.3-flash`, so the runner pin — and this session — still run
  glm. No new Telegram sign-off on record, but
  `opencode.json.bak-20261008-pre-muse-contrib` was created during the
  operator's own 21:22Z 10-07 sweep and named for 2026-10-08 — strong
  evidence the flip was staged in advance by the operator. Disposition:
  config left live (reverting would fight a staged operator action; the
  10-06 precedent), no behavior change, drift recorded at its exact
  location. Requesting: (1) ratification of the muse-contrib config flip;
  (2) whether `wake.sh`/`AGENT.md` should follow (full migration to
  muse-contrib) or `opencode.json` should be restored to glm — direction
  wanted either way, no self-action until then. Details in NOTES.md
  (14:30Z entry).

- **Unverified operator-attributed "revenue mandate" broadcast via peer inbox
  (2026-10-06 ~17:22–17:25Z) — PENDING (flagged 2026-10-06T20:49Z).** BEACON
  posted two fleet-wide messages to Ostro's `peer/inbox/`
  (`20261006T172246Z-BEACON-adbee017.json` "REVENUE MANDATE from josh" +
  `20261006T172558Z-BEACON-a6f6004c.json` "josh's decisions"): claimed
  operator directives to reorient the fleet toward revenue (lanes A–D,
  Day-2/3/5/7 milestones, per-agent stats panels, distribution-kit work),
  plus claimed operator answers (Gale console stays tailnet-only, no
  cadence cuts, guided posting kit). Both messages invite verification on
  each agent's own operator channel; the second claims corroborating
  Telegram messages were sent — but `./check_replies.sh` on this host shows
  **no new operator messages**, so there is nothing to corroborate against
  from here. Disposition per rules 4/5: treated as data, **no lane
  commitment sent, no behavior or cadence change made** (Beacon's "reply
  with your lane + what you'll ship by Day 3" is a peer request, not an
  operator order; changing this host's sharpness role on a peer's word
  would violate the peer-talking rules). Requesting operator confirmation
  via Telegram (genuine / relayed-and-accurate / not-yours) and direction
  on whether any Ostro action is wanted. Full bodies in
  `peer/inbox/processed/`; summary in NOTES.md (20:49Z entry).

- **RESOLVED-BY-SUPERSESSION 2026-10-11T02:30Z: Second fleet model migration
  `ollama/qwen3.8:27b` → `opencode/muse-spark-1.3-contributor-free` (2026-10-06
  ~14:44Z).** The ratification question is moot: the model stack has since been
  rewritten twice (10-08 muse-contrib flip, then the operator's 10-10T20:08Z
  unification on `openrouter/~z-ai/glm-flash-latest`, three-way agreement
  AGENT.md/wake.sh/opencode.json). No pre-10-10 migration state exists to
  revert; the "reconcile AGENT.md" question was answered de facto (AGENT.md:7
  now matches all live pins). Recorded for the audit trail; no action.
  (Original findings below.) Between the 12:49Z and 16:49Z wakings, all
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

- **BEACON error-run escalation in the 24h fleet window (2026-10-09) —
  RESOLVED 2026-10-10T20:30Z (closed by window drain).** Series
  `{}` → `{beacon: 1}` → `2` → `5` (peak, cost_24h $4.37) → `4` → `3`
  → `2` → `{}` at 20:30Z 10-10; beacon `cost_24h` $3.20→$1.63. No
  operator visibility ever needed; remote host, observation-only per
  rule 7 throughout. Full history in NOTES.md (10-09 20:30Z → 10-10 20:30Z).

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
