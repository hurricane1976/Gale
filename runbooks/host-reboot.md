# Host reboot between wakings — detection side

## Incident class

gale-agent reboots between Levante wakings. First observed 2026-10-22:
clean reboot at 16:34:20Z (previous boot ended 16:33:56Z after ~3d 22h),
initiated by the `agent` user via `sudo /usr/sbin/reboot` (auth log:
`sudo[2936667]: agent : TTY=/dev/pts/0 ; PWD=/home/agent ; USER=root ;
COMMAND=/usr/sbin/reboot`), preceded at 16:30:12Z by an
`agent`-requested `apt-get dist-upgrade` (~40 pkgs). Reads as the host's
primary agent (gale/agent) doing package maintenance + reboot. Not
announced in the peer inbox; all 13 local peer_servers auto-restarted
16:36Z via cron; no roster or sweep loss (35/35 up at next waking).

## Why it matters

A host reboot briefly drops all 14 local peer servers and any peer links
routing through this host; remote peers see connection failures in that
window. Also: an *agent*-initiated host-wide action is different in kind
from an unattended-upgrade — worth one line to the operator, not silence.

## Cheap check (per waking, <5s)

    uptime    # if up < ~5.5h on a 6h schedule -> reboot happened between wakings
    who -b    # exact boot time

If reboot detected:

1. `sudo journalctl -b -1 -n 40 --no-pager` — clean shutdown sequence
   ("Reached target reboot.target", filesystem sync) vs crash/panic/OOM.
2. `grep "sudo.*COMMAND=/usr/sbin/reboot" /var/log/auth.log` + prior boot's
   journal — who triggered it and from which working directory
   (PWD reveals which agent's workspace).
3. `ps aux | grep -c "[p]eer_server.py"` — expect 14 (gale/agent + 13
   siblings incl. levante... see note); all restarted via cron within
   ~2min of boot is healthy.
4. /health + /roster self-check; run the fleet sweep as usual and confirm
   35/35.

## Threshold to catch sooner

Any waking with uptime < 5h 30m = reboot between wakings -> record boot
time, initiator (from auth log), clean/crash, and peer-server recovery
time in NOTES.md the same waking. A *second* unplanned reboot inside 24h
or a non-clean shutdown (no reboot.target in prior boot's journal) ->
flag to operator via notify.sh, not just NOTES.

## Recovery half

Owner's own (gale/agent runs the host maintenance; remote peers own their
send-retry behavior). Levante owns only the record + fleet picture.

## Note

AGENT.md's intro lists "twelve co-located siblings" but the host runs 13
sibling peer_servers + levante (poniente, paired 2026-09-26, port 8800,
is the one missing from that list). Registry (34 peers.env entries) is
correct; only the AGENT.md prose is stale. Not edited (sits adjacent to
protected sections; leave prose to the operator).
