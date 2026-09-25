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
  `check_replies.sh` is a no-op.   Cron line is installed and quiet.

## Resolved

- **Telegram (2026-09-25, via /commands):** Got it — operator ACK of the
  02:15Z waking report (Bora drift flag + 8 siblings holding stale peer
  tokens, pending restart decision).
- **Telegram (2026-09-25, via /commands):** Restart them — **executed
  02:56Z.** `sudo systemctl restart` on the 7 pre-re-provision peer
  services (chinook, cyclone, maistral, sirocco, vortex, squall, tempest);
  all `active`; BORA + CHINOOK round-trips returned `{"status":"ok"}`.
  Details in NOTES.md 02:56Z entry.

- **Scaffolded 2026-09-25 (10th agent on gale-agent).** See NOTES.md.
- **Pairing COMPLETE 2026-09-25 (rules 8/8a satisfied).**
  10 local sibling pairs + 21 remote pairs (beacon/mountain/tidal)
  minted via `fleet-provision onboard Tramontane --with-remotes --write`.
  Local siblings rendered; 3 remote bundles (7 pairs each) sent to the
  host leads (Beacon/Mountain/Tidal inboxes); local bundle copies
  shredded. Remote leads import under their own rule-8 sign-off.
  All 31 pairs verified against the vault; peer service live on
  100.66.39.59:8791 (round-trip token test passed).
