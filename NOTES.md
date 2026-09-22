# NOTES.md — TEMPEST

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (cloned from Gale on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 — shared host with Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790).
- Cloned from Gale scaffold (`hurricane1976/Hurricane` pattern via `/home/agent/agent`): notify / check_replies / telegram_commands / peer_server / send_to_peer / spend_check reused; `wake.sh` adapted for opencode, `AGENT.md` new, `telegram_commands.py` patched.
- Role: Open-Stack Portability & Fleet Interop. Cadence: 4 wakings/day staggered (Gale :50, Zephyr :52, Squall :54, Tempest :56 UTC).
- Runner: opencode, model `opencode/muse-spark-1.2-contributor-free` (OpenCode + OpenRouter Muse Spark 1.2 free). Same fleet, same operator "josh", same rules as Gale (`AGENT.md:54-77` equivalent).
- Peer port: 8790 on 100.66.39.59. No peers paired yet — pairing via `./pair_peer.sh` operator-to-operator (rule 8), same full-mesh roster as Gale (`peer/roster-20260921.md`).
- Bot: `@tempestagentsbot` (id 8744765737) — `keys/telegram.env` filled 2026-09-21, chat `8986669804` (same as Gale). `notify.sh` test sent `[TEMPEST] Tempest online…` OK, `getMe` returned `{"ok":true,"username":"tempestagentsbot"}`. wake.sh guard now passes (was `TELEGRAM_CHAT_ID not set`).
- git: independent repo (same pattern as Gale: rules/state versioned, keys/logs/backups gitignored per `.gitignore`). Initial commit `8a8fc04`, fixes `3db8c86` + `fae173a`.

## 2026-09-21T17:43Z — Telegram live, ready to pair

- Verified opencode `opencode/muse-spark-1.2-contributor-free` → `tempest ok` `cost 0` via `opencode run --format json`.
- Peer `100.66.39.59:8790` listening (`tempest-peer` active, `curl http://100.66.39.59:8790/health` → `{"status":"ok","name":"TEMPEST"}`).
- Next: pair with fleet via operator: `./pair_peer.sh <NAME> <ADDR>` per `peer/roster-20260921.md` (21 peers, operator-to-operator, rule 8). Cron `56 0,6,12,18` + `*/5` telegram poller now enabled (was skipping before).

## 2026-09-21T18:02:25Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-21T18:07:57Z -- paired with BEACON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:07:59Z -- paired with TIDAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:01Z -- paired with MOUNTAIN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:03Z -- paired with RIVER (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:05Z -- paired with CREEK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:07Z -- paired with STREAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:09Z -- paired with MEADOW (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:11Z -- paired with BROOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:13Z -- paired with MIST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:15Z -- paired with CANYON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:17Z -- paired with RIDGE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:19Z -- paired with HARBOR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:22Z -- paired with DELTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:24Z -- paired with MESA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:26Z -- paired with VISTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:28Z -- paired with HIGHBEAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:30Z -- paired with LANTERN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:32Z -- paired with LIGHTNING (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:34Z -- paired with RADAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:36Z -- paired with PRISM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:08:38Z -- paired with PULSAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:56Z — Waking (opencode/muse-spark-1.2) host health + interop

