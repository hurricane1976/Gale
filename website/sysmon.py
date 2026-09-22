#!/usr/bin/env python3
"""sysmon.py -- system/network status collector for Gale's ops dashboard.

Writes one JSON snapshot to OUT_PATH every INTERVAL seconds. The dashboard
(website/status.html) polls that JSON over HTTP; this script never serves
anything itself and never listens on a socket -- it only reads local system
state and, for each configured TARGET, makes an outbound GET to that
target's own /health endpoint (same unauthenticated liveness check
peer_server.py already exposes; no token, no peer-message channel involved).

TO MONITOR A NEW SYSTEM: add one entry to TARGETS below. That's the whole
integration -- the dashboard renders whatever's in the JSON, so no HTML/JS
change is needed. A target only needs an HTTP GET /health that returns 200
within TARGET_TIMEOUT; the four local agents and any peer's peer_server.py
already do. For a host that doesn't run peer_server.py, point at any HTTP
endpoint that returns 2xx when healthy.

Run mode: `./sysmon.py` loops forever (systemd service). `./sysmon.py --once`
writes a single snapshot and exits (used for manual checks / testing).

Also includes a read-only Firewalla box/device/rule snapshot (see
firewalla.py, collect_firewalla() below) polled on its own slower interval
since it's a cloud API call, not a local one. Admin actions on that data
(pause/resume/block) are a separate always-on service, firewalla_control.py
-- this collector never writes.
"""
import json
import os
import re
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

import psutil

from firewalla import FirewallaClient, FirewallaError

# ---------------------------------------------------------------------------
# Config -- edit here to extend what's monitored. Nothing below this block
# should need to change to add a system, a service, or a disk mount.
# ---------------------------------------------------------------------------

OUT_PATH = "/var/www/gale-api/status.json"
INTERVAL_S = 15

# Peer-fleet health targets. "local" = co-located on this host (same OS/
# network stats as Gale itself, just a different agent+port); "remote" =
# a genuinely separate host, reachable only over Tailscale, health-only.
TARGETS = [
    {"name": "Gale", "kind": "local", "addr": "100.66.39.59:8787"},
    {"name": "Zephyr", "kind": "local", "addr": "100.66.39.59:8788"},
    {"name": "Squall", "kind": "local", "addr": "100.66.39.59:8789"},
    {"name": "Tempest", "kind": "local", "addr": "100.66.39.59:8790"},
    {"name": "Beacon", "kind": "remote", "addr": "100.99.217.90:8787"},
    {"name": "Tidal", "kind": "remote", "addr": "100.91.42.51:8787"},
    {"name": "Mountain", "kind": "remote", "addr": "100.114.14.116:8787"},
]
TARGET_TIMEOUT_S = 2.5

# Full-stats targets: unlike TARGETS above (liveness-only /health ping),
# each of these runs its own collector (see remote/<platform>/collector.py)
# exposing GET /stats with a host/cpu/mem/disk/network/services/security
# snapshot, which the dashboard renders as its own panel -- same idea as
# Gale's own vitals, just sourced from a different machine's collector
# instead of psutil calls made here. LAN-only today (private 192.168.x.x),
# not tailnet -- reachable because gale-agent itself has a LAN NIC (eno1).
FULL_TARGETS = [
    {"name": "josh-desktop11", "addr": "192.168.1.197:8792", "platform": "windows"},
]
FULL_TARGET_TIMEOUT_S = 3.0

# Ollama instance (LAN -- the operator's box, same NIC as FULL_TARGETS above).
# LAN not tailnet, so latency is negligible; polled on the 15s cycle. Its REST
# API exposes no server-wide token counter, so "usage" here = loaded/active
# models + committed VRAM + the model inventory (see collect_ollama()).
OLLAMA_ADDR = os.environ.get("OLLAMA_ADDR", "192.168.1.197:11434")
OLLAMA_TIMEOUT_S = 3.0

