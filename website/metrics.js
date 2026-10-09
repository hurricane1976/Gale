/* GALE — telemetry metrics: polls /api/fleet/metrics, renders 14-day daily
   wakings/cost as stacked SVG bars and the fleet-node liveness sweep. */
import { boot, esc, refreshEffects, setHTML, setText, patchList, tracedFetch, chartTooltip, skeleton, whenNear, downloadFile } from "./shared.js";
import { metricsPayload, validate } from "./payloads.js";

boot();

const FEED = "api/fleet/metrics";
const POLL_MS = 30000;
const HOST_COLOR = { gale: "var(--m-glm)", beacon: "var(--m-claude)", tidal: "light-dark(#0a6288, #3fc7ff)", mountain: "light-dark(#3846a6, #8593f0)" };
const AGENT_COLOR = { gale: "var(--m-glm)", zephyr: "var(--gust)", squall: "var(--warn)", tempest: "var(--ok)", vortex: "var(--flag)", chinook: "var(--bolt)", cyclone: "var(--m-gpt)", maistral: "var(--m-claude)", sirocco: "var(--m-muse)", bora: "var(--storm-purple)", tramontane: "var(--m-muse)", ostro: "var(--m-muse)", poniente: "var(--m-muse)", levante: "var(--m-muse)", tidal: "light-dark(#0a6288, #3fc7ff)", mountain: "light-dark(#3846a6, #8593f0)", beacon: "var(--m-claude)", river: "light-dark(#0f6a50, #4fd1a5)", creek: "light-dark(#76560c, #e0b45c)", stream: "light-dark(#8a2b80, #d98fd1)", meadow: "var(--m-glm)", brook: "var(--m-gpt)", mist: "var(--m-gpt)", highbeam: "var(--m-glm)", lantern: "var(--m-glm)", lightning: "var(--m-glm)", radar: "var(--m-glm)", prism: "var(--m-gpt)", pulsar: "var(--m-claude)", canyon: "var(--m-glm)", ridge: "var(--m-glm)", harbor: "var(--m-glm)", delta: "var(--m-glm)", mesa: "var(--m-gpt)", vista: "var(--m-gpt)" };
let DATA = null;
let chartWindow = 14;
let pollFallback = false, pollNextAt = 0, pollError = "", pollLabelTimer = 0;
const hiddenSeries = { wakings: new Set(), cost: new Set() };

const $ = (id) => document.getElementById(id);

// skeleton screens (#6): shimmer until the first fetch renders
skeleton($("wakings-chart"), 1, 150);
skeleton($("cost-chart"), 1, 150);

function setFresh(state, text) {
  const el = $("freshness");
  if (!el) return;
  el.dataset.state = state;
  const t = $("freshness-text");
  if (t) t.textContent = text;
}

function paintPollStatus() {
  if (!pollFallback) return;
  const remaining = Math.max(0, Math.ceil((pollNextAt - Date.now()) / 1000));
  setFresh(pollError ? "error" : "live", `poll fallback · ${pollError || "live"} · next check in ${remaining}s`);
}

function chartView() {
  const start = Math.max(0, DATA.days.length - chartWindow);
  const sliceHosts = (source) => Object.fromEntries(Object.entries(source || {}).map(([host, values]) => [host, values.slice(start)]));
  return {
    ...DATA,
    days: DATA.days.slice(start),
    daily_wakings_by_host: sliceHosts(DATA.daily_wakings_by_host),
    daily_cost_by_host: sliceHosts(DATA.daily_cost_by_host),
  };
}

