#!/usr/bin/env python3
"""collector.py -- runs ON the Windows PC being monitored (josh-desktop11),
NOT on gale-agent. This directory (remote/windows-desktop/) is not part of
website/deploy.sh's copy -- it's source for a different machine, tracked
here so it lives in version control somewhere.

WHAT IT DOES: serves two read-only JSON endpoints over plain HTTP on this
LAN (no auth, same model the rest of Gale's ops board already uses --
nothing here can change anything on this PC, it only reads system state):
  GET /health -- {"name": "josh-desktop11"}, matches the same liveness
                 contract every other TARGET on the board already exposes.
  GET /stats  -- host/CPU/memory/disk/network/services/security snapshot,
                 same field shapes as sysmon.py's own collect_host() /
                 collect_network() where a Windows equivalent exists, so
                 the dashboard can render it with the same components.

SETUP on josh-desktop11:
  1. Install Python 3 (python.org) if not already present.
  2. pip install psutil
  3. Copy this file anywhere, e.g. C:\\Gale\\collector.py
  4. Run it once by hand first to check it works:
       python C:\\Gale\\collector.py
     then from another machine on the LAN:
       curl http://192.168.1.197:8792/stats
  5. Make it start automatically at login (Task Scheduler):
       schtasks /Create /TN "GaleCollector" /TR "pythonw.exe C:\\Gale\\collector.py" /SC ONLOGON /RL LIMITED
     (pythonw.exe instead of python.exe so no console window stays open;
     find its path with `where pythonw` if it's not on PATH already.)
     Or: Task Scheduler GUI -> Create Task -> Trigger "At log on" -> Action
     "Start a program" -> Program: pythonw.exe, Arguments: the path above.
  6. Windows Firewall will likely prompt to allow Python on first run --
     allow it for "Private" networks only (this is a home LAN, not public).

Then on gale-agent's side: add {"name": "josh-desktop11", "addr":
"192.168.1.197:8792"} to FULL_TARGETS in website/sysmon.py (already done
if you're reading this after that change shipped) and it shows up on the
dashboard automatically, same as everything else there.

BIND_HOST defaults to 0.0.0.0 (needed so Gale, on a different LAN IP, can
reach it) -- this is a private 192.168.x.x network, not internet-exposed,
consistent with every other unauthenticated endpoint already in this
fleet's design. Change BIND_HOST/PORT via environment variables if needed.
"""
import json
import os
import platform
import socket
import subprocess
import sys
import time
import winreg
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import psutil

BIND_HOST = os.environ.get("COLLECTOR_BIND", "0.0.0.0")
BIND_PORT = int(os.environ.get("COLLECTOR_PORT", "8792"))
SELF_NAME = os.environ.get("COLLECTOR_NAME", socket.gethostname())

# Windows services worth a status row on the dashboard. Edit freely --
# any service name `sc query <name>` recognizes works here.
SERVICES = ["WinDefend", "wuauserv", "Dnscache", "Dhcp", "Spooler"]

DISK_MOUNTS = None  # None = report every fixed drive psutil finds


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
    win = platform.uname()
    try:
        edition = platform.win32_edition()
    except Exception:
        edition = ""
    pretty_os = f"Windows {win.release} {edition}".strip()
    reboot_required = _reboot_pending()
    return {
        "hostname": SELF_NAME,
        "os": pretty_os,
        "kernel": win.version,
        "arch": win.machine,
        "boot_time": datetime.fromtimestamp(boot, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "uptime_s": int(time.time() - boot),
        # Windows has no load average; cpu_pct/per_core stand in for it.
        "load": None,
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
    parts = psutil.disk_partitions(all=False)
    for part in parts:
        if "cdrom" in part.opts or part.fstype == "":
            continue
        if DISK_MOUNTS is not None and part.mountpoint not in DISK_MOUNTS:
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
        if name.lower().startswith(("loopback", "isatap", "teredo")):
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
        pass  # needs admin on some Windows setups; just report nothing rather than crash
    out.sort(key=lambda p: p["port"])
    return out


def collect_services():
    out = []
    try:
        by_name = {s.name(): s for s in psutil.win_service_iter()}
    except Exception:
        by_name = {}
    for name in SERVICES:
        svc = by_name.get(name)
        if svc is None:
            out.append({"unit": name, "state": "not found", "since": ""})
            continue
        try:
            status = svc.status()
        except Exception:
            status = "unknown"
        out.append({"unit": name, "state": "active" if status == "running" else status, "since": ""})
    return out


def _reboot_pending():
    keys = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired"),
    ]
    for hive, path in keys:
        try:
            winreg.OpenKey(hive, path)
            return True
        except FileNotFoundError:
            continue
        except OSError:
            continue
    return False


def collect_security():
    fw = run(["netsh", "advfirewall", "show", "allprofiles", "state"])
    fw_active = None
    if fw:
        # One "State  ON"/"State  OFF" line per profile (Domain/Private/Public);
        # report active only if every profile that reports a state says ON.
        states = [ln.split()[-1].upper() for ln in fw.splitlines() if ln.strip().startswith("State")]
        if states:
            fw_active = all(s == "ON" for s in states)
    defender = None
    try:
        by_name = {s.name(): s for s in psutil.win_service_iter()}
        svc = by_name.get("WinDefend")
        defender = svc is not None and svc.status() == "running"
    except Exception:
        pass
    return {
        "firewall_active": fw_active,
        "defender_active": defender,
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
    server_version = "gale-windows-collector/1.0"

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
        else:
            self._json(404, {"error": "not found"})


def main():
    # prime the network-rate calculation so the first real sample has a delta
    collect_network()
    httpd = ThreadingHTTPServer((BIND_HOST, BIND_PORT), Handler)
    print(f"collector listening on {BIND_HOST}:{BIND_PORT} as {SELF_NAME}")
    httpd.serve_forever()


if __name__ == "__main__":
    if os.name != "nt":
        sys.exit("This collector is Windows-only (uses winreg / win_service_iter).")
    main()
