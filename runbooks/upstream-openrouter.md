# Upstream: OpenRouter (model serving)

Role: Upstream Dependency & External-Service Health. The fleet's working
models are served through OpenRouter — this host's `opencode.json` pins
`openrouter/z-ai/glm-5.3-flash`. This is the per-dependency playbook: what
breaks when it is down, what the fleet falls back to, and how to tell
"down" from "slow".

## What the fleet uses

- Model pin: `openrouter/z-ai/glm-5.3-flash` in `opencode.json` (pinned by
  the operator's 00:46:56Z Oct 23 batch edit; every opencode session on this
  host bills through OpenRouter at cents-per-session scale — `spend_check.py`
  records each run to `logs/spend-daily.jsonl`).
- The API surface: `https://openrouter.ai/api/v1/models` (catalog) and the
  chat-completions endpoint behind it.

## Health checks (each waking)

1. **The real signal — the API itself:**
   `curl -s https://openrouter.ai/api/v1/models` → expect HTTP 200 in <1s,
   catalog of ~460 models. Re-verify the pinned id is still listed — model
   retirements happen upstream and only ever show up as counts drifting.
2. **Status page (secondary — see history):** the working source is
   `https://status.openrouter.ai` (HTTP 200). There is no public legacy JSON
   API on the new platform — the check is "page loads", not an indicator
   string. The API check in (1) carries the real weight.
3. `opencode --version` — catch local CLI drift vs the released version.

## Status-page history

- Through w154 (2026-10-27 16:35Z): `openrouter.statuspage.io/api/v2/status.json`
  returned HTTP 200 with a `{"status": {...}}` payload.
- At w155 (2026-10-27 22:35Z): the same URL returns HTTP 302 →
  `https://www.statuspage.io` (Atlassian marketing page, HTML body). A
  control tenant (`slack.statuspage.io`) still serves its own status JSON,
  so the redirect is specific to the openrouter tenant — read as: OpenRouter
  moved off statuspage.io.
- New home `status.openrouter.ai` serves HTTP 200 (Atlassian's new statuspage
  build; page title "openrouter"). Its `/api/v2/status.json` and sibling
  endpoints return 403 (S3 AccessDenied) — the legacy v2 JSON endpoints are
  not public on the new platform.
- Consequence: the waking check becomes "new page HTTP 200 + models API
  HTTP 200"; indicator-string parsing is gone until a public endpoint
  surfaces on the new platform.
- RESOLVED w207 (2026-11-09 22:35Z): the `/api/v2/*` endpoints stayed
  403/AccessDenied through every slot from w195 through w207 (the w198
  "partial clear" never extended to the JSON endpoints). Per the w198/w199
  handoff, **the models API (`/api/v1/models` HTTP 200 + pinned id listed)
  is hereby the OFFICIAL OpenRouter status source**; the status page stays a
  secondary liveness check ("page loads"). Treat any future indicator-string
  parsing as gone unless a public JSON endpoint reappears.

## Down vs slow

- **Slow:** models API answers 200 but in >5s, or opencode calls stall then
  complete. Record the latency, change nothing — it usually resolves.
- **Down:** 5xx, connection refused, or sudden 401/402 on the key. Check the
  status page; if the API itself is down, sessions fail with retryable
  APIError and wake.sh ALERTs fire fleet-wide. Do not debug the local
  harness first — confirm upstream before touching anything local.

## Quota (HTTP 402) — the Nov 2026 outage class

- **What it looks like:** sessions die at an early model call with
  `provider.quota` / HTTP 402 — "This request requires more credits, or
  fewer max_tokens. You requested up to 131072 tokens, but can only afford
  N." Because the requested budget (context + max_tokens) exceeds what the
  remaining balance covers, even a small session cannot start. wake.sh
  classifies the exit as retryable, burns all 3 attempts per slot, fires the
  operator ALERT each slot, and records "no cost in envelope" (no spend
  rows while it lasts).
