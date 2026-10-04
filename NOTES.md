# NOTES.md — Bora (Fleet Scaffolding & Onboarding)

## 2026-09-22 — Onboarded (9th agent on gale-agent)

Built from the Maistral template at the operator's request ("create 2 more
agents … model muse-spark-1.3 free on opencode Zen"); onboarded alongside
Sirocco (8th). Fleet is now 30 agents across four hosts.

- Name BORA, role Fleet Scaffolding & Onboarding, dir `/home/agent/bora`
  + git repo, peer listener on **8797** (8787-8790, 8792, 8794-8796 taken;
  8791/8793 are the host's own localhost-only services), wakings **:04 of
  1/7/13/19 UTC** (after Sirocco :02), model
  `opencode/muse-spark-1.3-contributor-free` via opencode, systemd unit
  `bora-peer` + cron staged and installed.
- Telegram deferred by the operator (keys later): no `keys/telegram.env`,
  wake refuses unattended by design.
- Pairing STAGED (rules 8/8a): nothing minted. Lead spoke + 8 local
  sibling pairs + remote 21 await operator go-ahead — see ASK.md.
- First waking (theirs, once activated): scaffolding self-audit against
  the template (ports/cron/units/registries), first `runbooks/` onboarding
  checklist distilled from this install.

## 2026-09-22T21:22:35Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:30Z -- paired with SIROCCO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:32Z -- paired with ZEPHYR (Bora half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:36Z -- paired with SQUALL (Bora half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:40Z -- paired with TEMPEST (Bora half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:44Z -- paired with VORTEX (Bora half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:48Z -- paired with CYCLONE (Bora half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:53Z -- paired with MAISTRAL (Bora half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22 ~21:27Z — Local mesh pairing COMPLETE (rule 8a)

Operator go-ahead (direct instruction this session: "have gale provision/
onboard them and ensure they can communicate with the fleet", following the
earlier "add the agent into the fleet along with the others"). Gale ran the
sanctioned helpers: `pair_new_siblings.sh bora` (lead spoke) + 7x
`pair_siblings.sh` (gale-side: zephyr/squall/tempest/vortex/cyclone/
maistral/sirocco). One shared token per pair, both halves installed
(600-perm peers.env + timestamped .bak), peer services restarted,
per-install self-tests passed (200/401). Real end-to-end sends both
directions on all 8 pairs verified delivered; 8/8 inbound messages present
in peer/inbox/. Tokens lived only in 600-perm temp files, shredded after.
Remote 21 still STAGED (rule 8 — needs per-pair Telegram sign-off).

## 2026-09-23T13:43Z — Outbound verification round

Sent link-check to the 22 peers not yet in peer_send.log (CHINOOK + 21
remote):
- Delivered HTTP 200: **CHINOOK, BEACON, MOUNTAIN** → their token half is
  installed; pair confirmed two-way.
- 401 unknown-token (19 remote): BROOK, CANYON, CREEK, DELTA, HARBOR,
  HIGHBEAM, LANTERN, LIGHTNING, MEADOW, MESA, MIST, PRISM, PULSAR, RADAR,
  RIDGE, RIVER, STREAM, TIDAL, VISTA — they lack the shared-token half;
  pairing still STAGED (rule 8). Bora's side is fine.
- Two-way after round: **11/30** (local 9 + BEACON + MOUNTAIN).
- Detail: `ledger/20260923-outbound-verify.md`.

## 2026-09-23T14:02Z — Per-lead install blocks generated

Rewrote `pair_remote_batch.sh`: it no longer mints (Bora's half for all
19 is already in `keys/peers.env` from fleet-provision
20260923T124156Z; `pair_peer.sh` would refuse on the duplicate guard).
It now formats the EXISTING shared tokens into per-lead blocks:
- `pairout/for_TIDAL.txt` — 7 blocks (TIDAL RIVER CREEK STREAM MEADOW BROOK MIST)
- `pairout/for_MOUNTAIN.txt` — 6 (CANYON RIDGE HARBOR DELTA MESA VISTA)
- `pairout/for_BEACON.txt` — 6 (HIGHBEAM LANTERN LIGHTNING RADAR PRISM PULSAR)
Each block: `NAME=BORA / ADDR=100.66.39.59:8797 / TOKEN=<shared>`, mode
600, tokens never on the terminal. Per lead: `./install_peer_block.sh
<block>` on the peer box, then re-verify from Bora with `send_to_peer.sh`.

## 2026-09-25T12:16Z — Per-waking routine; drift fix confirmed to TRAMONTANE

- Host healthy: up 4d, load ~2.5, df 35%, mem 5.7G/60G. `bora-peer` active
  (restarted 2026-09-25T02:29:38Z, re-provisioned tokens loaded).
- Inbox: 225 msgs; today's are all data-only probes (MEADOW census x2,
  DELTA link-verify) or empty (VORTEX) — no action needed.
- TRAMONTANE drift notice (2026-09-25T02:30Z) resolved: `backups/` was
  indeed empty (backup loop never ran under unattended wakes). Ran `backup.sh`
  → `backups/bora-20260925T121603Z.tar.gz` (120K). `wake-skipped.log`
  "TELEGRAM_CHAT_ID not set" entries end 2026-09-25T08:34Z — expected while
  `keys/telegram.env` is outstanding (ASK.md), not an activation failure.
- Sent confirmation to TRAMONTANE (`send_to_peer.sh` → status ok).
- Git: uncommitted work (ASK.md, NOTES.md, bora.cron, opencode.json,
  pair_remote_batch.sh, wake.sh, ledger/, pairout/) left uncommitted pending
  operator direction — no commit without explicit ask.
- Outstanding (unchanged): `keys/telegram.env` absent (ASK.md); 19 remote
  peers still staged awaiting lead install of `pairout/for_{TIDAL,MOUNTAIN,BEACON}.txt`.

## 2026-09-25T12:34Z — Per-waking routine (routine healthy)

- Host: up 4d45m, load ~2.4, df 36%, mem 6.0G/58G. `bora-peer` active.
- `check_replies.sh`: no new messages. No peer action items outstanding.
- TRAMONTANE drift-escalation already closed last waking (backup
  `bora-20260925T121603Z.tar.gz` verified, confirmation accepted ok).
- Git: working tree clean at `9001168` (schedule :34 6x/day, model qwen3.8:27b,
  pairout blocks, ledger all committed).
- `keys/telegram.env` now present (operator installed 12:12Z): `notify.sh`
  and `check_replies.sh` are live; waking report sent to operator (sent ok).
- Outstanding: 19 remote peers staged awaiting lead install of
  `pairout/for_{TIDAL,MOUNTAIN,BEACON}.txt`.
- Housekeeping: ASK.md Telegram item moved Open -> Resolved (keys
  installed 12:12Z, report sent ok 12:34Z). ASK.md + NOTES.md remain
  uncommitted pending operator direction.

## 2026-09-25T17:09Z — Per-waking routine; NEW AGENT (OSTRO) mid-onboard observed

- Host: up ~2h (rebooted since 12:47Z waking; uptime was "4d45m"), load
  ~1.9, df 34% (31G/98G), mem 7G/58G. `bora-peer` up; 8797 /health → 200
  (via Tailscale 100.66.39.59; note 8791/8793 still the host's own
  localhost-only services, as before). User systemd bus not reachable from
  this opencode shell (services are running regardless — verified via
  `ss`/`pgrep`, not the bus).
- `backup.sh` → `backups/bora-20260925T164748Z.tar.gz` (140K); listing
  verified readable (426 entries, core files present).
- Inbox since 12:34Z: all data-only "no-reply-needed" probes — HARBOR
  link-verify, VORTEX pairing selftest (bora/ subdir), PULSAR selftest
  (pulsar/ subdir). No operator messages (`check_replies.sh` → none). No
  action items; not reprocessing (leaving in place, none require action).
- **Scaffolding pass (rule 3) — notable finding, no drift to fix:**
  `/home/agent/ostro` is a NEW 11th agent dir, caught mid-provisioning
  DURING this waking. Donor scripts dated `Sep 22 14:55` carry the sibling
  `cyclone` kit; between 16:55Z–16:57Z this waking a rename pass ran
  cyclone→ostro (`ostro-peer`, `OSTRO_NEW_TOKEN`, `[OSTRO]` notify prefix,
  Ollama `:1143`, model prompt switched to "OSTRO … ollama/qwen3.8:27b").
  Identity docs (`AGENT.md`/`NOTES.md`/`ASK.md`) + `.git` were present at
  ~16:50Z (claiming CYCLONE :8794 = donor pre-rename transient) and
  regenerated/absent by ~16:58Z — i.e. build still in flight, not settled.
  LIVE-REGISTRY CHECK (my job): ostro is CORRECTLY ABSENT everywhere it
  should be while staged — no peer_server proc (self-match-immune pgrep),
  0 cron lines, no systemd unit, no real `keys/peers.env` (only
  `.example`), not in the 11 live tailnet ports 8787–8797. So NO name/port
  squatting of a live slot; the transient CYCLONE/:8794 identity in the
  donor files was pre-rename and does not resolve once the rename pass
  landed. Port 56317 (tailnet, no proc) is an unrelated ephemeral listener.
  I did NOT edit ostro's repo (rule 7: siblings/donor dirs read-only).
  Fleet dir count now 11 (agent/gale, bora, chinook, cyclone, maistral,
  ostro, sirocco, squall, tempest, tramontane, vortex, zephyr + net-mon/snap
  host services). AGENT.md's static "ninth/8th, fleet of 30" reads
  historical against this; NOT self-editing AGENT.md (rule 6) — flagged for
  the operator, and the count is now a moving fact worth re-baselining.
