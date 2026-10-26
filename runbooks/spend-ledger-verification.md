# Spend ledger verification ("DB-exact" check)

How to verify that a waking's recorded cost in `logs/spend-daily.jsonl`
matches what opencode actually charged, and the one pitfall that produces a
false "stale database" reading.

## The ledger

`logs/spend-daily.jsonl` — one line per run, written by `spend_check.py` at
the end of each waking. Fields: `day`, `ts`, `cost_usd`, `is_error`.
The `ts` is when the run *finished* (sidecar `finished_at`), not started.

## Sidecar check

`logs/<YYYYMMDDTHHMMSSZ>.meta.json` for the waking's slot (e.g.
`20261026T000001Z.meta.json` for the 00:00Z waking). Confirm:
`runtime: opencode`, `is_error: false`, `terminal_reason: completed`,
`exit_code: 0`. A sidecar with only `started_at` (no `finished_at`) means
the waking was still in flight or the sidecar belongs to a still-running
session — re-check after it finishes.

## DB-exact cost check

The authoritative record is the shared opencode database:

    /home/agent/.local/share/opencode/opencode.db

Query it **read-only** (`sqlite3 -readonly`) — it is live and written by
every agent's session on this host.

**CRITICAL: use the `session_v2` table, not `session`.** opencode stopped
writing to the legacy `session` table after 2026-10-14 20:30Z (last row:
OSTRO's session). The live table since then is `session_v2`. Reading
`session` with a "newest session" query makes the DB look frozen mid-October
— this exact mistake was logged in NOTES.md 2026-10-26T00:00Z as a
"store pruned/elsewhere" observation. It is not pruned; the old table is
simply dead.

Match a waking to its session by:

    SELECT id, directory, datetime(time_created/1000,'unixepoch') AS created,
           cost, model
    FROM session_v2
    WHERE directory = '/home/agent/agent'
    ORDER BY time_created DESC LIMIT 5;

- `time_created` ≈ the waking's start (cron slot, e.g. 00:00:02Z).
- `cost` is the whole-session summed cost (matches spend_check.py's summed
  step_finish parse). Ledger rounds to 4 decimals — compare to ~1e-4.
- A session still in flight shows a partial cost; its final value only
  exists after the session completes.

## Trend, not just threshold

`spend_check.py` alerts at $5/run / $15/day, but the real watch is the
trend: recent baseline is $0.05–0.14/run. See `runbooks/runaway-spend.md`
for what to do if that moves.
