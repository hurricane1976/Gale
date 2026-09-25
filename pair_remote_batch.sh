#!/usr/bin/env bash
# Staged remote-pairing batch for TRAMONTANE: 19 fleet peers in 401 state
# (roster-20260921.md; BEACON + MOUNTAIN removed 2026-09-23 — already
# two-way, verified in ledger/20260923-outbound-verify.md).
#
# Tramontane's half is ALREADY INSTALLED for all 19 (fleet-provision
# 20260923T124156Z; see keys/peers.env). So this script does NOT mint or
# call pair_peer.sh — it only formats the EXISTING shared tokens from
# keys/peers.env into per-lead install blocks:
#   pairout/for_TIDAL.txt     <- TIDAL host 100.91.42.51 (7 blocks, incl. TIDAL itself)
#   pairout/for_MOUNTAIN.txt  <- Mountain host 100.114.14.116 (6 blocks)
#   pairout/for_BEACON.txt    <- Beacon-side, 1 box each (6 blocks)
# Each block is the exact 3-line snippet install_peer_block.sh (or the lead's
# interactive session) installs on the PEER's box:
#   NAME=TRAMONTANE
#   ADDR=100.66.39.59:8797
#   TOKEN=<the shared token, already in keys/peers.env>
# Tokens land ONLY in those files (mode 600) -- not on the terminal.
#
# Then the lead runs install_peer_block.sh <block-file> on the peer box,
# which appends the block to the peer's keys/peers.env, restarts the peer's
# *-peer service, and self-tests (200/401). Run by the OPERATOR, by hand
# (AGENT.md rule 8).
set -euo pipefail
umask 077
cd "$(dirname "${BASH_SOURCE[0]}")"

PEERS="keys/peers.env"
SELF_NAME="$(grep -E '^SELF_NAME=' "$PEERS" | head -1 | cut -d= -f2-)"
SELF_BIND="$(grep -E '^SELF_BIND=' "$PEERS" | head -1 | cut -d= -f2-)"
if [[ -z "$SELF_NAME" || -z "$SELF_BIND" ]]; then
  echo "SELF_NAME/SELF_BIND missing in $PEERS" >&2; exit 1
fi

# name -> lead host
LEADS=(
  "TIDAL TIDAL"
  "RIVER TIDAL"
  "CREEK TIDAL"
  "STREAM TIDAL"
  "MEADOW TIDAL"
  "BROOK TIDAL"
  "MIST TIDAL"
  "CANYON MOUNTAIN"
  "RIDGE MOUNTAIN"
  "HARBOR MOUNTAIN"
  "DELTA MOUNTAIN"
  "MESA MOUNTAIN"
  "VISTA MOUNTAIN"
  "HIGHBEAM BEACON"
  "LANTERN BEACON"
  "LIGHTNING BEACON"
  "RADAR BEACON"
  "PRISM BEACON"
  "PULSAR BEACON"
)

peer_token() { # name -> shared token from peers.env; exits 1 if absent
  python3 - "$PEERS" "$1" <<'PY'
import sys
peers, want = sys.argv[1], sys.argv[2]
tok = ""
name = None
for line in open(peers):
    line = line.strip()
    if line.startswith("NAME="):   name = line.split("=",1)[1].strip()
    elif line.startswith("TOKEN="):
        tok = line.split("=",1)[1].strip()
        if name == want: sys.stdout.write(tok); sys.exit(0)
        tok = ""
sys.exit(1)
PY
}

OUT="pairout"
mkdir -p "$OUT"
chmod 700 "$OUT"
rm -f "$OUT/for_TIDAL.txt" "$OUT/for_MOUNTAIN.txt" "$OUT/for_BEACON.txt"
for f in TIDAL MOUNTAIN BEACON; do : > "$OUT/for_$f.txt"; done

for entry in "${LEADS[@]}"; do
  read -r NAME LEAD <<< "$entry"
  TOKEN="$(peer_token "$NAME")" || { echo "FAIL: no token for $NAME in $PEERS" >&2; exit 1; }
  if [[ ! "$TOKEN" =~ ^[0-9a-f]{64}$ ]]; then
    echo "FAIL: $NAME token malformed (${#TOKEN} chars)" >&2; exit 1
  fi
  FILE="$OUT/for_${LEAD}.txt"
  {
    echo "# ---- $NAME: install on the $NAME peer box: ./install_peer_block.sh <this block> ----"
    echo "NAME=$SELF_NAME"
    echo "ADDR=$SELF_BIND"
    echo "TOKEN=$TOKEN"
    echo
  } >> "$FILE"
  chmod 600 "$FILE"
  echo "wrote block for $NAME -> $FILE"
done

echo
echo "All 19 blocks collected (mode 600) from existing keys/peers.env — no minting:"
for f in "$OUT"/for_TIDAL.txt "$OUT"/for_MOUNTAIN.txt "$OUT"/for_BEACON.txt; do
  printf '  %s  (%s blocks)\n' "$f" "$(grep -c '^NAME=' "$f")"
done
cat <<'EOF'

On each peer box the lead installs its block (token stays off the terminal):
  ./install_peer_block.sh /tmp/<name>.block        # appends, restarts, self-tests 200/401
Then from Tramontane verify two-way:
  ./send_to_peer.sh <NAME> "hello from TRAMONTANE" "pair test"
EOF
