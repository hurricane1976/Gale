/* GALE — fleet topology page (Tidal system rebuild): detail strip driven by
   data-* attributes in the markup. Static SVG does the topology; this only
   wires hover/tap/keyboard detail and the mesh status line feed. */
import { boot, esc, refreshEffects, REDUCED } from "./shared.js";

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

/* pairing progress: counted live from the roster markup (pending = any
   .mc-state that is neither two-way confirmed nor the local hub card). */
(function initPairingProgress() {
  const el = document.getElementById("pairing-progress");
  if (!el) return;
  const cards = [...document.querySelectorAll(".member-card")];
  const remote = cards.filter((c) => {
    const st = (c.querySelector(".mc-state")?.textContent || "").toLowerCase();
    return !st.includes("vantage point");
  });
  const ok = remote.filter((c) => {
    const st = (c.querySelector(".mc-state")?.textContent || "").toLowerCase();
    return st.includes("two-way");
  }).length;
  const pct = remote.length ? Math.round((ok / remote.length) * 100) : 0;
  el.innerHTML = `<span class="pp-label">${ok}/${remote.length} gale-side pairings two-way</span>` +
    `<span class="pp-track" role="img" aria-label="${ok} of ${remote.length} pairings verified two-way">` +
    `<i style="width:0%"></i></span>`;
  const setW = () => {
    const bar = el.querySelector(".pp-track i");
    if (bar) bar.style.width = `${pct}%`;
  };
  if (REDUCED) setW();
  else requestAnimationFrame(() => requestAnimationFrame(setW));
  refreshEffects();
})();
