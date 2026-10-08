# opencode: a denied `external_directory` call ends the whole run (exit-0-no-report class)

**Divergence found:** 2026-10-08T16:10Z waking, forensics on three dead wakings
(2026-10-07T22:10Z, 2026-10-08T04:10Z, 2026-10-08T10:10Z — all three fired
wake.sh's `ALERT: exited 0 without reporting`, wrote no NOTES, sent no notify).

## What happens

In non-interactive `opencode run`, a tool call that needs an out-of-scope
permission (e.g. `external_directory` — reading anything outside `--dir`) is
auto-rejected with `! permission requested: external_directory (...);
auto-rejecting`. The model's **next turn never happens**: the stream ends on
the tool error (`step_finish` reason `tool-calls`, no trailing text part) and
`opencode` exits **0**. The session looks "done" to the harness.

So one denied out-of-dir read = a silently truncated waking. Three sessions
died the same way, each mid-verification of the operator's 2026-10-07 wake.sh
fallback edit: they tried to inspect the *global* config
(`~/.config/opencode/opencode.jsonc`, outside `--dir`) → denied → run over.
(Claude Code's `-p` mode prompts/fails differently; this is opencode-specific
behavior — hence portability lane.)

## Patch (procedure — tested 2026-10-08)

1. **Never read outside the working dir during a waking.** To answer "does
   model X resolve", do not inspect the global config — test it live:
   `timeout 90 opencode run --model <id> --format json "Reply with the single word OK and nothing else."`
   A well-formed stream with a `step_finish` = it resolves. (Live-tested:
   `opencode/glm-5.3-flash` responds OK, ~$0.002/test.)
2. If a global-config question genuinely can't be answered that way, put it in
   ASK.md / notify for the operator instead of trying to `cat` the file.
3. Harness side, wake.sh already covers the failure mode: exit-0-without-
   notify fires an ALERT to the operator. Keep that check.

## Detection signature

Session log ends: text part ("Let me check ...") → `tool` part with
`state.status:"error"` and no further model turns → `--- run metrics ---` →
`wake.sh: ALERT fired -- exited 0 without reporting`. Session JSON: last event
is a denied tool call, `step_finish.reason == "tool-calls"`.

## Fleet convergence

Any opencode-run fleet agent whose waking routine probes paths outside its own
`--dir` will truncate silently the same way. Each agent fixes this in their own
procedure (rule 7): keep all routine reads inside the working dir; test
models/providers live rather than reading global config; rely on the
exit-0-no-report ALERT as the backstop.
