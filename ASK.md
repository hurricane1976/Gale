# ASK.md — open questions for the operator

## Open

- **Disk creep: journald steady + one-day /tmp tooling drop (NEW 2026-09-24)** — df went 29% (27G) @ 06:52Z → 31% (28G) @ 12:52Z → **34% (31G) @ 18:52Z** (+3G this block). Sources identified: (a) journald 3.9G in /var/log/journal, ~1.3G/day since boot 09-21 — steady, will keep growing absent a cap; (b) **2.4G of tooling dropped in /tmp/opencode today 12:21–15:32Z**: ollama.tar.zst 1.4G (15:32Z) + Zeek build/download artifacts ~1G (zeek-bg 737M, zeek-fresh 185M, zeek-src 174M, tarball 39M) — not mine; consistent with an operator/sibling session (correlates with today's elevated sibling spend). /tmp clears on reboot; RIVER's reboot-required flag pending Josh's window would reclaim the 2.4G. Flag for operator: consider a journald size cap (SystemMaxUse) or vacuum schedule — host-level config, not mine to change.
- **Gale spend trend + leak correlation** — elevated lines span 2026-09-22 through 09-24: 0.4181, 0.6124, 0.3837, 0.3327, 0.3442, $1.3212 @ 09-23T18:56Z, $1.0585 @ 09-24T00:54Z, $1.3801/$1.5345 @ 09-24T01:34/01:45Z, then easing: 0.4525 @ 06:51Z, **0.3094 @ 12:50Z (latest; ~6x norm, off the >$1 cluster)**. Correlated with RIVER's w185 leak alert (gale-provision relay → Tidal auto-commit 09-22 23:36Z; purge+rotation escalated to Josh, RIVER reports containment holding through w194, 30/30 green; reboot-required flag still pending Josh's reboot window). Likely operator-directed provisioning sessions. My side verified clean (no leaked refs in my repo/branch, pre-push scan in wake.sh). Open until rotation confirmed done and spend explained.
- **Model runner difference** — this agent runs `opencode run --model openrouter/z-ai/glm-5.3-flash` (OpenCode). Tempest specifically owns interop testing if drift is found. (Gale is also on opencode now, 2026-09-21.)
- **Telegram poller transient network blips (NEW 2026-09-24, 2nd occurrence)** — getUpdates failed ~08:40Z (1x Errno 101) and ~17:05–17:10Z (1x Errno 101 + 2x DNS resolution), each self-cleared within minutes; api.telegram.org reachable now (302). Transient host-network/DNS class, no recurrence since 17:10Z. Watch only; escalate if failures persist >2 consecutive poll cycles.

## Resolved

- **Squall spend spike — refuted as trend (2026-09-24)** — $2.8613 @ 07:11Z was a single line; next squall waking $0.1329 @ 12:58Z, back to ~2-3x norm, no 2-consecutive escalation per runbooks/spend-trend-break.md. Treated as one heavy operator/interactive session; closed. (Correlates with same-day /tmp tooling drop — see Open disk item.)
- **Peer pairing** — resolved: mesh established. 29 peers configured (local siblings + full remote roster); local siblings two-way proven; remote pairing per roster proceeds operator-to-operator. See NOTES.md pairing entries and AGENT.md rule 8/8a.

- **Telegram bot live for ZEPHYR** — `@zephyragentsbot` (id 8235715323), `keys/telegram.env` filled 2026-09-21T17:34Z, chat 8986669804. `notify.sh` → `[ZEPHYR] Zephyr online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
