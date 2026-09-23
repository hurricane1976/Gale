/* GALE — agentic observability: polls /api/fleet/observability and renders
   cost/tokens/wall-clock counters as inline SVG + tables. No chart library,
   house tokens only. Counters only — the feed carries no message content. */
import { boot, esc, clamp } from "./shared.js";

boot();

const FEED = "api/fleet/observability";
const POLL_MS = 30000;
const FAM_COLOR = { claude: "var(--m-claude)", glm: "var(--m-glm)", gpt: "var(--m-gpt)", muse: "var(--m-muse)", gemini: "#3fc7ff", deepseek: "#8593f0" };
const AGENT_COLOR = { gale: "var(--m-glm)", zephyr: "var(--gust)", squall: "var(--warn)", tempest: "var(--ok)" };
let DATA = null;
let filter = "";

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

function renderStats(d) {
  const t = d.totals;
  const errs = d.runs.filter((r) => r.is_error).length;
  $("stats-grid").innerHTML = [
    statCard("Runs", d.count, `since ${esc(d.instrumented_since)}`),
    statCard("Total cost", `$${t.cost_usd.toFixed(4)}`, "all local runs"),
    statCard("Mean cost / run", `$${t.mean_cost_usd.toFixed(4)}`, d.count ? `across ${d.count} runs` : ""),
    statCard("Total tokens", fmtTok(t.total_tokens), "in + out + cache-read"),
    statCard("Error runs", errs, errs ? "see silent-failure watch" : "none so far", errs ? "warn" : "ok"),
    statCard("Agents", agentNames(t).length, agentNames(t).map(esc).join(" &middot; ")),
  ].join("");
}

function renderCostChart(d) {
  const runs = d.runs;
  const wrap = $("cost-chart");
  if (!runs.length) { wrap.innerHTML = `<p class="mini-note">No runs yet.</p>`; return; }
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
    const label = `${r.agent} w${r.waking_count} — $${(r.cost_usd || 0).toFixed(4)} — ${r.model}`;
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
  wrap.innerHTML = `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cost per run">
    ${ticks}${bars}${spark}
    <text x="${pad.l}" y="${H - 6}" class="obs-tick">${first}</text>
    <text x="${W - pad.r}" y="${H - 6}" text-anchor="end" class="obs-tick">${last}</text>
  </svg></div>`;
}

function renderLanes(d) {
  const runs = d.runs;
  const el = $("lanes");
  if (!runs.length) { el.innerHTML = `<p class="mini-note">No runs yet.</p>`; return; }
  const t0 = new Date(runs[0].ts).getTime();
  const t1 = Math.max(...runs.map((r) => new Date(r.ts).getTime()));
  const span = Math.max(t1 - t0, 1);
  const agents = agentNames(d.totals);
  el.innerHTML = agents.map((a) => {
    const ar = runs.filter((r) => r.agent === a);
    const maxCost = Math.max(...runs.map((r) => r.cost_usd || 0), 0.0001);
    const dots = ar.map((r) => {
      const x = clamp((new Date(r.ts).getTime() - t0) / span, 0, 1) * 100;
      const size = 5 + 9 * Math.sqrt((r.cost_usd || 0) / maxCost);
      return `<span class="lane-dot" style="left:${x.toFixed(2)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;
        background:${famColor(r.model_family)}" title="${esc(`${a} w${r.waking_count} — $${(r.cost_usd || 0).toFixed(4)}`)}"></span>`;
    }).join("");
    return `<div class="obs-lane">
      <span class="obs-lane-name" style="color:${AGENT_COLOR[a] || "var(--text-dim)"}">${esc(a)}</span>
      <span class="obs-lane-track">${dots}</span>
      <span class="obs-lane-count">${ar.length} runs</span>
    </div>`;
  }).join("");
}

function renderExplorer(d) {
  const sel = $("agent-filter");
  const agents = agentNames(d.totals);
  const cur = sel.value;
  sel.innerHTML = `<option value="">all agents</option>` + agents.map((a) => `<option${a === cur ? " selected" : ""}>${esc(a)}</option>`).join("");
  const rows = d.runs.filter((r) => !filter || r.agent === filter).slice().reverse();
  $("run-count").textContent = d.count;
  $("runs-table").querySelector("tbody").innerHTML = rows.map((r) => {
    const dur = r.duration_ms == null ? "&ndash;" : `${fmtDur(r.duration_ms)}${r.measured ? "*" : ""}`;
    return `<tr${r.is_error ? ' class="err-row"' : ""}>
      <td>${esc(r.ts.slice(5, 16).replace("T", " "))}</td>
      <td><span style="color:${AGENT_COLOR[r.agent] || "var(--text-dim)"}">${esc(r.agent)}</span></td>
      <td>w${r.waking_count}</td>
      <td>${esc(r.model)}<span class="obs-fam" style="background:${famColor(r.model_family)}"></span></td>
      <td>${dur}</td>
      <td>${fmtTok(r.input_tokens)} / ${fmtTok(r.output_tokens)}</td>
      <td>$${(r.cost_usd || 0).toFixed(4)}</td>
      <td>${r.turns ?? "&ndash;"}</td>
      <td>${r.is_error ? '<span class="tag-err">error</span>' : "ok"}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="9" class="mini-note">No runs match.</td></tr>`;
}

function renderSilent(d) {
  const errs = d.runs.filter((r) => r.is_error);
  const zeroTok = d.runs.filter((r) => !r.is_error && !r.output_tokens);
  const items = [];
  if (!errs.length) items.push(`<div class="silent-ok">No error runs in the local envelope. Shell-side guards also cover exit-0 sessions that never reported &mdash; those fire before this feed would see them.</div>`);
  errs.forEach((r) => items.push(`<div class="silent-err"><strong>${esc(r.agent)} w${r.waking_count}</strong> at ${esc(r.ts)} &mdash; terminal reason: <code>${esc(r.terminal_reason || "?")}</code></div>`));
  if (zeroTok.length) items.push(`<div class="silent-warn">${zeroTok.length} run(s) finished without any output tokens &mdash; worth a look.</div>`);
  items.push(`<div class="mini-note">Checked against ${d.count} local runs &middot; refreshes every 30s &middot; errors here are terminal states visible in the artifacts; crashes that produced no artifact page as shell alerts instead.</div>`);
  $("silent").innerHTML = items.join("");
}

function renderAll() {
  if (!DATA) return;
  renderStats(DATA);
  renderCostChart(DATA);
  renderLanes(DATA);
  renderExplorer(DATA);
  renderSilent(DATA);
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

$("agent-filter").addEventListener("change", (e) => {
  filter = e.target.value;
  if (DATA) renderExplorer(DATA);
});

document.getElementById("board").hidden = false;
await load();
setInterval(load, POLL_MS);
