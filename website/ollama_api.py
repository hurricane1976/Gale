#!/usr/bin/env python3
"""ollama_api.py -- Ollama admin service for Gale's website.

One localhost-only HTTP service (127.0.0.1:8794) behind nginx
(/api/ollama/*) that monitors and controls the LAN inference server
OLLAMA_URL (default http://192.168.1.197:11434). Deliberately a separate
service from fleet_api.py: this one owns the site's only write surface to
shared infrastructure, so if it misbehaves it can't take the fleet data
feeds down with it.

  GET  /health        liveness + whether OLLAMA_URL is reachable.
  GET  /snapshot      live view: version, API latency, installed models
                      (/api/tags), resident models (/api/ps) with VRAM and
                      unload countdown, derived totals. ~5s TTL cache.
  GET  /history       sampled history from the in-memory ring (backed by
                      JSONL on disk): VRAM/latency series, residency spans,
                      load/unload/down-up events, uptime % over ?hours=24.
  GET  /show?model=   passthrough of Ollama's /api/show, 60s per-model cache.
  GET  /pull/status    progress of the single background pull, if any.
  POST /action        admin actions: unload | pull | delete. Guards: action
                      allowlist, strict model-name validation, per-IP and
                      global rate limits, 4096-byte body cap, single
                      concurrent pull, delete requires confirm == model.
                      Upstream URL is hardcoded, never shelled out.
  POST /chat          prompt playground proxy: non-streaming, message and
                      size caps, num_predict cap, long timeout. Returns the
                      reply plus token/duration stats -- the only place
                      per-request token counters are observable (Ollama only
                      reports them to the caller).

Run mode: loop forever (systemd gale-ollama-api.service). `--once` prints a
snapshot and exits (manual checks). No shell-outs, no secrets; the only
writes are the history JSONL (agent-owned /var/www/gale-api dir) and
in-memory state. Every counter on the dashboard page is sourced from the
server's own API or this sampler -- the page labels what is measured vs not.
"""
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import deque
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://192.168.1.197:11434").rstrip("/")
API_DIR = "/var/www/gale-api"
HISTORY_PATH = os.path.join(API_DIR, "ollama-history.jsonl")

SAMPLE_EVERY_S = 30
SNAPSHOT_TTL_S = 5
SHOW_TTL_S = 60
HISTORY_KEEP_LINES = 64000          # 14 days of 30s samples is ~40k
HISTORY_TRIM_EVERY_S = 6 * 3600
PULL_TIMEOUT_S = 3600               # pulls of large models can take a while
CHAT_TIMEOUT_S = 150
MAX_NUM_PREDICT = 2048
MAX_MESSAGES = 20
MAX_MESSAGE_CHARS = 8000
MODEL_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/:-]{0,95}$")

RATE_LIMITS = {                     # (max events, window seconds), per IP
    "action": (12, 60),
    "chat": (8, 60),
}
GLOBAL_RATE_LIMITS = {
    "action": (40, 60),
    "chat": (20, 60),
}


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_to_ts(s):
    try:
        # Ollama emits local-time ISO strings with offset; parse leniently
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


# --------------------------------------------------------------------------
# Upstream fetch helpers (urllib only, strict timeouts, no shell-outs)

def fetch_json(path, method="GET", body=None, timeout=10):
    """Returns (status, obj_or_None). Raises nothing; callers decide."""
    url = OLLAMA_URL + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            # /api/delete (and others) reply 200 with an empty body
            return resp.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read().decode("utf-8", "replace"))
        except Exception:
            payload = None
        return e.code, {"error": (payload or {}).get("error", str(e))}
    except Exception as e:
        return 0, {"error": f"{type(e).__name__}: {e}"}


