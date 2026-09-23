#!/usr/bin/env bash
# install_peer_block.sh — PEER SIDE installer for one fleet pairing block.
#
# Upload this script to the PEER's host (Beacon, Tidal, Mountain or any sibling)
# and run it BY HAND as that peer's operator (AGENT.md rule 8). It never mints
# a token — it only installs the block that was printed by the OTHER side's
# ./pair_peer.sh (e.g. Chinook/Squall/Tempest on gale-agent) and delivered
# out-of-band (not via peer message).
#
# The block is the exact 3-line snippet that pair_peer.sh prints:
#
#   NAME=CHINOOK
#   ADDR=100.66.39.59:8793
#   TOKEN=<64 hex chars>
#
# Token is read from a FILE, never argv, so it stays out of `ps` / shell history.
# The file should be 600 and deleted after install.
#
# Usage:
#   ./install_peer_block.sh <block-file> [--service <systemd-unit>] [--peers <path>]
#   ./install_peer_block.sh --help
#
# Examples:
#   # peer operator receives block via out-of-band channel, saves to /tmp/chinook.block (600):
#   ./install_peer_block.sh /tmp/chinook.block
#   rm /tmp/chinook.block  # clear scrollback/history too
#
#   # if your peer service is not <selfname>-peer (auto-detected from SELF_NAME):
#   ./install_peer_block.sh /tmp/chinook.block --service beacon-peer
#
#   # pipe without a file (token still not on argv, but shell history may keep the heredoc):
#   cat > /tmp/block <<'EOF'
#   NAME=CHINOOK
#   ADDR=100.66.39.59:8793
#   TOKEN=...
#   EOF
#   ./install_peer_block.sh /tmp/block && rm /tmp/block
#
set -euo pipefail
umask 077

# ---------- arg parse ----------
PEERS="keys/peers.env"
SERVICE=""
BLOCK_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service) SERVICE="${2:-}"; shift 2 ;;
    --peers) PEERS="${2:-}"; shift 2 ;;
    --help|-h)
      sed -n '2,40p' "$0" | sed 's/^# //;s/^#//'
      exit 0
      ;;
    --) shift; break ;;
    -*)
      echo "Unknown option: $1 (see --help)" >&2
      exit 1
      ;;
    *)
      if [[ -z "$BLOCK_FILE" ]]; then BLOCK_FILE="$1"; else echo "Too many positional args: $1" >&2; exit 1; fi
      shift
      ;;
  esac
done

if [[ -z "$BLOCK_FILE" ]]; then
  echo "Usage: $0 <block-file> [--service <unit>] [--peers <path>]" >&2
  echo "  block-file must contain NAME= ADDR= TOKEN= (3 lines, as printed by pair_peer.sh)" >&2
  exit 1
fi
if [[ ! -f "$BLOCK_FILE" ]]; then echo "Missing block file: $BLOCK_FILE" >&2; exit 1; fi
if [[ ! -f "$PEERS" ]]; then echo "Missing $PEERS — are you in the right agent dir? Use --peers to override." >&2; exit 1; fi

# ---------- parse block file ----------
NAME=""
ADDR=""
TOKEN=""
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" == \#* ]] && continue
  [[ "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  # trim
  key="$(echo "$key" | tr -d '[:space:]')"
  val="$(echo "$val" | tr -d '[:space:]')"
  case "$key" in
    NAME) NAME="$val" ;;
    ADDR) ADDR="$val" ;;
    TOKEN) TOKEN="$val" ;;
  esac
done < "$BLOCK_FILE"

if [[ -z "$NAME" || -z "$ADDR" || -z "$TOKEN" ]]; then
  echo "Block file must contain NAME=, ADDR=, and TOKEN= (got NAME='$NAME' ADDR='$ADDR' TOKEN='${#TOKEN} chars')" >&2
  exit 1
fi

# ---------- validate ----------
if [[ ! "$NAME" =~ ^[A-Z][A-Z0-9_-]{0,31}$ ]]; then echo "NAME must be UPPERCASE [A-Z][A-Z0-9_-]{0,31}, got '$NAME'" >&2; exit 1; fi
if [[ ! "$ADDR" =~ ^100\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]{2,5}$ ]]; then echo "ADDR must be Tailscale 100.x.x.x:port, got '$ADDR'" >&2; exit 1; fi
if [[ ! "$TOKEN" =~ ^[0-9a-f]{64}$ ]]; then echo "TOKEN must be 64 lowercase hex chars (openssl rand -hex 32), got ${#TOKEN} chars" >&2; exit 1; fi
if grep -qx "NAME=$NAME" "$PEERS"; then echo "$NAME is already in $PEERS — not installing a second block." >&2; exit 1; fi

