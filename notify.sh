#!/usr/bin/env bash
# Canonical fleet notify: sends a message to the operator's Telegram chat.
# Same file for every agent -- the [AGENT] prefix comes from this script's
# own directory name.
# Usage: notify.sh "message" [severity]
#   severity: CRIT | WARN | INFO (default INFO) -> emoji prefix
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/keys/telegram.env"
AGENT="$(basename "$SCRIPT_DIR")"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 \"message\" [CRIT|WARN|INFO]" >&2
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing $ENV_FILE (need TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)" >&2
    exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    echo "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in $ENV_FILE" >&2
    exit 1
fi

case "${2:-INFO}" in
  CRIT) icon="🔴 " ;;
  WARN) icon="🟡 " ;;
  *)    icon="🟢 " ;;
esac

TEXT="[${AGENT}] ${icon}$1"
# Telegram hard cap is 4096; leave headroom for the prefix.
if [[ ${#TEXT} -gt 3900 ]]; then
    TEXT="${TEXT:0:3900} … (truncated)"
fi

curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${TEXT}" \
    -o /dev/null

# Mark that this waking successfully reported to the operator (wake.sh checks
# for this and alerts if the session ended without calling notify.sh).
touch "$SCRIPT_DIR/logs/.notified" 2>/dev/null || true
