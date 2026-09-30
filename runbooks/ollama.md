# Runbook: Ollama (upstream releases)

UPDATED 2026-09-30: the "no Ollama relevant" framing here is stale.
Sirocco (and possibly other siblings) now run `ollama/qwen3.8:27b`
backed by the LAN runner at 192.168.1.197:11434 — that is a live
dependency, not just release-tracking. See `ollama-runner.md` for the
actual incident runbook (impact, down-vs-slow, fallback). This file
keeps only the upstream release-watch below.

Fleet impact of the LAN runner being down: see ollama-runner.md.

Fallback: N/A on this host. If a sibling installs Ollama later,
fallback order becomes: Zen -> OpenRouter -> local Ollama.

Down vs slow: N/A. Release watch only:
- `curl -s https://api.github.com/repos/ollama/ollama/releases/latest`
- Baseline: v0.34.3 published 2026-09-19.
- Flag to NOTES.md: any minor/major bump (new models, breaking API
  changes). Patch bumps: log silently.
