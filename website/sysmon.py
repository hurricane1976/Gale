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
within TARGET_TIMEOUT; the fourteen local agents and any peer's peer_server.py
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
import hashlib
import json
import os
import re
import socket
import stat
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

# ---- derived history stores (all under the agent-owned gale-api dir) ----
# Three small rolling datasets the dashboard renders:
#   disk-history.jsonl              -> capacity forecast (item: predictive disk)
#   firewalla-talkers-history.jsonl -> 24h top-talker chart (sampled flows)
#   uptime-history.json             -> 90-day worst-health-per-day ledger
# Sampling cadences are deliberately much slower than the 15s snapshot loop:
# disk growth is meaningful at hours, not seconds; talkers align with the
# Firewalla cloud-API cycle (which itself runs ~11 min, see below).
API_DIR = "/var/www/gale-api"
# node_exporter textfile bridge (item 11): sysmon's JSON-only signals
# (hwmon temps, NVMe wear, PSI stalls, OOM count, service states, TLS
# runway, backup age) as Prometheus metrics. The exporter snap watches
# this dir (flags file sets --collector.textfile.directory here); the dir
# is chown'd agent:agent so the collector needs no extra privileges.
TEXTFILE_DIR = "/var/snap/node-exporter/common"
TEXTFILE_PATH = os.path.join(TEXTFILE_DIR, "gale.prom")
DISK_HISTORY_PATH = os.path.join(API_DIR, "disk-history.jsonl")
TALKERS_HISTORY_PATH = os.path.join(API_DIR, "firewalla-talkers-history.jsonl")
UPTIME_HISTORY_PATH = os.path.join(API_DIR, "uptime-history.json")
DISK_SAMPLE_EVERY_S = 600        # one row per mount per 10 min
TALKERS_SAMPLE_EVERY_S = 660     # one row per firewalla poll cycle (no dupes)
HISTORY_KEEP_DAYS = 30           # disk + talkers retention
UPTIME_DAYS = 90                 # uptime ledger window
DISK_FORECAST_DAYS = 14          # regression window for days-to-full

# Peer-fleet health targets. "local" = co-located on this host (same OS/
# network stats as Gale itself, just a different agent+port); "remote" =
# a genuinely separate host, reachable only over Tailscale, health-only.
TARGETS = [
    {"name": "Gale", "kind": "local", "addr": "100.66.39.59:8787"},
    {"name": "Zephyr", "kind": "local", "addr": "100.66.39.59:8788"},
    {"name": "Squall", "kind": "local", "addr": "100.66.39.59:8789"},
    {"name": "Tempest", "kind": "local", "addr": "100.66.39.59:8790"},
    {"name": "Vortex", "kind": "local", "addr": "100.66.39.59:8792"},
    {"name": "Chinook", "kind": "local", "addr": "100.66.39.59:8793"},
    {"name": "Cyclone", "kind": "local", "addr": "100.66.39.59:8794"},
    {"name": "Maistral", "kind": "local", "addr": "100.66.39.59:8795"},
    {"name": "Sirocco", "kind": "local", "addr": "100.66.39.59:8796"},
    {"name": "Bora", "kind": "local", "addr": "100.66.39.59:8797"},
    {"name": "Tramontane", "kind": "local", "addr": "100.66.39.59:8791"},
    {"name": "Ostro", "kind": "local", "addr": "100.66.39.59:8798"},
    {"name": "Poniente", "kind": "local", "addr": "100.66.39.59:8800"},
    {"name": "Levante", "kind": "local", "addr": "100.66.39.59:8799"},
    {"name": "Tidal", "kind": "remote", "addr": "100.91.42.51:8787"},
    {"name": "Beacon", "kind": "remote", "addr": "100.99.217.90:8787"},
    {"name": "Mountain", "kind": "remote", "addr": "100.114.14.116:8787"},
]
TARGET_TIMEOUT_S = 2.5

# Remote (tailnet) targets get probed far less often than the 15s local loop.
# Mountain flagged (2026-09-24) that this had been hitting its /health at
# ~16s intervals continuously since 2026-09-21 -- 11,800+ unauthenticated
# requests, all 401ing, well past what any peer expects ("one check per wake
# cycle, no standing connections" on their side). Local targets stay on the
# tight loop since they're free (same host); remote ones are cached between
# probes so the dashboard still refreshes, just without hammering someone
# else's server for a liveness fact that doesn't change second to second.
REMOTE_POLL_S = 300
_remote_cache = {}

