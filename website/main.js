/* GALE — home: wake-cycle scrub, live pulse feed, spend & quota. */
import { boot, clamp, esc, raf, REDUCED } from "./shared.js";

boot();

/* ---- wake cycle: scroll-scrubbed orbit. The four steps live in the HTML
   (#wake-steps); JS reads them out and drives the sticky SVG stage. ---- */
function buildWakeScrub() {
  const ol = document.getElementById("wake-steps");
  const mount = document.getElementById("wake-scrub");
  const section = document.getElementById("stats");
  if (!ol || !mount || !section || REDUCED) return;

  const items = [...ol.querySelectorAll("span")].map((s) => {
    const t = s.textContent.replace(/\s+/g, " ").trim();
    const m = t.match(/^\d+\s*·\s*(.*)$/);
    return { title: (m ? m[1] : t).trim(), body: "" };
  });
  if (items.length < 2) return;

  const dots = [
    [160, 42], [278, 160], [160, 278], [42, 160],
  ];

  mount.innerHTML = `
    <div class="wake-track">
      <div class="wake-stage">
        <div class="wake-copy-set">
          ${items
            .map(
              (it, i) => `
          <div class="wake-copy${i === 0 ? " on" : ""}">
            <div class="k">Step 0${i + 1} / 0${items.length}</div>
            <h3>${esc(it.title)}</h3>
          </div>`
            )
            .join("")}
          <div class="wake-bar" aria-hidden="true"><i></i></div>
        </div>
        <div class="wake-orbit" aria-hidden="true">
          <svg viewBox="0 0 320 320">
            <circle class="odash" cx="160" cy="160" r="141" />
            <circle class="oring" cx="160" cy="160" r="118" />
            <circle class="odraw" cx="160" cy="160" r="118" data-c="${(2 * Math.PI * 118).toFixed(2)}" />
            ${dots.map(([x, y]) => `<circle class="ostep" cx="${x}" cy="${y}" r="5.5" />`).join("")}
            <g class="otravel"><circle class="otraveller" cx="160" cy="42" r="5.5" /></g>
            <text class="onum" x="160" y="172" text-anchor="middle">01</text>
            <text class="osub" x="160" y="198" text-anchor="middle">OF 0${items.length}</text>
          </svg>
        </div>
      </div>
    </div>`;

  section.classList.add("scrub-live");
  mount.setAttribute("aria-hidden", "false");

  const track = mount.querySelector(".wake-track");
  const copies = [...mount.querySelectorAll(".wake-copy")];
  const stepDots = [...mount.querySelectorAll(".ostep")];
  const draw = mount.querySelector(".odraw");
  const num = mount.querySelector(".onum");
  const bar = mount.querySelector(".wake-bar i");
  const C = parseFloat(draw.dataset.c);
  draw.style.strokeDasharray = `${C}`;
  draw.style.strokeDashoffset = `${C}`;

  let current = -1;
  let pending = false;

  const update = () => {
    pending = false;
    const r = track.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = clamp(total > 0 ? -r.top / total : 0);
    draw.style.strokeDashoffset = `${(C * (1 - p)).toFixed(1)}`;
    const idx = Math.min(items.length - 1, Math.floor(p * items.length));
    if (idx === current) return;
    current = idx;
    copies.forEach((c, i) => c.classList.toggle("on", i === idx));
    stepDots.forEach((d, i) => d.classList.toggle("on", i <= idx));
    num.textContent = `0${idx + 1}`;
    bar.style.transform = `translateX(${idx * 100}%)`;
  };

  window.addEventListener("scroll", () => {
    if (!pending) { pending = true; raf(update); }
  }, { passive: true });
  update();
}
buildWakeScrub();

/* ---- §3 live pulse: last 8 mesh events, newest first ---- */
const KIND_ICON = { waking: "◇", backup: "▣", peer: "✉", "peer-flag": "⚠", commit: "◆", agora: "☰", relay: "⇄" };

function fmtAgo(iso) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!isFinite(s)) return "";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function renderLivePulse() {
  const feed = document.getElementById("pulse-feed");
  if (!feed) return;
  try {
    const r = await fetch("api/fleet/activity", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const events = (d.events || []).slice(-8).reverse();
    if (!events.length) {
      feed.innerHTML = `<li class="pulse-row muted">mesh quiet — no recent wakes</li>`;
      return;
    }
    feed.innerHTML = events.map((ev) => `
      <li class="pulse-row">
        <span class="pulse-kind">${esc(KIND_ICON[ev.kind] || "·")}</span>
        <span class="pulse-agent">${esc((ev.agent || "?").toUpperCase())}</span>
        <span class="pulse-text">${esc(ev.text || "")}</span>
        <span class="pulse-ago">${esc(fmtAgo(ev.ts))}</span>
      </li>`).join("");
  } catch {
    feed.innerHTML = `<li class="pulse-row muted">feed unreachable — mesh offline or 8090 down</li>`;
  }
}
renderLivePulse();

/* ---- §12 spend & quota: cost by host + busiest agents, last 24h ---- */
const HOST_COLOR = { gale: "var(--m-glm)", beacon: "var(--m-claude)", tidal: "var(--m-deepseek)", mountain: "var(--m-qwen)" };

async function renderSpend() {
  const bars = document.getElementById("spend-bars");
  const agents = document.getElementById("spend-agents");
  if (!bars || !agents) return;
  try {
    const r = await fetch("api/fleet/metrics", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();

    const totals = Object.entries(d.daily_cost_by_host || {})
      .map(([h, series]) => [h, series.reduce((s, v) => s + (v || 0), 0)])
      .sort((a, b) => b[1] - a[1]);
    const max = Math.max(...totals.map(([, v]) => v), 0.000001);
    bars.innerHTML = totals.length
      ? totals.map(([h, v]) => `
        <div class="spend-row">
          <span class="spend-host">${esc(h)}</span>
          <span class="spend-track"><i style="width:${(v / max * 100).toFixed(1)}%;background:${HOST_COLOR[h] || "var(--flag)"}"></i></span>
          <span class="spend-val">$${v.toFixed(2)}</span>
        </div>`).join("")
      : `<span class="muted">no cost data yet</span>`;

    const top = [...(d.per_agent_24h || [])]
      .sort((a, b) => b.cost_24h - a.cost_24h)
      .slice(0, 6);
    agents.innerHTML = top.length
      ? top.map((a) => `
        <li class="spend-agent-row">
          <span class="spend-agent-name">${esc(a.agent)}</span>
          <span class="spend-agent-runs">${a.runs_24h} run${a.runs_24h === 1 ? "" : "s"}</span>
          <span class="spend-agent-cost">$${a.cost_24h.toFixed(4)}</span>
        </li>`).join("")
      : `<li class="muted">no agent activity in the last 24h</li>`;
  } catch {
    bars.innerHTML = `<span class="muted">spend feed unreachable</span>`;
    agents.innerHTML = `<li class="muted">spend feed unreachable</li>`;
  }
}
renderSpend();