# systemd units this dashboard cares about (fleet + the services the site
# and mesh depend on). Any unit name systemctl knows about works here.
SERVICES = [
    "gale-peer", "zephyr-peer", "squall-peer", "tempest-peer",
    "nginx", "tailscaled", "cron",
]

# Disk mounts to report (skip pseudo/duplicate filesystems automatically;
# this list is just which *real* mounts matter enough to show a tile for).
DISK_MOUNTS = ["/"]

SELF_HOSTNAME = socket.gethostname()

# ---------------------------------------------------------------------------


def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run(cmd, timeout=3):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception:
        return ""


def collect_host():
    la1, la5, la15 = os.getloadavg()
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    boot = psutil.boot_time()
    os_release = {}
    try:
        with open("/etc/os-release") as f:
            for line in f:
                if "=" in line:
                    k, v = line.rstrip("\n").split("=", 1)
                    os_release[k] = v.strip('"')
    except OSError:
        pass
    reboot_required = os.path.exists("/var/run/reboot-required")
    return {
        "hostname": SELF_HOSTNAME,
        "os": os_release.get("PRETTY_NAME", "unknown"),
        "kernel": run(["uname", "-r"]),
        "arch": run(["uname", "-m"]),
        "boot_time": datetime.fromtimestamp(boot, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "uptime_s": int(time.time() - boot),
        "load": [round(la1, 2), round(la5, 2), round(la15, 2)],
        "cpu_count": psutil.cpu_count(logical=True),
        "cpu_pct": round(psutil.cpu_percent(interval=0.4), 1),
        "cpu_per_core": [round(p, 1) for p in psutil.cpu_percent(interval=0.2, percpu=True)],
        "mem": {
            "total_mb": round(vm.total / 1048576),
            "used_mb": round((vm.total - vm.available) / 1048576),
            "avail_mb": round(vm.available / 1048576),
            "pct": round(100 - (vm.available / vm.total * 100), 1),
        },
        "swap": {
            "total_mb": round(sw.total / 1048576),
            "used_mb": round(sw.used / 1048576),
            "pct": round(sw.percent, 1),
        },
        "disks": collect_disks(),
        "reboot_required": reboot_required,
    }


def collect_disks():
    out = []
    for mount in DISK_MOUNTS:
        try:
            du = psutil.disk_usage(mount)
        except OSError:
            continue
        fs = "?"
        for part in psutil.disk_partitions():
            if part.mountpoint == mount:
                fs = part.fstype
                break
        out.append({
            "mount": mount,
            "fs": fs,
            "total_gb": round(du.total / 1073741824, 1),
            "used_gb": round(du.used / 1073741824, 1),
            "pct": round(du.percent, 1),
        })
    return out


_prev_net = {"t": None, "counters": {}}


def collect_network():
    addrs = psutil.net_if_addrs()
    counters = psutil.net_io_counters(pernic=True)
    now = time.time()
    prev_t, prev_c = _prev_net["t"], _prev_net["counters"]
    dt = (now - prev_t) if prev_t else None

    interfaces = []
    for name, c in counters.items():
        if name == "lo" or name.startswith(("veth", "docker", "cali", "vxlan")):
            continue
        ip = next((a.address for a in addrs.get(name, []) if a.family == socket.AF_INET), None)
        if not ip:
            continue
        rx_mbps = tx_mbps = 0.0
        if dt and name in prev_c:
            rx_mbps = round((c.bytes_recv - prev_c[name].bytes_recv) * 8 / dt / 1_000_000, 3)
            tx_mbps = round((c.bytes_sent - prev_c[name].bytes_sent) * 8 / dt / 1_000_000, 3)
        interfaces.append({
            "name": name,
            "ip": ip,
            "rx_mbps": max(rx_mbps, 0.0),
            "tx_mbps": max(tx_mbps, 0.0),
            "rx_total_gb": round(c.bytes_recv / 1073741824, 2),
            "tx_total_gb": round(c.bytes_sent / 1073741824, 2),
        })

    _prev_net["t"] = now
    _prev_net["counters"] = counters

    return {
        "interfaces": interfaces,
        "listening_ports": collect_ports(),
        "tailscale": collect_tailscale(),
    }


_PORT_LABELS = {
    8787: "gale-peer", 8788: "zephyr-peer", 8789: "squall-peer", 8790: "tempest-peer",
    8090: "nginx (gale site)", 22: "ssh", 53: "dns",
}


def collect_ports():
    # sudo -n (no password prompt, fails fast if the passwordless rule is
    # ever removed) gets process names for sockets owned by other users too;
    # falls back to an unprivileged view (proc "?") if that ever changes.
    text = run(["sudo", "-n", "ss", "-tlnp"]) or run(["ss", "-tlnp"])
    by_port = {}
    for line in text.splitlines()[1:]:
        parts = line.split()
        if len(parts) < 4:
            continue
        local = parts[3]
        m = re.match(r"^(.*):(\d+)$", local)
        if not m:
            continue
        addr, port = m.group(1).strip("[]"), int(m.group(2))
        proc = "?"
        pm = re.search(r'users:\(\("([^"]+)"', line)
        if pm:
            proc = pm.group(1)
        # collapse the IPv4 / IPv6 / wildcard duplicate rows ss prints for
        # the same listening service into one row per port.
        key = port
        entry = by_port.setdefault(key, {"port": port, "addrs": set(), "proc": proc, "label": _PORT_LABELS.get(port, "")})
        entry["addrs"].add(addr)
        if entry["proc"] == "?" and proc != "?":
            entry["proc"] = proc
    out = [{**e, "addrs": sorted(e["addrs"])} for e in by_port.values()]
    out.sort(key=lambda p: p["port"])
    return out


def collect_tailscale():
    raw = run(["tailscale", "status", "--json"], timeout=4)
    if not raw:
        return {"ok": False}
    try:
        d = json.loads(raw)
    except json.JSONDecodeError:
        return {"ok": False}
    peers = d.get("Peer", {}) or {}
    online = sum(1 for p in peers.values() if p.get("Online"))
    return {
        "ok": True,
        "backend_state": d.get("BackendState"),
        "self_ip": (d.get("Self", {}).get("TailscaleIPs") or [None])[0],
        "peers_total": len(peers),
        "peers_online": online,
    }


def collect_services():
    out = []
    for unit in SERVICES:
        active = run(["systemctl", "is-active", unit]) or "unknown"
        since = run(["systemctl", "show", unit, "--property=ActiveEnterTimestamp", "--value"])
        out.append({"unit": unit, "state": active, "since": since})
    return out


def collect_security():
    ufw = run(["sudo", "-n", "ufw", "status"], timeout=3)
    ufw_active = ufw.startswith("Status: active") if ufw else None
    unattended = run(["systemctl", "is-enabled", "unattended-upgrades"], timeout=2)
    return {
        "ufw_active": ufw_active,
        "sudoers_dropin": os.path.exists("/etc/sudoers.d/99-agent"),
        "unattended_upgrades": unattended or "unknown",
        "reboot_required": os.path.exists("/var/run/reboot-required"),
    }


def probe_target(t):
    # "up" = reachable, 2xx. "auth" = reachable, endpoint just wants a
    # credential we don't send for a plain liveness check (still counts as
    # the host being up -- distinct from truly unreachable). "down" = no
    # response at all (refused/timeout/DNS).
    url = f"http://{t['addr']}/health"
    t0 = time.time()
    try:
        with urllib.request.urlopen(url, timeout=TARGET_TIMEOUT_S) as r:
            body = r.read(2048)
            latency_ms = round((time.time() - t0) * 1000, 1)
            name = None
            try:
                name = json.loads(body).get("name")
            except Exception:
                pass
            return {**t, "health": "up", "latency_ms": latency_ms, "reported_name": name}
    except urllib.error.HTTPError as e:
        latency_ms = round((time.time() - t0) * 1000, 1)
        state = "auth" if e.code in (401, 403) else "error"
        return {**t, "health": state, "latency_ms": latency_ms, "http_status": e.code}
    except Exception as e:
        return {**t, "health": "down", "latency_ms": None, "error": type(e).__name__}


def collect_targets():
    return [probe_target(t) for t in TARGETS]


def probe_full_target(t):
    url = f"http://{t['addr']}/stats"
    t0 = time.time()
    try:
        with urllib.request.urlopen(url, timeout=FULL_TARGET_TIMEOUT_S) as r:
            stats = json.loads(r.read())
            latency_ms = round((time.time() - t0) * 1000, 1)
            return {"name": t["name"], "addr": t["addr"], "platform": t.get("platform", ""),
                    "health": "up", "latency_ms": latency_ms, "stats": stats}
    except Exception as e:
        return {"name": t["name"], "addr": t["addr"], "platform": t.get("platform", ""),
                "health": "down", "latency_ms": None, "error": type(e).__name__, "stats": None}


def collect_full_targets():
    return [probe_full_target(t) for t in FULL_TARGETS]


# Firewalla is a cloud API (MSP), not a local call -- poll it far less often
# than the 15s host loop so this collector doesn't hammer the account. The
# cloud API throttles on request rate (HTTP 429), so poll at ~11 min.
# Admin actions (pause/resume/block) go through firewalla_control.py, not
# this collector; this only ever reads.
_fw_client = FirewallaClient()
_fw_cache = {"t": 0, "data": None, "retry_after": 0}
# Firewalla per-token limits (support, as of Jan 2026): 3000 req/day and
# 100 req/5 min. One cycle = 9 requests (boxes, devices, rules, 2 live flows,
# 4 VPN flows). 11 min -> ~1180/day (~40%); the old 60 s poll was ~13000/day,
# which is what exhausted the daily quota. Recheck this math before lowering.
FIREWALLA_POLL_S = 660  # 11 minutes
# On a failed cycle, retry when the API's Retry-After (or an active pause)
# says to; other failures wait the normal interval. A short blind retry is
# what previously kept us re-hitting a throttled API and tripping 429.
FIREWALLA_FAIL_RETRY_S = 660


VPN_PORTS = ("51820", "1194")  # wireguard default, openvpn default


def _collect_live(gid):
    """Live-ish throughput + top talkers, DERIVED from MSP flow records (the
    cloud API has no live counter). Summed over a 15-min window of recent
    flows; the export lags a few minutes behind realtime and the record cap
    truncates busy periods, so the dashboard labels this approximate ('≥')."""
    import time as _time
    import urllib.parse as _up
    now = _time.time()
    window = 900
    out = {"window_s": window, "mbps_down": 0.0, "mbps_up": 0.0, "flows": 0,
           "truncated": False, "top_talkers": [], "ts": now, "approx": True}
    try:
        q = _up.quote(f"ts:>{now - window:.0f}")
        d = _fw_client._request("GET", f"/v2/flows?query={q}&box={gid}&limit=500")
        res = d.get("results", []) if isinstance(d, dict) else []
        down = sum(int(f.get("download") or 0) for f in res)
        up = sum(int(f.get("upload") or 0) for f in res)
        out["flows"] = int(d.get("count") or len(res))
        out["truncated"] = bool(d.get("count") and d["count"] > len(res))
        out["mbps_down"] = round(down * 8 / window / 1e6, 2)
        out["mbps_up"] = round(up * 8 / window / 1e6, 2)
    except FirewallaError as e:
        out["error"] = str(e)[:160]
        return out
    try:
        q2 = _up.quote(f"ts:>{now - 7200:.0f}")
        d2 = _fw_client._request(
            "GET", f"/v2/flows?query={q2}&box={gid}&groupBy=device.name&sortBy=total:desc&limit=5")
        res2 = d2.get("results", []) if isinstance(d2, dict) else []
        out["top_talkers"] = [
            {"name": (r.get("device") or {}).get("name") or "?", "bytes": int(r.get("total") or 0)}
            for r in res2
        ]
    except FirewallaError:
        pass
    return out


def _collect_vpn(gid, devices):
    """VPN status, derived from the MSP API only (verified 2026-09-22: the
    cloud API has no dedicated VPN endpoint, and the box object carries no
    VPN fields). Two real sources:
      * The box's own VPN profiles ARE devices with ovpn:/wg_peer: id
        prefixes; their `online` flag is the live session state.
      * Tunnel traffic of VPN clients running on LAN machines shows as
        flows with sport/dport on the common VPN ports (51820/1194).
    Richer per-handshake state would need the box's local API on :8833,
    which is not accepting requests from here (needs a token minted on
    the box itself) -- surfaced as a note in the dashboard."""
    profiles = []
    for d in devices:
        did = str(d.get("id", ""))
        if did.startswith("wg_peer:"):
            kind = "wireguard-peer"
        elif did.startswith("ovpn:"):
            kind = "openvpn-profile"
        else:
            continue
        profiles.append({
            "kind": kind,
            "name": d.get("name") or "(unnamed profile)",
            "online": bool(d.get("online")),
            "ip": d.get("ip"),
            "download_24h": int(d.get("totalDownload") or 0),
            "upload_24h": int(d.get("totalUpload") or 0),
        })
    tunnels = {}
    for port in VPN_PORTS:
        for direction, q in (("outbound", f"sport:{port}"), ("inbound", f"dport:{port}")):
            try:
                flows = _fw_client.flows(gid, q, limit=12)
            except FirewallaError:
                continue
            for f in flows:
                dev = f.get("device") or {}
                key = (dev.get("name") or dev.get("ip") or "?", direction)
                t = tunnels.setdefault(key, {
                    "device": dev.get("name") or dev.get("ip") or "?",
                    "direction": direction,
                    "protocol": f.get("protocol"),
                    "last_ts": 0, "flows": 0, "bytes": 0,
                })
                t["flows"] += 1
                t["bytes"] += int(f.get("download") or 0) + int(f.get("upload") or 0)
                t["last_ts"] = max(t["last_ts"], f.get("ts") or 0)
    tunnel_list = sorted(tunnels.values(), key=lambda t: -t["last_ts"])[:8]
    return {
        "profiles": profiles,
        "profiles_online": sum(1 for p in profiles if p["online"]),
        "tunnels": tunnel_list,
        "note": "Box-server session state = profile 'online' flag. The MSP cloud API has no VPN "
                "endpoint (verified 2026-09-22); the box's local API on :8833 would give per-handshake "
                "state but needs a token minted on the box itself.",
    }


def collect_firewalla():
    now = time.time()
    ok = _fw_cache["data"] is not None and _fw_cache["data"].get("ok")
    fail_window = _fw_cache["retry_after"] or FIREWALLA_FAIL_RETRY_S
    window = FIREWALLA_POLL_S if ok else fail_window
    if _fw_cache["data"] is not None and now - _fw_cache["t"] < window:
        return _fw_cache["data"]
    if not _fw_client.configured:
        data = {"ok": False, "error": "not configured"}
    else:
        try:
            boxes = _fw_client.boxes()
            box = boxes[0] if boxes else None
            gid = box["gid"] if box else None
            devices = _fw_client.devices(gid) if gid else []
            rules = _fw_client.rules(gid) if gid else []
            data = {
                "ok": True,
                "box": box,
                "devices": devices,
                "rules": rules,
                "devices_online": sum(1 for d in devices if d.get("online")),
                "vpn": _collect_vpn(gid, devices),
                "live": _collect_live(gid),
            }
            _fw_cache["retry_after"] = 0  # a good cycle clears any 429 backoff
        except FirewallaError as e:
            data = {"ok": False, "error": str(e)}
            _fw_cache["retry_after"] = getattr(e, "retry_after", None) or 0
    _fw_cache["t"] = now
    _fw_cache["data"] = data
    return data


def _ollama_get(path, timeout=OLLAMA_TIMEOUT_S):
    url = f"http://{OLLAMA_ADDR}{path}"
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read())


