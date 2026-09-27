#!/usr/bin/env python3
"""gen_schema.py -- emit JSON Schema for the fleet API payloads (ROADMAP
#6, Python side of the Python<->JS boundary).

The payloads that cross into the browser (metrics, observability, status)
are produced by Python dicts with no declared shape; the JS side validates
them with hand-written zod schemas in website/payloads.js. When the two
drift, the tripwire fires at runtime -- too late. This generator closes the
loop: the shape spec is written once, here, as JSON Schema, and:

  * payloads.schema.json is committed next to payloads.js, and
  * tools/check_schema.py (wired into smoke.sh) validates the LIVE
    responses against it with the installed jsonschema lib, while
  * payloads.js remains the runtime browser gate (zod).

Usage: ./tools/gen_schema.py [--check] (default --check; --write updates)
"""
import json
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent

NUM = {"type": "number"}
NUMNULL = {"type": ["number", "null"]}
STR = {"type": "string"}
STRNULL = {"type": ["string", "null"]}
NUMARR = {"type": "array", "items": {"type": "number"}}

# The three payload shapes, asserted from sysmon.py / fleet_api.py render
# derefs -- same contract payloads.js enforces at runtime, kept in sync by
# the smoke test running the live responses through BOTH.
SCHEMAS = {
    "metrics": {
        "$id": "gale/fleet-metrics-v1",
        "type": "object",
        "required": ["days", "per_agent_24h", "fleet_status", "generated_at",
                     "daily_wakings_by_host", "daily_cost_by_host"],
        "properties": {
            "days": {"type": "array", "items": STR},
            "per_agent_24h": {"type": "array", "items": {
                "type": "object",
                "required": ["agent", "runs_24h", "error_runs_24h",
                             "daily_wakings_14d", "daily_cost_14d",
                             "total_wakings_14d"],
                "properties": {
                    "agent": STR,
                    "runs_24h": NUM,
                    "cost_24h": NUMNULL,
                    "error_runs_24h": NUM,
                    "last_wake": STRNULL,
                    "daily_wakings_14d": NUMARR,
                    "daily_cost_14d": NUMARR,
                    "total_wakings_14d": NUM,
                },
            }},
            "fleet_status": {"type": "object", "additionalProperties": {
                "type": "object",
                "required": ["listener", "state", "code"],
                "properties": {"listener": STR, "state": STR, "code": NUM},
            }},
            "daily_wakings_by_host": {"type": "object", "additionalProperties": NUMARR},
            "daily_cost_by_host": {"type": "object", "additionalProperties": NUMARR},
            "generated_at": STR,
        },
    },
    "observability": {
        "$id": "gale/fleet-observability-v1",
        "type": "object",
        "required": ["totals", "runs", "count", "generated_at"],
        "properties": {
            "totals": {
                "type": "object",
                "required": ["cost_usd", "mean_cost_usd"],
                "properties": {
                    "cost_usd": NUM,
                    "mean_cost_usd": NUM,
                    "total_tokens": NUM,
                },
            },
            "runs": {"type": "array", "items": {
                "type": "object",
                "required": ["ts", "agent"],
                "properties": {"ts": STR, "agent": STR},
            }},
            "count": NUM,
            "generated_at": STR,
            "instrumented_since": STR,
        },
    },
    "status": {
        "$id": "gale/ops-status-v1",
        "type": "object",
        "required": ["host", "services", "targets", "security", "network"],
        "properties": {
            "host": {
                "type": "object",
                "required": ["hostname", "cpu_count", "cpu_pct", "uptime_s",
                             "reboot_required", "load", "mem", "swap",
                             "disks", "cpu_per_core"],
                "properties": {
                    "hostname": STR,
                    "cpu_count": NUM,
                    "cpu_pct": NUM,
                    "uptime_s": NUM,
                    "reboot_required": {"type": "boolean"},
                    "load": NUMARR,
                    "cpu_per_core": NUMARR,
                    "mem": {"type": "object", "required": ["pct", "used_mb", "total_mb"],
                            "properties": {"pct": NUM, "used_mb": NUM, "total_mb": NUM}},
                    "swap": {"type": "object", "required": ["pct", "used_mb"],
                             "properties": {"pct": NUM, "used_mb": NUM}},
                    "disks": {"type": "array", "items": {
                        "type": "object", "required": ["pct", "used_gb", "total_gb"],
                        "properties": {"pct": NUM, "used_gb": NUM, "total_gb": NUM}}},
                },
            },
            "services": {"type": "array", "items": {
                "type": "object", "required": ["unit", "state"],
                "properties": {"unit": STR, "state": STR, "since": STRNULL},
            }},
            "targets": {"type": "array", "items": {
                "type": "object", "required": ["name", "kind", "addr", "health"],
                "properties": {"name": STR, "kind": STR, "addr": STR, "health": STR},
            }},
            "security": {"type": "object",
                         "properties": {"ufw_active": {"type": "boolean"}}},
            "network": {
                "type": "object",
                "required": ["interfaces", "listening_ports"],
                "properties": {
                    "interfaces": {"type": "array", "items": {
                        "type": "object",
                        "required": ["name", "ip", "rx_mbps", "tx_mbps", "rx_total_gb", "tx_total_gb"],
                        "properties": {"name": STR, "ip": STRNULL, "rx_mbps": NUM,
                                       "tx_mbps": NUM, "rx_total_gb": NUM, "tx_total_gb": NUM},
                    }},
                    "listening_ports": {"type": "array", "items": {
                        "type": "object",
                        "required": ["port", "proc", "addrs"],
                        "properties": {"port": {"type": ["number", "string"]},
                                       "proc": STRNULL, "addrs": {"type": "array", "items": STR}},
                    }},
                },
            },
            "generated_at": STR,
        },
    },
}


def main():
    out = json.dumps(SCHEMAS, indent=2, sort_keys=True) + "\n"
    target = SITE / "payloads.schema.json"
    if "--write" in sys.argv:
        target.write_text(out)
        print(f"wrote {target}")
    else:
        if not target.exists() or target.read_text() != out:
            print("payloads.schema.json missing or stale; run: ./tools/gen_schema.py --write")
            sys.exit(1)
        print("payloads.schema.json up to date")


if __name__ == "__main__":
    main()
