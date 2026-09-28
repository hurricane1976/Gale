/* GALE — fleet topology page (Tidal system rebuild): detail strip driven by
   data-* attributes in the markup. Static SVG does the topology; this only
   wires hover/tap/keyboard detail and the mesh status line feed. */
import { boot, esc, refreshEffects, REDUCED, isDataSaver } from "./shared.js";

boot();

const topo = document.getElementById("topo");
const detail = document.getElementById("topo-detail");
if (!topo || !detail) throw new Error("topology markup missing");

const MODEL_COLOR = {
  Claude: "var(--fleet-claude)", GLM: "var(--fleet-glm)", GPT: "var(--fleet-openai)",
  DeepSeek: "var(--fleet-deepseek)", Gemini: "var(--fleet-gemini)", Muse: "var(--fleet-muse)",
  Qwen: "var(--fleet-qwen)",
};
const DEFAULT_DETAIL = detail.innerHTML;

function showNode(node) {
  const d = node.dataset;
  const color = MODEL_COLOR[d.model];
  const nameStyle = color ? ` style="color:${color}"` : "";
  detail.innerHTML =
    `<strong${nameStyle}>${esc(d.name || "?")}</strong><span class="sep">·</span>` +
    `<span>${esc(d.host || "")}</span><span class="sep">·</span>` +
    `<span>${esc(d.model || "")}</span><span class="sep">·</span>` +
    `<span>${esc(d.roleDesc || "")}</span><span class="sep">·</span>` +
    `<code>${esc(d.listener || "")}</code><span class="sep">·</span>` +
    `<span>${esc(d.state || "")}</span>`;
}

function showDefault() {
  detail.innerHTML = DEFAULT_DETAIL;
}

topo.querySelectorAll(".topo-node").forEach((node) => {
  node.addEventListener("mouseenter", () => showNode(node));
  node.addEventListener("mouseleave", showDefault);
  node.addEventListener("focus", () => showNode(node));
  node.addEventListener("blur", showDefault);
  node.addEventListener("click", () => showNode(node));
  node.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showNode(node); }
  });
});

/* live mesh status line: from the fleet activity feed, with the static
   last-verified summary as fallback text (Tidal's pattern). */
const statusEl = document.getElementById("mesh-status");
if (statusEl) {
  fetch("api/fleet/activity", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((d) => {
      const last = (d.events || []).slice(-3).reverse();
      if (!last.length) return;
      statusEl.innerHTML =
        `<strong style="color:var(--teal)">live mesh feed</strong> — ` +
        last.map((e) => `${esc((e.ts || "").slice(5, 16).replace("T", " "))} ${esc(e.agent || "?")}: ${esc(e.text || "")}`).join(" &middot; ");
    })
    .catch(() => { /* keep the static fallback */ });
}

/* pointer glow on the static roster cards (wired here so the shared
   engine picks them up even though they carry no data-glow in markup). */
document.querySelectorAll(".member-card:not([data-glow])").forEach((c) => c.setAttribute("data-glow", ""));
document.querySelectorAll(".mc-name:not([tabindex])").forEach((el) => el.setAttribute("tabindex", "0"));
refreshEffects();

/* roster filter: match name, model chip, or role text; hide empty groups. */
(function initRosterFilter() {
  const q = document.getElementById("roster-q");
  const count = document.getElementById("roster-count2");
  if (!q) return;
  const apply = () => {
    const needle = q.value.trim().toLowerCase();
    let shown = 0, total = 0;
    document.querySelectorAll(".member-group").forEach((g) => {
      let gShown = 0;
      g.querySelectorAll(".member-card").forEach((c) => {
        total += 1;
        const hay = (c.textContent || "").toLowerCase();
        const hit = !needle || hay.includes(needle);
        c.hidden = !hit;
        if (hit) { gShown += 1; shown += 1; }
      });
      g.hidden = gShown === 0;
    });
    if (count) count.textContent = needle ? `${shown}/${total} agents` : "";
  };
  q.addEventListener("input", apply);
  q.addEventListener("keydown", (e) => { if (e.key === "Escape") { q.value = ""; apply(); } });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) {
      e.preventDefault();
      q.focus();
      q.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
    }
  });
})();

