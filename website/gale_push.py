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


def push_one(sub, payload, vapid):
    """Encrypt+send one JSON payload to one subscription. Returns HTTP code."""
    endpoint = sub["endpoint"]
    p256dh = b64u_dec(sub["keys"]["p256dh"])
    auth = b64u_dec(sub["keys"]["auth"])

    server_key = ec.generate_private_key(ec.SECP256R1())
    client_pub = ec.EllipticCurvePublicKey.from_encoded_point(
        ec.SECP256R1(), p256dh)
    shared = server_key.exchange(ec.ECDH(), client_pub)
    server_pub = server_key.public_key().public_bytes(
        Encoding.X962, PublicFormat.UncompressedPoint)

    salt = os.urandom(16)
    ikm = hkdf(salt, shared, b"WebPush: info\x00" + p256dh + server_pub, 32)
    cek = hkdf(salt, ikm, b"Content-Encoding: aes128gcm\x00", 16)
    nonce = hkdf(salt, ikm, b"Content-Encoding: nonce\x00", 12)

    ciphertext = AESGCM(cek).encrypt(nonce, payload + b"\x02", None)
    # aes128gcm record: rs(4BE) | salt(16) | idhlen(1) | idh | ciphertext
    record = struct.pack(">I", 4096) + salt + bytes([len(server_pub)]) + server_pub + ciphertext

    headers = {
        "Authorization": vapid_auth(endpoint, *vapid),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "TTL": str(PUSH_TTL),
        "Urgency": "high",
    }
    req = urllib.request.Request(endpoint, data=record, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        log(f"push to {endpoint[:60]}… failed: {type(e).__name__}: {e}")
        return 0


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
    worst = next(a for a in crits if alert_fingerprint(a) in fresh)
    body = json.dumps({
        "title": "GALE — fleet alert",
        "body": worst.get("text", "")[:200],
        "sev": "crit",
        "count": count,
        "url": "/status.html",
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
