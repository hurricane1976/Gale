/* GALE — agentic observability: polls /api/fleet/observability and renders
   cost/tokens/wall-clock counters as inline SVG + tables. No chart library,
   house tokens only. Counters only — the feed carries no message content. */
import { boot, esc, clamp, refreshEffects, setHTML, setText, patchList, tracedFetch } from "./shared.js";
import { observabilityPayload, validate } from "./payloads.js";

boot();

const FEED = "api/fleet/observability";
const POLL_MS = 30000;
const FAM_COLOR = { claude: "var(--m-claude)", glm: "var(--m-glm)", gpt: "var(--m-gpt)", muse: "var(--m-muse)", gemini: "light-dark(#0a6288, #3fc7ff)", deepseek: "light-dark(#3846a6, #8593f0)" };
const AGENT_COLOR = { gale: "var(--m-glm)", zephyr: "var(--gust)", squall: "var(--warn)", tempest: "var(--ok)", vortex: "var(--flag)", chinook: "var(--bolt)", cyclone: "var(--m-gpt)", maistral: "var(--m-claude)", sirocco: "var(--m-muse)", bora: "var(--storm-purple)", tramontane: "var(--m-qwen)", ostro: "var(--m-qwen)", poniente: "var(--m-qwen)", levante: "var(--m-qwen)", tidal: "light-dark(#0a6288, #3fc7ff)", mountain: "light-dark(#3846a6, #8593f0)", beacon: "var(--m-claude)", river: "light-dark(#0f6a50, #4fd1a5)", creek: "light-dark(#76560c, #e0b45c)", stream: "light-dark(#8a2b80, #d98fd1)", meadow: "var(--m-glm)", brook: "var(--m-gpt)", mist: "var(--m-gpt)", highbeam: "var(--m-glm)", lantern: "var(--m-glm)", lightning: "var(--m-glm)", radar: "var(--m-glm)", prism: "var(--m-gpt)", pulsar: "var(--m-claude)", canyon: "var(--m-glm)", ridge: "var(--m-glm)", harbor: "var(--m-glm)", delta: "var(--m-glm)", mesa: "var(--m-gpt)", vista: "var(--m-gpt)" };
let DATA = null;
let filter = "";
let hostFilter = "";

const fmtCost = (c) => (c == null ? "&ndash;" : `$${c.toFixed(4)}`);
const fmtWake = (w) => (w == null ? "&ndash;" : `w${w}`);

const $ = (id) => document.getElementById(id);

function setFresh(state, text) {
  const el = $("freshness");
  if (!el) return;
  el.dataset.state = state;
  const t = $("freshness-text");
  if (t) t.textContent = text;
}

const famColor = (f) => FAM_COLOR[(f || "").toLowerCase()] || "var(--text-faint)";

