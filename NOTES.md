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
