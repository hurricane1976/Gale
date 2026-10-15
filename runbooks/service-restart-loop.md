# Service restart loop — netbox (venv interpreter dangling after OS upgrade)

## Fault class

A systemd service with `Restart=on-failure` + short `RestartSec` whose
executable's interpreter disappears in an OS upgrade loops forever on
203/EXEC. It never settles into `failed`, so **`systemctl --failed` shows
nothing** — detection is journal-side only.

## Instance (found 2026-10-13T15:45Z waking)

- `netbox.service` (gunicorn WSGI, bind 127.0.0.1:8000, user=agent,
  `/opt/netbox-src/netbox`, EnvironmentFile=/etc/netbox/env). Host-inventory
  item never recorded by a prior waking (venv mtime Sep-25); served 302s on
  Oct-07, so it was live and healthy until at least then.
- **Broken by the 2026-10-11 ~19:47Z host reboot** (same boot as kernel
  6.8.0-142 → 7.0.0-38, i.e. an OS upgrade). Last clean stop 19:45:51Z;
  first `203/EXEC` 19:47:21Z; every start since fails the same way.
- Root cause: `/opt/netbox/venv/bin/gunicorn` shebang →
  `venv/bin/python` → `python3.12` → `/usr/bin/python3.12`, which the
  upgrade **removed** (system python is now `python3.14`). Dangling
  symlink → ENOENT at EXEC → 203/EXEC. `gunicorn` itself exists; testing
  it directly returns "not found" via the missing interpreter.
- Loop pressure: `RestartSec=5` → **NRestarts=30272** since the boot,
  ~99k journal lines/24h — the plausible driver of the journal drift
  1.5G→1.6G seen in the same window.

## What should have alerted / what actually did

- Nothing host-side alerts on restart loops. `systemctl --failed`: clean
  (unit is "activating (auto-restart)", not failed). Journal `-p err` sweep
  at waking caught it (5 lines visible in a 1-min tail alone, ~5s cadence).
- Detection latency ~2 days (reboot Oct-11 19:47Z → found 15:45Z Oct-13),
  bounded by waking cadence + the journal sweep being part of the routine
  only since recently.

## Spot it faster

- `journalctl -p err --since -1h | grep -c 'Failed at step EXEC'` — any
  nonzero for a service you don't recognize = look immediately.
- `systemctl show <unit> -p NRestarts` — 4-digit+ on an up-to-days host =
  loop.
- `head -1 <ExecStart binary>` + check the shebang interpreter exists —
  "No such file or directory" on an existing binary = interpreter, not the
  binary.

## Fix options (operator's call — root/system changes, not agent-side)

1. Reinstall python3.12 (dead snake on the new release; reinstalls would
   be unofficial).
2. Rebuild the venv against python3.14 (venv is root-owned; netbox deps
   must be re-pinned).
3. `systemctl disable --now netbox` if netbox is unused — stops the loop
   and the journal noise instantly.
4. Belt-and-suspenders regardless: journal retention cap (the standing
   ASK.md retention request covers this too).

## RESOLVED 2026-10-15 (found at the 15:45Z waking)

Option 3 was taken by the operator between 15:45Z Oct-14 and 15:45Z
Oct-15: unit is `disabled` + `inactive (dead)`, NRestarts counter reset to
0, not present in `multi-user.target.wants`. Exact stop time not datable —
the journald vacuum (journal 2.0G → 202M) removed the netbox entries, and
`ExecMainExitTimestamp` is empty post-disable. Journal drift watch closed:
the 2.0G→202M drop confirms the loop was the drift driver. Lesson stands:
`systemctl --failed` never showed this unit ("activating (auto-restart)"
never settles to failed) — sweep `journalctl -p err` / unit restart
counters, not just --failed.
