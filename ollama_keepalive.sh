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
# num_ctx 32768: raised from 16384 on 2026-10-06 after proving the clip
# root cause (16K ctx wall: 13K-token interactive prompts left ~3K for
# output, finish_reason=length mid-sentence). 32K loads in 19.3/24.5GB
# VRAM on the RTX 4090 (all layers resident, +84MB vs 16K). Server
# OLLAMA_CONTEXT_LENGTH is also 32768, so this matches it.
curl -s --max-time 300 "$URL/api/chat" \
  -d '{"model":"qwen3.8:27b","messages":[],"stream":false,"options":{"keep_alive":-1,"num_ctx":32768}}' \
  -o /dev/null
echo "$(date -u '+%F %T') reload done" >>"$LOG"
