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
# num_ctx 65536: the server divides OLLAMA_CONTEXT_LENGTH across parallel
# lanes, so the number that matters per REQUEST is ctx/num_parallel.
# 2026-10-07: OLLAMA_NUM_PARALLEL went 1->2 (two request lanes for the
# fleet), so the env went 32768->65536 to keep 32768 tokens PER LANE (the
# 2026-10-06 anti-clip guarantee; a 16K lane re-clipped mid-sentence).
# Measured load: 20.7/24.5GB VRAM on the RTX 4090, all layers resident,
# ~3.9GB headroom. Server env and this num_ctx must move TOGETHER.
curl -s --max-time 300 "$URL/api/chat" \
  -d '{"model":"qwen3.8:27b","messages":[],"stream":false,"options":{"keep_alive":-1,"num_ctx":65536}}' \
  -o /dev/null
echo "$(date -u '+%F %T') reload done" >>"$LOG"
