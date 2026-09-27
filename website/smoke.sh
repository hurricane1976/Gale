#!/usr/bin/env bash
# Smoke test for the Gale site. Checks pages, assets, feeds, and key markers.
# Usage: bash website/smoke.sh
set -u
BASE="${BASE:-http://100.66.39.59:8090}"
fail=0
check() { # url expected_code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/$1")
  if [ "$code" = "$2" ]; then echo "ok   $1"; else echo "FAIL $1 (got $code, want $2)"; fail=1; fi
}
has() { # url pattern
  if curl -s --max-time 10 "$BASE/$1" | grep -q "$2"; then echo "ok   $1 ~ $2"; else echo "FAIL $1 missing /$2/"; fail=1; fi
}
for p in index fleet status metrics observability ollama agora weather network 404; do check "$p.html" 200; done
for f in shared main fleet hosts cost activity drilldown metrics status observability network agora weather ollama particles; do check "$f.js" 200; done
for f in gale.css fleet-tidal.css assets/og-image.jpg robots.txt; do check "$f" 200; done
for u in api/status.json api/fleet/metrics api/fleet/activity api/fleet/alerts api/fleet/observability api/fleet/telemetry api/fleet/net api/agora/posts api/firewalla/status; do check "$u" 200; done
check "no-such-page-xyz" 404
has "fleet.html" 'id="hosts-grid"'
has "fleet.html" 'id="cost-trend-chart"'
has "fleet.html" 'id="roster-q"'
has "fleet.html" 'id="fleet-alerts"'
has "status.html" 'id="fleet-live-strip"'
has "status.html" 'id="fleet-24h-grid"'
has "index.html" 'id="spend-bars"'
has "api/fleet/metrics" '"runs_24h_by_host"'
has "api/fleet/metrics" '"Tidal"'
echo "--- render tests ---"
if command -v node >/dev/null 2>&1; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  if node "$SCRIPT_DIR/render-test.mjs" > /tmp/render-test-out.txt 2>&1; then
    echo "ok   render-test.mjs"
  else
    echo "FAIL render-test.mjs"; tail -5 /tmp/render-test-out.txt; fail=1
  fi
else
  echo "skip  render-test.mjs (no node)"
fi
if [ "$fail" = 0 ]; then echo "SMOKE PASS"; else echo "SMOKE FAIL"; exit 1; fi

# ROADMAP #10: Lighthouse (axe-core a11y) gate. Opt out with SKIP_AUDIT=1
# for quick loop iterations; it needs the system chromium.
if [ "${SKIP_AUDIT:-0}" != "1" ] && command -v node > /dev/null && [ -x /usr/bin/chromium-browser ]; then
  AUDIT_BASE="$BASE" node "$(dirname "$0")/tools/audit.mjs" > /tmp/gale-audit-out.txt 2>&1
  if [ $? = 0 ]; then
    grep -E '^(ok|fail)' /tmp/gale-audit-out.txt
  else
    echo "FAIL lighthouse/axe gate"; tail -12 /tmp/gale-audit-out.txt; fail=1
  fi
fi
if [ "$fail" = 0 ]; then echo "SMOKE PASS"; else echo "SMOKE FAIL"; exit 1; fi
