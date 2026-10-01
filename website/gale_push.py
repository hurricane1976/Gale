#!/usr/bin/env python3
"""gale_push.py -- Web Push (VAPID) bridge for the site's PWA.

Subscriptions live in a small JSON file; a push is sent whenever the
fleet's alert envelope grows a NEW crit alert (deduped so a persisting
condition doesn't re-buzz every poll). Payload carries an alert count so
sw.js can badge the app icon (Badging API).

Endpoints (binds 127.0.0.1:8795, proxied at /api/push/ like every other
live backend):
  GET  /vapid-key   -> {"public": ...}    (page fetches before subscribing)
  POST /subscribe   {endpoint, keys{p256dh, auth}}   (from sw registration)
  POST /unsubscribe {endpoint}
  GET  /health

Push crypto: RFC 8291 (aes128gcm) + RFC 8292 (VAPID ES256), implemented on
the already-installed `cryptography` lib -- no new deps.

Run mode: loop forever (systemd gale-push.service). --once prints status.
"""
import base64
import json
import os
import struct
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, utils as asym_utils
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

VAPID_PATH = os.environ.get("GALE_VAPID", "/etc/gale-push/vapid.json")
SUBS_PATH = os.environ.get("GALE_PUSH_SUBS", "/etc/gale-push/subscriptions.json")
FLEET_API = os.environ.get("GALE_FLEET_API", "http://127.0.0.1:8793")
PORT = int(os.environ.get("GALE_PUSH_PORT", "8795"))
POLL_S = 30
PUSH_TTL = 3600
MAX_SUBS = 50

_subs_lock = threading.Lock()
_last_sent = set()          # fingerprints of crit alerts already pushed
_last_test = 0.0            # manual-test throttle


