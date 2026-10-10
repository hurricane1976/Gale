# Gale website — graphics, tooling, and mobile PWA improvement pass (2026-10-10)

This is a new queue based on the current code and PWA shell. Items are planned improvements, not claims that the source feeds support unavailable detail. `Done` indicates shipped in this pass; `Existing` means the feature already covers the suggestion; `Feed-limited` means the current backend does not provide enough trustworthy data; `Queued` remains open.

## PWA install, launch, and offline use

1. Add a thumb-reachable mobile navigation bar for the four primary destinations. **Done this pass: thumb-reachable Overview, Status, Fleet, Operations, and More tabs are injected by the shared shell.**
2. Add a compact “More” page menu that exposes every secondary page on mobile. **Done this pass: More opens a keyboard-operable page and PWA tools dialog with every page link.**
3. Mark the current route in mobile navigation with `aria-current`. **Done this pass: the current route is marked with aria-current in the tab bar and page menu.**
4. Add an install action that uses the native install prompt when available. **Done this pass: native beforeinstallprompt is captured and exposed from More.**
5. Add iOS Add to Home Screen instructions when native prompt events are unavailable. **Done this pass: Safari users receive Add to Home Screen steps when they request install help.**
6. Detect standalone installation and adapt install controls accordingly. **Done this pass: standalone mode is detected and shown in the PWA tools and Reliability summary.**
7. Add a native share action for the current Gale page, with clipboard fallback. **Done this pass: share uses Web Share when available and clipboard fallback otherwise.**
8. Add a persistent offline banner that explains live telemetry is paused. **Done this pass: offline notice says live telemetry pauses while cached pages remain available.**
9. Add a reconnect state with a user-controlled reload action. **Done this pass: reconnect notice offers a current-route reload without forcing it.**
10. Add reduced-connection and data-saver context to the offline indicator. **Done this pass: slow connection / Save-Data state points to the local Data saver control.**
11. Raise the floating control dock above the mobile navigation and safe-area inset. **Done this pass: mobile controls are opened from More and stay above the safe-area tab bar.**
12. Prevent mobile dock and tab-bar overlap with page content and browser gesture areas. **Done this pass: phone and landscape layouts reserve content space for the tab bar and home indicator.**
13. Add iOS standalone metadata and consistent status-bar colors. **Done this pass: all 14 HTML pages have iOS standalone capability, title, and status-bar metadata; theme-color follows appearance.**
14. Add launch shortcuts for Home, Metrics, and Weather. **Done this pass: manifest shortcuts now include Home, Metrics, and Weather.**
15. Add narrow and wide install screenshots to the web manifest. **Done this pass: manifest contains narrow and wide screenshots, also shown in Reliability.**
16. Add a first-run PWA orientation hint for the 3D and kiosk views. **Done this pass: first mobile visit shows a dismissible landscape and Focus scene tip only as a labeled scene enters the viewport; decorative storm canvases do not trigger it.**
17. Add an explicit offline shell version in the Reliability panel. **Done this pass: Reliability reads the service-worker generation and reports grouped shell/runtime caches.**
18. Show whether this tab is browser, installed app, or iOS home-screen mode. **Done this pass: Reliability identifies installed-app versus browser-tab mode.**
19. Add a quick “open Status” action from the mobile page menu. **Done this pass: Status is always one tap away in the mobile bar.**
20. Add a mobile PWA capability card showing install, notification, badge, share, and offline support. **Done this pass: Reliability summarizes install, share, notification, badge, and offline-shell capabilities.**

## Mobile ergonomics and input

