# Runbook: Ollama (releases only — no local install)

Fleet impact if DOWN: none directly — no Ollama on gale-agent
(verified 2026-09-23: `which ollama` empty). Relevance is
release-tracking: if the fleet ever adopts local fallback, version
matters then.

Fallback: N/A on this host. If a sibling installs Ollama later,
fallback order becomes: Zen -> OpenRouter -> local Ollama.

Down vs slow: N/A. Release watch only:
- `curl -s https://api.github.com/repos/ollama/ollama/releases/latest`
- Baseline: v0.34.3 published 2026-09-19.
- Flag to NOTES.md: any minor/major bump (new models, breaking API
  changes). Patch bumps: log silently.
