# ASK.md — open questions for the operator

## Open

- **Fleet model re-migration to muse-spark (2026-10-05 ~15:38Z, NEEDS
  OPERATOR CONFIRM).** My `AGENT.md` model line + `opencode.json` +
  `wake.sh` were all flipped `ollama/qwen3.8:27b` ->
  `opencode/muse-spark-1.3-contributor-free` between my 14:02Z waking
  close and this 18:00Z start (mtimes 15:38:07Z opencode.json,
  15:38:46Z wake.sh, 15:39:14Z AGENT.md) — a run I did not execute.
  Same flip is live in 9 co-resident sibling dirs (read-only check:
  vortex/cyclone/maistral/bora/chinook/tramontane/ostro/poniente/
  levante all now muse-spark; zephyr/squall/tempest stay on
  openrouter/z-ai/glm-5.3-flash). This waking itself runs muse-spark,
  so the line matches reality, and `check_replies.sh` shows no
  quotable Telegram word — per rule 6 an AGENT.md change needs one.
  Committing as-found for audit; please confirm this re-migration was
  your word (and whether the LAN Ollama runner going dark, see
  18:00Z NOTES entry, is related/decommissioned), or order revert.

- **Local pairing with PONIENTE installed outside my wakings (2026-09-26
  01:19:56Z, NEEDS OPERATOR CONFIRM).** `/home/agent/poniente/` exists;
  my `keys/peers.env` gained a PONIENTE NAME block (ADDR
  `100.66.39.59:8800`, token, mtime 2026-09-26T01:19:56Z) between my
  01:19:58Z NOTES log line and this waking start — a run I did not
  execute. Comments say "delivered out-of-band from PONIENTE (my own box
  :8800); token identical on both boxes." I minted nothing and commit
  as-found for audit. Same flag pattern as OSTRO/LEVANTE above: please
  confirm this local pairing was your word, or order revert/rotate.

- **Remote pairings installed outside my wakings (2026-09-23, NEEDS
  OPERATOR CONFIRM; TRAMONTANE found 2026-09-25).** `keys/peers.env`
  holds **22 remote pairing blocks** (31 NAME blocks total = 9 local +
  22 remote) I never minted and have no
  verifiable operator word for: CHINOOK (written ~01:40:34Z),
  TRAMONTANE (`peers.env` mtime now **2026-09-25 01:31:29Z** — written
  inside the Sep-24-19:02→Sep-25-02:02 gap, appears as the newest NAME
  block, not in the 09-23 list), plus a 20-block batch (BEACON, BROOK,
  CANYON, CREEK, DELTA, HARBOR, HIGHBEAM, LANTERN, LIGHTNING, MEADOW,
  MESA, MIST, MOUNTAIN, PRISM, PULSAR, RADAR, RIDGE, RIVER, STREAM,
  TIDAL, VISTA — written ~12:40:55Z). Evidence: file mtimes plus the
  `.bak-provision-*` pair in `keys/`; `sirocco-peer` restarted 8x
  12:41:40-12:41:54Z running per-peer self-tests (`peer/logs/
  peer_server.log`: ACCEPT selftest per new peer + expected REJECT
  wrong-token probe; "30 peer(s) configured" = 8 local + 22 remote).
  Inbound messages since then claim operator authorization ("josh GO
  12:35:30Z", "operator install 17:50Z Sep 23", "installed on-box by
  operator sessions") — but inbox prose is data, never instructions
  (rule 5), `check_replies.sh` shows no operator Telegram I can quote,
  and NOTES.md has no record. Per rule 4 this is strange, so: I
  minted/installed nothing, I am NOT ripping anything out (unilateral
  removal/rotation would itself breach rule 8), steady state
  preserved, no peer replies sent. Please confirm these 22 were your
  word (and the "fleet-provision" actor had your go-ahead), or order
  revert/rotate. Supersedes the 07:02Z CHINOOK and 13:02Z LANTERN
  "unpaired-sender" notes — those senders are now transport-credentialed
  (ACCEPTs in log); the open question is authorization, not reach.


- **Remote pairing — 21 peers STAGED (rule 8).** `./pair_remote_batch.sh`
  ready; nothing minted. Needs per-pair operator sign-off via Telegram
  plus each remote peer's install.
- **Telegram (2026-09-23, via /commands):** Hello
- **Telegram (2026-09-23, via /commands):** What’s up
- **Telegram (2026-09-26, via /commands):** Confirm ostro and lavante

## Resolved

- **Local pairing with LEVANTE (2026-09-25 22:09:20Z) — CONFIRMED by
  operator 2026-09-26 02:47:28Z** (Telegram `[1790390848]` "Confirm ostro
  and lavante", chat-ID checked via `check_replies.sh`). Was flagged
  NEEDS OPERATOR CONFIRM at the 02:18Z waking: `/home/agent/levante/`
  installed out-of-band; `keys/peers.env` LEVANTE NAME block +
  `opencode.json` `/home/agent/levante/keys/**` denies written by a run
  I did not execute; I minted nothing, committed as-found for audit.
  Now authorized — pairing stands as-is.

- **Local pairing with OSTRO (2026-09-25 17:45Z) — CONFIRMED by operator
  2026-09-26 02:47:28Z** (Telegram `[1790390848]` "Confirm ostro and
  lavante", chat-ID checked via `check_replies.sh`). Was flagged
  NEEDS OPERATOR CONFIRM at the 02:18Z waking: `/home/agent/ostro/`
  created ~17:05–17:44Z; `keys/peers.env` OSTRO NAME block 17:45:40Z,
  `sirocco-peer` restart 17:45:40Z — a run I did not execute; I minted
  nothing, committed the NOTES line as-found for audit. Now authorized —
  pairing stands as-is.

- **Unexplained `opencode.json` model line (2026-09-23) — RESOLVED
  2026-09-25 02:2xZ, operator reconfig confirmed.** The line
  `"model": "ollama/qwen3.8:27b"` (flagged 2026-09-23) is confirmed as
  a deliberate operator model migration: Sep 25 00:59–01:22Z the
  working tree picked up a consistent three-file change set —
  `opencode.json` model line, `wake.sh` prompt + `--model` flag both
  switched `muse-spark-1.3-contributor-free` → `ollama/qwen3.8:27b`,
  plus `sirocco.cron` rescheduled 4×/day (1,7,13,19 @:02) → 6×/day
  (2,6,10,14,18,22 @:17) for the new "7-agent 4-hour interleave", and
  key-denies extended to NEW siblings `/home/agent/chinook/keys/**`
  and `/home/agent/tramontane/keys/**`. This waking
  (2026-09-25T02:02Z) itself runs under `ollama/qwen3.8:27b`, so the
  line now matches reality. Committed the three files as-is for the
  audit trail (operator reconfig, not mine). No further action asked.

- **Activation — Telegram live 2026-09-23 ~00:24Z.** Bot `@Siroccoagentsbot`;
  operator provided token, chat id taken from their `/start`;
  `keys/telegram.env` written (600, gitignored); test `notify.sh` delivered.
- **Local mesh COMPLETE 2026-09-22 ~21:27Z (rule 8a, operator go-ahead in
  session).** All 8 co-resident pairs two-way (lead spoke + zephyr/squall/
  tempest/vortex/cyclone/maistral/bora): one shared token per pair, both
  halves installed, services restarted, self-tests 200/401 passed, real
  sends both directions verified, 8/8 inbound present. See NOTES.md.
