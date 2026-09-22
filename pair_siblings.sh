#!/usr/bin/env bash
# pair_siblings.sh — full two-way pairing between any two same-host agents,
# in one run. Used 2026-09-22 for the Vortex<->Cyclone pair (the first pair
# that does not involve the Gale lead); reusable for any future
# co-resident<->co-resident pair.
#
# Meant to be run by the OPERATOR, by hand, in your own terminal -- same
# rule 8 boundary as pair_peer.sh/install_peer_block.sh themselves (agents
# never mint or install peer tokens on their own, batched or not). This just
# saves you the 8 manual copy/paste steps since both agents are on this one
# box under one operator.
#
# For the pair A<->B this does, in order:
#   1. ~/$A   : ./pair_peer.sh $B <B-addr>          (mint A's half)
#   2. ~/$B   : ./install_peer_block.sh ...          (install A's half on B)
#   3. ~/$B   : ./pair_peer.sh $A <A-addr>          (mint B's half)
#   4. ~/$A   : ./install_peer_block.sh ...          (install B's half on A)
#
# Tokens are captured straight from each pair_peer.sh's stdout into a
# 600-perm temp file (never argv, never left on disk after use) and are
# still printed to your terminal once each, exactly as pair_peer.sh
# already does on its own -- that part isn't changed or suppressed here.
#
# Usage: ./pair_siblings.sh <a> <b>   (lowercase dir names)
#   e.g. ./pair_siblings.sh vortex cyclone
set -euo pipefail
umask 077

declare -A ADDRS=( [gale]=100.66.39.59:8787 [zephyr]=100.66.39.59:8788 [squall]=100.66.39.59:8789 [tempest]=100.66.39.59:8790 [vortex]=100.66.39.59:8792 [cyclone]=100.66.39.59:8794 [maistral]=100.66.39.59:8795 )

A="${1:-}"
B="${2:-}"
if [[ -z "$A" || -z "$B" || "$A" == "$B" ]]; then
    echo "Usage: $0 <a> <b>   (lowercase dir names, e.g. vortex cyclone)" >&2
    exit 1
fi
AUC="$(echo "$A" | tr 'a-z' 'A-Z')"
BUC="$(echo "$B" | tr 'a-z' 'A-Z')"
AADDR="${ADDRS[$A]:-}"
BADDR="${ADDRS[$B]:-}"
if [[ -z "$AADDR" || -z "$BADDR" ]]; then
    echo "Unknown agent(s): a=$A b=$B (expected: gale/zephyr/squall/tempest/vortex/cyclone/maistral)" >&2
    exit 1
fi
A_DIR="$HOME/$A"
B_DIR="$HOME/$B"
# The lead's dir is ~/agent, not ~/gale
[[ "$A" == "gale" ]] && A_DIR="$HOME/agent"
[[ "$B" == "gale" ]] && B_DIR="$HOME/agent"
[[ -d "$A_DIR" && -d "$B_DIR" ]] || { echo "Missing dir: $A_DIR or $B_DIR" >&2; exit 1; }

TMP_BLOCK="$(mktemp)"
chmod 600 "$TMP_BLOCK"
cleanup() { rm -f "$TMP_BLOCK"; }
trap cleanup EXIT

extract_block() {
    # reads pair_peer.sh's captured stdout on stdin, writes the NAME=/ADDR=/TOKEN= block to $TMP_BLOCK
    awk '/^NAME=/{n=1} n{print} /^TOKEN=/{if(n)exit}' > "$TMP_BLOCK"
}

echo
echo "########## $AUC <-> $BUC ##########"

if grep -qx "NAME=$BUC" "$A_DIR/keys/peers.env" 2>/dev/null; then
    echo "-- $AUC already has $BUC in keys/peers.env, skipping step 1/2."
else
    echo "-- [1/4] Minting $AUC's half for $BUC ..."
    OUT="$(cd "$A_DIR" && ./pair_peer.sh "$BUC" "$BADDR")"
    echo "$OUT"
    echo "$OUT" | extract_block
    echo "-- [2/4] Installing $AUC's half on $B ..."
    (cd "$B_DIR" && ./install_peer_block.sh "$TMP_BLOCK" --service "${B}-peer")
    rm -f "$TMP_BLOCK"; : > "$TMP_BLOCK"; chmod 600 "$TMP_BLOCK"
fi

if grep -qx "NAME=$AUC" "$B_DIR/keys/peers.env" 2>/dev/null; then
    echo "-- $BUC already has $AUC in keys/peers.env, skipping step 3/4."
else
    echo "-- [3/4] Minting $BUC's half for $AUC ..."
    OUT="$(cd "$B_DIR" && ./pair_peer.sh "$AUC" "$AADDR")"
    echo "$OUT"
    echo "$OUT" | extract_block
    echo "-- [4/4] Installing $BUC's half on $A ..."
    (cd "$A_DIR" && ./install_peer_block.sh "$TMP_BLOCK" --service "${A}-peer")
    rm -f "$TMP_BLOCK"; : > "$TMP_BLOCK"; chmod 600 "$TMP_BLOCK"
fi

echo "-- $AUC <-> $BUC done."
echo "Verify two-way with, e.g.:"
echo "  cd ~/$(echo $A) && ./send_to_peer.sh $BUC \"pair test\" \"pair test\""
echo "Clear this terminal's scrollback now -- 2 tokens were printed to it."
