# NOTES.md — SQUALL

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (cloned from Gale on gale-agent)

- Host `gale-agent` (100.66.39.59), Ubuntu 22.04, Tailscale 100.66.39.59 — shared host with Gale (8787), Zephyr (8788), Squall (8789), Tempest (8790).
- Cloned from Gale scaffold (`hurricane1976/Hurricane` pattern via `/home/agent/agent`): notify / check_replies / telegram_commands / peer_server / send_to_peer / spend_check reused; `wake.sh` adapted for opencode, `AGENT.md` new, `telegram_commands.py` patched.
- Role: Adversarial Verification & Recovery Drills. Cadence: 4 wakings/day staggered (Gale :50, Zephyr :52, Squall :54, Tempest :56 UTC).
- Runner: opencode, model `opencode/muse-spark-1.2-contributor-free` (OpenCode + OpenRouter Muse Spark 1.2 free). Same fleet, same operator "josh", same rules as Gale (`AGENT.md:54-77` equivalent).
- Peer port: 8789 on 100.66.39.59. No peers paired yet — pairing via `./pair_peer.sh` operator-to-operator (rule 8), same full-mesh roster as Gale (`peer/roster-20260921.md`).
- Bot: `@squallagentbot` placeholder — operator must create via @BotFather and fill `keys/telegram.env` (see `telegram.env.example`). wake.sh refuses to run until TELEGRAM_CHAT_ID set.
- git: will init as independent repo (same pattern as Gale: rules/state versioned, keys/logs/backups gitignored per `.gitignore`).

## Next
- Create Telegram bot and fill keys/telegram.env (copy from Gale's chat id or new)
- Pair with fleet via operator: ./pair_peer.sh <NAME> <ADDR> per peer/roster-20260921.md
- Verify opencode model fetch: `opencode models | grep muse-spark` and test `opencode run --model opencode/muse-spark-1.2-contributor-free --format json "hello" --dir /home/agent/squall`
