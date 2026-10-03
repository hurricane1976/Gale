#!/usr/bin/env python3
"""Discover responding tailnet node exporters without enabling bogus targets.

No installs or configuration changes on remote hosts. Registry peers without
an exporter are recorded as uninstrumented in exporter-coverage.json.
"""
import concurrent.futures
import json
import os
import re
import urllib.request
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent


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
