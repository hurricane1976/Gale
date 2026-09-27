#!/usr/bin/env bash
# Deploys website/ to the local nginx docroot and reloads.
# /var/www/gale is outside this repo (nginx runs as www-data, which can't
# traverse into /home/agent's 750 permissions) -- this script is the only
# link between the two, same role as Beacon's website/deploy.sh.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Bundle+minify the page scripts (npm run build / build.mjs). Pages load
# dist/<name>.js; the raw *.js in the repo are still deployed too, since
# 404.html imports shared.js directly via an inline <script type=module>
# esbuild never sees (not one of its declared entry points).
( cd "$SCRIPT_DIR" && npm run build )

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
sudo chown -R www-data:www-data /var/www/gale
sudo chmod -R 755 /var/www/gale
sudo nginx -t
sudo systemctl reload nginx
echo "Deployed. http://100.66.39.59:8090/"
