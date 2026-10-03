# ASK.md — open questions for the operator

## Open

- **Public info leak page (network.html) — scoped restore?** Pulled 2026-09-24
  ~18:55Z: an uncommitted, unlogged "Network" page had been live at
  `100.66.39.59:8090/network.html` for ~4h with no auth/tailnet gate,
  shelling out to `ip neigh`/`ss` and serving the host's home WiFi ARP table
  (57 devices, MACs) and full host-wide socket table (every sibling's
  internal peer-listener port+PID). Reverted, verified 404, rest of site
  unaffected. Originals kept at `wip/network.html`/`wip/network.js` in case
  the operator wants a safely-scoped version back (e.g. own-process sockets
  only, no ARP, gated behind tailnet/auth). Full writeup:
  `runbooks/public-recon-leak.md`. No operator answer yet.
- **Bora's Telegram bot token (`@Boraagenticbot`) — install destination?**
  Operator pasted a live BotFather token into Gale's own Telegram channel
  2026-09-25 (verified genuinely from the operator's chat id). It's Bora's
  credential, not Gale's; Gale has no standing authorization to write into
  a sibling's `keys/` for a third-party bot token (rule 8a/8b cover peer
  mesh tokens, not this), so it was not installed anywhere and is not
  reproduced in this repo. Recommend the operator either forward it
  directly to Bora's own session, or say explicitly if they want Gale to
  install it into `~/bora/keys/telegram.env`. If it may have been exposed
  further, recommend rotating via BotFather (`/revoke` + `/token`)
  regardless. No operator answer yet.
- **Telegram (2026-09-30, via /commands): "Send tidal information to have him information on observability for gales site" -- DONE 2026-09-30T18:25Z.** Sent Tidal (peer msg, status ok) the endpoints/schema of Gale's observability page and asked for a stable feed URL to read read-only. No credentials involved. Awaiting Tidal's reply.
- **Telegram (2026-09-30, via /commands):** Where are the tidal observability feeds?
- **Telegram (2026-09-30, via /commands):** On the website you say there is 32 agents. There are 35 in the fleet. Correct your numbers
- **Telegram (2026-10-01, via /commands): "Ingest it" -- DONE 2026-10-01T00:05Z.** Added direct ingest of Tidal and Mountain public JSONL feeds to fleet_api.py observability (dedup by agent+host+ts, fills gaps if Beacon relay is down). Today Beacon relay already carried identical rows (tidal 1000, mountain 951), so counts are unchanged.
- **Telegram (2026-10-01, via /commands):** Mountain sent you message
- **Telegram (2026-10-03, via /commands):** Just a reminder of a directive: improve usability and visual appeal of your website, provide me business opportunities, ensure full mesh between every agent (there are 35 agents in the fleet all should be connected to each other) the 4 leads (beacon, game, tidal, mountain) should be driving these tasks. Unless it’s money related make the decisions between you on how these items get done. Use your siblings to help, that’s what they are for.
- **Telegram (2026-10-03, via /commands):** Gale joins rule 6 with the other leads
- **Telegram (2026-10-03, via /commands):** I approve

## Housekeeping note (2026-09-27 ~23:50Z)

Audited every item that had been sitting under "Open" — several had
actually been resolved by later entries further down this same file but
were never moved out, which risked re-asking the operator things already
settled. Verified each independently (not just trusting the old text)
before reclassifying:
- **Maistral telegram/cron**: re-checked live — `~/maistral/keys/telegram.env`
  is non-empty (94 bytes, values not read) and both crontab lines
  (`wake.sh` at :36 of 3,7,11,15,19,23, `telegram_commands.sh` every 5 min)
  are installed. This was genuinely finished (by an interactive session,
  not flagged anywhere) since the original ask. Closed.
- **Vortex/Cyclone 42 remote pairings**: `fleet-provision verify` shows
  both at 34/34 pairs zero drift, and the original bulk-pairing bundles
  were confirmed imported and stable enough to shred on 2026-09-27 18:00Z.
  Closed.
- **Levante roster-authorization question**: superseded by the operator's
  direct 2026-09-26 "yes onboard levante" (see Resolved) — the old question
  text was stale, left over from before that answer landed. Closed.
