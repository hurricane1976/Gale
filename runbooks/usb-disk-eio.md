# Runbook: EXT4 EIO from a dead USB-attached disk (stale mount)

**Class:** Host-level fault injection — none needed; this was a real fault, attributed 2026-09-27T00:40Z.

## What actually happened

- 2026-09-26T01:01:38Z — a 2TB Samsung 970 EVO Plus in a USB enclosure was
  attached (`usb-storage 1-1:1.0`), kernel saw `sda` + `sda1`/`sda2`; the
  ext4 on `sda2` was mounted at `/mnt/usb-disk`.
- 2026-09-26T01:21:12Z — **USB disconnect while still mounted** (device
  number 3 removed). Kernel aborted the ext4 journal on `sda2-8`, logged
  `device offline error` + lost page writes. `/dev/sda*` disappeared from
  the device tree but the mount at `/mnt/usb-disk` went **stale** (still in
  `/proc/mounts`, device gone).
- Every `find`/`grep`/`ls` that traverses `/mnt/usb-disk` now logs an
  `EXT4-fs warning (device sda2): error -5 reading directory block`
  (inode #2, EIO). Observed 2026-09-26 04:17, 07:46, 18:46, 18:48 (comm
  grep), 20:17, 20:18, 23:21 — 7 total. All on `sda2`.

## Attribution (the procedure that mattered)

The scary-looking signature — repeated `EXT4-fs error -5` at **inode #2**
(the filesystem root inode) — looks like root-disk corruption. It is not,
because the device string in the message names the fs: `sda2`, not the
LVM root. Checks that resolved it, in order:

1. `df -h /` + `findmnt` → root is `/dev/mapper/ubuntu--vg-ubuntu--lv` on
   **`nvme0n1p3`** (native NVMe), not sda. All agent state lives on this fs.
2. `journalctl -k -b | grep -iE 'usb|sda'` (excluding EXT4 lines) → shows
   attach 01:01:38Z, **disconnect 01:21:12Z**, journal abort, device-offline
   errors — the full lifecycle in one grep.
3. `lsblk` / `cat /proc/partitions` → sda absent → device really gone.
4. `grep sda /proc/mounts` → stale mount still present → why scanners EIO.
5. `smartctl -H /dev/nvme0` → **PASSED** (0% used, 100% spare, 29C) —
   root disk healthy. (smartmontools was installed 2026-09-27 for this;
   it wasn't present before. smartctl on `/dev/sda` fails with "No such
   device" — consistent with the detached device.)
6. Repro on demand: `ls /mnt/usb-disk` → `Input/output error`. Non-repro
   in 30× `ls /` / `find / -maxdepth 1` (0 hits) — the fs root itself reads
   fine; only the stale mount fails.

## What should alert vs what did

- **Should alert:** a device disappearing while mounted is host-visible.
  Nothing on this host alerts on it; detection was by agent waking cadence
  (~23h from disconnect 01:21Z to attribution 00:40Z next day, because the
  two earlier wakings 12:40Z/18:40Z read the events as "disk errors" and
  tracked a count without checking *which device* — the count grew from 2
  to 7 before attribution).
- **Spot faster:** never count EXT4 messages without the device name.
  `journalctl -k -b | grep 'EXT4-fs' | awk '{print $NF}'`-style device
  filtering, or grep the device string: root-fs errors would say
  `dm-0`/`ubuntu--vg`/`nvme0n1p3`; anything else is an auxiliary disk.

## Second event: re-attach flake storm (2026-09-27 14:20–14:40Z, observed 18:40Z)

The disk came back the same day under operator control, and the
attachment itself was unstable — a different failure signature worth
knowing:

- 14:20:28Z — USB hub + peripherals appear (Bridgesil USB2.1/USB3.2 hub,
  Identive SCR33xx smart-card reader, Logitech receiver): operator at the
  physical console. udisksd active (desktop session).
- 14:26:02Z — the 2TB disk re-attaches, now enumerated **`sdb`** (came
  through the new hub chain; device letter is NOT stable across
  attachments). Partitions: `sdb1` FAT, `sdb2` ext4 label **"backup"**,
  `sdb3` ext4 (UUID d3717808…). udisksd auto-mounted `sdb3` at
  `/media/agent/<uuid>` as uid 1000.
- 14:28:19Z — `device offline error, dev sdb, sector 0 (WRITE)` → EXT4
  **shut down `sdb3`** (`shut down requested (2)`), journal aborted,
  udisksd cleaned the mount. Disk re-enumerated ~6s later; `sdb2`
  auto-mounted at `/media/agent/backup 2`.
- Further dropoffs 14:33–14:37Z (journal recovery + re-mount, unmount,
  partitions vanish, re-attach, cache-sync failures). 14:40:02Z —
  operator **unplugged the hub**; trailing `FAT-fs (sdb1) unable to read
  boot sector` + cache-sync errors. Disk gone; `/media/agent` empty by
  14:40Z.
- Net: 3+ bus dropoffs in 14 minutes. Whatever the cause (enclosure,
  cable, hub, power), this attachment path is **flaky and not yet
  trustworthy as a backup target**. The `backup` label says intent; the
  behavior says test again after hardware triage (different port/cable,
  no hub, or direct attachment).

## What should alert vs what did (event 2)

- Repeated attach/detach cycles are visible in `journalctl -k | grep -E
  'sd[a-z].*Attached|usb.*disconnect'` — nothing alerts; found by waking
  review at 18:40Z (same ~4h detection gap as event 1).
- `sda` vs `sdb`: same physical disk can enumerate under different
  letters through different hub chains. **Never key any check on the
  device letter** — key on size/vendor/UUID. (Event 1 = sda, event 2 =
  sdb, both 2.00TB.)
- Stale-mount lesson held: the OLD stale mount (`sda2` at
  `/mnt/usb-disk`) is unrelated to the new `sdb` work; don't conflate
  them when grepping EXT4 errors.

## Open item (operator decision, flagged via notify 2026-09-27)

- The stale `/mnt/usb-disk` mount is left in place (operator hardware,
  attached/detached manually; no fstab/cron/agent references it). It
  poisons broad `find`/`grep` scans with EIO noise and will block a clean
  re-mount. Recommended when convenient: `sudo umount /mnt/usb-disk`, and
  on re-plug run `sudo fsck -f /dev/sda2` before mounting — the journal
  was aborted mid-write at disconnect, so the fs likely needs recovery.
- If the disk was intended as an offsite/backup target, event 2
  (2026-09-27) confirms intent — partition `sdb2` is labeled **"backup"**
  — but the attachment dropped off the bus 3+ times in 14 minutes, so it
  is not yet a reliable target. Flagged to the operator with the
  event-2 timeline.

## Risk to fleet state

None found. Root fs (all 14 agents' state) is on the healthy native NVMe;
`git fsck --strict` clean on the live repo at attribution time; backups +
offsite push unaffected (drills same waking: restore round-trip OK,
offsite clone byte-identical, remote head == local HEAD).
