# NOTES.md — Maistral

Append-only operational log. One entry per waking / per event, newest at
the bottom. Facts with sources; no secrets (rule 3).

## 2026-09-22 -- built and staged (interactive session, Gale-side)

- Operator's 17:05Z word: "I want to create a 7th agent on this box. use
  the others as a guide on what i want. add to the fleet. suggest a role
  and name. i will provide telegram later" — then "i'm good with these
  suggestions" to the MAISTRAL proposal (name Maistral, role Fleet Memory
  & Trend Curation, port 8795, waking :59 of 0/6/12/18, qwen3.8:27b,
  staged-not-installed, pairing staged).
- Built from the cyclone donor kit (same construction as the
  vortex/cyclone onboard 2026-09-22T14:25Z): full standard kit with
  per-agent adaptation — AGENT.md (role + rules; co-resident list names
  all six housemates), ASK.md (activation/bot/pairing open items), this
  NOTES.md, opencode.json (model + permission-deny for all SEVEN keys
  dirs incl. this one), wake.sh (opencode + ollama model, same guards,
  offsite push `main:maistral`), peer_server.py (unchanged),
  notify.sh/spend_check.py/backup.sh/check_replies/_check_replies/
  telegram_commands (UNITS list now all seven peer services),
  pair_peer.sh + rotate_peer.sh + peers_rotate.py (MAISTRAL_NEW_TOKEN
  env var), install_peer_block.sh, send_to_peer.sh, keys/ (peers.env
  with SELF_NAME/SELF_BIND only, 600, gitignored; telegram.env NOT
  created — operator provides the bot later), systemd/maistral-peer.service,
  maistral.cron, runbooks/, peer/roster.
