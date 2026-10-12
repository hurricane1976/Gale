/* GALE — fleet particles render worker (review 2026-10-11).
   The comet-dots layer used to draw on the main thread every frame; it now
   runs here on an OffscreenCanvas so the main thread only handles geometry
   (SVG path sampling must stay near the DOM) and live-throughput updates.

   Contract:
     {type:"init",  canvas}  — OffscreenCanvas, transferred; starts the loop
     {type:"trunks", paths}  — sampled trunk geometry, replaces prior set
                               each entry: { pts: Float32Array (x,y pairs),
                               len, opacity, interHost }
     {type:"size",  w, h, dpr}
     {type:"live",  mbps, dimFactor}
     {type:"pause"} / {type:"resume"}
   Visual math is a faithful port of the main-thread renderer it replaces;
   the only approximation is path lookup by sampled points instead of
   getPointAtLength per dot per frame. */

let ctx = null;
let occ = null;
let width = 0, height = 0, dpr = 1;
let trunks = [];      // { pts, cum (Float32Array cumulative lengths), len, opacity, interHost }
let dots = [];
const COLORS = ["34,230,255", "192,132,252", "255,46,196", "0,255,178", "255,176,32"];
const live = { mbps: 0.5, dimFactor: 1 };
let rafId = 0, running = false, last = 0;

function buildCum(pts) {
  const n = pts.length / 2;
  const cum = new Float32Array(n);
  let acc = 0;
  for (let i = 1; i < n; i++) {
    const dx = pts[i * 2] - pts[(i - 1) * 2];
    const dy = pts[i * 2 + 1] - pts[(i - 1) * 2 + 1];
    acc += Math.hypot(dx, dy);
    cum[i] = acc;
  }
  return cum;
}

function pointAt(t, entry) {
  // t in 0..1 along the sampled polyline (euclidean), returns {x, y}
  const pts = entry.pts, cum = entry.cum;
  const n = cum.length;
  if (n < 2) return { x: pts[0] || 0, y: pts[1] || 0 };
  const target = Math.max(0, Math.min(1, t)) * cum[n - 1];
  let lo = 1, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid + 1; else hi = mid;
  }
  const i = Math.max(1, lo);
  const segLen = cum[i] - cum[i - 1] || 1;
  const f = (target - cum[i - 1]) / segLen;
  return {
    x: pts[(i - 1) * 2] + (pts[i * 2] - pts[(i - 1) * 2]) * f,
    y: pts[(i - 1) * 2 + 1] + (pts[i * 2 + 1] - pts[(i - 1) * 2 + 1]) * f,
  };
}

function spawn() {
  const t = trunks[Math.floor(Math.random() * trunks.length)];
  if (!t) return;
  const boost = 0.6 + Math.min(2.4, live.mbps / 2);
  dots.push({
    trunk: t, p: Math.random(), speed: ((40 + Math.random() * 60) * boost) / t.len,
    size: 1 + Math.random() * 1.6, color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
  last = ts;
  ctx.clearRect(0, 0, width / dpr, height / dpr);
  const target = Math.min(26, trunks.length * 4) * (0.5 + Math.min(1.5, live.mbps / 3));
  while (dots.length < target) spawn();
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i];
    const laneDim = d.trunk.interHost ? live.dimFactor : 1;
    if (laneDim <= 0.2 && Math.random() < 0.9) { dots.splice(i, 1); continue; }
    d.p += d.speed * d.trunk.len * dt * 0.06;
    if (d.p > 1) { dots.splice(i, 1); continue; }
    const pt = pointAt(d.p, d.trunk);
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

function loop(ts) {
  if (!running) return;
  frame(ts);
  rafId = requestAnimationFrame(loop);
}

function start() {
  if (running || !ctx) return;
  running = true;
  last = 0;
  rafId = requestAnimationFrame(loop);
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

self.onmessage = (event) => {
  const msg = event.data || {};
  if (msg.type === "init") {
    occ = msg.canvas;
    ctx = occ.getContext("2d");
    dpr = msg.dpr || 1;
    start();
  } else if (msg.type === "trunks") {
    trunks = (msg.paths || []).map((p) => ({ pts: p.pts, cum: buildCum(p.pts), len: p.len, opacity: p.opacity, interHost: !!p.interHost }));
    dots = dots.filter((d) => trunks.includes(d.trunk));
  } else if (msg.type === "size") {
    width = msg.w; height = msg.h; dpr = msg.dpr || dpr;
    // the transferred OffscreenCanvas owns its bitmap: resize it here, not on
    // the placeholder element (setting .width on a transferred canvas throws)
    if (occ) { occ.width = Math.max(1, Math.round(width * dpr)); occ.height = Math.max(1, Math.round(height * dpr)); }
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  } else if (msg.type === "live") {
    live.mbps = msg.mbps; live.dimFactor = msg.dimFactor;
  } else if (msg.type === "pause") stop();
  else if (msg.type === "resume") start();
};
