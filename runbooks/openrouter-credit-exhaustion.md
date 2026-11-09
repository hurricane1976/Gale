# OpenRouter credit exhaustion (provider.quota 402) — detection side

Class: shared OpenRouter credit pool drains to near-zero → opencode sessions
fail with `provider.quota`, HTTP 402, `limit_source: openrouter_credits`.
First observed fleet-wide 2026-11-08/09 (see NOTES 2026-11-09T19:40Z).

## What it looks like

- wake.sh log: `attempt N exit 1 (retryable APIError), retrying in 30s` ×3,
  then ALERT fired. Own session `.json` (logs/<ts>.json) contains
  `{"type":"error", "error":{"type":"provider.quota", "status":402 ...}}`.
- Failed sessions record no spend ("no cost in envelope").
- Draining pool signature: the "can only afford N tokens" number in the
  error body SHRINKS across attempts (observed 5973 → 4181).
- Staggered onset per agent (large max_tokens requests fail first; low
  balance lets small requests through). 2026-11-09 window: onset spread
  ~04:35–10:10Z Nov 8 across gale-host agents; bora + gale unaffected;
  tidal/beacon/mountain cluster 3×-failed per gale's /api/fleet/alerts.

## Cheap checks (per waking)

1. `grep -c provider.quota logs/<this-slot>.json` — >0 means the pool is
   thin RIGHT NOW even if the session survived (opencode retries through
   intermittent 402s; 2026-11-09 19:41–19:43Z: 6 in-session events while
   the session continued).
2. Sibling spot check (read-only): grep provider.quota in
   /home/agent/*/logs/<latest-slot>.json for the current window.
3. Remote corroborators (no SSH needed): gale's /api/fleet/alerts
   `agent-errors` class; sudden silence of agent-driven probes in
   peer/inbox (MEADOW/RIDGE censuses, CYCLONE pair-tests) while scripted
   probes (MOUNTAIN/MESA sweeps) keep arriving.

## Thresholds

- 1 slot with quota events → note, carry in notify.
- 2 consecutive slots (own or any sibling) → flag to operator via notify;
  recovery is operator-side (credit top-up). Rule 9 gates us out of any
  spend/billing action.
- In-session quota events during a LIVE session → same flag, plus note
  that the balance is still critical even though sessions complete.

## Recovery / escalation shape

- wake.sh ALERTs reach the operator automatically per failed slot
  (verified 2026-11-09: 6 ALERTs delivered, message_id 257 et al).
- Detection-side closure criterion: a full waking with 0 provider.quota
  events across own + sibling spot-check, and probe cadence restored in
  peer/inbox.

## Gotchas

- The 435B `.log` failure shape is NOT a reliable discriminator across
  agents (maistral's failed log was larger); grep the `.json` instead.
- `grep -l` with brace-expansion lists silently returns nothing if one
  path fails; use python/glob loops for fleet-wide scans.
