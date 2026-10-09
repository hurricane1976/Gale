/* GALE — Ollama admin panel: polls /api/ollama/{snapshot,history} and renders
   live status, VRAM/residency charts, model management and a playground.
   No chart library, house tokens only. Actions go through /api/ollama/action
   (allowlisted, rate-limited server-side); delete always asks for a typed
   model name, unload always asks once — shared infrastructure, not toys. */
import { tracedFetch, boot, esc, clamp, refreshEffects, trapFocus, REDUCED, setVitals, chartTooltip, skeleton, whenNear } from "./shared.js";

boot();

const SNAP_URL = "api/ollama/snapshot";
const HIST_URL = "api/ollama/history?hours=24";
const POLL_SNAP_MS = 10000;
const POLL_HIST_MS = 60000;
const PALETTE = ["var(--gust)", "var(--m-gpt)", "var(--bolt)", "var(--m-muse)", "var(--m-claude)", "var(--storm-purple)"];

let SNAP = null;
let HIST = null;
let GPU = null;
let GPUReceivedAt = 0;
let O3D;                   // undefined = not tried, null = unavailable (no WebGL), object = running
let PULLING = false;
let THREAD = [];
let BUSY = false;
let pending = null;          // {action, model, typed}
let showOpenFor = null;

const $ = (id) => document.getElementById(id);

// skeleton screens (#6): shimmer until the first fetch renders
skeleton($("gpu-wrap"), 2, 90);

function setFresh(state, text) {
  const el = $("freshness");
  if (!el) return;
  el.dataset.state = state;
  const t = $("freshness-text");
  if (t) t.textContent = text;
}

