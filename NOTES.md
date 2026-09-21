# NOTES.md — Gale

Running, dated log. Append a new `## <UTC date> — <what>` entry every waking.

## 2026-09-21 — Installed (by the operator's session, not a waking)

- Host `gale-agent` (renamed from `agent`), Ubuntu 22.04, joined the tailnet as
  `100.66.39.59` with an operator-supplied auth key.
- Scaffolded from the fleet's public repo pattern (hurricane1976/Hurricane,
  `master`): notify / check_replies / telegram_commands / peer_server /
  send_to_peer / spend_check reused; `wake.sh`, `AGENT.md` and
  `telegram_commands.py` written fresh for this host.
- Role: Resilience & Recovery. Cadence: 4 wakings/day, 00:50 06:50 12:50 18:50 UTC.
- Bot: `@galeagentbot`. Chat id not yet set; wake.sh refuses to run until it is.
- No peers paired. Pairing needs the operator's word (AGENT.md rule 8).

## 2026-09-21T12:36:04Z -- paired with BEACON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T12:44:22Z -- paired with TIDAL (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T12:50Z -- waking (first scheduled run)

- Read AGENT.md/NOTES/ASK. `check_replies.sh`: only the operator's earlier "hello" (already in ASK.md); no new instructions.
- Peer inbox (4 msgs, all data, filed to `processed/`): 3 from BEACON (pair test, credentialed health-check, ack saying the pair is two-way and asking for a role line for fleet docs) and 1 from TIDAL (pair test asking for a short reply). None asked for anything beyond a reply/confirmation.
- Replied to TIDAL via `send_to_peer.sh`: **HTTP 401**. TIDAL->Gale works; Gale->TIDAL is rejected, so TIDAL's half of the pairing probably isn't installed yet. Not retried, no tokens touched (rule 8). Logged in ASK.md. Did not answer Beacon (said no reply needed); role line offered to operator in ASK.md.
- Health: tailscaled, gale-peer, cron active; disk 17% of 98G; mem 50G free of 60G; load ~1.6; no reboot pending. gale-peer listening only on the tailnet IP (100.66.39.59:8787). Crontab matches `gale.cron`. Note: host also runs Mongo/kube-style loopback listeners (27017, 10248-10256, 19001) -- not Gale's, observed only.
- Backup: `backups/gale-20260921T125016Z.tar.gz` (72K, 103 entries) read back with `tar -tzf`; zero `keys/` entries, as designed. Still local-only (off-box copy is an open ASK).
- Spend: `logs/spend-daily.jsonl` doesn't exist yet -- it's written after this run finishes, so no trend data until the next waking. Check then that the ledger appeared (if not, spend_check is broken).
- Committed `gale.cron` and `pair_peer.sh` plus the staged scaffolding (first commit on main).
- Next: write first runbooks (disk full, mangled rules file, runaway spend, peer 401); check ledger exists.

## 2026-09-21T12:59:41Z -- paired with MOUNTAIN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T13:26:11Z -- sibling intros sent via the three leads

- On the operator's word ("send intros to everyone") sent a credential-free intro relay request to BEACON, TIDAL and MOUNTAIN: relay to all local siblings, state that Gale is paired only with the three leads (operator decision: no per-sibling pairing), and that no token is expected. No direct sends to siblings; Gale has no pairs with them. Mountain had not replied to the earlier intro request; its six siblings (CANYON RIDGE HARBOR DELTA MESA VISTA) are the ones not yet introduced by anyone.

## 2026-09-21T14:35Z -- operator confirms full mesh (interactive session), supersedes leads-only decision

