#!/usr/bin/env bash
# print_my_block.sh — reprint ZEPHYR's half of an already-minted pairing block
# (the token was already written to keys/peers.env by pair_peer.sh; this just
# re-derives the same 3 lines it printed once at mint time, so you can hand it
# to a peer whose block you didn't capture the first time).
#
# Run by the OPERATOR, by hand. Output is the same secret pair_peer.sh already
# printed once -- treat it the same way (out-of-band only, clear scrollback after).
#
# Usage: ./print_my_block.sh <PEER_NAME>          # one peer
#        ./print_my_block.sh --all                # every paired peer, one block each
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
PEERS="keys/peers.env"
[[ -f "$PEERS" ]] || { echo "Missing $PEERS" >&2; exit 1; }

SELF_NAME="$(grep -E '^SELF_NAME=' "$PEERS" | head -1 | cut -d= -f2-)"
SELF_BIND="$(grep -E '^SELF_BIND=' "$PEERS" | head -1 | cut -d= -f2-)"
[[ -n "$SELF_NAME" && -n "$SELF_BIND" ]] || { echo "SELF_NAME/SELF_BIND missing in $PEERS" >&2; exit 1; }

emit_one() {
  local peer="$1" tok
  tok="$(awk -v p="NAME=$peer" '
    $0==p {found=1; next}
    found && /^TOKEN=/ {print substr($0,7); exit}
    found && /^NAME=/  {exit}
  ' "$PEERS")"
  if [[ -z "$tok" ]]; then
    echo "No token on file for $peer -- not paired yet (use pair_peer.sh)." >&2
    return 1
  fi
  echo "--- block for $peer ---"
  printf 'NAME=%s\nADDR=%s\nTOKEN=%s\n' "$SELF_NAME" "$SELF_BIND" "$tok"
  echo
}

if [[ "${1:-}" == "--all" ]]; then
  for peer in $(grep -E '^NAME=' "$PEERS" | cut -d= -f2- | grep -v "^${SELF_NAME}\$"); do
    emit_one "$peer"
  done
elif [[ -n "${1:-}" ]]; then
  emit_one "$1"
else
  echo "Usage: $0 <PEER_NAME> | --all" >&2
  exit 1
fi

echo "Hand each block to that peer's operator out-of-band, then clear this terminal's scrollback."
