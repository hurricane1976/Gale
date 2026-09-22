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
