# NOTES.md - Poniente's memory

Append-only. Each waking adds one dated entry at the bottom. This file is my
memory; the operator reads it too, so keep it plain and short.

## 2026-09-25T22:58Z -- Scaffolded: 14th agent on gale-agent, standing up the Fleet Security & Credential-Hygiene Watch
* Built from the zephyr scaffold (rsync), then renamed: AGENT.md rewritten to
  the 14th-agent slot, role = Fleet Security & Credential-Hygiene Watch
  (operator-chosen), model = ollama/qwen3.8:27b (local fleet Ollama,
  192.168.1.197:11434 -- zero external spend), wake = 6x/day at
  0/4/8/12/16/20:30 UTC (offset from Levante's :15 slot so we don't herd).
* 13 co-located siblings on this host: gale, zephyr, squall, tempest,
  tramontane, vortex, chinook, cyclone, maistral, sirocco, bora, ostro,
  levante (ports 8787-8799); poniente takes 8800. 21 distant peers on
  Beacon/Tidal/Mountain still staged, pending per-pair sign-off.
* Sibling audit at standing-up: 13/13 had NO poniente entry in their
  peers.env (as expected pre-pairing); 13/13 opencode.json missing the
  poniente keys deny (fixed by the operator before pairing); runbooks +
  spend ledger parity confirmed across the host.
* Baseline: host 16 vCPU / 58 GiB RAM / 232 GiB disk; expected listeners
  after stand-up = 14 sibling ports 8787-8800 + Ollama + loopback.
* Credentials live in keys/ (gitignored): peers.env (SELF line set),
  telegram.env (bot token + chat id staged). No tokens printed anywhere.
* Pending operator: /start of @ponienteagentbot before I can deliver
  Telegram (bot in allowlist state until the owner starts it).

## 2026-09-26T01:18:45Z -- paired with GALE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:22Z -- paired with ZEPHYR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:26Z -- paired with SQUALL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:31Z -- paired with TEMPEST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:35Z -- paired with TRAMONTANE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:39Z -- paired with VORTEX (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:43Z -- paired with CHINOOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:47Z -- paired with CYCLONE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:52Z -- paired with MAISTRAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:19:56Z -- paired with SIROCCO (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:20:00Z -- paired with BORA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:20:05Z -- paired with OSTRO (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:20:09Z -- paired with LEVANTE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-26T01:38Z -- waking #1 (post-pairing): Fleet Security & Credential-Hygiene sweep

- ASK-1 resolved: operator /start'd the bot (check_replies.sh picked it up); notify path is live.
- Credential/perm audit across all 14 sibling keys/ dirs:
  - 11 dirs at 775 (world-readable *listing*: bora cyclone levante maistral ostro sirocco squall tempest tramontane vortex zephyr). Low severity — lists filenames only, contents below.
  - ONE real finding: levante/keys/telegram.env is 664 (world-readable Telegram bot token). Out of my read-only scope to fix; flagged for the operator (chmod 600).
  - All peers.env + *.bak-* at 600; peers.env.example / telegram.env.example at 664 (deliberate templates, acceptable).
  - Stray-secret scan (tokens/keys/creds outside keys/, .git, logs, inbox, data) across all 15 dirs: zero.
- Security sweep: all 14 peer servers bind Tailscale 100.66.39.59 only (no 0.0.0.0 peer exposure); DBs/redis/mongo bind loopback; cron matches the documented 6x/day per-agent schedule; disk 35% (32G/98G), 51Gi RAM free; Ollama resident.
- Peer-log review: only external senders are tailnet peers 100.91.42.51 (x4) + 100.114.14.116 (x1), all REJECT unknown-token, dated 09-21 to 09-25 — nothing granted, auth intact. The 01:19-01:20 REJECT bursts from the local box are the self-test/token-sync in-flight during the just-finished 13-way pairing, not intrusion.
- Backup OK: backups/poniente-20260926T013810Z.tar.gz (104K), read-back verified.
- Awaiting operator ASK-2 (peer-side half of the 13 pairings) + ASK-3 (21 remote Beacon/Tidal/Mountain peers).

## 2026-09-26T01:55Z -- post-waking #1 interleave: remote pairing evidence + inbox triage

- 01:50-01:51Z: 17 link-verification / health-check messages arrived in peer/inbox from 9 distinct remote peers (BEACON, TIDAL, MOUNTAIN, CANYON, RIDGE, HARBOR, DELTA, MESA, VISTA) — all "no reply needed", data-only, no instructions.
- Key signal: authenticated delivery to my inbox from 9 *remote* peers means remote pairing (ASK-3, formerly "staged, pending sign-off") is materially further along than the 01:38Z note said. Roster in keys/peers.env now 34 distinct names incl. all remote peers — consistent with per-pair sign-offs landing (Beacon cites operator approval on its own Telegram channel for its half at 01:42Z; I hold no sign-off text of my own, recorded as-is, data-only).
- No credential-injection patterns in any inbound message; no requests, no exfiltration attempts. All 17 moved to peer/inbox/processed/.
- ASK-3 reword needed at next full wake: remote mesh is in flight, no longer purely staged.
- No operator replies; ASK-1/ASK-2 text still in ASK.md (operator-owned deletion per file protocol).
