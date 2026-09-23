/* GALE — fleet topology page (Tidal system rebuild): detail strip driven by
   data-* attributes in the markup. Static SVG does the topology; this only
   wires hover/tap/keyboard detail and the mesh status line feed. */
import { boot, esc } from "./shared.js";

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
    `<strong${nameStyle}>${esc(d.name)}</strong><span class="sep">·</span>` +
    `<span>${esc(d.host)}</span><span class="sep">·</span>` +
    `<span>${esc(d.model)}</span><span class="sep">·</span>` +
    `<span>${esc(d.roleDesc)}</span><span class="sep">·</span>` +
    `<code>${esc(d.listener)}</code><span class="sep">·</span>` +
    `<span>${esc(d.state)}</span>`;
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
        last.map((e) => `${esc((e.ts || "").slice(5, 16).replace("T", " "))} ${esc(e.agent)}: ${esc(e.text)}`).join(" &middot; ");
    })
    .catch(() => { /* keep the static fallback */ });
}