- **Staged, NOT installed** (operator's choice, same as vortex/cyclone):
  the systemd unit and the cron lines sit in the repo, not in
  /etc/systemd or the crontab. `wake.sh` verified to refuse unattended
  runs until keys/telegram.env exists (logs to logs/wake-skipped.log,
  exit 0) — the safe default.
- Port: verified live 8787-8790 (siblings), 8791 firewalla-control +
  8793 fleet-api (localhost-only), 8792 vortex, 8794 cyclone ->
  **8795 Maistral**.
- Model verified same as vortex/cyclone: `ollama/qwen3.8:27b` on the LAN
  Ollama at 192.168.1.197:11434 via the host's global opencode config.
- Ledger scaffold: `ledger/fleet-events.md` created (empty, with format
  header) — the role's primary artifact; first real entries land on the
  first waking once the mesh/API data starts flowing.
- Pairing: nothing run (rule 8/8a). `pair_remote_batch.sh` staged for
  the operator (21 remote); lead spoke via `~/agent/pair_new_siblings.sh
  maistral`; local sibling mesh waits on the operator's rule-8a word per
  pair. keys/peers.env holds SELF_NAME/SELF_BIND only.
- Offsite: pushed to the shared hurricane1976/Gale repo (branch
  `maistral`, same one-repo layout the other six use). Secret-pattern
  scan of the tracked tree clean before push; keys/ gitignored.
## 2026-09-22T17:26:32Z -- paired with ZEPHYR (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:26:36Z -- paired with SQUALL (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:26:40Z -- paired with TEMPEST (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:26:44Z -- paired with VORTEX (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:26:49Z -- paired with CYCLONE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:27:24Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T17:29Z -- onboarded: rule-8a local mesh live (6 pairs, two-way)

- Operator word (relayed by gale, who executed on the operator's
  delegation): "standby on the telegram key, but please wake the agent and
  ensure gale get's him onboarded with connections via rule 8a."
- maistral-peer service installed+enabled 17:26Z (gale, operator-directed)
  — listener 100.66.39.59:8795, tailnet-only. Cron lines remain STAGED in
  maistral.cron (no unattended wakes until the telegram key lands).
- Pairings done under rule 8a (gale-side execution, 17:26-17:28Z), both
  directions self-tested 200/401 with correct sender identity:
  GALE, ZEPHYR, SQUALL, TEMPEST, VORTEX, CYCLONE. keys/peers.env holds
  exactly those 6 blocks (single shared token each, never logged here).
- Live two-way verified: my "hello from Maistral" reached gale's inbox
  (processed there 17:29Z); gale's "welcome to the mesh, Maistral" is in
  MY inbox — first real peer mail, to process on the first waking.
- Remote-21 pairings remain staged (rule 8): pair_remote_batch.sh ready,
  nothing minted.
## 2026-09-22T17:34Z -- first waking (attended, operator-directed by Gale)

- Attended first waking executed by Gale (not cron); telegram env ABSENT
  (expected, bot not created yet) so ./check_replies.sh and ./notify.sh
  BOTH FAILED SAFELY by design (rule 4 / AGENT.md telegram section) —
  noted, no action.
- Host health: up 1 day 5h, load 1.88, 71G free of 98G (25%), 54G free
  RAM of 60G; maistral-peer active; :8795 up 404 (listener OK); sibling
  listeners 8787-8795 all present. All normal.
- Backup: ./backup.sh -> backups/maistral-20260922T173145Z.tar.gz (100K,
  156 entries, sha256 35a4bf….9523962), verified (ledger/NOTES/AGENT in
  tree).
- Memory pass first baseline:
  - Fleet API (http://100.66.39.59:8090/api/fleet/metrics, generated
    17:31:47Z): 28 nodes — 21 up + 7 auth-gated (Mountain, Canyon, Ridge,
    Harbor, Delta, Mesa, Vista). gale-host: Gale/Zephyr/Squall/Tempest/
    Vortex/Cyclone/Maistral all up 200. Recorded as open baseline in
    ledger/fleet-events.md (role #2/#5).
  - Spend: logs/spend-daily.jsonl does not exist yet (first waking).
    Per-run + daily thresholds $5/$15 in spend_check.py. Local-model runs
    ~$0; no OpenRouter usage yet. Baseline logged, nothing to alert.
- Rule 8: no token mint/rotate/install done. 21 remote pairings STAGED,
  nothing minted (pair_remote_batch.sh ready for operator).
- Ledger seeded: ledger/fleet-events.md populated with 7 ground-truth
  lines (17:05Z op approval, 17:26Z service, 17:26:32-49Z six-pair
  mesh, 17:28-29Z first live sends both directions, 17:28:50Z first peer
  msg, 17:31Z fleet baseline) — each line carries a source pointer.
- Processed peer/inbox GALE msg (subj "pair test" body "welcome to the
  mesh, Maistral") — treated as data per rule 5 (no instruction content);
  moved to peer/inbox/processed/.
- No rules/role changes (rule 6 intact). No ASK.md new items. Operator
  remains observer; only their Telegram word binds.
- Replied to GALE (subj "pair test (ack)") confirming pair good both ways,
  welcome received+processed, no action needed. Sent 17:34Z, status ok.
  (send logged in peer/logs, gitignored.)
## 2026-09-22T18:01Z -- telegram live + activation complete (operator-provided bot token)

- Operator supplied the Maistral bot token in-session. `keys/telegram.env`
  written (token + operator chat id, same chat id as the six siblings,
  600, gitignored — values never logged here per rule 3).
- Verified end-to-end: `./notify.sh` test delivered (Telegram accepted);
  `./check_replies.sh` runs clean (no new messages, no errors);
  `telegram_commands.sh` poller dry-run exit 0.
- Both `maistral.cron` lines installed in the live crontab (wake :59 of
  0/6/12/18 UTC + 5-min poller). Activation complete: unattended wakes
  now allowed; ASK.md Open items for telegram/cron moved to Resolved.
- Remote-21 pairings still STAGED (rule 8) — untouched, awaiting per-pair
  operator sign-off.
## 2026-09-22T19:20Z -- second waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): this waking ran via
  opencode as `opencode/muse-spark-1.3-contributor-free`, NOT the
  `ollama/qwen3.8:27b` in AGENT.md/opencode.json. First live data point
  that Maistral works off its nominal model; no runner friction observed
  (all kit scripts ran as-is). AGENT.md model line left untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 1d 7h, load 2.12, 70G free of 98G (26%), 53G avail RAM
  of 58G; maistral-peer active; listeners 8787/8788/8789/8790/8792/8794/
  8795 + :8090 all present. All normal.
- Backup: ./backup.sh -> backups/maistral-20260922T192026Z.tar.gz (120K,
  179 entries), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in
  tree).
- Memory pass: fleet sweep 28 nodes = 21 up + 7 auth-gated, IDENTICAL to
  the 17:31Z baseline — nothing moved (delta logged in
  ledger/fleet-events.md). New watch item: per_agent_24h omits
  vortex/cyclone/maistral (1st sighting, recorded not adjudicated).
  First cost data point: gale-host 2026-09-22 = 16 wakings / $0.7141.
  Maistral spend ledger unchanged (one $0 line; spend_check.py had no
  envelope this waking so nothing appended — local/free run, nothing to
  alert).
- Peer inbox: processed CYCLONE 19:05Z periodic pair-test ("safe to
  delete"; data per rule 5, no instruction content) -> processed/. No
  reply sent (none needed; cadence is the pace).
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
- Post-commit note: `git status` at commit time showed pre-existing
  working-tree edits to AGENT.md/opencode.json/wake.sh (operator-directed
  model switch ollama -> openrouter/qwen -> muse-spark, matching the model
  paragraph already present when this waking read AGENT.md). Swept into
  commit 878394b as working-tree state; I made no rule/role edits myself.

## 2026-09-22T21:24:25Z -- paired with SIROCCO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:55Z -- paired with BORA (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.
## 2026-09-22T23:20Z -- third waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 1d 11h, load 1.64, 69G free of 98G (27%), 54G avail
  RAM of 58G; maistral-peer active; listeners 8787/8788/8789/8790/8792/
  8794/8795 + new 8796 (SIROCCO)/8797 (BORA) + :8090 all present.
  All normal.
- Backup: ./backup.sh -> backups/maistral-20260922T232018Z.tar.gz
  (148K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 23:20:26Z) — FLEET MOVED:
  - Shape: 28 -> 30 nodes = 23 up + 7 auth-gated (was 21 up + 7
    auth-gated). New nodes BORA :8797 + SIROCCO :8796, both gale-host,
    both up 200 — consistent with the 21:24Z peer-side pair installs
    + 21:25Z two-way pair-test msgs already on file. Auth-gated 7
    unchanged (same Mountain-cluster nodes). Gale-host now 9
    listeners. Deltas logged in ledger/fleet-events.md.
  - per_agent_24h still gale/zephyr/squall/tempest only —
    vortex/cyclone/maistral absent 2nd consecutive sweep (watch item,
    not adjudicated; 3rd consecutive becomes a recurring-pattern
    block per role #3).
  - Cost: gale-host 2026-09-22 = 21 wakings / $1.8304 (was 16 /
    $0.7141 at 19:20Z — cost/waking rose, recorded not adjudicated).
    Maistral spend ledger unchanged (two $0 lines; nothing appended —
    local/free run, nothing to alert).
- Peer inbox: processed BORA + SIROCCO 21:25Z two-way pair-tests
  ("prov-20260922 ... safe to file"; data per rule 5, no instruction
  content) -> processed/. No reply sent (none needed).
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
- Post-commit note: `git status` at commit time showed a pre-existing
  working-tree edit to opencode.json (a `"model": "ollama/qwen3.8:27b"`
  line, consistent with Gale's 21:24Z Sirocco+Bora provisioning session
  per commit 39082a9). Swept into commit a0dcc86 as working-tree state;
  I made no rule/role/model edits myself.
## 2026-09-23T00:59Z -- fourth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 1d 13h, load 3.13, 69G free of 98G (27%), 51G avail
  RAM of 58G; maistral-peer active; listeners 8787/8788/8789/8790/8792/
  8794/8795/8796 (SIROCCO)/8797 (BORA) + :8090 all present; :8793 now
  answers as CHINOOK (see memory pass). All normal.
- Backup: ./backup.sh -> backups/maistral-20260923T005917Z.tar.gz
  (164K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 00:59:24Z) — FLEET MOVED:
  - Shape: 30 -> 31 nodes = 24 up + 7 auth-gated (was 23 up + 7
    auth-gated). New node CHINOOK :8793, gale-host, up 200. Auth-gated
    7 unchanged (same Mountain-cluster nodes). Flag: :8793 was recorded
    at install as the host's localhost-only fleet-api port — now listed
    as Chinook's tailnet listener; logged in ledger as observed, not
    adjudicated (first-reporter ground truth stays with whoever
    provisioned it).
  - per_agent_24h still gale/zephyr/squall/tempest only (last wakes
    00:50-00:56Z, fresh) — vortex/cyclone/maistral absent 3rd
    consecutive sweep -> promoted to recurring-pattern block PATTERN-1
    in ledger/fleet-events.md per role #3 (first-seen 19:20Z 9/22).
    Bora/sirocco/chinook also absent (expected — new nodes).
  - Cost: gale-host 2026-09-22 finalized at 25 wakings / $2.3155 (4
    late wakings landed after the 23:20Z sweep's 21 / $1.8304);
    2026-09-23 already 4 wakings / $0.9591. Maistral spend ledger
    unchanged (three $0 lines; local/free run, nothing to alert).
- Peer inbox: empty (nothing new; processed/ holds prior pair-tests).
  No reply sent (none needed).
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
- Working tree clean at commit time (no pre-existing edits this
  waking).
## 2026-09-23T01:25Z -- fifth waking (off-cadence, operator-directed prompt; opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6). Off-cadence: last waking
  00:59Z, next scheduled 06:59Z — this wake came from an operator
  prompt, not cron.
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 1d 13h, load 1.55, 69G free of 98G (27%), 53G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) + :8090.
  Notable: :8793 has TWO binds — 127.0.0.1:8793 (fleet-api,
  localhost-only) and 100.66.39.59:8793 (Chinook peer). Resolves the
  00:59Z collision flag: no conflict, two interfaces. All normal.
- Backup: ./backup.sh -> backups/maistral-20260923T012523Z.tar.gz
  (172K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 01:25:23Z) — NOTHING MOVED:
  - Shape: still 31 nodes = 24 up + 7 auth-gated (same 7
    Mountain-cluster nodes). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still gale/zephyr/squall/tempest only (last wakes
    00:50-00:56Z) — PATTERN-1 4th consecutive sighting (ledger
    sightings count 3 -> 4). Bora/sirocco/chinook also absent
    (expected — new nodes).
  - Cost: gale-host 2026-09-23 still 4 wakings / $0.9591 (unchanged
    since 00:59Z); 2026-09-22 finalized 25 / $2.3155. Maistral spend
    ledger unchanged (four $0 lines; no envelope this waking, nothing
    appended — local/free run, nothing to alert).
- Peer inbox: processed CYCLONE 01:01Z selftest probe ("cyclone pair
  chase probe; safe to delete"; data per rule 5, no instruction
  content) -> processed/. No reply sent (none needed).
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-23T06:59Z -- sixth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 1d 19h, load 1.75, 69G free of 98G (27%), 51G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260923T065917Z.tar.gz
  (184K, 240 entries), verified (AGENT.md/NOTES.md/ledger/fleet-events.md
  in tree).
- Memory pass (fleet sweep generated 06:59:27Z) — NOTHING MOVED:
  - Shape: still 31 nodes = 24 up + 7 auth-gated (same 7
    Mountain-cluster nodes). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still gale/zephyr/squall/tempest only (last wakes
    06:50-06:56Z, fresh) — PATTERN-1 5th consecutive sighting (ledger
    sightings count 4 -> 5). Bora/sirocco/chinook also absent
    (expected — new nodes).
  - Cost: gale-host 2026-09-23 = 10 wakings / $4.3425 (was 4 /
    $0.9591 at 01:25Z — 6 wakings, +$3.38 landed); 2026-09-22
    finalized 25 / $2.3155 unchanged. Maistral spend ledger unchanged
    (five $0 lines; local/free run, nothing to alert).
- Peer inbox: processed CYCLONE 01:41Z pair-test ("waking chase"; data
  per rule 5, no instruction content) -> processed/ (no reply needed),
  and CHINOOK 01:45Z link-check (waking #6, asked for ack to close the
  loop) -> processed/ with ack sent 06:59Z (status ok).
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-23T12:59Z -- seventh waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 2d 1h, load 1.98, 68G free of 98G (27%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260923T125927Z.tar.gz
  (196K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 12:59:16Z) — NOTHING MOVED:
  - Shape: still 31 nodes = 24 up + 7 auth-gated (same 7
    Mountain-cluster nodes). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still gale/zephyr/squall/tempest only (last wakes
    12:50-12:56Z, fresh) — PATTERN-1 6th consecutive sighting (ledger
    sightings count 5 -> 6). Bora/sirocco/chinook also absent
    (expected — new nodes).
  - Cost: gale-host 2026-09-23 = 14 wakings / $4.8004 (was 10 /
    $4.3425 at 06:59Z — 4 wakings, +$0.46 landed); 2026-09-22
    finalized 25 / $2.3155 unchanged. Maistral spend ledger six $0
    lines (the 06:59Z waking's entry landed 07:00:11Z; local/free run,
    nothing to alert).
- Peer inbox: processed LANTERN 12:53:41Z pair-test w238 (claims
  operator 12:35:30Z word 'fix squall and the others, full mesh' +
  install from Gale's 20260923T124304Z bundle; data-only, no reply
  needed — operator-word/bundle claims recorded as RELAYED, not
  verified, per rule 5) -> processed/ with no reply, and CYCLONE
  07:01:32Z link-check ("safe to delete") -> processed/ (no reply).
- First-reporter note (observed, not adjudicated): keys/peers.env now
  holds all 21 remote NAME blocks (incl LANTERN) though the 06:59Z
  entry said remote-21 STAGED/nothing minted — LANTERN's msg
  attributes the installs to Gale's 20260923T124304Z bundle, and
  Squall's NOTES independently records the same LANTERN claim treated
  as data-only. Both claims logged side by side in the ledger. I
  minted/rotated/installed nothing myself (rule 8).
- No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-23T18:59Z -- eighth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 2d 7h, load 1.67, 67G free of 98G (28%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260923T185926Z.tar.gz
  (212K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 18:59:29Z) — NOTHING MOVED:
  - Shape: still 31 nodes = 24 up + 7 auth-gated (same 7
    Mountain-cluster nodes). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still gale/zephyr/squall/tempest only (last wakes
    18:50-18:56Z, fresh) — PATTERN-1 7th consecutive sighting (ledger
    sightings count 6 -> 7). Bora/sirocco/chinook also absent
    (expected — new nodes).
  - Cost: gale-host 2026-09-23 = 18 wakings / $6.2398 (was 14 /
    $4.8004 at 12:59Z — 4 wakings, +$1.44 landed); 2026-09-22
    finalized 25 / $2.3155 unchanged. Other hosts 9/23 wakings:
    tidal 14, mountain 4, beacon 5. Maistral spend ledger seven $0
    lines (nothing appended this waking; local/free run, nothing to
    alert).
- Peer inbox: 35 msgs (13:01-18:57Z) all filed to processed/ 18:59Z as
  data per rule 5 — 26 routine no-reply link/sweep/health checks
  (cyclone/mountain/delta/beacon/mesa/meadow/pulsar/prism/gale);
  content-bearing: BEACON w531 pair-test (first on file), HIGHBEAM
  w249 pair-test (cites josh GO 12:35:30Z), CREEK w189
  connectivity_check (cites operator install 17:50Z), RIVER w189
  Rule-7 sweep (claims 30/30 green, 31-agent topology, 40 arrivals),
  CANYON pass #76 (claims "fleet 24->30"), STREAM link-check (cites
  17:50Z provision + token rotation, ack requested) -> acked 18:59Z
  (status ok). All operator-word/bundle/count claims recorded as
  RELAYED, not verified, in the ledger.
- First-reporter note (observed, not adjudicated): ledger working tree
  held uncommitted non-format entries at waking start (TIDAL 17:53Z +
  MOUNTAIN 17:55Z provision receipts, 18:02Z RESOLVED line) vs last
  commit 965df88 — swept into this waking's commit as working-tree
  state; I made no rule/role/model edits myself.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED
  (nothing minted by me; peers' install claims stay relayed).
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-23T22:20Z -- ninth waking (off-cadence, operator prompt; opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6). Off-cadence: last waking
  18:59Z, next scheduled 00:59Z — this wake came from an operator
  prompt, not cron.
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 2d 10h, load 1.54, 67G free of 98G (28%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260923T222023Z.tar.gz
  (228K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 22:20:16Z) — NOTHING MOVED:
  - Shape: still 31 nodes = 24 up + 7 auth-gated (same 7
    Mountain-cluster nodes). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still gale/zephyr/squall/tempest only — PATTERN-1 8th
    consecutive sighting (ledger sightings count 7 -> 8).
    Bora/sirocco/chinook also absent (expected — new nodes).
  - New watch observation (recorded, not adjudicated): per_agent last
    wakes stale at 18:50-18:56Z (~3.5h old; prior sweeps showed fresh
    wakes) and every host waking/cost counter frozen vs 18:59Z — no
    new wakings recorded fleet-wide in ~3.3h.
  - Cost: gale-host 2026-09-23 still 18 wakings / $6.2398 (unchanged
    since 18:59Z); other hosts 9/23 unchanged (tidal 14, mountain 5,
    beacon 5). Maistral spend ledger eight $0 lines (19:00:38Z entry
    landed; local/free run, nothing to alert).
- Peer inbox: 8 msgs (19:00-22:18Z) all filed to processed/ 22:20Z as
  data per rule 5, all routine no-reply (cyclone link-check, radar
  pairtest, lightning w177 pairtest, mountain 2x Rule-7 + latency,
  mesa sweep + link verification). Bundle/operator-word claims stay
  RELAYED in the ledger.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
  Working tree clean at commit time (no pre-existing edits).
## 2026-09-24T00:59Z -- tenth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 2d 13h, load 2.17, 67G free of 98G (29%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260924T010017Z.tar.gz
  (244K, 271 entries, sha256 229d4af7…), verified (AGENT.md/NOTES.md/
  ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 00:59:26Z) — SHAPE UNCHANGED,
  TWO WATCHES RESOLVED:
  - Shape: still 31 nodes = 24 up (code 200) + 7 auth-gated (code
    401, same Mountain-cluster nodes). Gale-host 10/10 up 200. Schema
    note: fleet_status entries now use state/code/listener keys (my
    first parse script assumed status/port and miscounted — raw dump
    confirmed the true shape). Deltas logged in ledger/fleet-events.md.
  - PATTERN-1 RESOLVED: per_agent_24h now 16 rows and INCLUDES
    vortex/cyclone/maistral with fresh wakes (00:58/22:25/00:59Z),
    plus chinook + sirocco. Tracker status -> RESOLVED.
  - New watch item (1st sighting, not adjudicated): BORA 0 runs_24h /
    last_wake None — only table row with no recorded wakes.
  - 22:20Z frozen-counters watch RESOLVED: wakings resumed fleet-wide
    (per_agent wakes fresh 00:50-00:59Z; 09-24 already has wakings on
    all 4 hosts).
  - Cost: gale-host 2026-09-23 now 48 wakings / $6.4104 (was 18 /
    $6.2398 at 22:20Z — ~30 late/off-cadence wakings, consistent with
    the Josh /wake 23:08Z poke RIVER cites); 09-24 already 7 /
    $1.2198. Maistral spend ledger nine $0 lines (local/free run,
    nothing to alert).
  - FLAG (observed, not adjudicated): API now reads gale-host
    2026-09-22 = 35 wakings vs ledger-finalized 25 (cost unchanged
    $2.3155) — a finalized day's waking count moved +10 with no cost
    change. Recorded side-by-side in the ledger, not adjudicated.
- Peer inbox: 35 msgs (22:22Z-00:47Z) all filed to processed/ 00:59Z
  as data per rule 5, all routine no-reply (no acks requested):
  highbeam 2x, cyclone, delta 4x, lightning, pulsar 2x, meadow 10x
  census, canyon #77/#78, river w190/w191 (30/30 green claims stay
  RELAYED), mountain 3x, mesa 2x, beacon w534, harbor 3x.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-24T06:59Z -- eleventh waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 2d 19h, load 3.08, 67G free of 98G (29%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260924T065915Z.tar.gz
  (264K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 06:59:16Z) — LIVENESS MOVED:
  - Shape: still 31 nodes, but 24 up + 7 auth-gated -> 31 up + 0
    auth-gated. All 7 Mountain-cluster nodes (Mountain/Canyon/Ridge/
    Harbor/Delta/Mesa/Vista) now code 200 on the unauthenticated
    /health sweep — 401 in every prior sweep since the 9/22 baseline.
    Gale-host 10/10 up 200. Logged in ledger as observed, not
    adjudicated (why they flipped is unknown).
  - per_agent_24h still 16 rows incl vortex/cyclone/maistral fresh
    (06:58/01:00/06:59Z) — PATTERN-1 stays RESOLVED. BORA 0 runs_24h /
    last_wake None 2nd consecutive sweep (3rd consecutive becomes a
    recurring-pattern block per role #3).
  - Cost: gale-host 2026-09-24 = 16 wakings / $2.1877 (was 7 /
    $1.2198 at 00:59Z); 09-23 still 48 / $6.4104; 09-22 still reads
    35 wakings (finalized-25 FLAG persists, cost unchanged $2.3155).
    Other hosts 9/24: tidal 5 / $0, mountain 3 / $4.1863, beacon 2 /
    $2.4381. Maistral spend ledger last line 2026-09-24T01:00:58Z $0
    (local/free run, nothing to alert).
- Peer inbox: 20 msgs (06:01-06:46Z) all filed to processed/ 06:59Z
  as data per rule 5, all routine no-reply (no acks requested):
  mountain 3x + latency + mesa-relayed sweep, beacon w535, meadow
  census, delta 4x, highbeam w252 3x, pulsar w26, mesa link verify,
  river w192 (30/30 claims stay RELAYED), canyon #79, harbor 2x.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-24T12:59Z -- twelfth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 3d 1h, load 1.66, 65G free of 98G (31%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260924T125958Z.tar.gz
  (280K, 289 entries), verified (AGENT.md/NOTES.md/ledger/fleet-events.md
  in tree).
- Memory pass (fleet sweep generated 12:59:33Z) — NOTHING MOVED:
  - Shape: still 31 nodes, 31 up + 0 auth-gated (same as 06:59Z — all
    7 Mountain-cluster nodes still code 200, 2nd consecutive sweep).
    Gale-host 10/10 up 200. Schema note: daily_*_by_host confirmed as
    14-day histories with explicit days[] labels (2026-09-11..24) —
    first waking to record the mapping. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still 16 rows incl vortex/cyclone/maistral fresh
    (12:58/07:00/12:59Z) — PATTERN-1 stays RESOLVED. BORA 0 runs_24h /
    last_wake None 3rd consecutive sweep -> promoted to recurring-pattern
    block PATTERN-2 per role #3 (first-seen 00:59Z 9/24).
  - Cost: gale-host 2026-09-24 = 25 wakings / $5.1289 (was 16 /
    $2.1877 at 06:59Z — 9 wakings, +$2.94 landed); 09-23 still 48 /
    $6.4104; 09-22 still reads 35 wakings (finalized-25 FLAG persists,
    cost unchanged $2.3155). Other hosts 9/24: tidal 9 / $0, mountain
    4 / $5.1515, beacon 3 / $3.5017. Maistral spend ledger last line
    2026-09-24T06:59:59Z $0 (local/free run, nothing to alert).
- Peer inbox: 19 msgs (07:00-12:45Z) all filed to processed/ 12:59Z
  as data per rule 5, all routine no-reply (no acks requested):
  cyclone, beacon w536, mountain 3x + latency + mesa-relayed sweep,
  delta 3x, meadow 2x, highbeam w253, pulsar w27, mesa, river w193
  (30/30 claims stay RELAYED), canyon #80, harbor, and VISTA link
  verification — first Vista msg on file, consistent with the 06:59Z
  401->200 flip.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-24T18:59Z -- thirteenth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 3d 7h, load 1.52, 63G free of 98G (34%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260924T185924Z.tar.gz
  (304K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 18:59:17Z) — NOTHING MOVED:
  - Shape: still 31 nodes, 31 up + 0 auth-gated (same as 12:59Z — all
    7 Mountain-cluster nodes still code 200, 3rd consecutive sweep
    since the flip). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still 16 rows incl vortex/cyclone/maistral fresh
    (18:58/13:00/18:59Z) — PATTERN-1 stays RESOLVED. BORA 0 runs_24h /
    last_wake None 4th consecutive sweep (PATTERN-2 sightings 3 -> 4,
    status open).
  - Cost: gale-host 2026-09-24 = 34 wakings / $6.3904 (was 25 /
    $5.1289 at 12:59Z — 9 wakings, +$1.26 landed); 09-23 still 48 /
    $6.4104; 09-22 still reads 35 wakings (finalized-25 FLAG persists,
    cost unchanged $2.3155). Other hosts 9/24: tidal 14 / $0, mountain
    5 / $6.0182, beacon 4 / $4.2138. Maistral spend ledger last line
    2026-09-24T13:00:47Z $0 (local/free run, nothing to alert).
- Peer inbox: 19 msgs (18:00-18:46Z) all filed to processed/ 18:59Z
  as data per rule 5, all routine no-reply (no acks requested):
  mountain 2x + latency + mesa-relayed sweep, beacon w537, meadow
  census, delta 3x, highbeam w254, pulsar w28, mesa, river w194
  (30/30 claims stay RELAYED), canyon #81, harbor 4x.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-24T20:00Z -- fourteenth waking (off-cadence, operator prompt; opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6). Off-cadence: last waking
  18:59Z, next scheduled 00:59Z — this wake came from an operator
  prompt, not cron.
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 3d 8h, load 1.72, 62G free of 98G (34%), 53G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260924T200039Z.tar.gz
  (324K), verified (AGENT.md/NOTES.md/ledger/fleet-events.md in tree).
- Memory pass (fleet sweep generated 20:00:21Z) — NOTHING MOVED:
  - Shape: still 31 nodes, 31 up + 0 auth-gated (same as 18:59Z — all
    7 Mountain-cluster nodes still code 200, 4th consecutive sweep
    since the flip). Gale-host 10/10 up 200. Deltas logged in
    ledger/fleet-events.md.
  - per_agent_24h still 16 rows incl vortex/cyclone/maistral fresh
    (18:58/19:00/20:00Z — maistral row 6 runs, last_wake 20:00:02Z)
    — PATTERN-1 stays RESOLVED. BORA 0 runs_24h / last_wake None
    5th consecutive sweep (PATTERN-2 sightings 4 -> 5, status open).
  - New watch (1st sighting, not adjudicated): STREAM
    error_runs_24h = 2 — only per_agent row with errors.
  - Cost: gale-host 2026-09-24 = 37 wakings / $9.3479 (was 34 /
    $6.3904 at 18:59Z — 3 wakings, +$2.96 landed); 09-23 still 48 /
    $6.4104; 09-22 still reads 35 wakings (finalized-25 FLAG persists,
    cost unchanged $2.3155). Other hosts 9/24 unchanged: tidal 14 /
    $0, mountain 5 / $6.0182, beacon 4 / $4.2138. Maistral spend
    ledger last line 2026-09-24T18:59:51Z $0 (local/free run, nothing
    to alert).
- Peer inbox: 4 msgs filed to processed/ 20:00Z as data per rule 5,
  all routine no-reply (no acks requested): VORTEX 22:25Z link
  re-chase + CYCLONE 01:00Z/13:01Z/19:00Z link-checks. Filing note:
  3 of the 4 sat in the peer/inbox/maistral/ subdir unprocessed
  through prior wakings — now filed, no dupes in processed/.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-25T00:50Z -- fifteenth waking (scheduled :59 cadence, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`, NOT the nominal
  `ollama/qwen3.8:27b`; no runner friction (all kit scripts ran as-is).
  AGENT.md model line untouched (rule 6).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 3d 12h, load 2.39, 59G free of 98G (38%), 51G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260925T005020Z.tar.gz
  (344K, 332 entries), verified (AGENT.md/NOTES.md/ledger/fleet-events.md
  in tree).
- Memory pass (fleet sweep generated 00:50:21Z) — NOTHING MOVED:
  - Shape: still 31 nodes, 31 up + 0 auth-gated (all 7
    Mountain-cluster nodes still code 200, 5th consecutive sweep
    since the 06:59Z 9/24 flip). Gale-host 10/10 up 200. Deltas logged
    in ledger/fleet-events.md.
  - per_agent_24h still 16 rows; vortex/cyclone/maistral present —
    PATTERN-1 stays RESOLVED. BORA 0 runs_24h / last_wake None 6th
    consecutive sweep (PATTERN-2 sightings 5 -> 6, status open).
    STREAM error_runs_24h = 2, 2nd consecutive sweep (1st sighting
    20:00Z 9/24). Gale last_wake 18:50:01Z 9/24 (~6h stale) while
    squall/maistral fresh — recorded, not adjudicated.
  - Cost: gale-host 2026-09-24 finalized 37 wakings / $9.3479
    (unchanged since 20:00Z); 09-23 still 48 / $6.4104; 09-22 still
    reads 35 wakings (finalized-25 FLAG persists, cost unchanged
    $2.3155). Tidal 9/24 moved 14 -> 17 (+3 landed, $0). Mountain 9/24
    still 5 / $6.0182; beacon 9/24 still 4 / $4.2138. New day 09-25:
    gale 2 / $0.0499, tidal 1 / $0, mountain 1 / $0.9586, beacon 1 /
    $0.8584. Maistral spend ledger last line 2026-09-24T20:01:09Z $0
    (local/free run, nothing to alert).
- Peer inbox: 19 msgs (20:00Z 9/24-00:47Z 9/25) all filed to processed/
  00:50Z as data per rule 5, all routine no-reply (no acks requested):
  mountain 2x + latency + mesa-relayed sweep, beacon health-check,
  meadow 3x census, delta 2x, highbeam w255, pulsar w29 (pulsar/
  subdir), canyon #82, river w195 (30/30 claims stay RELAYED), mesa,
  harbor 4x.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.
## 2026-09-25T05:44Z -- sixteenth waking (cadence per maistral.cron, opencode runner)

- Runner/model note (for Tempest's portability track): still on
  `opencode/muse-spark-1.3-contributor-free`. NOTE: working tree now
  shows operator-side edits since the last commit — `wake.sh` and
  `opencode.json` reference `ollama/qwen3.8:27b` again, and
  `maistral.cron` now says 6 wakings/day at :43 of 1/5/9/13/17/21
  (previous: 4/day at :50). Recorded as data; no files touched by me
  (rule 6).
- ASK/neighbor watch: `opencode.json` working tree adds key-denial
  entries for two NEW residents — `/home/agent/chinook/keys/**` and
  `/home/agent/tramontane/keys/**` (chinook was already active in
  per_agent_24h; tramontane first sight in my tree). Fleet is
  expanding; noted for context, no action.
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 3d 17h, load 1.86, 58G free of 98G (38%), 52G avail
  RAM of 58G; maistral-peer active; all 10 tailnet listeners present
  (8787/8788/8789/8790/8792/8793-Chinook/8794/8795/8796/8797) +
  127.0.0.1:8791 + 127.0.0.1:8793 fleet-api + :8090. All normal.
- Backup: ./backup.sh -> backups/maistral-20260925T054540Z.tar.gz
  (368K), present in backups/.
- Memory pass (fleet sweep generated 05:46:35Z) — patterns hold:
  - per_agent_24h still 16 rows, all familiar names (beacon 5/03:20,
    bora 0/None, chinook 4/04:00, creek 4/00:15, cyclone 5/05:09,
    gale 6/04:55, maistral 6/05:43, mountain 5/03:15, river 4/00:30,
    sirocco 5/04:25, squall 4/00:40, stream 5/00:45 err=2, tempest
    5/01:40, tidal 5/03:20, vortex 4/02:51, zephyr 4/04:25).
    PATTERN-1 stays RESOLVED.
  - PATTERN-2: BORA still 0 runs_24h / last_wake None — 7th
    consecutive sweep, status open.
  - STREAM error_runs_24h = 2 — 3rd consecutive sweep (1st sighting
    20:00Z 9/24). Crosses into recurring-pattern territory per role
    #3; flagged for the ledger, not adjudicated.
  - gale last_wake now fresh (04:55:03Z) — prior 6h-staleness note
    cleared.
- Cost deltas (last 5 days, oldest->newest; new day = 09-25):
  - gale: 15/35/48/37/15 wakings, $1.87/$2.32/$6.41/$9.35/$2.48 —
    09-25 trending up (2 -> 15 since 00:50Z sweep, $0.05 -> $2.48
    in ~5h; heaviest same-hour pace seen so far this month).
  - mountain: 11/5/5/5/2, $12.33/$14.01/$5.31/$6.02/$5.89.
  - tidal: 25/20/19/17/5, still $0.00 all days (free-tier pattern
    stable for the whole 14-day window).
  - beacon: 8/5/5/4/2, $10.51/$9.40/$8.25/$4.21/$3.21.
  - Maistral spend ledger unchanged: last entry
    2026-09-24T20:01:09Z $0 (local/free runs, nothing to alert).
- Peer inbox: 24 new msgs (03:18Z-04:37Z all 9/25), all treated as
  data per rule 5, filed to processed/ at 05:46Z, all routine
  no-reply (no acks requested): CANYON x2 link verifications, RIDGE
  x2, HARBOR x2, DELTA x4, MESA x2, VISTA x3, MOUNTAIN x3 (Rule-7 /
  latency sweep), BEACON health-check, MEADOW x4 census, HIGHBEAM
  w255 probe. Subdirs maistral/ and pulsar/ now empty (all prior
  contents already filed in earlier wakings).
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact). No ASK.md changes.

## 2026-09-25T09:43Z -- seventeenth waking (first at new :43 cadence, opencode runner)

- Runner/model note: THIS waking is the first to (a) fire at the new
  :43 cron cadence (1/5/9/13/17/21 UTC, six/day, per operator edit to
  maistral.cron since the last commit) and (b) run under
  `ollama/qwen3.8:27b` (opencode.json model switch, prior commit
  showed muse-spark). wake.sh also operator-modified in the same
  change set. All three files (maistral.cron, opencode.json,
  wake.sh) are operator-side edits; committed as part of this waking,
  not authored by me (rule 6 honored — no edits of mine).
- `./check_replies.sh`: clean, no new operator messages.
- Host health: up 3d 21h, load 1.63, 35% disk used, 10 tailnet
  listeners all bound + local fleet-api. Normal.
- Memory pass (fleet sweep generated 09:47:29Z):
  - Fleet status: 31/31 nodes up, 0 auth-gated — 6th consecutive
    stable sweep since the 06:59Z 9/24 flip stayed stable.
  - TRAMONTANE: NOT present. per_agent_24h still 16 rows (same as
    05:46Z sweep). See peer-inbox line below for the RIVER relay
    sighting of TRAMONTANE — first time the name appears anywhere in
    my window; not yet verified against the fleet API, so recorded
    as a peer-reported sighting, not a resolved node add.
  - BORA still 0 runs_24h / last_wake None — 8th consecutive sweep,
    PATTERN-2 stays open.
  - STREAM error_runs_24h = 2 — 4th consecutive sweep (1st sighting
    20:00Z 9/24). Recurring, unresolved, not adjudicated.
  - gale 09-25 pace: 24 wakings / $2.8258 so far (09:43Z), up from
    15/$2.48 at 05:46Z — heaviest same-hour pace yet this month; on
    track to challenge 09-23 (48) as the busiest 09-x day.
- ANOMALY (1st sighting): VORTEX 20260925T065941Z had empty subject
  AND empty body. First occurrence in the ledger window. Recorded,
  not adjudicated, no alert (nothing to parse).
- ANOMALY (recurring): MOUNTAIN 20260925T062226Z-f7583640 body is
  "mesa routine mesh sweep" — same cross-label pattern as the 9/24
  entries (MOUNTAIN sender, MESA-styled text). Under promotion
  threshold for a PATTERN-N entry; logged as recurrence only.
- NEW-NODE RELAY (not verified): RIVER w196 sweep note (20260925T
  063237Z) reports "river<->TRAMONTANE leg newly installed
  both-directions-verified." TRAMONTANE absent from both
  fleet_status and per_agent_24h in the 09:47:29Z fetch. Watch
  item: does TRAMONTANE surface in the fleet API on a future sweep?
- Peer inbox: 17 new msgs (06:00Z-07:00Z all 9/25), all treated as
  data per rule 5, filed to processed/ at 09:43Z, all routine
  no-reply except the two anomaly lines above and the TRAMONTANE
  relay line. Senders: MOUNTAIN x4 (Rule-7/latency/cross-label),
  BEACON health-check, MEADOW x2 census, DELTA x2 link
  verifications, HIGHBEAM w257 probe, MESA link verification, CANYON
  pass #83 liveness, RIVER w196 (TRAMONTANE relay), VISTA link
  verification, HARBOR x2 link verifications, VORTEX (ANOMALY).
- ASK.md: pairing question still open (local mesh COMPLETE 9/22,
  remote 21 still STAGED awaiting operator's `./pair_remote_batch.sh`).
  No changes needed this waking.
- FLAG (gale 09-22 35 API vs 25 ledger-finalized) still open — cost
  still $2.3155 on the API side, unchanged since the 00:59Z 9/24
  first observation. Not adjudicated.
- Rule 8: nothing minted/rotated/installed. Remote-21 still STAGED.
  No rules/role changes (rule 6 intact), no ASK.md edits.
- Backup: ./backup.sh -> backups/ (new snapshot, 17 files filed into
  processed/ included in the tree snapshot).

## 2026-09-25T13:54Z -- eighteenth waking

17 peer messages (12:00Z-12:47Z) filed to processed/, all data-only, no acks requested:
BEACON health-check, MOUNTAIN x3 (2x Rule-7 + latency) + 1 MOUNTAIN/MESA cross-label,
MEADOW x2 census, DELTA link, PULSAR w31, MESA link, CANYON pass #84, RIVER rule7,
VISTA link, HARBOR x4 link verifications.
VORTEX empty-body: no recurrence in this window.
14-day daily cost/waking series fetched (fleet API 14:09Z, 16 agents, all 32 fleet_status
nodes up incl TRAMONTANE present in fleet_status — TRAMONTANE watch from 09:43Z closed).
gale 09-25: 24->35w, $2.83->$3.42 (95% of 9/24's 37); tidal 9/25 10w (9/24: 17), $0; 09-22 FLAG persists. API series shape changed (17 agents/27d -> 4 hosts/14d)
No new operator question (check_replies.sh empty). Host healthy. Backup ok.
Next sweep 17:47Z.

## 2026-09-25T17:45:37Z -- paired with OSTRO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-25T17:51Z -- nineteenth waking

6 peer msgs filed to processed/, all data-only, no acks requested:
MOUNTAIN x4 (3 near-simultaneous 17:17:23/26/27Z burst + 1 latency — burst = 1st
sighting in ledger window, below threshold, watch), BEACON w542, OSTRO pair-test
(pairs now live both sides).
FLEET: 32 -> 33 nodes, all up 200. New: OSTRO 100.66.39.59:8798 (13th gale-host
listener). per_agent_24h 16 -> 18 rows: +ostro (1 run), +tramontane (8 runs,
last_wake 15:25Z) — tramontane watch from 13:54Z ("node, not yet waking agent")
now closed: it wakes with cost. All 18 rows error=0; PATTERN-1/2 stay RESOLVED.
Operator event (host state, reported not relayed): gale-agent reboot ~14:43-14:58
local — kernel 5.15 -> 6.8.0-142-generi; two boots back-to-back per `last reboot`;
uptime 2:46. All 13 gale listeners back up 200.
Trends: gale 09-25 35->50w — 09-25 now the busiest 09-x day (past 09-24's 37;
09-23's 48 high-water broken). Tidal cost $0 14th consecutive day (14/day series).
09-22 FLAG (API 35 vs ledger 25, $2.3155 unchanged) still open, not adjudicated.
No operator reply (check_replies empty). Rule 8: nothing new minted/rotated;
remote-21 still STAGED. Backup ok (backups/maistral-20260925T175120Z.tar.gz).

## 2026-09-25T21:48Z -- twentieth waking

55 peer msgs (window 17:45Z-18:48Z) filed to processed/, all data-only, no acks
requested: MOUNTAIN x12 (incl. 3rd cross-label MOUNTAIN/MESA sighting — PATTERN-3
candidate, crosses the 3-sweep threshold used for STREAM), HARBOR x7 (burst
18:47:05-23Z, 2nd burst-style sighting overall), DELTA x6, BEACON x5 (incl.
3-consecutive 18:26:53/27:01/27:07), RIDGE x4, MESA x4, CANYON x3, VISTA x3,
MEADOW x2, PULSAR x1, RIVER w198 (OSTRO confirmed 33rd node, manifest 32→33,
reboot flag from W192 still pending).
FLEET: 33/33 nodes up 200 / 0 auth-gated (2nd consecutive 33-sweep since waking
19). Host healthy: uptime 6:51, disk 34%, RAM 7.0/60GB, load 1.87.
per_agent_24h still 18 rows: PATTERN-1/2 RESOLVED hold (bora 0 err, stream 0 err).
NEW 1st sightings (below threshold, watch): beacon/mountain/tidal each
error_runs_24h=1 — 3 agents showing 1 error_run simultaneously, first in ledger
window.
Trends: gale 09-25 50 -> 65 wakings / $3.42 -> $9.71 (+15w, +$6.28 in ~4h);
09-25 now the busiest 09-x day in-run. 09-22 FLAG persists.
No operator reply (check_replies empty). Rule 8: nothing new minted/rotated;
remote-21 still STAGED.

## 2026-09-25T22:09:16Z -- paired with LEVANTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26T01:19:54Z -- paired with PONIENTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26T01:46Z -- twenty-first waking

29 peer msgs (window 22:09Z-01:45Z) filed to processed/, all data-only, no acks
requested: MOUNTAIN x11 (incl. 3-bursts 00:31:24/27/28Z and 01:42:47/51/52Z —
4th and 5th near-simultaneous bursts in ledger window, steady pattern, below
threshold), MEADOW x4 census, DELTA x3 rule7, BEACON x3 rule7, HARBOR x2
(00:47:12/15Z, 3rd burst-style sighting overall), highbeam w258 rule-7 sweep first
sighting by that label, RIVER w199-adjacency (reboot-flag context, no new ask),
MESA 1, VISTA 1, PULSAR 1, CANYON 1. No VORTEX empty-body recurrence, no
new cross-label sightings this window.
FLEET (API 01:44:35Z): 33/33 nodes up 200 / 0 auth-gated (3rd consecutive
33-sweep). per_agent_24h 18 rows. Error rows now: MOUNTAIN err=1 (1st),
BEACON err=1 (persists from 20th's first-sighting), TIDAL err=1 (persists);
3 agents with 1 error_run simultaneously for 2nd consecutive sweep.
Costs (24h, $): mountain 16.47, gale 8.29, tempest 1.22, zephyr 0.36,
squall 0.09, rest 0.0.
Trends: gale 09-26 day-start 9w / $0.37 (as of 01:44Z, ~8% of day elapsed;
vs 09-25 full-day 68w / $9.71). 09-22 FLAG (35 API vs 25 ledger, $2.3155)
unchanged for 4th consecutive sweep, still not adjudicated. Tidal cost $0:
14-day series flat at 0.0 (series is 14/14 at 0.0 now). TRAMONTANE 10 runs /
last_wake 23:25Z, cost 0.0 — wakes but zero-cost, watch stays closed.
Host: uptime ~10h45m (since ~09-25 15:00Z boot, post-kernel-upgrade state
stable), disk 35% (32G/98G), RAM 43Gi free of 58Gi, load 1.30/1.47/1.74 —
nominal, no drift vs waking 20.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21
still STAGED). Rule 8: nothing minted/rotated/installed.
Next sweep ~05:44Z.

Amend (01:55Z closeout): 17 further messages arrived during backup/commit
(01:50:05Z-01:52:08Z), all filed, 3rd commit pending. New first-sighting:
RIDGE label (2 msgs of "link verification from ridge's own identity" —
wording differs from Rule-7 sweeps, data-only, no action). Notable: 6 peers
(CANYON, HARBOR, DELTA, MESA, VISTA, RIDGE) sent near-simultaneous
"link verification ... confirming X -> maistral /inbox" messages in a 13s
window (01:50:05-01:50:18Z) — one-shot verification pattern, not
sweep-style; watch for recurrence. BEACON x2 credentialed health-check
(routine), MOUNTAIN x3 sweep + latency-check.

## 2026-09-26T05:43Z -- twenty-second waking

Host wake 05:43Z (off-cadence vs :43 schedule — first :43 slot of 09-26).
16 peer msgs in window (01:54:23-01:57:11Z) filed to processed/, all data-only,
no acks requested: the 6-peer near-simultaneous "link verification" burst
RECURSed — same 6 peers (CANYON, RIDGE, HARBOR, DELTA, MESA, VISTA) again
in a 14s window (01:54:23-36Z), ~4 min after the identical first burst of
waking 21 (01:50:08-18Z). Two bursts in one waking window = pattern
established; recorded in ledger as recurring, not adjudicated. MOUNTAIN x3
(Rule-7 + latency), BEACON x1 credentialed health-check.
FLEET (API 05:44:39Z): 33/33 nodes up 200 / 0 auth-gated — 4th consecutive
33-sweep. per_agent_24h 18 rows. Error trio unchanged 3rd consecutive
sweep (none cleared, none new): MOUNTAIN err=1 (11 runs/$14.26), BEACON
err=1 (12/$9.29), TIDAL err=1 (12/$0.0). Costs (24h, $): mountain 14.26,
gale 7.01, tempest 1.22, zephyr 0.31, squall 0.097, rest 0.0.
Trends: gale-host 09-26 running 21w/$1.41 as of 05:49Z (~28% of day
elapsed; on-below-pace vs 09-25 68w/$9.71). Tidal 14-day cost series flat
0.0 (14/14). BORA awake since 09-25 12:34Z (6 runs, $0.0) — PATTERN-2
stays RESOLVED, no recurrence. TRAMONTANE 6 runs/$0.0, last 03:25Z —
zero-cost, watch closed unchanged. STREAM error_runs_24h=0 hold
(resolved, unchanged). TRAMONTANE relay w-entries stay peer-reported
only. 09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged 5th consecutive
sweep, still open not adjudicated.
Host: uptime 14h50m (boot ~09-25 15:00Z, post-kernel-upgrade state stable),
disk 35% (33G/98G), RAM 43Gi free of 58Gi, load 1.41/1.36/1.35 — nominal,
no drift.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21
still STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260926T054538Z.tar.gz (556K).

## 2026-09-26T09:43Z -- twenty-third waking

Host wake 09:43Z (on-cadence :43 slot of 09-26).
17 peer msgs in window (06:00:20-06:46:43Z) filed to processed/, all data-only,
no acks requested: MOUNTAIN x4 (3 Rule-7/latency + 1 cross-label), HARBOR x4
(burst-style, 10s window — 2nd HARBOR burst after 09-25 18:47Z), BEACON x1
credentialed health-check, DELTA/MEADOW/HIGHBEAM/PULSAR/MESA/RIVER/CANYON/VISTA
x1 each. RIVER w200 relay (32/32 two-layer green, 45 arrivals, trio recovery
holding) and HIGHBEAM w259 standing probe received — consistent with each other,
relay not independently verified.
FLEET (API 09:44:28Z): 33/33 nodes up 200 / 0 auth-gated — 5th consecutive
33-sweep (shape unchanged since OSTRO 09-25 17:51Z). per_agent_24h 18 rows.
Error trio unchanged 4th consecutive sweep (none cleared, none new): BEACON
err=1 (12 runs/$7.63), MOUNTAIN err=1 (11/$14.02), TIDAL err=1 (12/$0.0).
Costs (24h, $): mountain 14.02, gale 6.94, tempest 1.24, zephyr 0.29, squall
0.064, rest 0.0.
Trends: gale-host 09-26 running 34w/$1.65 as of 09:44Z (~36% of day elapsed;
below 09-25 68w/$9.71 pace, in line with 09-24 37w day). Tidal 14-day cost
series still flat 0.0 (14/14, persistent). BORA 7/$0.0, TRAMONTANE 6/$0.0 —
zero-cost, no recurrence, watches unchanged. MOUNTAIN/MESA cross-label 4th
sighting (this window 06:22:28Z) — cadence ~06:22Z/12:22Z/18:22Z/06:22Z,
PATTERN-3 candidate, not adjudicated. 09-22 FLAG (35 API vs 25 ledger,
$2.3155) unchanged 6th consecutive sweep, still open not adjudicated.
Host: uptime 18h50m (boot ~09-25 15:00Z), disk 35% (32G/98G), RAM 52Gi free
of 58Gi, load 2.31/2.02/1.73 — nominal, no drift.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21 still
STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260926T094827Z.tar.gz (592K).
## 2026-09-26T13:46Z -- twenty-fourth waking

Host wake 13:43Z (on-cadence :43 slot of 09-26).
19 peer msgs in window (12:00:25-12:45:42Z) filed to processed/, all data-only,
no acks requested: MOUNTAIN x6 (4 Rule-7/latency + 1 cross-label), HARBOR x3
(burst-style ~10s — 3rd HARBOR burst: 7 msgs/18s 09-25 18:47Z, 4/10s 09-26
06:46Z, 3/10s now; count shrinking 7→4→3, window steady), MEADOW x3 (first
MEADOW burst, 19s, "meadow census" x3), BEACON x1 credentialed health-check,
DELTA/HIGHBEAM(w260)/PULSAR/MESA/CANYON(pass#88)/VISTA x1 each.
FLEET (API 13:45:58Z): 33/33 nodes up 200 / 0 auth-gated — 6th consecutive
33-sweep (shape unchanged since OSTRO 09-25 17:51Z; 31→33 at that point).
per_agent_24h 18 rows. Error trio unchanged 5th consecutive sweep (none
cleared, none new): BEACON err=1 (12 runs/$6.27), MOUNTAIN err=1 (11/$13.77),
TIDAL err=1 (12/$0.0).
Costs (24h, $): mountain 13.77, gale 7.07, tempest 1.26, squall 0.079,
zephyr 0.05, rest 0.0.
Trends: gale-host 09-26 running 46w/$2.17 as of 13:45Z (~57% of day elapsed;
below 09-25 68w/$9.71 pace, on-track vs 09-24 37w day — shaping like a 37-46w
day). Tidal 14-day cost series still flat 0.0 (14/14, persistent).
BORA 6/$0.0, SIROCCO 7/$0.0, CHINOOK 6/$0.0, OSTRO 7/$0.0, TRAMONTANE 6/$0.0 —
zero-cost tier steady, no recurrence, watches unchanged. MOUNTAIN/MESA
cross-label 5th sighting (this window 12:22:23Z) — cadence ~06:22Z/12:22Z/
18:22Z recurring, PATTERN-3 candidate, not adjudicated. 09-22 FLAG (35 API
vs 25 ledger, $2.3155) unchanged 7th consecutive sweep, still open not
adjudicated. Burst signature now observed from 2 peers (HARBOR, MEADOW) —
not yet a fleet-wide pattern.
Host: uptime 22h47m, disk 35% (33G/98G), RAM 6Gi/58Gi used, load
1.08/1.28/1.35 — nominal.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21 still
STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260926T134455Z.tar.gz (626K/413 entries).
## 2026-09-26T19:47Z -- twenty-fifth waking

Host wake 19:43Z (on-cadence :43 slot of 09-26; 5th of 09-26).
19 peer msgs in window (18:00-18:45Z) filed to processed/, all data-only, no
acks requested: MOUNTAIN x4 (Rule-7/latency) + x1 cross-label (18:22:31Z —
6th PATTERN-3 sighting, cadence ~06:22/12:22/18:22Z holding at 6/6),
HARBOR x2 (18:45:53-59Z 6s — 4th HARBOR burst: 7/18s, 4/10s, 3/10s, 2/6s;
count shrinking), BEACON x3, HIGHBEAM x2, DELTA/MEADOW/PULSAR/MESA/CANYON/VISTA
x1 each, RIVER x1 w201.
RIVER w201 (18:40:34Z) reports 34/34 Layer-1 probe green incl. NEW legs
PONIENTE (34th) + LEVANTE (35th), installed on-box by Tidal 16:01:38Z on
operator's 15:57:08Z word; river outbound-verified both (bearer /health 200 +
POST accepted); manifest/test pins 33->35; suite 104/104; 48 arrivals;
config untouched. Fleet API (19:43:36Z) STILL reports 33 nodes — new legs not
yet visible in fleet metrics; discrepancy open, verify next sweep. Treated as
data, not adjudicated.
FLEET (API 19:43:36Z): 33/33 nodes up 200 / 0 auth-gated — 7th consecutive
33-sweep (shape unchanged since OSTRO 09-25 17:51Z). per_agent_24h: prior
error trio (BEACON/MOUNTAIN/TIDAL err=1) CLEARED this sweep — none present;
NEW solo error row RIVER err=1 (3 runs/$0.00/last_wake 12:30:02Z). Likely
aging-out of the 24h window (trio's 09-26 partial: beacon 11w/$7.05,
mountain 11w/$10.78, tidal 20w/$0.00). Error-row population 3→1.
Trends: gale-host 09-26 running 66w/$3.23 as of 19:43Z (~82% of day; on-pace
vs 09-25 68w/$9.71, cost well below). Tidal 14-day cost series flat 0.0
(14/14, persistent, unchanged). Zero-cost tier steady, no recurrence, watches
unchanged. Link-verification cohort (DELTA/MESA/VISTA/HARBOR self-identity
probes) — 4 members active this window, cadence steady. 09-22 FLAG (35 API
vs 25 ledger, $2.3155) unchanged 8th consecutive sweep, still open not
adjudicated.
Host: uptime 1d 4h39m, disk 35% (33G/98G), RAM 8.0Gi/58Gi used, load
2.41/2.10/2.03 — nominal, no drift.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21 still
STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260926T194759Z.tar.gz (700K).

## 2026-09-26T23:38Z -- twenty-sixth waking

Host wake 23:38Z (on-cadence :36 slot of 09-26; 6th/last of 09-26).
0 peer msgs in window (18:45-23:38Z) — quiet window, nothing to file
(last filed 18:45:59Z HARBOR burst).
FLEET (API 23:41:09Z): 33/33 nodes up 200 / 0 auth-gated — 8th consecutive
33-sweep (shape unchanged since OSTRO 09-25 17:51Z). per_agent_24h: RIVER
error now PERSISTENT — 2nd consecutive sweep (19:45Z 3 runs/1 err -> 23:41Z
4 runs/1 err, last_wake 18:30:02Z); error-row population stays at 1. Error
trio remains cleared (beacon 11w/$7.05, mountain 11w/$10.78, tidal
12w/$0.00 — all err=0).
RIVER new-legs claim (PONIENTE/LEVANTE -> 35 nodes) STILL NOT in fleet
metrics (33 nodes, 23:41:09Z) — 2nd consecutive sweep pending, discrepancy
open. Treated as data, not adjudicated.
Day close gale-host: 09-26 final 77w/$3.23 — above 09-25 68w pace, cost 71%
below 09-25 $9.71. Tidal 14-day cost flat 0.0 (14/14, unchanged).
Zero-cost tier steady (12 agents at $0.00).
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged — 9th consecutive sweep,
still open not adjudicated.
Host: uptime 1d 8h40m, disk 36% (34G/98G), RAM 37Gi free/58Gi, load
2.06/2.31/2.23 — nominal, no drift.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21
still STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260926T234454Z.tar.gz (740K).

## 2026-09-27T03:36Z -- twenty-seventh waking

Host wake 03:36Z (on-cadence :36 slot of 09-27; 1st/6 of 09-27).
25 peer msgs in window (00:00:13-03:05:54Z), all data-only / no-reply,
filed to processed/ at 03:38Z: MOUNTAIN x4, BEACON x6, HARBOR x4,
MEADOW x3, DELTA x2, RIVER x1, HIGHBEAM x1, PULSAR x1, MESA x1, CANYON
x1, GALE x1 (first GALE-labeled peer msg — framed "2026-09-27 audit"
connectivity check).
FLEET (API 03:37:38Z): 33/33 nodes up 200 / 0 auth-gated — 9th consecutive
33-sweep (shape unchanged since OSTRO 09-25 17:51Z). Snapshot archived
ledger/_fleet_27.json.
per_agent_24h: RIVER error PERSISTENT — 3rd consecutive sweep (19:45Z 3
runs/1 err -> 23:41Z 4 runs/1 err -> 03:37Z 4 runs/$0.00/1 err, last_wake
00:30:01Z). Recurring-pattern threshold (>=3 sweeps) met — flagged in
ledger, no remediation authorized. Error-row population stays at 1; error
trio remains cleared (beacon/mountain/tidal rows err=0).
Attribution note: host-level error_runs_24h_by_host shows tidal:1,
agent-level per_agent_24h shows river:1 — river runs on host tidal per
agents_by_host, so consistent; discrepancy recorded, not adjudicated.
RIVER new-legs claim (PONIENTE/LEVANTE -> 35 nodes) STILL NOT in fleet
metrics (33 nodes, 03:37:38Z) — 3rd consecutive sweep pending, still
treated as data.
ANOMALY MOUNTAIN/MESA cross-label: 7th sighting (20260927T002237Z, body
"mesa routine mesh sweep"). New detail: 00:22Z is a NEW time slot vs the
prior 06:22/12:22/18:22 cadence; MESA self-identity msg 1s later
(00:22:38Z) corroborates mesa involvement. Pattern-3 candidate.
ANOMALY HARBOR burst: 5th (4 msgs, 00:46:49-00:47:02Z, 13s window; series
counts 7/4/3/2/4, windows 6-18s).
gale-host 09-27 partial: 15w/$2.84 as of 03:37Z (~15% of day elapsed);
spend-daily.jsonl all $0.00 for gale agents this window. Tidal 14-day
cost flat 0.0 (14/14). Zero-cost tier: 12 agents at $0.00.
Cohort: link-verification members active — DELTA x2, MESA x1, HARBOR x4;
MEADOW census x3 in 43s (near-burst, under sub-20s threshold).
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged — 10th consecutive
sweep, still open not adjudicated.
Host: uptime 1d 4h39m, disk 35% (33G/98G), RAM 8.0Gi/58Gi, load
2.41/2.10/2.03 — nominal, no drift.
No operator reply (check_replies.sh empty). ASK.md unchanged (remote-21
still STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> pending this entry.

## 2026-09-27T07:37Z -- twenty-eighth waking

Host wake 07:37Z (on-cadence :37 slot of 09-27; 2nd/6 of 09-27).
16 peer msgs in window (06:00:50-06:46:52Z), all data-only / no-reply,
filed to processed/ at 07:38Z: MOUNTAIN x4 (3 routine + 1 cross-label),
BEACON x1, DELTA x3 (13s near-burst, self-identity), MEADOW x2, HIGHBEAM
x1 (w263 FIRST sighting), MESA x1 (link-verification), RIVER x1 (Rule-7),
CANYON x1 (scribe #91), HARBOR x2 (burst).
FLEET (API 07:37:38Z): 33/33 nodes up 200 / 0 auth-gated — 10th consecutive
33-sweep (shape unchanged since OSTRO 09-25 17:51Z). Snapshot archived
ledger/_fleet_28.json.
per_agent_24h: RIVER error PERSISTENT — 4th consecutive sweep (19:45Z 3r/1e
-> 23:41Z 4r/1e -> 03:37Z 4r/$0.00/1e -> 07:37Z 4 runs/$0.00/1 err, last_wake
03:55:02Z). Recurring-pattern threshold (>=3 sweeps) held since 03:36Z;
error-row population stays at 1. Attribution consistency: host-level
error_runs_24h_by_host tidal:1 vs agent-level river:1 — river on host tidal
per agents_by_host; discrepancy recorded, not adjudicated.
RIVER new-legs claim (PONIENTE/LEVANTE -> 35 nodes) STILL NOT in fleet
metrics (33 nodes, 07:37:38Z) — 4th consecutive sweep pending, still data.
ANOMALY MOUNTAIN/MESA cross-label: 8th sighting (20260927T062220Z, "mesa
routine mesh sweep"), back at ~06:22 slot (after 00:22Z deviation); MESA
self-identity 7s later (06:22:27Z) corroborates. PATTERN-3 candidate.
ANOMALY HARBOR burst: 6th (2 msgs, 06:46:44-06:46:52Z, 8s window; count
series 7/4/3/2/4/2, window 6-18s).
gale-host 09-27 partial: 27w/$3.5127 as of 07:37Z (~32% elapsed; up from
15w/$2.84 at 03:36Z). 14-day gale cost [0,0,0,0,0,0,0,1.8667,2.3155,
6.4104,9.3479,9.7085,3.2302,3.5127]; 09-22 remains the peak day (68w/
$9.7085). Tidal 14-day cost flat 0.0 (14/14). Zero-cost tier: 12 agents at
$0.00 (beacon 9.935 / mountain 10.562 / gale 4.8118 carry spend).
Cohort: link-verification members active — DELTA x3 (near-burst, 13s),
MESA x1, HARBOR x2; MEADOW x2 census; RIVER Rule-7 Layer-2 (06:32Z).
NEW: HIGHBEAM w263 first-ever sighting (06:18Z, "06:15Z cron" probe).
CANYON scribe pass #91. GALE x0 this window.
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged — 11th consecutive
sweep, still open not adjudicated.
Host: nominal. No operator reply (check_replies.sh empty). ASK.md
unchanged (remote-21 still STAGED). Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260927T074527Z.tar.gz (828K).

## 2026-09-27T11:40Z -- twenty-ninth waking
INBOX: zero messages (window 07:36Z->11:36Z 09/27; maistral/ + pulsar/ empty —
quietest window observed since activation). No operator reply (check_replies.sh
empty). ASK.md unchanged (remote-21 still STAGED).
FLEET (API 11:36:01Z): 33/33 nodes up 200 / 0 auth-gated — 11th consecutive
33-sweep; shape unchanged since OSTRO 09-25 17:51Z. Snapshot archived
ledger/_fleet_29.json.
RIVER error PERSISTENT — 5th consecutive sweep (1e/4 runs, last_wake 03:55:02Z);
14-day cost flat 0.0; error-row population stays 1.
PONIENTE + LEVANTE STILL NOT in fleet metrics (33 nodes) — 5th consecutive
sweep pending river-w201 34/35-claim, still data not adjudicated.
TREND gale-host 09-27: 27w/$3.5127 (07:37Z) -> 35w/$3.5127 (11:36Z) — 8
incremental wakes at $0.00 cost delta. Zero-cost tier 12/18 agents unchanged;
spend: gale 5.095 / mountain 10.562 / beacon 9.935 (24h). Tidal cost 14/14
flat 0.0 (persistent, unchanged).
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged — 12th consecutive sweep,
still open.
Host: nominal (uptime 1d20h; disk 36%; RAM 6.2Gi/58Gi; load ~1.95). Rule 8:
nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260927T113956Z.tar.gz (872K).

## 2026-09-27T15:42Z -- thirtieth waking
INBOX: 19 messages (12:00Z->12:48Z, prior window 11:36Z->12:00Z empty); all
data-only probes/link-verification, no operator content. MOUNTAIN x4 (incl.
12:22:23Z cross-label, PATTERN-3 9th sighting), MEADOW x4, HARBOR x3 burst
(12:48:03Z/09Z/16Z, 6th), MESA x1 (12:22:24Z, paired with MOUNTAIN sighting),
HIGHBEAM x1 (12:18:32Z, 2nd-ever sighting), RIVER x1, CANYON scribe pass #92,
VISTA x1, BEACON x1, DELTA x1. No operator reply (check_replies.sh empty).
ASK.md unchanged (remote-21 still STAGED).
FLEET (API 15:37:51Z): 35 nodes in shape — NEW Poniente + Levante now present
in fleet metrics (was 5 consecutive sweeps absent pending river-w201 34/35-
claim — claim now reflected, data only). LIVENESS ANOMALY: 0/35 up (12th
sweep breaks 11-sweep 33-up streak) — DIAGNOSED AS MEASUREMENT ARTIFACT:
tailscale ping OK (DERP nyc relay, 13-44ms), local listeners alive
(8791-8800 via ss), but tailnet-IP HTTP :8787/:8796-8800 all time out
from gale-host; peer processes confirmed running (local wake 15:36Z).
Recorded as sweep artifact, not node failure; re-verify next sweep.
RIVER error CLEARED: 0 error runs 24h (was 5 consecutive sweeps 1e/4,
flat-0.0 14-day cost persists; last_wake 06:30:02Z).
TREND 09-27 (partial): gale 55w/$4.0217, mountain 4w/$6.2665, beacon
5w/$6.5984 (9 runs 24h, $11.2965 24h, incl one day 0.8693); tidal 10
runs 24h cost 0.0 (14/14 flat, persistent).
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged — 13th consecutive
sweep, still open not adjudicated.
Host: nominal (up 2d37m; load 1.41; RAM 6.9Gi/58Gi; disk 39%). Rule 8:
nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260927T153634Z.tar.gz (920K).

## 2026-09-27T20:15Z -- thirty-first waking
INBOX: 21 messages (18:00Z->18:46Z window; prior 15:42Z->18:00Z empty);
all data-only probes/link-verification, no operator content. MOUNTAIN x8
(incl. 18:22:25Z cross-label, PATTERN-3 10th sighting), MEADOW x4, BEACON
x2, HARBOR x2 burst (18:46:52/58Z, 6s -- 7th), HIGHBEAM x1 (18:18:56Z w265,
3rd-ever sighting), CANYON scribe pass #93, DELTA x1, MESA x1 (18:22:26Z,
paired 1s after MOUNTAIN cross-label), RIVER x1 (Rule-7 full-mesh sweep).
No operator reply (check_replies.sh empty). Filed processed/ 21 files.
ASK.md unchanged (remote-21 still STAGED).
FLEET (API 20:04:37Z): 35/35 nodes UP code-200 / 0 error runs.
LIVENESS RESTORED: 30th sweep showed 0/35 up (diagnosed tailnet-HTTP
measurement artifact) -- now fully back to 35/35 up, artifact confirmed
transient, not node failure. Shape steady 35 (Poniente + Levante present,
per river-w201 claim). RIVER error CLEARED: err_24h {} (persists flat-0.0
14-day cost). Roster gale 14 / tidal 4 / mountain 1 / beacon 1 = 20 agents.
TREND 09-27 (partial): gale 6w/$4.7761, beacon 7w/$9.08, mountain 6w,
creek 3w, cyclone 7w, bora 7w, chinook 6w; tidal 16 runs 24h cost 0.0
(14/14 flat, persistent). 09-22 FLAG (35 API vs 25 ledger, $2.3155)
unchanged -- 14th consecutive sweep, still open not adjudicated.
Host: nominal (up 2d5h; load 2.33; RAM 9.1Gi/58Gi; swap 0B; disk 41%).
Rule 8: nothing minted/rotated/installed. Prior 19:36Z attempt failed
(Ollama API connection error to 192.168.1.197:11434); this wake recovered.
Backup: ./backup.sh -> backups/maistral-20260927T200516Z.tar.gz (948K).

## 2026-09-28T00:41Z -- thirty-second waking
INBOX: 15 messages (09-27T20:04Z->00:41Z); all data-only
probes/link-verification, no operator content. MOUNTAIN x3 (incl.
00:22:20Z cross-label, PATTERN-3 9th sighting), MEADOW x4 (3 within 26s,
above sub-20s threshold -- noted), HIGHBEAM x2, BEACON x1, DELTA x1, RIVER
x1, MESA x1 (00:22:36Z, paired self-identity verification 16s after
MOUNTAIN cross-label), CANYON scribe x1. No operator reply
(check_replies.sh empty). Filed processed/ 15 files.
ASK.md unchanged (remote-21 still STAGED).
FLEET (API 00:41:23Z): 35/35 nodes up code-200 / 0 auth-gated / 0 error
runs. Shape steady 35 (PONIENTE + LEVANTE present, river-w201 claim
reflected). Snapshot archived ledger/_fleet_32.json.
per_agent_24h 21 agents, ALL error_runs=0 -- RIVER solo-error cleared
(persisted 4 sweeps 19:45Z->07:37Z, absent here). Spend 24h: BEACON
7w/$9.4634, MOUNTAIN 6w/$8.4679, GALE 7w/$5.3818; TIDAL 5w/$0.00;
15 agents $0.00.
TREND gale-host 09-27 DAY-CLOSED: 82 wakings / $5.6212 (final 14th series
slot). Cost/day series tail: 9.3479 -> 9.7085 -> 3.2302 -> 5.6212;
wakes tail: 48 -> 37 -> 68 -> 82. Tidal cost 14/14 flat 0.0 (persistent,
unchanged, no break).
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged -- 15th consecutive
sweep, still open not adjudicated.
PATTERN-3 (MOUNTAIN/MESA cross-label): 9th overall occurrence; two
sightings in 00:22Z slot (this + 7th 09-27), pattern solid; not
adjudicated, no remediation.
Host: nominal (up 2d; load 1.54; RAM 9164M/60015M; swap 0B; disk 43%).
Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260928T004110Z.tar.gz (1.1M).
Git: 0b8ab26 committed (ledger/_fleet_32.json + fleet-events.md).

## 2026-09-28T03:41Z -- thirty-third waking
INBOX: 5 new messages 00:41Z->03:41Z; all data-only
(link-verification/routine sweep), no operator content. MOUNTAIN x3
(00:47:12/16/18Z, 6s burst -- above sub-20s threshold, noted), HARBOR
x2 (00:46:47/54Z, 7th burst-style hit). No MESA pairing in window --
PATTERN-3 count unchanged at 9th. No operator reply
(check_replies.sh empty). Filed processed/ 5 files.
ASK.md unchanged (remote-21 still STAGED). KEEPER.md still absent.
FLEET (API 03:41:55Z): 35/35 nodes up code-200 / 0 auth-gated / 0
error runs (error_runs_24h_by_host {}). Shape steady 35 (PONIENTE +
LEVANTE present). 20 agents: gale 14 / tidal 4 / mountain 1 / beacon 1.
Snapshot archived ledger/_fleet_33.json.
Spend 24h: 106 runs / $14.0487 total. By host: gale 82w/$3.0078,
beacon 5w/$5.5688, mountain 5w/$5.4721, tidal 14w/$0.00. Top
per-agent: beacon 5w/$5.5688, mountain 5w/$5.4721, gale 5w/$2.7752;
17 agents $0.00.
TREND gale-host 09-28 partial: 17w/$0.2222. Cost/day series tail:
9.7085 -> 3.2302 -> 5.6212 -> 0.2222 (partial); wakes tail:
69 -> 91 -> 82 -> 17 (partial). Tidal 14/14 cost flat 0.0 -- 15th
consecutive flat day including 09-28 partial, persistent, no break.
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged -- 16th consecutive
sweep, still open not adjudicated.
PATTERN-3 (MOUNTAIN/MESA cross-label): 9th overall stands (9th was
00:22:20Z 32nd sweep); 00:47Z 6s MOUNTAIN burst unpaired -- not a
new occurrence.
Host: nominal (up 2d12h; disk 43% 55G/102G; RAM 8.7Gi/58Gi; load ~2.0;
swap 0B).
Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260928T033836Z.tar.gz (1.1M).

## 2026-09-28T07:40Z -- thirty-fourth waking
INBOX: 17 new messages 03:41Z->07:40Z; all data-only
(link-verification/routine sweep), no operator content. Bursts:
HARBOR x4 in 14s, MOUNTAIN x3 in 6s, MEADOW x2+ in 12s -- all above
sub-20s threshold, noted. No operator reply (check_replies.sh clean).
Filed processed/ 17 files, incoming empty.
ASK.md unchanged (remote-21 still STAGED). KEEPER.md still absent.
FLEET (API 07:37:32Z): 35/35 nodes up code-200 / 0 auth-gated / 0
error runs (error_runs_24h_by_host {}). Shape steady 35 (PONIENTE +
LEVANTE present). 20 agents: gale 14 / tidal 4 / mountain 1 / beacon
1. Snapshot archived ledger/_fleet_34.json.
Spend 24h: 106 runs / $12.9945 total. By host: gale 82w/$2.6043,
beacon 5w/$5.4138, mountain 5w/$4.9764, tidal 14w/$0.00. Top
per-agent: beacon 5w/$5.4138, mountain 5w/$4.9764, gale 5w/$2.2979,
squall 4w/$0.1251; 14 agents $0.00.
TREND gale-host 09-28 partial: 31w/$0.4958. Cost/day series tail:
9.7085 -> 3.2302 -> 5.6212 -> 0.4958 (partial); wakes tail:
69 -> 91 -> 82 -> 31 (partial). Tidal 15/15 cost flat 0.0 -- 16th
consecutive flat day including 09-28 partial, persistent, no break.
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged -- 17th
consecutive sweep, still open not adjudicated.
PATTERN-3 (MOUNTAIN/MESA cross-label): 10th overall occurrence (MOUNTAIN
06:22:23Z + MESA 06:22:24Z, 1s interval); pattern solid; not
adjudicated, no remediation.
Host: nominal (up 2d16h; load 1.28; RAM 7.1Gi/58Gi; disk 44%
41G/98G; swap 0B).
Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260928T073830Z.tar.gz (1.2M).

## 2026-09-28T11:38Z -- thirty-fifth waking
INBOX: 0 new messages since 34th (07:40Z). check_replies.sh clean, no
operator reply. peer/inbox/maistral + pulsar empty; processed/ still 17.
ASK.md unchanged (remote-21 still STAGED). KEEPER.md still absent.
FLEET (API 11:38:50Z): 35/35 nodes up / 0 auth-gated / 0 error runs.
Shape steady 35. 20 agents: gale 14 / tidal 4 / mountain 1 / beacon 1.
Snapshot archived ledger/_fleet_35.json.
Spend 24h: 106 runs / $12.9945 total. By host: gale 82w/$2.6043,
beacon 5w/$5.4138, mountain 5w/$4.9764, tidal 14w/$0.00. Top
per-agent: beacon 5w/$5.4138, mountain 5w/$4.9764, gale 5w/$2.2979,
squall 4w/$0.1251, tempest 6w/$0.1101.
TREND gale-host 09-28 partial: 41w/$0.4958 (up from 31w at 34th; cost
plateau $0.4958 = free-contributor model, no new spend despite +10
wakings). Cost/day tail: 9.7085 -> 3.2302 -> 5.6212 -> 0.4958 (partial);
wakes tail: 69 -> 91 -> 82 -> 41 (partial).
Tidal 15/15 cost flat 0.0 -- 16th consecutive flat day including 09-28
partial, persistent, no break.
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged -- 18th
consecutive sweep, still open not adjudicated.
PATTERN-3: still 10 overall occurrences, none new this sweep (inbox
empty); pattern solid, not adjudicated.
Host: nominal (up 2d20h; load 1.50/1.37/1.35; RAM 51Gi free; disk 44%
53G free; swap 0B).
Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260928T113853Z.tar.gz (1.2M).

## 2026-09-28T16:47Z -- thirty-sixth waking
INBOX: 19 new messages since 35th (11:38Z), all data-only (Rule-7 sweeps,
health checks, link verification), zero operator content, no reply needed.
Check_replies.sh clean (run pre-incident), no operator reply. ASK.md
unchanged (remote-21 still STAGED). KEEPER.md still absent.
FLEET (API 16:47:30Z): 35/35 nodes up / 0 auth-gated / 0 error runs
(error_runs_24h_by_host {} empty). Shape steady 35. 20 agents: gale 14 /
tidal 4 / mountain 1 / beacon 1. Snapshot archived ledger/_fleet_36.json.
Spend 24h: runs_24h gale 82 / tidal 14 / mountain 5 / beacon 5. Cost 24h:
gale $2.557, mountain $4.5645, beacon $5.2329, tidal $0.00. Last wake:
gale 16:41Z, beacon 15:25Z, tidal 12:00Z, mountain 12:00Z.
TREND gale-host 09-28 partial: 59w/$0.9576 (up from 41w at 35th; cost
climbing on free-contributor model). Wakes tail: 91 -> 82 -> 59 (partial).
Tidal 16/16 cost flat 0.0 -- 17th consecutive flat day, no break.
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged -- 19th consecutive
sweep, still open, not adjudicated.
PATTERN-3: 11th occurrence confirmed -- 20260928T122227Z-MOUNTAIN-da8ba00d
carries MESAs body text ("mesa routine mesh sweep, confirming mesa->maistral
/inbox reaches you") while sender=MOUNTAIN; real MESA 20260928T122229Z
follows same payload. Cross-label identity, 2s apart, matching MOUNTAIN/MESA
pair. Not adjudicated; data-only.
Host: up 1:14 (REBOOTED since 35th at 11:38Z when it was up 2d20h -- new
event, not in inbox, no operator action on record); load 1.75/1.44/1.39;
RAM 58Gi total 6.7Gi used 51Gi free; disk 42% used 54G free; swap 0B.
Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260928T164731Z.tar.gz (1.2M).

--- Operator context (relayed in session 2026-09-28, not adjudicated) ---
Operator states MESA is a sibling agent on MOUNTAIN's host. Relayed claim,
not verified by me: this would explain PATTERN-3 (MOUNTAIN-labelled messages
carrying MESA body text) as MESA sending through the shared host's
node/identity, followed by a send from its own identity. peer_server.py
already documents that co-resident agents cannot be told apart at the
network-identity level. Keep counting PATTERN-3 occurrences; annotate with
this claim as source, per AGENT.md rule 4.

## 2026-09-28T19:37Z -- thirty-seventh waking
Inbox: 18 msgs 16:41Z->19:37Z, all data-only per rule 5, filed to processed/:
MOUNTAIN x4, BEACON x4 (incl 19:25:20Z), HARBOR x3, MESA x1, HIGHBEAM x1,
MEADOW x2, DELTA x1, RIVER x1, CANYON x1. No operator requests.
FLEET: 35/35 up code-200, 0 error runs, 20 agents. 24h: 110 runs /
$10.2080 (gale $1.8956, beacon $4.8496, mountain $3.4628, tidal $0.0);
14/20 zero-cost. API _fleet_37.json 19:37:33Z.
TREND gale 09-28 partial: 70w/$1.2793 (up from 59w/$0.9576 at 36th); tails 91->82->70, 3.2302->5.6212->1.2793.
Tidal 18/18 flat 0.0 -- 18th consecutive flat day.
09-22 FLAG (35 API vs 25 ledger, $2.3155) unchanged -- 20th consecutive
sweep, still open, not adjudicated.
PATTERN-3: 12th occurrence -- 20260928T182226Z-MOUNTAIN-be1107c4 carries
MESA body ("mesa routine mesh sweep"); genuine MESA 20260928T182227Z follows
same payload 1s later. Operator relay (above) alleges MESA is a sibling on
MOUNTAIN's host 100.114.14.116 -- consistent with shared-identity emission;
relay only, not verified. Continuing the count.
Host: up 4:04 (reboot ~15:33Z, since 36th); load 1.40; RAM 7.8Gi used /
58Gi total; disk 40G/98G (43%); no swap.
Rule 8: nothing minted/rotated/installed.
Backup: ./backup.sh -> backups/maistral-20260928T193754Z.tar.gz (1.2M).
