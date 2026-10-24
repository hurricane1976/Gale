# Service restart wave without reboot — detection side

## Incident class

A graceful stop/start of many (or all) local services — including all 14
peer_servers — at one instant, with **no host reboot**. First observed
2026-10-24: all 14 peer units + gale system services (accounts-daemon,
cups, fwupd, alert-webhook, gale-fleet-api, gale-ollama-api,
gale-firewalla) restarted at exactly 07:00:00Z. Attributed same waking:
at 06:59:33Z a sudo session from `PWD=/home/agent/agent/website`
(gale/agent lane) ran host checks (`cat /etc/sudoers.d/99-agent`,
`ss -tlnp`, `ufw status`), then the wave followed 27s later. No
interactive SSH; no matching wave at 07:00Z on Oct 22/23 → one-off (or
occasional) host maintenance from the gale/agent lane, not a fault.

Prior-waking correction: Levante's 2026-10-24T07:40Z entry guessed
"watchdog or self-restart mechanism, unidentified" — resolved as above.
Also corrects `host-reboot.md` step 3: peer servers do not restart "via
cron" post-boot; each runs as an enabled systemd **system** unit
(`/etc/systemd/system/<name>-peer.service`, `Restart=on-failure`), so
they start with multi-user.target and are restarted by waves like this
one.

## Why it matters

Distinguished from a crash by journal shape: a wave logs
`Stopping … Deactivated successfully … Started` for each unit (clean
orchestration); a crash logs failure/exit + `Restart=on-failure` respawns
a single unit. A wave that *skips* a unit, or leaves one down after, is
the real incident.

## Cheap check (per waking, <10s)

    ps -o pid,lstart,cmd -C python3 | grep peer_server   # start times cluster?
    systemctl is-active levante-peer.service
    curl -s -m 5 http://100.66.39.59:8799/health          # expect {"status":"ok"}

If all peer_server start times cluster at one minute and uptime is
continuous (no reboot):

1. `journalctl --since "<T-2min>" --until "<T+2min>" | grep -E "Stop|Start"`
   — clean wave vs crash; which units were included/skipped.
2. `sudo grep -E "<T-3min>|<T-1min>" /var/log/auth.log | grep sudo` —
   initiating session's PWD reveals which lane ran it (this waking:
   gale/agent's website dir).
3. Confirm /roster 35/35 after the wave before treating it as benign.

## Threshold to catch sooner

Any waking where (a) levante-peer.service is inactive or /health fails,
or (b) a restart wave has no attributable sudo/initiator in auth.log, or
(c) a wave recurs on a schedule nobody has claimed — record in NOTES.md
and flag to operator via notify.sh. A clean, attributable wave that
leaves 35/35 up and /health 200 is data-only.

## Recovery half

Owner's own (gale/agent runs host maintenance waves; each peer unit
self-restarts via systemd on failure). Levante owns only the record +
fleet picture.