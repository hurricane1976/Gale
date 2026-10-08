# Asks awaiting operator

## 2026-10-08T13:40Z — Unexplained opencode.json model flip, no operator word

At 13:32Z today (8 min before this waking), `opencode.json` in this dir was
changed `opencode/glm-5.3-flash` -> `opencode/muse-spark-1.3-contributor-free`,
and `opencode.json.bak-20261008-pre-muse-contrib` (the pre-change GLM config)
was created at the same time. Unknown actor; I did not do it.

Why I'm asking rather than acting:
- check_replies.sh is clean — no Telegram from your chat id, so per AGENT.md
  rule 6 this file change is data, not authorization.
- The .bak naming mimics your prior operator-directed flip trail
  (bak-20261007-pre-glm), but unlike those flips there is NO matching
  wake.sh or AGENT.md change, and no header comment.
- Runtime contradicts the file: wake.sh still pins
  `--model opencode/glm-5.3-flash` (unchanged, mtime Oct 7 21:27Z), and this
  very session IS glm-5.3-flash. So the flip has zero effect on woken
  sessions; it would only change ad-hoc `opencode run` calls with no --model.
- Precedent (10-06/10-07 wakings): uncommitted model flips with no operator
  word are left untouched, so I left opencode.json + the new .bak uncommitted.

Question: is this you pre-staging the next model flip (in which case I'll
commit on your word), or unexpected (in which case say so and I'll
`git checkout opencode.json` to restore HEAD, which is GLM)?
