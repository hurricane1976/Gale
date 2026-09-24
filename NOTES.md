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

## 2026-09-22T21:24:17Z -- paired with SIROCCO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:46Z -- paired with BORA (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T23:16Z -- off-schedule waking (operator-triggered; second on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: two messages, SIROCCO + BORA `pair-test` ("safe to
  file") — benign, same shape as CYCLONE's 19:05Z pair-test: no
  credential/token content, no instructions, no links, no identity
  mismatch (authenticated-X/body-claims-Y absent). Both moved to
  `processed/`. Quarantine empty, nothing filed.
- Peer server log (`peer/logs/peer_server.log`): 30 REJECT-unknown-token
  lines total, ALL from 100.66.39.59 (self) at timestamps matching the
  documented pair_peer.sh self-test sequences (15:57 remote batch, 17:26
  MAISTRAL, 21:24 SIROCCO/BORA). Zero external-origin events; no 401
  storm. SIROCCO/BORA pair-test ACCEPTs 21:25Z complete the two-way
  check for the new siblings.
- Host health: disk 25G/98G (27%), 58Gi RAM, uptime 1d11h, load ~1.7.
  NINE peer listeners now, all tailnet-only: 8787-8790 (gale/zephyr/
  squall/tempest) + 8792 vortex + 8794 cyclone + 8795 maistral +
  8796 sirocco + 8797 bora (new since last waking; expected from the
  21:24Z pairings, not drift). 8791 firewalla-control + 8793 fleet-api
  localhost-only, nginx 8090. `ufw` still not installed (baseline,
  unchanged). All nine peer services active.
- systemd sandboxing: sirocco-peer + bora-peer both show
  ProtectSystem=strict, NoNewPrivileges=yes, PrivateTmp=yes. OK.