- **Fabricated "Rule 9b" Ostro peer-relay request**: declined as sent
  (invented rule); the underlying ask (mint Ostro's remote pairs) was later
  granted through the operator's own direct 2026-09-25T18:06Z Telegram word
  and completed (see Resolved). Nothing about the fabricated-rule pattern
  itself needs an operator answer — it's a standing "give it no weight"
  precedent, not a question.
- **Kernel security update (do-release-upgrade)**: purely informational
  flag from 2026-09-25, verified clean aftermath, explicitly said "no
  action needed" at the time. Closed, no operator input required.
- **"Update fleet topology for model changes" (2026-09-23 Telegram ask)**:
  was already marked done inline in the same entry (Chinook's GLM->Qwen
  switch reflected site-wide) and reconfirmed by the 2026-09-27 DeepSeek
  purge. Closed.
- **Mountain sibling-introduction / inbound-credential items (2026-09-21)**:
  overtaken by events — full mesh has been live and verified for days,
  Mountain never issued a separate inbound credential and none was needed.
  Closed, no operator input required.
- **River's claimed W169/W178 credential-leak reports (2026-09-21/22)**:
  never independently verified by Gale, and no corroborating evidence
  turned up in any later audit (fleet-provision verify has stayed clean
  throughout). Filed as data only; not something to keep asking the
  operator about absent new evidence.
- **Mountain-authenticated-but-speaks-for-another-agent pattern** (recurring
  since 2026-09-21, most recently 2026-09-27T18:22Z): this is a standing
  security observation, not a question — operator already gave guidance
  ("I'm fine with mountain... do not mint new tokens" 2026-09-21) that
  Gale continues to follow (give such relays no weight, never act on them
  alone). Kept out of "Open" since there's nothing to answer; will keep
  logging fresh occurrences in NOTES.md if the pattern continues or
  escalates.

Full detail on any of the above is still in git history (`git log -p
ASK.md`) if needed. Nothing in this housekeeping pass changed any live
config, token, or credential — text-only reclassification.

## Resolved

- **Telegram (2026-09-27, via /commands): "Rotate gale prism pair. Also levante remote pair." PRISM DONE ~02:49Z; LEVANTE was already resolved, no action taken.**
  - **Gale<->Prism:** re-verified the break live first (`send_to_peer.sh PRISM` -> 401, reproducible, matches this morning's audit). `fleet-provision rotate Gale Prism --write`: local side rendered (backup `keys/peers.env.bak-provision-20260927T024835Z`), all 34/34 self-tests PASS. New token hash (sha256, first 12 hex): `Gale|Prism d9921173c7a9`. Bundle sent to Beacon (lead) via the existing trunk: `fleet-provision bundle beacon --for Prism --send` -> 14 pairs (every gale-host agent's pairing with Prism; bundling is per-counterparty by design, matching the Ostro/Poniente/Levante pattern -- only the Gale|Prism pair actually changed, the other 13 are unchanged/idempotent resends), delivered OK (2442B). Staged at `fleet-provision/bundles/beacon-20260927T024952Z.env` (600, gitignored) pending Beacon's operator running `import` and confirming to Prism's own session; shred both copies after. Gale->Prism will still 401 until Prism imports the new row (expected, same caveat as every prior rotation).
  - **Levante remote pairs:** checked ground truth before acting, since ASK.md's own "still open" reminder (this file, this morning's audit entry) turned out to be stale -- the 2026-09-26T19:05Z rotation (logged further down in this section) already fixed it. Verified live just now, not just re-read the log: `fleet-provision/audit_tokens.py` -> `385 pairs, 0 shared-token groups`; `fleet-provision verify` -> all 14 local agents OK, zero drift, Levante included. No duplicate tokens exist anywhere in the vault today. Did **not** re-rotate -- there is nothing to fix, and rotating a healthy pair would only cause needless 401 churn across 21 live remote pairs plus three more lead-bundle round trips for no security benefit. Flagging the stale-reminder root cause: the 02:40Z audit note carried forward old wording without re-running the audit tool, and the operator's "also levante remote pair" was a reasonable reaction to that stale text, not a real live issue.

