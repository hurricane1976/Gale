# ASK.md — open questions for the operator

## Open

- **Activation — TELEGRAM_BOT_TOKEN only.**
  Operator is supplying the token directly. When it arrives:
  ```
  cat > /home/agent/tramontane/keys/telegram.env <<EOF
  TELEGRAM_BOT_TOKEN=<token>
  TELEGRAM_CHAT_ID=8986669804
  EOF
  chmod 600 /home/agent/tramontane/keys/telegram.env
  /home/agent/tramontane/wake.sh --once   # verify a real notify lands
  ```
  Until then `wake.sh` refuses unattended runs, `notify.sh` fails safe,
  `check_replies.sh` is a no-op. Cron line is installed and quiet.
- **Telegram (2026-09-25, via /commands):** Got it

## Resolved

- **Scaffolded 2026-09-25 (10th agent on gale-agent).** See NOTES.md.
- **Pairing COMPLETE 2026-09-25 (rules 8/8a satisfied).**
  10 local sibling pairs + 21 remote pairs (beacon/mountain/tidal)
  minted via `fleet-provision onboard Tramontane --with-remotes --write`.
  Local siblings rendered; 3 remote bundles (7 pairs each) sent to the
  host leads (Beacon/Mountain/Tidal inboxes); local bundle copies
  shredded. Remote leads import under their own rule-8 sign-off.
  All 31 pairs verified against the vault; peer service live on
  100.66.39.59:8791 (round-trip token test passed).
