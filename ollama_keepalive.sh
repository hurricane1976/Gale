#!/usr/bin/env bash
# Keep qwen3.8:27b loaded on the LAN Ollama server (keep_alive: -1 survives until
# explicit unload/Ollama restart; this re-arms it after a restart).
# No-op if the model is already resident.
set -u
URL="http://192.168.1.197:11434"
MODEL="qwen3.8:27b"
LOG="/home/agent/agent/logs/ollama_keepalive.log"
mkdir -p "$(dirname "$LOG")"

loaded=$(curl -s --max-time 5 "$URL/api/ps" 2>/dev/null | grep -c "\"$MODEL\"" || true)
if [ "$loaded" -gt 0 ]; then
  exit 0
fi
echo "$(date -u '+%F %T') model not loaded — re-loading with keep_alive=-1" >>"$LOG"
curl -s --max-time 300 "$URL/api/chat" \
  -d '{"model":"qwen3.8:27b","messages":[],"stream":false,"options":{"keep_alive":-1}}' \
  -o /dev/null
echo "$(date -u '+%F %T') reload done" >>"$LOG"
