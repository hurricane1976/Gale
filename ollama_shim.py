#!/usr/bin/env python3
"""ollama_shim.py -- compatibility shim between opencode (gale agents) and
the LAN Ollama server's OpenAI-compatible endpoint.

Bug (observed 2026-09-26..28 across 7+ agents, 14 failed wakings): Ollama
v0.34.4's /v1/chat/completions returns HTTP 500 "no user query found in
messages" whenever the messages array contains no role=="user" entry --
which opencode legitimately produces on tool-continuation turns (arrays of
assistant+tool only, e.g. after a tool-call round). opencode then retries
an identical, unfixable request 3x and the whole waking dies (verified:
[user,assistant,tool] -> 200; [assistant,tool] / [developer] /
[system,assistant,tool] -> 500).

This proxy listens on 127.0.0.1:11435 and forwards everything to
OLLAMA_URL unchanged, EXCEPT it repairs /v1/chat/completions and /api/chat
bodies that have no user message by appending {"role":"user",
"content":"Continue."} -- matching opencode's own synthetic continue-nudge
semantics, so tool-only turns proceed instead of 500ing.

Everything else (headers, paths, streaming SSE bodies) passes through
byte-for-byte. Responses are streamed (read->write->flush per chunk) so
SSE tokens reach opencode as they're generated; Connection: close + no
content-length keeps that honest for both JSON and SSE bodies.

Stdlib only, urllib upstream (house rule: no shell-outs). Run as
gale-ollama-shim.service. Agents' opencode.jsonc points at
http://127.0.0.1:11435/v1 instead of the server directly; the website's
own /api/ollama chat path is deliberately NOT routed through here.
"""
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

UPSTREAM = os.environ.get("OLLAMA_URL", "http://192.168.1.197:11434").rstrip("/")
LISTEN_PORT = int(os.environ.get("SHIM_PORT", "11435"))
LOG_PATH = os.environ.get("SHIM_LOG", "/home/agent/agent/logs/ollama_shim.log")
UPSTREAM_TIMEOUT = 900   # seconds; LLM generations legitimately run minutes
REPAIR_MESSAGE = {"role": "user", "content": "Continue."}
REPAIR_PATHS = ("/v1/chat/completions", "/api/chat")
DEBUG_500_PATH = os.environ.get("SHIM_DEBUG_500", "/home/agent/agent/logs/ollama_shim_last500.json")
_log_lock = threading.Lock()


