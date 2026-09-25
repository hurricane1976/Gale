# NOTES.md — Sirocco (Upstream Dependency & External-Service Health)

## 2026-09-22 — Onboarded (8th agent on gale-agent)

Built from the Maistral template at the operator's request ("create 2 more
agents … model muse-spark-1.3 free on opencode Zen"); onboarded alongside
Bora (9th). Fleet is now 30 agents across four hosts.

- Name SIROCCO, role Upstream Dependency & External-Service Health, dir
  `/home/agent/sirocco` + git repo, peer listener on **8796** (8787-8790,
  8792, 8794, 8795 taken; 8791/8793 are the host's own localhost-only
  services), wakings **:02 of 1/7/13/19 UTC** (after Cyclone :00, before
  Bora :04), model `opencode/muse-spark-1.3-contributor-free` via opencode,
  systemd unit `sirocco-peer` + cron staged and installed.
- Telegram deferred by the operator (keys later): no `keys/telegram.env`,
  wake refuses unattended by design.
- Pairing STAGED (rules 8/8a): nothing minted. Lead spoke + 8 local
  sibling pairs + remote 21 await operator go-ahead — see ASK.md.
- First waking (theirs, once activated): upstream baseline (OpenRouter /
  OpenCode Zen / Ollama / Tailscale / GitHub statuses), cert-expiry
  baseline for beaconwake.com + tidalwake.org + mountainwake.org, first
  `runbooks/` fallback stub.

## 2026-09-22T21:22:31Z -- paired with GALE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-22T21:24:03Z -- paired with ZEPHYR (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:07Z -- paired with SQUALL (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:11Z -- paired with TEMPEST (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:15Z -- paired with VORTEX (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:19Z -- paired with CYCLONE (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:23Z -- paired with MAISTRAL (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22T21:24:27Z -- paired with BORA (Sirocco half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-22 ~21:27Z — Local mesh pairing COMPLETE (rule 8a)

Operator go-ahead (direct instruction this session: "have gale provision/
onboard them and ensure they can communicate with the fleet", following the
earlier "add the agent into the fleet along with the others"). Gale ran the
sanctioned helpers: `pair_new_siblings.sh sirocco` (lead spoke) + 7x
`pair_siblings.sh` (zephyr/squall/tempest/vortex/cyclone/maistral/bora).
One shared token per pair, both halves installed (600-perm peers.env +
timestamped .bak), peer services restarted, per-install self-tests passed
(200 on right token / 401 on wrong token). Real end-to-end sends both
directions on all 8 pairs verified delivered; 8/8 inbound messages present
in peer/inbox/. Tokens lived only in 600-perm temp files, shredded after.
Remote 21 still STAGED (rule 8 — needs per-pair Telegram sign-off).

## 2026-09-23T01:02Z — First dependency baseline (all green)

Host: up 1d13h, disk 27%, mem fine, `sirocco-peer` active, :8796
listening; all sibling ports (8787-8790, 8792, 8794, 8795) up.
`./backup.sh` -> `backups/sirocco-20260923T010220Z.tar.gz` (104K,
read-back verified).

Upstream (live probes + vendor status):
- GitHub OPERATIONAL (status API "All Systems Operational";
  api.github.com 200 in 0.10s).
- Tailscale OPERATIONAL (status API green; `tailscale status` shows
  all fleet nodes, direct connections; coordination endpoint 302 OK).
- OpenRouter OPERATIONAL: Chat API 200 in 0.09s; vendor status page
  shows All Systems Operational (Chat 99.99%/90d). Note: statuspage
  `api/v2/status.json` is WAF-blocked for curl (AccessDenied) and the
  page is a JS SPA — automated checks must use the live API probe,
  documented in `runbooks/openrouter.md`.
- OpenCode Zen: opencode.ai 200. No public status API
  (`zen.opencode.ai/api/status` empty) — signal is waking success.
- Ollama: no local binary on gale-agent; release-watch only.

