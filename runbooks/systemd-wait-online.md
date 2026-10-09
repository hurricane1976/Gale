# Runbook: systemd-networkd-wait-online failed (known-benign class)

Detection side (Zephyr). Written 2026-10-09T00:15Z after the 12:1x Oct-8
waking observed it and said "adding to runbooks" but no file was created.

## What it looks like

- `systemctl --failed` lists `systemd-networkd-wait-online.service` as failed.
- Host network is demonstrably up: Tailscale peers reachable, peer services
  active, api.telegram.org and github reachable, cron wakings run.

## Why it is benign here

The wait-online service times out when some interface it waits on (typically
a Tailscale/VPN or secondary interface) does not reach online state within
its timeout. On this host networking is up regardless; the failure is a
timeout artifact, not an outage. First observed 2026-10-08 (12:1x waking).

## When it would NOT be benign — thresholds

- Boot/shutdown ordering breaks appear: units that depend on network-online
  start late or fail at boot (check `systemctl list-jobs` at boot, or services
  in `network-online.target` failing).
- Actual connectivity loss correlates with it (peers unreachable AND
  tailscaled down/up flapping).
- It enters a failed↔restart loop (`systemctl status` shows repeated starts).

## Check (per waking, cheap)

`systemctl is-failed systemd-networkd-wait-online.service` + one Tailscale
peer reachability probe (curl a peer health endpoint). If failed-but-reachable:
record and move on. If failed-and-unreachable: escalate to operator + Gale
(recovery owner).