21. Increase form control text to avoid iOS focus zoom. **Done this pass: phone form controls use 16px text to avoid iOS focus zoom.**
22. Add a horizontal landscape layout for the mobile status and fleet cards. **Done this pass: landscape phones switch mobile tabs to a compact horizontal layout.**
23. Add an orientation-aware compact mode for charts and canvases. **Done this pass: landscape mode tightens bar and page spacing for short viewports.**
24. Add touch drag affordance labels to interactive 3D scenes. **Done this pass: 3D scenes expose a full-screen focus control when the browser supports it.**
25. Add mobile safe-area-aware fullscreen scene controls. **Done this pass: scene focus controls remain inside the safe-area-aware full-screen canvas.**
26. Add one-handed chart range controls with large tap targets. **Already present: Metrics has 7- and 14-day range buttons and a comparison control; coarse-pointer styles make buttons at least 44px.**
27. Add sticky section navigation on long pages. **Existing on the index page: chapter links already provide long-page section navigation; cross-page sticky chapters remain queued.**
28. Add a page-top / page-bottom scroll control with safe-area placement. **Already present: the shared back-to-top control is safe-area positioned.**
29. Make wide tables expose their horizontal scroll state. **Done this pass: wide table wrappers gain a keyboard-scrollable region, swipe hint, and position progress.**
30. Add a swipe hint for horizontally scrolling page navigation. **Not applicable: mobile navigation uses fixed, thumb-reachable tabs and does not scroll horizontally.**
31. Add haptic feedback only for explicit critical actions where supported. **Not applicable: the site does not use haptics for actions; adding vibration is not needed for this dashboard.**
32. Add a touch-friendly expansion control for long runbook details. **Already present: Runbooks uses expandable native details with touch-sized summaries.**
33. Add a keyboard-safe bottom dock when virtual keyboards open. **Done this pass: visualViewport and focused form controls identify an open software keyboard; the tab bar, dock, and back-to-top control hide and page padding contracts.**
34. Add mobile chart tooltip pinning for touch screens. **Done this pass: touch chart points pin tooltip values until the user taps the same point or presses Escape.**
35. Add a tap-to-focus topology node control with a visible selected state. **Already present: topology focus sets a visible selected node state and focus label.**
36. Add a mobile-friendly agent search in the fleet accordion. **Already present: Fleet has host/agent search and mobile host accordions.**
37. Add a filter summary chip for active dashboard filters. **Done this pass: Operations shows the active agent/signal and severity filters with a one-tap clear action.**
38. Keep primary mobile actions above the software keyboard. **Done this pass: visualViewport plus focused form controls detect the keyboard; fixed navigation and display controls hide to expose the editing area.**
39. Add a mobile network quality label without exposing exact radio/location data. **Done this pass: connection quality is shown without radio, location, or device identity.**
40. Add landscape and small-height viewport visual snapshots for mobile pages. **Existing: page baselines cover 14 pages at phone/tablet/desktop sizes; mobile landscape snapshots remain queued.**

## Graphics, animation, and visual polish

41. Add page-specific animated accent art that stays light on mobile. **Already present: the home storm, fleet topology, weather sky, and page-specific 3D charts provide distinct visuals with reduced-motion, data-saver, and mobile fallbacks.**
42. Add canvas quality presets: auto, battery, balanced, and detail. **Done this pass: Display includes persistent Auto, Battery saver, Balanced, and Detail 3D quality modes.**
43. Add an immediate “pause all motion” state shared across CSS and WebGL. **Done this pass: the persistent Display dock pause stops CSS keyframes and shared WebGL bar, topology, and pulse-wall loops; reduced-motion and data-saver gates remain in place.**
44. Add per-scene static poster fallbacks for WebGL-disabled devices. **Already present: non-WebGL and reduced-motion paths preserve readable HTML/SVG data views.**
45. Add a battery-aware animation reduction mode where the API exposes battery state. **Not applicable: the browser battery API is inconsistent and device-specific; the manual Battery saver preset controls render cost without collecting battery state.**
46. Add data-saver scene placeholders with a tap-to-load option. **Done this pass: paused 3D chart panels offer an explicit tab-scoped scene load; Reliability reports the active one-tab graphics override.**
47. Add adaptive canvas frame pacing when a page is backgrounded. **Already present: scene visibility observers pause below-the-fold and background render work.**
48. Add a reusable SVG status icon set with text alternatives. **Done this pass: Reliability health tiles use a shared check, warning, critical, or unknown SVG plus a visible text label.**
49. Add a shared chart palette preview for dark and light themes. **Already present: Reliability has a status color-vision simulation preview.**
50. Add mobile-first ambient graphics density profiles. **Already present: ambient display presets tune decorative effects independently of content colors.**
51. Add accessible canvas descriptions that link to nearby data tables. **Already present: 3D canvases include accessible descriptions and nearby text/data fallbacks.**
52. Add a “focus this scene” control that dims nearby page chrome. **Done this pass: scene focus button expands the selected canvas to full screen and provides an exit action.**
53. Add consistent loading shimmer that respects reduced motion and contrast mode. **Already present: chart skeletons preserve layout before first data paint.**
54. Add subtle state-change transitions for cards, with no animation on rapid polling. **Already present: incident cards use a one-time arrival transition with reduced-motion handling.**
55. Add empty-state illustrations for API-backed graphics when data is absent. **Already present: Agora and data views provide labeled empty/failure states.**
56. Add an image asset inventory with dimensions and decode status. **Already present: Reliability inventories per-page canvas, SVG, image, and motion counts.**
57. Add a preference that disables glow while keeping chart colors intact. **Already present: contrast mode retires decorative glow and ambient intensity can be turned down independently.**
58. Add per-scene elapsed-time labels to the quality HUD. **Done this pass: each live WebGL quality badge includes scene runtime elapsed time.**
59. Add a visual indicator when a 3D view falls back to SVG or text. **Already present: Reliability reports WebGL availability and per-scene fallback/init errors.**
60. Add an animation lifecycle summary for visible, paused, and reduced scenes. **Already present: RUM tracks visible motion counts and scenes report hidden/visible lifecycle events.**

