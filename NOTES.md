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
