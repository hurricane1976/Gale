#!/usr/bin/env bash
# restore_drill.sh -- monthly backup-restorability drill (improvements #15).
# Extracts Tramontane's newest backup to a temp dir and verifies: gzip
# integrity, expected top-level files, file count floor, and that no
# non-example keys/ material leaked in (backup.sh excludes secrets by
# default-deny). Writes a JSON verdict to /var/www/gale-api/restore-drill.json
# (surfaced on the status hygiene panel + strip alerts) and posts failures
# to the agora board. Read-only except those two outputs.
#
# Suggested cron (agent user, first Sunday 10:00 UTC):
#   0 10 1-7 * 0 [ "$(date -u +\%u)" = "7" ] && /home/agent/agent/website/tools/restore_drill.sh
set -u
BACKUP_DIR="/home/agent/tramontane/backups"
OUT_JSON="/var/www/gale-api/restore-drill.json"
AGORA="http://127.0.0.1:8793/agora/posts"

fail() { echo "restore_drill: FAIL: $1"; }

newest="$(ls -1t "$BACKUP_DIR"/tramontane-*.tar.gz 2>/dev/null | head -1)"
[ -n "$newest" ] || { fail "no backups found"; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
gzip -t "$newest" || { fail "gzip integrity: $newest"; exit 1; }
tar -xzf "$newest" -C "$tmp" || { fail "extract: $newest"; exit 1; }

checks=0; problems=""
need=(AGENT.md NOTES.md)
for f in "${need[@]}"; do
  checks=$((checks + 1))
  [ -e "$tmp/$f" ] || [ -e "$tmp/./$f" ] || problems="$problems missing:$f;"
done
nfiles="$(find "$tmp" -type f | wc -l)"
checks=$((checks + 1))
[ "$nfiles" -ge 20 ] || problems="$problems few-files:$nfiles;"
leaked="$(cd "$tmp" && ls keys/ 2>/dev/null | grep -v '\.example$' || true)"
checks=$((checks + 1))
[ -z "$leaked" ] || problems="$problems secret-leak:${leaked};"

ok="true"; [ -z "$problems" ] || ok="false"
python3 - "$OUT_JSON" "$newest" "$ok" "$checks" "$problems" "$nfiles" <<'EOF'
import json, sys, os, time
from datetime import datetime, timezone
path, newest, ok, checks, problems, nfiles = sys.argv[1:7]
doc = {"ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
       "backup": os.path.basename(newest),
       "ok": ok == "true", "checks": int(checks), "files": int(nfiles),
       "problems": problems or None}
tmp = path + ".tmp"
open(tmp, "w").write(json.dumps(doc, indent=1))
os.replace(tmp, path)
print("restore_drill: wrote %s ok=%s checks=%s files=%s %s" % (path, ok, checks, nfiles, problems or ""))
EOF

if [ "$ok" = "false" ]; then
  msg="restore drill FAILED on $(basename "$newest"): ${problems}. Backup age is visible; restorability was not."
  python3 - "$AGORA" "$msg" <<'EOF'
import json, sys, urllib.request
url, msg = sys.argv[1], sys.argv[2]
body = json.dumps({"agent": "Gale", "message": msg}).encode()
req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
try:
    print("restore_drill: agora posted (HTTP %s)" % urllib.request.urlopen(req, timeout=15).status)
except Exception as e:
    print("restore_drill: agora POST failed: %r" % e)
EOF
fi
[ "$ok" = "true" ]
