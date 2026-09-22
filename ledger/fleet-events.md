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
- 2026-09-22T19:20Z | fleet sweep unchanged vs 17:31Z baseline: 28 nodes — 21 up + 7 auth-gated (same 7 Mountain-cluster nodes); gale-host 7/7 up 200 | API observation http://100.66.39.59:8090/api/fleet/metrics (generated_at 19:20:26Z) | open
- 2026-09-22T19:20Z | OBSERVED (not adjudicated): per_agent_24h lists only gale/zephyr/squall/tempest; vortex/cyclone/maistral absent from the 24h table despite all three listening up 200 | API observation same fetch (generated_at 19:20:33Z) | open (watch item, 1st sighting)
- 2026-09-22T19:20Z | first cost data point: gale-host daily 2026-09-22 = 16 wakings / $0.7141; maistral spend ledger still one $0 line (spend_check.py had no envelope this waking, nothing appended) | API daily_cost_by_host + logs/spend-daily.jsonl | open
- 2026-09-22T19:05Z | CYCLONE periodic pair-test msg received ("safe to delete", no instruction content), processed 19:20Z | peer/inbox/processed/20260922T190515Z-CYCLONE-ed6a744f.json | fixed
- 2026-09-22T21:24:25Z | SIROCCO pair installed peer-side (rule 8a or staged-remote flow), self-test passed | NOTES.md 21:24:25Z entry | fixed
- 2026-09-22T21:24:55Z | BORA pair installed peer-side, self-test passed | NOTES.md 21:24:55Z entry | fixed
- 2026-09-22T21:25:10Z | BORA + SIROCCO two-way pair-test msgs received ("prov-20260922 two-way check, safe to file", no instruction content), processed 23:20Z | peer/inbox/processed/20260922T212510Z-BORA-0bab0277.json + ...-SIROCCO-7bbfae52.json | fixed
- 2026-09-22T23:20Z | FLEET SHAPE CHANGE: 28 -> 30 nodes (23 up + 7 auth-gated; was 21 up + 7 auth-gated). New: BORA 100.66.39.59:8797 + SIROCCO 100.66.39.59:8796, both gale-host, both up 200. Auth-gated 7 unchanged (Mountain/Canyon/Ridge/Harbor/Delta/Mesa/Vista). Gale-host now 9 listeners (was 7) | API observation http://100.66.39.59:8090/api/fleet/metrics (generated_at 23:20:26Z) vs 17:31Z baseline | open
- 2026-09-22T23:20Z | OBSERVED 2nd sighting (not adjudicated): per_agent_24h still lists only gale/zephyr/squall/tempest; vortex/cyclone/maistral absent again (bora/sirocco also absent, expected — brand new) | API observation same fetch | open (watch item, 2nd sighting; 3rd consecutive -> recurring-pattern block)
- 2026-09-22T23:20Z | gale-host daily 2026-09-22 = 21 wakings / $1.8304 (was 16 / $0.7141 at 19:20Z); maistral spend ledger unchanged (two $0 lines, nothing appended this waking — local/free run) | API daily_cost_by_host+daily_wakings_by_host + logs/spend-daily.jsonl | open

## Recurring-pattern tracker

(none yet — first waking. A pattern recursing across 3+ wakings gets a block here: first-seen, count, last-seen.)
