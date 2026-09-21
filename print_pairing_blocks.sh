#!/usr/bin/env bash
# print_pairing_blocks.sh — reprint, for every peer Zephyr already paired via
# pair_all_remaining.sh, the exact same block pair_peer.sh prints on a fresh
# mint (self-test + "give this block to NAME's side" block). Nothing is
# re-minted; tokens are the ones already on file in keys/peers.env. Re-runs
# the self-test for real against Zephyr's own live listener each time.
#
# Output is plain text, meant to be posted/pasted directly to each peer's
# operator/agent -- one "=== pairing NAME ===" section per peer. Split it up
# per-peer yourself when handing it off (do not post the whole thing to one
# peer -- each only needs, and should only see, its own section).
#
# Run by the OPERATOR, by hand. Usage:
#   ./print_pairing_blocks.sh            # every already-paired peer (except GALE)
#   ./print_pairing_blocks.sh BEACON ...  # just the named peer(s)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
PEERS="keys/peers.env"
[[ -f "$PEERS" ]] || { echo "Missing $PEERS" >&2; exit 1; }

SELF_NAME="$(grep -E '^SELF_NAME=' "$PEERS" | head -1 | cut -d= -f2-)"
SELF_ADDR="$(grep -E '^SELF_BIND=' "$PEERS" | head -1 | cut -d= -f2-)"
[[ -n "$SELF_NAME" && -n "$SELF_ADDR" ]] || { echo "SELF_NAME/SELF_BIND missing in $PEERS" >&2; exit 1; }

get_field() { # <NAME> <ADDR|TOKEN>
  awk -v p="NAME=$1" -v want="$2" '
    $0==p {found=1; next}
    found && $0 ~ "^"want"=" {print substr($0, length(want)+2); exit}
    found && /^NAME=/ {exit}
  ' "$PEERS"
}

emit_one() {
  local name="$1" addr token code bad from f
  addr="$(get_field "$name" ADDR)"
  token="$(get_field "$name" TOKEN)"
  if [[ -z "$addr" || -z "$token" ]]; then
    echo "$name is not paired yet -- skipping (use pair_peer.sh)." >&2
    return
  fi

  echo "=== pairing $name ($addr) ==="
  code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
    -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" \
    -d '{"subject":"selftest","body":"zephyr receiving-half self-test; safe to delete"}' || echo "000")"
  bad="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
    -H "Authorization: Bearer 0000" -H "Content-Type: application/json" -d '{}' || echo "000")"
  from="?"
  f="$(ls -t peer/inbox/*-"$name"-*.json 2>/dev/null | head -1 || true)"
  if [[ -n "$f" ]]; then
    from="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("from","?"))' "$f" 2>/dev/null || echo "?")"
    rm -f "$f"
  fi
  echo "self-test: right token -> HTTP $code (want 200), recorded sender = $from (want $name); wrong token -> HTTP $bad (want 401)"

  cat <<EOF

=================== ${SELF_NAME}'S HALF IS INSTALLED ===================
Give this block to ${name}'s side (its keys/peers.env, then restart its
peer service). Show it only to the operator/agent that installs it.

NAME=${SELF_NAME}
ADDR=${SELF_ADDR}
TOKEN=${token}

After ${name} confirms, test two-way from ${SELF_NAME} with:
  ./send_to_peer.sh ${name} "hello from ${SELF_NAME}" "pair test"
Then clear this terminal's scrollback -- the token is on screen.
================================================================

EOF
}

if [[ $# -gt 0 ]]; then
  for n in "$@"; do emit_one "$n"; done
else
  for n in $(grep -E '^NAME=' "$PEERS" | cut -d= -f2- | grep -vE "^(${SELF_NAME}|GALE)\$"); do
    emit_one "$n"
  done
fi