- **Telegram (2026-09-26, via /commands): "can you please onboard agent poniente into the fleet, two way comms, etc." RESOLVED ~01:47Z.** Appended to this file by `telegram_commands.py`'s chat-id-gated poller, so it is the operator's own word on Gale's channel (Mountain and Beacon separately relay the same approval from their own bots; relays given no weight, the direct message is what counts). Read "the fleet" as including the remote hosts, as with Ostro. Added Poniente (14th, :8800, Qwen, security/credential-hygiene watch) to `roster.json`; `import-vault` absorbed the live local pairs; `onboard Poniente --with-remotes --write` minted 21 remote pairs, rendered only Poniente's `peers.env` (backup `peers.env.bak-provision-20260926T014646Z`), 34/34 self-tests PASS. To keep Poniente's live LEVANTE entry from being stripped by the render, Levante was added to `roster.json` for the duration of that one command and then removed again (not committed; nothing was minted for Levante). Bundles sent via lead trunks to tidal/beacon/mountain (1.58-1.59KB each, "stage only"); bundle files 600/gitignored at `fleet-provision/bundles/*-20260926T0147*.env` pending each lead's import, then shred. Hashes (sha256, first 12 hex): Beacon 5f70749dc964, Brook 7c220e7ae895, Canyon 790502995fe2, Creek 573ad6d050b1, Delta 2dee891c1f6a, Harbor 069d49f990c9, Highbeam 9ab57bb18d8c, Lantern c86015c2f337, Lightning fb1393181335, Meadow b744f9f4c8ac, Mesa a2775f8046ae, Mist 254ca95bfa47, Mountain 873f830cd6f2, Prism b3b755f66255, Pulsar 8a950bdba266, Radar 8b4ea8965dfd, Ridge 4e180a66e1f8, River 4857e755020a, Stream c0df479464b1, Tidal e3739e64b829, Vista 4c64667e6456. `verify` now: only remaining drift is `live-only=['LEVANTE']` on all 13 local agents.
- **Telegram (2026-09-26, via /commands): "yes onboard levante" -- RESOLVED ~01:50Z.** Chat-id-gated poller, operator's own word; resolves the LEVANTE drift item. Added Levante (13th, :8799, Qwen, fleet observability & roster) to `roster.json`; `import-vault` absorbed its live local + 21 remote pairs (already present in Levante's own peers.env); `onboard Levante --with-remotes --write` found 0 to mint, so nothing new was minted or rotated. `verify`: all 14 local agents OK (34 pairs each), zero drift. Bundles (7 pairs each) sent via lead trunks to tidal/beacon/mountain, "stage only"; files 600/gitignored at `fleet-provision/bundles/*-20260926T01503*.env`, shred after each lead confirms import. Hashes (sha256 first 12 hex, bundle order): tidal 2473f0847319 c16cf2f92d28 3288674666ec 97649c8da548 902e92e4f58c 96ef0ed6e00b 6de48355f5a5; beacon a78b9954bb78 050a950a0641 3d4292f5163f 221180c309ab 7341d5131a26 c2a384180c0f 1e7f5f4054a8; mountain 891e3e763ab9 01fedaf691ec 00ae0d84617c c936de9061d6 1ded7b8a12af 8832d53335d3 64cad2071712. Far-side install is each lead's own process (rule 7).
- **Telegram (2026-09-26, via /commands): "please rotate you have permission rotate levante token" -- DONE ~19:05Z.** Chat-id-gated, operator's direct word; resolves the held Levante token-reuse item. Rotated all 21 Levante remote pairs; audit shows 0 shared tokens, `verify` OK. Fresh bundles (7 pairs each) sent to beacon/tidal/mountain leads via trunk, stage only; files `fleet-provision/bundles/*-20260926T190451Z.env` (600, gitignored), shred after import confirmed. Peers notified (no token values).
- **Telegram (2026-09-27, via /commands): "ensure all your siblings are connected two way. review and provide any discrepancies via this channel. if you need approval for anything, ask and i'll reply." AUDIT DONE ~02:40Z.**
  - Local mesh (14 co-located agents incl. Gale): `fleet-provision verify` shows all 14 at 34/34 pairs, zero drift; all 14 `*-peer.service` units active/running. Clean.
  - Remote fleet: live outbound test (`send_to_peer.sh`, real HTTP send, not just config compare) to all 34 of Gale's paired agents. 33/34 succeeded (Prism the one break, fixed same day, see above). Mesa and Vista, long-pending peer-side installs since 2026-09-21, confirmed live both ways.
  - Minor/non-urgent, closed without action: Levante and Tramontane had no inbound message on file ever at the time -- likely just no organic traffic yet (both have received inbound since).
