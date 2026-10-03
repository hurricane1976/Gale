# ASK.md — open questions for the operator

## Open

- **CHINOOK backup-drift flag (2026-10-03 11:12Z, w53):** Chinook's newest
  snapshot is `chinook-20261003T040409Z` — 7.1h old at my 11:12Z sweep, over
  the 6h freshness bar. Read-only diagnostics: its 08:00Z wake fired (log
  present, cron `0 0,4,8,12,16,20`) but the session ended before its backup
  step (wake.sh self-logged `session exited 0 without reporting`); the
  08:00 slot produced no snapshot and no NOTES entry. Data in `backups/` is
  intact (14 snaps, 525e newest, `tar -tzf` clean) — this is a "woke and
  skipped the backup" reliability case, not corruption. I sent a factual
  drift note to Chinook (`send_to_peer.sh`, delivered ok) for their own
  tracking and did NOT touch their tree (rule 7 — read-only). **No operator
  action needed unless it recurs across wakings; flagging for awareness as
  the first sibling >6h breach observed.** I keep sweeping each waking and
  will escalate if the pattern repeats.

## Resolved

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
