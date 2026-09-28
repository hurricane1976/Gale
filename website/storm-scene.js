/* GALE — storm-mountain night scene (mountainwake-inspired, storm-themed).
   Hero-local canvas: night sky + twinkling stars + moon glow + three
   procedural mountain ridges (atmospheric perspective + snow rims) + three
   bands of realistic volumetric storm clouds + valley fog + forked
   lightning synced to the global --flash lighting channel.

   Keeps the existing lighting: bolts set document --flash 1→0 through the
   shared storm canvas envelope, and this scene reads the same STORM.level
   so cloud darkness / bolt rate / fog density follow live telemetry.
   Node-safe: no top-level DOM access (render-test imports stay green). */
import { STORM, REDUCED } from "./shared.js";

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ridged 1D value noise → mountain skyline, deterministic per seed */
function ridgePath(rand, w, baseY, amp, rough) {
  const pts = [];
  const n = Math.max(24, Math.floor(w / 46));
  const oct = [];
  for (let o = 0; o < 4; o++) {
    const m = 3 + o * 3 + Math.floor(rand() * 3);
    const v = Array.from({ length: m + 2 }, () => rand());
    oct.push({ m, v, a: amp * [0.55, 0.27, 0.12, 0.06][o] });
  }
  const noise = (t) => {
    let s = 0;
    for (const { m, v, a } of oct) {
      const x = t * m;
      const i = Math.floor(x), f = x - i;
      const u = f * f * (3 - 2 * f);
      s += a * (v[i % v.length] * (1 - u) + v[(i + 1) % v.length] * u);
    }
    return s;
  };
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ridged = 1 - Math.abs(2 * noise(t * rough + rough) - 1);
    const peak = Math.pow(ridged, 1.6);
    pts.push([t * w, baseY - peak * amp - noise(t * 3.1) * amp * 0.18]);
  }
  return pts;
}

function traceRidge(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(-4, ctx._h + 4);
  ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(ctx._w + 4, ctx._h + 4);
  ctx.closePath();
}

