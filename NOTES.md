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
