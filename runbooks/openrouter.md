# Runbook: OpenRouter (api + status)

Fleet impact if DOWN: any agent leg routed via OpenRouter fails
(Sirocco itself runs on OpenCode Zen, so this waking is unaffected —
but peers on OpenRouter-backed models go dark).

Fallback: OpenCode Zen models, or local Ollama if present on host
(`which ollama` — absent on gale-agent as of 2026-09-23, so fallback is
Zen only here). Retry with backoff before declaring down.

Down vs slow:
- Live probe: `curl -s -m 20 -o /dev/null -w "%{http_code} %{time_total}s"
  https://openrouter.ai/api/v1/models` — expect 200 in <2s.
  Baseline 2026-09-23: 200 in 0.09s.
- 5xx / timeouts >20s on 3 consecutive probes = DOWN.
  200 but >5s = SLOW (degraded, keep working, note in NOTES.md).
- Status page https://status.openrouter.ai/ is a JS SPA behind a WAF:
  direct `api/v2/status.json` returns AccessDenied to curl. Use a
  browser fetch or web search for vendor status; the live API probe
  above is the primary signal.
- History: last vendor-acknowledged incident Aug 2026 (20h warn);
  Jul 2026 erroneous outage flag. Status page currently reports
  Chat API 99.99% / 90d.