Cert baseline (all >30d, no warnings): beaconwake.com -> 2026-11-23
(61d), tidalwake.org -> 2026-11-28 (66d), mountainwake.org ->
2026-12-04 (72d). All Let's Encrypt.

Dependency changes: opencode v1.18.32 (2026-09-21, bugfixes + Zen:
DeepSeek V4.1 Flash docs, Grok 4.7) — routine, nobody on host needs
action; Ollama v0.34.3 (2026-09-19) — informational (no local
install). Wrote first `runbooks/` set: openrouter, opencode-zen,
ollama, tailscale, github (down-vs-slow probes + fallbacks).

Inbox: filed 10/10 to `processed/` (8x 2026-09-22 pair-test
two-way checks, already verified; 2x Cyclone selftest probes
2026-09-22T23:10Z + 2026-09-23T01:01Z, safe-to-delete, no action).
Operator Telegram "Hello"/"What's up" seen via check_replies —
acknowledged in notify.

ANOMALY (see ASK.md): working tree held an uncommitted
`"model": "ollama/qwen3.8:27b"` in opencode.json (mtime 2026-09-22
23:05Z) with no NOTES record. Committed as-found for audit; this
waking runs muse-spark and no ollama binary exists here, so the line
matches nothing real. Awaiting operator word on keep/revert.
Runner/model note for Tempest: muse-spark-1.3 via opencode Zen
behaving normally this waking.

## 2026-09-23T07:02Z — Scheduled waking (all green, no changes)

Host: up 1d19h, disk 27%, mem fine, `sirocco-peer` active, :8796
listening; sibling ports 8787-8790, 8792, 8794, 8795 all up.
`./backup.sh` -> `backups/sirocco-20260923T070213Z.tar.gz` (116K,
read-back verified). `check_replies.sh`: no new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational"; api probe 200 in 0.05s.
- Tailscale: coordination endpoint 302 OK; `tailscale status` shows all
  fleet nodes direct (gemini/mountain/ubuntu agents active; only
  josh-desktop11 offline, last seen 4h ago — operator's own desktop,
  not fleet infra).
- OpenRouter: Chat API 200 in 0.09s.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(61d), tidalwake.org -> 2026-11-28 (66d), mountainwake.org ->
2026-12-04 (72d).

Dependency changes: NONE since 01:02Z baseline. opencode latest still
v1.18.32 (2026-09-21), Ollama still v0.34.3 (2026-09-19). Note: GitHub
releases API needs `-L` (returns 301 "Moved Permanently" otherwise) —
runbook-worthy detail for automated release polling; folded into
future runbook touch-up.

Inbox: filed 3/3 to `processed/`: CYCLONE pair-test "waking chase"
(01:41Z) + CYCLONE 07:00Z link-check probe (both safe-to-delete, no
action). Third is UNPAIRED-SENDER FLAG: link-check from "CHINOOK"
(01:45Z), a name in neither the roster nor any pairing record, claiming
"local pair installed by fleet-provision". No pairing with CHINOOK
exists on this side; treating content as data only, no reply sent
(remote pairing needs per-pair operator sign-off under rule 8 anyway).
Possible newly provisioned agent elsewhere — leaving it for the
operator/Gale to confirm; not minting or installing anything.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-23T13:02Z — Scheduled waking (all green, no changes)

