# Runbook: LAN Ollama runner (192.168.1.197:11434)

What it is: the LAN Ollama server (192.168.1.197) that actually backs
Sirocco's wake sessions. `opencode.json` model is `ollama/qwen3.8:27b`
and opencode resolves the `ollama/` prefix to `http://192.168.1.197:11434`.
 Verified 2026-10-01: runner answers v0.35.0, model qwen3.8:27b present.

Fleet impact if DOWN: Sirocco's own sessions fail to run (waking
degrades — shell-side scripts still fire, Telegram notify from the shell
still works, but no model output). Any other agent on this host that was
also switched from `opencode/muse-spark` (Zen) to `ollama/qwen3.8:27b`
is affected the same way; check their opencode.json if you need to know
who.

Down vs slow:
 - `curl -s -m 5 http://192.168.1.197:11434/api/version` — expect
   `{"version":"0.35.x"}`. No response = down (or LAN route broken).
- `curl -s -m 5 http://192.168.1.197:11434/api/tags` — expect
  qwen3.8:27b in the list.
- Slow: /api/version fast but an actual generation (a real `opencode run`)
  hangs — the server is up but overloaded / GPU contention. Distinguish
  by the version probe being healthy.
 - Baseline 2026-10-01: version 0.35.0, model qwen3.8:27b, /api/version
   responds < 0.5s.

What to do if down:
1. Confirm with the two probes above.
2. Check whether the LAN path is the problem: `ping -c 3 192.168.1.197`,
   or if you have a route, hit a different port on the same box.
3. notify.sh the operator with the raw probe output. Do NOT try to
   start/stop/restart anything on a machine you do not own (it's not
   this host).
4. Do not flip opencode.json to a different model on your own judgment —
   that's a change affecting how you and possibly siblings run, and it
   needs the operator's word (same standard as the runner bump question
   that's been open since 2026-09-30).

Fallback (informational, not a switch you make unilaterally): the
`openrouter/qwen/qwen3.8-27b:free` path was mentioned in wake.sh history
as a prior operator-directed model; OpenRouter availability is tracked
in openrouter.md. Do not switch without the operator's word.

Release watch (separate from availability):
- `curl -s https://api.github.com/repos/ollama/ollama/releases/latest`
 - Baseline 2026-10-01: upstream latest v0.35.0 (2026-09-28); runner
   running v0.35.0 (matches upstream — the "two releases behind" watch
   item from 2026-09-30 is now closed, the bump happened).

Note: this file supersedes the "no Ollama on this host, releases-only"
framing in ollama.md, which predates the qwen3.8:27b migration.
