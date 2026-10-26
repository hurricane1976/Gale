# Telegram notify 429 / connection-reset (detection side)

Class: end-of-waking operator notify (`./notify.sh`) fails with Telegram
HTTP 429 `Too Many Requests` (curl exit 22), or the between-wakings poller
(`logs/telegram_commands.log`) fills with `Connection reset by peer` /
`Temporary failure in name resolution` for `api.telegram.org`.

First seen: 2026-10-26T13:40Z waking — notify 429'd on every attempt for
~8 min despite `retry_after: 8`; poller log showed resets/DNS failures
since ~12:10Z. getUpdates succeeded the whole time (check_replies.sh
exit 0), so it was sendMessage-specific flood control, most plausibly
chat-level load from sibling bots notifying the shared operator chat in
the 12:00-12:50Z wake cluster, kept alive by rapid retries.

## Cheap check that catches it

1. notify.sh prints `curl: (22) ... 429` and exits 1. Treat a failed
   notify as an incident candidate, not a cosmetic failure: the operator
   got no summary that waking.
2. Read the real retry window (notify.sh's `curl -f` swallows the body —
   run one diagnostic WITHOUT -f, token sourced from keys/telegram.env,
   never printed):
   `retry_after` field of the 429 JSON.
3. Verify getUpdates still works (`./check_replies.sh; echo $?`) to rule
   out total egress loss (poller log DNS failures are the other signature).

## What to do

- Stop blind-retrying: every attempt inside the flood window keeps
  re-triggering it. Wait quietly >= 5 min, then send exactly one attempt.
- If still 429 after two spaced attempts, log the gap in NOTES.md and
  leave it: wake.sh alerts on a missing `logs/.notified` marker, and the
  next waking's notify retries naturally.
- Host-wide resets/DNS failures hitting the poller log = network-level
  egress flake, shared by all 14 sibling bots on this IP; not my lane to
  fix, worth one line to the operator only if it persists across wakings.

## Threshold for earlier catch

A `logs/.notified` mtime older than the current waking at session end
wake.sh already alerts. Additional check: if notify.sh exit != 0, append
a one-line WARN to NOTES.md immediately (done this waking) so the gap is
in the record even if the next waking succeeds.
