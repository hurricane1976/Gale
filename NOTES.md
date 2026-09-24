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
