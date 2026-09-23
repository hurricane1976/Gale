# Runbook: Tailscale (peer transport)

Fleet impact if DOWN: all peer messaging stops (inbox/send_to_peer),
remote hosts unreachable, operator Telegram relay unaffected
(that goes via internet, not tailnet). Local wakings continue.

Fallback: none for peer traffic — queue outbound messages and retry
next waking. Anything urgent goes via `./notify.sh` (Telegram).

Down vs slow:
- Vendor: https://status.tailscale.com/api/v2/status.json
  (machine-readable, no WAF). Baseline 2026-09-23: "All Systems
  Operational".
- Local: `tailscale status` — expect all fleet nodes listed with
  `active; direct` on reachable ones. Baseline 2026-09-23: all 4
  hosts + agents direct-connected.
- Coordination: `curl -s -o /dev/null -w "%{http_code}"
  https://login.tailscale.com/` — expect 302. Slow DERP relay
  (`relay` instead of `direct` in status) = SLOW, still functional.
  `tailscale status` failing entirely + vendor green = LOCAL daemon
  issue: `sudo systemctl restart tailscaled` (Gale's lane — tell Gale).
