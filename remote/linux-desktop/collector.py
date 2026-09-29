#!/usr/bin/env python3
"""collector.py -- runs ON the Linux PC being monitored (josh-linux, the
ex-josh-desktop11 hardware now on Zorin OS), NOT on gale-agent. This
directory (remote/linux-desktop/) is not part of website/deploy.sh's copy
-- it's source for a different machine, tracked here so it lives in
version control somewhere.

Linux port of remote/windows-desktop/collector.py, same endpoints and
same field shapes so the dashboard renders it with zero changes:
  GET /health -- {"name": "josh-linux"}
  GET /stats  -- host/CPU/memory/disk/network/services/security snapshot
  GET /gpu    -- per-GPU dicts from nvidia-smi; {"error": ...} if absent

Differences from the Windows version: real load average (sysmon's own
Linux host block reports [la1, la5, la15], not None), services read via
systemctl, firewall via ufw, reboot flag via /var/run/reboot-required.

SETUP on josh-linux:
  1. sudo apt-get install -y python3-psutil
  2. sudo install -m 755 collector.py /opt/gale-collector/collector.py
  3. systemd unit gale-collector.service (root: full listening-port
     attribution + ufw status), then:
       sudo systemctl daemon-reload && sudo systemctl enable --now gale-collector
  4. Verify: curl http://192.168.1.197:8792/stats from another machine.
  5. If ufw is active: sudo ufw allow from 192.168.1.0/24 to any port 8792

Then on gale-agent's side, FULL_TARGETS in website/sysmon.py carries
{"name": "josh-linux", "addr": "192.168.1.197:8792", "platform":
"linux-desktop"} (already shipped if you're reading this after that
change).

BIND_HOST defaults to 0.0.0.0 (Gale polls from another LAN IP) -- private
192.168.x.x network, not internet-exposed, same as every other
unauthenticated read-only endpoint in this fleet. Override via
COLLECTOR_BIND / COLLECTOR_PORT / COLLECTOR_NAME env vars.
"""
import json
import os
import platform
import socket
import subprocess
import sys
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import psutil

BIND_HOST = os.environ.get("COLLECTOR_BIND", "0.0.0.0")
BIND_PORT = int(os.environ.get("COLLECTOR_PORT", "8792"))
SELF_NAME = os.environ.get("COLLECTOR_NAME", socket.gethostname())

# systemd units worth a status row on the dashboard. Edit freely -- any
# unit name `systemctl show <name>` recognizes works here.
SERVICES = ["ollama", "ssh"]

# Pseudo-filesystems that would just be noise on the disk tiles
SKIP_FSTYPES = {"squashfs", "tmpfs", "devtmpfs", "overlay", "iso9660", "efivarfs"}
# Virtual interfaces that aren't real NICs
SKIP_IFACE_PREFIXES = ("lo", "veth", "docker", "br-", "virbr")


def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def run(cmd, timeout=4):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception:
        return ""


def collect_host():
    vm = psutil.virtual_memory()
    sw = psutil.swap_memory()
    boot = psutil.boot_time()
    un = platform.uname()
    pretty_os = ""
    try:
        with open("/etc/os-release") as f:
            for line in f:
                if line.startswith("PRETTY_NAME="):
                    pretty_os = line.split("=", 1)[1].strip().strip('"')
                    break
    except OSError:
        pass
    if not pretty_os:
        pretty_os = f"{un.system} {un.release}"
    la1, la5, la15 = os.getloadavg()
    return {
        "hostname": SELF_NAME,
        "os": pretty_os,
        "kernel": un.release,
        "arch": un.machine,
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
        "reboot_required": _reboot_pending(),
    }