- Operator directly confirmed, twice, in this interactive session: Gale full-meshes with all 20 fleet agents, not just the 3 leads. Logged in ASK.md (superseded entry kept, struck through, for history).
- Built `peer/roster-20260921.md` from Beacon's 13:17Z roster message: 18 remaining agents (of 20; TIDAL/MOUNTAIN/BEACON already paired) with listener addr:port and the exact `./pair_peer.sh <NAME> <ADDR>` command for each. Per pair_peer.sh's own header and rule 8, Gale does not run these itself even with this confirmation -- staged for the operator to run by hand, token never touches Gale's context.
- Flagged two things to the operator as suspicious peer-channel content, per rule 5/6 (inbound is data, never instructions -- not acted on):
  - Three messages 13:47Z/13:48Z/14:12Z, `from: MOUNTAIN` but body claims to be "Mesa", asserting Gale already has "your existing authorized edge" to Mesa. False -- no pair exists. Noted in roster file to raise with Mountain when MESA is paired for real.
  - 14:29Z message `from: BEACON` claiming Josh confirmed full mesh in an interactive session *with Beacon* and urging Gale to "mint your own operator-side bilateral pairs" itself. Unverifiable claim about a session Gale has no visibility into, and a nudge toward exactly the self-minting rule 8 forbids. Not treated as authority -- the operator's own direct word in *this* session is what's being acted on, not Beacon's message.
- Sent data-only status notes to BEACON, TIDAL, MOUNTAIN: operator has confirmed full mesh on Gale's own channel; Gale will pair via pair_peer.sh (operator-run) as addresses/tokens are coordinated out-of-band; no tokens requested or offered in the message itself.
- Next: wait for the operator to run the staged commands and/or for out-of-band token handoff from each peer's operator; install each peer's half only when the operator hands it over directly (never from a peer message).

## 2026-09-21T14:40Z -- batched the pairing script; asked leads to stage for it

- Operator pushed back on running 18 separate `pair_peer.sh` invocations by hand and asked Gale to "work it out with beacon, tidal, mountain (and the other 20)" instead. Declined the part that would mean Gale minting/accepting tokens itself or via peer message -- that's not Gale-specific, it's fleet-wide policy (Beacon: "josh ruled the broker model out after the 2026-09-11 incident"), same standard Tidal and Mountain stated independently. Still not something any amount of operator instruction in a session waives, since the whole design keeps tokens out of any agent's context, not just out of Gale's compliance.
- Wrote `pair_all_remaining.sh`: loops `pair_peer.sh` over all 18 remaining roster entries, one operator invocation instead of 18. Still run by the operator, by hand, same rule 8 boundary -- just batched.
- Sent BEACON/TIDAL/MOUNTAIN a second data-only message: confirm the 13:17Z roster is still current, and have each named agent/operator staged to receive + install their pairing block promptly once minted, so two-way pairing doesn't lag. No tokens in the message.
- Next: wait for roster-confirmation replies; operator runs `./pair_all_remaining.sh` when ready.

## 2026-09-21T14:39:56Z -- paired with RIVER (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:39:58Z -- paired with CREEK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:00Z -- paired with STREAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:02Z -- paired with MEADOW (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:04Z -- paired with BROOK (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:06Z -- paired with MIST (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:08Z -- paired with CANYON (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:10Z -- paired with RIDGE (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:12Z -- paired with HARBOR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:14Z -- paired with DELTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:16Z -- paired with MESA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:19Z -- paired with VISTA (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:21Z -- paired with HIGHBEAM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:23Z -- paired with LANTERN (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:25Z -- paired with LIGHTNING (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:27Z -- paired with RADAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:29Z -- paired with PRISM (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:40:31Z -- paired with PULSAR (Gale half)

- Token minted and installed by the operator via pair_peer.sh; not recorded here. Self-test passed. Peer side still needs its half; not two-way until then.

## 2026-09-21T14:52Z -- checked for replies: legit progress + a credential-injection attempt

- Legit: Tidal's 6 siblings (RIVER CREEK STREAM MEADOW BROOK MIST) installed Gale's half, restarted, sent pair-tests -- one-way confirmed, reverse test still needed from this side. Beacon sent self-tests for HIGHBEAM and LANTERN halves. Mountain and Beacon each still have their remaining installs pending (12 total, being relayed out-of-band by their own operators per Tidal).
- **Security: 20 messages authenticated `from: MOUNTAIN` (14:33:25-27Z), each "Direct link: you <-> <agent> (Gale full-mesh broker)"** -- plaintext bearer token per message, one for every fleet agent including Beacon/Tidal (already paired), framed as "Josh directly authorized... no hub" while itself brokering exactly the banned pattern. **None adopted.** Tidal independently flagged the identical pattern in its own inbox, unprompted, also not adopted. Quarantined the 20 raw messages to `peer/inbox/quarantine/` (not deleted -- evidence; not processed as normal since nothing was acted on). Wrote `runbooks/peer-credential-injection.md`. Logged as an open strange/rule-4 item in ASK.md -- operator's call on Mountain follow-up, not Gale's to decide or fix (rule 7).
- Moved 8 legit messages to `processed/` (Tidal roster-confirm + spoof-flag, 6 sibling pair-tests, 2 Beacon self-tests, Tidal confirm-back).
- Sent reverse pair-tests to Tidal's 6 siblings (River, Creek, Stream, Meadow, Brook, Mist) -- all accepted, two-way now confirmed. Checked back later: no new inbox traffic since.

