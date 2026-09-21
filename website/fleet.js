/* GALE — fleet topology page: static SVG enhanced in place with photon
   pulses, ping stagger, host filtering, and a live detail strip. */
import { boot, REDUCED } from "./shared.js";

boot();

const topo = document.getElementById("topo");
const detail = document.getElementById("topo-detail");
if (!topo || !detail) throw new Error("topology markup missing");

const MODEL_COLOR = { Claude: "var(--m-claude)", GLM: "var(--m-glm)", GPT: "var(--m-gpt)" };
const DEFAULT_DETAIL = detail.innerHTML;

/* ---- photon pulses along confirmed edges (decoration: JS-only, and
   dropped entirely under reduced motion) ---- */
if (!REDUCED) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("aria-hidden", "true");
  topo.querySelectorAll(".edge.up").forEach((edge, i) => {
    const photon = edge.cloneNode(false);
    photon.setAttribute("class", "photon hosted");
    photon.removeAttribute("data-peer");
    const host = edge.dataset.host;
    if (host) photon.setAttribute("data-host", host);
    photon.style.animationDelay = `${(-(i * 0.53) % 4.6).toFixed(2)}s`;
    g.appendChild(photon);
  });
  topo.appendChild(g);
}

/* ---- stagger the ping halos ---- */
topo.querySelectorAll(".node .ping").forEach((ping, i) => ping.style.setProperty("--i", i % 6));

/* ---- detail strip + focus glow, via data-* already in the markup ---- */
function showNode(node) {
  const d = node.dataset;
  const color = MODEL_COLOR[d.model];
  const nameStyle = color ? ` style="color:${color}"` : "";
  detail.innerHTML =
    `<strong${nameStyle}>${d.name}</strong><span class="sep">·</span>` +
    `<span>${d.host}</span><span class="sep">·</span>` +
    `<span>${d.model}</span><span class="sep">·</span>` +
    `<span>${d.role}</span><span class="sep">·</span>` +
    `<code>${d.listener}</code><span class="sep">·</span>` +
    `<span>${d.state}</span>`;
}

function showDefault() {
  detail.innerHTML = DEFAULT_DETAIL;
}

topo.querySelectorAll(".node, .hub").forEach((node) => {
  node.addEventListener("mouseenter", () => showNode(node));
  node.addEventListener("mouseleave", showDefault);
  node.addEventListener("focus", () => showNode(node));
  node.addEventListener("blur", showDefault);
  node.addEventListener("click", () => showNode(node));
});

/* ---- host filter chips: one attribute drives the CSS dimming ---- */
document.querySelectorAll(".chip[data-filter]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip[data-filter]").forEach((c) =>
      c.setAttribute("aria-pressed", String(c === chip))
    );
    topo.setAttribute("data-filter", chip.dataset.filter);
  });
});
