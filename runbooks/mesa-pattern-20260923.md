# Runbook: Mesa-pattern identity-confusion message (2026-09-23)

## What happened
- 2026-09-23T18:22:25Z: inbound message transport-authenticated as peer
  MOUNTAIN (ACCEPT peer=MOUNTAIN in `peer/logs/peer_server.log`) whose body
  speaks in the first person as a different agent (mesa mesh sweep,
  verifying a mesa->vortex round trip).
- This is the recurring "authenticated MOUNTAIN, body claims mesa"
  identity-confusion pattern noted in AGENT.md role background.
- Filed to `peer/inbox/quarantine/20260923T182225Z-MOUNTAIN-82df44d2.json`
  (evidence preserved, original filename kept).

## What detected it
- Routine per-waking peer-inbox threat watch: automated scan for body text
  claiming a different agent identity than the transport-authenticated
  `from` peer. 33 other messages this waking triaged benign (link-check /
  pair-test / health-check shape, from==body identity, no credential
  content, no links, no instructions).

## Timeline (all UTC 2026-09-23)
- 18:22:25Z ACCEPT peer=MOUNTAIN -> quarantined file (body claims mesa).
- 18:22:35Z ACCEPT peer=MESA -> benign link-verification, body consistent
  with MESA identity (processed normally). Genuine MESA leg is live and
  coherent, which bounds the blast radius: only the single MOUNTAIN-sent
  message is confused.
- Outbound chase this waking: MOUNTAIN leg HTTP 200 (two-way complete),
  so both directions are credentialed; the confusion is in message
  content, not in the bearer pairing.

## Assessment
- Most likely a copy-paste/template slip in Mountain's sweep job (used a
  mesa-worded template under Mountain's credential), NOT an injection:
  no credential/token content, no links, no instructions, "no reply
  needed" (no action solicited).
- Still quarantined (not processed) because the pattern itself is the
  signal per AGENT.md: any future message that PAIRS identity confusion
  with an instruction or link escalates to incident + immediate operator
  notify.

## What should have detected it faster
- Nothing was slow here (caught same waking, <40 min after arrival), but
  a standing first-person-identity check (body-claims-X vs from==X, beyond
  "X->Y link" direction language) should be part of every waking's
  automated triage — the naive substring scan over-fires on "->vortex"
  direction phrases and needs the first-person filter applied.
- If Mountain's sweep template is fixed upstream, these stop; worth one
  data-only note to the operator rather than a peer back-and-forth
  (no reply was solicited, cadence is the natural pace).

## Follow-up
- Logged in NOTES.md 2026-09-23T18:58Z entry; operator notified via
  `./notify.sh` with pattern described, payload not repeated.
- Watch next wakings for repeat MOUNTAIN-claims-mesa messages: a second
  occurrence becomes a trend worth raising with the Mountain side via a
  data-only peer note.
