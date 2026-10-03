#!/usr/bin/env python3
"""roster_check.py -- roster drift + silent-agent detector (cron every 5 min).

Compares every place the fleet roster is stated and writes both a human report
(api/roster-drift.json, served at /api/roster-drift.json is NOT required --
printed with --report) and Prometheus textfile metrics.

Sources:
  page      website/fleet.html <agent-card name/model> (+ host from its group)
  roster    fleet-provision/roster.json
  config    ~/<agent>/opencode.json "model"  (Gale-host agents; authoritative)
  wake      ~/<agent>/wake.sh `--model X`
  agentmd   ~/<agent>/AGENT.md "Model:" line
  telemetry fleet_api /metrics agents_by_host (who actually reports runs)

Checks -> drift kinds:
  page_vs_roster_model, missing_in_page, missing_in_roster,
  config_vs_page_model, wake_vs_config, agentmd_vs_config, silent (no runs 14d)

Metrics (WAKE-style textfile, node-exporter):
  gale_roster_expected_agents / gale_roster_reporting_agents
  gale_roster_silent{agent,host}   1 for each expected agent with no telemetry
  gale_roster_drift{kind,agent}    1 per finding
  gale_roster_drift_total / gale_roster_check_unixtime
"""
import json, os, re, sys, time, urllib.request

ROOT = "/home/agent"
SITE = os.path.join(ROOT, "agent/website")
TEXTFILE = os.environ.get("ROSTER_TEXTFILE", "/var/snap/node-exporter/common/gale_roster.prom")
METRICS = os.environ.get("FLEET_API_METRICS", "http://127.0.0.1:8793/metrics")
FAMILY = [("sonnet", "Claude"), ("opus", "Claude"), ("haiku", "Claude"), ("claude", "Claude"), ("anthropic", "Claude"), ("glm", "GLM"), ("z-ai", "GLM"),
          ("qwen", "Qwen"), ("muse", "Muse"), ("gpt", "GPT"), ("openai", "GPT"),
          ("deepseek", "DeepSeek"), ("gemini", "Gemini")]


def family(s):
    s = (s or "").lower()
    for k, v in FAMILY:
        if k in s:
            return v
    return None


def read(p):
    try:
        return open(p, encoding="utf-8").read()
    except OSError:
        return ""


def page_agents():
    """{name_lower: (Name, model, host)} from fleet.html member groups."""
    html = read(os.path.join(SITE, "fleet.html"))
    out = {}
    for grp in re.split(r'<div class="member-group', html)[1:]:
        m = re.search(r'member-group-h">\s*([A-Za-z]+) host', grp)
        host = m.group(1).lower() if m else "?"
        for a in re.finditer(r'<agent-card name="([^"]+)" model="([^"]+)"', grp):
            out[a.group(1).lower()] = (a.group(1), a.group(2), host)
    return out


def main():
    findings = []  # (kind, agent, detail)
    page = page_agents()
    try:
        roster = {a["name"].lower(): a for a in json.load(open(os.path.join(ROOT, "agent/fleet-provision/roster.json")))["agents"]}
    except Exception as e:
        roster = {}
        findings.append(("roster_unreadable", "-", repr(e)))

    for k, (name, model, host) in page.items():
        r = roster.get(k)
        if not r:
            findings.append(("missing_in_roster", name, "on page, not in roster.json"))
        elif r.get("model") != model:
            findings.append(("page_vs_roster_model", name, f"page={model} roster={r.get('model')}"))
    for k, r in roster.items():
        if k not in page:
            findings.append(("missing_in_page", r["name"], "in roster.json, not on page"))

    for k, (name, model, host) in page.items():
        d = os.path.join(ROOT, "agent" if k == "gale" else k)
        if host != "gale" or not os.path.isdir(d):
            continue
        wake_txt = read(os.path.join(d, "wake.sh"))
        wk = re.search(r"--model\s+(\S+)", wake_txt)
        cfg = re.search(r'"model"\s*:\s*"([^"]+)"', read(os.path.join(d, "opencode.json")))
        # authority = what wake.sh actually launches; opencode.json only matters
        # for agents that run via `opencode run` (Gale runs Claude Code directly)
        uses_oc = "opencode run" in wake_txt
        auth = wk.group(1) if wk else (cfg.group(1) if cfg and uses_oc else None)
        if auth and family(auth) != model:
            findings.append(("config_vs_page_model", name, f"runtime={auth} page={model}"))
        if uses_oc and wk and cfg and family(cfg.group(1)) != family(wk.group(1)):
            findings.append(("wake_vs_config", name, f"wake.sh={wk.group(1)} opencode.json={cfg.group(1)}"))
        am = re.search(r"^Model:\s*`([^`]+)`", read(os.path.join(d, "AGENT.md")), re.M)
        if am and auth and family(am.group(1)) != family(auth):
            findings.append(("agentmd_vs_config", name, f"AGENT.md={am.group(1)} runtime={auth}"))

    reporting = set()
    try:
        m = json.load(urllib.request.urlopen(METRICS, timeout=10))
        for v in (m.get("agents_by_host") or {}).values():
            reporting.update(x.lower() for x in v)
        have_tel = True
    except Exception as e:
        have_tel = False
        sys.stderr.write(f"roster_check: telemetry unavailable: {e!r}\n")
    silent = []
    if have_tel:
        for k, (name, _m, host) in page.items():
            if k not in reporting:
                silent.append((name, host))
                findings.append(("silent", name, f"{host}: no runs in telemetry (14d)"))

    lines = ["# TYPE gale_roster_expected_agents gauge", f"gale_roster_expected_agents {len(page)}"]
    if have_tel:
        lines += ["# TYPE gale_roster_reporting_agents gauge",
                  f"gale_roster_reporting_agents {len([k for k in page if k in reporting])}"]
    lines.append("# TYPE gale_roster_silent gauge")
    lines += [f'gale_roster_silent{{agent="{n}",fleet_host="{h}"}} 1' for n, h in silent]
    lines.append("# TYPE gale_roster_drift gauge")
    drift = [f for f in findings if f[0] != "silent"]
    lines += [f'gale_roster_drift{{kind="{k}",agent="{a}"}} 1' for k, a, _ in drift]
    lines += ["# TYPE gale_roster_drift_total gauge", f"gale_roster_drift_total {len(drift)}",
              "# TYPE gale_roster_check_unixtime gauge", f"gale_roster_check_unixtime {int(time.time())}"]
    if "--report" in sys.argv:
        for k, a, d in findings:
            print(f"{k:22} {a:12} {d}")
        print(f"-- {len(page)} on page, {len(findings)} finding(s)")
    else:
        tmp = TEXTFILE + ".tmp"
        with open(tmp, "w") as f:
            f.write("\n".join(lines) + "\n")
        os.replace(tmp, TEXTFILE)
    sys.exit(1 if ("--strict" in sys.argv and drift) else 0)


main()
