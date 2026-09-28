#!/usr/bin/env bash
# synthetics.sh -- blackbox-style synthetic checks for the Gale site.
# Probes pages + APIs + TLS expiry, writes api/synthetics.json for
# reliability.html. Safe to run from cron every 2-5 min.
# Usage: BASE=https://gale-agent.tail2f1671.ts.net bash tools/synthetics.sh
set -u
BASE="${BASE:-http://100.66.39.59:8090}"
OUT="${OUT:-/var/www/gale-api/synthetics.json}"
TMP="$(mktemp)"
now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
check() { # name path max_ms
  local name="$1" path="$2" maxms="${3:-2000}"
  local url="$BASE/$path" code ms ok
  local start end
  start=$(date +%s%3N)
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo 000)
  end=$(date +%s%3N); ms=$((end - start))
  ok="false"; [ "$code" -ge 200 ] && [ "$code" -lt 400 ] && [ "$ms" -le "$maxms" ] && ok="true"
  printf '{"name":"%s","url":"%s","code":%s,"ms":%s,"ok":%s}\n' "$name" "$url" "$code" "$ms" "$ok"
}
{
  echo -n '{"checked_at":"'"$now"'","base":"'"$BASE"'","checks":['
  check "index" "index.html" 2000; echo -n ","
  check "fleet" "fleet.html" 2000; echo -n ","
  check "status" "status.html" 2000; echo -n ","
  check "metrics-api" "api/fleet/metrics" 2000; echo -n ","
  check "activity-api" "api/fleet/activity" 2000; echo -n ","
  check "status-json" "api/status.json" 2000
  echo ']}'
} > "$TMP"
# TLS runway (https base only): days until cert expiry, -1 when n/a
if [[ "$BASE" == https* ]]; then
  host="$(printf '%s' "$BASE" | sed -e 's#https://##' -e 's#/.*##' -e 's#:.*##')"
  exp=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$exp" ]; then
    days=$(( ($(date -d "$exp" +%s) - $(date +%s)) / 86400 ))
    python3 - "$TMP" "$days" <<'PY'
import json,sys
p, days = sys.argv[1], int(sys.argv[2])
d = json.load(open(p)); d["tls_days_left"] = days
json.dump(d, open(p, "w"))
PY
  fi
fi
mkdir -p "$(dirname "$OUT")"
mv "$TMP" "$OUT"
# cron/systemd often run this as root: keep the file world-readable so
# nginx (www-data) can serve it from /var/www/gale-api.
if [ "$(id -u)" = "0" ] && [ -n "${SUDO_USER:-}" ]; then chown "$SUDO_USER:" "$OUT" 2>/dev/null || true; fi
chmod 644 "$OUT" 2>/dev/null || true
# node_exporter textfile bridge: the same result as Prometheus metrics so
# gale-slo.yml can alert on synthetic green + per-check latency. Atomic
# write (tmp+mv) — node_exporter scrapes this dir every scrape.
TEXTFILE="${TEXTFILE:-/var/snap/node-exporter/common/gale_synth.prom}"
if python3 - "$OUT" "$TEXTFILE" <<'PY' 2>/dev/null; then
import json,sys,os
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src))
checks = d.get("checks", []) or []
okn = sum(1 for c in checks if c.get("ok"))
tot = len(checks) or 1
now = int(os.path.getmtime(src))
L = ["# HELP gale_synth_ok Synthetic check green (1) or failing (0)",
     "# TYPE gale_synth_ok gauge"]
for c in checks:
    name = str(c.get("name","?")).replace('"','')
    L.append(f'gale_synth_ok{{check="{name}"}} {1 if c.get("ok") else 0}')
L += ["# HELP gale_synth_ms Synthetic check latency milliseconds",
      "# TYPE gale_synth_ms gauge"]
for c in checks:
    name = str(c.get("name","?")).replace('"','')
    L.append(f'gale_synth_ms{{check="{name}"}} {int(c.get("ms",-1))}')
L += ["# HELP gale_synth_green_ratio Fraction of synthetic checks green",
      "# TYPE gale_synth_green_ratio gauge",
      f"gale_synth_green_ratio {okn/tot:.4f}",
      "# HELP gale_synth_run_unixtime Unixtime of last synthetic run",
      "# TYPE gale_synth_run_unixtime gauge",
      f"gale_synth_run_unixtime {now}"]
tmp = dst + ".tmp"
open(tmp,"w").write("\n".join(L) + "\n")
os.replace(tmp, dst)
PY
  chmod 644 "$TEXTFILE" 2>/dev/null || true
fi
echo "wrote $OUT"
