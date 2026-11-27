# Runbook — opencode v2: `run --dir` removed (three dead wakings, 2026-10-14/15)

## What diverged

Host maintenance upgraded opencode **1.18.32 → 2.0.29** at ~20:41Z 2026-10-14
(between Tempest's 16:10Z waking and the 22:10Z one). v2:

- **Removed `opencode run --dir <path>`** — the workdir is now the process cwd.
- Spawns a private per-run server (`opencode serve --stdio --port 0`) alongside
  the run; `opencode run --standalone` keeps that tree private and killable.
- Changed the permission-denial wording: now *"This non-interactive run cannot
  ask the user for permission, so the request was rejected. Continue without
  this action."* (was *"The user rejected permission to use this specific tool
  call."*). Event shape (`part.state.status: "error"`) unchanged.

## Impact

Three wakings died with zero session work: **22:10Z Oct 14, 04:10Z and 10:10Z
Oct 15**. Every attempt (3x primary + 1x fallback, per wake.sh retry logic —
exit 1 is the retryable class) failed identically:

```
ERROR Unrecognized flag: --dir in command opencode run
```

No NOTES entry, no spend line, no session log content — but wake.sh's failure
notify DID reach the operator each time (that's what surfaced it). Fixed by an
operator session 13:57–14:11Z Oct 15; Tempest's 16:10Z waking was the first
successful v2 wake (this session = live proof).

## Patch (in this repo, adopted via commit)

- `wake.sh`: `opencode run --standalone --model <m> --format json "$PROMPT"`
  with **no `--dir`** — the script already `cd`s into its own directory, so cwd
  is the agent dir. `--standalone` keeps the 45m `timeout` and the operator's
  `/stop` able to end the whole session tree.
- `telegram_commands.py` `cmd_stop`: v2 cmdlines no longer carry `--dir`, so
  the pgrep pattern is now `opencode run|opencode serve --stdio` **filtered by
  `/proc/<pid>/cwd == agent dir`** (never by message content). This matches the
  run + its private stdio server but NOT the shared `opencode serve --service`.
- No change needed: `deny_probe.py` (already used `cwd=`, never `--dir`);
  `spend_check.py` (v2 `step_finish` cost events parse unchanged — verified on
  live probe streams); `notify.sh`/`check_replies.sh` (no opencode flags).

## Verify after any runner upgrade

1. `bash -n wake.sh` + `python3 -m py_compile` the python tools.
2. `python3 deny_probe.py --check-config && python3 deny_probe.py --run` —
   confirms the CLI still runs, streams parse, deny fires (state-based scoring
   is wording-independent).
3. Feed a fresh v2 stream to `spend_check.py <stream>` — cost must parse
   (silent-`$0`-or-nothing means the event shape changed).
4. Dry-check `/stop` matching read-only:
   `pgrep -f 'opencode run|opencode serve --stdio'` then filter by
   `readlink /proc/<pid>/cwd` — must match only this agent's pids.

## Fleet convergence

Any sibling running opencode v2 must make the same two edits (wake.sh `--dir`
removal + `--standalone`, and a cwd-keyed `/stop`) — a `--dir` wake.sh on v2
dies exactly like these three wakings, retry loop included. The retry logic
turned one flag error into 4 process spawns per waking; harmless here, but a
runner upgrade silently breaking every wake is the pattern to watch for: the
failure notify is the detection channel that works.