/* ---- packet-flow overlay (improvements #4): dots traverse each live mesh
   link; dot count/speed scale with measured tailscale throughput from
   status.json (tailscale interface rx+tx Mb/s, refreshed every 60s).
   Per-link direction isn't instrumented, so dots alternate direction as a
   duplex suggestion -- the #mesh-flow line states the honest mapping
   (flow intensity ∝ tailscale Mb/s). Skipped under reduced motion. ---- */
(function initPacketFlow() {
  if (REDUCED || isDataSaver()) return;
  const svg = document.getElementById("topo");
  const flowNote = document.getElementById("mesh-flow");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const links = [...svg.querySelectorAll("line.pulse-line")].map((el) => ({
    x1: +el.getAttribute("x1"), y1: +el.getAttribute("y1"),
    x2: +el.getAttribute("x2"), y2: +el.getAttribute("y2"),
  })).filter((l) => [l.x1, l.y1, l.x2, l.y2].every(Number.isFinite));
  if (!links.length) return;
  const layer = document.createElementNS(NS, "g");
  layer.setAttribute("class", "flow-layer");
  layer.setAttribute("aria-hidden", "true");
  layer.style.pointerEvents = "none";
  svg.appendChild(layer);
  const state = { mbps: 0.5, dots: [] };
  const COLORS = ["#22e6ff", "#39ff8f"];
  const syncDots = () => {
    const want = Math.min(6, Math.max(1, 1 + Math.round(state.mbps / 1.5)));
    links.forEach((l, li) => {
      let lane = state.dots[li];
      if (!lane) {
        lane = state.dots[li] = { link: l, items: [] };
      }
      while (lane.items.length < want) {
        const c = document.createElementNS(NS, "circle");
        const k = lane.items.length;
        c.setAttribute("r", "2.4");
        c.setAttribute("fill", COLORS[(li + k) % 2]);
        c.setAttribute("opacity", "0.9");
        layer.appendChild(c);
        lane.items.push({ el: c, t: (k / want + Math.random() * 0.2) % 1, dir: (li + k) % 2 ? 1 : -1 });
      }
      while (lane.items.length > want) {
        const d = lane.items.pop();
        d.el.remove();
      }
    });
  };
  const setNote = () => {
    if (flowNote) flowNote.textContent =
      `packet flow ∝ tailnet throughput (${state.mbps.toFixed(2)} Mb/s rx+tx on tailscale0) · direction alternates (per-link direction not instrumented)`;
  };
  const measure = async () => {
    try {
      const r = await fetch("api/status.json", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      const ifs = (d.network && d.network.interfaces) || [];
      const ts = ifs.find((i) => /tailscale|tailscale0/i.test(i.name || "")) || ifs.find((i) => /tailscale/i.test(i.name || ""));
      if (ts) {
        state.mbps = Math.max(0, (ts.rx_mbps || 0) + (ts.tx_mbps || 0));
        syncDots();
        setNote();
      }
    } catch { /* keep last rate */ }
  };
  let last = performance.now();
  let running = true;
  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!document.hidden && svg.offsetParent !== null) {
      const speed = Math.min(220, 50 + state.mbps * 10); // px/s
      for (const lane of state.dots) {
        const { link: l } = lane;
        const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1;
        for (const d of lane.items) {
          d.t = (d.t + d.dir * speed * dt / len + 1) % 1;
          d.el.setAttribute("cx", (l.x1 + (l.x2 - l.x1) * d.t).toFixed(1));
          d.el.setAttribute("cy", (l.y1 + (l.y2 - l.y1) * d.t).toFixed(1));
        }
      }
    }
    requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    last = performance.now();
  });
  syncDots();
  setNote();
  measure();
  setInterval(measure, 60000);
  requestAnimationFrame(tick);
})();

/* ---- 3D topology (ROADMAP #5): lazy import keeps the WebGL path out of
   the initial bundle; the toggle/canvas simply don't light up if it fails. ---- */
import("./topology3d.js")
  .then((m) => m.initTopology3D())
  .catch((e) => console.warn("topology3d unavailable", e));