const fmtGB = (b) => (b == null ? "–" : `${(b / 1e9).toFixed(1)} GB`);
const fmtCtx = (n) => (n == null ? "–" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const fmtCountdown = (s) => {
  if (s == null) return "";
  if (s < 90) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
};
const fmtClock = (ts) => (ts || "").slice(11, 16);

function note(msg, cls) {
  const el = $("action-note");
  if (el) { el.textContent = msg || ""; el.style.color = cls === "err" ? "var(--warn)" : cls === "ok" ? "var(--ok)" : ""; }
}

/* ---------------- confirm modal (unload: tap once; delete: type the name) */
function askConfirm(action, model) {
  pending = { action, model };
  $("confirm-title").textContent = action === "delete" ? "Delete model?" : "Unload model?";
  $("confirm-text").textContent =
    action === "delete"
      ? "Removes the model from the server's disk. Reversible only by re-downloading it."
      : "Drops the model from VRAM now. Fleet agents using it will block until it reloads (the keepalive cron re-arms qwen3.8:27b within ~5 min).";
  const input = $("confirm-input");
  input.value = "";
  input.hidden = action !== "delete";
  updateConfirmBtn();
  $("confirm-overlay").hidden = false;
  if (action === "delete") input.focus();
}
function updateConfirmBtn() {
  const ok = !pending || (pending.action === "delete" ? $("confirm-input").value === pending.model : true);
  $("confirm-yes").disabled = !ok;
}
function closeConfirm() { pending = null; $("confirm-overlay").hidden = true; }

async function postAction(body) {
  try {
    const r = await tracedFetch("api/ollama/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

/* ---------------- vitals ---------------- */
function statCard(label, value, sub, lvl = "ok") {
  return `<div class="vital" data-glow data-level="${lvl}">
    <span class="vital-label">${esc(label)}</span>
    <span class="vital-value">${value}</span>
    <span class="vital-sub">${sub || ""}</span>
  </div>`;
}

function renderVitals() {
  const s = SNAP, h = HIST;
  const up = s && s.reachable;
  const resident = (s && s.resident) || [];
  const models = (s && s.models) || [];
  setVitals($("vitals-grid"), [
    statCard("Server", up ? "up" : "down", s && up ? `v${esc(s.version)} · ${esc(s.url)}` : esc((s && s.error) || "unreachable"), up ? "ok" : "crit"),
    statCard("VRAM in use", fmtGB(s && s.vram_bytes), `${resident.length} model${resident.length === 1 ? "" : "s"} resident`),
    statCard("Resident", resident.length, resident.map(esc).join(" · ") || "nothing loaded"),
    statCard("Installed", models.length, models.length ? `${fmtGB(s.disk_bytes)} on disk` : "none"),
    statCard("API latency", s && s.latency_ms != null ? `${s.latency_ms} ms` : "–", h ? `p50 ${h.latency_ms.p50 ?? "–"} · p95 ${h.latency_ms.p95 ?? "–"} ms (24h)` : ""),
    statCard("Uptime", h && h.uptime_pct != null ? `${h.uptime_pct}%` : "–", h ? `${h.count} samples · ${h.hours}h window` : ""),
    `<button id="unload-all" class="btn ol-btn ol-btn-xs" type="button" ${resident.length ? "" : "disabled"}>Unload all resident</button>`,
  ].join(""));
  refreshEffects();
}

/* ---------------- diagnostics (ROADMAP-ollama #6/#7) ----------------
   Latency percentiles + failure streak + time-since-last-success from the
   30s sampler history, plus a 24h availability strip. This is the "is it
   hung or just slow" panel. */
function renderDiagnostics() {
  const h = HIST;
  const grid = $("diag-grid");
  if (!grid) return;
  if (!h || !h.series || !h.series.length) {
    grid.innerHTML = `<p class="mini-note">no samples yet — the sampler fills in every 30s.</p>`;
    return;
  }
  const s = h.series;
  const lat = s.filter((x) => x.reachable).map((x) => x.latency_ms).sort((a, b) => a - b);
  const pct = (p) => lat.length ? lat[Math.min(lat.length - 1, Math.round(p * (lat.length - 1)))] : null;
  // consecutive failures from the end of the sample window
  let streak = 0;
  for (let i = s.length - 1; i >= 0 && !s[i].reachable; i--) streak++;
  const lastOk = [...s].reverse().find((x) => x.reachable);
  const lastOkAgo = lastOk ? fmtAgo(lastOk.ts) : "never";
  const maxLat = lat.length ? lat[lat.length - 1] : null;
  grid.innerHTML = [
    statCard("Latency p50", pct(0.5) != null ? `${pct(0.5)} ms` : "–", "24h median /api/version"),
    statCard("Latency p95", pct(0.95) != null ? `${pct(0.95)} ms` : "–", maxLat != null ? `max ${maxLat} ms` : ""),
    statCard("Failure streak", streak ? `${streak} samples (${(streak * 0.5).toFixed(1)}m)` : "none", streak >= 4 ? "server looks DOWN now" : "consecutive unreachable samples", streak >= 4 ? "crit" : "ok"),
    statCard("Last success", lastOkAgo, lastOk ? `at ${esc(lastOk.ts.slice(11, 19))}Z · v${esc(lastOk.version || "?")}` : "", streak ? "warn" : "ok"),
    statCard("Availability", h.uptime_pct != null ? `${h.uptime_pct}%` : "–", `${h.count} samples over ${h.hours}h`, h.uptime_pct != null && h.uptime_pct < 95 ? "warn" : "ok"),
  ].join("");
  // 24h availability strip: 96 buckets of 15 minutes
  const strip = $("uptime-strip");
  const nowMs = Date.now();
  const BUCKETS = 96, SPAN = 24 * 3600 * 1000, bw = SPAN / BUCKETS;
  const cells = Array.from({ length: BUCKETS }, () => ({ ok: 0, down: 0 }));
  for (const x of s) {
    const age = nowMs - new Date(x.ts).getTime();
    const idx = BUCKETS - 1 - Math.floor(Math.max(0, Math.min(SPAN - 1, age)) / bw);
    if (x.reachable) cells[idx].ok++; else cells[idx].down++;
  }
  strip.innerHTML = cells.map((c) => {
    const total = c.ok + c.down;
    const lvl = !total ? "empty" : c.down === 0 ? "ok" : c.ok === 0 ? "crit" : "warn";
    return `<i class="up-cell up-${lvl}" title="${lvl}${total ? ` · ${c.ok}/${total} ok` : " · no data"}"></i>`;
  }).join("");
}

function fmtAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (!isFinite(s)) return "–";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function heat(v, warn, crit) {
  return v == null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "";
}

function gpuTile(label, value, sub, cls) {
  return `<div class="gpu-tile ${cls ? `gpu-${cls}` : ""}">
    <span class="gpu-label">${esc(label)}</span>
    <span class="gpu-value">${value}</span>
    <span class="gpu-sub">${sub || ""}</span>
  </div>`;
}

function gpuBar(label, pct, sub, capacityScale = false) {
  const level = pct >= 90 ? "warn" : "";
  const w = Math.max(0, Math.min(100, pct));
  return `<div class="gpu-bar">
    <div class="gpu-bar-head"><span class="gpu-label">${esc(label)}</span><span class="gpu-sub">${sub || ""}</span></div>
    <div class="gpu-track ${level ? `gpu-bar-${level}` : ""}" role="img" aria-label="${esc(label)} ${Math.round(w)} percent${capacityScale ? " of capacity" : ""}"><i style="width:${w.toFixed(1)}%"></i></div>
    ${capacityScale ? '<div class="gpu-capacity-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100% capacity</span></div>' : ""}
  </div>`;
}

/* Thermal ribbon + VRAM headroom (#4): 24h junction-temp history as a
   color-graded ribbon on a FIXED 20-100C scale (stable across renders),
   bucketed to <=120 cells (max temp per bucket -- spikes are the signal),
   with dashed rules at the same 78/88C thresholds the tiles use via
   heat(). VRAM headroom gauge reads 100 - latest used %. Crosshair via
   the shared helper; nulls carry forward so sampler gaps don't dip. */
const THERM_LO = 20, THERM_HI = 100;
function thermColor(t) {
  return t == null ? "var(--text-faint)" : t >= 88 ? "var(--flag)" : t >= 78 ? "var(--warn)" : "var(--ok)";
}
function renderThermal() {
  const box = $("gpu-thermal");
  if (!box) return;
  const series = (HIST && HIST.series) || [];
  const rows = series.map((s) => ({
    ts: s.ts,
    t: s.gpu && s.gpu.ok && Array.isArray(s.gpu.gpus) && s.gpu.gpus[0] ? s.gpu.gpus[0].temp_c : null,
    v: s.gpu && s.gpu.ok && Array.isArray(s.gpu.gpus) && s.gpu.gpus[0] && s.gpu.gpus[0].mem_total_mb
      ? Math.round((s.gpu.gpus[0].mem_used_mb / s.gpu.gpus[0].mem_total_mb) * 100) : null,
  }));
  let lastT = null, lastV = null;
  for (const r of rows) {
    if (r.t != null) lastT = r.t;
    if (r.v != null) lastV = r.v;
    if (r.t == null) r.t = lastT;
    if (r.v == null) r.v = lastV;
  }
  if (!rows.length || rows.every((r) => r.t == null)) {
    box.innerHTML = `<p class="mini-note">thermal ribbon: no GPU temperature history yet</p>`;
    return;
  }
  const N = 120;
  const size = Math.max(1, Math.floor(rows.length / N));
  const buckets = [];
  for (let i = 0; i < rows.length; i += size) {
    const cell = rows.slice(i, i + size);
    const ct = cell.map((r) => r.t).filter((v) => v != null);
    buckets.push({ ts: cell[0].ts, t: ct.length ? Math.max(...ct) : null, v: cell[cell.length - 1].v });
  }
  const W = 600, H = 46, bw = W / buckets.length;
  const Y = (t) => H - 4 - ((Math.min(THERM_HI, Math.max(THERM_LO, t)) - THERM_LO) / (THERM_HI - THERM_LO)) * (H - 8);
  const rects = buckets.map((b, i) =>
    `<rect x="${(i * bw).toFixed(1)}" y="0" width="${(bw + 0.5).toFixed(1)}" height="${H}" fill="${thermColor(b.t)}" opacity="${b.t == null ? 0.25 : 0.85}"/>`).join("");
  const rule = (t, label) =>
    `<line x1="0" y1="${Y(t).toFixed(1)}" x2="${W}" y2="${Y(t).toFixed(1)}" stroke="var(--text-dim)" stroke-width="1" stroke-dasharray="6 5" vector-effect="non-scaling-stroke" opacity="0.7"/>` +
    "";
  const head = lastV == null ? null : 100 - lastV;
  const headCls = head != null && head < 10 ? "warn" : "";
  box.innerHTML =
    `<div style="position:relative"><svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="none" style="border-radius:8px;display:block;height:34px" role="img" aria-label="24 hour temperature ribbon, dashed rules at 78 and 88 degrees">` +
    rects + rule(78, "") + rule(88, "") + `</svg></div>` +
    `<div class="gpu-sub" style="margin:4px 0 8px;display:flex;justify-content:space-between"><span>24h ago</span><span>dashed rules: 78° warm · 88° hot</span><span>now</span></div>` +
    (head == null ? "" :
      `<div class="gpu-bar"><div class="gpu-bar-head"><span class="gpu-label">VRAM headroom</span><span class="gpu-sub">${head.toFixed(0)}% free</span></div>` +
      `<div class="gpu-track ${headCls ? `gpu-bar-${headCls}` : ""}"><i style="width:${head.toFixed(1)}%"></i></div></div>`);
  const svg = box.querySelector("svg");
  chartTooltip(svg, buckets.map((b, i) => ({ x: i * bw + bw / 2 })), (i) => {
    const b = buckets[i];
    const when = b.ts ? new Date(b.ts).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "";
    return `${when} · ${b.t == null ? "no data" : b.t.toFixed(0) + "°C"} · VRAM ${b.v ?? "?"}%`;
  });
}

function renderGpu(g) {
  const box = $("gpu-wrap");
  if (!box) return;
  if (!g || !g.ok || !Array.isArray(g.gpus) || !g.gpus.length) {
    const err = (g && g.error) || "no gpu data";
    box.innerHTML = `<div class="gpu-empty gpu-err">${esc(err)}</div>`;
    return;
  }
  const parts = g.gpus.map((gpu, i) => {
    const name = gpu.name || `gpu ${gpu.index ?? i}`;
    const memPct = gpu.mem_used_mb != null && gpu.mem_total_mb ? (gpu.mem_used_mb / gpu.mem_total_mb) * 100 : null;
    const tiles = [
      gpuTile("VRAM", `${gpu.mem_used_mb ?? "\u2013"} / ${gpu.mem_total_mb ?? "?"} MB`, "video memory", heat(memPct, 85, 95)),
      gpuTile("Temp", `${gpu.temp_c ?? "\u2013"} \u00b0C`, "junction", heat(gpu.temp_c, 78, 88)),
      gpuTile("Power", `${gpu.power_w ?? "\u2013"} W`, gpu.power_limit_w ? `limit ${gpu.power_limit_w} W` : "limit ?"),
    ];
    const bars = [
      gpuBar("Utilization", gpu.util_pct ?? 0, `${Math.round(gpu.util_pct ?? 0)}%`),
      gpuBar("VRAM", gpu.mem_total_mb ? (gpu.mem_used_mb || 0) / gpu.mem_total_mb * 100 : 0, `${gpu.mem_used_mb ?? 0} / ${gpu.mem_total_mb ?? "?"} MB`, true),
      gpuBar("Power draw", gpu.power_limit_w ? (gpu.power_w || 0) / gpu.power_limit_w * 100 : 0, `${gpu.power_w ?? "\u2013"} W`),
    ];
    const gpuIndex = gpu.index ?? i;
    const utilSeries = (HIST?.series || []).filter((sample) => sample.reachable).map((sample) => {
      const historical = sample.gpu?.gpus?.find((entry) => entry.index === gpuIndex) || sample.gpu?.gpus?.[i];
      return historical && Number.isFinite(historical.util_pct) ? historical.util_pct : null;
    }).filter((value) => value != null).slice(-48);
    const utilSpark = utilSeries.length > 1
      ? `<div class="gpu-sparkrow"><span class="mono-dim">24h utilization</span><svg viewBox="0 0 100 22" role="img" aria-label="GPU ${esc(name)} utilization history, last 24 hours"><polyline points="${utilSeries.map((value, point) => `${(point / (utilSeries.length - 1) * 100).toFixed(1)},${(20 - clamp(value, 0, 100) / 100 * 18).toFixed(1)}`).join(" ")}"/></svg></div>`
      : "";
    return `<div class="gpu-card">
      <div class="gpu-card-head"><span class="gpu-name">${esc(name)}</span>${g.stale ? '<span class="gpu-stale">stale</span>' : ""}</div>
      <div class="gpu-tilegrid">${tiles.join("")}</div>
      <div class="gpu-bars">${bars.join("")}</div>
      ${utilSpark}
    </div>`;
  });
  box.innerHTML = `<div class="gpu-grid">${parts.join("")}</div>`;
  const sampleLabel = `received ${new Date(GPUReceivedAt || Date.now()).toLocaleTimeString()}`;
  setText($("gpu-sample-time"), sampleLabel);
  setText($("gpu-3d-sample-time"), sampleLabel);
}

/* ---------------- charts ---------------- */
function timeRange(series) {
  const t0 = new Date(series[0].ts).getTime();
  const t1 = new Date(series[series.length - 1].ts).getTime();
  return [t0, Math.max(t1, t0 + 1)];
}
const xAt = (ts, t0, span) => ((new Date(ts).getTime() - t0) / span);

function downBands(series, t0, span, y0, y1) {
  let bands = "", open = null;
  const close = (i) => {
    const a = xAt(open, t0, span) * 100, b = xAt(series[i].ts, t0, span) * 100;
    bands += `<rect x="${a.toFixed(2)}%" y="${y0}" width="${Math.max(0.4, b - a).toFixed(2)}%" height="${y1 - y0}" fill="var(--warn-dim)" opacity="0.55"><title>server unreachable</title></rect>`;
    open = null;
  };
  series.forEach((s, i) => {
    if (!s.reachable && open == null) open = s.ts;
    if (s.reachable && open != null) close(i);
  });
  if (open != null) {
    const a = xAt(open, t0, span) * 100;
    bands += `<rect x="${a.toFixed(2)}%" y="${y0}" width="${(100 - a).toFixed(2)}%" height="${y1 - y0}" fill="var(--warn-dim)" opacity="0.55"><title>server unreachable</title></rect>`;
  }
  return bands;
}

function renderVramChart() {
  const el = $("vram-chart");
  const allSeries = HIST.series || [];
  const series = allSeries.filter((s) => s.reachable);
  const table = $("vram-history-table");
  if (table) {
    const rows = allSeries.slice(-100).reverse();
    setHTML(table, rows.length ? `<table><thead><tr><th>Time (UTC)</th><th>Reachable</th><th>VRAM (GB)</th><th>API latency (ms)</th></tr></thead><tbody>${rows.map((sample) => `<tr><td>${esc(fmtClock(sample.ts))}</td><td>${sample.reachable ? "yes" : "no"}</td><td>${esc(sample.reachable ? ((sample.vram_bytes || 0) / 1e9).toFixed(2) : "—")}</td><td>${esc(sample.reachable ? sample.latency_ms ?? "—" : "—")}</td></tr>`).join("")}</tbody></table>` : '<p class="mini-note">No GPU history samples yet.</p>');
  }
  if (series.length < 2) { el.innerHTML = `<p class="mini-note">Collecting samples&hellip; (first chart in a few minutes)</p>`; return; }
  const W = 720, H = 170, pad = { t: 14, r: 10, b: 22, l: 46 };
  const [t0, t1] = timeRange(HIST.series);
  const span = t1 - t0;
  const maxGB = Math.max(...series.map((s) => (s.vram_bytes || 0) / 1e9), 1);
  const y = (v) => H - pad.b - (v / maxGB) * (H - pad.t - pad.b);
  const pts = series.map((s) => `${(pad.l + clamp(xAt(s.ts, t0, span)) * (W - pad.l - pad.r)).toFixed(1)},${y((s.vram_bytes || 0) / 1e9).toFixed(1)}`);
  const area = `M${pad.l},${(H - pad.b).toFixed(1)} L` + pts.join(" L") + ` L${(W - pad.r).toFixed(1)},${(H - pad.b).toFixed(1)} Z`;
  const ticks = [0, 0.5, 1].map((f) => {
    const ty = (H - pad.b - f * (H - pad.t - pad.b)).toFixed(1);
    return `<line x1="${pad.l}" y1="${ty}" x2="${W - pad.r}" y2="${ty}" stroke="var(--line)"/>
      <text x="${pad.l - 6}" y="${+ty + 4}" text-anchor="end" class="obs-tick">${(maxGB * f).toFixed(1)}G</text>`;
  }).join("");
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="VRAM in use over 24h">
    ${ticks}
    <g>${downBands(HIST.series, t0, span, pad.t, H - pad.b)}</g>
    <path d="${area}" fill="var(--flag-dim)" stroke="none"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="var(--flag-soft)" stroke-width="1.6"/>
    <text x="${pad.l}" y="${H - 6}" class="obs-tick">${esc(fmtClock(HIST.series[0].ts))} UTC</text>
    <text x="${W - pad.r}" y="${H - 6}" text-anchor="end" class="obs-tick">${esc(fmtClock(HIST.series[HIST.series.length - 1].ts))} UTC</text>
  </svg>`;
}

$("vram-table-toggle")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  const open = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(open));
  button.textContent = open ? "Hide VRAM history table" : "Show VRAM history table";
  $("vram-history-table").hidden = !open;
});

function renderLatencyChart() {
  const el = $("latency-chart");
  const series = (HIST.series || []).filter((s) => s.reachable);
  if (series.length < 2) { el.innerHTML = `<p class="mini-note">&nbsp;</p>`; return; }
  const W = 720, H = 110, pad = { t: 12, r: 10, b: 20, l: 46 };
  const [t0, t1] = timeRange(HIST.series);
  const span = t1 - t0;
  const p98 = series.map((s) => s.latency_ms || 0).sort((a, b) => a - b);
  const maxMs = Math.max(p98[Math.floor(p98.length * 0.98)] || 10, 10) * 1.3;
  const y = (v) => H - pad.b - (Math.min(v, maxMs) / maxMs) * (H - pad.t - pad.b);
  const pts = series.map((s) => `${(pad.l + clamp(xAt(s.ts, t0, span)) * (W - pad.l - pad.r)).toFixed(1)},${y(s.latency_ms || 0).toFixed(1)}`);
  const ticks = [0, 1].map((f) => {
    const ty = (H - pad.b - f * (H - pad.t - pad.b)).toFixed(1);
    return `<line x1="${pad.l}" y1="${ty}" x2="${W - pad.r}" y2="${ty}" stroke="var(--line)"/>
      <text x="${pad.l - 6}" y="${+ty + 4}" text-anchor="end" class="obs-tick">${Math.round(maxMs * f)}ms</text>`;
  }).join("");
  const last = series[series.length - 1];
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="API latency over 24h">
    ${ticks}
    <g>${downBands(HIST.series, t0, span, pad.t, H - pad.b)}</g>
    <polyline points="${pts.join(" ")}" fill="none" stroke="var(--gust)" stroke-width="1.4" opacity="0.9"/>
    <text x="${W - pad.r}" y="${(y(last.latency_ms || 0) - 4).toFixed(1)}" text-anchor="end" class="obs-tick obs-tick-top">${last.latency_ms} ms now</text>
  </svg>`;
}

/* ---------------- residency lanes ---------------- */
function renderLanes() {
  const el = $("lanes");
  const series = HIST.series || [];
  if (series.length < 2) { el.innerHTML = `<p class="mini-note">Collecting samples&hellip;</p>`; return; }
  const names = [...new Set(series.flatMap((s) => s.resident || []))].sort();
  if (!names.length) { el.innerHTML = `<p class="mini-note">No model resident in the window.</p>`; return; }
  const [t0, t1] = timeRange(series);
  const span = t1 - t0;
  el.innerHTML = names.map((name, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    const spans = [];
    let open = null;
    const flush = (endTs) => {
      const a = xAt(open, t0, span) * 100, b = xAt(endTs, t0, span) * 100;
      const w = Math.max(0.5, b - a);
      spans.push(`<span class="ol-span" style="left:${a.toFixed(2)}%;width:${w.toFixed(2)}%;background:${color}" title="${esc(name)}"></span>`);
      open = null;
    };
    series.forEach((s) => {
      const on = s.reachable && (s.resident || []).includes(name);
      if (on && open == null) open = s.ts;
      if (!on && open != null) flush(s.ts);
    });
    if (open != null) flush(series[series.length - 1].ts);
    const residentNow = ((SNAP && SNAP.resident) || []).includes(name);
    return `<div class="obs-lane">
      <span class="obs-lane-name" style="color:${color}">${esc(name)}</span>
      <span class="obs-lane-track">${spans.join("") || `<span class="mini-note" style="margin:0">not resident</span>`}</span>
      <span class="obs-lane-count">${residentNow ? "resident" : "unloaded"}</span>
    </div>`;
  }).join("");
}

/* ---------------- events ---------------- */
const EVT_META = {
  load: { label: "load", color: "var(--ok)" },
  unload: { label: "unload", color: "var(--text-faint)" },
  server_down: { label: "server down", color: "var(--warn)" },
  server_up: { label: "server up", color: "var(--ok)" },
};
function renderEvents() {
  const el = $("events");
  const evts = (HIST.events || []).slice(-14).reverse();
  if (!evts.length) { el.innerHTML = `<div class="silent-ok">No transitions in the window — steady state.</div>`; return; }
  el.innerHTML = evts.map((e) => {
    const m = EVT_META[e.type] || { label: e.type, color: "var(--text-faint)" };
    return `<div class="ol-evt"><span class="ol-evt-ts">${esc((e.ts || "").slice(5, 16).replace("T", " "))}</span>
      <span class="ol-evt-tag" style="color:${m.color}">${esc(m.label)}</span>
      <span>${e.model ? esc(e.model) : ""}</span></div>`;
  }).join("");
}

/* ---------------- models table ---------------- */
function renderModels() {
  const s = SNAP;
  const models = s.models || [];
  $("model-count").textContent = models.length;
  $("disk-total").textContent = fmtGB(s.disk_bytes);
  const rows = models.map((m) => {
    const status = m.resident
      ? (m.pinned ? `<span class="ol-badge ol-badge-res">resident · pinned</span>`
                  : `<span class="ol-badge ol-badge-res">resident</span> <span class="ol-exp">unloads in ${esc(fmtCountdown(m.expires_in_s)) || "–"}</span>`)
      : `<span class="ol-badge">disk only</span>`;
    const caps = (m.capabilities || []).map((c) => `<span class="ol-cap">${esc(c)}</span>`).join(" ") || "–";
    const acts = [
      `<button class="btn ol-btn ol-btn-xs" data-act="show" data-model="${esc(m.name)}">Show</button>`,
      `<button class="btn ol-btn ol-btn-xs" data-act="play" data-model="${esc(m.name)}">Playground</button>`,
      m.resident
        ? `<button class="btn ol-btn ol-btn-xs" data-act="unload" data-model="${esc(m.name)}">Unload</button>`
        : `<button class="btn ol-btn ol-btn-xs" data-act="keep_alive" data-model="${esc(m.name)}" title="load now and hold in VRAM (keep_alive -1)">Load+pin</button>`,
      `<button class="btn ol-btn ol-btn-xs" data-act="benchmark" data-model="${esc(m.name)}" title="measured 64-token generation: load vs prompt-eval vs eval tok/s">Bench</button>`,
      `<button class="btn ol-btn ol-btn-xs ol-btn-danger" data-act="delete" data-model="${esc(m.name)}">Delete</button>`,
    ].filter(Boolean).join(" ");
    return `<tr>
      <td><code>${esc(m.name)}</code><span class="obs-fam" style="background:${PALETTE[models.indexOf(m) % PALETTE.length]}"></span></td>
      <td>${esc(m.parameter_size || "–")}</td>
      <td>${esc(m.quantization_level || "–")}</td>
      <td>${fmtGB(m.size_bytes)}</td>
      <td>${fmtCtx(m.context_length)}</td>
      <td>${caps}</td>
      <td>${status}</td>
      <td>${esc((m.modified_at || "").slice(0, 10))}</td>
      <td class="ol-acts">${acts}</td>
    </tr>`;
  }).join("");
  $("models-table").querySelector("tbody").innerHTML = rows || `<tr><td colspan="9" class="mini-note">No models installed.</td></tr>`;
  [...$("models-table").querySelectorAll("tbody tr")].forEach((row, index) => {
    const model = models[index];
    if (!model) return;
    row.dataset.modelSearch = [model.name, model.parameter_size, model.quantization_level, ...(model.capabilities || [])].filter(Boolean).join(" ").toLowerCase();
    row.dataset.modelState = model.resident ? "resident" : "disk";
  });
  applyModelFilters();
  refreshChatModelSelect();
}

function applyModelFilters() {
  const query = ($("model-filter")?.value || "").trim().toLowerCase();
  const state = $("model-state-filter")?.value || "all";
  const tableRows = [...$("models-table").querySelectorAll("tbody tr[data-model-search]")];
  let shown = 0;
  tableRows.forEach((row) => {
    const visible = (!query || row.dataset.modelSearch.includes(query)) && (state === "all" || row.dataset.modelState === state);
    row.hidden = !visible;
    if (visible) shown++;
  });
  const total = Number($("model-count").textContent) || tableRows.length;
  setText($("model-visible-count"), query || state !== "all" ? `Showing ${shown} of ${total} models` : `Showing all ${total} models`);
}

$("model-filter")?.addEventListener("input", applyModelFilters);
$("model-state-filter")?.addEventListener("change", applyModelFilters);

$("models-table").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn || BUSY) return;
  const model = btn.dataset.model;
  const act = btn.dataset.act;
  if (act === "show") return openShow(model);
  if (act === "play") {
    const sel = $("chat-model");
    if ([...sel.options].some((o) => o.value === model)) sel.value = model;
    loadPreset();
    $("chat-input").focus();
    $("chat-thread").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
    return;
  }
  if (act === "benchmark") {
    BUSY = true;
    note(`benchmarking ${model} (loads if needed, 64 tokens, up to a few minutes on CPU)…`);
    const res = await postAction({ action: "benchmark", model });
    BUSY = false;
    if (!res.ok) { note(`benchmark failed: ${res.error}`, "err"); return; }
    const st = res.stats || {};
    note([
      st.load_duration_ns ? `load ${(st.load_duration_ns / 1e9).toFixed(1)}s` : null,
      st.prompt_eval_tok_s ? `prompt ${st.prompt_eval_tok_s} tok/s` : null,
      st.eval_tok_s ? `eval ${st.eval_tok_s} tok/s (${st.eval_count} tok)` : null,
      st.total_duration_ns ? `total ${(st.total_duration_ns / 1e9).toFixed(1)}s` : null,
    ].filter(Boolean).join(" · ") || "benchmark done", "ok");
    return;
  }
  if (act === "keep_alive") {
    // non-destructive (loads + pins) -- no confirm dialog needed
    BUSY = true;
    note(`loading ${model} and pinning in VRAM (keep_alive -1)…`);
    const res = await postAction({ action: "keep_alive", model, keep_alive: -1 });
    BUSY = false;
    if (res.ok) note(`${model} loaded + pinned`, "ok");
    else note(`keep_alive failed: ${res.error}`, "err");
    await loadSnap();
    return;
  }
  askConfirm(act, model);
});

$("vitals-grid").addEventListener("click", async (e) => {
  if (!e.target.closest("#unload-all") || BUSY) return;
  BUSY = true;
  note("unloading all resident models…");
  const res = await postAction({ action: "unload_all" });
  BUSY = false;
  if (res.ok) note(`unloaded ${res.unloaded} model(s)`, "ok");
  else note(`unload_all failed: ${res.error}`, "err");
  await loadSnap();
});

/* ---------------- show drawer ---------------- */
async function openShow(model) {
  showOpenFor = model;
  $("show-title").textContent = model;
  $("show-body").innerHTML = `<p class="mini-note">loading&hellip;</p>`;
  $("show-overlay").hidden = false;
  try {
    const r = await tracedFetch(`api/ollama/show?model=${encodeURIComponent(model)}`, { cache: "no-store" });
    const d = await r.json();
    if (showOpenFor !== model) return;
    if (!d.ok) { $("show-body").innerHTML = `<div class="silent-err">${esc(d.error || "error")}</div>`; return; }
    const s = d.show || {};
    const det = s.details || {};
    const cut = (t) => { t = String(t || ""); return t.length > 6000 ? t.slice(0, 6000) + "\n… (truncated)" : t; };
    $("show-body").innerHTML = `
      <dl class="ol-show-grid">
        <div><dt>family</dt><dd>${esc(det.family || "–")}</dd></div>
        <div><dt>params</dt><dd>${esc(det.parameter_size || "–")}</dd></div>
        <div><dt>quant</dt><dd>${esc(det.quantization_level || "–")}</dd></div>
        <div><dt>modified</dt><dd>${esc((s.modified_at || "").slice(0, 10))}</dd></div>
      </dl>
      ${(s.capabilities || []).length ? `<div class="ol-caps">${s.capabilities.map((c) => `<span class="ol-cap">${esc(c)}</span>`).join(" ")}</div>` : ""}
      ${det.system ? `<h4>system</h4><pre>${esc(cut(det.system))}</pre>` : ""}
      <h4>parameters</h4><pre>${esc(cut(s.parameters) || "–")}</pre>
      <h4>template</h4><pre>${esc(cut(s.template) || "–")}</pre>
      <h4>modelfile</h4><pre>${esc(cut(s.modelfile) || "–")}</pre>
      <p class="mini-note">License available in the raw feed (<code>/api/ollama/show?model=</code>).</p>`;
  } catch (e) {
    $("show-body").innerHTML = `<div class="silent-err">${esc(String(e.message || e))}</div>`;
  }
}

/* ---------------- pull panel ---------------- */
$("pull-btn").addEventListener("click", async () => {
  if (PULLING) return;
  const model = $("pull-name").value.trim();
  if (!model) { note("enter a model name to pull", "err"); return; }
  const res = await postAction({ action: "pull", model });
  if (!res.ok) { note(`pull failed: ${res.error}`, "err"); return; }
  note(`pulling ${model}…`, "ok");
  startPullWatch(model);
});

function startPullWatch(model) {
  PULLING = true;
  $("pull-progress").hidden = false;
  const tick = async () => {
    try {
      const r = await tracedFetch("api/ollama/pull/status", { cache: "no-store" });
      const st = await r.json();
      if (st.model !== model && st.state !== "running") { stopPullWatch(); return; }
      const pct = st.pct != null ? st.pct : null;
      $("pullbar-fill").style.width = `${pct != null ? pct : 2}%`;
      $("pull-status").textContent = `${pct != null ? `${pct}%` : ""} ${st.status || ""}`.trim();
      if (st.state === "done") { note(`pulled ${model} — now installed`, "ok"); stopPullWatch(); await loadSnap(); await loadHist(); }
      else if (st.state === "failed") { note(`pull failed: ${st.error}`, "err"); stopPullWatch(); }
      else if (st.state !== "running") stopPullWatch();
    } catch { /* transient */ }
  };
  tick();
  const iv = setInterval(tick, 1500);
  window.__pullIv = iv;
}
function stopPullWatch() {
  PULLING = false;
  clearInterval(window.__pullIv);
  setTimeout(() => { if (!PULLING) { $("pull-progress").hidden = true; $("pullbar-fill").style.width = "0%"; } }, 4000);
}

/* ---------------- playground ---------------- */
let refreshChatModelSelect = function () {
  const sel = $("chat-model");
  const cur = sel.value;
  const names = ((SNAP && SNAP.models) || []).map((m) => m.name);
  sel.innerHTML = names.map((n) => `<option${n === cur ? " selected" : ""}>${esc(n)}</option>`).join("");
}
function renderThread() {
  const el = $("chat-thread");
  if (!THREAD.length) { el.innerHTML = `<p class="mini-note">Send a message to start the thread.</p>`; return; }
  el.innerHTML = THREAD.map((m) => {
    if (m.role === "user") return `<div class="ol-bubble ol-bubble-user"><span class="ol-who">you</span>${esc(m.content)}</div>`;
    const think = m.thinking ? `<details class="ol-think"><summary>reasoning</summary><div>${esc(m.thinking)}${m.streaming && !m.content ? '<span class="ol-cursor">▍</span>' : ""}</div></details>` : "";
    const st = m.stats ? `<span class="ol-stats">${esc(m.stats)}</span>` : "";
    return `<div class="ol-bubble ol-bubble-ai"><span class="ol-who">${esc(m.model || "assistant")}</span>${think}${esc(m.content)}${m.streaming && m.content ? '<span class="ol-cursor">▍</span>' : ""}${st}</div>`;
  }).join("");
  el.scrollTop = el.scrollHeight;
}

function chatStatsLine(st, doneReason, wallMs) {
  if (!st) return null;
  const outTok = st.eval_count, secs = (st.eval_duration_ns || 0) / 1e9;
  const tps = outTok && secs ? `${(outTok / secs).toFixed(1)} tok/s` : null;
  const bits = [
    doneReason && doneReason !== "stop" ? `stopped: ${doneReason}` : null,
    st.prompt_eval_count != null ? `${st.prompt_eval_count} in` : null,
    outTok != null ? `${outTok} out` : null,
    tps,
    wallMs != null ? `${(wallMs / 1000).toFixed(1)}s` : (st.total_duration_ns ? `${(st.total_duration_ns / 1e9).toFixed(1)}s` : null),
  ].filter(Boolean).join(" · ");
  return bits || null;
}

/* Chat options: temperature/max-tokens are first-class inputs; the rest
   live in the details drawer. Non-empty values only; presets per model in
   localStorage. */
function collectChatOptions() {
  const num = (id) => {
    const v = $(id).value.trim();
    return v === "" ? null : parseFloat(v);
  };
  const opts = {};
  const pairs = [
    ["temperature", "chat-temp"], ["num_predict", "chat-numpred"],
    ["top_p", "chat-topp"], ["top_k", "chat-topk"],
    ["repeat_penalty", "chat-repp"], ["num_ctx", "chat-numctx"],
    ["seed", "chat-seed"],
  ];
  for (const [key, id] of pairs) {
    const v = num(id);
    if (v != null && Number.isFinite(v)) opts[key] = v;
  }
  return opts;
}

const PRESET_KEY = (model) => `gale-ollama-preset:${model}`;

function loadPreset() {
  const model = $("chat-model").value;
  let p = null;
  try { p = JSON.parse(localStorage.getItem(PRESET_KEY(model)) || "null"); } catch { /* ignore */ }
  const map = { temperature: "chat-temp", num_predict: "chat-numpred", top_p: "chat-topp",
    top_k: "chat-topk", repeat_penalty: "chat-repp", num_ctx: "chat-numctx", seed: "chat-seed" };
  for (const [key, id] of Object.entries(map)) $(id).value = p && p[key] != null ? p[key] : "";
  $("preset-note").textContent = p ? `preset loaded for ${model}` : "";
}

$("chat-save-preset").addEventListener("click", () => {
  const model = $("chat-model").value;
  if (!model) return;
  localStorage.setItem(PRESET_KEY(model), JSON.stringify(collectChatOptions()));
  $("preset-note").textContent = `preset saved for ${model}`;
});
$("chat-clear-preset").addEventListener("click", () => {
  const model = $("chat-model").value;
  localStorage.removeItem(PRESET_KEY(model));
  $("preset-note").textContent = "preset cleared";
});
$("chat-model").addEventListener("change", loadPreset);

async function sendChat() {
  if (BUSY) return;
  const input = $("chat-input");
  const text = input.value.trim();
  const model = $("chat-model").value;
  if (!text || !model) return;
  BUSY = true;
  $("chat-send").disabled = true;
  input.value = "";
  THREAD.push({ role: "user", content: text });
  const reply = { role: "assistant", content: "", thinking: "", model, streaming: true };
  THREAD.push(reply);
  renderThread();
  const messages = [];
  const sys = $("chat-system").value.trim();
  if (sys) messages.push({ role: "system", content: sys });
  for (const m of THREAD) {
    if (m === reply) continue;
    messages.push({ role: m.role, content: m.content });
  }
  let tick = null;
  try {
    const r = await tracedFetch("api/ollama/chat/stream", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, options: collectChatOptions() }),
    });
    if (!r.ok || !r.body) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || `HTTP ${r.status}`);
    }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    const paint = () => { renderThread(); tick = null; };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        if (!frame.startsWith("data: ")) continue;
        let ev;
        try { ev = JSON.parse(frame.slice(6)); } catch { continue; }
        if (ev.error) throw new Error(ev.error);
        if (ev.content) reply.content += ev.content;
        if (ev.thinking) reply.thinking += ev.thinking;
        if (ev.done && ev.stats) {
          reply.streaming = false;
          reply.stats = chatStatsLine(ev.stats, ev.done_reason, ev.wall_ms) || null;
          paint();
          continue;
        }
        // throttle repaints to ~30/s while streaming
        if (!tick) tick = setTimeout(paint, 33);
      }
    }
    reply.streaming = false;
    renderThread();
  } catch (e) {
    reply.streaming = false;
    reply.content = reply.content || `⚠ ${String(e.message || e)}`;
    reply.stats = "failed";
    renderThread();
  }
  BUSY = false;
  $("chat-send").disabled = false;
}

