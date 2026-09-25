# Runbook: spend trend-break detection (Zephyr lane)

Detection-side runbook (Gale owns recovery). Short, cheap, grep-only.

## What was seen (live example)

2026-09-22: gale ledger lines $0.4181 (19:21Z) then $0.6124 (20:02Z) vs its
normal ~$0.03-0.06/waking. Single spikes were previously explained by long
interactive/recovery sessions; two consecutive elevated lines = a trend, not
a spike, and is what gets flagged to the operator.

## Cheap check (how to catch it)

Every waking, tail -2 of each sibling's `logs/spend-daily.jsonl`
(paths: gale=/home/agent/agent, plus /home/agent/{squall,tempest,vortex,cyclone,maistral,sirocco,bora}).
Free-tier agents (vortex/cyclone/maistral, sirocco/bora) should print $0.0 —
any nonzero line there is itself a signal.

## Thresholds (flag to operator via notify.sh)

- >3x an agent's trailing median of last ~5 lines: watch item, one line in notify.
- Two consecutive lines >3x that median: escalate explicitly in notify.
- Any nonzero cost on a free-model agent: flag immediately.
- My own runs should stay ~$0.02-0.10; sibling range ~$0.03-0.07.

## False-positive notes

- Long operator-directed interactive sessions legitimately spike cost
  (gale's 2026-09-21 0.4626 baseline line was the same pattern). Look for
  correlation with provisioning/repair windows before alarm.
- Correlation worth chasing: gale's elevated lines (0.4181→0.6124→0.3837,
  19:21–23:28Z 2026-09-22) bracketed a "gale-provision relay" (23:33Z) that
  leaked to public git via Tidal's auto-commit (RIVER w185 alert). Elevated
  spend + provisioning window + leak alert in the same hours is one story,
  not three anomalies. See runbooks/offsite-commit-leak.md.
- A missing ledger file for a newly provisioned agent is expected until its
  first waking — check cron schedule before flagging.
- Grep "401|429" in logs/*.log hits my own NOTES wording echoed into wake
  transcripts — restrict log greps to peer/logs/peer_server.log for that class.
- Recurrence without consecutiveness: squall logged $2.8613 (09-24 07:11Z),
  then a normal $0.1329 (12:58Z), then a fleet-record $3.3977 (19:15Z).
  Strict "two consecutive" logic would have cleared it after line 2 — but
  repeated >$2 lines on a ~$0.05 agent are a pattern regardless of spacing.
  After the 09-25 00:38Z host cron re-stagger, ledger timestamps no longer
  map 1:1 to cron slots (off-cron interactive//wake sessions are common) —
  check the sender's current crontab before calling an "unexpected time"
  anomalous; judge on magnitude + recurrence, not clock position.
