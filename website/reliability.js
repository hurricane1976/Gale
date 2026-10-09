import { boot, esc, setHTML, setText, tracedFetch, downloadFile } from "./shared.js";
import { level, freshness } from "./reliability-state.js";
boot();
const $ = (id) => document.getElementById(id);
let busy = false, last = null;
let rumPage = "";
let rumRetentionHours = 24;
const money = (n) => Number.isFinite(n) ? `$${n.toFixed(2)}` : "unknown";
function render(data) {
  const feed = freshness(data);
  setText($("reliability-freshness"), `Collected ${data.generated_at} · ${feed} · refresh every 30s`);
  setHTML($("slo-grid"), data.slos.map((s) => {
    const state = level(feed === "ok" ? s : { ...s, state: "stale" });
    const value = state === "unknown" ? "Unknown" : `${s.actual.toFixed(2)}%`;
    const budget = s.budget_remaining_pct == null ? "budget unavailable" : `budget remaining ${s.budget_remaining_pct.toFixed(1)}%`;
    const actualX = Math.max(0, Math.min(100, Number(s.actual) || 0)), targetX = Math.max(0, Math.min(100, Number(s.target) || 0));
    const actualLabel = Number.isFinite(Number(s.actual)) ? Number(s.actual).toFixed(2) : "unknown";
    const threshold = `<svg class="slo-threshold" viewBox="0 0 100 14" role="img" aria-label="${esc(s.name)} actual ${actualLabel} percent against ${Number(s.target).toFixed(2)} percent target"><rect x="0" y="4" width="100" height="6" rx="3" class="slo-track"/><rect x="0" y="4" width="${actualX}" height="6" rx="3" class="slo-actual"/><line x1="${targetX}" y1="1" x2="${targetX}" y2="13" class="slo-target"/></svg>`;
    return `<div class="vital" data-level="${state}"><span class="vital-label">${esc(s.name)} · target ${s.target}%</span><span class="vital-value">${value}</span>${threshold}<span class="vital-sub">${esc(s.detail)} · ${budget}${s.coverage_pct != null ? ` · history coverage ${s.coverage_pct}%` : ""}</span></div>`;
  }).join(""));
  const c = data.coverage;
  setHTML($("coverage-proof"), `<p>${c.reachable}/${c.expected} reachable · <strong>${c.reporting}/${c.expected} reporting</strong></p>` +
    (c.missing.length ? `<ul>${c.missing.map((a) => `<li>${esc(a.agent)} · ${esc(a.host)} · listener ${esc(a.listener_state)} · owner ${esc(a.owner)}</li>`).join("")}</ul>` : "<p>All active agents report runs.</p>") +
    `<p>Reporting means at least one historical run; freshness and scheduled progress are separate.</p>` +
    `<ul>${Object.entries(data.sources).map(([name, s]) => `<li>${esc(name)}: ${esc(s.state)} · ${s.age_s ?? "unknown"}s since collection${s.latest_run_at ? ` · latest run ${esc(s.latest_run_at)}` : ""}</li>`).join("")}</ul>`);
  const synth = data.synthetics, synthFeed = data.feeds.synthetics;
  setHTML($("synth-grid"), synth?.checks?.length ? synth.checks.map((c) => {
    const state = synthFeed.state === "ok" ? (c.ok ? "ok" : "crit") : "unknown";
    return `<div class="target-card" data-level="${state}"><div class="target-top"><span class="target-name">${esc(c.name)}</span><span class="pill" data-level="${state}">${synthFeed.state !== "ok" ? esc(synthFeed.state) : c.ok ? `${c.ms}ms` : "FAIL"}</span></div><span class="mono-dim">${esc(c.url)} · ${esc(synth.checked_at)} · age ${synthFeed.age_s ?? "unknown"}s</span></div>`;
  }).join("") : '<p class="mini-note">Synthetic feed unavailable. Availability is unknown.</p>');
  const cost = data.cost;
  setText($("forecast"), `Known spend ${money(cost.known_daily_average_usd)}/day → 30d ${money(cost.known_projection_30d_usd)}. Priced coverage ${cost.coverage_pct ?? "unknown"}%; ${cost.unknown_runs} unpriced runs. Daily limit ${money(cost.daily_limit_usd)}${cost.known_daily_average_usd > cost.daily_limit_usd ? " · above policy limit" : ""}. ${cost.pricing_basis}.`);
  const b = data.backup, cfg = data.policy;
  const backupState = b.collector.state !== "ok" || b.backup_age_h == null ? "unknown" : b.backup_age_h > cfg.backup_max_age_h ? "crit" : "ok";
  const drillState = b.collector.state !== "ok" || b.drill_ok == null ? "unknown" : !b.drill_ok ? "crit" : b.drill_age_h == null || b.drill_age_h > cfg.restore_max_age_h ? "warn" : "ok";
  setHTML($("backup-proof"), `<p data-level="${backupState}">Archive freshness: <strong>${esc(backupState)}</strong> · ${b.backup_age_h ?? "unknown"}h · ${esc(b.backup_name || "no archive")}</p><p>Archive timestamp is freshness evidence; it does not prove restore success.</p><p data-level="${drillState}">Restore proof: <strong>${esc(drillState)}</strong> · ${b.drill_ok == null ? "unknown" : b.drill_ok ? "passed" : "failed"} · ${b.drill_age_h ?? "unknown"}h old · ${esc(b.drill_backup || "no drill")}</p><p>Collector: ${esc(b.collector.state)} · ${esc(b.collector.collected_at || "unknown")}</p>`);
  if (data.backup_inventory) {
    const inv = data.backup_inventory;
    setHTML($("backup-inventory"), `<p>Local proof collected ${esc(inv.generated_at)} · archive hash baseline; critical files restored in isolation.</p>` + inv.agents.map(a=>`<p>${esc(a.agent)} · ${esc(a.state)} · ${a.archive_age_h ?? "unknown"}h archive age · ${esc(a.archive || a.reason || "unknown")}</p>`).join(""));
  } else setText($("backup-inventory"), "Per-agent restore proof unavailable.");
  setText($("outcome-proof"), `${data.outcomes.verified_runs} verified successful tasks; ${data.outcomes.verification_unknown_runs} runs have no task verification. A successful process exit is not proof of completed work.`);
}
async function getJson(url) {
  try {
    const r = await tracedFetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
const tile = (label, value, sub, lv) => `<div class="vital" data-level="${lv}"><span class="vital-state" data-level="${lv}">${esc(lv)}</span><span class="vital-label">${esc(label)}</span><span class="vital-value">${esc(value)}</span><span class="vital-sub">${esc(sub)}</span></div>`;
async function coverage() {
  const [exp, bk, pr, reg] = await Promise.all([getJson("api/exporter-coverage.json"), getJson("api/backup-proof.json"),
    getJson("api/probes.json"), getJson("api/fleet/registry")]);
  const tiles = [];
  if (exp && Array.isArray(exp.nodes)) {
    const machines = exp.nodes.filter((x) => !x.alias_of), n = machines.length, i = machines.filter((x) => x.instrumented).length, al = exp.nodes.length - n;
    tiles.push(tile("Host metrics (node_exporter)", `${i}/${n}`, `remote machines scraped${al ? ` · ${al} extra address${al > 1 ? "es" : ""} front the same machine` : ""}; others have no host-level alerts`, i === n ? "ok" : i ? "warn" : "crit"));
  } else tiles.push(tile("Host metrics (node_exporter)", "Unknown", "exporter-coverage feed unavailable", "unknown"));
  if (pr && Array.isArray(pr.peers)) {
    const up = pr.peers.filter((x) => x.ok).length, svc = pr.services.filter((x) => x.ok).length;
    const fresh = Date.now() - new Date(pr.checked_at).getTime() < 900e3;
    tiles.push(tile("Peer hosts reachable (direct TCP)", `${up}/${pr.peers.length}`, `independent of the Beacon relay · ${fresh ? "checked " + pr.checked_at : "STALE " + pr.checked_at}`, !fresh ? "unknown" : up === pr.peers.length ? "ok" : "crit"));
    tiles.push(tile("Local services", `${svc}/${pr.services.length}`, pr.services.filter((x) => !x.ok).map((x) => x.name).join(", ") || "NetBox, Zabbix, Grafana, Kuma, Loki, Alertmanager all answering", !fresh ? "unknown" : svc === pr.services.length ? "ok" : "warn"));
  } else tiles.push(tile("Direct probes", "Unknown", "probes feed unavailable", "unknown"));
  if (bk && Array.isArray(bk.agents)) {
    const ok = bk.agents.filter((a) => a.state === "passed").length;
    const total = reg && Array.isArray(reg.agents) ? reg.agents.length : null;
    tiles.push(tile("Backups restore-proven", total ? `${ok}/${total}` : `${ok}`, `Gale-hosted agents only (${bk.agents.length}); other hosts and off-box copies are not verified here`, ok === bk.agents.length && total && ok === total ? "ok" : "warn"));
  } else tiles.push(tile("Backups restore-proven", "Unknown", "backup-proof feed unavailable", "unknown"));
  setHTML($("mon-coverage"), tiles.join(""));
  setHTML($("mon-coverage-detail"), exp && exp.nodes ? `<ul>${exp.nodes.map((x) => `<li>${esc(x.host)} ${esc(x.address)} · ${x.alias_of ? `alias of ${esc(x.alias_of)} (same machine, scraped once)` : x.instrumented ? "node_exporter answering" : "no node_exporter"}</li>`).join("")}</ul>` : "");
}
function rum() {
  const allSamples = window.__galeRUM || [];
  const retention = $("rum-retention");
  if (retention) retention.value = String(rumRetentionHours);
  const cutoff = rumRetentionHours ? Date.now() - rumRetentionHours * 3600e3 : 0;
  const rangedSamples = allSamples.filter((sample) => !cutoff || (sample.ts || 0) >= cutoff);
  const pages = [...new Set(allSamples.map((s) => s.page).filter(Boolean))].sort();
  const filter = $("rum-page-filter");
  if (filter) {
    const value = rumPage || filter.value;
    filter.replaceChildren(new Option("All pages", ""), ...pages.map((page) => new Option(page, page)));
    filter.value = pages.includes(value) ? value : "";
    rumPage = filter.value;
  }
  const samples = rumPage ? rangedSamples.filter((s) => s.page === rumPage) : rangedSamples;
  const pageSummary = new Map();
  for (const sample of rangedSamples) {
    if (!sample.page) continue;
    const row = pageSummary.get(sample.page) || { views: 0, errors: 0, assetErrors: 0, viewports: new Set(), canvas: null, svg: null, motion: null, images: null, imageDimsMissing: null, imageKB: null, last: 0 };
    if (sample.metric === "PAGE_VIEW") row.views += sample.value || 1;
    if (sample.metric === "JS_ERROR" || sample.metric === "REJECTION") row.errors += sample.value || 1;
    if (sample.metric === "ASSET_ERROR") row.assetErrors += sample.value || 1;
    if (sample.metric === "VIS_CANVAS") row.canvas = sample.value;
    if (sample.metric === "VIS_SVG") row.svg = sample.value;
    if (sample.metric === "VIS_MOTION") row.motion = sample.value;
    if (sample.metric === "IMAGE_COUNT") row.images = sample.value;
    if (sample.metric === "IMAGE_DIMENSION_MISSING") row.imageDimsMissing = sample.value;
    if (sample.metric === "IMAGE_TRANSFER_KB") row.imageKB = sample.value;
    if (sample.viewport) row.viewports.add(sample.viewport);
    row.last = Math.max(row.last, sample.ts || 0);
    pageSummary.set(sample.page, row);
  }
  const pageCards = [...pageSummary.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([page, row]) => {
    const state = row.errors || row.assetErrors ? "warn" : "ok";
    const age = row.last ? `${Math.max(0, Math.round((Date.now() - row.last) / 60000))}m ago` : "unknown";
    const inventory = row.canvas == null ? "visual inventory pending" : `${row.canvas} canvases · ${row.svg ?? "?"} SVG charts · ${row.motion ?? "?"} running animations`;
    const imageInfo = row.images == null ? "image inventory pending" : `${row.images} first-party images · ${row.imageDimsMissing ?? "?"} missing dimensions · ${row.imageKB == null ? "?" : row.imageKB.toFixed(1)} KB transfer`;
    return `<div class="target-card" data-level="${state}"><div class="target-top"><span class="target-name">${esc(page)}</span><span class="pill" data-level="${state}">${row.views} visits</span></div><span class="mono-dim">${row.errors} script/rejection errors · ${row.assetErrors} asset errors · ${esc([...row.viewports].sort().join(", ") || "viewport unknown")} · ${esc(inventory)} · ${esc(imageInfo)} · last activity ${age}</span></div>`;
  });
  setHTML($("rum-page-summary"), pageCards.length ? pageCards.join("") : '<p class="mini-note">No page history in this browser yet.</p>');
  const specs = [
    ["LCP", "Largest content paint", 2500, 4000, "ms", true], ["INP", "Interaction delay (approx)", 200, 500, "ms", true],
    ["CLS", "Layout shift", .1, .25, "score", true], ["FCP", "First content paint", 1800, 3000, "ms", true],
    ["TTFB", "Server response", 800, 1800, "ms", true], ["DOM_READY", "DOM ready", 2500, 5000, "ms", true],
    ["LOAD", "Page load", 4000, 8000, "ms", true], ["LONGTASK", "Long tasks", 50, 100, "ms", false],
    ["RESOURCE_KB", "First party transfer", 700, 1400, "KB", true], ["RESOURCE_SLOW", "Slow first party requests", 0, 2, "count", false],
    ["JS_ERROR", "JavaScript errors", 0, 1, "count", false], ["ASSET_ERROR", "Asset errors", 0, 1, "count", false],
    ["IMAGE_ERROR", "Image errors", 0, 1, "count", false], ["IMAGE_DECODE_ERROR", "Image decode failures", 0, 1, "count", false], ["REJECTION", "Unhandled rejections", 0, 1, "count", false],
    ["WEBGL_LOSS", "WebGL context loss", 0, 1, "events", false], ["OFFLINE", "Offline events", 0, 1, "events", false],
    ["SCENE_START", "3D scene starts", 999999, 999999, "events", false], ["SCENE_FALLBACK", "3D scene fallbacks", 0, 1, "events", false],
    ["SCENE_SKIP", "Scenes skipped by browser preference or hardware", 0, 1, "events", false], ["SCENE_TIER", "Adaptive graphics quality tier", 1, 2, "tier (1=full)", true],
    ["API_HTTP_ERROR", "API HTTP errors", 0, 1, "responses", false], ["API_4XX", "API client errors", 0, 1, "responses", false],
    ["API_5XX", "API server errors", 0, 1, "responses", false], ["API_NETWORK_ERROR", "API network failures", 0, 1, "failures", false],
    ["API_LATENCY", "API response time", 800, 1800, "ms", true], ["API_SLOW", "Slow API responses", 0, 2, "responses", false], ["SSE_ERROR", "Live stream errors", 0, 2, "events", false],
    ["SSE_OPEN", "Live stream opens/reconnects", 999, 999, "events", false],
    ["SCENE_FPS", "3D scene frame rate", 50, 30, "fps", true],
    ["FONT_READY", "Font readiness", 1200, 3000, "ms", true], ["FONT_ERROR", "Font load errors", 0, 1, "count", false],
    ["PAGE_VIEW", "Page visits", 999999, 999999, "views", false],
  ];
  const cards = specs.map(([name, label, good, warn, unit, percentile]) => {
    const entries = samples.filter((s) => s.metric === name && Number.isFinite(s.value));
    const values = entries.map((s) => s.value).sort((a, b) => a - b);
    const value = values.length ? (percentile ? values[name === "SCENE_FPS" ? Math.floor((values.length - 1) * .05) : Math.min(values.length - 1, Math.ceil(values.length * .95) - 1)] : values.reduce((a, b) => a + b, 0)) : null;
    const state = value == null ? "unknown" : name === "SSE_OPEN" ? "ok" : name === "SCENE_FPS" ? value >= good ? "ok" : value >= warn ? "warn" : "crit" : value <= good ? "ok" : value <= warn ? "warn" : "crit";
    const history = entries.slice(-16);
    const max = Math.max(1, ...history.map((s) => s.value));
    const points = history.map((s, i) => `${history.length < 2 ? 50 : i / (history.length - 1) * 100},${20 - (name === "SCENE_FPS" ? Math.min(1, s.value / 60) : s.value / max) * 18}`).join(" ");
    const graph = history.length > 1 ? `<svg class="rum-spark" viewBox="0 0 100 22" role="img" aria-label="${esc(label)} recent trend"><polyline points="${points}"/></svg>` : "";
    const pages = [...new Set(entries.slice(-12).map((s) => s.page).filter(Boolean))];
    const scenes = [...new Set(entries.slice(-12).map((s) => s.scene).filter(Boolean))];
    const showValue = value == null ? "No sample" : `${value.toFixed(unit === "score" ? 3 : 0)} ${unit}`;
    return `<div class="vital rum-vital" data-level="${state}"><span class="vital-state" data-level="${state}">${esc(state)}</span><span class="vital-label">${esc(label)}</span><span class="vital-value">${esc(showValue)}</span>${graph}<span class="vital-sub">${entries.length} local sample${entries.length === 1 ? "" : "s"}${percentile ? (name === "SCENE_FPS" ? " · p05" : " · p95") : " · total"}${pages.length ? ` · ${esc(pages.join(", "))}` : ""}${scenes.length ? ` · ${esc(scenes.join(", "))}` : ""}</span></div>`;
  }).join("");
  setHTML($("rum-grid"), cards);
  const routes = new Map();
  for (const sample of samples) {
    if ((!sample.metric.startsWith("API_") && !sample.metric.startsWith("SSE_")) || !sample.route) continue;
    const row = routes.get(sample.route) || { latency: [], errors: 0, slow: 0, sseErrors: 0, sseOpens: 0, lastSeen: 0 };
    if (sample.metric === "API_LATENCY") { row.latency.push(sample.value); row.lastSeen = Math.max(row.lastSeen, sample.ts || 0); }
    else if (["API_HTTP_ERROR", "API_NETWORK_ERROR"].includes(sample.metric)) row.errors += sample.value;
    else if (sample.metric === "API_SLOW") row.slow += sample.value;
    else if (sample.metric === "SSE_ERROR") row.sseErrors += sample.value;
    else if (sample.metric === "SSE_OPEN") row.sseOpens += sample.value;
    routes.set(sample.route, row);
  }
  const routeRows = [...routes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([route, row]) => {
    row.latency.sort((a, b) => a - b);
    const p95 = row.latency.length ? row.latency[Math.min(row.latency.length - 1, Math.ceil(row.latency.length * .95) - 1)] : null;
    const state = row.errors || row.sseErrors ? "warn" : p95 == null ? "unknown" : p95 > 1800 ? "crit" : p95 > 800 ? "warn" : "ok";
    const feedState = row.sseErrors > 0 ? `${row.sseErrors} stream errors / ${row.sseOpens} opens` : row.sseOpens ? `${row.sseOpens} stream opens · no errors` : "no stream sample";
    const ageMin = row.lastSeen ? Math.max(0, (Date.now() - row.lastSeen) / 60000) : Infinity;
    row.ageBucket = ageMin < 1 ? 0 : ageMin < 5 ? 1 : ageMin < 15 ? 2 : 3;
    return `<div class="target-card" data-level="${state}"><div class="target-top"><span class="target-name">${esc(route)}</span><span class="pill" data-level="${state}">${p95 == null ? "unknown" : `${Math.round(p95)} ms p95`}</span></div><span class="mono-dim">${row.latency.length} API samples · ${row.errors} API failures · ${row.slow} slow · ${feedState} · latest sample ${row.lastSeen ? `${Math.round(ageMin)}m ago` : "unknown"}</span></div>`;
  });
  if (routeRows.length) {
    const buckets = [0, 0, 0, 0];
    for (const row of routes.values()) if (row.latency.length) buckets[row.ageBucket]++;
    const max = Math.max(1, ...buckets);
    const labels = ["<1m", "1–5m", "5–15m", ">15m"];
    const histogram = `<div class="rum-age-hist" role="img" aria-label="Latest API sample age across ${buckets.reduce((a, b) => a + b, 0)} service families"><strong>Latest sample age</strong>${buckets.map((n, i) => `<span class="rum-age-bin"><i style="height:${Math.max(3, n / max * 34)}px"></i><b>${n}</b><small>${labels[i]}</small></span>`).join("")}</div>`;
    setHTML($("api-route-health"), histogram + routeRows.join(""));
  } else setHTML($("api-route-health"), '<p class="mini-note">No first-party API samples in this page selection yet.</p>');
}
async function clientRuntime() {
  const items = [];
  const controlled = !!navigator.serviceWorker?.controller;
  items.push(tile("Offline app shell", controlled ? "Active" : "Not controlling", controlled ? "This page is controlled by the Gale service worker." : "Open over HTTPS and reload after the worker installs.", controlled ? "ok" : "unknown"));
  let swState = "Not registered", swDetail = "Service-worker updates unavailable in this browser.";
  try {
    const reg = await navigator.serviceWorker?.getRegistration("/");
    if (reg) {
      swState = reg.waiting ? "Update waiting" : reg.installing ? `Installing · ${reg.installing.state}` : reg.active ? `Active · ${reg.active.state}` : "Registered · inactive";
      swDetail = `Scope ${new URL(reg.scope).pathname}${reg.updateViaCache ? ` · update cache ${reg.updateViaCache}` : ""}`;
    }
  } catch { swState = "Unknown"; swDetail = "Registration status could not be read."; }
  items.push(tile("Service-worker update", swState, swDetail, /waiting|installing/i.test(swState) ? "warn" : /active/i.test(swState) ? "ok" : "unknown"));
  items.push(tile("WebGL renderer", typeof WebGLRenderingContext === "function" ? "Available" : "Unavailable", "3D scenes fall back to their SVG or text views when graphics support is missing.", typeof WebGLRenderingContext === "function" ? "ok" : "unknown"));
  items.push(tile("WebGPU renderer", navigator.gpu ? "Available" : "Not available", "The ambient shader is optional; CSS atmosphere remains the fallback.", navigator.gpu ? "ok" : "unknown"));
  const canvas2d = !!document.createElement("canvas").getContext("2d");
  items.push(tile("2D canvas", canvas2d ? "Available" : "Unavailable", "Used by particle, weather-sky, and fallback scenes.", canvas2d ? "ok" : "unknown"));
  items.push(tile("Scene visibility observers", typeof IntersectionObserver === "function" ? "Available" : "Unavailable", "Pauses off-screen scene rendering when supported.", typeof IntersectionObserver === "function" ? "ok" : "warn"));
  items.push(tile("Responsive resize observer", typeof ResizeObserver === "function" ? "Available" : "Unavailable", "Keeps charts and 3D viewports sized to their panels.", typeof ResizeObserver === "function" ? "ok" : "warn"));
  const dataSaver = !!navigator.connection?.saveData;
  items.push(tile("Data saver preference", dataSaver ? "Enabled" : navigator.connection ? "Off" : "Not exposed", "Scene quality may be reduced when this browser preference is enabled.", dataSaver ? "ok" : "unknown"));
  const heap = performance.memory;
  if (heap && Number.isFinite(heap.usedJSHeapSize) && Number.isFinite(heap.jsHeapSizeLimit)) {
    const heapPct = heap.usedJSHeapSize / Math.max(1, heap.jsHeapSizeLimit) * 100;
    const heapLevel = heapPct >= 90 ? "crit" : heapPct >= 75 ? "warn" : "ok";
    items.push(tile("JavaScript heap estimate", `${(heap.usedJSHeapSize / 1048576).toFixed(0)} / ${(heap.jsHeapSizeLimit / 1048576).toFixed(0)} MB`, `${heapPct.toFixed(0)}% of browser-reported limit · local runtime estimate`, heapLevel));
  } else items.push(tile("JavaScript heap estimate", "Not exposed", "This browser does not provide a safe heap-size estimate.", "unknown"));
  const motionReduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const cssPaused = document.documentElement.dataset.cssMotion === "paused";
  const motionState = cssPaused ? "CSS paused" : motionReduced ? "System reduced" : "Full CSS motion";
  items.push(tile("Motion state", motionState, "The Display dock can pause CSS keyframe effects. Canvas and WebGL scenes use system motion and data-saver preferences.", cssPaused || motionReduced ? "ok" : "unknown"));
  const fontState = document.fonts ? document.fonts.status : "unsupported";
  items.push(tile("Web fonts", fontState === "loaded" ? "Ready" : fontState, "Shared Inter, Fraunces, and JetBrains Mono font set.", fontState === "loaded" ? "ok" : fontState === "loading" ? "warn" : "unknown"));
  setHTML($("client-runtime"), items.join(""));
}
async function offlineShellReport() {
  const box = $("offline-shell-grid");
  if (!box) return;
  if (!navigator.serviceWorker?.controller || !window.caches || !window.DOMParser) {
    setHTML(box, '<div class="target-card" data-level="unknown"><strong>Unknown</strong><span class="mono-dim">A controlling service worker and Cache Storage are required for this check.</span></div>');
    return;
  }
  try {
    const cacheNames = await caches.keys();
    const cacheList = await Promise.all(cacheNames.map((name) => caches.open(name)));
    const cachedPaths = new Set();
    for (const cache of cacheList) for (const request of await cache.keys()) cachedPaths.add(new URL(request.url).pathname);
    const pages = ["/", "/index.html", "/fleet.html", "/status.html", "/metrics.html", "/observability.html", "/ollama.html", "/agora.html", "/weather.html", "/network.html", "/reliability.html", "/operations.html", "/home.html", "/runbooks.html", "/404.html"];
    const styles = ["/gale.css", "/fleet-tidal.css", "/mobile.css", "/cinematic.css", "/fonts.css"];
    const fonts = ["/assets/fonts/inter.woff2", "/assets/fonts/fraunces.woff2", "/assets/fonts/jetbrains-mono.woff2"];
    const scripts = new Set();
    for (const page of pages) {
      let response = null;
      for (const cache of cacheList) { response = await cache.match(new URL(page, location.origin).href); if (response) break; }
      if (!response) continue;
      const documentCopy = new DOMParser().parseFromString(await response.text(), "text/html");
      for (const script of documentCopy.querySelectorAll("script[src]")) {
        const path = new URL(script.getAttribute("src"), new URL(page, location.origin)).pathname;
        if (path.startsWith("/dist/")) scripts.add(path);
      }
    }
    const groups = [["Pages", pages], ["Stylesheets", styles], ["Fonts", fonts], ["Page entry scripts", [...scripts]]];
    setHTML(box, groups.map(([label, required]) => {
      const missing = required.filter((path) => !cachedPaths.has(path));
      const level = !required.length ? "unknown" : missing.length ? "warn" : "ok";
      const detail = missing.length ? `Missing: ${missing.map((path) => path.split("/").pop()).join(", ")}` : "All required files are in local cache.";
      return `<div class="target-card" data-level="${level}"><div class="target-top"><span class="target-name">${label}</span><span class="pill" data-level="${level}">${required.length - missing.length}/${required.length}</span></div><span class="mono-dim">${esc(detail)}</span></div>`;
    }).join(""));
  } catch (error) {
    setHTML(box, `<div class="target-card" data-level="unknown"><strong>Unavailable</strong><span class="mono-dim">Cache inspection failed: ${esc(error.message)}</span></div>`);
  }
}
const SITE_PAGES = ["/index.html", "/fleet.html", "/status.html", "/metrics.html", "/observability.html", "/ollama.html", "/agora.html", "/weather.html", "/network.html", "/reliability.html", "/operations.html", "/home.html", "/runbooks.html", "/404.html"];
$("site-link-scan")?.addEventListener("click", async (event) => {
  const button = event.currentTarget, status = $("site-link-status"), results = $("site-link-results");
  button.disabled = true; button.textContent = "Scanning…";
  setText(status, `Checking ${SITE_PAGES.length} local pages and their fragment links…`);
  try {
    const fetched = await Promise.all(SITE_PAGES.map(async (page) => {
      const response = await fetch(page, { cache: "no-store" });
      if (!response.ok) throw new Error(`${page} returned HTTP ${response.status}`);
      return [page, new DOMParser().parseFromString(await response.text(), "text/html")];
    }));
    const docs = new Map(fetched), inbound = new Map(SITE_PAGES.map((page) => [page, 0])), issues = [];
    for (const [source, doc] of docs) for (const link of doc.querySelectorAll("a[href]")) {
      let target;
      try { target = new URL(link.getAttribute("href"), new URL(source, location.origin)); } catch { continue; }
      if (target.origin !== location.origin) continue;
      const path = target.pathname === "/" || target.pathname.endsWith("/") ? "/index.html" : target.pathname;
      if (SITE_PAGES.includes(path)) {
        if (source !== path) inbound.set(path, (inbound.get(path) || 0) + 1);
        if (target.hash) {
          let fragment = "";
          try { fragment = decodeURIComponent(target.hash.slice(1)); } catch { fragment = target.hash.slice(1); }
          if (fragment && !docs.get(path)?.getElementById(fragment)) issues.push({ kind: "Missing anchor", source, target: `${path}#${fragment}` });
        }
      } else if (/\.html?$/i.test(path)) issues.push({ kind: "Missing page", source, target: path });
    }
    const orphans = SITE_PAGES.filter((page) => page !== "/404.html" && !(inbound.get(page) || 0));
    const summary = `<div class="target-card" data-level="${issues.length || orphans.length ? "warn" : "ok"}"><strong>${issues.length} broken link${issues.length === 1 ? "" : "s"} · ${orphans.length} orphan page${orphans.length === 1 ? "" : "s"}</strong><span class="mono-dim">${fetched.length} pages scanned · 404 excluded from orphan count</span></div>`;
    const rows = [...issues.map((issue) => `<div class="target-card" data-level="crit"><strong>${esc(issue.kind)}</strong><span class="mono-dim">${esc(issue.source)} → ${esc(issue.target)}</span></div>`), ...orphans.map((page) => `<div class="target-card" data-level="warn"><strong>Orphan page</strong><span class="mono-dim">${esc(page)}</span></div>`)];
    setHTML(results, summary + rows.slice(0, 50).join(""));
    setText(status, `Link audit complete · ${issues.length} broken links · ${orphans.length} orphan pages.`);
  } catch (error) {
    setText(status, `Link audit could not finish: ${error.message}`);
  } finally { button.disabled = false; button.textContent = "Scan 14 pages"; }
});
function buildLocalDiagnosticsBundle() {
  const samples = window.__galeRUM || [];
  const pages = new Map(), metrics = new Map();
  for (const sample of samples) {
    if (/^[a-z0-9._-]+$/i.test(sample.page || "")) {
      const page = pages.get(sample.page) || { visits: 0, samples: 0, viewports: new Set() };
      page.samples++;
      if (sample.metric === "PAGE_VIEW") page.visits += sample.value || 1;
      if (sample.viewport) page.viewports.add(sample.viewport);
      pages.set(sample.page, page);
    }
    if (!/^[A-Z_]+$/.test(sample.metric || "") || !Number.isFinite(sample.value)) continue;
    const metric = metrics.get(sample.metric) || { values: [], unit: /^[A-Za-z0-9 %._-]+$/.test(sample.unit || "") ? sample.unit : "" };
    metric.values.push(sample.value);
    metrics.set(sample.metric, metric);
  }
  const metricSummary = {};
  for (const [name, metric] of metrics) {
    const values = metric.values.slice().sort((a, b) => a - b);
    metricSummary[name] = { count: values.length, unit: metric.unit, min: values[0], p95: values[Math.min(values.length - 1, Math.ceil(values.length * .95) - 1)], max: values.at(-1) };
  }
  return {
    schema: "gale-browser-diagnostics/v1",
    created_at: new Date().toISOString(),
    scope: "local browser summary; not uploaded",
    privacy: "No URLs, request paths, query strings, page text, referrers, or individual event timestamps are included.",
    sample_count: samples.length,
    pages: Object.fromEntries([...pages.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([page, row]) => [page, { visits: row.visits, samples: row.samples, viewports: [...row.viewports].sort() }])),
    metrics: metricSummary,
    capabilities: {
      webgl: typeof WebGLRenderingContext === "function",
      webgpu: !!navigator.gpu,
      service_worker: !!navigator.serviceWorker,
      reduced_motion: !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      viewport: innerWidth < 600 ? "phone" : innerWidth < 1000 ? "tablet" : "desktop",
    },
  };
}
$("rum-export-preview")?.addEventListener("click", () => {
  const bundle = buildLocalDiagnosticsBundle();
  setText($("rum-export-summary"), `${bundle.sample_count} local samples · ${Object.keys(bundle.pages).length} pages · ${Object.keys(bundle.metrics).length} metrics. The bundle contains page/viewport counts, metric ranges, and browser capabilities. It excludes URLs, request paths, query strings, content, and per-event timestamps.`);
  const details = $("rum-export-details");
  details.hidden = false; details.open = true;
});
$("rum-export-download")?.addEventListener("click", () => {
  const bundle = buildLocalDiagnosticsBundle();
  downloadFile("gale-browser-diagnostics.json", JSON.stringify(bundle, null, 2), "application/json;charset=utf-8");
  setText($("rum-action-status"), "Scrubbed local diagnostic summary downloaded.");
});
$("sw-check")?.addEventListener("click", async (e) => {
  const button = e.currentTarget;
  button.disabled = true; button.textContent = "Checking…";
  try {
    const reg = await navigator.serviceWorker?.getRegistration("/");
    if (!reg) throw new Error("No Gale service worker registration found.");
    await reg.update();
    const update = reg.waiting || reg.installing;
    const message = update ? "An app update is downloading or waiting to install." : "The app is up to date.";
    setText($("rum-action-status"), message);
    setText($("client-runtime-status"), message);
    button.textContent = update ? "Update found" : "App is current";
  } catch (error) {
    const message = `Update check unavailable: ${error.message}`;
    setText($("rum-action-status"), message); setText($("client-runtime-status"), message);
    button.textContent = "Check app update";
  } finally { button.disabled = false; clientRuntime(); }
});
$("rum-page-filter")?.addEventListener("change", (e) => { rumPage = e.currentTarget.value; rum(); });
$("rum-retention")?.addEventListener("change", (e) => { rumRetentionHours = Number(e.currentTarget.value) || 0; rum(); });
$("rum-clear")?.addEventListener("click", () => {
  window.__galeRUMClear?.(); rumPage = ""; rum();
  setText($("rum-action-status"), "Browser-local RUM samples cleared.");
});
async function refresh() {
  if (busy) return;
  busy = true;
  try {
    const response = await tracedFetch("api/fleet/reliability", { cache: "no-store", signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.schema !== "fleet-reliability/v1" || !Array.isArray(data.slos)) throw new Error("invalid reliability payload");
    last = data; render(data);
  } catch (e) {
    if (last) render({ ...last, generated_at: "unknown" });
    else setHTML($("slo-grid"), '<p class="mini-note">Reliability unknown — monitoring feed unavailable.</p>');
    setText($("reliability-freshness"), `Feed unavailable: ${e.message}. Displayed data is stale.`);
  } finally { busy = false; rum(); }
}
refresh();
coverage();
clientRuntime();
offlineShellReport();
setInterval(refresh, 30000);
setInterval(coverage, 60000);
setInterval(() => { if (last && freshness(last) !== "ok") render(last); rum(); }, 10000);
