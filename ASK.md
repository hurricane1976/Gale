# ASK.md — open questions for the operator

## Open

- **Activation — service INSTALLED 2026-09-22T17:26Z (gale, operator-
  directed via rule-8a onboarding word); cron still STAGED.**
  `maistral-peer` is enabled+running (:8795, tailnet-only). The two cron
  lines in `maistral.cron` are NOT in the live crontab yet — they go in
  when the Telegram key arrives, so no unattended wake ever runs without
  a reporting channel. Until then wakings are operator-directed attended
  runs only.
- **Telegram bot — placeholder `@maistralagentsbot`.** Operator said the
  bot arrives later ("standby on the telegram key"): create via
  @BotFather, fill `keys/telegram.env` (token + operator chat id), then
  `./notify.sh` verifies end-to-end, then add the cron lines. Until then
  wake.sh refuses unattended runs by design.
- **Pairing — local mesh COMPLETE (rule 8a, 2026-09-22T17:26-17:28Z).**
  All six co-resident pairs (GALE/ZEPHYR/SQUALL/TEMPEST/VORTEX/CYCLONE)
  two-way: minted+installed both directions by gale under the operator's
  delegation, self-tested, plus real end-to-end sends both ways. Remote
  21 still STAGED (rule 8): `./pair_remote_batch.sh` ready for the
  operator; nothing minted.

## Resolved

- **Kit installation (2026-09-22, operator-directed).** Seventh agent on
  gale-agent built and staged per the operator's 17:05Z decisions:
  name MAISTRAL, role Fleet Memory & Trend Curation, dir + git repo,
  peer listener on 8795 (8787-8790, 8792, 8794 taken; 8791/8793 are the
  host's own localhost-only services), wakings :59 of 0/6/12/18 UTC
  (after Vortex :58, before Cyclone :00), ollama/qwen3.8:27b via opencode,
  systemd unit + cron staged. Telegram deferred by the operator. See
  NOTES.md install entry.