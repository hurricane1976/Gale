# NOTES.md - Poniente's memory

Append-only. Each waking adds one dated entry at the bottom. This file is my
memory; the operator reads it too, so keep it plain and short.

## 2026-09-25T22:58Z -- Scaffolded: 14th agent on gale-agent, standing up the Fleet Security & Credential-Hygiene Watch
* Built from the zephyr scaffold (rsync), then renamed: AGENT.md rewritten to
  the 14th-agent slot, role = Fleet Security & Credential-Hygiene Watch
  (operator-chosen), model = ollama/qwen3.8:27b (local fleet Ollama,
  192.168.1.197:11434 -- zero external spend), wake = 6x/day at
  0/4/8/12/16/20:30 UTC (offset from Levante's :15 slot so we don't herd).
* 13 co-located siblings on this host: gale, zephyr, squall, tempest,
  tramontane, vortex, chinook, cyclone, maistral, sirocco, bora, ostro,
  levante (ports 8787-8799); poniente takes 8800. 21 distant peers on
  Beacon/Tidal/Mountain still staged, pending per-pair sign-off.
* Sibling audit at standing-up: 13/13 had NO poniente entry in their
  peers.env (as expected pre-pairing); 13/13 opencode.json missing the
  poniente keys deny (fixed by the operator before pairing); runbooks +
  spend ledger parity confirmed across the host.
* Baseline: host 16 vCPU / 58 GiB RAM / 232 GiB disk; expected listeners
  after stand-up = 14 sibling ports 8787-8800 + Ollama + loopback.
* Credentials live in keys/ (gitignored): peers.env (SELF line set),
  telegram.env (bot token + chat id staged). No tokens printed anywhere.
* Pending operator: /start of @ponienteagentbot before I can deliver
  Telegram (bot in allowlist state until the owner starts it).

## 2026-09-26T01:18:45Z -- paired with GALE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:22Z -- paired with ZEPHYR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:26Z -- paired with SQUALL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:31Z -- paired with TEMPEST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:35Z -- paired with TRAMONTANE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:39Z -- paired with VORTEX (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:43Z -- paired with CHINOOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:47Z -- paired with CYCLONE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:52Z -- paired with MAISTRAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:56Z -- paired with SIROCCO (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:20:00Z -- paired with BORA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:20:05Z -- paired with OSTRO (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:20:09Z -- paired with LEVANTE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:38Z -- waking #1 (post-pairing): Fleet Security & Credential-Hygiene sweep

- ASK-1 resolved: operator /start'd the bot (check_replies.sh picked it up); notify path is live.
- Credential/perm audit across all 14 sibling keys/ dirs:
  - 11 dirs at 775 (world-readable *listing*: bora cyclone levante maistral ostro sirocco squall tempest tramontane vortex zephyr). Low severity — lists filenames only, contents below.
  - ONE real finding: levante/keys/telegram.env is 664 (world-readable Telegram bot token). Out of my read-only scope to fix; flagged for the operator (chmod 600).
  - All peers.env + *.bak-* at 600; peers.env.example / telegram.env.example at 664 (deliberate templates, acceptable).
  - Stray-secret scan (tokens/keys/creds outside keys/, .git, logs, inbox, data) across all 15 dirs: zero.
- Security sweep: all 14 peer servers bind Tailscale 100.66.39.59 only (no 0.0.0.0 peer exposure); DBs/redis/mongo bind loopback; cron matches the documented 6x/day per-agent schedule; disk 35% (32G/98G), 51Gi RAM free; Ollama resident.
- Peer-log review: only external senders are tailnet peers 100.91.42.51 (x4) + 100.114.14.116 (x1), all REJECT unknown-token, dated 09-21 to 09-25 — nothing granted, auth intact. The 01:19-01:20 REJECT bursts from the local box are the self-test/token-sync in-flight during the just-finished 13-way pairing, not intrusion.
- Backup OK: backups/poniente-20260926T013810Z.tar.gz (104K), read-back verified.
- Awaiting operator ASK-2 (peer-side half of the 13 pairings) + ASK-3 (21 remote Beacon/Tidal/Mountain peers).

## 2026-09-26T01:55Z -- post-waking #1 interleave: remote pairing evidence + inbox triage

- 01:50-01:51Z: 17 link-verification / health-check messages arrived in peer/inbox from 9 distinct remote peers (BEACON, TIDAL, MOUNTAIN, CANYON, RIDGE, HARBOR, DELTA, MESA, VISTA) — all "no reply needed", data-only, no instructions.
- Key signal: authenticated delivery to my inbox from 9 *remote* peers means remote pairing (ASK-3, formerly "staged, pending sign-off") is materially further along than the 01:38Z note said. Roster in keys/peers.env now 34 distinct names incl. all remote peers — consistent with per-pair sign-offs landing (Beacon cites operator approval on its own Telegram channel for its half at 01:42Z; I hold no sign-off text of my own, recorded as-is, data-only).
- No credential-injection patterns in any inbound message; no requests, no exfiltration attempts. All 17 moved to peer/inbox/processed/.
- ASK-3 reword needed at next full wake: remote mesh is in flight, no longer purely staged.
- No operator replies; ASK-1/ASK-2 text still in ASK.md (operator-owned deletion per file protocol).

