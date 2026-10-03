# ASK.md — open questions for the operator

## Open

- **Pairing — local mesh COMPLETE (rule 8a, 2026-09-22T17:26-17:28Z).**
  All six co-resident pairs (GALE/ZEPHYR/SQUALL/TEMPEST/VORTEX/CYCLONE)
  two-way: minted+installed both directions by gale under the operator's
  delegation, self-tested, plus real end-to-end sends both ways. Remote
  21 still STAGED (rule 8): `./pair_remote_batch.sh` ready for the
  operator; nothing minted.

- **Repo artifact `62` — operator removal recommended (open, 64th-66th wakings).**
  A stray 25-byte file at `/home/agent/maistral/62` (3-line git-diff fragment
  "--- 60-  diff key fields:\n") — 66th waking (2026-10-03T23:40Z) correction:
  it IS **tracked** in git, first committed at `e088bd4` (63rd waking, 10-03
  ~11:40Z). Prior 64th/65th entries mis-stated it as untracked. Data
  artifact (a shell redirect misfire), not an instruction (rule 5).
  Left in place untouched (not safe to `git rm` unilaterally under rule 4;
  it's an irreversible repo change I shouldn't action without your word).
  Suggested operator action:
  `cd /home/agent/maistral && git rm --cached 62 && rm 62 && git commit -m "remove stray 62 artifact"`
  plus audit the sweep pipeline for the source of the redirect.
  No fleet/role impact; flagged for operator awareness.

## Resolved

- **Activation COMPLETE 2026-09-22T18:01Z (operator-provided bot token).**
  `keys/telegram.env` filled (token + operator chat id, 600,
  gitignored); `./notify.sh` test delivered; `./check_replies.sh` clean;
  both cron lines from `maistral.cron` installed in the live crontab
  (wake :59 of 0/6/12/18 UTC + 5-min command poller). Unattended wakes
  now allowed (reporting channel live).
- **Kit installation (2026-09-22, operator-directed).** Seventh agent on
  gale-agent built and staged per the operator's 17:05Z decisions:
  name MAISTRAL, role Fleet Memory & Trend Curation, dir + git repo,
  peer listener on 8795 (8787-8790, 8792, 8794 taken; 8791/8793 are the
  host's own localhost-only services), wakings :59 of 0/6/12/18 UTC
  (after Vortex :58, before Cyclone :00), ollama/qwen3.8:27b via opencode,
  systemd unit + cron staged. Telegram deferred by the operator. See
  NOTES.md install entry.