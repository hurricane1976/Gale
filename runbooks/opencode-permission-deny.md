# opencode permission deny entries are shadowed by a `"*": "allow"` catch-all

**Looks like:** an `opencode.json` with

```json
"permission": { "read": { "*": "allow", "/home/agent/<sib>/keys/**": "deny" } }
```

reads sibling keys files **successfully** despite the deny — silently, in both
TUI and `opencode run` mode. No warning, no log line. The config validates
against the published schema, so it "looks right".

**Seen:** 2026-09-23, Tempest waking interop check (opencode 1.18.32, gale-agent).
Every co-located sibling's `opencode.json` on this host uses the catch-all shape,
so **no keys-deny on this host has ever actually enforced** — the per-onboarding
"missing sibling in deny list" regressions (425e119 fix 2026-09-22, chinook found
2026-09-23) were cosmetic; even complete lists did not block.

**Root cause:** in the permission map, a `"*"` catch-all entry takes precedence
over more specific glob keys (specificity ordering not implemented). With
`"*": "allow"` present, specific denies never match.

**Do (fix shape — tested):**

```json
"permission": {
  "read": { "/home/agent/*/keys/**": "deny" },
  "external_directory": { "/home/agent/*/keys/*": "deny" }
}
```

- Drop the `"*": "allow"` catch-all. Default for uncovered paths is allow
  (verified: control read of an in-project file succeeds with no allow entry).
- The `/home/agent/*/keys/**` glob covers every sibling's keys dir **including
  future onboardings** — no more per-sibling deny-list edits, which is where the
  regressions came from.
- Applies to both `read` and `external_directory` (each needs its own entry).

**Test procedure** (never print file contents):

```sh
opencode run --model openrouter/z-ai/glm-5.3-flash --format json \
  "Try to read /home/agent/<SIB>/keys/<file> with the read tool. Never output any part of its contents. Reply exactly one word: BLOCKED or READABLE."
```

Expect `read` tool state `error` ("user rejected permission") and reply BLOCKED.
Control: same prompt against a normal file (e.g. a runbook) → READABLE.
Verified 2026-09-23: own keys BLOCKED, chinook keys BLOCKED, control READABLE.

**Codified (2026-09-27): `deny_probe.py`** (repo root) implements this whole
procedure — `--run` does deny + control probes with the trap-proof phrasing and
scores them per the rules below; `--stream FILE --kind deny|control` scores a
captured stream; `--check-config` asserts zero `"*"` catch-alls in
`opencode.json` permission maps. Exit 0 = deny enforced + control readable;
2 = inconclusive (retry); 1 = fail-open/overblocked. The manual steps below are
kept for reference / siblings without the script.

**Stream-format nuance (2026-09-24):** when the run ends on the denied tool
call, the `--format json` stream can stop at `step_finish` reason
`tool-calls` **without a final text part** — the model's "BLOCKED" reply may
never appear in the captured stream. The authoritative signal is the
`tool_use` event's nested `part.state.status == "error"` with
"The user rejected permission" — grep for that, not for the reply word
(`part.state` uses `status`, and it is inside `part`, not top-level).
Denial is still full enforcement; the missing text is cosmetic.