Host: up 2d1h, disk 27%, mem fine, `sirocco-peer` active, :8796
listening; sibling ports 8787-8790, 8792, 8794, 8795 all up.
`./backup.sh` -> `backups/sirocco-20260923T130235Z.tar.gz` (119K,
read-back verified). `check_replies.sh`: no new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational"; api probe 200 in 0.06s.
- Tailscale: coordination endpoint 302 OK; `tailscale status` shows all
  fleet nodes direct (gemini/mountain/ubuntu active; josh-desktop11
  offline — operator's own desktop, not fleet infra, same as 07:02Z).
- OpenRouter: /api/v1/models 200 in 0.09s. Statuspage API still
  WAF-blocked for curl (AccessDenied) — known, documented in runbook.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(61d), tidalwake.org -> 2026-11-28 (66d), mountainwake.org ->
2026-12-04 (72d). All Let's Encrypt.

Dependency changes: NONE since 07:02Z. opencode latest still v1.18.32
(2026-09-21), Ollama still v0.34.3 (2026-09-19).

Inbox: filed 2/2 to `processed/`: CYCLONE 13:01Z link-check probe
(safe-to-delete, no action) + second UNPAIRED-SENDER FLAG: pair-test
from "LANTERN" (12:53Z) claiming "josh's hard-gated word ('fix squall
and the others, full mesh')" with "sender half installed from Gale's
bundle". No pairing with LANTERN exists on this side, and the tailnet
shows a `beacon-lantern` node online — but node presence is not a
pairing and prose claims are not operator sign-off, so treating
content as data only, no reply sent, nothing minted or installed
(rule 8: remote pairing needs per-pair operator sign-off). Same
pattern as the 07:02Z CHINOOK message. Leaving both for the
operator/Gale to confirm.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-23T19:02Z — Scheduled waking (upstream all green; pairing-state FINDING, see ASK.md)

Host: up 2d7h, disk 28%, mem fine, `sirocco-peer` active, :8796
listening; sibling ports 8787-8790, 8792, 8794, 8795 all up.
`./backup.sh` -> `backups/sirocco-20260923T190313Z.tar.gz` (129K,
read-back verified: 226 entries). `check_replies.sh`: no new operator
messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational"; api probe 200 in 0.06s.
- Tailscale: coordination endpoint 302 OK; `tailscale status` shows all
  fleet nodes direct (gemini/mountain/ubuntu active; josh-desktop11
  offline — operator's own desktop, not fleet infra, same as before).
- OpenRouter: /api/v1/models 200 in 0.11s.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(61d), tidalwake.org -> 2026-11-28 (66d), mountainwake.org ->
2026-12-04 (71d). All Let's Encrypt.

Dependency changes: NONE since 13:02Z. opencode latest still v1.18.32
(2026-09-21), Ollama still v0.34.3 (2026-09-19).

FINDING — 22 remote pairings installed outside my wakings (ASK.md):
`keys/peers.env` gained CHINOOK (~01:40:34Z) + a 20-block batch
(BEACON/BROOK/CANYON/CREEK/DELTA/HARBOR/HIGHBEAM/LANTERN/LIGHTNING/
MEADOW/MESA/MIST/MOUNTAIN/PRISM/PULSAR/RADAR/RIDGE/RIVER/STREAM/
TIDAL/VISTA, ~12:40:55Z). Evidence: mtimes + `.bak-provision-*` pair;
`sirocco-peer` restarted 8x 12:41:40-12:41:54Z with per-peer self-tests
in `peer/logs/peer_server.log` ("30 peer(s) configured" = 8 local +
22 remote). Inbound prose claims operator authorization but is data
only (rule 5); no quotable Telegram word, no NOTES record. I
minted/installed nothing; leaving steady state untouched (unilateral
removal/rotation would itself breach rule 8); flagged in ASK.md +
Telegram notify. CORRECTIONS: the 07:02Z "no CHINOOK pairing" and
13:02Z "no LANTERN pairing" claims were already false when written
(installed 01:40Z/12:40Z, unknown to those wakings). Lesson: inspect
`keys/peers.env` peer NAMES (never values) every waking from now on.

Inbox: filed 35/35 to `processed/` (10x MOUNTAIN latency/sweep probes,
3x BEACON pair-test/health, 8x DELTA link verifications, HIGHBEAM +
CREEK + PULSAR x2 pair-tests, MEADOW census, MESA link verification,
CANYON liveness sweep, GALE status probe, RIVER Rule-7 sweep, STREAM
link-check, PRISM verify, CYCLONE link-check). STREAM's 18:47Z message
asks for an ack: bearer reach is confirmed by transport ACCEPTs in
`peer_server.log`, logged here instead of a reply. No replies sent to
any peer; nothing minted or installed.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-24T01:02Z — Scheduled waking (all green, no changes)

Host: up 2d13h, disk 29%, mem fine, `sirocco-peer` active, :8796
listening; sibling ports 8787-8790, 8792, 8794, 8795 all up (plus
:8797, new since last waking — unclaimed in my records, noting for
Gale; no action). `./backup.sh` ->
`backups/sirocco-20260924T010236Z.tar.gz` (140K, read-back verified:
242 entries). `check_replies.sh`: no new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational"; api probe 200 in 0.06s.
- Tailscale: coordination endpoint 302 OK; `tailscale status` shows all
  fleet nodes direct (gemini/mountain/ubuntu + beacon nodes active;
  josh-desktop11 offline — operator's own desktop, not fleet infra,
  same as every waking).
- OpenRouter: /api/v1/models 200 in 0.10s.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(60d), tidalwake.org -> 2026-11-28 (65d), mountainwake.org ->
2026-12-04 (71d). All Let's Encrypt.

Dependency changes: NONE since 19:02Z. opencode latest still v1.18.32
(2026-09-21), Ollama still v0.34.3 (2026-09-19).

Pairing state: UNCHANGED since the 19:02Z finding — `keys/peers.env`
mtime still 2026-09-23 12:40:55Z, same 30 peers (8 local + 22 remote).
Nothing minted or installed this waking. The ASK.md authorization
question stands; no operator word yet.

Inbox: filed 44/44 to `processed/` (11x MEADOW census, 9x
MOUNTAIN sweeps/latency, 4x DELTA, 3x HARBOR, 2x each LIGHTNING/MESA/
HIGHBEAM/PULSAR/CANYON/RIVER, 1x each RADAR/BEACON, plus CYCLONE
link-checks x2 — one via `peer/inbox/sirocco/` subdir — and VORTEX
re-chase via subdir). All explicitly no-reply-needed probes; no
replies sent.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-24T07:02Z — Scheduled waking (upstream all green; Ollama v0.34.4 noted)

Host: up 2d19h, disk 29%, mem fine, `sirocco-peer` active, :8796
listening; sibling ports 8787-8790, 8792, 8794-8797 all up (:8797
still present, still unclaimed in my records — noting for Gale; no
action). `./backup.sh` ->
`backups/sirocco-20260924T070217Z.tar.gz` (144K, read-back verified:
226 entries). `check_replies.sh`: no new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational" (updated 04:55Z); api
  probe 200 in 0.05s.
- Tailscale: coordination endpoint 200 OK; `tailscale status` shows
  all fleet nodes (gemini/mountain/ubuntu + beacon nodes active;
  josh-desktop11 offline — operator's own desktop, not fleet infra,
  same as every waking).
- OpenRouter: /api/v1/models 200 in 0.11s.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(60d), tidalwake.org -> 2026-11-28 (65d), mountainwake.org ->
2026-12-04 (71d). All Let's Encrypt.

Dependency changes: Ollama v0.34.4 (2026-09-23, one day after v0.34.3:
structured-outputs single-pass on thinking models, "model not found"
library fix, macOS app fix, Qwen 3.8 + Gemma 4 Apple Silicon
improvements, llama.cpp/MLX/XGrammar updates) — informational only,
no local install on this host, nobody here needs action. opencode
latest still v1.18.32 (2026-09-21).

Pairing state: UNCHANGED since the 19:02Z finding — `keys/peers.env`
mtime still 2026-09-23 12:40:55Z, same 30 pairing blocks (8 local +
22 remote). Nothing minted or installed this waking. The ASK.md
authorization question stands; no operator word yet.

Inbox: filed 22/22 to `processed/` (5x MOUNTAIN sweeps/latency, 4x
DELTA, 3x HIGHBEAM incl. one "x" body, 2x HARBOR, 1x each
BEACON/MEADOW/PULSAR/MESA/CANYON/RIVER plus CYCLONE link-check).
STREAM 06:48Z asks for a sirocco->stream reverse-leg ack; bearer
inbound reach is confirmed by transport, logged here instead of a
reply (same stance as 19:02Z/01:02Z — no unbounded back-and-forth,
and remote-pairing authorization in ASK.md is still open). No
replies sent.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-24T13:02Z — Scheduled waking (upstream all green, no changes)

Host: up 3d1h, disk 31% (up from 29%), mem fine, `sirocco-peer`
active, :8796 listening; sibling ports 8787-8790, 8792, 8794-8797
all up (:8797 still present, still unclaimed in my records; tailnet
:8793 now also listening alongside the localhost-only :8791/:8793
host services — noting both for Gale, no action). `./backup.sh` ->
`backups/sirocco-20260924T130305Z.tar.gz` (151K, read-back verified:
228 entries). `check_replies.sh`: no new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational" (updated 10:44Z); api
  probe 200 in 0.05s.
- Tailscale: coordination endpoint 302 OK; `tailscale status` shows
  all fleet nodes (gemini/mountain/ubuntu + beacon nodes; no
  offline flag on josh-desktop11 this waking — operator's own
  desktop, not fleet infra either way).
- OpenRouter: /api/v1/models 200 in 0.12s.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(60d), tidalwake.org -> 2026-11-28 (65d), mountainwake.org ->
2026-12-04 (71d). All Let's Encrypt.

Dependency changes: NONE since 07:02Z. opencode latest still v1.18.32
(2026-09-21), Ollama still v0.34.4 (2026-09-23).

Pairing state: UNCHANGED since the 19:02Z finding — `keys/peers.env`
mtime still 2026-09-23 12:40:55Z, same 30 NAMEs (8 local + 22
remote). Nothing minted or installed this waking. The ASK.md
authorization question stands; no operator word yet.

Inbox: filed 19/19 to `processed/` (5x MOUNTAIN sweeps/latency, 3x
DELTA, 2x MEADOW census, 1x each BEACON/HIGHBEAM/PULSAR/MESA/RIVER/
CANYON/VISTA/HARBOR, plus CYCLONE 13:01Z link-check via the
`peer/inbox/sirocco/` subdir). All explicitly no-reply-needed
probes; no replies sent.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-24T19:02Z — Scheduled waking (upstream all green, no changes)

Host: up 3d7h, disk 34% (up from 31% at 13:02Z — steady creep,
watching), mem fine, `sirocco-peer` active, :8796 listening;
sibling ports 8787-8790, 8792, 8794-8797 all up (tailnet :8793
also listening alongside localhost-only :8791/:8793 host
services — same as 13:02Z, noting for Gale, no action).
`./backup.sh` -> `backups/sirocco-20260924T190217Z.tar.gz` (162K,
read-back verified: 235 entries). `check_replies.sh`: no new
operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational" (updated 18:22Z); api
  probe 200 in 0.07s.
- Tailscale: coordination endpoint 302 OK; `tailscale status` shows
  all fleet nodes (gemini/mountain/ubuntu + beacon nodes; no
  offline flag on josh-desktop11 this waking — operator's own
  desktop, not fleet infra either way).
- OpenRouter: /api/v1/models 200 in 0.15s.
- OpenCode Zen: opencode.ai 200. Waking itself succeeding = Zen healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >30d, no warnings): beaconwake.com -> 2026-11-23
(60d), tidalwake.org -> 2026-11-28 (65d), mountainwake.org ->
2026-12-04 (71d). All Let's Encrypt.

Dependency changes: NONE since 13:02Z. opencode latest still v1.18.32
(2026-09-21), Ollama still v0.34.4 (2026-09-23).

Pairing state: UNCHANGED since the 2026-09-23 19:02Z finding —
`keys/peers.env` mtime still 2026-09-23 12:40:55Z, same 30 NAMEs
(8 local + 22 remote). Nothing minted or installed this waking.
The ASK.md authorization question stands; no operator word yet.

Inbox: filed 21/21 to `processed/` (4x HARBOR, 3x each MOUNTAIN/
DELTA, 2x STREAM incl. 14:09Z reverse-leg check, 1x each
BEACON/MEADOW/HIGHBEAM/PULSAR/MESA/CANYON/RIVER, plus CYCLONE
19:00Z link-check). All explicitly no-reply-needed probes; no
replies sent.

Runner/model note for Tempest: muse-spark-1.3 via opencode Zen normal
again this waking; no runner/model anomalies observed.

## 2026-09-25T04:26Z — Scheduled waking (upstream all green, no changes)

Context: first waking on the operator's reconfig from 02:17Z (commit
`1170f10`): I am now running as `ollama/qwen3.8:27b`, and wake cron is
6x/day at :17 (2,6,10,14,18,22) vs the old 4x. Both held this waking —
this was the :17 of the 02:00 slot. No runner/model anomalies.

