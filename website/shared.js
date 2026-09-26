/* GALE — shared behaviours (vanilla ES module, no framework, no build step).
   Everything here is additive enhancement: pages are fully readable with
   JS off, and every animation respects the global reduced-motion switch. */

export const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
export const raf = (fn) => requestAnimationFrame(fn);

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const pad2 = (n) => String(n).padStart(2, "0");
const ENT = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "#39" };
export const esc = (s) => s.replace(/[&<>"']/g, (c) => "&" + ENT[c] + ";");

/* ---- storm canvas: DPR-aware, pauses when hidden, one static frame under
   reduced motion, gentle cursor gusts. Rain falls steeply with a light
   wind slant; drifting clouds in three depth bands (soft pre-rendered puff
   sprites, parallax speed + size + opacity, gentle bob); occasional jagged
   lightning bolts with a soft glow. ---- */
export function initStormCanvas() {
  const canvas = document.getElementById("storm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let parts = [];
  let clouds = [];
  let bolts = [];
  let nextBolt = performance.now() + 4000 + Math.random() * 5000;
  let rafId = 0;
  let running = true;
  let flashUntil = 0;
  const mouse = { x: -1e4, y: -1e4 };

  const spawn = (w, h) => {
    const n = Math.floor((w * h) / 9000) + 40;
    return Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0.35 + Math.random() * 0.75,
      vy: 2.5 + Math.random() * 2.2,
      w: 0.6 + Math.random() * 1.0,
      a: 0.09 + Math.random() * 0.17,
      ph: Math.random() * Math.PI * 2,
    }));
  };

  const rr = (a) => a[0] + Math.random() * (a[1] - a[0]);

  /* depth layers: far = small/slow/faint, near = big/fast/denser.
     palettes: [top highlight, mid body, base shade] */
  const CLOUD_LAYERS = [
    { n: 4, s: [0.5, 0.72], v: [0.04, 0.08], a: [0.45, 0.65], y: [0.0, 0.2],
      col: ["168,184,212", "126,146,180", "96,116,150"],
      storm: ["118,136,168", "84,102,134", "62,76,104"] },
    { n: 3, s: [0.8, 1.1], v: [0.09, 0.16], a: [0.6, 0.8], y: [-0.05, 0.28],
      col: ["180,196,226", "136,156,192", "104,126,162"],
      storm: ["126,144,178", "90,108,142", "68,84,112"] },
    { n: 2, s: [1.15, 1.55], v: [0.16, 0.28], a: [0.7, 0.9], y: [-0.1, 0.34],
      col: ["192,206,236", "150,170,204", "118,140,176"],
      storm: ["140,158,190", "102,120,152", "78,94,122"] },
  ];

  const makePuffs = (s) => {
    const R = (64 + Math.random() * 70) * s;
    const n = 6 + Math.floor(Math.random() * 5);
    const span = R * 2.6;
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const taper = 0.72 + 0.28 * Math.sin(t * Math.PI); // flatter ends
      puffs.push({
        x: t * span + (Math.random() - 0.5) * R * 0.4,
        y: (Math.random() - 0.6) * R * 0.55,
        r: R * (0.5 + Math.random() * 0.38) * taper,
        a: 0.26 + Math.random() * 0.2,
      });
    }
    return puffs;
  };

  /* one cloud = pre-rendered sprite of overlapping soft puffs with a light
     top-to-bottom falloff, so per-frame cost is a single drawImage */
  const makeSprite = (puffs, col) => {
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (const p of puffs) {
      minx = Math.min(minx, p.x - p.r); miny = Math.min(miny, p.y - p.r);
      maxx = Math.max(maxx, p.x + p.r); maxy = Math.max(maxy, p.y + p.r);
    }
    const W = Math.max(1, Math.ceil(maxx - minx)), H = Math.max(1, Math.ceil(maxy - miny));
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c2 = cv.getContext("2d");
    for (const p of puffs) {
      const px = p.x - minx, py = p.y - miny;
      const g = c2.createRadialGradient(px, py - p.r * 0.28, p.r * 0.08, px, py, p.r);
      g.addColorStop(0, `rgba(${col[0]}, ${p.a})`);
      g.addColorStop(0.62, `rgba(${col[1]}, ${p.a * 0.5})`);
      g.addColorStop(1, `rgba(${col[2]}, 0)`);
      c2.fillStyle = g;
      c2.beginPath();
      c2.arc(px, py, p.r, 0, Math.PI * 2);
      c2.fill();
    }
    return { cv, w: W, h: H };
  };

  const spawnClouds = (w, h) => {
    const out = [];
    for (const L of CLOUD_LAYERS) {
      for (let i = 0; i < L.n; i++) {
        const pal = Math.random() < 0.32 ? L.storm : L.col;
        const sp = makeSprite(makePuffs(rr(L.s)), pal);
        const y0 = L.y[0], y1 = L.y[1];
        out.push({
          cv: sp.cv, bw: sp.w, bh: sp.h,
          x: Math.random() * (w + sp.w) - sp.w,
          y: h * (y0 + Math.random() * (y1 - y0)),
          yMin: y0, yMax: y1,
          vx: rr(L.v),
          a: rr(L.a),
          bobA: 2 + Math.random() * 3,
          bobS: 0.03 + Math.random() * 0.03,
          bobP: Math.random() * Math.PI * 2,
        });
      }
    }
    return out;
  };

  const makeBolt = (w, h) => {
    const x0 = 70 + Math.random() * Math.max(1, w - 140);
    const y0 = Math.random() * h * 0.14;
    const depth = h * (0.3 + Math.random() * 0.42);
    const segs = 6 + Math.floor(Math.random() * 5);
    const pts = [[x0, y0]];
    let x = x0;
    for (let i = 1; i <= segs; i++) {
      x += (Math.random() - 0.55) * 46;
      pts.push([x, y0 + (depth * i) / segs]);
    }
    let branch = null;
    if (Math.random() < 0.65) {
      const bi = 2 + Math.floor(Math.random() * (segs - 2));
      const bx = pts[bi][0], by = pts[bi][1];
      const bend = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 55);
      branch = [bx, by, bx + bend * 0.4, by + 22, bx + bend, by + 48];
    }
    return { pts, branch, born: performance.now(), life: 240 };
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = spawn(w, h);
    clouds = spawnClouds(w, h);
    if (REDUCED) drawStatic(w, h);
  };

  const raindrop = (p) => {
    const k = 4.6;
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * k, p.y - p.vy * k);
    ctx.lineTo(p.x, p.y);
    ctx.lineWidth = p.w;
    ctx.strokeStyle = `rgba(165, 195, 240, ${p.a})`;
    ctx.stroke();
  };

  const cloud = (c, now = 0) => {
    const y = c.y + Math.sin(now * c.bobS + c.bobP) * c.bobA;
    ctx.globalAlpha = c.a;
    ctx.drawImage(c.cv, c.x, y);
    ctx.globalAlpha = 1;
  };

  const boltPath = (b, alpha) => {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(160, 185, 245, 0.9)";
    ctx.shadowBlur = 16;
    ctx.strokeStyle = `rgba(214, 229, 255, ${alpha})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
    ctx.stroke();
    if (b.branch) {
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(190, 208, 250, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(b.branch[0], b.branch[1]);
      ctx.lineTo(b.branch[2], b.branch[3]);
      ctx.lineTo(b.branch[4], b.branch[5]);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawStatic = (w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (const c of clouds) cloud(c);
    for (const p of parts.slice(0, 60)) raindrop(p);
  };

  const tick = () => {
    if (!running) return;
    const now = performance.now();
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    for (const c of clouds) {
      c.x += c.vx;
      if (c.x > w + 4) {
        c.x = -c.bw - 4;
        c.y = h * (c.yMin + Math.random() * (c.yMax - c.yMin));
      }
      cloud(c, now);
    }

    for (const p of parts) {
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 67600 && d2 > 0.01) {           // gust: push away within 260px
        const d = Math.sqrt(d2);
        const f = ((260 - d) / 260) * 0.4;
        p.vx -= (dx / d) * f;
      }
      p.ph += 0.012;
      p.vx += (0.6 - p.vx) * 0.02;
      p.vy += (3.2 - p.vy) * 0.008;
      p.x += p.vx + Math.sin(p.ph) * 0.18;
      p.y += p.vy;
      if (p.y > h + 14) { p.y = -14; p.x = Math.random() * w; }
      if (p.x > w + 14) p.x = -10;
      if (p.x < -14) p.x = w + 10;
      raindrop(p);
    }

    if (now >= nextBolt) {
      bolts.push(makeBolt(w, h));
      flashUntil = now + 170;
      nextBolt = now + 4200 + Math.random() * 5200;
    }
    bolts = bolts.filter((b) => now - b.born < b.life);
    for (const b of bolts) {
      const t = (now - b.born) / b.life;
      boltPath(b, Math.max(0, 1 - t) * 0.92);
    }
    if (now < flashUntil) {
      ctx.save();
      const fy = bolts.length ? bolts[0].pts[0][1] : 0;
      const g = ctx.createRadialGradient(w * 0.55, fy, 0, w * 0.55, fy, w * 0.5);
      g.addColorStop(0, "rgba(210, 226, 255, 0.22)");
      g.addColorStop(1, "rgba(210, 226, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    rafId = raf(tick);
  };

  window.addEventListener("resize", resize, { passive: true });
  resize();

  if (REDUCED) return;
  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    const visible = document.visibilityState === "visible";
    if (visible && !running) { running = true; rafId = raf(tick); }
    else if (!visible && running) { running = false; cancelAnimationFrame(rafId); }
  });
  rafId = raf(tick);
}

/* ---- reveal: slide-only, one-shot IntersectionObserver ---- */
export function initReveals() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (REDUCED || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* ---- scroll progress: CSS scroll-timeline first; JS only when unsupported ---- */
export function initProgressFallback() {
  const bar = document.getElementById("progress");
  if (!bar) return;
  if (window.CSS && CSS.supports && CSS.supports("animation-timeline", "scroll()")) return;
  if (REDUCED) return;
  document.documentElement.classList.add("progress-js");
  let pending = false;
  const update = () => {
    pending = false;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--p", (h > 0 ? clamp(window.scrollY / h) : 0).toFixed(4));
  };
  window.addEventListener("scroll", () => { if (!pending) { pending = true; raf(update); } }, { passive: true });
  update();
}

/* ---- count-up numbers (reads the static value, keeps prefix/suffix) ---- */
export function initCountUps() {
  if (REDUCED) return;
  const els = document.querySelectorAll("[data-countup]");
  if (!els.length) return;
  const run = (el) => {
    const raw = el.textContent.trim();
    const m = raw.match(/^([^\d,.-]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const [, prefix, numStr, suffix] = m;
    const target = parseFloat(numStr.replace(/,/g, ""));
    if (!isFinite(target)) return;
    const decimals = (numStr.split(".")[1] || "").length;
    const fmt = (v) =>
      prefix + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    const t0 = performance.now();
    const dur = 1150;
    const step = (t) => {
      const p = clamp((t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased);
      if (p < 1) raf(step); else el.textContent = raw;
    };
    raf(step);
  };
  if (!("IntersectionObserver" in window)) return els.forEach(run);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { io.unobserve(e.target); run(e.target); }
      }
    },
    { threshold: 0.5 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---- pointer glow + 3D tilt on cards ---- */
export function initPointerCards() {
  if (!FINE || REDUCED) return;
  document.querySelectorAll("[data-glow]").forEach((card) => {
    let rafId = 0;
    const move = (e) => {
      if (rafId) return;
      rafId = raf(() => {
        rafId = 0;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
        if (card.classList.contains("tilt")) {
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -9;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
          card.style.transform = `perspective(760px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        }
      });
    };
    const leave = () => {
      card.style.transform = "";
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    };
    card.addEventListener("pointermove", move, { passive: true });
    card.addEventListener("pointerleave", leave, { passive: true });
  });
}

