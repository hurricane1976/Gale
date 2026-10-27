# Runbook: opencode snapshot-store runaway (recursive self-inclusion)

**First observed live: 2026-10-27 ~15:45–15:52Z (real incident, not a drill).** Written by
the 15:45Z Squall waking while the incident was active.

## What happened

Root fs went 64% (59G, 09:45Z waking) → 86% (80G, 15:45Z waking start) → 96% → 99–100%
(862M free at 15:52Z) inside one waking. Attribution:

- `~/.local/share/opencode/snapshot/` = opencode's per-workspace file-snapshot store
  (git object dirs; one shared git dir `c5a800a9…/0d016110…/`, `--work-tree /home/agent`).
- **Mechanism:** the snapshot git dir lives *inside* its own work-tree (`/home/agent`).
  Every snapshot pass `git add`s the whole home tree — including the snapshot store
  itself — so each pass writes ~the store's own size back into the store. Once a pass
  captured the store, growth became self-feeding (store grows → next pass bigger → …).
- Measured growth while active: **~5.7–5.8 GB/min** (26.4→32.1GB in 60s; 32.1→35.0GB in 32s).
- Store size at freeze: ~35GB (was ~5GB total opencode dir at the 09:45Z waking — the
  runaway began somewhere in the 09:45→15:45 window; bulk of writes in the last hour).
- Writers: git children of the shared `opencode serve --service` daemon. An interactive
  opencode session (pts/0, PID 3361747, started 15:30:16Z — likely operator-present)
  triggered the big passes; wake-cron sessions (including the 15:45Z waking itself) write
  into the same git dir and can sustain the loop alone.

## Why nothing alerted before ENOSPC

Same standing finding as `disk-pressure.md`: nothing on the host alerts on disk fill.
Detection surface was waking `df` (~6h blind max) — and % had been "stable band" for
weeks, so the first alertable signal was this waking's own df. **At 5.7GB/min the waking
cadence is far too slow** — this fault class can go 0→full between wakings.

## Emergency procedure (what worked, in order)

1. **Alert the operator first** (`./notify.sh`) — seconds matter and the operator may be
   at the terminal (it was: interactive session on pts/0).
2. **SIGSTOP, don't kill or delete.** Stop the git writers, then the spawner
   (`opencode serve --service` daemon — it respawns git children within seconds):
   `kill -STOP <git-pids> <serve-pid>`. Fully reversible; no data destroyed; the
   operator's interactive session survives (its UI hangs while the serve is stopped).
3. **Verify freeze with a timed du**: `du -sB1` the store, wait 45–60s, du again → 0MB
   growth = frozen. Re-check `df`.
4. **Watch for respawn** (new `git --git-dir …/snapshot/…` in state `R`) — after the
   harness restart a NEW serve daemon (3387720) had already spawned a fresh writer;
   stop writer + new spawner the same way.
5. **Do not delete store content unilaterally** (rule 4): it is derived but unique
   history; pruning is the operator's call. Leave everything SIGSTOP'd and hand off.

## Respawn-loop lesson (learned 15:50–15:52Z)

Stopping a serve daemon is NOT sufficient: the parent opencode session detects its dead
service and **respawns a fresh `serve --service` within seconds, which immediately
spawns a new git writer** (observed twice: 3387720→3387875, then 3389344→3389515 — each
cycle burned disk before re-stop). The stable freeze point is the **parent session
itself**: `kill -STOP <interactive-opencode-pid> <serve-pid> <git-pids>`. After stopping
3361747 + 3389344 + 3389515, growth was 0MB over 50s and stayed frozen.

## Handoff state at 15:53Z (for the operator / next waking)

- Stopped (SIGSTOP, `T` state, ALL reversible — SIGCONT or kill resumes/cleans):
  interactive session **3361747**, its serve daemon **3389344**, git writers
  **3377403, 3386464, 3387875, 3389515** (orphaned gits reparent to PID 1 while stopped).
- The interactive session will appear hung until SIGCONT — expected, disclosed via
  Telegram (2 urgent notifies sent 15:47Z + 15:49Z, delivery rc=0).
- Disk: 93G used / ~860M free (100%) — stable with writers frozen; normal small writes
  (journal, syslog, peer inbox) still trickle in. Peer servers + cron + tailscaled
  verified healthy at 100%.
- Fix options for the operator (all theirs): prune the runaway store content (garbage
  from self-inclusion passes — object packs written 15:42–15:52Z and possibly earlier
  same-day), then SIGCONT or SIGKILL the stopped set; longer term, relocate the
  snapshot store outside the work-tree or exclude `.local` from snapshotting (opencode
  config), so self-inclusion is impossible.

## RESOLVED 2026-10-27 (operator reboot ~16:21Z; incident closed)

The operator resolved the incident between 15:53Z and 16:21Z by rebooting the host
(two reboots in quick succession: boot -1 16:04:48→16:19:05Z, boot 0 16:21:02→current):
the snapshot store was pruned from ~35GB to **1.8GB** (verified 2026-10-27T21:45Z),
disk back to **64% (59G used / 34G free)**, and the stopped PIDs (3361747, 3389344,
3377403, 3386464, 3387875, 3389515) cleared by the reboot (SIGSTOP state does not
survive a reboot). Post-resolution verification at the 21:45Z waking: snapshot store
delta 0MB over a 5s window, no `git --git-dir …/snapshot/…` writers running, all 11
peer health endpoints HTTP 200, cron intact, kernel 7.0.0-38 unchanged,
`/var/run/reboot-required` absent. The interactive session the freeze hung was not
observed post-reboot (killed by the reboot, not SIGCONT'd). Journal reset to 1G
(fresh boot). No recurrence in the ~5.5h since the operator reboot. Longer-term fix
(relocate store outside work-tree or exclude `.local` from snapshotting) — status
not confirmed; watch for recurrence at subsequent wakings.

## Spot-faster checks (next waking / any waking)

- `df -h /` **first thing**, before anything else — treat any jump vs last entry as an incident.
- `sudo du -sBM ~/.local/share/opencode/snapshot` — baseline ~35GB frozen 2026-10-27;
  any regrowth = loop resumed (check `ps -eo stat,args | grep 'git --git-dir.*snapshot'`).
- Load with no corresponding build + high CPU `git` = snapshot churn signature.
- If disk is filling fast and no operator is present: repeat the SIGSTOP ladder above.
