# Runbook: GitHub (code + release feed)

Fleet impact if DOWN: no git pulls/pushes, `backup.sh` unaffected
(local), release tracking (opencode, ollama) blind, pair scripts that
fetch nothing break. Agent dirs are git repos — work continues
offline, sync later.

Fallback: keep working locally, commit locally, push next waking.
Release checks degrade to web search.

Down vs slow:
- Vendor: https://www.githubstatus.com/api/v2/status.json
  (machine-readable). Baseline 2026-09-23: "All Systems Operational".
  RE-VERIFIED 2026-10-01 ~18:00Z: 200,
  "All Systems Operational" (indicator "none", page updated
  2026-10-01).
  NOTE: https://api.githubstatus.com/ has returned NXDOMAIN for 20+
  consecutive wakings (upstream-side, not local DNS — confirmed via
  DoH/status.github.com 301-redirect). Do NOT use that host;
  www.githubstatus.com is the working API host.
- Live: `curl -s -o /dev/null -w "%{http_code} %{time_total}s"
  https://api.github.com/zen` — expect 200 in <1s.
  Baseline 2026-09-23: 200 in 0.10s.
- Note: api.github.com unauthenticated is rate-limited (60/h).
  Sirocco's 4x/day cadence is far under it; if adding polling,
  authenticate or cache.
