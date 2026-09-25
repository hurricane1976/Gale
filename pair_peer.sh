#!/usr/bin/env bash
# Pair Ostro with ONE fleet peer: mint a shared token, install Ostro's half
# in keys/peers.env, restart ostro-peer, self-test the receiving side, and
# print the block the PEER's side must install.
#
# Run by the OPERATOR, by hand (AGENT.md rule 8: Ostro never mints or
# installs peer tokens on its own). The token is printed only to your
# terminal, once.
#
# Usage: ./pair_peer.sh <PEER_NAME> <PEER_TAILNET_ADDR>
#   e.g. ./pair_peer.sh BEACON 100.99.217.90:8787
set -euo pipefail
umask 077
cd "$(dirname "${BASH_SOURCE[0]}")"

NAME="${1:-}"
ADDR="${2:-}"
PEERS="keys/peers.env"

if [[ ! "$NAME" =~ ^[A-Z][A-Z0-9_-]{0,31}$ ]]; then
    echo "Usage: $0 <PEER_NAME> <PEER_TAILNET_ADDR>   (NAME: UPPERCASE, e.g. BEACON)" >&2
    exit 1
fi
if [[ ! "$ADDR" =~ ^100\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]{2,5}$ ]]; then
    echo "ADDR must be a Tailscale address like 100.99.217.90:8787, got: '$ADDR'" >&2
    exit 1
fi
[[ -f "$PEERS" ]] || { echo "Missing $PEERS" >&2; exit 1; }
if grep -qx "NAME=$NAME" "$PEERS"; then
    echo "$NAME is already in $PEERS -- not minting a second token." >&2
    exit 1
fi

SELF_BIND="$(grep -E '^SELF_BIND=' "$PEERS" | head -1 | cut -d= -f2-)"
SELF_ADDR="${SELF_BIND:?SELF_BIND missing in $PEERS}"

TOKEN="$(openssl rand -hex 32)"
[[ "${#TOKEN}" -eq 64 ]] || { echo "token generation failed" >&2; exit 1; }

cp -p "$PEERS" "$PEERS.bak-pre-$NAME"
{
    echo ""
    echo "# $NAME pairing -- minted $(date -u +%FT%TZ) by the operator via pair_peer.sh."
    echo "# Token identical on both boxes."
    echo "NAME=$NAME"
    echo "ADDR=$ADDR"
    echo "TOKEN=$TOKEN"
} >> "$PEERS"
chmod 600 "$PEERS" "$PEERS.bak-pre-$NAME"

sudo systemctl restart ostro-peer
sleep 2
systemctl is-active --quiet ostro-peer || { echo "FAIL: ostro-peer not active after restart" >&2; exit 1; }

# --- self-test of Ostro's receiving half (token never echoed) -------------
CODE="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
    -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
    -d '{"subject":"selftest","body":"ostro receiving-half self-test; safe to delete"}')"
BAD="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
    -H "Authorization: Bearer 0000" -H "Content-Type: application/json" -d '{}')"
FROM="?"
F="$(ls -t peer/inbox/*-"$NAME"-*.json 2>/dev/null | head -1 || true)"
if [[ -n "$F" ]]; then
    FROM="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("from"))' "$F")"
    rm -f "$F"   # remove the self-test message so it is not read as real mail
fi
echo "self-test: right token -> HTTP $CODE (want 200), recorded sender = $FROM (want $NAME); wrong token -> HTTP $BAD (want 401)"
if [[ "$CODE" != "200" || "$FROM" != "$NAME" || "$BAD" != "401" ]]; then
    echo "SELF-TEST FAILED -- restore with: cp -p $PEERS.bak-pre-$NAME $PEERS && sudo systemctl restart ostro-peer" >&2
    exit 1
fi

# Record the fact (never the token) in NOTES.md.
printf '\n## %s -- paired with %s (Ostro half)\n\n- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.\n' \
    "$(date -u +%FT%TZ)" "$NAME" >> NOTES.md

cat <<EOF

=================== OSTRO'S HALF IS INSTALLED ===================
Give this block to $NAME's side (its keys/peers.env, then restart its
peer service). Show it only to the operator/agent that installs it.

NAME=OSTRO
ADDR=${SELF_ADDR}
TOKEN=${TOKEN}

After $NAME confirms, test two-way from Ostro with:
  ./send_to_peer.sh $NAME "hello from Ostro" "pair test"
Then clear this terminal's scrollback -- the token is on screen.
===============================================================
EOF
