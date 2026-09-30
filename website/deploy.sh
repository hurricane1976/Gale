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
( cd "$SCRIPT_DIR" && npm run build )

# deploy.sh is usually invoked under sudo, which would leave dist/ (and
# node_modules caches) root-owned and break the next plain `npm run build`.
# Hand the build output back to the invoking user.
if [ -n "${SUDO_USER:-}" ]; then
  sudo chown -R "$SUDO_USER:" "$SCRIPT_DIR/dist"
fi

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
sudo cp -r "$SCRIPT_DIR"/*.html "$SCRIPT_DIR"/*.css "$SCRIPT_DIR"/*.js /var/www/gale/
# dist/ has content-hashed chunk filenames (esbuild code splitting) -- `cp -r`
# into an existing dist/ *merges*, so a stale hashed chunk from a previous
# build never gets removed. Replace the whole directory instead.
sudo rm -rf /var/www/gale/dist
sudo cp -r "$SCRIPT_DIR"/dist /var/www/gale/
sudo cp "$SCRIPT_DIR"/robots.txt /var/www/gale/ 2>/dev/null || true
sudo cp "$SCRIPT_DIR"/manifest.json /var/www/gale/ 2>/dev/null || true
for icon in favicon.ico apple-touch-icon.png apple-touch-icon-precomposed.png icon-192.png icon-512.png icon-512-maskable.png; do
  sudo cp "$SCRIPT_DIR/$icon" /var/www/gale/ 2>/dev/null || true
done
sudo cp -r "$SCRIPT_DIR"/assets /var/www/gale/
# files that no longer exist in the repo shouldn't linger in the docroot
for stale in app.js style.css; do sudo rm -f "/var/www/gale/$stale"; done
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
sudo nginx -t
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
