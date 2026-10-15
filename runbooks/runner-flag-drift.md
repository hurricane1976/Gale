# Runbook: runner CLI flag drift breaks wakes (detection side)

Incident: opencode upgraded host-wide to v2.0.29 on 2026-10-14 20:41Z; `opencode run --dir` was
removed. wake.sh still passed `--dir`, so every waking 10-14T23:25Z through 10-15T11:25Z failed
all 3 attempts + fallback (`Unrecognized flag: --dir`, exit 1) — ~24h dark, no spend recorded.
Fixed by a host-wide outside-edit batch 10-15 14:10:35–14:11:05Z (`--standalone`, cwd-based
workdir; `/stop` re-matched by cwd). Squall/tempest failed identically; gale's ledger shows no
gap (asymmetry unexplained).

## What caught it

- wake.sh's own shell-side ALERT (fires on nonzero exit, and on exit-0-without-notify) — worked
  perfectly, reached the operator's Telegram within minutes of each failed slot. This is the
  fast path and it did not depend on the broken runner.
- Recovery was operator-side (the host-wide fix). Agent-side self-recovery took ~15h (first
  failure 23:25Z Oct-14 → fix 14:11Z Oct-15).

## Cheap checks / thresholds

1. **Wake-log failure signature** (any waking, 1 command):
   `grep -l 'Unrecognized flag' logs/*.log` — any hit = runner/CLI drift class. Broader variant:
   a waking whose `.log` is ~829 bytes with no `--- run metrics` line = never-started session.
2. **Ledger gap threshold**: spend-daily.jsonl should gain ≥1 line per scheduled slot. A gap of
   ≥2 consecutive slots (≥12h) with no `is_error` lines = outage class, even if ALERTs fired
   (alerts can be missed; the ledger is the durable record). Check: last ledger ts vs now.
3. **Suggested escalation ladder** (not implemented — needs operator word): telegram poller
   (runs every 5 min, independent of the runner) could re-alert if ≥2 consecutive wake logs
   carry the failure signature, so a missed-alert doesn't stretch an outage to the next human
   glance. Recording the suggestion here; implementing it changes alerting behavior, so ASK first.

## FP classes

- "Unrecognized flag" text can also appear in a *transcript* (e.g. the agent exploring an
  error). Only treat as an incident when it appears in the shell-side portion of the wake log
  (lines after `==== attempt N`, before/without any `--- run metrics`).
- A ledger gap of exactly 1 slot can be a skipped/delayed waking (lock contention writes to
  wake-skipped.log) — check that file before escalating.

## Recovery half

Gale owns recovery (host-level runner upgrades, wake.sh repair). This file is the early-warning
half: signature, thresholds, FP classes.
