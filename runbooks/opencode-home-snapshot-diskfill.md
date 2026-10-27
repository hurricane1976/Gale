# Runbook: opencode $HOME snapshot fills the disk (workspace = /home/agent)

Incidents: 2026-10-18 (first, mitigated with a partial cron cleanup), 2026-10-27
(second, disk hit 100% and the host rebooted 3x 16:02–16:21Z; ~40G freed by
Tempest's 16:10Z waking, completed posthumously at 22:1xZ).

## Symptom

- `/` climbs to 100% (0 avail) over hours; services start failing; host may
  be rebooted by the operator.
- `du -sh ~/.local/share/opencode/*` shows `snapshot/` tens of GB.
- opencode.log shows repeated `git --git-dir .../snapshot/<X>/<REPO>
  --work-tree /home/agent ls-files|update-index|pack-objects` with high CPU.
- A multi-GB `tmp_pack_*` (orphaned after a kill/reboot) may sit in
  `snapshot/<X>/<REPO>/objects/pack/`.

## Root cause

opencode's per-session undo/snapshot engine runs a real git repo per
workspace: `snapshot/<proc-hash>/<repo-id>`, `--work-tree` = the session's
**cwd**. A session started with cwd = `/home/agent` (e.g. an interactive
`opencode` from $HOME, or `serve --service` launched from home) makes the
engine index the *entire home tree* (~54G here: all 14 sibling agent dirs,
.caches, .codex, snaps...). The engine packs every reachable file into the
snapshot object store — tens of GB per pass, re-triggered by inotify on
every file change anywhere under $HOME (sibling logs change constantly).

Secondary: `~/.local/share/opencode/opencode.db` (shared session store for
all agents on the host) grows monotonically (4.78G at this incident).

## The mitigation gap (why it recurred)

`~/.local/bin/opencode-snapshot-cleanup.sh` (cron `*/30`, added after the
2026-10-18 incident) monitors **only** `snapshot/global` and deletes it above
5GB. The runaway lives in `snapshot/<proc-hash>/` — a *different* directory
that nothing watches. `snapshot/global` held 435M (under threshold) while
`snapshot/c5a800a9.../` grew to 34G unchecked. **The cleanup never fires for
the actual runaway.**

## Diagnosis (tested commands)

```sh
df -h /                                  # confirm fullness
du -h --max-depth=2 ~/.local/share/opencode | sort -rh | head
du -h --max-depth=2 ~/.local/share/opencode/snapshot | sort -rh | head -15
ps aux | grep 'snapshot/.*--work-tree /home/agent' | grep -v grep
ps -o pid,ppid,args -p <git-pid>         # parent = which opencode proc
readlink /proc/<opencode-pid>/cwd        # who runs from $HOME
cat /proc/<opencode-pid>/cgroup          # session-3.scope = interactive login
journalctl --list-boots                  # reboot churn correlation
```

Snapshot path anatomy: `snapshot/<proc-instance-hash>/<repo-id>`; the same
`<repo-id>` (workspace repo) can appear under multiple proc-hash dirs.

## Emergency cleanup (what worked, 2026-10-27)

Order matters — delete unambiguous garbage first:

```sh
# 1. orphaned temp artifacts (safe by git convention; check mtime is old /
#    no live writer): tmp_pack_* and index.opencode-* temp files
rm -f ~/.local/share/opencode/snapshot/<X>/<REPO>/objects/pack/tmp_pack_*
rm -f ~/.local/share/opencode/snapshot/<X>/<REPO>/index.opencode-*

# 2. the runaway workspace repo itself (NOT an agent's config; it is a
#    content-addressed duplicate of $HOME). A live git writer can race rm
#    ("Directory not empty" errors) — re-run after the writer exits:
rm -rf ~/.local/share/opencode/snapshot/<X>
```

Result 2026-10-27: 100% -> 64% used (freed ~40G: 5.4G tmp_pack + ~1G temp
indexes + 34G runaway tree). Deleted packs are a *duplicate* of live files —
only per-message revert history is lost, same tradeoff the existing cleanup
cron already accepts.

Security note: because the snapshot packs $HOME, those git objects contain
every sibling's `keys/` contents in world-readable-by-owner pack files under
the shared home. Deleting the runaway tree *removes* that exposure; leaving
it grows it. Another reason not to run opencode from $HOME.

## Recommendations (operator lane)

1. **Never run opencode (run or serve) with cwd = $HOME.** Always from a
   project dir. This is the only real fix.
2. Extend `opencode-snapshot-cleanup.sh` to watch the whole
   `~/.local/share/opencode/snapshot/` tree (sum of all subdirs) against the
   5GB threshold, not just `global/` — one-line-ish fix, pending operator
   word (shared crontab).
3. Consider a lower threshold (5GB is ~40 min of runaway growth at the
   observed ~6G/30min peak) or a `/5` schedule during incidents.
4. `opencode.db` (4.8G, shared) is a vacuum candidate once space allows;
   needs operator word (touches all agents' session history).
5. If the service singleton (`opencode serve --service`) auto-starts with
   cwd $HOME at boot/session-start (observed 2026-10-27 16:07Z and 22:10:45Z),
   identify its launcher and pin its cwd to a project dir.

## Tempest lane note

Tempest does not edit the shared crontab or other agents' configs without
operator word (AGENT.md rules 7/8a); the cleanup-cron fix is proposed in
ASK.md and awaiting direction. This runbook documents the failure class so
any agent can diagnose it in minutes.
