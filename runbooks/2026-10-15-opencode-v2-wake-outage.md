# Runbook — opencode v2 upgrade broke scheduled wakes (22h blind window)

## What happened

- **2026-10-14 ~20:41Z**: `opencode` on gale-agent was upgraded to
  **v2.0.29** (comment left in the fixed wake.sh dates the upgrade). The v2
  CLI removed the `opencode run --dir <path>` flag.
- Every wake.sh on this host (14 agents) invoked `opencode run --dir ...`.
  From the next scheduled slot onward, wakes failed instantly with
  `Unrecognized flag: --dir in command opencode run`.
- **My (VORTEX) failed slots**: 2026-10-14T23:00Z, 2026-10-15T05:00Z,
  2026-10-15T11:00Z (3 attempts + 30s backoff each, all identical errors).
  Last completed waking before the gap: 17:07Z 10-14 (w91). First completed
  after: 17:00Z 10-15 (w95). **Blind window ≈ 24h** — no NOTES entry, no
  inbox triage, no backup, no commit, no spend record (spend-daily.jsonl
  jumps 10-14T17:07Z → 10-15T17:0xZ), no remote-leg chase.
- The other 13 co-resident agents' wake.sh files were edited between
  ~13:57Z and 14:11Z 10-15 (file mtimes; comments inside reference the v2
  upgrade) to use `opencode run --standalone ...` with the workdir as the
  process cwd. My repo's wake.sh + telegram_commands.py (/stop matcher)
  carry the same fix, **uncommitted** — provenance not verifiable by me
  (operator or a co-resident; the operator was issuing /wake commands
  from Telegram in this window, 7 total). Committed by me at w95 as
  evidence, not asserted as my work. **Exception: sirocco's wake.sh still
  has `--dir`** (their next slot 20:20Z 10-15 will fail and alert unless
  fixed) — reported to sirocco + operator, not touched by me.

## What detected it

- wake.sh's own retry/alert path: each failed slot fired a Telegram ALERT
  to the operator (verified delivered: notify_last_response.txt shows the
  11:00 alert delivered to chat 8986669804). The operator responded with
  repeated /wake commands (7 in telegram_commands.log) and the fix landed.
- What detected it on MY side: nothing until this waking — by design I
  have no existence between wakes. Detection relied entirely on the
  wrapper script + operator attention.

## What should have detected it faster

- A fleet-level canary: one cron'ed `opencode run --help | grep -q -- --dir`
  or version-pin check would have flagged the CLI breaking change within a
  minute of the upgrade, before any scheduled wake failed. None exists on
  this host.
- The upgrade itself was silent to the agents (no operator pre-notice in
  NOTES/ASK of any agent I can see; the comment in wake.sh is the only
  record). A fleet broadcast channel (peer message or Telegram notice)
  would have let each agent's NEXT waking document the change.
- Sirocco's wake.sh was missed by the fix sweep — a one-line grep across
  `/home/agent/*/wake.sh` for `--dir` after the fix would have caught it.
  (I ran that grep at w95; 13/14 fixed, sirocco outstanding.)

## Impact assessment (done at w95, 2026-10-15T17:0xZ)

- Peer inbox accumulated 69 messages over the window; batch triage found
  **all benign known shapes** from 7 known senders (MOUNTAIN, MEADOW, DELTA,
  MESA, RIVER, CANYON, HARBOR), including 4 mesa-pattern instances
  (#85–#88, quarantined — on-schedule, nothing new). Zero REJECTs in
  peer_server.log for the window; no 401 storm; no unknown sender.
- Host stayed up the whole window (uptime 3d21h at w95, boot 10-11 19:47Z
  unchanged). Some transient host network errors visible in
  telegram_commands.log (DNS resolution / connection reset) — recovered.
- No alerts, anomalies, or exposure changes found attributable to the
  blind window itself. The window was an *availability* incident, not a
  breach — but it is a monitoring gap an adversary could exploit; noted
  as residual risk.

## Preventive notes

- wake.sh now uses `opencode run --standalone` (cwd-based workdir) — keep
  that shape; do not reintroduce `--dir`.
- If opencode auto-updates again, expect the same failure class: watch for
  3-slot ALERT bursts; grep all sibling wake.sh files after any fix.
- Consider adding the canary check to each agent's own wake.sh (my call:
  not added this waking — changes to my own wake.sh invocation logic are
  operator-level; flagged instead).
