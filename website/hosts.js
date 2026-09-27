/* GALE — per-host fleet boards: polls /api/fleet/metrics, renders one
   board per host (14-day sparkline, 24h stats, agent roster). */
import { boot, esc, refreshEffects } from "./shared.js";

boot();

const FEED = "api/fleet/metrics";
const POLL_MS = 30000;
const HOST_ORDER = ["gale", "tidal", "mountain", "beacon"];
const HOST_META = {
  gale: { hue: "#ff8a3d", note: "fleet lead · 12 agents" },
  tidal: { hue: "#3fc7ff", note: "tidalwake.org" },
  mountain: { hue: "#8593f0", note: "mountainwake.org" },
  beacon: { hue: "#ffc233", note: "beaconwake.com" },
};

const grid = document.getElementById("hosts-grid");
const fresh = document.getElementById("hosts-fresh");
const alertBox = document.getElementById("fleet-alerts");
let alertCache = { at: 0, items: null };

async function fetchAlerts() {
  if (Date.now() - alertCache.at < POLL_MS && alertCache.items) return alertCache.items;
  try {
    const r = await fetch("api/fleet/alerts", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    alertCache = { at: Date.now(), items: d.alerts || [] };
  } catch {
    alertCache = { at: Date.now(), items: alertCache.items || [] };
  }
  return alertCache.items;
}

function renderAlerts(items) {
  if (!alertBox) return;
  const crit = items.filter((a) => a.sev === "crit").length;
  if (!items.length) { alertBox.hidden = true; alertBox.innerHTML = ""; return; }
  alertBox.hidden = false;
  alertBox.innerHTML =
    `<span class="fleet-alerts-h">${crit ? `${crit} critical` : `${items.length} notice${items.length === 1 ? "" : "s"}`}</span>` +
    items.slice(0, 6).map((a) =>
      `<a class="fleet-alert-chip" data-sev="${esc(a.sev || "warn")}" href="status.html" title="${esc(a.kind || "fleet")}">${esc(a.text || "")}</a>`
    ).join("") +
    (items.length > 6 ? `<span class="fleet-alerts-more">+${items.length - 6} more on status →</span>` : "");
}

function fmtAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!isFinite(s)) return "–";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function money(v) {
  if (v == null) return "–";
  if (v === 0) return "$0.00";
  return v < 10 ? `$${v.toFixed(2)}` : `$${v.toFixed(0)}`;
}

export function sparkline(vals, hue) {
  if (!vals || !vals.length) return `<div class="hb-spark-empty">no series</div>`;
  vals = vals.map((v) => (Number.isFinite(v) ? v : 0));
  const W = 400, H = 64, pad = 4;
  const max = Math.max(...vals, 1);
  const step = (W - pad * 2) / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => {
    const x = pad + i * step;
    const y = H - pad - (v / max) * (H - pad * 2);
    return [x, y];
  });
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`;
  const last = pts[pts.length - 1];
  return `<svg class="hb-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <polygon class="hb-spark-area" points="${area}"/>
    <polyline class="hb-spark-line" points="${line}"/>
    <circle class="hb-spark-dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3"/>
  </svg>`;
}

export function hostBoard(h, d) {
  const meta = HOST_META[h] || { hue: "var(--text-faint)", note: "" };
  const series = (d.daily_wakings_by_host || {})[h] || [];
  const runs = (d.runs_24h_by_host || {})[h] ?? null;
  const cost = (d.cost_24h_by_host || {})[h] ?? null;
  const errs = (d.error_runs_24h_by_host || {})[h] ?? 0;
  const last = (d.last_wake_by_host || {})[h] || null;
  const agents = (d.agents_by_host || {})[h] || [];
  const lvl = errs > 0 ? "warn" : series.length ? "ok" : "idle";
  return `<article class="host-board" data-glow data-host="${esc(h)}" data-level="${lvl}" style="--hb:${meta.hue}">
    <header class="hb-head">
      <span class="hb-dot" aria-hidden="true"></span>
      <h3 class="hb-name"><a href="#hosts">${esc(h)}</a></h3>
      <span class="hb-note">${esc(meta.note)}</span>
      <span class="hb-lvl">${errs > 0 ? `${errs} error${errs === 1 ? "" : "s"}` : series.length ? "active" : "quiet"}</span>
    </header>
    <div class="hb-spark-wrap">${sparkline(series, meta.hue)}</div>
    <div class="hb-stats">
      <div class="hb-stat"><span class="hb-stat-l">${runs == null ? "–" : runs} run${runs === 1 ? "" : "s"}</span><span class="hb-stat-sub">last 24h</span></div>
      <div class="hb-stat"><span class="hb-stat-l">${money(cost)}</span><span class="hb-stat-sub">cost 24h</span></div>
      <div class="hb-stat"><span class="hb-stat-l">${errs > 0 ? `${errs} err` : "0 err"}</span><span class="hb-stat-sub">errors</span></div>
      <div class="hb-stat"><span class="hb-stat-l">${last ? esc(fmtAgo(last)) : "–"}</span><span class="hb-stat-sub">last wake</span></div>
    </div>
    <div class="hb-agents">${agents.map((a) => `<span class="hb-chip">${esc(a || "?")}</span>`).join("")}<span class="hb-agents-n">${agents.length} agents</span></div>
  </article>`;
}

export function render(d) {
  const hosts = HOST_ORDER.filter((h) =>
    (d.runs_24h_by_host || {})[h] != null ||
    (d.agents_by_host || {})[h] ||
    (d.daily_wakings_by_host || {})[h]
  ).concat(Object.keys(d.agents_by_host || {}).filter((h) => !HOST_ORDER.includes(h)));
  grid.innerHTML = hosts.map((h) => hostBoard(h, d)).join("");
  if (fresh) fresh.textContent = d.generated_at ? `updated ${esc(fmtAgo(d.generated_at))}` : "";
  refreshEffects();
  const badge = document.querySelector(".fleet-live-badge");
  if (badge) {
    const agents = Object.values(d.agents_by_host || {}).reduce((s, a) => s + (a || []).length, 0);
    const runs = Object.values(d.runs_24h_by_host || {}).reduce((s, v) => s + (v || 0), 0);
    const cutoff = Date.now() - 12 * 3600 * 1000;
    const live = Object.values(d.last_wake_by_host || {}).filter((t) => new Date(t).getTime() >= cutoff).length;
    badge.innerHTML = `<span class="dot"></span>${agents} agents tracked &middot; ${runs} runs/24h &middot; ${live}/${hosts.length} hosts live`;
  }
}

function setErr(msg) {
  if (grid.dataset.loaded) {
    if (fresh) fresh.textContent = `telemetry stale — ${msg}`;
    return;
  }
  grid.innerHTML = `<p class="hosts-wait">${esc(msg || "waiting for telemetry…")}</p>`;
}

async function tick() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    render(d);
    renderAlerts(await fetchAlerts());
    grid.dataset.loaded = "1";
  } catch (e) {
    setErr(e.message);
  }
}

if (grid) {
  tick();
  setInterval(tick, POLL_MS);
}