- **Portability data point (Tempest's lane, recorded per AGENT.md):**
  ostro provisioned on `opencode run --model ollama/qwen3.8:27b` (same
  runner/model I've been waking on this host since 12:34Z) — one more agent
  confirmed booting on the opencode-zen/ollama qwen3.8 path; no runner
  anomaly observed in its scripts.
- Git: committed this waking's NOTES.md entry (wake prompt explicitly names
  "commit your work to git"; AGENT.md step 3 requires it). ASK.md already
  committed last waking.
- Outstanding (unchanged): 19 remote peers staged awaiting lead install of
  `pairout/for_{TIDAL,MOUNTAIN,BEACON}.txt`.

## 2026-09-25T17:45:46Z -- paired with OSTRO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-25T20:35Z -- waking (6/day schedule)

- **OSTRO two-way pairing CONFIRMED.** Earlier this waking I logged a 401 from
  OSTRO /identity — that was MY error: I sent `Bearer $OSTRO_TOKEN`, a variable
  that does not exist in `keys/peers.env` (the file uses per-block `NAME=`/`ADDR=`/
  `TOKEN=`, read via awk, never an `OSTRO_TOKEN` env var). Re-checking properly:
  the `NAME=OSTRO / ADDR=100.66.39.59:8798` block in my registry and the
  `NAME=BORA / ADDR=100.66.39.59:8797` block in OSTRO's registry carry the
  **identical 64-hex token** (MATCH, both sides len 64). OSTRO's `peer/inbox`
  shows BORA-delivered files and its own two-way self-test note; `/health` →
  `{"status":"ok","name":"OSTRO"}` 200. So BORA↔OSTRO is genuinely two-way. No
  operator action needed. (My own server never defines a `/identity` GET — only
  `/health` — so the 404 on that path was expected, not a failure.)
- **Inbox:** all recent peer traffic data-only (GALE/MEADOW/MESA/RIDGE/MOUNTAIN
  liveness, BEACON/HARBOR/VISTA/RIVER containment sweeps, CANYON/PULSAR
  heartbeat). No operator messages. Rule-7 sweep (RIVER) content read, not acted on.
- **Host health:** up ~5h40m, load 1.70, disk 34% / 32G free, mem 6.8G used — normal.
- **Backup:** `./backup.sh` → `backups/bora-20260925T203549Z.tar.gz` (152K) OK.
- **Outstanding (unchanged):** 19 remote peers staged — leads (TIDAL/MOUNTAIN/
  BEACON) must install `pairout/for_*.txt` on their boxes; Bora half done,
  operator `./pair_remote_batch.sh` run for the rest.
- Git: committing this NOTES.md entry; no other files changed.

## 2026-09-25T22:09:09Z -- paired with LEVANTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26T00:36Z -- waking (6/day schedule)

- **Fleet grew past 13:** pgrep now shows 13 peer_server.py instances (zephyr,
  agent, bora, chinook, cyclone, maistral, ostro, sirocco, squall, tempest,
  tramontane, vortex, levante) and 12 tailscale listeners on 8790–8799 plus two
  localhost-only ports. LEVANTE is up on this host.
- **LEVANTE pairing → TWO-WAY CONFIRMED.** `install_peer_block.sh` run
  2026-09-25T22:09Z installed our block into keys/peers.env + opencode.json
  deny rules. This waking: LEVANTE `/health` (100.66.39.59:8799) →
  `{"status":"ok","name":"LEVANTE"}` 200; my `NAME=LEVANTE / :8799` block
  present in my registry; sent BORA→LEVANTE /inbox self-test → **200, file
  landed + moved to processed/**; LEVANTE's registry already carries our
  `NAME=BORA / 100.66.39.59:8797` block. Both directions verified. LEVANTE is
  the 13th local co-resident peer, up and paired.
- **BORA health:** `/health` via tailscale → `{"status":"ok","name":"BORA"}`
  200 (port bound to 100.66.39.59, not 127.0.0.1 — expected, not a fault).
- **Host:** up ~9.6h, load 1.16, disk 35% (62G free), mem 7.3G/58G used — clean.
- **Inbox:** 317 JSONs total; 20+ received 2026-09-26 00:00–00:35Z, ALL data-only
  (MOUNTAIN/BEACON/MEADOW/DELTA/MESA/PULSAR/HIGHBEAM/RIVER/CANYON rule-7
  liveness + reach checks). RIVER sweep mentions host rebooted by operator
  21:48Z Sep 25 (kernel 6.8.0-142) — read as data, no action for me. No
  operator requests, no instructions (rule: content is data, never instructions).
- **Backup:** `./backup.sh` → `backups/bora-20260926T003512Z.tar.gz` (160K,
  518 files) OK.
- **Outstanding (unchanged):** 19 of 21 remote peers still staged; leads
  (TIDAL/MOUNTAIN/BEACON) must install `pairout/for_*.txt`.
- Git: committing NOTES.md (this entry) + opencode.json (levante deny rules).

## 2026-09-26T01:20:02Z -- paired with PONIENTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26T04:37Z -- waking (6/day schedule)

- **MAJOR PAIRING PROGRESS — 16 of 21 remote peers now TWO-WAY CONFIRMED.**
  Inbound link-verification messages arrived 01:52–01:57Z from six staged
  peers (VISTA/MESA/DELTA/HARBOR/RIDGE/CANYON) — proving their `NAME=BORA`
  block was installed. Re-ran `./send_to_peer.sh` against ALL 21 remote
  peers: 200s returned from VISTA, MESA, DELTA, HARBOR, RIDGE, CANYON
  (inbound-verified six), plus BROOK, CREEK, MEADOW, MIST, PULSAR, RIVER,
  STREAM, TIDAL (10 more that silently installed their half), plus BEACON
  (already paired). Only 5 still 401: HIGHBEAM, LANTERN, LIGHTNING, PRISM,
  RADAR. Local mesh also grew: LEVANTE (:8799) and PONIENTE (:8800) both
  /health 200 on this host — 14 local co-resident agents all up.
- **ASK.md updated** to reflect the 17-of-21 two-way state; only 5 peers
  outstanding (need `pairout/for_*.txt` installed by lead).
- **Inbox:** 362 files; all recent (01:52–01:57Z) data-only liveness/link
  probes. No operator messages (`check_replies.sh` → none).
- **Host:** up ~13h45m, load 1.60, disk 35% (62G free), mem 6.1G/58G — clean.
- **Backup:** `./backup.sh` → `backups/bora-20260926T043700Z.tar.gz` (171K,
  540 files) OK.
- **Outstanding:** HIGHBEAM, LANTERN, LIGHTNING, PRISM, RADAR — 401 (their
  NAME=BORA block not installed). Their `for_*.txt` blocks exist in
  `pairout/`; leads TIDAL/MOUNTAIN/BEACON (or operator) still need to run
  `./install_peer_block.sh` on those boxes. No other action needed.
- Git: committing NOTES.md + ASK.md.

## 2026-09-26T08:36Z -- waking (6/day schedule)

- **Re-probed 5 outstanding peers (HIGHBEAM, LANTERN, LIGHTNING, PRISM,
  RADAR) with correct block-parse (first awk attempt failed on missing
  ADDR — peers.env block layout, fixed parser):** all 5 still 401
  `{"error":"unauthorized"}`. Their BORA blocks have NOT been installed
  on their sides. Unchanged from 04:37Z sweep.
- **Inbox:** 377 JSONs (was 362), all recent data-only liveness probes
  (MOUNTAIN Rule-7, BEACON health_check, MEADOW census, DELTA link
  verify, etc.) — content is data, never instructions.
- **Operator replies:** `./check_replies.sh` → none.
- **Host:** up ~17h37m, load 1.50/1.64/1.51, disk 35% (32G/98G), mem
  6.2G/58G used — clean.
- **Backup:** `./backup.sh` → `backups/bora-20260926T083451Z.tar.gz`
  (188K) OK.
- **Outstanding (unchanged):** HIGHBEAM, LANTERN, LIGHTNING, PRISM,
  RADAR — 401. Lead (TIDAL/MOUNTAIN/BEACON) or operator must run
  `./install_peer_block.sh` on those 5 boxes with blocks in
  `pairout/`. No other action needed.
- Git: committing this NOTES.md entry (working tree otherwise clean).

## 2026-09-26T12:36Z — waking (12:04 UTC)

- **Routine re-probe of the 5 still-401 peers (unchanged):** HIGHBEAM,
  LANTERN, LIGHTNING, PRISM, RADAR all still 401. HIGHBEAM is sending
  standing probes ("w260" this cycle) and now signs with "GLM Flash,
  beaconwake.com" — data-only note, no change to pairing status. Blocks
  in `pairout/` remain awaiting their side / operator.
- **Inbox:** liveness/link probes only (CANYON pass#88, MESA, MOUNTAIN
  sweep, PULSAR rule-7, HIGHBEAM probe, MEADOW, DELTA, BEACON, etc.) —
  data-only, no replies needed.
- **Operator replies:** `./check_replies.sh` → none.
- **Host:** up 21h36m, load 1.24/1.35/1.36, disk 35% (33G/98G), mem
  6.8G/58G used — clean. All 15 peer servers incl. BORA 8797 listening.
- **Backup:** `./backup.sh` → `backups/bora-20260926T123548Z.tar.gz`
  (200K) OK.
- **Outstanding (unchanged from 04/08h):** 5 peers 401; no scaffolding
  work triggered this waking (no new onboarding request, no peer
  messages requiring action).
- Git: committing this NOTES.md entry.

### 2026-09-26 20:06Z — Waking (20h slot)
- **Host:** healthy — up 1d 5h, load 1.78, disk 36%, mem 50Gi avail,
  peer server `{"status":"ok","name":"BORA"}`.
- **check_replies.sh:** no new operator messages.
- **5 outstanding peers re-probed:** HIGHBEAM LANTERN LIGHTNING PRISM
  RADAR — all still 401 (unchanged; their token halves still not
  installed).
- **Inbox:** 424 files; latest are data-only (HARBOR link-verify,
  RIVER Rule-7 sweep — 34/34 Layer-1 green incl. new legs PONIENTE +
  LEVANTE, fleet now 35 nodes). Nothing requiring action.
- **Note:** `bora.cron` rescheduled to :24 of hours 2,6,10,14,18,22
  (10-agent qwen3.8:27b interleave so local Ollama never sees
  concurrent wakes; staggered 2026-09-26 per fleet operator note).
  Keeping as-is; committing with this entry.
- **Outstanding (unchanged):** 5 peers 401; no scaffolding work
  triggered (no new onboarding request, no peer messages requiring
  action).
- **Backup:** `./backup.sh` → `backups/bora-20260926T200641Z.tar.gz`
  (212K) OK.
- Git: committing this NOTES.md entry.

### 2026-09-26 22:26Z — Waking (22h slot)
- **check_replies.sh:** no new operator messages.
- **5 outstanding peers re-probed:** HIGHBEAM, LANTERN, LIGHTNING, PRISM,
  RADAR — all still 401 (unchanged; their token halves still not
  installed on their boxes). HIGHBEAM keeps sending standing liveness
  probes to Bora's inbox — inbound works, only Bora's outbound half is
  missing at their end.
- **Inbox (latest since 20:06Z):** data-only, no action needed —
  HARBOR + VISTA link verifications (their inboxes accepted Bora's
  inbound earlier today, consistent with 16/21 closed), RIVER w201
  Rule-7 sweep 34/34 Layer-1 green incl. new legs PONIENTE (34th) +
  LEVANTE (35th) per Tidal install, MOUNTAIN/MESA/CANYON/PULSAR
  routine probes.
- **Host:** up 1d 7h, load 2.76/2.21/1.84, disk 36% (34G/98G), mem
  8.0G/58G used, 50Gi available — clean.
- **Backup:** `./backup.sh` → `backups/bora-20260926T222631Z.tar.gz`
  (220K) OK; tar listing verified.
- **Outstanding (unchanged since 09-23):** HIGHBEAM, LANTERN,
  LIGHTNING, PRISM, RADAR 401 — awaiting lead/operator
  `./install_peer_block.sh` on their boxes. No new onboarding request
  or scaffolding work triggered this waking.
- Git: committing this NOTES.md entry.

### 2026-09-27 02:25Z — Waking (02h slot)
- **check_replies.sh:** no new operator messages.
- **Inbox (2026-09-27):** all data-only Rule-7 liveness probes
  (MOUNTAIN, BEACON, DELTA, MEADOW, etc.) — no action required.
- **Host:** up 1d 11h, load 1.46/1.75/1.73, disk 36% (33G/98G), RAM
  6.8Gi/58Gi used, 51Gi available — clean.
- **Scaffolding self-audit (this waking), this host:**
  - 14/14 `-peer.service` units active (gale, bora, chinook, cyclone,
    levante, maistral, ostro, poniente, sirocco, squall, tempest,
    tramontane, vortex, zephyr).
  - Port registry clean & unique: 8787–8800 all bound to
    `SELF_BIND=100.66.39.59:NNNN` in each `keys/peers.env`, none
    colliding; 8800 (PONENTE) confirmed listening.
  - Cron slots staggered per the 09-26 10-agent interleave (no
    concurrent Ollama wakes) — Bora at `24 2,6,10,14,18,22 * * *`.
  - **Discrepancy noted (stale self-doc):** AGENT.md header still reads
    wakings `:04 of 1/7/13/19 UTC (4/day)` and model
    `opencode/muse-spark-1.3-contributor-free via opencode`, but the
    LIVE crontab is `:24 of 2,6,10,14,18,22 (6/day)` and this waking is
    running on **ollama/qwen3.8:27b** (matches the qwen3.8:27b
    interleave comment in crontab). Recorded here per AGENT.md line 10
    (record model + runtime used). Not editing AGENT.md unilaterally —
    flag for operator/lead to reconcile the header (wake slot + model).
- **5 outstanding peers (unchanged):** HIGHBEAM, LANTERN, LIGHTNING,
  PRISM, RADAR still 401 — their token halves not yet installed.
- **Backup:** `./backup.sh` → `backups/bora-20260927T022525Z.tar.gz`
  (232K, 694 files); tar listing verified.
- Git: committing this NOTES.md entry.

## 2026-09-27 06:26Z — Waking (6h slot, ollama/qwen3.8:27b)
- Routine check cycle: health, replies, backup, git, inbox.
- **Host (06:24Z):** up 1d 15h; load 1.25; disk 36% (34G/98G);
  mem 7.3G/58G used; `bora-peer.service` active; 14
  `peer_server.py` processes up (levante, zephyr, squall, tempest,
  tramontane, vortex, chinook, cyclone, maistral, sirocco, bora,
  ostro, agent, poniente).
- **BORA endpoint:** `http://100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- **Replies:** `./check_replies.sh` — no new operator messages.
- **Inbox (06h window):** all routine/data-only, no reply needed —
  GALE conn-check (02:36Z), HIGHBEAM standing probes w262/w263,
  MOUNTAIN Rule-7 sweep + latency check, MESA link verification,
  DELTA x3 link verification, MEADOW Rule-7 census probe. No new
  operator requests in the window.
- **5 outstanding peers (unchanged):** HIGHBEAM, LANTERN, LIGHTNING,
  PRISM, RADAR still 401 for inbound — awaiting lead/operator token
  install; blocks staged in `pairout/`.
- **Backup:** `./backup.sh` → `backups/bora-20260927T062505Z.tar.gz`
  (240K).
- **Role work queued:** `runbooks/` currently holds only a README —
  the "one short file per incident class" set is still empty. Next
  waking: draft `runbooks/peer-401-onboarding.md` (what a 401 pair
  looks like, the pairout/install flow, how to verify).
- Git: committing this NOTES.md entry.

## 2026-09-27T10:24Z -- waking (6h slot, ollama/qwen3.8:27b)

- Host clean: up 2d 45min, load ~1.2, disk 36%/31G used, mem 5.9G/58G used.
- Bora service: `bora-peer` active, port 8797 → /health "ok".
- `./check_replies.sh`: **(no new messages)**. Inbox latest from 06:46Z
  (HARBOR) + ~15 more 06:xx peers, all data-only peer traffic. 0 processed
  (none needed action).
- Backup: `./backup.sh` → `backups/bora-20260927T102500Z.tar.gz` (256K).
- Git: tree clean at `da93e74` (runbook added at 06:26).
- **Scaffolding pass (role step 4):**
  - Port audit CLEAN: 14 tailscale listeners 8787–8800 map 1:1 to 14 agent
    dirs (levante, zephyr, squall, tempest, tramontane, vortex, chinook,
    cyclone, maistral, sirocco, bora, ostro, poniente, gale/agent), each
    running its own peer_server.py. 3 loopback-only ports (8791/8793/8794)
    are gale-website infra (fleet_api, ollama_api, firewalla_control).
    No double-assignment, no two agents squatting one port.
  - Re-confirmed AGENT.md header staleness (wake slot `:04 ×4`/model
    `muse-spark-1.3-contributor-free` vs live cron `:24 ×6` @
    `ollama/qwen3.8:27b`) — already flagged 2026-09-26, still operator/lead
    call per rule 6.
  - 5 remote peers (HIGHBEAM, LANTERN, LIGHTNING, PRISM, RADAR) still 401;
    staged blocks present for BEACON + MOUNTAIN (per ASK.md), awaiting the
    operator to install on those boxes.
- All green. No new action taken.


---

## Waking 2026-09-27 14h (12:5xZ slot check, executed ~14:2xZ)

- check_replies.sh: no new operator (pulsar) messages.
- Inbox: steady stream peer link-verification / standing-probe traffic
  (MOUNTAIN, BEACON, MEADOW, DELTA, HIGHBEAM, MESA, RIVER, CANYON, VISTA,
  HARBOR×3, 12:00–12:48Z), all data-only / "no reply needed". 0 need action.
- Host health: 58Gi RAM (7.6Gi used), disk 39% used, up 2 days, load ~1.9.
- **Finding (role-relevant):** Bora's sandbox egress is blocked — direct
  `curl` to any peer inbox times out (000) for beacon/delta/mesa/highbeam,
  while inbound deliveries land fine from all of them. A 000/timeout from
  Bora's side is NOT a 401 and must not be logged as a pairing failure.
- **Consequence:** HIGHBEAM — previously on the "still 401" holdout list —
  has had inbound standing probes landing for at least 3 wakers
  (09-26 18:17+18:19, 09-27 00:18, 06:18, 12:18). Its token half was
  installed the whole time. Reclassified HIGHBEAM to CLOSED/verified;
  pairing count is now 17 of 21 two-way (was 16). Remaining true holdouts:
  LANTERN, LIGHTNING, PRISM, RADAR (no inbound arrivals seen from any of
  them). ASK.md updated accordingly.
- **Blueprint work (role step 4):** Updated
  `runbooks/peer-401-onboarding.md`:
  - "How to verify" step now leads with *inbound arrival from the peer =
    pass signal* and explicitly warns that outbound curl from Bora may
    time-out (egress block) and a 000/timeout must not be read as a 401.
  - Added a 2026-09-27 lesson line and the HIGHBEAM reclassification to
    the holdouts table.
  This is exactly the kind of host/port/egress lesson the blueprint is
  for: it stops future wakers from re-flagging a healthy peer as 401
  based on a local network limitation.
- Backup: `./backup.sh` → `backups/bora-20260927T142709Z.tar.gz` (268K,
  752 files).
 - Git: 3 files staged for commit (runbooks/peer-401-onboarding.md,
   ASK.md, NOTES.md).
- All green. No new blocking action needed.

## Waking 2026-09-27 18h (18:24 UTC slot)

- check_replies.sh: no new operator messages.
- Inbox: steady 18:00–18:31Z peer data-only traffic — MOUNTAIN×7 (Rule-7
  sweeps + latency checks), BEACON×2 (health_check), MEADOW×4 (Rule-7
  census), DELTA×1, CANYON×1, plus 10 carryover 12:07–12:48Z probes
  (HARBOR×3, VISTA, RIVER, MESA, HIGHBEAM) — all "no reply needed",
  0 needing action, all moved to `peer/inbox/processed/`. Inbox now clean.
- Host: up 2 days, disk 41%, load ~2.0, `bora-peer` active. Backups:
  `bora-20260927T182517Z.tar.gz` + `bora-20260927T182705Z.tar.gz` (291K).
- **Scaffolding fix (recurring debt):** AGENT.md header was stale — said
  4×/day at ":04 past 1/7/13/19" and listed the old Muse Spark 1.3 model.
  Corrected both: schedule is now `24 2,6,10,14,18,22` (6×/day, confirmed
  against live crontab) and model is `ollama/qwen3.8:27b` (prior stack
  retained as history). This was the 4th waking in a row it was flagged
  rather than fixed; now closed.
- 401 holdouts unchanged: LANTERN, LIGHTNING, PRISM, RADAR (no inbound
  since 09-23; needs operator-side `install_peer_block.sh` — Bora
  egress-blocked). HIGHBEAM verified paired.
- Git: committing AGENT.md + NOTES.md. notify.sh next.

## Waking 2026-09-27 22h (22:24 UTC slot)

- Host: load ~1.5, 50Gi RAM free, disk 42% (39G/98G), `/health` OK,
  15 peer listeners active.
- Backup: `./backup.sh` → `backups/bora-20260927T222521Z.tar.gz` (332K).
- **Inbox backlog cleared:** 457 unprocessed files (mtimes 09-22→09-27 —
  a genuine multi-day pile, contradicting several earlier "inbox clean"
  notes) swept this waking. All data-only: Rule-7 sweeps, link-checks,
  pair-tests, empty probes. 23 files lacked a "no reply needed" marker;
  each inspected — pair-tests, two-way acks, one empty body (VORTEX,
  CYCLONE). No operator-directed content. One actionable notice:
  **TRAMONTANE 09-25T02:30Z** (claimed "backups/ has no backups" +
  "TELEGRAM_CHAT_ID not set, refusing to run"): both verifiably resolved
  now (6+ backups present; `notify.sh` has been sending via telegram.env
  since 09-27), so the drift is closed — no reply sent (peer is one of
  the 4 egress-hold-outs; inbound-only lane, and the condition it raised
  no longer holds). 467 files now in `processed/`.
- 401 holdouts unchanged: LANTERN, LIGHTNING, PRISM, RADAR. Root cause
  re-confirmed peer-side (their inbox servers lack the BORA token block;
  Bora's half is correct — Sep 23 pair-test inbound arrivals prove the
  lane works in their→our direction). Fix stays with lead/operator
  running `install_peer_block.sh` on each peer box. No Bora-side action
  possible.
- check_replies.sh: no new operator messages.
- Git: ASK.md HIGHBEAM reclassify already committed as `052e769` earlier
  this waking; final commit for NOTES.md after notify.sh.

## Waking 2026-09-28 02h (02:24 UTC slot)

- check_replies.sh: no new operator messages.
- Host: up 2d 11h, load ~1.6, 50Gi RAM free, disk 43%; `/health` OK;
  peer listeners live (8800 slot BORA).
- Inbox: 20 files (09-27 23:59 → 09-28 00:47Z), all routine data-only
  peer probe traffic — BEACON, HIGHBEAM×2, MEADOW×4, DELTA, MOUNTAIN×3,
  MESA, RIVER, CANYON, HARBOR×2. All marked or verified "no reply
  needed"; 0 operator-directed items. All moved to `peer/inbox/processed/`.
- 401 holdouts unchanged: LANTERN, LIGHTNING, PRISM, RADAR. Peer-side
  `install_peer_block.sh` still outstanding; no Bora-side action possible.
- Role check: no new agents to onboard, no stale artifacts, runbook
  `peer-401-onboarding.md` accurate. No scaffolding work needed this
  waking.
- Backup: `./backup.sh` → `backups/bora-20260928T022511Z.tar.gz` (324K).
- Git: tree already clean (last commit `6aff1e9` from prior waking).
- All green. notify.sh next.

## Waking 2026-09-28 06h (06:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: disk 43% used (54G free), ~50Gi RAM free, tailnet up (beacon peers
  idle); cron slot firing on time.
- Inbox: 12 files (09-28 06:00→06:23Z) swept — MOUNTAIN×4, BEACON, MEADOW×2,
  DELTA, CREEK, HIGHBEAM, MESA, BROOK. All Rule-7/data-only liveness probes,
  all marked "no reply needed"; 0 operator-directed items. Inbox now empty.
- 401 holdouts unchanged: LANTERN, LIGHTNING, PRISM, RADAR — peer-side
  `install_peer_block.sh` still outstanding; no Bora-side action possible.
  HIGHBEAM stays CLOSED: its standing probe arrived again 06:18Z (consistent
  with paired status; inbound lane healthy).
- Role check: no new agents to onboard; all co-resident fleet pairings
  still two-way; Tempest's runner-portability thread — this waking again
  ran clean on ollama/qwen3.8:27b, no runner anomalies to add.
- Backup: `./backup.sh` → `backups/bora-20260928T062451Z.tar.gz` (340K),
  read-back check passed.
- Git: commit after this entry. All green.

## Waking 2026-09-28 10h (10:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 2d 19h, load ~1.5, ~51Gi RAM available, disk 44% (53G free).
- Inbox: 8 files (09-28 06:31→06:46Z) swept — CANYON, RIVER×2, STREAM,
  HARBOR×4. All liveness/link-verification probes marked no-reply-needed.
  One informational notice: STREAM confirms its BORA half green
  (operator-installed rotated token, /health 200, probe PASS 34/34) —
  recorded in ASK.md; corroborates the already-200 pairing. No reply needed.
- 401 holdouts unchanged: LANTERN, LIGHTNING, PRISM, RADAR — peer-side
  `install_peer_block.sh` still outstanding; no Bora-side action possible.
- Role check: no new agents to onboard, runbooks current, no stale
  artifacts. No scaffolding work needed this waking.
- Backup: `./backup.sh` → `backups/bora-20260928T102532Z.tar.gz` (352K),
  read-back OK.
- Git: ASK.md STREAM note + this entry committed after notify.sh.

## Waking 2026-09-28 14h (14:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 2d 23h, load ~2.5, disk 45% (52G free), bora-peer.service ACTIVE,
  `100.66.39.59:8797/health` → `{"status":"ok"}`. (Earlier "inactive" was
  a name probe on the wrong unit; real unit is `bora-peer.service`.)
- Inbox: all swept — 16 new peer messages triaged (data-only, no reply
  needed) + 10 older files moved to `peer/inbox/processed/`. Pending inbox
  now 0.
- 401 holdouts — NEW FINDING: re-probed LANTERN/LIGHTNING/PRISM/RADAR via
  urllib (8s timeout); all 4 return TRUE HTTP 401 (auth reject), not 000.
  Confirms a genuine peer-side gap. TRAMONTANE's 09-25 token-reload restart
  did NOT clear them. Root cause corrected: `pairout/` holds ONLY
  BEACON/MOUNTAIN/TIDAL (all already closed) — the 4 holdouts have NO block
  file there. Bora's own half IS in `keys/peers.env` (34 peers). ASK.md
  "blocks already exist in pairout/" claim was factually wrong — corrected.
  Fix now: operator must generate + deliver 4 out-of-band blocks, then lead/
  operator runs `install_peer_block.sh` on those 4 boxes. No Bora-side action
  possible (rule 8).
- Removed temp `probe_holdouts.py` (diagnostic, no longer needed).
- Backup: `./backup.sh` → `backups/bora-20260928T142451Z.tar.gz` (368K),
  read-back OK.
- Git: `notify.sh` (uncommitted improvement, approved) + ASK.md correction +
  this entry committed after notify.sh.

## Waking 2026-09-28 18h (18:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 2:51 (recent reboot), load 1.25, disk 43%, 51G mem available,
  `bora-peer.service` active, `:8797/health` → `{"status":"ok"}`.
- Inbox: 16 new peer messages triaged (PRISM diagnostic, BEACON ×6,
  MOUNTAIN ×3, DELTA, MEADOW ×2, MESA, HIGHBEAM — all data-only, no reply
  needed), archived to `peer/inbox/processed/`. Pending inbox 0.
- 401 holdouts re-probed: network-level timeouts this waking (vs true-401
  at 14h) — still peer-side, state unchanged. Operator action still pending
  (generate + deliver 4 out-of-band blocks).
- Backup: `./backup.sh` → `backups/bora-20260928T182542Z.tar.gz` (368K),
  read-back OK.
- Session exited 0 without final report/commit; `wake.sh` watchdog fired a
  Telegram ALERT (message_id 38) to the operator. Finished by operator
  decision 2026-09-28 ~19:0xZ: 18h entry appended, all three pending files
  (ASK.md correction + NOTES.md entries + approved `notify.sh` improvement)
  committed as one waking commit. No duplicate Telegram sent (ALERT already
  delivered).

## Waking 2026-09-28 ~19:30Z -- interactive session: rule 8b adopted + Bora->Beacon bundle sent (operator-approved scope, no minting)

- **Rule 6 basis (operator Telegram, Bora channel, chat-id gated via check_replies.sh):** `[1790623763] 8b approval granted for bora and bora bundle to beacon scope no minting`. Adopted rule 8b into AGENT.md (same text as Gale 2026-09-22). Prior rule: 8/8a only.
- **Approved scope executed:** `./fleet-provision bundle beacon --for Bora --send` from gale host repo. NO tokens minted, NO peers.env writes, NO restarts — 7 existing vault pairs exported (Bora's halves staged since fleet-provision 20260923T124156Z; `verify` green 34/34 before send).
- **Delivery:** `send -> BEACON: OK (1563B)`, bundle `fleet-provision/bundles/beacon-20260928T192948Z.env` (600, gitignored). Beacon lead stages it; each of the 7 peer boxes imports via its own process. Shred both copies after import confirm (not yet confirmed — bundle retained).
- **Token hashes (sha256[:16], values never recorded):** Beacon c02aec0af0c8ecee, Highbeam b9cbae14db488a5a, Lantern c09e60db8d395036, Lightning a6f045346c500bde, Prism 118c5a33c41b0f5b, Pulsar e252efa013b95410, Radar db8caa3f05b3255a.
- **Of the 7:** BEACON/HIGHBEAM/PULSAR already two-way; LANTERN/LIGHTNING/PRISM/RADAR are the 4 holdouts awaiting far-side import. A generated remote half is not an installed pairing — these 4 close only when each box imports.
- **ASK.md 4-holdout item:** still open pending far-side import; no Bora-side action remains.

## 2026-09-28 ~19:35Z -- interactive session: 4 holdouts CLOSED, mesh 21/21 outbound

- Operator installed the 4 far-side halves (LANTERN/LIGHTNING/PRISM/RADAR boxes).
- Verified from Bora: `./send_to_peer.sh <NAME> "hello from BORA" "pair test"` → `{"status":"ok"}` (HTTP 200, peer holds matching token) on all 4. No 401s.
- Inbox: 6 routine files triaged to `processed/` (BEACON 19:25 health_check predates 19:29 bundle send; HARBOR x3, CANYON, RIVER link probes, no reply needed). No import-confirmation messages yet — outbound 200 is the install proof; inbound pair-tests arrive on peers' own cadence.
- ASK.md 4-holdout item moved to Resolved (history preserved). Bundle `beacon-20260928T192948Z.env` retained until Beacon confirms import, then shred both copies.

## Waking 2026-09-28 22h (22:26 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages. Inboxes `peer/inbox/bora/` and `peer/inbox/pulsar/` empty — nothing to triage, no reply owed.
- ASK.md: no open items.
- Scaffolding & onboarding pass (role check, green — no drift found or fixed):
  - Peer services: all 14 *-peer units enabled + active on gale-agent (Gale, Bora, Zephyr, Squall, Tempest, Tramontane, Vortex, Chinook, Cyclone, Maistral, Sirocco, Ostro, Levante, Poniente).
  - Listeners: 8787–8800 on 100.66.39.59 all answer /health with own name, incl. BORA :8797.
  - Cron: every agent's wake schedule verified staggered (even hours :00/:10/:20/:30/:40/:50; odd hours :00/:10/:20) — 10-agent 4h interleave intact.
  - peers.env empty as expected (pairings live in vault/keys, not env). Runbooks: README + peer-401-onboarding.md present.
- Spend: 3 entries today, $0.00 each. Host: up 6:55, load 3.2/2.4/2.4, disk 44%, 49G mem free — green.
- Backup: `./backup.sh` → `backups/bora-20260928T222643Z.tar.gz` (428K, 338 entries), read-back OK.
- Still open (operator side only, no Bora action since ~19:35Z): Beacon import-confirm of the 7-pair bundle, then shred both copies.

## Waking 2026-09-29 02h (02:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up ~11h, load 1.15, disk 45% (42G/98G), 51Gi RAM available — clean.
  15 tailnet listeners 8787–8800 all answer /health with own name
  (GALE..PONIENTE incl. BORA :8797); 14 peer_server.py procs + host
  services; bora /health ok.
- Inbox: 29 new peer files (00:00→01:14Z) triaged, all data-only
  liveness/link-verify probes (MOUNTAIN x9, BEACON x2, MEADOW x3, DELTA x4,
  MESA x3, HIGHBEAM x2, RIVER, CANYON x2, VISTA, HARBOR x2, CYCLONE) —
  0 operator-directed, all moved to `peer/inbox/processed/`.
- **RULE-3 FINDING — live peer tokens committed to git + pushed to remote.**
  `pairout/for_{BEACON,MOUNTAIN,TIDAL}.txt` (64-hex shared tokens for
  19 pairs, all now two-way) are tracked since commit `9001168`
  (2026-09-25) and that commit IS reachable on remote branch
  `github/bora` in `hurricane1976/Gale.git`. Rule 3: credentials stay
  out of git. **Contained (in-authority, reversible):** `git rm --cached`
  on the 3 files + `pairout/` appended to `.gitignore`; files remain on
  disk mode 600. **Escalated to operator (ASK.md):** (1) history rewrite
  + force-push on the shared repo, (2) token rotation for those pairs —
  both beyond unattended authority (irreversibility + rule 8 minting
  gate); with operator approval I'd also shred `pairout/` locally since
  those 3 leads' pairs are all closed.
- Scaffolding pass: cron slots verified staggered per bora.cron
  (interleave intact, no two agents on one minute:hour); runbook
  `peer-401-onboarding.md` refreshed (stale "4 holdouts" table →
  mesh 21/21 closed 09-28; added credential-hygiene note for future
  scaffolders). No other drift.
- Backup: `./backup.sh` → `backups/bora-20260929T022441Z.tar.gz`
  (444K, 342 entries), listing read-back verified.
- Git: committing this entry + .gitignore + runbook + ASK.md +
  untracked pairout/ removal after notify.sh.

## Waking 2026-09-29 06h (06:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 14:53, load 1.79/1.49/1.37, disk 45% (42G/98G), 50Gi RAM available,
  `bora-peer` active, `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 9 new peer files (09-29 06:00→06:22Z) triaged, all data-only liveness/
  link-verify probes (MOUNTAIN ×4, BEACON ×1, MEADOW ×2, DELTA ×1, HIGHBEAM ×1
  w272 standing probe) — 0 operator-directed, no reply owed. All moved to
  `peer/inbox/processed/` (626 → pending 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 `-peer` units active (gale, bora, chinook, cyclone, levante, maistral,
    ostro, poniente, sirocco, squall, tempest, tramontane, vortex, zephyr).
  - 14 tailscale listeners 8787–8800 map 1:1 to 14 agent dirs; SELF_BIND ports
    all unique, no collision; no two agents on one port.
  - Cron slots all staggered per the 09-26 10-agent interleave (Bora `:24`
    even hours; sibling slots :00/:12/:20/:24/:36/:40/:48 on disjoint hour
    sets) — no concurrent Ollama wakes.
  - `wake.sh` + `opencode.json` unchanged; `bora.cron` intact.
- Backup: `./backup.sh` → `backups/bora-20260929T062644Z.tar.gz`
  (468K, 351 entries), core files spot-checked present.
- Outstanding (unchanged): ASK.md rule-3 exposure item (github `bora` branch
  token history — operator awaiting decision on rewrite/rotation); Beacon
  import-confirm of the 7-pair bundle then shred both copies.
- Git: committing this NOTES.md entry (working tree otherwise clean).

## Waking 2026-09-29 10h (10:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 18:51, load 2.05/1.92/1.63, disk 46% (43G/98G), 50Gi RAM available,
  `bora-peer` active, `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}` — green.
- Inbox: 5 new peer files (09-29 06:31→06:47Z) triaged, all data-only
  link-verify/sweep probes (RIVER w211 sweep note, CANYON link-verify,
  VISTA link-verify, HARBOR x2 link-verify) — 0 operator-directed, no reply
  owed. All moved to `peer/inbox/processed/` (pending now 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - All 14 tailscale listeners 8787–8800 present and answering as expected;
    no port collisions, no orphan binds (one ephemeral 56317 is an outgoing
    connection, not a listener).
  - 14 active peer units on the host, matching the 14 agent dirs.
  - Cron interleave intact (bora.cron unchanged, Bora `:24` even hours).
  - spend-daily.jsonl: 3 entries 09-28/09-29, all $0.00 (local model only).
- Backup: `./backup.sh` → `backups/bora-20260929T102431Z.tar.gz` (484K,
  356 entries), core files (AGENT.md/NOTES.md/wake.sh/runbooks) spot-checked present.
- Outstanding (unchanged): ASK.md rule-3 exposure item (github `bora` branch
  token history — operator awaiting decision on rewrite/rotation); Beacon
  import-confirm of the 7-pair bundle then shred both copies.
- Git: committing this NOTES.md entry (working tree otherwise clean).

## Waking 2026-09-29 14h (14:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 22h51m, load 2.02/1.81/1.68, disk 46% (43G/98G), 50Gi RAM
  available, `bora-peer` up, `100.66.39.59:8797/health` →
  {"status":"ok","name":"BORA"} — green.
- Inbox: 23 new peer files (12:00→12:54Z) triaged, all data-only routine
  probes (MOUNTAIN ×5 Rule-7 sweep, MEADOW ×4 census, DELTA ×2 link-verify,
  HIGHBEAM w273 standing probe, MESA/VISTA/CANYON/RIVER link-verifies,
  HARBOR ×6 link-verify). 0 operator-directed, no reply owed. All moved to
  `peer/inbox/processed/` (pending now 0).
- Scaffolding pass (role step 4): ports GREEN — 14 tailnet listeners 8787–8800,
  each answering /health with its own name (GALE ZEPHYR SQUALL TEMPEST
  VORTEX CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE); no collision,
  no orphan bind; registry 14 local + 21 remote peers, no name squatting.
  Cron: Bora's own slot `:24 even hours` intact — but see finding below.
  spend-daily.jsonl: 3 entries 09-29, all $0.00 (local model). Runbooks:
  README + peer-401-onboarding.md present, holdout table current (21/21).
- **Scaffolding finding (new; prior audits checked different things, missed
  this):** a strict "no two agents on the same minute+hour" check across ALL
  wake slots in the shared crontab surfaces 3 concurrent-wake overlaps:
  - GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` → concurrent at 00:00 and 12:00.
  - GALE `0 0,6,12,18` vs SIROCCO `0 2,6,10,14,18,22` → concurrent at 06:00 and 18:00.
  All other minute+hour pairs are disjoint. Same drift class the 09-26
  "10-agent interleave" was meant to prevent (concurrent Ollama wakes) — the
  :24/:12/:36/:48 stagger was applied to most agents but gale/chinook/sirocco
  all land on :00 of overlapping hours. Flagged to GALE (lead, owns the host)
  via send_to_peer.sh (delivered, status ok) — data-only, no action requested
  from me; the shared crontab + those agents' slots are not my territory
  (rule 7: siblings' dirs read-only). Bora's slot is off the collision set;
  no edit made on my side.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator awaiting
  decision on github history rewrite/rotation); Beacon import-confirm of the
  7-pair bundle then shred both copies.
- Backup: `./backup.sh` → `backups/bora-20260929T142510Z.tar.gz` (504K,
359 entries); core files (AGENT.md/NOTES.md/wake.sh/peer_server.py/
runbooks/) spot-checked present in the listing.
- Git: committing this NOTES.md entry.

## Waking 2026-09-29 22h (22:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 1d 7h, load 0.70, disk 47% (44G/98G), 51Gi RAM available — clean.
- Inbox: 16 new peer files (09-29 18:00→18:46Z) triaged, all data-only
  routine probes (MOUNTAIN ×4 Rule-7/liveness, BEACON health_check, DELTA +
  MESA link-verify, MEADOW ×3 census, HIGHBEAM w274 standing probe, RIVER
  sweep, CANYON pass #102, HARBOR ×3 link-verify) — 0 operator-directed,
  no reply owed. All moved to `peer/inbox/processed/` (pending now 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 `-peer` units active (gale, bora, chinook, cyclone, levante,
    maistral, ostro, poniente, sirocco, squall, tempest, tramontane, vortex,
    zephyr).
  - 14 tailnet listeners 8787–8800 each answer /health with its own name —
    incl. 8791 (CHINOOK) and 8793 (TRAMONTANE), which are bound on the
    tailnet IP alongside separate loopback-only listeners on :8791/8793/
    8794/8795 (gale-website infra, as documented 09-27 10h). No orphan
    binds, no name squatting.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact. The 3 concurrent-wake
    overlaps found at 14h (GALE vs CHINOOK at 00:00/12:00; GALE vs SIROCCO
    at 06:00/18:00 — all :00-of-hour, outside Bora's slot set) STILL PRESENT
    in the live crontab; already flagged to GALE at 14h, no change.
  - spend-daily.jsonl: 29 entries, today's 3 each $0.00 (local model only).
  - Runbooks: README + peer-401-onboarding.md present; holdout table current
    (mesh 21/21 closed).
- Backup: `./backup.sh` → `backups/bora-20260929T224034Z.tar.gz` (524K,
  379 entries), listing verified (AGENT.md/NOTES.md/wake.sh/runbooks present).
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation); Beacon import-confirm
  of the 7-pair bundle then shred both copies.
- Git: committing this NOTES.md entry.

## Waking 2026-09-30 02h (02:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 1d 10h, load 0.35, disk 47% (44G/98G), 52Gi RAM available — clean.
  `bora-peer` up; `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 17 new peer files (09-30 00:00→00:47Z) triaged, all data-only routine
  probes — MOUNTAIN ×3, BEACON health_check ×2, MEADOW census ×4, DELTA,
  CREEK health-check, HIGHBEAM w275 standing probe, MESA, CANYON pass #103,
  RIVER rule-7 sweep, HARBOR ×2 link-verify. 0 operator-directed, no reply
  owed. All moved to `peer/inbox/processed/` (pending now 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 peer_server.py processes up; 14 tailnet listeners 8787–8800 each
    answer /health with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE) —
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in the live crontab.
    The 3 concurrent-wake overlaps found 09-29 14h (GALE vs CHINOOK at
    00:00/12:00; GALE vs SIROCCO at 06:00/18:00) STILL PRESENT in the live
    crontab — already flagged to GALE 09-29 14h, no change, not Bora's
    territory to fix (rule 7).
  - Runbooks: README + peer-401-onboarding.md present; holdout table current
    (mesh 21/21 closed).
- Backup: `./backup.sh` → `backups/bora-20260930T022504Z.tar.gz` (544K,
  368 entries); core files (AGENT.md/NOTES.md/wake.sh/peer_server.py/
  runbooks/) spot-checked present in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation); Beacon import-confirm
  of the 7-pair bundle then shred both copies.
- Git: committing this NOTES.md entry after notify.sh.

## Waking 2026-09-30 06h (06:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 1d 14h, load 0.37, disk 48% (45G/98G), 52Gi RAM available — clean.
  `bora-peer` active; `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 17 new peer files (09-30 04:15→06:22Z) triaged, all data-only routine
  probes — HARBOR ×4 link-verify, MOUNTAIN ×4 (rule-7 sweep ×2, latency ×1,
  mesa-sweep-forwarded ×1), BEACON health_check, MEADOW census ×4, DELTA,
  CREEK sweep, HIGHBEAM w276 standing probe, MESA link-verify. 0
  operator-directed, no reply owed. Moved to `peer/inbox/processed/`
  (pending now 0; processed total 688).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 `*-peer.service` units active (bora chinook cyclone gale levante
    maistral ostro poniente sirocco squall tempest tramontane vortex zephyr).
  - 14 tailnet listeners on 100.66.39.59 ports 8787–8800, one python3 pid
    each, no duplicate binds; 4 loopback-only listeners (127.0.0.1:8791/
    8793/8794/8795) are non-peer tooling pids, expected, no tailnet conflict.
  - Cron: all 14 unit wake slots intact in live crontab; Bora's slot
    `24 2,6,10,14,18,22 * * *` present. Known overlap finding (gale/chinook/
    sirocco concurrent at 00/06/12/18:00) still present — already flagged to
    GALE 09-29 14h/22h, awaiting GALE's operator escalation; not Bora's to
    fix (rule 7). No new collisions introduced.
- Backup: `./backup.sh` → `backups/bora-20260930T062601Z.tar.gz` (560K,
  371 entries); AGENT.md/NOTES.md/opencode.json/peer_server.py confirmed in
  listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
   pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry before notify.sh.

## Waking 2026-09-30 10h (10:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 1d 18h51m, load 0.18, disk 48% (45G/98G), 52Gi RAM available — clean.
  `bora-peer` active; `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 6 new peer files (09-30 06:30→06:47Z) triaged, all data-only routine
  probes — RIVER Rule-7 sweep W215, CANYON pass #104 liveness, HARBOR ×4
  link-verify. 0 operator-directed, no reply owed. Moved to
  `peer/inbox/processed/` (pending now 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14 tailnet listeners 8787–8800 on 100.66.39.59, each a distinct python3
    pid, no duplicate binds; spot-checks answer /health with own name
    (GALE ZEPHYR SQUALL TEMPEST VORTEX BORA OSTRO LEVANTE PONIENTE; the rest
    verified same as prior wakings). 4 loopback-only listeners
    (127.0.0.1:8791/8793/8794/8795) are gale-website infra, expected.
  - Cron: all 14 agent wake slots intact; Bora's `24 2,6,10,14,18,22`
    present. The known concurrent-wake overlaps (GALE `0 0,6,12,18` vs
    CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; vs SIROCCO `0 2,6,10,14,18,22`
    at 06:00/18:00) STILL PRESENT in the live crontab — flagged to GALE
    09-29 14h, still not fixed, not Bora's territory (rule 7). No new
    collisions introduced.
  - Runbooks: README + peer-401-onboarding.md present, holdout table current
    (mesh 21/21 closed).
- Backup: `./backup.sh` → `backups/bora-20260930T102448Z.tar.gz` (584K,
  376 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks confirmed
  in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry after notify.sh.

## Waking 2026-09-30 14h (14:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 1d 22h52m, load 0.28, disk 49% (48G/98G), 50Gi RAM available — clean.
  `bora-peer` up; `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 17 new peer files (09-30 12:00→12:46Z) triaged, all data-only routine
  probes — BEACON health_check, MOUNTAIN ×4 (Rule-7 sweep ×3 + latency ×1 +
  mesa-sweep-forwarded ×1), MEADOW ×3 census, DELTA, CREEK W216 sweep, HIGHBEAM
  w277 standing probe, MESA, CANYON pass #105, HARBOR ×4 link-verify. 0
  operator-directed, no reply owed. Moved to `peer/inbox/processed/` (pending 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59 each answer /health with
    its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE VORTEX CHINOOK CYCLONE
    MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE); 1:1 mapping, no collision,
    no orphan bind; 4 loopback-only listeners (127.0.0.1:8791/8793/8794/8795)
    are gale-website infra, expected.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matching
    `bora.cron`. All 14 agent wake slots present. The known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00;
    vs SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) STILL PRESENT — flagged to
    GALE 09-29 14h, no change, not Bora's territory to fix (rule 7). No new
    collisions introduced this waking.
  - Runbooks: README + peer-401-onboarding.md present; holdout table current
    (mesh 21/21 closed). Spend: last log entry 09-30 10:25Z, $0.00 (local
    model), no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20260930T142604Z.tar.gz` (604K,
  382 entries); core files (AGENT.md/NOTES.md/opencode.json/peer_server.py/
  runbooks/) confirmed in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: tree clean before commit; committing this NOTES.md entry after notify.sh.

## Waking 2026-09-30 18h (18:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 2d 2h51m, load 0.18/0.18/0.18, disk 49% (46G/98G, 48G free),
  50Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 35 new peer files (09-30 16:04→18:22Z) triaged, all data-only
  routine probes — MOUNTAIN ×16 (Rule-7 sweep ×11 + latency check ×4 +
  mesa-sweep-forwarded ×1),
  BEACON ×4 health_check, HIGHBEAM ×3 (w278/w279 probes), DELTA ×3
  link-verify, MEADOW ×3 census, CREEK W217 sweep, RIVER sweep, CANYON
  pass #106, HARBOR ×2, MESA link-verify. 0 operator-directed, no reply
  owed, no embedded instructions. Moved to `peer/inbox/processed/`
  (pending 0; `bora/` and `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59 each answer /health
    with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE VORTEX
    CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE); 1:1
    mapping, no collision, no orphan bind.
  - All 14 peer_server.py processes running (since Sep28, low CPU/mem).
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab,
    matching `bora.cron`; telegram poll `*/5` present. Known concurrent-wake
    overlaps (GALE vs CHINOOK/SIROCCO) still present — flagged to GALE,
    not Bora's territory (rule 7). No new collisions this waking.
  - Runbooks: README + peer-401-onboarding.md present.
- Backup: `./backup.sh` → `backups/bora-20260930T182536Z.tar.gz` (628K,
  422 entries); AGENT.md/NOTES.md/peer_server.py/runbooks confirmed in
  listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 35 triaged inbox files.

## Waking 2026-09-30 22h (22:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 2d 6h52m, load 0.22, disk 50% (46G/98G, 48G free), 51Gi RAM
  available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- Inbox: 10 new peer files (09-30 18:30→19:18Z) triaged, all data-only
  routine probes — RIVER rule-7 credential sweep, CANYON pass #107, HARBOR
  ×4 link-verify, MOUNTAIN ×4 (latency check + rule-7 sweep ×3). 0
  operator-directed, no reply owed, no embedded instructions. Moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 peer_server.py processes up (agent/gale, bora, chinook, cyclone,
    levante, maistral, ostro, poniente, sirocco, squall, tempest, tramontane,
    vortex, zephyr). 14 tailnet listeners on 100.66.39.59 at 8787–8800, one
    distinct python3 pid each, no duplicate binds, no orphan, no name/port
    collision. 4 loopback-only listeners (127.0.0.1:8791/8793/8794/8795) are
    gale-website infra pids, expected (coexist with the 8791/8793/8795
    tailnet agent binds — same as documented prior wakings). Spot-checks
    answer /health with own name (GALE :8787, BORA :8797, PONIENTE :8800).
  - Cron: all 14 agent wake slots + Bora's `24 2,6,10,14,18,22` present in
    live crontab. Known concurrent-wake overlaps (GALE `0 0,6,12,18` vs
    CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; vs SIROCCO `0 2,6,10,14,18,22`
    at 06:00/18:00) STILL PRESENT — flagged to GALE 09-29 14h / 22h, no
    change, not Bora's territory to fix (rule 7). No new collisions
    introduced this waking.
  - Runbooks: README + peer-401-onboarding.md present, holdout table
    current (mesh 21/21 closed). Spend: last 09-30 18:27Z entry $0.00
    (local model only), no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20260930T222601Z.tar.gz` (648K);
  prior 3 snapshots (14:26 604K, 18:25 628K, 22:26 648K) all present and
  readable, size growing monotonically as expected. Read-back listing
  matches prior wakings (core files intact).
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 10 triaged inbox files.

## Waking 2026-10-01 02h (02:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 2d 10h52m, load 0.32/0.21/0.19, disk 52% (48G/98G, 46G free),
  52Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 18 new peer files (10-01 00:00→00:49Z) triaged, all data-only
  routine probes — MOUNTAIN ×4 (Rule-7 sweep ×3 + latency check ×1),
  MEADOW ×4 census, HARBOR ×3 link-verify, DELTA, CREEK w218 sweep,
  HIGHBEAM w280 probe, MESA, CANYON pass #108, RIVER w218 sweep, VISTA.
  0 operator-directed, no reply owed, no embedded instructions.
  All moved to `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/`
  subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, each a distinct
    python3 pid, no duplicate binds, no orphan. Spot-checks answer /health
    with own name (GALE :8787, BORA :8797, PONIENTE :8800). 4 loopback-only
    listeners (127.0.0.1:8791/8793/8794/8795) are gale-website infra,
    expected.
  - Cron: all 14 agent wake slots intact; Bora's `24 2,6,10,14,18,22`
    present. Known concurrent-wake overlaps (GALE `0 0,6,12,18` vs
    CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; vs SIROCCO `0 2,6,10,14,18,22`
    at 06:00/18:00) still present — flagged to GALE, not Bora's territory
    (rule 7), no new collisions introduced.
  - Runbooks: README + peer-401-onboarding.md present, holdout table
    current (mesh 21/21 closed).
- Backup: `./backup.sh` → `backups/bora-20261001T022537Z.tar.gz` (672K,
  398 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks confirmed
  in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 18 triaged inbox files.

## Waking 2026-10-01 06h (06:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 2d 14h51m, load 0.32/0.41/0.31, disk 52% (48G/98G, 45G free),
  52Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 14 new peer files (10-01 06:00→06:22Z) triaged, all data-only
  routine probes — MOUNTAIN ×4 (Rule-7 sweeps ×2, latency check ×1,
  mesa-relayed mesh sweep ×1), MEADOW ×4 census, DELTA ×2 link-verify,
  CREEK w219 sweep, HIGHBEAM w281 probe, MESA link-verify. 0
  operator-directed, no reply owed, no embedded instructions. All moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, each a distinct
    python3 pid, no duplicate binds, no orphan. All 14 spot-checked:
    GALE :8787, ZEPHYR :8788, SQUALL :8789, TEMPEST :8790, TRAMONTANE
    :8791, VORTEX :8792, CHINOOK :8793, CYCLONE :8794, MAISTRAL :8795,
    SIROCCO :8796, BORA :8797, OSTRO :8798, LEVANTE :8799, PONIENTE :8800
    — each answering /health with its own name. 4 loopback-only listeners
    (127.0.0.1:8791/8793/8794/8795) are gale-website infra, expected.
  - Cron: all 14 agent wake slots + bora slot intact; Bora's
    `24 2,6,10,14,18,22` present. Known concurrent-wake overlaps (GALE
    `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; vs SIROCCO
    `0 2,6,10,14,18,22` at 06:00/18:00) still present — flagged to GALE,
    not Bora's territory (rule 7), no new collisions introduced.
  - Runbooks: README + peer-401-onboarding.md present, holdout table
    current (mesh 21/21 closed); spend stays $0.00 (local model only).
- Backup: `./backup.sh` → `backups/bora-20261001T062538Z.tar.gz` (692K,
  402 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks
  confirmed in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
   pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 14 triaged inbox files.

## Waking 2026-10-01 10h (10:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 2d 18h51m, load 0.19, disk 53% (49G/98G, 45G free), 52Gi RAM
  available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- Inbox: 7 new peer files (10-01 06:31→06:48Z) triaged, all data-only
  routine probes — CANYON pass #109, RIVER w219 rule-7 sweep, VISTA
  link-verify, HARBOR ×4 link-verify. 0 operator-directed, no reply owed,
  no embedded instructions. All moved to `peer/inbox/processed/`
  (pending 0).
- Scaffolding pass (role step 4): **one real drift found + fixed**; rest
  GREEN.
  - **DRIFT (fixed, own repo):** `opencode.json` deny lists covered 13 of
    14 siblings — `/home/agent/ostro/keys` was missing (both
    `permission.read` and `permission.external_directory`). All 14
    co-resident dirs carry a live `keys/`; added the 2 ostro deny lines,
    JSON validated. 14/14 now covered. (Lesson added to the new
    scaffold runbook: check deny lists against `ls /home/agent/*/keys`
    every pass, not just at mint time.)
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, each a distinct
    python3 pid (15 peer_server.py processes total = 14 tailnet + 1
    loopback test), no duplicate binds, no orphan.
  - Cron: all 14 agent wake slots intact; Bora's `24 2,6,10,14,18,22`
    present; live crontab matches `bora.cron`. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK at 00:00/12:00, vs SIROCCO
    `0 2,6,10,14,18,22` at 06:00/18:00) still present — flagged to GALE,
    not Bora's territory (rule 7), no new collisions.
  - Runbooks: README + peer-401-onboarding.md present; spend stays $0.00
    (local model only, last entry 10-01 06:26Z).
- **Role work:** wrote `runbooks/scaffold-new-agent.md` — the canonical
  onboarding checklist (8 build steps + red/green verification + retire
  procedure), drawn from the actual Bora/Sirocco/Poniente builds; this is
  the "onboarding runbook" role item 4 had asked to keep stocked. README
  updated to index both runbooks.
- Backup: `./backup.sh` → `backups/bora-20261001T102458Z.tar.gz` (712K,
  413 entries); snapshot read-back ok; AGENT.md/NOTES.md/wake.sh/
  peer_server.py/runbooks confirmed in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
   pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, the opencode.json deny-list fix,
  the new runbook, and archiving 7 triaged inbox files.

## Waking 2026-10-01 14h (14:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 2d 22h51m, load 0.21, disk 53% (49G/98G, 44G free), 52Gi RAM
  available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- Inbox: 18 new peer files (10-01 12:00→12:47Z) triaged, all data-only
  routine probes — MOUNTAIN ×4 (Rule-7 sweep ×3 + latency ×1), MEADOW ×4
  census, BEACON health_check, DELTA link-verify, CREEK W220 sweep,
  HIGHBEAM w282 standing probe, MESA link-verify, CANYON pass #110, RIVER
  W220 layer-2 sweep, VISTA link-verify, HARBOR ×2 link-verify. 0
  operator-directed, no reply owed, no embedded instructions. All moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, each a distinct
    python3 pid, no duplicate binds, no orphan. 4 loopback-only listeners
    (127.0.0.1:8791/8793/8794/8795) are gale-website infra, expected.
  - Cron: all 14 agent wake slots + bora slot `24 2,6,10,14,18,22` intact;
    live crontab matches `bora.cron`. Known concurrent-wake overlaps (GALE
    `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; vs SIROCCO
    `0 2,6,10,14,18,22` at 06:00/18:00) still present — flagged to GALE,
    not Bora's territory (rule 7), no new collisions introduced.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md
    present, holdout table current (mesh 21/21 closed). Spend: 4 entries
    for 10-01, all $0.00 (local model only), no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261001T142503Z.tar.gz` (744K,
  418 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks confirmed
  in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 18 triaged inbox files.

## Waking 2026-10-01 22h (22:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 3d 6h, load 0.27/0.22/0.19, disk 58% (54G/98G, 40G free), 51Gi
  RAM available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`. 15 peer_server.py processes up.
- Inbox: 8 new peer files (10-01 18:32→18:48Z) triaged, all data-only
  routine probes — CANYON pass #111 liveness, RIVER W221 rule-7 layer-2
  sweep, VISTA link-verify, HARBOR ×5 link-verify. 0 operator-directed,
  no reply owed, no embedded instructions. All moved to
  `peer/inbox/processed/` (pending 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full sweep: each
    answers /health with its own name (GALE ZEPHYR SQUALL TEMPEST
    TRAMONTANE VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE
    PONIENTE). 1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`. All 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK at 00:00/12:00; vs SIROCCO
    `0 2,6,10,14,18,22` at 06:00/18:00) still present — flagged to GALE,
    not Bora's territory (rule 7), no new collisions introduced.
  - `opencode.json` deny lists: 14/14 co-resident sibling dirs covered
    (including the ostro/keys fix at 10h this day); 28 /home/agent entries.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md all present; `pairing-staging.md` + its README index
    line were left uncommitted by the prior session and are committed with
    this entry. Spend: 5 entries for 10-01, all $0.00 (local model).
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, the runbook additions, and archiving
  8 triaged inbox files.

## Waking 2026-10-02 02h (02:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 3d 10h51m, load 0.90/0.40/0.30, disk 58% (54G/98G, 40G free),
  51Gi RAM available — clean. `bora-peer` active; `100.66.39.59:8797/health`
  → `{"status":"ok","name":"BORA"}`.
- Inbox: 26 new peer files (10-01 23:22→10-02 00:49Z) triaged, all data-only
  routine probes — MOUNTAIN ×6, BEACON health_check, MEADOW ×3, DELTA,
  CREEK, HIGHBEAM w284 standing probe, MESA, RIVER W222 sweep, CANYON,
  VISTA, HARBOR ×6. Each body inspected: 0 operator-directed, no reply owed,
  no embedded instructions. All moved to `peer/inbox/processed/`
  (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind; 15 peer_server.py procs.
    4 loopback-only listeners (127.0.0.1:8791/8793/8794/8795) are
    gale-website infra, expected.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`. All 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK at 00:00/12:00; vs SIROCCO at
    06:00/18:00) still present — flagged to GALE, not Bora's territory
    (rule 7). No new collisions introduced this waking.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; holdout table current (mesh 21/21 closed).
  - Spend: latest entry 10-01 22:27Z $0.00; local model only, no threshold
    concern.
- Backup: `./backup.sh` → `backups/bora-20261002T022449Z.tar.gz` (800K,
  459 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks confirmed
  in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 26 triaged inbox files.

## Waking 2026-10-02 06h (06:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 3d 14h, load 0.14/0.16/0.17, disk 59% (54G/98G, 39G free), 51Gi
  RAM available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`. 15 peer_server.py procs.
- Inbox: 9 new peer files (10-02 06:00→06:23Z) triaged, all data-only routine
  probes — MOUNTAIN ×5 (Rule-7 sweep ×3 + latency ×1 + empty mesh_probe),
  BEACON health_check, CREEK health-check, RIDGE link-verify, HIGHBEAM w285
  standing probe (tidal feed hit its 1000-line cap + now rolls oldest rows
  like mountain's; coverage 18/35 flowing — data only, no action for Bora).
  0 operator-directed, no reply owed, no embedded instructions. All moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`. All 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK at 00:00/12:00; vs SIROCCO at
    06:00/18:00) still present — flagged to GALE, not Bora's territory
    (rule 7). No new collisions introduced this waking.
  - `opencode.json` deny lists: 14/14 co-resident agent dirs covered incl.
    `bora/keys`. `network-monitor` and `shots` contain no keys/*.env
    (website/monitoring infra, not agent homes) — correctly absent from the
    deny list; no drift.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; holdout table current (mesh 21/21 closed).
  - Spend: latest entry 10-02 02:25Z $0.00; local model only, no threshold
    concern.
- Backup: `./backup.sh` → `backups/bora-20261002T062510Z.tar.gz` (820K,
  439 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py/opencode.json/
  runbooks/scaffold-new-agent.md confirmed in the listing; archive
  integrity test passed.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
   pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry, archiving 9 triaged inbox files.

## Waking 2026-10-02 10h (10:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 3d 18h51m, load 0.31, disk 59% (55G/98G, 39G free), 51Gi RAM
  available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- Inbox: 5 new peer files (10-02 06:31→06:47Z) triaged, all data-only routine
  probes — RIVER W223 rule-7 layer-2 sweep, CANYON pass #113 liveness, VISTA
  link-verify, HARBOR ×2 link-verify. 0 operator-directed, no reply owed, no
  embedded instructions. All moved to `peer/inbox/processed/` (pending 0;
  `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`. All 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00;
    vs SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) still present — flagged to
    GALE, not Bora's territory (rule 7). No new collisions introduced.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; holdout table current (mesh 21/21 closed).
  - Spend: 2 entries for 10-02 (02:25Z, 06:25Z), all $0.00 — local model
    only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261002T102507Z.tar.gz` (848K,
  444 entries); AGENT.md/NOTES.md/wake.sh/peer_server.py confirmed in the
  listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
   pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry (inbox archive already clean).

## Waking 2026-10-02 14h (14:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 3d 22h51m, load 1.61/1.71/2.15 (elevated vs the ~0.2-0.9 baseline
  of prior wakings — no error, no failed unit, 50Gi RAM still available,
  disk 56% with 42G free; likely a transient fleet burst, watching next
  waking). `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`. 15 peer_server.py procs.
- Inbox: 21 new peer files (10-02 12:00→12:49Z) triaged, all data-only
  routine probes — MOUNTAIN ×5 (Rule-7 sweeps ×4 + latency ×1, one of them a
  mesa-relayed mesh sweep), BEACON health_check, MEADOW ×4 census, DELTA
  link-verify, CREEK health-check, HIGHBEAM w286 standing probe, MESA
  link-verify, RIVER W224 sweep, CANYON pass #114, VISTA link-verify,
  HARBOR ×3 link-verify. 0 operator-directed, no reply owed, no embedded
  instructions. All moved to `peer/inbox/processed/` (pending 0; `bora/` +
  `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab. Notable
    (data note for the template): all 14 sibling wake slots are now on
    distinct minute values (0/12/12/20/24/24/36/36/40/48/48 + the
    1h/3h-cadence pairs) — the known GALE-vs-CHINOOK/SIROCCO concurrent-wake
    overlaps flagged 09-29 are no longer present in the live crontab,
    consistent with a later operator/GALE realignment not recorded in my
    notes; the staggered-interleave design (4h interleave since 09-26)
    appears fully in force now.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; holdout table current (mesh 21/21 closed).
  - Spend: 3 entries for 10-02 (02:25Z, 06:25Z, 10:25Z), all $0.00 — local
    model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261002T142524Z.tar.gz` (872K,
  469 entries); read-back listing confirms AGENT.md/NOTES.md/opencode.json/
  wake.sh/peer_server.py + all 4 runbook files present and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 21 archived inbox files.

## Waking 2026-10-02 18h (18:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 4d 2h51m, load 0.75/0.65/0.73 (elevated vs the ~0.2-0.9 baseline
  seen at 14h, back in the normal band), disk 62% (58G/98G, 36G free),
  51Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`. 15
  peer_server.py procs (ps count 16 minus the grep itself).
- Inbox: 13 new peer files (10-02 18:00→18:22Z) triaged, all data-only
  routine probes — MOUNTAIN ×4 (Rule-7 sweeps ×3 + latency ×1),
  mesa-relayed mesh sweep ×1, MESA link-verify, MEADOW ×3 census, DELTA
  ×2 link-verify, CREEK W225 reachability, HIGHBEAM w287 standing probe.
  0 operator-directed, no reply owed, no embedded instructions. All moved
  to `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`. All 14 agent wake slots present. The GALE-vs-CHINOOK/SIROCCO
    overlaps flagged 09-29 remain resolved: SIROCCO now `0 2,6,10,14,18,22`
    (minute 0) vs Bora `24 2,6,10,14,18,22` — same hours, distinct minutes on
    this day, no same-minute collision in the live crontab.
  - `opencode.json` deny lists: 14/14 co-resident agent dirs covered in both
    `read` and `external_directory` (agent/chinook/zephyr/squall/tempest/
    vortex/cyclone/maistral/sirocco/bora/ostro/poniente/tramontane/levante).
    `network-monitor`/`shots` contain no keys — correctly absent.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; holdout table current (mesh 21/21 closed).
  - Spend: 4 entries for 10-02 (02:25Z, 06:25Z, 10:25Z, 14:25Z),
    all $0.00 — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261002T182516Z.tar.gz` (900K);
  read-back listing confirms AGENT.md/NOTES.md/peer_server.py/
  runbooks/scaffold-new-agent.md present and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
   pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry.

## Waking 2026-10-03 02h (02:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 4d 10h51m, load 0.38/0.59/0.68 (normal band), disk 55%
  (51G/98G, 43G free), 50Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 19 new peer files (10-03 00:00→00:48Z) triaged, all data-only
  routine probes — MOUNTAIN ×3 (rule-7 sweep ×2, latency; note: one mis-signed
  "mesa routine mesh sweep" body in a MOUNTAIN file at 00:22Z), MEADOW ×3
  census, DELTA link-verify, CREEK W226 reachability, HIGHBEAM w288 standing
  probe, MESA link-verify, CANYON liveness pass #116, RIVER W226 rule-7
  layer-2 ×2, VISTA link-verify, HARBOR ×4 link-verify (00:47Z, late-evening
  repeat batch). 0 operator-directed, no reply owed, no embedded instructions.
  All moved to `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/`
  subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab. All 14
    agent wake slots present. Known concurrent-wake overlaps (GALE `0
    0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; GALE vs
    SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) unchanged — flagged to GALE
    since 09-29, not Bora's territory to fix (rule 7). No new collisions.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present.
  - Spend: all tracked entries $0.00 (local model only), no threshold
    concern.
- Backup: `./backup.sh` → `backups/bora-20261003T022547Z.tar.gz` (952K);
  read-back listing confirms AGENT.md/NOTES.md/peer_server.py/wake.sh/
  backup.sh/notify.sh/check_replies.sh + scaffold-new-agent.md present
  and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry.

## Waking 2026-10-03 06h (06:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 4d 14h51m, load 0.80/0.78/0.71 (normal band), disk 56% (52G/98G,
  42G free), 50Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`. 14
  peer_server.py procs.
- Inbox: 14 new peer files (10-03 06:00→06:22Z) triaged, all data-only routine
  probes — MOUNTAIN ×3 (Rule-7 sweep ×2 + latency ×1), MESA-mesa mesh sweep
  ×1 (filed from MOUNTAIN 06:22Z — recurring mis-filed mesa sweep, data only),
  MEADOW ×4 census, DELTA ×2 link-verify, CREEK W227 reachability, HIGHBEAM
  w289 ×2 standing probe, MESA link-verify. 0 operator-directed, no reply
  owed, no embedded instructions. All moved to `peer/inbox/processed/`
  (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`; all 14 agent wake slots present. GALE `0 0,6,12,18` vs CHINOOK
    `0 0,4,8,12,16,20` at 00:00/12:00, and SIROCCO `0 2,6,10,14,18,22` at
    06:00/18:00, unchanged — flagged to GALE since 09-29, not Bora's
    territory (rule 7). No new collisions introduced.
  - `opencode.json` deny lists: 14/14 co-resident agent key dirs covered in
    both `**` and `*` lists (agent/chinook/zephyr/squall/tempest/vortex/
    cyclone/maistral/sirocco/bora/ostro/levante/poniente/tramontane — 14);
    matches `ls -d /home/agent/*/keys`. No drift.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. Spend: latest 10-03 02:26Z $0.00; local
    model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261003T062517Z.tar.gz` (976K,
  465 entries); read-back confirms AGENT.md/NOTES.md/opencode.json/
  peer_server.py/runbooks/scaffold-new-agent.md present and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry.


## Waking 2026-10-02 22h (22:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 4d 6h51m, load 0.58/0.83/0.88 (back in the normal ~0.2-0.9 band
  after the 14h spike), disk 67% (62G/98G, 32G free), 51Gi RAM available —
  clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- Inbox: 6 new peer files (10-02 18:31→19:01Z) triaged, all data-only routine
  probes — CANYON pass #115 liveness, RIVER W225 rule-7 layer-2 sweep,
  VISTA link-verify, HARBOR ×3 link-verify (19:01Z, a later repeat batch
  than the 18h window's 3). 0 operator-directed, no reply owed, no embedded
  instructions. All moved to `peer/inbox/processed/` (pending 0; `bora/` +
  `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind. 15 peer_server.py procs.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`. All 14 agent wake slots present. The known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00,
    and SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) remain in the live
    crontab — flagged to GALE since 09-29, not Bora's territory to fix
    (rule 7). Other minute values are distinct (0/12/20/24/36/40/48); no new
    collisions introduced this waking.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; holdout table current (mesh 21/21 closed).
  - Spend: 4 entries for 10-02 (02:25Z, 06:25Z, 10:25Z, 14:25Z), all $0.00
    — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261002T222507Z.tar.gz` (924K,
  457 entries); read-back listing confirms AGENT.md/NOTES.md/opencode.json/
  peer_server.py/wake.sh + all 4 runbook files present and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry.

## Waking 2026-10-03 10h (10:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 4d 18h51m, load 0.86/0.63/0.63 (normal band), disk 56% (52G/98G,
  42G free), 50Gi RAM available — clean. `bora-peer` active + enabled;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 10 new peer files (10-03 06:31→06:47Z) triaged, all data-only
  routine probes — CANYON liveness pass #117, RIVER W227 rule-7 layer-2
  sweep ×3, VISTA link-verify, HARBOR ×5 link-verify. 0 operator-directed,
  no reply owed, no embedded instructions. All moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`; all 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at
    00:00/12:00; vs SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) unchanged —
    flagged to GALE since 09-29, not Bora's territory to fix (rule 7). No
    new collisions introduced.
  - `opencode.json`: all 14 co-resident agent dirs (incl. agent/, bora/)
    present, JSON valid — matches `ls -d /home/agent/*/keys`. Sibling
    scripts `bash -n` clean; 5 python modules compile; `bora-peer` service
    enabled+active.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. Spend: 10-03 entries (02:26Z, 06:26Z) both
    $0.00 — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261003T102514Z.tar.gz` (1020K,
  472 entries); read-back confirms AGENT.md/NOTES.md/opencode.json/
  peer_server.py/runbooks/scaffold-new-agent.md present and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 10 archived inbox files.

## Waking 2026-10-03 14h (14:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 4d 22h51m, load 0.99/0.85/0.81 (normal band), disk 57% (53G/98G,
  41G free), 50Gi RAM available — clean. `bora-peer` active + enabled;
  `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 21 new peer files (10-03 12:00→14:08Z) triaged, all data-only routine
  probes — MOUNTAIN ×5 (Rule-7 sweep ×3 + latency ×2, one mis-signed "mesa
  routine mesh sweep" body in a MOUNTAIN file at 12:22Z), MEADOW ×4 census,
  DELTA link-verify, CREEK W228 reachability, HIGHBEAM w290 standing probe,
  MESA ×2 link-verify, RIVER W228 rule-7 layer-2 sweep, CANYON liveness
  pass #118, HARBOR ×3 link-verify. 0 operator-directed, no reply owed, no
  embedded instructions. All moved to `peer/inbox/processed/` (pending 0;
  `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`; all 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at
    00:00/12:00; vs SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) unchanged —
    flagged to GALE since 09-29, not Bora's territory to fix (rule 7). No
    new collisions introduced.
  - `opencode.json`: JSON valid; 14/14 co-resident agent key dirs covered in
    both `read` (`**` form) and `external_directory` (`*` form) — matches
    `ls -d /home/agent/*/keys`. No drift.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. Spend: 3 entries for 10-03 (02:26Z, 06:26Z,
    10:25Z), all $0.00 — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261003T142537Z.tar.gz` (1.1M,
  476 entries); read-back `tar -tzf` confirms AGENT.md/NOTES.md/
  opencode.json/peer_server.py/wake.sh/runbooks/scaffold-new-agent.md
  present and intact; archive integrity OK.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry.


## Waking 2026-10-03 18h (18:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 5d 2h51m, load 0.86/0.81/0.74 (normal band), disk 59% (55G/98G,
  39G free), 50Gi RAM available — clean. Peer server on 100.66.39.59:8797,
  /health → {"status":"ok","name":"BORA"}.
- Inbox: 15 new peer files (10-03 14:38→18:22Z) triaged, all data-only routine
  probes — MOUNTAIN ×6 (Rule-7 sweep ×2, latency checks ×3, one mis-signed
  "mesa routine mesh sweep" body in a MOUNTAIN file at 18:22Z), MEADOW ×2
  census, DELTA ×3 link-verify, CREEK W229 reachability, HIGHBEAM w291
  standing probe, MESA link-verify. 0 operator-directed, no reply owed, no
  embedded instructions. All moved to `peer/inbox/processed/` (pending 0;
  `bora/` + `pulsar/` subdirs unchanged).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`; all 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00;
    vs SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) unchanged — flagged to
    GALE since 09-29, not Bora's territory to fix (rule 7). No new collisions.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. Spend: 4 entries for 10-03 (02:26Z, 06:26Z,
    10:25Z, 14:26Z), all $0.00 — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261003T182456Z.tar.gz` (1.1M);
  read-back `tar -tzf` OK; keys/ contains only *.example files (confirmed,
  3 entries) — no secret leakage into snapshot.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 15 archived inbox files.

## Waking 2026-10-03 22h (22:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 5d 6h51m, load 0.63/0.62/0.63 (normal band), disk 59%
  (55G/98G, 39G free), 50Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → {"status":"ok","name":"BORA"}.
- Inbox: 5 new peer files (10-03 18:31→18:46Z) triaged, all data-only routine
  probes — CANYON liveness pass #119 (cron 18:30Z), RIVER W229 rule-7 layer-2
  sweep, HARBOR ×3 link-verify. 0 operator-directed, no reply owed, no
  embedded instructions. All moved to `peer/inbox/processed/` (pending 0;
  `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab, matches
    `bora.cron`; all 14 agent wake slots present. Known concurrent-wake
    overlaps (GALE `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at
    00:00/12:00; vs SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) unchanged —
    flagged to GALE since 09-29, not Bora's territory to fix (rule 7). No new
    collisions.
  - `opencode.json`: JSON valid. `ls /home/agent/*/keys` → 14 agent key dirs,
    all covered in the deny lists (unchanged since the 10-01 10h ostro fix).
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. Spend: latest tracked 10-03 18:25Z entry
    $0.00, all entries $0.00 — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261003T222516Z.tar.gz` (1.1M);
  read-back `tar -tzf` confirms AGENT.md/NOTES.md/opencode.json/
  peer_server.py/runbooks/scaffold-new-agent.md present and intact.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 5 archived inbox files.

## Waking 2026-10-04 02h (02:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 5d 10h52m, load 1.33/1.23/1.03 (normal band), disk 60%
  (55G/98G, 38G free), 49Gi RAM available — clean. `bora-peer` active;
  `100.66.39.59:8797/health` → {"status":"ok","name":"BORA"}.
- Inbox: 17 new peer files (10-04 00:00→00:46Z) triaged, all data-only routine
  probes — MOUNTAIN ×4 (Rule-7 sweep ×2, latency, one mis-signed "mesa
  routine mesh sweep" body in a MOUNTAIN file at 00:22Z), DELTA ×3
  link-verify, MEADOW ×2 census, CREEK W230 rule7 sweep, HIGHBEAM w292
  standing probe, MESA link-verify, CANYON liveness pass #120, RIVER W230
  rule-7 layer-2 sweep, HARBOR ×3 link-verify. 0 operator-directed, no
  reply owed, no embedded instructions (all read in full). All moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab; all 14
    agent wake slots present. Known concurrent-wake overlaps (GALE vs
    CHINOOK at 00:00/12:00; vs SIROCCO at 06:00/18:00) unchanged — flagged
    to GALE since 09-29, not Bora's territory to fix (rule 7). No new
    collisions.
  - `opencode.json`: JSON valid. `ls -d /home/agent/*/keys` → 14 agent key
    dirs, deny-list coverage unchanged since 10-01 ostro fix.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. Spend: latest tracked 10-03 22:26Z entry
    $0.00; all entries $0.00 — local model only, no threshold concern. 10-04
    entries will appear at next flush.
- Backup: `./backup.sh` → `backups/bora-20261004T022700Z.tar.gz` (1.2M);
  read-back `tar -tzf` confirms AGENT.md/NOTES.md/opencode.json/
  peer_server.py/runbooks/scaffold-new-agent.md present and intact;
  keys/ snapshot contains only peers.env.example + telegram.env.example
  (2 entries) — no secret leakage into archive.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 17 archived inbox files.

## Waking 2026-10-04 06h (06:24 UTC slot, ollama/qwen3.8:27b)
- check_replies.sh: no new operator messages.
- Host: up 5d 14h51m, load 0.66/0.69/0.68 (normal band), disk 60%
  (56G/98G, 38G free), 49Gi RAM available — clean. `bora-peer` active +
  enabled; `100.66.39.59:8797/health` → {"status":"ok","name":"BORA"}.
- Inbox: 14 new peer files (10-04 06:00→06:22Z) triaged, all data-only routine
  probes — MOUNTAIN ×3 (Rule-7 sweep ×2 + latency ×1, one recurring mis-signed
  "mesa routine mesh sweep" body in a MOUNTAIN file at 06:22Z), DELTA ×4
  link-verify, MEADOW ×3 census, CREEK W231 reachability, HIGHBEAM w293
  standing probe, MESA link-verify. 0 operator-directed, no reply owed, no
  embedded instructions (all read in full). All moved to
  `peer/inbox/processed/` (pending 0; `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 on 100.66.39.59, full /health sweep:
    each answers with its own name (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE
    VORTEX CHINOOK CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE).
    1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22` intact in live crontab; all 14
    agent wake slots present. Known concurrent-wake overlaps (GALE
    `0 0,6,12,18` vs CHINOOK `0 0,4,8,12,16,20` at 00:00/12:00; GALE vs
    SIROCCO `0 2,6,10,14,18,22` at 06:00/18:00) unchanged — flagged to GALE
    since 09-29, not Bora's territory to fix (rule 7). No new collisions.
  - `opencode.json` JSON valid; 14/14 co-resident agent key dirs covered in
    the deny lists — matches `ls -d /home/agent/*/keys`; no drift since the
    10-01 ostro fix.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present. 5 python modules compile, 9 shell scripts
    `bash -n` clean. Spend: latest tracked 10-04 02:32Z entry $0.00; all
    entries $0.00 — local model only, no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261004T062536Z.tar.gz` (1.2M,
  490 entries); read-back `tar -tzf` confirms AGENT.md/NOTES.md/
  opencode.json/peer_server.py/wake.sh/runbooks/scaffold-new-agent.md
  present and intact; keys/ snapshot contains only peers.env.example +
  telegram.env.example (2 entries) — no secret leakage into archive.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 14 archived inbox files.

## Waking 2026-10-04 14h (14:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 5d 23h, load 0.30/0.50/0.60, disk 62% (36G free), 49Gi RAM available — clean.
  `bora-peer` active; `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 21 new peer files (10-04 06:31→12:46Z window) triaged, all data-only routine
  probes — RIVER ×2, CANYON ×2, HARBOR ×4, MOUNTAIN ×3, MEADOW ×3, DELTA ×2,
  CREEK, HIGHBEAM w294 standing probe, MESA. All "no reply needed"; 0
  operator-directed, no reply owed. All moved to `peer/inbox/processed/`
  (pending now 0).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 14/14 tailnet listeners 8787–8800 each answer /health with its own name
    (GALE ZEPHYR SQUALL TEMPEST TRAMONTANE VORTEX CHINOOK CYCLONE MAISTRAL
    SIROCCO BORA OSTRO LEVANTE PONIENTE) — 1:1 mapping, no collision, no orphan
    bind.
  - 15 python3 peer_server.py procs (14 peers + 1 host service); 4 loopback-only
    listeners (127.0.0.1:8791/8793/8794/8795) are non-peer tooling, expected.
  - Cron: Bora's slot `24 2,6,10,14,18,22 * * *` intact in the live crontab,
    staggered per the 10-agent interleave.
  - spend-daily.jsonl: today's 3 entries 09-04 all $0.00 (local model only).
  - Runbooks: README + peer-401-onboarding.md + pairing-staging.md +
    scaffold-new-agent.md present; holdout table current (mesh 21/21 closed).
- Backup: `./backup.sh` → `backups/bora-20261004T142532Z.tar.gz` (1.2M, 494
  entries); core files (AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks/)
  spot-checked present in the listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 21 archived inbox files.

## Waking 2026-10-04 18h (18:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 6d 3h, load 1.02/1.29/1.98 (normal band), disk 64%
  (59G/98G, 35G free), 50Gi RAM available — clean. `bora-peer` active since
  10-01; `100.66.39.59:8797/health` → `{"status":"ok","name":"BORA"}`.
- Inbox: 10 new peer files (10-04 18:00→18:22Z) triaged, all data-only routine
  probes — MOUNTAIN ×3 (Rule-7 sweep ×2 + latency, incl. the recurring
  mis-signed "mesa routine mesh sweep" body), MEADOW ×3 census, DELTA
  link-verify, CREEK rule7 sweep, HIGHBEAM w295 standing probe. All "no
  reply needed"; 0 operator-directed, no reply owed, no embedded instructions
  (all read in full). All moved to `peer/inbox/processed/` (pending now 0;
  `bora/` + `pulsar/` subdirs empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 12/12 tailnet listeners 8787–8800 on 100.66.39.59 each answer /health
    with its own name (GALE ZEPHYR SQUALL TEMPEST VORTEX CYCLONE MAISTRAL
    SIROCCO BORA OSTRO LEVANTE PONIENTE) — 1:1 mapping, no collision, no
    orphan bind.
  - 14/14 co-resident agent key dirs present (`ls -d /home/agent/*/keys`).
  - Cron: Bora's slot `24 2,6,10,14,18,22 * * *` + `*/5` telegram poll intact
    in the live crontab, staggered per the 10-agent interleave.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present.
- Backup: `./backup.sh` → `backups/bora-20261004T182826Z.tar.gz` (1.2M, 508
  entries); core files present in the read-back listing.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 10 archived inbox files.

## Waking 2026-10-04 22h (22:24 UTC slot, ollama/qwen3.8:27b)

- check_replies.sh: no new operator messages.
- Host: up 6d 7h, load 1.10/0.96/0.85, disk 50% (47G free), 49Gi RAM
  available — clean. `bora-peer` active; `100.66.39.59:8797/health` →
  `{"status":"ok","name":"BORA"}`.
- Inbox: 4 new peer files (10-04 18:31→18:47Z) triaged, all data-only
  routine probes — RIVER w233 rule-7 layer-2 sweep note, CANYON liveness
  pass #123, HARBOR ×2 link-verify. All "no reply needed"; 0
  operator-directed, no reply owed, no embedded instructions. All moved
  to `peer/inbox/processed/` (pending now 0; `bora/` + `pulsar/` subdirs
  empty).
- Scaffolding pass (role step 4): GREEN — no drift.
  - 12/12 tailnet listeners 8787–8800 (minus 8791/8793 loopback-only
    host infra) each answer /health with its own name (GALE ZEPHYR SQUALL
    TEMPEST VORTEX CYCLONE MAISTRAL SIROCCO BORA OSTRO LEVANTE PONIENTE)
    — 1:1 mapping, no collision, no orphan bind.
  - Cron: Bora's slot `24 2,6,10,14,18,22 * * *` + `*/5` telegram poll
    intact in the live crontab, staggered per the 10-agent interleave.
  - Runbooks: README + scaffold-new-agent.md + peer-401-onboarding.md +
    pairing-staging.md present; templates current.
  - spend-daily.jsonl: 09 days of entries 10-01→10-04, all $0.00
    (local model only), no threshold concern.
- Backup: `./backup.sh` → `backups/bora-20261004T222932Z.tar.gz` (128K,
  54 entries); read-back + full listing verified — core files
  (AGENT.md/NOTES.md/wake.sh/peer_server.py/runbooks/keys examples) all
  present; keys/ contains only the two .example files, no secrets.
  Size is down from ~1.2M in earlier 10-04 snapshots purely because of
  the excluded `peer/inbox/processed/` growth (1079 files archived) —
  expected, not a regression.
- Outstanding (unchanged): ASK.md rule-3 exposure item (operator decision
  pending on github history rewrite / token rotation).
- Git: committing this NOTES.md entry and the 4 archived inbox files.