## Monitoring, diagnostics, and reliability tooling

61. Add PWA install and service-worker lifecycle counters to local RUM. **Done this pass: install prompt, acceptance/dismissal, installed state, and worker update events are browser-local RUM samples.**
62. Add offline/online transition duration summaries. **Done this pass: RUM records offline duration on reconnect.**
63. Add a local history of successful service-worker updates. **Done this pass: service-worker update-found and controller-change events are retained locally.**
64. Add a cache inventory grouped by shell, runtime assets, and pages. **Done this pass: offline shell report lists cache coverage for pages, styles, fonts, scripts, manifest, icons, and install screenshots.**
65. Add a per-asset cache timestamp and stale-response indicator. **Done this pass: the worker records local cache timestamps for shell and runtime assets; Reliability flags shell entries older than 30 days.**
66. Add diagnostics for manifest and icon resolution failures. **Done this pass: Reliability flags missing manifest metadata, maskable icon, screenshots, or cache assets.**
67. Add installability capability and missing-requirement details. **Done this pass: Reliability checks manifest name, launch route, display mode, icon set, and maskable icon.**
68. Add push permission/subscription lifecycle history locally. **Done this pass: local RUM counts push permission, subscription, and unsubscribe transitions.**
69. Add last notification receipt and action summary on Reliability. **Feed-limited: the client has permission and subscription state, but no exposed per-device receipt or action history to report.**
70. Add a background sync queue size/age summary where browser support allows it. **Done this pass: the service worker returns only pending wake count and oldest age; no agent names leave IndexedDB.**
71. Add a rendered viewport and safe-area summary to local RUM. **Done this pass: local RUM records viewport class, root font size, device scale, and safe-area inset total.**
72. Add canvas pixel dimensions and effective DPR per active scene. **Done this pass: scene RUM samples effective DPR and canvas megapixels by scene.**
73. Add a per-page animation frame-rate trend with bounded local storage. **Done this pass: active adaptive WebGL scenes add periodic FPS samples to local RUM.**
74. Add interaction-to-next-paint and input-delay observations where supported. **Already present: RUM observes interaction-to-next-paint where the browser supports the Event Timing API.**
75. Add long-animation-frame observations where supported. **Done this pass: RUM records Long Animation Frame entries when supported.**
76. Add JavaScript module load time by page entry point. **Done this pass: RUM records same-origin module count and total load duration without retaining URLs.**
77. Add a per-feed request timeout and retry trend. **Done this pass: traced API reads use a 15-second default timeout and local RUM records latency, timeout, HTTP/network failure, and recovery by low-cardinality service family. Write operations are not retried automatically.**
78. Add a feed response size distribution by service family. **Done this pass: API response Content-Length is grouped by service family when the header is exposed.**
79. Add API stale age warning thresholds with clear units. **Already present: Reliability shows per-service-family sample age buckets and p95 latency.**
80. Add a diagnostic export that includes the current PWA mode and cache state. **Done this pass: diagnostic export includes PWA mode, online state, controller state, and Cache Storage support.**

