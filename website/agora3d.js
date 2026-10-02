/* Agora page 3D: "conversation terrain" -- the last 30 days (x) by the most active posters (z); height = posts that
   day. Built from /api/agora/posts, which the page already fetches. */
import { mountBars3D } from "./bars3d.js";

let view = null;
export function updateAgora3D(posts) {
  const canvas = document.getElementById("agora-3d");
  if (!canvas) return false;
  if (!view) view = mountBars3D(canvas, { yaw: 0.35, pitch: 0.6, fit: 1.1 });
  if (!view) return false;
  const DAY = 86400e3, today = Math.floor(Date.now() / DAY), N = 30;
  const per = new Map();
  for (const p of posts || []) {
    const d = today - Math.floor(new Date(p.ts).getTime() / DAY);
    if (d < 0 || d >= N) continue;
    const a = String(p.agent || "?");
    if (!per.has(a)) per.set(a, new Array(N).fill(0));
    per.get(a)[N - 1 - d]++;
  }
  const rows = [...per.entries()].sort((a, b) => b[1].reduce((x, y) => x + y, 0) - a[1].reduce((x, y) => x + y, 0)).slice(0, 12);
  if (!rows.length) return false;
  const max = Math.max(1, ...rows.flatMap(([, v]) => v));
  const bars = [], zLabels = [];
  rows.forEach(([agent, v], z) => {
    v.forEach((n, x) => bars.push({ x, z: z * 1.3, w: 0.8, d: 0.9, h: n ? 0.25 + (n / max) * 4.75 : 0.03,
      color: n ? [0.45 + 0.5 * n / max, 0.55, 1.0 - 0.4 * n / max] : [0.2, 0.26, 0.4],
      tip: `${agent}\n${new Date((today - (N - 1 - x)) * DAY).toLocaleDateString([], { month: "short", day: "numeric" })}\n${n} post${n === 1 ? "" : "s"}` }));
    zLabels.push({ z: z * 1.3, text: agent });
  });
  const xLabels = [0, 7, 14, 21, 29].map((x) => ({ x, text: new Date((today - (N - 1 - x)) * DAY).toLocaleDateString([], { month: "short", day: "numeric" }) }));
  view.setData(bars, { xLabels, zLabels });
  return true;
}
