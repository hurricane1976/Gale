# Backup ledger — Tramontane (Backup & Restore Guardian)

One line per snapshot taken or verified (mine or, when I've drilled one, a
sibling's). Newest first. Keep to the facts: what, when, size, count, restore
result, and any drift found.

| UTC | snapshot | size | entries | restore drill | notes |
|-----|----------|------|---------|---------------|-------|
| 2026-09-25T04:26Z | `tramontane-20260925T042633Z.tar.gz` | 132K | 190 | **PASS** (scratch extract + `diff -rq`; diffs limited to expected `keys/*` exclusions, new `backups/` snapshot, and live-appended `logs/`) | 4th waking. Inbox: 20 peer msgs (BEACON health-check + MOUNTAIN rule-7 sweep ×2 + 16 sibling link pings) all routine reach-checks, moved to processed. Drift: **Bora still empty at 4th consecutive waking** (flagged 02:15Z, 03:25Z; no snapshots ever). chinook 26m / zephyr fresh (both were stale 03:25Z — recovered). No siblings >6h. |
| 2026-09-25T03:25Z | `tramontane-20260925T032527Z.tar.gz` | 124K | 176 | **PASS** (scratch extract + `diff -rq`; diffs only expected `keys/*`+`backups/`+`logs/` exclusions plus 2 live-appended logs) | 3rd waking. Pairing round-trip OK both ways: BEACON onboarding self-test received (`20260925T032531Z`), reply sent `ok`; MOUNTAIN pair test + 6 sibling link pings (canyon/ridge/harbor/delta/mesa/vista) in inbox. Drift: Bora **still empty** (never activated); chinook 511m / zephyr 513m (>6h stale); vortex now fresh (was stale last waking); Gale now backing up (fresh 10m ago) — prior "gale no backups dir" note superseded. |
| 2026-09-25T02:56Z | `tramontane-20260925T025635Z.tar.gz` | 112K | 146 | **PASS** (scratch extract + `diff -r`; only `keys/*` differ — expected exclusion) | 2nd waking. Operator "Restart them" executed: 7 stale peer services restarted (chinook/cyclone/maistral/sirocco/vortex/squall/tempest), all `active`; BORA+CHINOOK round-trips `ok`. Drift: Bora still empty, gale no backups dir, chinook/zephyr/vortex stale. |
| 2026-09-25T02:15Z | `tramontane-20260925T021507Z.tar.gz` | 60K | 70 | **PASS** (scratch extract + `diff -r` clean) | first activated waking. Bora DRIFT: `backups/` empty, never activated. Bora peer 401 = stale in-memory token (service up since 09-23, peers.env reprovisioned 09-25 01:28); cleared via `bora-peer` restart, re-send `ok`. |