- **Real event:** ~2026-11-08 04:35Z the operator's OpenRouter credit
  balance ran out mid-w200 (its attempt 1 completed `backup.sh`, then died
  on the next call). Every slot w200–w206 (Nov 8 04:35Z → Nov 9 16:35Z, 21
  attempts across 7 slots) failed 402. **No data lost** — the tree stayed
  clean at `faabac5` the whole time, nothing was in flight, and the rest of
  the fleet (on non-OpenRouter models) kept waking normally. The operator
  topped up between Nov 9 16:36Z and 22:35Z (inferred: w207's attempt 1
  runs clean). All 7 ALERTs delivered (last verified message_id 279).
- **402 vs "down":** a true API outage fails fast with 5xx/network errors
  and would hit every OpenRouter-billed agent; a 402 is account-level — the
  models API keeps answering HTTP 200 while sessions fail. Check the models
  API and the 402 body before debugging the local harness.
- **Watch item raised w207 (operator's call, no action without their word):
  ** an early-warning hook for low balance (poll the credits/balance
  endpoint each waking and alert under a threshold, or alert when two
  consecutive slots produce no spend row) would turn the next exhaustion
  into a one-slot event instead of a seven-slot one.

## Upstream changes (catalog retirements, API deprecation)

- **API v2 deprecation (w215, 2026-11-12 04:00Z):** `/api/v2/*` returns **404 Not Found** across ALL endpoints (models, status.json, summary.json, individual model GET). The entire v2 path is deprecated — not 403-AccessDenied, not rate-limited, not missing a scope. This is a full retirement of the API v2 surface. The w207 "models-API-only official" status source decision (from the earlier 403 pattern) now applies to **`/api/v1/models`** exclusively; the status page check is purely liveness ("HTTP 200 + body").
- **Model retirement (w215, 2026-11-12 04:00Z):** The pinned model `gz4q0b1f4fz36b1f7fz0` (`openrouter/z-ai/glm-5.3-flash`) is **no longer listed** in the v1 catalog (verified via `GET /api/v1/models/gz4q0b1f4fz36b1f7fz0` → 404). The highest Z.ai GLM model is now `z-ai/glm-5.1` (GLM 5.1). The GLM 5.3 series has been fully retired. **Impact:** Any session that pins this model will fail with the "model not found" error. FreeToken's proxy (192.168.1.197:1919) may still resolve it — but if the proxy's upstream registry is also updated, the proxy will fail too. **This is a fleet-wide pin break, not a quota break.**
- **Catalog count (w215):** 467 total models (+7 from w214's 466; +24 since w207's 460). No individual model list maintained (too noisy for a per-waking record).
- **Model retirement signal:** "suddenly the count jumps and the pin is gone" is a clean retirement signal. Check the v1 catalog endpoint and compare counts against the known pin.

## Fallbacks

- Fleet primary is OpenRouter. A FreeToken LAN model
  (`freetoken/Qwen3.6-35B-A3B-NVFP4`, 256K ctx) was the fleet model before
  the 2026-10-22 operator batch edit — a proven fallback shape. Any pin
  change is operator-directed (fleet-wide batch edit to `opencode.json`);
  I never change the pin.
- The local Ollama shim `127.0.0.1:11435` is a third path. It has been
  degraded (HTTP 502, upstream connection refused) continuously since before
  onboarding — never read it as a signal about anything else, and do not
  count it as available capacity.
- **CRITICAL — FreeToken proxy `192.168.1.197:1919`: GLM 5.3 Flash `gz4q0b1f4fz36b1f7fz0`
  is GONE from both OpenRouter v1 catalog AND FreeToken proxy (verified
  2026-11-12T10:35Z). FreeToken proxy currently serves ONLY
  `Qwen3.8-35B-A3B-Distill-NVFP4`. This is the SAME DEAD CLASS as a
  quota-outage: if the proxy + all fallbacks die, every session dies.
  No GLM-5.1 model exists on FreeToken proxy. Operator should plan pin
  update to `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` (already committed
  in w216 migration). Do NOT rely on GLM 5.3 Flash as a fallback.
