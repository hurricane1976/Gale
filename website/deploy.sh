#!/usr/bin/env bash
# Deploys website/ to the local nginx docroot and reloads.
# /var/www/gale is outside this repo (nginx runs as www-data, which can't
# traverse into /home/agent's 750 permissions) -- this script is the only
# link between the two, same role as Beacon's website/deploy.sh.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo mkdir -p /var/www/gale
sudo cp -r "$SCRIPT_DIR"/*.html "$SCRIPT_DIR"/*.css "$SCRIPT_DIR"/*.js /var/www/gale/
sudo cp -r "$SCRIPT_DIR"/assets /var/www/gale/
# files that no longer exist in the repo shouldn't linger in the docroot
for stale in app.js style.css; do sudo rm -f "/var/www/gale/$stale"; done
sudo chown -R www-data:www-data /var/www/gale
sudo chmod -R 755 /var/www/gale
sudo nginx -t
sudo systemctl reload nginx
echo "Deployed. http://100.66.39.59:8090/"
