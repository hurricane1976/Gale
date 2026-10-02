/* Status-page host map: the 3D topology with hub colour = host health (listener sweep), agents tinted by
   host, alert halos from /api/fleet/alerts. Roster comes from /api/fleet/metrics (agents_by_host +
   fleet_status), so agents without telemetry rows yet (the roster has them, the wake rows don't) are
   still placed: their host is inferred from the shared tailscale listener IP. */
import { initTopology3D } from "./topology3d.js";

const HOST_HUE = { gale: [1.0, 0.54, 0.24], tidal: [0.22, 0.74, 0.97], mountain: [0.55, 0.49, 0.96], beacon: [0.98, 0.75, 0.14] };

export async function initHostMap() {
  const sec = document.getElementById("sec-hostmap");
  const fail = () => { if (sec) sec.hidden = true; };
  try {
    const r = await fetch("api/fleet/metrics", { cache: "no-store" });
    if (!r.ok) return fail();
    const d = await r.json();
    const byHost = d.agents_by_host || {}, fs = d.fleet_status || {};
    const hostOfName = new Map();
    for (const [h, list] of Object.entries(byHost)) for (const a of list) hostOfName.set(String(a).toLowerCase(), h);
    const ip = (st) => String((st && st.listener) || "").split(":")[0];
    const ipHost = new Map();
    for (const [name, st] of Object.entries(fs)) { const h = hostOfName.get(name.toLowerCase()); if (h) ipHost.set(ip(st), h); }
    const nodes = Object.entries(fs).map(([name, st]) => {
      const host = hostOfName.get(name.toLowerCase()) || ipHost.get(ip(st)) || "other";
      return { name, host, model: "", listener: (st && st.listener) || "", color: HOST_HUE[host] || [0.6, 0.65, 0.75] };
    });
    if (nodes.length < 2) return fail();
    if (!initTopology3D({ nodes, health: true, autoOpen: true })) return fail();
    // no WebGL / reduced motion / data-saver: the canvas never opens, so drop the empty panel
    setTimeout(() => { const c = document.getElementById("topo-3d-canvas"); if (c && c.hidden) fail(); }, 2500);
  } catch { fail(); }
}
