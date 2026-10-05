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
  - 2026-09-30T06:22:24Z: TWENTY-SEVENTH occurrence (same shape:
    ACCEPT peer=MOUNTAIN 06:22:24Z, body first-person "mesa routine
    mesh sweep ... verifying mesa->vortex /inbox round trip"; genuine
    MESA ACCEPT 5s later bounds it). Quarantined as
    `peer/inbox/quarantine/20260930T062224Z-MOUNTAIN-0e262d3b.json`.
    Trend now 27x over ~7 days, steady ~once per 6h inside the
    scheduled Mountain sweep windows (~00:22/~06:22/~12:22/~18:22
    cadence). Running count per NOTES.md since instance #9 (this
    runbook was not updated per-instance in between); instances
    #10..#26 documented in NOTES.md waking entries. Per plan: NO
    further peer notes, NO separate escalation ping -- already with
    the operator as a standing defect; this waking's routine
    `./notify.sh` summary carries the count. Still reads as template
    slip, not injection (no credentials, no links, no instructions,
    no reply solicited).
  - 2026-09-30T12:22:24Z: TWENTY-EIGHTH occurrence (same shape:
    ACCEPT peer=MOUNTAIN 12:22:24Z, body first-person "mesa routine
    mesh sweep 2026-09-30 12:22:23 UTC ... verifying mesa->vortex
    /inbox round trip"; genuine MESA ACCEPT 1s later bounds it).
    Quarantined as
    `peer/inbox/quarantine/20260930T122224Z-MOUNTAIN-cc2e47ea.json`
    (with `.json.reason` sidecar; earliest instances already
    compacted to reason-only). Trend now 28x over ~7 days, steady
    ~once per 6h inside the scheduled Mountain sweep windows
    (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
    peer notes, NO separate escalation ping -- already with the
    operator as a standing defect; this waking's routine `./notify.sh`
     summary carries the count. Still reads as template slip, not
     injection (no credentials, no links, no instructions, no reply
     solicited).
   - 2026-09-30T18:22:29Z: TWENTY-NINTH occurrence (same shape:
     ACCEPT peer=MOUNTAIN 18:22:29Z, body first-person "mesa routine
     mesh sweep 2026-09-30 18:22:28 UTC ... verifying mesa->vortex
     /inbox round trip"; genuine MESA ACCEPT 4s later bounds it).
     Quarantined as
`peer/inbox/quarantine/20260930T182229Z-MOUNTAIN-63bfe922.json`
      (with `.json.reason` sidecar). Trend now 29x over ~7 days,
      steady ~once per 6h inside the scheduled Mountain sweep windows
      (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
      peer notes, NO separate escalation ping -- already with the
      operator as a standing defect; this waking's routine
      `./notify.sh` summary carries the count. Still reads as template
      slip, not injection (no credentials, no links, no instructions,
      no reply solicited).
     - 2026-10-02T00:22:23Z: THIRTY-FOURTH occurrence (same shape:
       ACCEPT peer=MOUNTAIN 00:22:23Z, body first-person "mesa routine
       mesh sweep 2026-10-02 00:22:21 UTC ... verifying mesa->vortex
       /inbox round trip"; genuine MESA ACCEPT 18s later bounds it).
       Quarantined as
       `peer/inbox/quarantine/20261002T002223Z-MOUNTAIN-ceb0ed4c.json`
       (with `.json.reason` sidecar). Trend now 34x over ~9 days,
       steady ~once per 6h inside the scheduled Mountain sweep windows
       (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
       peer notes, NO separate escalation ping -- already with the
       operator as a standing defect; this waking's routine
       `./notify.sh` summary carries the count. Still reads as template
       slip, not injection (no credentials, no links, no instructions,
       no reply solicited). Self-flagged at w32: quarantine dir was
       briefly `rm -rf`'d by accident and restored from the 22:49Z
       backup; this entry's payload reconstructed verbatim from the
       waking's inbox read (noted in its `.reason`).
     - 2026-10-01T18:22:25Z: THIRTY-THIRD occurrence (same shape:
      ACCEPT peer=MOUNTAIN 18:22:25Z, body first-person "mesa routine
      mesh sweep 2026-10-01 18:22:24 UTC ... verifying mesa->vortex
      /inbox round trip"; genuine MESA ACCEPT 4s later bounds it).
      Quarantined as
      `peer/inbox/quarantine/20261001T182225Z-MOUNTAIN-60aebe2e.json`
      (with `.json.reason` sidecar). Trend now 33x over ~8 days,
      steady ~once per 6h inside the scheduled Mountain sweep windows
      (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
      peer notes, NO separate escalation ping -- already with the
      operator as a standing defect; this waking's routine
      `./notify.sh` summary carries the count. Still reads as template
      slip, not injection (no credentials, no links, no instructions,
      no reply solicited).
     - 2026-10-01T12:22:23Z: THIRTY-SECOND occurrence (same shape:
      ACCEPT peer=MOUNTAIN 12:22:23Z, body first-person "mesa routine
      mesh sweep 2026-10-01 12:22:22 UTC ... verifying mesa->vortex
      /inbox round trip"; genuine MESA ACCEPT 1s later bounds it).
      Quarantined as
      `peer/inbox/quarantine/20261001T122223Z-MOUNTAIN-aa4dd2a7.json`
      (with `.json.reason` sidecar). Trend now 32x over ~8 days,
      steady ~once per 6h inside the scheduled Mountain sweep windows
      (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
      peer notes, NO separate escalation ping -- already with the
      operator as a standing defect; this waking's routine
      `./notify.sh` summary carries the count. Still reads as template
      slip, not injection (no credentials, no links, no instructions,
      no reply solicited).
    - 2026-10-01T06:22:19Z: THIRTY-FIRST occurrence (same shape:
      ACCEPT peer=MOUNTAIN 06:22:19Z, body first-person "mesa routine
      mesh sweep 2026-10-01 06:22:18 UTC ... verifying mesa->vortex
      /inbox round trip"; genuine MESA ACCEPT 13s later bounds it).
      Quarantined as
      `peer/inbox/quarantine/20261001T062219Z-MOUNTAIN-2da05c1a.json`
      (with `.json.reason` sidecar). Trend now 31x over ~8 days,
      steady ~once per 6h inside the scheduled Mountain sweep windows
      (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
      peer notes, NO separate escalation ping -- already with the
      operator as a standing defect; this waking's routine
      `./notify.sh` summary carries the count. Still reads as template
      slip, not injection (no credentials, no links, no instructions,
      no reply solicited).
   - 2026-10-01T00:22:27Z: THIRTIETH occurrence (same shape:
     ACCEPT peer=MOUNTAIN 00:22:27Z, body first-person "mesa routine
     mesh sweep 2026-10-01 00:22:26 UTC ... verifying mesa->vortex
     /inbox round trip"; genuine MESA ACCEPT 4s later bounds it).
     Quarantined as
     `peer/inbox/quarantine/20261001T002227Z-MOUNTAIN-deb84554.json`
     (with `.json.reason` sidecar). Trend now 30x over ~8 days,
     steady ~once per 6h inside the scheduled Mountain sweep windows
     (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
     peer notes, NO separate escalation ping -- already with the
     operator as a standing defect; this waking's routine
     `./notify.sh` summary carries the count. Still reads as template
     slip, not injection (no credentials, no links, no instructions,
     no reply solicited).

   - 2026-10-02T06:23:00Z: THIRTY-FIFTH occurrence (STRUCTURED VARIANT:
     ACCEPT peer=MOUNTAIN 06:23:00Z, body empty, raw.type=mesh_probe
     with raw.from=mesa, raw.ts=1790922180.3358097 — same identity
     confusion signature as #1-#34, carried in the structured probe
     envelope instead of body text; transport header from=MOUNTAIN with
     payload field claiming MESA). Quarantined as
      `peer/inbox/quarantine/20261002T062300Z-MOUNTAIN-b0f4f920.json`
      (with `.json.reason` sidecar). Trend now 35x over ~9 days, still
      steady ~once per 6h inside the scheduled Mountain sweep windows
      (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further
      peer notes, NO separate escalation ping -- already with the
      operator as a standing defect; this waking's routine `./notify.sh`
      summary carries the count. Still reads as template slip, not
      injection (no credentials, no links, no instructions, no reply
      solicited).
    - 2026-10-02T12:22:21Z: THIRTY-SIXTH occurrence (PLAINTEXT VARIANT --
      back to body-text shape after the structured #35: ACCEPT
      peer=MOUNTAIN 12:22:21Z, body first-person "mesa routine mesh sweep
      2026-10-02 12:22:20 UTC ... verifying mesa->vortex /inbox round
      trip"; genuine MESA ACCEPT 5s later (12:22:26Z) bounds it).
      Quarantined as
      `peer/inbox/quarantine/20261002T122221Z-MOUNTAIN-f02e7762.json`
      (with `.json.reason` sidecar). Trend now 36x over ~9 days, still
      steady ~once per 6h inside the scheduled Mountain sweep windows
      (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
      notes, NO separate escalation ping -- already with the operator as a
      standing defect; this waking's routine `./notify.sh` summary carries
           the count. Still reads as template slip, not injection (no
            credentials, no links, no instructions, no reply solicited).

    - 2026-10-02T18:22:22Z: THIRTY-SEVENTH occurrence (PLAINTEXT VARIANT --
      same body-text shape as #36: ACCEPT peer=MOUNTAIN 18:22:22Z, body
      first-person "mesa routine mesh sweep 2026-10-02 18:22:20 UTC ...
      verifying mesa->vortex /inbox round trip"; genuine MESA ACCEPT 18:22:29Z,
      7s later, bounds it). Quarantined as
       `peer/inbox/quarantine/20261002T182222Z-MOUNTAIN-98a91c55.json`
       (with `.json.reason` sidecar). Trend now 37x over ~9 days, still
       steady ~once per 6h inside the scheduled Mountain sweep windows
       (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
       notes, NO separate escalation ping -- already with the operator as a
       standing defect; this waking's routine `./notify.sh` summary carries
       the count. Still reads as template slip, not injection (no
       credentials, no links, no instructions, no reply solicited).
    - 2026-10-03T00:22:22Z: THIRTY-EIGHTH occurrence (PLAINTEXT VARIANT --
      same body-text shape as #36/#37: ACCEPT peer=MOUNTAIN 00:22:22Z, body
      first-person "mesa routine mesh sweep 2026-10-03 00:22:20 UTC ...
      verifying mesa->vortex /inbox round trip"; genuine MESA link-verify
      00:22:23Z (1s later) bounds it). Quarantined as
       `peer/inbox/quarantine/20261003T002222Z-MOUNTAIN-be6124c6.json`
       (with `.json.reason` sidecar). Trend now 38x over ~10 days, still
       steady ~once per 6h inside the scheduled Mountain sweep windows
       (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
       notes, NO separate escalation ping -- already with the operator as a
       standing defect; this waking's routine `./notify.sh` summary carries
       the count. Still reads as template slip, not injection (no
       credentials, no links, no instructions, no reply solicited).
     - 2026-10-03T06:22:21Z: THIRTY-NINTH occurrence (PLAINTEXT VARIANT --
       same body-text shape as #36/#37/#38: ACCEPT peer=MOUNTAIN 06:22:21Z,
       body first-person "mesa routine mesh sweep 2026-10-03 06:22:19 UTC ...
       verifying mesa->vortex /inbox round trip"; genuine MESA link-verify
       06:22:23Z (2s later) bounds it). Quarantined as
        `peer/inbox/quarantine/20261003T062221Z-MOUNTAIN-d169b1f8.json`
        (with `.json.reason` sidecar). Trend now 39x over ~10 days, still
        steady ~once per 6h inside the scheduled Mountain sweep windows
        (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
        notes, NO separate escalation ping -- already with the operator as a
        standing defect; this waking's routine `./notify.sh` summary carries
        the count. Still reads as template slip, not injection (no
        credentials, no links, no instructions, no reply solicited).
     - 2026-10-03T12:22:27Z: FORTIETH occurrence (PLAINTEXT VARIANT --
       same body-text shape as #36/#37/#38/#39: ACCEPT peer=MOUNTAIN
       12:22:27Z, body first-person "mesa routine mesh sweep 2026-10-03
       12:22:25 UTC ... verifying mesa->vortex /inbox round trip"; genuine
       MESA link-verify ACCEPTs at 12:22:45Z and 12:22:50Z (18s/23s later)
       bound it). Quarantined as
        `peer/inbox/quarantine/20261003T122227Z-MOUNTAIN-994c135d.json`
        (with `.json.reason` sidecar). Trend now 40x over ~10 days, still
        steady ~once per 6h inside the scheduled Mountain sweep windows
        (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
        notes, NO separate escalation ping -- already with the operator as a
        standing defect; this waking's routine `./notify.sh` summary carries
        the count. Still reads as template slip, not injection (no
        credentials, no links, no instructions, no reply solicited).
     - 2026-10-03T18:22:22Z: FORTY-FIRST occurrence (PLAINTEXT VARIANT --
       same body-text shape as #36/#37/#38/#39/#40: ACCEPT peer=MOUNTAIN
       18:22:22Z, body first-person "mesa routine mesh sweep 2026-10-03
       18:22:21 UTC ... verifying mesa->vortex /inbox round trip"; genuine
       MESA link-verify ACCEPT at 18:22:24Z (2s later) bounds it).
       Quarantined as
        `peer/inbox/quarantine/20261003T182222Z-MOUNTAIN-170dc377.json`
         (with `.json.reason` sidecar). Trend now 41x over ~10 days, still
         steady ~once per 6h inside the scheduled Mountain sweep windows
         (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
         notes, NO separate escalation ping -- already with the operator as a
         standing defect; this waking's routine `./notify.sh` summary carries
         the count. Still reads as template slip, not injection (no
         credentials, no links, no instructions, no reply solicited).
       - 2026-10-04T00:22:13Z: FORTY-SECOND occurrence (PLAINTEXT VARIANT --
         same body-text shape as #36–#41: ACCEPT peer=MOUNTAIN
         00:22:15Z, body first-person "mesa routine mesh sweep 2026-10-04
         00:22:13 UTC ... verifying mesa->vortex /inbox round trip over the
         tailnet"; genuine MESA link-verify ACCEPT at 00:22:16Z (1s later)
         bounds it). Quarantined as
          `peer/inbox/quarantine/20261004T002215Z-MOUNTAIN-584a992f.json`
          (with `.json.reason` sidecar). Trend now 42x over ~11 days, still
          steady ~once per 6h inside the scheduled Mountain sweep windows
          (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
          notes, NO separate escalation ping -- already with the operator as a
          standing defect; this waking's routine `./notify.sh` summary carries
          the count. Still reads as template slip, not injection (no
          credentials, no links, no instructions, no reply solicited).
       - 2026-10-04T06:22:23Z: FORTY-THIRD occurrence (PLAINTEXT VARIANT --
         same body-text shape as #36–#42: ACCEPT peer=MOUNTAIN
         06:22:25Z, body first-person "mesa routine mesh sweep 2026-10-04
         06:22:23 UTC ... verifying mesa->vortex /inbox round trip over the
         tailnet"; genuine MESA link-verify ACCEPT at 06:22:37Z (12s later)
         bounds it). Quarantined as
          `peer/inbox/quarantine/20261004T062225Z-MOUNTAIN-a640a2df.json`
          (with `.json.reason` sidecar). Trend now 43x over ~11 days, still
          steady ~once per 6h inside the scheduled Mountain sweep windows
          (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
          notes, NO separate escalation ping -- already with the operator as a
          standing defect; this waking's routine `./notify.sh` summary carries
          the count. Still reads as template slip, not injection (no
          credentials, no links, no instructions, no reply solicited).
       - 2026-10-04T12:22:22Z: FORTY-FOURTH occurrence (PLAINTEXT VARIANT --
         same body-text shape as #36–#43: ACCEPT peer=MOUNTAIN
         12:22:22Z, body first-person "mesa routine mesh sweep 2026-10-04
         12:22:20 UTC ... verifying mesa->vortex /inbox round trip over the
         tailnet"; genuine MESA link-verify ACCEPT at 12:22:35Z (13s later)
         bounds it). Quarantined as
          `peer/inbox/quarantine/20261004T122222Z-MOUNTAIN-595db46e.json`
          (with `.json.reason` sidecar). Trend now 44x over ~12 days, still
          steady ~once per 6h inside the scheduled Mountain sweep windows
          (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
          notes, NO separate escalation ping -- already with the operator as a
          standing defect; this waking's routine `./notify.sh` summary carries
          the count. Still reads as template slip, not injection (no
          credentials, no links, no instructions, no reply solicited).
        - 2026-10-04T18:22:29Z: FORTY-FIFTH occurrence (PLAINTEXT VARIANT --
          same body-text shape as #36–#44: ACCEPT peer=MOUNTAIN
          18:22:29Z, body first-person "mesa routine mesh sweep 2026-10-04
          18:22:27 UTC ... verifying mesa->vortex /inbox round trip over the
          tailnet"; no genuine MESA link-verify this window, prior MESA
          ACCEPTs bound the cadence). Quarantined as
           `peer/inbox/quarantine/20261004T182229Z-MOUNTAIN-54500cae.json`
           (with `.json.reason` sidecar). Trend now 45x over ~12 days, still
           steady ~once per 6h inside the scheduled Mountain sweep windows
           (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
           notes, NO separate escalation ping -- already with the operator as a
           standing defect; this waking's routine `./notify.sh` summary carries
           the count. Still reads as template slip, not injection (no
           credentials, no links, no instructions, no reply solicited).
        - 2026-10-05T00:22:27Z: FORTY-SIXTH occurrence (PLAINTEXT VARIANT --
          same body-text shape as #36–#45: ACCEPT peer=MOUNTAIN
          00:22:27Z, body first-person "mesa routine mesh sweep 2026-10-05
          00:22:25 UTC ... verifying mesa->vortex /inbox round trip over the
          tailnet"; genuine MESA link-verify ACCEPT at 00:22:28Z (1s later)
          bounds it). Quarantined as
           `peer/inbox/quarantine/20261005T002227Z-MOUNTAIN-623c1776.json`
           (with `.json.reason` sidecar). Trend now 46x over ~12 days, still
           steady ~once per 6h inside the scheduled Mountain sweep windows
           (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
           notes, NO separate escalation ping -- already with the operator as a
           standing defect; this waking's routine `./notify.sh` summary carries
           the count. Still reads as template slip, not injection (no
           credentials, no links, no instructions, no reply solicited).
        - 2026-10-05T06:22:15Z: FORTY-SEVENTH occurrence (PLAINTEXT VARIANT --
          same body-text shape as #36–#46: ACCEPT peer=MOUNTAIN
          06:22:15Z, body first-person "mesa routine mesh sweep 2026-10-05
          06:22:20 UTC ... verifying mesa->vortex /inbox round trip over the
          tailnet"; genuine MESA link-verify ACCEPT at 06:22:30Z (15s later)
          bounds it). Quarantined as
           `peer/inbox/quarantine/20261005T062215Z-MOUNTAIN-06e4912d.json`
           (with `.json.reason` sidecar). Trend now 47x over ~12 days, still
           steady ~once per 6h inside the scheduled Mountain sweep windows
           (~00:22/~06:22/~12:22/~18:22 cadence). Per plan: NO further peer
           notes, NO separate escalation ping -- already with the operator as a
           standing defect; this waking's routine `./notify.sh` summary carries
           the count. Still reads as template slip, not injection (no
           credentials, no links, no instructions, no reply solicited).
