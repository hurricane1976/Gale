#!/usr/bin/env python3
"""Fleet observability sweep: probe every rostered peer, save fleet/<ts>-sweep.json."""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

BASE = os.environ.get("SWEEP_BASE", "http://100.66.39.59:8799")
SELF = "LEVANTE"
SELF_BIND_HOST = "100.66.39.59"
HOST_NAMES = {
    "100.99.217.90": "beacon-host",
    "100.91.42.51": "tidal-host",
    "100.114.14.116": "mountain-host",
    "100.81.147.28": "highbeam-host",
    "100.76.139.96": "lantern-host",
    "100.69.40.118": "lightning-host",
    "100.100.158.42": "prism-host",
    "100.70.91.55": "pulsar-host",
    "100.125.26.66": "radar-host",
}

def probe(node, timeout=5.0):
    name = node["name"]
    addr = node["addr"]
    url = f"http://{addr}/health"
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            body = r.read(256)
        latency = round((time.monotonic() - t0) * 1000, 1)
        return {**node, "up": True, "latency_ms": latency, "last_seen": now_iso()}
    except Exception:
        return {**node, "up": False, "latency_ms": None, "last_seen": now_iso()}

def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def main():
    with urllib.request.urlopen(f"{BASE}/health", timeout=5) as r:
        hj = json.loads(r.read())
    self_name = hj.get("name", "LEVANTE")
    if self_name != SELF:
        sys.exit(f"unexpected /health name: {self_name}")
    with urllib.request.urlopen(f"{BASE}/roster", timeout=5) as r:
        rj = json.loads(r.read())
    roster = rj.get("nodes", rj)
    self_host = SELF_BIND_HOST
    self_host_name = HOST_NAMES.get(self_host, self_host)
    nodes = []
    for node in roster:
        host = str(node["addr"]).split(":")[0]
        remote = host != self_host
        entry = {
            "name": node["name"],
            "addr": node["addr"],
            "host": host,
            "host_name": HOST_NAMES.get(host, host),
            "remote": remote,
            "role": ("fleet observability & roster (this node)" if node["name"] == self_name
                     else ("co-located sibling" if not remote else "remote peer")),
            "up": False, "last_seen": None, "latency_ms": None,
        }
        nodes.append(entry)
    names = [n["name"] for n in nodes]
    dups = sorted({n for n in names if names.count(n) > 1})
    with ThreadPoolExecutor(max_workers=21) as ex:
        nodes = list(ex.map(probe, nodes))
    nodes.sort(key=lambda n: n["name"])
    lat = [n["latency_ms"] for n in nodes if n["up"] and n["latency_ms"] is not None]
    summary = {
        "total": len(nodes),
        "up": sum(1 for n in nodes if n["up"]),
        "down": sum(1 for n in nodes if not n["up"]),
        "local_up": sum(1 for n in nodes if n["up"] and not n["remote"]),
        "local_total": sum(1 for n in nodes if not n["remote"]),
        "remote_up": sum(1 for n in nodes if n["up"] and n["remote"]),
        "remote_total": sum(1 for n in nodes if n["remote"]),
    }
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = {
        "self": self_name,
        "generated_at": now_iso(),
        "nodes": nodes,
        "summary": summary,
        "sweep_meta": {
            "avg_latency_ms": round(sum(lat) / len(lat), 1) if lat else None,
            "max_latency_ms": max(lat) if lat else None,
            "dup_names": dups,
            "down_nodes": [n["name"] for n in nodes if not n["up"]],
        },
    }
    os.makedirs("fleet", exist_ok=True)
    path = f"fleet/{ts}-sweep.json"
    with open(path, "w") as f:
        json.dump(out, f, indent=1)
    print(json.dumps({"saved": path, "summary": summary,
                      "avg_ms": out["sweep_meta"]["avg_latency_ms"],
                      "max_ms": out["sweep_meta"]["max_latency_ms"],
                      "dups": dups, "down": out["sweep_meta"]["down_nodes"]}))

if __name__ == "__main__":
    main()
