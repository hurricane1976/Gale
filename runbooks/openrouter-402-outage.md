# OpenRouter 402 credit-exhaustion outage (2026-11-08 → 2026-11-09)

First observed on chinook; likely fleet-wide for every agent sharing the
same OpenRouter account on this host. Written by CHINOOK #251
(2026-11-09 18:50Z) on the first waking after recovery.

## What happened

- Last good run: chinook #250, 2026-11-08T00:50Z (ledger line
  2026-11-08T00:51:23Z, $0.0814).
- Every subsequent slot — 11-08 06:50 / 12:50 / 18:50, 11-09 00:50 /
  06:50 / 12:50 — exited 1. First model call returned HTTP 402
  `"This request requires more credits, or fewer max_tokens"` with
  `"requested up to 131072 tokens, but can only afford 3344..25187"`
  (balance near zero; the affordable-token number decays toward 4181
  across slots).
- wake.sh behaved correctly: 3 attempts, 30 s apart, classified
  retryable APIError, exit 1, red-flag Telegram per slot (last seen
  message id 344 at 2026-11-09 12:51Z), spend_check recorded nothing
  ("no cost in envelope").
- Impact window ≈ 42 h: no NOTES/ASK/git/backup for chinook; peer
  inbox kept filling (+41 msgs, archived at recovery); remote peers
  (MOUNTAIN, DELTA, MESA, MEADOW, RIDGE, …) unaffected — their
  accounts/hosts are separate, so the outage scopes to the shared
  OpenRouter account.
- Recovery: credits were topped up between 11-09 12:51Z (last 402) and
  18:50Z (#251 ran clean end-to-end); assumed operator action.

## Signature (fast diagnosis next time)

- Session .json stuck at ~9,410 bytes across slots (normal ≈ 100K–
  500K+) with a ~435-byte .log → first-call failure, not session length.
- `grep -o "can only afford [0-9]*" logs/<slot>.log` → 402 family +
  near-zero affordable tokens.
- Distinguish: 402 payment/credits, 401 auth/token, 429 rate limit.
- Zero-byte stale-named logs (`20261107T*.log` touched 11-09 00:54)
  were cosmetic fallout, not a second fault.

## Recovery checklist (first waking after credits return)

1. Verify scope: own slot ran (you are reading this) → check whether
   co-located siblings also failed (read-only peek at sibling
   `logs/` newest sizes) and confirm remote peers stayed live.
2. Confirm the alert path worked while the agent path was down:
   `logs/notify_last_response.txt` shows the red-flag reached the
   operator's chat.
3. Do NOT back-fill NOTES for the dark slots — failed slots are not
   wakings; continue numbering and mark the gap explicitly.
4. Normal routine resumes: archive inbox, `./backup.sh` + verify,
   commit, spend snapshot, pings.
5. ASK.md entry + notify.sh to the operator (cause, window, ask).

## Prevention (proposed — operator's call, see ASK.md 2026-11-09)

- Recent burn is ~$3.5–4.7/day; at that run rate a fixed balance drains
  with no signal until the first 402. A per-waking minimum-balance
  check (alert when balance < ~3 days burn ≈ $12, queried from the
  OpenRouter credits endpoint with the existing key, never printed)
  would turn this outage class into a scheduled top-up.
- Cheaper fallback for whoever owns wake.sh: when the final error is
  402, send a distinct red-flag text ("credits exhausted — expect
  silence until top-up") instead of generic exit-code-1, so the cause
  is visible from the phone.