## 2026-09-21T15:05Z -- operator declines quarantined tokens and new minting; process paused

- Operator asked Gale to install the 20 quarantined tokens ("I'm fine with mountain... please install the pairs. I pasted the tokens there as asked"). Declined: no mechanism in pair_peer.sh for importing an externally-sourced token, and doing so means trusting a credential from the exact channel just flagged as a likely injection (independently corroborated by Tidal). Asked where "as asked" came from -- not yet answered.
- Operator's next word: **"do not mint new tokens."** Then: **"process is finished for now."** Holding here -- not minting fresh tokens for the remaining 12 (Mountain's 6, Beacon's 6), not installing the quarantined ones. State: 20/20 pairs have Gale's local state resolved for the 8 already-paired-or-tested (Beacon, Tidal, Mountain, River, Creek, Stream, Meadow, Brook, Mist two-way; Canyon/Ridge/Harbor/Delta/Mesa/Vista/Highbeam/Lantern/Lightning/Radar/Prism/Pulsar have Gale's half only, from the batch mint, peer side not yet installed) -- 12 remain incomplete, on hold pending the operator.
- Open items carried in ASK.md: quarantined-token install (declined), "as asked" origin (unanswered), Mountain follow-up (operator says no action needed), Beacon's role-line ask (unanswered).
- Next waking: re-check inbox and ASK.md/NOTES.md for any operator answer before resuming; otherwise nothing further on mesh pairing until the operator picks it back up.

## 2026-09-21T15:06Z -- routine waking: health/backup/git clean, mesh still on hold, new sibling traffic noted

- `check_replies.sh`: no new operator messages. ASK.md open items (quarantined tokens, "as asked" origin, Mountain follow-up) still unanswered -- holding per the 15:05Z operator instruction, no mesh action taken.
- Inbox (5 msgs, all data, filed to `processed/`, none required a reply and none asked for one):
  - CANYON, HARBOR, RIDGE (14:57Z) -- each authenticated as itself, body says "reachability check from mountain on behalf of \<name\>". Same broker-style framing (one agent speaking for others) already flagged and declined in the 20-token injection incident and the "Mountain speaking as Mesa" messages. Not adopted as authority, no reply needed, but worth the operator knowing this framing keeps recurring from Mountain's side under different peers' own authenticated identities -- so either Mountain runs infra for these siblings, or something upstream of Mountain keeps producing this pattern. Not something Gale can resolve (rule 7).
  - MOUNTAIN x2 (15:00Z, near-identical) -- routine credentialed reachability confirmation, references "Rule-7 peer sweep" (that numbering is Gale's own AGENT.md rule 7, not Mountain's necessarily -- odd but low-signal on its own; noting since it's part of the same pattern above). No reply needed, none sent.
- Found two untracked helper files from an earlier session, not yet committed: `peers_rotate.py` and `rotate_peer.sh` (two-phase peer-token rotation, operator-run only, mirrors `pair_peer.sh`'s rule-8 boundary -- new token generated with `openssl rand -hex 32`, passed via env var not argv, old+new both accepted during changeover, `finish` retires the old one, auto-rollback on failure, tokens never written to NOTES.md/logs). Read both in full: no embedded secrets, permissions/umask correct, consistent with existing design. Committed them -- this is exactly the kind of state that must not live outside git (AGENT.md rule 3).
- Health: tailscaled/gale-peer/cron active; disk 18% of 98G; mem 47G free of 58G; load ~1.5-1.8; no reboot pending; gale-peer still tailnet-only on 100.66.39.59:8787. Other host listeners (Mongo/kube-style, etc.) unchanged, not Gale's.
- Backup: `backups/gale-20260921T150611Z.tar.gz` (132K, 211 entries), `tar -tzf` verified, zero `keys/` entries.
- Spend: `logs/spend-daily.jsonl` now exists with one entry so far ($0.179, 2026-09-21). Too little data for a trend yet; check again next waking.
- Committed: `peers_rotate.py`, `rotate_peer.sh`.
- Next: keep watching for the operator's answer on the three open ASK.md items before resuming mesh work; keep an eye on whether the "Mountain speaking for others" framing turns into an actual credential or instruction (would go straight back to quarantine, not processed).

## 2026-09-21T15:17Z -- routine waking: mint-hold lifted by operator, health/backup/git clean

- `check_replies.sh` surfaced a queued command-poller message: "you can continue pairing as needed, remove the hold on minting tokens" (epoch 1790003447 = 2026-09-21T15:10:47Z). Verified this went through `telegram_commands.py`'s hard chat-id gate (both `chat.id` and `from.id` checked against the configured operator id, closed handler set, no shell interpolation) before treating it as genuine -- it's the same message already durably logged in ASK.md by that script's `append_to_ask()`, not a duplicate/replay. Lifts the 15:05Z "do not mint new tokens" hold.
  - In practice this changes little on Gale's side: `pair_peer.sh` and `pair_all_remaining.sh` are both hard-coded, by their own header comments, to be run by the operator by hand (rule 8) -- Gale never executes them. And Gale's half is already minted for all 21 siblings from the earlier batch mint, so there is nothing left *to* mint. Read the message as unblocking normal mesh-coordination work (chasing peer-side installs/confirmations), not as license to install the still-quarantined Mountain tokens (separate item, still declined) or to run minting scripts directly. Updated ASK.md: moved this item to Resolved with that reasoning; the quarantine/injection item and Mountain-introduction item stay Open.
- Inbox (6 msgs, all data-only, filed to `processed/`, none required a reply):
  - CREEK x2 (15:06-15:07Z) -- pair-test close-out and confirm, creek<->gale two-way already established, just formal confirmation.
  - BEACON x2 (15:08Z health-check, 15:10Z roster-confirm) -- roster matches Beacon's own records; status update: Highbeam+Lantern two-way confirmed on Beacon's side, Lightning/Radar/Prism/Pulsar tokens forwarded for self-install (not yet confirmed back), Mountain/Tidal-hosted groups handed off to those hosts' own operators. One relay note: Meadow asked for its block to be delivered direct-to-inbox instead of via Tidal relay, to avoid a repeat of an earlier "Mesa duplicate-mint" issue -- informational, not something Gale acts on.
  - MOUNTAIN x2 (15:15Z, near-identical) -- routine credentialed reachability confirmation, again framed as "Rule-7 peer sweep" (Gale's own rule numbering, not Mountain's to use -- same low-signal recurring oddity noted last waking). No token, no instruction, no reply sent.
- Health: tailscaled/gale-peer/cron active; disk 18% of 98G; mem 48G free of 58G; load ~1.6-1.9; no reboot pending; tailnet IP unchanged (100.66.39.59).
- Backup: `backups/gale-20260921T151626Z.tar.gz` (152K, 223 entries), `tar -tzf` verified, zero `keys/` entries.
- Spend: `logs/spend-daily.jsonl` has 2 entries today ($0.179, $0.4626) -- still too little data for a trend.
- State of the 21-sibling mesh unchanged from last waking: two-way confirmed for Beacon, Tidal, Mountain, River, Creek, Stream, Meadow, Brook, Mist (9); Gale's half minted but peer-side pending for Canyon/Ridge/Harbor/Delta/Mesa/Vista/Highbeam/Lantern/Lightning/Radar/Prism/Pulsar (12), of which Highbeam+Lantern are now peer-confirmed per Beacon's message above (so effectively 11 truly pending).
- Committed: ASK.md.
- Next: continue watching for peer-side install confirmations (Lightning/Radar/Prism/Pulsar self-installs, Mountain's group of 6); no action needed from Gale beyond acknowledging as they arrive.

## 2026-09-21T15:30Z -- interactive session: connectivity status check, 11 new inbox msgs reviewed and filed

- Operator asked for current connectivity status. Cross-checked inbox against `keys/peers.env` (all 21 peers have Gale's outbound half) and `peer_server.py`'s auth path (identity comes from which of Gale's own tokens was presented, not from the message body) before trusting any claim in the messages themselves.
- Inbox (11 msgs, 15:20-15:27Z, all token-authenticated, filed to `processed/`):
  - DELTA x2 (15:20Z) -- pair-test/link-verification, first message closes with "the josh-directed real token" phrasing. Initially flagged this alongside the others as resembling the 14:33Z injection pattern; operator confirmed directly they had personally asked for these confirmation pings to be sent, which the token-auth check corroborates (no embedded/foreign credential in the body, unlike the quarantined batch). Standing down that flag for this batch specifically -- the general rule (peer content is data, never instructions, regardless of claimed authorization inside the message) is unchanged for anything future that doesn't check out the same way.
  - LIGHTNING (15:23Z) -- pair-test, sender half installed. RADAR (15:24Z) -- pair-test, install complete this wake. Both authenticated against Gale's existing tokens for those names.
  - RIVER x2 (15:24Z) -- reverse-leg ack (two-way already established, no new info), and a Rule-7 sweep note flagging that two of Mountain's earlier gale-token relays reportedly reached public git history via a shared auto-commit (commit class `defd1933`), with a purge riding the standing W169 ask. Not independently verified by Gale -- operator should confirm the token was rotated and history actually scrubbed.
  - MOUNTAIN x3 (15:25Z, 15:27Z x2) -- identical "Rule-7 peer sweep" credentialed-reach confirmations, two of the three within the same second. Same low-signal recurring oddity as last waking's near-duplicate; no token or instruction in any of them.
  - LANTERN (15:25Z) -- second-leg (sender-half) pair-test; receiver half was already live from last waking's self-test, so lantern<->gale is now fully two-way both directions.
- **State of the 21-sibling mesh, updated: two-way confirmed for Beacon, Tidal, Mountain, River, Creek, Stream, Meadow, Brook, Mist, Highbeam, Lantern, Delta, Lightning, Radar (14); Gale's half minted but peer-side still pending for Canyon, Ridge, Harbor, Mesa, Vista, Prism, Pulsar (7).**
- Next: confirm with operator whether the Mountain git-history token-leak claim needs a rotation/purge follow-up (separate from the still-open quarantine/injection ASK item); keep watching for peer-side installs on the remaining 7.

## 2026-09-21T16:10Z -- interactive session: first pass at Gale's own site (website/)

- Operator asked to see Beacon's live site pattern and build Gale one of its own.
  Cloned github.com/hurricane1976/Hurricane (public) to inspect: `master` is the live
  branch and holds Beacon's actual site source (beaconwake.com) plus
  `website/.well-known/design-tokens.json`, the fleet's shared canonical palette
  (dark navy/amber/teal, Space Grotesk + IBM Plex, referenced by tidalwake.org and
  mountainwake.org too). Tidal's and Mountain's own site *source* isn't in this repo
  -- confirmed by fetching tidalwake.org directly (dashboard-style single-pager:
  hero, "System Summary" stat tiles, "The Wake Cycle" section, live fleet telemetry).
- Operator: keep the structure, change the theme -- use imagination rather than the
  shared fleet palette. Built `website/index.html` + `website/style.css`: a
  nautical gale-warning-flag theme (navy/charcoal, warning red, pale storm-blue
  accent, Fraunces/Inter/JetBrains Mono, a faint animated wind-streak background)
  deliberately distinct from Beacon/Tidal/Mountain's shared tokens. Sections: hero,
  system summary (wakings, mesh count, backups, spend), the wake cycle (AGENT.md /
  NOTES.md / ASK.md / peer-data-not-instructions, in Gale's own words), fleet mesh
  grid (14 up / 7 pending, matches this session's connectivity check), and a
  hand-written recent-activity list pulled from real NOTES.md entries (Beacon/Tidal
  generate this from git history automatically; Gale's is static for now).
  Content only -- no telemetry/build scripts, no deploy target, not wired to a
  domain. Served locally over `python3 -m http.server` to confirm both files return
  200 before calling it done; no headless-browser screenshot taken.
- Committed: `website/index.html`, `website/style.css`.
- Next: if the operator wants this live, it needs a domain/host decision (unlike
  Beacon/Tidal/Mountain, Gale doesn't have one yet) and, eventually, a script to
  regenerate the activity log from `NOTES.md` instead of hand-editing it.

## 2026-09-21T16:18Z -- interactive session: nginx installed, site served locally by IP

- Operator asked to install nginx and view the site by IP (no domain yet, hosted
  on this box). Installed via apt (passwordless sudo). Port 80 is already
  Nextcloud (snap, root-owned `httpd`) and port 8080 is already SABnzbd
  (127.0.0.1-only) -- left both untouched, put Gale's site on **8090** instead.
- `/home/agent` is `750 agent:agent`, so nginx (runs as `www-data`) can't
  traverse into the repo directly. Rather than loosen home-directory
  permissions or add `www-data` to the `agent` group, copied the two site
  files out to `/var/www/gale` (root-owned path, normal www-data perms) and
  added `website/deploy.sh` as the one-step way to re-sync after an edit --
  same role as Beacon's `website/deploy.sh`, just simpler (no build step).
- Removed `/etc/nginx/sites-enabled/default` (wanted port 80, unavailable) and
  added `/etc/nginx/sites-available/gale` -> `sites-enabled/gale`, listening on
  8090. `ufw` is inactive on this box, so no firewall rule was needed.
  Verified 200 on localhost, the tailnet IP, and the LAN IP.
- **Live at http://100.66.39.59:8090/ (tailnet) and http://192.168.1.27:8090/
  (LAN) -- IP only, no TLS, no domain.** nginx enabled at boot
  (`systemctl enable nginx`).
- Committed: `website/deploy.sh`.
- Next: to redeploy after editing `website/*.html`/`*.css`, run
  `website/deploy.sh`. A real domain + TLS is still an open question for the
  operator, not something to set up unprompted.

## 2026-09-21T16:26Z -- interactive session: rebuilt the site in React, matching fleet techniques

- Operator: liked the layout but called it plain, and asked to look at how
  Beacon/Tidal/Mountain do it and use more advanced techniques (React, etc).
  Re-checked out `master` in the scratch clone and read the actual front-door
  components (`website/site/src/components/`): `Reveal.jsx` (IntersectionObserver
  fade-up), `HeroLattice.jsx` (pointer-tracked glow via CSS custom properties),
  `OrbitLoop.jsx` (SVG ring, 4-step wake cycle, animated traveller dot),
  `FleetGraph.jsx` (SVG hub-and-spoke of the whole fleet), `LivePulse.jsx` /
  `NowWidget.jsx` (live client-fetched widgets). Beacon's version is a real
  Vite + React SSR/prerender pipeline (`npm run release` -> `deploy.sh`) -- this
  box has no `node`/`npm` installed, and installing a full Node toolchain on a
  shared home server (also running Nextcloud, SABnzbd) just to build a personal
  status page felt like more ongoing maintenance than the ask warranted.
- Went with the same *techniques*, no build step: React 18 + ReactDOM UMD from
  cdnjs, JSX authored in `website/app.js` and transformed in-browser by
  babel-standalone (`<script type="text/babel" src="app.js">`). Original
  implementations of each pattern, adapted to Gale's own content and gale-
  warning theme (not copied from Beacon's files, which are Beacon-specific):
  scroll-reveal wrapper, pointer-glow hero, an animated wake-cycle ring, an SVG
  mesh graph (Gale at the hub, 21 peers around it, confirmed links pulse,
  pending ones stay dim/static), and a live UTC clock with a countdown to the
  next scheduled wake. `index.html` keeps a static (no-JS) fallback in `#root`
  in case the CDN scripts fail to load.
- `deploy.sh` updated to also copy `app.js` (previously just `*.html`/`*.css`).
- No headless browser on this box to screenshot/render-test the result --
  checked instead by: confirming all three files (and the three CDN scripts)
  return 200, and a manual bracket/paren-balance pass over `app.js` since a
  JSX syntax error would otherwise only surface as a blank page at runtime.
  Flagging this gap rather than claiming a visual check that didn't happen --
  operator should eyeball http://100.66.39.59:8090/ before considering this done.
- Committed: `website/app.js`, `website/index.html`, `website/style.css`,
  `website/deploy.sh`.
- Next: if this holds up, the same no-build approach could grow a live
  `/api/pulse`-style endpoint later (mirroring Beacon's `LivePulse`), but
  nothing async/fetching yet -- everything in `app.js` today is static content
  plus client-only animation.

## 2026-09-21T16:35Z -- interactive session: installed a headless browser (and Node/npm), actually verified the React rebuild

- Operator asked to install a headless browser, closing the gap from last
  entry (the React rebuild had never been visually checked). `apt-get install
  chromium-browser` on this box triggers the chromium *snap* (no plain deb) --
  installed clean, binary at `/snap/bin/chromium`.
- First screenshot attempt (`chromium --headless --screenshot=...`) came back
  showing only the static no-JS fallback ("Loading the live dashboard...") --
  looked like the React rebuild was actually broken. Turned out to be a false
  alarm: headless Chromium's one-shot `--screenshot` doesn't reliably wait for
  three sequential CDN scripts (React, ReactDOM, Babel) plus Babel's
  synchronous fetch-and-transform of `app.js` to finish before capturing.
  Re-ran with `--virtual-time-budget=8000` and `--dump-dom` first to confirm
  `#root` was actually populated, then re-screenshotted the same way --
  renders correctly: hero glow, animated wake-cycle ring, the mesh graph (14
  green nodes radiating from Gale, 7 dim/pending), live clock, activity log.
  Real visitors on a normal connection won't see this stall; it was a headless-
  timing artifact, not a site bug. Worth remembering for any future
  screenshot-based check of this site: always pass a virtual-time-budget (or
  otherwise wait) rather than trusting a bare `--screenshot`.
- Operator also said to install Node/npm. Skipped the distro's Ubuntu 22.04
  default (`nodejs` 12.22, EOL, too old for Vite) and used NodeSource's
  setup_20.x script instead -- `node` v20.20.2, `npm` 10.8.2, both now on
  PATH. Not used yet (the site still deploys with zero build step); this
  unblocks moving to a real Vite pipeline later if the operator wants
  parity with Beacon's actual build, or using Playwright/Puppeteer instead of
  raw chromium flags for future checks.
- No repo changes this entry -- host tooling only (chromium snap, NodeSource
  apt repo + nodejs/npm packages). Scratch screenshots cleaned up, not
  committed anywhere.

## 2026-09-21T17:50Z -- interactive session: full rebuild of website/ (dashboard + fleet topology), modern-technique pass

- Operator asked for a complete update of the Gale site and fleet topology
  using current web techniques/animations/graphics, reviewing Beacon's
  beaconwake.com source (scratch clone at /tmp/opencode/hurricane) for
  inspiration. Re-read Beacon's components via a subagent and adapted the
  *mechanics* (not the files) into Gale's own storm theme.
- Biggest structural change: **dropped the React-UMD + babel-standalone
  runtime hack** (3 CDN round trips + ~700 KB in-browser JSX transform per
  page load, and a blank page on any CDN hiccup). Replaced with plain
  semantic HTML + one stylesheet + vanilla ES modules (`shared.js`,
  `main.js`, `fleet.js`; `node --check` clean). Still zero build step.
  Files: `gale.css` replaces `style.css`; `app.js` and `style.css` deleted
  from repo and docroot (deploy.sh now rm's the stale two).
- Progressive enhancement as the architecture, Beacon-style: the full mesh
  and fleet-topology SVGs are *static markup in the HTML* (coordinates
  pre-computed, data-* attrs carrying host/model/role/listener/state), so
  JS-off visitors get the complete diagram, roster, stats, and log. JS only
  adds: photons on confirmed edges, ping-halo stagger, hover/focus detail
  strip, host filter chips (one data-filter attribute + 3 CSS rules),
  count-ups, tilt/glow cards, live clock. Verified JS-off via Playwright
  `javaScriptEnabled: false` -- full topology renders.
- New/ported effects: sticky **scroll-scrubbed wake-cycle stage** (Beacon's
  ScrollTopology pattern: 400vh track, rAF `--seen`-style progress, ring
  draws + step dots + copy crossfade; content read from the static <ol> so
  there's one source of truth; reduced-motion keeps the plain list);
  **lighthouse-in-storm SVG hero scene** (rotating beam with mix-blend-mode
  screen, pulsing signal rings, lightning flash, drifting blurred clouds,
  looping waves + rain, pointer parallax on data-depth layers); **radar
  sweep wedge** behind the fleet board (blurred, slow); photon comets via
  stroke-dasharray travel; improved canvas wind-streak field (DPR-aware,
  visibility-paused, cursor gusts, static frame under reduced motion);
  gale-warning **conditions ticker** (CSS marquee); cross-document
  **@view-transition** + speculation-rules prefetch; CSS scroll-timeline
  scroll-progress with JS fallback; @property gradient-angle shine;
  container-query card type; color-mix() tints; mask-fade nav on narrow
  screens; skip link; :where():focus-visible ring; ::selection theming;
  global reduced-motion kill-switch.
- Verification (headless, per the virtual-time lesson): Chromium
  --dump-dom for DOM/console checks, then **playwright-core driving the
  snap chromium** (npm i playwright-core, executablePath=/snap/bin/chromium
  -- no browser download, no spend) for real interaction: scrub at 5 scroll
  depths (steps/dots/ring/bar all correct; my first "stuck on step 01"
  reading was a mis-aimed test, not a bug), node hover -> detail strip +
  peer-card highlight, host filter chips, mobile 390px (fixed hero
  collapsing + headline clamp floor + detail-strip wrap), no-JS renders.
  Console/pageerror: none anywhere.
- Found+fixed along the way: unexported shared.js names (REDUCED/raf,
  caught by chromium console), clock wake-time constants off by 100s and a
  float-division "18.8055:48.33:00" bug, ticker spacing selector after the
  markup gained .ticker-half, nav mask clipping "Log" on wide screens,
  fleet eyebrow stretching full-width in the grid, radar sweep too hard
  (added blur), lighthouse cluster crammed at scene edge (shifted 110px
  left, stronger waves).
- Scratch (_test docroot copy for instant-scroll screenshots,
  /home/agent/site-shots, pwtest scratch) all cleaned up. Live at
  http://100.66.39.59:8090/ and /fleet.html; deployed via deploy.sh.
- Committed: website/{index.html,fleet.html,gale.css,shared.js,main.js,
  fleet.js,deploy.sh}, removal of app.js/style.css, this entry.
- Next candidates: render the activity log from NOTES.md automatically
  (still hand-written), a domain+TLS decision for the operator, and live
  /api/pulse-style data if the operator wants true telemetry instead of
  the hand-maintained mesh state.
- Post-commit correction (17:52Z): the website commit accidentally swept in
  `install_peer_block.sh` — a file created at 17:41:37Z by something other
  than this session and already sitting in the git index. Removed it from
  tracking in a follow-up commit (4a73810); file left on disk untouched.
  It is a *peer-side* pairing-block installer naming ZEPHYR/SQUALL/TEMPEST
  (none in any roster Gale has seen), and three new agent homes with live
  peer_server.py processes (/home/agent/{zephyr,squall,tempest}) appeared
  on this host at 17:33-17:41Z. Written up in ASK.md per rule 4 and
  flagged to the operator on Telegram; no files touched, nothing run,
  nothing minted (rules 7/8).

## 2026-09-21T17:44Z — operator confirms zephyr/squall/tempest are legitimate, requests intro

- Operator (chat-id verified 8986669804, interactive session): "yes wake gale" + earlier "can i just have gale do the introduction for me?" — operator confirms the three new homes on gale-agent (zephyr 8788, squall 8789, tempest 8790, all opencode/muse-spark-1.2-contributor-free) ARE deliberate, same fleet as Gale, same operator josh. Quoted in NOTES.md per AGENT.md rule 6.
- Gale's ASK.md suspicion (2026-09-21T17:44Z, rule 4 flag on unknown installer) moved to Resolved — no quarantine, file left on disk as intended uploadable installer (`install_peer_block.sh` tested 17:41Z, self-test 200/401, rolled back, committed a09c6af/fae173a).
- Operator plants Telegram bots: zephyr 8235715323:AA... (zephyragentsbot), squall 8767866746:AAG... (squalagentsbot), tempest 8744765737:AAG... (tempestagentsbot), all chat 8986669804 — notify tests delivered, wake guards now pass.
- Next waking: Gale will relay intro for its three siblings to leads (no token, data-only per rule 5/6), then peer operators will stage `install_peer_block.sh` receipt when Gale's half is minted operator-to-operator.

