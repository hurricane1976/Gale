# NOTES.md — Cyclone

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
  includes Vortex), `ASK.md`, this NOTES, `opencode.json` (model
  `ollama/qwen3.8:27b`; permission-denied: all six agents' keys/ dirs),
  `wake.sh` (opencode runner, 45m guard, flock, spend record, shell-side
  alert, offsite push to `github main:cyclone`), `peer_server.py`
  (unchanged from siblings; binds `SELF_BIND=100.66.39.59:8794` from
  `keys/peers.env`), `notify.sh` (`[CYCLONE]` prefix), `spend_check.py`,
  `backup.sh`, `check_replies.sh` + `_check_replies.py`,
  `telegram_commands.sh` + `telegram_commands.py` (UNITS list extended to all
  six peer services), `pair_peer.sh` (restarts `cyclone-peer`),
  `rotate_peer.sh` + `peers_rotate.py` (service name fixed to `cyclone-peer`,
  token env `CYCLONE_NEW_TOKEN` — the squall donor copy still hardcoded
  `gale-peer`/`GALE_NEW_TOKEN`), `install_peer_block.sh`, `send_to_peer.sh`,
  `.gitignore`, `keys/peers.env.example` + `keys/telegram.env.example`,
  `peer/roster-20260921.md`, `runbooks/`.
- `keys/peers.env` created (600, gitignored): SELF_NAME=CYCLONE,
  SELF_BIND=100.66.39.59:8794, **no peer blocks yet** — pairing is staged,
  not run (rule 8). No `keys/telegram.env` yet (bot placeholder).
- Staged, NOT installed (operator's choice): `systemd/cyclone-peer.service`,
  `cyclone.cron` (`0 1,7,13,19 * * *` waking — ":00 past" the hour after
  Vortex's :58; plus the 5-minute telegram poller line). Activation commands
  in ASK.md.
- Ports verified live before build: 8787-8790 taken by gale/zephyr/squall/
  tempest (tailnet-only), 8791 firewalla-control + 8793 fleet-api
  (localhost-only), 8792 Vortex — hence 8794 for Cyclone. (The design
  session's question text said "8791/8792"; 8791 turned out to be taken,
  noted here so the record is honest.)
- Model verified live: `opencode run --model ollama/qwen3.8:27b` smoke run
  answered in ~0.3s, cost $0 (LAN Ollama at 192.168.1.197:11434, provider
  already defined in the host's global opencode config).
- Pairing staged, matching this host's house pattern (every agent pairs the
  lead + the full remote fleet; sibling↔sibling pairs stay unestablished,
  same as Zephyr/Squall/Tempest): `./pair_remote_batch.sh` (21 remote
  peers) + `~/agent/pair_new_siblings.sh cyclone` (Gale lead spoke). 22
  pairings total, all rule-8 gated, operator-run. Sibling↔sibling pairs are
  NOT staged (would each need a per-pair rule-8a go-ahead; tooling exists at
  `~/agent/pair_siblings.sh`).
- Git: new repo, branch `main`, author "CYCLONE Agent <agent@cyclone.local>".
  Remote `github` -> shared fleet offsite repo (hurricane1976/Gale, branch
  `cyclone`), same write-enabled deploy key as the other four agents
  (one-repo layout, operator-chosen 2026-09-22).
- Next: operator activation (ASK.md), first waking after the Telegram bot
  exists, pairing runs, then normal routine.

## 2026-09-22T15:26:52Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:27:17Z -- paired with VORTEX (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T15:27:26Z -- paired with ZEPHYR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:30Z -- paired with SQUALL (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:27:34Z -- paired with TEMPEST (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:35Z -- local mesh complete; service + cron live

- Operator's rule-8a go-ahead (via gale, who executed on our behalf per the
  operator's delegation "gale should be able to set up their peer links,
  comms"): ALL four sibling pairs confirmed two-way (GALE, ZEPHYR, SQUALL,
  TEMPEST, VORTEX) — the "peer side pending" notes above are now complete.
- `systemd/cyclone-peer.service` enabled+running by the operator;
  `cyclone.cron` in the live crontab: wake at :00 of 1/7/13/19 UTC (4/day)
  + telegram_commands poll every 5 min.
- Remote pairings (21): gale-host halves INSTALLED + self-tested
  2026-09-22 (operator sign-off in chat); see the follow-up entry
  below. Remote halves await the lead-side installs; two-way
  checks pending per peer.

## 2026-09-22T15:56:32Z -- paired with TIDAL (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:36Z -- paired with RIVER (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:40Z -- paired with CREEK (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:44Z -- paired with STREAM (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:48Z -- paired with MEADOW (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:52Z -- paired with BROOK (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:56:56Z -- paired with MIST (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:01Z -- paired with MOUNTAIN (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:05Z -- paired with CANYON (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:09Z -- paired with RIDGE (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:13Z -- paired with HARBOR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:17Z -- paired with DELTA (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:21Z -- paired with MESA (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:25Z -- paired with VISTA (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:29Z -- paired with BEACON (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:34Z -- paired with HIGHBEAM (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:38Z -- paired with LANTERN (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:42Z -- paired with LIGHTNING (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:46Z -- paired with RADAR (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:50Z -- paired with PRISM (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T15:57:54Z -- paired with PULSAR (Cyclone half)

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
- Fixed: prefix is now "[CYCLONE] " (vortex's is "[VORTEX] "); py_compile
  clean; end-to-end send() check delivered a labeled test message to the
  operator chat.
- Note: this agent has NO wake logs -- the operator's /wake never reached
  @cycloneagentsbot (command log empty since install; only scheduled
  wake attempts logged are the 15:08Z pre-key refusals). Flagged to the
  operator to re-send.

## 2026-09-22T16:36Z -- scheduled waking 1 (first unattended since install)

- check_replies: 1 queued operator message ("Yes the word is given",
  id 1790093633) -- already resolved in ASK.md (telegram word given); no
  action. Inbox empty; no peer traffic.
- Host health: up 1d4h, mem 4.1G/58G, disk 25% (71G free), load ~2,
  nginx active + `nginx -t` clean, `cyclone-peer` active. `./backup.sh`
  produced backups/cyclone-20260922T163524Z.tar.gz (464K, 187 files
  listed, verified).
- Production pass (liveness + repo<->docroot drift):
  - All six pages 200 (index/fleet/status/metrics/observability/agora);
    all six fleet API endpoints 200 (telemetry/activity/metrics/
    observability + agora/posts + fleet/health). Note: AGENT.md lists
    the health endpoint as `/api/health`; the live route is
    `/api/fleet/health` (200). Minor docs/impl mismatch in MY role file
    wording or the route path -- reporting, not touching the repo.
  - Content assertion: fleet page roster markup = 27 unique listeners,
    set-IDENTICAL to the `/api/fleet/metrics` sweep (27 nodes:
    21 up / 6 up-auth-gated, 0 down). No orphans, no missing; the
    sweep is fresh data, not a stale cached envelope.
  - DRIFT/CLEANSWEEP, resolved in Gale's favor on re-check: repo
    `~/agent/website/status.html` working tree = 16:18Z / 13568 B, and
    it carries a +35-line UNCOMMITTED change (a new "Ollama" ops-panel:
    loaded /api/ps, inventory /api/tags) vs its own committed HEAD.
    Committed HEAD status.html == the deployed docroot (verified
    byte-diff equal). So the published status page is CONSISTENT with
    the committed source and is missing only the lead's not-yet-committed
    work. Conclusion: NOT a deploy bug, NOT a hand-edited docroot, NOT a
    stale envelope -- just uncommitted WIP in the lead's tree that has
    not been committed/deployed yet. All other docroot-vs-repo files
    matched (no other drift). Not escalating; logged as observation so
    the "200 but wrong" class stays covered if the lead deploys it later
    and I should then see the Ollama panel appear. (I do not commit or
    deploy the lead's repo -- read-only for me.)
  - Other files in docroot vs repo: no other diffs (spot-checked the
    rest of the file set; only status.html differed).
- Spend: local-model run, ~$0 (logs/spend-daily.jsonl recorded by
  wake.sh per kit).
- No new ASK.md items. No notify needed beyond this summary.

## 2026-09-22T17:26:47Z -- paired with MAISTRAL (Cyclone half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T19:00Z -- scheduled waking (19:00Z slot; now on openrouter/qwen/qwen3.8-27b:free)

- check_replies: none. peer/inbox: empty (no peer traffic). No ASK.md changes.
- Host health: up 1d7h, load 2.0, mem 4.1G/58G, disk 26% (70G free). nginx
  active, `nginx -t` clean. All 6 peer services active (gale/zephyr/squall/
  tempest/vortex/cyclone). Crontab as expected — now 7 agents incl. MAISTRAL
  (:59 block). Nginx logs small (access 499K, error 4.3K) — no unbounded
  growth. `./backup.sh` -> backups/cyclone-20260922T190052Z.tar.gz (476K,
  197 files, listing verified).
- Production pass (liveness + data-feed correctness, with repo<->docroot
  re-check to close the 16:36Z observation):
  - Liveness: all six pages 200 (index/fleet/status/metrics/observability/
    agora, served as `*.html`) and all six `/api/fleet/*` endpoints 200
    (telemetry/activity/metrics/observability/agora/posts/health).
    URL notes for future wakings: pages are `/<name>.html`, the health
    route is `/api/fleet/health` (AGENT.md role wording lists bare page
    paths and `/api/health` — recording so bare-path 404s don't
    false-alarm again).
  - Data-feed correctness: `/api/fleet/metrics` sweep fresh (generated
    19:01:55Z) — 28 nodes: 21 up / 7 up-auth-gated (all mountain-host) /
    0 down. Node set AND listener set are exactly the fleet page's roster
    markup (28/28 both directions, no orphans, no missing). Page prose
    counts ("28 agents", "7 agents") consistent with its own roster.
    Activity feed: 24 events, latest 18:57Z, artifact-derived per-agent
    wake events, envelope schema stable (schema/events/generated_at).
  - Repo<->docroot: 16/18 docroot files byte-identical to repo HEAD.
    EXCEPTION: `status.html` + `status.js` — docroot == repo WORKING TREE
    but != HEAD; the 17:50Z deploy shipped the lead's uncommitted Ollama
    panel WIP (the +35-line change observed at 16:36Z is now live on the
    public page). Not a deploy bug and not a hand-edit: deploy.sh ships
    the working tree, and the lead's 18:55Z commit says "website WIP left
    untouched". Watching: flag if the WIP is reverted uncommitted or the
    docroot ever diverges from the working tree.
- Pairing chase (21 remote): re-POST right-token to all 21 — every one
  still 401 (no far-side installs since 16:45Z). All 6 local siblings
  two-way (200 incl. MAISTRAL, paired 17:26Z). Ball still with the
  operator: install-blocks-<cluster>-VORTEX-CYCLONE.txt deliverables
  unchanged.
- Observation (for operator): AGENT.md "Your situation" still says "the
  SIXTH agent" / "fleet of 27 agents on four hosts" — the fleet page now
  carries 28 listeners and Maistral is a 7th co-resident here (rule 7's
  co-resident list already includes Maistral; situation prose does not).
  Not self-editing situation/role text; flagging only.
- Mid-session observation: after this waking started, AGENT.md/wake.sh/
  opencode.json in MY tree were updated (operator-directed) recording a
  second model switch — `openrouter/qwen/qwen3.8-27b:free` ->
  `opencode/muse-spark-1.3-contributor-free` (Muse Spark 1.3 Contributor
  Free via OpenCode Zen) — plus rule 7's co-resident list gaining Maistral.
  This session ran on the openrouter model (per its wake prompt); future
  wakings will use muse-spark per the new wake.sh. Committed the three
  files as found (commit 7fa6e8e) so the switch stays in version history;
  I made no rule/role edits. Runner/model portability data point for
  Tempest: opencode runner, second provider switch in one day, no config
  errors observed.
- Sloppy detail on the record: to confirm the notify had actually reached
  Telegram (it prints nothing on success) I sent a second notify
  ("test-quiet-check") — the operator therefore got two messages this
  waking, the second being a stray verification line. Will verify via
  exit codes only next time.
- Spend: OpenRouter free tier, ~$0 (wake.sh records logs/spend-daily.jsonl).

## 2026-09-22T19:50Z -- waking (first muse-spark run)

- Runner/model note for Tempest: this is the first waking running on
  `opencode/muse-spark-1.3-contributor-free` via OpenCode Zen (switched
  operator-directed mid-19:00Z waking). No config errors; runner behaved
  identically to the openrouter run from this agent's perspective.
- check_replies: none. peer/inbox: empty (no peer traffic). No ASK.md changes.
- Host health: up 1d7h, load ~1.3, mem 3.6G/58G, disk 26% (70G free). nginx
  active, `nginx -t` clean. All 8 peer services active (gale/zephyr/squall/
  tempest/vortex/cyclone + maistral). Crontab as expected (7 agent blocks).
  Nginx logs normal (access 540K, error 8K) — no unbounded growth.
  `./backup.sh` -> backups/cyclone-20260922T195019Z.tar.gz (512K,
  223 files, listing verified).
- Production pass (liveness + design/content consistency):
  - Liveness: all six pages 200 and all six `/api/fleet/*` endpoints 200
    (telemetry/activity/metrics/observability/agora-posts/health).
  - Fleet roll-up (`/api/fleet/metrics`, generated 19:50:39Z, schema
    fleet-metrics/v1): 28 nodes — 21 up / 7 up-auth-gated (all
    mountain-host) / 0 down. Sweep listener set == fleet page roster
    markup 28/28 both directions (no orphans, no missing). Activity feed:
    24 events, latest 18:56Z, schema stable (agent/kind/text/ts) — no new
    events since the 19:00Z waking, expected (no scheduled wakings fall
    between :00-:50 of an off-block hour).
  - Design/content: no stale count strings anywhere ("25/26/27 agents"
    absent; "28 agents" only on fleet page, matching its roster); no
    broken `#anchor` links on any page; titles/meta consistent.
    gale.css carries 44 `--tokens` incl. the storm palette
    (--storm-purple, --bolt, --gust, --flag families) — recording as
    baseline for future drift checks (full list in this entry's
    context; re-capture on suspicion).
  - Repo<->docroot: all 17 docroot files byte-identical to the repo
    WORKING TREE, and the lead's tree is now CLEAN (`git status` empty) —
    i.e. the status.html/status.js Ollama-panel WIP observed uncommitted
    at 16:36Z and deployed-at-17:50Z has since been committed. Docroot ==
    committed source. No drift, no hand-edits. Closing the 16:36Z/19:00Z
    observation as resolved.
- Pairing standing state (unchanged, no re-chase this waking — last chase
  19:00Z, all 21 still 401): local mesh 7/7 two-way incl. MAISTRAL;
  remote halves await operator paste of the three install-blocks files.
  Still-pending installs fleet-wide per Gale's books: Mesa/Prism/Vista
  peer-side installs.
- Spend: muse-spark via OpenCode Zen, ~$0.
- Notify verified via exit code only (no stray second message this time).

## 2026-09-22T21:24:21Z -- paired with SIROCCO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:50Z -- paired with BORA (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T23:10Z -- scheduled waking (muse-spark)

- Runner/model note for Tempest: `opencode/muse-spark-1.3-contributor-free`
  via OpenCode Zen, no config errors; runner behaved identically to prior
  runs from this agent's perspective.
- check_replies: none. peer/inbox: 2 msgs (SIROCCO + BORA pair-test
  two-way checks, "prov-20260922", received 21:25:09/10Z) — acted on,
  moved to processed/.
- New co-residents: SIROCCO (:8796) + BORA (:8797) provisioned by Gale
  under direct operator instruction ("have gale provision/onboard them and
  ensure they can communicate with the fleet"). Gale ran pair_new_siblings
  + pair_siblings incl. my halves (NOTES entries 21:24:21Z/21:24:50Z).
  Verified this waking: inbound pair-tests present AND outbound
  CYCLONE->SIROCCO / CYCLONE->BORA both `{"status":"ok"}` — local mesh
  now 9/9 two-way (gale/zephyr/squall/tempest/vortex/cyclone/maistral/
  sirocco/bora). All 9 peer services active; crontab has all 9 blocks
  (sirocco :02, bora :04). Gale's notes say Sirocco/Bora remote-21 still
  STAGED (rule 8). My AGENT.md "Your situation"/rule-7 co-resident list
  predates Sirocco/Bora (lists through Maistral) — flagging, not
  self-editing.
- Host health: up 1d11h, load ~1.3, mem 3G/58G, disk 27% (69G free).
  nginx active, `nginx -t` clean. Nginx logs not re-measured this waking
  (were normal at 19:50Z). `./backup.sh` ->
  backups/cyclone-20260922T231012Z.tar.gz (528K, 236 files, listing
  verified).
- Production pass (liveness + data-feed correctness + drift re-check):
  - Liveness: all six pages 200 (as `*.html`) and all six
    `/api/fleet/*` endpoints 200 (telemetry/activity/metrics/
    observability/agora-posts/health).
  - Fleet roll-up (`/api/fleet/metrics`, schema fleet-metrics/v1,
    generated 23:10:34Z — fresh): 30 nodes — 23 up / 7 up-auth-gated
    (all mountain-host) / 0 down. Sweep listener set == fleet page
    roster markup 30/30 both directions (no orphans, no missing;
    verified programmatically). Page prose "30 agents" consistent with
    its roster; gale-host block shows 9 agents. Sirocco/Bora already in
    both sweep and page.
  - Activity feed: 24 events, latest 22:56Z (gale commit), schema stable
    (agent/kind/text/ts), artifact-derived — no invented events.
  - Repo<->docroot: `diff -rq` shows no content diffs on deployed files
    (only expected "Only in website/" non-deployed sources: deploy.sh,
    fleet_api.py, etc.); lead's tree clean. No drift, no hand-edits.
- Pairing chase (21 remote): re-POST to all 21 — every one still 401 (no
  far-side installs since 19:00Z). Ball still with the operator: the
  three install-blocks-<cluster>-VORTEX-CYCLONE.txt deliverables
  unchanged. Standing pending installs fleet-wide per Gale's books:
  Mesa/Prism/Vista peer-side installs.
- Gale-side note (from lead's NOTES, relevant to production): Gale found
  and fixed a real regression — the GLOBAL opencode config lost its
  Ollama provider block in an 18:38Z rewrite; re-added (15 models) and
  smoke-tested READY, then set global small_model to
  ollama/qwen3.8:27b (was openrouter glm-5.3-flash). Also flags that
  ~/.config/opencode/opencode.jsonc lives outside version control.
- Spend: muse-spark via OpenCode Zen, ~$0.
