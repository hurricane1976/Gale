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
