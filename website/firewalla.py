#!/usr/bin/env python3
"""firewalla.py -- thin client for the Firewalla MSP API (docs.firewalla.net).

Shared by sysmon.py (read-only, for the dashboard's status snapshot) and
firewalla_control.py (read+write, for the dashboard's admin buttons).
Credentials come from keys/firewalla.env -- see firewalla.env.example --
same pattern as keys/telegram.env: never committed, never logged, never
printed, never sent anywhere but the configured MSP domain.

This is a cloud API (v2.firewalla.net-style per-MSP-domain), not a local-LAN
one: the PAT is account-wide and can reach every box on the account.
"""
import json
import os
import time
import urllib.error
import urllib.request

KEYS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "keys", "firewalla.env"
)


def _load_env(path=KEYS_PATH):
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    except OSError:
        pass
    return env


class FirewallaError(Exception):
    def __init__(self, message, retry_after=None):
        super().__init__(message)
        # Seconds the server asked us to wait before retrying (HTTP 429
        # Retry-After / error payload). None when the server gave no hint.
        self.retry_after = retry_after


class FirewallaClient:
    def __init__(self):
        env = _load_env()
        self.domain = env.get("FIREWALLA_MSP_DOMAIN", "")
        self.token = env.get("FIREWALLA_PAT", "")

    @property
    def configured(self):
        return bool(self.domain and self.token)

    def _request(self, method, path, body=None, timeout=6):
        if not self.configured:
            raise FirewallaError("keys/firewalla.env not configured")
        url = f"https://{self.domain}{path}"
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Token {self.token}")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            # 429s carry a Retry-After (seconds); honor it on the retry path.
            retry_after = None
            ra = e.headers.get("Retry-After")
            if ra is not None:
                try:
                    retry_after = int(ra)
                except ValueError:
                    pass
            raise FirewallaError(f"{method} {path} -> HTTP {e.code}: {detail}",
                                 retry_after=retry_after if e.code == 429 else None)
        except urllib.error.URLError as e:
            raise FirewallaError(f"{method} {path} -> {e.reason}")

    # ---- read ----

    def boxes(self):
        return self._request("GET", "/v2/boxes")

    def devices(self, gid):
        return self._request("GET", f"/v2/devices?box={gid}")

    def rules(self, gid):
        d = self._request("GET", f"/v2/rules?box={gid}")
        return d.get("results", d) if isinstance(d, dict) else d

    def flows(self, gid, query, limit=10):
        """Search flows (docs: /api-reference/flow + search.md qualifiers).
        VPN tunnel traffic is derived here rather than from a dedicated VPN
        endpoint -- the MSP API exposes no VPN-specific one (verified against
        the live API and the published docs, 2026-09-22)."""
        from urllib.parse import quote
        d = self._request("GET", f"/v2/flows?query={quote(query)}&box={gid}&limit={limit}")
        return d.get("results", []) if isinstance(d, dict) else []

    # ---- write ----

    def pause_rule(self, rule_id):
        return self._request("POST", f"/v2/rules/{rule_id}/pause")

    def resume_rule(self, rule_id):
        return self._request("POST", f"/v2/rules/{rule_id}/resume")

    def block_device(self, gid, mac, notes="Blocked from Gale ops dashboard"):
        """Create a full block-internet rule scoped to one device (both
        directions). Reversible via pause_rule/resume_rule on the id this
        returns -- never deletes anything."""
        body = {
            "action": "block",
            "direction": "bidirection",
            "gid": gid,
            "notes": notes,
            "target": {"type": "internet"},
            "scope": {"type": "device", "value": mac},
        }
        return self._request("POST", "/v2/rules", body)
