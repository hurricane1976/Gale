# NOTES.md — Vortex

## 2026-09-22T16:10Z -- first unattended waking (manual/early; next scheduled slot 18:58 UTC)

- Operator replies: none. `peer/inbox/`: empty (no pending, no quarantine) — nothing
  to triage; nothing to process or move.
- Host health: disk 23G/98G (25%), 58Gi RAM, uptime 1d4h, load ~1.9. All six peer
  listeners on 100.66.39.59 (8787-8790 gale/zephyr/squall/tempest + 8792 vortex +
  8794 cyclone), 8791 firewalla-control + 8793 fleet-api on 127.0.0.1 only, nginx
  8090. Tailscale: 15 nodes, all expected fleet members, no unknown peers.
- `ufw` is not installed on this host (command not found) — recording as baseline;
  no change detected since install, no firewall drift I can report.
- Peer service logs (24h): zero 401/unauthorized events across gale/zephyr/
  squall/tempest/cyclone/vortex — no auth storm after pairing. Login history:
  LAN-only (192.168.1.197 / .69), operator sessions only; nothing from
  external IPs.
- systemd sandboxing: vortex-peer + cyclone-peer both show ProtectSystem=strict,
  NoNewPrivileges=yes, PrivateTmp=yes. OK.
- Credential hygiene (all six local dirs, read-only): every non-example keys/ file
  is 600; `*.example` 664 as designed. Secret-pattern scan of tracked files AND
  full git history in agent/zephyr/squall/tempest/vortex/cyclone: 0 hits each.
  .gitignore sane (keys/* default-deny, *.example exception). One observation,
  not an action: `zephyr/keys/peers.env.bak-pre-FAKEPEER-20260921T174137Z` —
  zephyr's own backup from yesterday's fake-peer incident; perms 600, in
  their dir, nothing for me to do, but noted here as the one fleet artifact
  tied to an injection event still on this box.
- `logs/wake-skipped.log` has a single 15:08Z refusal ("TELEGRAM_CHAT_ID not
  set") — expected, pre-bot-creation; bot + keys filled by 15:35. No repeated
  refusals; cron not hammering.
- Backup: `backups/vortex-20260922T160930Z.tar.gz` (464K), read-back verified.
- Runner/model note (for Tempest's portability tracking): first opencode +
  ollama/qwen3.8:27b unattended waking so far; session ran cleanly, ~0 cost,
  no API-transport issues this waking. One quirk observed: model is
  qwen3.8:27b while sibling agents' design notes referenced qwen3.8:latest —
  pinning to 27b is the AGENT.md-specified one; keep watching whether other
  non-OpenRouter runners hit the same version-naming gap.
- Verdict: clean waking. No incidents, no quarantine, no drift to chase.

## 2026-09-22T14:25Z -- installed (operator-directed interactive session)

- Context: operator asked 13:52Z to "build me 2 more agents" on this box; the
  design session (opencode, ollama qwen3.8:latest) produced the proposals and
  the operator's answers, then disconnected mid-build with nothing created.
  This session resumed and completed the build. Decisions on the record:
  Vortex = Security Sentinel & Threat Forensics, Cyclone = Production &
  Fleet Ops; both run `ollama/qwen3.8:27b` via opencode (first non-OpenRouter
  agents on this host — deliberate interop data point); full standard kit,
  **staged for operator to enable**; Gale's onboarding scope = prep + full
  pairing staging (42 remote pair commands, operator-executed).
- Kit (all files in this repo, mirrored from the squall/zephyr/tempest kit
  with per-agent adaptation): `AGENT.md` (role + rules, co-resident list now
  includes Cyclone), `ASK.md`, this NOTES, `opencode.json` (model
  `ollama/qwen3.8:27b`; permission-denied: all six agents' keys/ dirs),
  `wake.sh` (opencode runner, 45m guard, flock, spend record, shell-side
  alert, offsite push to `github main:vortex`), `peer_server.py`
  (unchanged from siblings; binds `SELF_BIND=100.66.39.59:8792` from
  `keys/peers.env`), `notify.sh` (`[VORTEX]` prefix), `spend_check.py`,
  `backup.sh`, `check_replies.sh` + `_check_replies.py`,
  `telegram_commands.sh` + `telegram_commands.py` (UNITS list extended to all
  six peer services), `pair_peer.sh` (restarts `vortex-peer`),
  `rotate_peer.sh` + `peers_rotate.py` (service name fixed to `vortex-peer` —
  the squall donor copy still hardcoded `gale-peer`),
  `install_peer_block.sh`, `send_to_peer.sh`, `.gitignore`,
  `keys/peers.env.example` + `keys/telegram.env.example`,
  `peer/roster-20260921.md`, `runbooks/`.
- `keys/peers.env` created (600, gitignored): SELF_NAME=VORTEX,
  SELF_BIND=100.66.39.59:8792, **no peer blocks yet** — pairing is staged,
  not run (rule 8). No `keys/telegram.env` yet (bot placeholder).
- Staged, NOT installed (operator's choice): `systemd/vortex-peer.service`,
  `vortex.cron` (`58 0,6,12,18 * * *` waking — after Tempest's :56; plus the
  5-minute telegram poller line). Activation commands in ASK.md.
- Ports verified live before build: 8787-8790 taken by gale/zephyr/squall/
  tempest (tailnet-only), 8791 firewalla-control + 8793 fleet-api
  (localhost-only) — hence 8792 for Vortex and 8794 for Cyclone.
  (The design session's question text said "8791/8792"; 8791 turned out to
  be taken, noted here so the record is honest.)
- Model verified live: `opencode run --model ollama/qwen3.8:27b` smoke run
  answered in ~0.3s, cost $0 (LAN Ollama at 192.168.1.197:11434, provider
  already defined in the host's global opencode config).
- Pairing staged, matching this host's house pattern (every agent pairs the
  lead + the full remote fleet; sibling↔sibling pairs stay unestablished,
  same as Zephyr/Squall/Tempest): `./pair_remote_batch.sh` (21 remote
  peers) + `~/agent/pair_new_siblings.sh vortex` (Gale lead spoke). 22
  pairings total, all rule-8 gated, operator-run. Sibling↔sibling pairs are
  NOT staged (would each need a per-pair rule-8a go-ahead; tooling exists at
  `~/agent/pair_siblings.sh`).
- Git: new repo, branch `main`, author "VORTEX Agent <agent@vortex.local>".
  Remote `github` -> shared fleet offsite repo (hurricane1976/Gale, branch
  `vortex`), same write-enabled deploy key as the other four agents
  (one-repo layout, operator-chosen 2026-09-22).
- Next: operator activation (ASK.md), first waking after the Telegram bot
  exists, pairing runs, then normal routine.

## 2026-09-22T15:26:48Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:27:02Z -- paired with ZEPHYR (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:06Z -- paired with SQUALL (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:11Z -- paired with TEMPEST (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:15Z -- paired with CYCLONE (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:35Z -- local mesh complete; service + cron live

- Operator's rule-8a go-ahead (via gale, who executed on our behalf per the
  operator's delegation "gale should be able to set up their peer links,
  comms"): ALL four sibling pairs confirmed two-way (GALE, ZEPHYR, SQUALL,
  TEMPEST, CYCLONE) — the "peer side pending" notes above are now complete.
- `systemd/vortex-peer.service` enabled+running by the operator;
  `vortex.cron` in the live crontab: wake at :58 of 0/6/12/18 UTC (4/day)
  + telegram_commands poll every 5 min.
- Remote pairings (21): gale-host halves INSTALLED + self-tested
  2026-09-22 (operator sign-off in chat); see the follow-up entry
  below. Remote halves await the lead-side installs; two-way
  checks pending per peer.

## 2026-09-22T15:56:30Z -- paired with TIDAL (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:34Z -- paired with RIVER (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:38Z -- paired with CREEK (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:42Z -- paired with STREAM (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:46Z -- paired with MEADOW (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:50Z -- paired with BROOK (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:54Z -- paired with MIST (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:59Z -- paired with MOUNTAIN (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:03Z -- paired with CANYON (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:07Z -- paired with RIDGE (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:11Z -- paired with HARBOR (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:15Z -- paired with DELTA (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:19Z -- paired with MESA (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:23Z -- paired with VISTA (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:27Z -- paired with BEACON (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:32Z -- paired with HIGHBEAM (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:36Z -- paired with LANTERN (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:40Z -- paired with LIGHTNING (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:44Z -- paired with RADAR (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:48Z -- paired with PRISM (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:52Z -- paired with PULSAR (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T16:01Z -- 21 REMOTE pairings: gale-host halves INSTALLED + self-tested

- Operator sign-off given in-chat (2026-09-22, "run the batch, hand me
  pastable scripts per lead" = per-pair rule-8 authorizations for this
  agent's 21 remote peers). All 21 pair_peer.sh runs passed self-test
  (200 right-token / 401 wrong-token).
- Pair test to each of the 21 from this agent: HTTP 401 as expected until
  the remote halves install (far side pending).
- Deliverables: /home/agent/agent/peer/outbound/install-blocks-
  (tidal-host|mountain-host|beacon-side)-VORTEX-CYCLONE.txt (git-ignored;
  tokens on disk only, mode 600). Operator pastes each into that cluster's
  lead window (TIDAL / MOUNTAIN / BEACON). Lead-side instructions cover:
  install both blocks for each of the 7 agents, restart, self-test,
  two-way check, NOTES entry, stop+report on any non-200/401 result.
- Two-way completes only at the far side; as each confirmation lands,
  record it here.

## 2026-09-22T16:45Z -- remote pairing chase: all 21 still 401 (no far-side installs yet)

- Re-ran the documented pair test (one POST per peer, right token) to all
  21 remote peers from this agent: TIDAL RIVER CREEK STREAM MEADOW BROOK
  MIST (tidal-host), MOUNTAIN CANYON RIDGE HARBOR DELTA MESA VISTA
  (mountain-host), BEACON HIGHBEAM LANTERN LIGHTNING RADAR PRISM PULSAR
  (beacon-side) -- every one returned HTTP 401.
- Peer inboxes empty: no confirmations or replies received.
- Local halves remain installed + self-tested; deliverables intact at
  /home/agent/agent/peer/outbound/install-blocks-<cluster>-VORTEX-CYCLONE.txt.
- Ball is with the operator: paste the three install blocks into the
  TIDAL / MOUNTAIN / BEACON lead windows. Will re-chase on request or at
  the next waking.

## 2026-09-22T16:35Z -- Telegram label bug fixed: /commands replies said [SQUALL]

- Operator reported that waking VORTEX/CYCLONE via Telegram produced a
  "response from squall". Diagnosis: telegram_commands.py send() was
  adapted from squall's handler and still hardcoded the "[SQUALL] "
  prefix on every reply. The replies themselves came from the correct
  bots (@vortexagentsbot / @cycloneagentsbot) -- only the label was wrong.
- Fixed: prefix is now "[VORTEX] " (cyclone's is "[CYCLONE] "); py_compile
  clean; end-to-end send() check delivered a labeled test message to the
  operator chat.
- Note: vortex's 16:09Z wake was real and ran to completion. Cyclone's
  /wake never arrived at its bot (empty command log, no wake logs) --
  flagged to the operator to re-send.

## 2026-09-22T17:26:42Z -- paired with MAISTRAL (Vortex half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T19:21Z -- scheduled waking (18:58 UTC slot; first on Muse Spark)

- Operator replies: drained one poller-queued message, "Yes the word is
  given" (already recorded as the open Telegram line in ASK.md; still
  ambiguous what it authorizes — leaving open, no action taken on it).
  Direct getUpdates poll: no new messages.
- Inbox threat watch: one message, CYCLONE `pair-test` ("safe to delete") —
  benign, no credential/token content, no instructions, no links, no
  identity mismatch. Moved to `processed/`. Quarantine empty, nothing
  filed. No Mesa-pattern (authenticated-X/body-claims-Y) traffic seen.
- Peer server log review: only ACCEPT-selftest / REJECT-unknown-token pairs
  from 100.66.39.59 (pair_peer.sh self-test sequences, expected), MAISTRAL
  selftest ACCEPT 17:26Z, CYCLONE pair-test ACCEPT 19:05Z. 27 peers
  configured (5 local + MAISTRAL + 21 remote). Zero unexpected-origin
  events; no 401 storm (grep over peer logs: 0 non-self-test rejects).
- Host health: disk 24G/98G (26%), 58Gi RAM, uptime 1d7h, load ~2.1. All
  six services active. Listeners: 8787-8790 + 8792 + 8794 still
  tailnet-only, plus NEW 100.66.39.59:8795 = MAISTRAL (new co-resident
  sibling, paired 17:26Z; tailnet-only, sandboxing strict/NoNewPrivileges
  confirmed — expected change, not drift). 8791 + 8793 localhost-only,
  nginx 8090. `ufw` still not installed (baseline, unchanged).
- Tailscale: 11 nodes visible vs 15 at last waking's baseline; all 11 are
  known fleet members, no unknown peers. Delta may be offline nodes not
  shown — noting, not chasing.
- Credential hygiene (all SEVEN local dirs incl. maistral, read-only):
  every non-example keys/ file 600; secret-pattern scan of tracked files
  AND full git history in all seven repos: 0 hits. .gitignore sane
  (keys/* deny + *.example exception; inbox *.json + logs ignored).
  Reporting only, touched nothing outside this repo.
- Forensics — root-caused the failed 18:59Z waking: `logs/20260922T185801Z.json`
  shows opencode exit 1 = OpenRouter HTTP 429, "qwen/qwen3.8-27b:free is
  temporarily rate-limited upstream". That explains the operator's
  between-wakings switch to `opencode/muse-spark-1.3-contributor-free`
  (Zen). This waking is the first on Muse Spark and runs cleanly at ~$0.
- Committed the operator-session changes that landed between wakings
  (model-switch edits to AGENT.md/wake.sh/opencode.json, Maistral added to
  co-residents, [VORTEX] label fix, ASK.md Telegram line, 16:35/16:45/17:26
  NOTES entries) together with this waking's work — repo clean again.
  I made no rule/role edits myself (rule 6).
- Remote pairings: not re-probed this waking (last chase 16:45Z, all 401,
  ball with operator for far-side installs). Will re-chase next waking.
- Backup: `backups/vortex-20260922T192127Z.tar.gz` (468K), read-back verified.
- Runner/model note (for Tempest portability tracking): Muse Spark 1.3 via
  OpenCode Zen works as a drop-in wake runner on first try; session JSON
  logging + spend path identical shape to the qwen runs (this run ~$0,
  spend-daily.jsonl records only error/nonzero — nothing to record).
- Verdict: clean waking. No incidents, no quarantine, one expected exposure
  change (maistral :8795).
