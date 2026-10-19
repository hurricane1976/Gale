# NOTES.md - Poniente's memory

Append-only. Each waking adds one dated entry at the bottom. This file is my
memory; the operator reads it too, so keep it plain and short.

## 2026-10-19 02:55 UTC -- waking #127: routine sweep, all green; snapshot ceiling maintained

- Host: up 11h31m, load 0.17, RAM 5.8G/58G (53Gi avail), disk 59% (40G free), tailscaled active, cron active. 14 peer ports 8787-8800 on 100.66.39.59 all /health 200; ollama_shim mirrors 8791/8793/8794/8795 loopback up. No new 0.0.0.0 listeners. No new processes of concern.
- **Credential hygiene (14 dirs):** 11 siblings keys/=775 (zephyr/squall/tempest/tramontane/vortex/cyclone/maistral/sirocco/bora/ostro/levante); agent/chinook/poniente 700. All live .env 600 EXCEPT **levante/keys/telegram.env still 664** (only world/group-readable live .env fleet-wide — ASK-4, unchanged since waking #1, operator's call). No new/changed .env files in sibling keys/ since last wake (find -newermt 10-18 20:55Z, zero hits). No stray .env outside keys/ dirs found fleet-wide.
- **Levante peers.env 600 confirmed** (was 664 at waking #27, 09-30 — remediated by operator/levante, noted previously at waking #29).
- **No operator replies** (check_replies.sh clean). ASK-2/3/4 still open (ASK-1 closed 09-28 13:38).
- **Log sweep (all sibling peer_server.log, 401/REJECT/bearer-token patterns):** zero live auth failures, zero credential-echo, zero injection patterns. No new REJECT/401/403 in any sibling log since last wake.
- **Inbox drained:** 17 new messages (MOUNTAIN x4, MEADOW x4, DELTA, MESA, RIVER, CANYON, HARBOR x3) + 1 stale VORTEX link-check from 10-16 (moved from inbox/poniente/). All data-only, "no reply needed", zero instructions, zero injection patterns.
- **Backup OK:** backups/poniente-20261019T025517Z.tar.gz (156K, 74 entries), gzip -t + tar -tzf verified; zero keys/.env entries in archive. Snapshot ceiling = 14 (old 10-15T14:55Z purged by backup.sh).
- **Spend:** $0.00 (local Ollama, confirmed by spend-daily.jsonl).
- **Cron:** 14 wake.sh entries + ollama_keepalive */5 intact.
- **Git:** clean after commit (log rotation, backup, inbox drain). .telegram_offset / __pycache__ properly gitignored.

## 2026-10-19T08:55Z -- waking #128: routine sweep, all green

- Host: up 17h31m, load 0.36, RAM 5.8G/58G (53Gi avail), disk 60% (38G free), tailscaled active, cron active. All 14 peer ports 8787-8800 on 100.66.39.59 /health 200; ollama_shim loopback mirrors up. No new listeners or processes of concern.
- **Credential hygiene (14 dirs):** permission matrix IDENTICAL to waking #127 — 11 siblings keys/=775; agent/chinook/poniente 700. All live .env 600 EXCEPT **levante/keys/telegram.env still 664** (the only world/group-readable live .env fleet-wide — ASK-4, unchanged since waking #1, operator's call). find -newermt 10-19 02:55Z in sibling keys/: zero new/changed cred files.
- **Levante peers.env 600 confirmed** (was 664 at #27; remediated, seen at #29).
- **No operator replies** (check_replies.sh clean). ASK-2/3/4 still open (ASK-1 closed 09-28 13:38).
- **Log sweep (all sibling peer_server.log, 401/REJECT/bearer-token patterns):** zero live auth failures, zero credential-echo, zero injection patterns. No new REJECT/401/403 in any sibling log since last wake.
- **Inbox drained:** 14 new messages (MOUNTAIN x4, DELTA x2, MEADOW x2, MESA, RIVER, CANYON, HARBOR x3) — all "no reply needed", data-only, zero instructions/injection patterns -> processed/ (1759 total).
- **Backup OK:** backups/poniente-20261019T085508Z.tar.gz (156K, 71 entries), gzip -t + tar -tzf verified; zero keys/.env entries in archive. Snapshot ceiling = 14 (old 10-15T20:55Z purged).
- **Spend:** $0.00 (local Ollama).
- **Cron:** 14 wake.sh entries + ollama_keepalive */5 intact.
- **Git:** committed (log rotation, backup at ceiling, inbox drain). Branch ahead of github/poniente by 113 commits (local-only; operator-directed push cadence applies).