const rangeGroup = $("metric-range");
rangeGroup?.querySelectorAll("[data-days]").forEach((button) => button.addEventListener("click", () => {
  chartWindow = Number(button.dataset.days) === 7 ? 7 : 14;
  rangeGroup.querySelectorAll("[data-days]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  if (DATA) renderAll();
}));
const comparePanel = $("metric-period-comparison"), compareToggle = $("metric-compare-toggle");
compareToggle?.addEventListener("click", () => {
  const open = comparePanel.hidden;
  comparePanel.hidden = !open;
  compareToggle.setAttribute("aria-pressed", String(open));
  if (open && DATA) renderComparison();
});

function renderComparison() {
  if (!DATA || !comparePanel || comparePanel.hidden) return;
  const split = Math.max(0, DATA.days.length - 7), previousDays = DATA.days.slice(Math.max(0, split - 7), split), currentDays = DATA.days.slice(split);
  const hosts = [...new Set([...Object.keys(DATA.daily_wakings_by_host || {}), ...Object.keys(DATA.daily_cost_by_host || {})])].sort();
  const total = (series, host, from, to) => (series[host] || []).slice(from, to).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const fmtDelta = (current, previous) => previous > 0 ? `${((current - previous) / previous * 100) > 0 ? "+" : ""}${((current - previous) / previous * 100).toFixed(1)}%` : current > 0 ? "new" : "0.0%";
  const rows = hosts.map((host) => {
    const wakeNow = total(DATA.daily_wakings_by_host || {}, host, split, DATA.days.length);
    const wakePrev = total(DATA.daily_wakings_by_host || {}, host, Math.max(0, split - 7), split);
    const costNow = total(DATA.daily_cost_by_host || {}, host, split, DATA.days.length);
    const costPrev = total(DATA.daily_cost_by_host || {}, host, Math.max(0, split - 7), split);
    return `<tr><th scope="row"><i class="obs-led" style="background:${hostColor(host)}"></i>${esc(host)}</th><td>${Math.round(wakeNow)}</td><td>${Math.round(wakePrev)}</td><td>${fmtDelta(wakeNow, wakePrev)}</td><td>$${costNow.toFixed(4)}</td><td>$${costPrev.toFixed(4)}</td><td>${fmtDelta(costNow, costPrev)}</td></tr>`;
  }).join("");
  setHTML(comparePanel, `<h2 class="panel-title">Pinned period comparison <span>${esc(currentDays[0] || "?")}–${esc(currentDays.at(-1) || "?")} vs ${esc(previousDays[0] || "?")}–${esc(previousDays.at(-1) || "?")}</span></h2><p class="mini-note">Totals for the latest seven available days compared with the preceding seven. Percent changes use the previous period as the baseline.</p><div class="table-wrap"><table><thead><tr><th>Host</th><th>Wakes now</th><th>Wakes prior</th><th>Wakes Δ</th><th>Cost now</th><th>Cost prior</th><th>Cost Δ</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No host series available.</td></tr>'}</tbody></table></div>`);
}

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
document.querySelectorAll("[data-metric-export]").forEach((button) => button.addEventListener("click", () => {
  if (!DATA) return;
  const [seriesName, format] = button.dataset.metricExport.split("-");
  const view = chartView();
  if (format === "svg") {
    const svg = document.querySelector(`#${seriesName === "cost" ? "cost" : "wakings"}-chart svg`);
    if (!svg) return;
    const copy = svg.cloneNode(true);
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    downloadFile(`gale-${seriesName}-${chartWindow}d.svg`, new XMLSerializer().serializeToString(copy), "image/svg+xml;charset=utf-8");
    return;
  }
  const field = seriesName === "cost" ? view.daily_cost_by_host : view.daily_wakings_by_host;
  const hosts = Object.keys(field).filter((host) => !hiddenSeries[seriesName].has(host));
  const rows = [["date", ...hosts], ...view.days.map((day, i) => [day, ...hosts.map((host) => field[host][i] ?? 0)])];
  downloadFile(`gale-${seriesName}-${chartWindow}d.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv;charset=utf-8");
}));

const hostColor = (h) => HOST_COLOR[h] || "var(--text-faint)";

function fmtAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!isFinite(s)) return "&ndash;";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function statCard(label, value, sub, lvl = "ok", href = null) {
  return `<div class="vital" data-glow data-level="${lvl}">
    <span class="vital-label">${href ? `<a href="${esc(href)}">${esc(label)}</a>` : esc(label)}</span>
    <span class="vital-value">${value}</span>
    <span class="vital-sub">${sub || ""}</span>
  </div>`;
}

export function renderAgentCards(d) {
  const q = (agentQuery || "").trim().toLowerCase();
  const rows = [...(d.per_agent_24h || [])]
    .filter((a) => !q || String(a.agent || "").toLowerCase().includes(q))
    .map((a) => {
    const lvl = a.error_runs_24h > 0 ? "warn" : "ok";
    return {
      key: `agent-${a.agent || "?"}`,
      html: statCard(
      a.agent || "?",
      `${a.runs_24h} run${a.runs_24h === 1 ? "" : "s"}`,
      `$${(a.cost_24h ?? 0).toFixed(4)} &middot; last wake ${a.last_wake ? esc(fmtAgo(a.last_wake)) : "&ndash;"}` +
      (a.error_runs_24h ? ` &middot; <strong>${a.error_runs_24h} error</strong>` : ""),
      lvl,
      a.agent ? `fleet.html#agent-${encodeURIComponent(a.agent)}` : null
    ),
    }
  });
  patchList($("agent-grid"), rows.length ? rows :
    [{ key: "empty", html: `<p class="mini-note">No agents match “${esc(agentQuery)}”.</p>` }]);
}

