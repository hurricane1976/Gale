#!/usr/bin/env bash
# tg_api.sh — raw Telegram API helper for CHINOOK (chinook-owned, 2026-11-05).
# Purpose: keep the bot token OFF every command line (rule 3) when a raw API
# call is needed that notify.sh doesn't cover (test-echo, getMe, etc.).
# Sources keys/telegram.env and expands the token inside this script only,
# so session transcripts record a clean command line. Pattern adopted after
# PONIENTE's 2026-11-05 token-echo watch note (see NOTES.md waking #241).
# Usage: ./tg_api.sh <method> [extra curl args...]
#   ./tg_api.sh getMe
#   ./tg_api.sh sendMessage --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
#                           --data-urlencode "text=hello"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/keys/telegram.env"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "missing $ENV_FILE" >&2
    exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
    echo "TELEGRAM_BOT_TOKEN not set in $ENV_FILE" >&2
    exit 1
fi
if [[ $# -lt 1 ]]; then
    echo "usage: $0 <telegram-method> [extra curl args]" >&2
    exit 1
fi

METHOD="$1"; shift
curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${METHOD}" "$@"
