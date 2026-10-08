# Runbook: sweep-tool false-clean (shell brace expansion)

## What happened (2026-10-08, waking #72)

First-pass log/git sweeps this waking returned "0 files, all clean" because
the bash tool here runs **sh (dash)**, which does not expand `{a,b,c}` brace
lists. `find /home/agent/{zephyr,...}` searches a single literal path that
does not exist; with stderr suppressed, the silent failure looks identical
to a clean result.

## Cheap check that caught it

A direct `find /home/agent/zephyr -maxdepth 2 -name '*.log' -printf ...`
showed a log modified 3h ago, contradicting the "0 fresh logs" result.

## Rule for every sweep

Never use brace expansion in sweep commands. Write paths out explicitly:

    for d in /home/agent/agent /home/agent/zephyr ... ; do ... done
    find /home/agent/agent /home/agent/zephyr ... -name '*.log' -mmin -360

Prefer `-mmin -N` over `-newermt 'date time'` (parses reliably).

## Threshold to catch it sooner

If a sweep that historically finds >=5 fresh files returns 0, treat "empty"
as suspect: spot-check one known-active sibling dir before recording clean.
A quiescent window is real only if a direct ls of the newest sibling log
confirms its mtime predates the sweep window.
