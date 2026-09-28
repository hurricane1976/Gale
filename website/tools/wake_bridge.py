#!/usr/bin/env python3
"""wake_bridge.py -- Prometheus textfile bridge for the agent wake SLO.

gale-hardware.yml deliberately says wake cadence "lives in fleet_api runs,
not Prom" -- this bridge closes that gap. It turns three existing sources
into textfile metrics (same bridge pattern as sysmon.write_textfile and
synthetics.sh; cron every 5 min):

  1. crontab -l          -> per-agent expected cadence (hours per day)
  2. fleet_api /telemetry-> per-agent last wake, 24h run + error counts
     (127.0.0.1:8793, same parser fleet_api already runs; fallback: raw
      log fname timestamps, so a dead fleet_api degrades, not breaks)
  3. /proc cmdline scan  -> live `opencode run --dir ...` session ages
     (no ps shell-out; /proc/stat field 22 + /proc/uptime math)

Metrics (agent label = fleet_api display name, "gale" for ~/agent):

  gale_wake_expected_interval_seconds{agent}   86400 / (wake hours per day)
  gale_wake_expected_runs_per_day{agent}
  gale_wake_last_age_seconds{agent}            time since last recorded wake
  gale_wake_runs_24h{agent} / errors_24h{agent}
  gale_wake_missed{agent}                      1 when last_age > interval * 1.75
  gale_wake_last_duration_ms{agent} / last_cost_usd{agent}
  gale_wake_live_session_seconds{agent}        oldest live session, 0 = none
  gale_wake_bridge_unixtime

Alert rules live in monitoring/gale-wake.rules.yml (missed wake, session
stuck > 2h, bridge stale). Runs are recorded by wake.sh writing
logs/<ts>.json per waking; the bridge never writes those, it only reads.
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone

HOME_BASE = "/home/agent"
FLEET_API = os.environ.get("FLEET_API_URL", "http://127.0.0.1:8793/telemetry")
TEXTFILE = os.environ.get("WAKE_TEXTFILE", "/var/snap/node-exporter/common/gale_wake.prom")
GRACE_FACTOR = 1.75  # missed = last_age > interval * 1.75 (crond skew + long wakings)
# fleet_api AGENTS display order; dir "agent" is displayed "gale"
DISPLAY = {"agent": "gale"}
FNAME_TS = re.compile(r"^(\d{8})T(\d{6})Z\.json$")


def esc(v):
    return str(v).replace('"', '\\"').replace("\n", " ")[:40]


def cron_cadence():
    """Parse this user's crontab for wake.sh lines -> {dir: hours_per_day}."""
    out = {}
    try:
        raw = subprocess.run(["crontab", "-l"], capture_output=True, text=True,
                              timeout=10).stdout
    except Exception as e:
        sys.stderr.write(f"wake_bridge: crontab -l failed: {e!r}\n")
        return out
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "/wake.sh" not in line:
            continue
        parts = line.split()
        if len(parts) < 6:
            continue
        hours = parts[1]
        try:
            n = len({int(h) for h in hours.split(",") if h.isdigit()})
        except ValueError:
            continue
        m = re.search(r"/home/agent/([A-Za-z0-9_-]+)/wake\.sh", line)
        if m and n > 0:
            out[m.group(1)] = n
    return out


def fname_epoch(name):
    m = FNAME_TS.match(name)
    if not m:
        return None
    try:
        dt = datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S")
        return dt.replace(tzinfo=timezone.utc).timestamp()
    except ValueError:
        return None


