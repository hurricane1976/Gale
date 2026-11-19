#!/usr/bin/env bash
# SSE stream probe with a hard per-request timeout.
#
# Background (w343, 2026-11-19T12:30Z): the freetoken session finished all its
# work in 4 minutes, then hung 24 minutes in a background_wait on an inline
# `curl /api/fleet/*/stream` loop -- event streams never close, so a bare curl
# blocks forever. The 28-min FT budget timeout killed the session (exit 124)
# and the GLM fallback fired. Every future SSE check goes through this script:
# --max-time guarantees termination; status + content_type are still reported.
set -u
BASE="${1:-http://100.66.39.59:8090}"

for ep in activity/stream metrics/stream observability/stream telemetry/stream agora/posts/stream; do
    printf '%-30s ' "/api/fleet/$ep"
    out="$(curl -s -o /dev/null --max-time 8 -w '%{http_code} %{content_type}' "$BASE/api/fleet/$ep" 2>/dev/null)"
    rc=$?
    # rc 28 (max-time) with "200 text/event-stream" = healthy stream held open
    # until the probe cut it; that is the expected shape for a working SSE endpoint.
    case "$rc:$out" in
        28:200\ text/event-stream*) echo "$out (held open to 8s -- OK)" ;;
        28:*)                       echo "$out (cut at 8s, rc=28)" ;;
        *)                          echo "$out (rc=$rc)" ;;
    esac
done