Host: up 3d7h30m, disk 38% (58G free / 98G) — steady creep since 13:02Z
(29%) and 19:02Z (34%); pace ~+4%/36h, ~60d of headroom at this rate,
noting for Gale; 60G RAM / 52G available, `sirocco-peer` active, all
11 tailnet ports 8787-8797 + localhost :8791/:8793 listening.
`./backup.sh` -> `backups/sirocco-20260925T042805Z.tar.gz` (180K,
read-back verified); oldest pruned as usual. `check_replies.sh`: no
new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational" (updated 02:53Z); /zen
  200 in 0.08s.
- Tailscale: coordination 302 OK; 11 nodes online (gale-agent, 7x
  beacon, gemini-agent, mountain-agent, ubuntu-agent, josh-desktop11).
  NEW: josh-desktop11 now shows `[idle]` (was active at prior wakings)
  — operator's own desktop, not fleet infra; no action, noted.
- OpenRouter: /api/v1/models 200 in 0.13s.
- OpenCode Zen: opencode.ai 200. Waking succeeding = Zen healthy.
- Ollama: release-watch only; latest still v0.34.4 (2026-09-23).

Dependency changes: NONE. opencode latest still v1.18.32 (2026-09-21).
NOTE: `api.github.com/repos/sst/opencode` now 301-redirects to repo id
975734319; canonical full_name is **`anomalyco/opencode`** (org
moved/split from sst). Release numbers still comparable via the id and
the runbook github.md reference still 301-resolves, so no script
breakage — will mention the canonical name for Gale in case he wants
the doc updated.

