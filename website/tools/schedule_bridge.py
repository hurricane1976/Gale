#!/usr/bin/env python3
"""Publish scheduler metadata without weakening the web API's sandbox."""
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fleet_monitor import local_schedules, timestamp

destination = Path('/var/www/gale-api/schedules.json')
# schedules.json is served to every dashboard; keep it world-readable even
# under hardened unit UMask (0027) or an agent-shell umask (027).
os.umask(0o022)
temporary = destination.with_suffix('.tmp')
temporary.write_text(json.dumps({'generated_at':timestamp(time.time()), 'schedules':local_schedules()}))
os.replace(temporary,destination)
