#!/usr/bin/env bash
# Deploys website/ to the local nginx docroot and reloads.
# /var/www/gale is outside this repo (nginx runs as www-data, which can't
# traverse into /home/agent's 750 permissions) -- this script is the only
# link between the two, same role as Beacon's website/deploy.sh.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Canary + auto-rollback (improvements #17): every deploy snapshots the live
# docroot to /var/www/gale-releases/<timestamp> (keeps 5), runs the fast
# smoke gates post-reload, and restores the snapshot on failure.
# `./deploy.sh --rollback` restores the newest snapshot without deploying.
RELEASES="/var/www/gale-releases"
KEEP_RELEASES=5
if [ "${1:-}" = "--rollback" ]; then
  # NB: plain `last=$(sudo ls ...)` dies here -- pipefail promotes sudo's
  # nonzero (missing dir) through the substitution under set -e.
  last=""
  if sudo test -d "$RELEASES"; then
    last="$(sudo ls -1 "$RELEASES" | sort -r | head -1)"
  fi
  [ -n "$last" ] || { echo "deploy: no releases to roll back to"; exit 1; }
  echo "deploy: rolling back to $last"
  sudo rm -rf /var/www/gale
  sudo cp -r "$RELEASES/$last" /var/www/gale
  sudo chown -R www-data:www-data /var/www/gale
  sudo systemctl reload nginx
  echo "Rolled back to $last. http://100.66.39.59:8090/"
  exit 0
fi

# Bundle+minify the page scripts (npm run build / build.mjs). Pages load
# dist/<name>.js; the raw *.js in the repo are still deployed too, since
# 404.html imports shared.js directly via an inline <script type=module>
# esbuild never sees (not one of its declared entry points).
# npm may be absent on this host (bare node) -- build.mjs is the same work.
if command -v npm >/dev/null 2>&1; then
  ( cd "$SCRIPT_DIR" && npm run build )
else
  ( cd "$SCRIPT_DIR" && node build.mjs )
fi

# deploy.sh is usually invoked under sudo, which would leave dist/ (and
# node_modules caches) root-owned and break the next plain `npm run build`.
# Hand the build output back to the invoking user.
if [ -n "${SUDO_USER:-}" ]; then
  sudo chown -R "$SUDO_USER:" "$SCRIPT_DIR/dist"
fi

# CSP inline-script drift gate (review 2026-10-11 #6): gale-sec.conf pins the
# four static inline bootstraps by content hash. Any edit to an inline
# <script> without a matching conf update breaks scripts site-wide, loudly.
# Verify the SOURCE tree's inline hashes against the live conf BEFORE
# snapshotting/copying anything, so a drift aborts with a message instead
# of shipping a self-bricking deploy (the csp browser gate would catch it
# post-reload, but failing fast here keeps the docroot untouched).
python3 - "$SCRIPT_DIR" <<'PY' || exit 1
import base64, hashlib, re, sys
from pathlib import Path
root = Path(sys.argv[1])
conf_hashes = set(re.findall(r"'sha256-([^']+)'", Path("/etc/nginx/snippets/gale-sec.conf").read_text()))
missing = []
for html in sorted(root.glob("*.html")):
    for m in re.finditer(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html.read_text(), re.S):
        body = m.group(1)
        if not body.strip():
            continue
        h = base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
        if h not in conf_hashes:
            missing.append(f"{html.name}: sha256-{h}")
if missing:
    print("deploy: CSP HASH DRIFT -- inline <script> not pinned in gale-sec.conf:")
    print("\n".join(f"  {x}" for x in missing))
    print("Add the hash(es) to script-src in /etc/nginx/snippets/gale-sec.conf (and the repo template), then redeploy.")
    sys.exit(1)
print(f"deploy: CSP inline hashes pinned ({len(conf_hashes)} in conf)")
PY

sudo mkdir -p /var/www/gale "$RELEASES"
if [ -d /var/www/gale/dist ]; then
  snap="$RELEASES/$(date -u +%Y%m%dT%H%M%SZ)"
  echo "deploy: snapshotting live docroot to $snap"
  sudo cp -r /var/www/gale "$snap"
  sudo ls -1 "$RELEASES" | sort -r | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
    sudo rm -rf "$RELEASES/$old"
  done
