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
   wind slant; soft cloud-bank clumps drift across the top of the sky;
   occasional jagged lightning bolts with a soft glow. ---- */
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

  const spawnClouds = (w, h) => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => ({
      x: (w / n) * i + Math.random() * (w / n),
      y: -30 + Math.random() * h * 0.35,
      rx: 170 + Math.random() * 210,
      ry: 52 + Math.random() * 52,
      vx: 0.08 + Math.random() * 0.18,
      a: 0.32 + Math.random() * 0.38,
      g: 26 + ((i * 13) % 4),
    }));
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

  const cloud = (c) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.rx, c.ry);
    const g = ctx.createRadialGradient(0, 0.2, 0.1, 0, 0.2, 1);
    g.addColorStop(0, `rgba(125, 150, 196, ${c.a})`);
    g.addColorStop(0.55, `rgba(104, 128, 175, ${c.a * 0.62})`);
    g.addColorStop(1, "rgba(90, 112, 158, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, c.g, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
      if (c.x - c.rx > w) c.x = -c.rx;
      cloud(c);
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