let agentQuery = "";
const agentQ = $("agent-q");
if (agentQ) {
  agentQ.addEventListener("input", () => {
    agentQuery = agentQ.value;
    if (DATA) renderAgentCards(DATA);
  });
  agentQ.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { agentQ.value = ""; agentQuery = ""; if (DATA) renderAgentCards(DATA); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) {
      e.preventDefault();
      agentQ.focus();
    }
  });
}

function stackedBars(series, labelFmt) {
  const days = DATA.days;
  const hosts = Object.keys(series);
  const W = Math.max(320, Math.min(days.length * 64, 1600));
  const H = 200;
  const pad = { t: 16, r: 12, b: 40, l: 44 };
  const totals = days.map((_, i) => hosts.reduce((s, h) => s + (series[h][i] || 0), 0));
  const max = Math.max(...totals, 0.000001);
  const bw = Math.max(8, Math.floor((W - pad.l - pad.r) / days.length) - 12);
  let bars = "";
  days.forEach((day, i) => {
    const total = totals[i];
    const x = pad.l + i * ((W - pad.l - pad.r) / days.length) + 6;
    let y = H - pad.b;
    let segs = "";
    hosts.forEach((h) => {
      const v = series[h][i] || 0;
      if (!v) return;
      const hgt = (v / max) * (H - pad.t - pad.b);
      y -= hgt;
      segs += `<rect class="bar-rise" style="--i:${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${hgt.toFixed(1)}"
        fill="${hostColor(h)}" opacity="0.88" rx="1.5"><title>${esc(`${day} ${h}: ${labelFmt(v)}`)}</title></rect>`;
    });
    const totalLbl = labelFmt(total) === "0" ? "" : labelFmt(total);
    bars += segs + `<line x1="${x.toFixed(1)}" y1="${H - pad.b}" x2="${x.toFixed(1)}" y2="${H - pad.b + 5}" stroke="var(--line-strong)"/>
      <text x="${(x + bw / 2).toFixed(1)}" y="${H - pad.b + 18}" text-anchor="middle" class="obs-tick">${esc(day.slice(5))}</text>
      <text x="${(x + bw / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" class="obs-tick obs-tick-top">${esc(totalLbl)}</text>`;
  });
  const maxTot = Math.max(...totals, 0.000001);
  const sparkPts = totals.map((t, i) => {
    const cx = (pad.l + i * ((W - pad.l - pad.r) / days.length) + (W - pad.l - pad.r) / days.length / 2).toFixed(1);
    const cy = (H - pad.b - (t / maxTot) * (H - pad.t - pad.b)).toFixed(1);
    return `${cx},${cy}`;
  }).join(" ");
  const spark = `<polyline class="bar-spark" points="${sparkPts}"/>` +
    totals.map((t, i) => {
    const cx = (pad.l + i * ((W - pad.l - pad.r) / days.length) + (W - pad.l - pad.r) / days.length / 2).toFixed(1);
    const cy = (H - pad.b - (t / maxTot) * (H - pad.t - pad.b)).toFixed(1);
    return `<circle class="bar-spark-dot" style="--i:${i}" cx="${cx}" cy="${cy}" r="2.4"><title>${esc(`${days[i]} total: ${labelFmt(t)}`)}</title></circle>`;
  }).join("");
  const grid = [0, 0.5, 1].map((f) => {
    const y = (H - pad.b - f * (H - pad.t - pad.b)).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--line)"/>
      <text x="${pad.l - 6}" y="${+y + 4}" text-anchor="end" class="obs-tick">${esc(labelFmt(max * f))}</text>`;
  }).join("");
  return `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="stacked daily chart">
    ${grid}${bars}${spark}</svg></div>`;
}

function legend(containerId, hosts, seriesName) {
  patchList($(containerId), hosts.map((h) => ({
    key: h,
    html: `<button type="button" class="mini-toggle metric-series-toggle" data-series="${seriesName}" data-host="${esc(h)}" aria-pressed="${String(!hiddenSeries[seriesName].has(h))}"><i class="obs-led" style="background:${hostColor(h)}"></i>${esc(h)}</button>`,
  })));
}

document.addEventListener("click", (event) => {
  const button = event.target.closest?.(".metric-series-toggle");
  if (!button || !hiddenSeries[button.dataset.series]) return;
  const set = hiddenSeries[button.dataset.series];
  set.has(button.dataset.host) ? set.delete(button.dataset.host) : set.add(button.dataset.host);
  if (DATA) renderAll();
});

/* Day-total crosshair (#2): the per-bar <title>s already name host values;
   this adds the day total readout, reading x/day straight from the rendered
   DOM so chart geometry stays in one place (stackedBars). */
function tipDayTotals(elId, days) {
  const svg = $(elId) && $(elId).querySelector("svg");
  if (!svg) return;
  const tops = [...svg.querySelectorAll("text.obs-tick-top")];
  if (!tops.length) return;
  chartTooltip(svg,
    tops.map((t) => ({ x: parseFloat(t.getAttribute("x")) || 0 })),
    (i) => `${(days && days[i]) || ""} · total ${tops[i].textContent}`.trim());
}

function renderStatus(d) {
  const entries = Object.entries(d.fleet_status || {});
  setText($("sweep-count"), String(entries.length));
  const groups = {};
  entries.forEach(([name, st]) => {
    const dom = st.listener.split(".").slice(0, 3).join(".");
    (groups[st.state] = groups[st.state] || []).push([name, st]);
  });
  const order = ["up", "up (auth-gated)", "down"];
  let html = "";
  order.forEach((state) => {
    const list = groups[state];
    if (!list || !list.length) return;
    const lvl = state === "up" ? "ok" : state === "down" ? "crit" : "warn";
    html += `<div class="metrics-status-group"><h3 class="metrics-status-h" data-level="${lvl}">${esc(state)} <span>${list.length}</span></h3>
      <div class="metrics-status-nodes">${list.map(([n, st]) =>
        `<span class="metrics-node" title="${esc(st.listener || "?")} (HTTP ${st.code ?? "-"})">
           <i class="obs-led" style="background:${lvl === "ok" ? "var(--ok)" : lvl === "crit" ? "var(--flag)" : "var(--warn)"}"></i>${esc(n)}
         </span>`).join("")}</div></div>`;
  });
  setHTML($("status-grid"), html || `<p class="mini-note">No nodes parsed yet.</p>`);
  setText($("status-note"), `Liveness only — an HTTP 401 counts as up (auth-gated), matching the ops status page. ${entries.length} nodes from the fleet page's own listener data; no tokens probed.`);
}

/* ---------------- 3D spend landscape (lazy; hidden where WebGL / motion isn't available) ---------------- */
let LAND;               // undefined = not tried, null = unavailable, object = running
async function update3D(view = DATA) { try { await update3DInner(view); } catch { /* decoration only */ } }
async function update3DInner(view = DATA) {
  const sec = document.getElementById("sec-land3d");
  if (!sec || LAND === null) return;
  if (LAND === undefined) {
    LAND = null;
    let gl = null;
    try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gl || reduced || document.documentElement.dataset.saver === "1") { sec.hidden = true; return; }
    try { await whenNear(sec);
    LAND = (await import("./landscape3d.js")).initLandscape3D(document.getElementById("land-canvas")); } catch { LAND = null; }
    if (!LAND) { sec.hidden = true; return; }
    const btn = document.getElementById("land-mode");
    btn.addEventListener("click", () => {
      const wakes = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(wakes));
      btn.textContent = wakes ? "showing wakes \u2014 switch to cost" : "showing cost \u2014 switch to wakes";
      LAND.setMode(wakes ? "wakes" : "cost");
      LAND.update(chartView());
    });
  }
  LAND.update(view);
}

