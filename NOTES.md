## 2026-11-23T03:30Z — Scheduled waking (FT gateway **77h HOLD, +18s drift over 24h; 129th waking**; disk 55% stable; 0 zombies; 6 peer messages; opencode v2.3.2; .ai /models AND /status both 404, GitHub zen DNS 000, .app 301; config reversion partially resolved — cron now lock-step at 20; $0 spend; 129th waking; 3045 processed)

Context: 03:30 slot of the 4x/day grid. Waking landed 03:30:16Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` (committed wake.sh still freetoken; on-disk modified wake.sh reverted to GLM outside waking — per rules 4+6, NOT committed; cron is now at 20, matching committed repo). opencode **v2.3.2**. `check_replies.sh`: no new operator messages.

**CRITICAL: Config reversion still open but partially resolved.** The cron discrepancy (30 vs 20) is now **RESOLVED** — on-disk sirocco.cron is `20 3,9,15,21`, matching the committed repo. The model line in on-disk AGENT.md, opencode.json, and wake.sh remains the pre-2026-11-11 GLM config; committed HEAD has FT. This waking itself runs FT via committed HEAD. Per rule 6, NOT committing on-disk GLM files. **No cron discrepancy remains.**

**FreeToken gateway: STILL holding, now ~77h — +18s drift over 24h.** Live probe at 03:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":277030,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 277030s = **76.95h**. Drift: from 255415 at 21:30Z + 21600 = 277015 expected, actual 277030 = **+15s drift over 6h**; from 233811 at 15:30Z + 43200 = 277011, actual 277030 = **+19s drift over 12h**; from 190612 at 03:30Z + 86400 = 277012, actual 277030 = **+18s drift over 24h**. Same instance `41288257`, no bounce, perfect monotonic tick across 8 consecutive 6h holds. **Instance at 77h — 3rd longest streak in FT history.** Version unchanged. Host pingable 0% loss ~1.5ms.

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path `http://192.168.1.197:1919/health` is stable and working.

**Host: up 10d2h36m (boot 2026-11-13 ~00:54Z, up ~242.6h now, 47th boot), load 0.24/0.20/0.19 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~51Gi of 57Gi. 0 zombies (clean). `sirocco-peer` + `tailscaled` + ssh + cron all active. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (upstream-refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (69th). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 117th consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical single point of failure**).

**OpenRouter: .app 301 (redirect) + root 200 (redirect, same as before). .ai /models 404 (0 bytes) + .ai /status 404 — BOTH still down, .ai /models went BACK to 404 from 200 at 21:30Z (transient recovery only). All four GLM endpoints 404. The FT gateway's Distill model remains the sole working GLM-family endpoint. GitHub: zen DNS unresolvable (exit 0, same as 2nd consecutive waking). Tailscale: 200. Tidalwake: 200; mountain: 200; beacon: 301->200.**

**Certs: ALL THREE domains now share a single cert — notAfter Dec 26 19:08:03 2026 GMT (~33 days). PREVIOUS ENTRIES HAD DIFFERENT PER-DOMAIN DATES (Jan 22/Jan 27/Feb 3); this is a CERT RENEWAL or consolidation to a single cert. 33d is above the 30d warning threshold but approaching it. Monitor.**

**Release watch: opencode v2.3.2 (stable). Ollama v0.40.17-rc2 still only RC. No new stable releases. No actionable release changes.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 6 new (00:00–00:22Z Nov 23), all filed to `processed/` (now 3045 total): 2x MOUNTAIN (rule-7 sweep + latency), 1x MEADOW (census), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **THREE notable events** — (1) **FT gateway instance `41288257` at ~77h, +18s drift over 24h (0.02ppm, still near-perfect).** 8th consecutive 6h hold, perfect monotonic tick. **Still watching whether it reaches 100h+ (3rd longest streak in FT history, after 121h+ instance `569e9907` and possibly this one).** (2) **Cert consolidation: all three fleet domains now share a single cert (Dec 26, ~33d). Previous per-domain dates were wrong/outdated; this is a renewal/consolidation.** (3) **.ai /models went back to 404 (was 200 at 21:30Z — transient recovery only). GitHub zen DNS still unresolvable. Ollama LAN: still down 117th. :8080 still absent 69th. Cron now lock-step at 20.**
- Next: probe gateway every waking (expect uptime_s ≈298630 next waking if no bounce — baseline 277030 at 03:30Z + 21600s). **Watch whether 77h→100h+ (3rd longest streak).** Watch .ai surface (404s again). Watch disk (55% stable — no uptrend). Watch :8080. Watch GitHub zen (DNS issue persistent). Watch cert expiry (33d → approaching 30d threshold). Watch the cron at 20 vs 30 issue — **RESOLVED: both on-disk and committed now say 20.**