def fetch_lines(path, body, timeout, on_line, stop_check=None):
    """POST and consume an NDJSON stream line by line via callback."""
    req = urllib.request.Request(
        OLLAMA_URL + path, data=json.dumps(body).encode(),
        method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            for raw in resp:
                if stop_check and stop_check():
                    return False
                raw = raw.decode("utf-8", "replace").strip()
                if raw:
                    try:
                        on_line(json.loads(raw))
                    except json.JSONDecodeError:
                        pass
            return True
    except urllib.error.HTTPError as e:
        on_line({"error": f"HTTP {e.code}"})
    except Exception as e:
        on_line({"error": f"{type(e).__name__}: {e}"})
    return False


# --------------------------------------------------------------------------
# Rate limiting -- sliding window, per IP, plus global caps

class RateLimiter:
    def __init__(self):
        self.lock = threading.Lock()
        self.hits = {}

    def allow(self, key, ip, max_events, window_s):
        now = time.monotonic()
        with self.lock:
            for k in ((key, ip), (key, "*global*")):
                dq = self.hits.setdefault(k, deque())
                while dq and now - dq[0] > window_s:
                    dq.popleft()
                if len(dq) >= max_events:
                    return False
            for k in ((key, ip), (key, "*global*")):
                self.hits[k].append(now)
            return True


RATES = RateLimiter()


# --------------------------------------------------------------------------
# Sampler -- the only writer of history; detects transitions as events

class Sampler:
    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()
        self.samples = deque(maxlen=HISTORY_KEEP_LINES)   # dicts
        self.events = deque(maxlen=4000)
        self.last_resident = set()
        self.last_reachable = None
        self.last_trim = 0.0
        self._load()

    def _load(self):
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        rec = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if "type" in rec:
                        self.events.append(rec)
                    else:
                        self.samples.append(rec)
                        # rebuild transition state so restarts don't emit
                        # spurious load/unload events
                        self.last_resident = set(rec.get("resident", []))
                        self.last_reachable = bool(rec.get("reachable"))
        except FileNotFoundError:
            pass

    def _trim(self):
        now = time.time()
        if now - self.last_trim < HISTORY_TRIM_EVERY_S:
            return
        self.last_trim = now
        try:
            os.makedirs(API_DIR, exist_ok=True)
            tmp = self.path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                for rec in list(self.samples) + list(self.events):
                    f.write(json.dumps(rec, separators=(",", ":")) + "\n")
            os.replace(tmp, self.path)
        except OSError:
            pass

    def sample_once(self):
        t0 = time.monotonic()
        vstatus, vobj = fetch_json("/api/version", timeout=8)
        latency_ms = round((time.monotonic() - t0) * 1000)
        reachable = vstatus == 200 and isinstance(vobj, dict) and "version" in vobj
        version = vobj.get("version") if reachable else None

        resident, vram = [], 0
        if reachable:
            _, pobj = fetch_json("/api/ps", timeout=8)
            for m in (pobj or {}).get("models", []):
                name = m.get("name") or m.get("model") or "?"
                resident.append(name)
                vram += int(m.get("size_vram") or 0)

        sample = {
            "ts": now_iso(),
            "reachable": reachable,
            "latency_ms": latency_ms,
            "version": version,
            "resident": resident,
            "vram_bytes": vram,
        }
        events = []
        with self.lock:
            if self.last_reachable is False and reachable:
                events.append({"ts": sample["ts"], "type": "server_up"})
            if self.last_reachable is True and not reachable:
                events.append({"ts": sample["ts"], "type": "server_down"})
            for name in resident:
                if name not in self.last_resident:
                    events.append({"ts": sample["ts"], "type": "load", "model": name})
            for name in self.last_resident:
                if name not in resident:
                    events.append({"ts": sample["ts"], "type": "unload", "model": name})
            self.last_resident = set(resident)
            self.last_reachable = reachable
            self.samples.append(sample)
            self.events.extend(events)
            os.makedirs(API_DIR, exist_ok=True)
            try:
                with open(self.path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(sample, separators=(",", ":")) + "\n")
                    for ev in events:
                        f.write(json.dumps(ev, separators=(",", ":")) + "\n")
            except OSError:
                pass
            self._trim()
        return sample

    def loop(self):
        while True:
            try:
                self.sample_once()
            except Exception as e:                     # never die sampling
                sys.stderr.write(f"[sampler] {type(e).__name__}: {e}\n")
            time.sleep(SAMPLE_EVERY_S)

    def window(self, hours):
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%SZ")
        with self.lock:
            samples = [s for s in self.samples if s.get("ts", "") >= cutoff]
            events = [e for e in self.events if e.get("ts", "") >= cutoff]
        return samples, events


SAMPLER = Sampler(HISTORY_PATH)


# --------------------------------------------------------------------------
# Snapshot + show caches

class Cache:
    def __init__(self, ttl):
        self.ttl = ttl
        self.lock = threading.Lock()
        self.at = 0.0
        self.data = None

    def get(self, builder):
        with self.lock:
            now = time.monotonic()
            if self.data is None or now - self.at > self.ttl:
                self.data = builder()
                self.at = now
            return self.data


def build_snapshot():
    snap = {
        "url": OLLAMA_URL,
        "generated_at": now_iso(),
        "reachable": False,
        "latency_ms": None,
        "version": None,
        "models": [],
        "resident": [],
        "vram_bytes": 0,
    }
    t0 = time.monotonic()
    vstatus, vobj = fetch_json("/api/version", timeout=8)
    snap["latency_ms"] = round((time.monotonic() - t0) * 1000)
    if not (vstatus == 200 and isinstance(vobj, dict)):
        snap["error"] = (vobj or {}).get("error", "unreachable")
        return snap
    snap["reachable"] = True
    snap["version"] = vobj.get("version")

    _, tobj = fetch_json("/api/tags", timeout=10)
    tags = (tobj or {}).get("models", []) if tobj else []
    _, pobj = fetch_json("/api/ps", timeout=10)
    ps = {m.get("name") or m.get("model"): m for m in (pobj or {}).get("models", [])}

    models, disk = [], 0
    for m in tags:
        name = m.get("name") or m.get("model") or "?"
        d = m.get("details", {}) or {}
        size = int(m.get("size") or 0)
        disk += size
        entry = {
            "name": name,
            "size_bytes": size,
            "modified_at": m.get("modified_at"),
            "digest": (m.get("digest") or "")[:12],
            "family": d.get("family"),
            "parameter_size": d.get("parameter_size"),
            "quantization_level": d.get("quantization_level"),
            "context_length": (d.get("context_length") or
                               ((m.get("model_info") or {}).get("general.context_length"))),
            "capabilities": m.get("capabilities") or [],
        }
        run = ps.get(name)
        if run:
            expires = iso_to_ts(run.get("expires_at")) if run.get("expires_at") else None
            # keep_alive:-1 (pin forever) yields a far-future expires_at --
            # anything past ~year 2100 is the sentinel, not a real countdown
            pinned = bool(expires and expires > 4102444800)
            entry["resident"] = True
            entry["pinned"] = pinned
            entry["size_vram_bytes"] = int(run.get("size_vram") or 0)
            entry["context_length_loaded"] = run.get("context_length")
            entry["expires_in_s"] = (max(0, round(expires - time.time()))
                                     if expires and not pinned else None)
        else:
            entry["resident"] = False
        models.append(entry)
    models.sort(key=lambda x: x["name"])
    snap["models"] = models
    snap["resident"] = list(ps.keys())
    snap["vram_bytes"] = sum(m.get("size_vram_bytes", 0) for m in models)
    snap["disk_bytes"] = disk
    return snap


SNAP = Cache(SNAPSHOT_TTL_S)
SHOWS = {}                                     # model -> Cache
SHOWS_LOCK = threading.Lock()


def show_cached(model):
    with SHOWS_LOCK:
        c = SHOWS.get(model)
        if c is None:
            c = Cache(SHOW_TTL_S)
            SHOWS[model] = c
            if len(SHOWS) > 64:                # keep the cache bounded
                SHOWS.pop(next(iter(SHOWS)))
    def build():
        status, obj = fetch_json("/api/show", method="POST", body={"model": model}, timeout=15)
        if status == 200:
            return {"ok": True, "model": model, "show": obj}
        return {"ok": False, "model": model, "error": (obj or {}).get("error", "unreachable")}
    return c.get(build)


# --------------------------------------------------------------------------
# Background pull -- single slot, progress polled from the page

PULL = {"state": "idle", "model": None, "pct": None, "status": "",
        "started_at": None, "finished_at": None, "error": None}
PULL_LOCK = threading.Lock()


def _pull_worker(model):
    def on_line(rec):
        if rec.get("error"):
            with PULL_LOCK:
                PULL["state"] = "failed"
                PULL["error"] = rec["error"]
                PULL["finished_at"] = now_iso()
            return
        total, done = rec.get("total"), rec.get("completed")
        pct = None
        if isinstance(total, int) and total > 0 and isinstance(done, int):
            pct = round(done / total * 100, 1)
        with PULL_LOCK:
            PULL["pct"] = pct
            PULL["status"] = rec.get("status", "")
    ok = fetch_lines("/api/pull", {"model": model, "stream": True}, PULL_TIMEOUT_S, on_line)
    with PULL_LOCK:
        if PULL["state"] != "failed":
            PULL["state"] = "done" if ok else "failed"
            if not ok and not PULL["error"]:
                PULL["error"] = "connection to Ollama dropped"
            PULL["finished_at"] = now_iso()


# --------------------------------------------------------------------------
# Endpoint bodies

def action_unload(model):
    # Empty-message chat with keep_alive:0 unloads without running inference
    # (same trick ollama_keepalive.sh uses in reverse).
    status, obj = fetch_json("/api/chat", method="POST",
                             body={"model": model, "messages": [], "keep_alive": 0},
                             timeout=60)
    if status == 200:
        return 200, {"ok": True, "action": "unload", "model": model}
    return 502, {"ok": False, "error": (obj or {}).get("error", "upstream error")}


def action_delete(model, confirm):
    if confirm != model:
        return 400, {"ok": False, "error": "delete requires confirm equal to the full model name"}
    status, obj = fetch_json("/api/delete", method="DELETE", body={"model": model}, timeout=60)
    if status == 200:
        return 200, {"ok": True, "action": "delete", "model": model}
    return 502, {"ok": False, "error": (obj or {}).get("error", "upstream error")}


def action_pull(model):
    with PULL_LOCK:
        if PULL["state"] in ("running",):
            return 409, {"ok": False, "error": f"pull of {PULL['model']} already running"}
        PULL.update({"state": "running", "model": model, "pct": None, "status": "starting",
                     "started_at": now_iso(), "finished_at": None, "error": None})
    threading.Thread(target=_pull_worker, args=(model,), daemon=True).start()
    return 202, {"ok": True, "action": "pull", "model": model, "state": "running"}


def chat_proxy(payload):
    model = payload.get("model")
    messages = payload.get("messages")
    if not isinstance(messages, list) or not messages:
        return 400, {"ok": False, "error": "messages must be a non-empty list"}
    if len(messages) > MAX_MESSAGES:
        return 400, {"ok": False, "error": f"max {MAX_MESSAGES} messages"}
    cleaned = []
    for m in messages:
        if not isinstance(m, dict):
            return 400, {"ok": False, "error": "each message must be an object"}
        role, content = m.get("role"), m.get("content")
        if role not in ("system", "user", "assistant"):
            return 400, {"ok": False, "error": "role must be system|user|assistant"}
        if not isinstance(content, str):
            return 400, {"ok": False, "error": "message content must be a string"}
        if len(content) > MAX_MESSAGE_CHARS:
            return 400, {"ok": False, "error": f"message content capped at {MAX_MESSAGE_CHARS} chars"}
        cleaned.append({"role": role, "content": content})
    snap = SNAP.get(build_snapshot)
    if not snap.get("reachable"):
        return 502, {"ok": False, "error": "Ollama unreachable"}
    if not any(m["name"] == model for m in snap["models"]):
        return 400, {"ok": False, "error": f"model {model} is not installed"}
    opts = payload.get("options") or {}
    options = {}
    if "temperature" in opts:
        try:
            options["temperature"] = max(0.0, min(2.0, float(opts["temperature"])))
        except (TypeError, ValueError):
            return 400, {"ok": False, "error": "temperature must be a number"}
    if "num_predict" in opts and opts["num_predict"] is not None:
        try:
            options["num_predict"] = max(1, min(MAX_NUM_PREDICT, int(opts["num_predict"])))
        except (TypeError, ValueError):
            return 400, {"ok": False, "error": "num_predict must be an integer"}
    body = {"model": model, "messages": cleaned, "stream": False}
    if options:
        body["options"] = options
    status, obj = fetch_json("/api/chat", method="POST", body=body, timeout=CHAT_TIMEOUT_S)
    if status != 200 or not isinstance(obj, dict):
        return 502, {"ok": False, "error": (obj or {}).get("error", "upstream error")}
    msg = obj.get("message", {})
    return 200, {
        "ok": True,
        "message": {"role": msg.get("role", "assistant"),
                    "content": msg.get("content", "")},
        "done_reason": obj.get("done_reason"),
        "stats": {
            "prompt_eval_count": obj.get("prompt_eval_count"),
            "eval_count": obj.get("eval_count"),
            "eval_duration_ns": obj.get("eval_duration"),
            "prompt_eval_duration_ns": obj.get("prompt_eval_duration"),
            "total_duration_ns": obj.get("total_duration"),
            "load_duration_ns": obj.get("load_duration"),
        },
    }


def history_envelope(hours):
    try:
        hours = max(1, min(336, int(hours)))
    except (TypeError, ValueError):
        hours = 24
    samples, events = SAMPLER.window(hours)
    step = max(1, (len(samples) + 1499) // 1500)
    series = samples[::step] if step > 1 else list(samples)
    reachable = [s for s in samples if s.get("reachable")]
    lat = sorted(s["latency_ms"] for s in reachable) if reachable else []
    def pct(p):
        if not lat:
            return None
        i = min(len(lat) - 1, max(0, round(p * (len(lat) - 1))))
        return lat[i]
    return {
        "schema": "ollama-history/v1",
        "hours": hours,
        "generated_at": now_iso(),
        "sample_every_s": SAMPLE_EVERY_S,
        "count": len(samples),
        "series": series,
        "events": list(events)[-200:],
        "uptime_pct": round(100 * len(reachable) / len(samples), 2) if samples else None,
        "latency_ms": {"p50": pct(0.5), "p95": pct(0.95), "last": samples[-1]["latency_ms"] if samples else None},
    }


# --------------------------------------------------------------------------
# HTTP service

class Handler(BaseHTTPRequestHandler):
    server_version = "gale-ollama-api/1"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _client_ip(self):
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def _rate_limited(self, kind):
        n, window = RATE_LIMITS[kind]
        gn, _ = GLOBAL_RATE_LIMITS[kind]
        if not RATES.allow(kind, self._client_ip(), n, window) or \
           not RATES.allow(kind + ":g", "*global*", gn, window):
            self._send(429, {"ok": False, "error": "rate limited"})
            return True
        return False

    def _read_json(self, cap=4096):
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > cap:
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return None

    def do_GET(self):
        parts = urlsplit(self.path)
        path, q = parts.path, parse_qs(parts.query)
        try:
            if path == "/health":
                _, obj = fetch_json("/api/version", timeout=4)
                ok = isinstance(obj, dict) and "version" in obj
                return self._send(200, {"ok": True, "ollama_reachable": ok,
                                        "generated_at": now_iso()})
            if path == "/snapshot":
                return self._send(200, SNAP.get(build_snapshot))
            if path == "/history":
                return self._send(200, history_envelope((q.get("hours") or [24])[0]))
            if path == "/show":
                model = (q.get("model") or [""])[0]
                if not MODEL_RE.match(model):
                    return self._send(400, {"ok": False, "error": "invalid model name"})
                return self._send(200, show_cached(model))
            if path == "/pull/status":
                with PULL_LOCK:
                    return self._send(200, dict(PULL))
            return self._send(404, {"error": "not found"})
        except Exception as e:
            return self._send(500, {"error": f"{type(e).__name__}: {e}"})

    def do_POST(self):
        path = urlsplit(self.path).path
        try:
            if path == "/chat":
                if self._rate_limited("chat"):
                    return
                payload = self._read_json()
                if payload is None:
                    return self._send(400, {"ok": False, "error": "JSON body up to 4096 bytes required"})
                code, resp = chat_proxy(payload)
                return self._send(code, resp)
            if path == "/action":
                if self._rate_limited("action"):
                    return
                payload = self._read_json()
                if payload is None:
                    return self._send(400, {"ok": False, "error": "JSON body up to 4096 bytes required"})
                action = payload.get("action")
                model = payload.get("model")
                if action not in ("unload", "pull", "delete"):
                    return self._send(400, {"ok": False, "error": "action must be unload|pull|delete"})
                if not isinstance(model, str) or not MODEL_RE.match(model):
                    return self._send(400, {"ok": False, "error": "invalid model name"})
                if action == "unload":
                    code, resp = action_unload(model)
                elif action == "delete":
                    code, resp = action_delete(model, payload.get("confirm"))
                else:
                    code, resp = action_pull(model)
                return self._send(code, resp)
            return self._send(404, {"error": "not found"})
        except Exception as e:
            return self._send(500, {"error": f"{type(e).__name__}: {e}"})


def main():
    if "--once" in sys.argv:
        print(json.dumps(SNAP.get(build_snapshot), indent=1))
        return
    os.makedirs(API_DIR, exist_ok=True)
    threading.Thread(target=SAMPLER.loop, daemon=True).start()
    srv = ThreadingHTTPServer(("127.0.0.1", 8794), Handler)
    srv.daemon_threads = True
    sys.stderr.write(f"ollama_api listening on 127.0.0.1:8794 (upstream {OLLAMA_URL}, started {now_iso()})\n")
    srv.serve_forever()


if __name__ == "__main__":
    main()
