/* GALE — agent drill-down: click a member card or timeline tag to open a
   side panel with 24h stats, a 14-day sparkline, and recent runs.
   Data: /api/fleet/metrics (per_agent_24h) + /api/fleet/observability (runs). */
import { boot, esc, refreshEffects, trapFocus } from "./shared.js";

boot();

const METRICS = "api/fleet/metrics";
const OBS = "api/fleet/observability";
const RECENT_RUNS = 5;

const state = { metrics: null, obs: null, cacheT: 0 };
const TTL_MS = 30000;

const backdrop = document.createElement("div");
backdrop.className = "dd-backdrop";
const panel = document.createElement("div");
panel.className = "dd-panel";
panel.setAttribute("role", "dialog");
panel.setAttribute("aria-modal", "true");
panel.setAttribute("aria-label", "Agent details");
document.body.append(backdrop, panel);
trapFocus(panel);

function fresh(envelope) {
  return state.cacheT > Date.now() - TTL_MS && envelope;
}

async function getData() {
  const needM = !fresh(state.metrics);
  const needO = !fresh(state.obs);
  if (needM || needO) {
    const jobs = [];
    if (needM) jobs.push(fetch(METRICS).then((r) => r.ok ? r.json() : null).then((d) => (state.metrics = d)).catch(() => {}));
    if (needO) jobs.push(fetch(OBS).then((r) => r.ok ? r.json() : null).then((d) => (state.obs = d)).catch(() => {}));
    await Promise.all(jobs);
    state.cacheT = Date.now();
  }
  return { m: state.metrics, o: state.obs };
}

function findAgent(name) {
  const m = state.metrics;
  const key = (name || "").toLowerCase();
  if (!m || !Array.isArray(m.per_agent_24h)) return null;
  return m.per_agent_24h.find((a) => (a.agent || "").toLowerCase() === key) || null;
}

function agentColor(name) {
  const els = document.querySelectorAll(".mc-name");
  for (const el of els) {
    if ((el.textContent || "").trim().toLowerCase() === (name || "").toLowerCase()) {
      const st = getComputedStyle(el.closest(".member-card")).getPropertyValue("--mc").trim();
      if (st) return st;
    }
  }
  return "var(--text-dim)";
}

function agentHost(name) {
  const els = document.querySelectorAll(".mc-name");
  for (const nm of els) {
    if ((nm.textContent || "").trim().toLowerCase() !== (name || "").toLowerCase()) continue;
    const h = nm.closest(".member-group")?.querySelector(".member-group-h");
    if (h && h.textContent) return h.textContent.split("·")[0].replace("host", "").trim();
    const card = nm.closest(".member-card");
    const code = card && card.querySelector(".mc-meta code");
    if (code) return code.textContent.trim();
  }
  const runs = (state.obs && Array.isArray(state.obs.runs)) ? state.obs.runs : [];
  const r = runs.find((x) => (x.agent || "").toLowerCase() === (name || "").toLowerCase());
  return r && r.host ? r.host : null;
}

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const clock = `${p(d.getHours())}:${p(d.getMinutes())}`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return clock;
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${clock}`;
}

function sparkline(vals, colorName) {
  vals = (vals || []).map((v) => (Number.isFinite(v) ? v : 0));
  const w = 400, h = 64, pad = 4;
  const max = Math.max(...vals, 1);
  const n = vals.length;
  const pts = vals.map((v, i) => {
    const x = n === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (n - 1);
    const y = h - pad - (v / max) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(" ");
  const area = `M${pad},${h - pad} L${line.replace(/ /g, " L")} L${w - pad},${h - pad} Z`;
  const varColor = `var(${colorName})`;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${area}" fill="${varColor}" opacity="0.12"/>
    <polyline points="${line}" fill="none" stroke="${varColor}" stroke-width="2"/>
  </svg>`;
}

