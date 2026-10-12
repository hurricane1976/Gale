# Gale website — full bottom-up improvement queue #4 (2026-10-12)

One hundred new items from a bottom-up audit of every module (five parallel deep-reads:
core plumbing, ops pages, content pages, visual scenes, markup/tooling), cross-checked
against the three shipped queues (50-20261009, 100-20261010, 50-20261012) — nothing here
duplicates them. Every item cites the file/line it builds on.

## Offline shell & service worker (sw.js)

1. Navigation cache stores any 2xx-lookalike: `sw.js:86-89` caches without `res.ok`, so a transient 500 HTML poisons offline fallback. Cache only `res.ok` responses.
2. Offline fallback misses query variants: `sw.js:91` matches full URL; `?kiosk=20` vs bare path both cached but never cross-matched. Use `ignoreSearch: true`.
3. Push receipt beacon awaited before `showNotification` (`sw.js:142-152`) can eat iOS pushes on slow networks; show first, beacon after (comment at 150 already demands this order).
4. Wake queue never drains/prunes without Background Sync (`sw.js:267-283`): add a `gale:drain-wake-queue` message + online-hook trigger in shared.js, prune over-TTL entries at open.
5. Cache writes race SW termination (`sw.js:88,109,124` floating `c.put` promises): register with `event.waitUntil`.
6. `SHELL_ASSETS` omits `/lost.js`, `/palette.js`, `/cinematic.js`, `/kiosk.js`, `/glsky.js`, `/storm-scene.css` (sw.js:34-50) — offline first-visit silently loses them.
7. Dead no-op `push` listener (sw.js:184) + two separate `message` listeners (208, 284): merge into one switch-based handler.
8. `idb()` re-opens IndexedDB per transaction (sw.js:247-252): memoize the open promise.

## RUM (rum.js)

9. Every sample serializes the whole 120-sample history to localStorage (rum.js:16-27): coalesce publishes on a 2s trailing timer; pagehide flush stays.
10. INP pushed per event batch (rum.js:76): keep session max in memory, push once on pagehide/visibilitychange.
11. Samples never expire by age (rum.js:6-25): prune >30 days on load.
12. galaxy.html visits recorded as `page:"404.html"` (rum.js:9-12 pageFiles omits it): add it.
13. Reporting-queue batch spliced before send (rum.js:103-119): re-append on failure, carry overflow to next window.
14. `context.viewport` frozen at load (rum.js:11-15): recompute per push.

## Command palette (palette.js)

15. Combobox has no `aria-activedescendant`/option ids and `aria-expanded` hardcoded true (palette.js:165-204): wire both.
16. `PAGES` missing galaxy/home/runbooks (palette.js:6-17): add rows.
17. Mousemove re-renders the whole list (palette.js:243-249): toggle highlight classes instead.
18. Every open re-fetches fleet.html+alerts and first open renders empty (palette.js:127-141,225): cache 60s, render cache first.
19. No match highlighting (palette.js:180-204): wrap matched substring in `<mark>` (escaped).

## WebGPU sky (glsky.js)

20. UV space is pixel-based against hardcoded 1280 (glsky.js:34-47): pattern density and vignette drift with window/DPR; pass canvas size uniform and normalize.
21. Hidden tab keeps scheduling rAF (glsky.js:110) and `device.lost` is terminal (98-106): cancel on hidden/restart on visible; one retry on loss.

## Boot & shared plumbing

22. `boot()` initializers have no isolation (shared.js:2444-2507): one throw kills palette/cinematic/kiosk/SW registration. `runStep()` try/catch wrapper + BOOT_STEP_FAIL RUM.
23. Storm canvas re-spawns all particles/clouds on every resize event (shared.js:1287-1295,1438): debounce ~150ms.
24. `/api/fleet/access` probed every page load (shared.js:2524): 5-min sessionStorage TTL cache.

## status.js

25. Firewalla search re-renders 300 rows + charts per keystroke (status.js:651-654): debounce + patch devices tbody only.
26. Silent 300-device truncation (status.js:483,498): visible "showing 300 of N" note.
27. Devices reshuffle between polls (status.js:481): stable secondary sort by name.
28. Failed GPU/wakes/asks fetches cached for full 60-120s TTL (status.js:1213,1470,1565): short error TTL so recovery is quick.
29. Alert-chip mute is unreachable by keyboard (status.js:1041-1051): focusable ack control.
30. `CHIP_TARGETS` lacks kernel/drift kinds the strip emits (status.js:781-790 vs 826-865): add targets.
31. Untraced data fetches bypass RUM (status.js:642 fw, drilldown.js:34, activity.js:90, cost.js:244, hosts.js:143): switch to `tracedFetch`.
32. Disk forecast is one joined text line (status.js:1132-1155): per-mount list sorted by days_to_full.
33. Uptime ledger rows are title-only, no keyboard/aria (status.js:1157+): row-level labels + focusable cells summary.