function renderAll() {
  if (!DATA) return;
  renderAgentCards(DATA);
  const view = chartView();
  const rangeLabel = `last ${view.days.length} days`;
  setText($("metric-range-label"), rangeLabel);
  setText($("metric-range-label-cost"), rangeLabel);
  const hosts = Object.keys(view.daily_wakings_by_host);
  const visibleWakings = Object.fromEntries(hosts.filter((host) => !hiddenSeries.wakings.has(host)).map((host) => [host, view.daily_wakings_by_host[host]]));
  const costHosts = Object.keys(view.daily_cost_by_host);
  const visibleCost = Object.fromEntries(costHosts.filter((host) => !hiddenSeries.cost.has(host)).map((host) => [host, view.daily_cost_by_host[host]]));
  setHTML($("wakings-chart"), Object.keys(visibleWakings).length ? stackedBars(visibleWakings, (v) => String(Math.round(v))) : '<p class="mini-note">All host series are hidden. Re-enable one in the legend.</p>');
  legend("wakings-legend", hosts, "wakings");
  setHTML($("cost-chart"), Object.keys(visibleCost).length ? stackedBars(visibleCost, (v) => `$${v < 10 ? v.toFixed(2) : v.toFixed(0)}`) : '<p class="mini-note">All host series are hidden. Re-enable one in the legend.</p>');
  legend("cost-legend", costHosts, "cost");
  tipDayTotals("wakings-chart", view.days);
  tipDayTotals("cost-chart", view.days);
  renderStatus(DATA);
  renderComparison();
  update3D(view);
  refreshEffects();
  if (pollFallback) { pollError = ""; paintPollStatus(); }
  else setFresh("live", `live · ${new Date(DATA.generated_at).toLocaleTimeString()}`);
}