- Read AGENT.md/NOTES.md/ASK.md/peer/inbox; ./check_replies.sh → (no new messages).
- Host gale-agent: up 7h, load 2.04, mem 58G (43G free), disk 21% used (74G free), Tailscale 100.66.39.59:8790 health ok `{"status":"ok","name":"TEMPEST"}`, tempest-peer active since 18:08Z. Backup `backups/tempest-20260921T185616Z.tar.gz` (116K) verified via tar -tzf.
- Peer inbox: 31 msgs (all pair-test/liveness pings) from GALE (2), BEACON, TIDAL, RIVER (2), CREEK (2), STREAM (3), MEADOW (2), BROOK (2), MIST (2), CANYON (2), RIDGE, HARBOR (4), DELTA, MESA (2), VISTA, MOUNTAIN (2). Includes post-pair verifications: MOUNTAIN/CANYON/RIDGE/DELTA/MESA/VISTA/HARBOR confirms, STREAM opencode/GLM-Flash hello, RIVER w180 activated. All inbound verified (token auth), treated as data per AGENT.md:5 — no outbound loop needed (waking cadence is natural pace). Moved to processed after reading.
- Peers: keys/peers.env has 22 peers (SELF TEMPEST + GALE + 21 fleet per roster-20260921.md); all Gale-half tokens installed 18:07-18:08Z, outbound pending peer-side install.
- Interop check (AGENT.md:4): verified 4 scripts on opencode stack:
  - wake.sh: uses `opencode run --model opencode/muse-spark-1.2-contributor-free --format json`, flock + spend_check handles opencode step_finish stream (tested: stream `cost 0` parses, claude envelope still parses) — parity ok.
  - spend_check.py: dual parser (claude envelope `total_cost_usd` + opencode `step_finish.cost`) → run $0 total $0 for 2026-09-21, free parity holds vs Sonnet.
  - telegram_commands.py: drift fixed — `Gale commands` → `Tempest commands (operator only, opencode/muse-spark-1.2)` and docstring/doc updated; compiles, handlers unchanged.
  - opencode.json: `model opencode/muse-spark-1.2-contributor-free` ok; peer_server.py/notify.sh/check_replies.sh unchanged and working.
  - pair_all_remaining.sh: fixed cd `$HOME/tempest` (was `$HOME/agent`) + added BEACON/TIDAL/MOUNTAIN 3 leads (21 pairs total), added install hint.
- Git: will commit this waking (NOTES.md + telegram_commands.py + pair_all_remaining.sh).
- No spend alert; no ASK.md change; cron 56 0,6,12,18 + */5 poller active.

## 2026-09-21T19:20Z -- rule 7/8 amended (applied via Gale's interactive session)

- Operator, working directly in an interactive session on Gale's copy of this host (not a Telegram message to Tempest specifically -- noted per rule 6, same basis as Gale's own log entry for this change), asked for and confirmed a rule change enabling a lead to provision co-located sibling pairings directly.
- Rule 7 now scopes "never touch another agent's host/files/keys" to a *different* host; Gale, Zephyr, and Squall (sharing this host/user account) are carved out for Tempest too. New rule 8a: co-located siblings only, gated on the operator's explicit go-ahead per pairing, self-tested both directions, logged in NOTES.md. Remote peers still need rule 8's per-pair sign-off exactly as before -- this doesn't touch any of the 21.
- Applied identically across all four `AGENT.md` copies on this host so the rule text matches everywhere. Not exercised yet from Tempest's side this session.

## 2026-09-21T19:00Z — Waking (opencode/muse-spark-1.2) host health + backup + interop

- Read AGENT.md/NOTES.md/ASK.md/peer/inbox; ./check_replies.sh → (no new messages).
- Host gale-agent: up 7h, load 2.06, mem 58G (42G free), disk 21% used (74G free), Tailscale 100.66.39.59:8790 health ok `{"status":"ok","name":"TEMPEST"}`, tempest-peer listening (22 peers configured). Backup `backups/tempest-20260921T190011Z.tar.gz` (124K, 171 files) verified via tar -tzf, prunes >14.
- Peer inbox: 5 msgs since last waking — MEADOW x2 (census data-only + pair confirm: Meadow↔TEMPEST two-way proven 24/24 green, bearer-authenticated), DELTA x3 (link verification, data-only). All token-authenticated, treated as data per AGENT.md:5, moved to processed. Prior 31 already archived; total processed now 37 files.
- Peers: keys/peers.env 22 peers (SELF TEMPEST + GALE + 21 fleet per roster-20260921.md); all Gale-half tokens installed 18:07-18:08Z. Two-way confirmed with MEADOW; outbound for others pending peer-side install.
- Interop check (AGENT.md:4): re-verified on opencode/muse-spark-1.2-contributor-free stack:
  - wake.sh: `opencode run --model opencode/muse-spark-1.2-contributor-free --format json` + flock + 45m timeout + spend_check dual parser; opencode 1.18.31, stream cost 0 parsed correctly.
  - spend_check.py: `$0` run, `$0` daily total 2026-09-21 (4 records), free parity holds vs Sonnet/Opus; no alert.
  - opencode.json: model `opencode/muse-spark-1.2-contributor-free` ($schema ok), no fallback needed yet.
  - telegram_commands.py/sh: `*/5` poller active, .telegram_offset advancing, handlers gate on TELEGRAM_CHAT_ID (operator only).
  - peer_server.py: token mode, 22 peers, health endpoint ok, rate-limit 30/h, inbox writes verified.
  - No new runbook divergence this waking — previous runbooks peer-401.md / peer-credential-injection.md still accurate.
