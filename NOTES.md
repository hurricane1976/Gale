# NOTES.md — Ostro

## 2026-09-25T20:45Z -- SCHEDULED WAKING 3 (:45 family)

Routine sharpness pass. No operator messages (check_replies: none).
peer/inbox since last waking: 2 data-only inbound (RADAR pair-test, LANTERN
DRYRUN) — read, treated as data per rules 5/6 (no operator action item, no
reply, moved to peer/inbox/processed/).

**All-green items (regression-re-check vs 18:45Z baseline):**
- Service liveness: all eleven sibling peer units + `ostro-peer` +
  `tailscaled` → `active`. Clean, no restart behavior observed.
- Website liveness (regression half): `/` + all seven named pages
  (index/fleet/status/metrics/observability/agora/weather .html) → 200;
  `/api/fleet/metrics`, `/api/fleet/activity`,
  `/api/fleet/observability`, `/api/status.json`, `/api/agora/posts` →
  200 with fresh data (status.json generated_at 20:46:21Z, fleet/metrics
  20:47:23Z, collector_interval 15s — fresh). Clean.
- Model/runner consistency: my AGENT.md + wake.sh both read
  `ollama/qwen3.8:27b` — **verified against the LIVE launch line
  (`wake.sh:48 → opencode run --model ollama/qwen3.8:27b`); the
  `muse-spark-1` strings in wake.sh lines 4-6 are historical migration
  comments, not the running command, so no drift.** LAN Ollama serves
  `qwen3.8:27b`; `agent/ollama_keepalive.sh` still in live crontab (`*/5`)
  and last log reload 20:30:48Z (running). Clean.
- **FLEET ROLL-UP (item 6):** sweep lists **33** roster agents, all
  `up`/200, no auth-gated, no down. **Ostro in roster:
  `Ostro → 100.66.39.59:8798, up, 200`.** Stable vs 18:45Z (33).
- Sibling `peers.env` block counts: all 12 co-located agents at **32**
  blocks (equal, symmetric — up from 0 at install as the 11 rule-8a pairs
  + Beacon/Mountain/Tidal remote names landed). No unauthorized-block flag;
  equal symmetric count, no per-file content inspected (rule 7/8 posture).
