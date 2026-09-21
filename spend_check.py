#!/usr/bin/env python3
"""Per-run spend alert + rolling daily total (fleet-security option C2).
Supports both Claude envelope and opencode streamed JSON.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

PER_RUN_ALERT_USD = 5.00
DAILY_ALERT_USD = 15.00

REPO = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.path.join(REPO, "logs", "spend-daily.jsonl")
NOTIFY = os.path.join(REPO, "notify.sh")

def parse_cost_and_error(path):
    """Return (cost_float_or_None, is_error_bool). Handles claude envelope or opencode stream."""
    try:
        txt = open(path).read().strip()
        if not txt:
            return None, False
        # Try single JSON envelope (claude)
        try:
            env = json.loads(txt)
            if isinstance(env, dict) and "total_cost_usd" in env:
                return float(env.get("total_cost_usd") or 0), bool(env.get("is_error"))
        except Exception:
            pass
        # Try stream: each line is a JSON event (opencode --format json)
        cost = None
        is_error = False
        for line in reversed(txt.splitlines()):
            line=line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except:
                continue
            if ev.get("type") == "step_finish":
                part = ev.get("part", {}) or {}
                cost = part.get("cost", 0)
                # opencode step_finish has no is_error, use reason
                is_error = part.get("reason") == "error"
                break
        if cost is not None:
            return float(cost), is_error
        # fallback: if we got here, try first line envelope without total_cost_usd -> treat as 0 for free model
        # check if any event is step_finish without cost -> free
        if '"step_finish"' in txt:
            return 0.0, False
        return None, False
    except Exception as e:
        print(f"(spend_check: could not read envelope: {e})")
        return None, False

def main():
    if len(sys.argv) < 2:
        return
    cost, is_error = parse_cost_and_error(sys.argv[1])
    if cost is None or not isinstance(cost, (int, float)):
        print("(spend_check: no cost in envelope, nothing to record)")
        return
    cost = float(cost)

    now = datetime.now(timezone.utc)
    day = now.strftime("%Y-%m-%d")
    rec = {
        "day": day,
        "ts": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "cost_usd": round(cost, 4),
        "is_error": bool(is_error),
    }
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    with open(LEDGER, "a") as fh:
        fh.write(json.dumps(rec) + "\n")

    day_total = 0.0
    try:
        with open(LEDGER) as fh:
            for line in fh:
                try:
                    r = json.loads(line)
                except ValueError:
                    continue
                if r.get("day") == day:
                    day_total += float(r.get("cost_usd") or 0.0)
    except FileNotFoundError:
        day_total = rec["cost_usd"]

    prev_total = day_total - rec["cost_usd"]
    alerts = []
    if cost > PER_RUN_ALERT_USD:
        alerts.append(f"one run cost ${cost:.2f} (> ${PER_RUN_ALERT_USD:.2f})")
    if prev_total <= DAILY_ALERT_USD < day_total:
        alerts.append(f"today's {os.path.basename(REPO)} spend crossed ${DAILY_ALERT_USD:.2f} (now ${day_total:.2f})")

    print(f"(spend_check: run ${cost:.4f}, {day} total ${day_total:.4f}, {'ALERT' if alerts else 'ok'})")
    if alerts:
        msg = "spend alert:\n- " + "\n- ".join(alerts)
        try:
            subprocess.run([NOTIFY, msg], timeout=30)
        except Exception as e:
            print(f"(spend_check: notify failed: {e})")

if __name__ == "__main__":
    main()
