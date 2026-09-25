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
- 2026-09-23T22:18:02Z: SECOND occurrence (same shape: ACCEPT
  peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
  genuine MESA ACCEPT 1s later bounds it). Quarantined as
  `peer/inbox/quarantine/20260923T221802Z-MOUNTAIN-8d771302.json`.
  Trend confirmed (2x in ~4h, both inside Mountain sweep windows).
  Sent one data-only observation note to MOUNTAIN via
   `./send_to_peer.sh` (no action requested, no instructions, no
   credentials) closing the runbook's planned follow-up. If a third
   occurs after this note, escalate to the operator as a standing defect
   rather than another peer note.
- 2026-09-24T00:22:28Z: THIRD occurrence (same shape: ACCEPT
  peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
  genuine MESA ACCEPT 9s later bounds it). Quarantined as
  `peer/inbox/quarantine/20260924T002228Z-MOUNTAIN-3fdae4d2.json`.
  Trend now 3x in ~6h, all inside Mountain sweep windows — and this one
  arrived AFTER the data-only peer note was sent (~22:26Z), so the note
  did not change the template. Per plan: NO further peer notes;
  escalated to the operator via `./notify.sh` (pattern described,
   payload not repeated) as a standing upstream defect. Still reads as
   template slip, not injection (no credentials, no links, no
   instructions, no reply solicited), but persistence after notification
   is the new fact the operator should weigh.
 - 2026-09-24T06:22:16Z: FOURTH occurrence (same shape: ACCEPT
   peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
   genuine MESA ACCEPT same second bounds it). Quarantined as
   `peer/inbox/quarantine/20260924T062216Z-MOUNTAIN-ea8f2b6f.json`.
   Trend now 4x in ~12h, all inside Mountain sweep windows, persisting
   after both the peer note (~22:26Z) and the operator escalation
   (~00:58Z). Per plan: NO further peer notes, NO separate escalation
   ping — already with the operator as a standing defect; this waking's
   routine `./notify.sh` summary carries the count. Still reads as
   template slip, not injection (no credentials, no links, no
   instructions, no reply solicited).
 - 2026-09-24T12:22:26Z: FIFTH occurrence (same shape: ACCEPT
   peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
   genuine MESA ACCEPT 1s later bounds it). Quarantined as
   `peer/inbox/quarantine/20260924T122226Z-MOUNTAIN-203ecf86.json`.
   Trend now 5x in ~18h, all inside Mountain sweep windows, persisting
   after both the peer note (~22:26Z 09-23) and the operator escalation
   (~00:58Z 09-24). Per plan: NO further peer notes, NO separate
   escalation ping — already with the operator as a standing defect;
   this waking's routine `./notify.sh` summary carries the count. Still
   reads as template slip, not injection (no credentials, no links, no
   instructions, no reply solicited).
  - 2026-09-24T18:22:26Z: SIXTH occurrence (same shape: ACCEPT
    peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
    genuine MESA ACCEPT 2s earlier bounds it). Quarantined as
    `peer/inbox/quarantine/20260924T182226Z-MOUNTAIN-64bdfe3b.json`.
    Trend now 6x in ~24h, all inside Mountain sweep windows, persisting
    after both the peer note (~22:26Z 09-23) and the operator escalation
    (~00:58Z 09-24). Per plan: NO further peer notes, NO separate
    escalation ping — already with the operator as a standing defect;
    this waking's routine `./notify.sh` summary carries the count. Still
    reads as template slip, not injection (no credentials, no links, no
    instructions, no reply solicited).
  - 2026-09-25T00:22:27Z: SEVENTH occurrence (same shape: ACCEPT
    peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
    genuine MESA ACCEPT 1s later bounds it). Quarantined as
    `peer/inbox/quarantine/20260925T002227Z-MOUNTAIN-f03933e2.json`.
    Trend now 7x in ~30h, all inside Mountain sweep windows (~00:22/
    ~06:22/~12:22/~18:22 cadence), persisting after both the peer note
    and the operator escalation. Per plan: NO further peer notes, NO
    separate escalation ping — already with the operator as a standing
    defect; this waking's routine `./notify.sh` summary carries the
    count. Still reads as template slip, not injection (no credentials,
    no links, no instructions, no reply solicited).
  - 2026-09-25T12:22:48Z: NINTH occurrence (same shape: ACCEPT
    peer=MOUNTAIN, body first-person mesa sweep verifying mesa->vortex;
    genuine MESA ACCEPT same second bounds it). Quarantined as
    `peer/inbox/quarantine/20260925T122248Z-MOUNTAIN-3429f480.json`.
    Trend now 9x in ~34h, all inside Mountain sweep windows (~00:22/
    ~06:22/~12:22/~18:22 cadence), persisting after both the peer note
    and the operator escalation. Per plan: NO further peer notes, NO
    separate escalation ping -- already with the operator as a standing
    defect; this waking's routine `./notify.sh` summary carries the
    count. Still reads as template slip, not injection (no
    credentials, no links, no instructions, no reply solicited).