def runs_from_fleet_api():
    """fleet_api /telemetry local rows: full fidelity (errors, cost, ms)."""
    req = urllib.request.Request(FLEET_API, headers={"User-Agent": "gale-wake-bridge/1"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        env = json.loads(resp.read().decode("utf-8"))
    runs = {}
    for r in env.get("runs") or []:
        if r.get("host") not in (None, "gale"):
            continue  # relayed remote rows -- not this bridge's SLO
        a = r.get("agent") or "?"
        runs.setdefault(a, []).append(r)
    return runs


def runs_from_logs(cadence):
    """Fallback when fleet_api is down: log fnames only (no error/cost data)."""
    runs = {}
    for d in cadence:
        logdir = os.path.join(HOME_BASE, d, "logs")
        try:
            names = os.listdir(logdir)
        except OSError:
            continue
        for n in names:
            ts = fname_epoch(n)
            if ts:
                runs.setdefault(DISPLAY.get(d, d), []).append({"ts_epoch": ts})
    return runs


def run_epoch(r):
    if "ts_epoch" in r:
        return r["ts_epoch"]
    try:
        dt = datetime.fromisoformat(str(r.get("ts")).replace("Z", "+00:00"))
        return dt.timestamp()
    except Exception:
        return 0.0


def live_sessions():
    """/proc scan: age of oldest live `opencode run --dir /home/agent/X`."""
    try:
        boot = time.time() - float(open("/proc/uptime").read().split()[0])
        ticks = os.sysconf("SC_CLK_TCK")
    except Exception:
        return {}
    ages = {}
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        try:
            with open(f"/proc/{pid}/cmdline", "rb") as f:
                argv = f.read().decode("utf-8", "replace").split("\0")
            if "opencode" not in argv or "run" not in argv:
                continue
            if "--dir" not in argv:
                continue
            d = argv[argv.index("--dir") + 1].rstrip("/")
            agent_dir = os.path.basename(d)
            with open(f"/proc/{pid}/stat") as f:
                started_ticks = int(f.read().rsplit(")", 1)[1].split()[19])
            age = max(0.0, time.time() - (boot + started_ticks / ticks))
            name = DISPLAY.get(agent_dir, agent_dir)
            ages[name] = max(ages.get(name, 0.0), age)
        except (OSError, IndexError, ValueError):
            continue
    return ages


def main():
    now = time.time()
    cadence = cron_cadence()
    try:
        runs = runs_from_fleet_api()
        api_up = 1
    except Exception as e:
        sys.stderr.write(f"wake_bridge: fleet_api telemetry failed: {e!r}\n")
        runs, api_up = runs_from_logs(cadence), 0

    live = live_sessions()
    L = [
        "# HELP gale_wake_expected_interval_seconds Scheduled seconds between wakes (from crontab)",
        "# TYPE gale_wake_expected_interval_seconds gauge",
    ]
    rows = {}
    for d, per_day in cadence.items():
        name = DISPLAY.get(d, d)
        interval = 86400.0 / per_day
        arr = runs.get(name, [])
        last_age = min((now - run_epoch(r)) for r in arr) if arr else -1.0
        last = min(arr, key=run_epoch) if arr else {}
        runs24 = sum(1 for r in arr if now - run_epoch(r) <= 86400)
        errs24 = sum(1 for r in arr if now - run_epoch(r) <= 86400 and r.get("is_error"))
        missed = 1 if (last_age < 0 or last_age > interval * GRACE_FACTOR) else 0
        rows[name] = {
            "interval": interval, "per_day": per_day, "last_age": last_age,
            "runs24": runs24, "errs24": errs24, "missed": missed,
            "dur_ms": last.get("duration_ms"), "cost": last.get("cost_usd"),
            "live_s": live.get(name, 0.0),
        }
    for name, r in rows.items():
        L.append(f'gale_wake_expected_interval_seconds{{agent="{esc(name)}"}} {r["interval"]:.0f}')
    L += [
        "# HELP gale_wake_expected_runs_per_day Scheduled wakes per day (from crontab)",
        "# TYPE gale_wake_expected_runs_per_day gauge",
    ]
    for name, r in rows.items():
        L.append(f'gale_wake_expected_runs_per_day{{agent="{esc(name)}"}} {r["per_day"]}')
    L += [
        "# HELP gale_wake_last_age_seconds Seconds since the agent's last recorded wake (-1 = never)",
        "# TYPE gale_wake_last_age_seconds gauge",
    ]
    for name, r in rows.items():
        L.append(f'gale_wake_last_age_seconds{{agent="{esc(name)}"}} {r["last_age"]:.0f}')
    L += [
        "# HELP gale_wake_runs_24h Wakes recorded in the last 24h",
        "# TYPE gale_wake_runs_24h gauge",
    ]
    for name, r in rows.items():
        L.append(f'gale_wake_runs_24h{{agent="{esc(name)}"}} {r["runs24"]}')
    L += [
        "# HELP gale_wake_errors_24h Wake runs that ended is_error in the last 24h",
        "# TYPE gale_wake_errors_24h gauge",
    ]
    for name, r in rows.items():
        L.append(f'gale_wake_errors_24h{{agent="{esc(name)}"}} {r["errs24"]}')
    L += [
        "# HELP gale_wake_missed Agent missed its wake window (last_age > interval * %.2f) (1/0)" % GRACE_FACTOR,
        "# TYPE gale_wake_missed gauge",
    ]
    for name, r in rows.items():
        L.append(f'gale_wake_missed{{agent="{esc(name)}"}} {r["missed"]}')
    L += [
        "# HELP gale_wake_last_duration_ms Last wake run duration ms (from run envelope)",
        "# TYPE gale_wake_last_duration_ms gauge",
    ]
    for name, r in rows.items():
        v = r["dur_ms"] if isinstance(r["dur_ms"], (int, float)) else -1
        L.append(f'gale_wake_last_duration_ms{{agent="{esc(name)}"}} {v}')
    L += [
        "# HELP gale_wake_last_cost_usd Last wake run cost usd (from run envelope)",
        "# TYPE gale_wake_last_cost_usd gauge",
    ]
    for name, r in rows.items():
        v = r["cost"] if isinstance(r["cost"], (int, float)) else -1
        L.append(f'gale_wake_last_cost_usd{{agent="{esc(name)}"}} {v}')
    L += [
        "# HELP gale_wake_live_session_seconds Age of the agent's oldest live opencode session (0 = none)",
        "# TYPE gale_wake_live_session_seconds gauge",
    ]
    for name, r in rows.items():
        L.append(f'gale_wake_live_session_seconds{{agent="{esc(name)}"}} {r["live_s"]:.0f}')
    L += [
        "# HELP gale_wake_fleet_api_up fleet_api /telemetry reachable (1/0; 0 = fname fallback)",
        "# TYPE gale_wake_fleet_api_up gauge",
        f"gale_wake_fleet_api_up {api_up}",
        "# HELP gale_wake_bridge_unixtime Unixtime of last wake_bridge run",
        "# TYPE gale_wake_bridge_unixtime gauge",
        f"gale_wake_bridge_unixtime {int(now)}",
    ]

    tmp = f"{TEXTFILE}.tmp-{os.getpid()}"
    os.makedirs(os.path.dirname(TEXTFILE), exist_ok=True)
    with open(tmp, "w") as f:
        f.write("\n".join(L) + "\n")
    os.replace(tmp, TEXTFILE)
    os.chmod(TEXTFILE, 0o644)
    missed_n = sum(1 for r in rows.values() if r["missed"])
    print(f"wake_bridge: wrote {TEXTFILE} ({len(rows)} agents, {missed_n} missed, "
          f"fleet_api={'up' if api_up else 'fallback'})")


if __name__ == "__main__":
    main()
