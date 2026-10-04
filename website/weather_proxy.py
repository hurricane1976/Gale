"""GALE — weather upstream proxy (open-meteo) with cache + stale-on-error.

The weather page used to fetch api.open-meteo.com directly from each
visitor's browser. Behind one shared egress (a hospital NAT, a kiosk farm)
that is exactly how an API's per-IP rate limit gets hit: every device in
the building is one client. Fetching server-side collapses all visitors
into at most one upstream request per TTL, keeps the tailnet URL out of
third-party logs (no Referer leaves the box), and lets us serve STALE data
through upstream outages instead of 503ing the board.

House rules mirrored from weather_data.py: tiny state, one lock, failures
never crash the caller. `_http` is a module function so tests can patch it.

fetch(kind, params) -> (status, obj, stale_age_s)
  kind: "forecast" | "airquality" | "geocode"  (fixed upstream path each)
  params: dict of query params; only allowlisted keys are forwarded, and
  latitude/longitude are rounded to 2 decimals for the cache key (the
  forecast grid is coarser than that anyway).
"""

import json
import threading
import time
import urllib.parse
import urllib.request

_UPSTREAMS = {
    "forecast": "https://api.open-meteo.com/v1/forecast",
    "airquality": "https://air-quality-api.open-meteo.com/v1/air-quality",
    "geocode": "https://geocoding-api.open-meteo.com/v1/search",
}
_TTL_S = {"forecast": 600, "airquality": 900, "geocode": 86400}
_ALLOWED = {
    "forecast": {"latitude", "longitude", "current", "hourly", "daily",
                 "temperature_unit", "wind_speed_unit", "timezone", "forecast_days"},
    "airquality": {"latitude", "longitude", "current", "timezone"},
    "geocode": {"name", "count", "language", "format"},
}
_TIMEOUT_S = 10

_cache = {}      # key -> {"at": epoch, "obj": parsed json}
_lock = threading.Lock()
_inflight = {}   # key -> Event; one upstream fetch per key at a time


def _http(url, timeout):
    """Returns (status, parsed_json_or_None). Raises nothing."""
    req = urllib.request.Request(url, headers={"User-Agent": "gale-fleet-weather/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            try:
                return r.status, json.loads(r.read().decode("utf-8", "replace"))
            except Exception:
                return r.status, None
    except Exception as e:
        return 0, {"error": f"{type(e).__name__}: {e}"}


def _quantized(params):
    """(lat, lon) as strings rounded to 2 decimals (~1km); falls back to the
    raw strings for non-numeric input."""
    try:
        return str(round(float(params.get("latitude", "")), 2)), str(round(float(params.get("longitude", "")), 2))
    except (TypeError, ValueError):
        return str(params.get("latitude", "")), str(params.get("longitude", ""))


def _key(kind, params):
    lat, lon = _quantized(params)
    rest = "&".join(f"{k}={params[k]}" for k in sorted(params) if k not in ("latitude", "longitude"))
    return f"{kind}?{lat},{lon};{rest}"


def fetch(kind, params, now=None):
    """(status, obj, stale_age_s). 200 = fresh-or-stale data, 502 = upstream
    down and nothing cached at all. Never raises."""
    if kind not in _UPSTREAMS:
        return 400, {"error": f"unknown weather kind '{kind}'"}, None
    clean = {k: str(v)[:200] for k, v in params.items() if k in _ALLOWED[kind] and str(v).strip()}
    if "latitude" in clean and "longitude" in clean:
        clean["latitude"], clean["longitude"] = _quantized(clean)
    key = _key(kind, clean)
    now = time.time() if now is None else now
    ttl = _TTL_S[kind]

    owner = False
    with _lock:
        hit = _cache.get(key)
        if hit and now - hit["at"] < ttl:
            return 200, hit["obj"], 0
        ev = _inflight.get(key)
        if ev is None:
            ev = threading.Event()
            _inflight[key] = ev
            owner = True
    if not owner:
        ev.wait(_TIMEOUT_S + 2)               # owner is fetching; share its result
        with _lock:
            hit = _cache.get(key)
        if hit and now - hit["at"] < ttl:
            return 200, hit["obj"], 0
        # still nothing fresh: fall through to one bounded attempt of our own

    status, obj = _http(f"{_UPSTREAMS[kind]}?{urllib.parse.urlencode(clean)}", _TIMEOUT_S)
    ok = status == 200 and isinstance(obj, dict) and "error" not in obj
    stale_age = None
    with _lock:
        if ok:
            _cache[key] = {"at": now, "obj": obj}
            stale_age = 0
        else:
            hit = _cache.get(key)             # expired but present: stale beats 503
            if hit:
                obj, stale_age = hit["obj"], max(0, int(now - hit["at"]))
        if owner:
            _inflight.pop(key, None)
            ev.set()                          # wake waiters to re-check or self-fetch
    if not ok and stale_age is None:
        return 502, {"error": f"weather upstream unavailable (HTTP {status})"}, None
    return 200, obj, (stale_age or 0)