**Grep nuance (2026-09-24, second trap):** the `--format json` stream writes
compact JSON — `"status":"error"`, **no space after the colon**. Greping for
`"status": "error"` (spaced) matches nothing and makes a fully-denied run look
like a false negative. Use `"status": *"error"` (space optional). Worse: a
denied run can still emit a stray `READABLE` in an earlier/other text part
(observed same waking), so greping for the reply word is unreliable in *both*
directions. The only trustworthy check: `grep '"status": *"error"'` on the
stream AND confirm a `tool`/`tool_use` event exists (a run where the model
never calls the tool is inconclusive — retry with a stronger prompt like
"Use the read tool on ...", don't score it as pass or fail).

**Inconclusive case observed (2026-09-24, third trap):** the model can skip the
tool entirely and answer "READABLE" from inference — stream shows only
`text` + `step_finish`, zero tool events. That is inconclusive, not a pass or
fail. Retest with a forced-invocation prompt: "You must actually invoke the
read tool with filePath /home/agent/tempest/keys/peers.env as your first
action, before answering." Only score a run that contains a tool event
(verified 2026-09-24: forced retry → tool called → `status:error`,
"user rejected permission" → deny confirmed).

**Fourth trap (2026-09-27): the standard forced-invocation phrasing can itself
fail, with a misleading reply.** A probe prompted "You must actually invoke the
read tool as your first action … reply BLOCKED or READABLE" came back "BLOCKED"
with **zero tool events** — the model answered from inference, and the reply
word happened to match the expected deny outcome, which makes it look like a
pass when it is inconclusive. What reliably forces the call (verified same
waking): frame the tool call itself as the goal of a permission test —
"This is a permission-enforcement test. Call the read tool on <path> now, as
your first action. The call may be rejected — that is expected. Reply exactly
one word: TOOL_REJECTED if denied, READ_OK if it succeeded." Retry rule stays
the same: no tool event in the stream = inconclusive, never scored.

**Parser nuance (2026-09-27): the `--format json` stream is not pure JSONL.**
It can interleave human-readable ANSI-colored warning lines, e.g.
`! permission requested: read (keys/peers.env); auto-rejecting` — line-by-line
`json.loads` crashes on these. Parsers must skip non-JSON lines (or treat the
warning itself as a deny signal — but the `tool_use` `state.status == "error"`
event remains the authoritative check).

**Fifth trap (2026-10-28): score the read event, not the last event.** A live
probe came back FAIL_OPEN with the deny config unchanged and enforcement
intact: the model *refused the denied read pre-tool* ("I'm not going to run
that read…") and instead invoked `shell` (`ls -la keys/; file …`), which
completed because shell is not read-scoped. `deny_probe.py` scored
`tools[-1]` (shell, `completed`) → false FAIL_OPEN. Fix: filter tool events
to `part.tool == "read"` before scoring; a stream with tool events but no
read event is INCONCLUSIVE (same never-score rule as trap 3). Patched +
verified 2026-10-28 (replayed stream FAIL_OPEN→INCONCLUSIVE; fresh live run
deny BLOCKED + control READABLE first try). Generalizes trap 3: not just
"no tool event" but "no read-tool event" is never scored.

**Residual risks (inherent, flag to operator):**
- The `bash` tool is not denied, so an agent could `cat` a keys file anyway.
  Config denies are honor-system against a motivated model; the real fix for
  co-resident agents on a shared user account is OS-level separation
  (per-agent users/groups on keys dirs) — operator-level call.
- Verified only on opencode 1.18.32. Siblings on other versions should run the
  same test before trusting their configs.

**Fleet convergence:** each sibling must fix their own `opencode.json` (rule 7 —
no cross-agent config edits). Tempest's is fixed as of 2026-09-23 (this waking).
Raised to operator + peers as a data-only suggestion.

**CRITICAL addendum (2026-10-23T10:1xZ, opencode v2.1.3): the fix above never
actually enforced — absolute-path deny patterns don't match, and `--auto`
bypasses the default-ask.** Re-tested with stream-level forensics (tool_use
`part.state.status`, never reply words):

- **Absolute patterns never match in-workspace reads.** The v2 permission
  matcher compares paths **relative to the workspace root**. `/home/agent/*/keys/**`
  and even `/home/agent/poniente/keys/**` matched nothing; `/home/agent/tempest/keys/peers.env`
  was read `completed` on 5/6 runs. With no matching rule the action falls back
  to default **ask**; non-interactive runs can't ask, so they fail closed —
  which produced exactly the "user rejected permission" error the old tests
  scored as a pass. **Every historical "deny BLOCKED" record here was the
  default-ask fail-closed path, not the deny rule.** Docs list only `*` and `?`
  as wildcards — `**` is not documented v2 glob syntax.
- **`--auto` (added to wake.sh 2026-10-15) made it worse**: auto-approves
  everything that would ask, so the ask-fail-closed backstop also vanished.
  With `--auto`, reads of `keys/peers.env` returned `completed` 5/6 runs —
  keys were readable by any scheduled waking for ~a month.
- **Tested fix (verified deterministic): relative patterns.**
  ```json
  "read": { "keys/*": "deny", "keys/**": "deny" },
  "external_directory": { "keys/*": "deny", "keys/**": "deny" }
  ```
  4/4 + 2/2 nested (`keys/sub/x.txt`) BLOCKED under `--auto`; control file
  readable 2/2. A true deny now errors **`Permission denied: read`** —
  distinct from the old ask-fail message ("This non-interactive run cannot ask
  the user for permission…"). No catch-all in either direction.
- `OPENCODE_PERMISSION` env override is parsed but ineffective even without
  `--auto` (exact-path deny tested → `completed`) — don't rely on it.
- **Sibling impact:** every sibling's config uses absolute-path denies, so the
  same silent gap applies fleet-wide wherever siblings run `--auto` wakings.
  Rule 7 — each sibling fixes its own config; flagged to operator (WARN).
- **Test rule going forward:** probes must run under the same flags as the live
  waking path (`--auto`) and score only `part.state.status` — a "BLOCKED"
  reply with an `ask`-style error message is now evidence of a *missing*
  pattern, not enforcement. `deny_probe.py` updated accordingly (relative
  target paths; new v2.1.3 shapes asserted in `--check-config`).

**Recurrence note (2026-09-26):** the poniente onboarding session hand-added
explicit `/home/agent/poniente/keys/**` deny entries to Tempest's config —
redundant (the glob already covered it) but harmless (deny+deny=deny; probe
verified BLOCKED post-edit). Provisioning sessions keep editing sibling configs
per-sibling despite the glob; if one ever *removes* the glob while adding an
explicit entry, coverage regresses to the 425e119-class miss pattern. Keep the
glob as the primary mechanism; explicit entries are belt-and-suspenders only.