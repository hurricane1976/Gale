/* Weather page 3D: a "forecast terrain" -- the next 48 hours (temperature + rain chance lanes, colour by
   temperature) and the 7-day outlook (high / low / rain / UV / wind lanes). Reuses the bars3d renderer and the
   open-meteo payload the page already fetched (hourly + daily). */
import { mountBars3D } from "./bars3d.js";

const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const COLD = [0.3, 0.55, 1.0], MILD = [0.3, 0.85, 0.6], HOT = [1.0, 0.45, 0.3];
const tempColor = (c) => (c < 10 ? lerp(COLD, MILD, Math.max(0, c) / 10) : lerp(MILD, HOT, Math.min(1, (c - 10) / 25)));

export function initWeather3D() {
  const hc = document.getElementById("wx-3d-hourly"), dc = document.getElementById("wx-3d-daily");
  if (!hc || !dc) return null;
  const hv = mountBars3D(hc, { yaw: 0.2, pitch: 0.5, fit: 1.1 }), dv = mountBars3D(dc, { yaw: 0.45, pitch: 0.55, fit: 1.6 });
  if (!hv || !dv) { hv && hv.destroy(); dv && dv.destroy(); return null; }

  function update(f, imperial) {
    const u = (c) => (imperial ? c * 9 / 5 + 32 : c), U = imperial ? "°F" : "°C";
    // hourly: 48 h from now
    const H = f.hourly, nowMs = Date.now();
    let s = H.time.findIndex((tm) => new Date(tm).getTime() >= nowMs - 3600e3); if (s < 0) s = 0;
    const idx = Array.from({ length: Math.min(48, H.time.length - s) }, (_, i) => s + i);
    const temps = idx.map((i) => H.temperature_2m[i]), lo = Math.min(...temps), hi = Math.max(...temps), span = Math.max(hi - lo, 4);
    const bars = [], xLabels = [];
    idx.forEach((i, x) => {
      const when = new Date(H.time[i]);
      const lab = when.toLocaleTimeString([], { hour: "numeric" }), day = when.toLocaleDateString([], { weekday: "short" });
      if (x % 8 === 0) xLabels.push({ x, text: `${day} ${lab}` });
      const c = H.temperature_2m[i], pp = H.precipitation_probability ? H.precipitation_probability[i] ?? 0 : 0;
      bars.push({ x, z: 0, w: 0.8, d: 1.2, h: 0.4 + ((c - lo) / span) * 4.6, color: tempColor(c), tip: `${day} ${lab}\n${Math.round(u(c))}${U}` });
      bars.push({ x, z: 1.8, w: 0.8, d: 1.2, h: Math.max(0.05, (pp / 100) * 4), color: [0.35 + pp / 250, 0.6, 1.0], tip: `${day} ${lab}\nrain chance ${pp}%` });
    });
    hv.setData(bars, { xLabels, zLabels: [{ z: 0, text: "temp" }, { z: 1.8, text: "rain %" }] });

    // daily: 7 days x 5 lanes
    const D = f.daily, days = D.time.length;
    const maxWind = Math.max(1, ...(D.wind_speed_10m_max || [1]));
    const lanes = [
      { name: "high", v: (i) => (D.temperature_2m_max[i] + 10) / 50, tip: (i) => `${Math.round(u(D.temperature_2m_max[i]))}${U} high`, col: (i) => tempColor(D.temperature_2m_max[i]) },
      { name: "low", v: (i) => (D.temperature_2m_min[i] + 10) / 50, tip: (i) => `${Math.round(u(D.temperature_2m_min[i]))}${U} low`, col: (i) => tempColor(D.temperature_2m_min[i]) },
      { name: "rain %", v: (i) => (D.precipitation_probability_max?.[i] ?? 0) / 100, tip: (i) => `rain chance ${D.precipitation_probability_max?.[i] ?? 0}%`, col: () => [0.3, 0.6, 1.0] },
      { name: "UV", v: (i) => (D.uv_index_max?.[i] ?? 0) / 11, tip: (i) => `UV index ${(D.uv_index_max?.[i] ?? 0).toFixed(1)}`, col: () => [0.95, 0.75, 0.2] },
      { name: "wind", v: (i) => (D.wind_speed_10m_max?.[i] ?? 0) / maxWind, tip: (i) => `wind up to ${Math.round(D.wind_speed_10m_max?.[i] ?? 0)} km/h`, col: () => [0.7, 0.55, 0.95] },
    ];
    const dBars = [], dx = [];
    for (let i = 0; i < days; i++) {
      const dn = new Date(D.time[i] + "T12:00").toLocaleDateString([], { weekday: "short" });
      dx.push({ x: i * 1.4, text: dn });
      lanes.forEach((l, z) => dBars.push({ x: i * 1.4, z: z * 1.7, w: 1.0, d: 1.2, h: Math.max(0.06, Math.min(1, l.v(i)) * 5), color: l.col(i), tip: `${dn}\n${l.tip(i)}` }));
    }
    dv.setData(dBars, { xLabels: dx, zLabels: lanes.map((l, z) => ({ z: z * 1.7, text: l.name })) });
  }
  return { update };
}
