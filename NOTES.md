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
