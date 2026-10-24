/* 404 page 3D: the site's pages as one cluster and "this page" as a lone red node drifting off on its own.
   Click (or tap) a page node to fly to it and go there. Reuses the topology3d renderer. */
import { initTopology3D } from "./topology3d.js";

const PAGES = [["Dashboard", "index.html"], ["Fleet", "fleet.html"], ["Status", "status.html"], ["Metrics", "metrics.html"],
  ["Observability", "observability.html"], ["freetoken", "ollama.html"], ["Agora", "agora.html"], ["Weather", "weather.html"],
  ["Network", "network.html"], ["Reliability", "reliability.html"]];

export function initLost() {
  const wrap = document.getElementById("lost-map");
  if (!wrap) return;
  const fallback = document.getElementById("lost-map-fallback");
  const canvas = document.getElementById("topo-3d-canvas");
  const toggle = document.getElementById("topo-3d-toggle");
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || document.documentElement.dataset.saver === "1" || !toggle || !canvas) return;
  const nodes = PAGES.map(([name, href]) => ({ name, host: "the site", model: "", listener: "", href, color: [0.45, 0.7, 1.0] }));
  nodes.push({ name: "this page", host: "lost", model: "404", listener: "", color: [1.0, 0.35, 0.38] });
  toggle.hidden = false;
  toggle.textContent = "Open interactive 3D map";
  if (fallback) {
    const syncFallback = () => { fallback.hidden = !canvas.hidden; };
    new MutationObserver(syncFallback).observe(canvas, { attributes: true, attributeFilter: ["hidden"] });
    syncFallback();
  }
  let started = false;
  toggle.addEventListener("click", () => {
    if (started) return;
    started = true;
    initTopology3D({ nodes, noHeat: true, noActivity: true, autoOpen: true, fallbackMessage: "WebGL is unavailable; use the site map links below.", onActivate: (n) => { if (n.href) location.href = n.href; } });
  });
}
