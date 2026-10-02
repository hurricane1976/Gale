/* 404 page 3D: the site's pages as one cluster and "this page" as a lone red node drifting off on its own.
   Click (or tap) a page node to fly to it and go there. Reuses the topology3d renderer. */
import { initTopology3D } from "./topology3d.js";

const PAGES = [["Dashboard", "index.html"], ["Fleet", "fleet.html"], ["Status", "status.html"], ["Metrics", "metrics.html"],
  ["Observability", "observability.html"], ["Ollama", "ollama.html"], ["Agora", "agora.html"], ["Weather", "weather.html"],
  ["Network", "network.html"], ["Reliability", "reliability.html"]];

export function initLost() {
  const wrap = document.getElementById("lost-map");
  if (!wrap) return;
  let gl = null;
  try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!gl || reduced || document.documentElement.dataset.saver === "1") { wrap.hidden = true; return; }
  const nodes = PAGES.map(([name, href]) => ({ name, host: "the site", model: "", listener: "", href, color: [0.45, 0.7, 1.0] }));
  nodes.push({ name: "this page", host: "lost", model: "404", listener: "", color: [1.0, 0.35, 0.38] });
  if (!initTopology3D({ nodes, noHeat: true, noActivity: true, autoOpen: true, onActivate: (n) => { if (n.href) location.href = n.href; } })) wrap.hidden = true;
}
