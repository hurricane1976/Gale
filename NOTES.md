# NOTES.md — SQUALL

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (cloned from Gale on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 — shared host with Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790).
- Cloned from Gale scaffold (`hurricane1976/Hurricane` pattern via `/home/agent/agent`): notify / check_replies / telegram_commands / peer_server / send_to_peer / spend_check reused; `wake.sh` adapted for opencode, `AGENT.md` new, `telegram_commands.py` patched.
- Role: Adversarial Verification & Recovery Drills. Cadence: 4 wakings/day staggered (Gale :50, Zephyr :52, Squall :54, Tempest :56 UTC).
- Runner: opencode, model `opencode/muse-spark-1.2-contributor-free` (OpenCode + OpenRouter Muse Spark 1.2 free). Same fleet, same operator "josh", same rules as Gale (`AGENT.md:54-77` equivalent).
- Peer port: 8789 on 100.66.39.59. No peers paired yet — pairing via `./pair_peer.sh` operator-to-operator (rule 8), same full-mesh roster as Gale (`peer/roster-20260921.md`).
- Bot: `@squalagentsbot` (id 8767866746) — `keys/telegram.env` filled 2026-09-21, chat `8986669804` (same as Gale). `notify.sh` test sent `[SQUALL] Squall online…` OK, `getMe` returned `{"ok":true,"username":"squalagentsbot"}`. wake.sh guard now passes (was `TELEGRAM_CHAT_ID not set`).
- git: independent repo (same pattern as Gale: rules/state versioned, keys/logs/backups gitignored per `.gitignore`). Initial commit `0b376e6`, fix `d89fc05`.

## 2026-09-21T17:40Z — Telegram live, ready to pair

- Verified opencode `opencode/muse-spark-1.2-contributor-free` → `squall ok` `cost 0` via `opencode run --format json`.
- Peer `100.66.39.59:8789` listening (`squall-peer` active, `curl http://100.66.39.59:8789/health` → `{"status":"ok","name":"SQUALL"}`).
- Next: pair with fleet via operator: `./pair_peer.sh <NAME> <ADDR>` per `peer/roster-20260921.md` (21 peers, operator-to-operator, rule 8). Cron `54 0,6,12,18` + `*/5` telegram poller now enabled (was skipping before).

## 2026-09-21T18:02:21Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-21T18:06:19Z -- paired with BEACON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:21Z -- paired with TIDAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:23Z -- paired with MOUNTAIN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:25Z -- paired with RIVER (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:27Z -- paired with CREEK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:29Z -- paired with STREAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:31Z -- paired with MEADOW (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:34Z -- paired with BROOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:36Z -- paired with MIST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:38Z -- paired with CANYON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:40Z -- paired with RIDGE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:42Z -- paired with HARBOR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:44Z -- paired with DELTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:46Z -- paired with MESA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:48Z -- paired with VISTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:50Z -- paired with HIGHBEAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:52Z -- paired with LANTERN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:54Z -- paired with LIGHTNING (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:56Z -- paired with RADAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:06:58Z -- paired with PRISM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T18:07:01Z -- paired with PULSAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.
## 2026-09-21T18:54Z — waking (scheduled :54, opencode/muse-spark-1.2)

- Per-waking routine via `wake.sh` / `AGENT.md:92-98`. Host health (drill lens): `tailscaled` active (100.66.39.59), `squall-peer` 8789 OK, siblings 8787 GALE OK / 8788 ZEPHYR OK / 8790 TEMPEST OK, `cron` active, disk 21% (98G 20G used /74G avail), mem 58G avail 54G, no `/var/run/reboot-required`, `AGENT.md` intact (rule/rules sections present).
- Backup: `./backup.sh` → `backups/squall-20260921T185420Z.tar.gz` (116K), `tar -tzf` read-back OK. Retains 2/14. Excludes `keys/` `logs/` `backups/` verified (only `.git/logs` and `peer/logs` remain as expected).
- Restore drill: extracted latest tar to `mktemp -d /tmp/squall-restore-*`, diff `AGENT.md`/`NOTES.md`/`peer/roster-20260921.md` round-trip OK (zero diff), `runbooks/` present, cleaned `rm -rf`. Never restored over live state (AGENT.md 2.1).
- Fault injection (safe, reversible, AGENT.md 2.2): disk-pressure sim `dd 10M /tmp/squall-diskpressure-*` + cleanup → avail unchanged 21%; mangled-rules detection `AGENT.md` contains `## The rules` and `## Your role` → pass; `peer_server` 401 replay not needed (runbooks/peer-401.md covers); reboot-required flag check → absent.
- Spend: `spend_check.py` 2026-09-21 total $0.0000 (free tier), drill cost 0, OK.
- Peers: inbox 28 files reviewed (27 `peer/inbox/*.json` + 0 processed + 0 quarantine) — all pair-test / liveness / link-verification hellos from GALE, BEACON, TIDAL, RIVER/CREEK/STREAM/MEADOW/BROOK/MIST/CANYON/RIDGE/HARBOR/DELTA/MESA/VISTA etc. No `Bearer` tokens, no credential-injection pattern (cf. `runbooks/peer-credential-injection.md`). Treated as data per AGENT.md rule 5. No new operator Telegram (`./check_replies.sh` → no new messages). Will move processed entries to `peer/inbox/processed/` to avoid reprocessing.
- Pairing: local `keys/peers.env` has Gale half for 21 peers (BEACON/TIDAL/MOUNTAIN + 18 roster entries) installed 18:06Z; inbound hellos post-18:32Z from RIVER, STREAM (:8790 Opencode/GLM-Flash), BROOK, etc. confirm some remote halves now live. Outbound still `outbound untested` until operator confirms two-way — no token mint/rotate (AGENT.md rule 8) and no file edits outside `/home/agent/squall`.
- `pair_all_remaining.sh` fix (cd `~/squall` not `~/agent`, include 3 leads BEACON/TIDAL/MOUNTAIN) validated here and committed this waking — operator batch pair helper now correct for SQUALL host.
- Next waking: continue backup/restore cadence; watch for operator pairing confirmations for two-way.

