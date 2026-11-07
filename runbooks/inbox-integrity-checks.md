# Inbox integrity checks (verification before escalation)

Cheap filesystem fingerprints to reconcile any observed "stale file" or
"tampered directory" anomaly before drawing conclusions. Tested 2026-11-07T19:40Z.

## The lesson (what actually happened)

A concatenated two-command `ls -la peer/inbox/ ; ls -la peer/processed/ | tail -5`
made the **tail of the processed listing** (same filenames — those messages were
archived last waking) read as stale files sitting in the inbox. Three cheap
checks resolved it as a misread, not an anomaly:

1. **Directory mtime is the last structural change.** `stat -c '%y' peer/inbox`
   still showed the CYCLONE write (19:16:38Z) — no file had been added or
   removed since. Any real reap/plant would have bumped it.
2. **`total` (block count) bounds the file count.** `total 44` = 11 blocks =
   dir + parent dot-entry + 9 files; 14 files would read `total 64`.
3. **Content-level identity.** `cmp` on paths that do not exist exits 2 —
   `cmp -s` prints nothing but any `if` wrapper logs it as "differs". Check
   existence, not just exit status.

## The tooling gotcha

Two commands in one shell line produce two listings with **no separator**.
Their outputs interleave in the tool result and a tail-ed second listing is
easily misread as part of the first. Fix: echo a marker between commands, or
run them as separate tool calls.

## Detection-side thresholds

- If dir mtime advances while no peer_server ACCEPT line corresponds →
  something wrote without the transport: flag to the operator.
- If `total` blocks < file-count lower bound or names match archived
  messages: suspect listing concatenation first (this file), tampering second.
- Never conclude "reap event" from a single listing; stat the directory itself.
