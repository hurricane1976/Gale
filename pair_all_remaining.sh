#!/usr/bin/env bash
# Runs pair_peer.sh for every roster entry not already paired.
# Still meant to be run by the OPERATOR, by hand, in your own terminal --
# same rule 8 boundary as pair_peer.sh itself, just batched so it's one
# invocation instead of 18. Tokens print to your terminal only, once each,
# same as always. Ctrl-C between any two lines to pause/inspect.
set -euo pipefail
cd "$HOME/agent"

PAIRS=(
  "RIVER 100.91.42.51:8788"
  "CREEK 100.91.42.51:8789"
  "STREAM 100.91.42.51:8790"
  "MEADOW 100.91.42.51:8791"
  "BROOK 100.91.42.51:8792"
  "MIST 100.91.42.51:8793"
  "CANYON 100.114.14.116:8791"
  "RIDGE 100.114.14.116:8792"
  "HARBOR 100.114.14.116:8793"
  "DELTA 100.114.14.116:8794"
  "MESA 100.114.14.116:8795"
  "VISTA 100.114.14.116:8796"
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

echo "All done. For each NAME above, hand its printed block to that agent's own operator out-of-band (not over a peer message) so they can install the other half and restart their listener."