fi
sudo mkdir -p /var/www/gale
# Hashed stylesheets (gale.<hash>.css etc, minted by rewrite-dist-refs.mjs)
# have the same merge hazard as dist/: `cp *.css` merges, so every deploy
# orphans the previous hashes (~120 stale files observed 2026-10-11). Remove
# old hashed copies before copying the fresh unhashed originals; the rewriter
# mints exactly one hash per name afterwards.
sudo rm -f /var/www/gale/gale.*.css /var/www/gale/mobile.*.css \
  /var/www/gale/fleet-tidal.*.css /var/www/gale/cinematic.*.css \
  /var/www/gale/storm-scene.*.css /var/www/gale/fonts.*.css
# Same merge hazard for hashed scripts (rum.<hash>.js etc, review #7).
sudo rm -f /var/www/gale/rum.*.js /var/www/gale/boot-shared.*.js \
  /var/www/gale/lost-boot.*.js /var/www/gale/runbooks-steps.*.js
sudo cp -r "$SCRIPT_DIR"/*.html "$SCRIPT_DIR"/*.css "$SCRIPT_DIR"/*.js "$SCRIPT_DIR"/*.json /var/www/gale/
# dist/ has content-hashed chunk filenames (esbuild code splitting) -- `cp -r`
# into an existing dist/ *merges*, so a stale hashed chunk from a previous
# build never gets removed. Replace the whole directory instead.
sudo rm -rf /var/www/gale/dist
sudo cp -r "$SCRIPT_DIR"/dist /var/www/gale/
# Sourcemaps are a debug artifact: they double dist transfer size and expose
# source. Never serve them from the docroot (review 2026-10-11 #3).
sudo rm -f /var/www/gale/dist/*.map /var/www/gale/dist/chunks/*.map
sudo cp "$SCRIPT_DIR"/robots.txt /var/www/gale/ 2>/dev/null || true
sudo cp "$SCRIPT_DIR"/manifest.json /var/www/gale/ 2>/dev/null || true
for icon in favicon.ico apple-touch-icon.png apple-touch-icon-precomposed.png icon-192.png icon-512.png icon-512-maskable.png; do
  sudo cp "$SCRIPT_DIR/$icon" /var/www/gale/ 2>/dev/null || true
done
# assets/ merges like dist/ did: a removed source image (storm-hero.jpg,
# 291 KB orphan found 2026-10-11) lingered in the docroot for weeks. Replace
# the whole directory instead, like dist/ and pwa-screenshots/.
sudo rm -rf /var/www/gale/assets
sudo cp -r "$SCRIPT_DIR"/assets /var/www/gale/
# PWA install screenshots live in pwa-screenshots/ (referenced by
# manifest.json). They were never copied, so prod served 404s for both
# (review 2026-10-11 #2). Ship them like assets/.
sudo rm -rf /var/www/gale/pwa-screenshots
sudo cp -r "$SCRIPT_DIR"/pwa-screenshots /var/www/gale/ 2>/dev/null || true
# files that no longer exist in the repo shouldn't linger in the docroot
# (My Home tab removed 2026-10-14: home.html/js + voice/home-presence modules)
for stale in app.js style.css home.html home.js voice-home.js home-presence-nav.js; do sudo rm -f "/var/www/gale/$stale" "/var/www/gale/$stale.br" "/var/www/gale/$stale.gz"; done
# Entry bundles are content-hashed (dist/main-<hash>.js) so a stale cached
# entry can never import a deleted chunk -- the observability page-break fix.
# build.mjs wrote the stable->hashed map to dist/.entry-manifest.json; the HTML
# <script src> and sw.js SHELL_ASSETS still say the STABLE name (repo source
# stays unbundled). Rewrite those refs in the DEPLOYED copy to the exact
# hashed files that ship for this build. Runs before chown so the edits land
# www-data-owned. If this fails, set -e aborts BEFORE the smoke gate, so a
# half-rewritten docroot never gets served.
if [ ! -f "$SCRIPT_DIR/dist/.entry-manifest.json" ]; then
  echo "deploy: ERROR -- dist/.entry-manifest.json missing; build did not emit it" >&2
  exit 1
fi
sudo /usr/bin/node "$SCRIPT_DIR/tools/rewrite-dist-refs.mjs" \
  --root /var/www/gale --manifest "$SCRIPT_DIR/dist/.entry-manifest.json"
sudo chown -R www-data:www-data /var/www/gale
sudo chmod -R 755 /var/www/gale
# pass #5 #77: precompressed brotli+gzip twins next to every text asset —
# nginx brotli_static/gzip_static serve them without per-request CPU. The
# docroot already has brotli_static on (conf.d/gale-compress.conf), so from
# this deploy on the static files actually exist for it to find.
sudo /usr/bin/env bash -c '
  set -e
  cd /var/www/gale
  found=0
  for f in *.html *.css *.js *.json manifest.json sw.js dist/*.js dist/chunks/*.js; do
    [ -f "$f" ] || continue
    case "$f" in *.br|*.gz) continue ;; esac
    if command -v brotli >/dev/null 2>&1; then brotli -q 7 -c "$f" > "$f.br" 2>/dev/null && found=1 || rm -f "$f.br"; fi
    gzip -9 -c "$f" > "$f.gz" 2>/dev/null && found=1 || rm -f "$f.gz"
  done
  [ "$found" = 1 ] && echo "deploy: precompressed $(find . -name "*.br" | wc -l) .br / $(find . -name "*.gz" | wc -l) .gz assets"
'
# precompressed twins must be readable too
sudo chown -R www-data:www-data /var/www/gale
sudo chmod -R 755 /var/www/gale
sudo nginx -t
# Best-effort 10 min Alertmanager silence for the synthetic-probe alerts so a
# normal deploy blip (GaleSynthFailing fired 2026-10-02 18:31-18:40) does not
# page. Never fails the deploy; it expires on its own.
python3 - <<'PY' || true
import json, urllib.request, datetime as d
now = d.datetime.now(d.timezone.utc)
body = {"matchers": [{"name": "alertname", "value": "GaleSynthFailing|GaleSynthStale", "isRegex": True, "isEqual": True}],
        "startsAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endsAt": (now + d.timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "createdBy": "deploy.sh", "comment": "website deploy window"}
try:
    urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:9093/api/v2/silences", json.dumps(body).encode(),
                           {"Content-Type": "application/json"}), timeout=3)
except Exception as e:
    print("deploy: alert silence skipped:", e)
PY
sudo systemctl reload nginx
# post-deploy gates: fast smoke (render + schema + xss, audit skipped for
# speed -- full audit stays in CI/manual smoke runs). Failure restores the
# pre-deploy snapshot taken above and reloads again.
# NB: smoke.sh writes /tmp/*-out.txt; under sudo those would land root-owned
# and break the next unprivileged smoke run (this exact failure rolled back
# a good deploy on 2026-09-28). Clear them first, hand them back after.
sudo rm -f /tmp/render-test-out.txt /tmp/gale-xss-out.txt /tmp/gale-audit-out.txt /tmp/gale-deploy-smoke.txt
if SKIP_AUDIT=1 bash "$SCRIPT_DIR/smoke.sh" > /tmp/gale-deploy-smoke.txt 2>&1; then
  if [ -n "${SUDO_USER:-}" ]; then
    sudo chown "$SUDO_USER:" /tmp/gale-deploy-smoke.txt /tmp/render-test-out.txt /tmp/gale-xss-out.txt 2>/dev/null || true
  fi
  tail -2 /tmp/gale-deploy-smoke.txt
else
  echo "deploy: post-deploy smoke FAILED -- rolling back"
  tail -8 /tmp/gale-deploy-smoke.txt
  bash "$0" --rollback
  exit 1
fi
echo "Deployed. http://100.66.39.59:8090/"
