/* Ollama page 3D: a 24h GPU "skyline" (time x metric lane, height = value) and a live VRAM "vault"
   (stacked resident models + other GPU use + free headroom, beside utilisation / temperature / power).
   Data comes from the same /api/ollama/history + snapshot + gpu feeds the page already polls. */
import { mountBars3D } from "./bars3d.js";

const GB = 1024 ** 3;
const lane = (k) => LANES.find((l) => l.key === k);
// back-to-front lane order: the lanes that run tall (VRAM, temperature) sit behind the ones that stay low (power, util)
const LANES = [
  { key: "vram", label: "VRAM", color: [0.25, 0.55, 1.0] },
  { key: "temp", label: "temp", color: [1.0, 0.4, 0.42] },
  { key: "power", label: "power", color: [1.0, 0.7, 0.2] },
  { key: "util", label: "util", color: [0.2, 0.85, 0.5] },
];

export function initOllama3D() {
  const skyCanvas = document.getElementById("gpu-skyline"), vaultCanvas = document.getElementById("vram-vault");
  if (!skyCanvas || !vaultCanvas) return null;
  const sky = mountBars3D(skyCanvas, { yaw: 0.16, pitch: 0.48 }), vault = mountBars3D(vaultCanvas, { yaw: 0.62, pitch: 0.4 });
  if (!sky || !vault) { sky && sky.destroy(); vault && vault.destroy(); return null; }
  const fmtT = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  function updateSkyline(hist) {
    const series = (hist && hist.series) || [];
    if (!series.length) return;
    const t1 = new Date(series[series.length - 1].ts).getTime(), BUCKETS = 48, span = 24 * 3600e3, bw = span / BUCKETS, t0 = t1 - span;
    const acc = Array.from({ length: BUCKETS }, () => ({ n: 0, vram: 0, util: 0, power: 0, temp: 0, up: 0 }));
    for (const s of series) {
      const i = Math.floor((new Date(s.ts).getTime() - t0) / bw);
      const g = s.gpu && s.gpu.gpus && s.gpu.gpus[0];
      if (i < 0 || i >= BUCKETS || !g || s.reachable === false) continue;
      const a = acc[i]; a.n++;
      a.vram += g.mem_total_mb ? (g.mem_used_mb / g.mem_total_mb) * 100 : 0;
      a.util += g.util_pct || 0;
      a.power += g.power_limit_w ? (g.power_w / g.power_limit_w) * 100 : 0;
      a.temp = Math.max(a.temp, g.temp_c || 0);
    }
    const bars = [], xLabels = [];
    acc.forEach((a, x) => {
      const when = fmtT(t0 + (x + 0.5) * bw);
      if (x % 8 === 0) xLabels.push({ x, text: when });
      LANES.forEach((l, z) => {
        const raw = !a.n ? 0 : l.key === "temp" ? a.temp : a[l.key] / a.n;
        const norm = l.key === "temp" ? Math.max(0, (raw - 20) / 70) : raw / 100;     // temp: 20..90 C -> 0..1
        const unit = l.key === "temp" ? `${raw.toFixed(0)} °C` : `${raw.toFixed(0)}%`;
        bars.push({ x, z: z * 1.6, h: Math.max(0.04, norm * 5), w: 0.78, d: 1.1, color: l.color,
          tip: `${when} · ${l.label}\n${a.n ? unit : "no samples"}` });
      });
    });
    sky.setData(bars, { xLabels, zLabels: LANES.map((l, z) => ({ z: z * 1.6, text: l.label })) });
  }

  function updateVault(snap, gpu) {
    const g = gpu && gpu.gpus && gpu.gpus[0];
    if (!g) return;
    const totalGB = g.mem_total_mb / 1024, usedGB = g.mem_used_mb / 1024, SCALE = 6 / totalGB;
    const models = ((snap && snap.models) || []).filter((m) => m.resident && m.size_vram_bytes);
    const bars = []; let y = 0;
    const palette = [[0.35, 0.6, 1.0], [0.55, 0.45, 0.98], [0.2, 0.8, 0.9], [0.95, 0.55, 0.9]];
    models.forEach((m, i) => {
      const gb = m.size_vram_bytes / GB;
      bars.push({ x: 0, z: 0, w: 1.9, d: 1.9, y0: y, h: gb * SCALE, color: palette[i % palette.length], tip: `${m.name}\n${gb.toFixed(1)} GB in VRAM` });
      y += gb * SCALE;
    });
    const modelGB = models.reduce((s, m) => s + m.size_vram_bytes / GB, 0);
    const other = Math.max(0, usedGB - modelGB);
    if (other > 0.05) { bars.push({ x: 0, z: 0, w: 1.9, d: 1.9, y0: y, h: other * SCALE, color: [0.85, 0.65, 0.25], tip: `other GPU memory\n${other.toFixed(1)} GB (KV cache, CUDA context, other apps)` }); y += other * SCALE; }
    const free = Math.max(0, totalGB - usedGB);
    bars.push({ x: 0, z: 0, w: 1.9, d: 1.9, y0: y, h: Math.max(0.02, free * SCALE), color: [0.16, 0.2, 0.3], tip: `free headroom\n${free.toFixed(1)} GB (${((free / totalGB) * 100).toFixed(0)}%)` });
    const side = [
      { x: 3, label: "util", v: (g.util_pct || 0) / 100, color: lane("util").color, tip: `GPU utilisation\n${g.util_pct ?? 0}%` },
      { x: 5, label: "temp", v: Math.max(0, ((g.temp_c || 20) - 20) / 70), color: lane("temp").color, tip: `GPU temperature\n${g.temp_c ?? "?"} °C` },
      { x: 7, label: "power", v: g.power_limit_w ? (g.power_w || 0) / g.power_limit_w : 0, color: lane("power").color, tip: `power draw\n${(g.power_w ?? 0).toFixed(0)} W of ${g.power_limit_w ?? "?"} W` },
    ];
    side.forEach((s) => bars.push({ x: s.x, z: 0, w: 1.2, d: 1.2, h: Math.max(0.05, s.v * 6), color: s.color, tip: s.tip }));
    vault.setData(bars, { xLabels: [{ x: 0, text: `VRAM ${usedGB.toFixed(1)}/${totalGB.toFixed(0)} GB` }, ...side.map((s) => ({ x: s.x, text: s.label }))], zLabels: [] });
  }
  return { updateSkyline, updateVault, resetView() { sky.resetView(); vault.resetView(); } };
}
