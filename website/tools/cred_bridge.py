#!/usr/bin/env python3
"""cred_bridge.py -- Prometheus textfile bridge for keys/ permission drift.

Automates (and alerts on) the credential-hygiene audit Poniente has been
running by hand every waking: the per-agent keys/ permission matrix.
Design follows the sudoers.sha256 pattern -- drift is measured against a
SEEDED BASELINE, not against absolute ideals, because the accepted matrix
is a policy decision (11 sibling dirs are deliberately 775, levante's
telegram.env is deliberately 664 pending ASK-4; absolute checks would
page forever on a known, operator-owned state).

First run seeds /var/www/gale-api/cred-baseline.json (dir mode + per-file
mode for every keys/ dir under /home/agent/*) and writes all-zero drift
metrics. After an INTENTIONAL change, re-seed with --reseed (or delete the
baseline file); everything else pages.

Metrics (gale_cred.prom, cron every 5 min):
  gale_cred_drift{agent}          1 when dir mode, file modes, or the
                                  file set differs from baseline
  gale_cred_new_files{agent}      files present but not in baseline
  gale_cred_missing_files{agent}  baseline files now gone
  gale_cred_changed{agent,file}   1 for live .env files whose mtime moved
                                  since the last run (state: cred-state.json)
  gale_cred_dirs_scanned          how many keys/ dirs the bridge sees
  gale_cred_bridge_unixtime

Alerts in monitoring/gale-cred.rules.yml. .env CONTENTS are never read --
modes and mtimes only (the bridge runs unattended; rule 1 of this house:
credentials are not data to be parsed by automation).
"""
import json
import os
import stat
import sys
import time

HOME_BASE = "/home/agent"
API_DIR = "/var/www/gale-api"
BASELINE_PATH = os.path.join(API_DIR, "cred-baseline.json")
STATE_PATH = os.path.join(API_DIR, "cred-state.json")
TEXTFILE = os.environ.get("CRED_TEXTFILE", "/var/snap/node-exporter/common/gale_cred.prom")
RESEED = "--reseed" in sys.argv


def esc(v):
    return str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")[:60]


def scan():
    """{agent: {"dir_mode": octal-str, "files": {name: mode-str}}}"""
    out = {}
    try:
        entries = sorted(os.listdir(HOME_BASE))
    except OSError as e:
        sys.stderr.write(f"cred_bridge: cannot list {HOME_BASE}: {e!r}\n")
        return out
    for name in entries:
        keys = os.path.join(HOME_BASE, name, "keys")
        if not os.path.isdir(keys):
            continue
        try:
            dmode = stat.S_IMODE(os.stat(keys).st_mode)
            files = {}
            for fn in sorted(os.listdir(keys)):
                fp = os.path.join(keys, fn)
                if os.path.isfile(fp) and not os.path.islink(fp):
                    files[fn] = stat.S_IMODE(os.stat(fp).st_mode)
            out[name] = {"dir_mode": format(dmode, "o"), "files": {k: format(v, "o") for k, v in files.items()}}
        except OSError as e:
            sys.stderr.write(f"cred_bridge: scan {keys} failed: {e!r}\n")
    return out


def load_json(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def save_json(path, obj):
    tmp = f"{path}.tmp-{os.getpid()}"
    with open(tmp, "w") as f:
        json.dump(obj, f, indent=1, sort_keys=True)
    os.replace(tmp, path)


def main():
    os.makedirs(API_DIR, exist_ok=True)
    live = scan()
    baseline = None if RESEED else load_json(BASELINE_PATH)
    seeded = False
    if baseline is None:
        baseline = live
        save_json(BASELINE_PATH, baseline)
        seeded = True

    state = load_json(STATE_PATH) or {}
    prev_mtimes = state.get("mtimes", {})

    L = [
        "# HELP gale_cred_drift keys/ state differs from the seeded baseline (1/0)",
        "# TYPE gale_cred_drift gauge",
    ]
    drift_rows = []
    new_rows = []
    changed_rows = []
    for agent, cur in sorted(live.items()):
        base = baseline.get(agent)
        drift = 0
        n_new = 0
        if base is None:
            drift = 1  # dir appeared after baseline
            n_new = len(cur["files"])
        else:
            if cur["dir_mode"] != base.get("dir_mode"):
                drift = 1
            base_files = base.get("files", {})
            for fn, mode in cur["files"].items():
                if fn not in base_files:
                    n_new += 1
                    drift = 1
                elif mode != base_files[fn]:
                    drift = 1
            for fn in base_files:
                if fn not in cur["files"]:
                    drift = 1
        drift_rows.append(f'gale_cred_drift{{agent="{esc(agent)}"}} {drift}')
        if n_new:
            new_rows.append(f'gale_cred_new_files{{agent="{esc(agent)}"}} {n_new}')

        # .env mtime watch (mtime only; contents never read)
        keys = os.path.join(HOME_BASE, agent, "keys")
        for fn in sorted(cur["files"]):
            if not fn.endswith(".env"):
                continue
            try:
                mt = int(os.stat(os.path.join(keys, fn)).st_mtime)
            except OSError:
                continue
            key = f"{agent}/{fn}"
            if key in prev_mtimes and prev_mtimes[key] != mt:
                changed_rows.append(f'gale_cred_changed{{agent="{esc(agent)}",file="{esc(fn)}"}} 1')
            prev_mtimes[key] = mt

    L += drift_rows
    L += [
        "# HELP gale_cred_new_files keys/ files present but not in the seeded baseline",
        "# TYPE gale_cred_new_files gauge",
    ] + new_rows
    L += [
        "# HELP gale_cred_missing_files baseline keys/ files now missing (per agent, count)",
        "# TYPE gale_cred_missing_files gauge",
    ]
    for agent, cur in sorted(live.items()):
        base = baseline.get(agent) or {}
        missing = sum(1 for fn in (base.get("files") or {}) if fn not in cur["files"])
        if missing:
            L.append(f'gale_cred_missing_files{{agent="{esc(agent)}"}} {missing}')
    L += [
        "# HELP gale_cred_changed live .env mtime moved since the last bridge run (1/0)",
        "# TYPE gale_cred_changed gauge",
    ] + changed_rows
    L += [
        "# HELP gale_cred_dirs_scanned keys/ dirs the bridge sees",
        "# TYPE gale_cred_dirs_scanned gauge",
        f"gale_cred_dirs_scanned {len(live)}",
        "# HELP gale_cred_baseline_seeded 1 on the run that (re)seeded the baseline",
        "# TYPE gale_cred_baseline_seeded gauge",
        f"gale_cred_baseline_seeded {1 if seeded else 0}",
        "# HELP gale_cred_bridge_unixtime Unixtime of last cred_bridge run",
        "# TYPE gale_cred_bridge_unixtime gauge",
        f"gale_cred_bridge_unixtime {int(time.time())}",
    ]

    state["mtimes"] = prev_mtimes
    state["run_unixtime"] = int(time.time())
    save_json(STATE_PATH, state)

    tmp = f"{TEXTFILE}.tmp-{os.getpid()}"
    with open(tmp, "w") as f:
        f.write("\n".join(L) + "\n")
    os.replace(tmp, TEXTFILE)
    os.chmod(TEXTFILE, 0o644)
    n_drift = sum(1 for r in drift_rows if r.endswith(" 1"))
    print(f"cred_bridge: wrote {TEXTFILE} ({len(live)} dirs, {n_drift} drifted"
          f"{', baseline seeded' if seeded else ''})")


if __name__ == "__main__":
    main()
