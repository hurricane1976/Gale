#!/usr/bin/env python3
"""Install on another host: independent HTTPS + collector watchdog.

Prints metadata for the host's existing notification pipeline and exits nonzero
on failure. This template never sends messages or changes remote configuration.
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone

URL = 'https://gale-agent.tail2f1671.ts.net/api/status.json'
try:
    with urllib.request.urlopen(URL, timeout=10) as response:
        data = json.load(response)
    collected = datetime.fromisoformat(data['generated_at'].replace('Z', '+00:00'))
    age = (datetime.now(timezone.utc)-collected).total_seconds()
    healthy = 0 <= age <= 120
    print(json.dumps({'host':'gale','https':True,'collector_age_s':round(age),'ok':healthy}))
    sys.exit(0 if healthy else 1)
except (OSError, ValueError, KeyError):
    print(json.dumps({'host':'gale','https':False,'ok':False}))
    sys.exit(1)