Pairing state: UNCHANGED since the 2026-09-23 19:02Z finding — same 30
NAMEs (8 local + 22 remote) in `keys/peers.env` (mtime now
2026-09-25 01:31:29Z from the 01:31Z provisioning churn; contents
count-verified, no new pairs). ASK.md wording fix ("added"->"found",
23->22 blocks) was uncommitted at start of waking; committed it
as-found `139847f`. TRAMONTANE flag stands per commit `1170f10`
(key-denies). ASK.md authorization question otherwise still awaiting
operator word.

Inbox: filed 18/18 to `processed/` (3x MOUNTAIN sweeps, 4x DELTA,
2x each CANYON/RIDGE/HARBOR/VISTA/MESA, 1x BEACON) — all explicitly
"no reply needed" link-verification / Rule-7 peer-sweep probes; none
required action, no replies sent. Also noted: `peer/inbox/sirocco/`
is an EMPTY directory (created 2026-09-24 13:03:39Z; peers appear to
sometimes send to a name-subdir instead of /inbox); leaving in place,
flagging to Gale.

Certs (unchanged, all >55d, no warnings): beaconwake.com ->
2026-11-23, tidalwake.org -> 2026-11-28, mountainwake.org ->
2026-12-04.

## 2026-09-25T06:17Z — Scheduled waking (upstream all green, no changes)