def _fmt_bytes(n):
    b = int(n or 0)
    for unit, div in (("GB", 1e9), ("MB", 1e6), ("KB", 1e3)):
        if b >= div:
            return f"{b / div:.1f} {unit}"
    return f"{b} B"


def collect_ollama():
    from datetime import datetime, timezone
    data = {"ok": False, "addr": OLLAMA_ADDR, "reachable": False,
            "version": None, "loaded": [], "inventory": [],
            "models_total": 0, "vram_loaded_gb": 0.0, "error": None}
    try:
        ver = _ollama_get("/api/version")
        data["reachable"] = True
        data["version"] = ver.get("version")
        ps = _ollama_get("/api/ps")
        loaded = ps.get("models") or []
        vram = 0.0
        for m in loaded:
            sz = m.get("size") or 0
            vram += sz
            det = m.get("details") or {}
            exp = m.get("expires_at")
            exp_iso = None
            if exp:
                try:
                    d = datetime.fromisoformat(str(exp).replace("Z", "+00:00"))
                    secs = (d - datetime.now(timezone.utc)).total_seconds()
                    exp_iso = max(0, int(secs // 60))
                except ValueError:
                    pass
            data["loaded"].append({
                "name": m.get("name"),
                "params": det.get("parameter_size"),
                "quant": det.get("quantization_level"),
                "family": (det.get("families") or [det.get("family") or ""])[0] or det.get("family"),
                "context": m.get("context_length"),
                "size": sz,
                "size_human": _fmt_bytes(sz),
                "size_vram": m.get("size_vram") or 0,
                "vram_human": _fmt_bytes(m.get("size_vram")),
                "expires_minutes": exp_iso,
            })
        data["vram_loaded_gb"] = round(vram / 1e9, 1)

        tags = _ollama_get("/api/tags")
        models = tags.get("models") or []
        data["models_total"] = len(models)
        for m in models:
            det = m.get("details") or {}
            data["inventory"].append({
                "name": m.get("name"),
                "params": det.get("parameter_size"),
                "quant": det.get("quantization_level"),
                "size": m.get("size") or 0,
                "size_human": _fmt_bytes(m.get("size")),
                "context": m.get("context_length"),
                "caps": m.get("capabilities") or [],
            })

        data["ok"] = True
    except Exception as e:
        data["error"] = f"{type(e).__name__}: {e}"
    return data


def snapshot():
    return {
        "generated_at": iso_now(),
        "collector_interval_s": INTERVAL_S,
        "host": collect_host(),
        "network": collect_network(),
        "services": collect_services(),
        "security": collect_security(),
        "targets": collect_targets(),
        "firewalla": collect_firewalla(),
        "ollama": collect_ollama(),
        "full_targets": collect_full_targets(),
    }


def write_atomic(path, data):
    d = os.path.dirname(path)
    os.makedirs(d, exist_ok=True)
    tmp = f"{path}.tmp-{os.getpid()}"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=1)
    os.replace(tmp, path)


def main():
    once = "--once" in sys.argv
    # prime the network-rate calculation so the first real sample has a delta
    collect_network()
    while True:
        try:
            write_atomic(OUT_PATH, snapshot())
        except Exception as e:
            sys.stderr.write(f"sysmon: snapshot failed: {e!r}\n")
        if once:
            break
        time.sleep(INTERVAL_S)


if __name__ == "__main__":
    main()
