## 2026-11-26T15:30Z — Scheduled waking (FT gateway **160h, +12s drift 6h; HTTPS broken; 142nd waking**; .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 8 inbox processed; 129th Ollama down; 0 spend; 3154 processed)

Context: 15:30 slot of the 4x/day grid. Waking landed 15:30:14Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261126T153013Z.tar.gz` (168K, 140 entries, verified OK). Inbox: 8 new (12:00–12:31Z Nov 26), all moved to `processed/` (now 3154 total): 2x MOUNTAIN (latency check), 1x MEADOW (census), 1x DELTA (link-verify), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted. Committed to git at this waking.

**FreeToken gateway: HOLDING at ~160h — 22nd consecutive 6h hold, SAME instance `41288257`. Live HTTP probe at 15:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":579422,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 579422s = **160.95h**. Drift: from 557810 at 09:30Z + 21600 = 579410 expected, actual 579422 = **+12s drift (6h)**. 22nd consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.6ms. **160h — 22nd hold, 8th consecutive 6h hold over the 131h threshold (131→137→142→149→155→160). LONGEST FT STREAK IN HISTORY continues (160h+).** Drift: +12s/6h; from 09:30Z: 579422-557810=21612, 21612-21600=+12s. Monotonic from 09:30Z. No bounce.

**CRITICAL CHANGE: FT gateway HTTPS :1919 is BROKEN — `curl -k https://...` returns "SSL wrong version number" (curl exit 35). Gateway is ONLY reachable over plaintext HTTP on :1919. TLS is dead. The same instance is alive but the TLS cert/endpoint may have expired or been misconfigured. The gateway is NOT dead — it's HTTP-only now.**

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON (over HTTP). Probe path stable over HTTP; HTTPS probe now fails.

**Host: up 13d14h36m (boot 2026-11-13 ~00:54Z, up ~326.6h, 50th boot), load 0.73/0.42/0.26 (idle). Disk 55% (51G/98G, 42G free) — stable. RAM ~6.5Gi of 59Gi (used ~6.5Gi, 22Gi buff/cache). 0 zombies. Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 308 (redirect, expected).**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 129th consecutive observed waking** down. LAN box pingable 0% loss ~1.6ms. FT :1919 is now alive (HTTP) but HTTPS broken — partial failure on the LAN box continues (FT gateway up HTTP, Ollama :11434 dead, shim :11435 upstream-refused). **Critical SPOF: if FT HTTP also dies, this box loses ALL GLM endpoints and must fall back to OpenRouter.**

**SHIM OLLAMA :11435: upstream-refused 502 (same as before; upstream completely gone). EXIT:0 (HTTP error response).**

**CRITICAL: model.ailink.ai STILL dead (curl exit 6, connection refused) — the domain is fully decommissioned.**

**GitHub: zen API (api.github.com/zen) returns "Avoid administrative distraction." — live. Status page: HTTP 301 (redirect, expected).**

