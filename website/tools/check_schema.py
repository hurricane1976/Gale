#!/usr/bin/env python3
"""check_schema.py -- validate the LIVE fleet API responses against the
committed payloads.schema.json contract (ROADMAP #6). Wired into smoke.sh:
a backend change that breaks the browser contract fails the pipeline, not
a user's tab."""
import json
import sys
import urllib.request
from pathlib import Path

import jsonschema

SITE = Path(__file__).resolve().parent.parent
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8090"

ENDPOINTS = {
    "metrics": "/api/fleet/metrics",
    "observability": "/api/fleet/observability",
    "status": "/api/status.json",
}


def main():
    schema_doc = json.loads((SITE / "payloads.schema.json").read_text())
    failed = False
    for name, path in ENDPOINTS.items():
        try:
            with urllib.request.urlopen(BASE + path, timeout=30) as r:
                payload = json.load(r)
        except Exception as e:
            print(f"FAIL {path}: unreachable ({e})")
            failed = True
            continue
        schema = dict(schema_doc[name])
        schema.setdefault("$schema", "http://json-schema.org/draft-07/schema#")
        try:
            jsonschema.validate(payload, schema)
            print(f"ok   {path} ~ contract {name}")
        except jsonschema.ValidationError as e:
            where = ".".join(str(p) for p in (e.absolute_path or [])) or "(root)"
            print(f"FAIL {path} ~ contract {name}: {where}: {e.message}")
            failed = True
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
