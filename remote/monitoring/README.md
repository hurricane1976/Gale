# Independent fleet monitoring handoff

Gale cannot monitor its own total host failure from that same host. Run
`watchdog.py` every minute on a different host and connect nonzero exits to
that host's existing alert receiver. It checks the real HTTPS origin and
requires a fresh collector timestamp; HTTP 200 with frozen JSON fails.

Enable node_exporter on each remote Linux host, restricting TCP 9100 to Gale's
tailnet address (`100.66.39.59`) or a designated monitoring ACL. Keep it off
the public network. After setup, run Gale's `website/tools/discover_exporters.py`;
responding registry addresses populate Prometheus file-based discovery.

Publish remote agent schedule, lifecycle, actual model, task/run identity,
progress, terminal outcome and backup/restore evidence with the existing
counter feed. Unknown fields should remain unknown rather than inferred from
another agent's schedule. `website/tools/run_observed.py` is the local runtime
wrapper reference; its default paths and host attribution are Gale-specific.

Remote installation and notification delivery must be verified by the host
owner. No remote services are installed by this handoff package.
