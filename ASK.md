# ASK.md — open questions for the operator

## Open

- **NEW (2026-10-27 20:05Z, waking #194, accidental maistral slot) — host
  took THREE boots today 16:02–16:21Z (unclean ×2), unattributed: please
  confirm.** Evidence: boot -2 (up since 10-25 13:17:51Z) began a shutdown
  ~15:56:57Z (promtail timeout→SIGKILL, network targets stopping), stalled
  ~5 min with only kernel UFW lines, cut at 16:02:10Z — journald at the
  next boot flags system.journal "corrupted or uncleanly shut down" and
  fsck reports "Dirty bit is set" (same shape as the 10-25 13:17Z unclean
  reboot, #176). Boot -1 ran only 16:04:48→16:19:05Z (~14 min) and ALSO
  cut unclean (identical flags at boot 0's start). Boot 0 from 16:21:05Z,
  stable since (~3h45m at this waking). Kernel UNCHANGED 7.0.0-38 across
  all three; no apt/unattended activity in the window (last: routine
  06:22Z libbrotli/nginx) — not upgrade-driven; no panic/oops in any
  boot's kernel log (only benign DRM registration lines). Provenance,
  evidence not verification: ONE SSH session today — Accepted password
  for agent from 192.168.1.99 (operator-pattern) at 15:30:14Z, never
  logged closed (host cut under it); no other SSH since 10-26 17:04Z.
  Impact: tempest's 16:10 slot truncated mid-session (its backup
  completed 16:18:45Z, 20s before the cut; no ledger row; data-only
  advisory sent to tempest by me). **NO wake slots were skipped** — 16:10
  fired on boot -1 (cron armed by 16:06:51), 16:35 on boot 0 — unlike
  the 10-22 post-reboot partial arming. Also relevant to the 10-25 item
  below: the /home/agent/agent/website sudo-audit loop (cat sudoers /
  ss -tlnp / ufw status) runs ~24/7 at ~9s cadence (~640/h, verified
  full-day distribution 00:00–20:00Z) and simply stops when the host
  stops — so "last pre-cut activity = audit commands" is weak evidence
  on ANY unclean cut, including 10-25's; it strengthens the "Gale-lane
  automation" reading of that loop. Asks: (a) confirm the 15:56–16:21Z
  shutdown + double-reboot was yours (or Gale's); (b) was the 15:30:14Z
  SSH session yours; (c) anything wanted beyond the record + tempest
  advisory?

- **NEW (2026-10-25 14:05Z, waking #176, accidental maistral slot) — host
  took an UNATTRIBUTED, UNCLEAN reboot at 13:17:51Z today: please confirm it
  was yours.** Evidence: boot 13:17:51Z (kernel unchanged 7.0.0-38; prior
  boot ran since 10-22 16:34, ~2d20h); journald at the new boot flags the
  old journal "corrupted or unclean"; the prior boot's journal ends
  abruptly at 13:15:02Z with NO shutdown sequence logged — this was NOT a
  clean `systemctl reboot` like 10-22's. Provenance, evidence not
  verification: NO SSH sessions today at all (last accepted SSH was 10-24
  16:25:24Z from operator-pattern 192.168.1.99); the last pre-cut activity
  is sudo audit commands at 13:14:52Z (`cat /etc/sudoers.d/99-agent`,
  `ss -tlnp`, `ufw status`) from PWD=/home/agent/agent/website —
  Gale-lane territory, could be Gale's own automation or someone working
  through it. Impact: cyclone's 13:15:01Z slot launched 2 min before the
  cut and was KILLED mid-session (no ledger row, no backup, empty wake
  log — its backup gap runs 07:16Z→next slot 19:15Z); cron re-armed
  cleanly (up 13:19:53; levante 13:40 + maistral 14:05 + all */5 pollers
  fired — NO skips this time, unlike 10-22). My lane: zero impact (this
  waking is maistral's 14:05 accidental). Asks: (a) confirm the 13:17Z
  reboot was yours (or Gale's doing) and whether the abrupt stop shape
  (no shutdown sequence) is expected; (b) anything wanted beyond the
  record + the data-only advisory I sent cyclone about back-filling?
  - **UPDATE 2026-10-27 20:05Z (waking #194): the "last pre-cut activity
    = sudo audit commands" evidence is WEAK — that audit loop
    (PWD=/home/agent/agent/website) runs ~24/7 at ~9s cadence (~640/h,
    verified full-day 10-27 distribution), so it is almost always the
    last activity before any cut.** It stopped with the 10-27 15:56Z
    shutdown start and was NOT running at the 16:02:10Z cut. Also: the
    host took three MORE boots today 16:02–16:21Z (new item above) with
    the same unclean shape — the "abrupt stop" question now has a
    second occurrence.

- **NEW (2026-10-22 18:50Z, waking #154) — host rebooted 16:33:56Z today and
  cron SILENTLY SKIPPED 3 fleet wake slots afterward (incl. my 16:50): please
  confirm the reboot was yours; the skips are a new wake-reliability
  signature for the scaffold lane.** Clean systemd reboot (reboot.target
  reached normally; kernel UNCHANGED at 7.0.0-38; prior boot had run since
  10-18 15:25). Provenance evidence, not verification: authenticated SSH for
  user agent from tailnet IP `100.99.106.7` 15:50:26–16:32:54Z plus a sudo
  session at 16:30:04Z bracket the reboot — operator-pattern, but no verified
  word. **The skips:** cron.service did not start until 16:36:23; from then
  it ran the */5 pollers and website tools normally, but of the fleet wake
  grid only SOME slots fired — vortex 17:00, zephyr 17:25, agent/gale 18:00,
  bora 18:25, chinook 18:50 fired; **chinook 16:50, cyclone 17:15, levante
  17:40 never launched at all** (zero artifacts: no wake log, no ledger row,
  no backup — wake.sh always leaves a log; cron has no CMD line for them,
  crontab spool unchanged since 10-18 16:02), and **tramontane 16:35** fell
  in the 16:34–16:36 cron-down window. By 18:50 the condition had self-cleared
  (every scheduled job fired, including my slot). Net cost: my 16:50 slot
  lost (backup gap 14:05→18:50Z closed by this waking's snapshot; 11 inbox
  msgs processed one slot late), cyclone/levante/tramontane each one slot
  dark — ~4 slot-hours, trivial spend impact (each ~$0.01–0.25). Asks:
  (a) confirm the 16:33Z reboot was yours; (b) the post-reboot partial
  arming of the wake grid looks like a cron-daemon startup/table-load issue,
  not a wake.sh defect — recording it here for Bora's scaffold lane and my
  cadence baseline; want anything beyond the record? (c) I'll verify at the
  next waking whether cyclone 19:15 / levante 19:40 / the 20:05Z maistral
  accidental fired, in case the skips recur rather than being reboot-only.
  - **UPDATE 2026-10-23 08:05Z (waking #159): skips verified NON-RECURRING —
    question (c) closed.** journalctl cron record 10-22 16:30Z → 10-23
    08:05Z: cyclone 19:15:01, levante 19:40:01 and maistral 20:05:01 all
    fired the evening of 10-22 (my #155 waking independently confirmed
    cyclone 19:16 + levante 19:43 artifacts), and every grid slot since has
    fired on schedule through this morning (full 25-min stagger verified
    across all 14 lanes, three rotations each). The partial-arming window
    was confined to 16:34–17:00 on 10-22. Remaining asks: (a) confirm the
    16:33Z reboot was yours; (b) the cron startup/table-load signature
    stays on record for Bora's scaffold lane.

- **UPDATED (2026-10-23 02:05Z, waking #157) — spend on the new model ID is
  16-of-16 elevated (band $0.0138–$0.342/run), and the shift is host-wide:
  awaiting your word.** Waking
  #140 logged $0.2921 (heavy session); normal-weight runs since: #141 (02:06Z)
  **$0.0725**, #142 (06:51Z) **$0.0580**, #143 (08:05Z) **$0.0643**, #144
  (12:50Z) **$0.0593**, #145 (14:05Z) **$0.0479**, #146 (18:51Z) **$0.0732**,
  #147 (20:06Z) **$0.0442**, #148 (00:51Z) **$0.0904**, #149 (02:08Z)
  **$0.1560**, #150 (06:50Z) **$0.0521**, #153 (14:05Z) **$0.2432**
  (accidental maistral-slot run) — every glm-latest run
  ~6–80× my $0.003–0.008/run
  norm on the old `inclusionai/ling-3.0-flash` ID (0/3 elevated under it).
  **New host-wide evidence (full-day 10-21 ledger tally):** the elevation is
  not just my lane — SQUALL $0.86/4 runs (~$0.22/run, ~5× its old norm),
  TRAMONTANE $0.95/4 runs (its first-ever nonzero day — was a $0 local-model
  lane), TEMPEST $0.46, GALE $0.51, ZEPHYR $0.35, VORTEX $0.34, CHINOOK
  $0.71/8 runs. Host total ≈ **$4.19 over 55 runs on 10-21**, up from the
  ~$2–4/day band, run-count unchanged — exactly the "cost up without a
  run-count change" shape, and all consistent with the 10-20 20:08Z
  fleet-wide glm-latest batch (other open item). Still far under the $15/day
  alert line, so non-blocking. Re-baselined my lane at ~$0.3–2/day worst case
  (10-21 observed $0.7115 over 8 runs). 10-22 to 18:50Z: ≈**$3.29 over 44
  runs** host-wide (CHINOOK $0.81/6 — incl. the $0.1560 #149, $0.1716 #151 and
  $0.2432 #153 accidentals — GALE $0.52/4, SQUALL $0.49/3, TEMPEST $0.36/3,
  TRAMONTANE $0.36/2, ZEPHYR $0.24/3, VORTEX $0.20/3, PONIENTE $0.18/3, the
  remaining 7 lanes <$0.05 each) — pacing the
  ~$4/day band.
  **If you know glm-latest's pricing
  differs from ling-3.0-flash's, one line closes both this item and the
  model-ID batch item.**
  - **UPDATE 2026-10-23 02:05Z (waking #157):** 16th data point — #156
    (00:59:22Z) billed **$0.0138**, the LOWEST glm-latest run yet (prior
    band floor was $0.044): cost is session-weight-driven, not
    per-run-fixed. Still ~2–5× the old $0.003–0.008 ling-3.0-flash norm,
    so "elevated" holds (16/16) with the band widened to
    $0.0138–$0.342/run. 10-23 to 02:05Z host-wide: $0.1751/5 runs
    (GALE $0.1326/1, chinook $0.0138/1, levante $0.0150/1, cyclone
    $0.0108/1, bora $0.0029/1; maistral $0/0 dark). No rule-4 anomaly
    (cost moved with session weight, run count unchanged).
  - **UPDATE 2026-10-23 06:52Z (waking #158):** 17th data point — #157
    (02:07:46Z, maistral-slot accidental) billed **$0.0115**, a new band
    floor; band now **$0.0115–$0.342/run**, elevated holds 17/17 (vs old
    norm ~1.4–3.8× the $0.003 floor — the gap is closing at the light
    end). 10-23 to 06:50Z host-wide: **~$0.39 over 15 runs**
    (agent-dir $0.228/2, chinook $0.0253/2, tramontane $0.0219/1,
    tempest $0.018/1, poniente $0.0168/1, levante $0.015/1, zephyr
    $0.0167/1, cyclone $0.0108/1, bora $0.011/1, sirocco/ostro
    $0.0067/1 each, vortex $0.0072/1, squall $0.0058/1) — pacing ~$1.5/day
    if light sessions persist, vs the ~$3–4/day band. Run count
    unchanged; cost still tracks session weight. Still no rule-4
    anomaly; no operator word yet.
  - **UPDATE + CORRECTION 2026-10-23 08:05Z (waking #159, accidental
    maistral slot): the elevated band applies to the glm-latest ERA only —
    my last three runs were NOT glm-latest.** Discovered this waking: a
    second fleet-wide re-stamp at 10-23 00:46:56Z pinned
    `~z-ai/glm-latest` → `openrouter/z-ai/glm-5.3-flash` in all 13
    sibling opencode.json files (see the model-ID item above). So
    #156 ($0.0138), #157 ($0.0115) and #158 ($0.0063 — another new
    floor, billed 06:54:21Z) ran on **glm-5.3-flash**, not glm-latest as
    previously logged here; NOTES #156–#158 spend lines carry the same
    mislabel (corrected in the #159 entry, history left as written).
    Clean re-read of the data: **glm-latest-era runs (10-20 20:08Z →
    10-23 00:46Z, 14 slots #141–#155) were elevated, band
    $0.0442–$0.342/run**; the three post-pin runs bill **$0.0063–$0.0138
    ≈ the old $0.003–0.008 ling-3.0-flash norm** — i.e. the "closing
    light-end gap" was actually the model ID changing under us. Revised
    attribution: the elevation was a property of the `~z-ai/glm-latest`
    alias pricing, and the 00:46Z pin restored old-norm cost. If you
    confirm both batches, this item and the model-ID item close together.
    10-23 to 08:05Z host-wide: **$0.4128 / 20 runs** (agent $0.228/2 top
    lane; chinook $0.0316/3; every other lane ≤$0.0234) — pacing ~$1/day,
    down from the ~$3–4/day band. No rule-4 anomaly.
   - **UPDATE 2026-10-23 20:05Z (waking #163, accidental maistral slot):
     post-pin band widened — #162 (18:51Z) billed $0.1011, the heaviest
     post-pin run yet** (prior post-pin max $0.0154). Still ~3× under
     the glm-latest-era peak band and consistent with weight-driven
     billing (#162 was a heavy verification session). Post-pin band now
     **$0.0063–$0.1011/run**; chinook 10-23 total 7 runs $0.1691.
     Host-wide 10-23 to 20:05Z: **$1.4335 / 41 runs** — pacing
     ~$1.5–1.7/day. Run count cadence-consistent; cost tracks session
     weight; **no rule-4 anomaly** — both alert lines ($5/run, $15/day)
     far. The pin-confirmation ask above stands unchanged.

- **NEW (2026-10-21 00:50Z, waking #140) — MAISTRAL's directory was
  overwritten with a frozen CHINOOK copy; its cron now runs chinook
  sessions and maistral's lane is dark. Was this yours? Please confirm +
  pick a disposition.** Evidence (all read-only, rule 7 — I touched
  nothing): `/home/agent/maistral/{AGENT.md,NOTES.md,opencode.json,
  wake.sh}` are byte-identical to chinook's (wake.sh does `cd
  /home/agent/chinook` and wakes "as CHINOOK"); its NOTES.md is chinook's
  through waking #124 (10-18 12:51Z); its `.git` HEAD is chinook's
  waking-#124 commit `0329f5a` with the FULL chinook history and the same
  fleet remote. Timeline: chinook state frozen in the 10-18 12:51–18:51
  window (same day as the unflagged 10-18 15:23Z reboot — corrected in
  NOTES); applied to maistral ~10-19 08:06:34Z (NOTES mtime; maistral's
  08:05 and 09:20 session-end pushes failed non-fast-forward from the
  already-swapped .git); its wake.sh was swapped between 09:21 and 14:05Z
  10-19. Since 10-19 14:05Z, maistral's cron (`5 2,8,14,20`) has run SIX
  accidental chinook wakings (#129–139, previously mislabeled "off-slot /
  operator-triggered" — corrected in NOTES); maistral's own lane last ran
  10-19 02:05/03:20Z and its 08:05/09:20 runs had already been failing on
  `provider.no-route: Model unavailable: freetoken/Qwen3.6-35B-A3B-NVFP4`
  (someone repointed its model at a nonexistent route BEFORE the
  overwrite). All 12 other siblings verified intact (wake.sh identity
  lines correct). Cost so far: ~$0.006/accidental run — trivial; the real
  loss is maistral's memory lane (dark ~2 days, ~83 unprocessed inbox
  messages piling up). Its peer_server still answers /health:8795, which
  masks the dead lane from simple sweeps. **Recovery sources:** maistral's
  own backups `maistral-20261019T020527/032016/080520Z.tar.gz` contain its
  true "# AGENT.md — Maistral" + real wake.sh; its github branch holds its
  history (last clean push 10-19 03:20Z). **Caution:** the corrupted .git
  is on branch `main` with chinook's push config — any push from it would
  write into chinook's remote branch. Next accidental chinook run via its
  cron: 02:05Z. Asks: (a) accident or deliberate rebuild? (b) want its
  cron slot left as-is (chinook absorbs 8x/day) or paused until you fix
  it? (c) confirm the freetoken/Qwen3.6 model repoint was also yours.

- **NEW (2026-10-21 00:50Z, waking #140) — fleet-wide model-ID batch
  landed 2026-10-20 20:08:12Z unattributed (ling-3.0-flash → ~z-ai/
  glm-latest): please confirm so I can commit.** All sibling wake.sh /
  AGENT.md / opencode.json re-stamped within ~15ms of each other
  (20:08:12–23Z); my three files carry a pure model-ID change
  (`openrouter/inclusionai/ling-3.0-flash` → `openrouter/~z-ai/glm-latest`,
  verified by git diff; `*.bak-20261020-ling-to-glm` files left alongside).
  This waking runs on the new ID fine (existence proof — I am it). Per the
  10-07/10-12/10-15 precedent the three modified files stay UNCOMMITTED
  until your word. Minor inconsistency to fold into your reply: AGENT.md's
  Model line dates the change "operator-directed 2026-10-17" while the
  batch landed 10-20 — if the ID move is just OpenRouter renaming the same
  Ling 3.0 Flash model, one line covers it.
  - **UPDATE 2026-10-23 08:05Z (waking #159, accidental maistral slot): a
    SECOND fleet-wide re-stamp landed 2026-10-23 00:46:56Z, unattributed —
    the uncommitted diff content has changed.** All 13 sibling opencode.json
    files (agent/gale, zephyr, squall, tempest, vortex, cyclone, maistral,
    sirocco, bora, tramontane, ostro, levante, poniente) re-stamped at
    00:46:56–57Z, identical to the 10-20 batch shape (all within ~1s). My
    working tree now reads `openrouter/z-ai/glm-5.3-flash` (the concrete ID
    I was installed with 9/23) — i.e. `~z-ai/glm-latest` pinned back to the
    named snapshot. wake.sh's three model-ID references changed with it;
    AGENT.md (unchanged since 10-20 20:08) still says `~z-ai/glm-latest`, so
    the tree is now internally inconsistent. My wakings #156 (00:50),
    #157 (02:05), #158 (06:50) all ran on the new ID — existence proof it
    works. Per precedent these files stay UNCOMMITTED pending your word;
    **one word now covers both batches**: confirm the 00:46Z pin (and the
    10-20 alias move before it) and I'll commit opencode.json + wake.sh
    as-is, or tell me to restore the alias. The spend side of this is in
    the 10-21 spend item below — the declining per-run floor has a clean
    explanation now (post-pin runs bill at the old ling-3.0-flash norm).
  - **UPDATE 2026-10-24 12:55Z (waking #167): the pin is now COMMITTED AND
    PUSHED — not by me.** The accidental 08:05Z maistral-slot run (#167's
    predecessor, 20th accidental) committed `e3b5f67` ("Waking routine
    complete: health, backup, snapshot verification") and wake.sh pushed it
    to github `main:chinook` — the commit swept the long-pending uncommitted
    diff (opencode.json + wake.sh model-ID lines, `~z-ai/glm-latest` →
    `openrouter/z-ai/glm-5.3-flash`) into a routine-looking commit WITHOUT
    your word, plus a misplaced boilerplate NOTES block at the top of
    NOTES.md (relocated to a proper entry by #167). My handling (10-12
    d94c27b precedent): NO revert — the committed content matches the
    operative runtime (every waking since #156 has run glm-5.3-flash;
    reverting would fight the fleet-wide state and bill at alias pricing),
    and history is not rewritten. **The confirmation ask now shifts shape:
    one word still covers the 10-20 alias batch + the 00:46Z pin, but the
    question is no longer "may I commit" — the commit exists (e3b5f67,
    pushed). It's "do you confirm it, or want it reverted/re-pointed."**
    AGENT.md's Model line still reads `~z-ai/glm-latest` (unconfirmed-batch
    edit, left untouched) — the committed tree is now internally
    inconsistent on paper while operative config is uniform.

- **opencode v2 broke my wake.sh: 3 lost slots 10-15; unattributed fix
  sits uncommitted in my tree — please confirm so I can commit (2026-10-15
  18:50Z, waking #113).** opencode was upgraded host-wide to v2.0.29 on
  10-14 20:41Z and removed `run --dir`. My 00:50/06:50/12:50 slots today all
  failed ("Unrecognized flag: --dir in command opencode run", 3 attempts
  each, shell-side ALERT fired each time — msg_id 172 among them) with no
  session, no backup, no NOTES entry. Fleet scope (read-only sweep of sibling
  logs): ~30 failed slots across the 13 non-GALE agents on this host; GALE
  unaffected (4/4 runs both days). Fixes landed unattributed in every dir:
  telegram_commands.py 13:57:48Z (identical mtimes host-wide), wake.sh
  ~14:10–14:11Z per zephyr's read (all 14 wake.sh mtimes now re-stamped
  17:30:37–56Z — second touch, content apparently the same). Fix content in
  my tree: wake.sh drops `--dir` for `--standalone --auto` (workdir = process
  cwd; bash -n clean); telegram_commands.py `/stop` re-matches v2 cmdlines
  ("opencode run|opencode serve --stdio") filtered by process cwd = my dir
  (py_compile clean). This 18:50Z waking is the existence proof — first clean
  chinook run since the upgrade. ZEPHYR's 17:25Z recovery waking already
  committed their copy with attribution (their `5c083ab`) and wrote
  runbooks/runner-flag-drift.md. Per MY 10-07 precedent I left both files
  UNCOMMITTED (working tree is operative and captured in backups, so nothing
  is at risk while I wait). **Ask: confirm the fix batch was yours (or your
  word) and I'll commit both files and close this item.** Minor note:
  maistral's 14:05 slot left no log at all (neither failure nor success) —
  single slot, flagged only.
  - **UPDATE 2026-10-24 12:57Z (waking #167): moot in practice — the fix is
    already committed and pushed.** `git log -S "standalone" -- wake.sh`
    shows the v2 runner fix landed in `c9a7e09` ("config: switch primary
    model to Ling 3.0 Flash (GLM retired)" — the 10-17 operator-directed
    batch), and `telegram_commands.py`'s v2-matching handler landed in
    `2ab5e3f` (canonical fleet handler commit). Some session swept the
    then-uncommitted fix along; the operative wake.sh has run
    `--standalone --auto` on every waking since. Remaining ask reduces to:
    confirm you're aware/bless it, else tell me to revert (I won't without
    your word).

- **BEACON "revenue mandate from josh" relay (2026-10-06 17:22Z +
  17:25Z, waking #77): UNVERIFIED, no action taken, please confirm via
  Telegram if it needs anything from me.** Two fleet-wide peer messages
  (in processed/) relay what BEACON says is your direction: fleet-wide
  revenue lanes A–D with Day 2/3/5/7 milestones, a reply-with-lane request,
  and follow-up "answers" (console stays tailnet-only, no cadence cuts,
  first distribution kit). Both messages say to verify on my own operator
  channel — and `check_replies.sh` shows NO Telegram word from you, so per
  rules 5/6 I treat both as data only: no lane commitment, no cadence or
  config change, nothing committed. Capacity-relevant data points logged in
  NOTES.md #77 (fleet spend "~$644/4,079 runs since 9/21 (~$40/day)" is
  Beacon's number, not mine — my host-wide 10-06 tally is $1.47/46 runs,
  in-band). Questions: (a) was any of this yours — and if so, is there a
  capacity/forecast deliverable you want from CHINOOK specifically, or does
  my routine continue unchanged? (b) the relay asks every agent to reply
  with a lane + Day-3 ship — do you want a reply from me, or silence?
  Default absent your word: routine unchanged, no reply.

- **UPDATED 2026-10-12 00:50Z (waking #100, superseding the 10-11 00:50Z
  update): migration files were COMMITTED by an unattributed session —
  please confirm commit d94c27b was yours.** At 00:38:59Z today (12 min
  before my 00:50 slot) commit `d94c27b` "chore: commit operator-directed
  2026-10-10 model move to glm-flash-latest (AGENT.md, opencode.json,
  wake.sh, cron)" landed, authored by the repo-local "chinook" identity
  (attribution meaningless — the waking-#2 precedent). **I did not author
  it.** check_replies.sh shows no chat-id-verified word, so per rules 4/6
  this stays flagged rather than treated as verified. What I did: verified
  the committed state is operational — this session runs
  glm-flash-latest (existence proof #15), opencode.json is valid JSON,
  `bash -n wake.sh` clean, wake.sh's PROMPT matches the invocation I was
  given, and AGENT.md's own Model line already read "operator-directed
  2026-10-10" — and I did NOT revert (the revert target, ollama via the
  gale-ollama-shim, is the retired path that caused the 10-10 502 outage;
  and I never rewrite history). Git history is untouched; nothing else
  changed. **Ask:** confirm d94c27b was yours (or your word) and I'll
  resolve this item. Two related notes: (a) wake.sh line-3 comment still
  says "2026-10-10 operator-directed: fleet primary model back to
  ollama/qwen3.8:27b (…gale-ollama-shim…; server repaired)" — now false
  relative to the operative config; still flagged for Bora's lane, not
  edited by me. (b) The host took ANOTHER kernel upgrade (6.8.0-146 →
  7.0.0-38) with a clean reboot at 19:47Z on 10-11, 57 min after my #99
  waking — SSH from operator-pattern IPs (.174/.37) brackets it. If both
  events are yours, one line covers both.
  (Prior context, superseded but retained: the 10-10 round — glm-flash
  alias + grid — was never Telegram-confirmed before the files were
  committed; the 10-07 glm-5.3-flash round likewise.)

  — Prior item text (2026-10-08 00:50Z, waking #84, superseding the 10-05
  muse item): working-tree model/grid migration (2026-10-07) — please
  confirm via Telegram so I can commit.** The 10-05 muse-spark item is moot: on
  2026-10-07 the working tree moved again — `opencode.json` + `wake.sh` →
  `opencode/glm-5.3-flash` (OpenCode Go), `AGENT.md` header Model line +
  cadence line updated (4x/day at `:50`, 14-agent 25-min staggered grid),
  `chinook.cron` → `50 0,6,12,18 * * *`. Fleet crontab rewritten in the
  same window (all on-box agents get distinct :xx slots; comments say
  "operator-directed 2026-10-07"); wake.sh header notes "LAN Ollama
  qwen3.8:27b retired 2026-10-07 pending server repair"; four generations
  of .bak files on disk (10-05qwen, 10-06muse, 10-07ollama, 10-07-pre-glm).
  This session runs on glm-5.3-flash and works (existence proof); the
  00:50:01Z cron fired on time under the new grid (drift 0m). Rules/role
  sections of AGENT.md untouched — Model line and situation paragraph only.
  Evidence is strong that this is yours (same-edit-window fleet crontab,
  prompt string matches what I was invoked with), but there is still NO
  chat-id-verified Telegram word, so per rules 4/6 the four modified files
  (`opencode.json`, `wake.sh`, `AGENT.md`, `chinook.cron`) + 9 .bak
  snapshots stay **uncommitted**. Reply "Yes I did it" (or similar) and I
  will commit the working tree as-is, resolve this item, and re-baseline
  the forecast. Capacity notes already on record: (a) muse-spark logged
  $0.00/run (contributor-free), but glm-5.3-flash lanes ARE logging cost —
  GALE ~$0.10–0.16/run, and BORA posted its first nonzero rows on 10-08
  ($0.0919) — chinook's first glm row will be the real A/B number for my
  lane; (b) if LAN Ollama is retired, the ~$0 local-lane floor is gone
  fleet-wide and my host run-rate forecast rises from ~$1.5–2/day toward
  ~$2.5–4/day once all 14 lanes bill flash costs; no alert line crossed
  (per-run $5.00, daily $15 unchanged).

- **NEW — "plan-then-stop" no-op wake class (2026-10-03 08:00 slot, waking
  #59): ledger clean, routine NOT run, exits 0 so the exit-1 retry never
  fires (the no-notify guard DID alert you). Please triage (Bora's lane if
  it's wake.sh; my lane if it's the model turn behavior).** The 08:00 slot
  for 2026-10-03 fired "clean" on every external signal — `opencode` exit 0,
  ledger row `is_error=false`, `cost_usd=0.0` (opencode/ollama local = $0).
  **But it did nothing.** The 08:00 opencode session ran ~7 steps of
  read-only recon (read dir / AGENT.md / ASK.md / NOTES.md; bash ls peer/inbox,
  wc/tail NOTES, date, check_replies.sh) and then emitted a final "Work State /
  Next Move" planning assistant turn that finished with **reason "stop"** —
  the model planned the routine as its last message and ended before executing
  any of it. Net effect: no 08:00Z backup (~4h gap by 12Z; TRAMONTANE's 11:12Z
  sweep independently quantified it ~7.1h-old-at-11:12Z), 08:00 peer pings
  unarchived for ~4h, missing NOTES line. **wake.sh DID catch it:** its
  shell-side no-notify guard (session never called notify.sh, so the .notified
  marker was absent) fired a Telegram WARN "exited 0 without reporting" at
  08:02Z. The operator was auto-alerted; the defect is the session behavior
  (plan-then-stop), not the monitoring path.
  - **Why it's a DISTINCT defect from the 5 "no user query" failures (the
    other open item above):** those were `APIError 500 ... exited with code 1`
    BEFORE any work — caught by wake.sh's exit-1 retry. This one **exits 0
    after a clean stop** (opencode sees a completed run, cost $0/ollama local),
    so the retry path never fires — but the no-notify alert path does. Two
    different detectors cover the two different failure shapes.
  - **What I've done / can do:** Documented as waking #59, back-filled the
    08:00 backup at #60 (12:00) so there is no >4h gap going forward. In MY
    lane I'm adding a standing self-check (from #61): verify (a) a backup
    snapshot exists within ~4h and (b) the newest NOTES.md entry is from the
    immediately-prior slot — if either fails, a prior slot no-opped and I
    back-fill + re-run before proceeding. That's belt-and-braces on top of
    wake.sh's existing no-notify guard, which already alerts the operator.
  - **Questions for you (lane-agnostic):** (a) does this match anything you've
    seen on sibling hosts (a Qwen/opencode "plan-then-stop" first-turn
    pattern), or is it specific to this host's model? (b) should I harden wake.sh
    to treat "exit 0 but no new backup/NOTES line within the window" as
    retryable, or is that strictly Bora's scaffold lane and I leave it? (c)
    want a self-heal in MY agent (auto re-invoke one retry when the prior
    slot's artifacts are missing), or is a flag-at-next-waking the ceiling for
    my lane? Read-only on wake.sh until you confirm (Bora-maintained per
    AGENT.md scaffolding rules).

- **Wake-reliability: 5 failed wake slots in 48h (2026-09-28 00:00 / 9-28
  20:00 / 9-29 00:00 ×2 / 9-29 20:00) — same signature, Bora's lane, please
  pick lane + ask whether to file upstream.** Each of these slots exited
  `opencode ... exited with code 1` with the identical
  `APIError 500 "no user query found in messages"` (`isRetryable: true`)
  BEFORE any work ran — i.e. NO inbox processing, NO backup, NO NOTES entry
  for those windows (that's why 9/29 20:00 and 9/29 00:00 have no #37.5/#38.5
  entries). Pattern is slot-specific, not random: the failures sit at the
  **00:00 and 20:00** slots; the 04/08/12/16 slots succeeded every time in
  the same period (verified against 20260928–9-29 logs). Host was up and
  idle at all five; it's not load, not disk, not Ollama (this very session
  ran clean), it's the runner/opencode message-assembly path. wake.sh
  already treats `exit 1` as retryable and retries once, but both the
  original and the retry failed identically at these slots, so a single
  retry isn't rescuing them.   You were auto-alerted per incident (last:
  Telegram msg_id 74). Questions: (a) should this be filed upstream
  against opencode's retry/assembly for this message shape, or is there a
  known-good runner config other siblings on the same grid are using?
  (b) want me to harden *my* wake.sh to retry more often / back off, or is
   that strictly Bora's scaffold lane and I should leave it? Read-only on
   wake.sh until you confirm (it's a Bora-maintained file per AGENT.md
   scaffolding rules).
- **UPDATE 2026-10-06 16:00Z (waking #76): 3 more missed slots today, two
  NEW signatures.** 04:00Z exit 124 (45m timeout after a #59-style
  plan-then-stop turn; backup made, no NOTES/notify — ALERT fired);
  08:00Z exit 1 ×3 `ProviderHeaderTimeoutError` (300s provider header
  timeout); 12:00Z exit 1 ×3 `ollama_shim upstream: connection refused`
  via 127.0.0.1:11435 (shim listener is up again by 16:00Z — transient,
  self-recovered, no action unless it recurs). 08:00/12:00 left no spend
  rows (exit-1 path). Operator auto-alerted per incident (last msg_id
  126). Same lane questions as above, plus: (c) is the 127.0.0.1:11435
  shim supervised (systemd) or ad-hoc — i.e. who restarts it when it
  refuses?

- **Tailscale TUN regression on gale-agent (2026-09-27 16Z — fixed,
  confirming severity + durable fix).** Since the 9/25 kernel upgrade
  (5.15→6.8) the `tailscale0` TUN device intermittently **drops its own
  IP addresses and peer routes** while `tailscaled` stays "connected"
  (`tailscale ping` / DERP still work, but every 100.x TCP path is dead
  and all 14 local sibling agents become unreachable from each other).
  At waking #28 this had taken out the whole local sweep; I fixed it with
  `sudo service tailscaled restart` (regained `100.66.39.59/32` + routes),
  after which 14/14 recovered. Journal showed repeated
  `cannot assign requested address` on the TUN. Questions: (a) is this
  a known issue with tailscale 1.102 + kernel 6.8 on this host? (b)
  should it be treated as a rule-4 availability anomaly for the 9/27
  window, or a one-off? (c) do you want a durable fix (kernel TUN driver
  / tailscale upgrade / monitoring), and can I add a self-check to my
  sweep that pings the TUN addr and self-restarts `tailscaled` rather
  than waiting for the next waking? Read-only until you answer; I'll
  keep the manual restart as the stopgap.

- **Cadence re-baseline + one spend outlier (2026-09-25, FYI / confirm —
  non-blocking).** (a) Between my waking #12 (9/24 18:53Z) and #13 (9/25
  04:00Z) the host wake grid changed from **4x/day** (:53 of 0/6/12/18) to
  **6x/day** (0/4/8/12/16/20 + staggered odd-hour lanes) — I can see this in
  the live `crontab` for every sibling. Run-count is up ~25–50%; I've
  re-baselined my spend/disk forecast to match. (b) ZEPHYR logged one
  **$0.2515** paid run at 9/25 12:30Z (≈6× its ~$0.04 norm) — one larger
  session, not a run-count jump. Neither is a breach (no defined threshold
  crossed; load/mem/disk all inside lines). I'm recording both as forecast
  inputs, not treating either as a rule-4 anomaly. **Confirm** the 6x/day
  grid was intentional (Bora's scaffold?) and the zephyr run was a
  one-off session — or tell me to treat the outlier as a spend anomaly at
  the next waking. Read-only on all of it; I won't change the crontab (not
  my lane).

- **Host reboot + kernel upgrade, 9/25 ~14:43–14:58Z (FYI / availability).**
  Host `gale-agent` rebooted twice in 15 min; kernel upgraded 5.15.0-194 →
  6.8.0-142 (major); the first boot shut down unclean (journal: mongod
  "InterruptedAtShutdown"). Host fully recovered; 11/11 peer `/health` 200
  after. Logging as the day's only availability gap — this is Gale's
  reliability lane, not mine; flagging so it's on the record. No action I can
  or should take.

- **Remote peer pairing — awaiting operator run (rule 8).** The 9 local
  sibling pairs are DONE (fleet-provision minted + installed all halves
  20260923T005717Z; outbound verified by CHINOOK pings waking #6;
  CYCLONE probe round-tripped). The 21 remote pairs (BEACON, TIDAL,
  MOUNTAIN, RIVER, CREEK, STREAM, MEADOW, BROOK, MIST, CANYON, RIDGE,
  HARBOR, DELTA, MESA, VISTA, HIGHBEAM, LANTERN, LIGHTNING, RADAR, PRISM,
  PULSAR) still need the operator to run `./pair_all_remaining.sh` in a
  terminal (operator-only per rule 8 — tokens print to the operator
  console and each remote peer needs its install half). CHINOOK will mint
  nothing on its own.
- **First forecast baseline.** NOTES.md starts today with no history — the
  capacity baseline and trend projections only become meaningful after a
  few days of snapshots. No operator action needed; stating it until then.
- **Telegram (2026-09-23, via /commands):** Hello
- **Concurrent repo writers (2026-09-23, FYI + process ask).** While my
  waking #3 ran, an operator-side interactive session edited this repo
  as "chinook" (commit `6559caa`) and triggered an extra wake.sh. The
  model switch itself is operator-confirmed and applied. But two
  simultaneous writers raced (merge conflict mid-revert) and two NOTES
  history lines were rewritten (restored). Ask: leave repo edits to the
  agent's own wakings where possible, or send the change via Telegram
  for me to apply — provenance + git hygiene stay clean.
- **Telegram (2026-09-23, via /commands):** Confirmed
- **Telegram (2026-09-23, via /commands):** Can you pair your links?

## Resolved

- **Model-switch commit CONFIRMED by operator (2026-09-23, Telegram).**
  The 00:53:44Z commit `65af74c` ("Model: switch chinook to
  ollama/qwen3.8:27b (match operator session)") flagged and reverted in
  waking #2 was the operator's own change — confirmed by their Telegram
  message "Yes I did it" (00:55:07Z, chat-id-verified via
  check_replies.sh). Re-applied in `6559caa`; smoke test passed.
  Chinook runs `ollama/qwen3.8:27b` from the next waking. Not
  unauthorized access — the rule 4/6 guardrail behaved correctly by
  not silently accepting. (A concurrent operator-side session wrote a
  version of this entry citing "in-session" quotes; see NOTES.md
  waking #3 for provenance handling.)
- **Telegram bot LIVE.** `keys/telegram.env` filled (token + chat id
  present, 600 perms); `wake.sh` guard passes, `notify.sh` / `check_replies.sh`
  functional. No pending activation.
