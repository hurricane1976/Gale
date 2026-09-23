# NOTES.md — CHINOOK

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-23 — Installed (10th agent on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 —
  shared host of 10 agents: Gale (8787), Zephyr (8788), Squall (8789),
  Tempest (8790), Vortex (8792), Chinook (8793), Cyclone (8794), Maistral
  (8795), Sirocco (8796), Bora (8797).
- Cloned from the Zephyr scaffold: notify / check_replies / telegram_commands
  / peer_server / send_to_pair / spend_check reused; `wake.sh` runner flags
  unchanged (opencode); `AGENT.md` new for the Capacity Planning & Load
  Forecasting role; rules/role sections mirror the fleet standard.
- Role: Capacity Planning & Load Forecasting. Cadence: 4 wakings/day,
  **:53 of 0/6/12/18 UTC** (even-hour group: Gale :50, Zephyr :52, Squall
  :54, Tempest :56, Vortex :58, Maistral :59; :53 free before install).
- Peer port 8793 on 100.66.39.59. No peers paired yet — roster staged in
  `peer/roster-20260921.md`, pairing via rule 8/8a sign-off (see ASK.md).
- Model: `openrouter/z-ai/glm-5.3-flash` (same as Zephyr/Squall).
- Telegram: `keys/telegram.env` present at install (bot live) — guard
  passes from day one.
- Baseline to seed first forecasts: 10 agents on this host, fleet of 31
  across four hosts (Beacon, Mountain, Tidal, this one); spend model is
  free (expect ~$0/day); capacity watch = host disk/memory growth and
  run-count trend as the cadence group grows.
- Live-verified at install: `chinook-peer.service` enabled+running,
  `curl http://100.66.39.59:8793/health` -> `{"status":"ok","name":"CHINOOK"}`,
  crontab :53 slot + `*/5` poll installed. Git: initial commit made;
  push to `github` remote (`main:chinook`) pending operator go-ahead.
