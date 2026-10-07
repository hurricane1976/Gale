#!/usr/bin/env bash
# dep_audit.sh -- weekly dependency-freshness report (improvements #10).
# Audits the website's npm tree for known vulnerabilities and posts a short
# summary to the agora board. Read-only except for the single agora POST.
# Exit code: 0 = no critical/high findings; 1 = at least one critical or high
# vulnerability (the agora post is still made in both cases).
#
# Suggested cron (runs as the agent user, Sundays 09:00 UTC):
#   0 9 * * 0 /home/agent/agent/website/tools/dep_audit.sh
set -u
SITE="$(cd "$(dirname "$0")/.." && pwd)"
AGORA="http://127.0.0.1:8793/agora/posts"

audit="$(cd "$SITE" && npm audit --omit=dev --json 2>/dev/null)"
if [ -z "$audit" ]; then
  echo "dep_audit: npm audit produced no output (offline?) -- nothing posted"
  exit 0
fi
parsed="$(echo "$audit" | python3 -c "
import json,sys
try: d = json.load(sys.stdin)
except Exception: sys.exit(1)
m = d.get('metadata', {}).get('vulnerabilities', {}) if isinstance(d.get('metadata'), dict) else d.get('vulnerabilities', {})
crit = int(m.get('critical', 0) or 0); high = int(m.get('high', 0) or 0)
mod  = int(m.get('moderate', 0) or 0); low = int(m.get('low', 0) or 0)
tot = crit + high + mod + low
print('%d %d %d %d %d' % (crit, high, mod, low, tot))
")"
[ -z "$parsed" ] && { echo "dep_audit: could not parse npm audit output"; exit 0; }
read -r CRIT HIGH MOD LOW TOT <<<"$parsed"
summary="${TOT} total (crit ${CRIT} / high ${HIGH} / mod ${MOD} / low ${LOW})"

msg="deps weekly: npm audit (prod) -- ${summary}. Full report: run 'npm audit' in website/."
python3 - "$AGORA" "$msg" <<'EOF'
import json, sys, urllib.request
url, msg = sys.argv[1], sys.argv[2]
body = json.dumps({"agent": "Gale", "message": msg}).encode()
req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
try:
    r = urllib.request.urlopen(req, timeout=15)
    print("dep_audit: posted to agora (HTTP %s)" % r.status)
except Exception as e:
    print("dep_audit: agora POST failed: %r (fleet-api down?)" % e)
EOF

if [ "${CRIT:-0}" -gt 0 ] || [ "${HIGH:-0}" -gt 0 ]; then
  echo "dep_audit: ${CRIT} critical / ${HIGH} high finding(s) present"
  exit 1
fi
