#!/usr/bin/env python3
"""Read-only vault audit: find pair tokens reused across different pairs.

Prints pair names and sha256 prefixes only, never token values.
Exit 1 if any token is shared by more than one pair.
"""
import collections, hashlib, json, os, sys

vault = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vault", "tokens.json")
pairs = json.load(open(vault))["pairs"]
groups = collections.defaultdict(list)
for name, rec in pairs.items():
    tok = rec.get("token")
    if tok:
        groups[hashlib.sha256(tok.encode()).hexdigest()[:12]].append(name)
dups = {h: sorted(p) for h, p in groups.items() if len(p) > 1}
print(f"{len(pairs)} pairs, {len(dups)} shared-token groups")
for h, p in sorted(dups.items()):
    print(f"  {h}: {', '.join(p)}")
sys.exit(1 if dups else 0)
