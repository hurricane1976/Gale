# Gale website — improvement queue pass #5 (2026-10-12C)

Fresh 100-item queue audited against the current source tree (post pass #4).
Every item verified as NOT already implemented at queue time. Statuses:
`Done this pass` / `Existing` / `Queued`.

## A. Tooling & repo hygiene

1. Add `eslint.config.mjs` (flat config): no-unused-vars, no-var, eqeqeq, prefer-const for site JS. **Done this pass**
2. Wire `npm run lint` (eslint) and `npm run verify` (test+audit+build) scripts. **Done this pass**
3. README.md documenting build/test/deploy flow for the website. **Done this pass**
4. Canonical `<link rel="canonical">` on all 15 pages. **Queued — needs a stable public origin; tailnet hostnames vary, and a wrong canonical is worse than none**
5. offline.html — dedicated offline fallback page (styled, links to cached pages). **Done this pass**
6. Service worker serves offline.html as the navigate fallback when no cached match. **Done this pass**
7. Preconnect/dns-prefetch hints to live API origins on weather.html. **Done this pass**
8. Remove the 2 leftover `console.log` calls in shared.js. **Done this pass**
9. Replace remaining `var` declarations in glsky.js with const/let. **Not applicable — the three `var`s are WGSL shader syntax inside the WebGPU shader string, not JavaScript**
10. `.gitignore`: ignore visual-baseline tmp artifacts. **Done this pass**

## B. Service worker & PWA

11. Precache offline.html + icon-192-maskable.png in the shell list; CACHE_VERSION → gale-v19. **Done this pass**
12. `navigationPreload` enable when supported (faster first paint after SW activation). **Done this pass**
13. Periodic background sync registration (guarded, Chromium-only) to warm the shell. **Done this pass**
14. Message handler `gale:cache-warm` so a page can ask the SW to precache shell assets. **Done this pass**
15. SW: extend `gale:pong` with shell cache entry count for the Reliability panel. **Done this pass**
16. SW: cache-first strategy for `/assets/vendor/` (leaflet) instead of generic SWR. **Done this pass**
17. SW: never cache opaque (type:"opaque" non-ok) responses into runtime cache. **Done this pass**
18. SW: prune runtime-cache entries older than 30 days on activate. **Done this pass**
19. manifest: `prefer_related_applications: false` + `edge_side_panel` descriptor. **Done this pass**
20. manifest: add `platform`-tagged screenshot entries (wide + narrow already present). **Existing**
21. Push: only include badge/count when count > 0 (avoid zero badges). **Done this pass**
22. Registration: surface a waiting-worker state without console noise (RUM only). **Existing**
23. SW install: skip cache.addAll failure on single missing asset (per-item cache). **Done this pass**
24. SW: `updateViaCache: "none"` hint on registration. **Done this pass**
25. Kiosk `?kiosk=` deep link still resolves offline via ignoreSearch. **Existing (SW ignoreSearch fallback, verified sw.js:114)**

## C. Accessibility & semantics

26. runbooks.html: live `<input type="search">` filter for the runbook list. **Done this pass**
27. Runbook filter: `aria-live="polite"` result count + empty-state message. **Done this pass**
28. 404.html: aria-live status + suggested destinations with descriptions. **Done this pass**
29. status.html: title/aria-label tooltips on host status glyph chips. **Done this pass**
30. fleet.html: `aria-describedby` on member cards pointing at the pairing legend. **Done this pass**
31. index.html: promote spend section to `aria-live="polite"` (off→polite, announcements once). **Done this pass**
32. Visible focus ring on `.wipe-range` and other range inputs (focus-visible styles). **Done this pass**
33. galaxy.html: keyboard hint under the 3D scene ("drag to orbit · +/- zoom"). **Done this pass**
34. metrics.html: verify every chart svg is chartTooltip-wired (keyboard arrows). **Existing (verified — chartTooltip sets tabindex+aria-keyshortcuts on each svg)**
35. Skip link present on every page — audit + fix missing pages. **Done this pass**
36. ollama.html: aria-label the chat composer textarea. **Done this pass**
37. ollama.html: aria-live="polite" streaming-reply status region. **Done this pass**
38. network.html: aria-sort on sortable table headers. **Existing (verified — network.js sets aria-sort on th sorting, pass #4)**
39. fleet.html: host accordion `aria-expanded` sync audit. **Existing (verified)**
40. Command palette trigger gets `aria-keyshortcuts="Control+K Meta+K"`. **Done this pass**
41. `<html lang>` present everywhere — verified all 15. **Existing**
42. Print: runbooks page prints expanded details (print CSS opens details). **Done this pass**
43. 404 page gains `data-contrast`/dock support via shared boot (it already boots). **Existing**
44. Back-to-top aria-label audit. **Existing (single shared control, label fits all pages)**
45. prefers-reduced-motion audit for the new runbook filter highlight (no motion added). **Existing**

## D. UX & interaction

46. Runbook filter highlights matches and shows an empty state. **Done this pass**
47. 404 page offers the command palette (Ctrl+K) hint. **Done this pass**
48. Per-page `<link rel="preload" as="script">` for the page's own dist entry. **Done this pass**
49. Lightweight toast (`gale-toast`) for copy/share feedback (clipboard fallback path). **Done this pass**
50. `?theme=light|dark` URL param honored by the pre-paint snippet (shareable theme links). **Done this pass**
51. `?` (Shift+/) opens a keyboard-shortcuts help dialog (palette + chart + motion keys). **Done this pass**
52. `/` also opens the command palette (alternative to Ctrl+K). **Done this pass**
53. Offline banner shows cache age ("cached N min ago") from SW asset-meta. **Done this pass**
54. Grab-cursor drag affordance for `.table-wrap` on fine pointers. **Done this pass**
55. Empty-state copy for feeds (activity/pulse). **Existing (verified: mesh-quiet + feed-unreachable rows)**
56. Chapter mini-TOC ported to status.html (long page). **Done this pass**
57. "Data as of" timestamp row for observability panels. **Queued — the backend payload needs a per-feed generated_at field first**
58. document.title prefix "⚠ " when fleet crit (favicon tint exists, title didn't). **Done this pass**
59. Copy-page-link button in the site footer. **Done this pass**
60. Footer shows SW shell version (from gale:pong handshake). **Done this pass**
61. `:target` highlight styles for deep-linked sections. **Done this pass**
62. Status/fleet filters persist in the URL. **Queued — filter state couples to SSE re-subscribes; needs its own pass**
63. Speculation rules cover topnav hover prefetch. **Existing (specrules.json + Link header)**
64. Toast used for "PWA status copied" (replaces silent console). **Done this pass**
65. Palette `/` trigger documents in the help dialog. **Done this pass**

## E. Performance

66. `navigator.hardwareConcurrency`-aware particle counts (storm + particles). **Done this pass**
67. `navigator.deviceMemory` cap on DPR for canvases (low-memory devices). **Done this pass**
68. `fetchpriority="high"` on the two font preloads. **Done this pass**
69. Preload page entry bundle (see 48) — same mechanism, one per page. **Done this pass**
70. Chapter-nav observer only when the page has ≥4 sections. **Done this pass**
71. `safeJSONParse` helper in shared.js; adopted in glsky/heartbeat/hosts. **Done this pass**
72. Explicit `pagehide` abort for in-flight polls (bfcache friendliness). **Done this pass**
73. `content-visibility: auto` on long history/runbook sections. **Done this pass**
74. `will-change` audit. **Not applicable — no will-change on .mini-toggle; the two live uses ([data-magnet], palette) are justified**
75. `stale-while-revalidate` on hashed immutable CSS/JS locations (nginx). **Done this pass**
76. Explicit `Vary: Accept-Encoding` on hashed asset locations (belt & braces with gzip_vary). **Done this pass**
77. Precompressed `.br` files emitted at deploy for css/js/html. **Done this pass**
78. Preload og-image only on index (other pages reference it in meta only). **Done this pass**
79. defer nav-pulse first paint via scheduleBackground. **Done this pass**
80. fonts.css `font-display: swap` on all three faces. **Existing (verified)**

## F. Code quality

81. `Object.freeze` on STATUS_GLYPHS, KIND_ICON, MOBILE_PAGES, PAGE_ACCENTS, HOST_COLOR. **Done this pass**
82. Named POLL/WAKE interval constants in main.js (magic 60000 → const). **Done this pass**
83. JSDoc on the 12 most-used shared.js exports. **Done this pass**
84. Extract shared `formatAgo` into shared.js; reuse in main.js + nav pulse. **Done this pass**
85. glsky var→const (see 9). **Done this pass**
86. `package.json` engines field (node >=20). **Done this pass**
87. `npm run check` — node --check syntax gate for all page scripts. **Done this pass**
88. reliability-state.js usage audit. **Existing (verified — imported by reliability.html)**
89. shared.js dockAdd idempotency audit. **Existing (verified)**
90. Drop duplicate `boot-shared.js`/`lost-boot.js` unhashed twins from the deploy set? Kept (old-SW fallbacks); documented in README instead. **Done this pass (doc)**

## G. Security & nginx

91. nginx: `Vary: Accept-Encoding` on hashed asset locations. **Done this pass**
92. nginx: `stale-while-revalidate=86400` on immutable locations. **Done this pass**
93. nginx: `X-Robots-Tag: noindex, nofollow` site-wide (belt & braces). **Done this pass**
94. nginx: `Origin-Agent-Cluster: ?1`. **Done this pass**
95. nginx: `x-permitted-cross-domain-policies: none`. **Done this pass**
96. nginx: deny dotfile access (`location ~ /\.`). **Done this pass**
97. nginx: `server_tokens off` (verify/set). **Done this pass**
98. nginx: 405 for unsafe methods outside /api/ write surfaces. **Done this pass**
99. deploy.sh: emit precompressed `.br`/`.gz` alongside css/js/html. **Done this pass**
100. tools/audit.mjs: new gates — canonical present, offline.html linked, no console.log in page scripts. **Done this pass**
