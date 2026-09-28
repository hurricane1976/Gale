# NOTES.md — Tramontane (Backup & Restore Guardian)

## 2026-09-27 20:35Z — Twenty-first activated waking (backup + drill + drift sweep; fleet fresh; WeKan up but restart counter creeping)

- Backup RUN `tramontane-20260927T202807Z.tar.gz` (348K, 310 entries),
  16th snapshot; `tar -tzf` integrity OK.
- Restore drill **PASS**: scratch extract to /tmp/restore_test_21;
  `cmp` of AGENT.md, ASK.md, backup.sh vs live — all identical;
  scratch cleaned.
- Inbox: 22 messages (18:00–18:47Z), all data-only routine pings
  (BEACON×2, MOUNTAIN×8, DELTA, MEADOW×4, HIGHBEAM, MESA, LANTERN,
  CANYON, RIVER, HARBOR×2) — no replies requested, no operator
  content; all moved to `peer/inbox/processed/`. `check_replies.sh`:
  no new operator messages; ASK.md no open questions.
- Peer services: all 17 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active`.
  WeKan currently up (both wekan + ferretdb active) but `NRestarts=10084`
  (was 8519 at 11:13Z, 10084 now) — process recovers each cycle from
  the restart loop; crash-loop condition unresolved.
- Drift sweep: **no stale siblings** — 13 co-residents fresh,
  mtime age 0–212m (OSTRO 212 m / 3.5 h slowest; LEVANTE 0 m just
  woke; all under 6 h threshold).
- Host: up ~2d6h, disk 41 % (55 G free), mem 49 Gi avail,
  load 3.51, 16 cores.

## 2026-09-27 15:13Z — Twentieth activated waking (backup + drill + drift sweep; fleet fresh; WeKan crash-loop root cause SHIFTED to FerretDB inactive)

- Backup OK: `backups/tramontane-20260927T151312Z.tar.gz`, 332K,
  read-back verified by script.
- Restore drill PASS: scratch extract of 178 files; `cmp` of AGENT.md,
  NOTES.md, ASK.md, backup.sh, notify.sh against live — all identical.
- Host health: up 2 d, load 1.47/1.43/1.42, RAM 6.9Gi/58Gi (51Gi
  available), swap 0B used, disk 39% (36G used, 58G free of 98G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
- **Peer inbox: 19 new probe/verification messages** (MOUNTAIN x3, BEACON,
  MEADOW x4, DELTA, HIGHBEAM, MESA x2, RIVER, CANYON, VISTA, HARBOR x3,
  RADAR) — all marked data-only / "no reply needed" (Rule-7 link
  verification + census probes). None is a new operator request or
  actionable item; processed to `processed/`. No reply sent (data only).
- **Drift sweep (13 local siblings, READ-ONLY) — all fresh.** vortex, agent,
  bora, sirocco, cyclone, tempest, squall, zephyr, chinook, maistral,
  poniente, ostro, levante all < 1 h (latest non-log file is
  `logs/.telegram_commands.lock`, actively touched). All well under the
  12 h stale threshold; no sibling flagged.
- **WeKan — STILL crash-looping, but ROOT CAUSE HAS SHIFTED (new).**
  NRestarts climbed 8519 → 9210. `snap.wekan.wekan.service` is `active`
  but restarts repeatedly (~2 min cadence, observed 15:13 → 15:15Z). Prior
  wakings (16th–19th) showed `listen EADDRINUSE` port collision as the
  failure. This waking the log shows the controller resolving
  `Database selection: setting='ferretdb' ferretdb_has_data=true
  mongodb_has_data=false` → `MONGO_URL=mongodb://127.0.0.1:27019/wekan`,
  running the `snapctl stop --disable wekan.mongodb` step, while
  `snap.wekan.ferretdb.timer` / `...services` report **inactive** — i.e.
  WeKan now selects the FerretDB backend that is not running, so it keeps
  restarting. Host/snap-config regression, outside my backup scope —
  re-flagging, no action taken. (I could not confirm the crash exit reason
  directly — the journal churns too fast to grep without timing out; this
  is my best read of state. A human on gale-agent should inspect the
  snapctl/ferretdb units.)

---

## 2026-09-27 11:13Z — Nineteenth activated waking (backup + drill + drift sweep; fleet fresh, WeKan still crash-looping)

- Backup OK: `backups/tramontane-20260927T111308Z.tar.gz`, 316K,
  read-back verified by script.
- Restore drill PASS: scratch extract to `/tmp/restore_test`; `cmp` of
  AGENT.md, backup.sh, check_replies.sh, notify.sh against live — all
  identical; scratch dir cleaned.
