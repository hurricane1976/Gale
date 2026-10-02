/* Reliability page 3D: "error-budget towers". One tower per SLO (height = measured %, tinted green when it meets its
   target, amber/red when it burns budget) with a pale target plate at the target height, plus a second row of the last
   7 days of spend against the daily limit. Mounted lazily by reliability.js once the SLOs are computed. */
import { mountBars3D } from "./bars3d.js";

const OK = [0.2, 0.8, 0.5], WARN = [0.95, 0.65, 0.2], CRIT = [0.92, 0.28, 0.32];
let view = null;

export function updateSLO3D(slos, perDay, limit) {
  const canvas = document.getElementById("slo-3d");
  if (!canvas) return false;
  if (!view) view = mountBars3D(canvas, { yaw: 0.3, pitch: 0.5, fit: 1.25 });
  if (!view) return false;
  const bars = [], zLabels = [{ z: 0, text: "SLOs" }], xLabels = [];
  const H = (pct) => 0.05 + Math.max(0, Math.min(100, pct)) / 100 * 5;
  slos.forEach((s, i) => {
    const x = i * 2.2, met = s.actual >= s.target, burn = (s.actual - s.target) / (100 - s.target);
    const col = met ? OK : burn > -1 ? WARN : CRIT;
    bars.push({ x, z: 0, w: 1.2, d: 1.2, h: H(s.actual), color: col, tip: `${s.name}\n${s.actual.toFixed(2)}% (target ${s.target}%)\n${s.detail || ""}` });
    bars.push({ x, z: 0, w: 1.6, d: 1.6, y0: H(s.target), h: 0.05, color: [0.85, 0.9, 1.0], tip: `${s.name}\ntarget ${s.target}%` });
    xLabels.push({ x, text: s.short || s.name });
  });
  if (perDay && perDay.length) {
    const max = Math.max(limit * 2, ...perDay);
    perDay.forEach((c, i) => bars.push({ x: i * 1.3, z: 4.6, w: 0.9, d: 1.2, h: 0.05 + (c / max) * 4.5, color: c <= limit ? OK : c <= limit * 2 ? WARN : CRIT,
      tip: `day -${perDay.length - 1 - i}\n$${c.toFixed(2)} (limit $${limit}/day)` }));
    bars.push({ x: (perDay.length - 1) * 0.65, z: 4.6, w: perDay.length * 1.3, d: 1.5, y0: 0.05 + (limit / max) * 4.5, h: 0.04, color: [0.85, 0.9, 1.0], tip: `daily limit $${limit}` });
    zLabels.push({ z: 4.6, text: "spend/day" });
  }
  view.setData(bars, { xLabels, zLabels });
  return true;
}