async function load() {
  try {
    const r = await tracedFetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    DATA = validate(await r.json(), metricsPayload);
    renderAll();
  } catch (e) {
    pollError = `fetch failed (${String(e.message || e)})`;
    if (pollFallback) paintPollStatus();
    else setFresh("error", `feed error: ${esc(String(e.message || e))}`);
  }
}

document.getElementById("board").hidden = false;

// Prefer a live push (SSE) over polling; fall back to the old setInterval
// loop if EventSource doesn't exist (old browsers) or keeps failing (a
// proxy that won't stream). The render-test harness has no EventSource
// global, so it naturally exercises the polling path.
function startPolling() {
  if (pollFallback) return;
  pollFallback = true;
  pollNextAt = Date.now() + POLL_MS;
  load();
  setInterval(() => { pollNextAt = Date.now() + POLL_MS; load(); paintPollStatus(); }, POLL_MS);
  if (!pollLabelTimer) pollLabelTimer = setInterval(paintPollStatus, 1000);
  paintPollStatus();
}

if (typeof EventSource !== "undefined") {
  let failures = 0;
  let es = new EventSource(FEED + "/stream");
  es.onmessage = (e) => {
    failures = 0;
    try {
      DATA = validate(JSON.parse(e.data), metricsPayload);
      renderAll();
    } catch { /* malformed payload -- wait for the next push */ }
  };
  es.onerror = () => {
    setFresh("error", "feed error: stream unavailable");
    if (++failures >= 3) {
      es.close();
      startPolling();
    }
  };
  await load(); // paint immediately instead of waiting for the first push
} else {
  await startPolling();
}
