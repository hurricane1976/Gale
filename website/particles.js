/* GALE — fleet particles: comet dots flowing along the topology's trunk
   paths (canvas layer under the svg, Tidal's fleet-particles pattern).
   Pure decoration; skipped entirely under reduced motion. */
const canvas = document.querySelector(".fleet-particles");
const wrap = document.querySelector(".fleet-topo-wrap");
const svg = document.querySelector(".fleet-topo-svg");
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && wrap && svg && !REDUCED) {
  const ctx = canvas.getContext("2d");
  let trunks = [];

  function collectTrunks() {
    trunks = [];
    svg.querySelectorAll(".tide-current-wash").forEach((path) => {
      try {
        const len = path.getTotalLength();
        if (len < 40) return; // skip degenerate stubs
        trunks.push({ path, len, opacity: parseFloat(path.getAttribute("opacity") || "0.4") });
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
  function spawn() {
    const t = trunks[Math.floor(Math.random() * trunks.length)];
    if (!t) return;
    dots.push({
      trunk: t, p: Math.random(), speed: (40 + Math.random() * 60) / t.len, // px-ish
      size: 1 + Math.random() * 1.6, color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    ctx.clearRect(0, 0, w, h);
    while (dots.length < Math.min(26, trunks.length * 4)) spawn();
    for (let i = dots.length - 1; i >= 0; i--) {
      const d = dots[i];
      d.p += d.speed * d.trunk.len * dt * 0.06;
      if (d.p > 1) { dots.splice(i, 1); continue; }
      const pt = d.trunk.path.getPointAtLength(d.p * d.trunk.len);
      const tail = 10;
      const grad = ctx.createLinearGradient(pt.x - tail, pt.y, pt.x, pt.y);
      grad.addColorStop(0, `rgba(${d.color},0)`);
      grad.addColorStop(1, `rgba(${d.color},${0.55 * d.trunk.opacity * 2})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = d.size;
      ctx.beginPath();
      ctx.moveTo(pt.x - tail, pt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(${d.color},${0.9 * d.trunk.opacity * 2})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  syncSize();
  new ResizeObserver(syncSize).observe(wrap);
  requestAnimationFrame(frame);
}
