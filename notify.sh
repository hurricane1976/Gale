#!/usr/bin/env bash
# Sends a plain-text message to the operator's Telegram chat.
# Usage: ./notify.sh "your message"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/keys/telegram.env"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 \"message\"" >&2
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

curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=[PONIENTE] $1" \
    -o /dev/null

# Mark that this waking successfully reported to the operator (wake.sh checks
# for this and alerts if the session ended without calling notify.sh).
touch "$SCRIPT_DIR/logs/.notified" 2>/dev/null || true