def b64u(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64u_dec(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def load_vapid():
    with open(VAPID_PATH) as f:
        d = json.load(f)
    return d["public"], d["private"], d.get("subject", "mailto:gale@localhost")


def load_subs():
    try:
        with open(SUBS_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_subs(subs):
    tmp = SUBS_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(subs[:MAX_SUBS], f, indent=1)
    os.replace(tmp, SUBS_PATH)


def log(msg):
    sys.stderr.write(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] {msg}\n")


# ---- RFC 8291/8292 ----
def hkdf(salt, ikm, info, length):
    import hashlib, hmac
    prk = hmac.new(salt, ikm, hashlib.sha256).digest()
    okm, t, i = b"", b"", 1
    while len(okm) < length:
        t = hmac.new(prk, t + info + bytes([i]), hashlib.sha256).digest()
        okm += t
        i += 1
    return okm[:length]


def vapid_auth(endpoint, pub_b64, priv_b64, subject):
    """ES256 JWS over {aud, exp, sub}, key id = the public key itself."""
    priv = ec.derive_private_key(int.from_bytes(b64u_dec(priv_b64), "big"), ec.SECP256R1())
    aud = "/".join(endpoint.split("/")[:3])
    claims = json.dumps({"aud": aud, "exp": int(time.time()) + 12 * 3600,
                         "sub": subject}).encode()
    header = json.dumps({"typ": "JWT", "alg": "ES256", "kid": pub_b64}).encode()
    signing = b64u(header) + "." + b64u(claims)
    der_sig = priv.sign(signing.encode(), ec.ECDSA(hashes.SHA256()))
    r, s = asym_utils.decode_dss_signature(der_sig)
    jose_sig = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return f"vapid t={signing}.{b64u(jose_sig)}, k={pub_b64}"


# ---- delivery metrics (textfile -> node-exporter -> Prometheus) -------------
# "sent" = push service returned a code; "receipt" = the device's service worker
# actually ran the push event and beaconed /receipt. sent - receipts over a
# window is the real delivery-loss signal (iOS accepts with 201 then may drop).
# Counters persist across restarts in a small JSON file.
PUSH_PROM = os.environ.get("PUSH_TEXTFILE", "/var/snap/node-exporter/common/gale_push.prom")
PUSH_STATE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".push_metrics.json")
_mlock = threading.Lock()
try:
    _m = json.load(open(PUSH_STATE))
except Exception:
    _m = {}
_m.setdefault("sent", {}); _m.setdefault("receipts", 0)
_m.setdefault("last_send", 0); _m.setdefault("last_receipt", 0)
_m.setdefault("lat_sum", 0.0); _m.setdefault("lat_n", 0)


def metrics_flush():
    try:
        subs = len(load_subs())
    except Exception:
        subs = 0
    L = ["# TYPE gale_push_sent_total counter"]
    L += [f'gale_push_sent_total{{code="{c}"}} {n}' for c, n in sorted(_m["sent"].items())]
    L += ["# TYPE gale_push_receipts_total counter", f'gale_push_receipts_total {_m["receipts"]}',
          "# TYPE gale_push_last_send_unixtime gauge", f'gale_push_last_send_unixtime {_m["last_send"]}',
          "# TYPE gale_push_last_receipt_unixtime gauge", f'gale_push_last_receipt_unixtime {_m["last_receipt"]}',
          "# TYPE gale_push_receipt_latency_seconds_sum counter", f'gale_push_receipt_latency_seconds_sum {_m["lat_sum"]:.3f}',
          "# TYPE gale_push_receipt_latency_seconds_count counter", f'gale_push_receipt_latency_seconds_count {_m["lat_n"]}',
          "# TYPE gale_push_subscriptions gauge", f"gale_push_subscriptions {subs}"]
    try:
        tmp = PUSH_PROM + ".tmp"
        with open(tmp, "w") as f:
            f.write("\n".join(L) + "\n")
        os.replace(tmp, PUSH_PROM)
        json.dump(_m, open(PUSH_STATE, "w"))
    except OSError as e:
        sys.stderr.write(f"push metrics write failed: {e}\n")


def metrics_sent(code):
    with _mlock:
        _m["sent"][str(code)] = _m["sent"].get(str(code), 0) + 1
        _m["last_send"] = int(time.time())
        metrics_flush()


def metrics_receipt():
    with _mlock:
        now = time.time()
        _m["receipts"] += 1
        if _m["last_send"] and 0 <= now - _m["last_send"] < 3600:   # latency vs most recent send
            _m["lat_sum"] += now - _m["last_send"]; _m["lat_n"] += 1
        _m["last_receipt"] = int(now)
        metrics_flush()



def push_one(sub, payload, vapid):
    """Encrypt+send one JSON payload via the reference pywebpush library.
    (A hand-rolled RFC 8291/8292 impl produced records Apple queued with
    201 but Safari couldn't decrypt -- push event never fired. The library
    is the ground truth; venv at /opt/gale-push-venv.)"""
    endpoint = sub["endpoint"]
    auth_header = vapid_auth(endpoint, *vapid)
    script = (
        "import json,sys\n"
        "from pywebpush import webpush\n"
        "sub = json.loads(sys.argv[1])\n"
        "data = json.loads(sys.argv[2])\n"
        "auth = sys.argv[3]\n"
        "ttl = sys.argv[4]\n"
        "resp = webpush(subscription_info=sub, data=data,\n"
        "    vapid_claims=None if False else None,\n"
        "    **{}) if False else None\n"
    )
    # call the reference library in-process; venv site-packages appended to
    # sys.path if the system python doesn't have it
    try:
        from pywebpush import webpush as _wp  # noqa: F401
    except ImportError:
        import glob as _glob
        for sp in sorted(_glob.glob("/opt/gale-push-venv/lib/python3*/site-packages"), reverse=True):
            if sp not in sys.path:
                sys.path.insert(0, sp)
        try:
            from pywebpush import webpush as _wp  # noqa: F401
        except ImportError as e:
            log(f"pywebpush unavailable: {e}")
            return 0
    try:
        resp = _wp(
            subscription_info={"endpoint": endpoint, "keys": sub["keys"]},
            data=payload,
            vapid_private_key=vapid[1],
            vapid_claims={"sub": vapid[2], "aud": "/".join(endpoint.split("/")[:3]),
                          "exp": int(time.time()) + 12 * 3600},
            headers={"TTL": str(PUSH_TTL), "Urgency": "high"},
        )
        metrics_sent(resp.status_code)
        return resp.status_code
    except Exception as e:
        code = getattr(getattr(e, "response", None), "status_code", 0)
        metrics_sent(code or "err")
        log(f"push to {endpoint[:60]}… failed: {type(e).__name__}: {str(e)[:150]}")
        return code


def alert_fingerprint(a):
    return f'{a.get("sev")}|{a.get("kind")}|{a.get("text", "")[:120]}'


def poll_and_push(vapid):
    global _last_sent
    try:
        with urllib.request.urlopen(FLEET_API + "/alerts", timeout=20) as r:
            env = json.load(r)
    except Exception as e:
        log(f"alerts poll failed: {type(e).__name__}: {e}")
        return
    crits = [a for a in (env.get("alerts") or []) if a.get("sev") == "crit"]
    fps = {alert_fingerprint(a) for a in crits}
    fresh = fps - _last_sent
    _last_sent = fps
    if not fresh:
        return
    with _subs_lock:
        subs = load_subs()
    if not subs:
        log(f"{len(fresh)} new crit alert(s), but no subscriptions yet")
        return
    count = len(env.get("alerts") or [])
    def _local_agent(a):
        # the wake action only makes sense for agents that live on this host
        # (fleet_api's wake allowlist rejects the rest anyway)
        if a.get("kind") != "agent-missed-wake":
            return None
        w = (a.get("text") or "").split(" ", 1)[0].lower()
        return w if w.isalpha() and os.path.isdir(f"/home/agent/{w}") else None
    worst = next(a for a in crits if alert_fingerprint(a) in fresh)
    body = json.dumps({
        "title": "GALE — fleet alert",
        "body": worst.get("text", "")[:200],
        "sev": "crit",
        "count": count,
        "url": "/status.html",
        # optional extras the service worker turns into action buttons
        **({"agent": _local_agent(worst)} if _local_agent(worst) else {}),
        **({"runbook": worst["runbook"]} if isinstance(worst.get("runbook"), str)
           and worst["runbook"].startswith("/") else {}),
    }).encode()
    dead = []
    for sub in subs:
        code = push_one(sub, body, vapid)
        if code in (404, 410):
            dead.append(sub["endpoint"])
        log(f"push {code} -> {sub['endpoint'][:60]}…")
    if dead:
        with _subs_lock:
            save_subs([s for s in load_subs() if s["endpoint"] not in dead])
        log(f"pruned {len(dead)} dead subscription(s)")


# ---- HTTP surface ----
class Handler(BaseHTTPRequestHandler):
    server_version = "gale-push/1"

    def log_message(self, fmt, *args):
        pass

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            return None
        if n <= 0 or n > 4096:
            return None
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return None

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == "/vapid-key":
            pub, _, _ = load_vapid()
            return self._send(200, {"public": pub})
        if path == "/health":
            return self._send(200, {"ok": True, "subscriptions": len(load_subs()),
                                    "watching": sorted(_last_sent)})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        path = urlsplit(self.path).path
        if path == "/receipt":
            # sw-side push receipt: did the device's service worker even see
            # the push event? Separates "delivery to device" from "SW ran".
            payload = self._read_json()
            if payload:
                log(f"PUSH RECEIPT: {payload}")
                if payload.get("seen"):
                    metrics_receipt()
            return self._send(200, {"ok": True})
        if path == "/diag":
            # device-side sw diagnostic from the page (best-effort, no auth
            # beyond tailnet locality): version + push-handler flag.
            payload = self._read_json()
            if payload:
                log(f"device diag: {payload}")
            return self._send(200, {"ok": True})
        if path == "/test":
            # operator self-service: push a test notification to every
            # subscription. Global 30s throttle -- tailnet-only anyway.
            global _last_test
            now = time.time()
            if now - _last_test < 30:
                return self._send(429, {"ok": False,
                                        "error": f"wait {int(30 - (now - _last_test))}s between tests"})
            _last_test = now
            payload = json.dumps({
                "title": "GALE — test alert",
                "body": "Test of the fleet push channel at "
                        + time.strftime("%H:%M:%SZ", time.gmtime()),
                "sev": "crit", "count": 1, "url": "/status.html",
            }).encode()
            vapid = load_vapid()
            results = [(s["endpoint"][:60], push_one(s, payload, vapid))
                       for s in load_subs()]
            log(f"manual test push: {results}")
            ok = any(code == 201 for _, code in results)
            return self._send(200 if ok else 502,
                              {"ok": ok, "results": results})
        if path not in ("/subscribe", "/unsubscribe"):
            return self._send(404, {"error": "not found"})
        payload = self._read_json()
        if not payload or not isinstance(payload.get("endpoint"), str) \
                or not payload["endpoint"].startswith("https://") \
                or not isinstance(payload.get("keys"), dict) \
                or not payload["keys"].get("p256dh") or not payload["keys"].get("auth"):
            return self._send(400, {"ok": False, "error": "need {endpoint: https-only, keys: {p256dh, auth}}"})
        with _subs_lock:
            subs = load_subs()
            if path == "/subscribe":
                if not any(s["endpoint"] == payload["endpoint"] for s in subs):
                    subs.append({"endpoint": payload["endpoint"], "keys": payload["keys"],
                                 "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
                save_subs(subs)
                return self._send(200, {"ok": True, "subscribed": len(subs)})
            subs2 = [s for s in subs if s["endpoint"] != payload["endpoint"]]
            save_subs(subs2)
            return self._send(200, {"ok": True, "subscribed": len(subs2)})


def main():
    vapid = load_vapid()
    if "--once" in sys.argv:
        poll_and_push(vapid)
        return
    def loop():
        while True:
            poll_and_push(vapid)
            time.sleep(POLL_S)
    threading.Thread(target=loop, daemon=True).start()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    srv.daemon_threads = True
    log(f"gale-push listening on 127.0.0.1:{PORT} ({len(load_subs())} subscriptions)")
    srv.serve_forever()


if __name__ == "__main__":
    main()
