/* GALE — telemetry metrics: polls /api/fleet/metrics, renders 14-day daily
   wakings/cost as stacked SVG bars and the fleet-node liveness sweep. */
import { boot, esc } from "./shared.js";

boot();

const FEED = "api/fleet/metrics";
const POLL_MS = 30000;
const HOST_COLOR = { gale: "var(--m-glm)", beacon: "var(--m-claude)", tidal: "#3fc7ff", mountain: "#8593f0" };
const AGENT_COLOR = { gale: "var(--m-glm)", zephyr: "var(--gust)", squall: "var(--warn)", tempest: "var(--ok)", vortex: "var(--flag)", chinook: "var(--bolt)", cyclone: "var(--m-gpt)", maistral: "var(--m-claude)", sirocco: "var(--m-muse)", bora: "var(--storm-purple)", tidal: "#3fc7ff", mountain: "#8593f0", beacon: "var(--m-claude)", river: "#4fd1a5", creek: "#e0b45c", stream: "#d98fd1" };
let DATA = null;

const $ = (id) => document.getElementById(id);

function setFresh(state, text) {
  const el = $("freshness");
  if (!el) return;
  el.dataset.state = state;
  const t = $("freshness-text");
  if (t) t.textContent = text;
}

const hostColor = (h) => HOST_COLOR[h] || "var(--text-faint)";

function fmtAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!isFinite(s)) return "&ndash;";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function statCard(label, value, sub, lvl = "ok") {
  return `<div class="vital" data-level="${lvl}">
    <span class="vital-label">${esc(label)}</span>
    <span class="vital-value">${value}</span>
    <span class="vital-sub">${sub || ""}</span>
  </div>`;
}

function renderAgentCards(d) {
  $("agent-grid").innerHTML = d.per_agent_24h.map((a) => {
    const lvl = a.error_runs_24h > 0 ? "warn" : "ok";
    return statCard(
      a.agent,
      `${a.runs_24h} run${a.runs_24h === 1 ? "" : "s"}`,
      `$${a.cost_24h.toFixed(4)} &middot; last wake ${a.last_wake ? esc(fmtAgo(a.last_wake)) : "&ndash;"}` +
      (a.error_runs_24h ? ` &middot; <strong>${a.error_runs_24h} error</strong>` : ""),
      lvl
    );
  }).join("");
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

function legend(containerId, hosts) {
  $(containerId).innerHTML = hosts.map((h) =>
    `<span><i class="obs-led" style="background:${hostColor(h)}"></i>${esc(h)}</span>`).join("");
}

function renderStatus(d) {
  const entries = Object.entries(d.fleet_status || {});
  $("sweep-count").textContent = entries.length;
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
        `<span class="metrics-node" title="${esc(st.listener)} (HTTP ${st.code ?? "-"})">
           <i class="obs-led" style="background:${lvl === "ok" ? "var(--ok)" : lvl === "crit" ? "var(--flag)" : "var(--warn)"}"></i>${esc(n)}
         </span>`).join("")}</div></div>`;
  });
  $("status-grid").innerHTML = html || `<p class="mini-note">No nodes parsed yet.</p>`;
  $("status-note").textContent = `Liveness only — an HTTP 401 counts as up (auth-gated), matching the ops status page. ${entries.length} nodes from the fleet page's own listener data; no tokens probed.`;
}

function renderAll() {
  if (!DATA) return;
  renderAgentCards(DATA);
  const hosts = Object.keys(DATA.daily_wakings_by_host);
  $("wakings-chart").innerHTML = stackedBars(DATA.daily_wakings_by_host, (v) => String(Math.round(v)));
  legend("wakings-legend", hosts);
  $("cost-chart").innerHTML = stackedBars(DATA.daily_cost_by_host, (v) => `$${v < 10 ? v.toFixed(2) : v.toFixed(0)}`);
  legend("cost-legend", Object.keys(DATA.daily_cost_by_host));
  renderStatus(DATA);
  setFresh("live", `live &middot; ${new Date(DATA.generated_at).toLocaleTimeString()}`);
}

async function load() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    DATA = await r.json();
    renderAll();
  } catch (e) {
    setFresh("error", `feed error: ${esc(String(e.message || e))}`);
  }
}

document.getElementById("board").hidden = false;
await load();
setInterval(load, POLL_MS);
