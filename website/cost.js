/* GALE — fleet cost trend + agent cost leaderboard: polls api/fleet/metrics,
   renders a 14-day per-host cost chart with fleet-total line, and a top-6
   agent cost leaderboard with per-agent cost sparklines. */
import { boot, esc, refreshEffects } from "./shared.js";

boot();

const FEED = "api/fleet/metrics";
const POLL_MS = 30000;
const HOST_ORDER = ["gale", "tidal", "mountain", "beacon"];
const HOST_HUE = { gale: "#ff8a3d", tidal: "#3fc7ff", mountain: "#8593f0", beacon: "#ffc233" };
const LEAD_N = 6;

const chartEl = document.getElementById("cost-trend-chart");
const legendEl = document.getElementById("cost-trend-legend");
const chartFresh = document.getElementById("cost-trend-fresh");
const lbGrid = document.getElementById("leaderboard-grid");
const lbFresh = document.getElementById("leaderboard-fresh");

function money(v) {
  if (v == null || !isFinite(v)) return "–";
  if (v === 0) return "$0.00";
  return v < 10 ? `$${v.toFixed(2)}` : `$${v.toFixed(0)}`;
}

function ago(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!isFinite(s)) return "–";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const hue = (h) => HOST_HUE[h] || "var(--text-faint)";

function trendChart(d) {
  const days = d.days || [];
  const byHost = d.daily_cost_by_host || {};
  const hosts = HOST_ORDER.filter((h) => Array.isArray(byHost[h])).concat(
    Object.keys(byHost).filter((h) => !HOST_ORDER.includes(h) && Array.isArray(byHost[h]))
  );
  if (!days.length || !hosts.length) return `<p class="hosts-wait">no cost series yet</p>`;
  const W = 840, H = 240, pad = { t: 14, r: 12, b: 30, l: 52 };
  const n = days.length;
  const totals = days.map((_, i) => hosts.reduce((s, h) => s + (byHost[h][i] || 0), 0));
  const max = Math.max(...totals, 0.01);
  const X = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(n - 1, 1);
  const Y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const grid = [0, 0.5, 1].map((f) => {
    const y = Y(max * f).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" class="ct-grid"/>` +
      `<text x="${pad.l - 7}" y="${+y + 4}" text-anchor="end" class="ct-tick">${esc(money(max * f))}</text>`;
  }).join("");
  const xlabels = days.map((day, i) => {
    if (n > 8 && i % 2 === 1 && i !== n - 1) return "";
    return `<text x="${X(i).toFixed(1)}" y="${H - pad.b + 17}" text-anchor="middle" class="ct-tick">${esc(String(day).slice(5))}</text>`;
  }).join("");
  const lines = hosts.map((h) => {
    const pts = days.map((_, i) => `${X(i).toFixed(1)},${Y(byHost[h][i] || 0).toFixed(1)}`).join(" ");
    const last = days.length - 1;
    return `<polyline class="ct-line" points="${pts}" style="--ch:${hue(h)}"><title>${esc(h)} 14d: ${money(byHost[h].reduce((s, v) => s + (v || 0), 0))}</title></polyline>` +
      `<circle class="ct-dot" cx="${X(last).toFixed(1)}" cy="${Y(byHost[h][last] || 0).toFixed(1)}" r="3" style="--ch:${hue(h)}"/>`;
  }).join("");
  const tPts = totals.map((t, i) => `${X(i).toFixed(1)},${Y(t).toFixed(1)}`).join(" ");
  const total = `<polyline class="ct-total" points="${tPts}"><title>${esc(`fleet total 14d: ${money(totals.reduce((s, v) => s + v, 0))}`)}</title></polyline>`;
  return `<div class="ct-scroll"><svg class="ct-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="14-day fleet cost trend per host">${grid}${xlabels}${lines}${total}</svg></div>`;
}

function trendLegend(d) {
  const byHost = d.daily_cost_by_host || {};
  const hosts = HOST_ORDER.filter((h) => Array.isArray(byHost[h])).concat(
    Object.keys(byHost).filter((h) => !HOST_ORDER.includes(h) && Array.isArray(byHost[h]))
  );
  legendEl.innerHTML = hosts.map((h) => {
    const t = (byHost[h] || []).reduce((s, v) => s + (v || 0), 0);
    return `<span class="ct-key"><i class="ct-swatch" style="background:${hue(h)}"></i>${esc(h)} <b>${esc(money(t))}</b></span>`;
  }).join("") + `<span class="ct-key ct-key-total"><i class="ct-swatch ct-swatch-total"></i>fleet total</span>`;
}

