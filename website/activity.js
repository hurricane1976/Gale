/* GALE — fleet activity stream: polls /api/fleet/activity, renders the last
   N real events oldest-first in a terminal-style panel (Beacon's pattern).
   Pause toggle stops re-rendering but never stops fetching. */
import { boot, esc } from "./shared.js";

boot();

const FEED = "api/fleet/activity";
const POLL_MS = 30000;
const AGENT_COLOR = { gale: "var(--m-glm)", zephyr: "var(--gust)", squall: "var(--warn)", tempest: "var(--ok)", vortex: "var(--flag)", chinook: "var(--bolt)", cyclone: "var(--m-gpt)", maistral: "var(--m-claude)", sirocco: "var(--m-muse)", bora: "var(--storm-purple)", tidal: "#3fc7ff", mountain: "#8593f0", beacon: "var(--m-claude)", river: "#4fd1a5", creek: "#e0b45c", stream: "#d98fd1" };
const KIND_ICON = { waking: "◇", backup: "▣", peer: "✉", "peer-flag": "⚠", commit: "◆", agora: "☰", relay: "⇄" };

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

function day(ts) {
  return esc((ts || "").slice(5, 10).replace("-", "/"));
}

function timeOf(ts) {
  return esc((ts || "").slice(11, 16) + "Z");
}

function render(d) {
  countEl.textContent = d.events.length;
  const sig = JSON.stringify(d.events);
  if (paused || sig === lastRendered) return;
  lastRendered = sig;
  body.innerHTML = d.events.map((ev) =>
    `<div class="fleet-term-row">
      <span class="fleet-term-t">${day(ev.ts)}</span>
      <span class="fleet-term-tag" style="color:${agentColor(ev)}">${esc(KIND_ICON[ev.kind] || "·")} ${esc(tag(ev))}</span>
      <span class="fleet-term-x">${esc(ev.text || "")}</span>
      <span class="fleet-term-hhmm">${timeOf(ev.ts)}</span>
    </div>`).join("");
}

async function load() {
  try {
    const r = await fetch(FEED, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    render(await r.json());
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