## operations.js

34. Request budget says 15s, actual timeout 25s (operations.js:77 vs 28): align.
35. Agent/severity filters trigger full network refetch (operations.js:149-155): filter the in-memory incidents; refetch only on mutations.
36. Agent select rebuilt via innerHTML every 30s closes the open dropdown (operations.js:131-140): rebuild only when the agent set changes.
37. One failed fetch blanks every panel (operations.js:204-208): `Promise.allSettled` per panel + keep last-good with stale marker.
38. Slow exporter-coverage/history feeds re-fetched every 30s (operations.js:90): client TTL.
39. Incident timeline unbounded (operations.js:120-126): cap ~50 with older note.

## observability.js

40. CSV/SVG export ignores active filters (observability.js:125-138): export the filtered set.
41. Explorer table unsortable + `key` can collide (observability.js:196-227): click-to-sort with aria-sort; include run_id.
42. Lane dots title-only; lane stats ignore host filter (observability.js:169-193): focusable dots + stats recomputed from filtered runs.
43. Cost chart rebuilt unconditionally every 30s (observability.js:82-123): signature guard (activity.js:53 pattern).
44. SSE closes permanently after 3 failures (observability.js:357-363): slow 5-min reconnect retry.

## cost / hosts / activity / drilldown

45. cost.js+hosts.js each poll /api/fleet/metrics separately with plain fetch (cost.js:242-257, hosts.js:141-157): share one SSE-first loader (stream exists) via a tiny module.
46. Cost trend chart is title-only (cost.js:39-71): adopt the shared chartTooltip crosshair.
47. Leaderboard hard-capped at 6 (cost.js:122): "show all N" expander.
48. Activity feed has no empty state; paused mode silently drops incoming events (activity.js:51-107): empty-state line + "+N while paused" counter.
49. Drilldown waits for network before showing anything; sub-cent costs read $0.00; dead `tryOpen`/cursor-listener code (drilldown.js:106-156,233-235,271-274): skeleton-first open, 4-decimal small costs, delete dead code. Hosts alert chips link bare status.html (hosts.js:43): deep-link #alert-strip.

## ollama.js

50. No Stop for streaming generation (ollama.js:709-777): AbortController + Stop button swap.
51. Failed generation is a dead end; no copy/export; clear is unrecoverable (ollama.js:769-783): per-bubble retry, per-message copy, Markdown download, one-undo clear.
52. Streaming repaints fight scroll and destroy `<details>` state (ollama.js:636-646,742-764): patch the streaming bubble only; autoscroll only when near bottom.
53. SSE frame parser drops multi-line `data:` fields and `\r\n` (ollama.js:746-753): spec-complete parser.
54. VRAM + latency charts have no crosshair (ollama.js:327-390): feed the existing chartTooltip.
55. Global BUSY gives no row feedback; benchmark results evaporate (ollama.js:24,508,520): per-row pending state + persistent last-benchmarks panel.
56. Pull panel: input editable while pulling, no elapsed time, no cancel (ollama.js:593-627).
57. One failed GPU fetch blanks the panel and loses history (ollama.js:1001-1005): keep last render + stale-since badge.
58. Uptime strip piles pre-window samples into the oldest bucket (ollama.js:146-151): filter age>SPAN.
59. A/B wipes composer even when both legs fail; drafts die on reload; option inputs accept anything (ollama.js:848,838-841,665-682): conditional clear, localStorage drafts, range validation.
60. Models table unsortable (ollama.js:446-487): click-to-sort th with aria-sort.

## network.js / agora.js

61. Socket table: no text filter/sort; 400-row cap hides rows irrecoverably (network.js:81-100): filter+sort before slice.
62. Throughput chart hardcodes brand-off hexes and silently mixes interfaces (network.js:117-121,149): CSS vars + change annotation.
63. Agora poll re-render clobbers scroll (agora.js:104,137-153): preserve scroll / "N new — jump" pill.
64. 100-post truncation invisible (agora.js:143): "showing last 100 of N" notice.
65. Composer drafts die on reload; bare URLs in messages unlinked (agora.js:203-231,62-69): draft persistence + scheme-checked linkify.

## main.js / home.js / fleet.js

66. pulseSSE's catch path leaves no poll fallback and roster/spend never refresh again (main.js:211-242,370): fallback in catch + piggyback refreshes.
67. Wake dots are title-only (main.js:297-315): aria-label per dot + hidden summary line.
68. home.js wipes device data on any blip; no skeleton; no manual refresh (home.js:5-22): keep last render + stale note, skeleton, refresh button.
69. Fleet "live mesh feed" line is a stale-forever one-shot (fleet.js:87-99): 60s refresh or shared SSE.
70. `?agent=`/`#agent-` deep link ignores the mobile accordion (fleet.js:144-150 vs 265-298): open the containing details first.
71. Packet-flow rAF runs whenever visible regardless of viewport (fleet.js:227-253): IntersectionObserver gate.

