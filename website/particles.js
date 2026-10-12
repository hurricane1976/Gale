/* GALE — fleet particles: comet dots flowing along the topology's trunk
   paths (canvas layer under the svg, Tidal's fleet-particles pattern).
   Skipped entirely under reduced motion. Spawn rate + speed scale with
   measured tailscale throughput (status.json, 60s refresh); the four faint
   inter-host trunks (static markup, opacity <= .5, outside the roster
   islands) dim out while any remote host's liveness sweep is down.
   Decor that reports, not just decorates.

   Renderer lives in fleet-particles-worker.js on an OffscreenCanvas where
   the browser supports it (review 2026-10-11): the main thread only samples
   SVG trunk geometry (DOM-bound) and forwards live-throughput updates.
   Same-file main-thread fallback keeps older engines identical. */
import { isDataSaver } from "./shared.js";
const canvas = document.querySelector(".fleet-particles");
const wrap = document.querySelector(".fleet-topo-wrap");
const svg = document.querySelector(".fleet-topo-svg");
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let SAVER = false;
try { SAVER = isDataSaver(); } catch { /* standalone fallback below */ }

if (canvas && wrap && svg && !REDUCED && !SAVER) {
  const live = { mbps: 0.5, dimFactor: 1 };
  const workerSupported = typeof Worker !== "undefined"
    && typeof OffscreenCanvas !== "undefined"
    && typeof canvas.transferControlToOffscreen === "function";
  let worker = null;

  // SVG-bound geometry: sample each trunk path into point arrays so the
  // worker never needs DOM access. ~8px resolution is visually identical
  // for comet dots and costs nothing at refresh time.
  function sampleTrunks() {
    const paths = [];
    svg.querySelectorAll(".tide-current-wash").forEach((path) => {
      try {
        const len = path.getTotalLength();
        if (len < 40) return; // skip degenerate stubs
        const op = parseFloat(path.getAttribute("opacity") || "0.4");
        // inter-host heuristic: the faint (<= .5) static trunks lead off
        // the gale-host mesh to the remote clusters; the roster islands
        // never rewrite these paths, so index-free opacity test is stable.
        const interHost = op <= 0.5;
        const n = Math.max(8, Math.min(400, Math.round(len / 8)));
        const pts = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) {
          const pt = path.getPointAtLength((i / (n - 1)) * len);
          pts[i * 2] = pt.x; pts[i * 2 + 1] = pt.y;
        }
        paths.push({ pts, len, opacity: op, interHost });
      } catch { /* not renderable yet */ }
    });
    return paths;
  }

  // DPR cap (#77): raw devicePixelRatio hit 3x on modern phones while every
  // other scene caps — 3x particles at 3x pixels for decoration
  const PART_DPR_CAP = 2;
  const partDpr = () => Math.min(devicePixelRatio || 1, PART_DPR_CAP);
  function syncSize() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (worker) worker.postMessage({ type: "size", w, h, dpr: partDpr() });
    return { w, h };
  }

  if (workerSupported) {
    worker = new Worker(new URL("./fleet-particles-worker.js", import.meta.url), { type: "module" });
    const off = canvas.transferControlToOffscreen();
    const { w, h } = syncSize(); // syncSize already posts size; the duplicate init-time post is gone (#77)
    worker.postMessage({ type: "init", canvas: off, dpr: partDpr() }, [off]);
    worker.postMessage({ type: "trunks", paths: sampleTrunks() });
    new ResizeObserver(() => {
      const size = syncSize();
      worker.postMessage({ type: "trunks", paths: sampleTrunks() });
      return size;
    }).observe(wrap);
  }

  async function measure() {
    try {
      const s = await fetch("/api/status.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const ifs = (s && s.network && s.network.interfaces) || [];
      const ts = ifs.find((i) => /tailscale/i.test(i.name || ""));
      if (ts) live.mbps = Math.max(0, (ts.rx_mbps || 0) + (ts.tx_mbps || 0));
    } catch { /* keep last rate */ }
    try {
      const m = await fetch("/api/fleet/metrics", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const fs = (m && m.fleet_status) || {};
      const remoteDown = Object.entries(fs).some(([host, info]) =>
        host !== "Gale" && !(info.state || "").startsWith("up"));
      live.dimFactor = remoteDown ? 0.15 : 1;
    } catch { /* keep last dim */ }
    if (worker) worker.postMessage({ type: "live", mbps: live.mbps, dimFactor: live.dimFactor });
  }

  if (worker) {
    measure();
    setInterval(measure, 60000);
    document.addEventListener("visibilitychange", () => {
      worker.postMessage({ type: document.visibilityState === "visible" ? "resume" : "pause" });
    });
  } else {
    /* ---- main-thread fallback: identical renderer, unchanged behavior ---- */
    const ctx = canvas.getContext("2d");
    let trunks = [];
    function collectTrunks() {
      trunks = [];
      svg.querySelectorAll(".tide-current-wash").forEach((path) => {
        try {
          const len = path.getTotalLength();
          if (len < 40) return;
          const op = parseFloat(path.getAttribute("opacity") || "0.4");
          trunks.push({ path, len, opacity: op, interHost: op <= 0.5 });
        } catch { /* not renderable yet */ }
      });
    }
    function syncSizeFallback() {
      const dpr = partDpr();
      const r = wrap.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      collectTrunks();
    }
    const COLORS = ["34,230,255", "192,132,252", "255,46,196", "0,255,178", "255,176,32"];
    const dots = [];
    function spawn() {
      // length-weighted pick (#87): uniform-per-trunk overrepresented stubs
      const total = trunks.reduce((s, t) => s + t.len, 0);
      let r = Math.random() * total, t = trunks[0];
      for (const cand of trunks) { r -= cand.len; if (r <= 0) { t = cand; break; } }
      if (!t) return;
      const boost = 0.6 + Math.min(2.4, live.mbps / 2);
      dots.push({
        trunk: t, p: Math.random(), speed: ((40 + Math.random() * 60) * boost) / t.len,
        size: 1 + Math.random() * 1.6,
        // stable hue per trunk (#87): lanes read as lanes
        color: COLORS[trunks.indexOf(t) % COLORS.length],
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
        // tangent tail (#86): fallback samples behind the head along the
        // path too (getPointAtLength only for the small tail sample)
        const pt = d.trunk.path.getPointAtLength(d.p * d.trunk.len);
        const back = d.trunk.path.getPointAtLength(Math.max(0, (d.p * d.trunk.len) - 8));
        const dim = d.trunk.interHost ? live.dimFactor : 1;
        const grad = ctx.createLinearGradient(back.x, back.y, pt.x, pt.y);
        grad.addColorStop(0, `rgba(${d.color},0)`);
        grad.addColorStop(1, `rgba(${d.color},${0.55 * d.trunk.opacity * 2 * dim})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = d.size;
        ctx.beginPath();
        ctx.moveTo(back.x, back.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${d.color},${0.9 * d.trunk.opacity * 2 * dim})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    syncSizeFallback();
    new ResizeObserver(syncSizeFallback).observe(wrap);
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
}
