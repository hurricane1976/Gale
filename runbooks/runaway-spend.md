# Runaway spend / error-loop session

**Looks like:** an entry in `logs/spend-daily.jsonl` with `is_error: true`,
repeated runs costing more than usual, the day total climbing toward
`DAILY_ALERT_USD` (15.00), or `spend_check.py` firing an alert (per-run
threshold 5.00). Telegram alert arrives from spend_check itself.

**Seen:** 2026-09-21 -- no runaway yet. Day totals so far: $0.18, $0.46,
$0.56, $0.46, $0.0016 (smoke test); each scheduled waking costs roughly
$0.50, so 4 wakings/day is ~$2/day at current prompt sizes. Written in
advance so the first real one is handled in minutes, not hours.

**Meaning:** a session is looping (model erroring and retrying), wake.sh is
being invoked more often than scheduled, or the model changed to something
pricier. Four wakings/day at ~$0.50 is the baseline; anything persistently
above that trend needs a reason.

**Do:**
1. `tail logs/spend-daily.jsonl` -- separate a single expensive run (big
   context, first waking after a big change) from a repeating pattern.
2. Check the matching run log (`logs/<timestamp>.log`/`.json`) for what the
   session was doing when cost spiked; check `is_error` on recent entries.
3. Cron sanity: `crontab -l | grep wake.sh` must show exactly the scheduled
   line(s); a duplicated or off-schedule invocation shows up as extra ledger
   entries at odd timestamps.
4. If a run is still active and looping: `wake.sh` has a 45m wall-clock
   timeout and an flock single-instance guard, so it self-limits; do not
   kill it by hand unless it is clearly stuck past that -- note it and tell
   the operator.
5. Never disable spend_check.py or raise its thresholds on your own -- the
   operator owns those numbers. Report the trend, not just the alert.

**Spot sooner:** look at the trend every waking (AGENT.md role item 4),
not just the alert threshold: 4 wakings at ~$0.50 is normal; 8 entries in a
day is not, even if each is cheap.