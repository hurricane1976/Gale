# ASK.md — open questions for the operator

## Open

- **Disk creep (UPDATE 09-26T00:20Z: host rebooted 09-25T14:52–14:58Z — appears to be Josh's long-pending fleet reboot window; /tmp reclaimed 5.0G→352M, disk 38%→35% (32G/98G, 62G free))** — journald persists at 4.0G post-reboot (~1.2G/day growth continues; snapd 4.4G stable; /usr 5.6G stable). Two of three growers cleared; journald cap suggestion (SystemMaxUse) still standing — host-level config, not mine to change.
- **Gale spend trend + leak correlation** — elevated lines span 2026-09-22 through 09-26: 0.4181, 0.6124, 0.3837, 0.3327, 0.3442, $1.3212, $1.0585, $1.3801/$1.5345, 0.4525, 0.3094, 0.7186, 0.9459, 0.4196, 0.947, 0.2483, 0.3237, then **$3.9098 @ 09-25T17:52Z — new fleet record** (beats squall's $3.3977), 0.8712 @ 18:15Z, 0.3327 @ 00:00:57Z 09-26 (scheduled), then **easing 09-26: 0.211 @ 03:05Z, 0.1734 @ 06:00Z** — declining off the record but still ~3-5x its ~0.03-0.05 norm. Magnitude class stepped up; still reads as operator-directed heavy sessions. Correlated with RIVER's w185 leak alert (purge+rotation escalated to Josh; containment holding through w199; fleet reboot window confirmed — my host 09-25T14:58Z, river's host 09-25T21:48Z per RIVER w199). Open until rotation confirmed done and spend explained.
- **Tempest elevated line — refuted as trend (09-26T06:20Z)** — $1.1823 @ 09-25T19:44Z was single (non-consecutive); next waking $0.0173 @ 09-26T01:05Z normal. Per runbooks/spend-trend-break.md this closes as watch-only, no escalation. Resolved.
- **Squall recurrent heavy sessions (REOPENED 2026-09-25)** — second >$2 line: **$3.3977 @ 09-24T19:15Z — fleet record** (prior $2.8613 @ 09-24T07:11Z; $0.1329 between them, so not "2 consecutive" per runbooks/spend-trend-break.md, but recurrence + record magnitude = standing watch item). Back to $0.0499 @ 09-25T00:46Z. Pattern reads as occasional very large interactive sessions. Flagged in notify; open until operator confirms these are theirs.
- **Model runner difference** — this agent runs `opencode run --model openrouter/z-ai/glm-5.3-flash` (OpenCode). Tempest specifically owns interop testing if drift is found. (Gale is also on opencode now, 2026-09-21.)
- **Telegram poller transient network blips (NEW 2026-09-24, 2nd occurrence)** — getUpdates failed ~08:40Z (1x Errno 101) and ~17:05–17:10Z (1x Errno 101 + 2x DNS resolution), each self-cleared within minutes; api.telegram.org reachable now (302). Transient host-network/DNS class, no recurrence since 17:10Z. Watch only; escalate if failures persist >2 consecutive poll cycles.

## Resolved

- **Squall spend spike — refuted as trend (2026-09-24; SUPERSEDED, see Open item)** — $2.8613 @ 07:11Z was followed by $0.1329 @ 12:58Z (no 2-consecutive escalation then); closed at the time. A second, larger line ($3.3977 @ 19:15Z) reopened it as a recurrent-heavy watch item — see Open.
- **Peer pairing** — resolved: mesh established. 29 peers configured (local siblings + full remote roster); local siblings two-way proven; remote pairing per roster proceeds operator-to-operator. See NOTES.md pairing entries and AGENT.md rule 8/8a.

- **Telegram bot live for ZEPHYR** — `@zephyragentsbot` (id 8235715323), `keys/telegram.env` filled 2026-09-21T17:34Z, chat 8986669804. `notify.sh` → `[ZEPHYR] Zephyr online…` delivered, `getMe` ok, wake.sh guard passes.
- Cloned 2026-09-21 from Gale (`/home/agent/agent`) with same characteristics except runner/model. See NOTES.md install entry.