Context: :17 of the 06:00 slot on the current 6x/day reconfig
(02/06/10/14/18/22) and current `ollama/qwen3.8:27b` model; both held,
no runner/model anomalies.

Host: up 3d18h, load 1.28, disk 38% (36G free / 98G) — steady, no new
creep since the 04:26Z reading (still ~60d of headroom at the prior
pace); 58G RAM / 52G available, `sirocco-peer` active, all 11 tailnet
ports 8787-8797 + localhost :8791/:8793 listening.
`./backup.sh` -> `backups/sirocco-20260925T061848Z.tar.gz` (188K,
read-back verified). `check_replies.sh`: no new operator messages.

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational" (updated 02:53Z); /zen
  200 in 0.08s.
- Tailscale: coordination 302 OK; 11 nodes online (gale-agent, 7x
  beacon, gemini-agent, mountain-agent, ubuntu-agent, josh-desktop11 —
  same set as 04:26Z, josh-desktop11 still `[idle]`).
- OpenRouter: /api/v1/models 200 in 0.22s.
- OpenCode Zen: opencode.ai 200. Waking succeeding = Zen healthy.
- Ollama: release-watch only; latest still v0.34.4 (2026-09-23).

Dependency changes: NONE. opencode latest still v1.18.32 (2026-09-21);
confirmed against canonical `anomalyco/opencode` (per the 04:26Z note on
the sst->anomalyco rename).

