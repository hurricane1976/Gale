import { boot, esc, setHTML, setText, tracedFetch } from "./shared.js";
import { level, freshness } from "./reliability-state.js";
boot();
const $ = (id) => document.getElementById(id);
let busy = false, last = null;
const money = (n) => Number.isFinite(n) ? `$${n.toFixed(2)}` : "unknown";
function render(data) {
  const feed = freshness(data);
  setText($("reliability-freshness"), `Collected ${data.generated_at} · ${feed} · refresh every 30s`);
  setHTML($("slo-grid"), data.slos.map((s) => {
    const state = level(feed === "ok" ? s : { ...s, state: "stale" });
    const value = state === "unknown" ? "Unknown" : `${s.actual.toFixed(2)}%`;
    const budget = s.budget_remaining_pct == null ? "budget unavailable" : `budget remaining ${s.budget_remaining_pct.toFixed(1)}%`;
    return `<div class="vital" data-level="${state}"><span class="vital-label">${esc(s.name)} · target ${s.target}%</span><span class="vital-value">${value}</span><span class="vital-sub">${esc(s.detail)} · ${budget}${s.coverage_pct != null ? ` · history coverage ${s.coverage_pct}%` : ""}</span></div>`;
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
const tile = (label, value, sub, lv) => `<div class="vital" data-level="${lv}"><span class="vital-label">${esc(label)}</span><span class="vital-value">${esc(value)}</span><span class="vital-sub">${esc(sub)}</span></div>`;
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
  const samples = window.__galeRUM || [];
  const specs = [
    ["LCP", "Largest content paint", 2500, 4000, "ms", true], ["INP", "Interaction delay (approx)", 200, 500, "ms", true],
    ["CLS", "Layout shift", .1, .25, "score", true], ["FCP", "First content paint", 1800, 3000, "ms", true],
    ["TTFB", "Server response", 800, 1800, "ms", true], ["DOM_READY", "DOM ready", 2500, 5000, "ms", true],
    ["LOAD", "Page load", 4000, 8000, "ms", true], ["LONGTASK", "Long tasks", 50, 100, "ms", false],
    ["RESOURCE_KB", "First party transfer", 700, 1400, "KB", true], ["RESOURCE_SLOW", "Slow first party requests", 0, 2, "count", false],
    ["JS_ERROR", "JavaScript errors", 0, 1, "count", false], ["ASSET_ERROR", "Asset errors", 0, 1, "count", false],
    ["IMAGE_ERROR", "Image errors", 0, 1, "count", false], ["REJECTION", "Unhandled rejections", 0, 1, "count", false],
    ["WEBGL_LOSS", "WebGL context loss", 0, 1, "events", false], ["OFFLINE", "Offline events", 0, 1, "events", false],
    ["API_HTTP_ERROR", "API HTTP errors", 0, 1, "responses", false], ["API_NETWORK_ERROR", "API network failures", 0, 1, "failures", false],
    ["API_SLOW", "Slow API responses", 0, 2, "responses", false], ["SSE_ERROR", "Live stream reconnects", 0, 2, "events", false],
    ["SCENE_FPS", "3D scene frame rate", 50, 30, "fps", true],
  ];
  const cards = specs.map(([name, label, good, warn, unit, percentile]) => {
    const entries = samples.filter((s) => s.metric === name && Number.isFinite(s.value));
    const values = entries.map((s) => s.value).sort((a, b) => a - b);
    const value = values.length ? (percentile ? values[name === "SCENE_FPS" ? Math.floor((values.length - 1) * .05) : Math.min(values.length - 1, Math.ceil(values.length * .95) - 1)] : values.reduce((a, b) => a + b, 0)) : null;
    const state = value == null ? "unknown" : name === "SCENE_FPS" ? value >= good ? "ok" : value >= warn ? "warn" : "crit" : value <= good ? "ok" : value <= warn ? "warn" : "crit";
    const history = entries.slice(-16);
    const max = Math.max(1, ...history.map((s) => s.value));
    const points = history.map((s, i) => `${history.length < 2 ? 50 : i / (history.length - 1) * 100},${20 - (name === "SCENE_FPS" ? Math.min(1, s.value / 60) : s.value / max) * 18}`).join(" ");
    const graph = history.length > 1 ? `<svg class="rum-spark" viewBox="0 0 100 22" role="img" aria-label="${esc(label)} recent trend"><polyline points="${points}"/></svg>` : "";
    const pages = [...new Set(entries.slice(-12).map((s) => s.page).filter(Boolean))];
    const scenes = [...new Set(entries.slice(-12).map((s) => s.scene).filter(Boolean))];
    const showValue = value == null ? "No sample" : `${value.toFixed(unit === "score" ? 3 : 0)} ${unit}`;
    return `<div class="vital rum-vital" data-level="${state}"><span class="vital-label">${esc(label)}</span><span class="vital-value">${esc(showValue)}</span>${graph}<span class="vital-sub">${entries.length} local sample${entries.length === 1 ? "" : "s"}${percentile ? (name === "SCENE_FPS" ? " · p05" : " · p95") : " · total"}${pages.length ? ` · ${esc(pages.join(", "))}` : ""}${scenes.length ? ` · ${esc(scenes.join(", "))}` : ""}</span></div>`;
  }).join("");
  setHTML($("rum-grid"), cards);
}
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
setInterval(refresh, 30000);
setInterval(coverage, 60000);
setInterval(() => { if (last && freshness(last) !== "ok") render(last); rum(); }, 10000);
