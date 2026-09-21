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

/* ---- wind-streak canvas: DPR-aware, pauses when hidden, one static
   frame under reduced motion, gentle cursor gusts ---- */
export function initStormCanvas() {
  const canvas = document.getElementById("storm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let parts = [];
  let rafId = 0;
  let running = true;
  const mouse = { x: -1e4, y: -1e4 };

  const spawn = (w, h) => {
    const n = Math.floor((w * h) / 16000) + 30;
    return Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0.5 + Math.random() * 1.6,
      vy: (Math.random() - 0.5) * 0.45,
      w: 0.5 + Math.random() * 1.5,
      a: 0.06 + Math.random() * 0.22,
      ph: Math.random() * Math.PI * 2,
    }));
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = spawn(w, h);
    if (REDUCED) drawStatic(w, h);
  };

  const streak = (p) => {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 5.5, p.y - p.vy * 5.5);
    ctx.lineWidth = p.w;
    ctx.strokeStyle = `rgba(127, 184, 224, ${p.a})`;
    ctx.stroke();
  };

  const drawStatic = (w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts.slice(0, 46)) streak(p);
  };

  const tick = () => {
    if (!running) return;
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 67600 && d2 > 0.01) {           // gust: push away within 260px
        const d = Math.sqrt(d2);
        const f = ((260 - d) / 260) * 0.55;
        p.vx -= (dx / d) * f; p.vy -= (dy / d) * f;
      }
      p.ph += 0.014;
      p.vx += (1.05 - p.vx) * 0.012;            // relax to base wind
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy + Math.sin(p.ph) * 0.22;
      if (p.x > w + 12) { p.x = -12; p.y = Math.random() * h; }
      if (p.x < -12) p.x = w + 12;
      if (p.y > h + 12) p.y = -12;
      if (p.y < -12) p.y = h + 12;
      streak(p);
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
export function initParallax() {
  const wrap = document.querySelector(".scene-wrap");
  if (!wrap || !FINE || REDUCED) return;
  const groups = wrap.querySelectorAll("[data-depth]");
  if (!groups.length) return;
  let rafId = 0;
  wrap.addEventListener("pointermove", (e) => {
    if (rafId) return;
    rafId = raf(() => {
      rafId = 0;
      const r = wrap.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      groups.forEach((g) => {
        const d = parseFloat(g.dataset.depth) || 0;
        g.style.transform = `translate(${(mx * d * 18).toFixed(1)}px, ${(my * d * 11).toFixed(1)}px)`;
      });
    });
  }, { passive: true });
  wrap.addEventListener("pointerleave", () => groups.forEach((g) => (g.style.transform = "")), { passive: true });
}

/* ---- shared boot for both pages ---- */
export function boot() {
  initStormCanvas();
  initReveals();
  initProgressFallback();
  initCountUps();
  initPointerCards();
  initClocks();
  initParallax();
}