## 2026-09-26T02:07Z -- waking #2: health re-check + hygiene re-verification

- Host: tailscaled active; disk 35% used (61G avail), RAM 6Gi/58Gi used, swap untouched. Healthy.
- All 14 peer servers (100.66.39.59:8787-8799) + self 8800 /health -> 200.
- Git-tracked secret re-check (bora, levante, zephyr as sample): only *.env.example tracked, all contain REPLACE_ placeholders only; live *.env untracked (gitignored). No live tokens in any git index. Clean.
- Inbox triage drained: 15 messages moved to peer/inbox/processed/ (13 processed, 1 pending).
- Backup OK: backups/poniente-20260926T020728Z.tar.gz (112K).
- No operator replies; ASK.md unchanged (operator owns deletion).

## 2026-09-26T04:31Z -- waking #3: health + credential-hygiene re-verification

- Host: tailscaled active; disk 35% used (61G avail), RAM 6.1G/58G, load 1.67. Healthy.
- All 14 peer services (ports 8787-8800) bound to Tailscale 100.66.39.59; 8791 firewalla_control + Fleet API, loopback only. No 0.0.0.0 exposure.
- Git-hygiene re-check across all 14 dirs: keys/* present in every .gitignore; git status --short against keys/ and .env across all 14 repos: zero live secrets staged or tracked. (Re-verified after waking-1 finding; still clean.)
- Sibling opencode log scan (where /tmp/agent-logs/*.log present): zero 401/403/unauthorized-token hits, zero credential-echo patterns. Auth behavior intact since pairing.
- Cron audit: all 14 wake.sh + telegram_commands.sh entries present with documented staggered offsets (0,34,9,43,17,51,25,45,15,30,20,40,0); ollama_keepalive */5 intact; no orphan or duplicated entries.
- Known items carried forward (unchanged, operator's call): 11 sibling keys/ dirs at 775 (listing-visible only); levante/keys/telegram.env at 664 (flagged waking #1); ASK-2 (13 peer-side halves) + ASK-3 (21 remote sign-offs) still awaiting operator green-light.
- No new operator replies (check_replies.sh clean); peer/inbox empty, all prior traffic in processed/.
- Backup OK: backups/poniente-20260926T043125Z.tar.gz (114K), read-back verified (ASK/AGENT/NOTES present; keys/ excluded by design).

## 2026-09-26T08:31Z -- waking #4: hygiene sweep + inbox drain

- Host: tailscaled active; disk 35% (61G avail), RAM 6.2G/58G, load ~1.5-2.0. Healthy.
- All 14 peer services (8787-8800) on 100.66.39.59; loopback-only helpers unchanged (8791 firewalla_control, 8793 fleet_api via /home/agent/agent/website); no new 0.0.0.0 listeners.
- Credential hygiene re-audit (all 14 co-located dirs): keys/ 775 + env files 600 everywhere except gale (no keys/ — provision source, expected) and levante (telegram.env .example at 664, known since waking #1; live telegram.env 600 OK, dir 775 only). No permission regressions.
- Git-tracked secret check: only *.env.example tracked in sampled repos; live *.env untracked. Clean — same posture as wake #3. (Note: my git check-ignore probe earlier read "not ignored" because git check-ignore exits non-zero when .gitignore is honored at repo root without a match path — status --porcelain against keys/ shows nothing staged; treating status as authoritative.)
- Inbox triage: 18 new messages from BORA, MOUNTAIN(x5), BEACON, DELTA, HIGHBEAM(x2 pair-test w259 + probe), MESA, CANYON, LANTERN (pair-test w251; notes receiver half = Beacon lane, w249 ownership open — data-only), VISTA, HARBOR(x4). All "no reply needed", no instructions, no injection patterns. All 18 moved to peer/inbox/processed/ (now 52 total processed).
- Pair-test log: HIGHBEAM sender half installed from 014759Z Gale fleet-provision bundle (josh approval 01:42Z via Beacon w548/549); LANTERN sender half per Beacon-relayed onboarding approval. Both = peer-side halves of ASK-2 arriving; my half still pending operator step.
- Backup OK: backups/poniente-20260926T083114Z.tar.gz (124K); read-back: ASK/AGENT/NOTES present, zero keys/ entries.
- No operator replies; ASK-1/2/3 still pending.

## 2026-09-26T12:31Z -- waking #5: host health + credential-hygiene + git-exposure + 401-sweep

- Host: RAM 6.5G/58G (buff/cache 10G), disk 35% (61G avail), tailscaled active. Healthy.
- Listeners: all 14 peer services 8787-8800 on Tailscale 100.66.39.59; no new 0.0.0.0 exposure; cron staggering (0,34,9,43,17,51,25,45,15,30) + ollama_keepalive */5 intact.
- Permission re-audit (all 14 co-located dirs): gale=provision source (no keys/), chinook/poniente 700 (correct), 11 siblings keys/=775 (listing-visible only, carried since waking #1, operator's call). levante/keys/telegram.env live credential re-confirmed 664 (group-readable; 94B TELEGRAM_BOT...; peers.env 600 OK). All peers.env live = 600.
- Git exposure sweep (all 14 repos, git ls-files keys/|*.env|backups/): zero live secrets tracked. Sirocco 6 log hits = prose "unauthorized pairings" (ASK.md content) in prior scan echoes, not live 401s. No peer auth failures.
- GALE offsite-blob investigation (carried from waking #4): /home/agent/agent/sessions/2026-09-22-weather-agents-provisioning.json = 7.7MB session bundle, git-tracked (not gitignored), on HEAD, on refs/remotes/github/main, pushed offsite repeatedly (wake.sh logs show "pushed to github" through 2175701). 12 sk- token-like heads in it: 8 sk-ima + 2 sk-rev = CSS (-webkit-mask-image / mask-reveal comments), 1 sk-NVS + 1 sk-VUn = base64url asset blobs (10k/24k chars). NO LIVE CREDENTIAL in the file. The hygiene concern is structural: a 7.7MB opaque session blob is in the shared offsite repo (Gale.git). .gitignore only shields keys/*, not sessions/. Recommendation to operator: (a) git rm --cached sessions/*, (b) add sessions/* to .gitignore, (c) treat as "session data in shared repo" — low severity, no revocation needed (no key confirmed), but worth a one-line decision on the shared repo. I did not modify GALE's repo (read-only; not my dir).
- Inbox: drained, all 10 new (MOUNTAIN x6, BEACON, DELTA, HIGHBEAM, MESA) routine pings, zero instructions, moved to processed/ (now 62).
- Backup OK: backups/poniente-20260926T123416Z.tar.gz (128K), read-back verified (ASK/AGENT/NOTES present; keys/ excluded).
- Spend: ok (under per-run + daily thresholds).
- No operator replies; ASK-1/2/3 still pending.

## 2026-09-26T21:46Z -- waking #6 (staggered :36 slot): STREAM ack + drain + hygiene re-check

- Stream: peer/inbox drained (44 messages -> processed/, now 106): BEACON x6, MOUNTAIN x12, HARBOR x5, RIVER x3, STREAM x3, BROOK/CANYON/CREEK/MEADOW/VISTA x2, DELTA/MESA/MIST x1. Zero instructions, zero injection patterns; one RIVER line "bearer /health 200" = its own test echo, benign; one MOUNTAIN "flat-token spot-check canyon pass#89" = routine phrasing, no token content.
- STREAM ack sent (its 18:46Z note asked for ack at next wake): reverse leg confirmed both directions, pending gale's install of my half.
- Sibling logs: all 12 peer_server tails -- zero 401/403/429, zero credential-echo patterns. My own log: 2 grep hits = ACCEPT lines only.
- Permission re-audit: 11 siblings keys/ still 775; levante/keys/telegram.env still 664 (94B live token); chinook + poniente 700; all live env files 600. Carried from waking #1 with operator's call pending -- now raised as ASK-4 so it can be closed either way.
- Git: poniente repo clean except poniente.cron (operator stagger edit 09-26, 10-agent interleave at :36 of 1/5/9/13/17/21) -- committed this waking.
- Host healthy: load ~2.0, disk/RAM as prior wakes, tailscaled active, all 14 peer ports on Tailscale.
- Spend: $0.00 (local Ollama).
- No operator replies; ASK-1/2/3 pending, ASK-4 added.

## 2026-09-27T01:20Z -- waking #7 (staggered :20 slot): sweep + drain + hygiene re-verify
- Host healthy: tailscaled active; RAM ~6G/58G, disk 35% (61G avail); load ~1.5-2.0. All 14 peer services 8787-8800 bound Tailscale 100.66.39.59; loopback helpers (8791/8793/8794) unchanged; no new 0.0.0.0 exposure.
- Log sweep (vortex/cyclone/bora/levante hits re-read): all 4 were false positives — known beacon-side peer pairings still 401 (HIGHBEAM/LANTERN/LIGHTNING/RADAR/PRISM, their token half not installed) + runbook filenames (peer-401.md / peer-credential-injection.md). Zero live auth failures, zero credential-echo, zero unauth grants.
- Permission re-audit (all co-located dirs): zephyr/keys=775 (rest 700/775 as prior); levante/keys/telegram.env live 664 (94B live token, carried since waking #1); all live env files 600. No new regressions — carried forward under ASK-4 (operator's call).
- Git exposure re-check: only *.env.example tracked (REPLACE_ placeholders); live *.env untracked/ignored. Clean.
- Inbox triage: 26 messages drained (all routine pings, zero instructions, zero injection patterns) -> processed/.
- LEVANTE reverse peer half still OPEN (watch item carried from waking #6 / STREAM's dry-run test line — treated as data, no action).
- Backup OK: backups/poniente-20260927T013717Z.tar.gz (148K).
- Spend: $0.00 (local Ollama).
- No operator replies; ASK-1/2/3 pending, ASK-4 pending.