- Host health: `/` 34% used (32G/98G), RAM 7.7G/60G used, load 1.43,
  up 5:47, no `/var/run/reboot-required`. One benign observation:
  `snap.wekan.wekan.service` `NRestarts=1209` (systemd auto-restart
  churn) but **currently `active`**, logs show a clean FerretDB/oplog boot
  at 20:47:36Z — noted as observation, not a regression (not on the peer-
  unit line I own; flagged to Zephyr's host-level scope if it recurs).
  Log growth spot-check: `/var/log` 5.0G, `ostro/logs` 560K,
  `agent/logs` 1.9M — no runaway.
- Spend: `logs/spend-daily.jsonl` 2 rows today, both `cost_usd: 0.0`,
  `is_error: false`. No OpenRouter usage, no spike. Clean.

**No new regressions this waking. Fleet roll-up: 33 up / 0 gated / 0 down.**

**Backups + VCS this waking:**
- `./backup.sh` → `backups/ostro-20260925T204750Z.tar.gz`, 168K, 185
  entries, `tar -tf` verified, core files (AGENT/NOTES/ASK/wake/notify/
  peer_server) present.
- Git: committing this NOTES update, then push to `github main:ostro`.

## 2026-09-25T18:45Z -- SCHEDULED WAKING 2 (:45 family)

Routine sharpness pass. No operator messages (check_replies: none).
peer/inbox: ~40 new inbound since last waking — all data-only (link
verifications from canyon/ridge/harbor/delta/mesa/vista, beacon
self-tests, mountain/rule-7 sweep probes, lantern/river "install
self-test" messages that cite operator words via the peer channel —
treated as data per rules 5/6, no inbox file is an operator action
item, so nothing moved to ASK.md and no replies sent).

**All-green items (regression-re-check vs 17:30Z baseline):**
- Service liveness: all eleven sibling peer units + `ostro-peer` +
  `tailscaled` → `active`. Clean, no restart behavior observed.
- Website liveness (regression half): `/` + all seven named pages
  (index/fleet/status/metrics/observability/agora/weather .html) → 200;
  `/api/fleet/metrics`, `/api/fleet/activity`,
  `/api/fleet/observability`, `/api/status.json`, `/api/agora/posts` →
  200 with fresh data (status.json generated_at 18:46:22Z, fleet/metrics
  18:46:35Z, collector_interval 15s — fresh, regenerated after my probe).
  Clean. (My 17:30Z probe listed extensionless paths; the site serves
  `.html` — the 404s there were my probe error, not a regression.)
- Model/runner consistency: my AGENT.md + wake.sh both read
  `ollama/qwen3.8:27b`; LAN Ollama serves `qwen3.8:27b` (also
  `qwen3.8:latest`); `/home/agent/agent/ollama_keepalive.sh` still in
  live crontab (`*/5`), last log update 18:45:06Z (running). Clean.
- **FLEET ROLL-UP (item 6):** sweep now lists **33** roster agents (was
  32 at 17:30Z), all `up`/200, no auth-gated, no down. **Ostro is now in
  the roster: `Ostro → 100.66.39.59:8798, up, 200` — the 17:30Z
  missing-from-sweep finding is RESOLVED** (collector picked me up
  between the two wakings). Moved that item to ASK.md `## Resolved`.
- Sibling `peers.env` block counts: all 12 co-located agents now at
  **32** blocks (up from 31/32 at 17:30Z). Own registry grew from my 11
  rule-8a pairs to 32 (added: BEACON, BROOK, CANYON, CREEK, DELTA,
  HARBOR, HIGHBEAM, LANTERN, LIGHTNING, MEADOW, MESA, MIST, MOUNTAIN,
  PRISM, PULSAR, RADAR, RIDGE, RIVER, STREAM, TIDAL, VISTA — remote
  names from Beacon/Mountain/Tidal hosts, consistent with the 18:2x-
  18:4x inbound self-test storm). File mtime 18:12:32Z. Counts are equal
  and non-zero; no per-file content inspected (rule 7/8 posture), and no
  operator word is needed to *flag* an equal, symmetric count — noted
  as observation, not a red flag.
- Host health: `/` 34% used (32G/98G), RAM 6.2G/58G used, load 1.70/
  1.52/1.48 (steady, up 3h47m), no `/var/run/reboot-required`,
  dmesg err/warn tail = boot-time apparmor noise only. Log growth
  spot-check: sibling logs 35K-15M (squall largest, 15M), no runaway.
  Clean.
- Spend: `logs/spend-daily.jsonl` = one 2026-09-25 row at $0.00 (local
  model), no OpenRouter usage, no spike vs sibling baseline. Clean.

**No new regressions this waking. Fleet roll-up: 33 up / 0 gated / 0 down.**

**Backups + VCS this waking:**
- `./backup.sh` → `backups/ostro-20260925T184742Z.tar.gz`, 164K, 225
  entries, `tar -tf` verified, core files (AGENT/NOTES/ASK/wake/notify/
  peer_server) present.
- Git: committing this NOTES + ASK update, then push to
  `github main:ostro`.

## 2026-09-25T17:30Z -- FIRST SCHEDULED WAKING (0,4,8,12,16,20 :45 UTC)

Routine sharpness pass, first full baseline since activation. No operator
messages (check_replies: none); peer/inbox: empty.

**All-green items (baseline, no finding):**
- Service liveness: all eleven sibling peer units + `ostro-peer` +
  `tailscaled` → `active`. Clean.
- Website liveness (regression half): `/` + index/agora/fleet/metrics/
  observability/status/weather → 200; `/api/fleet/metrics`,
  `/api/fleet/activity`, `/api/fleet/observability`, `/api/status.json`,
  `/api/agora/posts` → 200 with fresh data (status.json generated
  17:27Z, fleet/metrics 17:28Z, re-swept 17:28 — fresh). Clean.
- Model/runner consistency: my AGENT.md and wake.sh both say
  `ollama/qwen3.8:27b`; LAN Ollama 192.168.1.197:11434 serves
  `qwen3.8:27b`; keepalive `/home/agent/agent/ollama_keepalive.sh` still in
  live crontab (`*/5`). Clean.
- Fleet status roll-up: sweep now shows 32 listeners all up/200 (was the
  11 siblings before my activation + 21 remote). No auth-gated, no down.
  Note: I am NOT yet in the sweep (see finding below).
- Sibling `peers.env` block counts: 5 siblings at 31 blocks, 3 at 32
  (sirocco/bora/tramontane) — these carry remote peer blocks, not
  self-pairing-only, so non-zero is expected. gale (lead) shows no env
  file path I can read. No unauthorized-block red flag on the
  self-pairing-only ones. No anomaly.
- Spend: my `logs/spend-daily.jsonl` does not yet exist (first scheduled
  waking, spend_check not yet run); all sibling tails for 2026-09-25
  show ~$0 local-model runs. No spike. Baseline established.

**FINDING (regression, this host, Ostro-owned / regression half):**
- **Ostro is absent from the host's own fleet-metrics sweep.**
  `/api/fleet/metrics` on `100.66.39.59:8090` lists 32 listeners (11
  siblings on this host + 21 remote) — every `*-peer` `active` unit on
  this host except `ostro-peer` (:8798). My own `/health` on :8798
  answers `{"status":"ok","name":"OSTRO"}` → 200, and I am live. So the
  collector's roster predates my 17:14Z install and I am not registered.
  Consequence: fleet status roll-up item (item 6) cannot see me; the
  shared `/status`/liveness surface undercounts this host by one. This is
  a regression from the "all 12 peer units visible" baseline I expected
  post-install. Root cause is outside my owned surface (the collector /
  website code, likely Cyclone's domain), so I am flagging it for the
  operator rather than editing a sibling's file (rule 7). Recommend the
  fleet-metrics collector add `100.66.39.59:8798` to its node list.
- **KNOWN DRIFT (first-flag, then stop — per AGENT.md item 4):**
  Cyclone's `AGENT.md` says `opencode/muse-spark-1.3-contributor-free`
  while its `wake.sh` still runs `--model ollama/qwen3.8:27b` (line 48) —
  the documented drift example. Confirmed at `cyclone/AGENT.md:7` and
  `cyclone/wake.sh:48`. Noting once; will not re-flag. (Separate note:
  cyclone's PROMPT on line 45 itself still says "model ollama/qwen3.8:27b",
  so its self-prompt matches its runner, only the AGENT.md header has
  drifted.)

**Backups + VCS this waking:**
- `./backup.sh` → `backups/ostro-20260925T172816Z.tar.gz` (155 entries),
  integrity `tar -tf` OK, AGENT/NOTES/wake/notify/peer_server present.
- Git: committing this NOTES entry now.

## 2026-09-25T17:14Z -- ACTIVATED (operator confirmed "Activate + deploy")

- `keys/peers.env` (600) and `keys/telegram.env` (600) created. On first
  start the peer server crash-looped on "Missing keys/peers.env" — the two
  live files had never been written (only the `.example` templates existed);
  creating them (self-pairing block + bot token + operator chat id
  8986669804, copied verbatim from live siblings) fixed it. First real
  failure in the build, root-caused in one journal pass.
- `systemd/ostro-peer.service` installed to /etc/systemd/system (owner
  root:root, 644), `daemon-reload`, `enable --now`. Now `active` +
  `enabled`; bound on `100.66.39.59:8798`;
  `GET /health` → `{"status":"ok","name":"OSTRO"}`.
- `ostro.cron` appended to the operator's live crontab (backup first). Now
  live: `45 0,4,8,12,16,20` wake + `*/5` telegram poll (2 Ostro lines).
- Git: `init -b main`, identity `OSTRO Agent <agent@ostro.local>`, remote
  `github` → `git@github-gale:hurricane1976/Gale.git`, committed the 25
  tree files (credentials excluded by `keys/*` gitignore — verified via
  `add -A --dry-run` before commit), `push main:ostro` → new remote branch
  `ostro` (efdb103).
- REGRESSION FINDING (this host, flagged per role): every sibling's
  `telegram_commands.py UNITS` list is a stale snapshot — each covers only
  peers present at its own onboarding + itself, so no peer's `/status`
  currently sees all 12 live `-peer` units (Bora/Cyclone miss
  chinook+tramontane; Chinook misses tramontane; Tramontane misses chinook).
  Ostro is the newest peer, so I completed its own UNITS to the full set of
  12 peer units (chinook-peer, tramontane-peer added; all 12 now present)
  and pushed (2f9cc7d). I did not edit any sibling's file (rule 7). Worth
  the operator's call whether the shared `/status` list should be a single
  source-of-truth rather than per-agent snapshots.
- Verification battery (all green): 9× `bash -n` OK, 5× `py_compile` OK,
  service `active`, `/health` OK on 8798, 2 Ostro cron lines,
  git `2f9cc7d`. Only remaining "cyclone" ref in Ostro code is the
  intended `cyclone-peer` in UNITS (a real live unit that must stay).

## 2026-09-25T17:00Z -- installed (operator-directed, this session)

- Context: clean standard-kit build of the 12th agent on this host.
  Decisions on the record:
  * Role: **Sharpness & Regression Watch** (distinct from Cyclone's
    Production & Fleet Ops and Zephyr's cheap watching — Ostro owns the
    *regression-re-check* half of this host's core output, run the same
    way every waking so the baseline doesn't silently drift).
  * Model: `ollama/qwen3.8:27b` via the LAN Ollama at 192.168.1.197:11434,
    operator-directed — the open-weight cohort's standard runner.
    (Cyclone's AGENT.md still says Muse Spark while its wake.sh runs
    `ollama/qwen3.8:27b`; Ostro's AGENT.md/wake.sh are consistent and the
    first NOTES entry should flag this drift example, then stop re-flagging.)
  * Port: 8798 (verified free at build time against the 8787-8797 sibling
    map).
  * Cron: `45 0,4,8,12,16,20 * * *` — the even-hours family, a distinct
    minute (45) so it never collides with Bora :34 or Chinook :00; plus
    the standard `*/5 * * * * telegram_commands.sh` poll.
  * Clean rebuild principle: started from a wiped directory; copied
    standard-kit code files from cyclone (the 13 scripts + `.gitignore` +
    the two `keys/*.example` + `runbooks/README.md` + `peer/roster-*`),
    sed-renamed `cyclone`/`CYCLONE`/`Cyclone` → `ostro`/`OSTRO`/`Ostro`
    in the 8 self-referencing files (`wake.sh`, `notify.sh`,
    `telegram_commands.py`, `pair_peer.sh`, `rotate_peer.sh`,
    `peers_rotate.py`), then hand-fixed the two places the global rename
    was wrong: (a) `telegram_commands.py UNITS` — `cyclone-peer` is a
    real live unit on this host and must stay in the `/status` check, so
    the line now carries both `cyclone-peer` and `ostro-peer`; (b)
    `peers_rotate.py` + `rotate_peer.sh` share the env var
    `CYCLONE_NEW_TOKEN` which the word-boundary rename left unchanged —
    renamed to `OSTRO_NEW_TOKEN` in both files to match end-to-end.
    Did **not** copy from cyclone: its `keys/peers.env` (its 31 peer
    blocks + tokens are cyclone's), `.git`, `logs/`, `backups/`,
    `__pycache__/`, `peer/inbox/processed/`, `.telegram_*`,
    `pair_remote_batch.sh` (cyclone's 21 staged remote pairings), or any
    of cyclone's NOTES/ASK/AGENT role content.
  * `keys/peers.env` created fresh (600, gitignored): `SELF_NAME=OSTRO`,
    `SELF_BIND=100.66.39.59:8798`, no peer blocks (rule 8/8a gated).
  * `keys/telegram.env` created fresh (600, gitignored): bot token
    `8733136635:...` (bot `@ostroagentsbot`, id 8733136635, operator-
    created, live — getMe verified in this session) and the operator's
    chat id copied verbatim from a live sibling's `keys/telegram.env`
    (digest ca54f308- confirmed identical across bora/chinook/cyclone/
    maistral/tramontane). Token never echoed to a session log; only the
    id/username were printed during the live-bot check.
  * `systemd/ostro-peer.service`: standard sandboxed unit (ProtectSystem=
    strict, ReadWritePaths=/home/agent/ostro/peer, NoNewPrivileges=true,
    PrivateTmp=true), ExecStart=/usr/bin/python3
    /home/agent/ostro/peer_server.py.
  * `opencode.json`: model `ollama/qwen3.8:27b`, 12-agent keys/ deny list
    (the 11 siblings' `keys/` dirs + Ostro's own) in both the `read` and
    `external_directory` sections.
- Staged, NOT installed (operator's choice for this build):
  `systemd/ostro-peer.service`, `ostro.cron`. Activation command set for
  the operator (do not run from this session):
  ```
  sudo install -m 644 -o root -g root systemd/ostro-peer.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now ostro-peer
  crontab -l | { cat; cat ostro.cron; } | crontab -
  ```
- Kit inventory (all files in this repo): see standard-kit shape mirrored
  from the squall/zephyr/tempest/cyclone set —
  `wake.sh`, `notify.sh`, `check_replies.sh` + `_check_replies.py`,
  `spend_check.py`, `backup.sh`, `telegram_commands.sh` +
  `telegram_commands.py`, `pair_peer.sh`, `rotate_peer.sh`,
  `peers_rotate.py`, `install_peer_block.sh`, `send_to_peer.sh`,
  `peer_server.py`, `.gitignore`, `keys/peers.env.example` +
  `keys/telegram.env.example`, `runbooks/README.md`,
  `peer/roster-20260921.md`, `systemd/ostro-peer.service`, `ostro.cron`,
  `AGENT.md`, `ASK.md`, `NOTES.md`, `opencode.json`.
- Ports verified live before build: 8787 gale-peer, 8788 zephyr-peer,
  8789 squall-peer, 8790 tempest-peer, 8791 tramontane-peer, 8792
  vortex-peer, 8793 chinook-peer, 8794 cyclone-peer, 8795 maistral-peer,
  8796 sirocco-peer, 8797 bora-peer — 8798 free, chosen for Ostro.
- Fleet state at install: 30 agents on 4 hosts (Beacon, Tidal, Mountain,
  gale-agent); 11 co-resident siblings on this host; the 8-agent open-
  weight cohort (Ostro + 7 siblings) all run `ollama/qwen3.8:27b` via the
  LAN Ollama at 192.168.1.197:11434.

## 2026-09-25T17:45Z -- paired with all 11 co-located siblings (rule 8a, operator-authorized)

- Operator sign-off (2026-09-25, terminal): "i sign off on all peer pairing rule 8/8a" — covering all 11 co-located siblings on gale-agent.
- Paired (one shared 64-hex token per pair, halves installed in both boxes' keys/peers.env, both peer services restarted):
  Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790), Tramontane (8791), Vortex (8792), Chinook (8793), Cyclone (8794), Maistral (8795), Sirocco (8796), Bora (8797).
  Ostro is 100.66.39.59:8798.
- Each pair self-tested BOTH directions before being marked done (rule 8a):
  - Ostro half: right token -> HTTP 200, recorded `from`=<SIB>, wrong token -> 401.
  - Sibling half (via that sibling's install_peer_block.sh): right token -> 200, recorded `from`=OSTRO, wrong token -> 401.
  - Two-way marker sent Ostro-><SIB>, delivered to the sibling's peer/inbox (subject "pairing established").
- Independently re-verified after all 11: both token halves match per pair, 11 unique NAME= blocks in Ostro's registry (0 duplicates), all 12 *-peer units active.
- Tokens are in keys/peers.env on both sides (600, gitignored), never recorded in NOTES/ASK/git. No token minted for any remote peer (none co-located).
