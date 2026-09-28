/* GALE — fleet particles: comet dots flowing along the topology's trunk
   paths (canvas layer under the svg, Tidal's fleet-particles pattern).
   Skipped entirely under reduced motion. Spawn rate + speed scale with
   measured tailscale throughput (status.json, 60s refresh); the four faint
   inter-host trunks (static markup, opacity <= .5, outside the roster
   islands) dim out while any remote host's liveness sweep is down.
   Decor that reports, not just decorates. */
import { isDataSaver } from "./shared.js";
const canvas = document.querySelector(".fleet-particles");
const wrap = document.querySelector(".fleet-topo-wrap");
const svg = document.querySelector(".fleet-topo-svg");
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let SAVER = false;
try { SAVER = isDataSaver(); } catch { /* standalone fallback below */ }

if (canvas && wrap && svg && !REDUCED && !SAVER) {
  const ctx = canvas.getContext("2d");
  let trunks = [];

  function collectTrunks() {
    trunks = [];
    svg.querySelectorAll(".tide-current-wash").forEach((path) => {
      try {
        const len = path.getTotalLength();
        if (len < 40) return; // skip degenerate stubs
        const op = parseFloat(path.getAttribute("opacity") || "0.4");
        // inter-host heuristic: the faint (<= .5) static trunks lead off
        // the gale-host mesh to the remote clusters; the roster islands
        // never rewrite these paths, so index-free opacity test is stable.
        trunks.push({ path, len, opacity: op, interHost: op <= 0.5 });
      } catch { /* not renderable yet */ }
    });
  }

  function syncSize() {
    const r = wrap.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    collectTrunks();
  }

  const COLORS = ["34,230,255", "192,132,252", "255,46,196", "0,255,178", "255,176,32"];
  const dots = [];
  // live coupling (#1): spawn/speed follow tailscale Mb/s; dimFactor mutes
  // the inter-host trunks while a remote host is down. Refreshed below.
  const live = { mbps: 0.5, dimFactor: 1 };
  async function measure() {
    try {
      const s = await fetch("api/status.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const ifs = (s && s.network && s.network.interfaces) || [];
      const ts = ifs.find((i) => /tailscale/i.test(i.name || ""));
      if (ts) live.mbps = Math.max(0, (ts.rx_mbps || 0) + (ts.tx_mbps || 0));
    } catch { /* keep last rate */ }
    try {
      const m = await fetch("api/fleet/metrics", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const fs = (m && m.fleet_status) || {};
      const remoteDown = Object.entries(fs).some(([host, info]) =>
        host !== "Gale" && !(info.state || "").startsWith("up"));
      live.dimFactor = remoteDown ? 0.15 : 1;
    } catch { /* keep last dim */ }
  }
  function spawn() {
    const t = trunks[Math.floor(Math.random() * trunks.length)];
    if (!t) return;
    const boost = 0.6 + Math.min(2.4, live.mbps / 2);
    dots.push({
      trunk: t, p: Math.random(), speed: ((40 + Math.random() * 60) * boost) / t.len, // px-ish
      size: 1 + Math.random() * 1.6, color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const target = Math.min(26, trunks.length * 4) * (0.5 + Math.min(1.5, live.mbps / 3));
    while (dots.length < target) spawn();
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      const laneDim = d.trunk.interHost ? live.dimFactor : 1;
      if (laneDim <= 0.2 && Math.random() < 0.9) { dots.splice(i, 1); continue; }
      d.p += d.speed * d.trunk.len * dt * 0.06;
      if (d.p > 1) { dots.splice(i, 1); continue; }
      const pt = d.trunk.path.getPointAtLength(d.p * d.trunk.len);
      const tail = 10;
      const dim = d.trunk.interHost ? live.dimFactor : 1;
      const grad = ctx.createLinearGradient(pt.x - tail, pt.y, pt.x, pt.y);
      grad.addColorStop(0, `rgba(${d.color},0)`);
      grad.addColorStop(1, `rgba(${d.color},${0.55 * d.trunk.opacity * 2 * dim})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.size;
      ctx.beginPath();
      ctx.moveTo(pt.x - tail, pt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(${d.color},${0.9 * d.trunk.opacity * 2 * dim})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  syncSize();
  new ResizeObserver(syncSize).observe(wrap);
  measure();
  setInterval(measure, 60000);
  let rafId = 0, running = true;
  const loop = (ts) => { if (!running) return; frame(ts); rafId = requestAnimationFrame(loop); };
  document.addEventListener("visibilitychange", () => {
    const visible = document.visibilityState === "visible";
    if (visible && !running) { running = true; last = 0; rafId = requestAnimationFrame(loop); }
    else if (!visible && running) { running = false; cancelAnimationFrame(rafId); }
  });
  rafId = requestAnimationFrame(loop);
}