def _content_to_text(content):
    """Ollama's /v1 layer only finds a 'user query' in string content. opencode
    sends OpenAI content-parts arrays ([{type:'text',text:...}]) and sometimes
    empty strings -- flatten parts to a single string so the template sees it."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for p in content:
            if isinstance(p, dict):
                if isinstance(p.get("text"), str):
                    parts.append(p["text"])
                elif p.get("type") == "text" and isinstance(p.get("content"), str):
                    parts.append(p["content"])
            elif isinstance(p, str):
                parts.append(p)
        return "".join(parts)
    if content is None:
        return ""
    return str(content)


def log(line):
    try:
        with _log_lock:
            with open(LOG_PATH, "a") as f:
                f.write(time.strftime("%Y-%m-%dT%H:%M:%SZ ", time.gmtime()) + line + "\n")
    except OSError:
        pass


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "gale-ollama-shim/1"

    def log_message(self, fmt, *args):
        pass  # request logging goes through log() only for repairs/errors

    def _repair_body(self, body):
        """Return (body, notes) for chat bodies Ollama's /v1 layer rejects:
        no user message, or user content hidden in parts arrays / empty."""
        notes = []
        try:
            payload = json.loads(body)
        except Exception:
            return body, notes
        if not isinstance(payload, dict) or not isinstance(payload.get("messages"), list):
            return body, notes
        msgs = payload["messages"]
        for m in msgs:
            if not isinstance(m, dict):
                continue
            if "tool_calls" in m and m.get("content") is None:
                m["content"] = ""  # some clients send content:null with tool_calls
            flat = _content_to_text(m.get("content"))
            if not isinstance(m.get("content"), str) or flat != (m.get("content") or ""):
                notes.append(f"flattened {m.get('role')} content")
                m["content"] = flat
        has_user = any(m.get("role") == "user" and (m.get("content") or "").strip()
                       for m in msgs if isinstance(m, dict))
        if not has_user:
            msgs.append(dict(REPAIR_MESSAGE))
            notes.append(f"appended user msg ({len(msgs) - 1} msgs before)")
        # Context-overflow guard. Root cause of the recurring "no user query
        # found in messages" 500s (2026-09-26..29): wakings that read several
        # large files exceed the model context; ollama's scheduler truncates
        # to fit and DROPS THE USER MESSAGE; the chat template then errors.
        # Estimate tokens at ~3.2 bytes/token (observed: the 40.5KB flip point
        # in a 110KB body) and trim the OLDEST large tool results first --
        # keep the 2 most recent (the ones the model is acting on) -- until
        # under budget. The model loses stale file dumps, keeps the thread.
        total_bytes = sum(len((m.get("content") or "")) for m in msgs if isinstance(m, dict))
        total_bytes += len(json.dumps(payload.get("tools") or []))
        # 2.6 bytes/token + 28K threshold: scaled to the 32768 model context
        # (raised 2026-10-06 after the 16K clip root cause was proven and the
        # server moved to OLLAMA_CONTEXT_LENGTH=32768; was 14K/16384).
        # Same method as before: calibrated on live failures where a 163KB
        # body overflowed 65536 real tokens (dumps 2026-09-29 11:36Z); trim
        # to fit 32K so ollama never truncates away the user message and 500s.
        if total_bytes / 2.6 > 28000:
            budget = 28000 * 2.6
            tool_idx = [i for i, m in enumerate(msgs)
                        if isinstance(m, dict) and m.get("role") == "tool"]
            protected = set(tool_idx[-2:])  # most recent tool results survive
            sizes = sorted((i for i in tool_idx if i not in protected),
                           key=lambda i: len(msgs[i].get("content") or ""), reverse=True)
            trimmed = 0
            for i in sizes:
                if total_bytes <= budget:
                    break
                ln = len(msgs[i].get("content") or "")
                msgs[i]["content"] = msgs[i]["content"][:400] + "\n...[trimmed by ollama_shim: context budget]..."
                total_bytes -= max(0, ln - 400)
                trimmed += 1
            if trimmed:
                notes.append(f"overflow-guard: trimmed {trimmed} old tool results "
                             f"(est {int(total_bytes / 2.6)} tokens)")
        if not notes:
            return body, notes
        log("; ".join(notes) + f" | roles={[m.get('role') for m in msgs]}")
        return json.dumps(payload).encode("utf-8"), notes

    def _dump_500(self, body):
        try:
            with open(DEBUG_500_PATH + ".tmp", "w") as f:
                f.write(body.decode("utf-8", "replace")[:200000])
            os.replace(DEBUG_500_PATH + ".tmp", DEBUG_500_PATH)
            log("upstream 500 -- body dumped to " + DEBUG_500_PATH)
        except Exception:
            pass

    def _proxy(self, method):
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        path = self.path
        if method == "POST" and any(path.startswith(p) for p in REPAIR_PATHS) and body:
            body, _ = self._repair_body(body)

        url = UPSTREAM + path
        req = urllib.request.Request(url, data=body, method=method)
        for h in ("Content-Type", "Accept", "Authorization"):
            v = self.headers.get(h)
            if v:
                req.add_header(h, v)
        if body is not None:
            req.add_header("Content-Length", str(len(body)))

        try:
            upstream = urllib.request.urlopen(req, timeout=UPSTREAM_TIMEOUT)
        except urllib.error.HTTPError as e:
            if e.code >= 500 and body and any(path.startswith(p) for p in REPAIR_PATHS):
                self._dump_500(body)  # capture the shape ollama still rejects
            upstream = e  # pass upstream 4xx/5xx through verbatim
        except Exception as e:
            log(f"upstream error on {method} {path}: {e!r}")
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            msg = json.dumps({"error": {"message": f"ollama_shim upstream: {e}"}}).encode()
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        try:
            self.send_response(upstream.status)
            ct = upstream.headers.get("Content-Type")
            if ct:
                self.send_header("Content-Type", ct)
            # stream without content-length: Connection close delimits the body,
            # which keeps SSE and JSON alike honest through the rewrite
            self.send_header("Connection", "close")
            self.close_connection = True
            self.end_headers()
            while True:
                chunk = upstream.read(4096)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass  # client (opencode) went away mid-stream
        finally:
            try:
                upstream.close()
            except Exception:
                pass

    def do_GET(self):
        self._proxy("GET")

    def do_POST(self):
        self._proxy("POST")

    def do_DELETE(self):
        self._proxy("DELETE")


def main():
    # SHIM_HOST: default loopback for the gale-agent agents; set 0.0.0.0 when
    # deployed LAN-side (josh-linux:11435) so off-box build clients can use it.
    host = os.environ.get("SHIM_HOST", "127.0.0.1")
    srv = ThreadingHTTPServer((host, LISTEN_PORT), Handler)
    sys.stderr.write(f"ollama_shim listening on {host}:{LISTEN_PORT} (upstream {UPSTREAM})\n")
    srv.serve_forever()


if __name__ == "__main__":
    main()
