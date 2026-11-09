# Runbook — OpenRouter credit exhaustion (fleet wake-outage class)

**Incident:** 2026-11-08 ~04:15–04:37Z → 2026-11-09 ~13:41–17:04Z (~37h).
All OpenRouter agents on this host (glm-5.3-flash: zephyr, squall, tempest;
ling-3.0-flash: chinook, tramontane, vortex; plus the 6 remaining agents whose
wake.sh ollama comments are stale — they also hit OpenRouter, per transcripts)
failed **every** cron slot with OpenRouter **HTTP 402 Payment Required**:
"This request requires more credits ... You requested up to 131072 tokens,
but can only afford 4181." Each failed waking fired its own Telegram ALERT.
Control group: gale + bora run Claude Code Sonnet (operator-directed
2026-10-27, different provider/billing) and ran all 7 slots in the window
normally. Credits were topped up between ~13:41Z (last failures seen) and
17:04:24Z Nov 9 (first success: vortex), confirmed by my own 17:25Z waking.
Remote peers affected too: MEADOW (self-identifies "GLM Flash") census went
silent after 00:08Z Nov 8 — no census for 36h+.

## What caught it / what would catch it sooner

1. **Own transcript shape** (caught here, ~37h late because every watcher was
   blind together): wake transcript shows
   `attempt N exit 1 (retryable APIError)` ×3 then `ALERT fired`. The 402 body
   was captured in sibling transcripts (grep for `402` or `requires more
   credits` in `logs/2026*.log` + opencode stderr). A 402 is NOT a transient
   APIError class — it never self-heals without a balance change.
2. **Cheap early-warning check that works even when I am the casualty** —
   sibling-ledger staleness sweep (add to each waking): read
   `/home/agent/<name>/logs/spend-daily.jsonl` last line ts for all 14 agents
   (gale at `/home/agent/agent`). **Any agent >25h stale = watch flag; any
   cohort-wide staleness (≥3 agents) = notify-grade fleet incident even if my
   own run succeeded.** Label every agent's path explicitly (method note in
   runbooks/spend-trend-break.md — gale is `/home/agent/agent`, not
   `/home/agent/gale`).
3. **Cohort attribution:** a whole-cohort outage that spares the non-OpenRouter
   agents (gale/bora) = provider-account-level problem (credits, key, quota),
   not a host/network problem. Host journal clean (0 ENOSPC, 0 networkd
   timeouts, 0 reboot) in the window corroborates.
4. **Fallback design flaw found (not fixed — operator-directed config):**
   `FALLBACK_MODEL="openrouter/z-ai/glm-5.3-flash"` equals PRIMARY in
   zephyr/squall/tempest wake.sh (comments still describe the old DeepSeek
   fallback), so the fallback retried the identical dying model — zero
   resilience. A true secondary (different provider, e.g. the historical
   deepseek target) would have kept 12 agents alive through this. Operator
   call; recorded in ASK.md.

## Thresholds going forward

- Own 402 in transcript → notify immediately (not the 2-consecutive retryable
  class; a 402 is deterministic).
- Cohort staleness ≥3 agents >25h → notify, quote error shape from one
  transcript, name the spared cohort as evidence.
- Single agent >25h stale → watch flag (their lane may be dark for their own
  reasons — the maistral-2026-10 precedent), notify only on ≥3.

## Post-incident notes

- ~72 failed slot-attempts across 12 agents × 6 slots, each firing an ALERT —
  alert flood is the intended design and likely what prompted the operator
  top-up, but an alert-dedupe (one notify per outage window per agent, not per
  slot) is worth suggesting.
- LAN ollama path (192.168.1.197:11434 direct = no connect; 127.0.0.1:11435
  shim = 502) is down/legacy; every wake.sh still carries stale ollama-era
  comments. Not load-bearing since the 10-07 fleet move — note only.
