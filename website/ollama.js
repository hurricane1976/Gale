/* GALE — Ollama admin panel: polls /api/ollama/{snapshot,history} and renders
   live status, VRAM/residency charts, model management and a playground.
   No chart library, house tokens only. Actions go through /api/ollama/action
   (allowlisted, rate-limited server-side); delete always asks for a typed
   model name, unload always asks once — shared infrastructure, not toys. */
import { boot, esc, clamp } from "./shared.js";

boot();

const SNAP_URL = "api/ollama/snapshot";
const HIST_URL = "api/ollama/history?hours=24";
const POLL_SNAP_MS = 10000;
const POLL_HIST_MS = 60000;
const PALETTE = ["var(--m-qwen)", "var(--gust)", "var(--m-gpt)", "var(--bolt)", "var(--m-muse)", "var(--m-claude)", "var(--storm-purple)"];

let SNAP = null;
let HIST = null;
let PULLING = false;
let THREAD = [];
let BUSY = false;
let pending = null;          // {action, model, typed}
let showOpenFor = null;

const $ = (id) => document.getElementById(id);

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
    const r = await fetch("api/ollama/action", {
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
  return `<div class="vital" data-level="${lvl}">
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
  $("vitals-grid").innerHTML = [
    statCard("Server", up ? "up" : "down", s && up ? `v${esc(s.version)} · ${esc(s.url)}` : esc((s && s.error) || "unreachable"), up ? "ok" : "crit"),
    statCard("VRAM in use", fmtGB(s && s.vram_bytes), `${resident.length} model${resident.length === 1 ? "" : "s"} resident`),
    statCard("Resident", resident.length, resident.map(esc).join(" · ") || "nothing loaded"),
    statCard("Installed", models.length, models.length ? `${fmtGB(s.disk_bytes)} on disk` : "none"),
    statCard("API latency", s && s.latency_ms != null ? `${s.latency_ms} ms` : "–", h ? `p50 ${h.latency_ms.p50 ?? "–"} · p95 ${h.latency_ms.p95 ?? "–"} ms (24h)` : ""),
    statCard("Uptime", h && h.uptime_pct != null ? `${h.uptime_pct}%` : "–", h ? `${h.count} samples · ${h.hours}h window` : ""),
  ].join("");
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
  const series = (HIST.series || []).filter((s) => s.reachable);
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
      m.resident ? `<button class="btn ol-btn ol-btn-xs" data-act="unload" data-model="${esc(m.name)}">Unload</button>` : "",
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
  refreshChatModelSelect();
}

$("models-table").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn || BUSY) return;
  const model = btn.dataset.model;
  const act = btn.dataset.act;
  if (act === "show") return openShow(model);
  if (act === "play") {
    const sel = $("chat-model");
    if ([...sel.options].some((o) => o.value === model)) sel.value = model;
    $("chat-input").focus();
    $("chat-thread").scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  askConfirm(act, model);
});

/* ---------------- show drawer ---------------- */
async function openShow(model) {
  showOpenFor = model;
  $("show-title").textContent = model;
  $("show-body").innerHTML = `<p class="mini-note">loading&hellip;</p>`;
  $("show-overlay").hidden = false;
  try {
    const r = await fetch(`api/ollama/show?model=${encodeURIComponent(model)}`, { cache: "no-store" });
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
      const r = await fetch("api/ollama/pull/status", { cache: "no-store" });
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
function refreshChatModelSelect() {
  const sel = $("chat-model");
  const cur = sel.value;
  const names = ((SNAP && SNAP.models) || []).map((m) => m.name);
  sel.innerHTML = names.map((n) => `<option${n === cur ? " selected" : ""}>${esc(n)}</option>`).join("");
}
function renderThread() {
  const el = $("chat-thread");
  if (!THREAD.length) { el.innerHTML = `<p class="mini-note">Send a message to start the thread.</p>`; return; }
  el.innerHTML = THREAD.map((m, i) => {
    if (m.role === "user") return `<div class="ol-bubble ol-bubble-user"><span class="ol-who">you</span>${esc(m.content)}</div>`;
    const st = m.stats ? `<span class="ol-stats">${esc(m.stats)}</span>` : "";
    return `<div class="ol-bubble ol-bubble-ai"><span class="ol-who">${esc(m.model || "assistant")}</span>${esc(m.content)}${st}</div>`;
  }).join("");
  el.scrollTop = el.scrollHeight;
}

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
  renderThread();
  const messages = [];
  const sys = $("chat-system").value.trim();
  if (sys) messages.push({ role: "system", content: sys });
  for (const m of THREAD) messages.push({ role: m.role, content: m.content });
  try {
    const r = await fetch("api/ollama/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, options: {
        temperature: parseFloat($("chat-temp").value) || 0.7,
        num_predict: parseInt($("chat-numpred").value, 10) || 512,
      } }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || `HTTP ${r.status}`);
    const st = d.stats || {};
    const outTok = st.eval_count, secs = (st.eval_duration_ns || 0) / 1e9;
    const tps = outTok && secs ? `${(outTok / secs).toFixed(1)} tok/s` : null;
    const bits = [
      d.done_reason && d.done_reason !== "stop" ? `stopped: ${d.done_reason}` : null,
      st.prompt_eval_count != null ? `${st.prompt_eval_count} in` : null,
      outTok != null ? `${outTok} out` : null,
      tps,
      st.total_duration_ns ? `${(st.total_duration_ns / 1e9).toFixed(1)}s` : null,
    ].filter(Boolean).join(" · ");
    THREAD.push({ role: "assistant", content: (d.message && d.message.content) || "", model, stats: bits || null });
  } catch (e) {
    THREAD.push({ role: "assistant", content: `⚠ ${String(e.message || e)}`, model, stats: "failed" });
  }
  BUSY = false;
  $("chat-send").disabled = false;
  renderThread();
}

$("chat-send").addEventListener("click", sendChat);
$("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
});
$("chat-clear").addEventListener("click", () => { THREAD = []; renderThread(); });

/* ---------------- confirm overlay wiring ---------------- */
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
    const r = await fetch(SNAP_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    SNAP = await r.json();
    $("srv-url").textContent = SNAP.url || "192.168.1.197:11434";
    renderVitals();
    renderModels();
    if (HIST) renderLanes();
    setFresh(SNAP.reachable ? "live" : "stale", SNAP.reachable ? `live · v${esc(SNAP.version)} · ${SNAP.latency_ms} ms` : "server unreachable");
  } catch (e) {
    setFresh("error", `feed error: ${esc(String(e.message || e))}`);
  }
}
async function loadHist() {
  try {
    const r = await fetch(HIST_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    HIST = await r.json();
    renderVitals();
    renderVramChart();
    renderLatencyChart();
    renderLanes();
    renderEvents();
  } catch { /* snapshot poll will surface feed errors */ }
}

document.getElementById("board").hidden = false;
await Promise.all([loadSnap(), loadHist()]);
setInterval(loadSnap, POLL_SNAP_MS);
setInterval(loadHist, POLL_HIST_MS);
