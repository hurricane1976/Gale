#!/usr/bin/env python3
"""Verify local agent archives and restore critical files into isolation.

Proof hashes use the archive as the baseline; this does not claim the archive
matches subsequently changed production files. Never extracts arbitrary paths.
"""
import gzip
import hashlib
import json
import os
import sys
import tarfile
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fleet_monitor import registry, timestamp


def check(agent):
    directory = Path('/home/agent') / ('agent' if agent['name'] == 'gale' else agent['name'])
    archives = list((directory/'backups').glob('*.tar.gz'))
    if not archives:
        return {'agent': agent['name'], 'host': 'gale', 'state': 'unknown', 'reason': 'no archive'}
    archive = max(archives, key=lambda p:p.stat().st_mtime)
    proof = {'agent': agent['name'], 'host': 'gale', 'archive': archive.name,
             'archive_age_h': round((time.time()-archive.stat().st_mtime)/3600, 2),
             'verified_at': timestamp(time.time()), 'hash_baseline': 'archive bytes', 'state': 'failed'}
    try:
        # Consume compressed bytes to EOF, validating CRC/truncation.
        with gzip.open(archive, 'rb') as stream:
            while stream.read(1024 * 1024):
                pass
        hashes = {}
        with tarfile.open(archive) as tar, tempfile.TemporaryDirectory(prefix='gale-restore-proof-') as temp:
            members = {m.name.removeprefix('./'):m for m in tar.getmembers()}
            for filename in ('AGENT.md', 'NOTES.md'):
                member = members.get(filename)
                if member is None or not member.isfile() or member.size > 10_000_000:
                    raise ValueError('critical file missing or invalid')
                content = tar.extractfile(member).read()
                expected = hashlib.sha256(content).hexdigest()
                restored = Path(temp)/filename
                restored.write_bytes(content)
                if hashlib.sha256(restored.read_bytes()).hexdigest() != expected:
                    raise ValueError('restore hash mismatch')
                hashes[filename] = expected
            # Names only, never read secret material.
            leaked = any(name.startswith('keys/') and m.isfile() and not name.endswith('.example') for name,m in members.items())
            if leaked:
                raise ValueError('archive includes credential material')
        proof.update(state='passed', hashes=hashes, checks=4)
    except (OSError, ValueError, tarfile.TarError, EOFError):
        proof.update(reason='archive integrity, critical file, or credential exclusion check failed')
    return proof


def main():
    rows = [check(a) for a in registry()['agents'] if a['host'] == 'gale' and a['lifecycle'] == 'active']
    output = Path(os.environ.get('BACKUP_PROOF_OUT', '/var/www/gale-api/backup-proof.json'))
    temp = output.with_suffix('.tmp')
    temp.write_text(json.dumps({'generated_at':timestamp(time.time()),'host':'gale','agents':rows},indent=2))
    os.replace(temp,output)
    print(f'backup proof: {sum(r["state"]=="passed" for r in rows)}/{len(rows)} local agents pass; remote proof not supplied')
    return 1 if any(r['state']=='failed' for r in rows) else 0


if __name__ == '__main__':
    sys.exit(main())