function fmtDur(ms) {
  if (ms == null) return "&ndash;";
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s}s`;
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;
}

function fmtTok(n) {
  if (n == null) return "&ndash;";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

function statCard(label, value, sub, lvl = "ok") {
  return `<div class="vital" data-level="${lvl}">
    <span class="vital-label">${esc(label)}</span>
    <span class="vital-value">${value}</span>
    <span class="vital-sub">${sub || ""}</span>
  </div>`;
}

function agentNames(t) {
  return (t.agents || []).map((a) => (typeof a === "string" ? a : a && a.agent) || "?");
}

function hostNames(d) {
  if (d.hosts) return Object.keys(d.hosts).sort();
  return [...new Set((d.runs || []).map((r) => r.host).filter(Boolean))].sort();
}

function renderStats(d) {
  const t = d.totals;
  const errs = d.runs.filter((r) => r.is_error).length;
  const hosts = hostNames(d);
  const remote = d.remote_status === "unreachable" ? " · remote unreachable, local-only" : "";
  patchList($("stats-grid"), [
    { key: "runs", html: `<gale-stat label="Runs" value="${esc(String(d.count))}" sub="since ${esc(d.instrumented_since || "–")}"></gale-stat>` },
    { key: "cost", html: `<gale-stat label="Total cost" value="$${t.cost_usd.toFixed(4)}" sub="fleet-wide known costs${remote}"></gale-stat>` },
    { key: "mean", html: `<gale-stat label="Mean cost / run" value="$${t.mean_cost_usd.toFixed(4)}" sub="${esc(d.count ? `across ${d.count} runs` : "")}"></gale-stat>` },
    { key: "tokens", html: `<gale-stat label="Total tokens" value="${fmtTok(t.total_tokens)}" sub="in + out + cache-read"></gale-stat>` },
    { key: "errors", html: `<gale-stat label="Error runs" value="${esc(String(errs))}" level="${errs ? "warn" : "ok"}" sub="${errs ? "see silent-failure watch" : "none so far"}"></gale-stat>` },
    { key: "agents", html: `<gale-stat label="Agents" value="${esc(String(agentNames(t).length))}" sub="${esc(hosts.join(" · "))}"></gale-stat>` },
  ]);
}

function renderCostChart(d) {
  // Fleet scale (~2k runs) is unreadable as one bar per run, so the chart
  // shows the last 400 runs; the explorer table carries the full history
  // (capped at 300 displayed rows) and the lanes carry every agent.
  const runs = d.runs.slice(-400);
  const wrap = $("cost-chart");
  if (!runs.length) { setHTML(wrap, `<p class="mini-note">No runs yet.</p>`); return; }
  const W = Math.max(320, Math.min(runs.length * 34, 1600));
  const H = 180;
  const pad = { t: 16, r: 12, b: 34, l: 44 };
  const maxCost = Math.max(...runs.map((r) => r.cost_usd || 0), 0.0001);
  const bw = Math.max(6, Math.floor((W - pad.l - pad.r) / runs.length) - 6);
  let bars = "";
  runs.forEach((r, i) => {
    const x = pad.l + i * ((W - pad.l - pad.r) / runs.length) + 3;
    const h = Math.max(2, ((r.cost_usd || 0) / maxCost) * (H - pad.t - pad.b));
    const y = H - pad.b - h;
    const costLbl = r.cost_usd == null ? "cost unknown" : `$${r.cost_usd.toFixed(4)}`;
    const label = `${r.host || "?"} ${r.agent} ${fmtWake(r.waking_count)} — ${costLbl} — ${r.model || "?"}`;
    bars += `<rect class="bar-rise" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}"
      fill="${famColor(r.model_family)}" opacity="0.85" rx="2" style="--i:${i}">
      <title>${esc(label)}</title></rect>`;
  });
  const sparkPts = runs.map((r, i) => {
    const cx = (pad.l + i * ((W - pad.l - pad.r) / runs.length) + 3 + bw / 2).toFixed(1);
    const cy = (H - pad.b - ((r.cost_usd || 0) / maxCost) * (H - pad.t - pad.b)).toFixed(1);
    return `${cx},${cy}`;
  }).join(" ");
  const spark = `<polyline class="bar-spark" points="${sparkPts}"/>`;
  const ticks = [0, 0.5, 1].map((f) => {
    const y = (H - pad.b - f * (H - pad.t - pad.b)).toFixed(1);
    return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--line)"/>
      <text x="${pad.l - 6}" y="${+y + 4}" text-anchor="end" class="obs-tick">$${(maxCost * f).toFixed(3)}</text>`;
  }).join("");
  const first = esc(runs[0].ts.slice(5, 16).replace("T", " "));
  const last = esc(runs[runs.length - 1].ts.slice(5, 16).replace("T", " "));
  setHTML(wrap, `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cost per run">
    ${ticks}${bars}${spark}
    <text x="${pad.l}" y="${H - 6}" class="obs-tick">${first}</text>
    <text x="${W - pad.r}" y="${H - 6}" text-anchor="end" class="obs-tick">${last}</text>
  </svg></div>`);
}

