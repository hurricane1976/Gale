#!/usr/bin/env python3
"""Per-run spend alert + rolling daily total (fleet-security option C2).

Called by wake.sh with the path to a `claude --output-format json` envelope.
Records total_cost_usd into logs/spend-daily.jsonl (one line per run) and
Telegrams josh via notify.sh when:

  * a single run costs more than PER_RUN_ALERT_USD, or
  * the run that pushes the current UTC day's total past DAILY_ALERT_USD
    (only the crossing run alerts -- no repeat nagging for the rest of the day).

Alert-only: it never blocks or kills a run, and it always exits 0 so a bug
here cannot break wake.sh. Only Gale's own runs pass through here.
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


def main():
    if len(sys.argv) < 2:
        return
    try:
        env = json.load(open(sys.argv[1]))
    except Exception as e:
        print(f"(spend_check: could not read envelope: {e})")
        return

    cost = env.get("total_cost_usd")
    # opencode --format json emits a stream of events; cost is in last step_finish
    if cost is None:
        # try opencode stream: file may contain multiple JSON lines
        try:
            import pathlib as _pl
            txt = _pl.Path(sys.argv[1]).read_text().strip()
            # if stream, pick last step_finish cost
            for line in reversed(txt.splitlines()):
                try:
                    ev = json.loads(line)
                except: continue
                if ev.get("type") == "step_finish":
                    cost = ev.get("part",{}).get("cost", 0) or 0
                    # tokens not needed for cost record; break
                    break
            else:
                # no step_finish, fallback to 0 for free model
                cost = 0.0
        except Exception:
            cost = None
    if not isinstance(cost, (int, float)):
        # allow 0 cost for free model runs that emitted no cost field
        if cost is None:
            print("(spend_check: no total_cost_usd in envelope, nothing to record)")
            return
        try:
            cost = float(cost)
        except:
            print("(spend_check: no total_cost_usd in envelope, nothing to record)")
            return
    cost = float(cost)

    now = datetime.now(timezone.utc)
    day = now.strftime("%Y-%m-%d")
    rec = {
        "day": day,
        "ts": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "cost_usd": round(cost, 4),
        "is_error": bool(env.get("is_error")),
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
        alerts.append(
            f"today's Gale spend crossed ${DAILY_ALERT_USD:.2f} "
            f"(now ${day_total:.2f})"
        )

    print(
        f"(spend_check: run ${cost:.4f}, {day} total ${day_total:.4f}, "
        f"{'ALERT' if alerts else 'ok'})"
    )
    if alerts:
        msg = "spend alert:\n- " + "\n- ".join(alerts)
        try:
            subprocess.run([NOTIFY, msg], timeout=30)
        except Exception as e:
            print(f"(spend_check: notify failed: {e})")


if __name__ == "__main__":
    main()
