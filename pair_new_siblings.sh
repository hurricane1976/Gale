#!/usr/bin/env bash
# pair_new_siblings.sh — full two-way pairing between Gale and each of the
# new same-host siblings (Zephyr/Squall/Tempest, plus Vortex/Cyclone added
# 2026-09-22), in one run.
#
# Meant to be run by the OPERATOR, by hand, in your own terminal -- same
# rule 8 boundary as pair_peer.sh/install_peer_block.sh themselves (Gale
# never mints or installs peer tokens on its own, batched or not). This
# just saves you the 12 manual copy/paste steps since all four agents are
# on this one box under one operator.
#
# For each sibling this does, in order:
#   1. ~/agent  : ./pair_peer.sh <NAME> <addr>        (mint Gale's half)
#   2. ~/<name> : ./install_peer_block.sh ...          (install it there)
#   3. ~/<name> : ./pair_peer.sh GALE <gale-addr>      (mint sibling's half)
#   4. ~/agent  : ./install_peer_block.sh ...           (install it here)
#
# Tokens are captured straight from each pair_peer.sh's stdout into a
# 600-perm temp file (never argv, never left on disk after use) and are
# still printed to your terminal once each, exactly as pair_peer.sh
# already does on its own -- that part isn't changed or suppressed here.
#
# Usage: ./pair_new_siblings.sh [NAME...]
#   No args = all five (zephyr squall tempest vortex cyclone). Or name a
#   subset, e.g.:
#   ./pair_new_siblings.sh zephyr vortex
set -euo pipefail
umask 077

GALE_DIR="$HOME/agent"
GALE_ADDR="100.66.39.59:8787"

declare -A ADDRS=( [zephyr]=100.66.39.59:8788 [squall]=100.66.39.59:8789 [tempest]=100.66.39.59:8790 [vortex]=100.66.39.59:8792 [cyclone]=100.66.39.59:8794 )

TARGETS=("$@")
if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=(zephyr squall tempest vortex cyclone)
fi

TMP_BLOCK="$(mktemp)"
chmod 600 "$TMP_BLOCK"
cleanup() { rm -f "$TMP_BLOCK"; }
trap cleanup EXIT

extract_block() {
  # reads pair_peer.sh's captured stdout on stdin, writes the NAME=/ADDR=/TOKEN= block to $TMP_BLOCK
  awk '/^NAME=/{n=1} n{print} /^TOKEN=/{if(n)exit}' > "$TMP_BLOCK"
}

for lc in "${TARGETS[@]}"; do
  UC="$(echo "$lc" | tr 'a-z' 'A-Z')"
  ADDR="${ADDRS[$lc]:-}"
  DIR="$HOME/$lc"

  if [[ -z "$ADDR" ]]; then echo "Unknown sibling: $lc (expected zephyr/squall/tempest/vortex/cyclone)" >&2; exit 1; fi
  if [[ ! -d "$DIR" ]]; then echo "Missing dir: $DIR" >&2; exit 1; fi

  echo
  echo "########## $UC ($ADDR) ##########"

  if grep -qx "NAME=$UC" "$GALE_DIR/keys/peers.env" 2>/dev/null; then
    echo "-- Gale already has $UC in keys/peers.env, skipping step 1/2."
  else
    echo "-- [1/4] Minting Gale's half for $UC ..."
    OUT="$(cd "$GALE_DIR" && ./pair_peer.sh "$UC" "$ADDR")"
    echo "$OUT"
    echo "$OUT" | extract_block
    echo "-- [2/4] Installing Gale's half on $lc ..."
    (cd "$DIR" && ./install_peer_block.sh "$TMP_BLOCK" --service "${lc}-peer")
    rm -f "$TMP_BLOCK"; : > "$TMP_BLOCK"; chmod 600 "$TMP_BLOCK"
  fi

  if grep -qx "NAME=GALE" "$DIR/keys/peers.env" 2>/dev/null; then
    echo "-- $UC already has GALE in keys/peers.env, skipping step 3/4."
  else
    echo "-- [3/4] Minting $UC's half for Gale ..."
    OUT="$(cd "$DIR" && ./pair_peer.sh GALE "$GALE_ADDR")"
    echo "$OUT"
    echo "$OUT" | extract_block
    echo "-- [4/4] Installing $UC's half on Gale ..."
    (cd "$GALE_DIR" && ./install_peer_block.sh "$TMP_BLOCK" --service gale-peer)
    rm -f "$TMP_BLOCK"; : > "$TMP_BLOCK"; chmod 600 "$TMP_BLOCK"
  fi

  echo "-- $UC <-> GALE done."
done

echo
echo "All requested siblings processed. Verify two-way with, e.g.:"
echo "  cd ~/agent && ./send_to_peer.sh ZEPHYR \"hello from Gale\" \"pair test\""
echo "Clear this terminal's scrollback now -- tokens were printed to it above."
