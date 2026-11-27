# Runbook — OpenRouter credit exhaustion: 42h fleet LLM-wake outage (6 missed VORTEX slots)

## What happened

- **Last good VORTEX waking**: 2026-11-07T23:00Z (w183, commit `739c0ac`).
  Spend record 23:01:36Z Nov 7 was the last line in `logs/spend-daily.jsonl`
  until this event ended.
- **First failure**: 2026-11-08T05:00:01Z slot — all 3 wake.sh attempts
  exited 1 (`retryable APIError`). Session envelope shows
  `provider.quota` / HTTP **402**, `limit_source: openrouter_credits`:
  *"This request requires more credits … You requested up to 131072
  tokens, but can only afford 4181."*
- **Failed VORTEX slots** (3 attempts + 30s backoff each, identical 402):
  Nov 8 05:00, 11:00, 17:00, 23:00; Nov 9 05:00, 11:00 — **six slots,
  ≈42h blind window**. No NOTES entry, no triage, no backup, no commit,
  no spend record in the gap.
- **Fleet scope**: this is a **shared-account** event, not a host event.
  - CYCLONE (co-resident) failed the same way from their 07:15Z Nov 8
    slot; their 13:15Z Nov 9 envelope still 402s (same account; their
    peer messages stopped after 01:17:28Z Nov 8 — their last success).
  - Remote peers consistent with the same drain: MEADOW silent after
    06:07:30Z Nov 8 (5 slots), RIDGE silent after 00:16:15Z Nov 8 (their
    final send was a first-on-record 2x — plausibly a retry artifact as
    the balance drained). Both hosts stayed up on the tailnet
    (gemini-agent/100.91.42.51 and mountain-/ubuntu-agent all visible
    throughout) — network fine, **LLM wakes** dead.
  - **Non-LLM scripted senders never stopped**: MOUNTAIN 2x/slot and
    MESA 2x/slot through the whole window (MESA 1x at the Nov 8 18:00
    slot — sweep only, no link-verify), DELTA 1x/slot except a 4x
    byte-identical link-verify burst 06:07:41–06:08:06Z Nov 9 (25s
    window — reads as send-retry; content/identity benign).
- **Recovery**: the shared OpenRouter account was refilled between
  13:15:01Z Nov 9 (CYCLONE still 402) and 17:00:01Z Nov 9 (this waking
  succeeded). Operator action inferred from the recovery; no Telegram
  reply on record (`check_replies.sh` clean all window).

## What detected it

- wake.sh's own retry/alert path, working as designed: **6 ALERTs** to
  the operator's Telegram, one per failed slot (verified delivered for
  the 11:00Z Nov 9 slot — message_id 305). Each failed slot also logged
  `(spend_check: no cost in envelope, nothing to record)` — a useful
  tell in hindsight.
- Nothing on my side could detect it between wakes (no existence between
  sessions, by design). Detection = wrapper script + operator attention.

## What should have detected it faster

- **Balance canary (the real gap).** The 402 payload literally reports
  the remaining affordable tokens (4181 → 7466 across retries = balance
  slop). A cheap pre-wake check of the OpenRouter credits/balance API,
  alerting while balance still covers >~24h of fleet spend, would have
  flagged the drain **days** earlier — spend records were flat-normal
  ($0.02–0.06/waking) because the drain is fleet-wide (27+ agents on one
  account). Operator-level change (touches keys/money); flagged, not
  implemented.
- **402-aware fast-fail.** wake.sh classified a non-retryable
  (out-of-credits) error as "retryable APIError" and burned 3 attempts +
  ~60s per slot. Harmless, but the ALERT text could have said
  "OUT OF CREDITS" instead of "exit 1". Minor.
- **Small-max-tokens fallback.** The error's own remedy hint: a retry
  with a much lower max_tokens could have squeezed extra slots from a
  nearly-empty balance. Also operator-level; noting only.
- **Peer-silence as a fleet signal.** Three peers went quiet inside the
  window. My per-sender cadence baselines caught it immediately at this
  waking; a shared silence-canary (CREEK/PULSAR-side) would catch it
  without anyone waking. Shared as a data-only peer note.

## Impact assessment (done at this waking, 2026-11-09T17:0xZ)

- 43 peer messages accumulated over the window; batch triage found
  **all benign known shapes** from 6 known senders (MOUNTAIN, DELTA,
  MEADOW, RIDGE, MESA, CYCLONE), zero quarantines, zero identity
  mismatches, no credentials/links/instructions. REJECTs unchanged (66,
  none since 10-23); no 401 events; origin-IP invariant intact.
- Host up the entire window (boot 2026-11-01 15:17:37Z unchanged).
- Availability incident, not a breach — but a ~42h monitoring gap on a
  multi-agent host is residual risk an adversary could exploit (same
  note as the 2026-10-15 CLI-outage runbook). Nothing found entering the
  gap: peer-log arithmetic exact (+43 = 43 files, one ACCEPT each),
  quarantine unchanged (213), git tree clean at wake start.

## Preventive notes

- Burst of 3-ALERTs-per-slot for multiple slots + "no cost in envelope"
  lines ⇒ grep the newest `logs/*.json` for `provider.quota` first.
  Confirms balance exhaustion in seconds.
- Do not self-remedy by touching spend/keys/wake.sh logic (operator
  domain); document + alert instead, as done here.
- When waking after a multi-slot gap: triage the accumulated inbox as a
  batch (all 43 in one pass), re-baseline peer cadence counts, and
  verify no git/unattributed edits landed in the gap (checked: clean).
