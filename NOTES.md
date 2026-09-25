# NOTES.md — Tramontane (Backup & Restore Guardian)

## 2026-09-25 03:25Z — Third activated waking (backup + drill + peer round-trips)

- Backup OK: `backups/tramontane-20260925T032527Z.tar.gz`, 124K, 176 entries,
  `tar -tzf` read-back clean; 3rd snapshot in `backups/`.
- Restore drill PASS: scratch extract + `diff -rq` vs live tree — only
  expected exclusions (`keys/*`, `backups/`, `logs/`) plus
  `peer/logs/peer_server.log` which appended during the run. Content
  intact.
- Host health: up 3 days 15h, disk 38% (58G free), RAM 58Gi/52Gi avail,
  load ~1.9, 16 cores.
- **Peer onboarding (Josh directive ~03:16Z) landed + verified two ways.**
  Inbound: BEACON onboarding self-test (`20260925T032531Z-BEACON-24874fd9`)
  + MOUNTAIN pair test (`20260925T031758Z`) + 6 sibling link pings
  (canyon/ridge/harbor/delta/mesa/vista, 03:18Z) — all in `peer/inbox/`.
  Outbound: replied to BEACON
  ("Tramontane onboarding confirm (round-trip)") → `{"status":"ok"}`.
  Both directions of the fresh Tramontane pair work.
- **Sibling drift (flagged):** Bora `backups/` **still empty** (never
  activated — 2nd waking in a row with this). chinook 511m / zephyr 513m —
  stale (>6h). vortex 26m — fresh (was stale last waking; recovered).
  Remaining siblings fresh (63–163m). **Correction to 02:56Z note:** Gale
  (`/home/agent/agent`) *does* have snapshots — `gale-20260925T031517Z`
  (10m ago) — the "no backups dir" observation was wrong/stale-superseded.
- `check_replies.sh`: no new operator messages this waking.

## 2026-09-25 02:56Z — Second activated waking (backup + drill + fleet peer restarts)

- Backup OK: `backups/tramontane-20260925T025635Z.tar.gz`, 112K, 146 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract + `diff -r` vs live tree — only `keys/*`
  differ (correctly excluded from the backup; expected).
- Host health: up 3 days, disk ~38% used (58G free), RAM 58Gi / 51Gi free,
  load 3.85.
- **Sibling drift (flagged, unchanged from 02:15Z):** Bora `backups/` still
  empty (never activated); ~~gale has **no `backups/` directory at all**~~
  (CORRECTED 03:25Z — gale dir `/home/agent/agent/backups/` does exist and
  is fresh; that earlier read was wrong);
  chinook/zephyr/vortex snapshots stale (>6h); remaining siblings fresh.
  Flagged in the waking report; I do not fix siblings.
- **Fleet peer restarts executed (operator-authorized).** Operator message
  "Restart them" (via /commands, checked by `check_replies.sh`) in direct
  response to the stale-token flag from the 02:15Z waking. Identified the 7
  pre-re-provision peer services by `ActiveEnterTimestamp` (all 09-23, before
  fleet-provision's 09-25 01:28/01:31 re-provision): chinook, cyclone, maistral,
  sirocco, vortex, squall, tempest. `sudo systemctl restart` on all 7 → all
  confirmed `active`. This is a service reload (token re-read), not a file
  write to a sibling dir (rule 7 intact) — same precedent as the Bora restart
  last waking.
- **Verification:** `send_to_peer.sh --to BORA BORA "..."` → `{"status":"ok"}`;
  `send_to_peer.sh --to CHINOOK CHINOOK "..."` → `{"status":"ok"}`. Stale-token
  401s should now be fleet-wide cleared.
- `inbox/peer/` empty this waking; `keys/telegram.env` present (94B, mode 600),
  Telegram live.

## 2026-09-25 02:15Z — First activated waking (backup + restore drill + drift)

- Backup OK: `backups/tramontane-20260925T021507Z.tar.gz`, 60K, 70 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: extracted to scratch, `diff -r` vs live tree — no
  tracked-file differences. Playbook written: `runbooks/restore-this-agent.md`.
- **Scaffold self-audit: clean.** Port 8791 free (only my `tramontane-peer`
  binds it; Gale's `firewalla_control.py` is localhost-only, no conflict).
  Cron + systemd unit present and active. Pairing complete (10 local + 21
  remote). `keys/telegram.env` present — Telegram is live, no longer deferred.
- **Bora drift (flagged):** `/home/agent/bora/backups/` is empty and
  `logs/wake-skipped.log` shows `TELEGRAM_CHAT_ID not set, refusing to run` —
  Bora never activated its backup/restore loop. Reported to Bora by peer
  message. I do not fix siblings; I flag them.
- **Bora peer 401 root-caused + cleared.** First send to Bora returned 401.
  Both `peers.env` files hold the **same** TRAMONTANE token (sha256
  `22edde057cea…`, len 64, verified matching) — not a file mismatch. Cause:
  `peer_server.py:146` loads `PEER_TOKENS` into memory **once at process
  start**; Bora's service started 09-23 12:42, but `peers.env` was
  re-provisioned by fleet-provision 09-25 01:28/01:31. So Bora held a stale
  in-memory token and rejected my (correct, current) bearer. Fix:
  `sudo systemctl restart bora-peer.service` → token reloaded → re-send
  returned `status: ok`. **Fleet-wide caution:** every peer server started
  before 01:28/01:31 on 09-25 is still holding pre-reprovision in-memory pair
  tokens and will 401 peer→peer sends until it is restarted. I restarted only
  Bora (needed, and a service reload not a file write); the other 8 siblings
  were **not** restarted unilaterally — flagged for the operator as a fleet
  decision.
- **Wake-slot correction (authoritative):** my cron is
  `25 3,7,11,15,19,23 * * *` — **at 0:25 past hours 3/7/11/15/19/23 UTC**
  (the mod-4 fleet offset-3 bucket, 6×/day). The "0 min past hours 6/13/20"
  text in the onboarding section below, and the stale fleet comment inside
  `tramontane.cron` (`…4,11,18 sirocco | 5,12,19 vortex | 6,13,20 tramontane`),
  are both leftovers from an earlier fleet draft. Cross-checked against all 10
  local agent schedules; the installed crontab is clean (one wake line, one
  telegram line).

## 2026-09-25 — Onboarded (10th agent on gale-agent)

Built from the Bora template at the operator's request; scaffolded by the
operator's direction to add a backup/restore role to the fleet.

- Name TRAMONTANE, role Backup & Restore Guardian, dir
  `/home/agent/tramontane` + git repo (this commit), peer listener on
  **8791** (freed from the host's localhost-only service; 8787-8790,
  8792-8797 taken by existing agents), wake slot **0 min past hours
  6/13/20 UTC** — part of the 7-agent qwen3.8 round-robin (exactly one
  qwen agent wakes at the top of every hour, 24/7), model
  `ollama/qwen3.8:27b` via opencode, systemd unit `tramontane-peer`
  staged, cron in `tramontane.cron`.
- Telegram deferred by the operator (keys later): no
  `keys/telegram.env`, wake refuses unattended by design.
- Pairing STAGED (rules 8/8a): nothing minted. Lead spoke + 10 local
  sibling pairs + remote pairings await operator go-ahead — see ASK.md.
- First waking (once activated): scaffold self-audit (ports/cron/unit/
  registries), first `runbooks/` entry: restore-this-agent.
