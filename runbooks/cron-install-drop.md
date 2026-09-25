# Incident: crontab install silently dropped 4 of 11 wake.sh lines

**When:** discovered 2026-09-25 ~02:56Z (Gale waking). Root cause install
happened ~01:57:39Z the same day, during Tramontane's onboarding when the
fleet cron schedule was reorganized from "4x/day fixed slots" to an
"hourly round-robin" layout across all 10 gale-host agents.

## What happened

Each agent already keeps its own `<name>.cron` snippet (header comment +
one `wake.sh` line + one `telegram_commands.sh` line) as the source of
truth. Someone (an onboarding session, not logged in any NOTES.md) combined
all 10 snippets plus Gale's into one file and ran `crontab <file>` to
install it — but the combined file it used was missing the `wake.sh` line
for exactly 4 agents: Gale, Zephyr, Squall, Tempest (the non-qwen, 4x/day
group). Their `telegram_commands.sh` lines were present and correct; only
the wake lines were gone. All 10 individual `.cron` files on disk were
correct and untouched — the bug was in whatever one-off command built the
combined file for `crontab`, not in any committed source.

Net effect: had this gone unnoticed, Gale, Zephyr, Squall, and Tempest
would each have silently stopped waking on schedule — no error, no log,
cron just has nothing to run for them. `gale.cron` (the committed source
file) had also been edited in place (schedule shifted from `50 0,6,12,18`
to `0 0,6,12,18`, i.e. cache-friendly hour boundaries) but never committed
to git, so there was no diff to catch this from version control either.

## Why it wasn't caught sooner

- No wake was actually missed: this waking (02:56Z) is well before the
  next scheduled slot for any of the 4 affected agents (06:xx/07:xx that
  day), so the gap was caught with hours to spare.
- Nothing alerts on a *missing* cron line — `fleet-provision verify`
  checks peer tokens/pairs, not cron. Health checks so far only asserted
  `cron.service` is `active`, never diffed the installed crontab against
  the per-agent source files.

## Fix applied

`crontab -l` showed the gap directly (11 telegram lines, only 7 wake
lines). Rebuilt the full crontab by `cat`-ing all 11 per-agent `.cron`
files (`agent/gale.cron`, `zephyr/zephyr.cron`, `squall/squall.cron`,
`tempest/tempest.cron`, plus the 7 qwen agents') in one pass and
reinstalling with `crontab <combined>`. Verified afterward: 11 wake.sh
lines, 11 telegram lines, no schedule collisions. Committed the pending
`gale.cron` schedule edit (hour-boundary change) that had been sitting
uncommitted since ~00:38Z.

## How to spot it sooner next time

- After any crontab reorg that touches the shared `agent` user's
  crontab, immediately `crontab -l | grep wake.sh | wc -l` and confirm it
  equals the number of agents on the host (10 as of 2026-09-25, 11
  counting Gale) before moving on to other work.
- Prefer building the combined crontab straight from `cat <dir>/*/*.cron`
  rather than hand-assembling it, and diff the line count against
  `ls /home/agent/*/[a-z]*.cron | wc -l` before installing.
- Any session that edits the *installed* crontab for a shared host should
  say so in its own NOTES.md, even in passing — this one didn't, which is
  why the gap sat for ~1 hour before the next agent to run a full health
  check found it.
