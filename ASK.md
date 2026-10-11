# ASK.md — open questions for the operator

## Open

- **`backup.sh` replaced fleet-wide at 2026-10-04T20:48:39Z — please confirm (open, filed at 72nd waking, 2026-10-04T22:xxZ).**
  Between the 71st and 72nd wakings, `backup.sh` in **all 14 agent dirs on gale-agent** was replaced
  (file recreated, birth=modify) at the same second. Change vs my committed version: adds
  `--exclude=./.git` (comment: "history lives on github"), parametrized `NAME`/`OUT`, and a
  dynamic per-file `keys/` exclusion. Effect: snapshot ~3.9M/829 -> ~224K/86 entries
  (verified `.git` absent from the new tarball, everything else intact, `./62` still included).
  No peer or operator message accompanied it and MAISTRAL did not do it. Verification:
  all sibling `.git` repos present and intact, `git fsck` clean, github remote HEAD reachable
  (history safely pushed), no other files touched in the 20:45-20:52Z window.
  Read as likely operator fleet-wide housekeeping — but per rule 4 MAISTRAL left its own
   `backup.sh` **uncommitted and unmodified**. Request: (1) confirm the change is authorized,
   (2) say whether each agent should commit its variant, (3) optionally note the ~12G /home
   disk drop (59G->47G used) over the same window in case it is related.
    Update 81st waking (2026-10-06T15:36Z): muse-spark flip set (wake.sh/opencode.json/.bak-20261006muse)
    flagged here; SUPERSEDED 87th waking (2026-10-08T02:05Z) -- operator-directed 2026-10-07 GLM move
    (`opencode/glm-5.3-flash`, cron `5 2,8,14,20 * * *`, AGENT.md/wake.sh/opencode.json/maistral.cron all
    carry dated operator-directed annotations) is committed as working-tree state per 17th/19th-waking
    precedent; muse ruling moot. STILL OPEN per rule 4: `backup.sh` (--exclude=.git variant) left
    modified+uncommitted -- confirm authorized and say whether each agent commits its variant.
    Also: the 09-22 FLAG watch (API 35w vs ledger 25w) EXPIRED at the 81st -- the 09-22 slot aged out of
    the API 14-day window, so it can no longer be checked; closed as expired-unverifiable, root cause
    never determined.

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

- **`opencode.json` muse-flip -- SUPERSEDED/RESOLVED 2026-10-11T02:06Z (99th waking).**
  Two further operator-directed moves dated 2026-10-10 landed in the working tree with
  explicit annotations: (a) primary back to `ollama/qwen3.8:27b` ("server repaired",
  wake.sh comment), then (b) primary to `openrouter/~z-ai/glm-flash-latest` (OpenRouter,
  1M ctx; wake.sh top comment + AGENT.md model line both carry "operator-directed
  2026-10-10"). Corroborated by my own wake prompt (99th waking runs on
  glm-flash-latest). Committed as working-tree state per the 17th/19th/87th precedent.
  The muse-spark flip question is moot (lineage: glm-5.3-flash -> qwen -> glm-flash-latest).

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