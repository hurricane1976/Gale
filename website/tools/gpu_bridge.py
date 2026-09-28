#!/usr/bin/env python3
"""gpu_bridge.py -- Prometheus textfile bridge for the LAN inference stack.

Same shape as synthetics.sh's bridge half and sysmon.write_textfile: pull
the two upstreams over HTTP (urllib only, strict timeouts, no shell-outs)
and atomically write one .prom file into the node_exporter textfile dir
(--collector.textfile.directory=/var/snap/node-exporter/common), so the
Ollama server + its GPU become first-class Prometheus metrics:

  gale_ollama_up / models_installed / models_loaded / vram_bytes
  gale_ollama_model_loaded{name}         (per model, 1/0)
  gale_gpu_collector_up                  (josh-desktop11 collector /gpu)
  gale_gpu_util_pct / temp_c / power_w / vram_used_mb / vram_total_mb
  gale_gpu_vram_used_ratio{gpu}
  gale_gpu_bridge_unixtime              (staleness tripwire)

Upstreams (env-overridable, defaults match ollama_api.py):
  OLLAMA_URL      default http://192.168.1.197:11434   (/api/ps, /api/tags)
  GPU_COLLECTOR_URL default http://192.168.1.197:8792  (/gpu)

On upstream failure the file is still rewritten (up=0, zeros elsewhere,
fresh unixtime) -- the right alerts then are the *_down ones, not a silent
absent() gap that reads as "bridge died". Cron every 5 min, like
synthetics.sh; node_exporter scrapes the dir every 15s.
"""
import json
import os
import sys
import time
import urllib.request

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://192.168.1.197:11434").rstrip("/")
COLLECTOR_URL = os.environ.get("GPU_COLLECTOR_URL", "http://192.168.1.197:8792").rstrip("/")
TEXTFILE = os.environ.get("GPU_TEXTFILE", "/var/snap/node-exporter/common/gale_gpu.prom")


def fetch_json(url, timeout=6):
    req = urllib.request.Request(url, headers={"User-Agent": "gale-gpu-bridge/1"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def esc(v):
    return str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")[:80]


def main():
    ollama_up = 0
    models_loaded = []
    models_installed = 0
    vram_bytes = 0
    try:
        ps = fetch_json(OLLAMA_URL + "/api/ps")
        models_loaded = [m.get("name", "?") for m in (ps.get("models") or [])]
        vram_bytes = sum(int(m.get("size_vram") or 0) for m in (ps.get("models") or []))
        ollama_up = 1
    except Exception as e:
        sys.stderr.write(f"gpu_bridge: /api/ps failed: {e!r}\n")
    try:
        tags = fetch_json(OLLAMA_URL + "/api/tags")
        models_installed = len(tags.get("models") or [])
    except Exception as e:
        sys.stderr.write(f"gpu_bridge: /api/tags failed: {e!r}\n")

    collector_up = 0
    gpus = []
    try:
        gpus = fetch_json(COLLECTOR_URL + "/gpu") or []
        if isinstance(gpus, list):
            collector_up = 1
        else:
            gpus = []
    except Exception as e:
        sys.stderr.write(f"gpu_bridge: collector /gpu failed: {e!r}\n")

    L = [
        "# HELP gale_ollama_up LAN Ollama server reachable via /api/ps (1/0)",
        "# TYPE gale_ollama_up gauge",
        f"gale_ollama_up {ollama_up}",
        "# HELP gale_ollama_models_installed Models present in the Ollama library",
        "# TYPE gale_ollama_models_installed gauge",
        f"gale_ollama_models_installed {models_installed}",
        "# HELP gale_ollama_models_loaded Models currently resident (loaded) in Ollama",
        "# TYPE gale_ollama_models_loaded gauge",
        f"gale_ollama_models_loaded {len(models_loaded)}",
        "# HELP gale_ollama_vram_bytes VRAM bytes held by loaded Ollama models",
        "# TYPE gale_ollama_vram_bytes gauge",
        f"gale_ollama_vram_bytes {vram_bytes}",
        "# HELP gale_ollama_model_loaded Model currently loaded in Ollama (1/0)",
        "# TYPE gale_ollama_model_loaded gauge",
    ]
    for name in models_loaded:
        L.append(f'gale_ollama_model_loaded{{name="{esc(name)}"}} 1')
    L += [
        "# HELP gale_gpu_collector_up Windows GPU collector /gpu reachable (1/0)",
        "# TYPE gale_gpu_collector_up gauge",
        f"gale_gpu_collector_up {collector_up}",
        "# HELP gale_gpu_util_pct GPU utilization percent (nvidia-smi)",
        "# TYPE gale_gpu_util_pct gauge",
    ]
    for g in gpus:
        i = esc(g.get("index", 0))
        L.append(f'gale_gpu_util_pct{{gpu="{i}"}} {float(g.get("util_pct") or 0):.1f}')
    L += [
        "# HELP gale_gpu_temp_c GPU temperature celsius",
        "# TYPE gale_gpu_temp_c gauge",
    ]
    for g in gpus:
        i = esc(g.get("index", 0))
        L.append(f'gale_gpu_temp_c{{gpu="{i}"}} {float(g.get("temp_c") or 0):.1f}')
    L += [
        "# HELP gale_gpu_power_w GPU power draw watts",
        "# TYPE gale_gpu_power_w gauge",
    ]
    for g in gpus:
        i = esc(g.get("index", 0))
        L.append(f'gale_gpu_power_w{{gpu="{i}"}} {float(g.get("power_w") or 0):.1f}')
    L += [
        "# HELP gale_gpu_vram_used_mb GPU VRAM used MB",
        "# TYPE gale_gpu_vram_used_mb gauge",
    ]
    for g in gpus:
        i = esc(g.get("index", 0))
        L.append(f'gale_gpu_vram_used_mb{{gpu="{i}"}} {float(g.get("mem_used_mb") or 0):.1f}')
    L += [
        "# HELP gale_gpu_vram_total_mb GPU VRAM total MB",
        "# TYPE gale_gpu_vram_total_mb gauge",
    ]
    for g in gpus:
        i = esc(g.get("index", 0))
        L.append(f'gale_gpu_vram_total_mb{{gpu="{i}"}} {float(g.get("mem_total_mb") or 0):.1f}')
    L += [
        "# HELP gale_gpu_vram_used_ratio GPU VRAM used / total (0..1)",
        "# TYPE gale_gpu_vram_used_ratio gauge",
    ]
    for g in gpus:
        i = esc(g.get("index", 0))
        used, total = float(g.get("mem_used_mb") or 0), float(g.get("mem_total_mb") or 0)
        ratio = used / total if total > 0 else 0.0
        L.append(f'gale_gpu_vram_used_ratio{{gpu="{i}"}} {ratio:.4f}')
    L += [
        "# HELP gale_gpu_bridge_unixtime Unixtime of last gpu_bridge run",
        "# TYPE gale_gpu_bridge_unixtime gauge",
        f"gale_gpu_bridge_unixtime {int(time.time())}",
    ]

    tmp = f"{TEXTFILE}.tmp-{os.getpid()}"
    os.makedirs(os.path.dirname(TEXTFILE), exist_ok=True)
    with open(tmp, "w") as f:
        f.write("\n".join(L) + "\n")
    os.replace(tmp, TEXTFILE)
    os.chmod(TEXTFILE, 0o644)
    print(f"gpu_bridge: wrote {TEXTFILE} (ollama_up={ollama_up} "
          f"loaded={len(models_loaded)} collector_up={collector_up})")


if __name__ == "__main__":
    main()
