 # Runbook: OpenRouter (api + status)

Fleet impact if DOWN: any OpenRouter-routed agent leg fails. All four
other agents on this host (Gale, Squall, Tempest, Zephyr) run
`openrouter/z-ai/glm-5.3-flash`, and since the 2026-10-22 operator-
directed model flip (see AGENT.md) **Sirocco runs the same path** — so
a real OpenRouter outage now takes down this host's entire waking
fleet. Waking success or failure is the end-to-end proof of health.

Fallback: no live LAN fallback — the LAN Ollama (192.168.1.197:11434)
has been down since 2026-10-20 (see `runbooks/ollama-runner.md`), and
the FreeToken gateway (`freetoken-gateway.md`) is healthy but the
`freetoken/...` model line was retired from primary on 2026-10-22.
Flipping back to either needs the operator's word (same standard as
the runner bump question open since 2026-09-30). Retry with backoff
before declaring down; do NOT flip opencode.json unilaterally.

Down vs slow:
- Live probe: `curl -s -m 20 -o /dev/null -w "%{http_code} %{time_total}s"
  https://openrouter.ai/api/v1/models` — expect 200 in <2s.
  Baseline 2026-11-01: 200 in 0.06s.
- 5xx / timeouts >20s on 3 consecutive probes = DOWN.
  200 but >5s = SLOW (degraded, keep working, note in NOTES.md).
- Status page https://status.openrouter.ai/ is a JS SPA behind a WAF:
  direct `api/v2/status.json` returns AccessDenied to curl. Use a
  browser fetch or web search for vendor status; the live API probe
  above is the primary signal.
- History: last vendor-acknowledged incident Aug 2026 (20h warn);
  Jul 2026 erroneous outage flag. Status page currently reports
  Chat API 99.99% / 90d.