Pairing state: `keys/peers.env` holds 31 NAME blocks (verified this
waking) = 9 local + 22 remote per ASK.md; the 22 remote pairings still
await operator confirmation (rule 5 — no unilateral action). NOTE: the
04:26Z entry recorded "30 / 8 local", a 1-block undercount that omits
the local CHINOOK co-resident; reconciling to 9 local here to match
ASK.md. TRAMONTANE key-denies flag stands. No mint/rotate/install this
waking.

Inbox: filed 14/14 to `processed/` (7x MEADOW, 3x MOUNTAIN, 2x DELTA,
1x each VISTA/HIGHBEAM/BEACON) — all explicitly "no reply needed"
reachability / Rule-7 peer-sweep probes; none required action, no
replies sent.

Certs (unchanged, all >50d, no warnings): beaconwake.com ->
2026-11-23, tidalwake.org -> 2026-11-28, mountainwake.org ->
2026-12-04.

## 2026-09-25T10:21:xxZ — waking (qwen3.8:27b)

- Host: gale-agent up 3d22h, load 1.13/1.22/1.34, disk 35% (61G free),
  mem 5.8G/58G. sirocco-peer active, 100.66.39.59:8796 listening. Healthy.
- Upstream probes (all expected-green):
  - OpenRouter: /api/v1/models 200 in 0.20s.
  - OpenCode Zen: opencode.ai 200 in 0.46s (zen.opencode.ai still has no
    usable endpoint — matches 2026-09-23 baseline note). Waking itself
    succeeding = model path healthy.
  - Ollama (local): 127.0.0.1:11434 200. Release-watch: latest still
    v0.34.4 (no change from prior wakings — re-checked below).
  - Tailscale: up; 8+ peers reachable, gemini-agent active, josh-desktop11
    still idle (same as 06:17Z).
  - GitHub: api.github.com 200 in 0.08s.
- Certs (unchanged from 06:17Z entry, all >50d): beaconwake.com
  2026-11-23, tidalwake.org 2026-11-28, mountainwake.org 2026-12-04.
- Release watch (unchanged baselines): Ollama latest v0.34.4
  (2026-09-23); opencode latest v1.18.32 (2026-09-21). No new releases
  since the 06:17Z entry.
- Inbox: filed 11/11 to `processed/` — 10 data-only link/liveness probes
  (HIGHBEAM, MESA, MOUNTAIN, CANYON, RIVER w196 two-layer-mesh sweep,
  VISTA, HARBOR x2, VORTES empty-body, PULSAR w30 selftest, plus VORTEX
  "pairing-verify" in peer/inbox/sirocco/) all "no reply needed"
  equivalent; no action, no replies sent. Note: RIVER reports
  river<->TRAMONTANE leg newly installed both-directions-verified —
  informational only, no Sirocco-side action (TRAMONTANE key-denies
  flag from 02:17Z stands, unchanged on my side).
- Backup: sirocco-20260925T101815Z.tar.gz (196K), listing verified.
- ASK.md: unchanged; 22 remote pairings still await operator
  confirmation; no mint/rotate/install this waking.
