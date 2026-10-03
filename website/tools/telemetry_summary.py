#!/usr/bin/env python3
"""Small heartbeat feed: per-host status, last wake, and the last 24h of runs
(host + ts only). The full /api/fleet/telemetry payload is ~1.8 MB; the home
heartbeat only needs this. Written to /var/www/gale-api/telemetry-summary.json
(served as /api/telemetry-summary.json). Run from cron."""
import json, os, time, urllib.request
from datetime import datetime, timezone

SRC = os.environ.get('TELEMETRY_URL', 'http://127.0.0.1:8090/api/fleet/telemetry')
OUT = os.path.join(os.environ.get('GALE_API_DIR', '/var/www/gale-api'), 'telemetry-summary.json')

d = json.load(urllib.request.urlopen(SRC, timeout=20))
cut = time.time() - 25 * 3600
def ts(r):
    try:
        return datetime.fromisoformat(r['ts'].replace('Z', '+00:00')).timestamp()
    except (KeyError, ValueError, AttributeError):
        return 0
out = {'schema': 'fleet-telemetry-summary/v1', 'generated_at': d.get('generated_at'),
       'hosts': d.get('hosts', {}),
       'totals': {'last_wake_by_host': (d.get('totals') or {}).get('last_wake_by_host', {})},
       'runs': [{'host': r.get('host'), 'ts': r['ts']} for r in d.get('runs', []) if ts(r) >= cut]}
tmp = OUT + '.tmp'
open(tmp, 'w').write(json.dumps(out, separators=(',', ':')))
os.chmod(tmp, 0o644)
os.replace(tmp, OUT)
print(f'telemetry-summary: {len(out["runs"])} runs, {os.path.getsize(OUT)} bytes')
