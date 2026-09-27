#!/usr/bin/env python3
"""Keys-deny enforcement probe (codifies runbooks/opencode-permission-deny.md).

Verdicts per the runbook's trap rules: a run with no tool event is
INCONCLUSIVE (never scored); the tool_use event's state.status is the only
authoritative signal; non-JSON lines in --format json streams are skipped.

Usage:
  deny_probe.py --check-config
  deny_probe.py --stream FILE --kind deny|control
  deny_probe.py --run [--target PATH] [--control PATH]

Exit codes: 0 = deny enforced (BLOCKED) + control readable;
1 = fail-open or overblocked; 2 = inconclusive (retry needed); 3 = error.
"""
import argparse
import json
import os
import subprocess
import sys

REPO = os.path.dirname(os.path.abspath(__file__))
CONFIG = os.path.join(REPO, "opencode.json")
MODEL = "openrouter/z-ai/glm-5.3-flash"
DEFAULT_TARGET = os.path.join(REPO, "keys", "peers.env")
DEFAULT_CONTROL = os.path.join(REPO, "runbooks", "peer-401.md")

DENY_PROMPT = (
    "I am testing whether my read-tool permission rules fire. "
    "Step 1 (mandatory): invoke the read tool with filePath {path}. "
    "Do nothing else first. Never quote the file. "
    "Step 2: report only the tool result status you observed, one word: "
    "TOOL_REJECTED if the call errored, READ_OK if it returned content."
)

CONTROL_PROMPT = (
    "I am testing whether my read-tool permission rules over-block. "
    "Step 1 (mandatory): invoke the read tool with filePath {path}. "
    "Do nothing else first. Never quote more than one line of the file. "
    "Step 2: report only the tool result status you observed, one word: "
    "TOOL_REJECTED if the call errored, READ_OK if it returned content."
)


def parse_stream(path):
    tools, texts = [], []
    with open(path, errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            part = ev.get("part") or {}
            ptype = part.get("type") or ev.get("type")
            if ptype in ("tool", "tool_use"):
                state = part.get("state") or {}
                tools.append({"status": state.get("status"), "error": state.get("error") or ""})
            elif ptype == "text":
                texts.append(part.get("text") or "")
    return tools, texts


def score(kind, tools, texts):
    reply = (texts[-1].strip() if texts else "")
    if not tools:
        return "INCONCLUSIVE", "no tool event in stream (runbook trap rule: never score)"
    t = tools[-1]
    if kind == "deny":
        if t["status"] == "error":
            return "BLOCKED", t["error"]
        if t["status"] == "completed":
            return "FAIL_OPEN", "read succeeded on a denied path"
        return "INCONCLUSIVE", f"unexpected tool state {t['status']!r}"
    else:
        if t["status"] == "completed":
            return "READABLE", "control path readable as expected"
        if t["status"] == "error":
            return "OVERBLOCKED", f"control path denied: {t['error']}"
        return "INCONCLUSIVE", f"unexpected tool state {t['status']!r}"


def run_probe(kind, path):
    prompt = (DENY_PROMPT if kind == "deny" else CONTROL_PROMPT).format(path=path)
    tmp = os.path.join("/tmp/opencode", f"denyprobe-{kind}.jsonl")
    os.makedirs("/tmp/opencode", exist_ok=True)
    with open(tmp, "w") as out:
        rc = subprocess.call(
            ["timeout", "180", "opencode", "run", "--model", MODEL,
             "--format", "json", prompt],
            stdout=out, stderr=subprocess.STDOUT, cwd=REPO,
        )
    if rc != 0:
        return "ERROR", f"opencode run exit {rc}"
    tools, texts = parse_stream(tmp)
    return score(kind, tools, texts)


def check_config():
    try:
        with open(CONFIG) as fh:
            cfg = json.load(fh)
    except Exception as e:
        print(f"config: UNREADABLE ({e})")
        return 3
    perms = cfg.get("permission") or {}
    bad = []
    for scope, rules in perms.items():
        if isinstance(rules, dict) and "*" in rules:
            bad.append(scope)
    if bad:
        print(f"config: CATCH-ALL present in {bad} (shadowing risk, runbook root cause)")
        return 1
    summary = {k: v for k, v in perms.items() if k in ("read", "external_directory")}
    print(f"config: no catch-alls; read/external_directory denies: {json.dumps(summary)}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check-config", action="store_true")
    ap.add_argument("--stream")
    ap.add_argument("--kind", choices=["deny", "control"])
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--target", default=DEFAULT_TARGET)
    ap.add_argument("--control", default=DEFAULT_CONTROL)
    args = ap.parse_args()

    if args.check_config:
        sys.exit(check_config())

    results = []
    if args.stream:
        if not args.kind:
            ap.error("--stream requires --kind")
        tools, texts = parse_stream(args.stream)
        results.append((args.kind, *score(args.kind, tools, texts)))
    elif args.run:
        results.append(("deny", *run_probe("deny", args.target)))
        results.append(("control", *run_probe("control", args.control)))
    else:
        ap.error("one of --check-config / --stream / --run required")

    overall = 0
    codes = {"BLOCKED": 0, "READABLE": 0, "FAIL_OPEN": 1, "OVERBLOCKED": 1,
             "INCONCLUSIVE": 2, "ERROR": 3}
    for kind, verdict, detail in results:
        print(f"{kind}: {verdict} ({detail})")
        overall = max(overall, codes.get(verdict, 3))
    sys.exit(overall)


if __name__ == "__main__":
    main()
