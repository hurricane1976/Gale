# Runbook: FreeToken LAN gateway (192.168.1.197:1919)

What it is: the FreeToken inference gateway on the same LAN box as the
Ollama runner (192.168.1.197). Was SIROCCO's own model path
(`freetoken/Qwen3.6-35B-A3B-NVFP4`) until the 2026-10-22 operator-directed
flip to `openrouter/~z-ai/glm-flash-latest` (see AGENT.md). Not a waking
dependency of mine since then — tracked for fleet-context and because the
box also hosts the LAN Ollama fallback (see ollama-runner.md).

## WRONG-PORT TRAP (learned the hard way 2026-11-06/07)

The gateway's ONLY port is `:1919`. The box 192.168.1.197 answers NOTHING
on `:8080`/`:8081`/`:443`/`:80` — those connections get refused (curl exit
7) and look exactly like a gateway outage when the gateway is fine.
**Four consecutive wakings (09:20Z/15:20Z/21:20Z Nov 6, 03:20Z Nov 7)
called the gateway "DOWN, service stopped, ≥24h" purely from `:8080/health`
probes; the gateway was serving on `:1919` the whole time** (verified
03:21Z Nov 7). The wrong-port habit likely came from conflating the LAN
gateway with the host-lane `:8080` listener on THIS host (gale-agent) —
that is a different thing (Gale's lane, watch item since Nov 3). Rule:
probe `:1919` on the LAN box; if you ever find yourself probing a
different port for this gateway, treat the "down" as unproven until
`:1919` is checked. Do not update the port here without seeing a working
`/health` response from it.

Fleet impact if DOWN: none to Sirocco's waking (OpenRouter path). Loss is
to whoever still consumes FreeToken models over the LAN (Gale/operator's
lane — rule 7: never restart anything on a machine that is not this host).

Probes (down vs slow):
- PROBE-URL NOTE: the gateway lives on the LAN box — probe
  `http://192.168.1.197:1919/health`, NOT `127.0.0.1:1919`. There is no
  listener on this host's localhost:1919; hitting it gives connection-
  refused and looks like a gateway outage when it is only a wrong address.
- PORT NOTE (2026-11-07): also NOT `192.168.1.197:8080` — that box never
  served the gateway on :8080 (or :8081/:443/:80). See WRONG-PORT TRAP
  above.
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
- 2026-10-26 ~14:11Z: FOURTH restart (uptime 4118s at the 15:20Z probe ⇒
  start ~14:11:5xZ, ~37.5h after the 3rd). Clean recovery, same
  version/model; did NOT restore Ollama :11434. See NOTES.md 2026-10-26
  entries.
- 2026-10-27 ~21:18Z: FIFTH restart (uptime 194s at the 21:21Z probe ⇒
  start ~21:18:2xZ, ~31.1h after the 4th — the 15:20Z "intervals
  lengthening" read did NOT hold; intervals now ~32.0/37.5/31.1h, i.e.
  ~31–37.5h with no clean trend, 5 restarts in ~4 days of observation).
  Clean recovery, same version/model, `maintenance: serving`; did NOT
  restore Ollama :11434. Landed ~2 min before the 21:20Z grid slot —
  near-simultaneity noted, causation unknown. See NOTES.md 2026-10-27
  entries.
- (bounces 6th–10th recorded in NOTES.md; ladder as of the 2026-11-07
  runbook revision: 6th ~15:18Z Nov 1 (ending the record ~114h stretch),
  7th ~21:09Z Nov 1 (~5.9h later), 8th ~22:53Z Nov 1 (~1.7h later), 9th
  ~00:02Z Nov 4 (~49.2h later), 10th ~01:47Z Nov 6 (~49.7h later). The
  10th bounce coincided with a MODEL SWAP: `/health` returned
  `Qwen3.8-Flash-Next-NVFP4` at the 03:20Z Nov 6 probe, replacing the
  long-standing `Qwen3.8-35B-A3B-Distill-NVFP4` string. Version unchanged
  throughout, `0.1.3+g9c635a157`.)
- 2026-11-06 ~15:20:12Z: ELEVENTH restart — inferred from the 03:21:30Z
  Nov 7 probe on `:1919` (uptime_s 43278; the four wakings in between
  mis-probed `:8080` and saw nothing — see WRONG-PORT TRAP). Post-10th
  stretch therefore ~13.6h. The model string REVERTED to
  `Qwen3.8-35B-A3B-Distill-NVFP4` at this bounce (the Next-swap did not
  persist); new instance_id `f2527b60…` confirms the process restart.
  Start lands ~4s after the 15:20Z grid slot — same near-slot-landing
  oddity as the 5th bounce (Oct 27), coincidence again noted.

What to do if down:
1. First verify you are probing the right port (`:1919` per PROBE-URL and
   PORT notes — a refusal on :8080 is NOT a gateway outage). Then re-probe
   `/health` and `ping 192.168.1.197` to split host-down vs service-down.
2. notify.sh the operator with raw probe output. Do NOT start/stop/
   restart anything on 192.168.1.197 — not this host.
3. If it matters for a live model need, the fleet fallback is OpenRouter
   (openrouter.md) / OpenCode Zen (opencode-zen.md); local shim
   127.0.0.1:11435 proxies Ollama :11434, not this gateway.

Release watch: N/A — version string comes from `/health`
(`version":"0.1.3+g9c635a157"` as of 2026-10-23). Log any change.
