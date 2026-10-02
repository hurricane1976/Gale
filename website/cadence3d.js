/* Home page 3D: "fleet cadence" -- 14 days of wakes (x) for each of the four hosts (z), height = wakes that day.
   Small, cheap (metrics feed only), and sits right under the heartbeat strip. */
import { mountBars3D } from "./bars3d.js";

const HOST_HUE = { gale: [1.0, 0.54, 0.24], tidal: [0.22, 0.74, 0.97], mountain: [0.55, 0.49, 0.96], beacon: [0.98, 0.75, 0.14] };

export async function initCadence3D() {
  const sec = document.getElementById("cadence"), canvas = document.getElementById("cadence-3d");
  if (!sec || !canvas) return;
  const hide = () => { sec.hidden = true; };
  let gl = null;
  try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!gl || reduced || document.documentElement.dataset.saver === "1") return hide();
  try {
    const r = await fetch("api/fleet/metrics", { cache: "no-store" });
    if (!r.ok) return hide();
    const d = await r.json(), view = mountBars3D(canvas, { yaw: 0.25, pitch: 0.55, fit: 1.0 });
    if (!view) return hide();
    const hosts = ["gale", "beacon", "tidal", "mountain"].filter((h) => d.daily_wakings_by_host && d.daily_wakings_by_host[h]);
    const max = Math.max(1, ...hosts.flatMap((h) => d.daily_wakings_by_host[h]));
    const bars = [];
    hosts.forEach((h, z) => d.daily_wakings_by_host[h].forEach((n, x) => bars.push({
      x, z: z * 1.7, w: 0.8, d: 1.2, h: Math.max(0.04, (n / max) * 5), color: HOST_HUE[h].map((c) => c * (0.6 + 0.4 * n / max)),
      tip: `${h}\n${(d.days || [])[x] || "day " + (x + 1)}\n${n} wakes` })));
    const days = d.days || [], step = Math.max(1, Math.round(days.length / 7));
    view.setData(bars, {
      xLabels: days.map((dd, x) => ({ x, text: String(dd).slice(5) })).filter((_, x) => x % step === 0),
      zLabels: hosts.map((h, z) => ({ z: z * 1.7, text: h })),
    });
  } catch { hide(); }
}