export function initStormScene() {
  if (typeof document === "undefined") return;
  const hero = document.getElementById("hero");
  const canvas = document.getElementById("storm-scene");
  if (!hero || !canvas || !hero.classList.contains("hero-storm")) return;
  try {
    if (document.documentElement.dataset.saver === "1") return;
    if (typeof localStorage !== "undefined" && localStorage.getItem("gale-datasaver") === "1") return;
  } catch { /* proceed */ }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rand = mulberry(20260928);
  let W = 0, H = 0, DPR = 1;
  let stars = [], clouds = [], fog = [], mist = [], bolts = [];
  let ridges = [];
  let nextBolt = performance.now() + 5000 + Math.random() * 5000;
  let flashUntil = 0, flashSet = false;
  let scrollP = 0, mx = 0.5, my = 0.5;
  let running = true, rafId = 0;
  const now0 = performance.now();

  /* ---- realistic cloud sprite: 10–16 overlapping puffs, moonlit top rim
     (light from the moon at upper-right), dark storm belly, soft falloff.
     Baked once per cloud → per-frame cost is one drawImage. ---- */
  function makeCloudSprite(s, moonX01) {
    const R = (70 + rand() * 80) * s;
    const n = 10 + Math.floor(rand() * 6);
    const span = R * 3.0;
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const taper = 0.62 + 0.38 * Math.sin(t * Math.PI);
      puffs.push({
        x: t * span + (rand() - 0.5) * R * 0.5,
        y: (rand() - 0.58) * R * 0.62,
        r: R * (0.52 + rand() * 0.42) * taper,
        a: 0.30 + rand() * 0.22,
        lit: Math.max(0, (t - 0.35)) * 0.9 + 0.25, // moon side brighter
      });
    }
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (const p of puffs) {
      minx = Math.min(minx, p.x - p.r); miny = Math.min(miny, p.y - p.r);
      maxx = Math.max(maxx, p.x + p.r); maxy = Math.max(maxy, p.y + p.r);
    }
    const Wc = Math.max(1, Math.ceil(maxx - minx)), Hc = Math.max(1, Math.ceil(maxy - miny));
    const cv = document.createElement("canvas");
    cv.width = Wc; cv.height = Hc;
    const c2 = cv.getContext("2d");
    for (const p of puffs) {
      const px = p.x - minx, py = p.y - miny;
      // belly: dark slate → mid grey → moonlit silver rim toward moon
      const g = c2.createRadialGradient(
        px + p.r * 0.22, py - p.r * 0.34, p.r * 0.06, px, py, p.r);
      const top = Math.round(196 + p.lit * 30), mid = Math.round(140 + p.lit * 22);
      g.addColorStop(0, `rgba(${top},${top + 8},${Math.min(255, top + 22)},${p.a})`);
      g.addColorStop(0.45, `rgba(${mid},${mid + 10},${mid + 32},${p.a * 0.55})`);
      g.addColorStop(0.75, `rgba(74,88,116,${p.a * 0.28})`);
      g.addColorStop(1, "rgba(52,64,90,0)");
      c2.fillStyle = g;
      c2.beginPath(); c2.arc(px, py, p.r, 0, Math.PI * 2); c2.fill();
      // wispy turbulence: 2 small offset puffs break the round edge
      for (let k = 0; k < 2; k++) {
        const wx = px + (rand() - 0.5) * p.r * 1.6, wy = py + (rand() - 0.5) * p.r;
        const wr = p.r * (0.22 + rand() * 0.2);
        const wg = c2.createRadialGradient(wx, wy, 0, wx, wy, wr);
        wg.addColorStop(0, `rgba(160,178,208,${p.a * 0.35})`);
        wg.addColorStop(1, "rgba(160,178,208,0)");
        c2.fillStyle = wg;
        c2.beginPath(); c2.arc(wx, wy, wr, 0, Math.PI * 2); c2.fill();
      }
    }
    return { cv, w: Wc, h: Hc };
  }

  function build() {
    const r = hero.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(320, Math.floor(r.width));
    H = Math.max(420, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx._w = W; ctx._h = H;

    stars = Array.from({ length: Math.floor(W * H / 9000) + 90 }, () => ({
      x: rand() * W, y: rand() * H * 0.55,
      r: 0.4 + rand() * 1.2, ph: rand() * Math.PI * 2,
      sp: 0.6 + rand() * 1.8, warm: rand() < 0.18,
    }));

    const horizon = H * 0.62;
    ridges = [
      { pts: ridgePath(rand, W, horizon + H * 0.02, H * 0.16, 1.0), fill: "#232c44", snow: 0.30, par: 0.05 },
      { pts: ridgePath(rand, W, horizon + H * 0.10, H * 0.20, 1.35), fill: "#171e33", snow: 0.22, par: 0.10 },
      { pts: ridgePath(rand, W, horizon + H * 0.22, H * 0.24, 1.7), fill: "#0b0f1f", snow: 0.12, par: 0.17 },
    ];

    const bands = [
      { n: 5, s: [0.55, 0.8], v: [5, 11], a: [0.5, 0.7], y: [0.02, 0.22] },
      { n: 4, s: [0.85, 1.2], v: [9, 18], a: [0.65, 0.85], y: [0.06, 0.32] },
      { n: 3, s: [1.2, 1.6], v: [15, 27], a: [0.75, 0.95], y: [0.10, 0.42] },
    ];
    clouds = [];
    for (const b of bands) {
      for (let i = 0; i < b.n; i++) {
        const sp = makeCloudSprite(0.55 + rand() * 0.65, 0.78);
        clouds.push({
          cv: sp.cv, bw: sp.w, bh: sp.h,
          x: rand() * (W + sp.w) - sp.w, y: H * (b.y[0] + rand() * (b.y[1] - b.y[0])),
          yMin: b.y[0], yMax: b.y[1],
          vx: b.v[0] + rand() * (b.v[1] - b.v[0]),
          a: b.a[0] + rand() * (b.a[1] - b.a[0]),
          bobA: 2 + rand() * 4, bobS: 0.02 + rand() * 0.03, bobP: rand() * Math.PI * 2,
        });
      }
    }
    fog = Array.from({ length: 4 }, (_, i) => ({
      x: rand() * W, y: horizon + H * (0.08 + rand() * 0.16),
      w: W * (0.5 + rand() * 0.5), h: 26 + rand() * 42,
      vx: 4 + rand() * 8, a: 0.05 + rand() * 0.06, ph: rand() * 6,
    }));
    mist = Array.from({ length: 40 }, () => ({
      x: rand() * W, y: rand() * H, r: 0.8 + rand() * 2.2,
      vx: 6 + rand() * 14, vy: -2 - rand() * 4, a: 0.04 + rand() * 0.08,
    }));
    if (REDUCED) drawStatic();
  }

  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#04060c");
    g.addColorStop(0.42, "#0a1120");
    g.addColorStop(0.62, "#131c33");
    g.addColorStop(0.78, "#1a2440");
    g.addColorStop(1, "#0d1322");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function moon(t) {
    const x = W * 0.76 + (mx - 0.5) * -14, y = H * 0.20 + (my - 0.5) * -10;
    const R = Math.min(W, H) * 0.055 + 26;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, R * 4.2);
    halo.addColorStop(0, "rgba(214,228,255,0.5)");
    halo.addColorStop(0.25, "rgba(170,196,240,0.18)");
    halo.addColorStop(1, "rgba(170,196,240,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - R * 4.2, y - R * 4.2, R * 8.4, R * 8.4);
    const disc = ctx.createRadialGradient(x - R * 0.25, y - R * 0.25, R * 0.1, x, y, R);
    disc.addColorStop(0, "#f4f7ff");
    disc.addColorStop(0.8, "#d7e2f7");
    disc.addColorStop(1, "rgba(215,226,247,0.85)");
    ctx.fillStyle = disc;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    return { x, y, R };
  }

  function ridge(layer, scrollOff) {
    const dx = (mx - 0.5) * -22 * layer.par * 10 + scrollOff * layer.par;
    ctx.save();
    ctx.translate(dx, scrollOff * layer.par * 0.6);
    traceRidge(ctx, layer.pts);
    ctx.fillStyle = layer.fill;
    ctx.fill();
    // snow rim: light catch on the skyline edge facing the moon
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(layer.pts[0][0], layer.pts[0][1]);
    for (let i = 1; i < layer.pts.length; i++) ctx.lineTo(layer.pts[i][0], layer.pts[i][1]);
    ctx.strokeStyle = `rgba(214,226,246,${layer.snow})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function bolt(w, h) {
    const x0 = w * 0.2 + Math.random() * w * 0.6;
    const y0 = h * 0.08 + Math.random() * h * 0.1;
    const depth = h * (0.3 + Math.random() * 0.3);
    const segs = 7 + Math.floor(Math.random() * 5);
    const pts = [[x0, y0]];
    let x = x0;
    for (let i = 1; i <= segs; i++) {
      x += (Math.random() - 0.55) * 44;
      pts.push([x, y0 + (depth * i) / segs]);
    }
    return { pts, born: performance.now(), life: 260 };
  }

  function drawBolt(b, alpha) {
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.shadowColor = "rgba(160,185,245,0.9)"; ctx.shadowBlur = 18;
    ctx.strokeStyle = `rgba(222,234,255,${alpha})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function frame() {
    if (!running) return;
    const t = (performance.now() - now0) / 1000;
    const w = W, h = H;
    ctx.clearRect(0, 0, w, h);
    sky();

    // stars with twinkle, dimmed by storm level
    const starA = 1 - STORM.level * 0.45;
    for (const s of stars) {
      const tw = 0.45 + 0.55 * Math.sin(t * s.sp + s.ph);
      ctx.fillStyle = s.warm
        ? `rgba(255,220,180,${(0.5 * tw * starA).toFixed(3)})`
        : `rgba(210,226,255,${(0.6 * tw * starA).toFixed(3)})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    const m = moon(t);

    // clouds behind ridges first (far half), then ridges, then near clouds
    const sorted = [...clouds].sort((a, b) => a.bw - b.bw);
    const far = sorted.slice(0, Math.ceil(sorted.length / 2));
    const near = sorted.slice(Math.ceil(sorted.length / 2));
    const windK = 0.5 + STORM.wind * 1.4;

    for (const c of far) {
      c.x += c.vx * windK * 0.016;
      if (c.x > w + 8) { c.x = -c.bw - 8; c.y = h * (c.yMin + Math.random() * (c.yMax - c.yMin)); }
      ctx.globalAlpha = c.a * (0.55 + STORM.level * 0.45);
      ctx.drawImage(c.cv, c.x + (mx - 0.5) * -18, c.y + Math.sin(t * c.bobS * 8 + c.bobP) * c.bobA);
    }
    ctx.globalAlpha = 1;

    ridge(ridges[0], scrollP * 40);
    ridge(ridges[1], scrollP * 80);

    // valley fog between mid and near ridge
    for (const f of fog) {
      f.x += f.vx * 0.016 * windK;
      if (f.x - f.w > w) f.x = -f.w;
      const g = ctx.createRadialGradient(f.x + f.w / 2, f.y, 0, f.x + f.w / 2, f.y, f.w / 2);
      g.addColorStop(0, `rgba(150,170,200,${(f.a * (0.6 + STORM.level * 0.6)).toFixed(3)})`);
      g.addColorStop(1, "rgba(150,170,200,0)");
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(0, Math.sin(t * 0.3 + f.ph) * 3);
      ctx.fillRect(f.x, f.y - f.h, f.w, f.h * 2);
      ctx.restore();
    }

    for (const c of near) {
      c.x += c.vx * windK * 0.016;
      if (c.x > w + 8) { c.x = -c.bw - 8; c.y = h * (c.yMin + Math.random() * (c.yMax - c.yMin)); }
      const dark = 0.5 + STORM.level * 0.5;
      ctx.globalAlpha = Math.min(1, c.a * dark + 0.1);
      ctx.drawImage(c.cv, c.x + (mx - 0.5) * -30, c.y + Math.sin(t * c.bobS * 8 + c.bobP) * c.bobA);
      // lightning underlight: warm belly glow while flash is live
      if (performance.now() < flashUntil) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.22 * ((flashUntil - performance.now()) / 170);
        ctx.drawImage(c.cv, c.x + (mx - 0.5) * -30, c.y + 8);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    ridge(ridges[2], scrollP * 130);

    // drifting mist sparks in the foreground
    ctx.fillStyle = "rgba(190,210,240,0.5)";
    for (const p of mist) {
      p.x += p.vx * 0.016 * windK; p.y += p.vy * 0.016;
      if (p.x > w + 4) { p.x = -4; p.y = Math.random() * h; }
      if (p.y < -4) p.y = h + 4;
      ctx.globalAlpha = p.a;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
    ctx.globalAlpha = 1;

    // lightning
    const now = performance.now();
    if (now >= nextBolt) {
      bolts.push(bolt(w, h));
      flashUntil = now + 180;
      try {
        document.documentElement.style.setProperty("--flash", "1");
        flashSet = true;
      } catch { /* noop */ }
      nextBolt = now + (5200 + Math.random() * 5200) / (0.6 + STORM.level * 2.2);
    }
    bolts = bolts.filter((b) => now - b.born < b.life);
    for (const b of bolts) {
      drawBolt(b, Math.max(0, 1 - (now - b.born) / b.life) * 0.95);
    }
    if (now < flashUntil) {
      const k = (flashUntil - now) / 180;
      const g = ctx.createRadialGradient(w * 0.5, h * 0.15, 0, w * 0.5, h * 0.15, w * 0.6);
      g.addColorStop(0, `rgba(205,222,255,${(0.20 * k).toFixed(3)})`);
      g.addColorStop(1, "rgba(205,222,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      try {
        document.documentElement.style.setProperty("--flash", k.toFixed(2));
        flashSet = true;
      } catch { /* noop */ }
    } else if (flashSet) {
      flashSet = false;
      try { document.documentElement.style.removeProperty("--flash"); } catch { /* noop */ }
    }

    rafId = requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    sky();
    for (const s of stars.slice(0, 120)) {
      ctx.fillStyle = "rgba(210,226,255,0.5)";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    moon(0);
    for (const c of clouds.slice(0, 8)) {
      ctx.globalAlpha = c.a;
      ctx.drawImage(c.cv, c.x, c.y);
    }
    ctx.globalAlpha = 1;
    ridge(ridges[0], 0); ridge(ridges[1], 0); ridge(ridges[2], 0);
  }

  build();
  if (REDUCED) return;

  let rsz = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(rsz);
    rsz = requestAnimationFrame(build);
  }, { passive: true });
  window.addEventListener("scroll", () => {
    const r = hero.getBoundingClientRect();
    scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  }, { passive: true });
  window.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    if (e.clientY > r.bottom + 200 || e.clientY < r.top - 200) return;
    mx = e.clientX / Math.max(1, window.innerWidth);
    my = e.clientY / Math.max(1, window.innerHeight);
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    const vis = document.visibilityState === "visible";
    if (vis && !running) { running = true; rafId = requestAnimationFrame(frame); }
    else if (!vis && running) { running = false; cancelAnimationFrame(rafId); }
  });

  rafId = requestAnimationFrame(frame);
}
