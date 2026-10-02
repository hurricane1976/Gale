/* Metrics page 3D: the "spend landscape" -- 14 days (x) by every agent (z, grouped by host), height = that day's
   cost (or wake count). Built from per_agent_24h[].daily_cost_14d / daily_wakings_14d in /api/fleet/metrics. */
import { mountBars3D } from "./bars3d.js";

const HOST_HUE = { gale: [1.0, 0.54, 0.24], tidal: [0.22, 0.74, 0.97], mountain: [0.55, 0.49, 0.96], beacon: [0.98, 0.75, 0.14] };
const HOST_ORDER = ["gale", "beacon", "tidal", "mountain"];

export function initLandscape3D(canvas) {
  const view = mountBars3D(canvas, { yaw: 0.3, pitch: 0.75, fit: 2.5, narrow: 0.36 });
  if (!view) return null;
  let mode = "cost";
  function update(d) {
    if (!d) return;
    const hostOf = new Map();
    for (const [h, list] of Object.entries(d.agents_by_host || {})) for (const a of list) hostOf.set(String(a).toLowerCase(), h);
    const agents = (d.per_agent_24h || []).slice().sort((a, b) => {
      const ha = HOST_ORDER.indexOf(hostOf.get(a.agent) || "z"), hb = HOST_ORDER.indexOf(hostOf.get(b.agent) || "z");
      return (ha - hb) || a.agent.localeCompare(b.agent);
    });
    const days = d.days || [], key = mode === "cost" ? "daily_cost_14d" : "daily_wakings_14d";
    const max = Math.max(0.0001, ...agents.flatMap((a) => a[key] || [0]));
    const bars = [], zLabels = [];
    let prevHost = null, zi = 0;
    agents.forEach((a) => {
      const host = hostOf.get(a.agent) || "other";
      if (prevHost !== null && host !== prevHost) zi += 0.8; // a gap between host groups
      prevHost = host;
      const col = HOST_HUE[host] || [0.6, 0.65, 0.75];
      (a[key] || []).forEach((v, x) => {
        const t = Math.sqrt(v / max);                         // sqrt: small days stay visible next to the big ones
        const shade = 0.55 + 0.45 * t;
        bars.push({ x, z: zi, w: 0.8, d: 0.8, h: Math.max(0.03, t * 6), color: col.map((c) => c * shade),
          tip: `${a.agent} · ${host}\n${days[x] || `day ${x + 1}`}\n${mode === "cost" ? `$${v.toFixed(2)}` : `${v} wakes`}` });
      });
      zLabels.push({ z: zi, text: a.agent });
      zi += 1;
    });
    const step = Math.max(1, Math.round(days.length / 7));
    const xLabels = days.map((dd, x) => ({ x, text: String(dd).slice(5) })).filter((_, x) => x % step === 0);
    // thin the agent labels so they don't smear: one in every 2 when there are many
    view.setData(bars, { xLabels, zLabels: zLabels.filter((_, i) => agents.length <= 18 || i % 2 === 0) });
  }
  return { update, setMode(m) { mode = m; }, destroy: view.destroy };
}
