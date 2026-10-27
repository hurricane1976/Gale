#!/usr/bin/env bash
# disk_watchdog.sh — Zephyr lane: cheap continuous disk watch (detection-side).
# Rationale: waking cadence is 6h; the 2026-10-27 disk-full incident wrote ~34G
# and freed it between two wakings. This closes that gap: checks every 15 min,
# alerts ONLY via notify.sh (read-only, fixes nothing).
#
# Triggers:
#   A) free space below FLOOR_GB
#   B) free space dropped more than DROP_ALERT_GB since the previous check
#      (fast-fill signature, even while still above the floor)
# Cooldown: one alert per trigger class per COOLDOWN_S.
# State: logs/.disk_watchdog_state (last free GB + last-alert timestamps).

set -u
FLOOR_GB=15
DROP_ALERT_GB=8
COOLDOWN_S=7200
STATE=/home/agent/zephyr/logs/.disk_watchdog_state
AVAIL_KB=$(df --output=avail --block-size=1K / 2>/dev/null | tail -1 | tr -d ' ')
case "$AVAIL_KB" in ''|*[!0-9]*) echo "$(date -u +%FT%TZ) ERROR: could not read df avail"; exit 1;; esac
FREE_GB=$(( AVAIL_KB / 1024 / 1024 ))

NOW=$(date +%s)
PREV_FREE='' ; LAST_FLOOR=0 ; LAST_DROP=0
if [ -f "$STATE" ]; then
  # shellcheck disable=SC1090
  . "$STATE" 2>/dev/null || true
fi

msg=""
if [ "$FREE_GB" -lt "$FLOOR_GB" ]; then
  if [ "$NOW" -ge $(( LAST_FLOOR + COOLDOWN_S )) ]; then
    msg="[Zephyr disk-watchdog] ROOT FS LOW: ${FREE_GB}G free (floor ${FLOOR_GB}G) on gale-agent. Fast-fill or leak class — needs eyes. (auto, 15-min check)"
    LAST_FLOOR=$NOW
  fi
fi
if [ -n "$PREV_FREE" ] && [ $(( PREV_FREE - FREE_GB )) -ge "$DROP_ALERT_GB" ]; then
  if [ "$NOW" -ge $(( LAST_DROP + COOLDOWN_S )) ]; then
    msg="[Zephyr disk-watchdog] ROOT FS RAPID DROP: ${PREV_FREE}G -> ${FREE_GB}G free in <=15min on gale-agent (>=${DROP_ALERT_GB}G). Fast-fill class — needs eyes. (auto, 15-min check)"
    LAST_DROP=$NOW
  fi
fi

echo "PREV_FREE=$PREV_FREE" > "$STATE.tmp" 2>/dev/null || STATE=/tmp/zephyr-diskwatch.$$
{
  echo "PREV_FREE=$FREE_GB"
  echo "LAST_FLOOR=$LAST_FLOOR"
  echo "LAST_DROP=$LAST_DROP"
} > "$STATE" && rm -f "$STATE.tmp"

if [ -n "$msg" ]; then
  echo "$(date -u +%FT%TZ) ALERT: $msg" >> /home/agent/zephyr/logs/disk_watchdog.log
  if [ "${ZEPHYR_WATCHDOG_DRYRUN:-0}" = "1" ]; then
    echo "$(date -u +%FT%TZ) DRYRUN (not sent): $msg" >> /home/agent/zephyr/logs/disk_watchdog.log
  else
    /home/agent/zephyr/notify.sh "$msg" >> /home/agent/zephyr/logs/disk_watchdog.log 2>&1
  fi
else
  echo "$(date -u +%FT%TZ) ok free=${FREE_GB}G prev=${PREV_FREE:-n/a}G" >> /home/agent/zephyr/logs/disk_watchdog.log
fi