function agentHostMap(d) {
  const m = {};
  Object.entries(d.agents_by_host || {}).forEach(([h, arr]) => {
    (arr || []).forEach((a) => { m[String(a).toLowerCase()] = h; });
  });
  return m;
}

function miniSpark(vals, color) {
  if (!vals || !vals.length) return `<div class="lb-spark-empty">no series</div>`;
  vals = vals.map((v) => (Number.isFinite(v) ? v : 0));
  const W = 220, H = 44, pad = 3;
  const max = Math.max(...vals, 0.000001);
  const step = (W - pad * 2) / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const last = pts[pts.length - 1];
  return `<svg class="lb-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">` +
    `<polyline class="lb-spark-line" points="${line}" style="--lc:${color}"/>` +
    `<circle class="lb-spark-dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6" style="--lc:${color}"/></svg>`;
}

function leaderboard(d) {
  const rows = [...(d.per_agent_24h || [])].sort((a, b) => (b.cost_24h || 0) - (a.cost_24h || 0)).slice(0, LEAD_N);
  if (!rows.length) return `<p class="hosts-wait">no agent costs yet</p>`;
  const hostOf = agentHostMap(d);
  return rows.map((a, i) => {
    const h = hostOf[String(a.agent || "").toLowerCase()] || "";
    const errs = a.error_runs_24h || 0;
    const series = Array.isArray(a.daily_cost_14d) && a.daily_cost_14d.some((v) => v > 0)
      ? a.daily_cost_14d
      : (a.daily_wakings_14d || []);
    return `<article class="lb-card" data-glow data-level="${errs > 0 ? "warn" : "ok"}" style="--lc:${hue(h)}">` +
      `<header class="lb-head"><span class="lb-rank">#${i + 1}</span>` +
      `<h3 class="lb-name">${esc(a.agent || "?")}</h3>` +
      (h ? `<span class="lb-host">${esc(h)}</span>` : "") +
      (errs > 0 ? `<span class="lb-err">${errs} err</span>` : "") + `</header>` +
      `<div class="lb-cost">${esc(money(a.cost_24h))}<span class="lb-cost-sub">24h</span></div>` +
      miniSpark(series, hue(h)) +
      `<div class="lb-meta"><span>${a.runs_24h ?? "–"} runs</span><span>${a.last_wake ? esc(ago(a.last_wake)) : "–"}</span></div>` +
      `</article>`;
  }).join("");
}

function render(d) {
  if (chartEl) chartEl.innerHTML = trendChart(d);
  if (legendEl) trendLegend(d);
  if (lbGrid) lbGrid.innerHTML = leaderboard(d);
  const stamp = d.generated_at ? ago(d.generated_at) : null;
  if (chartFresh) {
    const totals = (d.days || []).map((_, i) =>
      Object.values(d.daily_cost_by_host || {}).reduce((s, arr) => s + ((arr || [])[i] || 0), 0));
    chartFresh.textContent = stamp ? `updated ${stamp} · 14d fleet ${money(totals.reduce((s, v) => s + v, 0))}` : "";
  }
  if (lbFresh) lbFresh.textContent = stamp ? `updated ${stamp} · top ${LEAD_N} by 24h cost` : "";
  refreshEffects();
}

function setErr(msg) {
  if (chartEl && !chartEl.dataset.loaded) chartEl.innerHTML = `<p class="hosts-wait">${esc(msg || "loading cost series…")}</p>`;
  else if (chartFresh) chartFresh.textContent = `telemetry stale — ${msg}`;
  if (lbGrid && !lbGrid.dataset.loaded) lbGrid.innerHTML = `<p class="hosts-wait">${esc(msg || "loading agent costs…")}</p>`;
  else if (lbFresh) lbFresh.textContent = `telemetry stale — ${msg}`;
}

async function tick() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    render(d);
    if (chartEl) chartEl.dataset.loaded = "1";
    if (lbGrid) lbGrid.dataset.loaded = "1";
  } catch (e) {
    setErr(e.message);
  }
}

if (chartEl || lbGrid) {
  tick();
  setInterval(tick, POLL_MS);
}