function renderLanes(d) {
  const runs = d.runs.filter((r) => !hostFilter || (r.host || "") === hostFilter);
  const el = $("lanes");
  if (!runs.length) { setHTML(el, `<p class="mini-note">No runs match the host filter.</p>`); return; }
  const t0 = new Date(d.runs[0].ts).getTime();
  const t1 = Math.max(...d.runs.map((r) => new Date(r.ts).getTime()));
  const span = Math.max(t1 - t0, 1);
  const stats = new Map((d.totals.agents || []).map((s) => [s.agent, s]));
  const agents = agentNames(d.totals).filter((a) => {
    const st = stats.get(a) || {};
    const hosts = st.hosts || (st.host ? [st.host] : []);
    return !hostFilter || hosts.includes(hostFilter) || (!hosts.length && hostFilter === "gale");
  });
  patchList(el, agents.map((a) => {
    const ar = runs.filter((r) => r.agent === a);
    const st = stats.get(a) || {};
    const maxCost = Math.max(...d.runs.map((r) => r.cost_usd || 0), 0.0001);
    const dots = ar.map((r) => {
      const x = clamp((new Date(r.ts).getTime() - t0) / span, 0, 1) * 100;
      const size = 5 + 9 * Math.sqrt((r.cost_usd || 0) / maxCost);
      const costLbl = r.cost_usd == null ? "cost unknown" : `$${r.cost_usd.toFixed(4)}`;
      return `<span class="lane-dot" style="left:${x.toFixed(2)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;
        background:${famColor(r.model_family)}" title="${esc(`${r.host || "?"} ${a} ${fmtWake(r.waking_count)} — ${costLbl}`)}"></span>`;
    }).join("");
    // latency attribution (#18): wall-clock p50/p95 + error count per lane
    const lat = st.p50_ms != null
      ? ` · p50 ${fmtDur(st.p50_ms)}${st.p95_ms != null ? ` / p95 ${fmtDur(st.p95_ms)}` : ""}` : "";
    const err = st.errors ? ` · <span class="tag-err">${st.errors} err</span>` : "";
    const burn = st.burn_tok_per_h ? ` · ${fmtTok(st.burn_tok_per_h * 24)}/d` : "";
    const hostLbl = (st.hosts && st.hosts.length ? st.hosts.join(",") : st.host || "");
    return {
      key: `lane-${a || "?"}`,
      html: `<div class="obs-lane">
        <span class="obs-lane-name" style="color:${AGENT_COLOR[a] || "var(--text-dim)"}"><a href="fleet.html#agent-${encodeURIComponent(a || "")}">${esc(a || "?")}</a><span class="mini-note"> ${esc(hostLbl)}</span></span>
        <span class="obs-lane-track">${dots}</span>
        <span class="obs-lane-count">${ar.length} runs${lat}${err}${burn}</span>
      </div>`,
    };
  }));
}

function renderExplorer(d) {
  const sel = $("agent-filter");
  const hsel = $("host-filter");
  const agents = agentNames(d.totals);
  const hosts = hostNames(d);
  const cur = sel.value;
  const hcur = hsel ? hsel.value : "";
  setHTML(sel, `<option value="">all agents</option>` + agents.map((a) => `<option${a === cur ? " selected" : ""}>${esc(a || "?")}</option>`).join(""));
  if (hsel) setHTML(hsel, `<option value="">all hosts</option>` + hosts.map((h) => `<option${h === hcur ? " selected" : ""}>${esc(h || "?")}</option>`).join(""));
  const rows = d.runs.filter((r) => (!filter || r.agent === filter) && (!hostFilter || (r.host || "") === hostFilter)).slice().reverse().slice(0, 300);
  setText($("run-count"), rows.length < d.count ? `${d.count} (showing ${rows.length})` : String(d.count));
  patchList($("runs-table").querySelector("tbody"), rows.length ? rows.map((r) => {
    const dur = r.duration_ms == null ? "&ndash;" : `${fmtDur(r.duration_ms)}${r.measured ? "*" : ""}`;
    return {
      key: `run-${r.ts}-${r.agent}-${r.host || "?"}`,
      html: `<tr${r.is_error ? ' class="err-row"' : ""}>
      <td>${esc((r.ts || "").slice(5, 16).replace("T", " "))}</td>
      <td>${esc(r.host || "?")}</td>
      <td><span class="obs-lane-name" style="color:${AGENT_COLOR[r.agent] || "var(--text-dim)"}"><a href="fleet.html#agent-${encodeURIComponent(r.agent || "")}">${esc(r.agent || "?")}</a></span></td>
      <td>${fmtWake(r.waking_count)}</td>
      <td>${esc(r.model || "?")}<span class="obs-fam" style="background:${famColor(r.model_family)}"></span></td>
      <td>${dur}</td>
      <td>${fmtTok(r.input_tokens)} / ${fmtTok(r.output_tokens)}</td>
      <td>${fmtCost(r.cost_usd)}</td>
      <td>${r.turns ?? "&ndash;"}</td>
      <td>${r.is_error ? '<span class="tag-err">error</span>' : "ok"}</td>
    </tr>`,
    };
  }) : [{ key: "empty", html: `<tr><td colspan="10" class="mini-note">No runs match.</td></tr>` }]);
}

