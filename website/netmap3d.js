/* Network page 3D: the LAN as a constellation. Each interface (eno1, tailscale0, ...) is a hub; every ARP/neighbour
   entry orbits the interface it was learned on, coloured by neighbour state (reachable green, stale amber,
   failed red). Reuses the topology3d renderer with a synthetic roster built from /api/fleet/net. */
import { initTopology3D } from "./topology3d.js";

const STATE = { REACHABLE: [0.2, 0.85, 0.55], DELAY: [0.5, 0.8, 0.9], PROBE: [0.5, 0.8, 0.9], STALE: [1.0, 0.72, 0.2], FAILED: [1.0, 0.3, 0.33], INCOMPLETE: [1.0, 0.3, 0.33] };
let started = false;

export function initNetMap(net) {
  const sec = document.getElementById("sec-netmap");
  if (!sec || started) return;
  const arp = (net && net.arp) || [];
  if (arp.length < 2) { sec.hidden = true; return; }
  const nodes = arp.map((a) => ({
    name: a.dst, host: a.dev || "?", model: a.state || "", listener: "", color: STATE[a.state] || [0.6, 0.65, 0.75],
  }));
  started = true;
  if (!initTopology3D({ nodes, noHeat: true, autoOpen: true })) { sec.hidden = true; return; }
  setTimeout(() => { const c = document.getElementById("topo-3d-canvas"); if (c && c.hidden) sec.hidden = true; }, 2500);
}
