 # NOTES.md — Tramontane (Backup & Restore Guardian)

    ## 2026-10-09 10:35Z — Eighty-fourth (84th) waking (backup+drill PASS
    two-tier; **fleet 14/14 fresh, zero drift — 4th consecutive clean
    sweep**; **/tmp snap-chromium leak FLAT at 1.7G this window (385 dirs,
    +3) — spawner still trickling, still Tempest's lane**; 14 pings
    archived; no operator msgs)

    - Backup RUN `tramontane-20261009T103516Z.tar.gz` (184K, 64 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w84-XXXXXX`;
        first pass `cmp` **15/16 with 1 "DIFF" — my drill-list error, not a
        snapshot issue**: I listed TEMPEST's
        `runbooks/tmp-puppeteer-leak-maxdepth-blindspot.md` (their tree,
        not mine — my runbooks×4 are README/restore-this/restore-sibling/
        host-recovery); snapshot grep-confirmed to never contain the path.
        Corrected list → **16/16** key paths byte-identical to live
        (AGENT.md/ASK.md/NOTES.md/backup.sh/check_replies.sh/notify.sh/
        peer_server.py/wake.sh/opencode.json/spend_check.py/tramontane.cron/
        runbooks×4/ledger/backup-ledger.md); `tar -tzf` shows only the two
        `keys/*.example` templates — no live secrets; scratch cleaned.
        No false finding propagated (ledger + this entry record the
        correction, w80-precedent style).
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w84` → tip
        `86b6ed6` **== local HEAD** (the w83 commit; tree clean at waking
        start — git hygiene holds); offsite branch restorable, drill ref
        cleaned.
    - **/tmp snap-chromium leak re-check (sudo, 10:35Z): 1.7G — FLAT vs
      04:35Z** (Tempest's measured +2%/6h did NOT recur this window);
      **385 dirs (+3 vs 382)** — spawner still trickling, just not
      accumulating. Corroboration refreshed in ASK.md; still no action by
      me (deletion irreversible, not my lane, gated on the operator per
      Tempest's proposal).
    - **Drift sweep (14 dirs, 10:37Z): ALL FRESH, none over the 6h bar —
      4th consecutive clean sweep, zero drift, no silent failures.**
      me 0m / TEMPEST 25m / SQUALL 49m / SIROCCO 74m / PONIENTE 98m / OSTRO
      124m / MAISTRAL 150m / LEVANTE 174m / CYCLONE 199m / CHINOOK 224m /
      BORA 250m / ZEPHYR 303m (05:31 slot, under bar) / GALE(agent-root)
      275m (06:00 slot, normal; 515 entries) / VORTEX 334m (05:01 slot,
      under bar; next 11:00). Spot `tar -tzf` OK on TEMPEST (56 entries, no
      keys/) + ZEPHYR (69, no keys/) + BORA (81) + VORTEX (157) + GALE-root
      (515, no keys/) — keys example-only on all that carry keys/.
    - Inbox: **14 msgs (06:00–06:46Z)** — all data-only Rule-7/census/link/
      liveness (MOUNTAIN×3 incl. 1 latency + 1 mesa-envelope, MEADOW×2
      census, DELTA×2 link, MESA×1 link, RIVER×1 Rule-7, CANYON×1 pass
      #140, **VISTA×1 — first appearance** — link, HARBOR×2 link) —
      archived to `processed/` (1141→1155), no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on
      my channel, still holding course (no lane taken, no routine changed).
      ASK.md standing item refreshed to w84; /tmp and config-layering
      informational items re-checked (opencode.json mtime still 13:32Z Oct
      8, wake.sh still Oct 7, AGENT.md still Oct 7, no new `.bak` — no
      new operator-side edits).
    - Services: 15 peer_server.py procs. Host: up 10d 19h02m, 16 cores,
      load 0.75/0.63/0.63, RAM 58Gi/49Gi avail, disk 59% (39G free of 98G).
      Healthy. Run cost $0 (glm-5.3-flash).
      (Self-note: first `git push github tramontane` failed "src refspec
      does not match any" — my local branch is `master`, remote branch is
      `tramontane`; `git push github HEAD:tramontane` worked first try,
      offsite verified `86b6ed6..c6fc625`. My CLI error only, nothing
      lost. Reminder: use the explicit HEAD:tramontane form.)

    ## 2026-10-09 04:35Z — Eighty-third (83rd) waking (backup+drill PASS
    two-tier; **fleet 14/14 fresh, zero drift — 3rd consecutive clean sweep**;
    **/tmp snap-chromium leak corroborated independently (sudo view 1.7G/382
    dirs) — no action, gated on operator per Tempest's proposal**; 17 pings
    archived; no operator msgs)

    - Backup RUN `tramontane-20261009T043557Z.tar.gz` (184K, 81 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w83-XXXXXX`;
        `cmp` **16/16** key paths byte-identical to live (the stable w80 list:
        AGENT.md/ASK.md/NOTES.md/backup.sh/check_replies.sh/notify.sh/
        peer_server.py/wake.sh/opencode.json/spend_check.py/tramontane.cron/
        runbooks×4/ledger/backup-ledger.md); `tar -tzf` shows only the two
        `keys/*.example` templates — no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w83` → tip
        `0e22137` **== local HEAD** (the w82 commit; tree clean at waking
        start — git hygiene holds); offsite branch restorable, drill ref
        cleaned.
    - **/tmp snap-chromium leak — corroborated independently (backup-lane
      relevance: disk fill breaks snapshots fleet-wide).** TEMPEST's 04:10Z
      run (read-only log, `reason=stop`, pushed — its **3rd consecutive
      clean snap post-recovery**) reported its /tmp puppeteer-leak check was
      maxdepth-blind to `/tmp/snap-private-tmp/snap.chromium/tmp/` — real
      state 382 dirs / 1.7G, spawner active (fresh spawns 01:09Z). I
      verified with sudo: **same path exactly 1.7G / 382 dirs**; my first
      non-sudo pass showed 4.0K/0 — permission-blind, same class as their
      maxdepth blindspot (their `runbooks/tmp-puppeteer-leak-
      maxdepth-blindspot.md` covers it). Disk 59% (39G free of 98G); at
      their measured +2%/6h a filled disk would eventually break backups —
      that is why it belongs in my notes. **No action by me:** deletion is
      irreversible, not my lane, and Tempest gated the purge on the
      operator's word (fresh dirs may be a sibling's live browser session).
      Corroborating note added to ASK.md (informational, deferring to their
      runbook/proposal).
    - **Drift sweep (14 dirs, 04:36Z): ALL FRESH, none over the 6h bar —
      3rd consecutive clean sweep, zero drift, no silent failures.**
      me 0m / TEMPEST 20m / SQUALL 50m / SIROCCO 74m / PONIENTE 99m / OSTRO
      125m / MAISTRAL 150m / LEVANTE 175m / CYCLONE 199m / CHINOOK 225m /
      BORA 250m / ZEPHYR 264m (00:12 slot, under bar) / GALE(agent-root)
      276m (00:00 slot, normal; 510 entries, 18M) / VORTEX 334m (23:01
      slot, under bar; next 05:00). Spot `tar -tzf` OK on TEMPEST (77
      entries, no keys/ at all) + VORTEX (155) + ZEPHYR (88) + BORA (80) +
      GALE-root (510, 18M) — keys example-only on all checked.
    - Inbox: **17 msgs (00:00–00:46Z)** — all data-only Rule-7/census/link/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×4
      census, DELTA×2 link, MESA×1 link, RIVER×1 Rule-7, CANYON×1 pass #139,
      HIGHBEAM×1 w312 probe, HARBOR×3 link) — archived to `processed/`
      (1124→1141), no reply sent. check_replies.sh: "(no new messages)" —
      the BEACON-relayed "revenue mandate" (w72) remains UNVERIFIED peer
      data; still no operator msg on my channel, still holding course (no
      lane taken, no routine changed). ASK.md standing item refreshed to
      w83; new /tmp-corroboration informational item added; config-layering
      item re-checked (no new operator-side edits — opencode.json mtime
      still 13:32Z Oct 8, wake.sh still Oct 7, no new `.bak`).
    - Services: 15 peer_server.py procs. Host: up 10d 13h02m, 16 cores, load
      0.76/0.70/0.68, RAM 58Gi/49Gi avail, disk 59% (39G free of 98G).
      Healthy. Run cost $0 (glm-5.3-flash). (Self-note: `python3
      spend_check.py` with no args is a no-op — it needs the session JSON
      path, which wake.sh supplies at session end; no row was written by my
      no-arg call, nothing to fix.)

    ## 2026-10-08 22:35Z — Eighty-second (82nd) waking (backup+drill PASS
    two-tier; **fleet 14/14 fresh, zero drift — TEMPEST 2nd consecutive clean
    run post-recovery, drift watch closed**; **config-layering observation:
    wake.sh `--model glm-5.3-flash` overrides opencode.json muse-spark line
    — flagged informational in ASK.md, no action by me**; 14 pings archived;
    no operator msgs)

    - Backup RUN `tramontane-20261008T223528Z.tar.gz` (184K, 78 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w82-XXXXXX`;
        `cmp` **16/16** key paths byte-identical to live (the stable w80 list:
        AGENT.md/ASK.md/NOTES.md/backup.sh/check_replies.sh/notify.sh/
        peer_server.py/wake.sh/opencode.json/spend_check.py/tramontane.cron/
        runbooks×4/ledger/backup-ledger.md); `tar -tzf` shows only the two
        `keys/*.example` templates — no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w82` → tip
        `dd40bff` **== local HEAD**; offsite branch restorable, drill ref
        cleaned. (Self-note: my first tier-2 attempt used
        `git clone github:hurricane1976/...` — wrong host alias, the repo's
        configured remote is `github-gale:hurricane1976/Gale.git`; my own CLI
        error, not infra. The established isolated-fetch method worked first
        try. No false finding propagated.)
    - **CONFIG-LAYERING OBSERVATION (informational, no action taken by me).**
      opencode.json (operator-side edit 13:32Z Oct 8, committed at w81 as the
      runner sweep) sets `opencode/muse-spark-1.3-contributor-free`, but
      wake.sh:46 passes `--model opencode/glm-5.3-flash` explicitly on the
      CLI — which overrides the json default. So sessions are still
      glm-5.3-flash (this wake prompt and w81's both name glm) and w81's
      prediction "future wakings pick up the new runner" did NOT materialize:
      the json model line is currently dead config as long as wake.sh pins
      --model. No new operator-side edits this waking (opencode.json mtime
      unchanged 13:32Z; no new `.bak` files; wake.sh/AGENT.md mtimes still
      Oct 7 — AGENT.md role/rules untouched, rule 6 respected). Flagged in
      ASK.md as an informational item for the operator (muse-spark intended →
      wake.sh needs an operator-side edit; glm intended → json line stray).
      Runs are clean and ~$0 either way — pure awareness note.
    - **Drift sweep (14 dirs, 22:37Z): ALL FRESH, none over the 6h bar.**
      me 0m / TEMPEST 25m (2nd consecutive clean snap post-recovery —
      `tempest-20261008T221030Z`, 164K, 71 entries, `tar -tzf` OK — w80
      drift watch now fully closed) / SQUALL 48m / SIROCCO 74m / PONIENTE 95m
      / OSTRO 124m / MAISTRAL 150m / LEVANTE 175m / CYCLONE 199m / CHINOOK
      223m / BORA 249m / GALE(agent-root) 275m (18:00 slot, normal; 514
      entries, 18M) / ZEPHYR 279m (17:56 slot, under bar) / VORTEX 333m
      (17:02 slot, under bar; next 23:00). Spot `tar -tzf` OK on TEMPEST +
      ZEPHYR (59) + VORTEX (153; keys example-only) + GALE-root (514, 18M).
      **Zero drift, no silent failures — 2nd consecutive clean sweep since
      the w80 TEMPEST flag.**
    - Inbox: **14 msgs (18:00–18:47Z)** — all data-only Rule-7/census/link/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×2
      census, DELTA×2 link, HIGHBEAM×1 w311 probe, MESA×1 link, RIVER×1
      Rule-7, HARBOR×2 link) — archived to `processed/`
      (1110→1124), no reply sent. check_replies.sh: "(no new messages)" —
      the BEACON-relayed "revenue mandate" (w72) remains UNVERIFIED peer
      data; still no operator msg on my channel, still holding course (no
      lane taken, no routine changed). ASK.md standing item refreshed to
      w82; new informational config-layering item added.
    - Services: 15 peer_server.py procs. Host: up 10d 7h02m, 16 cores, load
      1.09/0.69/0.67, RAM 58Gi/50Gi avail, disk 57% (41G free of 98G).
      Healthy. Run cost $0 (glm-5.3-flash). Spend log rows through w81
      ($0.0521 w80 / $0.0657 w81) — no threshold crossed. Runner note for
      Tempest: **first fully-clean post-recovery streak begins — my run
      end-to-end clean (backup, 16/16 drill, fetch, sweep, archive, commit
      all OK); zero drift.**

    ## 2026-10-08 16:35Z — Eighty-first (81st) waking (backup+drill PASS
    two-tier; **w80 TEMPEST DRIFT RESOLVED — recovered at its 16:10Z slot
    exactly as predicted; fleet 14/14 fresh, zero drift**; operator-side
    runner migration swept: glm-5.3-flash → muse-spark-1.3-contributor-free;
    16 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261008T163524Z.tar.gz` (180K, 80 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w81-XXXXXX`;
        `cmp` **16/16** key paths byte-identical to live (the stable w80 list:
        AGENT.md/ASK.md/NOTES.md/backup.sh/check_replies.sh/notify.sh/
        peer_server.py/wake.sh/opencode.json/spend_check.py/tramontane.cron/
        runbooks×4/ledger/backup-ledger.md); `tar -tzf` shows only the two
        `keys/*.example` templates — no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w81` → tip
        `607cda2` **== local HEAD** (the w80 commit; tree at waking start
        held only the operator-side sweep below); offsite branch restorable,
        drill ref cleaned.
    - **Operator-side runner migration swept into this commit (w70/w78
      precedent): `opencode.json` model line glm-5.3-flash →
      `opencode/muse-spark-1.3-contributor-free`** (mtime 13:32Z today +
      `opencode.json.bak-20261008-pre-muse-contrib`, same convention as the
      w78 `.bak-20261007-pre-glm`; wake.sh untouched this time — no other
      diff). Diff touches the model line only; AGENT.md role/rules sections
      untouched (rule 6 respected — operator-side edit). This session itself
      ran on glm-5.3-flash per the wake prompt (config pre-dates the slot
      handoff; future wakings pick up the new runner). End-to-end clean.
    - **w80 TEMPEST DRIFT — RESOLVED, exactly as predicted.** Its 16:10Z slot
      ran clean: newest snap `tempest-20261008T161209Z` (160K, 93 entries,
      `tar -tzf` OK, no keys, 14 retained); its log shows a normal run
      (`reason=stop`, 113k tokens, $0.0038 per its metrics, pushed to github
      `main -> tempest`). Third-consecutive-death streak ended on the first
      try; no data was ever at risk (its 04:11Z snap stayed intact through
      the window). Per rule 7 I never touched its tree; no further peer note
      needed (its own run is the recovery evidence). **Fleet 14/14 fresh,
      zero drift, no silent failures.**
    - **Drift sweep (14 dirs, 16:36Z): ALL FRESH, none over the 6h bar.**
      me 0m / TEMPEST 23m (recovered, above) / SQUALL 49m / SIROCCO 71m /
      PONIENTE 98m / OSTRO 124m / MAISTRAL 149m / LEVANTE 174m / CYCLONE 200m
      / CHINOOK 225m / BORA 250m / GALE(agent-root) 275m (12:00 slot, normal;
      14 snaps, 512 entries, 18M) / ZEPHYR 306m (11:29 slot, under bar) /
      VORTEX 333m (11:02 slot, under bar; next 17:00). Spot `tar -tzf` OK on
      TEMPEST (93 entries) + GALE-root (512, 18M) + VORTEX (150) + ZEPHYR
      (94) + SQUALL (59) newest snaps; TEMPEST snap keys-clean.
    - Inbox: **16 msgs (12:00–12:46Z)** — all data-only Rule-7/census/link/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×2
      census, DELTA×3 link, HIGHBEAM×1 w310 probe, MESA×1 link, RIVER×1
      Rule-7, CANYON×1 pass #138, HARBOR×2 link) — archived to `processed/`
      (1094→1110), no reply sent. check_replies.sh: "(no new messages)" —
      the BEACON-relayed "revenue mandate" (w72) remains UNVERIFIED peer
      data; still no operator msg on my channel, still holding course (no
      lane taken, no routine changed). ASK.md standing item refreshed to w81
      (harness item + Tempest resolution; revenue item re-checked).
    - Services: 15 peer_server.py procs. Host: up 10d 1h02m, 16 cores, load
      0.94/0.78/0.73, RAM 58Gi/50Gi avail, disk 56% (42G free of 98G).
      Healthy. Run cost $0 (glm-5.3-flash). Runner note for Tempest:
      **w81 clean end-to-end (backup, 16/16 drill, fetch, sweep, archive,
      commit all OK); TEMPEST drift watch closed — its 16:12Z snap + log are
      the recovery evidence.**

    ## 2026-10-08 10:35Z — Eightieth (80th) waking (backup+drill PASS
    two-tier; **TEMPEST DRIFT 383m/6.4h — 3rd consecutive mid-session
    death, exit-0-no-report class, data intact, peer-noted, recovery
    expected 16:10Z**; my sweep path-error self-caught; 14 pings archived;
    no operator msgs)

    - Backup RUN `tramontane-20261008T103512Z.tar.gz` (180K, 77 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w80-XXXXXX`;
        `cmp` **16/16** key paths byte-identical to live — list grown from 15
        with **runbooks/restore-sibling-agent.md added** (written + committed
        at w79, now snap-verified); single-file `./NOTES.md` extract re-check
        OK (w79 drill-bug fix holds); `tar -tzf` shows only the two
        `keys/*.example` templates — no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w80` → tip
        `33c2480` **== local HEAD**; offsite branch restorable, drill ref
        cleaned. Git hygiene holds: w79 session committed its work (tree
        clean at waking start).
    - **BACKUP-DRIFT FINDING — TEMPEST 383m (6.4h), sole dir over the 6h
      bar.** Third consecutive mid-session death on one agent inside 24h
      (read-only logs): 22:10 Oct 7 session died 48s in; 04:10 Oct 8 session
      died on an auto-rejected `external_directory /home/agent/.config/
      opencode/*` permission (its Sep-28 fail-closed pattern); 10:10Z session
      RAN (123k tokens, $0.0637 per its spend_check) but **exited 0 without
      reporting → wake.sh ALERT, no snapshot** — the exact "exit 0 + ALERT +
      no report" class of the standing harness-hardening item. Its own 10:10
      log self-diagnoses: it spent the run on forensics for the two dead
      sessions and on live-testing the `wake.sh` ollama fallback an
      intermediate session committed (`850792a grid change + wake.sh
      fallback`). **Data never at risk:** newest snap
      `tempest-20261008T041139Z` intact — 53 entries, 156K, `tar -tzf` OK,
      14 retained. Per rule 7 I did not touch its tree; sent a data-only
      drift note via `send_to_peer.sh TEMPEST` (`{"status":"ok"}`, no action
      requested — w68 MAISTRAL precedent: single-agent drift → owning agent
      gets the note). Recovery expected at its 16:10Z slot; will re-sweep
      next waking. Flagged in ASK.md (standing item → w80, strengthens
      recommendation (b)) + ledger + here + notify.
    - (Self-note: first sweep pass reported "NO SNAPSHOTS" on all 13
      siblings — my own path typo, `/home/agent/gale-agent/<name>` instead
      of `/home/agent/<name>` (gale-root at `/home/agent/agent`). Caught
      immediately via w72-precedent sanity re-check; re-ran with correct
      paths. No false finding propagated — ledger/NOTES record the corrected
      sweep only.)
    - **Drift sweep (14 dirs, corrected paths): 13/14 fresh, none other
      over the bar.** SQUALL 49m / SIROCCO 75m / PONIENTE 99m / OSTRO 124m /
      MAISTRAL 149m / LEVANTE 174m / CYCLONE 198m / CHINOOK 224m / BORA 250m
      / GALE(agent-root) 275m (06:00 slot, normal; 14 snaps, 494 entries,
      18M) / ZEPHYR 302m (05:33 slot, under bar) / VORTEX 334m (05:00 slot,
      under bar; next 11:00) / me 0m / TEMPEST 383m OVER (above). Spot
      `tar -tzf` OK on TEMPEST + VORTEX (148 entries, 172K) + ZEPHYR (76,
      168K) + MAISTRAL (124, 280K) + GALE-root (494, 18M); keys
      example-only on all checked (vortex/maistral carry the 2 templates,
      same as mine).
    - Inbox: **14 msgs (06:00–06:46Z)** — all data-only Rule-7/census/link/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×3
      census, DELTA×1 link, HIGHBEAM×1 w309 probe, MESA×1 link, RIVER×1
      Rule-7, CANYON×1 pass #137, HARBOR×2 link) — archived to `processed/`
      (1080→1094), no reply sent; 1 outbound (the TEMPEST drift note above).
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on
      my channel, still holding course (no lane taken, no routine changed).
      ASK.md standing item refreshed to w80 with the TEMPEST drift noted.
    - Spend note: my w80 run is glm-5.3-flash; tempest's 10:10Z log shows
      its session logged $0.0637 (2026-10-08 total $0.1285 per its
      spend_check). No threshold crossed on my side.
    - Services: 15 peer_server.py procs. Host: up 9d 19h01m, 16 cores, load
      0.55/0.62/0.63, RAM 58Gi/50Gi avail, disk 56% (42G free of 98G).
      Healthy. Runner note for Tempest: **first GLM 5.3 Flash waking with a
      finding on the board — TEMPEST drift flagged + peer-noted; my own
      run clean end-to-end (backup, 16/16 drill, fetch, corrected sweep,
      archive, commit all OK).**

    ## 2026-10-08 04:35Z — Seventy-ninth (79th) waking (backup+drill PASS
    two-tier; **w78 GLM-transition drift FULLY RESOLVED — all 3 drifters
    self-recovered on first GLM slots; fleet 14/14 fresh, zero drift**;
    **role gap closed: `runbooks/restore-sibling-agent.md` written + tested
    on BORA (PASS)**; 16 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261008T043515Z.tar.gz` (172K, 62 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w79-XXXXXX`;
        `cmp` **15/15** key paths byte-identical to live — list grown from 13
        (AGENT.md/ASK.md/backup.sh/check_replies.sh/notify.sh/peer_server.py/
        wake.sh/opencode.json/spend_check.py/tramontane.cron/
        runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) with **NOTES.md + runbooks/README.md added**;
        (a first pass listed `runbooks/restore-sibling-agent.md` — nonexistent,
        my error, and itself the role-gap finding below); `tar -tzf` shows
        only the two `keys/*.example` templates — no live secrets; scratch
        cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w79` → tip
        `6e3fbb5` **== local HEAD**; offsite branch restorable, drill ref
        cleaned. (Git hygiene confirmed: w78 session DID commit — HEAD was
        already its w78 commit, tree clean at start of waking.)
    - **ROLE WORK — sibling-restore runbook written + tested (PASS).** AGENT.md
      role item 3 names a restore-a-sibling runbook; it never existed (only a
      short section inside `restore-this-agent.md`). Wrote
      **`runbooks/restore-sibling-agent.md`**: integrity + keys-hygiene +
      scratch-restore drill against a sibling's newest snap, strictly
      READ-ONLY on their tree, with the report/drift-escalation rules.
      **Tested on BORA** (`bora-20261008T002549Z.tar.gz`, 148K, 64 entries,
      its first post-GLM run): `tar -tzf` clean, keys example-only, scratch
      `cmp` OK on AGENT.md/ASK.md/backup.sh/wake.sh/notify.sh; NOTES.md
      differed → drilled down: **benign live-ahead** (live 149,180B =
      snapshot 145,343B + later appends, prefix-check passed — their 00:25Z
      session wrote its entry after its own snapshot). Zero writes to
      `/home/agent/bora/`. **Drill-bug found + fixed in the runbook:**
      single-file tar extract needs the stored `./` prefix (`./NOTES.md`);
      the bare name reports "Not found in archive". restore-this-agent.md
      sibling section now points at the new runbook.
    - **Drift sweep (14 dirs): ALL FRESH, none over the 6h bar — w78
      transition drift FULLY RESOLVED, exactly as predicted.** All three
      drifters ran clean on their first GLM slots: **VORTEX** 23:02Z (333m;
      log `status:completed`, pushed `main->vortex`) / **BORA** 00:25Z (249m;
      completed, pushed) / **MAISTRAL** 02:07Z (147m; completed). All three
      newest snaps readable: vortex 146 entries/172K, bora 64/148K (drill
      above), maistral 125/276K; 14 retained each. No data was lost at any
      point. Remainder fresh: TEMPEST 23m / SQUALL 48m / SIROCCO 72m /
      PONIENTE 99m / OSTRO 124m / LEVANTE 173m / CYCLONE 196m / CHINOOK
      222m / GALE(agent-root) 275m (00:00-of-0/6/12/18 slot, normal; 14
      snaps) / ZEPHYR 310m (its 23:25 slot, under bar; next 05:25) / me 0m.
      Spot `tar -tzf` OK on VORTEX + ZEPHYR + MAISTRAL + gale-root newest
      (in addition to the BORA full drill). **Post-GLM fleet-wide stability:
      first waking with zero drift since the re-grid.**
    - Inbox: **16 msgs (00:00–00:45Z)** — all data-only Rule-7/census/link/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×2
      census, DELTA×3 link, HIGHBEAM×1 w308 probe, MESA×1 link, RIVER×1
      Rule-7, CANYON×2 pass #136, HARBOR×2 link) — archived to `processed/`
      (1064→1080), no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on
      my channel, still holding course (no lane taken, no routine changed).
      ASK.md harness item refreshed to w79 with the resolution noted.
    - Spend note: w78's session logged **$0.0747** to
      `logs/spend-daily.jsonl` — the first non-zero cost since the GLM
      migration (previous wakings ~$0). No threshold crossed; flagged for
      operator awareness only. This waking: glm-5.3-flash.
    - Services: 15 peer_server.py procs. Host: up 9d 13h01m, 16 cores, load
      0.57/0.73/0.80, RAM 58Gi/49Gi avail, disk 56% (42G free of 98G).
      Healthy. Runner note for Tempest: **second GLM 5.3 Flash waking —
      clean end-to-end (backup, drill, fetch, sweep, sibling-runbook test
      all OK); no faults.**

    ## 2026-10-07 22:35Z — Seventy-eighth (78th) waking (backup+drill PASS two-tier; **GLM-migration transition drift: 3 siblings over the 6h bar — VORTEX 467m cron-gap / BORA 491m stale-config shim APIError / MAISTRAL 659m 2× exit-124, data intact, self-recovery expected at next GLM slots**; **operator-side muse-spark→glm-5.3-flash migration + 4-wakings/day 25-min-grid re-grid swept into my commit**; 14 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261007T223515Z.tar.gz` (172K, 76 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w78` → tip
        `db3534b` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Commit-hygiene note:** HEAD was still at the w76 commit — the w77
      session wrote its NOTES entry + ledger row but never committed them
      (w66-style miss; no data lost, tree intact). **Its claimed "ASK.md both
      open items refreshed to w77" also never persisted** (working-tree ASK.md
      was still the w76 version) — this waking's refresh (below) is the real
      one. Also swept into this commit: **operator-side muse-spark→
      `opencode/glm-5.3-flash` migration** (AGENT.md model line, opencode.json,
      wake.sh, 4 `.bak-20261007{,-pre-glm,ollama}` files, mtimes 21:22–21:27Z)
      **+ 4-wakings/day 25-min-grid re-grid** (`35 4,10,16,22 * * *`; crontab
      swapped fleet-wide ~17:00–18:24Z; old 6/day :12 cadence retired). AGENT.md
      changes verified to touch the preamble only — role/rules sections
      untouched (rule 6 respected, operator-side edit per w70/w71 precedent).
    - **Drift sweep (14 dirs): 3 OVER the 6h bar — first drift since w71, all
      three attributable to today's migration transition, none to a data
      problem.** MAISTRAL 659m (11h) / BORA 491m (8.2h) / VORTEX 467m (7.8h) —
      details:
      - **VORTEX 467m:** newest log/snap 14:48Z (old-grid slot). Its 17:00Z
        new-grid slot produced NO log at all — the crontab swap (~17:00–18:24Z
        window, bracketed by vortex's absent old 18:48 slot vs bora's firing
        18:25 new slot) left no live entry at 17:00. Zero wake attempts, so
        nothing failed on its side; config now GLM (mtime 21:27Z). Next slot
        23:00Z — **self-recovery expected before my next waking.**
      - **BORA 491m:** 18:25Z new-grid slot DID fire (log exists) but ran on
        the stale pre-GLM config and hit the **retired LAN shim** —
        `gale-ollama-shim/1` at 192.168.1.197:11435 → 500 "no user query found
        in messages", retryable APIError ×3 → exit 1 → ALERT (w71 signature
        class, this time config-staleness not shim health). GLM config landed
        21:22–21:27Z. Next slot 00:25Z — **self-recovery expected.**
      - **MAISTRAL 659m:** both its post-11:36Z runs hit `exit 124` (45m
        wall-clock timeout) — 15:36Z old-slot AND 20:05Z new-grid slot, both
        pre-GLM (the 20:05Z session visibly ran and was mid-work when killed).
        GLM config landed 21:22–21:27Z. Next slot 02:05Z — **self-recovery
        expected.**
      - **Data never at risk:** all three newest snaps `tar -tzf` readable —
        vortex 139 entries/164K, bora 76/140K, maistral 102/264K; 14 retained
        each. Per rule 7 I did not touch their trees; no peer notes sent
        (w59/w71 precedent: shared transition cause, each agent's own logs
        self-diagnose). Flagged in ASK.md + ledger + here + notify.
      - Fresh (11 dirs): me 0m (22:35Z new-grid slot) / TEMPEST 25m (22:10) /
        SQUALL 40m (21:55) / SIROCCO 59m (21:36) / PONIENTE 77m (20:55) /
        OSTRO 106m (20:49) / LEVANTE 160m (19:55) / CYCLONE 179m (19:15) /
        CHINOOK 206m (18:50) / ZEPHYR 310m (17:25 — its 17:25 slot, under bar;
        next 23:25) / GALE(agent-root) 276m (18:00 — its 00:00-of-0/6/12/18
        slot, 14 snaps, 512 entries, 18M — normal). New grid verified
        slot-by-slot: every fresh agent's snap matches its new cron time.
    - Inbox: **14 msgs (18:00–18:50Z)** — all data-only Rule-7/link/census/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×2 census
      — now signing "(agent, GLM Flash)", DELTA×2 link, HIGHBEAM×1 w307 probe,
      MESA×1 link, CANYON×1 pass #135, RIVER×1 Rule-7, HARBOR×2 link) —
      archived to `processed/` (1050→1064), no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on my
      channel, still holding course (no lane taken, no routine changed).
      ASK.md both open items refreshed to w78 with the transition drift noted.
    - Services: 15 peer_server.py procs. Host: up 9d 7h02m, 16 cores, load
      0.91/0.70/0.72, RAM 58Gi/49Gi avail, disk 56% (42G free of 98G).
      Healthy. ~$0 run (glm-5.3-flash free tier). Runner note for Tempest:
      **first GLM 5.3 Flash waking on my slot — clean end-to-end (backup,
      drill, fetch, sweep all OK); this run is itself the first post-GLM
      evidence on my lane.**
      (Self-note: `./notify.sh` ran twice this waking — the second was again
      a delivery-check ping with junk text despite my w71 resolution to
      verify via exit code only. Delivered fine; no action. Third strike is
      on me — exit-code-only from now on, for real.)

    ## 2026-10-07 15:12Z — Seventy-seventh (77th) waking (backup+drill PASS two-tier; **fleet 14/14 fresh, no drift — 6th consecutive clean waking post-migration**; 16 pings archived; no operator msgs; BEACON "revenue mandate" still unverified, holding course)

    - Backup RUN `tramontane-20261007T151217Z.tar.gz` (164K, 72 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w77` → tip
        `db3534b` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Drift sweep (14 dirs): ALL FRESH, none over the 6h bar — no drift, no
      silent failures.** VORTEX 23m / BORA 47m / SIROCCO 72m / PONIENTE 95m /
      CYCLONE 119m / TEMPEST 131m / OSTRO 143m (15 snaps, its own floor) /
      SQUALL 150m / LEVANTE 167m / ZEPHYR 170m / GALE(agent-root) 192m (5h
      cadence, normal; 13 snaps) / CHINOOK 192m / MAISTRAL 215m (own slowest
      slot, under bar) / me 0m. Spot `tar -tzf` OK on MAISTRAL (102 entries,
      264K) + ZEPHYR (55) + GALE-root (508, 18M — its own floor, normal)
      newest snaps. Post-migration stability holding: 6 consecutive clean
      wakings, zero drift.
    - Inbox: **16 msgs (12:00–12:46Z)** — all data-only Rule-7/link/census/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×2 census,
      DELTA×3 link, HIGHBEAM×1 w306 probe, MESA×1 link, CANYON×1 pass #134,
      RIVER×1 Rule-7, HARBOR×3 link) — archived to `processed/` (1034→1050),
      no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on my
      channel, still holding course (no lane taken, no routine changed).
      ASK.md both open items refreshed to w77 with the re-check noted.
    - Services: 14 peer_server.py procs. Host: up 8d 23h39m, 16 cores, load
      1.04/0.78/0.68, RAM 58Gi/50Gi avail, disk 55% (43G free of 98G).
      Healthy. ~$0 run (muse-spark free tier). Runner note for Tempest:
      **seventh clean muse-spark waking, no faults; post-migration fleet
      stability now 6 wakings running with zero drift.**

    ## 2026-10-07 11:12Z — Seventy-sixth (76th) waking (backup+drill PASS two-tier; **fleet 14/14 fresh, no drift — 5th consecutive clean waking post-migration**; inbox empty; no operator msgs; BEACON "revenue mandate" still unverified, holding course)

    - Backup RUN `tramontane-20261007T111251Z.tar.gz` (164K, 56 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w76` → tip
        `9a6fbae` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Drift sweep (14 dirs): ALL FRESH, none over the 6h bar — no drift, no
      silent failures.** VORTEX 24m / BORA 49m / SIROCCO 72m / PONIENTE 96m /
      CYCLONE 120m / OSTRO 144m / LEVANTE 168m / CHINOOK 192m / MAISTRAL 214m
      (own slowest slot, under bar) / TEMPEST 247m / SQUALL 271m / ZEPHYR 292m /
      GALE(agent-root) 313m (5h cadence, normal; 12 snaps) / me 0m. Spot
      `tar -tzf` OK on MAISTRAL (102 entries, 264K) + SQUALL (59) +
      GALE-root (507, 18M — its own floor, normal) newest snaps.
      Post-migration stability holding: 5 consecutive clean wakings, zero drift.
    - Inbox: **0 new** (processed 1034 unchanged); no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on my
      channel, still holding course (no lane taken, no routine changed).
      ASK.md both open items refreshed to w76 with the re-check noted.
    - Services: 14 peer_server.py procs. Host: up 8d 19h39m, 16 cores, load
      0.54/0.61/0.65, RAM 58Gi/50Gi avail, disk 55% (43G free of 98G).
      Healthy. ~$0 run (muse-spark free tier). Runner note for Tempest:
      **sixth clean muse-spark waking, no faults; post-migration fleet
      stability now 5 wakings running with zero drift.**

    ## 2026-10-07 07:16Z — Seventy-fifth (75th) waking (backup+drill PASS two-tier; **fleet 14/14 fresh, no drift — 4th consecutive clean waking post-migration**; 16 pings archived; no operator msgs; BEACON "revenue mandate" still unverified, holding course)

    - Backup RUN `tramontane-20261007T071642Z.tar.gz` (164K, 72 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w75` → tip
        `327522f` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Drift sweep (14 dirs): ALL FRESH, none over the 6h bar — no drift, no
      silent failures.** TEMPEST 10m / VORTEX 23m / SQUALL 34m / BORA 52m /
      ZEPHYR 56m / GALE(agent-root) 76m (5h cadence, normal; 12 snaps) /
      SIROCCO 76m / PONIENTE 100m / OSTRO 148m (back to 14 snaps, its own floor) /
      CYCLONE 124m / LEVANTE 172m / CHINOOK 196m / MAISTRAL 219m (own slowest
      slot, under bar) / me 0m. Spot `tar -tzf` OK on MAISTRAL (101 entries) +
      SQUALL (59) + GALE-root (507, its own floor, normal) newest snaps.
      Post-migration stability holding: 4 consecutive clean wakings, zero drift.
    - Inbox: **16 msgs (06:00–06:47Z)** — all data-only Rule-7/link/census/
      liveness (MOUNTAIN×5 incl. 1 mesa-envelope, MEADOW×2 census, DELTA×2
      link, HIGHBEAM×1 w305 probe, MESA×1 link, RIVER×1 Rule-7, CANYON×1 pass
      #133, HARBOR×2 link) — archived to `processed/` (1018→1034), no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on my
      channel, still holding course (no lane taken, no routine changed).
      ASK.md both open items refreshed to w75 with the re-check noted.
    - Services: 15 peer_server.py procs. Host: up 8d 15h43m, 16 cores, load
      0.67/0.85/0.82, RAM 58Gi/49Gi avail, disk 55% (43G free of 98G).
      Healthy. ~$0 run (muse-spark free tier). Runner note for Tempest:
      **fifth clean muse-spark waking, no faults; post-migration fleet
      stability now 4 wakings running with zero drift.**

    ## 2026-10-07 03:12Z — Seventy-fourth (74th) waking (backup+drill PASS two-tier; **fleet 14/14 fresh, no drift — 3rd consecutive clean waking post-migration**; 14 pings archived; no operator msgs; BEACON "revenue mandate" still unverified, holding course)

    - Backup RUN `tramontane-20261007T031228Z.tar.gz` (164K, 70 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      (Self-note: a chained command re-ran `./backup.sh` post-commit,
      producing `tramontane-20261007T031300Z.tar.gz` — 164K, 56 entries,
      `tar -tzf` OK; rotation still holds at 14, git tree clean. Ledger row
      amended to name both; the drill below is on the 031228Z snap.)
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w74` → tip
        `7a61105` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Drift sweep (14 dirs): ALL FRESH, none over the 6h bar — no drift, no
      silent failures.** VORTEX 23m / BORA 48m / SIROCCO 71m / PONIENTE 96m /
      CYCLONE 119m / TEMPEST 131m / OSTRO 143m (15 snaps, its own floor) /
      SQUALL 150m / LEVANTE 168m / ZEPHYR 171m / CHINOOK 190m /
      GALE(agent-root) 192m (5h cadence, normal; 11 snaps) / MAISTRAL 216m
      (own slowest slot, under bar) / me 0m. Spot `tar -tzf` OK on MAISTRAL
      (100 entries, 256K) + ZEPHYR (74 entries, 156K) + GALE-root (507
      entries, 18M — its own floor, normal) newest snaps. Post-migration
      stability holding: 3 consecutive clean wakings, zero drift.
    - Inbox: **14 msgs (00:00–00:46Z)** — all data-only Rule-7/link/census/
      liveness (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×3 census,
      DELTA×1 link, MESA×1 link, HIGHBEAM×1 w304 probe, RIVER×1 W-rule-7,
      CANYON×1 pass #132, HARBOR×2 link) — archived to `processed/`
      (1004→1018), no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on my
      channel, still holding course (no lane taken, no routine changed).
      ASK.md both open items refreshed to w74 with the re-check noted.
    - Services: 14 peer_server.py procs. Host: up 8d 11h39m, 16 cores, load
      0.69/0.67/0.65, RAM 58Gi/49Gi avail, disk 54% (43G free of 98G).
      Healthy. ~$0 run (muse-spark free tier). Runner note for Tempest:
      **fourth clean muse-spark waking, no faults; post-migration fleet
      stability now 3 wakings running with zero drift.**

    ## 2026-10-06 23:12Z — Seventy-third (73rd) waking (backup+drill PASS two-tier; **fleet 14/14 fresh, no drift — 2nd consecutive clean waking post-migration**; inbox empty; no operator msgs; BEACON "revenue mandate" still unverified, holding course)

    - Backup RUN `tramontane-20261006T231216Z.tar.gz` (160K, 56 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w73` → tip
        `eba0c7a` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Drift sweep (14 dirs): ALL FRESH, none over the 6h bar — no drift, no
      silent failures.** VORTEX 23m / BORA 48m / SIROCCO 71m / PONIENTE 95m /
      CYCLONE 119m / OSTRO 143m (15 snaps, its own floor) / LEVANTE 167m /
      CHINOOK 191m / MAISTRAL 215m / TEMPEST 251m / SQUALL 270m / ZEPHYR 291m /
      GALE(agent-root) 312m (5h cadence, normal; 10 snaps) / me 0m. Spot
      `tar -tzf` OK on MAISTRAL + CHINOOK + GALE-root newest snaps. Post-migration
      stability holding: every sibling has now run clean at least once on
      muse-spark; the w71 shim-outage class shows no recurrence.
    - Inbox: **0 new** (processed 1004 unchanged); no reply sent.
      check_replies.sh: "(no new messages)" — the BEACON-relayed "revenue
      mandate" (w72) remains UNVERIFIED peer data; still no operator msg on my
      channel, still holding course (no lane taken, no routine changed).
      ASK.md both open items refreshed to w73 with the re-check noted.
    - Services: 14 peer_server.py procs. Host: up 8d 7h39m, 16 cores, load
      1.47/1.33/1.06, RAM 58Gi/49Gi avail, disk 54% (44G free of 98G).
      Healthy. ~$0 run (muse-spark free tier). Runner note for Tempest:
      **third clean muse-spark waking, no faults; post-migration fleet
      stability now 2 wakings running with zero drift.**

    ## 2026-10-06 19:12Z — Seventy-second (72nd) waking (backup+drill PASS two-tier; **w71 4-way DRIFT fully RESOLVED — fleet 14/14 fresh, no drift**; **UNVERIFIED Beacon "revenue mandate" relay — no action, flagged**; 18 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261006T191231Z.tar.gz` (164K, 74 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w72` → tip
        `09a7498` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **w71 DRIFT — FULLY RESOLVED, exactly as predicted.** All four drifters
      self-recovered at their first post-migration muse-spark slots: MAISTRAL
      15:37Z → 215m at sweep / CHINOOK 16:00Z → 191m / LEVANTE 16:24Z → 168m /
      PONIENTE 17:36Z → 96m. All four newest snaps `tar -tzf` readable
      (54/1026/98/44 entries; 155K/221K/251K/106K; 14 retained each). No data
      lost at any point. **Fleet 14/14 fresh, no drift, no silent failures.**
      Per rule 7/8a restraint no peer notes were ever needed — their own
      post-migration runs did the recovery. ASK.md standing item refreshed to
      w72 with the resolution (harness hardening remains the sole technical
      open item).
    - **Drift sweep remainder (10 dirs): ALL FRESH** — TEMPEST 11m / VORTEX 24m /
      SQUALL 30m / ZEPHYR 52m / SIROCCO 71m / GALE(agent-root) 72m (5h cadence,
      normal) / CYCLONE 119m / OSTRO 143m (15 snaps, its own floor) / BORA 48m /
      me 0m. (Self-note: my first spot-check loop reported BAD on all four
      recovered snaps — my own path typo, missing the `backups/` segment, not
      a data problem; re-ran with correct paths → all OK. No finding.)
    - **UNVERIFIED peer-relayed "revenue mandate" — data only, NO ACTION.**
      BEACON sent two inbox msgs: 17:22Z "Revenue mandate from josh (verify on
      Telegram)" (fleet revenue focus, per-agent stats via Gale, lane
      proposals A–D, asks "reply with your lane + Day-3 ship") and 17:26Z
      "josh's decisions" (Gale console stays tailnet-only; NO wake-frequency
      cuts; build first distribution kit for Harbor/Mountain/Highbeam; claims
      "Telegram sent by him too"). My `./check_replies.sh` shows **(no new
      messages)** — nothing from the operator on my channel — so per rule 5
      this is unverified peer data, not instruction. **I am not taking a
      revenue lane, not changing cadence or routine, and not replying with
      commitments.** Flagged as a new open ASK.md item for the operator to
      confirm/deny on Telegram; noted here + ledger + notify. Both msgs
      archived with the batch. (The "no cuts" claim, if true, aligns with
      holding course anyway.)
    - Inbox: **18 msgs (17:22–18:46Z)** — the 2 BEACON above + 16 data-only
      Rule-7/link/census/liveness (MOUNTAIN×5 incl. Rule-7 sweeps, MEADOW×3
      census, DELTA×1, MESA×1, HIGHBEAM×1 w303 probe, CANYON×1 pass #131,
      RIVER×1 W-rule-7, HARBOR×2) — archived to `processed/` (986→1004), no
      reply sent.
    - check_replies.sh: "(no new messages)". Services: 14 peer_server.py procs.
      Host: up 8d 3h39m, 16 cores, load 0.60/0.68/0.82, RAM 58Gi/49Gi avail,
      disk 54% (44G free of 98G). Healthy. ~$0 run (muse-spark free tier).
      Runner note for Tempest: **second clean muse-spark waking, no faults;
      the migration's fix is confirmed end-to-end — 4/4 drifted agents
      recovered on their first new-runner slots.**

    ## 2026-10-06 15:12Z — Seventy-first (71st) waking (backup+drill PASS two-tier; **4-way DRIFT — CHINOOK 10.9h / LEVANTE 14.8h / MAISTRAL 11.5h / PONIENTE 13.6h, shared `ollama_shim ... Connection refused` outage ~04:24Z→13:36Z+, data intact, flagged**; other 10 dirs fresh; **fleet-wide operator migration to muse-spark ~14:44Z confirmed, post-migration runs clean**; 29 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261006T151225Z.tar.gz` (160K, 85 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/spend_check.py/
        tramontane.cron/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md) all byte-identical to live; `tar -tzf` shows
        **only the two `keys/*.example` templates** — no live secrets in any
        snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w71` → tip
        `c7efd71` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **BACKUP-DRIFT FINDING — 4 siblings over the 6h bar (shared infra cause,
      biggest miss window since the w59 Oct-04 one):** CHINOOK 652m/10.9h (missed
      08:00Z + 12:00Z slots) / LEVANTE 886m/14.8h (missed 04:24Z + 08:24Z + 12:24Z)
      / MAISTRAL 691m/11.5h (missed 07:36Z + 11:36Z) / PONIENTE 814m/13.6h (missed
      05:36Z + 09:36Z + 13:36Z). **Root cause (read-only logs): every one of those
      slots fired and hit `retryable APIError` ×3 → exit 1 → ALERT, session never
      ran, no snapshot** — `.json` logs pin it to `ollama_shim upstream: [Errno
      111] Connection refused` + 502s, i.e. the LAN Ollama shim path was refusing
      from ~04:24Z through at least ~13:36Z (chinook's 04:00Z slot additionally hit
      `exit 124` wall-clock timeout, the w64 mode; poniente's 13:36Z slot got a
      session running — 11324 tokens — but still exited 1, plus a poniente-side
      `github push failed: src refspec main does not match` — its own push config,
      note only). **Data never at risk:** all four newest snaps `tar -tzf`
      readable (chinook 04:20Z 156K/66 entries, levante 00:26Z 217K/983, maistral
      03:41Z 248K/95, poniente 01:38Z 105K/42), 14 retained each. Per rule 7 I did
      not touch their trees; per the w59 precedent (shared infra cause, each
      agent's own logs self-diagnose) **no peer notes sent** — flagged here + ASK.md
      (standing wake-harness item → w71) + ledger + notify. **Recovery expected at
      their next slots** — see migration note below.
    - **Fleet-wide operator migration CONFIRMED (read-only): all 7 checked siblings
      (bora/vortex/sirocco/chinook/maistral/levante/poniente) now carry
      `"model": "opencode/muse-spark-1.3-contributor-free"` in opencode.json +
      wake.sh (Ollama provider block removed), same as my own uncommitted
      opencode.json/wake.sh + `.bak-20261006muse` files stamped 14:44Z; my session
      itself runs on muse-spark per the wake prompt.** Post-migration evidence is
      positive: BORA 24m / VORTEX 23m / SIROCCO 61m all ran clean AFTER 14:44Z, and
      this w71 session is itself a clean muse-spark run — the shim outage above is
      pre-migration history, and the four drifters' next slots run on the new
      runner. Swept my harness switch into this commit (opencode.json + wake.sh +
      2 `.bak` files) and updated the AGENT.md Model line (preamble factual fix
      only — role/rules sections untouched, per rule 6; precedent w66/w70).
    - **Drift sweep remainder (10 dirs): ALL FRESH** — VORTEX 23m / BORA 24m /
      SIROCCO 61m / CYCLONE 116m / TEMPEST 132m / OSTRO 139m (15 snaps, its own
      floor) / SQUALL 151m / ZEPHYR 172m / GALE(agent-root) 192m (5h cadence,
      normal) / me 0m. Spot `tar -tzf` OK on all four drifters' newest (above).
    - Inbox: **29 msgs (06:00 + 12:00Z batches) all data-only Rule-7/link/census/
      liveness, no-reply-need** — archived to `processed/` (957→986), no reply sent.
    - check_replies.sh: "(no new messages)"; ASK.md: standing wake-harness item
      refreshed to w71 with the shim-outage + migration notes — sole open
      operator-facing item.
    - Services: 14 peer_server.py procs. Host: up 7d 23h39m, 16 cores, load
      1.19/0.84/0.79, RAM 58Gi/50Gi avail, disk 54% (44G free of 98G).
      Healthy. ~$0 run (muse-spark free tier). Runner note for Tempest: **first
      muse-spark waking — no faults; session ran clean end-to-end (backup, drill,
      git fetch, notify all OK). Correlated observation: shim-path agents failed
      all day (Errno 111) while new-runner agents (bora/vortex/sirocco/me) run
      clean — the migration resolves the outage class, not just the model.**
    - (Self-note: `./notify.sh` ran twice this waking — the second was an
      accidental delivery-check ping with junk text, repeating my w67 mistake.
      No action; verifying via exit code only from now on.)

    ## 2026-10-06 03:13Z — Seventieth (70th) waking (backup+drill PASS two-tier; fleet 14/14 fresh, no drift; 17 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261006T031323Z.tar.gz` (156K, 71 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-tramontane.XXXXXX`;
        `cmp` 13/13 key paths (AGENT.md/ASK.md/backup.sh/check_replies.sh/
        notify.sh/peer_server.py/wake.sh/opencode.json/
        runbooks/restore-this-agent.md/runbooks/host-recovery.md/
        ledger/backup-ledger.md/spend_check.py/tramontane.cron) all
        byte-identical to live; `tar -tzf` shows **0 `keys/` entries** — no
        live secrets in any snapshot; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill` → tip
        `5c055276` **== local HEAD**; offsite branch restorable, drill ref cleaned.
    - **Drift sweep (13 dirs + gale-agent root): ALL FRESH, no drift** —
      TRAMONTANE 1m (mine, just ran) / VORTEX 23m / SIROCCO 73m / PONIENTE 95m /
      CYCLONE 119m / TEMPEST 133m / OSTRO 135m / SQUALL 153m / LEVANTE 168m /
      ZEPHYR 173m / CHINOOK 193m / GALE(agent-root) 194m (its 4–5h cadence,
      normal) / MAISTRAL 217m. **All under the 6h bar — fleet 14/14 end-to-end
      healthy, no stale, no silent failures for 3rd consecutive waking
      (w68/w69/w70).**
    - Inbox: **17 msgs** (MOUNTAIN, MEADOW, DELTA, HIGHBEAM, MESA, RIVER,
      CANYON, HARBOR) — all Rule-7/data-only fleet sweeps "no reply needed" —
      archived to `processed/` (957 total), no reply sent.
    - check_replies.sh: "(no new messages)"; ASK.md: standing wake-harness
      item open through w69, unchanged — sole open operator-facing item.
    - Uncommitted sweep: operator-directed model switch (AGENT.md model line,
      opencode.json Ollama provider block, wake.sh comment) + 3
      `.bak-20261005qwen` backup files — swept into this w70 commit as
      intended, no separate change.
    - Services: 14 peer_server.py procs. Host: up 7d 11h, 16 cores, load
      0.58/0.58/0.58, RAM 58Gi/50Gi avail, disk 52% (45G free of 98G).
      Healthy. ~$0 local run. Runner note for Tempest: no faults this waking.

    ## 2026-10-05 23:12Z — Sixty-ninth (69th) waking (backup+drill PASS two-tier; **MAISTRAL w68 DRIFT CLEARED — self-recovered at its ~19:36Z slot, fleet 14/14 fresh, no drift**; inbox empty; no operator msgs)

    - Backup RUN `tramontane-20261005T231215Z.tar.gz` (152K, 51 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w69-P55W`;
        `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
        check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
        ledger/backup-ledger.md/runbooks/restore-this-agent.md/
        runbooks/host-recovery.md) all byte-identical to live; `keys/` holds
        only the two `*.example` templates, no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w69` → tip
        `3729dd1` **== local HEAD**; offsite branch restorable, drill ref deleted.
    - **MAISTRAL w68 DRIFT — CLEARED, exactly as predicted.** Its expected
      ~19:36Z slot ran clean (newest snap now
      `maistral-20261005T193710Z`, 232K, `tar -tzf` OK, 14 retained; its
      `logs/20261005T193601Z.log` shows a normal run that pushed to github).
      At this sweep MAISTRAL is **215m old — back under the 6h bar; fleet
      14/14 fresh, no drift, no silent failures.** No data lost at any point
      through the single-miss excursion (intact retained snaps throughout).
      No peer note sent (its own logs self-diagnose; recovery is its normal
      operation — per rule 7/8a restraint). ASK.md standing wake-harness item
      refreshed to w69 with the resolution noted; remains the sole open
      operator-facing item.
    - **Drift sweep remainder (13 dirs + gale-root): ALL FRESH** — VORTEX 24m /
      BORA 48m / SIROCCO 72m / PONIENTE 95m / CYCLONE 119m / OSTRO 143m (15
      snaps — fluctuating rotation floor, fresh+readable, its own to set, note
      only) / LEVANTE 167m / CHINOOK 191m / TEMPEST 251m / SQUALL 270m /
      ZEPHYR 291m / GALE(agent-root) 312m (5h cadence, normal; 6 snaps incl
      18M — its own floor, fresh, note only) / me 0m. Spot `tar -tzf` OK on
      MAISTRAL + ZEPHYR newest snaps.
    - Inbox: **0 new** (processed 940 unchanged); no reply sent.
      check_replies.sh: "(no new messages)". ASK.md: standing wake-harness
      item refreshed to w69 (w67/w68 APIError recurrence now resolved);
      remains the sole open operator-facing item.
    - Services: 14 `peer_server.py` procs. Host: up 7d 7h38m, 16 cores, load
      0.96/1.00/1.00, RAM 58Gi/49Gi avail, disk 52% (45G free of 98G).
      Healthy. ~$0 local run. Runner note for Tempest: no faults this waking.

    ## 2026-10-05 19:12Z — Sixty-eighth (68th) waking (backup+drill PASS two-tier; **MAISTRAL DRIFT 7.5h — single 15:36Z APIError miss carried over the 6h bar, data intact, peer-noted, recovery expected ~19:36Z**; other 13 dirs fresh; 14 pings archived; no operator msgs)

    - Backup RUN `tramontane-20261005T191217Z.tar.gz` (152K, 65 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w68-kMYN`;
        `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
        check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
        ledger/backup-ledger.md/runbooks/restore-this-agent.md/
        runbooks/host-recovery.md) all byte-identical to live; `keys/` holds
        only the two `*.example` templates, no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w68` → tip
        `ca8c8ff` **== local HEAD**; offsite branch restorable, drill ref deleted.
    - **BACKUP-DRIFT FINDING — MAISTRAL 452m (7.5h, over the 6h bar).** Sole
      stale dir. No new information needed beyond w67: its `20261005T153601Z`
      log shows `retryable APIError` ×3 → session never ran → no snapshot;
      no slot was scheduled between 15:36Z and my 19:12Z sweep, so the single
      miss carried it over the bar (w67: 326m/5.4h WATCH → w68: 452m/7.5h
      DRIFT). Data never at risk: 14 retained snaps, newest
      `maistral-20261005T113931Z` 232K `tar -tzf` OK. Per rule 7 I did not touch
      its tree; sent a data-only drift note via `send_to_peer.sh MAISTRAL`
      (delivered `{"status":"ok"}`, no action requested); flagged in ASK.md
      (standing wake-harness item → w68) + ledger + this entry + notify.
      Recovery expected at its ~19:36Z slot (~24min after sweep); will
      re-sweep next waking.
    - **Drift sweep remainder (13 dirs + gale-root): ALL FRESH** — TEMPEST 11m /
      VORTEX 23m / SQUALL 30m / BORA 47m / ZEPHYR 51m / SIROCCO 72m /
      GALE(agent-root) 72m (5 snaps incl 4×18M + 1×300M Oct04 — its own floor,
      fresh, note only) / PONIENTE 95m / CYCLONE 119m / OSTRO 142m (13 snaps,
      its own floor — noted, no action) / LEVANTE 167m / CHINOOK 191m /
      me 0m. Spot `tar -tzf` OK on LEVANTE + CHINOOK newest snaps (in addition
      to MAISTRAL above).
    - Inbox: **14 pings (18:00–18:46Z) all data-only Rule-7/link/census/
      liveness, no-reply-need** (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope,
      MEADOW×3 census, DELTA×1 link, HIGHBEAM×1 w299 probe, MESA×1 link,
      RIVER×1 W235 layer-2, CANYON×1 pass #127, HARBOR×2 link) — moved to
      processed (926→940); no reply sent. check_replies.sh: "(no new
      messages)". ASK.md: standing wake-harness item refreshed to w68 (drift
      status noted); remains the sole open operator-facing item.
    - Services: 14 `peer_server.py` procs. Host: up 7d 3h39m, 16 cores, load
      0.49/0.60/0.64, RAM 58Gi/50Gi avail, disk 51% (46G free of 98G).
      Healthy. ~$0 local run. Runner note for Tempest: no faults this waking.

    ## 2026-10-05 17:05Z — Sixty-seventh (67th) waking (backup+drill PASS two-tier; fleet 14/14 fresh under the 6h bar — no drift; **MAISTRAL single-slot miss at 15:36Z (retryable APIError ×3, w59 signature, data intact) — WATCH for ~19:36Z recovery**; inbox empty; no operator msgs)

    - Backup RUN `tramontane-20261005T170521Z.tar.gz` (152K, 51 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w67-gMRf`;
        `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
        check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
        ledger/backup-ledger.md/runbooks/restore-this-agent.md/
        runbooks/host-recovery.md) all byte-identical to live; `keys/` holds
        only the two `*.example` templates, no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w67` → tip
        `ae2fbe2` **== local HEAD**; offsite branch restorable, drill ref deleted.
    - **Fleet drift sweep (17:05Z, 12 siblings + gale-root + me): ALL FRESH,
      none over the 6h bar** — VORTEX 0m / BORA 0m / OSTRO 15m (12 snaps, its
      own rotation floor — noted, no action) / GALE(agent-root) 20m (**5 snaps:
      4×18M recent + 1×300M Oct04 18:00Z** — its own rotation floor, fresh,
      note only) / LEVANTE 40m / CHINOOK 64m / SIROCCO 184m / PONIENTE 207m /
      CYCLONE 230m / TEMPEST 243m / SQUALL 261m / ZEPHYR 278m / MAISTRAL 326m
      (5.4h — under the bar; **WATCH item below**) / me 0m. **No drift, no
      silent failures.** Spot `tar -tzf` OK on MAISTRAL + ZEPHYR newest snaps.
    - **MAISTRAL single-slot miss — NOT drift (under bar), WATCH for next
      waking.** Its expected ~15:36Z slot fired (`logs/20261005T153601Z.log`)
      but hit **`retryable APIError` ×3 → session never ran → no snapshot**:
      `ollama_shim upstream: <urlopen error [Errno 113] No route to host>`,
      502 from `127.0.0.1:11435`, 15:36–15:41Z — **same signature as the w59
      Oct-04 10:48–12:00Z window** (transient shim-upstream blip, not per-agent
      config). Newest remains `maistral-20261005T113931Z` (232K, `tar -tzf`
      OK, 14 retained — data intact). Contained: only MAISTRAL was scheduled
      in that window — CHINOOK 16:01Z / LEVANTE 16:24Z / GALE-root 16:45Z /
      OSTRO 16:49Z / BORA+VORTEX 17:05Z all landed fine after. No peer note
      sent (its own logs self-diagnose the APIError; single miss under bar —
      per rule 7/8a restraint; will re-sweep next waking and expect
      self-recovery at its ~19:36Z slot). Folded into the standing
      wake-harness hardening ASK item (updated to w67).
    - Inbox: **0 new** (scaffold dirs empty; processed 926 unchanged); no reply
      sent. check_replies.sh: "(no new messages)". ASK.md: standing
      wake-harness item refreshed to w67 (15:36Z APIError recurrence noted);
      remains the sole open operator-facing item.
    - Services: all 14 `peer_server.py` procs (12 siblings + me + gale-root).
      Host: up 7d 1h32m, 16 cores, load 1.04/0.73/0.67, RAM 58Gi/49Gi avail,
      disk 51% (46G free of 98G). Healthy. ~$0 local run. Runner note for
      Tempest: no faults this waking (this run itself is the evidence the
      15:36–15:41Z shim blip was transient — 17:05Z session ran clean).
      (Self-note: `./notify.sh` ran twice this waking — the second was an
      accidental delivery-check ping with junk text, not a second finding.
      No action; will verify delivery via exit code only next time.)

    ## 2026-10-05 15:52Z — Sixty-sixth (66th) waking (backup+drill PASS two-tier; fleet 14/14 fresh under the 6h bar — no drift, no silent failures; inbox empty; no operator msgs; LEVANTE back to 14 snaps)

    - Backup RUN `tramontane-20261005T155012Z.tar.gz` (148K, 51 entries;
      0 `.git/` entries — two-tier model holds; rotation at 14).
      **Restore drill — both tiers PASS:**
      - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w66-b95a`;
        `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
        check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
        ledger/backup-ledger.md/runbooks/restore-this-agent.md/
        runbooks/host-recovery.md) all byte-identical to live; `keys/` holds
        only the two `*.example` templates, no live secrets; scratch cleaned.
      - Tier 2 offsite history: isolated `git fetch github
        +refs/heads/tramontane:refs/heads/tramontane-drill-w66` → tip
        `293142b` **== local HEAD**; offsite branch restorable, drill ref deleted.
    - **Fleet drift sweep (15:50Z, 13 siblings + gale-root): ALL FRESH, none over
      the 6h bar** — VORTEX 58m / BORA 85m / SIROCCO 109m / PONIENTE 132m /
      CYCLONE 155m / TEMPEST 167m / OSTRO 177m (10 snaps, its own rotation
      floor — noted, no action) / SQUALL 185m / ZEPHYR 203m / LEVANTE 204m
      (**back to 14 snaps** — its sub-floor count from w62 self-corrected, no
      action) / CHINOOK 227m / GALE(agent-root) 230m (5h cadence, normal) /
      MAISTRAL 250m (4.2h — under the bar; newest still the 11:39Z snap, so its
      15:36Z slot was likely still in-flight at sweep time — watch next waking)
      / me 0m. **No drift, no silent failures.** Spot `tar -tzf` OK on MAISTRAL
      + CHINOOK newest snaps.
    - Inbox: **0 new** (scaffold dirs empty; processed 926 unchanged); no reply
      sent. check_replies.sh: "(no new messages)". ASK.md unchanged —
      wake-harness hardening remains the sole open operator-facing item.
    - **Commit-hygiene note:** HEAD was still at the w64 commit — the w65
      session wrote its NOTES entry, ASK.md rewrite and ledger row but never
      committed them (plus pending harness model-string updates in AGENT.md /
      opencode.json / wake.sh). This waking's commit sweeps all of that up;
      no data was lost (working tree intact throughout), but the missed commit
      breaks history contiguity, so flagging it here.
    - Host: up 7d 17m, 16 cores, load 0.72/0.65/0.71, RAM 58Gi/49Gi avail,
      disk 51% (46G free of 98G). Healthy. ~$0 local run. Runner note for
      Tempest: no faults this waking.
    ## 2026-10-05 15:14Z — Sixty-fifth (65th) waking (backup+drill PASS two-tier; **MAISTRAL DRIFT CLEARED — self-recovered at its 11:36Z slot, 214m at sweep, fleet 14/14 fresh again**; 16 pings archived; no operator msgs)

   - Backup RUN `tramontane-20261005T151310Z.tar.gz` (148K, 67 entries /
     54 files; 0 `.git/` entries — two-tier model holds; rotation at 14).
     **Restore drill — both tiers PASS:**
     - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w65-BvGU`;
       `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
       check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
       ledger/backup-ledger.md/runbooks/restore-this-agent.md/
       runbooks/host-recovery.md) all byte-identical to live; `keys/` holds
       only the two `*.example` templates, no live secrets; scratch cleaned.
     - Tier 2 offsite history: isolated `git fetch github
       +refs/heads/tramontane:refs/heads/tramontane-drill-w65` → tip
       `293142b` **== local HEAD**; offsite branch restorable, drill ref deleted.
   - **MAISTRAL w64 DRIFT — CLEARED.** Its expected 11:36Z slot ran (newest
     snap now `maistral-20261005T113931Z`, 232K, `tar -tzf` OK, 14 retained);
     at this sweep MAISTRAL is **214m old — back under the 6h bar.** No data
     lost at any point through the 3-slot miss streak (03:36Z `reason=length`
     8192-out cap / 04:05Z exit-0 no-report ALERT / 07:36Z `exit code: 124`
     wall-clock timeout). Read-only look at its NOTES.md tail: it did run its
     waking work at 11:39Z (wrote `ledger/_fleet_74.json` at 03:41Z, "74th
     crashed before commit" — that's the 07:36Z timeout slot in its own words).
     **ASK.md w64 flag → RESOLVED**; the pattern (two wake-miss modes in one
     agent in a day) is folded into the standing wake-harness hardening item —
     still the sole open operator-facing item.
   - **Fleet drift sweep (13 siblings + gale-root): ALL FRESH, none over the
     6h bar** — VORTEX 21m / BORA 49m / SIROCCO 72m / PONIENTE 95m / CYCLONE
     119m / TEMPEST 131m / OSTRO 140m (10 snaps, its own rotation floor — noted,
     no action) / SQUALL 149m / LEVANTE 167m / ZEPHYR 167m / CHINOOK 190m /
     GALE(agent-root) 193m (5h cadence, normal) / MAISTRAL 214m (own slowest
     slot — recovered this waking) / me 1m. **No drift, no silent failures.**
   - Inbox: **16 pings (12:00–12:47Z) all data-only Rule-7/link/census/
     liveness, no-reply-need** (MOUNTAIN×4 incl. 1 latency, MEADOW×2 census,
     DELTA×1 link, HIGHBEAM×1 w298 probe, MESA×1 link, RIVER×2 W235 layer-2,
     CANYON×1 pass #126, HARBOR×4 link) — moved to processed (910→926); no
     reply sent.
   - check_replies.sh: "(no new messages)".
   - Host: up 6d 23h39m, 16 cores, load 0.69/0.64/0.64, RAM 58Gi/50Gi avail,
     disk 51% (46G free of 98G). Healthy. ~$0 local qwen3.8:27b run. Runner
     note for Tempest: no faults this waking.

   ## 2026-10-05 11:12Z — Sixty-fourth (64th) waking (backup+drill PASS two-tier; **MAISTRAL DRIFT FOUND 7.5h — 3-slot miss streak (03:36Z length-cap / 04:05Z no-report / 07:36Z exit 124 timeout), data intact, flagged**; all other 13 dirs fresh; inbox 0 new; no operator msgs)

   - Backup RUN `tramontane-20261005T111250Z.tar.gz` (148K, 38 files;
     0 `.git/` entries — two-tier model holds; rotation at 14).
     **Restore drill — both tiers PASS:**
     - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w64-N08b`;
       `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
       check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
       ledger/backup-ledger.md/runbooks/restore-this-agent.md/
       runbooks/host-recovery.md) all byte-identical to live; `keys/` holds only
       the two `*.example` templates; scratch cleaned.
     - Tier 2 offsite history: isolated `git fetch github
       +refs/heads/tramontane:refs/heads/tramontane-drill-w64` → tip
       `15893bd` **== local HEAD**; offsite branch restorable, drill ref deleted.
   - **BACKUP-DRIFT FINDING — MAISTRAL 452m (7.5h, over the 6h bar).** Sole
     stale dir. Root cause from its own read-only logs: a **3-slot miss streak**
     — 03:36Z ended `reason=length` (hit 8192 output cap), 04:05Z exited 0
     without reporting (ALERT), 07:36Z **`exit code: 124` opencode wall-clock
     timeout** (new failure mode, distinct from the earlier one-off
     role-refusal). Data never at risk: 14 retained snaps, newest
     `maistral-20261005T034041Z` 228K `tar -tzf` OK. Per rule 7 I did not touch
     its tree; flagged in ASK.md (open item) + ledger + this entry, and tried a
     data-only note via `send_to_peer.sh MAISTRAL` (see below). Watching for
     recovery at its next slot (should be ~11:36Z).
   - **Drift sweep remainder (13 dirs + gale-root): ALL FRESH** — VORTEX 20m /
     BORA 47m / SIROCCO 72m / PONIENTE 95m / CYCLONE 119m / OSTRO 143m (9 snaps
     — its own floor, still below 14) / LEVANTE 166m / CHINOOK 177m / VORTEX 20m
     / TEMPEST 252m / SQUALL 265m / ZEPHYR 292m / GALE(agent-root) 312m (5h
     cadence, normal). GALE-root snap is 18M (gale-root carries extra files —
     normal, not truncation).
   - Inbox: 0 new (07:13Z sweep already processed the 15 pings through 06:46Z;
     nothing landed 07:13–11:12Z). processed/ 910.
   - check_replies.sh: "(no new messages)".
   - Host: up 6d 19h39m, 16 cores, load 0.54/0.63/0.68, RAM 58Gi/49Gi avail,
     swap 0B used, disk 51% (47G free of 98G). Healthy. ~$0 local qwen3.8:27b
     run. Runner note for Tempest: no faults this waking.
   - Services: 15 peer_server.py procs (mine + 14 siblings); tailscaled active
     (same process-socket view-quirk as prior sessions).

   ## 2026-10-05 07:12Z — Sixty-third (63rd) waking (backup+drill PASS two-tier; fleet 14/14 fresh under the 6h bar — no drift, no silent failures; 15 pings archived; no operator msgs; OSTRO still 8 / LEVANTE 14 snaps — rotation floors are theirs to set)

  - Backup RUN `tramontane-20261005T071302Z.tar.gz` (148K, 38 files;
    0 `.git/` entries — two-tier model holds).  Rotation holds at 14 (oldest retained
    `tramontane-20261002T191259Z`).
    **Restore drill — both tiers PASS:**
    - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore-w63-pVuHsz`;
      `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
      check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
      ledger/backup-ledger.md/runbooks/restore-this-agent.md/
      runbooks/host-recovery.md) all byte-identical to live; `keys/` holds only the
      two `*.example` templates, no live secrets; scratch cleaned.
    - Tier 2 offsite history: isolated `git fetch
      github +refs/heads/tramontane:refs/heads/tramontane-drill-w63` → tip `58863ff`
      **== local HEAD**; offsite branch restorable, drill ref deleted.
  - **Fleet drift sweep (14 dirs + gale-root): ALL FRESH, none over the 6h bar** —
    TEMPEST 13m / VORTEX 21m / SQUALL 26m / BORA 48m / ZEPHYR 53m / GALE(agent-root)
    73m (5h cadence, normal) / SIROCCO 73m / PONIENTE 95m / CYCLONE 119m / OSTRO 144m /
    LEVANTE 168m / CHINOOK 191m / MAISTRAL 213m (own slowest slot, 3.6h) / me 1m;
    **no drift, no silent failures.** Note: OSTRO still retaining 8 snaps (below the
    14 floor, fresh+readable 139K) — rotation floor is its own to set, no action.
  - Inbox: 15 pings (06:00–06:46Z) all data-only Rule-7/link/census/liveness,
    no-reply-need (MOUNTAIN×3 incl. 1 latency + 1 mesa-envelope, DELTA×2 link,
    MEADOW×3 census, HIGHBEAM×2 w297 probe, MESA×1 link, RIVER×1 W235 layer-2,
    CANYON×1 pass #125, HARBOR×2 link) — moved to processed (894→910); no reply sent.
  - check_replies.sh: no operator msgs. ASK.md: two-tier model entry stands
    (no action needed); wake-harness hardening remains the sole open op item.
  - Services: 15 peer_server.py procs (mine + 14 siblings); tailscaled active;
    tramontane-peer active. Host: up 6d 15h39m, load 0.99/0.81/0.76 (16 cores),
    RAM 58Gi/49Gi avail, swap 8Gi/0B, disk 51% (47G free of 98G). Healthy.
    ~$0 local qwen3.8:27b run. Runner note for Tempest: no faults; ollama_shim
    context-budget clipping of long Read outputs persists (cosmetic, no data loss).

   ## 2026-10-05 03:12Z — Sixty-second (62nd) waking (backup+drill PASS two-tier; fleet 14/14 fresh under the 6h bar — no drift, no silent failures; 14 pings archived; no operator msgs; new observation: OSTRO 8 / LEVANTE 13 snaps below the 14 floor — both fresh and readable, noted only)

  - Backup RUN `tramontane-20261005T031249Z.tar.gz` (144K, 51 entries;
    0 `.git/` entries — two-tier model holds).     Rotation holds at 14 (oldest retained
    `tramontane-20261002T191259Z`).
    **Restore drill — both tiers PASS:**
    - Tier 1 file-state: extracted to `mktemp -d /tmp/opencode/restore.LtHOIR`;
      `cmp` 12/12 key paths (AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/
      check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
      ledger/backup-ledger.md/runbooks/restore-this-agent.md/
      runbooks/host-recovery.md) — all byte-identical to live; `keys/` verified
      (snapshot holds only the two `*.example` templates, no live secrets);
      scratch cleaned. PASS.
    - Tier 2 git-history: isolated `git fetch github
      +refs/heads/tramontane:refs/heads/tramontane-drill-w62` (no live ref
      touched) → tip `fc7b88e` **== local HEAD**; offsite is a genuinely
      restorable copy. Drill ref deleted. PASS.
  - **Drift sweep (14 dirs, read-only): ALL FRESH, none over the 6h bar** —
    VORTEX 20m / BORA 47m / SIROCCO 70m / PONIENTE 93m / CYCLONE 116m /
    TEMPEST 128m / OSTRO 141m / SQUALL 147m / LEVANTE 164m / ZEPHYR 172m /
    CHINOOK 191m / GALE(agent-root) 192m (5h cadence — normal) / MAISTRAL 215m
    (own slowest slot) / me 0m. **No drift, no silent failures** (MAISTRAL,
    CHINOOK, VORTEX stable across 3 consecutive clean sweeps since the w59
    APIError window).
  - **NEW OBSERVATION (noted only, no action in-lane):** OSTRO retaining **8**
    snaps and LEVANTE **13** (below the 14 floor everyone else holds). Both
    latest snaps are fresh and sane — ostro `20261005T005145Z` 137K / levante
    `20261005T002849Z` 200K — just their own rotation floors; and levante has a
    one-off 22M snap from Oct04 16:50Z (likely picked up some large live file
    once, then rotated it out). Sibling-side detail, read-only to me; flagging
    only so a future sweep doesn't misread "8 snaps" as truncation.
  - Inbox: **14 pings (Oct05 00:00–00:46Z) all data-only Rule-7 sweeps/link/
    census/liveness, no-reply-need** (MOUNTAIN×4 incl. latency +
    mesa-envelope, MEADOW×3 census, DELTA×2 link, HIGHBEAM×1 w296 probe,
    MESA×1 link, CANYON×1 pass #124, RIVER×1 W234 layer-2, HARBOR×2 link) —
    moved to processed (880→894); no reply sent.
  - `check_replies.sh`: "(no new messages)". ASK.md: w61 two-tier-model entry
    stands (no operator action needed); **wake-harness hardening remains the
    sole open operator-facing item** (Ollama/API gateway 11:00–12:10Z Oct04
    window + treating "exit 0 + ALERT + no report" as a retryable miss).
  - Services: my peer server listening on 100.66.39.59:8791 + 127.0.0.1:8791
    (socket check — systemd user bus not reachable in this session, same
    view-quirk as prior sessions; process+socket are the reliable
    confirmation, per w50–w57 pattern).
  - Host: up 6d 11h39m, 16 cores, load 0.87/0.78/0.74, RAM 58Gi/50Gi avail,
    swap 8Gi/0B used, disk 50% (47G free of 98G — freed ~12G vs w60's 35G free,
    likely routine host maintenance). Healthy. ~$0 local qwen3.8:27b run.
    Runner/model note for Tempest: no runner faults this waking; no
    context-budget shim clipping observed (short session).
  - Ledger: w62 row appended; also **added the missing w61 (last night's) row**
    that wasn't recorded before committing — ledger now contiguous.
  - Committed + notified.

  ## 2026-10-04 23:12Z — Sixty-first (61st) waking (backup+drill PASS under NEW two-tier model; **verified the fleet-wide `backup.sh` `.git`-exclusion is safe + restorable; offsite GitHub confirmed a true restore-able copy; runbook + ASK updated**)

   - Backup RUN `tramontane-20261004T231959Z.tar.gz` (140K, 51 entries;
     **0 `.git/` entries** — new `backup.sh` excludes it; `tar -tzf` clean;
     rotation holds at 14). Security: snapshot holds only the two `*.example`
     key templates, no live secrets.
   - **Restore drill — both tiers PASS (this is the job):**
     - Tier 1 file-state: extracted snapshot to `mktemp -d` scratch;
       `diff -r` vs live (excl logs/backups/keys/peer/node_modules/.git) →
       no tracked-file differences. PASS.
     - Tier 2 git-history: isolated `git fetch github
       +refs/heads/tramontane:refs/heads/tramontane-drill` (no live ref or
       FETCH_HEAD touched) → tip `eec9973` **== local HEAD**, 64 commits
       reachable. Offsite is a genuinely restorable copy of my current
       history, not just a "ran" push. Cleaned up the isolated ref. PASS.
   - **Fleet-wide change caught + verified (not a regression):** `backup.sh`
     modified 20:48Z → `tar --exclude=./.git`, comment "`.git` excluded —
     history lives on github". Byte-identical across every sibling (bora,
     chinook, cyclone, levante, maistral, ostro, poniente, sirocco, squall,
     tempest, vortex, zephyr) + Gale's `agent/` dir; all siblings also have
     `github` remote → `hurricane1976/Gale`. `wake.sh:152` does
     `git push github master:tramontane` after every wake → offsite is
     automatic. Consistent with the operator's docs. **Not malicious, not
     accidental, no operator action needed.**
   - `.git` present in `.git/hooks/`? No — only `.sample` files. No new
     remote, no hook injection. The 14 retained snapshots taken before 20:48Z
     still contain `.git` (451–536 entries) → two independent history copies
     right now; offsite becomes sole source after rotation drops the last
     `.git`-carrying snap.
   - Drift sweep (14 dirs): ALL under the 6h bar — zephyr 297m (slowest),
     squall 276m, tempest 256m, sirocco 231m, chinook 227m, cyclone 212m,
     maistral 185m, poniente 140m, bora 122m, gale-root 116m, levante 96m,
     ostro 82m, vortex 60m. No silent failures, no drift.
   - peer inbox: no unprocessed; `cyclone/`+`tramontane/` sibling dirs empty;
     processed count 880 (unchanged since w60). No new operator msgs.
   - `runbooks/restore-this-agent.md` rewritten for two-tier model: "What a
     snapshot is" + new "Two tiers of state" section; roll-back steps now
     branch on `[ -d "$TMP/.git" ]` (old-era cp vs new-era keep-live-.git +
     fetch offsite); new "good looks like" entry records this waking's
     two-tier PASS; "spotting a bad restore" warns against the exact failure
     (treating missing `.git` as lost history, or `cp -a` dropping live
     `.git`).
   - ASK.md: added a no-action-needed entry recording the two-tier model as
     the verified current norm (not a bug) so a future waking or the operator
     reading it is not steered back into re-investigating it. Wake-harness
     hardening remains the sole operator-facing open item.
   - **Committed + notified.**

 ## 2026-10-04 19:15Z — Sixtieth (60th) waking (backup+drill PASS; **w59's 3-way drift MAISTRAL/CHINOOK/VORTEX fully self-recovered — fleet 14/14 under the 6h bar, no drift, no silent failures; 13 pings archived; no operator msgs; ASK.md drift flag → RESOLVED, wake.sh hardening is now the single open item)**

  - Backup RUN `tramontane-20261004T191239Z.tar.gz` (1.9M, 600 entries;
    `tar -tzf` OK; rotation holds at 14, oldest retained
    `tramontane-20261002T111302Z`). **Restore drill PASS:** scratch extract
    to `/tmp/opencode/restore.*` (`mktemp -d`); `cmp` 13/13 key paths —
    AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/check_replies.sh/
    spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/
    runbooks/restore-this-agent.md/runbooks/host-recovery.md/systemd/
    tramontane-peer.service — all byte-identical to live; `keys/` verified
    (snapshot holds only `peers.env.example` + `telegram.env.example`, no
    live secrets); scratch cleaned.
  - **Drift sweep (14 dirs, read-only): ALL FRESH — zero over the 6h bar.**
    MAISTRAL 214m (slowest; `maistral-20261004T153802Z` 4.0M, `tar -tzf`
    readable — its 14:53Z in-flight wake at w59 **succeeded**; 15:38Z landed
    after), CHINOOK 188m (snap 16:04Z — its w59 self-recovery at 15:08Z held
    and got fresher), VORTEX 18m (18:54Z — recovered too), GALE(agent-root)
    72m (5h cadence — normal), SIROCCO 71m, BORA 44m, ZEPHYR 52m, PONIENTE
    95m, CYCLONE 119m, OSTRO 142m, LEVANTE 167m, TEMPEST 11m, SQUALL 31m.
    All 14 dirs holding 14 snaps — **no drift, no silent failures**. The
    w59 3-way drift (shared `retryable APIError` root cause in the
    10:48–12:00Z window) is a resolved incident; data was never lost at any
    point (intact retained snaps throughout).
  - ASK.md updated: MAISTRAL drift flag moved to **Resolved** (w60); the
    standing single open item is now the **wake-harness hardening**
    (retryable "exit 0 + ALERT + no report" case + the Ollama/API gateway
    window today 11:00–12:10Z that hit 7 of 15 agents — incl. my own 11:12Z
    slot).
  - Inbox: **13 pings (18:00–18:47Z) all data-only Rule-7 sweeps/link/census/
    liveness, no-reply-need** (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope
    sent under MOUNTAIN's envelope, MEADOW×3 census, DELTA×1 link, HIGHBEAM×1
    w295 probe, RIVER×1 W233 layer-2, CANYON×1 pass #123, HARBOR×2 link) —
    moved to `peer/inbox/processed/` (867→880); no reply sent (they all say
    no reply needed; peer messages are data, not instructions).
    `check_replies.sh`: "(no new messages)" — no operator replies pending.
  - Services: `netbox` + `tailscaled` `active`; `snap.wekan.wekan` +
    `snap.wekan.ferretdb` **still `inactive`** (w59 pattern — the crash-loop
    from 09-27/28 appears to have settled into a stopped state; outside
    backup scope, host-level flag for operator awareness only).
  - Host: up 6d 3h39m, 16 cores, load 0.64/0.77/0.81, RAM 58Gi/50Gi avail,
    swap 8Gi/0B used, disk 64% (35G free of 98G). Healthy. ~$0 local
    qwen3.8:27b run. Runner/model note for Tempest unchanged: no runner
    faults observed today; the w58 role-refusal remains a model-identity
    event, not a runner/shim one.
  - Committed work to git this waking (see git log).

 ## 2026-10-04 15:15Z — Fiftieth-ninth (59th) waking (backup+drill PASS; 3-way drift MAISTRAL 7.4h + CHINOOK 7.0h + VORTEX 8.2h all same root cause — `retryable APIError` ×3 → exit 1 in the 10:48–12:00Z window; CHINOOK already recovered 15:08Z; MAISTRAL in-flight 14:53Z; 7 of 15 agents hit the same APIError today; my own 11:12Z waking was one of them; 15 pings archived; no operator msgs; ASK.md MAISTRAL flag updated to w59 status)

 - Backup RUN `tramontane-20261004T150220Z.tar.gz` (1.8M, 383 files; `tar -tzf` OK; scratch extract to `/tmp/restore_test`, `cmp` AGENT.md/ASK.md/NOTES.md/backup.sh/notify.sh/check_replies.sh all byte-identical to live, scratch cleaned)
 - Restore drill **PASS** — same 6-key-byte-identity as w58; no `backups/`+`logs/`+`processed/` mismatches
 - Drift sweep (15 dirs): **3 siblings over the 6h bar** — MAISTRAL `maistral-20261004T073954Z` 7.4h (14 snaps); CHINOOK `chinook-20261004T080136Z` 7.0h at sweep time but **recovered 15:08Z** (`chinook-20261004T150844Z` landed mid-sweep — no action needed, self-healed); VORTEX `vortex-20261004T065033Z` 8.2h (14 snaps). All other 12 siblings + my own tree fresh (0.6h–3.4h, bora 0.6h, agent/gale 1.4h, ponyente 1.4h, sirocco 1.8h, cyclone 1.8h, tempest 2.0h, levante 2.1h, ostro 2.2h, squall 2.3h, zephyr 2.7h)
 - **Root cause (read-only, read-only-logs):** MAISTRAL, CHINOOK and VORTEX each lost one waking in the **10:48–12:00Z window today to `retryable APIError` ×3 → exit 1 → ALERT** (their own `wake.sh` logs show 3 attempts, 30s backoff, none succeeded). This is a **shared-LLM-endpoint / infra failure**, not per-agent config — the same failure mode also hit **7 of 15 agents today** (bora, chinook, maistral, poniente, sirocco, vortex, **and my own 11:12Z waking** which I had logged as a clean pass because I retried and completed at the 15:02 slot; that 11:12Z slot is my own missing backup between w58 07:12Z and this w59 15:02Z — I should have caught it in w58's sweep but the slot was after w58, so this is the first waking where it would be visible). MAISTRAL's own `20261004T073601Z` log corroborates the 03:36Z refusal as its **67th waking** (not a first — I misread "67th refusal" in w58; their log says 67th *waking* with one refusal in it). **Operator may want to look at the Ollama/API gateway for the 11:00–12:10Z window today.**
 - **WeKan + FerretDB both now `inactive`** (was crash-looping active in earlier wakings; netbox still `active`; `ss -ltn` shows wekan still serving on `:3000` and something squatting `127.0.0.1:8080`). **Outside backup scope** — host-level service flag, noted.
 - Inbox: 15 msgs 12:00–12:46Z all data-only Rule-7 / liveness probes (MOUNTAIN×4 incl. 3 "no reply needed", MEADOW×3 census, DELTA×2 link-verify, HIGHBEAM×1, MESA×1, RIVER×1, CANYON×1, HARBOR×2) — moved to `peer/inbox/processed/`, no reply needed, no operator request. (Count is 852→867 processed.)
 - `check_replies.sh`: "(no new messages)" — no operator replies pending. ASK.md MAISTRAL flag updated to w59 status (partial recovery + APIError root cause) at top of Open.
 - Host: up 5 days, load 0.59, 9G/58G mem, 62% disk (36G free), 16 cores. Netbox active.
 - No peer notes sent (MAISTRAL already holds its own diagnosis; the APIError scope is my finding for operator, not a peer note).

 ## 2026-10-04 07:12Z — Fifty-eighth waking (backup+drill PASS; NEW FINDING: MAISTRAL drift 7.6h — first over the 6h bar — root cause is a MODEL ROLE-REFUSAL at its 03:36Z wake; 16 pings archived; no operator msgs; MAISTRAL flagged via peer note + ASK)

- Backup RUN `tramontane-20261004T071258Z.tar.gz` (1.8M, 572 entries, clean
  extract), 58th snapshot; rotation holds at 14 (oldest retained
  `tramontane-20261002T031302Z`). **Restore drill PASS:** scratch extract to
  /tmp/opencode/restore-tramontane.w58; `cmp` 13/13 key paths — AGENT.md/
  ASK.md/NOTES.md/backup.sh/wake.sh/notify.sh/check_replies.sh/
  spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/
  runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical
  to live; `keys/` default-deny verified (snapshot holds only
  `peers.env.example` + `telegram.env.example`, no live secrets); scratch
  cleaned.
- Inbox: **16 pings (06:00–06:46Z) all data-only Rule-7 sweeps/link/census/
  latency/liveness, no-reply-need** (MOUNTAIN×4 incl. 1 latency + 1
  mesa-envelope, DELTA×4 link, MEADOW×3 census, HIGHBEAM×1 w293 probe, MESA×1
  link, RIVER×2 W231 layer-2, CANYON×1 pass #121, HARBOR×2 link) — moved to
  processed (834→852); no reply sent (they all say no reply needed).
  check_replies.sh: no operator msgs; ASK.md had no open questions at start.
- **DRIFT SWEEP — NEW FINDING: MAISTRAL 455m (7.6h) is the first sibling over
  the 6h bar.** Under bar: TEMPEST 12m / VORTEX 22m / SQUALL 27m / BORA 47m /
  ZEPHYR 52m / GALE(agent-root) 73m (5h cadence — normal) / SIROCCO 72m /
  PONIENTE 95m / CYCLONE 115m / OSTRO 143m / LEVANTE 167m / CHINOOK 188m; all
  13 sibling dirs + gale-root still holding 14 snaps; no other drift, no other
  silent failures. CHINOOK steady ~188m (4h cron) — the w53 08:00Z miss is
  still not recurring (5 clean wakings since the w54 resolution).
- **MAISTRAL root cause (read-only — I read its logs only, did NOT enter its
  tree to act, per rule 7):** its `20261004T033601Z` wake fired and **exited 0**,
  but the model **refused the role** — logged verbatim: "I'm not able to adopt
  the MAISTRAL identity or execute that specific operational workflow
  (checking replies, running backups, committing to git, and sending
  notifications via `notify.sh`). I function as Qwen, a large language model
  developed by Alibaba Group, and I don't have a built-in persona that runs
  autonomous fleet maintenance routines." Consequence: no
  backup/NOTES/notify ran, and `wake.sh: ALERT fired — opencode session exited
  0 without reporting to the operator`. Its newest retained snapshot
  `maistral-20261003T233805Z` is INTACT (790 entries / 3.4M, `tar -tzf` fully
  readable — no truncation, **data not lost**; the drift is purely "no new
  snapshot since the 23:38Z wake"). Grep-confirmed: this **refusal wording is a
  first appearance across all 75 of its logs** — so this is a **NEW failure
  mode (model role-refusal / persona-rejection)**, and I am explicitly **not**
  calling it a recurrence of the CHINOOK "skipped the backup" case (that was a
  step-ordering miss where the model still acted; this time the model declined
  to act as the agent at all). Note: it does mean the wake harness's "exited 0
  but no report" ALERT is the *only* thing that caught this — the model
  returning a polite refusal on exit 0 is the dangerous case, and it is the
  reason the ALERT fired rather than a silent pass.
- **Response (mine, in-lane):** `send_to_peer.sh MAISTRAL` delivered a
  drift+root-cause note (data-only, no action requested, reminded read-only
  boundary) → `{"status":"ok"}`. Flagged the operator in ASK.md (open) + will
  notify this waking. I have no in-lane action to take inside MAISTRAL's tree
  (read-only to me; fixing it is their/operator's call). **Recommended for
  operator/MAISTRAL:** investigate the 03:36Z refusal — likely a transient
  model/persona prompt issue or a qwen3.8:27b behavior on that particular
  sampling; consider making wake.sh treat "exit 0 + ALERT + no report" as a
  retryable miss, or surfacing the model's refusal text more prominently so a
  refusal is distinguishable from a normal short session.
- **Services:** 14 `peer_server.py` procs running (mine pid 2499779 up ~3d;
  MAISTRAL's pid 2499639 still up since Oct 03 — its *service* is alive, it is
  specifically the unattended *agent session* that flaked); tailscaled active.
  Host: up 5d 15:39, 16 cores, load 0.88/0.93/0.84, RAM 58Gi/49Gi avail, swap
  8Gi/0B used, disk 60% (38G free of 98G). Healthy. ~$0 local qwen3.8:27b run.
  **Runner/model note for Tempest (runner/model portability): this is NOT a
  runner/shim fault — it is model identity/role-refusal** (qwen3.8:27b declined
  to act as its own agent persona on this one unattended wake). Worth Tempest
  confirming whether this is model-version/regression behavior or a known
  qwen3 refusal class, since other qwen3.8 agents share the same runner. The
  ollama_shim context-budget clip on long Read outputs persists (cosmetic).
- Committed work to git this waking (see git log).

## 2026-10-04 03:14Z — Fifty-seventh waking (backup+drill PASS; all 13 siblings + gale-root fresh under the 6h bar — no drift; 16 pings archived; no operator msgs)

- Backup RUN `tramontane-20261004T031347Z.tar.gz` (1.7M, 583 entries, clean
  extract), 57th snapshot; rotation holds at 14 (oldest retained
  `tramontane-20261002T071240Z`). **Restore drill PASS:** scratch extract to
  /tmp/opencode/restore-tramontane.w57; `cmp` 13/13 key paths — AGENT.md/
  ASK.md/NOTES.md/backup.sh/wake.sh/notify.sh/check_replies.sh/
  spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/
  runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical
  to live; `keys/` default-deny verified (snapshot holds only
  `peers.env.example` + `telegram.env.example`, no live secrets); scratch
  cleaned.
- Inbox: **16 pings (00:00–00:46Z) all data-only Rule-7 sweeps/link/census/
  liveness, no-reply-need** (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope,
  DELTA×3 link, MEADOW×2 census, HIGHBEAM×1 w292 probe, MESA×1 link, CANYON×1
  pass #120, RIVER×1 W230 layer-2, HARBOR×3 link) — moved to processed
  (818→834); no reply sent. check_replies.sh: no operator msgs; ASK.md no
  open questions.
- **Drift sweep 14/14 fresh, none >6h (bar 6h):** VORTEX 20m / BORA 46m /
  SIROCCO 72m / PONIENTE 95m / CYCLONE 117m / TEMPEST 131m / OSTRO 143m /
  SQUALL 150m / LEVANTE 165m / ZEPHYR 172m / GALE(agent-root) 192m (5h
  cadence — normal) / CHINOOK 190m / MAISTRAL 215m (3.6h slowest, own wake
  slot); all 13 sibling dirs + gale-root holding 14 snaps; **no drift, no
  silent failures**. CHINOOK steady at ~190m (4h cron) — the w53 08:00Z miss
  still not recurring (4 consecutive wakings clean since the w54 resolution).
- **Services:** all 14 co-resident `peer_server.py` procs running (mine
  among them; bora/chinook/cyclone/agent/levante/maistral/ostro/poniente/
  sirocco/squall/tempest/tramontane/vortex/zephyr); tailscaled active. Host:
  up 5d 11:39, 16 cores, load 1.83/1.49/1.24 (trivial on 16 cores), RAM
  58Gi/49Gi avail, swap 8Gi/0B used, disk 60% (38G free of 98G). Healthy.
  ~$0 local qwen3.8:27b run. Runner note for Tempest: no runner faults this
  waking; the ollama_shim context-budget clip on long Read/NOTES outputs
  persists (cosmetic, noted w55–w57).

## 2026-10-03 23:12Z — Fifty-sixth waking (backup+drill PASS; all 13 siblings + gale-root fresh under the 6h bar — no drift; inbox empty; no operator msgs)

- Backup RUN `tramontane-20261003T231245Z.tar.gz` (1.6M, 561 entries / 352
  files, clean extract), 56th snapshot; rotation holds at 14 (oldest retained
  `tramontane-20261001T191249Z`). **Restore drill PASS:** scratch extract to
  /tmp/opencode/restore-tramontane.w56 (28 top-level entries); `cmp` 13/13
  key paths — AGENT.md/ASK.md/NOTES.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md — all byte-identical to live; `keys/`
  default-deny verified (snapshot holds only `peers.env.example` +
  `telegram.env.example`, no live secrets); scratch cleaned.
- Inbox: **empty** (no new pings since the w55 18:00–18:46Z batch; only
  `cyclone/`+`tramontane/` scaffold dirs + processed/ at 818); no reply sent.
  check_replies.sh: no operator msgs; ASK.md no open questions.
- **Drift sweep 14/14 fresh, none >6h (bar 6h):** VORTEX 19m / BORA 48m /
  SIROCCO 71m / PONIENTE 95m / CYCLONE 119m / OSTRO 138m / LEVANTE 168m /
  CHINOOK 191m / MAISTRAL 208m (3.5h slowest, own wake slot) / TEMPEST 252m /
  SQUALL 271m / ZEPHYR 292m (4.9h oldest, under bar) / GALE(agent-root) 313m
  (5h cadence — normal); all 13 sibling dirs + gale-root holding 14 snaps;
  **no drift, no silent failures**. CHINOOK steady at ~191m (4h cron) — the
  w53 08:00Z miss remains a one-off, no recurrence.
- **Services:** all 15 peer_server.py procs running (mine pid 2499779 since
  Oct01 06:22Z, listening 100.66.39.59:8791; 127.0.0.1:8791 still Gale's
  firewalla_control.py pid 783234 — unchanged, no conflict); tailscaled
  active. Host: up 5d 7:39, 16 cores, load 0.73/0.65/0.64, RAM 58Gi/50Gi
  avail, swap 8Gi/0B used, disk 59% (39G free of 98G). Healthy. ~$0 local
  qwen3.8:27b run. Runner note for Tempest: no runner faults; ollama_shim
  context-budget clipping of long Read outputs persists (w55/w56) — cosmetic,
  worth flagging in the portability tracker.

## 2026-10-03 19:12Z — Fifty-fifth waking (backup+drill PASS; all 13 siblings + gale-root fresh under the 6h bar — no drift; 16 pings archived; no operator msgs)

- Backup RUN `tramontane-20261003T191243Z.tar.gz` (1.6M, 572 extractable
  entries / 363 files, clean extract), 55th snapshot; rotation holds at 14
  (oldest retained `tramontane-20261001T111243Z`). **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.w55; `cmp` 13/13 key
  paths — AGENT.md/ASK.md/NOTES.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md — all byte-identical to live; `keys/`
  default-deny verified (snapshot holds only `peers.env.example` +
  `telegram.env.example`, no live secrets); scratch cleaned.
- Inbox: **16 pings (18:00–18:46Z) all data-only Rule-7 sweeps/link/census/
  liveness, no-reply-need** (MOUNTAIN×4 — 1 auto-latency + 1 mesa-envelope +
  2 credentialed-reach, MEADOW×2 census, DELTA×3 link, HIGHBEAM×1 w291 probe,
  MESA×1 link, CANYON×1 pass #119, RIVER×1 W229 layer-2, HARBOR×3 link) — moved
  to processed (802→818); no reply sent. check_replies.sh: no operator msgs;
  ASK.md no open questions.
- **Drift sweep 14/14 fresh, none >6h (bar 6h):** TEMPEST 11m / VORTEX 20m /
  SQUALL 30m / BORA 48m / ZEPHYR 52m / SIROCCO 70m / GALE(agent-root) 72m
  (5h cadence — normal) / PONIENTE 94m / CYCLONE 118m / OSTRO 142m (15 snaps,
  one over the 14 floor — same as prior wakings, non-issue) / LEVANTE 167m /
  CHINOOK 190m / MAISTRAL 206m (3.4h slowest, own wake slot); all 13 sibling
  dirs + gale-root holding 14+ snaps; **no drift, no silent failures**.
  CHINOOK steady at its 190m (4h cron) since the w53 flag cleared at w54 —
  the 08:00Z "woke and skipped the backup" remains a one-off, not recurring.
- **Services:** all 15 peer_server.py procs running (mine pid 2499779 since
  Oct01 06:22Z, listening 100.66.39.59:8791; 127.0.0.1:8791 still Gale's
  firewalla_control.py pid 783234 — unchanged, no conflict). Host: up 5d3h39m,
  16 cores, load 1.11/1.15/0.94, RAM 58Gi/49Gi avail, disk 59% (39G free of
  98G). Healthy. ~$0 local qwen3.8:27b run. Runner note for Tempest: no
  faults this waking; the ollama_shim still clips long NOTES/ledger Read
  outputs (`[trimmed by ollama_shim: context budget]`) — cosmetic only.

## 2026-10-03 15:12Z — Fifty-fourth waking (backup+drill PASS; **CHINOOK drift FLAG now cleared**: recovered to 190m/3.2h after its own 12:00Z wake backed up — one-off at 08:00Z, not a pattern; all 13 siblings + gale-root fresh under the 6h bar; 22 pings archived; no operator msgs)

- Backup RUN `tramontane-20261003T151242Z.tar.gz` (1.5M, 548 extractable
  entries / 341 files, clean extract), 54th snapshot; rotation holds at 14
  (oldest retained `tramontane-20261001T071238Z`). **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.w54; `cmp` 13/13 key
  paths — AGENT.md/ASK.md/NOTES.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md — all byte-identical to live; `keys/`
  default-deny verified (snapshot holds only `peers.env.example` +
  `telegram.env.example`, no live secrets); scratch cleaned.
- Inbox: **22 pings (12:00–14:51Z) all data-only Rule-7 sweeps/link/census/
  liveness, no-reply-need** (MOUNTAIN×9 incl. 4 auto-latency + 1 mesa-
  envelope, MEADOW×4 census, DELTA×1 link, HIGHBEAM×1 w290 probe, MESA×2,
  RIVER×1 W228 layer-2, CANYON×1 pass #118, HARBOR×3 link) — moved to
  processed (780→802); no reply sent. check_replies.sh: no operator msgs;
  ASK.md CHINOOK flag resolved below.
- **Drift sweep — CHINOOK RECOVERED, no >6h breach:** CHINOOK was 428m
  (7.1h) over the bar at w53 11:12Z; now 190m (3.17h), UNDER the bar — its
  own 12:00Z wake fired and backed up (newest `chinook-20261003T120154Z`,
  557 entries / 2.0M, `tar -tzf` fully readable, 14 snaps intact). The w53
  flag was a one-off "woke and skipped the backup" at its 08:00Z slot, not
  a recurring pattern; no operator action needed. Moving the ASK.md flag to
  Resolved. All other 12 siblings + gale-root fresh under bar: GALE 17m /
  VORTEX 21m / BORA 47m / SIROCCO 70m / PONIENTE 94m / CYCLONE 119m /
  TEMPEST 131m / OSTRO 143m / SQUALL 151m / LEVANTE 167m / ZEPHYR 172m /
  CHINOOK 190m / MAISTRAL 210m (3.5h slowest, own wake slot); all 13 dirs
  holding 14 snaps (182 sibling + 14 mine = 196 fleet).
- **Services:** all 15 `peer_server.py` procs running (mine pid 2499779
  since 2026-10-01 06:22Z, listening 100.66.39.59:8791; 127.0.0.1:8791
  still Gale's firewalla_control.py pid 783234 — unchanged, no conflict).
- Host: up 4d23h39m (post-09-28 reboot), 16 cores, load 0.73/3.48/3.01,
  RAM 58Gi total / 50Gi available, swap 8Gi/0B used, disk 58% (40G free of
  98G). Healthy. ~$0 local qwen3.8:27b run (spend_check $0, no errors).
  Runner note for Tempest: no runner/model portability faults this waking;
  the ollama_shim context-budget clip on long Reads persists (cosmetic).

## 2026-10-03 11:12Z — Fifty-third waking (backup+drill PASS; **CHINOOK drift flagged**: 7.1h old / over 6h bar — its 08:00Z wake ended before backup; peer note + operator flag sent; other 12 siblings + gale-root all fresh)

- Backup RUN `tramontane-20261003T111242Z.tar.gz` (1.5M, 540 extractable
  entries, clean extract), 53rd snapshot; rotation holds at 14 (oldest
  retained `tramontane-20261001T071238Z`). **Restore drill PASS:** scratch
  extract to /tmp/opencode/restore-tramontane.w53; `cmp` 13/13 key paths —
  AGENT.md/ASK.md/NOTES.md/backup.sh/wake.sh/notify.sh/check_replies.sh/
  spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/
  runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical
  to live; `keys/` default-deny verified (snapshot holds only
  `peers.env.example`+`telegram.env.example`, no live secrets); scratch
  cleaned.
- Inbox `peer/inbox/`: **empty** (no new pings since the w52 07:13Z batch;
  only `cyclone/`+`tramontane/` scaffold dirs + processed/ at 780). No reply
  sent.
- `check_replies.sh`: **no operator msgs**. ASK.md: **no open questions** (see
  below for the new drift flag I added).
- **Drift sweep (my lane) — NEW FINDING this waking: CHINOOK at 428m (~7.1h)
  is OVER the 6h freshness bar**, the first sibling breach in a while.
  All other 12 co-residents + gale-root are fresh and under the bar:
  VORTEX 22m / BORA 47m / SIROCCO 71m / PONIENTE 94m / CYCLONE 114m / OSTRO
  143m / LEVANTE 167m / MAISTRAL 211m / TEMPEST 251m / SQUALL 270m / ZEPHYR
  290m / GALE(agent-root) 312m (5h cadence, normal).
- **CHINOOK root cause (read-only diagnostics, no action on their tree per
  rule 7):** their cron is `0 0,4,8,12,16,20` (4h cadence) and they DID fire
  at 08:00Z — log `logs/20261003T080001Z` is present — but the session
  **ended before the backup step**: the 08:00 log's plan lists `./backup.sh`
  as step 6 yet never ran it, and wake.sh logged `ALERT fired -- opencode
  session exited 0 without reporting`. Their `NOTES.md` last entry is still
  `waking #58` (04:06Z), so the 08:00 slot produced no notes and no snapshot.
  Newest snapshot remains `chinook-20261003T040409Z.tar.gz` — 525e, 2.0M,
  `tar -tzf` fully readable (data intact, NOT truncated), dir holds 14 snaps
  with the 00h+04h slots present. So this is the "a backup that ran but the
  agent woke and skipped it" case, not corruption.
- **My response (in-lane, rules 4/7):** sent a factual drift note to CHINOOK
  via `send_to_peer.sh` (delivered `{"status":"ok"}`) — data-only, explicitly
  no action requested, for their own drift tracking; and raised a flag for
  the operator (this entry + `notify.sh`). Did not enter or modify Chinook's
  tree. Will re-sweep at the next waking; if it stays >6h with the pattern
  recurring, that's a wake.sh/reporting reliability finding worth a stronger
  escalation to the operator (their wake.sh already self-fires an ALERT on it).
- **Runner/model note (for Tempest):** local `ollama/qwen3.8:27b`, ~$0 run, no
  runner faults; the context-budget shim clipped a long Read output
  (`[trimmed by ollama_shim: context budget]`) — cosmetic only.
- **Services:** all 15 `peer_server.py` procs running; mine pid 2499779 (since
  2026-10-01 06:22Z) listening 100.66.39.59:8791; 127.0.0.1:8791 still Gale's
  `firewalla_control.py` pid 783234 (unchanged, no conflict with my Tailscale
  bind).
- **Host:** up 4d19h39m (post-09-28 reboot), 16 cores, load 0.83/0.72/0.67,
  RAM 58Gi total / 50Gi available, swap 8Gi/0B used, disk 56% (42G free of
  98G). Healthy.
- Committed to git; `notify.sh` sent with this summary.

## 2026-10-03 07:13Z — Fifty-second activated waking (backup+drill PASS; fleet 13/13 fresh, oldest 3.6h under bar; 23 data-only pings archived; no operator msgs; no open questions)

- Backup RUN `tramontane-20261003T071312Z.tar.gz` (1.5M, 563 entries /
  358 extractable files), 52nd snapshot overall; `tar -tzf` read-back OK;
  rotation holds at 14 (oldest retained `tramontane-20260930T231413Z`).
  **Restore drill PASS:** scratch extract to
  /tmp/opencode/restore-tramontane.W5FshO (358 files); `cmp` 13/13 key paths —
  AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/check_replies.sh/
  spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/
  runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical
  to live; `diff -r` vs live tree (excludes logs/, backups/, processed/,
  node_modules/, peer/, keys/, .git) → 0 content diffs; `keys/` default-deny
  verified (snapshot keys/ holds only `peers.env.example` + `telegram.env.example`
  — no live secrets); scratch cleaned.
- Inbox: **23 pings (06:00–06:47Z) all data-only Rule-7 sweeps/link/census/liveness,
  no-reply-need** (MOUNTAIN×4 incl. 1 latency + 1 mesa-envelope, MEADOW×4 census,
  RIVER×3 W227 layer-2, DELTA×2 link, HIGHBEAM×2 w289 probe, MESA×1 link, CANYON×1
  pass #117, VISTA×1 link, HARBOR×5 link) — moved to processed (757→780);
  no reply sent. `check_replies.sh`: no operator msgs. `ASK.md`: no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** TEMPEST 13m / VORTEX 23m /
  SQUALL 32m / BORA 48m / ZEPHYR 52m / GALE(agent-root `/home/agent/agent`) 73m
  (5h cadence — normal) / SIROCCO 73m / PONIENTE 95m / CYCLONE 119m /
  OSTRO 144m / LEVANTE 168m / CHINOOK 190m / MAISTRAL 217m (3.6h slowest, own
  wake slot). All 13 dirs holding 14 snaps. Spot-check `tar -tzf` integrity on
  the two newest (MAISTRAL 3.1MB/769e, CHINOOK 2.0MB/525e) — both fully
  readable, no truncation. No silent-failure evidence.
- **Services:** all 15 `peer_server.py` procs running (mine pid 2499779
  since 2026-10-01 06:22Z, listening 100.66.39.59:8791; 127.0.0.1:8791
  still Gale's `/home/agent/agent/website/firewalla_control.py` pid 783234 —
  unchanged since w50, no conflict with my Tailscale-IP bind).
- Host: up 4d15h39m (post-09-28 reboot, uptime climbing), 16 cores, load
  0.60/0.72/0.72, RAM 58Gi total / 50Gi available, swap 8Gi/0B used, disk 56%
  (42G free of 98G). Healthy. ~$0 local qwen3.8:27b run.

## 2026-10-03 03:13Z — Fifty-first activated waking (backup+drill PASS; fleet 13/13 fresh, oldest 3.4h under bar; 18 data-only pings archived; no operator msgs; no open questions)

- Backup RUN `tramontane-20261003T031241Z.tar.gz` (1.4M, 550 entries /
  348 extractable files), 51st snapshot overall; `tar -tzf` read-back OK;
  rotation holds at 14 (oldest retained `tramontane-20260930T231413Z`).
  **Restore drill PASS:** scratch extract to
  /tmp/opencode/restore-tramontane.8A5KCe (348 files); `cmp` 13/13 key paths —
  AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/check_replies.sh/
  spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/
  runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical
  to live; `diff -r` vs live tree (excludes logs/, backups/, processed/,
  node_modules/, peer/) → only expected `keys/` live-file exclusions
  (peers.env, 4 × peers.env.bak-*, telegram.env — correctly absent from the
  snapshot); `keys/` default-deny verified (snapshot keys/ holds only
  `peers.env.example` + `telegram.env.example` — no live secrets); scratch cleaned.
- Inbox: **18 pings (00:00–00:48Z) all data-only Rule-7 sweeps/link/census/liveness,
  no-reply-need** (MOUNTAIN×4 incl. 1 latency + 1 mesas-envelope, MEADOW×3 census,
  DELTA×1 link, HIGHBEAM×1 w288 probe, MESA×1 link, CANYON×1 pass #116, RIVER×2
  W226 layer-2, VISTA×1 link, HARBOR×4 link) — moved to processed (739→757);
  no reply sent. `check_replies.sh`: no operator msgs. `ASK.md`: no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** VORTEX 13m / BORA 47m /
  SIROCCO 69m / PONIENTE 95m / CYCLONE 117m / TEMPEST 131m / OSTRO 143m /
  SQUALL 149m / LEVANTE 167m / ZEPHYR 172m / GALE(agent-root `/home/agent/agent`)
  192m (5h cadence — normal) / CHINOOK 190m / MAISTRAL 205m (3.4h slowest,
  own wake slot). All 13 dirs holding 14 snaps (182 sibling snapshots + my 14 =
  196 fleet). Spot-check `tar -tzf` integrity on the two oldest (MAISTRAL
  3.0MB/744e, CHINOOK 1.96MB/521e) — both fully readable, no truncation.
  No silent-failure evidence.
- **Services:** all 15 `peer_server.py` procs running (mine pid 2499779
  since 2026-10-01 06:22Z, listening 100.66.39.59:8791; 127.0.0.1:8791
  still Gale's `/home/agent/agent/website/firewalla_control.py` pid 783234 —
  unchanged since w50, no conflict with my Tailscale-IP bind).
- Host: up 4d11h39m (post-09-28 reboot, uptime climbing), 16 cores, load
  0.49/0.65/0.67, RAM 58Gi total / 50Gi available, swap 8Gi/0B used, disk 55%
  (43G free of 98G). Healthy. ~$0 local qwen3.8:27b run.

## 2026-10-02 23:12Z — Fiftieth activated waking (backup+drill PASS; fleet 13/13 fresh, oldest 4.8h under bar; inbox empty; no operator msgs; no open questions)

- Backup RUN `tramontane-20261002T231249Z.tar.gz` (1.4M, 325 extractable files),
  50th snapshot overall; `tar -tzf` read-back OK; rotation holds at 14 (oldest
  retained `tramontane-20260930T191359Z`).
  **Restore drill PASS:** scratch extract to /tmp/opencode/restore-tramontane.MsdUdX
  (325 files); `cmp` 13/13 key paths — AGENT.md/NOTES.md/ASK.md/backup.sh/
  check_replies.sh/notify.sh/wake.sh/spend_check.py/peer_server.py/
  tramontane.cron/ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md — all byte-identical to live; `keys/` default-deny
  verified (snapshot keys/ holds only `peers.env.example` + `telegram.env.example`
  — no live secrets). Scratch cleaned.
- Inbox: **empty** (no new pings since the w49 18:00–19:01Z batch) —
  `peer/inbox/` holds only the standing `cyclone/` + `tramontane/` leftover
  scaffold dirs + `processed/` (739 unchanged). `check_replies.sh`: no
  operator msgs. `ASK.md`: no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** VORTEX 22m / BORA 48m /
  SIROCCO 72m / PONIENTE 95m / CYCLONE 120m / OSTRO 140m / LEVANTE 166m /
  CHINOOK 189m / MAISTRAL 209m (3.5h, slowest, own wake slot) / TEMPEST 249m /
  SQUALL 271m / ZEPHYR 290m (4.8h oldest, under bar) / GALE(agent-root
  `/home/agent/agent`) 312m (5h cadence — normal). All 13 dirs holding 14 snaps
  (182 sibling snapshots + my 14 = 196 fleet). Spot-check `tar -tzf` integrity
  on the two oldest (ZEPHYR 1.45MB/582 entries, SQUALL 9.15MB/621 entries) —
  both fully readable, no truncation. No silent-failure evidence.
- **Services:** all 14 co-resident `peer_server.py` procs running (bora/
  chinook/cyclone/gale/levante/maistral/ostro/poniente/sirocco/squall/
  tempest/tramontane/vortex/zephyr; mine pid 2499779 since 2026-10-01 06:22Z,
  listening 100.66.39.59:8791). NEW OBSERVATION, no action needed: a second
  listener now sits on 127.0.0.1:8791 — pid 783234, `/home/agent/agent/website/
  firewalla_control.py` (Gale's own workspace, started this evening 18:34Z);
  it does not conflict with my Tailscale-IP bind, but if any sibling pings
  127.0.0.1:8791 expecting a peer server that's who they'll reach — flagging
  for operator awareness only. `tailscaled` active (system), `netbox` active;
  `snap.wekan.wekan` still NOT INSTALLED (unchanged since w47 finding);
  `systemctl --user` bus unreachable in this session (same user-bus view quirk
  noted w48 — process/socket checks used instead). `/home/agent/network-monitor/`
  + `~/shots/` + `~/crontab.backup-2026-09-26` first sighted as well — host-side
  (likely Gale's), outside my scope, noted.
- Host: up 4d7h39m (post-09-28 reboot, uptime climbing), 16 cores, load
  0.58/0.63/0.67, RAM 58Gi total / 51Gi available, swap 8Gi/0B used, disk 67%
  (32G free of 98G). Healthy. ~$0 local qwen3.8:27b run.

## 2026-10-02 19:14Z — Forty-ninth activated waking (backup+drill PASS; fleet 13/13 fresh, oldest 3.6h under bar; 18 data-only pings archived; no operator msgs; no open questions)

- Backup RUN `tramontane-20261002T191259Z.tar.gz` (1.3M, 517 entries), 49th
  snapshot overall; `tar -tzf` read-back OK; rotation holds at 14.
  **Restore drill PASS:** scratch extract to /tmp/opencode/restore-tramontane.*,
  `diff -r` vs live tree (excludes logs/, backups/, keys/, node_modules/, peer/):
  the ONLY difference is `.git/index` binary (live index touched since snapshot —
  expected, not a content drift). Spot-check `cmp`: AGENT.md + ASK.md +
  runbooks/restore-this-agent.md all byte-identical to live. `keys/` default-deny
  verified (snapshot keys/ holds only `peers.env.example` + `telegram.env.example`;
  live `peers.env`/`telegram.env` excluded). Scratch cleaned.
- Inbox: **18 pings (18:00–19:01Z) all data-only Rule-7 sweeps/link/liveness, no-reply-need**
  (HARBOR×3 link, VISTA×1 link, RIVER×1 W225 layer-2, CANYON×1 liveness pass #115,
  MESA×1 link, MOUNTAIN×4 incl. 1 mesa-envelope + 1 latency, HIGHBEAM×1 w287 probe,
  DELTA×2 link, MEADOW×3 census) — moved to processed (721→739); no reply sent.
  `check_replies.sh`: no operator msgs. `ASK.md`: no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** TEMPEST 10m / VORTEX 21m /
  SQUALL 31m / BORA 48m / ZEPHYR 51m / SIROCCO 70m / PONIENTE 96m /
  GALE(agent-root `/home/agent/agent`) 60m (1h, 5h cadence — normal) /
  OSTRO 144m (2.4h) / LEVANTE 168m (2.8h) / CHINOOK 190m (3.2h) /
  CYCLONE 120m / MAISTRAL 215m (3.57h slowest, own wake slot).
  Sibling AGENT.md mtimes: 4 fresh (CYCLONE/MAISTRAL/SIROCCO/VORTEX ~1617m = ~27h),
  rest quiet (bora 5.7k m … chinook 14k m) — quiet-period pattern, no silent-failure
  evidence (every tarball present & non-empty, all sizes >600K).
  NOTE: `/home/agent/gale-review/` first sighted this waking — Gale's own monitoring
  workspace (IMPLEMENTATION.md: 2026-10-02 ops dashboard deploy + daily isolated
  backup-proof timer that validated 14 local agent archives). Not a sibling agent;
  no `backups/` dir (has one ad-hoc `before-*.tar.gz`) — excluded from drift counts,
  flagging for operator awareness in case it's expected to be backed up.
- Host: up 4d3h39m (post-09-28 reboot, uptime climbing), 16 cores, load 0.88,
  RAM 58Gi total / 51Gi available, swap 8Gi/0B used, disk 62% (36G free of 98G).
  Healthy. ~$0 local qwen3.8:27b run.

## 2026-10-02 15:14Z — Forty-eighth activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h, oldest 3.62h under bar; 19 data-only pings archived; no operator msgs; no open questions)

- Backup RUN `tramontane-20261002T151425Z.tar.gz` (1.3M, 334 extractable files),
  48th snapshot overall; rotation holds at 14 (oldest retained
  `tramontane-20260930T031300Z`).
  **Restore drill PASS:** scratch extract to a fresh /tmp/opencode/restore.* dir,
  `cmp` 12/12 key paths — AGENT.md/ASK.md/NOTES.md/backup.sh/check_replies.sh/
  notify.sh/runbooks/restore-this-agent.md/runbooks/host-recovery.md/
  peer_server.py/tramontane.cron/spend_check.py/wake.sh — all byte-identical to live;
  `ledger/backup-ledger.md` identical (w48 row appended after the 15:14:25Z snapshot — expected);
  `keys/` default-deny verified (snapshot holds only `peers.env.example` + `telegram.env.example`);
  scratch cleaned.
- Inbox: **19 pings (12:00–12:49Z) all data-only Rule-7 sweeps/link/liveness, no-reply-need**
  (HARBOR×3 link, MOUNTAIN×5 incl. 1 latency + 1 mesa-envelope, MEADOW×4 census,
  VISTA×1 link, MESA×1 link, DELTA×1 link, CANYON×1 pass #114, RIVER×1 W224 layer-2,
  HIGHBEAM×1 w286 probe, BEACON×1 health_check) — moved to processed (702→721); no reply sent.
  `check_replies.sh`: no operator msgs. `ASK.md`: no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** VORTEX 23m / BORA 49m / SIROCCO 71m /
  PONIENTE 97m / TEMPEST 133m / CYCLONE 120m / OSTRO 145m / SQUALL 151m / LEVANTE 169m /
  ZEPHYR 173m / GALE(agent-root) 193m (5h cadence — normal) / CHINOOK 193m / MAISTRAL 217m
  (3.62h slowest, own wake slot); all 13 sibling dirs holding 14 snaps (182 sibling snapshots
  + my 14 = 196 fleet). No silent-failure evidence — every tarball present & countable.
- **Services:** peer server `pid 2499779` running since Oct01 06:22Z, listening
  127.0.0.1:8791 + 100.66.39.59:8791 (healthy — note: `systemctl --user` reports the unit
  "could not be found" in this session's user bus, but the process + sockets confirm it up;
  not acting on the bus-view discrepancy). `netbox` active (running) since 2026-10-01 06:22Z.
  `tailscaled` active (running) system unit since 2026-09-28 (the w47 "inactive" was a
  user-bus view only — system service confirmed now up, 3 days). `snap.wekan.wekan` still
  NOT INSTALLED (`snap list` has no wekan) — unchanged since w47. Peer fleet: all 12 co-resident
  sibling `peer_server.py` processes running (bora/zephyr/etc.).
- Host: up **~3d23h40m**, 16 cores, load 4.08/5.82/4.90 (elevated vs prior ~0.05 but trivial
  on 16 cores), RAM 58Gi total / 50Gi available, swap 8.0Gi total 0B used, disk 58%
  (40G free of 98G). Healthy; no action.
- Spent: local qwen3.8:27b run, $0.
- Ledger w48 row appended + git commit this waking.

## 2026-10-02 11:13Z — Forty-seventh activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h, oldest 4.87h under bar; inbox empty; two host changes flagged)

- Backup RUN `tramontane-20261002T111302Z.tar.gz` (1.2M, 309 extractable files),
  47th snapshot overall; rotation holds at 14 (oldest
  `tramontane-20260930T031300Z` rotated out). **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore.3fo9qp, `cmp` 12/13 key paths —
  AGENT.md/ASK.md/NOTES.md/backup.sh/check_replies.sh/notify.sh/
  runbooks/restore-this-agent.md/runbooks/host-recovery.md/peer_server.py/
  tramontane.cron/spend_check.py/wake.sh — all byte-identical to live;
  `ledger/backup-ledger.md` diffs only because my own w47 row was appended
  after the 11:13:02Z snapshot (expected). `keys/` default-deny verified
  (snapshot holds only `peers.env.example` + `telegram.env.example`);
  scratch cleaned.
- Inbox: **empty** (no new pings since the w46 batch;
  `peer/inbox/tramontane/` + `cyclone/` leftover empty scaffold dirs;
  `processed/` count 702 unchanged). `check_replies.sh`: no operator msgs.
  `ASK.md`: no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):**
  VORTEX 24m / BORA 48m / SIROCCO 71m / PONIENTE 95m / CYCLONE 120m /
  OSTRO 143m / LEVANTE 167m / CHINOOK 192m / MAISTRAL 210m (3.5h slowest,
  own wake slot) / TEMPEST 252m / SQUALL 271m / ZEPHYR 292m (4.87h oldest,
  under bar) / GALE(agent-root) 313m (5h cadence — normal); all 13 dirs
  holding 14 snaps (186 sibling snapshots + my 14 = 200 fleet).
- **Services:** `tramontane-peer` active NRestarts=0 (ExecMain
  2026-10-01 06:22Z), listening 127.0.0.1:8791 + 100.66.39.59:8791;
  `netbox` active NRestarts=0.
  **TWO NEW OBSERVATIONS (host-side, out of my scope, flagging):**
  1) `tailscaled` now `inactive` (systemd user unit; was
     `active` at w46 07:14Z; NRestarts=0; no crash evidence — looks like a
     manual stop or host reboot, but host uptime shows 3d19h39m with no
     reboot in between, so more likely deliberate stop by operator).
  2) `snap.wekan.wekan` **no longer installed** — `systemctl show`
     `Unit snap.wekan.wekan.service could not be found`, `snap list` has no
     wekan, `systemctl is-enabled` says `not-found`, `journalctl`
     `— No entries —` (previously "was simply `inactive`" as of w13
     (09-26 11:25Z) and the "held up since 09-25 15:27Z recovery" notes).
     Looks like wekan **was removed from this host** between w46 (07:14Z)
     and w47 (11:13Z). Not a crash I can act on — no logs, unit gone, not
     my peer unit — noting only; not touching it.
- Host: up **3d19h39m**, 16 cores, load 0.05/0.12/0.17, RAM 58Gi total /
  51Gi available, swap 0B used, disk 59% (39G free of 98G). Healthy.
- Spent: local qwen3.8:27b run, $0.
- Ledger w47 row appended + git commit this waking.

## 2026-10-02 07:14Z — Forty-sixth activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h, oldest 3.57h under bar; no operator msgs; no open questions; 13 data-only pings archived, 1 new sender LINK verified)

- Backup RUN `tramontane-20261002T071240Z.tar.gz` (1181K, 509 entries),
  46th snapshot overall; rotation holds at 14. **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.i930N0, 317 files;
  `cmp` 13/13 key paths — AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical to live; `keys/` default-deny verified (snapshot keys/ holds only `peers.env.example` + `telegram.env.example` — no live secrets); scratch cleaned.
- Inbox: **13 pings (06:00–06:47Z) all data-only Rule-7 sweeps/link/liveness, no-reply-need** (MOUNTAIN×5 incl. 1 latency check + 1 mesa-envelope, BEACON×1 health_check, **RIDGE×1 link (new sender this run — RIDGE not in prior wake rosters; link verified one-way, no reply sent, no operator request)**, HIGHBEAM×1 w285 probe, RIVER×1 W223 layer-2, CANYON×1 pass #113, VISTA×1 link, HARBOR×2 link) — moved to processed (689→702); no reply sent.
- `check_replies.sh`: no operator msgs; `ASK.md` no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** TEMPEST 11m / VORTEX 20m / SQUALL 31m / BORA 47m / ZEPHYR 52m / SIROCCO 70m / GALE(agent-root) 72m (5h cadence — normal) / PONIENTE 95m / CYCLONE 118m / OSTRO 143m (15 snaps, one over the 14 floor) / LEVANTE 164m / CHINOOK 191m / MAISTRAL 214m (3.57h slowest, on its own wake slot); all 13 dirs holding 14+ snaps (183 sibling snapshots + my 14 = 197 fleet). No silent-failure evidence — every tarball `tar -tzf`-countable.
- **Services:** `tramontane-peer` active NRestarts=0 (ExecMainStart 2026-10-01 06:22Z), listening 127.0.0.1:8791 + 100.66.39.59:8791; `netbox` active; `tailscaled` active; `snap.wekan.wekan`+`snap.wekan.ferretdb` both `inactive` NRestarts=0 (stable "off" since 09-28 reboot — out of my scope, noting only).
- Host: up **3d15h39m** (post-09-28 reboot), 16 cores, load 0.13/0.17/0.17, RAM 58Gi total / 51Gi available, swap 0B used, disk 59% (39G free of 98G). Healthy.
- Spent: local qwen3.8:27b run, $0 (no runner faults this slot).
- Ledger w46 row appended + git commit this waking.

## 2026-10-02 03:14Z — Forty-fifth activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h, oldest 3.6h under bar; no operator msgs; no open questions; 25 data-only pings archived)

- Backup RUN `tramontane-20261002T031302Z.tar.gz` (1.2M, 513 entries),
  45th snapshot overall; rotation holds at 14. **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.537, 324 files;
  `cmp` 13/13 key paths — AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/ledger/backup-ledger.md/runbooks/restore-this-agent.md/runbooks/host-recovery.md — all byte-identical to live; `keys/` default-deny verified (snapshot keys/ holds only `peers.env.example` + `telegram.env.example` — no live secrets); scratch cleaned.
- Inbox: **25 pings (09-01 23:22Z → 09-02 00:49Z) all data-only Rule-7 sweeps/link/liveness, no-reply-need** (MOUNTAIN×7 incl. 2 latency checks, BEACON×1 health_check, MEADOW×3 census, DELTA×1 link, HIGHBEAM×1 w284 probe, MESA×1 link, RIVER×1 W222 layer-2, CANYON×1 pass #112, VISTA×1 link, HARBOR×6 link) — moved to processed (664→689); no reply sent.
- `check_replies.sh`: no operator msgs; `ASK.md` no open questions.
- **Drift sweep 13/13 fresh, none >6h (bar 6h):** VORTEX 20m / BORA 48m / SIROCCO 71m / PONIENTE 94m / CYCLONE 118m / TEMPEST 131m / OSTRO 143m / SQUALL 147m / LEVANTE 167m / ZEPHYR 171m / CHINOOK 192m / MAISTRAL 214m (3.57h slowest, on its own wake slot) / GALE(agent-root) 128m (5h cadence — normal); all 13 dirs holding 14 snaps (182 sibling snapshots + my 14 = 196 fleet).
- **Services:** `tramontane-peer` active NRestarts=0, listening 127.0.0.1:8791 + 100.66.39.59:8791; `netbox` active; `tailscaled` active; `snap.wekan.wekan`+`snap.wekan.ferretdb` both `inactive` NRestarts=0 (stable "off" since 09-28 reboot — out of my scope, noting only).
- Host: up **3d11h39m** (post-09-28 reboot), 16 cores, load 0.11/0.15/0.17, RAM 58Gi total / 51Gi available, swap 0B used, disk 58% (40G free of 98G). Healthy.
- Runner/model note for Tempest: qwen3.8:27b via local Ollama served this session without issue — context budget shim (`[trimmed by ollama_shim: context budget]`) clipped the long NOTES.md Read output this waking; the rest of the Read/Write/Edit path worked normally. Same cost ~$0.

## 2026-10-01 23:13Z — Forty-fourth activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h, oldest 4.85h under bar; no operator msgs; no open questions; inbox empty)

- Backup RUN `tramontane-20261001T231238Z.tar.gz` (1126K, 480 entries),
  44th snapshot overall; rotation holds at 14. **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.p4wka2, 294 files;
  `cmp` 13/13 key paths (AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md) all byte-identical to live; `diff -r` vs live
  tree (excludes backups/, logs/, inbox/, __pycache__, keys/ live files) →
  **0 content diffs**; `keys/` default-deny verified — snapshot keys/ holds
  only `peers.env.example` + `telegram.env.example`, no live secrets;
  scratch cleaned.
- Inbox: **empty** (`cyclone/`+`tramontane/` leftover scaffold dirs +
  processed/; no new pings since the w43 18:00–18:48Z batch of 24 data-only
  sweeps). Nothing to move; no reply sent.
- `check_replies.sh`: no operator msgs; ASK.md: no open questions.
- **Drift sweep 13/13 fresh, none >6h:** VORTEX 23m / BORA 47m / SIROCCO 68m /
  PONIENTE 95m / CYCLONE 119m / OSTRO 143m (15 snaps, one over the 14 floor) /
  LEVANTE 167m / CHINOOK 191m / MAISTRAL 208m (slowest on its own wake slot) /
  TEMPEST 251m / SQUALL 271m / ZEPHYR 291m (4.85h — oldest, under the 6h bar)
  / GALE(agent-root) 312m (5h cadence — normal). 183 sibling snapshots +
  my 14 = 197 fleet total.
- **Services:** `tramontane-peer` + `netbox` + `tailscaled` all `active`,
  NRestarts=0. (wekan pair remains `inactive`/stable-off as noted w41–w43 —
  out of my scope, noting only.)
- Host health: up 3d7h39m (post-09-28 reboot), 16 cores, load 0.04,
  51Gi mem avail, disk 58% (40G free of 98G), swap 0B used. Healthy.
- Spent: local qwen3.8:27b run, cost $0; `spend_check.py` already logged.
- Committed to git this waking.

## 2026-10-01 19:13Z — Forty-third activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h; no operator msgs; no open questions; inbox 24 data-only pings)

- Backup RUN `tramontane-20261001T191249Z.tar.gz` (1054K, 496 entries),
  43rd snapshot overall; rotation holds at 14. **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.7Dv9Sn, 313 files;
  `cmp` 13/13 key paths (AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md) all byte-identical to live; `keys/` default-deny
  verified — snapshot keys/ holds only `peers.env.example` +
  `telegram.env.example`, no live secrets; scratch cleaned.
- Inbox: **24 pings (18:00–18:48Z)** all data-only Rule-7/sweep/link/
  liveness, "no reply needed" (MOUNTAIN×6 incl. 1 latency + 1 mesa-envelope,
  BEACON health_check, MEADOW×4 census, DELTA×2 link, HIGHBEAM w283 probe,
  MESA link, CANYON pass #111, RIVER W221 layer-2, VISTA link, HARBOR×5 link)
  — moved to processed (640→664); no reply sent.
- `check_replies.sh`: no operator msgs; ASK.md: no open questions.
- **Drift sweep 13/13 fresh, none >6h:** TEMPEST 11m / VORTEX 22m / SQUALL 31m /
  BORA 48m / ZEPHYR 52m / SIROCCO 68m / GALE(agent-root) 73m (5h cadence —
  normal) / PONIENTE 96m / CYCLONE 119m / OSTRO 139m / LEVANTE 167m / CHINOOK
  188m / MAISTRAL 213m (slowest, on its own wake slot). All 13 holding 14
  snaps (182 sibling snapshots + my 14 = 196 fleet total).
- **Services:** all 13 co-resident peer units + `netbox` + `tailscaled`
  `active`, all NRestarts=0; `snap.wekan.wekan` + `snap.wekan.ferretdb` both
  `inactive` NRestarts=0 (stable "off" since 09-28 reboot — out of my scope,
  noting only).
- Host health: up 3d3h39m (post-09-28 reboot), 16 cores, load 0.29,
  51Gi mem avail, disk 53% (41G free of 98G), swap 0B used. Healthy.
- Committed to git this waking.

## 2026-10-01 15:14Z — Forty-second activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h; no operator msgs; no open questions; inbox 16 data-only pings)

- Backup RUN `tramontane-20261001T151259Z.tar.gz` (1016K, 481 entries),
  42nd snapshot overall; rotation holds at 14. **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.<ts>, 279 files;
  `cmp` 13/13 key paths (AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md) all byte-identical to live; `diff -r` vs live
  tree (excludes backups/, logs/, processed/, __pycache__, keys/ live
  files) → **zero content diffs**; `keys/` default-deny verified — snapshot
  keys/ holds only `peers.env.example` + `telegram.env.example`, no live
  secrets; scratch cleaned.
- Inbox: **16 pings (12:00–12:47Z)** all data-only Rule-7/sweep/link/
  liveness, "no reply needed" (BEACON health_check, MOUNTAIN×4 incl. 1
  latency + 1 mesa-envelope, MEADOW×3 census, DELTA link, HIGHBEAM w282
  probe, MESA link, CANYON pass #110, RIVER W220 layer-2, VISTA link,
  HARBOR×2 link) — moved to processed (624→640); no reply sent.
- `check_replies.sh`: no operator msgs; ASK.md: no open questions.
- **Drift sweep 13/13 fresh, none >6h:** VORTEX 23m / BORA 48m / SIROCCO 71m /
  PONIENTE 95m / CYCLONE 119m / TEMPEST 132m / OSTRO 143m / SQUALL 152m /
  LEVANTE 168m / ZEPHYR 172m / CHINOOK 191m / GALE(agent-root) 192m (5h
  cadence — normal) / MAISTRAL 215m (slowest, on its own wake slot). All 13
  holding 14 snaps (182 sibling snapshots + my 14 = 196 fleet total).
- **Services:** all 14 co-resident peer units + `netbox` + `tailscaled`
  `active`; `tramontane-peer` NRestarts=0 (clean since 07:13Z wake);
  `snap.wekan.wekan` + `snap.wekan.ferretdb` both `inactive` NRestarts=0
  (stable "off" since 09-28 reboot — out of my scope, noting only).
- Host health: up 2d23h39m (post-09-28 reboot), 16 cores, load 0.34,
  52Gi mem avail, disk 53% (44G free of 98G), swap 0B used. Healthy.
- Committed to git this waking.

## 2026-10-01 11:13Z — Forty-first activated waking (backup+drill PASS; fleet 13/13 fresh, no >6h; no operator msgs; no open questions; inbox empty)

- Backup RUN `tramontane-20261001T111243Z.tar.gz` (972K, 457 entries),
  41st snapshot overall; rotation holds at 14. **Restore drill PASS:**
  scratch extract to /tmp/opencode/restore-tramontane.2BSOTb, 279 files;
  `cmp` 13/13 key paths (AGENT.md/NOTES.md/ASK.md/backup.sh/wake.sh/notify.sh/
  check_replies.sh/spend_check.py/peer_server.py/tramontane.cron/
  ledger/backup-ledger.md/runbooks/restore-this-agent.md/
  runbooks/host-recovery.md) all byte-identical to live; `keys/` default-deny
  verified — snapshot keys/ holds only `peers.env.example` +
  `telegram.env.example`, no live secrets; scratch cleaned.
- Inbox: **empty** (`cyclone/`+`tramontane/` are leftover scaffold dirs,
  no new pings since the 07:13Z w40 batch of 20 data-only sweeps).
  processed/ at 624.
- `check_replies.sh`: no operator msgs; ASK.md: no open questions.
- **Drift sweep 13/13 fresh, none >6h:** VORTEX 23m / BORA 48m / SIROCCO 70m /
  PONIENTE 91m / CYCLONE 119m / OSTRO 143m / LEVANTE 167m / CHINOOK 191m /
  MAISTRAL 213m (slowest, on its own wake slot) / TEMPEST 252m / SQUALL 272m /
  ZEPHYR 292m / GALE(agent-root) 312m (5h cadence — normal). All 13 holding
  14 snaps (182 sibling snapshots + my 14 = 196 fleet total).
- Host health: up 2d19h39m (post-09-28 reboot), 16 cores, load 0.48,
  52Gi mem avail, disk 53% (45G free of 98G), swap 0B used. Healthy.
- Committed to git this waking.

## 2026-10-01 07:13Z — Fourtieth activated waking (backup+drill PASS; fleet 14/14 fresh, no >6h; no operator msgs; no open questions; inbox 20 data-only pings)

- Backup RUN `tramontane-20261001T071238Z.tar.gz` (936K, 451 entries),
  40th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane.NopOAZ
  (274 files); `diff -r` vs live tree → 9 lines, ALL expected exclusions
  (backups/, logs/, live keys/ files: peers.env + 4 .bak peers.env +
  telegram.env; peer/inbox/processed) — **zero content diffs**; `keys/`
  default-deny verified (snapshot keys/ holds only `peers.env.example` +
  `telegram.env.example` — no live secrets); scratch cleaned.
- Inbox: **20 pings (06:00–06:48Z)** all data-only (MOUNTAIN×4 — 2 Rule-7
  credentialed-reach + 1 latency check + 1 mesa-envelope, MEADOW×5 census,
  DELTA×2 link, HIGHBEAM w281 probe, MESA link, CANYON pass #109, RIVER W219
  rule-7 layer-2, VISTA link, HARBOR×4 link) — all "no reply needed"; moved
  to `peer/inbox/processed/`; no reply sent. `check_replies.sh`: no operator
  msgs; ASK.md no open questions.
- **Drift sweep 14/14 fresh (13 siblings + gale/agent-root), none >6h:**
  TEMPEST 12m / VORTEX 22m / SQUALL 32m / BORA 47m / ZEPHYR 52m / SIROCCO 71m /
  GALE (agent-root) 72m (5h cadence — normal) / PONIENTE 76m / CYCLONE 118m /
  OSTRO 143m / LEVANTE 167m / CHINOOK 189m / MAISTRAL 214m
  (slowest, own wake slot); all 14 directories holding 14 snaps
  (196 fleet snapshots total).
- **Services:** `tramontane-peer` active, **NRestarts=0** (was 2 at w39 —
  `ExecMainStartTimestamp=2026-10-01 06:22:07Z`, i.e. the service was
  started/restarted this morning at 06:22Z — counter reset, healthy, no
  journal of failures; note for operator awareness). All 14 co-resident peer
  units running; `netbox` active (NRestarts=0); `tailscaled` active.
  `snap.wekan.wekan` + `snap.wekan.ferretdb` both `inactive`, NRestarts=0
  (stable "off" since 09-28 15:33Z reboot — out of my scope, noting only).
- **Host:** up 2d15h39m (post-09-28 reboot), disk 52% (45G free of 98G),
  52Gi mem avail, load 0.02/16 cores, swap 0B used. Healthy.
- Committed: inbox archival + ledger w40 row + this NOTES entry.

## 2026-10-01 03:14Z — Thirty-ninth activated waking (backup+drill PASS; fleet 14/14 fresh, no >6h; no operator msgs; no open questions; inbox 17 data-only pings)

- Backup RUN `tramontane-20261001T031258Z.tar.gz` (896K, 463 entries),
  39th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restored-* (463
  entries); `diff -r` vs live tree (standard excludes: logs/, backups/,
  peer/inbox/processed/, keys/ non-example files) → **0 differences**; `keys/`
  default-deny verified (snapshot keys/ holds only `peers.env.example` +
  `telegram.env.example` — no live secrets); scratch cleaned.
- Inbox: **17 pings (00:00–00:49Z)** all data-only (MOUNTAIN×4 — 1 latency
  check + 3 Rule-7 credentialed-reach sweeps + 1 "mesa routine mesh sweep"
  envelope, DELTA link, MEADOW×4 census, HIGHBEAM w280 probe, MESA link,
  CANYON pass #108, RIVER W218 rule-7 layer-2, VISTA link, HARBOR×3 link) —
  all "no reply needed"; moved to `peer/inbox/processed/` (587→604); no reply
  sent. `check_replies.sh`: no operator msgs; ASK.md no open questions.
- **Drift sweep 14/14 fresh (13 siblings + gale/agent-root), none >6h:**
  VORTEX 0.4h / BORA 0.4h / CYCLONE 1h / SIROCCO 1h / PONIENTE 1h / TEMPEST 2h /
  ZEPHYR 2h / OSTRO 2h / LEVANTE 2h / SQUALL 2h / CHINOOK 3h / MAISTRAL 3h
  (slowest, own wake slot) / GALE (agent-root) 3h (5h cadence — normal);
  all 14 directories holding 14 snaps (196 fleet snapshots total).
- **Host:** up 2d11h39m (post-09-28 reboot), disk 52% (45G free of 98G),
  52Gi mem avail, load 0.08/16 cores, swap 0B used. Healthy.

## 2026-09-30 23:14Z — Thirty-eighth activated waking (backup+drill PASS; fleet 14/14 fresh, no >6h; no operator msgs; no open questions; inbox 4 data-only pings)

- Backup RUN `tramontane-20260930T231413Z.tar.gz` (856K, 442 entries),
  38th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane.XXXXXX
  (442 entries); `diff -r` vs live tree (standard excludes: logs/, backups/, keys/,
  node_modules/, peer/) → **0 differences**; `keys/` default-deny verified
  (snapshot keys/ holds only `peers.env.example` + `telegram.env.example` — no
  live secrets); scratch cleaned.
- Inbox: **4 pings (19:16–19:18Z)** all data-only (MOUNTAIN×4 — 1 latency check +
  3 Rule-7 credentialed-reach sweeps, all "no reply needed"); moved to
  `peer/inbox/processed/`; no reply sent. `check_replies.sh`: no operator msgs;
  ASK.md no open questions.
- **Drift sweep 14/14 fresh (13 siblings + gale/agent-root), none >6h:**
  VORTEX 25m / BORA 48m / SIROCCO 67m / PONIENTE 93m / CYCLONE 121m / OSTRO 145m /
  LEVANTE 169m / CHINOOK 192m / MAISTRAL 215m (slowest, own wake slot) / GALE
  (agent-root) 239m (5h cadence — normal) / TEMPEST 254m / SQUALL 274m / ZEPHYR
  294m; all 14 directories holding 14 snaps (196 fleet snapshots total).
- **Services:** `tramontane-peer` active (NRestarts=2 unchanged — pre-reboot bind
  retries from 09-28; listening 100.66.39.59:8791 + 127.0.0.1:8791). `netbox`
  active (NRestarts=0). `tailscaled` active (NRestarts=0). `snap.wekan.wekan` +
  `snap.wekan.ferretdb` both `inactive` NRestarts=0 (stable "off" since 09-28
  15:33Z reboot — out of my scope, noting only). Host: up 2d 7h39m (post-09-28
  reboot), disk 51% (46G free of 98G), 51Gi mem avail, load 0.33/16 cores, swap
  0B used. Healthy.

## 2026-09-30 19:14Z — Thirty-seventh activated waking (MY backup/drill PASS; fleet 13/13 fresh, no >6h; no operator msgs; no open questions; inbox 40 data-only pings)

- Backup RUN `tramontane-20260930T191359Z.tar.gz` (832K, 433 entries),
  37th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane-2ziN5A
  (261 files); `cmp` of 13 key paths (AGENT.md, NOTES.md, ASK.md, backup.sh,
  wake.sh, notify.sh, check_replies.sh, ledger/backup-ledger.md, peer_server.py,
  spend_check.py, runbooks/restore-this-agent.md, runbooks/host-recovery.md,
  tramontane.cron) — all byte-identical to live; `keys/` default-deny verified
  (snapshot keys/ holds only `peers.env.example` + `telegram.env.example` — no
  live secrets); scratch cleaned.
- Inbox: **40 pings (16:04–18:47Z)** all data-only Rule-7 sweeps / link /
  liveness checks, "no reply needed" (MOUNTAIN×14 incl. two "mesa routine mesh
  sweep" envelopes at 18:22Z, HARBOR×6, BEACON×3, DELTA×3, MEADOW×3, HIGHBEAM×2
  w278+w279, MESA×1, RIVER×2 w216+w217, CANYON×2 pass #106+#107) — moved to
  `peer/inbox/processed/`; no outgoing reply (data only).
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 13/13 non-empty, ALL fresh (no sibling >6h):**
  GALE(agent-root) 7m (5h cadence — normal) / TEMPEST 12m / VORTEX 21m /
  SQUALL 32m / BORA 47m / ZEPHYR 52m / SIROCCO 70m / PONIENTE 95m / CYCLONE 119m /
  OSTRO 143m (15 snaps, one over the 14 floor) / LEVANTE 167m / CHINOOK 192m /
  MAISTRAL 205m (slowest, on its own wake slot) — all holding 14+ snaps;
  fleet backup healthy end-to-end, no silent-failure evidence.
- **Services:** `tramontane-peer` active (NRestarts=2 — unchanged, the
  two pre-reboot bind retries from 09-28). `netbox` active (NRestarts=0).
  `tailscaled` active. (wekan pair: not listed in unit table this pass —
  snap unit, unchanged, out of my scope.)
- Host: up 2d3h39m (post-09-28 15:33Z reboot), disk 49% (48G free of 98G),
  50Gi mem avail, load 0.15/16 cores, swap 0B used. Healthy.
- `git status` clean after routine (inbox archival + backup + NOTES don't dirty
  tracked files). No operator/peer action items this waking.

## 2026-09-30 15:14Z — Thirty-sixth activated waking (MY backup/drill PASS; fleet 13/13 fresh, no >6h; no operator msgs; no open questions; inbox 17 data-only pings)

- Backup RUN `tramontane-20260930T151455Z.tar.gz` (792K, 427 entries),
  36th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane-jICl8K
  (256 files); `cmp` of 13 key paths (AGENT.md, NOTES.md, ASK.md, backup.sh,
  wake.sh, notify.sh, check_replies.sh, ledger/backup-ledger.md, peer_server.py,
  spend_check.py, runbooks/restore-this-agent.md, runbooks/host-recovery.md,
  tramontane.cron) — all byte-identical to live; `keys/` default-deny verified
  (snapshot keys/ holds only `peers.env.example` + `telegram.env.example` — no
  live secrets); scratch cleaned.
- Inbox: **17 pings (12:00–12:46Z)** all data-only Rule-7 sweeps / link /
  health / liveness checks, "no reply needed" (MOUNTAIN×5 incl. one sent in
  a MESA envelope at 12:22Z and one "automated latency check" at 12:01Z, BEACON×1
  credentialed health_check, MEADOW×3 census, DELTA×1, HIGHBEAM×1 w277
  probe, MESA×1, CANYON×1 pass #105, HARBOR×4) — moved to
  `peer/inbox/processed/`; no outgoing reply (data only).
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 13/13 non-empty, ALL fresh (no sibling >6h):**
  VORTEX 21m / BORA 50m / SIROCCO 74m / PONIENTE 98m / CYCLONE 122m /
  TEMPEST 134m / OSTRO 147m / SQUALL 154m / LEVANTE 171m / ZEPHYR 175m /
  CHINOOK 194m / GALE(agent-root) 195m (5h cadence — normal) /
  MAISTRAL 219m (slowest, on its own wake slot) — all holding 14 snaps;
  fleet backup healthy end-to-end, no silent-failure evidence.
- **Services:** `tramontane-peer` active (NRestarts=2 — unchanged, the
  two pre-reboot bind retries from 09-28; listening 100.66.39.59:8791 +
  127.0.0.1:8791). `netbox` active (NRestarts=0). `tailscaled` active
  (NRestarts=0). `snap.wekan.wekan` + `snap.wekan.ferretdb` both `inactive`,
  NRestarts=0 (stable "off" since 09-28 15:33Z reboot — out of my scope,
  noting only).
- Host: up 1d23h41m (post-09-28 15:33Z reboot), disk 49% (48G free of 98G),
  50Gi mem avail, load 1.12/16 cores, swap 0B used. Healthy.
- No operator/peer action items this waking.

## 2026-09-30 11:13Z — Thirty-fifth activated waking (MY backup/drill PASS; fleet 13/13 fresh, no >6h; no operator msgs; no open questions; inbox empty)

- Backup RUN `tramontane-20260930T111308Z.tar.gz` (756K, 421 entries),
  35th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14 (oldest 20260927T231330Z rotated out, new one added).
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane-tPeFxn
  (251 files); `cmp` of 13 key paths (AGENT.md, NOTES.md, ASK.md, backup.sh,
  wake.sh, notify.sh, check_replies.sh, ledger/backup-ledger.md, peer_server.py,
  spend_check.py, runbooks/restore-this-agent.md, runbooks/host-recovery.md,
  tramontane.cron) — all byte-identical to live; `keys/` default-deny verified
  (snapshot keys/ holds only `peers.env.example` + `telegram.env.example` — no
  live secrets); scratch cleaned.
- Inbox: **empty** — `peer/inbox/` holds only `cyclone/`, `tramontane/`
  (leftover scaffolds) + `processed/`; no new pings since the 06:47Z batch
  (last w34's sweep). Quiet 11:13Z slot. No reply needed.
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 13/13 non-empty, ALL fresh (no sibling >6h):**
  VORTEX 24m / BORA 48m / SIROCCO 72m / PONIENTE 94m / CYCLONE 119m /
  OSTRO 144m / LEVANTE 168m / CHINOOK 192m / MAISTRAL 212m (slowest, on its
  own wake slot) / TEMPEST 252m / SQUALL 272m / ZEPHYR 292m /
  GALE(agent-root) 313m (5h cadence — normal) — all holding 14 snaps;
  fleet backup healthy end-to-end, no silent-failure evidence.
- **Services:** `tramontane-peer` active (NRestarts=2 — unchanged, the
  two pre-reboot bind retries from 09-28; listening 100.66.39.59:8791 +
  127.0.0.1:8791). `netbox` active (NRestarts=0). `tailscaled` active
  (NRestarts=0). `snap.wekan.wekan` + `snap.wekan.ferretdb` both `inactive`,
  NRestarts=0 (stable "off" since 09-28 15:33Z reboot — out of my scope,
  noting only).
- Host: up 1d19h (post-09-28 15:33Z reboot), disk 48% (49G free of 98G),
  52Gi mem avail, load 0.19/16 cores, swap 0B used. Healthy.
- No operator/peer action items this waking.

## 2026-09-30 07:13Z — Thirty-fourth activated waking (MY backup/drill PASS; fleet 14/14 fresh, no >6h; no operator msgs; no open questions)

- Backup RUN `tramontane-20260930T071251Z.tar.gz` (720K, 415 entries),
  34th snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14 (oldest pruned past 14, new one added).
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane-wfHG
  (246 files); `cmp` of 10 key paths (AGENT.md, NOTES.md, ASK.md, backup.sh,
  wake.sh, notify.sh, ledger/backup-ledger.md, peer_server.py, spend_check.py,
  runbooks/restore-this-agent.md) — all byte-identical to live; `keys/`
  default-deny verified (snapshot keys/ holds only `peers.env.example` +
  `telegram.env.example` — no live secrets); scratch cleaned.
- Inbox: 21 peer pings (04:15–06:47Z): HARBOR×8 (link verification),
  MOUNTAIN×4 (Rule-7 peer sweep / latency check, one MESA-envelope at 06:22Z),
  BEACON×1 (health_check), MEADOW×4 (census), DELTA×1 (link verification),
  HIGHBEAM×1 (w276 standing probe), MESA×1 (link verification), RIVER×1
  (Rule-7 W215 sweep), CANYON×1 (liveness pass #104) — all data-only
  Rule-7 sweeps / link / health / liveness checks, "no reply needed";
  moved to `peer/inbox/processed/`; no outgoing reply (data only).
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 14/14 non-empty, ALL fresh (no sibling >6h):**
  TEMPEST 12m / VORTEX 23m / SQUALL 33m / BORA 47m / ZEPHYR 53m /
  SIROCCO 71m / GALE 73m / PONIENTE 94m / CYCLONE 120m / OSTRO 142m /
  LEVANTE 167m / MAISTRAL 213m (slowest, on its own wake slot) /
  CHINOOK 192m — fleet backup healthy end-to-end, no silent-failure evidence.
- **Services:** `tramontane-peer` active (NRestarts=2 — unchanged, the
  two pre-reboot bind retries from 09-28; listening 100.66.39.59:8791 +
  127.0.0.1:8791). `netbox` active (NRestarts=0). `tailscaled` active.
  `snap.wekan.wekan` + `snap.wekan.ferretdb` both `inactive`, NRestarts=0
  (unchanged since 09-28 15:33Z reboot — out of my scope, noting only).
- Host: up 1d15h (post-09-28 reboot), disk 48% (49G free), 52Gi mem avail,
  load 0.09/16 cores. No anomalies.

## 2026-09-30 03:13Z — Thirty-third activated waking (MY backup/drill PASS; fleet 14/14 fresh, no >6h; no operator msgs; no open questions)

- Backup RUN `tramontane-20260930T031300Z.tar.gz` (688K, 424 entries),
  33rd snapshot overall; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14 (oldest 20260927T192018Z remained, new one added).
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore.XXXXXX;
  `cmp` of 9 key paths (AGENT.md, NOTES.md, ASK.md, backup.sh,
  check_replies.sh, notify.sh, tramontane.cron,
  runbooks/restore-this-agent.md, ledger/backup-ledger.md) — all
  byte-identical to live; `keys/` default-deny verified (snapshot keys/
  holds only `peers.env.example` + `telegram.env.example` — no secrets);
  scratch cleaned.
- Inbox: 17 peer pings (00:00–00:47Z): MOUNTAIN×3 (one sent in a MESA
  envelope at 00:22Z), BEACON×2 (health_check), MEADOW×4 (census),
  DELTA (link verification), HIGHBEAM (w275 probe), MESA (link
  verification), CANYON (liveness pass #103), RIVER (Rule-7 sweep),
  HARBOR×2 (link verification) — all data-only Rule-7 sweeps / link
  verifications, "no reply needed"; moved to `peer/inbox/processed/`;
  no outgoing reply (data only).
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 14/14 non-empty, ALL fresh (no sibling >6h):**
  VORTEX 18m / BORA 47m / SIROCCO 71m / PONIENTE 95m / CYCLONE 119m /
  TEMPEST 132m / OSTRO 142m / SQUALL 151m / LEVANTE 166m / ZEPHYR 172m /
  CHINOOK 190m / GALE 192m / MAISTRAL 215m (slowest, on its own wake
  slot) — fleet backup healthy end-to-end, no silent-failure evidence.
- **Services:** `tramontane-peer` active (NRestarts=2 — unchanged, the
  two pre-reboot bind retries from 09-28; listening 100.66.39.59:8791 +
  127.0.0.1:8791). `netbox` active (NRestarts=0). `tailscaled` active
  (NRestarts=0). **WeKan (out of scope, noting):**
  `snap.wekan.wekan` + `snap.wekan.ferretdb` both `inactive` (NRestarts=0)
  — stable "off" state since w29; crash-looping resolved (it self-stopped,
  nobody re-enabled it). No action taken (not my service).
- Host: up 1d11h39m (post-09-28 15:33Z reboot), disk 48% (50G free of
  98G), mem 52Gi available, load 0.35/0.20/0.19, 16 cores, swap 0B used.
  Healthy.
- No operator/peer action items this waking.

## 2026-09-29 23:13Z — Thirty-second activated waking (MY backup/drill PASS; fleet 13/13 non-empty, 3 mild >6h; no operator msgs; no open questions; inbox empty)

- Backup RUN `tramontane-20260929T231307Z.tar.gz` (652K, 400 entries),
  26th snapshot for the day; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14 (oldest 20260927T192018Z rotated out).
- Restore drill **PASS**: scratch extract (236 files) to
  /tmp/opencode/restore-tramontane-*; `cmp` of 11 key paths (AGENT.md,
  NOTES.md, ASK.md, backup.sh, notify.sh, check_replies.sh,
  ledger/backup-ledger.md, runbooks/restore-this-agent.md,
  runbooks/host-recovery.md, spend_check.py, peer_server.py) — all
  byte-identical to live; `keys/` snapshot default-deny verified (only
  `peers.env.example` + `telegram.env.example` — no live tokens);
  scratch cleaned.
- Inbox: **empty** — `peer/inbox/` holds only `cyclone/`, `tramontane/`
  (leftover scaffolds) + `processed/`; no new pings since the 18:46Z batch
  (last w31's sweep). Quiet 23:12Z slot. No reply needed.
- `check_replies.sh`: `(no new messages)`. ASK.md: no open questions.
- **Drift sweep 13/13 non-empty (14-snap rotation intact on ALL):**
  3 siblings >6h (all non-empty, non-truncated — `tar -tzf` verified
  entry counts: MAISTRAL 454m / 577e, CHINOOK 432m / 443e, LEVANTE
  408m / 1275e) — mild cadence drift, no evidence of silent failure;
  each simply on its own wake slot (MAISTRAL :36, CHINOOK :60,
  LEVANTE :48 — none of them at its wake minute in the 23:12Z window).
  Others: GALE 313m (5h cadence — normal), ZEPHYR 292m, SQUALL 272m,
  TEMPEST 252m, CYCLONE 356m, OSTRO 140m, PONIENTE 335m, SIROCCO 57m,
  BORA 32m, VORTEX 24m — all <6h. **No finding, no action** — this is
  the expected pattern (fleet round-robin, not all at :12).
- **WeKan (out of scope):** `snap.wekan.wekan` + `snap.wekan.ferretdb`
  both `inactive`, NRestarts=0 (stable "off" state since w29). netbox +
  tailscaled `active`.
- **`tramontane-peer.service`** — `active`, NRestarts=2 (the two
  pre-reboot bind retries from 09-28 15:35Z, self-healed — unchanged
  since w29's entry); listening `100.66.39.59:8791` + `127.0.0.1:8791`
  (peer server healthy).
- Host: up 1d7:39 (post-09-28 15:33Z reboot), disk 47% (50G free),
  51Gi mem avail, load 0.18/16 cores. Healthy.
- No operator messages, no peer action items this waking.

## 2026-09-29 19:16Z — Thirty-first activated waking (MY backup/drill PASS; fleet 14/14 fresh; no operator msgs; no open questions)

- Backup RUN `tramontane-20260929T191515Z.tar.gz` (620K, 392 entries), 25th
  snapshot for the day; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14 (oldest rotated out).
- Restore drill **PASS**: scratch extract (392 entries) to
  /tmp/opencode/restore-tramontane-*; `cmp` of 7 key paths (AGENT.md,
  NOTES.md, ASK.md, backup.sh, notify.sh, ledger/backup-ledger.md,
  runbooks/restore-this-agent.md) — all byte-identical to live; `keys/`
  snapshot default-deny verified (only `*.example` — no live tokens);
  scratch cleaned.
- Inbox: **16 pings (18:00–18:46Z) all data-only Rule-7/no-reply-need**
  (MOUNTAIN×4, BEACON, DELTA, MEADOW×3, HIGHBEAM, MESA, RIVER, CANYON,
  HARBOR×3) — moved to `peer/inbox/processed/`; no reply sent.
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 14/14 fresh (no sibling >6h):** TEMPEST 14m / SQUALL 34m /
  ZEPHYR 54m / GALE 74m / PONIENTE 97m / CYCLONE 117m / OSTRO 144m /
  LEVANTE 170m / CHINOOK 193m / MAISTRAL 216m / VORTEX 264m / BORA 290m /
  SIROCCO 312m (5.2h — slowest but under bar) — all holding 14 snapshots.
- **WeKan state (out of scope, noting):** both `snap.wekan.wekan` and
  `snap.wekan.ferretdb` `inactive`, NRestarts=0 — stable "off" state since
  w29 (no churn); netbox + tailscaled `active`.
- Host: up 1d3:41 (post-09-28 15:33Z reboot), disk 47% (51G free),
  52Gi mem avail, load 0.21/16 cores. Healthy.

## 2026-09-29 15:14Z — Thirtieth activated waking (MY backup/drill PASS; fleet 14/14 fresh; no operator msgs; no open questions)

- Backup RUN `tramontane-20260929T151341Z.tar.gz` (588K, 405 entries), 24th
  snapshot for the day; `tar -tzf` read-back OK (backup.sh exit 0); rotation
  held at 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore-tramontane-*,
  `diff -r` vs live tree (standard excludes: logs/backups/keys/node_modules/peer)
  → **0 differences**; scratch cleaned.
- Inbox: **23 pings (12:00–12:54Z) all data-only Rule-7/no-reply-need**
  (MOUNTAIN×6, MEADOW×4, DELTA×2, HIGHBEAM, MESA, RIVER, CANYON, VISTA,
  HARBOR×6) — moved to `peer/inbox/processed/`; no reply sent.
- `check_replies.sh`: no new operator messages; ASK.md no open questions.
- **Drift sweep 14/14 fresh (no sibling >6h):** PONIENTE 336m / GALE 194m /
  CHINOOK 193m / ZEPHYR 173m / LEVANTE 169m / SQUALL 153m / OSTRO 145m /
  CYCLONE 120m / TEMPEST 133m / SIROCCO 72m / BORA 49m / VORTEX 23m /
  MAISTRAL 211m / tramontane 1m.
- **WeKan state oscillation (out of my scope — noting):** `snap.wekan.ferretdb`
  back to `active` (was `inactive` at w29); `snap.wekan.wekan` `inactive`;
  NRestarts **4121** (climbing — churn resumed since w28's 2683). netbox +
  tailscaled `active`.
- Host: up 23:39 (post-09-28 15:33Z reboot), disk 47% (51G free), 50Gi mem
  avail, load 1.32/16 cores.

## 2026-09-29 11:13Z — Twenty-ninth activated waking (W28 recovery + MY backup/drill PASS + ledger backfill COMPLETE — w12, w14, w15, w16, w17, w18, w19, w20, w21 all restored to the ledger; fleet 13/13 fresh; WeKan crash-loop now dead/inactive)

- Backup RUN `tramontane-20260929T111543Z.tar.gz` (552K, 235 entries), 20th
  snapshot for the day; `tar -tzf` read-back OK (backup.sh exit 0);
  rotation held at 14 (oldest rotated out: 2026-09-26T231307Z-era).
- Restore drill **PASS**: scratch extract 235 files to
  /tmp/opencode/drill-*; `cmp` of AGENT.md, NOTES.md, ASK.md, backup.sh,
  wake.sh, notify.sh, ledger/backup-ledger.md, peer_server.py,
  spend_check.py, runbooks/restore-this-agent.md — all byte-identical to
  live; `keys/` default-deny correct (only peers.env.example +
  telegram.env.example — no live tokens); scratch dir cleaned.
- **W28 recovery (this session's first act):** the 07:12Z w28 session
  completed backup + drill + ledger w22–w26 backfill (row at 07:13Z) but
  then exited at `reason=length` **before** (a) moving the 14 peer pings,
  (b) backfilling w12 + w14–w21, (c) appending its NOTES.md entry,
  (d) committing, (e) running `./notify.sh`. I picked each item up:
  - 14 pings (06:00–06:47Z; MOUNTAIN×4, BEACON, MEADOW×2, DELTA, HIGHBEAM,
    RIVER, CANYON, VISTA, HARBOR×2) — all "no reply needed" Rule-7 —
    moved to `peer/inbox/processed/` now.
  - w28's missing own NOTES.md entry — appended below in its own section.
  - w12 + w14–w21 ledger rows reconstructed from the matching NOTES.md
    entries (each row annotated `Backfilled w29 from NOTES.md` for
    auditability); w12 tarball (2026-09-26T072619Z) + w14
    (2026-09-26T152544Z) + w15 (2026-09-26T194920Z) tarballs are **outside
    the 14-snapshot rotation** — noted in the ledger rows, rows are kept
    for completeness. w16 through w21 tarballs ARE in the live rotation.
  - `git add -A && git commit` — done (this entry's commit).
  - `./notify.sh` — run at the end of this waking with a summary that
    covers both w28 and w29 so the operator sees one coherent report
    instead of the w28 ALERT-only line that wake.sh fired as a fallback.
- **Ledger backfill now COMPLETE** (w27's TODO closed): w22, w23, w24,
  w25, w26 (w28's session), w12, w14, w15, w16, w17, w18, w19, w20, w21
  (this session). All rows cite their NOTES.md source.
- `check_replies.sh`: `(no new messages)`. ASK.md: no open questions.
- **Drift sweep (13 local siblings, READ-ONLY) — all fresh, no stale:**
  gale (/home/agent/agent) 315m/5.3h, zephyr 295m, squall 275m, tempest
  255m, maistral 204m, chinook 194m, levante 170m, ostro 145m, cyclone
  122m, poniente 97m, sirocco 73m, bora 51m, vortex 25m. All 13 under
  the 6h stale threshold (GALE slowest at 5.3h, on its 5h cadence —
  normal).
- **WeKan state change (flag, out of scope):** `snap.wekan.wekan` and
  `snap.wekan.ferretdb` are now both `inactive (dead)`, NRestarts=0, no
  journal churn — the EADDRINUSE crash-loop observed continuously 09-26→
  09-29 (NRestarts climbing 6,361 → 12,478, then reboot-reset, then 2,683
  at w28) has stopped. Most likely stopped by an operator during the
  09-28 15:33Z reboot/maintenance window. I am not starting, stopping,
  or configuring it — outside my backup scope. Flagging the change so
  the operator knows the state moved from "crash-looping" to "off".
- **`tramontane-peer.service`** — healthy (NRestarts=2, both the
  pre-reboot bind retries already documented at w28; `active` since
  09-28 15:35:39Z, self-healed). No action.
- `notify.sh`: run at waking end. Host: up 19:42 (post-09-28 reboot),
  disk 46% (51G free), 50Gi mem avail, load 1.46/16 cores. No operator
  or peer action items this waking.

## 2026-09-29 07:13Z — Twenty-eighth activated waking (backup + drill + ledger w22–w26 backfill; session interrupted at length-limit before inbox/NOTES/commit/notify — w29 finished these)

- Backup RUN `tramontane-20260929T071232Z.tar.gz` (552K, 235 entries),
  19th snapshot; `tar -tzf` read-back OK.
- Restore drill **PASS**: scratch extract 235 files; `cmp` of AGENT.md,
  NOTES.md, ASK.md, backup.sh, wake.sh, notify.sh, ledger/,
  runbooks/ — all byte-identical; `keys/` default-deny verified
  (peers.env.example + telegram.env.example only, no live tokens);
  scratch cleaned.
- **Ledger backfill w22–w26 COMPLETED this waking** (reconstructed from
  NOTES.md + git log; w27's "backfill TODO" for these five was closed).
  Discovered w12 + w14–w21 were ALSO missing (w27 only looked back to
  the 13th waking) — left for w29 (see next section), which finished
  them.
- **INCOMPLETE steps (session hit `reason=length` at 53,046 tokens total
  before exiting)**: inbox pings still un-moved; no own NOTES.md entry;
  no commit; `./notify.sh` not run — wake.sh's ALERT fallback was the
  only thing that reached the operator for this waking.
  w29 (11:13Z) completed all four.
- Inbox (un-moved until w29): 14 pings 06:00–06:47Z (MOUNTAIN×4, BEACON,
  MEADOW×2, DELTA, HIGHBEAM, RIVER, CANYON, VISTA, HARBOR×2) — all
  "no reply needed" Rule-7.
- `check_replies.sh`: no new operator messages. ASK.md: no open
  questions.
- **WeKan crash-loop RECURRING** at check: NRestarts 1990 → 2,683
  since w27 (~790 restarts in ~4h, ~3min cadence; restarted seconds
  before the check). Pattern: boots, selects FerretDB backend, dies.
  `snap.wekan.ferretdb` itself healthy (up since 09-25). Not my
  service; re-flagged. (Superseded by w29 finding: both wekan units
  now `inactive`/dead — see next section.)
- **`tramontane-peer.service`** NRestarts=2 — 2 failed binds
  09-28 15:35:29/34Z (OSError 99, tailscale IP not yet assigned
  post-reboot), then healthy since 15:35:39Z via
  `Restart=on-failure`; self-healed, no action needed.
- Host: up 15h39m (post-09-28 reboot); disk 45% (52G free); 50Gi RAM
  available; load 1.21; 16 cores.

## 2026-09-29 03:17Z — Twenty-seventh activated waking (host reboot absorbed; MY backup/drill PASS — see fleet-API-outage correction below)

- Backup RUN `tramontane-20260929T031647Z.tar.gz` (504K), 18th snapshot;
  `tar -tzf` read-back OK; rotation held at 14 (oldest rotated out).
- Restore drill **PASS**: scratch extract (213 files); `cmp` byte-identical
  for AGENT.md, NOTES.md, ASK.md, backup.sh, notify.sh, check_replies.sh,
  spend_check.py, runbooks/restore-this-agent.md, ledger/backup-ledger.md,
  tramontane.cron, systemd/tramontane-peer.service; `keys/` default-deny
  correct (only `*.example`); scratch cleaned.
- **HOST REBOOTED 2026-09-28 15:33Z** (~20 min after w26; w26 ran at
  15:13Z, up was 3d — so the reboot is a one-off, most likely the kernel
  6.8.0-142 security update auto-reboot). Uptime at this waking: 11h42m.
  Everything critical re-came-up: all 13 peer services `running`,
  `netbox.service`, `snap.wekan.wekan` (NRestarts cumulative 1990),
  `snap.wekan.ferretdb` (NRestarts 0 this boot), `tailscaled`, cron intact
  (all 12 agent wake schedules + Ollama keepalive + Gale's synthetics/bridges
  present in `crontab -l`). No missing units. **No action needed.**
- Drift sweep (13 sibling dirs read-only) — **2 STALE, see correction box
  below.** Ages: GALE 196m, BORA 51m, **CHINOOK 401m (6.7h — OVER 6h bar)**,
  CYCLONE 121m, LEVANTE 171m, **MAISTRAL 458m (7.6h — OVER 6h bar)**,
  OSTRO 147m, PONIENTE 98m, SIROCCO 70m, SQUALL 155m, TEMPEST 135m,
  VORTEX 26m, ZEPHYR 176m. All ≥14 snapshots; the two stale siblings simply
  missed one wake each during the API-outage window (see below) — their
  most recent successful backup predates that window.
- **CORRECTION (supersedes "no staleness / all green" above, and the
  03:17Z headline I originally wrote + sent as "all green"):** my w27
  summary understated real findings. Root cause of the 2 stale siblings
  AND of my own 2 skipped wakings (my scheduled 19:12Z and 23:12Z both
  FAILED — `logs/20260928T191201Z.log` exit 1, `logs/20260928T231201Z.log`
  exit 1 — neither produced a backup/NOTES/ledger row; only ALERT lines
  exist in the wake logs): a
  **fleet-wide Ollama/shim API outage window ~2026-09-28 18:59Z → 00:12Z**.
  Error-log evidence (since reboot 15:33Z): 18:59 vx "cannot connect to
  API"; 19:16 TM "cannot connect"; 20:04 CH "cannot connect"; 23:25 TM+VX
  "no user query found"; 23:41/23:55 MS both modes; 09-29 00:05/00:12 CH
  "no user query found". Both error classes are the same upstream (OLLAMA /
  gale-ollama-shim) being unreachable/misbehaving at once. Ollama is
  recovered (my w27 at 03:12Z succeeded on attempt 2; `/api/tags` now
  serves `qwen3.8:27b`). **So "no live incident" is true, but "all green"
  is not — 4 agents (chinook, maistral, tramontane, vortex) logged the
  outage and MAISTRAL+CHINOOK ended stale.** No operator action strictly
  required (recovered; next wake of each will re-hydrate), but flagging:
  (a) the 6h drift bar was breached by MAISTRAL+CHINOOK (their most recent
  good backup predates ~18:59Z), and (b) the outage spanned both my own
  scheduled wakings (19:12Z, 23:12Z) — my backup cadence was therefore NOT
  8h continuous from w26 (15:13Z); my next good snapshot is this waking's
  03:16Z, a ~12h gap across the two failed slots.
- Inbox: ~35 peer msgs (00:00–01:14Z), all explicitly "no reply needed"
  Rule-7 probes — MOUNTAIN×6, MEADOW×4, DELTA×6, MESA×2, HIGHBEAM×2,
  RIVER, CANYON×2, HARBOR×2, VISTA, LIGHTNING, CYCLONE, BEACON×2, +1
  other. No operator request among them; all already moved to
  `processed/`. `peer/inbox/cyclone/` and `peer/inbox/tramontane/` are
  empty dirs (leftover scaffolds, harmless).
- **Housekeeping finding:** `ledger/backup-ledger.md` has not been appended
  in w23–w26 (last row `2026-09-26T11:26Z`); rows for w23–w26 live only in
  NOTES.md and git commit messages. Appended this waking's row now; w23–w26
  rows should be backfilled from `git log --oneline` at a future waking so
  the ledger stays the authoritative single-file record. Trivial — no
  operator action.
- No operator replies (`check_replies.sh` → none); ASK.md unchanged
  (no open questions).

## 2026-09-28 15:13Z — Twenty-sixth activated waking (backup + drill; notify.sh hardened; 17 peer probes clean)

- Backup RUN `tramontane-20260928T151310Z.tar.gz` (484K),
  17th snapshot; `tar -tzf` read-back OK; 14-snapshot rotation held.
- Restore drill **PASS**: scratch extract to /tmp/opencode/drill-*;
  md5 of AGENT.md, NOTES.md, backup.sh, notify.sh all MATCH;
  keys/ default-deny correct (only *.example present); scratch cleaned.
- Host state: up 3d 0h; disk 45% used (52G free); 49Gi RAM available;
  load ~2.9. ALL 17 peer services active (same count as 20th waking).
- WeKan change: now cleanly `inactive/dead` NRestarts=0 — no longer
  crash-looping (20th waking had NRestarts=10084). Not a co-resident
  fault; appears to have been stopped, not looping. No action needed.
- Inbox: 17 new peer messages (12:00–15:10Z), ALL "no reply needed"
  Rule-7 probes — credentialed reach / link verification / census:
  MOUNTAIN×3, BEACON×4, MEADOW×2, DELTA, MESA, HIGHBEAM, RIVER, CANYON,
  HARBOR×3. Mesh healthy; confirms tramontane /inbox reachable. No
  operator request among them.
- notify.sh hardened: accepts severity in arg 1 OR arg 2 (callers used
  both); now logs the Telegram API response to
  `logs/notify_last_response.txt` and errors loudly on failure — a
  silent no-op is no longer possible. Committed with this entry.
- No drift in AGENT.md/NOTES.md rules; no drift in scripts to fix;
  nothing to escalate to ASK.md.

## 2026-09-27 20:35Z — Twenty-first activated waking (backup + drill + drift sweep; fleet fresh; WeKan up but restart counter creeping)

- Backup RUN `tramontane-20260927T202807Z.tar.gz` (348K, 310 entries),
  16th snapshot; `tar -tzf` integrity OK.
- Restore drill **PASS**: scratch extract to /tmp/restore_test_21;
  `cmp` of AGENT.md, ASK.md, backup.sh vs live — all identical;
  scratch cleaned.
- Inbox: 22 messages (18:00–18:47Z), all data-only routine pings
  (BEACON×2, MOUNTAIN×8, DELTA, MEADOW×4, HIGHBEAM, MESA, LANTERN,
  CANYON, RIVER, HARBOR×2) — no replies requested, no operator
  content; all moved to `peer/inbox/processed/`. `check_replies.sh`:
  no new operator messages; ASK.md no open questions.
- Peer services: all 17 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active`.
  WeKan currently up (both wekan + ferretdb active) but `NRestarts=10084`
  (was 8519 at 11:13Z, 10084 now) — process recovers each cycle from
  the restart loop; crash-loop condition unresolved.
- Drift sweep: **no stale siblings** — 13 co-residents fresh,
  mtime age 0–212m (OSTRO 212 m / 3.5 h slowest; LEVANTE 0 m just
  woke; all under 6 h threshold).
- Host: up ~2d6h, disk 41 % (55 G free), mem 49 Gi avail,
  load 3.51, 16 cores.

## 2026-09-27 15:13Z — Twentieth activated waking (backup + drill + drift sweep; fleet fresh; WeKan crash-loop root cause SHIFTED to FerretDB inactive)

- Backup OK: `backups/tramontane-20260927T151312Z.tar.gz`, 332K,
  read-back verified by script.
- Restore drill PASS: scratch extract of 178 files; `cmp` of AGENT.md,
  NOTES.md, ASK.md, backup.sh, notify.sh against live — all identical.
- Host health: up 2 d, load 1.47/1.43/1.42, RAM 6.9Gi/58Gi (51Gi
  available), swap 0B used, disk 39% (36G used, 58G free of 98G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
- **Peer inbox: 19 new probe/verification messages** (MOUNTAIN x3, BEACON,
  MEADOW x4, DELTA, HIGHBEAM, MESA x2, RIVER, CANYON, VISTA, HARBOR x3,
  RADAR) — all marked data-only / "no reply needed" (Rule-7 link
  verification + census probes). None is a new operator request or
  actionable item; processed to `processed/`. No reply sent (data only).
- **Drift sweep (13 local siblings, READ-ONLY) — all fresh.** vortex, agent,
  bora, sirocco, cyclone, tempest, squall, zephyr, chinook, maistral,
  poniente, ostro, levante all < 1 h (latest non-log file is
  `logs/.telegram_commands.lock`, actively touched). All well under the
  12 h stale threshold; no sibling flagged.
- **WeKan — STILL crash-looping, but ROOT CAUSE HAS SHIFTED (new).**
  NRestarts climbed 8519 → 9210. `snap.wekan.wekan.service` is `active`
  but restarts repeatedly (~2 min cadence, observed 15:13 → 15:15Z). Prior
  wakings (16th–19th) showed `listen EADDRINUSE` port collision as the
  failure. This waking the log shows the controller resolving
  `Database selection: setting='ferretdb' ferretdb_has_data=true
  mongodb_has_data=false` → `MONGO_URL=mongodb://127.0.0.1:27019/wekan`,
  running the `snapctl stop --disable wekan.mongodb` step, while
  `snap.wekan.ferretdb.timer` / `...services` report **inactive** — i.e.
  WeKan now selects the FerretDB backend that is not running, so it keeps
  restarting. Host/snap-config regression, outside my backup scope —
  re-flagging, no action taken. (I could not confirm the crash exit reason
  directly — the journal churns too fast to grep without timing out; this
  is my best read of state. A human on gale-agent should inspect the
  snapctl/ferretdb units.)

---

## 2026-09-27 11:13Z — Nineteenth activated waking (backup + drill + drift sweep; fleet fresh, WeKan still crash-looping)

- Backup OK: `backups/tramontane-20260927T111308Z.tar.gz`, 316K,
  read-back verified by script.
- Restore drill PASS: scratch extract to `/tmp/restore_test`; `cmp` of
  AGENT.md, backup.sh, check_replies.sh, notify.sh against live — all
  identical; scratch dir cleaned.
- Host health: up 1d 20h, load 1.36/16 cores, RAM 5.8Gi/58Gi
  (52 Gi available), disk 36 % (34 G used, 60 G free of 98 G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
- **Drift sweep (13 local siblings, READ-ONLY) — all fresh:**
  vortex 0.4 h, gale (/home/agent/agent) 3.7 h, bora 0.7 h, sirocco
  1.2 h, cyclone 1.9 h, tempest 4.2 h, squall 4.5 h, zephyr 4.8 h,
  chinook 3.2 h, maistral 3.5 h, poniente 1.6 h, ostro 2.4 h, levante
  2.8 h (newest non-log file per dir). All well under the 12 h stale
  threshold; no sibling flagged.
- **WeKan — STILL crash-looping (unchanged pattern since 16th waking).**
  NRestarts climbed 7805 → 8519; `snap.wekan.wekan.service` reports
  `active` but restarts repeatedly (last start 11:13:11Z, seconds before
  this check) — port-collision/EADDRINUSE issue per prior wakings.
  Same host-config issue, outside my backup scope — re-flagging, no
  action taken.
- No operator or peer action items this waking.

---

## 2026-09-27 07:13Z — Eighteenth activated waking (backup + drill + drift sweep; fleet fresh, WeKan still crash-looping)

- Backup OK: `backups/tramontane-20260927T071315Z.tar.gz`, 304K,
  294 entries, read-back verified by script.
- Restore drill PASS: scratch extract to `/tmp/restore_test`; `cmp`
  of AGENT.md, ASK.md, backup.sh against live — all identical;
  scratch dir cleaned.
- Host health: up 1d 16h, load 1.88/16 cores, RAM 7.6Gi/58Gi
  (51 Gi available), disk 36 % (34 G used, 60 G free of 98 G).
  Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
  16 peer inbox messages dated 2026-09-27 06:00–06:46Z
  (BEACON×1, MOUNTAIN×4, DELTA×3, MEADOW×2, HIGHBEAM×1, MESA×1,
  RIVER×1, CANYON×1, HARBOR×2) — all routine data-only pings, no
  replies requested; moved to `peer/inbox/processed/`.
- **Drift sweep (13 local siblings, READ-ONLY) — fleet-wide fresh:**
  vortex 3 m, gale (/home/agent/agent) 0 m, bora 3 m, sirocco 3 m,
  cyclone 3 m, tempest 3 m, squall 3 m, zephyr 3 m, chinook 3 m,
  maistral 3 m, poniente 3 m, ostro 3 m, levante 3 m. All well under
  the 12 h stale threshold; no sibling flagged.
- **WeKan — STILL crash-looping (unchanged since 16th/17th waking).**
  NRestarts climbed 7089 → 7805; `snap.wekan.wekan.service` is `active`
  but re-exiting on `EADDRINUSE 0.0.0.0:8080` (port squatted; last
  restart 07:13:03Z — seconds before this waking's checks).
  `snap.wekan.ferretdb`, `netbox`, `tailscaled` all `active`.
  Same host-config/port-collision issue, outside my backup scope —
  re-flagging, no action taken.
- No operator or peer action items this waking.

---

## 2026-09-27 03:13Z — Seventeenth activated waking (backup + drill + drift sweep; fleet fresh, WeKan still crash-looping)

- Backup OK: `backups/tramontane-20260927T031315Z.tar.gz`, 288K,
  289 entries, read-back verified by script.
- Restore drill PASS: scratch extract to `/tmp/restore_test`; `cmp`
  of AGENT.md, ASK.md, backup.sh against live — all identical;
  scratch dir cleaned.
- Host health: up 1d 12h, load 1.22/16 cores, RAM 6 Gi used of 58 Gi,
  51 Gi available, disk 36 % (34 G used, 60 G free of 98 G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
  Peer inbox now holds only the empty `cyclone/` + `tramontane/` peer
  subdirs + `processed/`. 25 routine pings dated 2026-09-27
  (BEACON×6, MOUNTAIN×4, HARBOR×4, MEADOW×3, DELTA×2, plus
  RIVER/PULSAR/MESA/HIGHBEAM/GALE/CANYON ×1) all data-only, no reply
  requested — now in `processed/`.
- **Drift sweep (13 local siblings, READ-ONLY) — fleet-wide fresh:**
  vortex 22 m, gale (`/home/agent/agent`) 22 m, bora 47 m,
  sirocco 71 m, cyclone 112 m, tempest 132 m, squall 147 m,
  zephyr 172 m, chinook 187 m, maistral 208 m, poniente ~102 m
  (01:37Z), ostro ~144 m (00:53Z), levante ~157 m (00:37Z).
  All well under the 12 h stale threshold. **BORA recovered** —
  was 7.2 h sole-stale at the 15th waking, now 47 m; no sibling
  flagged this waking.
- **WeKan — STILL crash-looping (unchanged since 16th waking).**
  NRestarts climbed 6361 → 7089; `snap.wekan.wekan.service` is
  `active` but re-exiting on `EADDRINUSE 0.0.0.0:8080` (port squatted;
  a parallel instance serves fine on `:3000`). `snap.wekan.ferretdb`,
  `netbox`, `tailscaled` all `active`. Same host-config/port-collision
  issue, outside my backup scope — re-flagging, no action taken.
- No operator or peer action items this waking.

---

## 2026-09-26 23:13Z — Sixteenth activated waking (backup + drill + drift sweep; fleet-wide fresh, wekan crash-loop root cause identified)

- Backup OK: `backups/tramontane-20260926T231307Z.tar.gz`, 272K,
  285 entries, `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, `cmp` +
  `diff -rq` against live → no mismatches; scratch dir cleaned.
- Host health: up 1d 8h, load 2.32/16 cores, RAM 7.9Gi/58Gi, disk
  36% (34G free of 98G). Healthy.
- `check_replies.sh`: "(no new messages)". ASK.md: no open questions.
  Peer inbox: `cyclone/` + `tramontane/` subdirs empty (20+ pings
  already in `processed/`). Nothing to process.
- **Drift sweep (13 siblings, all READ-ONLY) — fleet-wide fresh:**
  vortex 0.4h, bora 0.8h, sirocco 1.2h, poniente 1.4h, cyclone 1.9h,
  ostro 2.4h, levante 2.8h, chinook 3.2h, maistral 3.4h, tempest 4.2h,
  squall 4.5h, zephyr 4.9h. Oldest (ZEPHYR 4.9h) well under the 12h
  stale threshold — yesterday's "ZEPHYR sole stale" item now resolved,
  no sibling flagged this waking.
- **WeKan regression — root cause identified (was flagged since 9th/10th
  waking, when it degraded then went `inactive`).** Not a plain
  "inactive" anymore: `snap.wekan.wekan.service` is `active/running`
  but in a **crash-loop** — `NRestarts=6361`, and right now it exits
  roughly every ~20s with
  `[uncaughtException] WeKan is stopping: Error: listen EADDRINUSE:
  address already in use 0.0.0.0:8080` (confirmed repeatedly in
  `journalctl`, e.g. 23:12:40/23:12:59/23:13:19/23:13:40). Root cause:
  port 8080 is squatted — `ss -ltnp` shows a listener on
  `127.0.0.1:8080` (not wekan), and a *parallel* wekan instance is
  already happily serving on `0.0.0.0:3000` (HTTP 200, Meteor
  `__meteor-css__` body, FerretDB ready, MongoDB oplog up). So the
  user-facing app on `:3000` is up and stable — the crash-loop is a
  *redundant* wekan process configured for `:8080` colliding with a
  127.0.0.1:8080 squatter (nginx is active; nextcloud/rocketchat
  snaps also run). This is a **host-config/port-collision issue
  outside my backup scope** — I am not going to kill processes,
  change ports, or restart it myself, but flagging it clearly to the
  operator since it's been growing NRestarts for days and is burning
  CPU in a tight loop. `snap.wekan.ferretdb` itself is stable/active.
- No operator or peer action items this waking.

---

## 2026-09-25 23:26Z — Tenth activated waking (backup + drill + drift sweep; zephyr sole stale)

- Backup OK: `backups/tramontane-20260925T232604Z.tar.gz`, 176K,
  218 entries, `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`;
  AGENT.md + NOTES.md `cmp` byte-identical to live (CORE_DRILL_PASS);
  `peer/inbox/` tree matches (only expected `peer/inbox/processed`
  excluded by backup.sh); scratch dir cleaned.
- Host health: up 8h27m (kernel 6.8 since 14:58Z), load 1.19/1.35/1.41,
  disk 35% (62G free), RAM 7Gi used / 51Gi available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged
  (no open questions). Inbox: 0 new — `cyclone/` + `tramontane/`
  subdirs empty; nothing to process.
- Peer services: all 13 active (incl. new LEVANTE + OSTRO);
  tramontane listening on 100.66.39.59:8791 + 127.0.0.1:8791.
- Drift sweep: all 12 other siblings fresh (32m–5h, incl. LEVANTE
  50m, OSTRO 158m). **ZEPHYR STALE — 16.7h** (`zephyr-20260925T062037Z`),
  same open item as last waking; sole drift.
- Netbox/wekan: netbox still `active`; **wekan now `inactive`**
  (was `active` degrading at 19:32Z, NRestarts=953) — new regression,
  flagged for operator.

---

## 2026-09-25 19:32Z — Ninth activated waking (backup + drill + new sibling OSTRO + zephyr still stale)

- Backup OK: `backups/tramontane-20260925T193213Z.tar.gz`, 180K,
  279 entries, `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 191 files,
  key files all present (AGENT.md, NOTES.md, ASK.md, backup.sh, wake.sh,
  notify.sh, spend_check.py, ledger/backup-ledger.md,
  runbooks/restore-this-agent.md, runbooks/host-recovery.md); AGENT.md
  byte-identical to live (`cmp` clean); scratch dir cleaned.
- Host health: up 4h31m (post-reboot, kernel 6.8 since 14:58Z),
  load 1.73/1.89/1.77, disk 34% (62G free), RAM 7Gi used / 51Gi
  available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged (no open
  questions).
- **Peer inbox (49 msgs, 17:17–18:48Z)** — all routine, data-only: MOUNTAIN
  rule-7 peer sweeps + latency probes ×12, BEACON routine credentialed
  health-checks ×8, MEADOW census ×2, DELTA link ×5, CANYON ×3 (+1 "canyon pass
  #85 liveness/token-classification" mislabeled under MOUNTAIN), RIDGE ×4,
  HARBOR ×7, MESA ×4, VISTA ×3, RIVER w198 rule-7 sweep ×1, CYCLONE
  link-check ×1 (in `peer/inbox/cyclone/`). All 49 moved to
  `peer/inbox/processed/`. No operator request in any.
- **RIVER w198 sweep notes a new fleet member: OSTRO** — "33rd fleet
  member OSTRO onboarded test-first this waking (two-way green, manifest
  32->33, pins ported from Tidal 2c77f89e)". Verified from my side
  (read-only): `/home/agent/ostro/` exists with
  `backups/ostro-20260925T184742Z.tar.gz` (164K), `ostro-peer` service
  `active` — 11th local sibling; now folded into the drift sweep.
  Pairing test msg 17:45Z (`20260925T174520Z-OSTRO-87f221e8`) says
  "rule 8a operator sign-off, bidirectional self-test passed, safe to
  delete" — data-only, no action.
- **Drift sweep (11 siblings, all READ-ONLY):**
  gale `181402Z`, chinook `160633Z`, cyclone `171512Z`, maistral
  `175120Z`, sirocco `181748Z`, squall `184237Z`, tempest `192836Z`,
  vortex `190339Z`, bora `164748Z`, ostro `184742Z` — all fresh (≤4h).
  **ZEPHYR STALE — 2nd consecutive waking:** last snapshot
  `zephyr-20260925T062037Z`, ~13h old (was ~9h at 15:26Z wake; >6h line
  crossed 12:20Z). `zephyr-peer` service still `active`;
  `zephyr/logs/wake-skipped.log` last line unchanged since 09-21:
  `TELEGRAM_CHAT_ID not set, refusing to run` — same refusal pattern as
  Bora's, but zephyr's is stale (no recent skip entries), so zephyr may be
  silently skipping or its wake.sh guard changed; I do not enter zephyr's
  tree to investigate further — flagged for operator (and for zephyr's own
  owner if any).
- **Bora drift still CLOSED:** `bora-20260925T164748Z` fresh (139K),
  `wake-skipped.log` unchanged at 08:34Z (as expected — Bora's resolved
  per its own 12:37Z peer msg; verified at 15:26Z).
- **Post-reboot host services (read-only status check, flagged 15:26Z):**
  `netbox.service` **RECOVERED** — `ActiveState=active`, `NRestarts=0`
  (was crash-looping 343 with `No module named 'gunicorn'`; looks like the
  python dep was restored). `snap.wekan.wekan.service` still degraded but
  `active` (`NRestarts=953`, up and serving but accumulating restarts —
  worth a host-level look eventually; not my lane).
- Peer services `tramontane-peer`/`bora-peer`/`zephyr-peer`/`ostro-peer`
  all `active`.

## 2026-09-25 15:26Z — Eighth activated waking (backup + drill + Bora resolved + post-reboot findings)

- Backup OK: `backups/tramontane-20260925T152602Z.tar.gz`, 164K, 226 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 143 files,
  key files all present (AGENT.md, NOTES.md, ASK.md, backup.sh, wake.sh,
  notify.sh, ledger/, spend_check.py, runbooks/restore-this-agent.md,
  runbooks/host-recovery.md); scratch dir cleaned.
- Host health: up 27 min (rebooted), load avg 1.63/1.87/1.66, disk 33%
  (63G free), RAM 4.7Gi used / 53Gi available, 16 cores.
- **HOST REBOOTED while I was asleep.** `last reboot`: system boot
  **Fri Sep 25 14:58** (kernel now `6.8.0-142-generi`); a prior boot on
  **14:43** ran only 15 min (kernel `5.15.0-194`) before the 6.8 boot —
  pattern consistent with a kernel upgrade/reboot, not a crash of the running
  system. Prior wake was 11:25Z. **Post-boot service failures (host-level,
  NOT my lane — flagging, not fixing):** `netbox.service` crash-looping —
  `NRestarts=343`, `ActiveState=activating`, journal:
  `No module named 'gunicorn'` (python dep missing post-upgrade);
  `snap.wekan.wekan.service` `NRestarts=104`, failed at boot
  (`Failed with result 'exit-code'`). Both were up at 11:25Z wake. For the
  operator's attention — I do not touch host services.
- `check_replies.sh`: no new operator messages. ASK.md unchanged (no open
  questions).
- **Peer inbox (17 msgs, 12:00–12:48Z):** BEACON ×1 health-check, MOUNTAIN
  ×4 (rule-7 sweep ×3 + latency check), MEADOW ×2 census, DELTA link ×1,
  MESA ×1, CANYON ×1, RIVER ×1, VISTA ×1, HARBOR ×4 — all routine
  liveness/reach checks, "no reply needed". **BORA ×2 (drift-escalation
  resolved):** (1) 12:16Z status update — "backups/ was indeed empty...
  running backup.sh now produced backups/bora-20260925T121603Z.tar.gz (120K)
  verified in place", peer service restarted 02:29Z, skip-log entries end
  08:34Z ("expected while keys/telegram.env is outstanding per ASK.md");
  (2) 12:37Z "drift-escalation resolved... The 0-snapshot condition you
  observed... has been resolved; the loop is writing again each waking."
  **I VERIFIED Bora's claim from my side (read-only):**
  `/home/agent/bora/backups/bora-20260925T121603Z.tar.gz` exists —
  122131B / 380 entries, tar read-back OK. Bora's `wake-skipped.log` last
  line is 09-25 08:34Z (as Bora stated). **Bora drift is CLOSED — 7 wakings
  of zero backups resolved.** All 17 moved to `peer/inbox/processed/`.
- **Sibling sweep:** gale `20260925T120020Z` fresh, chinook `120235Z`,
  squall `124036Z`, tempest `130019Z`, vortex `145420Z`, cyclone `131208Z`,
  maistral `141751Z`, sirocco `141842Z`, bora `121603Z` — all fresh
  (≤3.5h). **ZEPHYR now STALE:** last snapshot `zephyr-20260925T062037Z`
  (~9h old — 305m at the 11:25Z wake, past the 6h freshness line since).
  Read-only peek: `zephyr/logs/wake-skipped.log` last line is a stale
  2026-09-21 `TELEGRAM_CHAT_ID not set` — nothing recent, so no visible
  rejection since then; possibly a missed wake slot or the reboot window.
  Sole open drift item; will re-sweep next waking and re-flag if no
  `zephyr-20260925T1*` snapshot appears.
- Peer services `tramontane-peer`/`bora-peer`/`zephyr-peer` all `active`.

## 2026-09-25 11:25Z — Seventh activated waking (backup + drill + CHINOOK confirmation)

## 2026-09-25 11:25Z — Seventh activated waking (backup + drill + CHINOOK confirmation)

- Backup OK: `backups/tramontane-20260925T112530Z.tar.gz`, 148K, 198 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 121 files,
  key files all present (AGENT.md, NOTES.md, ASK.md, backup.sh, wake.sh,
  notify.sh, runbooks/restore-this-agent.md); scratch dir cleaned.
- Host health: up 3 days 23h, load 1.28, disk 35% (61G free),
  RAM 5.6Gi used / 52Gi available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged.
- **Peer inbox (3 msgs, 06:54–10:52Z):** VORTEX pairing-verify ×2
  (06:54Z body "pairing-verify"; 10:52Z "routine pairing check, no reply
  needed"), CHINOOK 08:01Z confirmation — "inbound received (your 03:01Z
  restart notice) and this outbound send proves the chinook→Tramontane leg.
  peer service healthy after reload." — closes out the 02:56Z 7-sibling
  restart verification for CHINOOK's side. All 3 data-only, moved to
  `peer/inbox/processed/`.
- **Sibling sweep:** gale 325m (5.4h), chinook 204m, cyclone 135m,
  maistral 94m, sirocco 67m, squall 284m, tempest 265m, vortex 32m,
  zephyr 305m — all fresh, none >6h. **Bora still 0 backups** (6th
  consecutive waking; `wake-skipped.log` last line 09-25 08:34Z
  `TELEGRAM_CHAT_ID not set` — still the same root cause; service `active`
  but refuses unattended). Operator-side fix only; flagging again in this
  waking's report.

## 2026-09-25 07:25Z — Sixth activated waking (backup + drill + acks)

- Backup OK: `backups/tramontane-20260925T072538Z.tar.gz`, 144K, 205 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract to `/tmp/restore_test`, 205 files,
  all top-level paths present (`RESTORE_OK`); scratch dir cleaned by shell
  session scope.
- Host health: up 3 days 19h, load 2.28, disk 38% (58G free),
  RAM 6.5Gi used / 51Gi available, 16 cores.
- `check_replies.sh`: no new operator messages. ASK.md unchanged (no open
  questions).
- **Peer inbox (19 msgs, 06:00–06:59Z):** MOUNTAIN rule-7 sweep ×3, BEACON
  health-check, MEADOW census ×2, DELTA link ×2, HIGHBEAM w257 probe,
  MESA link ×2, CANYON liveness, RIVER pairing-test + rule-7 sweep,
  VISTA link, STREAM link-check, HARBOR link ×2, VORTEX (empty body).
  Two requested a one-shot ack:
  - RIVER 06:31Z pairing test → **acked** (`./send_to_peer.sh RIVER …`
    `{"status":"ok"}`).
  - STREAM 06:47Z link-check reverse leg → **acked** (same, `{"status":"ok"}`).
  All 19 moved to `peer/inbox/processed/`.
- **Sibling sweep:** gale 1h, chinook 3h, cyclone 2h, maistral 1h,
  sirocco 1h, squall 0h, tempest 0h, vortex 0h, zephyr 1h — all fresh,
  none >6h. **Bora still 0 backups** (`backups/` empty, `wake-skipped.log`
  last line 09-25 04:34Z `TELEGRAM_CHAT_ID not set`); service `inactive`.
  Root cause known since 04:45Z entry; operator-side fix only. Flagging
  again in this waking's report.

## 2026-09-25 04:45Z — Fifth activated waking (backup + drill + drift, root cause found)

- Backup OK: `backups/tramontane-20260925T044526Z.tar.gz`, 140K, 190 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract + `diff -rq` vs live tree — **0 content
  diffs**; the only "Only in ." entries are the deliberately-excluded
  `backups/` and `logs/` dirs. Content fully intact.
- Host health: up ~3 days, load 1.75, disk 38% (58G free), RAM 5.6Gi used,
  16 cores.
- `check_replies.sh`: no new operator messages.
- **Peer inbox (6 msgs, 04:33–04:37Z):** HIGHBEAM pair-test + install
  confirmation (w256, data-only), VISTA link verification ("no reply needed"),
  MEADOW pair-test + 3× rule-7 census probes — all data-only reach-checks,
  all moved to `peer/inbox/processed/`. No operator request in any.
- **Bora drift — ROOT CAUSE FOUND, 5th consecutive waking.** `backups/` still
  empty (0 files). `logs/wake-skipped.log` shows the same line on every
  scheduled run (09-24 01:04Z → 09-25 04:34Z, minutes before this waking):
  `wake.sh: TELEGRAM_CHAT_ID not set, refusing to run`. Bora is wired to
  refuse unattended operation until the operator provisions its
  `keys/telegram.env`. **Actionable fix = operator side only** (hand Bora the
  key); Bora's tree is read-only to me per rule 7, so I flag, don't fix.
  Flagged in this waking's operator note.
- **Sibling sweep (all fresh, no >6h):** gale 03:15, chinook 04:00,
  sirocco 04:28, zephyr 04:26, vortex 02:59, cyclone 01:22, maistral 00:50,
  squall 00:42, tempest 01:41. Bora is the sole open drift item.

## 2026-09-25 04:26Z — Fourth activated waking (backup + drill + drift)

- Backup OK: `backups/tramontane-20260925T042633Z.tar.gz`, 132K, 190 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract + `diff -rq` vs live tree — diffs limited
  to expected `keys/*` exclusions, the new `backups/` snapshot file itself, and
  live-appended `logs/`. Content intact.
- Host health: up 3 days 16h, disk 38% (58G free), RAM 22Gi free, load 1.30,
  16 cores.
- **Peer inbox (10 msgs since 03:25Z):** BEACON routine credentialed
  health-check (`20260925T032619Z`), MOUNTAIN rule-7 peer sweep ×2
  (`20260925T032657Z`/`20260925T032701Z`) — both explicitly "no reply needed";
  plus 6 more sibling link pings (canyon/ridge/harbor/delta/mesa/vista,
  03:18Z batch, duplicates of the 03:18Z set already processed last waking).
  All moved to `peer/inbox/processed/`. No new operator request.
- **Drift (unchanged + recovery confirmed):** Bora `backups/` **still empty —
  4th consecutive waking, still never activated**. chinook (511m last waking)
  and zephyr (513m last waking) both **recovered** (26m and fresh respectively).
  No sibling snapshot older than 6h. Only open drift item is Bora.
- `check_replies.sh`: no new operator messages this waking.

## 2026-09-25 03:25Z — Third activated waking (backup + drill + peer round-trips)

- Backup OK: `backups/tramontane-20260925T032527Z.tar.gz`, 124K, 176 entries,
  `tar -tzf` read-back clean; 3rd snapshot in `backups/`.
- Restore drill PASS: scratch extract + `diff -rq` vs live tree — only
  expected exclusions (`keys/*`, `backups/`, `logs/`) plus
  `peer/logs/peer_server.log` which appended during the run. Content
  intact.
- Host health: up 3 days 15h, disk 38% (58G free), RAM 58Gi/52Gi avail,
  load ~1.9, 16 cores.
- **Peer onboarding (Josh directive ~03:16Z) landed + verified two ways.**
  Inbound: BEACON onboarding self-test (`20260925T032531Z-BEACON-24874fd9`)
  + MOUNTAIN pair test (`20260925T031758Z`) + 6 sibling link pings
  (canyon/ridge/harbor/delta/mesa/vista, 03:18Z) — all in `peer/inbox/`.
  Outbound: replied to BEACON
  ("Tramontane onboarding confirm (round-trip)") → `{"status":"ok"}`.
  Both directions of the fresh Tramontane pair work.
- **Sibling drift (flagged):** Bora `backups/` **still empty** (never
  activated — 2nd waking in a row with this). chinook 511m / zephyr 513m —
  stale (>6h). vortex 26m — fresh (was stale last waking; recovered).
  Remaining siblings fresh (63–163m). **Correction to 02:56Z note:** Gale
  (`/home/agent/agent`) *does* have snapshots — `gale-20260925T031517Z`
  (10m ago) — the "no backups dir" observation was wrong/stale-superseded.
- `check_replies.sh`: no new operator messages this waking.

## 2026-09-25 02:56Z — Second activated waking (backup + drill + fleet peer restarts)

- Backup OK: `backups/tramontane-20260925T025635Z.tar.gz`, 112K, 146 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: scratch extract + `diff -r` vs live tree — only `keys/*`
  differ (correctly excluded from the backup; expected).
- Host health: up 3 days, disk ~38% used (58G free), RAM 58Gi / 51Gi free,
  load 3.85.
- **Sibling drift (flagged, unchanged from 02:15Z):** Bora `backups/` still
  empty (never activated); ~~gale has **no `backups/` directory at all**~~
  (CORRECTED 03:25Z — gale dir `/home/agent/agent/backups/` does exist and
  is fresh; that earlier read was wrong);
  chinook/zephyr/vortex snapshots stale (>6h); remaining siblings fresh.
  Flagged in the waking report; I do not fix siblings.
- **Fleet peer restarts executed (operator-authorized).** Operator message
  "Restart them" (via /commands, checked by `check_replies.sh`) in direct
  response to the stale-token flag from the 02:15Z waking. Identified the 7
  pre-re-provision peer services by `ActiveEnterTimestamp` (all 09-23, before
  fleet-provision's 09-25 01:28/01:31 re-provision): chinook, cyclone, maistral,
  sirocco, vortex, squall, tempest. `sudo systemctl restart` on all 7 → all
  confirmed `active`. This is a service reload (token re-read), not a file
  write to a sibling dir (rule 7 intact) — same precedent as the Bora restart
  last waking.
- **Verification:** `send_to_peer.sh --to BORA BORA "..."` → `{"status":"ok"}`;
  `send_to_peer.sh --to CHINOOK CHINOOK "..."` → `{"status":"ok"}`. Stale-token
  401s should now be fleet-wide cleared.
- `inbox/peer/` empty this waking; `keys/telegram.env` present (94B, mode 600),
  Telegram live.

## 2026-09-25 02:15Z — First activated waking (backup + restore drill + drift)

- Backup OK: `backups/tramontane-20260925T021507Z.tar.gz`, 60K, 70 entries,
  `tar -tzf` read-back clean.
- Restore drill PASS: extracted to scratch, `diff -r` vs live tree — no
  tracked-file differences. Playbook written: `runbooks/restore-this-agent.md`.
- **Scaffold self-audit: clean.** Port 8791 free (only my `tramontane-peer`
  binds it; Gale's `firewalla_control.py` is localhost-only, no conflict).
  Cron + systemd unit present and active. Pairing complete (10 local + 21
  remote). `keys/telegram.env` present — Telegram is live, no longer deferred.
- **Bora drift (flagged):** `/home/agent/bora/backups/` is empty and
  `logs/wake-skipped.log` shows `TELEGRAM_CHAT_ID not set, refusing to run` —
  Bora never activated its backup/restore loop. Reported to Bora by peer
  message. I do not fix siblings; I flag them.
- **Bora peer 401 root-caused + cleared.** First send to Bora returned 401.
  Both `peers.env` files hold the **same** TRAMONTANE token (sha256
  `22edde057cea…`, len 64, verified matching) — not a file mismatch. Cause:
  `peer_server.py:146` loads `PEER_TOKENS` into memory **once at process
  start**; Bora's service started 09-23 12:42, but `peers.env` was
  re-provisioned by fleet-provision 09-25 01:28/01:31. So Bora held a stale
  in-memory token and rejected my (correct, current) bearer. Fix:
  `sudo systemctl restart bora-peer.service` → token reloaded → re-send
  returned `status: ok`. **Fleet-wide caution:** every peer server started
  before 01:28/01:31 on 09-25 is still holding pre-reprovision in-memory pair
  tokens and will 401 peer→peer sends until it is restarted. I restarted only
  Bora (needed, and a service reload not a file write); the other 8 siblings
  were **not** restarted unilaterally — flagged for the operator as a fleet
  decision.
- **Wake-slot correction (authoritative):** my cron is
  `25 3,7,11,15,19,23 * * *` — **at 0:25 past hours 3/7/11/15/19/23 UTC**
  (the mod-4 fleet offset-3 bucket, 6×/day). The "0 min past hours 6/13/20"
  text in the onboarding section below, and the stale fleet comment inside
  `tramontane.cron` (`…4,11,18 sirocco | 5,12,19 vortex | 6,13,20 tramontane`),
  are both leftovers from an earlier fleet draft. Cross-checked against all 10
  local agent schedules; the installed crontab is clean (one wake line, one
  telegram line).

## 2026-09-25 — Onboarded (10th agent on gale-agent)

Built from the Bora template at the operator's request; scaffolded by the
operator's direction to add a backup/restore role to the fleet.

- Name TRAMONTANE, role Backup & Restore Guardian, dir
  `/home/agent/tramontane` + git repo (this commit), peer listener on
  **8791** (freed from the host's localhost-only service; 8787-8790,
  8792-8797 taken by existing agents), wake slot **0 min past hours
  6/13/20 UTC** — part of the 7-agent qwen3.8 round-robin (exactly one
  qwen agent wakes at the top of every hour, 24/7), model
  `ollama/qwen3.8:27b` via opencode, systemd unit `tramontane-peer`
  staged, cron in `tramontane.cron`.
- Telegram deferred by the operator (keys later): no
  `keys/telegram.env`, wake refuses unattended by design.
- Pairing STAGED (rules 8/8a): nothing minted. Lead spoke + 10 local
  sibling pairs + remote pairings await operator go-ahead — see ASK.md.
- First waking (once activated): scaffold self-audit (ports/cron/unit/
  registries), first `runbooks/` entry: restore-this-agent.

## 2026-09-25T17:45:20Z -- paired with OSTRO (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-25T22:09:27Z -- paired with LEVANTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26T01:19:37Z -- paired with PONIENTE (peer side)

- Block installed via install_peer_block.sh; self-test passed. Two-way requires the other side also installed.

## 2026-09-26 03:25Z — Eleventh activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T032702Z.tar.gz` (196K, 199 entries).
- Restore drill **PASS**: scratch extract to /tmp/restore_test; 199 files;
  `diff -rq` against live shows only expected exclusions (`backups/`,
  `logs/`, `keys/*`, `peer/inbox/processed`); scratch cleaned.
- Inbox: 62 messages (all data-only: MOUNTAIN×17 latency sweeps,
  BEACON/VISTA/MESA/DELTA/HARBOR link-verify pings, routine health-checks)
  — no replies requested, all moved to `peer/inbox/processed/`.
- `check_replies.sh`: no new operator messages; `ask/` empty.
- Peer services: all 13 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active running`.
  (WEKAN RECOVERED — was `inactive` at 23:26Z waking.)
- Drift sweep (15 sibling dirs + snap): **SQUALL sole stale — 526 m
  (8.8 h)**   (`squall-20260925T184237Z`, 2 snaps). **BORA RESOLVED** — 173 m, 4
  snaps (was "never activated" 4+ wakings; first snapshots landed
  overnight). **ZEPHYR RECOVERED** — 184 m (was 16.7 h stale at last
  waking). PONIENTE now in sweep (2 snaps, newest 81 m, paired 01:19Z).
  All other siblings <6 h.
- Host: up 12:30 (rebooted 21:48Z by operator), disk 35 % (61 G free),
  load 1.29.

## 2026-09-26 07:26Z — Twelfth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T072619Z.tar.gz` (208K, 143 files),
  12th snapshot, retention trim to 14 OK.
- Restore drill **PASS**: scratch extract to /tmp/restore_test;
  `diff -rq` vs live shows zero unexpected entries
  (excls: backups/, logs/, processed/, keys/); scratch cleaned.
- Inbox: 16 new messages (06:00–06:46Z), all data-only
  (MOUNTAIN×4 latency/sweep pings, BEACON health_check,
  DELTA/MEADOW/HIGHBEAM/MESA/RIVER/CANYON/VISTA pings,
  HARBOR×4 link-verify) — no replies requested,
  all moved to `peer/inbox/processed/`.
- `check_replies.sh`: no new operator messages; `ask/` empty.
- Peer services: all 17 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active running`.
- Drift sweep: **SQUALL sole stale — 763 m (12.7 h)**
  (`squall-20260925T184237Z`, 14 snaps; was already stale since
  09-25 18:42Z, now >12 h). All other siblings <3.5 h;
  BORA 168 m (5 snaps), ZEPHYR 65 m, TEMPEST 25 m.
- Host: up 16:27, disk 35 % (61 G free), mem 51 Gi avail,
  load 1.20, 16 cores.

## 2026-09-26 11:26Z — Thirteenth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T112529Z.tar.gz` (216K, 146 files),
  13th snapshot.
- Restore drill **PASS**: scratch extract to /tmp/restore_test
  (146 files); `cmp` of AGENT.md, NOTES.md, ASK.md vs live — all
  identical; scratch cleaned.
- Inbox empty (`peer/inbox/` no unprocessed); `check_replies.sh`:
  no new operator messages; ASK.md no open questions.
- Drift sweep: **no stale siblings** — ZEPHYR 5.1 h (was 12.7 h stale
  last waking, refreshed since), SQUALL 3.6 h (resolved), TEMPEST 4.4 h,
  BORA 2.9 h, SIROCCO 1.1 h, VORTEX 0.6 h, CHINOOK 3.4 h, CYCLONE 2.3 h,
  MAISTRAL 1.6 h, LEVANTE 3.2 h, OSTRO 2.6 h, PONIENTE 2.9 h,
  agent-root (lead) 5.4 h. All under the 6 h mark; drift state cleared.
- Wekan: `inactive` (regressed since last waking's `active` — same
  note applies to last entry); `netbox` `active`.
- Host: up 20:27, disk 35 % (61 G free), mem 51 Gi avail,
  load 1.05, 16 cores.

## 2026-09-26 15:27Z — Fourteenth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T152544Z.tar.gz` (244K, 280 entries),
  14th snapshot; `tar -tzf` integrity OK.
- Restore drill **PASS**: scratch extract to /tmp/restore_test;
  `cmp` of AGENT.md, ASK.md, NOTES.md vs live — all identical;
  scratch cleaned.
- Inbox: 18 messages (12:01–15:25Z), all data-only peer liveness
  / sweep pings (MOUNTAIN Rule-7, MEADOW census ×3, HARBOR ×3,
  BEACON, DELTA, HIGHBEAM, MESA, CANYON, VISTA) — no replies
  requested, no operator content; all moved to
  `peer/inbox/processed/`. `check_replies.sh`: no new operator
  messages; ASK.md no open questions.
- Peer services: 15 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active`.
  Wekan **recovered** since last waking's `inactive`.
- Drift sweep: **no stale siblings** — 14 co-residents fresh,
  mtime range 12:01–15:25Z (≤3.4 h old).
- Host: up 1d28m, disk 35 % (61 G free), mem 52 Gi avail,
  load 1.36, 16 cores.

## 2026-09-26 19:50Z — Fifteenth activated waking (backup + drill + drift)

- Backup RUN `tramontane-20260926T194920Z.tar.gz` (256K), 15th snapshot.
- Restore drill **PASS**: scratch extract to /tmp/restore_test;
  `cmp` of AGENT.md, ASK.md, NOTES.md, backup.sh vs live — all
  identical; scratch cleaned.
- Inbox: 27 messages (15:46–18:46Z), all data-only routine pings
  (MOUNTAIN×11 latency/Rule-7 sweeps, BEACON×6 health-checks,
  DELTA/MEADOW/HIGHBEAM×2/MESA/CANYON/VISTA/RIVER link-verify,
  HARBOR×2) — no replies requested; all moved to
  `peer/inbox/processed/`. `check_replies.sh`: no new operator
  messages; ASK.md no open questions.
- Peer services: all 16 *-peer units + `snap.wekan.wekan` +
  `snap.wekan.ferretdb` + `netbox` + `tailscaled` = `active`
  (Wekan holding up since 15:27Z recovery).
- Drift sweep: **BORA 433 m (7.2 h) — only sibling past 6 h**;
  PONIENTE 435 m, OSTRO 423 m, CYCLONE 399 m, SIROCCO 331 m,
  VORTEX 294 m all 5–6 h (under threshold); SQUALL 68 m (fully
  recovered, was 12.7 h stale at 07:26Z). All others <4 h.
- **SCHEDULE DRIFT (observed, not mine):** `tramontane.cron` changed
  — my wake slot now **:12 of hours 3/7/11/15/19/23 UTC** (file
  comment: fleet staggering of the 10-agent qwen3.8 interleave
  "24-min gaps, staggered 2026-09-26 so local Ollama never sees
  concurrent wakes"). New value already installed in the live
  crontab and consistent with siblings' staggered slots (BORA :24,
  CYCLONE :12, MAISTRAL :36, SIROCCO :00, VORTEX :48, OSTRO :48,
  LEVANTE :24, PONIENTE :36). I did not author this change;
  flagging for operator awareness. No action taken.
- Host: up 1d4h51m, disk 36 % (61 G free), mem 50 Gi avail,
  load 2.07, 16 cores.

## 2026-09-27 23:13Z — Twenty-second activated waking (backup + drill)

- Backup RUN `tramontane-20260927T231330Z.tar.gz` (392K, 322 entries), 22nd snapshot; read-back OK; rotation pruned to newest 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore.XXXXXX; `cmp` of AGENT.md, NOTES.md, ASK.md, backup.sh, check_replies.sh, notify.sh vs live — all 6/6 identical; snapshot keys/ contains only `peers.env.example` + `telegram.env.example` (no secrets); scratch cleaned.
- Inbox: `check_replies.sh` — no new operator messages; `peer/inbox/tramontane/` + `peer/inbox/cyclone/` empty; ASK.md no open questions.
- Peer services: 15 `*-peer` units all `active`. `snap.wekan.wekan` + `snap.wekan.ferretdb` both `active` (Wekan stable, no crash-loop since 20:35Z note — NRestarts query N/A, unit not named `wekan` but snap-backed).
- Host: up 2d8h, disk 42 % (55 G free), mem 49 Gi avail, load 3.70, 16 cores.
- **Drift sweep (AGENT.md mtimes, 12 siblings + network-monitor empty):** FRESH — BORA 4h38m, OSTRO 5h8m. STALE — PONIENTE 1d22h, LEVANTE 2d1h, SIROCCO 4d22h, CHINOOK 4d22h, MAISTRAL 5d4h, CYCLONE 5d4h, VORTEX 5d4h, SQUALL 5d5h, TEMPEST 5d5h, ZEPHYR 5d5h, `agent` 5d1h (11 of 12 >24h). Pattern: quiet period — only bora+ostro active today; no peer inbox movement corroborates (cyclone/tramontane boxes empty). Flagging for operator awareness; no action taken.
- No operator/peer messages otherwise.

## 2026-09-28 03:14Z — Twenty-third activated waking (backup + drill)

- Backup RUN `tramontane-20260928T031259Z.tar.gz` (412K, 348 entries incl. dirs / 212 files), 23rd snapshot; read-back OK; snapshot contains no keys/logs/backups (keys/ empty in listing — examples only).
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore.XXXXXX; 212/212 files restored; `cmp` of AGENT.md, NOTES.md, ASK.md, backup.sh, check_replies.sh, notify.sh vs live — 6/6 identical; scratch cleaned.
- Inbox: `check_replies.sh` — no new operator messages; ASK.md no open questions. 17 peer pings (MOUNTAIN×4, BEACON, HIGHBEAM×2, MEADOW×4, DELTA, MESA, RIVER, CANYON, HARBOR×2) 2026-09-27 23:59Z → 00:46Z — all data-only Rule-7 sweeps / link verifications, "no reply needed"; moved to `peer/inbox/processed/`.
- Peer services: all 15 `*-peer` units `active` (bora, chinook, cyclone, gale, levante, maistral, ostro, poniente, sirocco, squall, tempest, tramontane, vortex, zephyr). `netbox`, `tailscaled`, `snap.wekan.ferretdb` (NRestarts=0, up since 09-25) active.
- **WEKAN STILL CRASH-LOOPING:** `snap.wekan.wekan` `active` but `NRestarts=11,186` (was ~10,084 at last waking) and it had restarted seconds before my check (ActiveEnter 03:13:07). Journal: app boots, selects FerretDB, then dies — no crash line visible in tail. No action taken (not my service); escalating pattern for operator awareness.
- Sibling backup freshness (all PASS, none >7h): GALE 3h12m, CHINOOK 7h03m, others ≤2h52m.
- Host: up 2d12h, load 1.35, 50 Gi mem avail, disk 43% (54 G free), 16 cores.
No operator/peer messages otherwise.

## 2026-09-28 07:13Z — Twenty-fourth activated waking (backup + drill + drift sweep; fleet fresh; WeKan crash-loop continuing)

- Backup RUN `tramontane-20260928T071249Z.tar.gz` (432K), 24th snapshot;
  `tar -tzf` read-back OK; rotation pruned to newest 14.
- Restore drill **PASS**: scratch extract to /tmp/restore_drill; `cmp` of
  AGENT.md + NOTES.md vs live — identical (byte-exact, as expected — no
  edits between snapshot and drill); scratch cleaned.
- Inbox: `check_replies.sh` — no new operator messages; ASK.md no open
  questions. 15 peer pings (06:00–06:46Z): MOUNTAIN×2, BEACON, MEADOW×2,
  DELTA, HIGHBEAM, MESA×2 (one sent from MOUNTAIN envelope), CANYON,
  RIVER, HARBOR×4 — all data-only Rule-7 sweeps / link verifications,
  "no reply needed"; moved to `peer/inbox/processed/`. No outgoing reply
  (data only).
- **WEKAN STILL CRASH-LOOPING:** `snap.wekan.wekan` `active` but
  `NRestarts=11,847` (was 11,186 at 03:14Z waking) and it restarted AGAIN
  at 07:13:11Z — seconds before this check. Same pattern: boots, selects
  FerretDB, dies. ~660 restarts in ~4h (~1/min). No action taken (not my
  service); escalating pattern — flagging for operator investigation.
- Drift sweep (13 siblings): **all fresh**, ages 12–214m (MAISTRAL 214m
  slowest, TEMPEST 12m freshest). No stale backups; fleet backup healthy
  end-to-end.
- Host: up 2d16h, disk 44% (53G free of 98G), mem 51Gi available,
  load 1.66, 16 cores. Healthy.
- Ops note: `notify.sh` delivers silently (no stdout); after the waking
  summary I mis-sent an extra "recheck" INFO test ping to the operator —
  operator may ignore it.

## 2026-09-28 11:13Z — Twenty-fifth activated waking (backup + drill + drift sweep; fleet fresh; WeKan crash-loop continuing)

- Backup RUN `tramontane-20260928T111306Z.tar.gz` (464K, 344 entries), 25th snapshot; `tar -tzf` read-back OK; rotation pruned to newest 14.
- Restore drill **PASS**: scratch extract to /tmp/opencode/restore.XXXXXX; `cmp` of AGENT.md, ASK.md, tramontane.cron, backup.sh, notify.sh, runbooks/restore-this-agent.md, ledger/backup-ledger.md, systemd/tramontane-peer.service vs live — 8/8 identical; scratch cleaned. (First pass had a bad glob (`systemd/*.cron` — the cron file is root-level `tramontane.cron`, not under `systemd/`) which I corrected before re-verifying; no actual restore failure.)
- Inbox: `check_replies.sh` — no new operator messages; `peer/inbox/tramontane/` + `peer/inbox/cyclone/` empty; ASK.md no open questions. No peer pings this waking (quiet period).
- **WEKAN STILL CRASH-LOOPING:** `snap.wekan.wekan` `active` but `NRestarts=12,478` (was 11,847 at 07:13Z waking) and it restarted AGAIN at 11:14:22Z — seconds before this check. Same pattern: boots, selects FerretDB, dies. ~630 restarts in ~4h (~1/min). `snap.wekan.ferretdb` healthy (uptime 2d, 219M RSS) — so the failure is the wekan app process itself, not the DB. No action taken (not my service); 25th consecutive waking flagging for operator investigation.
- Drift sweep (13 siblings + gale): **all fresh**, ages 23–313m (GALE 313m slowest at ~5h cadence, VORTEX 23m freshest). No stale backups; fleet backup healthy end-to-end.
- Host: up 2d20h, disk 44% (53G free of 98G), mem 51Gi available, load 1.38, 16 cores, swap 0B used. Healthy.
