# Runbook: scaffold a new resident agent (onboarding checklist)

Scope: the canonical end-to-end checklist for turning "an idea for an agent"
into a working resident on this host (`gale-agent`), plus the red/green
verification Bora runs when asked to confirm a scaffold. Based on the actual
Bora/Sirocco/Poniente builds (2026-09-22 → 09-26) — when the host gains a
port, a slot, or a lesson, update this file, not the agents' notes.

## Preconditions (operator-side, Bora never does these)
- A chosen name and a role description (the AGENT.md prose).
- A cron slot chosen so no two fleet wakes start within 25 min of each
  other (14-agent 25-min grid, operator-directed 2026-10-07; `bora.cron`
  style: one `wake` line `MM H1,H2,... * * *` + one `*/5` telegram poll
  line). Pick a (minute, hour-set) pair not already used and 25 min clear
  of siblings sharing your hour-set.
- A tailnet port in the 8787–8800 block not currently bound by a sibling
  (check `ss -ltn | grep 100.66.39.59`).
- Telegram bot keys (`keys/telegram.env`, mode 600) — Bora refuses an
  unattended wake without them; the operator mints/installs.
- Pairing tokens (rule 8/8a/8b): operator or authorized scope mints. Bora
  never mints on its own initiative.

## Checklist (in build order)
1. **Dir + git.** `mkdir /home/agent/<name>`; `git init` from the start —
   rules files outside version control are how Beacon lost its history.
   Add `.gitignore` covering `keys/*` (except `*.example`),
   `peer/inbox/processed/`, `backups/`, `logs/`, `pairout/`, and
   `peers.env*` before the first commit.
2. **Config.** `opencode.json`: `"model": "opencode/glm-5.3-flash"` (or
   whatever the operator pins for that agent — model lineage is
   operator-directed and changes; check `wake.sh`'s header note) +
   `permission.read` and `permission.external_directory` deny-lists for
   **every** sibling's `keys/` dir including its own and gale-website's
   (`/home/agent/agent`) — 14 dirs as of 2026-10-01 (Bora's own list is
   the model; note the 09-30 lesson: ostro was missing until the 10-01
   10h pass caught it).
3. **Scripts (each must pass `bash -n` clean before wiring):**
   - `wake.sh` — flock single-instance guard, 45m wall clock, spend record
     (see Bora's `wake.sh`), Telegram-gate, shell-side failure alert.
   - `notify.sh` — refuses safely when `keys/telegram.env` is absent.
   - `check_replies.sh` — no-op-safe until the bot exists.
   - `backup.sh` — snapshot excluding `logs/`, `backups/`,
     `peer/inbox/processed/`, and every `keys/` file except `*.example`;
     read-back verify; keep newest 14.
   - `peer_server.py` + `telegram_commands.sh` (copied shape from Bora's,
     port + name changed).
4. **Keys dir.** `mkdir keys` (mode 700); place `telegram.env` (operator),
   `peers.env` (only when a pairing is actually minted for this agent —
   empty file is fine), and `*.example` placeholder templates with
   placeholder-only values (these are the ones tracked in git).
5. **systemd unit.** `systemd/<name>-peer.service` — model on
   `bora-peer.service`: `ProtectSystem=strict`,
   `ReadWritePaths=.../peer`, `NoNewPrivileges=true`, `PrivateTmp=true`,
   `Restart=on-failure`. Enable + start; confirm `active`.
6. **Cron.** Write `<name>.cron` (wake line + `*/5` poll line) and install
   into the live crontab. Verify against the 2026-10-07 14-agent 25-min
   grid: every wake start ≥25 min from every sibling's (same minute is
   only allowed on disjoint hour-sets — e.g. GALE `:00 0,6,12,18` vs
   VORTEX `:00 5,11,17,23` is fine). The old GALE/CHINOOK/SIROCCO
   `:00-of-hour` overlaps were resolved by that grid.
7. **Roster wiring.** Sibling `opencode.json` deny-lists gain the new
   agent's `keys/` dir (each agent's own repo — Bora flags it to the
   owning agent, never edits it). Roster file (e.g. `peer/roster-*.md`)
   updated with name/port/dir.
8. **git commit + backup.** First commit of the whole scaffold (keys
   excluded by gitignore — double-check with `git status --ignored`),
   then one `./backup.sh` run and read-back.

## Verification (red/green report to operator)
- `bash -n` clean on every shell script in the dir.
- `./wake.sh` refuses safely without Telegram keys (log line in
  `logs/wake-skipped.log`, clean exit).
- Peer listener serves `/health` on its assigned tailnet port and answers
  with its own name (`curl http://100.66.39.59:<port>/health`).
- systemd unit `enabled` + `active`; killing it brings it back
  (`Restart=on-failure`).
- Cron installed; `crontab -l` shows exactly one wake line + one `*/5`
  line for the agent; every wake start ≥25 min from any sibling's
  (25-min grid rule, 2026-10-07).
- `./backup.sh` produces a readable snapshot; core files
  (AGENT.md/NOTES.md/wake.sh/peer_server.py) present in the listing.
- `./notify.sh` round-trips a test message to the operator's exact chat id.

## Retiring an agent (inverse)
1. Stop + disable + remove the systemd unit.
2. Remove both cron lines from the live crontab; remove `<name>.cron`.
3. Remove the peer listener's port from the tailnet (it frees up).
4. Sibling `opencode.json` files: the deny rule for the retired dir may be
   left (harmless) or removed by the owning agent — flag, don't edit.
5. `keys/` dir: operator decides (token revocation is rule-8 gated).
6. Final `./backup.sh` of the retiring dir by whoever owns it; move the
   dir per operator instruction — Bora never deletes another agent's home.

## Lessons
- 2026-10-01 10h waking: Bora's own `opencode.json` deny list was missing
  `/home/agent/ostro/keys` (13 of 14 siblings covered). Added the line.
  Check the deny list against `ls /home/agent/*/keys` every scaffolding
  pass — not just when minting new rules.
- 2026-09-29 02h waking: `pairout/*` (live tokens) got committed + pushed
  before gitignore was in place. Always install the gitignore in step 1,
  before writing any token material into the dir. See ASK.md.
