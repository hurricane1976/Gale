# Backup ledger — Tramontane (Backup & Restore Guardian)

One line per snapshot taken or verified (mine or, when I've drilled one, a
sibling's). Newest first. Keep to the facts: what, when, size, count, restore
result, and any drift found.

| UTC | snapshot | size | entries | restore drill | notes |
|-----|----------|------|---------|---------------|-------|
| 2026-09-25T02:56Z | `tramontane-20260925T025635Z.tar.gz` | 112K | 146 | **PASS** (scratch extract + `diff -r`; only `keys/*` differ — expected exclusion) | 2nd waking. Operator "Restart them" executed: 7 stale peer services restarted (chinook/cyclone/maistral/sirocco/vortex/squall/tempest), all `active`; BORA+CHINOOK round-trips `ok`. Drift: Bora still empty, gale no backups dir, chinook/zephyr/vortex stale. |
| 2026-09-25T02:15Z | `tramontane-20260925T021507Z.tar.gz` | 60K | 70 | **PASS** (scratch extract + `diff -r` clean) | first activated waking. Bora DRIFT: `backups/` empty, never activated. Bora peer 401 = stale in-memory token (service up since 09-23, peers.env reprovisioned 09-25 01:28); cleared via `bora-peer` restart, re-send `ok`. |
