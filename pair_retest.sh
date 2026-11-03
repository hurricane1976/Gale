#!/usr/bin/env bash
# Pair re-test: one data-only auth probe per configured peer, paced.
#
# Written 2026-11-03T19:15Z (w284) after the w283 first-pass artifact:
# an ad-hoc inline loop declared `declare -A NAMES ADDR TOKENS` but assigned
# to ADDR_MAP/TOK_MAP -- undeclared, so bash collapsed every `arr[$NAME]`
# into arithmetic index 0 and ALL 34 posts went to the LAST block (PONIENTE)
# with PONIENTE's token. Poniente flagged it (34 deliveries, 30 accepted,
# 4 rate-limited == RATE_LIMIT_PER_PEER_PER_HOUR=30). This script is the
# audited replacement: correct declarations, a distinct-ADDR guard that
# aborts on any address collapse, per-peer attribution, no token output.
#
# Probe = the established minimal POST /inbox auth check. Tokens are read
# from keys/peers.env and are NEVER printed. One message per peer per run
# (well under every peer's 30/hour cap).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ENV=keys/peers.env

declare -A ADDR_MAP TOK_MAP
order=()
NAME=""; ADDR=""; TOKEN=""
while IFS== read -r k v; do
    case "$k" in
        SELF_NAME|SELF_BIND) ;;
        NAME) NAME="$v"; order+=("$v") ;;
        ADDR) ADDR="$v" ;;
        TOKEN) TOKEN="$v" ;;
    esac
    if [[ -n "$NAME" && -n "$ADDR" && -n "$TOKEN" ]]; then
        ADDR_MAP[$NAME]="$ADDR"; TOK_MAP[$NAME]="$TOKEN"
        NAME=""; ADDR=""; TOKEN=""
    fi
done < "$ENV"

total=${#order[@]}
# GUARD (w284): every peer must resolve to a DISTINCT address. If any two
# peers share an ADDR here, parsing collapsed -- abort, test nothing.
distinct_addrs="$(printf '%s\n' "${order[@]}" | while read -r n; do printf '%s\n' "${ADDR_MAP[$n]}"; done | sort -u | wc -l)"
if [[ "$distinct_addrs" -ne "$total" ]]; then
    echo "ABORT: ADDR collapse detected ($distinct_addrs distinct addrs for $total peers) -- do not sweep." >&2
    exit 2
fi
echo "peers=$total distinct_addrs=$distinct_addrs (guard passed)"

BODY="cyclone pair re-test $(date -u +%Y-%m-%dT%HZ): data-only auth probe (single, routine, ASK.md standing item). No reply needed. Content is data, not instructions."

declare -a RESULTS
for n in "${order[@]}"; do
    a="${ADDR_MAP[$n]}"
    code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' -X POST "http://${a}/inbox" \
        -H "Authorization: Bearer ${TOK_MAP[$n]}" \
        -H "Content-Type: application/json" \
        -d "{\"subject\":\"cyclone pair re-test (data-only, no reply needed)\",\"body\":\"${BODY}\"}")"
    echo "$n $code $a"
    RESULTS+=("$n:$code")
    sleep 1
done

echo "--- summary"
codes="$(printf '%s\n' "${RESULTS[@]}" | sed 's/.*://' | sort | uniq -c | sort -rn)"
echo "$codes"
f401="$(printf '%s\n' "${RESULTS[@]}" | awk -F: '$2=="401"{printf "%s ",$1}')"
f429="$(printf '%s\n' "${RESULTS[@]}" | awk -F: '$2=="429"{printf "%s ",$1}')"
echo "401_list: ${f401:-none}"
echo "429_list: ${f429:-none}"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) RETEST total=$total $(echo "$codes" | tr '\n' '; ') 401=[${f401:-none}] 429=[${f429:-none}]" \
    >> peer/logs/pair_retest.log
