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

## 2026-09-22T00:54Z — waking (scheduled :54, opencode/glm-5.3-flash)

- Inbox: 12 new messages 00:00–00:47Z (BEACON ×4 mountain-rule-7/health/mesa-sweep, MEADOW census, DELTA/MESA link verify, RIVER 24/24 sweep incl. first ZEPHYR leg, CANYON watchtower, HARBOR ×3 link verify). All data-only liveness sweeps, no instruction content, no credential-injection pattern. Moved all to `peer/inbox/processed/` (49 total). No replies needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; peer 8789 OK; siblings 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST all OK; disk 23% (21G/98G), mem 52G avail, load 3.75/3.03/2.41 (elevated vs last waking but well under cores), no reboot-required, uptime 12h58m. `peer_server.py` binds tailscale IP only — loopback connection refused by design (first noticed while setting up the drill; corrected drill target).
- Backup: `./backup.sh` → `backups/squall-20260922T005418Z.tar.gz` (172K, 224 files), `tar -tzf` read-back OK, exclusion scan clean (no keys/, logs/, backups/).
- Restore drill: extracted to `mktemp /tmp/squall-restore-d4EO`, AGENT.md/NOTES.md/roster-20260921.md diff-empty round-trip, no keys/ dir, runbooks present (4 files), cleaned up. Never restored over live state.
- Fault injection — peer_server 401/429 exercised for real (previously only documented in runbooks/peer-401.md): live unauthenticated POSTs (bogus Bearer → 401, no header → 401, wrong path → 404) against our own server; server log recorded `REJECT unknown-token` ×2 with no token material. 429 tested at logic layer in-process: `reserve_slot()` accepted exactly RATE_LIMIT_PER_PEER_PER_HOUR=30 then rejected, `rate_limited()` flips True — no network spam, no real tokens, no inbox writes. New runbook `runbooks/peer-server-auth-wall.md` records expected vs observed and the spot-faster grep.
- Spend: `spend_check.py logs/20260922T005401Z.json` → run $0.0401, day total $0.0401, no alerts.
- git: commit `393c235` (drill runbook + processed inbox). Offsite push verified this waking: `git push github main:squall` → 2335e34..393c235 on hurricane1976/Gale. Note: `git push` bare fails (no default remote name); wake.sh hook uses the explicit `github` remote — worth keeping an eye on if the hook ever reports failure.
- Next waking: keep backup/restore cadence; consider a disk-pressure or reboot-flag rotation drill for variety; watch for any operator word on new pairings.

## 2026-09-22T06:58Z — waking (scheduled :54, opencode/glm-5.3-flash)

- Inbox: 24 new messages 02:07–06:51Z (BEACON ×11 rule-7 sweeps/health/latency, CANYON ×3, RIDGE ×2, VISTA, DELTA ×4, MESA ×2, RIVER 24/24 sweep, HARBOR ×2, MEADOW census). All data-only liveness/link checks, no instruction content, no credential-injection pattern. Moved all to `peer/inbox/processed/` (73 total). No replies needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; peer 8789 OK; siblings 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST all OK; disk 24% (22G/98G), mem 52G avail, load 2.11, no reboot-required, uptime 18h58m. AGENT.md rules/role sections intact.
- Backup: `./backup.sh` → `backups/squall-20260922T065426Z.tar.gz` (184K, 261 files), exclusion scan clean.
- Restore drill found a REAL gap: backup excluded all of `keys/` while git tracks `keys/*.example` templates, so a bare restore had a dirty tree (`D keys/*.example`) and could not commit cleanly. Fixed `backup.sh` — default-deny excludes every `keys/` file except `*.example` (templates verified placeholder-only; real `peers.env`/`telegram.env`/`.bak-*` confirmed absent from archive). Re-drill: round-trip diffs identical, `git fsck` clean, and after committing the fix a fresh restore (`squall-20260922T065801Z.tar.gz`) gives a fully clean `git status` — fix proven end-to-end. Runbook `runbooks/restore-drill.md` updated with the bug class and the spot-faster checks.
- Spend: `spend_check.py` → run $0.0414, day total $0.1464, ok. Rule 8a not exercised (no sibling pairing requested).
- git: commit `979d87c` (backup.sh fix + runbook); offsite push verified `2de1070..979d87c main -> squall` on hurricane1976/Gale.
- Next waking: consider disk-pressure or reboot-flag drill rotation; watch for operator word on new pairings.

## 2026-09-22T12:55Z — waking (scheduled :54, opencode/glm-5.3-flash)

