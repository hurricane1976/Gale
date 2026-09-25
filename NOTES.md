# NOTES.md — Ostro

## 2026-09-25T17:00Z -- installed (operator-directed, this session)

- Context: clean standard-kit build of the 12th agent on this host.
  Decisions on the record:
  * Role: **Sharpness & Regression Watch** (distinct from Cyclone's
    Production & Fleet Ops and Zephyr's cheap watching — Ostro owns the
    *regression-re-check* half of this host's core output, run the same
    way every waking so the baseline doesn't silently drift).
  * Model: `ollama/qwen3.8:27b` via the LAN Ollama at 192.168.1.197:11434,
    operator-directed — the open-weight cohort's standard runner.
    (Cyclone's AGENT.md still says Muse Spark while its wake.sh runs
    `ollama/qwen3.8:27b`; Ostro's AGENT.md/wake.sh are consistent and the
    first NOTES entry should flag this drift example, then stop re-flagging.)
  * Port: 8798 (verified free at build time against the 8787-8797 sibling
    map).
  * Cron: `45 0,4,8,12,16,20 * * *` — the even-hours family, a distinct
    minute (45) so it never collides with Bora :34 or Chinook :00; plus
    the standard `*/5 * * * * telegram_commands.sh` poll.
  * Clean rebuild principle: started from a wiped directory; copied
    standard-kit code files from cyclone (the 13 scripts + `.gitignore` +
    the two `keys/*.example` + `runbooks/README.md` + `peer/roster-*`),
    sed-renamed `cyclone`/`CYCLONE`/`Cyclone` → `ostro`/`OSTRO`/`Ostro`
    in the 8 self-referencing files (`wake.sh`, `notify.sh`,
    `telegram_commands.py`, `pair_peer.sh`, `rotate_peer.sh`,
    `peers_rotate.py`), then hand-fixed the two places the global rename
    was wrong: (a) `telegram_commands.py UNITS` — `cyclone-peer` is a
    real live unit on this host and must stay in the `/status` check, so
    the line now carries both `cyclone-peer` and `ostro-peer`; (b)
    `peers_rotate.py` + `rotate_peer.sh` share the env var
    `CYCLONE_NEW_TOKEN` which the word-boundary rename left unchanged —
    renamed to `OSTRO_NEW_TOKEN` in both files to match end-to-end.
    Did **not** copy from cyclone: its `keys/peers.env` (its 31 peer
    blocks + tokens are cyclone's), `.git`, `logs/`, `backups/`,
    `__pycache__/`, `peer/inbox/processed/`, `.telegram_*`,
    `pair_remote_batch.sh` (cyclone's 21 staged remote pairings), or any
    of cyclone's NOTES/ASK/AGENT role content.
  * `keys/peers.env` created fresh (600, gitignored): `SELF_NAME=OSTRO`,
    `SELF_BIND=100.66.39.59:8798`, no peer blocks (rule 8/8a gated).
  * `keys/telegram.env` created fresh (600, gitignored): bot token
    `8733136635:...` (bot `@ostroagentsbot`, id 8733136635, operator-
    created, live — getMe verified in this session) and the operator's
    chat id copied verbatim from a live sibling's `keys/telegram.env`
    (digest ca54f308- confirmed identical across bora/chinook/cyclone/
    maistral/tramontane). Token never echoed to a session log; only the
    id/username were printed during the live-bot check.
  * `systemd/ostro-peer.service`: standard sandboxed unit (ProtectSystem=
    strict, ReadWritePaths=/home/agent/ostro/peer, NoNewPrivileges=true,
    PrivateTmp=true), ExecStart=/usr/bin/python3
    /home/agent/ostro/peer_server.py.
  * `opencode.json`: model `ollama/qwen3.8:27b`, 12-agent keys/ deny list
    (the 11 siblings' `keys/` dirs + Ostro's own) in both the `read` and
    `external_directory` sections.
- Staged, NOT installed (operator's choice for this build):
  `systemd/ostro-peer.service`, `ostro.cron`. Activation command set for
  the operator (do not run from this session):
  ```
  sudo install -m 644 -o root -g root systemd/ostro-peer.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable --now ostro-peer
  crontab -l | { cat; cat ostro.cron; } | crontab -
  ```
- Kit inventory (all files in this repo): see standard-kit shape mirrored
  from the squall/zephyr/tempest/cyclone set —
  `wake.sh`, `notify.sh`, `check_replies.sh` + `_check_replies.py`,
  `spend_check.py`, `backup.sh`, `telegram_commands.sh` +
  `telegram_commands.py`, `pair_peer.sh`, `rotate_peer.sh`,
  `peers_rotate.py`, `install_peer_block.sh`, `send_to_peer.sh`,
  `peer_server.py`, `.gitignore`, `keys/peers.env.example` +
  `keys/telegram.env.example`, `runbooks/README.md`,
  `peer/roster-20260921.md`, `systemd/ostro-peer.service`, `ostro.cron`,
  `AGENT.md`, `ASK.md`, `NOTES.md`, `opencode.json`.
- Ports verified live before build: 8787 gale-peer, 8788 zephyr-peer,
  8789 squall-peer, 8790 tempest-peer, 8791 tramontane-peer, 8792
  vortex-peer, 8793 chinook-peer, 8794 cyclone-peer, 8795 maistral-peer,
  8796 sirocco-peer, 8797 bora-peer — 8798 free, chosen for Ostro.
- Fleet state at install: 30 agents on 4 hosts (Beacon, Tidal, Mountain,
  gale-agent); 11 co-resident siblings on this host; the 8-agent open-
  weight cohort (Ostro + 7 siblings) all run `ollama/qwen3.8:27b` via the
  LAN Ollama at 192.168.1.197:11434.