- No spend alert; no ASK.md change; cron 56 0,6,12,18 + */5 poller active.

## 2026-09-21T23:28Z — Waking (openrouter/z-ai/glm-5.3-flash) host health + backup + interop

- Read AGENT.md/NOTES.md/ASK.md/peer/inbox; ./check_replies.sh → one message: `/wake` (operator nudge, no new instructions).
- Host gale-agent: up 11h31m, load 2.28, mem 58G (40G free), disk 22% used (73G free), tempest-peer active since 19:45Z, health ok `{"status":"ok","name":"TEMPEST"}`. Backup `backups/tempest-20260921T232701Z.tar.gz` (140K, 181 files) verified via tar -tzf.
- Peer inbox: 1 new msg — CREEK pair-test confirmation (creek → TEMPEST credentialed delivery, data-only). Moved to processed.
- Interop check (AGENT.md:4): model switched since last waking — AGENT.md/wake.sh/opencode.json now `openrouter/z-ai/glm-5.3-flash` (was muse-spark-1.2). Verified on GLM stack:
  - opencode run: live test → `tempest ok`, stream well-formed, step-finish carries tokens+cost.
  - spend_check.py: dual parser handles GLM stream → run $0.0016, 2026-09-21 total $0.0016, no alert. **Drift note: model no longer strictly free** (was $0 on muse-spark) but near-$0 parity vs Sonnet baselines holds (AGENT.md:5). Will keep watching; flag if a waking run trends above pennies.
  - opencode.json now also denies read/external_directory on all keys/ dirs (Gale/Zephyr/Squall/Tempest) — good hardening, converges with fleet pattern.
  - wake.sh: 45m timeout + flock + spend_check wiring intact for new model flag.
  - Uncommitted operator-session changes (rules 7/8a amend, model switch, keys-deny perms, notify.sh .notified marker) committed this waking.
- Git: commit after notify. No spend alert; no ASK.md change; cron 56 0,6,12,18 + */5 poller active.

## 2026-09-22T01:05Z -- operator-directed (gale session): spend fix + github backup staged
- spend_check.py fixed by the operator-directed gale session: opencode per-step costs are now SUMMED (last-step-only undercounted multi-step wakings ~10x; your last waking's ledger line was corrected in place). Commit 73036aa/7909d42/275e21e.
- Offsite backup staged but INACTIVE: a `github` remote (git@github-tempest:hurricane1976/tempest.git) and a write-enabled deploy keypair (keys/github_deploy_key) now exist. Push will fail until josh creates the repo and adds the pubkey as a deploy key; no wake.sh hook added yet to avoid failed-push noise. Next waking: nothing to do.

## 2026-09-22T01:20Z -- operator-directed (gale session): offsite backup LIVE, one shared repo
- Operator chose ONE shared GitHub repo for all four co-located agents (hurricane1976/Gale) over per-agent repos, accepting the documented tradeoff: a deploy key is repo-wide, so this single write-enabled key (gale's) is shared by all four agents and any one of them can rewrite any other's backup branch. Per-agent isolation was the safer default; one-repo is the operator's call, recorded here.
- This repo's `master` branch was renamed to `main` (consistency with gale's repo), pushed to branch tempest on the shared repo (first push verified, branch head matches this repo's NOTES commit), and wake.sh gained the same shell-side push hook gale has (pushes main:tempest every waking; idempotent, failure logged not fatal).
- The per-sibling keypairs generated earlier this session were removed (unused once the shared layout was chosen); pushes authenticate with gale's deploy key via the shared github-gale ssh alias.
