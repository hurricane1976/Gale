#!/usr/bin/env python3
"""drill_bridge.py -- restore-drill verdict -> Prometheus textfile (cron */15).
restore_drill.sh writes /var/www/gale-api/restore-drill.json; nothing watched
it, so a drill that stopped running (or started failing) was invisible.
Metrics: gale_restore_drill_ok, gale_restore_drill_age_seconds,
gale_restore_drill_checks, gale_restore_drill_unixtime."""
import json, os, time
from datetime import datetime, timezone
SRC = "/var/www/gale-api/restore-drill.json"
OUT = os.environ.get("DRILL_TEXTFILE", "/var/snap/node-exporter/common/gale_drill.prom")
try:
    d = json.load(open(SRC))
    ts = datetime.strptime(d["ts"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp()
    lines = ["# TYPE gale_restore_drill_ok gauge", f'gale_restore_drill_ok {1 if d.get("ok") else 0}',
             "# TYPE gale_restore_drill_age_seconds gauge", f"gale_restore_drill_age_seconds {int(time.time() - ts)}",
             "# TYPE gale_restore_drill_checks gauge", f'gale_restore_drill_checks {int(d.get("checks") or 0)}',
             "# TYPE gale_restore_drill_unixtime gauge", f"gale_restore_drill_unixtime {int(ts)}"]
except Exception:
    lines = ["# TYPE gale_restore_drill_ok gauge", "gale_restore_drill_ok 0",
             "# TYPE gale_restore_drill_age_seconds gauge", "gale_restore_drill_age_seconds 99999999"]
open(OUT + ".tmp", "w").write("\n".join(lines) + "\n")
os.replace(OUT + ".tmp", OUT)