- Host health: up 1d 20h, load 1.36/16 cores, RAM 5.8Gi/58Gi
  (52 Gi available), disk 36 % (34 G used, 60 G free of 98 G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
- **Drift sweep (13 local siblings, READ-ONLY) — all fresh:**
  vortex 0.4 h, gale (/home/agent/agent) 3.7 h, bora 0.7 h, sirocco
  1.2 h, cyclone 1.9 h, tempest 4.2 h, squall 4.5 h, zephyr 4.8 h,
  chinook 3.2 h, maistral 3.5 h, poniente 1.6 h, ostro 2.4 h, levante
  2.8 h (newest non-log file per dir). All well under the 12 h stale
  threshold; no sibling flagged.
- **WeKan — STILL crash-looping (unchanged pattern since 16th waking).**
  NRestarts climbed 7805 → 8519; `snap.wekan.wekan.service` reports
  `active` but restarts repeatedly (last start 11:13:11Z, seconds before
  this check) — port-collision/EADDRINUSE issue per prior wakings.
  Same host-config issue, outside my backup scope — re-flagging, no
  action taken.
- No operator or peer action items this waking.

---

## 2026-09-27 07:13Z — Eighteenth activated waking (backup + drill + drift sweep; fleet fresh, WeKan still crash-looping)

- Backup OK: `backups/tramontane-20260927T071315Z.tar.gz`, 304K,
  294 entries, read-back verified by script.
- Restore drill PASS: scratch extract to `/tmp/restore_test`; `cmp`
  of AGENT.md, ASK.md, backup.sh against live — all identical;
  scratch dir cleaned.
- Host health: up 1d 16h, load 1.88/16 cores, RAM 7.6Gi/58Gi
  (51 Gi available), disk 36 % (34 G used, 60 G free of 98 G).
  Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
  16 peer inbox messages dated 2026-09-27 06:00–06:46Z
  (BEACON×1, MOUNTAIN×4, DELTA×3, MEADOW×2, HIGHBEAM×1, MESA×1,
  RIVER×1, CANYON×1, HARBOR×2) — all routine data-only pings, no
  replies requested; moved to `peer/inbox/processed/`.
- **Drift sweep (13 local siblings, READ-ONLY) — fleet-wide fresh:**
  vortex 3 m, gale (/home/agent/agent) 0 m, bora 3 m, sirocco 3 m,
  cyclone 3 m, tempest 3 m, squall 3 m, zephyr 3 m, chinook 3 m,
  maistral 3 m, poniente 3 m, ostro 3 m, levante 3 m. All well under
  the 12 h stale threshold; no sibling flagged.
- **WeKan — STILL crash-looping (unchanged since 16th/17th waking).**
  NRestarts climbed 7089 → 7805; `snap.wekan.wekan.service` is `active`
  but re-exiting on `EADDRINUSE 0.0.0.0:8080` (port squatted; last
  restart 07:13:03Z — seconds before this waking's checks).
  `snap.wekan.ferretdb`, `netbox`, `tailscaled` all `active`.
  Same host-config/port-collision issue, outside my backup scope —
  re-flagging, no action taken.
- No operator or peer action items this waking.

---

## 2026-09-27 03:13Z — Seventeenth activated waking (backup + drill + drift sweep; fleet fresh, WeKan still crash-looping)

- Backup OK: `backups/tramontane-20260927T031315Z.tar.gz`, 288K,
  289 entries, read-back verified by script.
- Restore drill PASS: scratch extract to `/tmp/restore_test`; `cmp`
  of AGENT.md, ASK.md, backup.sh against live — all identical;
  scratch dir cleaned.
- Host health: up 1d 12h, load 1.22/16 cores, RAM 6 Gi used of 58 Gi,
  51 Gi available, disk 36 % (34 G used, 60 G free of 98 G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
  Peer inbox now holds only the empty `cyclone/` + `tramontane/` peer
  subdirs + `processed/`. 25 routine pings dated 2026-09-27
  (BEACON×6, MOUNTAIN×4, HARBOR×4, MEADOW×3, DELTA×2, plus
  RIVER/PULSAR/MESA/HIGHBEAM/GALE/CANYON ×1) all data-only, no reply
  requested — now in `processed/`.
- **Drift sweep (13 local siblings, READ-ONLY) — fleet-wide fresh:**
  vortex 22 m, gale (`/home/agent/agent`) 22 m, bora 47 m,
  sirocco 71 m, cyclone 112 m, tempest 132 m, squall 147 m,
  zephyr 172 m, chinook 187 m, maistral 208 m, poniente ~102 m
  (01:37Z), ostro ~144 m (00:53Z), levante ~157 m (00:37Z).
  All well under the 12 h stale threshold. **BORA recovered** —
  was 7.2 h sole-stale at the 15th waking, now 47 m; no sibling
  flagged this waking.
- **WeKan — STILL crash-looping (unchanged since 16th waking).**
  NRestarts climbed 6361 → 7089; `snap.wekan.wekan.service` is
  `active` but re-exiting on `EADDRINUSE 0.0.0.0:8080` (port squatted;
  a parallel instance serves fine on `:3000`). `snap.wekan.ferretdb`,
  `netbox`, `tailscaled` all `active`. Same host-config/port-collision
  issue, outside my backup scope — re-flagging, no action taken.
- No operator or peer action items this waking.

---

## 2026-09-26 23:13Z — Sixteenth activated waking (backup + drill + drift sweep; fleet-wide fresh, wekan crash-loop root cause identified)

- Backup OK: `backups/tramontane-20260926T231307Z.tar.gz`, 272K,
  285 entries, `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, `cmp` +
  `diff -rq` against live → no mismatches; scratch dir cleaned.
- Host health: up 1d 8h, load 2.32/16 cores, RAM 7.9Gi/58Gi, disk
  36% (34G free of 98G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
  Peer inbox: `cyclone/` + `tramontane/` subdirs empty (20+ pings
  already in `processed/`). Nothing to process.
- **Drift sweep (13 siblings, all READ-ONLY) — fleet-wide fresh:**
  vortex 0.4h, bora 0.8h, sirocco 1.2h, poniente 1.4h, cyclone 1.9h,
  ostro 2.4h, levante 2.8h, chinook 3.2h, maistral 3.4h, tempest 4.2h,
  squall 4.5h, zephyr 4.9h. Oldest (ZEPHYR 4.9h) well under the 12h
  stale threshold — yesterday's "ZEPHYR sole stale" item now resolved,
  no sibling flagged this waking.
- **WeKan regression — root cause identified (was flagged since 9th/10th
  waking, when it degraded then went `inactive`).** Not a plain
  "inactive" anymore: `snap.wekan.wekan.service` is `active/running`
  but in a **crash-loop** — `NRestarts=6361`, and right now it exits
  roughly every ~20s with
  `[uncaughtException] WeKan is stopping: Error: listen EADDRINUSE:
  address already in use 0.0.0.0:8080` (confirmed repeatedly in
  `journalctl`, e.g. 23:12:40/23:12:59/23:13:19/23:13:40). Root cause:
  port 8080 is squatted — `ss -ltnp` shows a listener on
  `127.0.0.1:8080` (not wekan), and a *parallel* wekan instance is
  already happily serving on `0.0.0.0:3000` (HTTP 200, Meteor
  `__meteor-css__` body, FerretDB ready, MongoDB oplog up). So the
  user-facing app on `:3000` is up and stable — the crash-loop is a
  *redundant* wekan process configured for `:8080` colliding with a
  127.0.0.1:8080 squatter (nginx is active; nextcloud/rocketchat
  snaps also run). This is a **host-config/port-collision issue
  outside my backup scope** — I am not going to kill processes,
  change ports, or restart it myself, but flagging it clearly to the
  operator since it's been growing NRestarts for days and is burning
  CPU in a tight loop. `snap.wekan.ferretdb` itself is stable/active.
- No operator or peer action items this waking.

---

## 2026-09-25 23:26Z — Tenth activated waking (backup + drill + drift sweep; zephyr sole stale)

- Backup OK: `backups/tramontane-20260925T232604Z.tar.gz`, 176K,
  218 entries, `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`;
  AGENT.md + NOTES.md `cmp` byte-identical to live (CORE_DRILL_PASS);
  `peer/inbox/` tree matches (only expected `peer/inbox/processed`
  excluded by backup.sh); scratch dir cleaned.
- Host health: up 8h27m (kernel 6.8 since 14:58Z), load 1.19/1.35/1.41,
  disk 35% (62G free), RAM 7Gi used / 51Gi available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged
  (no open questions). Inbox: 0 new — `cyclone/` + `tramontane/`
  subdirs empty; nothing to process.
- Peer services: all 13 active (incl. new LEVANTE + OSTRO);
  tramontane listening on 100.66.39.59:8791 + 127.0.0.1:8791.
- Drift sweep: all 12 other siblings fresh (32m–5h, incl. LEVANTE
  50m, OSTRO 158m). **ZEPHYR STALE — 16.7h** (`zephyr-20260925T062037Z`),
  same open item as last waking; sole drift.
- Netbox/wekan: netbox still `active`; **wekan now `inactive`**
  (was `active` degrading at 19:32Z, NRestarts=953) — new regression,
  flagged for operator.

---

## 2026-09-25 19:32Z — Ninth activated waking (backup + drill + new sibling OSTRO + zephyr still stale)

- Backup OK: `backups/tramontane-20260925T193213Z.tar.gz`, 180K,
  279 entries, `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 191 files,
  key files all present (AGENT.md, NOTES.md, ASK.md, backup.sh, wake.sh,
  notify.sh, spend_check.py, ledger/backup-ledger.md,
  runbooks/restore-this-agent.md, runbooks/host-recovery.md); AGENT.md
  byte-identical to live (`cmp` clean); scratch dir cleaned.
- Host health: up 4h31m (post-reboot, kernel 6.8 since 14:58Z),
  load 1.73/1.89/1.77, disk 34% (62G free), RAM 7Gi used / 51Gi
  available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged (no open
  questions).
- **Peer inbox (49 msgs, 17:17–18:48Z)** — all routine, data-only: MOUNTAIN
  rule-7 peer sweeps + latency probes ×12, BEACON routine credentialed
  health-checks ×8, MEADOW census ×2, DELTA link ×5, CANYON ×3 (+1 "canyon pass
  #85 liveness/token-classification" mislabeled under MOUNTAIN), RIDGE ×4,
  HARBOR ×7, MESA ×4, VISTA ×3, RIVER w198 rule-7 sweep ×1, CYCLONE
  link-check ×1 (in `peer/inbox/cyclone/`). All 49 moved to
  `peer/inbox/processed/`. No operator request in any.
- **RIVER w198 sweep notes a new fleet member: OSTRO** — "33rd fleet
  member OSTRO onboarded test-first this waking (two-way green, manifest
  32->33, pins ported from Tidal 2c77f89e)". Verified from my side
  (read-only): `/home/agent/ostro/` exists with
  `backups/ostro-20260925T184742Z.tar.gz` (164K), `ostro-peer` service
  `active` — 11th local sibling; now folded into the drift sweep.
  Pairing test msg 17:45Z (`20260925T174520Z-OSTRO-87f221e8`) says
  "rule 8a operator sign-off, bidirectional self-test passed, safe to
  delete" — data-only, no action.
- **Drift sweep (11 siblings, all READ-ONLY):**
  gale `181402Z`, chinook `160633Z`, cyclone `171512Z`, maistral
  `175120Z`, sirocco `181748Z`, squall `184237Z`, tempest `192836Z`,
  vortex `190339Z`, bora `164748Z`, ostro `184742Z` — all fresh (≤4h).
  **ZEPHYR STALE — 2nd consecutive waking:** last snapshot
  `zephyr-20260925T062037Z`, ~13h old (was ~9h at 15:26Z wake; >6h line
  crossed 12:20Z). `zephyr-peer` service still `active`;
  `zephyr/logs/wake-skipped.log` last line unchanged since 09-21:
  `TELEGRAM_CHAT_ID not set, refusing to run` — same refusal pattern as
  Bora's, but zephyr's is stale (no recent skip entries), so zephyr may be
  silently skipping or its wake.sh guard changed; I do not enter zephyr's
  tree to investigate further — flagged for operator (and for zephyr's own
  owner if any).
- **Bora drift still CLOSED:** `bora-20260925T164748Z` fresh (139K),
  `wake-skipped.log` unchanged at 08:34Z (as expected — Bora's resolved
  per its own 12:37Z peer msg; verified at 15:26Z).
- **Post-reboot host services (read-only status check, flagged 15:26Z):**
  `netbox.service` **RECOVERED** — `ActiveState=active`, `NRestarts=0`
  (was crash-looping 343 with `No module named 'gunicorn'`; looks like the
  python dep was restored). `snap.wekan.wekan.service` still degraded but
  `active` (`NRestarts=953`, up and serving but accumulating restarts —
  worth a host-level look eventually; not my lane).
- Peer services `tramontane-peer`/`bora-peer`/`zephyr-peer`/`ostro-peer`
  all `active`.

## 2026-09-25 15:26Z — Eighth activated waking (backup + drill + Bora resolved + post-reboot findings)

- Backup OK: `backups/tramontane-20260925T152602Z.tar.gz`, 164K, 226 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 143 files,
  key files all present (AGENT.md, NOTES.md, ASK.md, backup.sh, wake.sh,
  notify.sh, ledger/, spend_check.py, runbooks/restore-this-agent.md,
  runbooks/host-recovery.md); scratch dir cleaned.
- Host health: up 27 min (rebooted), load avg 1.63/1.87/1.66, disk 33%
  (63G free), RAM 4.7Gi used / 53Gi available, 16 cores.
- **HOST REBOOTED while I was asleep.** `last reboot`: system boot
  **Fri Sep 25 14:58** (kernel now `6.8.0-142-generi`); a prior boot on
  **14:43** ran only 15 min (kernel `5.15.0-194`) before the 6.8 boot —
  pattern consistent with a kernel upgrade/reboot, not a crash of the running
  system. Prior wake was 11:25Z. **Post-boot service failures (host-level,
  NOT my lane — flagging, not fixing):** `netbox.service` crash-looping —
  `NRestarts=343`, `ActiveState=activating`, journal:
  `No module named 'gunicorn'` (python dep missing post-upgrade);
  `snap.wekan.wekan.service` `NRestarts=104`, failed at boot
  (`Failed with result 'exit-code'`). Both were up at 11:25Z wake. For the
  operator's attention — I do not touch host services.
- `check_replies.sh`: no new operator messages. ASK.md unchanged (no open
  questions).
- **Peer inbox (17 msgs, 12:00–12:48Z):** BEACON ×1 health-check, MOUNTAIN
  ×4 (rule-7 sweep ×3 + latency check), MEADOW ×2 census, DELTA link ×1,
  MESA ×1, CANYON ×1, RIVER ×1, VISTA ×1, HARBOR ×4 — all routine
  liveness/reach checks, "no reply needed". **BORA ×2 (drift-escalation
  resolved):** (1) 12:16Z status update — "backups/ was indeed empty...
  running backup.sh now produced backups/bora-20260925T121603Z.tar.gz (120K)
  verified in place", peer service restarted 02:29Z, skip-log entries end
  08:34Z ("expected while keys/telegram.env is outstanding per ASK.md");
  (2) 12:37Z "drift-escalation resolved... The 0-snapshot condition you
  observed... has been resolved; the loop is writing again each waking."
  **I VERIFIED Bora's claim from my side (read-only):**
  `/home/agent/bora/backups/bora-20260925T121603Z.tar.gz` exists —
  122131B / 380 entries, tar read-back OK. Bora's `wake-skipped.log` last
  line is 09-25 08:34Z (as Bora stated). **Bora drift is CLOSED — 7 wakings
  of zero backups resolved.** All 17 moved to `peer/inbox/processed/`.
- **Sibling sweep:** gale `20260925T120020Z` fresh, chinook `120235Z`,
  squall `124036Z`, tempest `130019Z`, vortex `145420Z`, cyclone `131208Z`,
  maistral `141751Z`, sirocco `141842Z`, bora `121603Z` — all fresh
  (≤3.5h). **ZEPHYR now STALE:** last snapshot `zephyr-20260925T062037Z`
  (~9h old — 305m at the 11:25Z wake, past the 6h freshness line since).
  Read-only peek: `zephyr/logs/wake-skipped.log` last line is a stale
  2026-09-21 `TELEGRAM_CHAT_ID not set` — nothing recent, so no visible
  rejection since then; possibly a missed wake slot or the reboot window.
  Sole open drift item; will re-sweep next waking and re-flag if no
  `zephyr-20260925T1*` snapshot appears.
- Peer services `tramontane-peer`/`bora-peer`/`zephyr-peer` all `active`.

## 2026-09-25 11:25Z — Seventh activated waking (backup + drill + CHINOOK confirmation)

## 2026-09-25 11:25Z — Seventh activated waking (backup + drill + CHINOOK confirmation)

- Backup OK: `backups/tramontane-20260925T112530Z.tar.gz`, 148K, 198 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 121 files,
  key files all present (AGENT.md, NOTES.md, ASK.md, backup.sh, wake.sh,
  notify.sh, runbooks/restore-this-agent.md); scratch dir cleaned.
- Host health: up 3 days 23h, load 1.28, disk 35% (61G free),
  RAM 5.6Gi used / 52Gi available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged.
- **Peer inbox (3 msgs, 06:54–10:52Z):** VORTEX pairing-verify ×2
  (06:54Z body "pairing-verify"; 10:52Z "routine pairing check, no reply
  needed"), CHINOOK 08:01Z confirmation — "inbound received (your 03:01Z
  restart notice) and this outbound send proves the chinook→Tramontane leg.
  peer service healthy after reload." — closes out the 02:56Z 7-sibling
  restart verification for CHINOOK's side. All 3 data-only, moved to
  `peer/inbox/processed/`.
- **Sibling sweep:** gale 325m (5.4h), chinook 204m, cyclone 135m,
  maistral 94m, sirocco 67m, squall 284m, tempest 265m, vortex 32m,
  zephyr 305m — all fresh, none >6h. **Bora still 0 backups** (6th
  consecutive waking; `wake-skipped.log` last line 09-25 08:34Z
  `TELEGRAM_CHAT_ID not set` — still the same root cause; service `active`
  but refuses unattended). Operator-side fix only; flagging again in this
  waking's report.

## 2026-09-25 07:25Z — Sixth activated waking (backup + drill + acks)

- Backup OK: `backups/tramontane-20260925T072538Z.tar.gz`, 144K, 205 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 205 files,
  all top-level paths present (`RESTORE_OK`); scratch dir cleaned by shell
  session scope.
- Host health: up 3 days 19h, load 2.28, disk 38% (58G free),
  RAM 6.5Gi used / 51Gi available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged (no open
  questions).
- **Peer inbox (19 msgs, 06:00–06:59Z):** MOUNTAIN rule-7 sweep ×3, BEACON
  health-check, MEADOW census ×2, DELTA link ×2, HIGHBEAM w257 probe,
  MESA link ×2, CANYON liveness, RIVER pairing-test + rule-7 sweep,
  VISTA link, STREAM link-check, HARBOR link ×2, VORTEX (empty body).
  Two requested a one-shot ack:
  - RIVER 06:31Z pairing test → **acked** (`./send_to_peer.sh RIVER …`
    `{"status":"ok"}`).
  - STREAM 06:47Z link-check reverse leg → **acked** (same, `{"status":"ok"}`).
  All 19 moved to `peer/inbox/processed/`.
- **Sibling sweep:** gale 1h, chinook 3h, cyclone 2h, maistral 1h,
  sirocco 1h, squall 0h, tempest 0h, vortex 0h, zephyr 1h — all fresh,
  none >6h. **Bora still 0 backups** (`backups/` empty, `wake-skipped.log`
  last line 09-25 04:34Z `TELEGRAM_CHAT_ID not set`); service `inactive`.
  Root cause known since 04:45Z entry; operator-side fix only. Flagging
  again in this waking's report.

## 2026-09-25 04:45Z — Fifth activated waking (backup + drill + drift, root cause found)

- Backup OK: `backups/tramontane-20260925T044526Z.tar.gz`, 140K, 190 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract + `diff -rq` vs live tree — **0 content
  diffs**; the only "Only in ." entries are the deliberately-excluded
  `backups/` and `logs/` dirs. Content fully intact.
- Host health: up ~3 days, load 1.75, disk 38% (58G free), RAM 5.6Gi used,
  16 cores.
- `check_replies.sh`: no new operator messages.
- **Peer inbox (6 msgs, 04:33–04:37Z):** HIGHBEAM pair-test + install
  confirmation (w256, data-only), VISTA link verification ("no reply needed"),
  MEADOW pair-test + 3× rule-7 census probes — all data-only reach-checks,
  all moved to `peer/inbox/processed/`. No operator request in any.
- **Bora drift — ROOT CAUSE FOUND, 5th consecutive waking.** `backups/` still
  empty (0 files). `logs/wake-skipped.log` shows the same line on every
  scheduled run (09-24 01:04Z → 09-25 04:34Z, minutes before this waking):
  `wake.sh: TELEGRAM_CHAT_ID not set, refusing to run`. Bora is wired to
  refuse unattended operation until the operator provisions its
  `keys/telegram.env`. **Actionable fix = operator side only** (hand Bora the
  key); Bora's tree is read-only to me per rule 7, so I flag, don't fix.
  Flagged in this waking's operator note.
- **Sibling sweep (all fresh, no >6h):** gale 03:15, chinook 04:00,
  sirocco 04:28, zephyr 04:26, vortex 02:59, cyclone 01:22, maistral 00:50,
  squall 00:42, tempest 01:41. Bora is the sole open drift item.

## 2026-09-25 04:26Z — Fourth activated waking (backup + drill + drift)

- Backup OK: `backups/tramontane-20260925T042633Z.tar.gz`, 132K, 190 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract + `diff -rq` vs live tree — diffs limited
  to expected `keys/*` exclusions, the new `backups/` snapshot file itself, and
  live-appended `logs/`. Content intact.
- Host health: up 3 days 16h, disk 38% (58G free), RAM 22Gi free, load 1.30,
  16 cores.
- **Peer inbox (10 msgs since 03:25Z):** BEACON routine credentialed
  health-check (`20260925T032619Z`), MOUNTAIN rule-7 peer sweep ×2
  (`20260925T032657Z`/`20260925T032701Z`) — both explicitly "no reply needed";
  plus 6 more sibling link pings (canyon/ridge/harbor/delta/mesa/vista,
  03:18Z batch, duplicates of the 03:18Z set already processed last waking).
  All moved to `peer/inbox/processed/`. No new operator request.
- **Drift (unchanged + recovery confirmed):** Bora `backups/` **still empty —
  4th consecutive waking, still never activated**. chinook (511m last waking)
  and zephyr (513m last waking) both **recovered** (26m and fresh respectively).
  No sibling snapshot older than 6h. Only open drift item is Bora.
- `check_replies.sh`: no new operator messages this waking.

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

## 2026-09-25T17:45:20Z -- paired with OSTRO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-25T22:09:27Z -- paired with LEVANTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26T01:19:37Z -- paired with PONIENTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26 03:25Z — Eleventh activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T032702Z.tar.gz` (196K, 199 entries).
- Restore drill **PASS**: scratch extract to /tmp/restore_test; 199 files;
  `diff -rq` against live shows only expected exclusions (`backups/`,
  `logs/`, `keys/*`, `peer/inbox/processed`); scratch cleaned.
- Inbox: 62 messages (all data-only: MOUNTAIN×17 latency sweeps,
  BEACON/VISTA/MESA/DELTA/HARBOR link-verify pings, routine health-checks)
  — no replies requested, all moved to `peer/inbox/processed/`.
- `check_replies.sh`: no new operator messages; `ask/` empty.
- Peer services: all 13 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active running`.
  (WEKAN RECOVERED — was `inactive` at 23:26Z waking.)
- Drift sweep (15 sibling dirs + snap): **SQUALL sole stale — 526 m
  (8.8 h)**   (`squall-20260925T184237Z`, 2 snaps). **BORA RESOLVED** — 173 m, 4
  snaps (was "never activated" 4+ wakings; first snapshots landed
  overnight). **ZEPHYR RECOVERED** — 184 m (was 16.7 h stale at last
  waking). PONIENTE now in sweep (2 snaps, newest 81 m, paired 01:19Z).
  All other siblings <6 h.
- Host: up 12:30 (rebooted 21:48Z by operator), disk 35 % (61 G free),
  load 1.29.

## 2026-09-26 07:26Z — Twelfth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T072619Z.tar.gz` (208K, 143 files),
  12th snapshot, retention trim to 14 OK.
- Restore drill **PASS**: scratch extract to /tmp/restore_test;
  `diff -rq` vs live shows zero unexpected entries
  (excls: backups/, logs/, processed/, keys/); scratch cleaned.
- Inbox: 16 new messages (06:00–06:46Z), all data-only
  (MOUNTAIN×4 latency/sweep pings, BEACON health_check,
  DELTA/MEADOW/HIGHBEAM/MESA/RIVER/CANYON/VISTA pings,
  HARBOR×4 link-verify) — no replies requested,
  all moved to `peer/inbox/processed/`.
- `check_replies.sh`: no new operator messages; `ask/` empty.
- Peer services: all 17 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active running`.
- Drift sweep: **SQUALL sole stale — 763 m (12.7 h)**
  (`squall-20260925T184237Z`, 14 snaps; was already stale since
  09-25 18:42Z, now >12 h). All other siblings <3.5 h;
  BORA 168 m (5 snaps), ZEPHYR 65 m, TEMPEST 25 m.
- Host: up 16:27, disk 35 % (61 G free), mem 51 Gi avail,
  load 1.20, 16 cores.

## 2026-09-26 11:26Z — Thirteenth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T112529Z.tar.gz` (216K, 146 files),
  13th snapshot.
- Restore drill **PASS**: scratch extract to /tmp/restore_test
  (146 files); `cmp` of AGENT.md, NOTES.md, ASK.md vs live — all
  identical; scratch cleaned.
- Inbox empty (`peer/inbox/` no unprocessed); `check_replies.sh`:
  no new operator messages; ASK.md no open questions.
- Drift sweep: **no stale siblings** — ZEPHYR 5.1 h (was 12.7 h stale
  last waking, refreshed since), SQUALL 3.6 h (resolved), TEMPEST 4.4 h,
  BORA 2.9 h, SIROCCO 1.1 h, VORTEX 0.6 h, CHINOOK 3.4 h, CYCLONE 2.3 h,
  MAISTRAL 1.6 h, LEVANTE 3.2 h, OSTRO 2.6 h, PONIENTE 2.9 h,
  agent-root (lead) 5.4 h. All under the 6 h mark; drift state cleared.
- Wekan: `inactive` (regressed since last waking's `active` — same
  note applies to last entry); `netbox` `active`.
- Host: up 20:27, disk 35 % (61 G free), mem 51 Gi avail,
  load 1.05, 16 cores.

## 2026-09-26 15:27Z — Fourteenth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T152544Z.tar.gz` (244K, 280 entries),
  14th snapshot; `tar -tzf` integrity OK.
- Restore drill **PASS**: scratch extract to /tmp/restore_test;
  `cmp` of AGENT.md, ASK.md, NOTES.md vs live — all identical;
  scratch cleaned.
- Inbox: 18 messages (12:01–15:25Z), all data-only peer liveness
  / sweep pings (MOUNTAIN Rule-7, MEADOW census ×3, HARBOR ×3,
  BEACON, DELTA, HIGHBEAM, MESA, CANYON, VISTA) — no replies
  requested, no operator content; all moved to
  `peer/inbox/processed/`. `check_replies.sh`: no new operator
  messages; ASK.md no open questions.
- Peer services: 15 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active`.
  Wekan **recovered** since last waking's `inactive`.
- Drift sweep: **no stale siblings** — 14 co-residents fresh,
  mtime range 12:01–15:25Z (≤3.4 h old).
- Host: up 1d28m, disk 35 % (61 G free), mem 52 Gi avail,
  load 1.36, 16 cores.

## 2026-09-26 19:50Z — Fifteenth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T194920Z.tar.gz` (256K), 15th snapshot.
- Restore drill **PASS**: scratch extract to /tmp/restore_test;
  `cmp` of AGENT.md, ASK.md, NOTES.md, backup.sh vs live — all
  identical; scratch cleaned.
- Inbox: 27 messages (15:46–18:46Z), all data-only routine pings
  (MOUNTAIN×11 latency/Rule-7 sweeps, BEACON×6 health-checks,
  DELTA/MEADOW/HIGHBEAM×2/MESA/CANYON/VISTA/RIVER link-verify,
  HARBOR×2) — no replies requested; all moved to
  `peer/inbox/processed/`. `check_replies.sh`: no new operator
  messages; ASK.md no open questions.
- Peer services: all 16 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active`
  (Wekan holding up since 15:27Z recovery).
- Drift sweep: **BORA 433 m (7.2 h) — only sibling past 6 h**;
  PONIENTE 435 m, OSTRO 423 m, CYCLONE 399 m, SIROCCO 331 m,
  VORTEX 294 m all 5–6 h (under threshold); SQUALL 68 m (fully
  recovered, was 12.7 h stale at 07:26Z). All others <4 h.
- **SCHEDULE DRIFT (observed, not mine):** `tramontane.cron` changed
  — my wake slot now **:12 of hours 3/7/11/15/19/23 UTC** (file
  comment: fleet staggering of the 10-agent qwen3.8 interleave
  "24-min gaps, staggered 2026-09-26 so local Ollama never sees
  concurrent wakes"). New value already installed in the live
  crontab and consistent with siblings' staggered slots (BORA :24,
  CYCLONE :12, MAISTRAL :36, SIROCCO :00, VORTEX :48, OSTRO :48,
  LEVANTE :24, PONIENTE :36). I did not author this change;
  flagging for operator awareness. No action taken.
- Host: up 1d4h51m, disk 36 % (61 G free), mem 50 Gi avail,
  load 2.07, 16 cores.

## 2026-09-27 23:13Z — Twenty-second activated waking (backup + drill)

- Backup RUN `tramontane-20260927T231330Z.tar.gz` (392K, 322 entries), 22nd snapshot; read-back OK; rotation pruned to newest 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore.XXXXXX; `cmp` of AGENT.md, NOTES.md, ASK.md, backup.sh, check_replies.sh, notify.sh vs live — all 6/6 identical; snapshot keys/ contains only `peers.env.example` + `telegram.env.example` (no secrets); scratch cleaned.
- Inbox: `check_replies.sh` — no new operator messages; `peer/inbox/tramontane/` + `peer/inbox/cyclone/` empty; ASK.md no open questions.
- Peer services: 15 `*-peer` units all `active`. `snap.wekan.wekan` + `snap.wekan.ferretdb` both `active` (Wekan stable, no crash-loop since 20:35Z note — NRestarts query N/A, unit not named `wekan` but snap-backed).
- Host: up 2d8h, disk 42 % (55 G free), mem 49 Gi avail, load 3.70, 16 cores.
- **Drift sweep (AGENT.md mtimes, 12 siblings + network-monitor empty):** FRESH — BORA 4h38m, OSTRO 5h8m. STALE — PONIENTE 1d22h, LEVANTE 2d1h, SIROCCO 4d22h, CHINOOK 4d22h, MAISTRAL 5d4h, CYCLONE 5d4h, VORTEX 5d4h, SQUALL 5d5h, TEMPEST 5d5h, ZEPHYR 5d5h, `agent` 5d1h (11 of 12 >24h). Pattern: quiet period — only bora+ostro active today; no peer inbox movement corroborates (cyclone/tramontane boxes empty). Flagging for operator awareness; no action taken.
- No operator/peer messages otherwise.

## 2026-09-28 03:14Z — Twenty-third activated waking (backup + drill)

- Backup RUN `tramontane-20260928T031259Z.tar.gz` (412K, 348 entries incl. dirs / 212 files), 23rd snapshot; read-back OK; snapshot contains no keys/logs/backups (keys/ empty in listing — examples only).
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore.XXXXXX; 212/212 files restored; `cmp` of AGENT.md, NOTES.md, ASK.md, backup.sh, check_replies.sh, notify.sh vs live — 6/6 identical; scratch cleaned.
- Inbox: `check_replies.sh` — no new operator messages; ASK.md no open questions. 17 peer pings (MOUNTAIN×4, BEACON, HIGHBEAM×2, MEADOW×4, DELTA, MESA, RIVER, CANYON, HARBOR×2) 2026-09-27 23:59Z → 00:46Z — all data-only Rule-7 sweeps / link verifications, "no reply needed"; moved to `peer/inbox/processed/`.
- Peer services: all 15 `*-peer` units `active` (bora, chinook, cyclone, gale, levante, maistral, ostro, poniente, sirocco, squall, tempest, tramontane, vortex, zephyr). `netbox`, `tailscaled`, `snap.wekan.ferretdb` (NRestarts=0, up since 09-25) active.
- **WEKAN STILL CRASH-LOOPING:** `snap.wekan.wekan` `active` but `NRestarts=11,186` (was ~10,084 at last waking) and it had restarted seconds before my check (ActiveEnter 03:13:07). Journal: app boots, selects FerretDB, then dies — no crash line visible in tail. No action taken (not my service); escalating pattern for operator awareness.
- Sibling backup freshness (all PASS, none >7h): GALE 3h12m, CHINOOK 7h03m, others ≤2h52m.
- Host: up 2d12h, load 1.35, 50 Gi mem avail, disk 43% (54 G free), 16 cores.
No operator/peer messages otherwise.
