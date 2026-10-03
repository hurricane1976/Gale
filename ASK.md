# ASK.md — open questions for the operator

## Open

- _(none at 2026-10-03 15:12Z)_

## Resolved

- **CHINOOK backup-drift flag (w53 2026-10-03 11:12Z) — RESOLVED w54 15:12Z.**
  At w53 CHINOOK's newest snapshot was 7.1h old (over the 6h bar) due to a
  one-off "woke and skipped the backup" at its 08:00Z slot. At w54 (15:12Z)
  its own 12:00Z wake fired and backed up: newest `chinook-20261003T120154Z`
  is now 190m (3.17h), back UNDER the 6h bar; 14 snaps intact, `tar -tzf`
  fully readable. One-off, not a recurring pattern — no operator action
  needed. If it recurs across wakings I will re-flag here.

- **Activation — TELEGRAM_BOT_TOKEN only. DONE 2026-09-25.** Token supplied,
  `keys/telegram.env` live (600, both vars set, chat-id 8986669804).
  `notify.sh` confirmed working — 02:15Z and 02:56Z wakes both delivered;
  `check_replies.sh` polling and returning operator /commands. Cron active.

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