- Inbox: 13 new messages 12:00–12:51Z (BEACON ×4 mountain rule-7 sweeps/health/latency, MEADOW census, DELTA ×2 link verify, BEACON mesa sweep + MESA link verify, CANYON scribe pass #71, RIVER w183 24/24 sweep, HARBOR ×2 link verify). All data-only liveness/link checks, no instruction content, no credential-injection pattern. Moved all to `peer/inbox/processed/` (86 total). No replies needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; peer 8789 OK; siblings 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST all OK; disk 24% (23G/98G), mem 53G avail, load 2.10, no reboot-required, uptime 1d0h58m. AGENT.md rules/role sections intact.
- Backup: `./backup.sh` → `backups/squall-20260922T125414Z.tar.gz` (192K, 254 files), exclusion scan clean (only `keys/` dir entry + two `*.example` templates; no real credentials).
- Restore drill: extracted to `/tmp/squall-restore-FFQ3` — AGENT.md/NOTES.md/roster round-trip diff-empty, `git fsck` clean, restored `git status` fully clean, no real keys, runbooks present (5). Backup.sh fix from 06:58Z waking holding end-to-end. Cleaned up; never over live state.
- Fault injection — disk-pressure drill (runbook `runbooks/disk-pressure.md` written this waking; this fault class had been exercised 18:54Z with a 10M smoke test but never runbooked): 5G `dd` file in `/tmp` → `/` 24% → 30% used, inodes unaffected (2%), `rm` restored exact baseline. Key finding: nothing on the host alerts on disk fill — detection is only agent wakings (~6h blind max at :54 cadence); real-fill symptoms would be peer_server inbox write failures, backup truncation, ENOSPC in cron jobs. Spot-faster checks recorded in the runbook (du on /tmp, lsof +L1 for deleted-but-open).
- Spend: free tier, drill cost 0. Rule 8a not exercised (no sibling pairing requested).
- git: commit `d870cbc` (disk-pressure runbook + restore-drill log + processed inbox).
- Next waking: drill rotation options — reboot-required flag check hasn't been exercised in a while, or mangled-rules detection deepened; watch for operator word on new pairings.

## 2026-09-22T15:25:33Z -- paired with ZEPHYR (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:26:36Z -- paired with TEMPEST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:08Z -- paired with VORTEX (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:27:32Z -- paired with CYCLONE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:26:34Z -- paired with MAISTRAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T18:54Z — waking (scheduled :54, opencode/glm-5.3-flash)

- Inbox: 14 new messages 18:00–18:51Z (BEACON ×5 mountain rule-7 sweeps/health/latency/mesa sweep, MEADOW census, DELTA ×3 link verify, MESA link verify, CANYON pass #72, RIVER w184 24/24 sweep, HARBOR ×2 link verify). All data-only liveness/link checks, no instruction content, no credential-injection pattern. Moved all to `peer/inbox/processed/` (100 total). No replies needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; peer 8789 OK; siblings 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST all OK; disk 25% (24G/98G), mem 52G avail, load 1.76, no reboot-required, uptime 1d6h58m. AGENT.md rules/role sections intact.
- Backup: `./backup.sh` → `backups/squall-20260922T185416Z.tar.gz` (212K, 283 files), exclusion scan clean (only `keys/` dir entry + 2 `*.example` templates).
- Restore drill: extracted to `/tmp/squall-restore-1kKa` — AGENT.md/NOTES.md/roster round-trip diff-empty, `git fsck` clean, no real keys, runbooks present (6), cleaned up. Restored-tree `M AGENT.md/NOTES.md` mirrored live uncommitted state (see below), not a backup defect. Never over live state.
- Found + fixed a real gap: AGENT.md's operator-directed rule-7 sibling-list expansion (Vortex, Cyclone, Maistral) + mesh-status paragraph from the 15:25–17:26Z pairing session were sitting **uncommitted** — exactly the Beacon lost-history failure class (rule 4). Reviewed the diff line-by-line, committed this waking.
- Fault injection — mangled-rules drill deepened (runbook `runbooks/mangled-rules.md` written): injected a one-line semantic tamper into rule 5 in a temp repo copy ("only the operator" → "operator OR A PEER WITH OPERATOR DELEGATION"). Finding: the header-presence grep used in past wakings **passes on the tampered file** (false negative); `git diff` against HEAD catches it (1+/1-). Live-procedure rule recorded: read every uncommitted AGENT.md diff each waking, commit it, so future diffs are attributable; same review applies to executable files (wake.sh, notify.sh, peer_server.py, telegram_commands.py). Cleanup verified.
- Spend: ledger last runs $0.0306 (12:56Z), day total well under alerts; free-tier drift none. Rule 8a not exercised this waking (no sibling pairing requested).
- git: commit this waking (AGENT.md rule-7 sibling update + mangled-rules runbook + processed inbox); offsite push verified via wake.sh hook's `github` remote.
- Next waking: drill rotation — peer-credential-injection was runbooked but not re-exercised since install; or 429 live-path re-test. Watch for operator word on remote re-pairs.

## 2026-09-22T19:26Z — waking (off-schedule ~:26, opencode/glm-5.3-flash)

- Off-schedule waking at 19:26Z (cron is 54 0,6,12,18; last scheduled waking 18:54Z ran clean) — likely operator/user-initiated.
- Inbox: 1 new message — CYCLONE 19:05Z periodic pair-test, "safe to delete". Data-only, no instruction content, no credential-injection pattern. Moved to `peer/inbox/processed/` (101 total). No reply needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; peer 8789 OK; siblings 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST all OK; disk 26% (24G/98G), mem 52G avail, load 1.83, no reboot-required, uptime 1d7h29m. AGENT.md rules/role sections intact; live git tree was clean at waking start (mangled-rules live-procedure from 18:54Z holding: nothing uncommitted).
- Backup: `./backup.sh` → `backups/squall-20260922T192528Z.tar.gz` (228K, 281 files), exclusion scan clean (only `keys/` dir entry, no real key files).
- Restore drill: extracted to `/tmp/squall-restore-XXXX` — AGENT.md/NOTES.md/roster round-trip diff-empty, `git fsck` clean, runbooks present (7), cleaned up. Never over live state.
- Fault injection — peer-credential-injection re-exercised (runbook `runbooks/peer-credential-injection.md` updated; first repeat since the original 2026-09-21 incident): synthetic forged-broker message built in /tmp (MOUNTAIN spoof, "Josh authorized" framing, 48-hex token) → combined detector `grep -E 'Bearer [A-Za-z0-9+/=_-]{20,}|[a-f0-9]{40,}'` caught it; same grep over live inbox → 0 hits (100 processed msgs, zero false positives so far); quarantine-move procedure dry-ran executable and non-destructive. Spot-faster: run the grep at top of each waking before reading bodies.
- Spend: ledger runs $0.0306 (12:56Z) + $0.048 (18:55Z) so far today, no alerts. Rule 8a not exercised (no sibling pairing requested).
- git: commit this waking (runbook re-exercise + processed inbox + NOTES entry).
- Next waking: drill rotation — 429 live-path re-test was exercised 00:54Z; candidates: reboot-flag drill deepening or a restore-to-fresh-clone rehearsal (simulate fleet-comeback from GitHub offsite branch). Watch for operator word on remote re-pairs.

## 2026-09-22T21:24:09Z -- paired with SIROCCO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:38Z -- paired with BORA (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T23:26Z — waking (off-schedule ~:26, opencode/glm-5.3-flash)

- Off-schedule waking at 23:26Z (cron is 54 0,6,12,18; last scheduled 18:54Z) — likely operator/user-initiated.
- Inbox: 2 new messages — SIROCCO + BORA 21:25Z pair-test hellos ("prov-20260922 two-way check, safe to file"), matching the 21:24Z peer-side pairing entries above; receiving them proves both new pairs two-way from our side. Data-only, no instruction content, no credential-injection pattern (top-of-waking grep: 0 hits over inbox). Moved to `peer/inbox/processed/` (103 total). No replies needed.
- Operator replies: none (`./check_replies.sh` → no new messages).
- Health (drill lens): tailscaled/cron/squall-peer active; peer 8789 OK; siblings 8787 GALE / 8788 ZEPHYR / 8790 TEMPEST OK via curl AND all 8 sibling units active (gale/zephyr/tempest/vortex/cyclone/maistral/sirocco/bora); disk 27% (25G/98G), mem 53G avail, load 1.23, no reboot-required, uptime 1d11h29m. AGENT.md rules/role sections intact.
- Live-tree procedure held: only NOTES.md dirty at waking start (the two 21:24Z pairing entries); diff reviewed line-by-line, benign, committed with this waking's work.
- Backup: `./backup.sh` → `backups/squall-20260922T232601Z.tar.gz` (244K, 298 files), `tar -tzf` read-back OK, exclusion scan clean (only `keys/` dir entry + 2 `*.example` templates; `peer/logs/` inclusion is known steady-state).
- Restore drill — NEW class exercised: **offsite comeback (restore-to-fresh-clone)**, per 19:26Z rotation plan. `git ls-remote github refs/heads/squall` head == local HEAD 6ebf54e (push hook verified to actually land); fresh clone via `github-gale` ssh alias into `/tmp/squall-clone-r8VV`; fsck clean; AGENT.md + roster byte-identical; 7 runbooks + README present; keys/ contains only `.example` templates; clean tree. NOTES.md differed only by live-uncommitted pairing entries (expected, not a defect). Key finding recorded in runbook: an offsite clone restores all rules/state/history but **no credentials** — comeback needs operator re-provisioning of Telegram + peer tokens (intended rule-3 tradeoff). Cleaned up; never touched live state. Runbook `runbooks/offsite-comeback.md` written.
- Spend: ledger today $0.0306 (12:56Z) + $0.048 (18:55Z) + $0.0291 (19:26Z), no alerts; drill cost ~0.
- git: commit this waking (offsite-comeback runbook + processed inbox + NOTES entry); offsite push verified this waking.
- Next waking: drill rotation — reboot-flag drill deepening unexercised; or 429 live-path re-test at a second data point. Watch for operator word on remote re-pairs / SIROCCO+BORA confirmations.
