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
    initScrub(nodes);
    // no WebGL / reduced motion / data-saver: the canvas never opens, so drop the empty panel
    setTimeout(() => { const c = document.getElementById("topo-3d-canvas"); if (c && c.hidden) fail(); }, 2500);
  } catch { fail(); }
}


/* ---- time travel: drag back through the last 24 h in 30-minute steps. At time T an agent counts as "fresh" if it
   logged a run in the previous 7 h (the fleet wakes every 6 h); stale agents dim and the hub labels show fresh/total.
   Data: /api/fleet/telemetry runs (fetched on first use, it is ~1.8 MB). ---- */
const STEP = 30 * 60e3, SPAN = 24 * 3600e3, FRESH_MS = 7 * 3600e3;
function initScrub(nodes) {
  const box = document.getElementById("hostmap-scrub"), range = document.getElementById("scrub-range"),
    out = document.getElementById("scrub-out"), play = document.getElementById("scrub-play");
  if (!box || !range) return;
  box.hidden = false;
  let runs = null, loading = null, timer = 0;
  const load = () => loading || (loading = fetch("api/fleet/telemetry", { cache: "no-store" }).then((r) => r.json()).then((d) => {
    const byAgent = new Map();
    for (const r of d.runs || []) {
      const a = String(r.agent || "").toLowerCase(), t = new Date(r.ts).getTime();
      if (!a || !isFinite(t)) continue;
      if (!byAgent.has(a)) byAgent.set(a, []);
      byAgent.get(a).push(t);
    }
    byAgent.forEach((v) => v.sort((x, y) => x - y));
    runs = byAgent;
  }).catch(() => { runs = new Map(); }));
  const staleAt = (T) => nodes.map((n) => n.name.toLowerCase()).filter((a) => {
    const ts = runs.get(a);
    return !ts || !ts.some((t) => t <= T && T - t <= FRESH_MS);
  });
  const show = async () => {
    const k = Number(range.value);
    if (k >= 48) { out.textContent = "now (live)"; window.dispatchEvent(new CustomEvent("gale:scrub", { detail: { names: null } })); return; }
    await load();
    const T = Date.now() - (48 - k) * STEP, stale = staleAt(T);
    out.textContent = `${new Date(T).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })} \u00b7 ${nodes.length - stale.length}/${nodes.length} fresh`;
    window.dispatchEvent(new CustomEvent("gale:scrub", { detail: { names: stale } }));
  };
  range.addEventListener("input", () => { clearInterval(timer); play.textContent = "\u25b6 replay 24h"; show(); });
  play.addEventListener("click", async () => {
    if (timer) { clearInterval(timer); timer = 0; play.textContent = "\u25b6 replay 24h"; return; }
    await load();
    range.value = 0; show(); play.textContent = "\u275a\u275a pause";
    timer = setInterval(() => { range.value = Number(range.value) + 1; show(); if (Number(range.value) >= 48) { clearInterval(timer); timer = 0; play.textContent = "\u25b6 replay 24h"; } }, 350);
  });
}