$("chat-send").addEventListener("click", sendChat);
$("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
});
$("chat-clear").addEventListener("click", () => { THREAD = []; renderThread(); });

/* ---------------- A/B compare (same prompt, two models) ---------------- */
function refreshAbSelects() {
  const names = ((SNAP && SNAP.models) || []).map((m) => m.name);
  for (const id of ["ab-model-a", "ab-model-b"]) {
    const sel = $(id);
    const cur = sel.value;
    sel.innerHTML = names.map((n) => `<option${n === cur ? " selected" : ""}>${esc(n)}</option>`).join("");
  }
  // sensible default: A = first, B = second (or same if only one model)
  const a = $("ab-model-a"), b = $("ab-model-b");
  if (names.length > 1 && a.value === b.value) b.value = names.find((n) => n !== a.value) || names[0];
}
const origRefreshChatModelSelect = refreshChatModelSelect;
refreshChatModelSelect = function () { origRefreshChatModelSelect(); refreshAbSelects(); };

function abStatsLine(st) {
  if (!st) return "";
  const bits = [];
  if (st.load_duration_ns) bits.push(`load ${(st.load_duration_ns / 1e9).toFixed(1)}s`);
  if (st.prompt_eval_tok_s) bits.push(`prompt ${st.prompt_eval_tok_s} tok/s`);
  if (st.eval_tok_s) bits.push(`eval ${st.eval_tok_s} tok/s (${st.eval_count} tok)`);
  return bits.join(" · ");
}