function renderSilent(d) {
  const errs = d.runs.filter((r) => r.is_error);
  const zeroTok = d.runs.filter((r) => !r.is_error && !r.output_tokens);
  const items = [];
  if (!errs.length) items.push(`<div class="silent-ok">No error runs in the fleet envelope. Shell-side guards also cover exit-0 sessions that never reported &mdash; those fire before this feed would see them.</div>`);
  errs.slice(-20).reverse().forEach((r) => items.push(`<div class="silent-err"><strong>${esc(r.host || "?")} ${esc(r.agent || "?")} ${fmtWake(r.waking_count)}</strong> at ${esc(r.ts || "?")} &mdash; terminal reason: <code>${esc(r.terminal_reason || "?")}</code></div>`));
  if (errs.length > 20) items.push(`<div class="mini-note">Showing latest 20 of ${errs.length} error runs &mdash; filter in the explorer.</div>`);
  if (zeroTok.length) items.push(`<div class="silent-warn">${zeroTok.length} run(s) finished without any output tokens &mdash; worth a look.</div>`);
  items.push(`<div class="mini-note">Checked against ${d.count} fleet runs &middot; live &middot; errors here are terminal states visible in the artifacts; crashes that produced no artifact page as shell alerts instead.</div>`);
  setHTML($("silent"), items.join(""));
}

/* lazy 3D spend city (hidden where WebGL / motion isn't available; never breaks the page) */
let CITY;   // undefined = not tried, null = unavailable, else module
async function updateCity() {
  try {
    const sec = document.getElementById("sec-runs3d");
    if (!sec || CITY === null || !DATA) return;
    if (CITY === undefined) {
      CITY = null;
      let gl = null;
      try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
      const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (!gl || reduced || (document.documentElement.dataset && document.documentElement.dataset.saver === "1")) { sec.hidden = true; return; }
      CITY = await import("./runs3d.js");
    }
    if (!CITY.updateRuns3D(DATA.runs || [])) sec.hidden = true;
  } catch { /* decoration only */ }
}

function renderAll() {
  if (!DATA) return;
  renderStats(DATA);
  renderCostChart(DATA);
  renderLanes(DATA);
  renderExplorer(DATA);
  renderSilent(DATA);
  updateCity();
  refreshEffects();
  setFresh("live", `live · ${new Date(DATA.generated_at).toLocaleTimeString()}`);
}

let fullTimer = 0;
async function load(first = false) {
  try {
    // first paint: the newest 400 runs only (the full history is ~1.6 MB); the rest follows right after.
    // Older backends ignore ?runs= and simply return everything.
    const r = await tracedFetch(first && !DATA ? FEED + "?runs=400" : FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    DATA = validate(await r.json(), observabilityPayload);
    const note = document.getElementById("partial-note");
    if (note) {
      note.hidden = !DATA.runs_truncated;
      if (DATA.runs_truncated) note.textContent = `Showing the newest ${DATA.runs.length} of ${DATA.runs_total} runs while the full history loads; per-agent counts and totals below complete in a moment.`;
    }
    if (DATA.runs_truncated && !fullTimer) fullTimer = setTimeout(() => { fullTimer = 0; load(); }, 1200);
    renderAll();
  } catch (e) {
    setFresh("error", `feed error: ${esc(String(e.message || e))}`);
  }
}

$("agent-filter").addEventListener("change", (e) => {
  filter = e.target.value;
  if (DATA) { renderExplorer(DATA); renderLanes(DATA); }
});

$("host-filter").addEventListener("change", (e) => {
  hostFilter = e.target.value;
  if (DATA) { renderExplorer(DATA); renderLanes(DATA); }
});

document.getElementById("board").hidden = false;

// Prefer a live push (SSE) over polling; fall back to the old setInterval
// loop if EventSource doesn't exist (old browsers) or keeps failing (a
// proxy that won't stream). The render-test harness has no EventSource
// global, so it naturally exercises the polling path.
function startPolling() {
  load(true);
  setInterval(load, POLL_MS);
}

/* The payload is the full run history (~1.6 MB JSON): fetching + rendering it competes with first
   paint, which cost ~4 Lighthouse points and a 10s simulated LCP. In a real browser, let the page
   paint and go idle first, then start the feed. Node render-tests (no EventSource) start immediately. */
async function startFeed() {
  if (typeof EventSource !== "undefined") {
    let failures = 0;
    let es = new EventSource(FEED + "/stream");
    es.onmessage = (e) => {
      failures = 0;
      try {
        DATA = validate(JSON.parse(e.data), observabilityPayload);
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
    await load(true); // paint immediately (newest runs first, full history right after) instead of waiting for the first push
  } else {
    await startPolling();
  }
}
if (typeof EventSource !== "undefined" && typeof requestIdleCallback === "function") {
  const go = () => setTimeout(startFeed, 800);
  if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
} else {
  await startFeed();
}
