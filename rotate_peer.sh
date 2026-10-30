#!/usr/bin/env bash
# Two-phase token rotation for ONE paired peer, with no downtime.
# Run by the OPERATOR, by hand (AGENT.md rule 8). The new token is printed only to
# your terminal, once, at `stage`.
#
#   ./rotate_peer.sh stage  <PEER_NAME>   mint a new token; Maistral then accepts BOTH tokens
#                                         and keeps SENDING with the old one, so nothing breaks
#   ./rotate_peer.sh finish <PEER_NAME>   after the peer has switched: retire the old token
#
# Sequence:
#   1. stage on Maistral          -> prints the new block for the peer
#   2. peer ADDS the new token as an additional accepted token for MAISTRAL (keeps the old),
#      restarts its listener, and sends Maistral a message with the new token
#   3. finish on Maistral         -> old token rejected, Maistral now sends with the new one
#   4. peer removes the old token from its side
# On any failure this script restores the backup it made and restarts maistral-peer.
set -euo pipefail
umask 077
cd "$(dirname "${BASH_SOURCE[0]}")"

CMD="${1:-}"
NAME="${2:-}"
PEERS="keys/peers.env"
HELPER="./peers_rotate.py"

if [[ ! "$CMD" =~ ^(stage|finish)$ || ! "$NAME" =~ ^[A-Z][A-Z0-9_-]{0,31}$ ]]; then
    echo "Usage: $0 stage|finish <PEER_NAME>   (NAME: UPPERCASE, e.g. MOUNTAIN)" >&2
    exit 1
fi
[[ -f "$PEERS" ]] || { echo "Missing $PEERS" >&2; exit 1; }
grep -qx "NAME=$NAME" "$PEERS" || { echo "$NAME is not in $PEERS -- nothing to rotate." >&2; exit 1; }

SELF_ADDR="$(grep -E '^SELF_BIND=' "$PEERS" | head -1 | cut -d= -f2-)"
: "${SELF_ADDR:?SELF_BIND missing in $PEERS}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="$PEERS.bak-pre-rotate-$NAME-$STAMP"
cp -p "$PEERS" "$BACKUP"
chmod 600 "$BACKUP"

rollback() {
    echo "FAILED -- restoring $PEERS from $BACKUP and restarting maistral-peer" >&2
    cp -p "$BACKUP" "$PEERS"
    sudo systemctl restart maistral-peer || true
}
trap rollback ERR

# POST a test message with the given token to Maistral's own listener; echo "<http> <from>".
# The test message is deleted so it is never read as real mail.
probe() {
    local tok="$1" mark code f from="-"
    mark="$(mktemp)"; sleep 0.05
    code="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
        -H "Authorization: Bearer ${tok}" -H "Content-Type: application/json" \
        -d '{"subject":"rotation self-test","body":"safe to delete"}' || true)"
    f="$(find peer/inbox -maxdepth 1 -name '*.json' -newer "$mark" 2>/dev/null | head -1)"
    if [[ -n "$f" ]]; then
        from="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("from"))' "$f")"
        rm -f "$f"
    fi
    rm -f "$mark"
    echo "$code $from"
}
expect() { # <label> <got> <want>
    if [[ "$2" != "$3" ]]; then echo "self-test FAILED: $1 -> '$2', wanted '$3'" >&2; return 1; fi
    echo "  ok: $1 -> $2"
}
restart() {
    sudo systemctl restart maistral-peer
    sleep 2
    systemctl is-active --quiet maistral-peer
}

if [[ "$CMD" == "stage" ]]; then
    NEW="$(openssl rand -hex 32)"
    [[ "${#NEW}" -eq 64 ]] || { echo "token generation failed" >&2; exit 1; }
    MAISTRAL_NEW_TOKEN="$NEW" python3 "$HELPER" stage "$PEERS" "$NAME"
    OLD="$(python3 "$HELPER" get "$PEERS" "$NAME" old)"
    restart
    echo "self-test (tokens never printed):"
    expect "NEW token accepted as $NAME" "$(probe "$NEW")" "200 $NAME"
    expect "OLD token still accepted as $NAME" "$(probe "$OLD")" "200 $NAME"
    expect "wrong token rejected" "$(probe 0000 | cut -d' ' -f1)" "401"
    trap - ERR
    ADDR="$(python3 "$HELPER" get "$PEERS" "$NAME" addr)"
    printf '\n## %s -- rotation STAGED for %s\n\n- Operator ran rotate_peer.sh stage. Maistral now accepts old + new token and still sends with the old one. Waiting for %s to install the new token; then `rotate_peer.sh finish %s`. Token not recorded here.\n' \
        "$(date -u +%FT%TZ)" "$NAME" "$NAME" "$NAME" >> NOTES.md
    cat <<EOF

=================== ROTATION STAGED FOR $NAME ===================
Nothing is broken: Maistral accepts BOTH tokens and still sends with the OLD one.

Give $NAME's side this block. Tell them to ADD it as an additional accepted
token for MAISTRAL (keep the old one for now), restart their listener, then send
Maistral a message. If their config can hold only ONE token per name, tell them to
swap it right after you run 'finish' -- expect a brief 401 on Maistral->$NAME until then.

NAME=MAISTRAL
ADDR=${SELF_ADDR}
TOKEN=${NEW}

When $NAME confirms it is sending with the new token, run:
  ./rotate_peer.sh finish $NAME
Then clear this terminal's scrollback -- the token is on screen.
Peer address on record: $ADDR
=================================================================
EOF
else
    NEW="$(python3 "$HELPER" get "$PEERS" "$NAME" new)"
    OLD="$(python3 "$HELPER" get "$PEERS" "$NAME" old)"
    python3 "$HELPER" finish "$PEERS" "$NAME"
    restart
    echo "self-test (tokens never printed):"
    expect "NEW token accepted as $NAME" "$(probe "$NEW")" "200 $NAME"
    expect "OLD token rejected" "$(probe "$OLD" | cut -d' ' -f1)" "401"
    trap - ERR
    printf '\n## %s -- rotation FINISHED for %s\n\n- Operator ran rotate_peer.sh finish. Old token retired (now rejected), new token live inbound and used for outbound. Self-test passed.\n' \
        "$(date -u +%FT%TZ)" "$NAME" >> NOTES.md
    cat <<EOF

Rotation for $NAME is complete: the old token is rejected and Maistral now sends with the new one.
Tell $NAME it can remove the OLD token from its side. Check the link with:
  ./send_to_peer.sh $NAME "post-rotation check" "rotation check"
EOF
fi
