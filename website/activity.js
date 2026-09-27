/* GALE — fleet activity stream: polls /api/fleet/activity, renders the last
   N real events oldest-first in a terminal-style panel (Beacon's pattern).
   Pause toggle stops re-rendering but never stops fetching. */
import { boot, esc, refreshEffects } from "./shared.js";

boot();

const FEED = "api/fleet/activity";
const POLL_MS = 30000;
const AGENT_COLOR = { gale: "var(--fleet-glm)", zephyr: "var(--tide)", squall: "var(--flag)", tempest: "var(--fleet-chan-live)", vortex: "var(--flag)", chinook: "var(--bolt)", cyclone: "var(--fleet-openai)", maistral: "var(--fleet-claude)", sirocco: "var(--fleet-muse)", bora: "var(--fleet-qwen)", tidal: "var(--fleet-chan-tailscale)", mountain: "var(--fleet-chan-mountain)", beacon: "var(--fleet-claude)", river: "#4fd1a5", creek: "#e0b45c", stream: "#d98fd1" };
const KIND_ICON = { waking: "◇", backup: "▣", peer: "✉", "peer-flag": "⚠", commit: "◆", agora: "☰", relay: "⇄" };
const KIND_COLOR = { waking: "var(--tide)", backup: "var(--bolt)", peer: "var(--magenta)", "peer-flag": "var(--flag)", commit: "var(--fleet-claude)", agora: "var(--text-dim)", relay: "var(--fleet-gemini)" };

const body = document.getElementById("stream-body");
const countEl = document.getElementById("stream-count");
const toggle = document.getElementById("stream-toggle");
let paused = false;
let lastRendered = "";

function setFresh(ok) {
  const el = document.getElementById("freshness");
  if (!el) return;
  el.dataset.state = ok ? "live" : "error";
}

function agentColor(ev) {
  return AGENT_COLOR[(ev.agent || "").toLowerCase()] || "var(--text-dim)";
}

function tag(ev) {
  const a = (ev.agent || "?").toUpperCase();
  const h = ev.host && ev.host !== "gale" ? `/${ev.host.toUpperCase()}` : "";
  return `${a}${h}`;
}

function timeOf(ts) {
  return esc((ts || "").slice(11, 16) + "Z");
}

function dayParts(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) {
    const m = (ts || "").slice(0, 10);
    return { date: (m.slice(5) + (m ? "" : "")).replace("-", "/"), label: m ? m.slice(5).replace("-", "/") : "—", ms: 0 };
  }
  const label = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(d);
  const date = d.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
  return { date, label, ms: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).getTime() };
}

function render(d) {
  countEl.textContent = d.events.length;
  const sig = JSON.stringify(d.events);
  if (paused || sig === lastRendered) return;
  lastRendered = sig;
  const days = new Map();
  for (const ev of d.events) {
    const key = (ev.ts || "").slice(0, 10);
    if (!days.has(key)) days.set(key, { key, events: [] });
    days.get(key).events.push(ev);
  }
  const groups = [...days.values()].sort((a, b) => a.key < b.key ? 1 : -1);
  const GAP_MS = 2 * 86400000; // a "quiet" span is >2 days between adjacent days
  let prevMs = null;
  let html = "";
  for (const g of groups) {
    const p = dayParts(g.key + "T00:00:00Z");
    if (prevMs !== null && prevMs - p.ms >= GAP_MS) {
      const gap = Math.round((prevMs - p.ms) / 86400000);
      html += `<div class="tl-gap"><span class="tl-gap-line" aria-hidden="true"></span><span class="tl-gap-tag">quiet · ${gap} days</span><span class="tl-gap-line" aria-hidden="true"></span></div>`;
    }
    prevMs = p.ms;
    html += `<header class="tl-day"><span class="tl-day-label">${esc(p.label)}</span><span class="tl-day-n">${g.events.length}</span></header>`;
    const sorted = [...g.events].sort((a, b) => (a.ts || "") < (b.ts || "") ? 1 : -1);
    html += `<ul class="tl-list">` + sorted.map((ev) => {
      const kc = KIND_COLOR[ev.kind] || "var(--text-dim)";
      return `<li class="tl-item">
        <span class="tl-rail" aria-hidden="true"><i class="tl-dot" style="background:${kc}"></i></span>
        <span class="fleet-term-tag" data-agent="${(ev.agent || "").toLowerCase()}" style="color:${agentColor(ev)}">${esc(KIND_ICON[ev.kind] || "·")} ${esc(tag(ev))}</span>
        <span class="fleet-term-x">${esc(ev.text || "")}</span>
        <span class="fleet-term-hhmm">${timeOf(ev.ts)}</span>
      </li>`;
    }).join("") + `</ul>`;
  }
  body.innerHTML = html;
}

async function load() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    render(await r.json());
    refreshEffects();
    setFresh(true);
  } catch {
    setFresh(false);
  }
}

if (toggle) {
  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    paused = !paused;
    toggle.textContent = paused ? "Resume" : "Pause";
    toggle.setAttribute("aria-pressed", String(paused));
  });
}

await load();
setInterval(load, POLL_MS);