# Full-stats targets: unlike TARGETS above (liveness-only /health ping),
# each of these runs its own collector (see remote/<platform>/collector.py)
# exposing GET /stats with a host/cpu/mem/disk/network/services/security
# snapshot, which the dashboard renders as its own panel -- same idea as
# Gale's own vitals, just sourced from a different machine's collector
# instead of psutil calls made here. LAN-only today (private 192.168.x.x),
# not tailnet -- reachable because gale-agent itself has a LAN NIC (eno1).
FULL_TARGETS = [
    # josh-desktop11 (Windows) died and was reimaged as josh-linux (Zorin OS,
    # same hardware/IP, same 4090) -- see remote/linux-desktop/collector.py
    {"name": "josh-linux", "addr": "192.168.1.197:8792", "platform": "linux-desktop"},
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
    "gale-peer", "zephyr-peer", "squall-peer", "tempest-peer", "vortex-peer", "chinook-peer", "cyclone-peer", "maistral-peer", "sirocco-peer", "bora-peer", "tramontane-peer", "ostro-peer", "poniente-peer", "levante-peer",
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
    8787: "gale-peer", 8788: "zephyr-peer", 8789: "squall-peer", 8790: "tempest-peer", 8792: "vortex-peer", 8793: "chinook-peer", 8794: "cyclone-peer", 8795: "maistral-peer", 8796: "sirocco-peer", 8797: "bora-peer", 8791: "tramontane-peer", 8798: "ostro-peer", 8800: "poniente-peer", 8799: "levante-peer",
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


def collect_hygiene():
    """Item 10 (hygiene): TLS cert days-left (the PWA/push stack depends on
    the tailscale cert) + Tramontane last-good-backup age. Both read-only,
    both None when unreadable -- never a snapshot failure."""
    import glob as _glob
    cert_days, cert_path = None, None
    for crt in sorted(_glob.glob("/etc/nginx/ssl/*.crt")):
        out = run(["openssl", "x509", "-in", crt, "-noout", "-enddate"], timeout=5)
        m = re.match(r"notAfter=(.*)", out or "")
        if not m:
            continue
        try:
            exp = datetime.strptime(m.group(1).strip(), "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            days = (exp - datetime.now(timezone.utc)).total_seconds() / 86400
            if cert_days is None or days < cert_days:
                cert_days, cert_path = round(days, 1), crt
        except ValueError:
            continue
    backup_age_h, backup_name = None, None
    try:
        newest, newest_t = None, 0.0
        for root, _ds, fs in os.walk("/home/agent/tramontane/backups"):
            for fn in fs:
                p = os.path.join(root, fn)
                try:
                    mt = os.path.getmtime(p)
                except OSError:
                    continue
                if mt > newest_t:
                    newest, newest_t = p, mt
        if newest:
            backup_age_h = round((time.time() - newest_t) / 3600, 1)
            backup_name = os.path.basename(newest)
    except OSError:
        pass
    drill, drill_age_h = None, None
    try:
        with open(os.path.join(API_DIR, "restore-drill.json")) as f:
            drill = json.load(f)
        ts = datetime.strptime((drill.get("ts") or "")[:19],
                               "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
        drill_age_h = round((datetime.now(timezone.utc) - ts).total_seconds() / 3600, 1)
    except (OSError, ValueError, TypeError, AttributeError):
        drill = None
    return {"cert_days_left": cert_days, "cert_path": cert_path,
            "backup_age_h": backup_age_h, "backup_name": backup_name,
            "drill_ok": drill.get("ok") if isinstance(drill, dict) else None,
            "drill_age_h": drill_age_h,
            "drill_backup": drill.get("backup") if isinstance(drill, dict) else None}


_KLOG_UNKNOWN = object()
_KLOG_SRC = _KLOG_UNKNOWN


def collect_kernel():
    """Item 9 (kernel-distress watch): PSI pressure stalls, cpufreq
    cur/max ratio (thermal-throttle sysfs is driver-specific and absent
    here), and kernel err+ ring via journalctl -k (raw dmesg is
    restricted for unprivileged users). All best-effort; missing sources
    are None, never failures."""
    import glob as _glob
    pressure = {}
    for res in ("cpu", "memory", "io"):
        try:
            with open(f"/proc/pressure/{res}") as f:
                for line in f:
                    parts = line.split()
                    if not parts:
                        continue
                    for p in parts[1:]:
                        if "=" in p:
                            k, v = p.split("=", 1)
                            if k.startswith("avg"):
                                try:
                                    pressure[f"{res}_{parts[0]}_{k}"] = round(float(v), 2)
                                except ValueError:
                                    pass
        except OSError:
            pass
    # throttle counters where the driver exposes them (summed, by kind)
    throttles = {}
    for p in _glob.glob("/sys/devices/system/cpu/cpu[0-9]*/thermal_throttle/*_throttle_count"):
        kind = os.path.basename(p).replace("_throttle_count", "")
        try:
            with open(p) as f:
                throttles[kind] = throttles.get(kind, 0) + int(f.read().strip())
        except (OSError, ValueError):
            pass
    # freq headroom across policies (cur/max); a hot box parks near max
    # while throttling *down* under thermal load -- low ratio at high
    # temp corroborates throttling when counters are absent.
    freq_ratio = None
    try:
        ratios = []
        for pol in _glob.glob("/sys/devices/system/cpu/cpufreq/policy*"):
            with open(os.path.join(pol, "scaling_cur_freq")) as f:
                cur = float(f.read().strip())
            with open(os.path.join(pol, "scaling_max_freq")) as f:
                mx = float(f.read().strip())
            if mx > 0:
                ratios.append(cur / mx)
        if ratios:
            freq_ratio = round(sum(ratios) / len(ratios), 2)
    except OSError:
        pass
    global _KLOG_SRC
    if _KLOG_SRC is _KLOG_UNKNOWN:
        # raw dmesg is restricted for unprivileged users (rc != 0), the
        # journal usually isn't; probe once, cache -- neither changes
        # without a reboot or an ACL edit.
        _KLOG_SRC = None
        for cmd in (["journalctl", "-k", "-n1", "--no-pager"],
                    ["dmesg", "-n", "1"]):
            try:
                r = subprocess.run(cmd, capture_output=True, timeout=5)
                if r.returncode == 0:
                    _KLOG_SRC = cmd[0]
                    break
            except Exception:
                continue
    klog = ""
    if _KLOG_SRC == "journalctl":
        klog = run(["journalctl", "-k", "--since", "24 hours ago", "-p", "err",
                    "--no-pager", "-o", "cat"], timeout=8)
    elif _KLOG_SRC == "dmesg":
        klog = run(["dmesg", "--level=err,crit,alert,emerg", "--nopager"], timeout=5)
    oom_kills = len(re.findall(r"Out of memory|Killed process|oom-killer", klog or ""))
    err_lines = [ln.strip()[:160] for ln in (klog or "").splitlines() if ln.strip()][-5:]
    return {"pressure": pressure or None, "throttles": throttles or None,
            "freq_ratio": freq_ratio, "oom_kills_24h": oom_kills,
            "klog_err_24h": len(err_lines), "klog_tail": err_lines,
            "klog_src": _KLOG_SRC}


def collect_services():
    # Item 10 (service health dashboard): besides active/since, capture
    # restart counts + current memory so the dashboard can show flapping
    # units and RSS growth. One `systemctl show` call per unit, all
    # best-effort -- a missing property is None, never a failure.
    out = []
    for unit in SERVICES:
        active = run(["systemctl", "is-active", unit]) or "unknown"
        show = run(["systemctl", "show", unit,
                    "--property=ActiveEnterTimestamp,NRestarts,MemoryCurrent,SubState"])
        props = {}
        for line in show.splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                props[k] = v
        try:
            n_restarts = int(props.get("NRestarts", ""))
        except (ValueError, TypeError):
            n_restarts = None
        try:
            mem_raw = props.get("MemoryCurrent", "")
            mem_bytes = int(mem_raw) if mem_raw not in ("", "[not set]") else None
            if mem_bytes == 18446744073709551615:  # systemd "infinity" sentinel
                mem_bytes = None
        except (ValueError, TypeError):
            mem_bytes = None
        out.append({"unit": unit, "state": active,
                    "since": props.get("ActiveEnterTimestamp", "") or None,
                    "sub": props.get("SubState", "") or None,
                    "n_restarts": n_restarts,
                    "memory_bytes": mem_bytes})
    return out


def collect_hardware():
    """Item 7 (hardware telemetry surface): thermal zones, hwmon sensors
    (temps + fan RPM), and NVMe SMART (temp/wear/spare) -- all best-effort
    sysfs reads plus one bounded smartctl call. Never raises; a missing
    sensor class is an empty list, not an error."""
    import glob as _glob
    zones = []
    for temp_path in sorted(_glob.glob("/sys/class/thermal/thermal_zone*/temp")):
        zone = temp_path.split("/")[-2]
        type_path = temp_path.replace("/temp", "/type")
        try:
            with open(type_path) as f:
                ztype = f.read().strip()
        except OSError:
            ztype = zone
        try:
            with open(temp_path) as f:
                raw = f.read().strip()
            # sysfs thermal reports millidegrees; some drivers report degrees
            mv = float(raw)
            c = mv / 1000.0 if mv > 1000 else mv
            zones.append({"zone": zone, "type": ztype, "temp_c": round(c, 1)})
        except (OSError, ValueError):
            continue
    sensors, fans = [], []
    for name_path in sorted(_glob.glob("/sys/class/hwmon/hwmon*/name")):
        hw = name_path.split("/")[-2]
        try:
            with open(name_path) as f:
                chip = f.read().strip()
        except OSError:
            chip = hw
        base = os.path.dirname(name_path)
        for tp in sorted(_glob.glob(os.path.join(base, "temp*_input"))):
            label = ""
            lab_path = tp.replace("_input", "_label")
            try:
                with open(lab_path) as f:
                    label = f.read().strip()
            except OSError:
                pass
            try:
                with open(tp) as f:
                    mv = float(f.read().strip())
                c = mv / 1000.0 if mv > 1000 else mv
                sensors.append({"chip": chip, "label": label or os.path.basename(tp),
                                "temp_c": round(c, 1)})
            except (OSError, ValueError):
                continue
        for fp in sorted(_glob.glob(os.path.join(base, "fan*_input"))):
            try:
                with open(fp) as f:
                    rpm = int(float(f.read().strip()))
                sensors_fan = {"chip": chip, "fan": os.path.basename(fp), "rpm": rpm}
                fans.append(sensors_fan)
            except (OSError, ValueError):
                continue
    nvme = None
    smart_raw = run(["smartctl", "-A", "-j", "/dev/nvme0n1"], timeout=4)
    if smart_raw:
        try:
            sj = json.loads(smart_raw)
            nv = (sj.get("nvme_smart_health_information_log") or {})
            nvme = {"device": "/dev/nvme0n1",
                    "temp_c": nv.get("temperature"),
                    "spare_pct": nv.get("available_spare"),
                    "used_pct": nv.get("percentage_used"),
                    "data_units_read": nv.get("data_units_read"),
                    "power_on_hours": nv.get("power_on_hours")}
        except (json.JSONDecodeError, AttributeError):
            nvme = None
    hottest = None
    for s in sensors:
        if isinstance(s.get("temp_c"), (int, float)) and (hottest is None or s["temp_c"] > hottest):
            hottest = s["temp_c"]
    for z in zones:
        if hottest is None or z["temp_c"] > hottest:
            hottest = z["temp_c"]
    return {"thermal_zones": zones, "sensors": sensors, "fans": fans,
            "nvme": nvme, "hottest_c": hottest}


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


DRIFT_BASELINE = os.path.join(API_DIR, "sudoers.sha256")

# Secret files that must stay owner-only. (path, may_be_missing)
_SECRET_FILES = [
    ("/etc/nginx/ssl/gale-agent.tail2f1671.ts.net.key", False),
    ("/etc/alertmanager/telegram_bot_token", False),
    ("/home/agent/agent/keys/telegram.env", False),
    ("/home/agent/agent/keys/firewalla.env", False),
    ("/home/agent/agent/keys/github_deploy_key", False),
    ("/home/agent/agent/keys/peers.env", False),
]


def collect_drift():
    """Item 19 (secret/config drift): sudoers drop-in content change vs a
    hash baseline (auto-established, warn on drift), owner-only permission
    audit on secret files (crit on exposure), Telegram token age (warn at
    1y -- rotation reminder, no invented policy beyond that)."""
    sudoers_changed, sudoers_hash = None, None
    try:
        with open("/etc/sudoers.d/99-agent", "rb") as f:
            sudoers_hash = hashlib.sha256(f.read()).hexdigest()[:16]
    except OSError:
        # agent can't always read sudoers.d directly; same box allows
        # passwordless sudo for its monitoring commands (ss, ufw).
        blob = run(["sudo", "-n", "cat", "/etc/sudoers.d/99-agent"], timeout=3)
        if blob:
            sudoers_hash = hashlib.sha256(blob.encode()).hexdigest()[:16]
    if sudoers_hash:
        try:
            with open(DRIFT_BASELINE) as f:
                baseline = f.read().strip()
        except OSError:
            baseline = None
        if baseline is None:
            try:
                with open(DRIFT_BASELINE, "w") as f:
                    f.write(sudoers_hash)
            except OSError:
                pass
        else:
            sudoers_changed = (baseline != sudoers_hash)
    perm_issues = []
    for path, _ in _SECRET_FILES:
        try:
            st = os.stat(path)
        except OSError:
            continue
        mode = stat.S_IMODE(st.st_mode)
        if mode & 0o077:
            perm_issues.append(f"{path} mode {oct(mode)}")
    token_age_d = None
    try:
        token_age_d = round((time.time() - os.path.getmtime("/home/agent/agent/keys/telegram.env")) / 86400, 1)
    except OSError:
        pass
    return {"sudoers_changed": sudoers_changed, "perm_issues": perm_issues,
            "token_age_d": token_age_d}


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
    out = []
    now = time.time()
    for t in TARGETS:
        if t["kind"] != "remote":
            out.append(probe_target(t))
            continue
        cached = _remote_cache.get(t["name"])
        if cached and now - cached["t"] < REMOTE_POLL_S:
            out.append(cached["result"])
            continue
        result = probe_target(t)
        _remote_cache[t["name"]] = {"t": now, "result": result}
        out.append(result)
    return out


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
                    mins = int(secs // 60)
                    # keep_alive=-1 models report a far-future expiry (~292y);
                    # rendering "153722852m" is noise -- show open-ended as None
                    exp_iso = mins if 0 <= mins < 60 * 24 * 30 else None
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
    now = time.time()
    host = collect_host()
    sample_capacity_history(now, host)
    fw = collect_firewalla()
    sample_talkers_history(fw, now)
    targets = collect_targets()
    full_targets = collect_full_targets()
    return {
        "generated_at": iso_now(),
        "collector_interval_s": INTERVAL_S,
        "host": {**host, "disk_forecast": disk_forecast()},
        "hardware": collect_hardware(),
        "kernel": collect_kernel(),
        "hygiene": collect_hygiene(),
        "drift": collect_drift(),
        "network": collect_network(),
        "services": collect_services(),
        "security": collect_security(),
        "targets": targets,
        "firewalla": {**fw, "talkers_history": talkers_history()},
        "ollama": collect_ollama(),
        "full_targets": full_targets,
        "uptime_history": uptime_history(targets, full_targets),
    }


def write_atomic(path, data):
    d = os.path.dirname(path)
    os.makedirs(d, exist_ok=True)
    tmp = f"{path}.tmp-{os.getpid()}"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=1)
    os.replace(tmp, path)
    os.chmod(path, 0o644)


def _prom_esc(s):
    return str(s or "?").replace("\\", r"\\").replace('"', r"\"").replace("\n", " ")


def write_textfile(snap):
    """Render the JSON snapshot's sysmon-unique signals as Prometheus
    exposition format. Best-effort: a failed write leaves the previous
    .prom in place (and absent(gale_box_hottest_celsius) pages on it)."""
    try:
        L = []
        hw = snap.get("hardware") or {}
        for z in hw.get("thermal_zones") or []:
            if isinstance(z.get("temp_c"), (int, float)):
                L.append(f'gale_thermal_zone_celsius{{zone="{_prom_esc(z.get("zone"))}",type="{_prom_esc(z.get("type"))}"}} {z["temp_c"]}')
        for s in hw.get("sensors") or []:
            if isinstance(s.get("temp_c"), (int, float)):
                L.append(f'gale_hwmon_temp_celsius{{chip="{_prom_esc(s.get("chip"))}",label="{_prom_esc(s.get("label"))}"}} {s["temp_c"]}')
        for f in hw.get("fans") or []:
            L.append(f'gale_hwmon_fan_rpm{{chip="{_prom_esc(f.get("chip"))}",fan="{_prom_esc(f.get("fan"))}"}} {f.get("rpm", 0)}')
        if isinstance(hw.get("hottest_c"), (int, float)):
            L.append(f"gale_box_hottest_celsius {hw['hottest_c']}")
        nv = hw.get("nvme") or {}
        for k, m in (("used_pct", "gale_nvme_used_percent"), ("spare_pct", "gale_nvme_spare_percent"),
                     ("temp_c", "gale_nvme_temp_celsius"), ("power_on_hours", "gale_nvme_power_on_hours")):
            if isinstance(nv.get(k), (int, float)):
                L.append(f"{m} {nv[k]}")
        for sv in snap.get("services") or []:
            u = _prom_esc(sv.get("unit"))
            L.append(f'gale_service_up{{unit="{u}"}} {1 if sv.get("state") == "active" else 0}')
            if isinstance(sv.get("n_restarts"), int):
                L.append(f'gale_service_restarts{{unit="{u}"}} {sv["n_restarts"]}')
        k = snap.get("kernel") or {}
        for pk, pv in (k.get("pressure") or {}).items():
            # cpu_some_avg10 -> resource="cpu" mode="some" window="avg10"
            m = re.match(r"(\w+)_(some|full)_(avg\d+)", pk)
            if m and isinstance(pv, (int, float)):
                L.append(f'gale_pressure_stall_ratio{{resource="{m.group(1)}",mode="{m.group(2)}",window="{m.group(3)}"}} {pv / 100}')
        L.append(f"gale_oom_kills_24h {k.get('oom_kills_24h') or 0}")
        L.append(f"gale_klog_err_24h {k.get('klog_err_24h') or 0}")
        hy = snap.get("hygiene") or {}
        if isinstance(hy.get("cert_days_left"), (int, float)):
            L.append(f"gale_tls_cert_days_left {hy['cert_days_left']}")
        if isinstance(hy.get("backup_age_h"), (int, float)):
            L.append(f"gale_backup_age_hours {hy['backup_age_h']}")
        L.append(f"gale_textfile_generated_unixtime {int(time.time())}")
        fams = {}
        for ln in L:
            fams.setdefault(ln.split("{")[0].split(" ")[0], []).append(ln)
        body = "".join(
            f"# HELP {m} Gale sysmon bridge signal (sysmon.write_textfile)\n"
            f"# TYPE {m} gauge\n" + "\n".join(ls) + "\n"
            for m, ls in sorted(fams.items()))
        tmp = f"{TEXTFILE_PATH}.tmp-{os.getpid()}"
        with open(tmp, "w") as f:
            f.write(body)
        os.replace(tmp, TEXTFILE_PATH)
    except OSError as e:
        sys.stderr.write(f"sysmon: textfile write failed: {e!r}\n")


# ---- history plumbing ------------------------------------------------------

_prune_state = {"t": 0.0}


def append_jsonl(path, row, keep_days=HISTORY_KEEP_DAYS):
    """Append one JSON row; lazily (hourly) rewrite the file without rows
    older than keep_days. A missing/corrupt file just starts over -- history
    is advisory, never worth failing a snapshot over."""
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a") as f:
            f.write(json.dumps(row, separators=(",", ":")) + "\n")
        now = time.time()
        if now - _prune_state["t"] > 3600:
            _prune_state["t"] = now
            cutoff = now - keep_days * 86400
            try:
                with open(path) as f:
                    rows = [ln for ln in f.read().splitlines() if ln]
                kept, drop = [], False
                for ln in rows:
                    try:
                        if json.loads(ln).get("ts_e", 0) < cutoff:
                            drop = True
                            continue
                    except (json.JSONDecodeError, AttributeError, TypeError):
                        drop = True
                        continue
                    kept.append(ln)
                if drop:
                    tmp = f"{path}.tmp-{os.getpid()}"
                    with open(tmp, "w") as f:
                        f.write("\n".join(kept) + ("\n" if kept else ""))
                    os.replace(tmp, path)
            except OSError:
                pass
    except OSError as e:
        sys.stderr.write(f"sysmon: history append failed ({path}): {e!r}\n")


def read_jsonl(path, max_rows=6000):
    out = []
    try:
        with open(path) as f:
            for ln in f:
                ln = ln.strip()
                if not ln:
                    continue
                try:
                    out.append(json.loads(ln))
                except json.JSONDecodeError:
                    continue
    except OSError:
        pass
    return out[-max_rows:]


# ---- predictive disk capacity (ROADMAP item: disk growth forecast) ---------

_disk_sampled = {"t": 0.0}


def sample_capacity_history(now, host):
    """Item 9-ext: disks + RAM + swap share one history file and one
    regression (disk_forecast groups by mount, so mem/swap get days-to-full
    for free). RAM % includes reclaimable cache, so its slope is usually
    ~0 -> reported steady; only a real leak trips the honesty gate."""
    if now - _disk_sampled["t"] < DISK_SAMPLE_EVERY_S:
        return
    _disk_sampled["t"] = now
    for d in host.get("disks") or []:
        append_jsonl(DISK_HISTORY_PATH, {
            "ts": iso_now(), "ts_e": now, "mount": d["mount"],
            "used_gb": d["used_gb"], "pct": d["pct"],
        })
    m = host.get("mem") or {}
    if isinstance(m.get("pct"), (int, float)):
        append_jsonl(DISK_HISTORY_PATH, {
            "ts": iso_now(), "ts_e": now, "mount": "mem",
            "used_gb": round((m.get("used_mb") or 0) / 1024, 2), "pct": m["pct"],
        })
    s = host.get("swap") or {}
    if isinstance(s.get("pct"), (int, float)):
        append_jsonl(DISK_HISTORY_PATH, {
            "ts": iso_now(), "ts_e": now, "mount": "swap",
            "used_gb": round((s.get("used_mb") or 0) / 1024, 2), "pct": s["pct"],
        })


def sample_disk_history(now):
    # Back-compat shim: snapshot() now samples with host data in hand.
    if now - _disk_sampled["t"] < DISK_SAMPLE_EVERY_S:
        return
    _disk_sampled["t"] = now
    for d in collect_disks():
        append_jsonl(DISK_HISTORY_PATH, {
            "ts": iso_now(), "ts_e": now, "mount": d["mount"],
            "used_gb": d["used_gb"], "pct": d["pct"],
        })


def disk_forecast():
    """Least-squares slope of used-% over the last DISK_FORECAST_DAYS days per
    mount -> 'days until full' at the observed rate. Slope below 0.05 %-pt/day
    (i.e. < ~1.5%/month) is reported as steady rather than a fake-precise
    400-day ETA; forecasts need >= 3 days of samples to mean anything."""
    by_mount = {}
    for row in read_jsonl(DISK_HISTORY_PATH):
        by_mount.setdefault(row.get("mount") or "?", []).append(row)
    out = []
    now = time.time()
    for mount, rows in sorted(by_mount.items()):
        recent = [r for r in rows if now - r.get("ts_e", 0) <= DISK_FORECAST_DAYS * 86400
                  and isinstance(r.get("pct"), (int, float))]
        if len(recent) < 2:
            continue
        t0 = recent[0]["ts_e"]
        xs = [(r["ts_e"] - t0) / 86400 for r in recent]
        ys = [r["pct"] for r in recent]
        n = len(xs)
        mx, my = sum(xs) / n, sum(ys) / n
        denom = sum((x - mx) ** 2 for x in xs)
        slope = (sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / denom) if denom > 1e-9 else 0.0
        pct_now = ys[-1]
        days = ((100.0 - pct_now) / slope) if slope > 0.05 else None
        out.append({
            "mount": mount,
            "pct": pct_now,
            "slope_pct_per_day": round(slope, 3),
            "days_to_full": round(days, 1) if days is not None and 0 < days < 3650 else None,
            "samples": n,
            "span_days": round(xs[-1] - xs[0], 1) if n > 1 else 0.0,
        })
    return out


# ---- firewalla top-talker history (24h stacked chart) ----------------------

_talkers_sampled = {"fw_t": None}


def sample_talkers_history(fw, now):
    """One row per Firewalla poll cycle (the collector caches fw data between
    cycles, so keying on the cache timestamp avoids duplicate rows)."""
    if not (fw and fw.get("ok")):
        return
    fw_t = _fw_cache["t"]
    if fw_t == _talkers_sampled["fw_t"]:
        return
    _talkers_sampled["fw_t"] = fw_t
    talkers = ((fw.get("live") or {}).get("top_talkers")) or []
    if talkers:
        append_jsonl(TALKERS_HISTORY_PATH, {
            "ts": iso_now(), "ts_e": now,
            "talkers": [{"name": t.get("name") or "?", "bytes": int(t.get("bytes") or 0)}
                        for t in talkers],
        })


def talkers_history():
    """Aggregate the last 24h of talker samples into 2h buckets (top 8 devices
    by 24h total, everything else folded into 'other') for a stacked chart,
    plus per-device 24h totals for the legend."""
    rows = read_jsonl(TALKERS_HISTORY_PATH)
    now = time.time()
    recent = [r for r in rows if now - r.get("ts_e", 0) <= 86400]
    totals = {}
    bucket_map = {}
    for r in recent:
        for t in r.get("talkers") or []:
            name, b = t.get("name") or "?", int(t.get("bytes") or 0)
            totals[name] = totals.get(name, 0) + b
            bkt = int(r["ts_e"] // 7200)
            bucket_map.setdefault(bkt, {}).setdefault(name, 0)
            bucket_map[bkt][name] += b
    top = [n for n, _ in sorted(totals.items(), key=lambda kv: -kv[1])[:8]]
    buckets = []
    for bkt in sorted(bucket_map):
        devs = bucket_map[bkt]
        named = {n: devs.get(n, 0) for n in top if devs.get(n)}
        other = sum(v for k, v in devs.items() if k not in top)
        if other:
            named["other"] = other
        buckets.append({"ts": bkt * 7200, "devices": named})
    return {
        "window_hours": 24,
        "bucket_hours": 2,
        "buckets": buckets,
        "totals_24h": [[n, totals[n]] for n, _ in sorted(totals.items(), key=lambda kv: -kv[1])[:10]],
        "samples": len(recent),
    }


# ---- 90-day uptime ledger ---------------------------------------------------

_UPTIME_SEV = {"up": 0, "auth": 1, "error": 2, "down": 3}
_SEV_UPTIME = {0: "up", 1: "auth", 2: "down", 3: "down"}


def uptime_history(targets, full_targets):
    """Fold today's worst health per target into a 90-day rolling ledger.
    'auth' counts as reachable-but-gated (its own shade); error/down collapse
    to 'down'. Reads/writes a tiny JSON file each snapshot -- fine at 15s for
    a <10KB file."""
    today = iso_now()[:10]
    try:
        with open(UPTIME_HISTORY_PATH) as f:
            led = json.load(f)
    except (OSError, json.JSONDecodeError, ValueError):
        led = {"targets": {}}
    targets_led = led.setdefault("targets", {})
    for t in targets + full_targets:
        name, health = t.get("name") or "?", t.get("health") or "down"
        day = targets_led.setdefault(name, {})
        sev = _UPTIME_SEV.get(health, 3)
        if health == "auth":
            cur = day.get(today)
            day[today] = cur if isinstance(cur, int) and cur >= 1 else 1
        else:
            day[today] = max(int(day.get(today, 0) or 0), sev)
    # roll the window
    cutoff = (datetime.now(timezone.utc).date().toordinal() - UPTIME_DAYS + 1)
    for name in list(targets_led):
        day = targets_led[name]
        for d in [k for k in day if len(k) == 10
                  and datetime.strptime(k, "%Y-%m-%d").date().toordinal() < cutoff]:
            del day[d]
    led["updated"] = iso_now()
    try:
        tmp = f"{UPTIME_HISTORY_PATH}.tmp-{os.getpid()}"
        with open(tmp, "w") as f:
            json.dump(led, f)
        os.replace(tmp, UPTIME_HISTORY_PATH)
    except OSError as e:
        sys.stderr.write(f"sysmon: uptime ledger write failed: {e!r}\n")
    # shape for the dashboard: aligned per-target arrays over the window
    dates = [datetime.fromordinal(cutoff + i).date().isoformat() for i in range(UPTIME_DAYS)]
    out = {"days": dates, "targets": {}}
    for name, day in sorted(targets_led.items()):
        out["targets"][name] = [day.get(d) for d in dates]
    return out


def main():
    once = "--once" in sys.argv
    # prime the network-rate calculation so the first real sample has a delta
    collect_network()
    while True:
        try:
            snap = snapshot()
            write_atomic(OUT_PATH, snap)
            write_textfile(snap)
        except Exception as e:
            sys.stderr.write(f"sysmon: snapshot failed: {e!r}\n")
        if once:
            break
        time.sleep(INTERVAL_S)


if __name__ == "__main__":
    main()