## Visual scenes

72. Fixed-timestep bug: storm/wxsky clouds/fog/mist integrate with hardcoded `*0.016` (storm-scene.js:583-647, wxsky.js:320-331) — 2× speed on 120Hz. Use dt.
73. Galaxy flick inertia decays frame-rate-dependently (galaxy.js:465): dt-correct the 0.94 decay.
74. storm-scene has no viewport pause (storm-scene.js:731-750): IO like wxsky.js:418-424.
75. storm/wxsky/particles ignore `motionPaused()` (the dock pause covers 3D only): static frame + stop.
76. 2D canvases have no quality tier: storm DPR fixed 1.5, 220 rain strokes, triple shadowBlur bolts (storm-scene.js:262,510-518,656); wxsky same DPR: add lite mode (DPR 1.0, halved counts, no shadowBlur).
77. particles canvas uses uncapped DPR (particles.js:58,117): cap 2; drop duplicate init size postMessage (66-67).
78. Galaxy nebula = 3×5-octave fbm at full res every dirty frame (galaxy.js:527-532): bake to the existing quarter-res target and sample in composite.
79. cinematic animates `filter: blur()` on hero text every scroll frame (cinematic.css:47,53): gate blur terms to ≥900px + fine pointer.
80. wxsky sun/moon pinned at one spot all day (wxsky.js:303): arc by time from sunrise/sunset.
81. wxsky moon always full (wxsky.js:134-137): synodic-phase mask.
82. wxsky sky gradient is binary day/night (wxsky.js:218-232): warm dawn/dusk stops ±45min around sunrise/sunset.
83. wxsky rain density ignores actual mm (wxsky.js:440-441): blend `precipitation` mm/h.
84. wxsky re-bakes all sprites + clouds on every update and every hover (wxsky.js:455,465,484): bake sprites per resize; clouds only on day/night flip.
85. wxsky preview hard-swaps (wxsky.js:460-485): tween cloud/rain/wind/dark ~500ms.
86. Particle comet tails detach on curved trunks (fleet-particles-worker.js:83-93, particles.js:147-156): sample along tangent in both paths; fallback reuses sampled points instead of per-frame getPointAtLength.
87. Particle colors random per spawn, spawns unweighted by trunk length (particles.js:121-130): stable per-trunk hue + length weighting; `lighter` composite.
88. storm-scene parallax snaps (storm-scene.js:93,386): ease mx/my; incident embers get tooltips + `fleet.html#agent-` links (627-642).
89. cinematic spotlight writes --spot-x/y synchronously per pointermove event (cinematic.js:96-100): rAF-batch.

## Markup, styles & tooling

90. Complete OG/Twitter meta on home/operations/reliability/runbooks (og:title/og:description/twitter:card) + og:description+twitter:card on 404.
91. `<link rel="apple-touch-icon">` on all 15 pages + add `icon-192-maskable.png` to the manifest (only 512 exists).
92. Galaxy unreachable on mobile: add to `MOBILE_PAGES` (shared.js:1996-2001).
93. sync_nav.py NAV omits home/runbooks → runbooks.html marks the WRONG page aria-current and misses Operations/Galaxy (tools/sync_nav.py:5-7): extend NAV, re-run.
94. Test coverage gaps: smoke.sh page/JS loops omit home; audit.mjs omits home+404; smoke checks dead specrules.json (smoke.sh:14-16, audit.mjs:11-15): cover, drop dead check.
95. Print consolidation: gale.css:2075-2079 `break-inside: avoid` conflicts with mobile.css:253-297 (which documented removing it) — defer to the mobile.css system.
96. `--crit` state tokens live only in mobile.css (mobile.css:301-303) while gale.css falls back to a DIFFERENT red: define in gale.css too; document the deliberate fleet-tidal token divergence (fleet-tidal.css:15-44).
97. Replace the regex CSS minifier (edits inside strings/data-URIs, rewrite-dist-refs.mjs:70-75) with esbuild CSS minify.
98. Head hygiene sweep: `<meta name="referrer" content="no-referrer">` everywhere; root-relative og:image; unify theme-color #05070d→#02060d on index/404; align robots meta (add noindex to index/fleet/weather/404 to match robots.txt).
99. Table semantics: `<caption>` + `scope="col"` on the 15 static tables (status ×11, network ×3, observability ×1).
100. Content parity: footers on operations/reliability/home/runbooks; reliability "Scan N pages" label derived from SITE_PAGES.length; `<time datetime>` on index history/journal dates; refresh fleet.html's stale hardcoded welcome/footer dates.
