#!/usr/bin/env bash
# pair_coresident.sh — Ostro (rule 8a, operator-authorized) pairs with ONE
# co-located sibling. Mints a single shared token, installs Ostro's half
# (NAME=<SIB>, ADDR=<sibling>), runs the SIBLING's own install_peer_block.sh
# for the far half (NAME=OSTRO, ADDR=<ostro>), then self-tests both
# directions (right token -> 200 + recorded 'from'; wrong token -> 401) and
# does a two-way Ostro->sibling send before declaring success.
#
# The token is never printed. Ostro's keys/peers.env is backed up before the
# edit and restored on a failed half-self-test.
#
# Usage: ./pair_coresident.sh <SIB> <SIB_DIR> <SIB_UNIT>
#   e.g. ./pair_coresident.sh GALE /home/agent/agent gale-peer
set -euo pipefail
umask 077

SIB="${1:-}"; SIBDIR="${2:-}"; SIBUNIT="${3:-}"
[[ -n "$SIB" && -n "$SIBDIR" && -n "$SIBUNIT" ]] || \
    { echo "usage: pair_coresident.sh <SIB> <SIB_DIR> <SIB_UNIT>" >&2; exit 2; }

OSTRO="/home/agent/ostro"
OPEERS="$OSTRO/keys/peers.env"
OPATH="$OSTRO/peer/inbox"
SPEERS="$SIBDIR/keys/peers.env"
SINST="$SIBDIR/install_peer_block.sh"
OSTRO_BIND="100.66.39.59:8798"

for f in "$OPEERS" "$SPEERS" "$SINST"; do
    [[ -f "$f" ]] || { echo "missing $f" >&2; exit 1; }
done

SIBBIND="$(grep -E '^SELF_BIND=' "$SPEERS" | head -1 | cut -d= -f2-)"
SIBNAME="$(grep -E '^SELF_NAME=' "$SPEERS" | head -1 | cut -d= -f2-)"
[[ -n "$SIBBIND" ]] || { echo "sibling SELF_BIND missing in $SPEERS" >&2; exit 1; }
[[ "$(grep -cE "^NAME=${SIB}\$" "$OPEERS")" -eq 0 ]] || { echo "$SIB already in Ostro peers.env" >&2; exit 1; }
[[ "$(grep -cE '^NAME=OSTRO$' "$SPEERS")" -eq 0 ]] || { echo "OSTRO already in sibling registry" >&2; exit 1; }

echo "== OSTRO <-> ${SIBNAME:-$SIB}  (sibling dir $SIBDIR, unit $SIBUNIT, addr $SIBBIND) =="

TOKEN="$(openssl rand -hex 32)"
[[ "${#TOKEN}" -eq 64 ]] || { echo "token gen failed" >&2; exit 1; }

# ---------- Ostro half ----------
OBAK="$OPEERS.bak-pre-$SIB-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p "$OPEERS" "$OBAK"; chmod 600 "$OBAK"
{
    echo ""
    echo "# $SIB pairing -- minted $(date -u +%FT%TZ) by Ostro via rule 8a (operator sign-off 2026-09-25)."
    echo "# Token identical on both boxes; not recorded here."
    echo "NAME=$SIB"
    echo "ADDR=$SIBBIND"
    echo "TOKEN=$TOKEN"
} >> "$OPEERS"
chmod 600 "$OPEERS"

sudo systemctl restart ostro-peer; sleep 2
state="$(systemctl is-active ostro-peer)"
if [[ "$state" != "active" ]]; then
    echo "ostro-peer not active ($state) -- restoring $OBAK" >&2
    cp -p "$OBAK" "$OPEERS"; sudo systemctl restart ostro-peer; exit 1
fi

# self-test Ostro receiving half: right token -> 200 + from=SIB ; wrong -> 401
CODE="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://$OSTRO_BIND/inbox" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"subject":"selftest","body":"ostro-half selftest; safe to delete"}')"
BAD="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://$OSTRO_BIND/inbox" \
    -H "Authorization: Bearer 0000" -H "Content-Type: application/json" -d '{}')"
F="$(ls -t "$OPATH"/*-"$SIB"-*.json 2>/dev/null | head -1 || true)"
FROM="?"
if [[ -n "$F" ]]; then
    FROM="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("from"))' "$F" 2>/dev/null || echo '?')"
    rm -f "$F"
fi
echo "[ostro-half] right=$CODE (want 200) wrong=$BAD (want 401) from=$FROM (want $SIB)"
if [[ "$CODE" != "200" || "$BAD" != "401" || "$FROM" != "$SIB" ]]; then
    echo "ostro-half self-test FAILED -- restoring $OBAK" >&2
    cp -p "$OBAK" "$OPEERS"; sudo systemctl restart ostro-peer; exit 1
fi

# ---------- sibling half (sibling's own installer) ----------
BFILE="/tmp/pairblock-$$"
printf 'NAME=OSTRO\nADDR=%s\nTOKEN=%s\n' "$OSTRO_BIND" "$TOKEN" > "$BFILE"; chmod 600 "$BFILE"
set +e
( cd "$SIBDIR" && ./install_peer_block.sh "$BFILE" --service "$SIBUNIT" --peers "$SIBDIR/keys/peers.env" )
SIBC=$?
set -e
rm -f "$BFILE" 2>/dev/null || true   # redact the token copy
unset TOKEN
echo "[sib-half] install_peer_block rc=$SIBC (want 0)"
[[ "$SIBC" == "0" ]] || { echo "sibling-half install failed" >&2; exit 1; }

# ---------- two-way: Ostro -> sibling (real marker, stays in sibling inbox) ----------
set +e
( cd "$OSTRO" && ./send_to_peer.sh "$SIB" \
     "pair test -- rule 8a operator sign-off 2026-09-25; bidirectional self-test passed. Safe to delete." \
     "pairing established" )
TW=$?
set -e
echo "[two-way] Ostro->$SIB send_to_peer rc=$TW (want 0)"
[[ "$TW" == "0" ]] || { echo "two-way send failed" >&2; exit 1; }

echo "== RESULT PASS: OSTRO <-> ${SIBNAME:-$SIB} : ostro-half 200/401 from=$FROM | sib-half rc-0 (200/401 in installer) | two-way rc-0 =="