/* ---- UTC clock + next-wake countdown + cycle progress bar ---- */
const WAKE_SECONDS = [3000, 24600, 46200, 67800]; // 00:50 06:50 12:50 18:50
export function initClocks() {
  const timeEl = document.querySelector("[data-clock]");
  const nextEl = document.querySelector("[data-nextwake]");
  if (!timeEl || !nextEl) return;
  const barEl = document.querySelector("[data-wakebar]");
  const tick = () => {
    const now = new Date();
    timeEl.textContent = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}`;
    const nowSec = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    let idx = WAKE_SECONDS.findIndex((s) => s > nowSec);
    let left, prev;
    if (idx === -1) { idx = 0; left = WAKE_SECONDS[0] + 86400 - nowSec; prev = WAKE_SECONDS[3] - 86400; }
    else { left = WAKE_SECONDS[idx] - nowSec; prev = idx === 0 ? WAKE_SECONDS[3] - 86400 : WAKE_SECONDS[idx - 1]; }
    const hh = Math.floor(left / 3600), mm = Math.floor((left % 3600) / 60), ss = left % 60;
    const wt = WAKE_SECONDS[idx];
    const hhmmss = `${pad2(Math.floor(wt / 3600))}:${pad2(Math.floor((wt % 3600) / 60))}:${pad2(wt % 60)}`;
    nextEl.textContent = `next wake ${hhmmss} UTC · in ${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
    if (barEl) barEl.style.setProperty("--wake-fill", (clamp((nowSec - prev) / (WAKE_SECONDS[idx] - prev)) * 100).toFixed(1) + "%");
  };
  tick();
  setInterval(tick, 1000);
}

/* ---- hero scene parallax ---- */
/* ---- magnetic buttons: pull toward the pointer, spring back on leave ---- */
export function initMagnetic() {
  const magnets = document.querySelectorAll("[data-magnet]");
  if (!magnets.length || !FINE || REDUCED) return;
  for (const el of magnets) {
    const strength = parseFloat(el.dataset.magnet) || 0.25;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }, { passive: true });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
      el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
    }, { passive: true });
  }
}

/* ---- shared boot for both pages ---- */
export function boot() {
  initStormCanvas();
  initReveals();
  initProgressFallback();
  initCountUps();
  initPointerCards();
  initMagnetic();
  initClocks();
}
