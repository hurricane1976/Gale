#!/usr/bin/env bash
# ollama_watch.sh -- transition-based health monitor for the LAN inference
# server. Cron every 5 min from gale-agent.
#
# 2026-10-15: native Ollama (:11434) was retired (service stopped + disabled
# on josh-linux); the fleet's inference endpoint is freetoken (vLLM-style
# OpenAI API) on :1919. This watcher now probes freetoken -- watching the
# retired native port after the migration is what produced days of false
# "LAN Ollama DOWN" crits (and, when the disk filled on 2026-10-18 wiped the
# state file, a CRIT every 5 min instead of transition-only).
#
# Detects, alerting on state TRANSITIONS only (no spam):
#   - server down (API unreachable) -> CRIT; recovery reports outage length
#     and whether josh-linux rebooted.
#   - model not resident -> WARN (MODEL missing from /v1/models).
#   - API green but generation failing -> WARN. That is the 2026-10-04
#     failure mode (/api answered for 2.5h while every generation 500'd).
#     Only REAL error verdicts alarm; queue-busy timeouts are INCONCLUSIVE
#     and never alarm -- an agent may hold the single serving lane for many
#     minutes (same busy-queue rule as ollama_api.py's sampler).
# Steady state is log-only. State file makes transitions idempotent.
set -u
URL="http://192.168.1.197:1919"
MODEL="Qwen3.8-35B-A3B-Distill-NVFP4"
DIR="/home/agent/agent"
LOG="$DIR/logs/ollama_watch.log"
STATE="$DIR/logs/ollama_watch.state"
mkdir -p "$DIR/logs"
ts() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
is_bad() { case "$1" in down|model_missing|gen_error) return 0;; *) return 1;; esac; }

# ---- probes ----
status=down; ver="?"
gen=""
health_json="$(curl -s --max-time 8 "$URL/health" 2>/dev/null || true)"
if printf '%s' "$health_json" | grep -q '"status": *"ok"'; then
    ver="$(printf '%s' "$health_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("version","?"))' 2>/dev/null || echo '?')"
    status=model_missing
    if curl -s --max-time 8 "$URL/v1/models" 2>/dev/null | grep -q "\"$MODEL\""; then
        status=busy
        gen="$(curl -s --max-time 120 "$URL/v1/chat/completions" \
              -H 'Content-Type: application/json' \
              -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":1}" 2>/dev/null || true)"
        if printf '%s' "$gen" | grep -q '"finish_reason"'; then
            status=ok
        elif printf '%s' "$gen" | grep -qi '"error"'; then
            status=gen_error
        fi
        # empty / timeout / unexpected -> stay busy (inconclusive, never alarms)
    fi
fi

# ---- load state, detect transitions ----
last_status="unknown"; last_bad_since=""
[ -f "$STATE" ] && . "$STATE" >/dev/null 2>&1 || true
now="$(date +%s)"
echo "$(ts) status=$status (prev=$last_status) v=$ver" >>"$LOG"

alert=""; sev="WARN"
if is_bad "$status" && ! is_bad "$last_status"; then
    last_bad_since="$now"
    case "$status" in
        down)         alert="LAN inference (freetoken) DOWN -- API unreachable (last known version $ver)"; sev="CRIT" ;;
        model_missing) alert="LAN freetoken API up but $MODEL not resident (not loaded on the inference host?) v=$ver" ;;
        gen_error)    alert="LAN freetoken API green but generation FAILING: $(printf '%s' "$gen" | head -c 180) v=$ver" ;;
    esac
elif [ "$status" = "ok" ] && is_bad "$last_status"; then
    out_min=$(( (now - ${last_bad_since:-$now}) / 60 ))
    extra=""
    if [ "$last_status" = "down" ]; then
        remote="$(timeout 15 ssh -o BatchMode=yes -o ConnectTimeout=6 -o StrictHostKeyChecking=accept-new josh-linux \
                  'uptime -s' 2>/dev/null || true)"
        [ -n "$remote" ] && extra=" | remote: $(printf '%s' "$remote" | tr '\n' ' ')"
    fi
    alert="LAN freetoken RECOVERED after ~${out_min} min in state '$last_status' (now v=$ver)$extra"
    sev="INFO"
fi

# ---- persist state ----
if is_bad "$status"; then
    [ -z "$last_bad_since" ] && last_bad_since="$now"
    printf 'last_status="%s"\nlast_bad_since="%s"\n' "$status" "$last_bad_since" >"$STATE"
else
    printf 'last_status="%s"\nlast_bad_since=""\n' "$status" >"$STATE"
fi

# ---- alert via the canonical Telegram path ----
if [ -n "$alert" ]; then
    echo "$(ts) ALERT($sev): $alert" >>"$LOG"
    (cd "$DIR" && ./notify.sh "ollama_watch: $alert" "$sev" >>"$LOG" 2>&1) || true
fi

# ---- log retention (30d, same as wake logs) ----
find "$DIR/logs" -name 'ollama_watch.log' -mtime +30 -delete 2>/dev/null || true