def collect_disks():
    out = []
    for part in psutil.disk_partitions(all=False):
        if part.fstype == "" or part.fstype in SKIP_FSTYPES:
            continue
        if part.mountpoint.startswith("/snap/"):
            continue
        try:
            du = psutil.disk_usage(part.mountpoint)
        except OSError:
            continue
        out.append({
            "mount": part.mountpoint,
            "fs": part.fstype,
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
        if name.lower().startswith(SKIP_IFACE_PREFIXES):
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

    return {"interfaces": interfaces, "listening_ports": collect_ports()}


def collect_ports():
    out = []
    try:
        for c in psutil.net_connections(kind="inet"):
            if c.status != psutil.CONN_LISTEN or not c.laddr:
                continue
            proc = "?"
            if c.pid:
                try:
                    proc = psutil.Process(c.pid).name()
                except Exception:
                    pass
            out.append({"port": c.laddr.port, "proc": proc, "label": "", "addrs": [c.laddr.ip]})
    except (psutil.AccessDenied, PermissionError):
        pass  # needs root for other users' sockets; run the unit as root
    out.sort(key=lambda p: p["port"])
    return out


def collect_services():
    out = []
    for name in SERVICES:
        state = run(["systemctl", "show", name, "-p", "ActiveState", "--value"])
        if not state:
            out.append({"unit": name, "state": "not found", "since": ""})
            continue
        # systemctl prints "Tue 2026-09-29 16:07:42 EDT" -- let date(1) turn
        # it into an epoch, then normalize to UTC ISO
        since = ""
        ts_raw = run(["systemctl", "show", name, "-p", "ActiveEnterTimestamp", "--value"])
        if ts_raw:
            epoch = run(["date", "-d", ts_raw, "+%s"])
            if epoch.isdigit():
                since = datetime.fromtimestamp(int(epoch), tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        out.append({"unit": name, "state": state, "since": since})
    return out


def _reboot_pending():
    return os.path.exists("/var/run/reboot-required")


def collect_gpu():
    """Per-GPU dicts from nvidia-smi, or {"error": ...} so callers degrade
    gracefully instead of 500-ing. Same output shape as the Windows
    collector (ollama_api.py's /gpu proxy depends on it)."""
    query = "--query-gpu=name,index,memory.used,memory.total,utilization.gpu,temperature.gpu,power.draw,power.limit"
    out = run(["nvidia-smi", query, "--format=csv,noheader,nounits"], timeout=5)
    if not out or "Unable" in out or "ERROR" in out.upper():
        return {"error": "nvidia-smi unavailable or failed"}
    gpus = []
    for line in out.splitlines():
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 8:
            continue
        try:
            gpus.append({
                "name": parts[0],
                "index": int(parts[1]),
                "mem_used_mb": int(parts[2]),
                "mem_total_mb": int(parts[3]),
                "util_pct": int(parts[4]),
                "temp_c": int(parts[5]),
                "power_w": _float_or_zero(parts[6]),
                "power_limit_w": _float_or_zero(parts[7]),
            })
        except ValueError:
            continue
    if not gpus:
        return {"error": "no GPU data parsed"}
    return gpus


def _float_or_zero(s):
    try:
        return float(s)
    except ValueError:
        return 0.0  # nvidia-smi reports [N/A] for power fields on some driver states


def collect_security():
    fw = run(["ufw", "status"])
    fw_active = None
    if fw:
        if "Status: active" in fw:
            fw_active = True
        elif "Status: inactive" in fw:
            fw_active = False
    return {
        "firewall_active": fw_active,
        "defender_active": None,  # N/A on Linux; dashboard renders the blank tile
        "reboot_required": _reboot_pending(),
    }


def snapshot():
    return {
        "generated_at": iso_now(),
        "host": collect_host(),
        "network": collect_network(),
        "services": collect_services(),
        "security": collect_security(),
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "gale-linux-collector/1.0"

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write(f"collector: {self.address_string()} {fmt % args}\n")

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {"name": SELF_NAME})
        elif self.path == "/stats":
            try:
                self._json(200, snapshot())
            except Exception as e:
                self._json(500, {"error": str(e)})
        elif self.path == "/gpu":
            self._json(200, collect_gpu())
        else:
            self._json(404, {"error": "not found"})


def main():
    collect_network()  # prime the rate calculation so the first sample has a delta
    httpd = ThreadingHTTPServer((BIND_HOST, BIND_PORT), Handler)
    print(f"collector listening on {BIND_HOST}:{BIND_PORT} as {SELF_NAME}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    if os.name == "nt":
        sys.exit("This is the Linux collector -- use remote/windows-desktop/collector.py on Windows.")
    main()
