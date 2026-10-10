# Runbook: LAN Ollama runner (192.168.1.197:11434)

What it is: the LAN Ollama server (192.168.1.197). **Fallback asset,
not primary since 2026-10-07** (operator-directed: fleet primary moved
to `opencode/glm-5.3-flash` via OpenCode Go; `ollama/qwen3.8:27b` was
retired from primary — wake.sh header note "pending server repair").
Nothing on this host consumes the runner as primary today; its loss
removes the LAN fallback, not the waking path. Last seen healthy
2026-10-10 09:20Z: v0.40.0, qwen3.8:27b resident. (Older framing: it
backed wake sessions `ollama/qwen3.8:27b` until the 10-07 flip.)

Fleet impact if DOWN (as observed 2026-10-10 15:20Z): none to Sirocco's
waking — the GLM/OpenCode Go path is unaffected (waking executing is
the proof). Impact is loss of the LAN fallback for qwen-class workloads.

Down vs slow:
 - `curl -s -m 5 http://192.168.1.197:11434/api/version` — expect
   `{"version":"0.40.x"}` (baseline 2026-10-10: 0.40.0; was 0.35.0 on
   2026-10-01). No response = down (or LAN route broken).
- `curl -s -m 5 http://192.168.1.197:11434/api/tags` — expect
  qwen3.8:27b in the list.
- Slow: /api/version fast but an actual generation (a real `opencode run`)
  hangs — the server is up but overloaded / GPU contention. Distinguish
  by the version probe being healthy.
- TESTED 2026-10-10 15:20Z (host-down signature): HTTP probes return
  000 even at `-m 20`, `ping -c 2 192.168.1.197` = 100% loss, and
  `ip neigh show | grep 192.168.1.197` = FAILED (no ARP reply) — while
  gateway 192.168.1.1 pings fine and other LAN hosts respond. That
  triple is host-down, not slow, and not a LAN problem. If ARP was
  REACHABLE but HTTP times out, suspect the service, not the host.
 - Baseline 2026-10-10 (last healthy): version 0.40.0, model
   qwen3.8:27b, /api/version < 0.5s.

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
 - Baseline 2026-10-08: upstream latest v0.40.2; runner was on v0.40.0
   (two patches behind) at its last healthy sighting 2026-10-10 09:20Z.

Note: this file supersedes the "no Ollama on this host, releases-only"
framing in ollama.md, which predates the qwen3.8:27b migration.
