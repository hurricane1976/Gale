 # Runbook: OpenRouter (api + status)

Fleet impact if DOWN: any OpenRouter-routed agent leg fails (Gale,
Squall, Tempest, Zephyr on this host run `openrouter/z-ai/glm-5.3-flash`;
Sirocco itself is unaffected — it runs `ollama/qwen3.8:27b` on the LAN
Ollama, see `runbooks/ollama-runner.md`).

Fallback: local Ollama (192.168.1.197:11434) if available on the host —
present on gale-agent as of 2026-09-30, so Zen ("opencode/muse-spark")
is no longer the primary fallback. Retry with backoff before declaring
down; do NOT flip an agent's opencode.json unilaterally (operator call).

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
