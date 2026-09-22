#!/usr/bin/env bash
# Local snapshot of AGENT state (rules, notes, runbooks, code, git history).
# Deliberately EXCLUDES logs/ and backups/ itself. For keys/: every file
# EXCEPT *.example is excluded (default-deny, so future secret files are
# never included by accident). The example templates are placeholder-only
# and are tracked in git -- excluding them made bare restores show
# "D keys/*.example" (dirty tree, commits blocked). Verified no secrets.
# Keeps the newest 14. Prints the snapshot path; exits nonzero if the
# snapshot cannot be read back.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p backups
NAME="$(basename "$(pwd)")"
OUT="backups/${NAME}-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
tar --exclude=./logs --exclude=./backups --exclude=./peer/inbox/processed \
    $(cd keys 2>/dev/null && ls | grep -v '\.example$' | sed 's|^|--exclude=./keys/|') \
    -czf "$OUT" -C . .
tar -tzf "$OUT" >/dev/null   # read-back check
ls -1t backups/${NAME}-*.tar.gz | tail -n +15 | xargs -r rm -f
echo "$OUT ($(du -h "$OUT" | cut -f1))"
