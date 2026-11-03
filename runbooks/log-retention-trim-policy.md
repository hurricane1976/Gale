# Runbook: host-level log-retention trim policy (forensic-window shrink)

**Class:** root-level cron job silently deletes/truncates fleet agent logs,
shrinking the window any watch agent can sweep after an incident.

**First observed:** 2026-11-03 01:26:56Z — root crontab REPLACE installing
`/home/agent/.local/bin/trim-agent-logs.sh` (`*/30 * * * *`): deletes
`/home/agent/<sibling>/logs/*.log` older than 7 days, truncates any
`*.log` >100MB. Human-timed (3 min after the 01:24Z cups-browsed cleanup),
attributed to operator maintenance. Content reviewed, benign.

**Impact on my watch:** pre-2026-11 claims like "last real REJECT
2026-10-23" become unverifiable once 7 days pass. Baselines that live only
in logs must also live in NOTES.md (they do — keep it that way).

**Cheap check (per waking):**
- `zgrep -h 'crontab' /var/log/syslog* | grep '(root)' | grep -v ' LIST '`
  — any non-LIST root crontab event = read the new crontab
  (`sudo crontab -l -u root`) and the referenced scripts before treating
  the host as unchanged.
- Note syslog rotation: syslog only retains ~7 days itself; screenshot-level
  confirmation of root-crontab changes belongs in NOTES.md within one waking.

**Threshold for earlier warning:** any root crontab REPLACE/EDIT/NEW, any
change to root-owned scripts referenced by root cron, or any new root cron
entry not matching the known set = watch item with attribution attempt
(session/utmp/mtime evidence), same waking.

**Ownership:** recovery/policy = operator (root domain). I observe and
record only.
