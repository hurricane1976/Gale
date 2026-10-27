# Runbook: FreeToken LAN gateway (192.168.1.197:1919)

What it is: the FreeToken inference gateway on the same LAN box as the
Ollama runner (192.168.1.197). Was SIROCCO's own model path
(`freetoken/Qwen3.6-35B-A3B-NVFP4`) until the 2026-10-22 operator-directed
flip to `openrouter/~z-ai/glm-flash-latest` (see AGENT.md). Not a waking
dependency of mine since then — tracked for fleet-context and because the
box also hosts the LAN Ollama fallback (see ollama-runner.md).

Fleet impact if DOWN: none to Sirocco's waking (OpenRouter path). Loss is
to whoever still consumes FreeToken models over the LAN (Gale/operator's
lane — rule 7: never restart anything on a machine that is not this host).

Probes (down vs slow):
- PROBE-URL NOTE: the gateway lives on the LAN box — probe
  `http://192.168.1.197:1919/health`, NOT `127.0.0.1:1919`. There is no
  listener on this host's localhost:1919; hitting it gives connection-
  refused and looks like a gateway outage when it is only a wrong address.
- SCHEME NOTE (learned 2026-10-27): `:1919` serves PLAIN HTTP — no TLS.
  Probe with `http://`. If you mistakenly use `https://` you get
  `curl: (35) ... wrong version number` — that error signature means the
  gateway is up and serving; it is not an outage. Fix the scheme and
  re-probe.
- Health: `curl -s -m 5 http://192.168.1.197:1919/health` — expect
  `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4",...,"uptime_s":N,
  "maintenance":"serving"}`. No response = down (check ping to separate
  host-down from service-down, same method as ollama-runner.md).
- Slow: `/health` fast but generation stalls — server up, capacity issue.
  Distinguish by the health probe being healthy.
- `uptime_s` is the continuity signal: it resets to a small value on every
  process restart. Record implied start time = now - uptime_s when the
  value shrinks between wakings.

Observed history (probes recorded in NOTES.md):
- 2026-10-22: continuous since ~01:45Z (~25.6h uptime at 03:20Z waking).
- 2026-10-23 ~14:51Z: first observed restart (uptime 1828s at 15:20Z
  probe, after 113669s continuous at 09:20Z). Clean recovery, same
  version `0.1.3+g9c635a157`, same model.
- 2026-10-23 ~16:40Z: second restart (uptime ~16.8ks at 21:20Z probe ⇒
  start ~16:40:33Z). Clean recovery, same version/model. Two bounces in
  one day is a new pattern — watch for a third; if it keeps cycling,
  flag to Gale/operator as a possible crash loop (rule 7: report, never
  action remotely).
- Notably: neither restart restored Ollama :11434 (still connection-
  refused) — whatever manages that box restarts the gateway only.
- 2026-10-24 03:21Z: NO third bounce — uptime 38413s (~10.7h) at probe ⇒
  start still ~16:40:33Z Oct 23, continuous through the night, same
  version/model. The two-in-one-day pattern did not immediately become a
  crash loop; keep recording uptime_s each waking and only escalate if
  bounces recur.
- 2026-10-25 ~00:39Z: THIRD restart (uptime 9651s at 03:20Z waking probe ⇒
  start ~00:39:35Z Oct 25, ~32h after the 2nd). Clean recovery, same
  version/model. See NOTES.md 2026-10-25 entries.
- 2026-10-26 03:21Z: NO fourth bounce — uptime 96142s (~26.7h) at probe ⇒
  start still ~00:39Z Oct 25, continuous ~26.7h; same version/model,
  `maintenance: serving`. Three restarts in ~34h of observation but no
  repeat since; bounce watch stays armed.

What to do if down:
1. Re-probe `/health` and `ping 192.168.1.197` to split host-down vs
   service-down.
2. notify.sh the operator with raw probe output. Do NOT start/stop/
   restart anything on 192.168.1.197 — not this host.
3. If it matters for a live model need, the fleet fallback is OpenRouter
   (openrouter.md) / OpenCode Zen (opencode-zen.md); local shim
   127.0.0.1:11435 proxies Ollama :11434, not this gateway.

Release watch: N/A — version string comes from `/health`
(`version":"0.1.3+g9c635a157"` as of 2026-10-23). Log any change.
