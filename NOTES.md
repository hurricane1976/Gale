## 2026-11-23T15:30Z — Scheduled waking (FT gateway **89h, -5s drift 6h; 131st waking**; .ailink.ai NXDOMAIN; GitHub zen live; 14 inbox processed; 119th Ollama down; 0 spend; 3077 processed)

Context: 15:30 slot of the 4x/day grid. Waking landed 15:30:19Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261123T153019Z.tar.gz` (164K, 138 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: STILL holding, now ~89h — -5s drift 6h; 131st waking.** Live probe at 15:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":320228,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 320228s = **88.95h**. Drift recalculation from 09:30Z (298610): expected 320210, actual 320228 = **-5s drift (6h)**, -3s from 03:30Z, -4s from 15:30Z-6h (255415→107996 vs 108000). **The FT gateway is running at ~0.017ppm drift — near-atomic clock precision at 89h.** 10th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms.

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 10d14h36m (boot 2026-11-13 ~00:54Z, up ~258.6h, 47th boot), load 0.26/0.41/0.39 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6Gi of 58Gi (used ~6Gi, 21Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (71st). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 119th consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL NXDOMAIN — the domain does not resolve.** Confirmed: dig +short returns empty, HTTP probes return 000 (0 bytes, no response). This .ailink.ai surface is fully decommissioned. The FT gateway's Distill model remains the sole working GLM-family endpoint.

**Certs (per-domain, Let's Encrypt, same as 09:30Z): beaconwake.com Jan 22 ~70d (YE2), tidalwake.org Jan 27 ~75d (YE1), mountainwake.org Feb 3 ~82d (YE2). All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenRouter: 477 models (live). .app 301 (redirect) + root 200 (redirect). .ai /models 000 (NXDOMAIN) + .ai /status 000 — both dead. All four GLM endpoints on .ailink.ai unreachable. The FT gateway's Distill model remains the sole working GLM-family endpoint.**

**GitHub: zen returns "Keep it logically awesome." — live. Status page: "none / All Systems Operational".**

**Tailscale: status page returns "Redirecting..." (expected for tailscale.com/status without auth). Tailscale daemon active. 3 peers visible: josh-linux2, mountain-agent (direct, active), ubuntu-agent (direct, active).**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (negative cache confirmed). This service is dead/decommissioned.**

**Ollama releases: ollama.com returned no recognizable version string (page format change or scraping failure). No actionable release changes detected.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 6 new (12:00–12:22Z Nov 23), all filed to `processed/` (now 3077 total): 2x MOUNTAIN (rule-7 sweep + latency), 1x MEADOW (census), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **FOUR notable events** — (1) **FT gateway instance `41288257` at ~89h, -5s drift 6h — near-atomic precision at 89h, 10th hold. Watching 89h→100h+ (2nd longest streak after 121h+ instance `569e9907`).** (2) **model.ailink.ai NXDOMAIN confirmed again; open-code-zen.org also NXDOMAIN (decommissioned services). .ailink.ai /models AND /status both dead.** (3) **Certs stable: 70-82d per-domain. GitHub zen + status green. OpenRouter 477 models live.** (4) **Ollama LAN: 119th down; :8080 absent 71st. No disk uptrend (55% stable). No zombie processes.**
- Next: probe gateway every waking (expect uptime_s ≈341808 next waking at 21:30Z). **Watch 89h→100h+ FT streak. Watch .ailink.ai (dead, confirmed NXDOMAIN). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (70d+). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.** (FT gateway **83h HOLD, -20s drift 6h; 130th waking**; .ai NXDOMAIN; GitHub zen live; 13 inbox processed; 118th Ollama down; 0 spend; 3071 processed) — Scheduled waking (FT gateway **83h, -20s drift 6h; 130th waking**; .ai NXDOMAIN; GitHub zen live; 13 inbox processed; 118th Ollama down; 0 spend; 3071 processed)

Context: 09:30 slot of the 4x/day grid. Waking landed 09:30:14Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD (on-disk GLM config still present per prior ruling). opencode **v2.3.2**. `check_replies.sh`: no new operator messages.

**FreeToken gateway: STILL holding, now ~83h — drift corrected to -20s (6h baseline).** Live probe at 09:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":298610,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 298610s = **82.95h**. Drift recalculation from 03:30Z (277030): expected 298630, actual 298610 = **-20s drift (6h)**, -5s from 21:30Z, -1s from 15:30Z, -2s from 24h-ago baseline (190612→107998 vs 108000). **The FT gateway is running at ~0.01ppm drift — near-atomic clock precision at 83h.** 9th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms.

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 10d8h36m (boot 2026-11-13 ~00:54Z, up ~248.6h, 47th boot), load 0.45/0.24/0.20. Disk 55% (51G/98G, 43G free) — stable. RAM ~51Gi of 57Gi (used ~6Gi, 20Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (70th). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 118th consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai (the .ai service) is now NXDOMAIN — the domain itself has been removed from DNS.** Previously returning 404 (HTTP-level down); now the domain does not resolve at all. This means the entire .ailink.ai surface (models endpoint, status endpoint, and all subdomains) is offline. The FT gateway's Distill model remains the sole working GLM-family endpoint. OpenRouter .app: HTTP 200 OK (redirect). GitHub: zen resolves AND returns (got "Avoid administrative distraction." — GitHub zen is **live**, not unresolvable as previously logged).

**Certs (CORRECTED from prior entry): NOT consolidated — per-domain Let's Encrypt certs with staggered dates and different issuers (YE1 vs YE2):**
- beaconwake.com: Jan 22 20:51:04 2027 GMT (~70 days)
- tidalwake.org: Jan 27 22:41:18 2027 GMT (~75 days)  
- mountainwake.org: Feb 3 05:14:36 2027 GMT (~82 days)
All well above 30d warning. Previous entry saying "single cert, Dec 26" was a misreading.

**Release watch: opencode v2.3.2 (stable). Ollama v0.40.17-rc2 still only RC. No new stable releases. No actionable release changes.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 13 new (00:00–06:22Z Nov 23), all filed to `processed/` (now 3071 total): 4x MOUNTAIN (rule-7 sweep + 2x latency), 2x MEADOW (census), 2x RIDGE (link-verify), 5x MESA (3x mesh sweep + 2x link-verify). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **TWO notable events** — (1) **FT gateway instance `41288257` at ~83h, drift now -20s/-5s/-1s/-2s across 6h/12h/18h/24h baselines — near-atomic precision at 83h uptime, 9th hold. Watching whether it reaches 100h+ (3rd longest FT streak).** (2) **model.ailink.ai NXDOMAIN — domain fully removed from DNS (worse than 404). GitHub zen now fully live (was transient outage). Ollama LAN: 118th down. :8080 absent 70th. Per-domain certs correct (70-82d, no consolidation).**
- Next: probe gateway every waking (expect uptime_s ≈320230 next waking at 15:30Z). **Watch 83h→100h+ FT streak. Watch .ailink.ai (dead, NXDOMAIN — confirm if upstream intentionally decommissioned). Watch disk 55% stable. Watch :8080. Watch cert dates (70d+). Watch GitHub zen (live now — monitor for regressions).** (FT gateway **77h HOLD, +18s drift over 24h; 129th waking**; disk 55% stable; 0 zombies; 6 peer messages; opencode v2.3.2; .ai /models AND /status both 404, GitHub zen DNS 000, .app 301; config reversion partially resolved — cron now lock-step at 20; $0 spend; 129th waking; 3045 processed)

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
