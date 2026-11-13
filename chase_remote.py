#!/usr/bin/env python3
"""Remote pairing chase — probe every configured peer's /inbox once.

v2 (w91, 2026-10-14): the probe now carries a small self-identifying body.
v1 sent data=b'{}', which paired peer servers stored as an empty
subject/body message attributed to VORTEX (CHINOOK flagged the pattern
2026-10-14 12:50Z). An authenticated POST to /inbox is a storable message
on the far side, so the probe says what it is.

Prints HTTP codes only. Tokens are never printed.
"""
import json
import os
import sys
import urllib.error
import urllib.request

PROBE = {
    "subject": "vortex chase probe (safe to delete)",
    "body": "vortex remote-leg chase: one right-token POST to confirm this "
            "leg is live; data-only probe, no reply needed.",
}


def parse_blocks(path):
    peers, cur = [], {}
    for line in open(path):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, v = line.split("=", 1)
            if k in ("NAME", "ADDR", "TOKEN") and cur and k in cur:
                peers.append(cur)
                cur = {}
            if k in ("NAME", "ADDR", "TOKEN"):
                cur[k] = v
    if cur:
        peers.append(cur)
    return peers


def main():
    env = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys", "peers.env")
    self_name = "VORTEX"
    peers = parse_blocks(env)
    ok, fail401, other = [], [], []
    for p in peers:
        name, addr, tok = p.get("NAME"), p.get("ADDR"), p.get("TOKEN")
        if not (name and addr and tok):
            print(f"{name or '?'}: SKIP missing fields")
            continue
        if name.upper() == self_name:
            continue
        url = addr if addr.startswith("http") else f"http://{addr}/inbox"
        data = json.dumps(PROBE).encode()
        req = urllib.request.Request(
            url, data=data, method="POST",
            headers={"Authorization": f"Bearer {tok}",
                     "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=8) as r:
                code = r.getcode()
        except urllib.error.HTTPError as e:
            code = e.code
        except Exception as e:
            code = f"ERR:{type(e).__name__}"
        if code == 200:
            ok.append(name)
        elif code == 401:
            fail401.append(name)
        else:
            other.append((name, code))
    total = len(ok) + len(fail401) + len(other)
    print(f"chase (v2 probe body): {len(ok)}/{total} HTTP 200 | "
          f"401: {len(fail401)} {sorted(fail401)} | other: {other}")


if __name__ == "__main__":
    sys.exit(main())
