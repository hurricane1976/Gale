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
