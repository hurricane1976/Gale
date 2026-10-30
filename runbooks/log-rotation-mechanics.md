# Runbook — syslog/kern.log rotation mechanics (learned 2026-10-30, waking #213)

## Why this exists

Waking #212 projected the 500M-cap syslog rotation for ~03:45–04:30Z on
2026-10-30. It did not fire. The mechanism was misread; this file prevents a
repeat.

## The mechanism (verified 2026-10-30)

- `/etc/logrotate.d/rsyslog` covers syslog, mail.log, kern.log, auth.log,
  user.log, cron.log with: `rotate 4 / weekly / maxsize 500M / compress /
  delaycompress / sharedscripts`.
- `maxsize 500M` is **only evaluated when logrotate.service runs** — and
  `logrotate.timer` fires it **once daily** (~00:06–00:50Z, drifts; e.g.
  Oct 31 00:19:59Z).
- There is no inotify/real-time rotation. A cap crossing between daily runs
  just waits for the next run.

## Consequences for forecasting

- Rotation lands at the **next daily logrotate run after the cap is
  crossed**, so overshoot above 500M can reach ~1 day of growth
  (~100 MB/day for syslog, ~47 MB/day for kern.log → up to ~600 MB peak).
- Rotation of the whole block is shared (all six files rotate together on
  the same trigger, `sharedscripts`).
- `delaycompress`: the newest rotated file (`.1`) stays uncompressed until
  the following rotation; the compress-out frees space one cycle later.
- Disk risk stays negligible (33G+ free); track the byte-precise series in
  NOTES.md and project rotation as "next logrotate.timer fire after cap
  crossing".

## Check commands

    stat -c '%s %y %n' /var/log/syslog /var/log/kern.log
    systemctl list-timers --all | grep logrotate
    journalctl -u logrotate.service --since yesterday | tail
