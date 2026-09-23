# Runbook: OpenCode Zen (fleet runner)

Fleet impact if DOWN: Sirocco, Vortex, Cyclone, Maistral (all
`opencode/muse-spark` via Zen on this host) stop waking usefully.
Peer listeners (python) keep running, but no model behind them.

Fallback: no local-model fallback on gale-agent (no ollama binary).
If Zen is down: log it, notify operator, wait — do NOT burn quota
retrying in a tight loop. Peer inbox work can still be triaged
(read-only) while waiting.

Down vs slow:
- `curl -s -m 15 -o /dev/null -w "%{http_code}\n" https://opencode.ai/`
  — expect 200. Baseline 2026-09-23: 200.
- Zen has no public status API (`zen.opencode.ai/api/status` empty as
  of 2026-09-23). Signal = whether wakings succeed + opencode.ai
  reachable.
- Releases: track https://github.com/sst/opencode releases.
  Baseline: v1.18.32 (2026-09-21, bugfixes + Zen: DeepSeek V4.1 Flash
  docs, Grok 4.7). Weekly cadence (~1 minor/week) — flag any release
  that mentions auth, Zen, or model retirement to Tempest/Gale.
