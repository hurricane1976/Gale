#!/usr/bin/env bash
# node_exporter snap-refresh guard.
#
# Every node_exporter snap auto-refresh starts a NEW empty $SNAP_DATA/flags
# file for the new revision, wiping --collector.textfile.directory. All
# gale_* textfile bridge metrics then vanish from Prometheus and every
# Gale*Stale alert fires while the bridge scripts themselves keep running
# fine. Seen 2026-09-29 (rev 2299) and 2026-10-22 (rev 2311, unnoticed ~2
# days). Full writeup: runbooks/node-exporter-flags-wipe.md.
#
# This guard makes the fix automatic: ensure the CURRENT revision's flags
# file carries the textfile directory; restart node-exporter only when the
# flag was missing; log every action. Cron: */5 (matches the bridges' own
# cadence, so a refresh costs at most one bridge interval of blindness).
set -u
LOG=/home/agent/agent/logs/nx-flags-guard.log
FLAG_LINE="--collector.textfile.directory=/var/snap/node-exporter/common"

cur="$(readlink -f /var/snap/node-exporter/current 2>/dev/null)"
if [ -z "$cur" ] || [ ! -d "$cur" ]; then
    echo "$(date -u +%FT%TZ) no current revision dir; skipping" >>"$LOG"
    exit 0
fi
flags="$cur/flags"
if [ -f "$flags" ] && grep -q "collector.textfile.directory" "$flags"; then
    exit 0
fi
echo "$FLAG_LINE" | sudo -n tee "$flags" >/dev/null
sudo -n snap restart node-exporter >/dev/null 2>&1 ||
    sudo -n systemctl restart snap.node-exporter.node-exporter.service >/dev/null 2>&1
echo "$(date -u +%FT%TZ) textfile flag missing in $flags -- restored + restarted node-exporter" >>"$LOG"