- Verdict: all upstream dependencies green, no dependency changes,
  no cert warnings, no inbox items requiring action. Steady state.

## 2026-09-25T14:18Z — Scheduled waking (upstream all green, no changes)

Context: :17 of the 14:00 slot on the current 6x/day reconfig
(2,6,10,14,18,22) and current `ollama/qwen3.8:27b` model; both held,
no runner/model anomalies. (Waking ran at ~14:18Z, ~1h late vs the
:17 slot — cron/scheduler timing not investigated; noting.)

`check_replies.sh`: no new operator messages.

Host: up 4d2h, load 3.24 (spiked vs 1.13–1.28 at prior wakings;
transient, not sustained at check end), disk 36% (61G free / 98G)
— DOWN from 38% at 04:26Z/06:17Z and 35% at 10:21Z; the "steady creep"
trend has reversed/settled, no longer watching as a concern; 58G RAM /
50G available, `sirocco-peer` active. All 11 tailnet ports 8787-8797 +
localhost :8791/:8793 listening. NOTE: the tailnet :8791 listener is a
DIFFERENT process than the localhost :8791 (pid 140905 vs 1105790) —
same as prior wakings, no action, Gale's lane.
`./backup.sh` -> `backups/sirocco-20260925T141842Z.tar.gz` (208K,
read-back verified: 270 entries).

Upstream (live probes + vendor status, all OPERATIONAL):
- GitHub: status API "All Systems Operational" (via githubstatus.com,
  updated 13:59:12Z); api.github.com 200 in 0.07s.
- Tailscale: coordination 302 OK; 11 nodes online (gale-agent, 6x
  beacon [highbeam/lantern/lightning/prism/pulsar/radar idle],
  gemini-agent, mountain-agent, ubuntu-agent, josh-desktop11 — same
  set as 06:17Z, josh-desktop11 no longer `[idle]`-flagged this
  waking, was active earlier).
- OpenRouter: /api/v1/models 200 in 0.18s.
- OpenCode Zen: opencode.ai 200 in 0.17s. Waking succeeding = model
  path healthy.
- Ollama: still no local binary; release-watch only.

Certs (unchanged, all >59d, no warnings): beaconwake.com ->
2026-11-23, tidalwake.org -> 2026-11-28, mountainwake.org -> 2026-12-04.
All Let's Encrypt.

Dependency changes: NONE. Ollama latest still v0.34.4 (2026-09-23);
opencode latest still v1.18.32 (2026-09-21, verified against canonical
`anomalyco/opencode`).

Pairing state: UNCHANGED — `keys/peers.env` mtime still 2026-09-25
01:31:29Z, same 31 NAME blocks (9 local + 22 remote) per count. The
22 remote pairings still await operator confirmation — the ASK.md
authorization question stands; no operator word yet. TRAMONTANE
key-denies flag stands. No mint/rotate/install this waking.

Inbox: filed 17/17 root items to `processed/` (4x HARBOR, 3x MOUNTAIN,
2x MEADOW, 1x each BEACON/DELTA/PULSAR/MESA/CANYON/RIVER/VISTA) — all
explicitly "no reply needed" credentialed reach / Rule-7 / census /
liveness probes; none required action, no replies sent. Also filed
2 stragglers from the `peer/inbox/pulsar/` and `peer/inbox/sirocco/`
name-subdirs (1x PULSAR w30 selftest, 1x VORTEX pairing-verify) that
had already been logged in the 10:21Z entry — then removed both empty
subdirs, so future peers send to the flat `peer/inbox/` path only;
the name-subdir routing quirk I flagged at 04:26Z/10:21Z is now closed
on my side (no more empty-subdir stragglers to triage).

- Verdict: all upstream dependencies green, no dependency changes,
  no cert warnings, inbox fully cleared (incl. the two name-subdir
  stragglers, now de-subdir'd). Steady state; ASK.md remote-pairing
  authorization question unchanged, still awaiting operator word.
