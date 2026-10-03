"""Cached public AirNow reporting-area observations; no API credentials."""
import math
import threading
import time
import urllib.request
from datetime import datetime, timezone

URL = 'https://files.airnowtech.org/airnow/today/reportingarea.dat'
_lock = threading.Lock()
_cache = {'at': 0, 'rows': []}
ZONES = {'EST': -5, 'EDT': -4, 'CST': -6, 'CDT': -5, 'MST': -7, 'MDT': -6,
         'PST': -8, 'PDT': -7, 'AKST': -9, 'AKDT': -8, 'HST': -10, 'AST': -4, 'ADT': -3}

def parse_rows(text):
    from datetime import timedelta
    rows = []
    for line in text.splitlines():
        f = line.split('|')
        if len(f) < 17 or f[5] != 'O':
            continue
        try:
            lat, lon, aqi = float(f[9]), float(f[10]), int(f[12])
            zone = ZONES[f[3]]
            observed = datetime.strptime(f[1] + ' ' + f[2], '%m/%d/%y %H:%M').replace(tzinfo=timezone(timedelta(hours=zone)))
            rows.append({'area': f[7], 'state': f[8], 'lat': lat, 'lon': lon, 'pollutant': f[11],
                         'aqi': aqi, 'category': f[13], 'agency': f[16],
                         'observed_at': observed.astimezone(timezone.utc).isoformat()})
        except (ValueError, KeyError):
            continue
    return rows

def distance(lat, lon, row):
    a, b = math.radians(lat), math.radians(row['lat'])
    dlat, dlon = b-a, math.radians(row['lon']-lon)
    h = math.sin(dlat/2)**2 + math.cos(a)*math.cos(b)*math.sin(dlon/2)**2
    return 6371*2*math.asin(min(1, math.sqrt(h)))

def airnow(lat, lon):
    if not math.isfinite(lat) or not math.isfinite(lon) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
        raise ValueError('Invalid coordinates')
    error = False
    with _lock:
        if time.time() - _cache['at'] > 600:
            try:
                req = urllib.request.Request(URL, headers={'User-Agent': 'GaleWeather/1.0'})
                with urllib.request.urlopen(req, timeout=12) as r:
                    raw = r.read(4_000_001)
                if len(raw) > 4_000_000:
                    raise ValueError('Feed exceeds size limit')
                rows = parse_rows(raw.decode('utf-8'))
                if not rows:
                    raise ValueError('No observations')
                _cache.update(at=time.time(), rows=rows)
            except (OSError, ValueError):
                error = True
        rows, collected = list(_cache['rows']), _cache['at']
    candidates = [(distance(lat, lon, r), r) for r in rows]
    candidates = [(d, r) for d, r in candidates if d <= 100]
    if not candidates:
        return {'state': 'unavailable' if error else 'no_coverage', 'source': 'AirNow', 'readings': []}
    _, nearest = min(candidates, key=lambda x: x[0])
    matches = [(d, r) for d, r in candidates if (r['area'],r['state']) == (nearest['area'],nearest['state'])]
    readings = [{**r, 'distance_km': round(d, 1), 'stale': time.time()-datetime.fromisoformat(r['observed_at']).timestamp()>10800} for d, r in matches]
    return {'state': 'stale' if error or any(r['stale'] for r in readings) else 'ok', 'source': 'AirNow',
            'collected_at': datetime.fromtimestamp(collected, timezone.utc).isoformat(), 'readings': readings}
