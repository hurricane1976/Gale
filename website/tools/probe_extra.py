#!/usr/bin/env python3
"""Direct reachability probes that do not depend on the Beacon relay.

* peers: plain TCP connect to one registered peer port per remote address
  (connect + close only: no request is sent, nothing on the remote host is read
  or changed). Separates "host unreachable" from "telemetry relay stale".
* services: HTTP/TCP health of the local Zabbix / NetBox / Grafana / Kuma /
  Loki / Alertmanager stack, which the Prometheus rules otherwise cannot see.

Writes /var/www/gale-api/probes.json (site) and the node_exporter textfile
gale_probe.prom (rules in monitoring/gale-probe.rules.yml). Run from cron.
"""
import json
import os
import socket
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
API = Path(os.environ.get('GALE_API_DIR', '/var/www/gale-api'))
TEXTFILE = os.environ.get('PROBE_TEXTFILE', '/var/snap/node-exporter/common/gale_probe.prom')
ROSTER = SITE.parent / 'fleet-provision/roster.json'

SERVICES = [  # name, kind, target, ok-statuses
    ('netbox', 'http', 'http://127.0.0.1:8092/login/', (200, 302)),
    ('zabbix', 'http', 'http://127.0.0.1:8091/', (200, 302)),
    ('grafana', 'http', 'http://127.0.0.1:3001/api/health', (200,)),
    ('kuma', 'http', 'http://127.0.0.1:3002/', (200, 302)),
    ('loki', 'http', 'http://127.0.0.1:3100/metrics', (200,)),
    ('alertmanager', 'http', 'http://127.0.0.1:9093/-/healthy', (200,)),
]


def tcp(item):
    host, addr, port = item
    start = time.time()
    try:
        with socket.create_connection((addr, port), timeout=3):
            ok = True
    except OSError:
        ok = False
    return {'host': host, 'addr': addr, 'port': port, 'ok': ok, 'ms': int((time.time() - start) * 1000)}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def http(item):
    name, _kind, url, good = item
    start = time.time()
    opener = urllib.request.build_opener(NoRedirect)
    try:
        code = opener.open(url, timeout=5).status
    except urllib.error.HTTPError as e:
        code = e.code
    except OSError:
        code = 0
    return {'name': name, 'url': url, 'code': code, 'ok': code in good, 'ms': int((time.time() - start) * 1000)}


def peer_targets():
    agents = json.loads(ROSTER.read_text())['agents']
    first = {}
    for a in agents:
        if a['host'] == 'gale':
            continue
        first.setdefault((a['host'], a['addr']), int(a.get('port', 8787)))
    return [(h, addr, port) for (h, addr), port in sorted(first.items())]


def main():
    with ThreadPoolExecutor(max_workers=8) as pool:
        peers = list(pool.map(tcp, peer_targets()))
        services = list(pool.map(http, SERVICES))
    now = int(time.time())
    out = {'checked_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now)), 'peers': peers, 'services': services}
    API.mkdir(parents=True, exist_ok=True)
    tmp = API / 'probes.json.tmp'
    tmp.write_text(json.dumps(out))
    os.chmod(tmp, 0o644)
    os.replace(tmp, API / 'probes.json')
    lines = ['# TYPE gale_peer_reach gauge']
    lines += [f'gale_peer_reach{{fleet_host="{p["host"]}",addr="{p["addr"]}"}} {int(p["ok"])}' for p in peers]
    lines += ['# TYPE gale_local_service_up gauge']
    lines += [f'gale_local_service_up{{service="{s["name"]}"}} {int(s["ok"])}' for s in services]
    lines += ['# TYPE gale_probe_run_unixtime gauge', f'gale_probe_run_unixtime {now}']
    tmpf = TEXTFILE + '.tmp'
    try:
        Path(tmpf).write_text('\n'.join(lines) + '\n')
        os.chmod(tmpf, 0o644)
        os.replace(tmpf, TEXTFILE)
    except OSError as e:
        print(f'probe_extra: textfile not written: {e}')
    print(f'probes: {sum(p["ok"] for p in peers)}/{len(peers)} peers, {sum(s["ok"] for s in services)}/{len(services)} services')


if __name__ == '__main__':
    main()
