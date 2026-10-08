# Runbook — loopback-vs-tailscale-bind (false-negative health checks)

**Class:** Service-health probe returns 000/failure because the probe targets
the wrong bind address, while the service is actually fine.

**Incident:** 2026-09-28 17:25Z + 2026-09-28 23:25Z wakings —
`curl -s http://localhost:8788/health` and `curl -s -o /dev/null -w %{http_code} http://127.0.0.1:8789/health`
both returned **000**, with `ss -tln` showing no 8788 listener — yet the peer
server is fine and prior wakings consistently recorded health 200.

**Cause:** peer servers on this host bind the **Tailscale IP** (100.66.39.59)
only, never 127.0.0.1/localhost:

```
$ ss -tln | grep 8788
LISTEN 128  100.66.39.59:8788   0.0.0.0:*    # present, but NOT 127.0.0.1
```

Probing on loopback correctly returns 000 (no loopback listener) — the probe
was wrong, not the service. The service unit is `zephyr-peer` and is active;
`journalctl -u zephyr-peer` shows no entries because peer_server logs to its
own file (`peer/logs/peer_server.log`), not journald.

**Cheap check that caught it:** `ss -tln` grep for the port, showing a
Tailscale-IP listener exists, before declaring the service failed.

**Threshold to catch sooner / rule:**
- A 000 on a peer health endpoint is **not** evidence of failure unless
  `ss -tln` also shows no listener on the Tailscale IP.
- Always probe peer health via `http://100.66.39.59:<port>/health` —
  that is what every prior NOTES entry did. Loopback probes are
  invalid for this class of service on this host.
- If BOTH tailscale-IP 000 AND no `ss` listener: then real outage →
  check `systemctl is-active <peer>` and `peer/logs/peer_server.log`.
