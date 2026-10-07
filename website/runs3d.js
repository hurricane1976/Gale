/* Observability page 3D: "spend city" -- last 72 hours in 3-hour buckets (x) by model family (z); height = spend in
   that bucket (sqrt-scaled so cheap and expensive families are both visible), colour = family. Built from the runs
   already loaded by the page (any partial first-paint slice just shows fewer old buckets until the full set lands). */
import { mountBars3D } from "./bars3d.js";

const FAM = { claude: [0.98, 0.7, 0.25], glm: [0.9, 0.35, 0.75], gpt: [1.0, 0.45, 0.45], deepseek: [0.3, 0.8, 0.95], muse: [0.4, 0.9, 0.6], gemini: [0.3, 0.7, 0.9], other: [0.6, 0.65, 0.75] };
let view = null;

export function updateRuns3D(runs) {
  const canvas = document.getElementById("runs-3d");
  if (!canvas) return false;
  if (!view) view = mountBars3D(canvas, { yaw: 0.3, pitch: 0.55, fit: 1.45, narrow: 0.5 });
  if (!view) return false;
  const B = 3 * 3600e3, N = 24, now = Date.now(), cur = Math.floor(now / B);
  const fams = Object.keys(FAM).filter((f) => runs.some((r) => (r.model_family || "other") === f));
  const cost = new Map(), count = new Map();
  for (const r of runs) {
    const k = cur - Math.floor(new Date(r.ts).getTime() / B);
    if (k < 0 || k >= N) continue;
    const f = FAM[r.model_family] ? r.model_family : "other", key = f + "|" + (N - 1 - k);
    cost.set(key, (cost.get(key) || 0) + (r.cost_usd || 0));
    count.set(key, (count.get(key) || 0) + 1);
  }
  if (!fams.length) return false;
  const max = Math.max(0.0001, ...cost.values());
  const bars = [];
  fams.forEach((f, z) => {
    for (let x = 0; x < N; x++) {
      const c = cost.get(f + "|" + x) || 0, n = count.get(f + "|" + x) || 0;
      const t = Math.sqrt(c / max);
      bars.push({ x, z: z * 1.5, w: 0.8, d: 1.1, h: n ? 0.15 + t * 4.85 : 0.03, color: n ? FAM[f] : [0.2, 0.26, 0.4],
        tip: `${f} · ${new Date((cur - (N - 1 - x)) * B).toLocaleString([], { weekday: "short", hour: "numeric" })}\n${n} run${n === 1 ? "" : "s"} · $${c.toFixed(2)}` });
    }
  });
  const xLabels = [0, 6, 12, 18, 23].map((x) => ({ x, text: new Date((cur - (N - 1 - x)) * B).toLocaleString([], { weekday: "short", hour: "numeric" }) }));
  view.setData(bars, { xLabels, zLabels: fams.map((f, z) => ({ z: z * 1.5, text: f })) });
  return true;
}
