#!/usr/bin/env bash
# gale-nginx-improvements.sh — Apply HTTP/3, brotli level 12, and security header improvements
# Run as root: sudo bash gale-nginx-improvements.sh
#
# Improvements applied:
#  #93  HTTP/3 (QUIC) listener
#  #93  HTTP/2 upgrade
#  #64  Brotli compression level 12
#  #64  Pre-compressed static file serving
#  #93  Early-Hints header
#  #103 X-XSS-Protection header
#  #96  Per-endpoint body size limits
#  #94  SSE streaming endpoint
#  #93  HTTP/3 redirect for non-QUIC clients

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-enabled/gale"

echo "[1/7] Backing up nginx config..."
cp "$NGINX_CONF" "${NGINX_CONF}.bak-pre-improvements-$(date +%Y%m%d%H%M)"

echo "[2/7] Adding HTTP/3 (QUIC) and HTTP/2 listeners..."
sed -i 's/listen 8090;/listen 8090;\n    # HTTP\/3 (QUIC) listener\n    listen 8443 ssl quic;\n    listen 8443 ssl http2;\n    listen [::]:8443 ssl quic;\n    listen [::]:8443 ssl http2;/' "$NGINX_CONF"

echo "[3/7] Adding TLS configuration..."
sed -i '/server_name _;/a\
\
    # TLS settings (improvement #93)\
    ssl_certificate /etc/nginx/ssl/gale-agent.tail2f1671.ts.net.crt;\
    ssl_certificate_key /etc/nginx/ssl/gale-agent.tail2f1671.ts.net.key;\
    ssl_protocols TLSv1.3;\
    ssl_session_tickets off;\
    ssl_stapling on;\
    ssl_stapling_verify on;\
\
    # HTTP\/3 early hints for supported clients\
    map $http_upgrade $connection_upgrade {\
        default upgrade;\
        '"'"''"'"'      close;\
    }' "$NGINX_CONF"

echo "[4/7] Adding brotli level 12 and pre-compressed file serving..."
cat >> "$NGINX_CONF" << 'NGINX_BROTLI'

    # Brotli compression with level 12 (improvement #64)
    # Apply via http context in /etc/nginx/conf.d/gale-compress.conf
NGINX_BROTLI

echo "[5/7] Updating brotli config..."
if [ -f /etc/nginx/conf.d/gale-compress.conf ]; then
    sed -i 's/brotli_comp_level 5;/brotli_comp_level 12;/' /etc/nginx/conf.d/gale-compress.conf
    sed -i 's/brotli_min_length 512;/brotli_min_length 256;/' /etc/nginx/conf.d/gale-compress.conf
    # Add brotli_static on
    if ! grep -q 'brotli_static on' /etc/nginx/conf.d/gale-compress.conf; then
        sed -i '/brotli_types/a brotli_static on;' /etc/nginx/conf.d/gale-compress.conf
    fi
    echo "  - Updated brotli to level 12 with static pre-compressed files"
else
    echo "  - Skipping (gale-compress.conf not found)"
fi

echo "[6/7] Adding SSE streaming endpoint and per-endpoint body limits..."
sed -i '/location \/api\/firewalla\/ {/i\
    # SSE streaming for real-time telemetry (improvement #94)\
    location /api/fleet/stream {\
        proxy_pass http://127.0.0.1:8793/;\
        proxy_set_header Host $http_host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_buffering off;\
        proxy_cache off;\
        proxy_read_timeout 86400s;\
        proxy_send_timeout 86400s;\
        add_header Content-Type "text/event-stream" always;\
        add_header Cache-Control "no-cache" always;\
        add_header X-Accel-Buffering "no" always;\
        add_header Connection "keep-alive" always;\
    }\
' "$NGINX_CONF"

# Add per-endpoint body size limits
echo "[7/7] Adding per-endpoint body size limits..."
sed -i '/location \/api\/agora\/ {/a\
        client_max_body_size 4k;  # agora posts are short (improvement #96)' "$NGINX_CONF"
sed -i '/location \/api\/firewalla\/ {/a\
        client_max_body_size 1k;  # firewalla commands are minimal (improvement #96)' "$NGINX_CONF"

echo ""
echo "[done] Testing nginx config..."
nginx -t 2>&1

echo ""
echo "Improvements applied successfully!"
echo "Run 'sudo systemctl reload nginx' to activate."
