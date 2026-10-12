#!/usr/bin/env python3
"""Discover responding tailnet node exporters without enabling bogus targets.

No installs or configuration changes on remote hosts. Registry peers without
an exporter are recorded as uninstrumented in exporter-coverage.json.
"""
import concurrent.futures
import json
import os
import re
from datetime import datetime, timezone
from urllib.parse import urlencode
import urllib.request
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
PROMETHEUS = os.environ.get('PROMETHEUS_URL', 'http://127.0.0.1:9090').rstrip('/')


def scrape_state():
    """Return the latest Prometheus up value by canonical exporter address.

    A failed Prometheus read is represented as unknown; discovery remains
    useful and never converts a missing query result into a failed scrape.
    """
    checked_at = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    try:
        params = urlencode({'query': 'up{job="fleet-node"}'})
        query = urllib.request.Request(
            f'{PROMETHEUS}/api/v1/query?{params}',
            headers={'Accept': 'application/json'})
        with urllib.request.urlopen(query, timeout=4) as response:
            payload = json.load(response)
        values = {}
        for row in payload.get('data', {}).get('result', []):
            labels = row.get('metric', {})
            address = labels.get('host') or labels.get('instance', '').split(':')[0]
            sample = row.get('value') or [None, None]
            try:
                values[address] = int(float(sample[1]))
            except (TypeError, ValueError, IndexError):
                continue
        return values, checked_at
    except (OSError, ValueError, KeyError, TypeError):
        return None, checked_at


def probe(item):
    host, ip = item
    try:
        with urllib.request.urlopen(f'http://{ip}:9100/metrics', timeout=3) as response:
            text = response.read(2_000_000).decode()
        name = re.search(r'node_uname_info\{[^}]*nodename="([^"]*)"', text)
        boot = re.search(r'^node_boot_time_seconds (\S+)', text, re.M)
        mem = re.search(r'^node_memory_MemTotal_bytes (\S+)', text, re.M)
        # several tailnet addresses can front one machine (Beacon): same
        # hostname + boot time + RAM means same box, so scrape it once
        fp = '|'.join(m.group(1) if m else '' for m in (name, boot, mem)) if name else None
        return {'host': host, 'address': ip, 'instrumented': 'node_uname_info{' in text,
                'machine': name.group(1) if name else None, 'fingerprint': fp}
    except OSError:
        return {'host': host, 'address': ip, 'instrumented': False}


def main():
    registry = json.loads((SITE.parent / 'fleet-provision/roster.json').read_text())
    nodes = sorted({(a['host'], a['addr']) for a in registry['agents'] if a['host'] != 'gale'})
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        states = list(pool.map(probe, nodes))
    current_scrapes, checked_at = scrape_state()
    discovered_at = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    for row in states:
        row['discovered_at'] = discovered_at
        row['scrape_checked_at'] = checked_at
        row['scrape_up'] = current_scrapes.get(row['address']) if current_scrapes is not None else None
    primary = {}
    for r in states:
        if not r['instrumented']:
            continue
        fp = r.get('fingerprint') or r['address']
        if fp in primary:
            r['alias_of'] = primary[fp]['address']
        else:
            primary[fp] = r
    targets = [{'targets': [r['address'] + ':9100'],
                'labels': {'host': r['address'], 'fleet_host': r['host'], 'machine': r.get('machine') or r['address']}}
               for r in primary.values()]
    for r in states:
        r.pop('fingerprint', None)
    out = Path(os.environ.get('EXPORTER_TARGETS', '/var/snap/prometheus/common/fleet-discovery/targets.json'))
    out.with_suffix('.tmp').write_text(json.dumps(targets, indent=2))
    os.replace(out.with_suffix('.tmp'), out)
    coverage = Path(os.environ.get('EXPORTER_COVERAGE', '/var/www/gale-api/exporter-coverage.json'))
    coverage.write_text(json.dumps({'nodes': states}, indent=2))
    print(f'exporter discovery: {len(targets)} machine(s) scraped, {sum(r["instrumented"] for r in states)}/{len(states)} addresses answering')


if __name__ == '__main__':
    main()