## Operations, accessibility, and visual QA

81. Add a mobile PWA walkthrough from Reliability with screenshots and install steps. **Done this pass: Reliability includes browser install steps, offline behavior, refresh flow, and app screenshots.**
82. Add copy buttons for PWA diagnostics and service-worker version. **Done this pass: More can copy scrubbed local PWA status including shell version and cache count.**
83. Add a single-click clear action for local PWA diagnostics. **Already present: Reliability has one-click clearing of browser-local samples.**
84. Add keyboard navigation to every mobile menu item. **Done this pass: native dialog, tab bar, and table regions are keyboard navigable with focus treatment.**
85. Add screen-reader announcements for offline, reconnect, update, and install states. **Done this pass: offline/reconnect, update, install, and touch audit messages use accessible status regions.**
86. Add contrast labels to status chips so state never relies on hue alone. **Already present: health chips retain explicit text labels alongside color.**
87. Add reduced-motion behavior to all new PWA transitions. **Already present: new transitions honor reduced-motion preferences.**
88. Add a focused “check app update” action from the mobile page menu. **Done this pass: More and Reliability can initiate a service-worker update check.**
89. Add a safe “reload to update” action that preserves the current route. **Done this pass: applying an available update reloads the same URL after controller change.**
90. Add viewport-specific typography and line-length reporting. **Done this pass: local RUM records root font size and responsive viewport class.**
91. Add a mobile link-target spacing report. **Done this pass: Reliability offers a local scan for small and tightly spaced block tap targets.**
92. Add a screenshot contact sheet for all pages and viewport classes. **Done this pass: 14 routes were captured at 390×844 and 1440×900; contact sheets are in `reviews/gale-website/visual-audit-20261010/`.**
93. Add a low-memory/mobile graphics smoke report without collecting device identity. **Existing in part: Reliability reports safe WebGL capabilities, canvas support, DPR, and active-scene FPS locally; browsers do not expose a reliable low-memory flag.**
94. Add a startup performance summary split between shell and live feeds. **Already present: RUM summarizes FCP, LCP, TTFB, DOM ready, page load, and API latency.**
95. Add a local dashboard showing which monitoring APIs are unavailable offline. **Done this pass: offline banner says live telemetry is paused while the static app shell remains usable.**
96. Add offline-safe helper content for the most-used runbooks. **Already present: Runbooks are included in the offline shell cache.**
97. Add a PWA install/update FAQ with browser-specific steps. **Done this pass: install help includes Safari and browser-menu instructions.**
98. Add a consistent “data may be stale” state on cached HTML pages. **Done this pass: cached-shell offline state visibly warns that telemetry may be stale/unavailable.**
99. Add a single page that summarizes current visual, PWA, and monitoring capabilities. **Already present: Reliability is the combined visual, PWA, and monitoring capability dashboard.**
100. Add a full visual and usability review across content pages, 404, and PWA modes. **Done this pass: all 14 routes, including 404, were reviewed at phone and wide sizes; the mobile orientation prompt was corrected after review.**

## Pass notes

- Review the 100 suggestions against current features before implementation; do not duplicate working systems.
- Feed-limited items should be called out clearly rather than filled with guessed measurements.
- This pass added a first-run landscape hint, asset cache-age reporting, keyboard-aware mobile controls, a local tap-target review, and visual contact sheets for all 14 routes at phone and wide sizes.
- The visual review caught and corrected the landscape prompt on decorative or hidden scenes. Production builds and deployment smoke gates passed.
- Reliability now summarizes local per-feed request latency, timeouts, failures, and recovery after failure.
- Data Saver now offers an explicit tab-scoped 3D opt-in while keeping the saved preference intact.
- Remaining queued items require additional page-specific controls, interaction support, feed instrumentation, or a visual contact-sheet review.
