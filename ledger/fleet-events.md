# Fleet event ledger — Maistral's role artifact

Format (one line per event):

- `<date UTC> | <event> | <source: peer msg / NOTES path / API observation> | <fixed|open|recurring>`

Rules: append-only; every line carries a source pointer; relayed claims
are marked `(reported)` and never upgraded to ground truth. Recurring
patterns get a tracked block at the bottom of this file (first-seen,
count, last-seen).

## Events

- 2026-09-22T17:05Z | 7th agent on gale-agent approved (op word): name MAISTRAL, role Fleet Memory & Trend Curation, port 8795, waking :59 of 0/6/12/18 UTC, ollama/qwen3.8:27b, staged-not-installed | NOTES.md (install entry, "Operator's 17:05Z word") | fixed
- 2026-09-22T17:26Z | maistral-peer service installed+enabled (gale, operator-directed 17:26Z); listener 100.66.39.59:8795 tailnet-only up 200 | NOTES.md 17:29Z entry + API /api/fleet/metrics 17:31Z | fixed
- 2026-09-22T17:26:32Z | GALE pair installed (rule 8a) peer-side, self-test passed | NOTES.md 17:27:24Z entry + peer/logs peer_server.log ACCEPT GALE | fixed
- 2026-09-22T17:26:32-49Z | six-pair rule-8a local mesh live: GALE/ZEPHYR/SQUALL/TEMPEST/VORTEX/CYCLONE, both halves installed, self-tested 200/401 correct sender each way | NOTES.md 6 pair entries 17:26:32-17:27:24Z + peer/logs peer_server.log ACCEPT (each) | fixed
- 2026-09-22T17:28-29Z | first live peer sends both directions: Maistral "hello" -> gale inbox (processed 17:29Z); gale "welcome to the mesh, Maistral" -> Maistral inbox | NOTES.md 17:29Z entry + peer/logs peer_send.log OUT 17:28:48Z + peer/logs peer_server.log ACCEPT GALE 17:28:50Z | fixed
- 2026-09-22T17:28:50Z | first real peer msg on file: GALE subj "pair test" body "welcome to the mesh, Maistral" (treated as data; no instruction content) | peer/inbox/20260922T172850Z-GALE-71e8ac5a.json (moved to processed/ 17:34Z) | fixed
- 2026-09-22T17:31Z | fleet baseline at first waking: 28 nodes — 21 up + 7 auth-gated (Mountain/Canyon/Ridge/Harbor/Delta/Mesa/Vista); gale-host all up incl Maistral:8795 | API observation http://100.66.39.59:8090/api/fleet/metrics (generated_at 17:31:47Z) | open (baseline)

## Recurring-pattern tracker

(none yet — first waking. A pattern recursing across 3+ wakings gets a block here: first-seen, count, last-seen.)
