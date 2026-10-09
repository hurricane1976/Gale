# Runbook: reboot-required flag (kernel update pending)

## Class

Host kernel/initramfs updated by unattended upgrade; running kernel is older
than the installed one. Flag file `/var/run/reboot-required` (+ `.pkgs`) is
written by apt. Host keeps running fine until rebooted — but the running
kernel no longer matches disk state, and pending CVE fixes are dormant.

## Expected alert / detection

- Flag check is part of Squall's per-waking drill-lens health sweep
  (`ls /var/run/reboot-required`). Detection latency is bounded by waking
  cadence (~6h max at the :54 cron).
- Nothing else on the host alerts on this flag. Operator sees nothing
  unless an agent reports it.

## Observed (real occurrence, not injected)

- 2026-09-23T14:08Z: flag written by unattended upgrade —
  `linux-image-5.15.0-194-generic`, `linux-base`. First occurrence in
  Squall's log (all prior wakings 09-21..09-23 noted "no reboot-required").
- Detected same day at the 18:54Z scheduled waking (~5h latency).
- Uptime 2d6h58m at detection; no misbehavior observed on any sibling peer.
- 2026-09-24T00:54Z (second waking with flag live, ~11h old): still pending.
  Confirmed the mismatch concretely — running `5.15.0-191-generic` vs
  installed `5.15.0-194.204` (dpkg `ii`, boot not happened). Flag content
  unchanged, no `.pkgs` growth (single upgrade event, not a stream).
  Unit inventory enumerated for the post-reboot checklist: 10 `*-peer`
  services (gale, zephyr, squall, tempest, vortex, chinook, cyclone,
  maistral, sirocco, bora) + `tailscaled`, all active-running; crontab
  carries wake.sh (:50-:58 offsets) + `*/5` telegram pollers for every
  agent. All of these come back via systemd/cron automatically; the
  operator-side cost is only the dead window during reboot.

## Response path (agent side)

1. Record it in NOTES.md under the drill-lens health line, with `.pkgs`
   contents and flag mtime.
2. Tell the operator via `./notify.sh` — reboot is **never agent-initiated**:
   it kills all co-resident agents (gale/zephyr/tempest/vortex/cyclone/
   maistral/sirocco/bora/chinook peers + wake crons) simultaneously and
   requires coordination (ideally just after a set of completed wakings,
   before the next).
3. Do NOT schedule, script, or "just do it" — rule 4 territory (affects
   every agent's live state; the only mitigations are backups+offsite,
   which exist, but coordination is the operator's call).

## What recovery looks like (rehearsed for real 2026-09-25)

- **ACTUAL reboot occurred 2026-09-25T14:58Z** (operator window — ~2h after
  Squall's 12:40Z waking, ~3h42m before the next at 18:40Z; no squall cron
  fire fell inside the dead window since squall wakes only fire at
  :40 of 0,6,12,18). Flag file gone after reboot. Running kernel went
  5.15.0-191 → **6.8.0-142-generic** (grub booted the installed HWE 6.8,
  not the pending 5.15.0-194 — both were on disk; newer-than-pending is
  fine, but note `uname -r` may jump past the `.pkgs` version).
- Post-reboot verification at the 18:40Z waking — prediction CONFIRMED:
  - tailscaled, cron, squall-peer all active; squall wake cron fired 18:40:01
    (this waking is cron-fired) and the `*/5` telegram poller resumed
    (fires logged in /var/log/syslog at 18:35/18:40; no post-boot failures —
    the stale `logs/telegram_commands.log` mtime Sep-24 17:10 is a transient
    Sep-24 network blip, NOT the reboot window).
  - All sibling `*-peer` units returned active: gale, zephyr, tempest,
    vortex, chinook, cyclone, maistral, sirocco, bora, tramontane, **ostro
    (new, port 8798 — host inventory now 12 agents)**; health OK on all 11
    sibling ports + squall 8789 via tailscale IP.
  - Inbox resumed delivery (58 msgs 12:47–18:40Z, processed this waking);
    offsite in sync (remote `squall` head == local HEAD a4f4336); backup +
    restore drill clean post-reboot.
  - Agent state is files-only (NOTES/keys/repo) — nothing lost. Git gc note:
    the 12:42Z `git gc --auto` pack (5.4M) made this waking's backup 5.7M
    vs the usual ~450K — benign, expected once history packs; don't read
    backup-size jumps as anomalies without checking `.git/objects/pack/`.
- Reboot is operator-coordinated and happened; runbook class closes unless
  a new flag appears (fresh `.pkgs` = new pending kernel = re-open).

## Flag event 2 — desktop packages (2026-09-27, still open 2026-09-28)

- New flag 14:12Z Sep 27; `.pkgs` = gnome-shell, evolution-data-server
  (desktop packages, NOT kernel — running 6.8.0-142 remained current, no
  `uname -r` mismatch this time; the reboot is cosmetic/server-hygiene).
- Second waking with flag live (00:40Z Sep 28): mtime + `.pkgs` unchanged
  (same single event, not a stream). Operator-gated as always.
- Same-window host change (read-only observation): operator installed a
  log-observability stack 15:45Z Sep 27 — `loki` 3.7.8, `promtail` 3.6.11,
  grafana-server, nginx, all active. Loki data dir `/var/lib/loki` (54M at
  first check) now grows alongside journald — include it in disk-creep
  attribution going forward.

## Spot it faster

- `cat /var/run/reboot-required.pkgs` — tells you *why* without apt.
- `uname -r` vs `dpkg -l linux-image-*` mismatch = same signal, flag absent.
- If flag mtime is hours old and no agent logged it, the sweep missed a
  waking — check `wake.sh` alert log.
## Flag event 2 — RESOLVED by reboot (2026-09-28T15:33Z, second host reboot)

- Operator rebooted the host 15:33Z Sep 28 (~5.3h after the flag's 14:12Z
  Sep-27 first sighting; flag was live for 4 agent wakings). Kernel after:
  still 6.8.0-142-generic — confirms the desktop-package read (gnome-shell,
  evolution-data-server were the pending set; no kernel change).
- Post-reboot verification at the 18:40Z waking (full checklist re-run):
  flag GONE (`/var/run/reboot-required*` absent); all 13 sibling peer units
  + tailscaled + cron active; all sibling health endpoints + squall 8789 OK
  via tailscale IP; `*/5` telegram pollers + all wake crons intact in
  crontab; inbox delivery resumed; offsite push resumes at close; backup +
  restore drill clean post-reboot. No missed squall wakings (12:40Z fired
  pre-reboot, 18:40Z fired post; the 15:33Z reboot falls between cron
  slots — zero dead-window wakings this time).
- Side effect worth recording: the stale `/mnt/usb-disk` (sda2) mount from
  Sep-26 was cleared by the reboot (no fstab entry to remount it) — the
  ASK.md umount question is moot; the sda2 EXT4-noise watch is closed with
  it. USB-disk item now reduces to: fsck -f on its partitions if/when the
  operator re-attaches it (attachment path was flaky Sep-27; still not a
  trusted backup target).

## Flag event 3 — kernel again (2026-10-09, OPEN)

`/var/run/reboot-required` back at mtime 06:36:02Z Oct-9 (detected 09:45Z
waking, latency ~3h — within the waking-cadence bound). `.pkgs` =
linux-image-6.8.0-146-generic, linux-base. Running kernel 6.8.0-142.
Same shape as flag event 1 (pending kernel upgrade); reboot operator-gated,
flagged via notify this waking. Post-reboot checklist (below, rehearsed
twice for real) applies unchanged.
