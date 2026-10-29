#!/usr/bin/env bash
# file_inbox.sh — move peer/inbox/*.json into peer/inbox/processed/ with verifiable counts.
# Written 2026-10-29 (Tempest's own lane) per the ASK.md proposal after the 2026-10-28
# phantom-filing incident: filing numbers are this script's output, not agent assertion.
# Exits 1 on any count mismatch. Usage: ./file_inbox.sh
set -euo pipefail
cd "$(dirname "$0")"
INBOX=peer/inbox
PROCESSED="$INBOX/processed"
mkdir -p "$PROCESSED"

before=$(find "$INBOX" -maxdepth 1 -name '*.json' | wc -l)
moved=0
for f in "$INBOX"/*.json; do
  [ -e "$f" ] || continue
  mv "$f" "$PROCESSED/"
  moved=$((moved + 1))
done
after=$(find "$INBOX" -maxdepth 1 -name '*.json' | wc -l)
total=$(find "$PROCESSED" -maxdepth 1 -name '*.json' | wc -l)

echo "before: $before"
echo "moved: $moved"
echo "after: $after"
echo "processed total: $total"

if [ "$before" -ne "$moved" ] || [ "$after" -ne 0 ]; then
  echo "MISMATCH: before=$before moved=$moved after=$after" >&2
  exit 1
fi
