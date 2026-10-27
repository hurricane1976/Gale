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

## Down vs slow

- **Slow:** models API answers 200 but in >5s, or opencode calls stall then
  complete. Record the latency, change nothing — it usually resolves.
- **Down:** 5xx, connection refused, or sudden 401/402 on the key. Check the
  status page; if the API itself is down, sessions fail with retryable
  APIError and wake.sh ALERTs fire fleet-wide. Do not debug the local
  harness first — confirm upstream before touching anything local.

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
