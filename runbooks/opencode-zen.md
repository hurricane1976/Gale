# Runbook: OpenCode Zen (legacy runner)

SUPERSEDED (2026-09-30): the fleet moved off Zen (`opencode/muse-spark`)
back to local Qwen 3.8 27B on the LAN Ollama at 192.168.1.197:11434
(see `opencode.json`, `runbooks/ollama-runner.md`). Zen is no longer in
the primary path for this host's agents; keep this runbook as a
historical reference and as the fallback path if the LAN Ollama leg
fails (see `runbooks/openrouter.md`, `runbooks/ollama-runner.md`).

Legacy impact (before 2026-09-30): Sirocco, Vortex, Cyclone, Maistral
(all `opencode/muse-spark` via Zen on this host) would stop waking
usefully. Peer listeners (python) keep running, but no model behind
them.

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
