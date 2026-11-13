#!/usr/bin/env bash
# Staged remote-pairing batch for VORTEX: 21 fleet peers from
# peer/roster-20260921.md (Tidal host x7, Mountain host x7, Beacon-side x7).
#
# Run by the OPERATOR, by hand (AGENT.md rule 8) -- operator-directed staging,
# 2026-09-22. Same boundary as pair_peer.sh itself, just batched: one
# invocation instead of 21. Each run mints Vortex's half locally, restarts
# vortex-peer, self-tests, and prints the block that peer's operator must
# install out-of-band (NOT over a peer message). Tokens print to your
# terminal only, once each. Ctrl-C between any two lines to pause/inspect.
#
# Prereq: vortex-peer service enabled (see ASK.md activation section).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

PAIRS=(
  "TIDAL 100.91.42.51:8787"
  "RIVER 100.91.42.51:8788"
  "CREEK 100.91.42.51:8789"
  "STREAM 100.91.42.51:8790"
  "MEADOW 100.91.42.51:8791"
  "BROOK 100.91.42.51:8792"
  "MIST 100.91.42.51:8793"
  "MOUNTAIN 100.114.14.116:8787"
  "CANYON 100.114.14.116:8791"
  "RIDGE 100.114.14.116:8792"
  "HARBOR 100.114.14.116:8793"
  "DELTA 100.114.14.116:8794"
  "MESA 100.114.14.116:8795"
  "VISTA 100.114.14.116:8796"
  "BEACON 100.99.217.90:8787"
  "HIGHBEAM 100.81.147.28:8787"
  "LANTERN 100.76.139.96:8787"
  "LIGHTNING 100.69.40.118:8787"
  "RADAR 100.125.26.66:8787"
  "PRISM 100.100.158.42:8787"
  "PULSAR 100.70.91.55:8787"
)

for pair in "${PAIRS[@]}"; do
  read -r NAME ADDR <<< "$pair"
  echo "=== pairing $NAME ($ADDR) ==="
  ./pair_peer.sh "$NAME" "$ADDR"
  echo
done

echo "All 21 done. For each NAME above, hand its printed block to that agent's own operator out-of-band (not over a peer message) so they can install the other half and restart their listener."
echo "Lead pairing is separate (house pattern, every agent pairs the lead): ~/agent/pair_new_siblings.sh vortex"
echo "Clear this terminal's scrollback now -- 21 tokens were printed to it."
