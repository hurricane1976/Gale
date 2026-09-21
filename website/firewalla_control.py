#!/usr/bin/env python3
"""firewalla_control.py -- backend for the ops dashboard's Firewall panel.

Binds to 127.0.0.1 only; nginx proxies /api/firewalla/ to it (see the
`location /api/firewalla/` block added to /etc/nginx/sites-available/gale).
That split matters even though the dashboard itself has no login: it means
the FIREWALLA_PAT never has to live in a process listening directly on the
tailnet, and never reaches the browser -- only these narrow routes do, and
only over the same tailnet-reachable origin as the rest of the site. Per
the operator's explicit call, these routes carry no auth of their own
beyond that.

Routes (all JSON):
  GET  /status                    -- box + device + rule snapshot
  POST /rules/<id>/pause
  POST /rules/<id>/resume
  POST /devices/<mac>/block       -- creates a bidirectional internet-block
                                      rule scoped to that device
  POST /devices/<mac>/unblock     -- pauses any active internet-block rule(s)
                                      scoped to that device (never deletes)

Run: systemd unit gale-firewalla.service. Manual: `./firewalla_control.py`.
"""
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from firewalla import FirewallaClient, FirewallaError

BIND_HOST = os.environ.get("FIREWALLA_CONTROL_BIND", "127.0.0.1")
BIND_PORT = int(os.environ.get("FIREWALLA_CONTROL_PORT", "8791"))

RULE_ID_RE = re.compile(r"\A[A-Za-z0-9:_-]{1,128}\Z")
MAC_RE = re.compile(r"\A[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}\Z")

client = FirewallaClient()
_box_gid = None


def box_gid():
    global _box_gid
    if _box_gid:
        return _box_gid
    boxes = client.boxes()
    if not boxes:
        raise FirewallaError("no boxes visible to this token")
    _box_gid = boxes[0]["gid"]
    return _box_gid


def device_block_rule_ids(gid, mac):
    """Active rules that fully block internet for this device -- i.e. what
    the dashboard's own Block button creates. Used by Unblock so it only
    ever touches rules of that specific shape, never an unrelated rule that
    happens to share the device."""
    out = []
    for r in client.rules(gid):
        if r.get("status") != "active":
            continue
        if (r.get("target") or {}).get("type") != "internet":
            continue
        scope = r.get("scope") or {}
        if scope.get("type") == "device" and scope.get("value", "").upper() == mac.upper():
            out.append(r["id"])
    return out


class Handler(BaseHTTPRequestHandler):
    server_version = "gale-firewalla/1.0"

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _error(self, code, message):
        self._json(code, {"ok": False, "error": message})

    def log_message(self, fmt, *args):
        sys.stderr.write(f"firewalla_control: {self.address_string()} {fmt % args}\n")

    def do_GET(self):
        if self.path != "/status":
            return self._error(404, "not found")
        try:
            gid = box_gid()
            self._json(200, {
                "ok": True,
                "box": client.boxes()[0],
                "devices": client.devices(gid),
                "rules": client.rules(gid),
            })
        except FirewallaError as e:
            self._error(502, str(e))

    def do_POST(self):
        parts = [p for p in self.path.split("/") if p]
        try:
            if len(parts) == 3 and parts[0] == "rules" and parts[2] in ("pause", "resume"):
                rule_id = parts[1]
                if not RULE_ID_RE.match(rule_id):
                    return self._error(400, "bad rule id")
                fn = client.pause_rule if parts[2] == "pause" else client.resume_rule
                self._json(200, {"ok": True, "result": fn(rule_id)})
            elif len(parts) == 3 and parts[0] == "devices" and parts[2] in ("block", "unblock"):
                mac = parts[1]
                if not MAC_RE.match(mac):
                    return self._error(400, "bad mac address")
                gid = box_gid()
                if parts[2] == "block":
                    self._json(200, {"ok": True, "result": client.block_device(gid, mac)})
                else:
                    ids = device_block_rule_ids(gid, mac)
                    for rid in ids:
                        client.pause_rule(rid)
                    self._json(200, {"ok": True, "paused_rule_ids": ids})
            else:
                self._error(404, "not found")
        except FirewallaError as e:
            self._error(502, str(e))


def main():
    if not client.configured:
        sys.exit("keys/firewalla.env not configured -- copy firewalla.env.example and fill it in.")
    httpd = ThreadingHTTPServer((BIND_HOST, BIND_PORT), Handler)
    print(f"firewalla_control listening on {BIND_HOST}:{BIND_PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
