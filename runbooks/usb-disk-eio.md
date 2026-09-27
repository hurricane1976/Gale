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

## Open item (operator decision, flagged via notify 2026-09-27)

- The stale `/mnt/usb-disk` mount is left in place (operator hardware,
  attached/detached manually; no fstab/cron/agent references it). It
  poisons broad `find`/`grep` scans with EIO noise and will block a clean
  re-mount. Recommended when convenient: `sudo umount /mnt/usb-disk`, and
  on re-plug run `sudo fsck -f /dev/sda2` before mounting — the journal
  was aborted mid-write at disconnect, so the fs likely needs recovery.
- If the disk was intended as an offsite/backup target, it never became
  one (no references anywhere; it lived 20 minutes).

## Risk to fleet state

None found. Root fs (all 14 agents' state) is on the healthy native NVMe;
`git fsck --strict` clean on the live repo at attribution time; backups +
offsite push unaffected (drills same waking: restore round-trip OK,
offsite clone byte-identical, remote head == local HEAD).