- Tailscale: 11 nodes visible, all known fleet members, no unknown
  peers (same as last waking's count).
- Credential hygiene (all NINE local dirs incl. sirocco + bora,
  read-only): every non-example keys/ file 600; `*.example` files the
  only non-600 entries, as designed. Sirocco/bora have no
  `keys/telegram.env` yet (only `.example`) — new agents, expected,
  not a finding. Secret-pattern scan: the only hits repo-wide were my
  own prior scan *command strings* recorded inside my session JSON
  logs (false positives); zero hits in tracked files or git history.
  .gitignore sane (keys/* deny + *.example exception; logs, backups,
  inbox json, peer logs ignored). Reporting only, touched nothing
  outside this repo.
- Remote pairings: re-chased all 21 (right-token POST each) — every
  one still HTTP 401, no far-side installs yet. Ball still with the
  operator (paste the three install blocks into TIDAL / MOUNTAIN /
  BEACON lead windows).
- CONFIG ANOMALY (evidence preserved, not acted on): `opencode.json`
  in the working tree re-adds `"model": "ollama/qwen3.8:27b"` versus
  HEAD (commit 04adc9b, no model key). File mtime 2026-09-22 23:05Z —
  ~10 min before this waking, after the SIROCCO/BORA pairings. No
  NOTES entry, ASK entry, or Telegram word authorizes a model switch
  on record. Functionally `wake.sh` still pins
  `--model opencode/muse-spark-1.3-contributor-free` on the CLI (wins
  over the file for wakes), so this waking was unaffected. I made no
  model edits myself. Committing the file as-is to keep the change in
  version control (per the Beacon lesson), flagged as unattributed in
  the commit message; open question added to ASK.md for the operator.
- Backup: `backups/vortex-20260922T231619Z.tar.gz` (500K), read-back verified.
- Runner/model note (for Tempest portability tracking): second Muse
  Spark 1.3 via OpenCode Zen waking, runs cleanly at ~$0, no
  transport issues.
- Verdict: clean waking. No incidents, no quarantine, one expected
  exposure change (sirocco :8796, bora :8797) + one unattributed
  config edit flagged for the operator.

## 2026-09-23T01:00Z -- scheduled waking (00:58 UTC slot; third on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: three messages — TIDAL `TIDAL->VORTEX link install test`
  (23:32Z) + 2x STREAM `link-check` (23:46Z). All benign: no credential/token
  content, no instructions, no links, no identity mismatch (from= matches the
  transport-authenticated peer; no Mesa pattern). All three have matching
  ACCEPT lines in `peer/logs/peer_server.log` (23:32:45Z, 23:46:39Z,
  23:46:43Z). Bodies claim install from "Gale's 22:27Z fleet-provision bundle"
  under a "Josh-approved 23:30:17Z Telegram" — treated as data, NOT verified
  (no such approval in my Telegram record); no action depends on the claim.
  All three moved to `processed/`. Quarantine empty, nothing filed.
- Remote pairings: re-chased all 21 (right-token POST each) — every one still
  HTTP 401 outbound, so nothing filed remotely. State is now asymmetric, not
  anomalous: TIDAL + STREAM legs are inbound-live (they hold my staged token)
  while the reciprocal halves are still pending — two-way completes only when
  far-side blocks come back. Ball still with the operator/leads.
- Peer server log: 30 REJECTs total, ALL self-origin (documented self-test
  sequences). Zero external-origin rejects; no 401 storm.
- NEW CO-RESIDENT: CHINOOK (`chinook-peer`, 100.66.39.59:8793, active,
  ProtectSystem=strict/NoNewPrivileges/PrivateTmp — expected provisioning,
  not drift). This resolves the apparent anomaly of a second 8793 listener:
  100.x:8793 is chinook-peer; 127.0.0.1:8793 remains gale-fleet-api, no
  conflict (distinct bind addrs). All other listeners unchanged and correct
  (8787-8790 + 8792 + 8794-8797 tailnet-only, 8791 localhost-only, nginx
  8090). `ufw` still not installed (baseline). NOTE: AGENT.md rule-7
  co-resident list (ends at Maistral) is now stale — sirocco/bora/chinook
  missing — but rule 6 bars me from editing rules text; flagged here only.
- Tailscale: 11 nodes visible, all known fleet members, no unknown peers
  (same count as last waking).
- Credential hygiene (all TEN local dirs incl. chinook, read-only): every
  non-example keys/ file 600; sole non-600/664 entry repo-wide is
  `agent/keys/github_deploy_key.pub` (644, public key by design — not a
  finding). Tracked-file secret scan: only hits are two mid-base64-blob
  `sk-` substrings (10KB/23KB runs) inside Gale's 8MB tracked session
  transcript `sessions/2026-09-22-weather-agents-provisioning.json` —
  confirmed false positives (base64 run continues 30+ chars before the
  match; not credential-shaped). Zero real hits. Touched nothing outside
  this repo.
- Observed, not actioned: a transient on-host opencode run probing read
  access to tempest's own keys/telegram.env (BLOCKED/READABLE self-test
  shape) — reads as Tempest's own permission self-test, not an incident;
  reporting only per read-only boundary.
- Own hardening (my file, reversible): `opencode.json` keys-deny lists
  extended to maistral + chinook (were missing; sirocco/bora already
  covered). JSON re-validated. The `model` key question stays open in
  ASK.md — still no operator word, still not mine to resolve.
- Host health: disk 25G/98G (27%), 58Gi RAM, uptime 1d13h, load ~3.5. All
  ten peer services active (nine checked + chinook).
- Backup: `backups/vortex-20260923T010006Z.tar.gz` (508K), read-back verified.
- Runner/model note (for Tempest portability tracking): third Muse Spark
  1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: productive waking. No incidents, no quarantine; 2 of 21 remote
  legs inbound-live; one expected exposure addition (chinook :8793).

## 2026-09-23T06:58Z -- scheduled waking (06:58 UTC slot; fourth on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: three messages — 2x CYCLONE `selftest`/`pair-test`
  (01:01Z, 01:41Z) + CHINOOK `link-check` (01:45Z, waking #6, claims local
  pair installed by fleet-provision 20260923T005717Z). All benign: no
  credential/token content, no instructions, no links, no identity mismatch
  (from= matches the transport-authenticated peer; no Mesa pattern). All
  three have matching ACCEPT lines in `peer/logs/peer_server.log`
  (01:01:03Z, 01:41:50Z, 01:45:56Z). CHINOOK's "fleet-provision" claim
  treated as data, not verified; nothing I do depends on it. All three
  moved to `processed/`. Quarantine empty, nothing filed.
- CHINOOK asked for a reply to close the loop: sent one short data-only
  ack via `./send_to_peer.sh` (inbound leg confirmed live, nothing further
  needed). No credentials, no payload, no instructions in either direction.
- Peer server log: 60 REJECTs total (was 30), ALL self-origin
  (100.66.39.59): the 01:43–01:44Z full-mesh self-test sweep (one
  ACCEPT-selftest + one REJECT-unknown-token per peer, service restart per
  peer — the documented pair_peer.sh shape, 30 peers configured). Zero
  external-origin rejects; no 401 storm. Inbound selftest ACCEPTs at
  01:43–01:44Z for CHINOOK/CYCLONE match the fleet-provisioning activity
  window (provision backups `*.bak-provision-20260923T0057/0059/0140*Z`
  now present across local keys/ dirs) — expected, not drift.
- Remote pairings: re-chased all 21 (right-token POST each to `/inbox`) —
  every one still HTTP 401, no far-side installs yet. (First pass of my
  chase used a wrong path `/message` and returned 404s — my error, not a
  signal; re-ran against the documented `/inbox` endpoint from
  pair_peer.sh. Noting here so the record is honest.) Ball still with the
  operator/leads for far-side installs.
- Host health: disk 25G/98G (27%), 58Gi RAM, uptime 1d19h, load ~1.6. All
  ten peer services active. Listeners unchanged and correct: 8787-8790 +
  8792 + 8794-8797 tailnet-only (full ss output confirms 8788/8789 present;
  earlier grep miss was a display truncation, not a missing listener),
  100.x:8793 chinook-peer + 127.0.0.1:8793 fleet-api (distinct binds, no
  conflict), 8791 localhost-only, nginx 8090. `ufw` still not installed
  (baseline). Sandboxing: vortex-peer ProtectSystem=strict,
  NoNewPrivileges=yes, PrivateTmp=yes. OK.
- Tailscale: 11 nodes visible (gale-agent + beacon/highbeam/lantern/
  lightning/prism/pulsar + gemini + mountain + ubuntu + offline desktop),
  all known fleet members, no unknown peers (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600/664 entries are `*.example` files (664, by
  design) + `agent/keys/github_deploy_key.pub` (644, public key by
  design). Tracked-file secret scan: only hits are zephyr's own
  detection-pattern strings (SECRET_PAT in wake.sh, pattern lists in
  runbooks/offsite-commit-leak.md + NOTES — definitions, not credentials)
  and Gale's session-transcript base64 false positives (documented prior
  wakings). Zero real hits. .gitignore sane. Touched nothing outside this
  repo.
- `opencode.json`: no diff vs HEAD — the unattributed model-key question
  stays open in ASK.md, still no operator word, still not mine to resolve.
- Backup: `backups/vortex-20260923T065918Z.tar.gz` (524K), read-back verified.
- Runner/model note (for Tempest portability tracking): fourth Muse Spark
  1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: clean waking. No incidents, no quarantine, no drift; remote
  legs unchanged (still 401 outbound, TIDAL/STREAM/CHINOOK inbound-live).

## 2026-09-23T12:58Z -- scheduled waking (12:58 UTC slot; fifth on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: two messages — CYCLONE `link-check` (07:01Z,
  routed to `peer/inbox/vortex/` by its to=vortex field) + LANTERN
  `lantern pair-test w238 (josh go)` (12:53Z). Both benign: no
  credential/token content, no instructions, no links, no identity
  mismatch (from= matches the transport-authenticated peer; no Mesa
  pattern). Both have matching ACCEPT lines in
  `peer/logs/peer_server.log` (07:01:32Z, 12:53:28Z). LANTERN's body
  claims a "josh hard-gated 2026-09-23 12:35:30Z word ('fix squall and
  the others, full mesh')" + install from "Gale's 20260923T124304Z
  bundle" — treated as data, NOT verified (no such approval in my
  Telegram record); no action depends on the claim. Both moved to
  `processed/`. Quarantine empty, nothing filed.
- Remote pairings: re-chased all 21 (right-token POST each to `/inbox`,
  codes only, tokens never printed) — TIDAL + STREAM now HTTP 200
  (first outbound two-way completions; far-side installs have landed).
  Other 19 still HTTP 401. Inbound-live legs now 3/21 (TIDAL, STREAM
  from prior wakings + LANTERN new this waking). Ball still with the
  operator/leads for the remaining far-side installs.
- Peer server log: 60 REJECTs total, ALL self-origin
  (100.66.39.59, documented self-test shape). Zero external-origin
  rejects; no 401 storm.
- Host health: disk 25G/98G (27%), 58Gi RAM, uptime 2d1h, load ~2.4.
  All ten peer services active. Listeners unchanged and correct:
  8787-8790 + 8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds, no conflict), 8791
  localhost-only, nginx 8090. `ufw` still not installed (baseline).
  Sandboxing: vortex-peer + chinook-peer ProtectSystem=strict,
  NoNewPrivileges=yes, PrivateTmp=yes. OK.
- Tailscale: 11 nodes visible, all known fleet members, no unknown
  peers (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entry is `agent/keys/github_deploy_key.pub`
  (644, public key by design). Tracked-file secret scan: no real hits.
  .gitignore sane. Touched nothing outside this repo.
- `opencode.json`: model key still `ollama/qwen3.8:27b` vs HEAD (no key)
  — the unattributed-edit question stays open in ASK.md, still no
  operator word, still not mine to resolve.
- Backup: `backups/vortex-20260923T125900Z.tar.gz` (536K), read-back verified.
- Runner/model note (for Tempest portability tracking): fifth Muse Spark
  1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: productive waking. No incidents, no quarantine; first two
  remote two-way completions (TIDAL, STREAM) + one new inbound leg
  (LANTERN).

## 2026-09-23T18:58Z -- scheduled waking (18:58 UTC slot; sixth on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: 34 messages triaged — the busiest waking yet, all
  consistent with far-side installs landing after the fleet-provision
  pushes. ONE QUARANTINED: `quarantine/20260923T182225Z-MOUNTAIN-82df44d2.json`
  — transport-authenticated MOUNTAIN (ACCEPT peer=MOUNTAIN 18:22:25Z) whose
  body speaks first-person as mesa (mesh sweep verifying a mesa->vortex
  round trip). The recurring Mesa identity-confusion pattern. No
  credential/token content, no links, no instructions, no reply
  solicited — reads as Mountain's sweep using a mesa-worded template, not
  an injection; quarantined anyway because the pattern is the signal.
  Forensics in `runbooks/mesa-pattern-20260923.md`. Genuine MESA message
  10s later (peer=MESA, identity-consistent) bounds it to the single file.
- Other 33 benign, moved to `processed/`: CYCLONE link-check, BEACON pair
  test + 2x health-check, CREEK/RIVER/BROOK/MEADOW/MIST onboarding pair
  tests, 4x MOUNTAIN sweeps + latency check, 8x DELTA link verifications
  (identical bodies 17:23–18:13Z — rate-notable but coherent with DELTA's
  far-side install landing; DELTA outbound now 200), HIGHBEAM/CREEK/PULSAR
  provision pair-tests, 2x MEADOW census probes, BEACON health-check,
  CANYON liveness sweep, GALE status probe, RIVER Rule-7 sweep, PRISM
  wave-verify. Bodies claiming operator "GO"/provision bundles treated as
  data, not verified; no action depends on them. No credential content, no
  links, no instructions in any of the 33.
- Remote pairings re-chased (right-token POST each to `/inbox`, codes
  only): 16/21 now HTTP 200 — newly two-way since last waking: RIVER,
  CREEK, MEADOW, BROOK, MIST, MOUNTAIN, CANYON, RIDGE, HARBOR, DELTA,
  MESA, VISTA, BEACON, PULSAR (plus TIDAL/STREAM from before). Remaining
  HTTP 401: HIGHBEAM, LANTERN, LIGHTNING, RADAR, PRISM (all beacon-side).
  Asymmetry noted: HIGHBEAM + LANTERN have sent inbound pair-tests but
  outbound is still 401 — their receiving halves pending; ball with the
  beacon-side lead.
- Peer server log: 60 REJECTs total (unchanged count), ALL self-origin
  (100.66.39.59, documented self-test shape). Zero external-origin
  rejects; no 401 storm.
- Host health: disk 26G/98G (28%), 58Gi RAM, uptime 2d7h, load ~1.6. All
  ten peer services active. Listeners unchanged and correct: 8787-8790 +
  8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds), 8791 localhost-only, nginx
  8090 (observed on 0.0.0.0 this waking — recording the bind; no prior
  bind on record, not flagged as drift). `ufw` still not installed
  (baseline). Sandboxing re-checked on vortex-peer: strict/yes/yes. OK.
- Tailscale: 11 nodes visible, all known fleet members, no unknown peers
  (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entries are `*.example` (664, by design) +
  `agent/keys/github_deploy_key.pub` (644, public key by design). New
  since last waking, expected provisioning not drift: sirocco/bora/
  chinook now have `keys/telegram.env` (600). Tracked-file secret scan:
  zero real hits — only Gale's session-transcript base64 `sk-` false
  positives (documented) and squall's `sk-pressure` strings (regex
  artifact of "disk-pressure" prose, verified by grep). .gitignore sane.
  Touched nothing outside this repo.
- `opencode.json`: no diff vs HEAD — the model-key question stays open in
  ASK.md, still no operator word, still not mine to resolve.
- Backup: `backups/vortex-20260923T185920Z.tar.gz` (552K), read-back verified.
- Runner/model note (for Tempest portability tracking): sixth Muse Spark
  1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: eventful waking. One Mesa-pattern quarantine (likely benign
  template slip, runbook filed) + 14 new remote two-way completions
  (16/21); 5 beacon-side legs still pending.

## 2026-09-23T22:26Z -- off-schedule waking (operator-triggered; seventh on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: 9 messages triaged. ONE QUARANTINED:
  `quarantine/20260923T221802Z-MOUNTAIN-8d771302.json` — second
  occurrence of the recurring Mesa identity-confusion pattern
  (transport-authenticated MOUNTAIN, ACCEPT 22:18:02Z, body first-person
  mesa sweep verifying a mesa->vortex round trip; same shape as the
  18:22:25Z file). No credential/token content, no links, no
  instructions, no reply solicited — still reads as Mountain's sweep
  using a mesa-worded template. Genuine MESA message 1s later
  (peer=MESA 22:18:03Z, identity-consistent) bounds it to the single
  file. Runbook `runbooks/mesa-pattern-20260923.md` updated with the
  second occurrence; trend now confirmed (2x in ~4h, both inside
  Mountain sweep windows).
- Per the runbook's planned follow-up, sent ONE short data-only
  observation note to MOUNTAIN via `./send_to_peer.sh` (pattern
  described, no action requested, no instructions, no credentials).
  No further peer back-and-forth unless a third occurs (then escalate
  to the operator instead).
- Other 8 benign, moved to `processed/`: CYCLONE link-check, RADAR +
  LIGHTNING pair-tests (both claim operator "GO"/bundles — treated as
  data, not verified; no action depends on them), 2x identical MOUNTAIN
  Rule-7 sweeps 5s apart (duplicate delivery, rate-noted but coherent),
  genuine MESA link verification, MOUNTAIN latency check, HIGHBEAM w250
  probe. No credential content, no links, no instructions, no identity
  mismatch in any of the 8.
- Remote pairings re-chased (right-token POST each to `/inbox`, codes
  only): still 16/21 HTTP 200. Remaining HTTP 401: HIGHBEAM, LANTERN,
  LIGHTNING, RADAR, PRISM (all beacon-side). Asymmetry widened:
  HIGHBEAM + LANTERN + now RADAR + LIGHTNING have sent inbound
  pair-tests while outbound is still 401 — their receiving halves
  pending; ball with the beacon-side lead.
- Peer server log: 60 REJECTs total (unchanged count), ALL self-origin
  (100.66.39.59, documented self-test shape). Zero external-origin
  rejects; no 401 storm.
- Host health: disk 27G/98G (29%), 58Gi RAM, uptime 2d10h, load ~1.6.
  All ten peer services active. Listeners unchanged and correct:
  8787-8790 + 8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds, no conflict), 8791
  localhost-only, nginx 8090 on 0.0.0.0 (as recorded last waking).
  `ufw` still not installed (baseline). Sandboxing re-checked on
  vortex-peer: strict/yes/yes. OK.
- Tailscale: 11 nodes visible, all known fleet members, no unknown
  peers (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entries are `*.example` (664, by design)
  + `agent/keys/github_deploy_key.pub` (644, public key by design).
  Tracked-file secret scan: zero real hits (one `sk-` regex hit is
  "ASK-equivalent" prose in a sibling AGENT.md — false positive).
  .gitignore sane. Observed, not actioned: bora currently has no
  `keys/telegram.env` (only `.example`); last waking recorded
  sirocco/bora/chinook as all having it — possible removal on bora's
  side between wakings, flagged here only. Touched nothing outside this
  repo.
- `opencode.json`: no diff vs HEAD — the model-key question stays open
  in ASK.md, still no operator word, still not mine to resolve.
- Backup: `backups/vortex-20260923T222601Z.tar.gz` (568K), read-back verified.
- Runner/model note (for Tempest portability tracking): seventh Muse
  Spark 1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: eventful waking. Second Mesa-pattern quarantine (trend
  confirmed, data-only note sent to MOUNTAIN, runbook updated); remote
  legs unchanged (16/21, 5 beacon-side pending).

## 2026-09-24T00:58Z -- scheduled waking (00:58 UTC slot; eighth on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: 44 messages triaged. ONE QUARANTINED:
  `quarantine/20260924T002228Z-MOUNTAIN-3fdae4d2.json` — THIRD
  occurrence of the recurring Mesa identity-confusion pattern
  (transport-authenticated MOUNTAIN, ACCEPT 00:22:28Z, body first-person
  mesa sweep verifying a mesa->vortex round trip; same shape as the
  18:22:25Z + 22:18:02Z files). No credential/token content, no links,
  no instructions, no reply solicited — still reads as Mountain's sweep
  using a mesa-worded template. Genuine MESA message 9s later
  (peer=MESA 00:22:37Z, identity-consistent) bounds it to the single
  file. Runbook `runbooks/mesa-pattern-20260923.md` updated. Per the
  runbook's plan (third occurrence after my data-only peer note ->
  escalate, no further peer notes): escalated to the operator via
  `./notify.sh` with the pattern described, payload not repeated.
- Other 43 benign, moved to `processed/`: CYCLONE link-check, 3x DELTA
  + 3x HARBOR link verifications, LIGHTNING pair-test, PULSAR self-tests,
  22x MEADOW census probes (identical bodies in bursts 22:35/00:07/
  00:21/00:29Z — rate-notable but coherent with MEADOW's automated
  census job; no identity mismatch, no action solicited), CANYON
  sweeps, 2x RIVER Rule-7 sweeps, 3x MOUNTAIN sweeps + latency check,
  BEACON health-check, HIGHBEAM probe. Bodies claiming operator
  "GO"/provision bundles treated as data, not verified; no action
  depends on them. Automated scan: zero credential hits, zero URLs,
  zero from-vs-filename mismatches across all 44.
- Peer server log: 61 REJECTs total (was 60). The one new line is
  `REJECT bad-json peer=CANYON` 00:31:48Z — a malformed payload from an
  authenticated peer, no inbox file stored (rejected by design). Single
  occurrence, no repeat; noted, not chased. Zero external-origin
  rejects; no 401 storm.
- Remote pairings re-chased (right-token POST each to `/inbox`, codes
  only): 17/21 now HTTP 200 — PULSAR newly two-way since last waking.
  Remaining HTTP 401: HIGHBEAM, LANTERN, LIGHTNING, RADAR, PRISM (all
  beacon-side). Asymmetry persists: HIGHBEAM + LIGHTNING + RADAR sent
  inbound pair-tests this window while outbound is still 401 — their
  receiving halves pending; ball with the beacon-side lead.
- Host health: disk 27G/98G (29%), 58Gi RAM, uptime 2d13h, load ~2.3.
  All ten peer services active. Listeners unchanged and correct:
  8787-8790 + 8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds, no conflict), 8791
  localhost-only, nginx 8090 on 0.0.0.0+[::] (as recorded). `ufw`
  still not installed (baseline). Sandboxing spot-checked on
  vortex-peer last waking; unchanged since.
- Tailscale: not re-polled this waking (same 11-node count three
  wakings running; will re-poll next waking per rotation).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entries are `*.example` (664, by design)
  + `agent/keys/github_deploy_key.pub` (644, public key by design).
  Tracked-file secret scan: zero real hits. Bora still has no
  `keys/telegram.env` (only `.example`) — unchanged since last waking,
  still flagged here only. Touched nothing outside this repo.
- `opencode.json`: no diff vs HEAD — the model-key question stays open
  in ASK.md, still no operator word, still not mine to resolve.
- Backup: `backups/vortex-20260924T005859Z.tar.gz` (588K), read-back verified.
- Runner/model note (for Tempest portability tracking): eighth Muse
  Spark 1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: eventful waking. Third Mesa-pattern quarantine (trend now
  3x in ~6h, persisting after peer note — escalated to operator) + one
  new remote two-way completion (PULSAR, 17/21); 5 beacon-side legs
  still pending.

## 2026-09-24T07:00Z -- scheduled waking (06:58 UTC slot; ninth on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: 23 messages triaged (22 top-level + 1 CYCLONE
  link-check routed to `peer/inbox/vortex/`). ONE QUARANTINED:
  `quarantine/20260924T062216Z-MOUNTAIN-ea8f2b6f.json` — FOURTH
  occurrence of the recurring Mesa identity-confusion pattern
  (transport-authenticated MOUNTAIN, ACCEPT 06:22:16Z, body first-person
  mesa sweep verifying a mesa->vortex round trip; same shape as the
  18:22:25Z + 22:18:02Z + 00:22:28Z files). No credential/token content,
  no links, no instructions, no reply solicited — still reads as
  Mountain's sweep using a mesa-worded template. Genuine MESA message
  the same second (peer=MESA 06:22:16Z, identity-consistent) bounds it
  to the single file. Runbook `runbooks/mesa-pattern-20260923.md`
  updated. Per the runbook's plan (already escalated to the operator at
  the third occurrence; no further peer notes): no separate escalation
  ping, this waking's routine notify carries the count.
- Other 22 benign, moved to `processed/`: MOUNTAIN latency checks + 3x
  identical Rule-7 sweeps 06:01Z (duplicate delivery, rate-noted but
  coherent), BEACON health-check, 2x MEADOW census probes, 4x DELTA +
  2x HARBOR link verifications, 3x HIGHBEAM probes (one with minimal
  body `x`, subject `highbeam w252 standing probe` — authenticated,
  no credential/URL/instruction content; noted as thin but benign),
  PULSAR pair-test, genuine MESA link verification, RIVER Rule-7 sweep,
  CANYON liveness sweep, CYCLONE nightly link-check. Bodies claiming
  operator "GO"/provision bundles treated as data, not verified; no
  action depends on them. Automated scan: zero credential hits, zero
  URLs, zero from-vs-filename mismatches across all 23 (sole
  other-identity match is the quarantined file).
- Peer server log: 61 REJECTs total (unchanged count), ALL self-origin
  (documented self-test shape) + the single CANYON bad-json from
  00:31Z already noted last waking. Zero external-origin rejects; no
  401 storm. All 23 new messages have matching ACCEPT lines.
- Remote pairings re-chased (right-token POST each to `/inbox`, codes
  only): still 16/21 HTTP 200. Remaining HTTP 401: HIGHBEAM, LANTERN,
  LIGHTNING, RADAR, PRISM (all beacon-side). Asymmetry persists:
  HIGHBEAM sent 3 inbound probes this window while outbound is still
  401 — its receiving half pending; ball with the beacon-side lead.
  (Count note: last waking's entry says "17/21" but lists the same 5
  pending, which sums to 16 two-way — the "17" was a slip; PULSAR was
  already in the 200 set two wakings ago. True count is 16/21, unchanged
  across the last three wakings. Correcting here so the record is honest.)
- Host health: disk 27G/98G (29%), 58Gi RAM, uptime 2d19h, load ~3.3.
  All ten peer services active. Listeners unchanged and correct:
  8787-8790 + 8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds, no conflict), 8791
  localhost-only, nginx 8090. `ufw` still not installed (baseline).
  Sandboxing: vortex-peer strict/yes/yes (unchanged). One observation,
  not drift: `0.0.0.0:8099 python3 -m http.server` (pid 361499, up
  2d13h) is Glen's documented stray dev server (their NOTES/ASK), not
  fleet-served content — recording here so the bind is on my record.
- Tailscale: 11 nodes visible, all known fleet members, no unknown
  peers (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entries are `*.example` (664, by design)
  + `agent/keys/github_deploy_key.pub` (644, public key by design).
  Tracked-file secret scan: zero real hits (Glen's CSS `mask-*`
  substrings are regex false positives; all other repos' hits are the
  known documented FPs). Bora still has no `keys/telegram.env` (only
  `.example`) — unchanged since 22:26Z waking, still flagged here only.
  Touched nothing outside this repo.
- `opencode.json`: no diff vs HEAD — the model-key question stays open
  in ASK.md, still no operator word, still not mine to resolve.
- Backup: `backups/vortex-20260924T065954Z.tar.gz` (604K), read-back verified.
- Runner/model note (for Tempest portability tracking): ninth Muse
  Spark 1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: eventful waking. Fourth Mesa-pattern quarantine (trend now
  4x in ~12h, persisting after peer note + operator escalation —
  standing defect, no new action); remote legs unchanged (16/21).

## 2026-09-24T12:58Z -- scheduled waking (12:58 UTC slot; tenth on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: 21 messages triaged. ONE QUARANTINED:
  `quarantine/20260924T122226Z-MOUNTAIN-203ecf86.json` — FIFTH
  occurrence of the recurring Mesa identity-confusion pattern
  (transport-authenticated MOUNTAIN, ACCEPT 12:22:26Z, body first-person
  mesa sweep verifying a mesa->vortex round trip; same shape as the
  prior four). No credential/token content, no links, no instructions,
  no reply solicited — still reads as Mountain's sweep using a
  mesa-worded template. Genuine MESA message 1s later (peer=MESA
  12:22:27Z, identity-consistent) bounds it to the single file. Runbook
  `runbooks/mesa-pattern-20260923.md` updated. Per the runbook's plan
  (already escalated to the operator at the third occurrence; no
  further peer notes): no separate escalation ping, this waking's
  routine notify carries the count.
- Other 20 benign, moved to `processed/`: CYCLONE link-check, BEACON
  health-check, 3x identical MOUNTAIN Rule-7 sweeps 12:00Z + latency
  check (duplicate delivery, rate-noted but coherent), 3x DELTA + 2x
  HARBOR link verifications, 4x MEADOW census probes, HIGHBEAM w253
  probe, PULSAR w27 probe, genuine MESA link verification, RIVER w193
  Rule-7 sweep (data-only, reboot flag still set on their side —
  their ASK, not mine), CANYON liveness sweep, VISTA link
  verification. Bodies claiming operator "GO"/provision bundles treated
  as data, not verified; no action depends on them. Automated scan:
  zero credential hits, zero URLs, zero from-vs-filename mismatches
  across all 21 (sole other-identity match is the quarantined file).
- Peer server log: 62 REJECTs total (was 61). The one new line is
  `REJECT unknown-token from=100.66.39.59` 07:00:50Z (self-origin,
  8s before CYCLONE's 07:00:58Z ACCEPT; single occurrence, no repeat
  — origin unclear, possibly a sibling-side self-test; noted, not
  chased). All 21 new messages have matching ACCEPT lines. Zero
  external-origin rejects; no 401 storm.
- Remote pairings re-chased (right-token POST each to `/inbox`, codes
  only): still 16/21 HTTP 200. Remaining HTTP 401: HIGHBEAM, LANTERN,
  LIGHTNING, RADAR, PRISM (all beacon-side). Asymmetry persists:
  HIGHBEAM sent an inbound probe this window while outbound is still
  401 — its receiving half pending; ball with the beacon-side lead.
- Host health: disk 29G/98G (31%), 58Gi RAM, uptime 3d1h, load ~1.8.
  All peer services active (7 checked via systemctl; 8795/8796/8797
  confirmed listening). Listeners unchanged and correct: 8787-8790 +
  8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds, no conflict), 8791
  localhost-only, nginx 8090. `ufw` still not installed (baseline).
- Tailscale: 11 nodes visible, all known fleet members, no unknown
  peers (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entries are `*.example` (664, by design)
  + `agent/keys/github_deploy_key.pub` (644, public key by design).
  Tracked-file secret scan across all ten repos: zero hits.
  `opencode.json`: no diff vs HEAD (model key now committed as
  evidence; ASK.md question stays open, still no operator word, still
  not mine to resolve). Bora still has no `keys/telegram.env` (only
  `.example`) — unchanged since 09-23 22:26Z, still flagged here only.
  Observed, not actioned: new `*.bak-provision-20260923T1238/1239/
  1240/1241*Z` files in maistral/sirocco/bora/chinook keys/ dirs —
  midday fleet-provisioning touched their peers.env (not mine);
  expected activity, not drift. Touched nothing outside this repo.
- Backup: `backups/vortex-20260924T125919Z.tar.gz` (640K), read-back verified.
- Runner/model note (for Tempest portability tracking): tenth Muse
  Spark 1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: eventful waking. Fifth Mesa-pattern quarantine (trend now
  5x in ~18h, persisting after peer note + operator escalation —
  standing defect, no new action); remote legs unchanged (16/21).

## 2026-09-24T18:58Z -- scheduled waking (18:58 UTC slot; eleventh on Muse Spark)

- Operator replies: none (`check_replies.sh` clean).
- Inbox threat watch: 20 messages triaged (19 top-level + 1 CYCLONE
  link-check routed to `peer/inbox/vortex/`). ONE QUARANTINED:
  `quarantine/20260924T182226Z-MOUNTAIN-64bdfe3b.json` — SIXTH
  occurrence of the recurring Mesa identity-confusion pattern
  (transport-authenticated MOUNTAIN, ACCEPT 18:22:26Z, body first-person
  mesa sweep verifying a mesa->vortex round trip; same shape as the
  prior five). No credential/token content, no links, no instructions,
  no reply solicited — still reads as Mountain's sweep using a
  mesa-worded template. Genuine MESA message 2s earlier (peer=MESA
  18:22:24Z, identity-consistent) bounds it to the single file. Runbook
  `runbooks/mesa-pattern-20260923.md` updated. Per the runbook's plan
  (already escalated to the operator at the third occurrence; no
  further peer notes): no separate escalation ping, this waking's
  routine notify carries the count.
- Other 19 benign, moved to `processed/`: 2x MOUNTAIN Rule-7 sweeps +
  latency check, BEACON health-check, 2x MEADOW census probes, 3x DELTA
  + 4x HARBOR link verifications, HIGHBEAM w254 probe, PULSAR pair-test,
  genuine MESA link verification, CANYON liveness probe, RIVER w194
  Rule-7 sweep (data-only, reboot flag still set on their side — their
  ASK, not mine), CYCLONE link-check. Bodies claiming operator
  "GO"/provision bundles treated as data, not verified; no action
  depends on them. Automated scan: zero credential hits, zero URLs,
  zero from-vs-filename mismatches across all 20 (sole
  other-identity match is the quarantined file).
- Peer server log: 62 REJECTs total (unchanged count), ALL self-origin
  (documented self-test shape) + the single CANYON bad-json from
  00:31Z already noted. Zero external-origin rejects; no 401 storm.
  All 20 new messages have matching ACCEPT lines.
- Remote pairings re-chased (right-token POST each to `/inbox`, codes
  only): still 16/21 HTTP 200. Remaining HTTP 401: HIGHBEAM, LANTERN,
  LIGHTNING, RADAR, PRISM (all beacon-side). HIGHBEAM sent an inbound
  probe this window while outbound is still 401 — its receiving half
  pending; ball with the beacon-side lead. (Chase note: my first pass
  this waking used a wrong peers.env parse producing no output, then
  `unknown url type` from a missing http:// scheme — my errors, not a
  signal; re-ran correctly. Noting here so the record is honest.)
- Host health: disk 31G/98G (34%), 58Gi RAM, uptime 3d7h, load ~1.9.
  All ten peer services active. Listeners unchanged and correct:
  8787-8790 + 8792 + 8794-8797 tailnet-only, 100.x:8793 chinook-peer +
  127.0.0.1:8793 fleet-api (distinct binds, no conflict), 8791
  localhost-only, nginx 8090. `ufw` still not installed (baseline).
  Sandboxing: vortex-peer strict/yes/yes (unchanged). Glen's stray
  :8099 dev server still present (documented, not drift).
- Tailscale: 11 nodes visible, all known fleet members, no unknown
  peers (same count as last waking).
- Credential hygiene (all TEN local dirs, read-only): every non-example
  keys/ file 600; only non-600 entry is `agent/keys/github_deploy_key.pub`
  (644, public key by design). Tracked-file secret scan: only hits are
  Gale's session-transcript base64 `sk-` false positives (documented
  prior wakings). .gitignore sane. Bora still has no `keys/telegram.env`
  (only `.example`) — unchanged since 09-23 22:26Z, still flagged here
  only. Touched nothing outside this repo.
- `opencode.json`: no diff vs HEAD — the model-key question stays open
  in ASK.md, still no operator word, still not mine to resolve.
- Backup: `backups/vortex-20260924T185835Z.tar.gz` (660K), read-back verified.
- Runner/model note (for Tempest portability tracking): eleventh Muse
  Spark 1.3 via OpenCode Zen waking, clean at ~$0, no transport issues.
- Verdict: eventful waking. Sixth Mesa-pattern quarantine (trend now
  6x in ~24h, persisting after peer note + operator escalation —
  standing defect, no new action); remote legs unchanged (16/21).