SELF_BIND="$(grep -E '^SELF_BIND=' "$PEERS" | head -1 | cut -d= -f2-)"
SELF_NAME="$(grep -E '^SELF_NAME=' "$PEERS" | head -1 | cut -d= -f2-)"
if [[ -z "$SELF_BIND" ]]; then echo "$PEERS: SELF_BIND missing" >&2; exit 1; fi
if [[ -z "$SELF_NAME" ]]; then SELF_NAME="unknown"; fi

# auto-detect service if not given: <selfname>-peer lowercased
if [[ -z "$SERVICE" ]]; then
  SERVICE="$(echo "$SELF_NAME" | tr 'A-Z' 'a-z')-peer"
fi

# ---------- install ----------
BACKUP="$PEERS.bak-pre-$NAME-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p "$PEERS" "$BACKUP"
chmod 600 "$BACKUP"
{
  echo ""
  echo "# $NAME pairing -- installed $(date -u +%FT%TZ) via install_peer_block.sh (peer side)."
  echo "# Block delivered out-of-band from $NAME ($ADDR); token identical on both boxes."
  echo "NAME=$NAME"
  echo "ADDR=$ADDR"
  echo "TOKEN=$TOKEN"
} >> "$PEERS"
chmod 600 "$PEERS"

echo "Installed $NAME ($ADDR) into $PEERS (backup: $BACKUP), restarting $SERVICE..."
# clear token from shell vars before restart so it doesn't linger in env
TOKEN_CP="$TOKEN"
NAME_CP="$NAME"
ADDR_CP="$ADDR"
unset TOKEN

# ---------- restart & self-test ----------
if ! sudo systemctl restart "$SERVICE" 2>&1; then
  echo "FAIL: systemctl restart $SERVICE failed — restoring backup" >&2
  cp -p "$BACKUP" "$PEERS"
  sudo systemctl restart "$SERVICE" || true
  exit 1
fi
sleep 2
if ! systemctl is-active --quiet "$SERVICE"; then
  echo "FAIL: $SERVICE not active after restart — restoring backup" >&2
  cp -p "$BACKUP" "$PEERS"
  sudo systemctl restart "$SERVICE" || true
  exit 1
fi

# self-test: our listener should now accept TOKEN as NAME, reject wrong token
SELF_ADDR="$SELF_BIND"
CODE="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
  -H "Authorization: Bearer ${TOKEN_CP}" -H "Content-Type: application/json" \
  -d '{"subject":"selftest","body":"peer receiving-half self-test; safe to delete"}' || echo "000")"
BAD="$(curl -s -m 5 -o /dev/null -w '%{http_code}' -X POST "http://${SELF_ADDR}/inbox" \
  -H "Authorization: Bearer 0000" -H "Content-Type: application/json" -d '{}' || echo "000")"
FROM="?"
F="$(ls -t peer/inbox/*-"$NAME_CP"-*.json 2>/dev/null | head -1 || true)"
if [[ -n "$F" ]]; then
  FROM="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("from","?"))' "$F" 2>/dev/null || echo "?")"
  rm -f "$F"
fi

echo "self-test: right token -> HTTP $CODE (want 200), recorded sender = $FROM (want $NAME_CP); wrong token -> HTTP $BAD (want 401)"
if [[ "$CODE" != "200" || "$FROM" != "$NAME_CP" || "$BAD" != "401" ]]; then
  echo "SELF-TEST FAILED — restoring backup: cp -p $BACKUP $PEERS && sudo systemctl restart $SERVICE" >&2
  cp -p "$BACKUP" "$PEERS"
  sudo systemctl restart "$SERVICE" || true
  exit 1
fi

# ---------- record (never the token) ----------
if [[ -f "NOTES.md" ]]; then
  printf '\n## %s -- paired with %s (peer side)\n\n- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.\n' \
    "$(date -u +%FT%TZ)" "$NAME_CP" >> NOTES.md 2>/dev/null || true
fi

# clear sensitive vars
unset TOKEN_CP NAME_CP ADDR_CP

cat <<EOF

=================== $NAME INSTALLED (PEER SIDE) ===================
$SELF_NAME now accepts $NAME ($ADDR) — self-test passed (200/401).
Backup: $BACKUP
Next: test two-way from this box with:
  ./send_to_peer.sh $NAME "hello from $SELF_NAME" "pair test"
Then delete the block file and clear scrollback:
  rm -f "$BLOCK_FILE"
===============================================================
EOF
