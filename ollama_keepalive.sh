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
# num_ctx 65536: the wakings legitimately need the room -- a routine
# waking ships a 22KB system prompt + 15KB tools schema + 55KB+ NOTES.md
# reads (~40K tokens), and at OLLAMA_CONTEXT_LENGTH=32768 ollama's
# truncation dropped the user message and errored "no user query found
# in messages" -> 3 futile retries -> dead waking (chinook/maistral
# 2026-09-29). q8_0 KV keeps the 64K cache at ~2.4GB, so the VRAM cost
# vs 32K is small on the 24GB card.
curl -s --max-time 300 "$URL/api/chat" \
  -d '{"model":"qwen3.8:27b","messages":[],"stream":false,"options":{"keep_alive":-1,"num_ctx":65536}}' \
  -o /dev/null
echo "$(date -u '+%F %T') reload done" >>"$LOG"