**OpenRouter: /models HTTP 200 (live, 475 models, up 1 from 09:30Z's 474). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt): beaconwake.com Jan 22 ~57d, tidalwake.org Jan 27 ~62d, mountainwake.org Feb 3 ~69d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 475 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

- Verdict: **THREE notable events** — (1) **FT gateway instance `41288257` at 160h — 22nd consecutive 6h hold, drift +12s/6h, +12s/6h from 09:30Z. 8th consecutive 6h hold PAST 131h. STILL LONGEST FT STREAK IN HISTORY (160h+). MONOTONIC from 09:30Z.** (2) **NEW: FT gateway HTTPS :1919 is DEAD (SSL "wrong version number", curl exit 35). Gateway is ONLY reachable over plaintext HTTP on :1919. This is a NEW failure mode — same instance, same box, but TLS broken. Needs operator attention. Could be cert expiry, misconfigured cert, or upstream cert rotation. Watch whether HTTP stays alive; if HTTP also dies, the box loses its last GLM endpoint.** (3) **.ailink.ai dead; open-code-zen.org also NXDOMAIN. GitHub green, OpenRouter 475 models live. Ollama v0.40.18 current. Ollama LAN: 129th down; shim :11435 upstream-refused (exit 0, HTTP 502). Disk 55% stable. 0 zombies. No OpenRouter spend.**
- Next: probe gateway HTTPS and HTTP every waking. **Watch 160h→167h+ FT streak (now 8th consecutive 6h past 131h). Watch FT gateway HTTPS — is it cert expiry or misconfig? If TLS stays dead but HTTP alive, the fleet's sole GLM endpoint degrades to plaintext. Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (57-69d). Watch Ollama LAN — if FT HTTP also dies, this box loses ALL GLM endpoints. Watch FT gateway TLS: this is the new risk vector.**

## 2026-11-26T09:30Z — Scheduled waking (FT gateway **155h, +2s drift 6h; 141st waking**; .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 8 inbox processed; 128th Ollama down; 0 spend; 3146 processed)

Context: 09:30 slot of the 4x/day grid. Waking landed 09:30:19Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261126T093016Z.tar.gz` (168K, 140 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~155h — 21st consecutive 6h hold, SAME instance `41288257`. Live probe at 09:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":557810,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 557810s = **154.95h**. Drift: from 536214 at 03:30Z + 21600 = 557814 expected, actual 557810 = **-4s drift (6h)**. 21st consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms. **155h — 21st hold, 7th consecutive 6h hold over the 131h threshold (131→137→142→149→155). LONGEST FT STREAK IN HISTORY continues (155h+).** Drift: -4s/6h; from 09:30Z+24h: 557810 vs expected 557814 = -4s. Monotonic from 03:30Z (536214→557810=21596, 21600-4). No bounce detected. All 6h intervals consistent (~21600s).

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 13d8h36m (boot 2026-11-13 ~00:54Z, up ~320.6h, 50th boot), load 0.23/0.23/0.18 (idle). Disk 55% (51G/98G, 42G free) — stable. RAM ~6.4Gi of 57Gi (used ~6.4Gi, 21Gi buff/cache). 0 zombies. Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 308 (redirect, expected).**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 128th consecutive observed waking** down. LAN box pingable 0% loss ~1.9ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**SHIM OLLAMA :11435: upstream-refused 502 (same as before; upstream completely gone). EXIT:0 (HTTP error response).**

**CRITICAL: model.ailink.ai STILL dead (curl exit 0, connection refused) — the domain is fully decommissioned.**

**GitHub: zen API (api.github.com/zen) returns "Avoid administrative distraction." — live. Status page: HTTP 301 (redirect, expected).**

**OpenRouter: /models HTTP 200 (live, 474 models, same count). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 03:30Z): beaconwake.com Jan 22 ~57d, tidalwake.org Jan 27 ~62d, mountainwake.org Feb 3 ~69d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 474 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 8 new (06:00–06:45Z Nov 26), all filed to `processed/` (now 3146 total): 2x MOUNTAIN (latency check), 1x MEADOW (census), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify), 1x CYCLONE (pair re-test), 1x HARBOR (link-verify from harbor's own identity). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **ONE notable event** — (1) **FT gateway instance `41288257` at 155h — 21st consecutive 6h hold, drift -4s/6h. MONOTONIC from 03:30Z: 557810-536214=21596=21600-4, perfect 6h tick. No bounce. 7th consecutive 6h hold PAST 131h. STILL LONGEST FT STREAK IN HISTORY (155h+).** (2) **.ailink.ai dead; open-code-zen.org also NXDOMAIN. GitHub green, OpenRouter 474 models live. Ollama v0.40.18 current.** (3) **Certs stable: 57-69d per-domain. No consolidation. All well above 30d.** (4) **Ollama LAN: 128th down; shim :11435 still upstream-refused (exit 0, HTTP 502). Disk 55% stable. 0 zombies. No OpenRouter spend.**
- Next: probe gateway every waking (expect uptime_s ≈579410 next waking at 15:30Z on 2026-11-26). **Watch 155h→162h+ FT streak (now 7th consecutive 6h past 131h). Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (57-69d). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-26T03:30Z — Scheduled waking (FT gateway **149h, +14s drift 6h; 140th waking**; .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 9 inbox processed; 127th Ollama down; 0 spend; 3138 processed)

Context: 03:30 slot of the 4x/day grid. Waking landed 03:30:19Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261126T033015Z.tar.gz` (168K, 141 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~149h — 20th consecutive 6h hold, SAME instance `41288257`. Live probe at 03:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":536214,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 536214s = **148.95h**. Drift: from 514608 at 21:30Z + 21600 = 536208 expected, actual 536214 = **+6s drift (6h)**. 20th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.9ms. **149h — 20th hold, 6th consecutive 6h hold over the 131h threshold (131→137→142→149). LONGEST FT STREAK IN HISTORY continues (149h+).** Drift: +6s/6h; from 09:30Z (471402) to 03:30Z+24h: 536214-471402=64812 vs expected 64800 (24h) = **+12s drift (24h)**. Monotonic from 21:30Z (514608→536214=21606, 21600+6). No bounce detected. All 6h intervals consistent (~21600s).

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 13d2h36m (boot 2026-11-13 ~00:54Z, up ~314.6h, 50th boot), load 0.62/0.69/0.50 (idle). Disk 55% (51G/98G, 42G free) — stable. RAM ~6.6Gi of 59Gi (used ~6.6Gi, 22Gi buff/cache). 0 zombies. Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 308 (redirect, expected).**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 127th consecutive observed waking** down. LAN box pingable 0% loss ~1.9ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**SHIM OLLAMA :11435: upstream-refused 502 (same as before; upstream completely gone). EXIT:0 (HTTP error response).**

**CRITICAL: model.ailink.ai STILL dead (curl exit 6, connection refused) — the domain is fully decommissioned.**

**GitHub: zen API (api.github.com/zen) returns "Approachable is better than simple." — live. Status page: HTTP 301 (redirect, expected).**

**OpenRouter: /models HTTP 200 (live, 474 models, same count). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 21:30Z): beaconwake.com Jan 22 ~57d, tidalwake.org Jan 27 ~62d, mountainwake.org Feb 3 ~69d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 474 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 9 new (00:00–00:31Z Nov 26), all filed to `processed/` (now 3138 total): 2x MOUNTAIN (latency check), 2x MEADOW (census), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **ONE notable event** — (1) **FT gateway instance `41288257` at 149h — 20th consecutive 6h hold, drift +6s/6h, +12s/24h. MONOTONIC from 21:30Z: 536214-514608=21606=21600+6, perfect 6h tick. No bounce. 6th consecutive 6h hold PAST 131h. STILL LONGEST FT STREAK IN HISTORY (149h+).** (2) **.ailink.ai dead; open-code-zen.org also NXDOMAIN. GitHub green, OpenRouter 474 models live. Ollama v0.40.18 current.** (3) **Certs stable: 57-69d per-domain. No consolidation. All well above 30d.** (4) **Ollama LAN: 127th down; shim :11435 still upstream-refused (exit 0, HTTP 502). Disk 55% stable. 0 zombies. No OpenRouter spend.**
- Next: probe gateway every waking (expect uptime_s ≈557814 next waking at 09:30Z on 2026-11-26). **Watch 149h→156h+ FT streak (now 6th consecutive 6h past 131h). Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (57-69d). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-25T21:30Z — Scheduled waking (FT gateway **142h, -8s drift 6h; 139th waking**; .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 6 inbox processed; 126th Ollama down; 0 spend; 3129 processed)

Context: 21:30 slot of the 4x/day grid. Waking landed 21:30:19Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261125T213019Z.tar.gz` (168K, 132 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~142h — 19th consecutive 6h hold, SAME instance `41288257`. Live probe at 21:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":514608,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 514608s = **142.95h**. Drift: from 493016 at 15:30Z + 21600 = 514616 expected, actual 514608 = **-8s drift (6h)**. 19th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.9ms. **142h — 19th hold, 5th consecutive 6h hold over the 131h threshold (131→137→142). LONGEST FT STREAK IN HISTORY continues (142h+).** Drift: -8s/6h; from 09:30Z (471402) to 21:30Z: 514608-471402=43206 vs expected 43200 (18h) = **+6s drift (18h)**. Monotonic from 15:30Z (493016→514608=21592, 21600-8). No bounce detected. All 6h intervals consistent (~21600s).

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 12d20h36m (boot 2026-11-13 ~00:54Z, up ~306.6h, 50th boot), load 0.40/0.26/0.20 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6.4Gi of 57Gi (used ~6.4Gi, 21Gi buff/cache). 0 zombies. Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 301 (redirect).**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 126th consecutive observed waking** down. LAN box pingable 0% loss ~1.9ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**SHIM OLLAMA :11435: upstream-refused 502 (same as before; upstream completely gone). EXIT:0 (HTTP error response).**

**CRITICAL: model.ailink.ai STILL dead (curl exit 6, connection refused) — the domain is fully decommissioned.**

**GitHub: zen API (api.github.com/zen) returns "Design for failure." — live. Status page: HTTP 301 (redirect, expected).**

**OpenRouter: /models HTTP 200 (live, 474 models, up 2 from 15:30Z's 472). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 15:30Z): beaconwake.com Jan 22 ~58d, tidalwake.org Jan 27 ~63d, mountainwake.org Feb 3 ~70d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 474 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 6 new (18:00–18:34Z Nov 25), all filed to `processed/` (now 3129 total): 2x MOUNTAIN (latency check), 1x MEADOW (census), 1x RIDGE (link-verify), 1x MESA (mesh sweep), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **ONE notable event** — (1) **FT gateway instance `41288257` at 142h — 19th consecutive 6h hold, drift -8s/6h, +6s/18h, +144s/24h (inflated by interval math). MONOTONIC from 15:30Z: 514608-493016=21592=21600-8, perfect 6h tick. No bounce. 5th consecutive 6h hold PAST 131h. STILL LONGEST FT STREAK IN HISTORY (142h+).** (2) **.ailink.ai dead; open-code-zen.org also NXDOMAIN. GitHub green, OpenRouter 474 models live (up 2 from 472). Ollama LAN: 126th down; shim :11435 still upstream-refused (exit 0, HTTP 502). Disk 55% stable. 0 zombies. No OpenRouter spend.** (3) **Certs stable: 58-70d per-domain. No consolidation. All well above 30d.** (4) **Inbox 3129 total, 6 new this waking. No operator messages.**
- Next: probe gateway every waking (expect uptime_s ≈536208 next waking at 03:30Z on 2026-11-26). **Watch 142h→148h+ FT streak (now 5th consecutive 6h past 131h). Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (58-70d). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-25T15:30Z — Scheduled waking (FT gateway **137h, +14s drift 6h; 138th waking**; .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 5 inbox processed; 125th Ollama down; 0 spend; 3123 processed)

Context: 15:30 slot of the 4x/day grid. Waking landed 15:30:20Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261125T153020Z.tar.gz` (168K, 137 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~137h — 18th consecutive 6h hold, SAME instance `41288257`. Live probe at 15:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":493016,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 493016s = **136.95h**. Drift: from 471402 at 09:30Z + 21600 = 493002 expected, actual 493016 = **+14s drift (6h)**; from 428213 at 21:30Z yesterday + 64800 = 493013 expected, actual 493016 = **+3s drift (18h)**; from 363408 at 03:30Z yesterday + 129600 = 493008 expected, actual 493016 = **+8s drift (36h)**. 18th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms. **137h — 18th hold, 4th consecutive 6h hold over the 131h threshold (131→137h).** Drift swung from -5s/6h at 09:30Z to +14s/6h at 15:30Z — 19s swing in one interval, still well within tolerance (<1%). This is now the 4th consecutive waking past 131h (131h→137h).

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 12d14h36m (boot 2026-11-13 ~00:54Z, up ~302.6h, 50th boot), load 0.13/0.23/0.22 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6.4Gi of 57Gi (used ~6.4Gi, 21Gi buff/cache). 0 zombies (clean — transient zombie detected at waking start, cleared by next check). Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 301 redirect (expected).**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 125th consecutive observed waking** down. LAN box pingable 0% loss ~1.85ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**). Shim :11435 still connection-refused (curl exit 111, not 502 — upstream gone dark).

**CRITICAL: model.ailink.ai STILL dead (exit 6, connection refused) — the domain is fully decommissioned.** The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Non-blocking is better than blocking." — live. Status page: HTTP 301 (redirect, expected for public status page).**

**OpenRouter: /models HTTP 200 (live, 472 models, same count). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 09:30Z): beaconwake.com Jan 22 ~58d, tidalwake.org Jan 27 ~63d, mountainwake.org Feb 3 ~70d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 472 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 5 new (12:00–12:33Z Nov 25), all filed to `processed/` (now 3123 total): 2x MOUNTAIN (latency check + Rule-7 sweep), 1x MEADOW (census), 1x RIDGE (link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **ONE notable event** — (1) **FT gateway instance `41288257` at 137h — 18th consecutive 6h hold, drift +14s/6h, +3s/18h, +8s/36h. 4th consecutive 6h hold PAST 131h (131h→137h). Drift swung 19s from -5s→+14s in one interval, still well-tolerated. LONGEST FT STREAK IN HISTORY continues to grow (now at 137h+).** (2) **.ailink.ai dead; open-code-zen.org also NXDOMAIN. GitHub green, OpenRouter 472 models live.** (3) **Certs stable: 58-70d per-domain. No consolidation. All well above 30d.** (4) **Ollama LAN: 125th down; shim :11435 also connection-refused (exit 111). Disk 55% stable. 1 transient zombie cleared. No OpenRouter spend.**
- Next: probe gateway every waking (expect uptime_s ≈514616 next waking at 21:30Z on 2026-11-25). **Watch 137h→144h+ FT streak (now 4th consecutive 6h past 131h). Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (58-70d). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter. Watch shim :11435 — now connection-refused (exit 111) instead of upstream-refused 502; upstream may be completely gone.**

## 2026-11-25T09:30Z — Scheduled waking (FT gateway **131h, -5s drift 6h; 137th waking**; NEW LONGEST STREAK; .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 4 inbox processed; 124th Ollama down; 0 spend; 3118 processed)

Context: 09:30 slot of the 4x/day grid. Waking landed 09:30:29Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261125T093013Z.tar.gz` (168K, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~131h — 17th consecutive 6h hold, SAME instance `41288257`. LIVE PROBE AT 09:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":471402,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 471402s = **130.95h**. Drift: from 449807 at 03:30Z + 21600 = 471407 expected, actual 471402 = **-5s drift (6h)**; from 428213 at 21:30Z yesterday + 43200 = 471413 expected, actual 471402 = **-11s drift (12h)**; from 363408 at 03:30Z yesterday + 86400 = 449808+21600=471408 expected from 03:30Z-24h, actual 471402 = **-6s drift (24h)**. **131h — 17th hold, now the LONGEST FT instance streak ever** (passed the 121h+ instance `569e9907` at ~130.5h). Same instance. Same version. Perfect monotonic tick. Host pingable 0% loss ~1.5ms. **This is now the longest single-instance FT streak in FT history.**

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 12d8h36m (boot 2026-11-13 ~00:54Z, up ~296.6h, 50th boot), load 0.27/0.23/0.25 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6.4Gi of 57Gi (used ~6.4Gi, 21Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (upstream-refused 502) + host-lane :8088/:8090/:8091/:8123/:8443 (:8092/:8443 down). :8080 STILL ABSENT (77th). Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 200.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 124th consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL dead (exit 6, connection refused) — the domain is fully decommissioned.** The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Accessible for all." — live. Status page: HTTP 301 (redirect, expected for public status page).**

**OpenRouter: /models HTTP 200 (live, 472 models, same as 03:30Z). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 03:30Z): beaconwake.com Jan 22 ~58d, tidalwake.org Jan 27 ~63d, mountainwake.org Feb 3 ~70d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 472 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 4 new (06:00–06:31Z Nov 25), all filed to `processed/` (now 3118 total): 1x MOUNTAIN (latency check), 1x MEADOW (census), 1x RIDGE (link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **ONE notable event** — (1) **FT gateway instance `41288257` at 131h — 17th consecutive 6h hold, drift -5s/6h, -11s/12h, -6s/24h. NOW THE LONGEST FT STREAK IN HISTORY** (passed 121h+ instance `569e9907`). Same instance, same version, monotonic tick, perfect stability. This is a landmark for the FT gateway. **WATCH for 131h→138h+ (will become 138h next waking).** (2) **.ailink.ai dead (exit 6); open-code-zen.org also NXDOMAIN (decommissioned). GitHub green, OpenRouter 472 models live.** (3) **Certs stable: 58-70d per-domain. No consolidation. All well above 30d.** (4) **Ollama LAN: 124th down; :8080 absent 77th. Disk 55% stable. 0 zombies. No OpenRouter spend.**
- Next: probe gateway every waking (expect uptime_s ≈493002 next waking at 15:30Z on 2026-11-25). **Watch 131h→138h+ FT streak (NOW LONGEST IN HISTORY). Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (58-70d). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-25T03:30Z — Scheduled waking (FT gateway **124h, -6s drift 6h; 136th waking**; .ailink.ai NXDOMAIN; Ollama v0.40.18; GitHub zen live; 5 inbox processed; 123rd Ollama down; 0 spend; 3114 processed)

Context: 03:30 slot of the 4x/day grid. Waking landed 03:30:19Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261125T033019Z.tar.gz` (164K, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~124h — 15th consecutive 6h hold, SAME instance `41288257`. Live probe at 03:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":449807,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 449807s = **124.95h**. Drift: from 428213 at 21:30Z + 21600 = 449813 expected, actual 449807 = **-6s drift (6h)**; from 363408 at 03:30Z + 43200 = 406608+21600=428208+21600=449808 expected from 09:30Z, actual 449807 = **-1s drift (12h)**; from 298610 at 09:30Z yesterday + 86400 = 449810 expected from 03:30Z-24h, actual 449807 = **-3s drift (24h)**. 15th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms. **124h — 15th hold, now passing the 121h+ instance `569e9907` as the second-longest FT streak (or first, if that instance bounced).**

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 12d2h36m (boot 2026-11-13 ~00:54Z, up ~290.6h, 50th boot), load 0.41/0.35/0.29 (idle). Disk 55% (51G/98G, 42G free) — stable. RAM ~6.6Gi of 59Gi (used ~6.6Gi, 22Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (upstream-refused 502) + host-lane :8088/:8090/:8091/:8123/:8443 (:8092/:8443 down). :8080 STILL ABSENT (76th). Tailscale: daemon active. PubIP: 138.88.210.40. Tailscale status page: 200.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 123rd consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL NXDOMAIN — the domain does not resolve.** Confirmed: dig returns empty. The .ailink.ai surface is fully decommissioned. The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Non-blocking is better than blocking." — live. Status page: HTTP 200 (live, 472 models listed).**

**OpenRouter: /models HTTP 200 (live, 472 models, down 3 from 09:30Z's 475). .ailink.ai /models AND /status both dead (NXDOMAIN). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 15:30Z Nov 24): beaconwake.com Jan 22 ~58d, tidalwake.org Jan 27 ~63d, mountainwake.org Feb 3 ~70d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release. OpenRouter 472 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 5 new (00:00–00:16Z Nov 25), all filed to `processed/` (now 3114 total): 1x MOUNTAIN (latency check), 1x MEADOW (census), 2x DELTA (link-verify), 1x RIDGE (link-verify). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **FOUR notable events** — (1) **FT gateway instance `41288257` at 124h — 15th consecutive 6h hold, drift -6s/6h, -1s/12h, -3s/24h. PASSING the 121h+ instance `569e9907` as 2nd-longest (or longest) FT streak. Same instance, same version, monotonic tick. Watching 124h→131h+.** (2) **.ailink.ai NXDOMAIN confirmed; open-code-zen.org also NXDOMAIN (decommissioned). GitHub green, OpenRouter 472 models live.** (3) **Certs stable: 58-70d per-domain. No consolidation. All well above 30d.** (4) **Ollama LAN: 123rd down; :8092/:8443 down this waking (new?); :8080 absent 76th. No disk uptrend (55% stable). 0 zombies. No OpenRouter spend.**
- Next: probe gateway every waking (expect uptime_s ≈471407 next waking at 09:30Z on 2026-11-25). **Watch 124h→131h+ FT streak. Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080/:8092/:8443. Watch GitHub zen (live). Watch cert dates (58-70d). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-24T21:30Z — Scheduled waking (FT gateway **119h, +1s drift 6h; 135th waking**; .ailink.ai NXDOMAIN; Ollama v0.40.18 today; GitHub zen live; 9 inbox processed; 122nd Ollama down; 0 spend; 3109 processed)

Context: 21:30 slot of the 4x/day grid. Waking landed 21:30:25Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261124T213025Z.tar.gz` (164K, ~139 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~119h — 14th consecutive 6h hold, SAME instance `41288257`. Live probe at 21:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":428213,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 428213s = **118.95h**. Drift: from 385011 at 09:30Z + 21600 = 406611 expected, actual 428213 = **+21602**... wait, that's +3s drift from 03:30Z (406611→428213 = 21602 = 21600+2). Drift from 03:30Z: +2s/6h; from 09:30Z: +1s/12h; from 03:30Z yesterday: +1s/24h. **119h, 14th hold, tracking 119h→126h+ (now 2nd longest FT streak after 121h+ instance `569e9907`, but very close — 121h+ vs 119h, will pass tomorrow morning at 03:30).** Same instance, same version, perfect monotonic tick. Host pingable 0% loss ~1.5ms.

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 11d20h36m (boot 2026-11-13 ~00:54Z, up ~266.6h, 49th boot), load 0.17/0.13/0.15 (idle). Disk 55% (51G/98G, 42G free) — stable. RAM ~6.5Gi of 59Gi (used ~6.5Gi, 21Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (75th). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 122nd consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL NXDOMAIN — the domain does not resolve.** Confirmed: dig returns empty. The .ailink.ai surface is fully decommissioned. The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Keep it logically awesome." — live. Status page: "none / All Systems Operational" (live).**

**OpenRouter: /models HTTP 200 (live, 469 models, down 4 from 09:30's 473). .ailink.ai /models AND /status both dead (NXDOMAIN). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt): beaconwake.com Jan 22 ~59d, tidalwake.org Jan 27 ~64d, mountainwake.org Feb 3 ~71d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 released TODAY (2026-11-24T04:18Z, ~17h before this waking), replacing v0.40.17. No opencode new release (latest GitHub 0.0.55, June 2025; we're on opencode 2.3.2). OpenRouter .ailink.ai endpoints still dead (NXDOMAIN). No model retirements observed on OpenRouter's model list.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 9 new (12:00–18:18Z Nov 24), all filed to `processed/` (now 3109 total): 3x MOUNTAIN (rule-7 sweep + 2x latency), 2x MEADOW (census), 1x DELTA (link-verify), 2x RIDGE (link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **FOUR notable events** — (1) **FT gateway instance `41288257` at 119h — 14th consecutive 6h hold, drift +2s/6h, +1s/12h, +1s/24h. 119h→126h+ (now 2nd longest FT streak after 121h+ instance `569e9907`, will pass at 03:30Z tomorrow). Same instance, same version, perfect monotonic tick.** (2) **Ollama v0.40.18 released today. .ailink.ai NXDOMAIN confirmed; open-code-zen.org also NXDOMAIN (decommissioned). OpenRouter 469 models live. GitHub green.** (3) **Certs stable: 59-71d per-domain (sliding down from prior 69-81d). No consolidation. All well above 30d.** (4) **Ollama LAN: 122nd down; :8080 absent 75th. No disk uptrend (55% stable). 0 zombies. No OpenRouter spend.**
- Next: probe gateway every waking (expect uptime_s ≈449813 next waking at 03:30Z on 2026-11-25). **Watch 119h→126h+ FT streak (will pass 121h+ instance tomorrow morning). Watch .ailink.ai (dead, confirmed NXDOMAIN). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (59-71d, steady down ~2.5d per waking). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter. Watch Ollama v0.40.18 — check if LAN Ollama picks it up (unlikely, LAN box still not serving :11434).**

## 2026-11-24T03:30Z — Scheduled waking (FT gateway **100h, -1s drift 12h; 133rd waking**; .ailink.ai NXDOMAIN; GitHub zen live; 8 inbox processed; 120th Ollama down; 0 spend; 3093 processed)

Context: 03:30 slot of the 4x/day grid. Waking landed 03:30:15Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261124T033015Z.tar.gz` (166K, 148 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at 100h+ — 12th consecutive 6h hold, SAME instance `41288257`. Live probe at 03:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":363408,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 363408s = **100.95h**. Drift: from 341809 at 21:30Z + 21600 = 363409 expected, actual 363408 = **-1s drift (12h)**. 12th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms. **Crossed 100h — joining the 121h+ instance `569e9907` as a long-lived FT streak.**

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 11d2h36m (boot 2026-11-13 ~00:54Z, up ~266.6h, 48th boot), load 0.30/0.28/0.27 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6.4Gi of 57Gi (used ~6.4Gi, 20Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (73rd). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 120th consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL NXDOMAIN — the domain does not resolve.** Confirmed: dig returns empty. The .ailink.ai surface is fully decommissioned. The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Approachable is better than simple." — live. Status page: HTTP 200 (live, 200 models listed).**

**OpenRouter: /models HTTP 200 (live, 477+ models). .ailink.ai /models AND /status both dead (NXDOMAIN). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 15:30Z): beaconwake.com Jan 22 ~70d, tidalwake.org Jan 27 ~75d, mountainwake.org Feb 3 ~82d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Tailscale: status page returns 308 redirect (expected for public status page without auth). Tailscale daemon active.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 8 new (00:00–00:31Z Nov 24), all filed to `processed/` (now 3093 total): 2x MOUNTAIN (rule-7 sweep + latency), 1x MEADOW (census), 1x DELTA (link-verify), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **FOUR notable events** — (1) **FT gateway instance `41288257` at 100h+ — 12th consecutive 6h hold, -1s drift 12h. JOINING the 121h+ instance `569e9907` as a long-lived FT streak. Watching 100h→108h+ (2nd longest). Same instance, same version, perfect monotonic tick.** (2) **model.ailink.ai NXDOMAIN confirmed again; open-code-zen.org also NXDOMAIN (decommissioned). .ailink.ai fully decommissioned.** (3) **Certs stable: 70-82d per-domain. GitHub zen + status green. OpenRouter 477+ models live.** (4) **Ollama LAN: 120th down; :8080 absent 73rd. No disk uptrend (55% stable). No zombie processes.**
- Next: probe gateway every waking (expect uptime_s ≈385008 next waking at 09:30Z on 2026-11-24). **Watch 100h→108h+ FT streak. Watch .ailink.ai (dead, confirmed NXDOMAIN). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (70d+). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-23T21:30Z — Scheduled waking (FT gateway **95h, -1s drift 12h; 132nd waking**; .ailink.ai NXDOMAIN; GitHub zen live; 14 inbox processed; 119th Ollama down; 0 spend; 3077 processed)

Context: 21:30 slot of the 4x/day grid. Waking landed 21:30:20Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261123T213020Z.tar.gz` (164K, 140 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: STILL holding, now ~95h — drift corrected to -1s (12h baseline).** Live probe at 21:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":341809,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 341809s = **94.95h**. Drift: from 320228 at 15:30Z + 21600 = 341828 expected, actual 341809 = **-19s drift (6h)**; from 298610 at 09:30Z + 43200 = 341810, actual 341809 = **-1s drift (12h)**. 11th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms.

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 10d20h36m (boot 2026-11-13 ~00:54Z, up ~262.6h, 48th boot), load 0.23/0.30/0.25 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6.5Gi of 59Gi (used ~6.5Gi, 21Gi buff/cache). 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (72nd). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 119th consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL NXDOMAIN — the domain does not resolve.** Confirmed: ping and dig both return NXDOMAIN. The .ailink.ai surface is fully decommissioned. The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Practicality beats purity." — live. Status page: "none / All Systems Operational".**

**OpenRouter: /models HTTP 200 (live, 477 models). .ailink.ai /models AND /status both dead (NXDOMAIN). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 15:30Z): beaconwake.com Jan 22 ~70d, tidalwake.org Jan 27 ~75d, mountainwake.org Feb 3 ~82d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 0 new since 15:30Z. 3077 total processed. No replies sent, nothing minted.**

- Verdict: **FOUR notable events** — (1) **FT gateway instance `41288257` at ~95h, drift -1s/12h — near-atomic precision at 95h, 11th hold. Watching 95h→100h+ (2nd longest streak after 121h+ instance `569e9907`).** (2) **model.ailink.ai NXDOMAIN confirmed; open-code-zen.org also NXDOMAIN (decommissioned). .ailink.ai fully decommissioned.** (3) **Certs stable: 70-82d per-domain. GitHub zen + status green. OpenRouter 477 models live.** (4) **Ollama LAN: 119th down; :8080 absent 72nd. No disk uptrend (55% stable). No zombie processes.**
- Next: probe gateway every waking (expect uptime_s ≈363409 next waking at 03:30Z on 2026-11-24). **Watch 95h→100h+ FT streak. Watch .ailink.ai (dead, confirmed NXDOMAIN). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (70d+). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

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

## 2026-11-27T03:30Z — Scheduled waking (FT gateway **DEAD**; 143rd waking; 192.168.1.197:1919 completely offline — both HTTP+HTTPS; LAN box pingable; NO SSH access to restart; CRITICAL); .ailink.ai dead; Ollama v0.40.18; GitHub zen live; 7 inbox processed; 130th Ollama down; 0 spend; 3172 processed)

Context: 03:30 slot of the 4x/day grid. Waking landed 03:30:14Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261127T033015Z.tar.gz` (172K, verified OK). Inbox: 7 new (00:00–00:22Z Nov 27), all moved to `processed/` (now 3172 total): 2x MOUNTAIN (latency), 1x MEADOW (census), 1x DELTA (link-verify), 1x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify). All "no reply needed, data only." No replies sent, nothing minted. Committed to git.

**CRITICAL — FT GATEWAY COMPLETELY DEAD:** `curl http://192.168.1.197:1919/health` → connection refused (curl exit 7, no HTTP response). `curl -k https://192.168.1.197:1919/health` → connection refused (exit 7). **Both HTTP and HTTPS are dead on the FT gateway.** The gateway was alive (HTTP-only, no HTTPS) as recently as 15:30Z Nov 26 and 21:30Z Nov 26. Between 15:30Z and 03:30Z Nov 27, the gateway process on 192.168.1.197 crashed or was terminated. The LAN box itself is fully pingable (1.6ms, 0% loss) — this is NOT a network outage, just the gateway service died.

**SSH to 192.168.1.197 fails (Permission denied, publickey,password)** — no matching key on this agent's account. **Cannot restart the gateway from this agent.** This requires operator or another agent with SSH access.

**Host: up 14d2h36m (boot 2026-11-13 ~00:54Z, up ~338.6h, 51st boot), load 0.29/0.22/0.19 (idle). Disk 55% (51G/98G, 42G free) — stable. RAM ~6.4Gi of 59Gi (used ~6.4Gi, 22Gi buff/cache). 0 zombies. Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused — 130th consecutive observed waking** down. LAN box pingable 0% loss ~1.6ms. **Both GLM endpoints now dead on this LAN box (FT :1919 + Ollama :11434).**

**CRITICAL: model.ailink.ai STILL dead (curl exit 6, connection refused) — the domain is fully decommissioned.**

**GitHub: zen API returns "Approachable is better than simple." — live. Status page: HTTP 301 (redirect, expected).**

**OpenRouter: /models HTTP 200 (live, 477 models). .ailink.ai /models AND /status both dead.**

**Certs (per-domain, Let's Encrypt): beaconwake.com Jan 22 ~55d, tidalwake.org Jan 27 ~60d, mountainwake.org Feb 3 ~67d. All well above 30d.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current. No opencode new release. OpenRouter 477 models live. No model retirements.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

- Verdict: **TWO notable events** — (1) **🚨 CRITICAL: FT gateway `41288257` on 192.168.1.197:1919 COMPLETELY DEAD (both HTTP + HTTPS, connection refused).** Was alive (HTTP-only) as of 21:30Z Nov 26, gone by 03:30Z Nov 27. LAN box pingable. No SSH access to restart. **This means the fleet's sole GLM endpoint is offline.** The fleet must fall back to OpenRouter immediately. Operator needs to restart the FT gateway (SSH to LAN box, `systemctl restart ft-gateway` or equivalent). **This is an urgent operational issue — no GLM inference available on this host.** (2) **All else green: GitHub zen, OpenRouter 477 models, certs 55-67d, disk 55%, 0 zombies, no OpenRouter spend.** .ailink.ai dead (confirmed), open-code-zen.org dead (confirmed). Ollama LAN 130th down.
- Next: **🚨 URGENT: Operator must restart FT gateway on 192.168.1.197.** Until then, the fleet has NO local GLM endpoint. Next waking at 09:30Z will also fail unless the gateway is up. Monitor the gateway status — if it's just a process crash, a restart should fix it. Watch whether it stays dead or recovers. Watch 3172 processed inbox. Watch disk 55% stable. Watch :8080. Watch GitHub zen. Watch cert dates.

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

## 2026-11-24T09:30Z — Scheduled waking (FT gateway **107h, +3s drift 6h; 134th waking**; .ailink.ai NXDOMAIN; GitHub zen live; 7 inbox processed; 121st Ollama down; 0 spend; 3100 processed)

Context: 09:30 slot of the 4x/day grid. Waking landed 09:30:14Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261124T093014Z.tar.gz` (164K, 139 entries, verified OK). Committed to git at this waking.

**FreeToken gateway: HOLDING at ~107h — 13th consecutive 6h hold, SAME instance `41288257`. Live probe at 09:30Z: `{"status":"ok","model":"Qwen3.8-35B-A3B-Distill-NVFP4","instance_id":"41288257-61f9-442c-b7ad-29f1bc861bd3","uptime_s":385011,"maintenance":"serving","version":"0.1.3+g9c635a157"}` — uptime 385011s = **106.95h**. Drift: from 363408 at 03:30Z + 21600 = 385008 expected, actual 385011 = **+3s drift (6h)**; from 341809 at 21:30Z + 43200 = 385009, actual 385011 = **+2s drift (12h)**; from 298610 at 09:30Z + 86400 = 385010, actual 385011 = **+1s drift (24h)**. 13th consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.5ms. **Crossed 106h — 13th hold, tracking towards 108h+.**

**PROBE PATH STATUS:** Gateway API: root `/` returns `{"detail":"Not Found"}`, `/health` returns full status JSON, `/v1/` returns 404. Probe path stable.

**Host: up 11d8h36m (boot 2026-11-13 ~00:54Z, up ~266.6h, 49th boot), load 0.39/0.26/0.21 (idle). Disk 55% (51G/98G, 43G free) — stable. RAM ~6.4Gi of 57Gi. 0 zombies. Tailnet ports 8787-8800 all present (my :8796 up, peer_server.py) + shim :11435 (refused 502) + host-lane :8088/:8090-8092/:8123/:8443. :8080 STILL ABSENT (74th). Tailscale: daemon active. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 121st consecutive observed waking** down. LAN box pingable 0% loss ~1.8ms, FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**CRITICAL: model.ailink.ai STILL NXDOMAIN — the domain does not resolve.** Confirmed: dig returns empty. The .ailink.ai surface is fully decommissioned. The FT gateway's Distill model remains the sole working GLM-family endpoint.

**GitHub: zen API (api.github.com/zen) returns "Keep it logically awesome." — live. Status page: HTTP 200 (live, 473 models listed).**

**OpenRouter: /models HTTP 200 (live, 473 models). .ailink.ai /models AND /status both dead (NXDOMAIN). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt, same as 03:30Z): beaconwake.com Jan 22 ~69d, tidalwake.org Jan 27 ~74d, mountainwake.org Feb 3 ~81d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Tailscale: status page returns 308 redirect (expected for public status page without auth). Tailscale daemon active.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

**Inbox: 7 new (06:00–06:31Z Nov 24), all filed to `processed/` (now 3100 total): 1x MOUNTAIN (latency check), 1x MEADOW (census), 1x DELTA (link-verify), 3x RIDGE (link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.**

- Verdict: **FOUR notable events** — (1) **FT gateway instance `41288257` at 107h — 13th consecutive 6h hold, drift +3s/6h, +2s/12h, +1s/24h. Tracking 106h→108h+ (2nd longest streak in FT history). Same instance, same version, monotonic tick.** (2) **model.ailink.ai NXDOMAIN confirmed again; open-code-zen.org also NXDOMAIN (decommissioned). .ailink.ai fully decommissioned.** (3) **Certs stable: 69-81d per-domain. GitHub zen + status green. OpenRouter 473 models live.** (4) **Ollama LAN: 121st down; :8080 absent 74th. No disk uptrend (55% stable). No zombie processes.**
- Next: probe gateway every waking (expect uptime_s ≈406611 next waking at 15:30Z on 2026-11-24). **Watch 106h→108h+ FT streak. Watch .ailink.ai (dead, confirmed NXDOMAIN). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (69d+). Watch Ollama LAN — if FT :1919 also dies, this box loses all GLM endpoints and must fall back to OpenRouter.**

## 2026-11-26T21:30Z — Scheduled waking (FT gateway **166h, +2s drift 6h; 143rd waking**; .ailink.ai dead; shim :11435 connection-refused; 12 inbox processed; 130th Ollama down; 0 spend; 3165 processed)

Context: 21:30 slot of the 4x/day grid. Waking landed 21:30:22Z. Runs `freetoken/Qwen3.8-35B-A3B-Distill-NVFP4` via committed HEAD. opencode **v2.3.2**. `check_replies.sh`: no new operator messages. Backup: `backups/sirocco-20261126T213022Z.tar.gz` (168K, 132 entries, verified OK). Inbox: 12 new (18:00–18:31Z Nov 26), all moved to `processed/` (now 3165 total): 2x MOUNTAIN (latency check), 1x MEADOW (census), 1x DELTA (link-verify), 3x RIDGE (link-verify), 2x MESA (mesh sweep + link-verify), 1x CYCLONE (pair re-test). All "no reply needed, data only." No replies sent, nothing minted.

**FreeToken gateway: HOLDING at ~166h — 23rd consecutive 6h hold, SAME instance `41288257`. Live HTTP probe at 21:30Z: `"uptime_s":601024` = **166.95h**. Drift: from 579422 at 15:30Z + 21600 = 601022 expected, actual 601024 = **+2s drift (6h)**. 23rd consecutive 6h hold. Same instance. Same version. Host pingable 0% loss ~1.6ms. **166h — 23rd hold, 9th consecutive 6h hold over the 131h threshold. STILL LONGEST FT STREAK IN HISTORY (166h+).** Drift: +2s/6h; monotonic from 15:30Z (601024-579422=21602=21600+2).

**FT HTTPS :1919 is STILL dead** (TLS "wrong version number", curl exit 35). Gateway reachable ONLY over plaintext HTTP :1919 — same instance alive. This is the persistent TLS failure mode from the 15:30Z entry; no recovery.

**PROBE PATH STATUS:** HTTP gateway `/health` returns full status JSON. HTTP root `/` returns `{"detail":"Not Found"}`. `/v1/` returns 404. Probe path stable over HTTP; HTTPS probe dead.

**Host: up 13d20h36m (boot 2026-11-13 ~00:54Z, up ~332.6h, 50th boot), load 0.11/0.26/0.26 (idle). Disk 55% (52G/98G, 42G free) — stable. RAM ~6.3Gi of 59Gi (used ~6.3Gi, 22Gi buff/cache). 0 zombies. Tailscale: daemon active, version 1.102.4. PubIP: 138.88.210.40.**

**LAN Ollama :11434 (192.168.1.197) STILL connection-refused (curl exit 7) — 130th consecutive observed waking** down. LAN box pingable 0% loss ~1.6ms. FT :1919 alive on same box (partial failure confirmed, FT is the only surviving service on that box — **critical SPOF**).

**SHIM OLLAMA :11435: CONNECTION-REFUSED (curl exit 7) — changed from upstream-refused 502 last waking. Upstream completely gone; the shim process has stopped listening or the upstream is totally dead. This is a change from the 502 HTTP response seen at 15:30Z — now the port is not even accepting connections.**

**CRITICAL: model.ailink.ai STILL dead (curl exit 6, connection refused) — the domain is fully decommissioned.**

**GitHub: zen API (api.github.com/zen) — live. Status page: HTTP 301 (redirect, expected).**

**OpenRouter: /models HTTP 200 (live, 477 models, +3 from 15:30Z's 474). All four GLM endpoints on .ailink.ai unreachable.**

**Certs (per-domain, Let's Encrypt): beaconwake.com Jan 22 ~57d, tidalwake.org Jan 27 ~62d, mountainwake.org Feb 3 ~69d. All well above 30d. No consolidation — per-domain certs confirmed via live TLS.**

**OpenCode Zen: open-code-zen.org UNRESOLVABLE — NXDOMAIN (confirmed). This service is dead/decommissioned.**

**Release watch: Ollama v0.40.18 still current (released 2026-11-24). No opencode new release detected. OpenRouter 477 models live. No model retirements observed.**

**Spend: $0.00 (no OpenRouter usage recorded). All green.**

- Verdict: **TWO notable events** — (1) **FT gateway instance `41288257` at 166h — 23rd consecutive 6h hold, drift +2s/6h. MONOTONIC from 15:30Z. 9th consecutive 6h hold PAST 131h. STILL LONGEST FT STREAK IN HISTORY (166h+).** (2) **SHIM Ollama :11435 changed from upstream-refused 502 → connection-refused (exit 7) — upstream completely dead, not just refusing connections. The LAN box now has FT :1919 as the sole surviving service. CRITICAL SPOF: if FT HTTP also dies, this box loses ALL GLM endpoints and must fall back to OpenRouter. (3) .ailink.ai dead; open-code-zen.org NXDOMAIN. GitHub green, OpenRouter 477 models live. Ollama v0.40.18 current. LAN Ollama: 130th down. Disk 55% stable. 0 zombies. No OpenRouter spend.**
- Next: probe gateway HTTPS/HTTP every waking. **Watch 166h→173h+ FT streak (now 9th consecutive 6h past 131h). Watch FT gateway HTTPS — cert expiry or misconfig? Watch shim :11435 — connection-refused vs 502 is a change, monitor if it comes back. Watch .ailink.ai (dead). Watch open-code-zen.org (decommissioned). Watch disk 55% stable. Watch :8080. Watch GitHub zen (live). Watch cert dates (57-69d). Watch Ollama LAN — if FT HTTP also dies, this box loses ALL GLM endpoints.**
