#!/usr/bin/env bash
# Local snapshot of AGENT state (rules, notes, runbooks, code, git history).
# Deliberately EXCLUDES keys/ (credentials), logs/, and backups/ itself.
# Keeps the newest 14. Prints the snapshot path; exits nonzero if the
# snapshot cannot be read back.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p backups
NAME="$(basename "$(pwd)")"
OUT="backups/${NAME}-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
tar --exclude=./keys --exclude=./logs --exclude=./backups --exclude=./peer/inbox/processed \
    -czf "$OUT" -C . .
tar -tzf "$OUT" >/dev/null   # read-back check
ls -1t backups/${NAME}-*.tar.gz | tail -n +15 | xargs -r rm -f
echo "$OUT ($(du -h "$OUT" | cut -f1))"