export function render(agent) {
  const runs = (state.obs && Array.isArray(state.obs.runs))
    ? state.obs.runs.filter((r) => (r.agent || "").toLowerCase() === (agent.agent || "").toLowerCase())
    : [];
  runs.sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  const recent = runs.slice(0, RECENT_RUNS);
  const cost = `$${Number(agent.cost_24h || 0).toFixed(2)}`;
  const w14 = agent.total_wakings_14d || 0;
  const c14 = (agent.daily_cost_14d || []).reduce((s, v) => s + (Number(v) || 0), 0);
  const host = agentHost(agent.agent) || (runs[0] && runs[0].host) || "";
  const color = agentColor(agent.agent);

  const stats = `
    <div class="dd-stats">
      <div class="dd-stat"><b>${agent.runs_24h ?? 0}</b><span>runs · 24h</span></div>
      <div class="dd-stat"><b>${cost}</b><span>cost · 24h</span></div>
      <div class="dd-stat${agent.error_runs_24h ? " err" : ""}"><b>${agent.error_runs_24h ?? 0}</b><span>errors · 24h</span></div>
      <div class="dd-stat"><b>${fmtTime(agent.last_wake)}</b><span>last wake</span></div>
    </div>`;

  const hasW = Array.isArray(agent.daily_wakings_14d) && agent.daily_wakings_14d.some((v) => v > 0);
  const hasC = Array.isArray(agent.daily_cost_14d) && agent.daily_cost_14d.some((v) => v > 0);
  let spark = `<div class="dd-sec"><h4>14-day trend</h4>`;
  if (hasW || hasC) {
    const wk = hasW ? agent.daily_wakings_14d : arrayZeros(14);
    const ck = hasC ? agent.daily_cost_14d : arrayZeros(14);
    spark += `<div class="dd-spark">${sparkline(wk, "tide")}
      <div class="spark-cap"><span>${w14} wakings</span><span>$${c14.toFixed(2)} spent</span></div></div>`;
    const best = Math.max(...agent.daily_wakings_14d);
    const bestIdx = agent.daily_wakings_14d.indexOf(best);
    const m = Math.round(14 - bestIdx);
    spark += `<div class="dd-spark">${sparkline(ck, "bolt")}
      <div class="spark-cap"><span>peak ${best} wakes</span><span>~${m}d ago</span></div></div>`;
  } else {
    spark += `<p class="dd-empty">No 14-day data for this agent yet.</p>`;
  }
  spark += `</div>`;

  let runsHtml = `<div class="dd-sec"><h4>Recent runs</h4>`;
  if (recent.length) {
    runsHtml += `<ul class="dd-runs">` + recent.map((r) => `
      <li class="dd-run">
        <span class="rr-time">${fmtTime(r.ts)}</span>
        <span class="rr-model">${esc(r.model_family || r.model || "?")}</span>
        <span class="rr-cost">$${(Number(r.cost_usd) || 0).toFixed(2)}</span>
        ${r.is_error ? '<span class="rr-err">err</span>' : ""}
      </li>`).join("") + `</ul>`;
  } else {
    runsHtml += `<p class="dd-empty">No instrumented runs recorded for this agent.</p>`;
  }
  runsHtml += `</div>`;

  panel.innerHTML = `
    <div class="dd-head">
      <span class="dd-dot" style="background:${color}"></span>
      <div><span class="dd-name">${esc(agent.agent || "?")}</span>${host ? `<span class="dd-sub">${esc(host)}</span>` : ""}</div>
      <button type="button" class="dd-share" data-share="${esc(agent.agent || "")}" aria-label="Copy link to this agent">⧉</button>
      <button type="button" class="dd-close" aria-label="Close">✕</button>
    </div>
    <div class="dd-body">${stats}${spark}${runsHtml}</div>`;
}

function arrayZeros(n) { return new Array(n).fill(0); }

function openDrilldown(name) {
  if (!name) return;
  const agent = findAgent(name);
  if (!agent) return;
  render(agent);
  refreshEffects();
  backdrop.classList.add("open");
  panel.classList.add("open");
  panel.querySelector(".dd-close").focus();
  document.body.style.overflow = "hidden";
}
window.openDrilldown = openDrilldown;

function closeDrilldown() {
  backdrop.classList.remove("open");
  panel.classList.remove("open");
  document.body.style.overflow = "";
  if (lastTrigger && lastTrigger.isConnected) { lastTrigger.focus(); lastTrigger = null; }
}

let lastTrigger = null;

panel.addEventListener("click", (e) => {
  if (e.target.closest(".dd-close")) closeDrilldown();
  const share = e.target.closest(".dd-share");
  if (share) {
    const url = `${location.origin}${location.pathname}#agent-${encodeURIComponent(share.dataset.share || "")}`;
    const done = () => {
      const old = share.textContent;
      share.textContent = "✓";
      setTimeout(() => { share.textContent = old; }, 1200);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, () => fallbackCopy(url, done));
    else fallbackCopy(url, done);
  }
});
function fallbackCopy(text, done) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    done();
  } catch { /* clipboard unavailable */ }
}
backdrop.addEventListener("click", closeDrilldown);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open")) closeDrilldown(); });

/* deep link: fleet.html#agent-<name> opens that agent's panel on load. */
async function openFromHash() {
  const m = (location.hash || "").match(/^#agent-(.+)$/i);
  if (!m) return;
  await getData();
  const name = decodeURIComponent(m[1]);
  if (findAgent(name)) openDrilldown(name);
}
openFromHash();
window.addEventListener("hashchange", openFromHash);

async function tryOpen(name) {
  openDrilldown(name);
}

document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target instanceof Element &&
      e.target.matches(".mc-name, .fleet-term-tag[data-agent]")) {
    e.preventDefault();
    e.target.click();
  }
});
document.addEventListener("click", async (e) => {
  const tagEl = e.target.closest(".mc-name, .fleet-term-tag[data-agent]");
  if (!tagEl) return;
  let name;
  if (tagEl.classList.contains("fleet-term-tag")) name = tagEl.dataset.agent;
  else {
    const card = tagEl.closest(".member-card");
    if (!card) return;
    name = (tagEl.textContent || "").trim();
  }
  if (!name) return;
  tagEl.style.cursor = "pointer";
  lastTrigger = tagEl;
  await getData();
  if (!findAgent(name)) {
    const tmp = document.createElement("div");
    tmp.className = "dd-empty";
    tmp.textContent = `No metrics yet for "${name}".`;
    panel.innerHTML = `<div class="dd-head"><span class="dd-dot"></span><span class="dd-name">${esc(name)}</span><button type="button" class="dd-close" aria-label="Close">✕</button></div><div class="dd-body"><p class="dd-empty">No metrics yet for this agent.</p></div>`;
    backdrop.classList.add("open");
    panel.classList.add("open");
    document.body.style.overflow = "hidden";
    return;
  }
  openDrilldown(name);
});

document.addEventListener("click", (e) => {
  const tag = e.target.closest(".mc-name");
  if (tag) tag.style.cursor = "pointer";
});