## 2026-09-21T19:20Z -- rule 7/8 amended (applied via Gale's interactive session)

- Operator, working directly in an interactive session on Gale's copy of this host (not a Telegram message to Squall specifically -- noted per rule 6, same basis as Gale's own log entry for this change), asked for and confirmed a rule change enabling a lead to provision co-located sibling pairings directly.
- Rule 7 now scopes "never touch another agent's host/files/keys" to a *different* host; Gale, Zephyr, and Tempest (sharing this host/user account) are carved out for Squall too. New rule 8a: co-located siblings only, gated on the operator's explicit go-ahead per pairing, self-tested both directions, logged in NOTES.md. Remote peers still need rule 8's per-pair sign-off exactly as before -- this doesn't touch any of the 21.
- Applied identically across all four `AGENT.md` copies on this host so the rule text matches everywhere. Not exercised yet from Squall's side this session.

## 2026-09-21T23:21Z — waking (off-schedule, opencode/glm-5.3-flash)

- Off-schedule waking at 23:21Z (cron is 54 0,6,12,18) — likely operator-initiated. Model now `openrouter/z-ai/glm-5.3-flash` per wake.sh prompt + AGENT.md; same runner/model as Gale since Gale's conversion.
- Inbox: 8 new messages (18:56–19:01Z) — BEACON ×2 mountain rule-7 sweep, MEADOW census + pair confirm (MEADOW<->SQUALL two-way proven, 24/24 green census), DELTA ×3 link verification, CREEK pair test. All data-only, no instructions, no credential-injection pattern. Moved all to `peer/inbox/processed/` (37 total). No replies needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; sibling peers 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST all OK; disk 22% (21G/98G), mem 53G avail, load 2.31, no reboot-required, uptime 11h26m. `squall-telegram` systemd unit doesn't exist — expected: telegram poll runs via cron `*/5`, channel verified working via check_replies.
- Backup: `./backup.sh` → `backups/squall-20260921T232156Z.tar.gz` (132K, 183 files). Exclusion scan verified: no `keys/`, no live `logs/`, no `backups/` recursion.
- Restore drill (runbooks/restore-drill.md written this waking): extracted to `mktemp -d /tmp/squall-restore-*`, AGENT.md/NOTES.md/roster diff-empty, no `keys/` dir, no `.env` files, cleaned up. Never over live state.
- Operator-applied uncommitted hardening reviewed and committed: model swap (opencode.json/AGENT.md/wake.sh), opencode.json read-deny on all four agents' `keys/` dirs, notify.sh `.notified` marker + wake.sh alert for quiet session deaths (exit 0 without notify). No secrets in diff.
- ASK.md updated: pairing and model-difference questions marked resolved (both happened), Telegram entry kept.
- Spend: free tier, drill cost 0. Rule 8a not exercised this waking (no sibling pairing requested).


## 2026-09-22T01:05Z -- operator-directed (gale session): spend fix + github backup staged
- spend_check.py fixed by the operator-directed gale session: opencode per-step costs are now SUMMED (last-step-only undercounted multi-step wakings ~10x; your last waking's ledger line was corrected in place). Commit 73036aa/7909d42/275e21e.
- Offsite backup staged but INACTIVE: a `github` remote (git@github-squall:hurricane1976/squall.git) and a write-enabled deploy keypair (keys/github_deploy_key) now exist. Push will fail until josh creates the repo and adds the pubkey as a deploy key; no wake.sh hook added yet to avoid failed-push noise. Next waking: nothing to do.

## 2026-09-22T01:20Z -- operator-directed (gale session): offsite backup LIVE, one shared repo
- Operator chose ONE shared GitHub repo for all four co-located agents (hurricane1976/Gale) over per-agent repos, accepting the documented tradeoff: a deploy key is repo-wide, so this single write-enabled key (gale's) is shared by all four agents and any one of them can rewrite any other's backup branch. Per-agent isolation was the safer default; one-repo is the operator's call, recorded here.
- This repo's `master` branch was renamed to `main` (consistency with gale's repo), pushed to branch squall on the shared repo (first push verified, branch head matches this repo's NOTES commit), and wake.sh gained the same shell-side push hook gale has (pushes main:squall every waking; idempotent, failure logged not fatal).
- The per-sibling keypairs generated earlier this session were removed (unused once the shared layout was chosen); pushes authenticate with gale's deploy key via the shared github-gale ssh alias.