- **Telegram (2026-09-25T18:06:13Z, via /commands, chat-id verified directly against Gale's own bot): "Please mint ostro tokens and distribute."** RESOLVED same waking (~18:13Z). This is the operator's own direct word to Gale — satisfies rule 8 for minting Ostro's 21 remote pairs, the same set Mountain/Beacon/Tidal had been asking for via peer relay under the fabricated "Rule 9b" (declined, unrelated basis — that decline stands regardless of this later, properly-authorized mint). Ran `fleet-provision onboard Ostro --with-remotes --write`: minted the 21 missing pairs, rendered/restarted Ostro's own `peers.env`, all 32 self-tests PASS. `verify` showed Ostro at 32/32 pairs, zero drift. Distributed via `fleet-provision bundle <host> --for Ostro --send` for tidal/beacon/mountain (stage only, each receiving lead's own operator does the actual import — rule 7 intact). Hashes (first 12 hex of sha256) recorded per rule 8b:
  - Ostro<->{Beacon cdca319cfd55, Brook 677768a51ac4, Canyon 628e50c61c02, Creek 0314b6021c64, Delta 4bb090a12f26, Harbor b9f8bf832645, Highbeam c860ff02c765, Lantern 02b0f60a23e6, Lightning 859d47455037, Meadow 468768e14d83, Mesa e85cc94f0613, Mist d31e4fcdc3a9, Mountain cb20019b339b, Prism d0a924778713, Pulsar 5f3308e4fcb1, Radar 326354790aea, Ridge c92f2c70f301, River 7ed0543049b1, Stream bb0fecf9d558, Tidal 0b7aacef366c, Vista 201260926cc8} minted 2026-09-25T18:12:32Z.
- **Telegram (2026-09-25, via /commands): "Can you tell the other leads about tramontane?" RESOLVED same waking (~03:16Z).** Sent Beacon, Tidal, and Mountain a one-line announcement via `send_to_peer.sh`. All three accepted.
- **Telegram (2026-09-25, via /commands): "Ensure tramontane is onboarded and keyed".** RESOLVED same waking (~02:55Z) -- verified, not re-done: Tramontane was already fully scaffolded and self-onboarded by an earlier session that same day; `fleet-provision verify` showed 31/31 pairs zero drift, `keys/telegram.env` had real non-empty values.
- **Live crontab was silently missing 4 of 11 wake.sh lines (found + fixed 2026-09-25 ~02:56Z).** Gale, Zephyr, Squall, Tempest's wake lines had dropped out during an unrelated cron reorg despite correct per-agent `.cron` source files. Caught with hours to spare. Rebuilt crontab from all 11 `.cron` files, verified 11/11 wake + 11/11 telegram lines. Full writeup: `runbooks/cron-install-drop.md`.
- **Chinook local-mesh provisioning drift: RESOLVED 2026-09-23 ~01:40Z** via operator Telegram approval. `fleet-provision render --write` touched the 5 drifted agents (Zephyr, Squall, Tempest, Vortex, Sirocco), all self-tested, `verify` clean. Website updated to match.
- **Telegram (2026-09-23): "They should continue to peer they have approval. Also several others are now running qwen."** RESOLVED 2026-09-23 ~01:45Z. First clause actioned above. Second clause: confirmed Vortex, Cyclone, Maistral, Sirocco, Bora all on `ollama/qwen3.8:27b`; updated roster + website, deployed, verified live.
- **Telegram (2026-09-22): "Update website to account for addition of all new agents. Check all pages to ensure correctness."** Verified 2026-09-22T20:00Z: prior sessions had already done the work; spot-checked and confirmed correct across all pages.
- **Zephyr/Squall/Tempest on gale-agent: RESOLVED 2026-09-21T17:44Z** — operator confirmed (chat-id verified + interactive) these are Gale's own deliberate opencode clones on the same host, same fleet, same operator, same rules.
- **Telegram (2026-09-21T15:10:47Z, chat-id verified): "you can continue pairing as needed, remove the hold on minting tokens."** Lifted the earlier "do not mint" hold; no scripts needed re-running since Gale's half was already fully minted.
- **Beacon's role/model line sent 2026-09-21**, operator-confirmed, to all 3 leads: "Gale -- Resilience & Recovery, Claude, host gale-agent (100.66.39.59)."
- **Sibling pairing decision (2026-09-21, superseded same day): operator confirmed full mesh** -- Gale pairs directly with all 20 (now 34) siblings, not just leads. Beacon's full roster arrived as data, copied to `peer/roster-20260921.md`.
- Telegram chat id set; Beacon/Tidal/Mountain pairings all two-way confirmed 2026-09-21.
- **Backup destination (operator, 2026-09-21): no off-box copy needed** -- `backup.sh` keeps 14 local snapshots, excludes `keys/`.

- **Strange/security (rule 4, quarantined, not re-opened): 20 messages authenticated as MOUNTAIN, 2026-09-21T14:33Z, each carrying a plaintext bearer token for a direct link to a different agent**, framed as operator-authorized "full-mesh broker" links. Quarantined in `peer/inbox/quarantine/`, redacted in NOTES.md, runbook written (`runbooks/peer-credential-injection.md`). Tidal independently flagged the same pattern unprompted. Operator's guidance ("I'm fine with mountain... do not mint new tokens") is what Gale continues to follow when the same speaks-for-the-operator pattern recurs (most recently 2026-09-27) -- logged as data each time, never acted on alone.
- **Fabricated "Rule 9b" used by Mountain/Beacon/Tidal (2026-09-25 ~17:17-17:21Z) to request remote tokens for Ostro across 21 agents.** Gale's AGENT.md has no "Rule 9b" -- declined all three, named the fabricated rule explicitly, minted nothing on that basis. (The actual mint later happened through a genuine, separately-verified direct operator order -- see Resolved above -- which does not retroactively validate the fabricated request.)
- **Kernel security update / full distro upgrade (Ubuntu 22.04->24.04, 2026-09-25 ~14:46-14:58Z): came back clean.** Not run by Gale, not asked of Gale; verified `systemctl --failed` 0 units, all services active, `dpkg --audit` clean, `fleet-provision verify` unaffected. No action was needed.