$("ab-run").addEventListener("click", async () => {
  const prompt = $("chat-input").value.trim();
  if (!prompt) { $("ab-note").textContent = "type a prompt in the composer first"; return; }
  const modelA = $("ab-model-a").value, modelB = $("ab-model-b").value;
  if (!modelA || !modelB) { $("ab-note").textContent = "two models needed"; return; }
  const options = collectChatOptions();
  const sys = $("chat-system").value.trim();
  const messages = sys ? [{ role: "system", content: sys }, { role: "user", content: prompt }]
                       : [{ role: "user", content: prompt }];
  $("ab-run").disabled = true;
  BUSY = true;
  for (const [side, model] of [["a", modelA], ["b", modelB]]) {
    $(`ab-thread-${side}`).innerHTML = `<p class="mini-note">generating on ${esc(model)}…</p>`;
    $(`ab-stats-${side}`).textContent = "";
  }
  $("ab-note").textContent = "running…";
  const runOne = async (side, model) => {
    const t0 = Date.now();
    try {
      const r = await tracedFetch("api/ollama/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, options }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || `HTTP ${r.status}`);
      $(`ab-thread-${side}`).innerHTML =
        `<div class="ol-bubble ol-bubble-ai"><span class="ol-who">${esc(model)}</span>${esc((d.message && d.message.content) || "")}</div>`;
      $(`ab-stats-${side}`).textContent =
        `${abStatsLine(d.stats)}${d.stats && d.stats.total_duration_ns ? ` · ${((Date.now() - t0) / 1000).toFixed(1)}s wall` : ""}`;
    } catch (e) {
      $(`ab-thread-${side}`).innerHTML = `<div class="ol-bubble ol-bubble-ai">⚠ ${esc(String(e.message || e))}</div>`;
      $(`ab-stats-${side}`).textContent = "failed";
    }
  };
  // parallel -- wall-clock fairness matters when comparing
  await Promise.all([runOne("a", modelA), runOne("b", modelB)]);
  $("ab-note").textContent = `done — ${modelA} vs ${modelB}`;
  $("ab-run").disabled = false;
  BUSY = false;
  $("chat-input").value = "";
});

/* ---------------- confirm overlay wiring ---------------- */
trapFocus($("confirm-overlay"));
trapFocus($("show-overlay"));
$("confirm-yes").addEventListener("click", async () => {
  if (!pending) return;
  const { action, model } = pending;
  closeConfirm();
  BUSY = true;
  note(`${action} ${model}…`);
  const res = await postAction({ action, model, confirm: model });
  BUSY = false;
  if (res.ok) note(`${action} ${model} — done`, "ok");
  else note(`${action} failed: ${res.error}`, "err");
  await loadSnap();
  if (action === "delete" || action === "pull") await loadHist();
});
$("confirm-no").addEventListener("click", closeConfirm);
$("confirm-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeConfirm(); });
$("confirm-input").addEventListener("input", updateConfirmBtn);

/* ---------------- show overlay wiring ---------------- */
$("show-close").addEventListener("click", () => { showOpenFor = null; $("show-overlay").hidden = true; });
$("show-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) { showOpenFor = null; e.currentTarget.hidden = true; } });

/* ---------------- loaders ---------------- */
async function loadSnap() {
  try {
    const r = await tracedFetch(SNAP_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    SNAP = await r.json();
    $("srv-url").textContent = SNAP.url || "192.168.1.197:11434";
    renderVitals();
    renderModels();
    if (HIST) renderLanes();
    update3D();
    setFresh(SNAP.reachable ? "live" : "stale", SNAP.reachable ? `live · v${SNAP.version} · ${SNAP.latency_ms} ms` : "server unreachable");
  } catch (e) {
    setFresh("error", `feed error: ${String(e.message || e)}`);
  }
}
async function loadHist() {
  try {
    const r = await tracedFetch(HIST_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    HIST = await r.json();
    renderVitals();
    renderThermal();
    renderDiagnostics();
    renderVramChart();
    renderLatencyChart();
    renderLanes();
    renderEvents();
    renderHealth();
    update3D();
  } catch { /* snapshot poll will surface feed errors */ }
}


/* ---------------- health score & energy (computed from the 24h history) ----------------
   Everything here is derived from fields the sampler already records (GPU power/util/temp/VRAM per 30s sample,
   resident models, reachability, latency percentiles). Cost uses a flat assumed tariff -- an estimate. */
const KWH_PRICE = 0.15;
function renderHealth() {
  const box = $("health-grid");
  if (!box || !HIST) return;
  const series = HIST.series || [];
  let kwh = 0, peakW = 0, minW = Infinity, sumW = 0, nW = 0, active = 0, hotMin = 0, peakT = 0, resident = 0, nOk = 0;
  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    if (s.reachable === false) continue;
    nOk++;
    if ((s.resident || []).length) resident++;
    const g = s.gpu && s.gpu.gpus && s.gpu.gpus[0];
    if (!g) continue;
    const dt = i + 1 < series.length ? Math.min(120, Math.max(1, (new Date(series[i + 1].ts) - new Date(s.ts)) / 1000)) : 30;
    const w = g.power_w || 0;
    kwh += (w * dt) / 3.6e6; peakW = Math.max(peakW, w); minW = Math.min(minW, w); sumW += w; nW++;
    if ((g.util_pct || 0) >= 5) active++;
    if ((g.temp_c || 0) >= 70) hotMin += dt / 60;
    peakT = Math.max(peakT, g.temp_c || 0);
  }
  if (!nW) { box.innerHTML = ""; return; }
  const duty = (active / nW) * 100, resPct = nOk ? (resident / nOk) * 100 : 0;
  const lastG = GPU && GPU.gpus && GPU.gpus[0];
  const freePct = lastG && lastG.mem_total_mb ? 100 - (lastG.mem_used_mb / lastG.mem_total_mb) * 100 : null;
  const up = HIST.uptime_pct ?? 100, p95 = HIST.latency_ms && HIST.latency_ms.p95;
  const f = {
    availability: clamp(((up - 95) / 5), 0, 1) * 30,
    latency: p95 == null ? 12 : p95 <= 25 ? 20 : p95 <= 100 ? 12 : 4,
    headroom: freePct == null ? 10 : freePct >= 15 ? 20 : freePct >= 5 ? 10 : 0,
    thermals: peakT < 75 ? 15 : peakT < 85 ? 8 : 0,
    residency: resPct >= 90 ? 15 : resPct >= 50 ? 8 : 0,
  };
  const score = Math.round(Object.values(f).reduce((a, b) => a + b, 0));
  const lvl = score >= 85 ? "ok" : score >= 65 ? "warn" : "crit";
  box.innerHTML = [
    statCard("Health score", `${score}<small> / 100</small>`, lvl === "ok" ? "all factors healthy" : "see the breakdown below", lvl),
    statCard("Energy · 24h", `${kwh.toFixed(2)} kWh`, `\u2248 $${(kwh * KWH_PRICE).toFixed(2)} at $${KWH_PRICE.toFixed(2)}/kWh (estimate)`),
    statCard("Power", `${(sumW / nW).toFixed(0)} W avg`, `peak ${peakW.toFixed(0)} W \u00b7 idle floor ${minW.toFixed(0)} W${lastG && lastG.power_limit_w ? ` \u00b7 limit ${lastG.power_limit_w} W` : ""}`),
    statCard("Duty cycle", `${duty.toFixed(1)}%`, `time the GPU was working (\u2265 5% util) \u00b7 ${duty < 5 ? "mostly idle: a warm model costs little" : "busy"}`),
    statCard("Thermals", `${peakT.toFixed(0)} \u00b0C peak`, hotMin ? `${hotMin.toFixed(0)} min at \u2265 70 \u00b0C` : "never above 70 \u00b0C", heat(peakT, 78, 88)),
    statCard("Model residency", `${resPct.toFixed(0)}%`, resPct >= 90 ? "a model was loaded almost all day (no cold starts)" : "gaps mean cold starts on the next request", resPct >= 90 ? "ok" : "warn"),
  ].join("");
  const n = $("health-note");
  if (n) n.textContent = `Score = availability ${f.availability.toFixed(0)}/30 \u00b7 latency p95 ${f.latency}/20 \u00b7 VRAM headroom ${f.headroom}/20 \u00b7 thermals ${f.thermals}/15 \u00b7 residency ${f.residency}/15.`;
  refreshEffects();
}

/* ---------------- 3D (lazy): 24h skyline + live VRAM vault ---------------- */
async function update3D() { try { await update3DInner(); } catch { /* decoration only */ } }
$("gpu-3d-reset")?.addEventListener("click", () => { O3D?.resetView?.(); const label = $("gpu-3d-sample-time"); if (label) label.textContent = `view reset · received ${new Date(GPUReceivedAt || Date.now()).toLocaleTimeString()}`; });
async function update3DInner() {
  const sec = $("sec-gpu3d");
  if (!sec || O3D === null) return;
  if (O3D === undefined) {
    O3D = null;
    const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let gl = null;
    try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
    if (!gl || reduced || document.documentElement.dataset.saver === "1") { sec.hidden = true; return; }
    await whenNear(sec);
    try { O3D = (await import("./ollama3d.js")).initOllama3D(); } catch { O3D = null; }
    if (!O3D) { sec.hidden = true; return; }
  }
  if (HIST) O3D.updateSkyline(HIST);
  if (GPU && SNAP) O3D.updateVault(SNAP, GPU);
}

/* ---------------- upstream error log (ROADMAP-ollama #10) ---------------- */
async function loadErrlog() {
  const el = $("errlog");
  if (!el) return;
  try {
    const r = await tracedFetch("api/ollama/errors", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    el.innerHTML = (d.errors || []).length
      ? d.errors.map((e) => `<div class="silent-err"><strong>${esc(e.kind)}</strong> at ${esc(e.ts)} &mdash; <code>${esc(e.detail)}</code></div>`).join("")
      : `<p class="mini-note">No upstream errors recorded.</p>`;
  } catch { /* transient */ }
}

async function loadGpu() {
  try {
    const r = await tracedFetch("api/ollama/gpu", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    GPU = await r.json();
    GPUReceivedAt = Date.now();
    renderGpu(GPU);
    update3D();
  } catch {
    const box = $("gpu-wrap");
    if (box) box.innerHTML = '<div class="gpu-empty gpu-err">gpu feed unreachable</div>';
  }
}

document.getElementById("board").hidden = false;
await Promise.all([loadSnap(), loadHist(), loadGpu()]);
loadPreset();
loadErrlog();
setInterval(loadSnap, POLL_SNAP_MS);
setInterval(loadHist, POLL_HIST_MS);
setInterval(loadGpu, 15000);
setInterval(loadErrlog, 30000);

/* Live push (fleet SSE pattern): snapshot deltas arrive the moment they
   change; the 10s poll above stays as the fallback (no EventSource / proxy
   that won't stream). A stream that errors 3x closes for good. */
if (typeof EventSource !== "undefined") {
  let sseFailures = 0;
  const es = new EventSource("api/ollama/snapshot/stream");
  es.onmessage = (e) => {
    sseFailures = 0;
    try {
      SNAP = JSON.parse(e.data);
      $("srv-url").textContent = SNAP.url || "192.168.1.197:11434";
      renderVitals();
      renderModels();
      if (HIST) renderLanes();
      setFresh(SNAP.reachable ? "live" : "stale",
        SNAP.reachable ? `live · v${SNAP.version} · ${SNAP.latency_ms} ms` : "server unreachable");
    } catch { /* malformed push -- next poll corrects */ }
  };
  es.onerror = () => { if (++sseFailures >= 3) es.close(); };
}
