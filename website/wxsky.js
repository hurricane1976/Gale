/* GALE — wxsky: the weather page's live conditions window. A 2D canvas
   scene keyed to the same Open-Meteo payload the page already renders:
   day/night sky gradient, sun/moon glow, stars on clear nights, cloud
   bands (amount + darkness from cloud cover / weather code), rain slant
   or snow drift from wind speed AND direction, valley fog for fog codes,
   lightning for thunderstorms, ground hills to anchor the horizon.
   Shares the storm-scene visual grammar (baked sprites, gradient cache)
   but reads real weather, not the fleet's ambient STORM channel.
   Static single bake under reduced motion; skipped for data-saver.
   Node-safe: no top-level DOM access. */

import { REDUCED } from "./shared.js";

/* WMO weather-code buckets the scene reacts to */
const RAIN_LITE = [51, 53, 55, 56, 57], RAIN = [61, 63, 80, 81], RAIN_HEAVY = [65, 66, 67, 82];
const SNOW = [71, 73, 75, 77, 85, 86], FOG = [45, 48], THUNDER = [95, 96, 99];

const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

/* sky palettes: [top, upper-mid, lower-mid, horizon] — day warm/clear vs
   night; overcast blends each stop toward slate grey, storms darker still */
const DAY = [[38, 90, 166], [93, 140, 201], [168, 198, 232], [223, 233, 242]];
const NIGHT = [[5, 8, 20], [10, 16, 34], [20, 29, 52], [24, 34, 58]];
const SLATE = [88, 98, 114];

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyLabel(code) {
  if (THUNDER.includes(code)) return "Thunderstorms";
  if (SNOW.includes(code)) return "Snow";
  if (FOG.includes(code)) return "Fog";
  if (RAIN_HEAVY.includes(code)) return "Heavy rain";
  if (RAIN.includes(code)) return "Rain";
  if (RAIN_LITE.includes(code)) return "Drizzle";
  return ({ 0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast" })[code] || "Current conditions";
}

export function initWxSky() {
  if (typeof document === "undefined") return null;
  const canvas = document.getElementById("wx-sky");
  if (!canvas) return null;
  try {
    if (document.documentElement.dataset.saver === "1") return null;
    if (typeof localStorage !== "undefined" && localStorage.getItem("gale-datasaver") === "1") return null;
  } catch { /* proceed */ }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const caption = document.getElementById("wx-sky-caption");
  const setCaption = (title, detail) => {
    if (!caption) return;
    const strong = caption.querySelector("strong"), small = caption.querySelector("small");
    if (strong) strong.textContent = title;
    if (small) small.textContent = detail;
  };

  const rand = mulberry(20261009);
  let W = 0, H = 0, DPR = 1;
  /* live conditions (updateWxSky); sane defaults so the scene draws before data lands */
  const wx = { day: true, cloud: 0.35, rain: 0, snow: false, storm: 0, fog: 0, wind: 0.15, dirDeg: 0, dark: 0 };
  let stars = [], clouds = [], drops = [], flakes = [], fogs = [], bolts = [];
  let skyKey = "", skyGrad = null;
  let sunSprite = null, sunDisc = null, moonSprite = null, moonDisc = null, starSprite = null, spikeSprite = null, fogSprite = null, vignette = null, hills = null;
  let nextBolt = performance.now() + 6000, flashUntil = 0;
  let visible = true, running = true, raf = 0, lastFrame = 0, t0 = performance.now();

  /* ---- sprites (baked once per resize) ---- */
  const bake = (w, h, draw) => {
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * DPR)); cv.height = Math.max(1, Math.round(h * DPR));
    const c2 = cv.getContext("2d"); c2.scale(DPR, DPR); draw(c2);
    return cv;
  };
  function makeCloudSprite(dark) {
    const R = 60 + rand() * 70, n = 9 + Math.floor(rand() * 6), span = R * 2.9;
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), taper = 0.62 + 0.38 * Math.sin(t * Math.PI);
      puffs.push({
        x: t * span + (rand() - 0.5) * R * 0.5, y: (rand() - 0.55) * R * 0.6,
        r: R * (0.5 + rand() * 0.4) * taper,
        a: 0.3 + rand() * 0.2, lit: Math.max(0, t - 0.3) * 0.9 + 0.2,
      });
    }
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (const p of puffs) {
      minx = Math.min(minx, p.x - p.r); miny = Math.min(miny, p.y - p.r);
      maxx = Math.max(maxx, p.x + p.r); maxy = Math.max(maxy, p.y + p.r);
    }
    const Wc = Math.max(1, Math.ceil(maxx - minx)), Hc = Math.max(1, Math.ceil(maxy - miny));
    const cv = document.createElement("canvas"); cv.width = Wc; cv.height = Hc;
    const c2 = cv.getContext("2d");
    for (const p of puffs) {
      const px = p.x - minx, py = p.y - miny;
      const g = c2.createRadialGradient(px + p.r * 0.2, py - p.r * 0.3, p.r * 0.06, px, py, p.r);
      const top = wx.day ? Math.round(210 + p.lit * 26) : Math.round(96 + p.lit * 26);
      const mid = wx.day ? Math.round(150 + p.lit * 20) : Math.round(62 + p.lit * 18);
      const dk = dark ? 0.82 : 1;
      g.addColorStop(0, rgba([top * dk, top * dk + 5, Math.min(255, top * dk + 24)], p.a));
      g.addColorStop(0.45, rgba([mid * dk, mid * dk + 5, mid * dk + 26], p.a * 0.55));
      g.addColorStop(0.78, rgba([74, 86, 110], p.a * 0.24));
      g.addColorStop(1, rgba([54, 64, 88], 0));
      c2.fillStyle = g;
      c2.beginPath(); c2.arc(px, py, p.r, 0, Math.PI * 2); c2.fill();
    }
    return { cv, w: Wc, h: Hc };
  }
  function bakeSprites() {
    sunSprite = bake(300, 300, (c) => {
      const g = c.createRadialGradient(150, 150, 0, 150, 150, 150);
      g.addColorStop(0, "rgba(255,244,214,0.95)"); g.addColorStop(0.16, "rgba(255,226,160,0.55)");
      g.addColorStop(0.4, "rgba(255,206,120,0.2)"); g.addColorStop(1, "rgba(255,206,120,0)");
      c.fillStyle = g; c.fillRect(0, 0, 300, 300);
    });
    sunDisc = bake(64, 64, (c) => {
      c.fillStyle = "rgba(255,251,235,0.98)";
      c.beginPath(); c.arc(32, 32, 15, 0, Math.PI * 2); c.fill();
    });
    moonSprite = bake(300, 300, (c) => {
      const g = c.createRadialGradient(150, 150, 0, 150, 150, 150);
      g.addColorStop(0, "rgba(214,228,255,0.5)"); g.addColorStop(0.3, "rgba(170,196,240,0.16)");
      g.addColorStop(1, "rgba(170,196,240,0)");
      c.fillStyle = g; c.fillRect(0, 0, 300, 300);
    });
    moonDisc = bake(64, 64, (c) => {
      c.fillStyle = "rgba(236,242,252,0.95)";
      c.beginPath(); c.arc(32, 32, 12, 0, Math.PI * 2); c.fill();
    });
    starSprite = bake(10, 10, (c) => {
      const g = c.createRadialGradient(5, 5, 0, 5, 5, 5);
      g.addColorStop(0, "rgba(226,236,255,1)"); g.addColorStop(0.5, "rgba(226,236,255,0.4)");
      g.addColorStop(1, "rgba(226,236,255,0)");
      c.fillStyle = g; c.fillRect(0, 0, 10, 10);
    });
    spikeSprite = bake(22, 22, (c) => {
      c.strokeStyle = "rgba(226,236,255,0.85)"; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(1, 11); c.lineTo(21, 11); c.moveTo(11, 1); c.lineTo(11, 21); c.stroke();
    });
    fogSprite = bake(256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(170,185,205,1)"); g.addColorStop(1, "rgba(170,185,205,0)");
      c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    });
    vignette = bake(W, H, (c) => {
      const g = c.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.34, W / 2, H * 0.4, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(3,6,14,0)"); g.addColorStop(1, "rgba(3,6,14,0.42)");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
  }
  /* rolling hills: two layered silhouettes, green-slate by day, near-black by night */
  function bakeHills() {
    const horizon = H * 0.74;
    const hill = (baseY, amp, col) => {
      const pts = [];
      const n = Math.max(12, Math.floor(W / 90));
      const v = Array.from({ length: 5 }, () => 0.2 + rand() * 0.8);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const e = v[0] * Math.sin(t * Math.PI) * 0.6
          + v[1] * Math.sin(t * 2.3 + 1) * 0.3 + v[2] * Math.sin(t * 4.1 + 2) * 0.15;
        pts.push([t * W, baseY - Math.abs(e) * amp]);
      }
      return { pts, col };
    };
    hills = [
      hill(horizon - H * 0.02, H * 0.075, null), // col resolved at draw (day/night)
      hill(horizon + H * 0.03, H * 0.05, null),
    ];
  }

  function build() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return; // hidden/not laid out yet
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(320, Math.floor(r.width)); H = Math.max(160, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    skyKey = ""; // recompute gradient
    bakeSprites();
    bakeHills();
    stars = Array.from({ length: Math.floor(W * H / 16000) + 40 }, () => ({
      x: rand() * W, y: rand() * H * 0.5, r: 0.4 + rand() * 1.1, ph: rand() * 6.3, sp: 0.6 + rand() * 1.6,
    }));
    const bands = [
      { n: 4, s: [0.55, 0.8], v: [5, 10], y: [0.04, 0.24] },
      { n: 3, s: [0.85, 1.15], v: [8, 15], y: [0.10, 0.34] },
      { n: 3, s: [1.15, 1.5], v: [12, 22], y: [0.16, 0.44] },
    ];
    clouds = [];
    for (const b of bands) {
      for (let i = 0; i < b.n; i++) {
        const sp = makeCloudSprite(wx.storm > 0 || wx.rain > 0.5);
        clouds.push({
          cv: sp.cv, bw: sp.w, bh: sp.h,
          x: rand() * (W + sp.w) - sp.w, y: H * (b.y[0] + rand() * (b.y[1] - b.y[0])),
          vx: b.v[0] + rand() * (b.v[1] - b.v[0]), s: sp,
          a: 0.55 + rand() * 0.3, bobA: 1.5 + rand() * 2.5, bobS: 0.02 + rand() * 0.03, bobP: rand() * 6.3,
        });
      }
    }
    fogs = Array.from({ length: 3 }, () => ({
      x: rand() * W, y: H * (0.62 + rand() * 0.2), w: W * (0.45 + rand() * 0.5), h: 20 + rand() * 34,
      vx: 4 + rand() * 7, a: 0.05 + rand() * 0.06, ph: rand() * 6.3,
    }));
    drops = []; flakes = [];
    if (REDUCED) drawFrame(true);
  }

  function skyGradient() {
    const key = `${wx.day ? 1 : 0}|${Math.round(wx.cloud * 6)}|${Math.round(wx.dark * 4)}`;
    if (key === skyKey && skyGrad) return skyGrad;
    skyKey = key;
    const night = wx.day ? 0 : 1;
    const cloudT = Math.min(1, wx.cloud * (wx.day ? 0.75 : 0.42) + wx.dark * 0.5);
    skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    for (let i = 0; i < 4; i++) {
      let c = mix3(DAY[i], NIGHT[i], night);
      c = mix3(c, SLATE, cloudT);
      if (wx.dark) c = mix3(c, [30, 34, 44], wx.dark);
      skyGrad.addColorStop(i / 3, rgba(c, 1));
    }
    return skyGrad;
  }

  /* horizontal drift: meteorological wind comes FROM dirDeg, so it blows
     TO dirDeg+180; that direction's x-component moves the scene */
  const driftX = () => Math.sin(((wx.dirDeg + 180) * Math.PI) / 180) * (0.25 + wx.wind);

  function newDrop() {
    const dx = driftX();
    return {
      x: Math.random() * (W + 160) - 80, y: -20 - Math.random() * 40,
      vx: dx * (60 + wx.wind * 190) + (Math.random() - 0.5) * 12,
      vy: 330 + Math.random() * 240, w: 0.7 + Math.random() * 0.9, a: 0.08 + Math.random() * 0.12,
    };
  }
  function newFlake() {
    const dx = driftX();
    return {
      x: Math.random() * (W + 80) - 40, y: -10 - Math.random() * 30,
      vx: dx * (10 + wx.wind * 40), vy: 34 + Math.random() * 42,
      r: 1 + Math.random() * 2, a: 0.25 + Math.random() * 0.4, ph: Math.random() * 6.3,
    };
  }

  function drawBolt(b, now) {
    const t = now - b.born, life = 380;
    if (t < 0 || t > life) return false;
    const a = 1 - t / life;
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const pass = (width, style) => {
      ctx.strokeStyle = style; ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(b.pts[0][0], b.pts[0][1]);
      for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
      ctx.stroke();
    };
    ctx.shadowColor = "rgba(160,185,245,0.9)"; ctx.shadowBlur = 14;
    pass(3.4, rgba([150, 180, 250], a * 0.55));
    pass(1.3, rgba([235, 242, 255], a));
    ctx.restore();
    return true;
  }
  function genBolt() {
    const x0 = W * (0.15 + Math.random() * 0.7), y0 = H * 0.06;
    const ey = H * (0.6 + Math.random() * 0.12), segs = 8 + Math.floor(Math.random() * 4);
    const pts = [[x0, y0]];
    for (let i = 1; i <= segs; i++) pts.push([x0 + (Math.random() - 0.5) * 60, y0 + (ey - y0) * (i / segs)]);
    return { pts, born: performance.now() };
  }

  function drawFrame(staticFrame) {
    const now = performance.now();
    const t = (now - t0) / 1000;
    const dt = staticFrame ? 0.016 : Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = skyGradient(); ctx.fillRect(0, 0, W, H);

    // stars: clear-ish nights only, twinkle
    if (!wx.day && wx.cloud < 0.78) {
      const base = (1 - wx.cloud / 0.78) * 0.75;
      for (const s of stars) {
        const tw = staticFrame ? 0.7 : 0.45 + 0.55 * Math.sin(t * s.sp + s.ph);
        ctx.globalAlpha = base * tw;
        const d = s.r * 4;
        ctx.drawImage(starSprite, s.x - d / 2, s.y - d / 2, d, d);
        if (s.r > 1.15) { ctx.globalAlpha = base * tw * 0.4; ctx.drawImage(spikeSprite, s.x - s.r * 5, s.y - s.r * 5, s.r * 10, s.r * 10); }
      }
      ctx.globalAlpha = 1;
    }
    // sun / moon: a broad glow that survives cloud, and a crisp disc that
    // only shows when the sky is clear enough to actually see it
    const bx = W * 0.78, by = H * 0.22;
    const glowA = wx.day ? Math.max(0.08, (1 - wx.cloud * 0.75) * 0.9) : Math.max(0.3, 1 - wx.cloud * 0.55);
    ctx.globalAlpha = glowA;
    ctx.drawImage(wx.day ? sunSprite : moonSprite, bx - 130, by - 130, 260, 260);
    const discA = wx.day ? Math.max(0, 1 - wx.cloud * 1.25) : Math.max(0, 1 - wx.cloud * 0.95);
    if (discA > 0.03) {
      ctx.globalAlpha = discA;
      ctx.drawImage(wx.day ? sunDisc : moonDisc, bx - 22, by - 22, 44, 44);
    }
    ctx.globalAlpha = 1;

    // clouds: three bands, wind-driven, storm bellies darker
    const windK = 0.55 + wx.wind * 1.5;
    const sorted = [...clouds].sort((a, b) => a.bw - b.bw);
    const show = Math.round(2 + wx.cloud * 7); // retain open sky even on a cloudy day
    const far = sorted.slice(0, Math.ceil(show / 2)), near = sorted.slice(Math.ceil(show / 2), show);
    const drawCloud = (c) => {
      c.x += c.vx * windK * 0.016 * (wx.snow ? 0.6 : 1);
      if (c.x > W + 8) { c.x = -c.bw - 8; c.y = H * (0.04 + Math.random() * 0.4); }
      if (c.x < -c.bw - 8) { c.x = W + 8; c.y = H * (0.04 + Math.random() * 0.4); }
      ctx.globalAlpha = Math.min(0.82, c.a * (0.24 + wx.cloud * 0.58));
      ctx.drawImage(c.cv, c.x, c.y + Math.sin(t * c.bobS * 8 + c.bobP) * c.bobA);
    };
    for (const c of far) drawCloud(c);
    ctx.globalAlpha = 1;

    // horizon fog band + hills
    for (const f of fogs) {
      f.x += f.vx * 0.016 * windK;
      if (f.x - f.w > W) f.x = -f.w;
      ctx.globalAlpha = Math.min(1, f.a * (0.7 + wx.fog * 1.6) * (wx.day ? 0.8 : 0.55));
      ctx.drawImage(fogSprite, f.x, f.y - f.h, f.w, f.h * 2);
    }
    ctx.globalAlpha = 1;
    if (hills) {
      const gcol = wx.day ? mix3([42, 62, 50], SLATE, wx.cloud * 0.5) : mix3([9, 14, 13], SLATE, wx.cloud * 0.35);
      for (const h of hills) {
        ctx.beginPath(); ctx.moveTo(-4, H + 4);
        for (const [px, py] of h.pts) ctx.lineTo(px, py);
        ctx.lineTo(W + 4, H + 4); ctx.closePath();
        ctx.fillStyle = rgba(gcol.map((v) => v * (h === hills[0] ? 1.25 : 0.8)), 1);
        ctx.fill();
      }
    }

    for (const c of near) drawCloud(c);
    ctx.globalAlpha = 1;

    // precipitation: rain streaks slanted by wind, or drifting snow
    if (wx.rain > 0.05 && !wx.snow) {
      const n = Math.round(wx.rain * 150 * (0.45 + wx.wind * 0.55));
      while (drops.length < n) drops.push(newDrop());
      if (drops.length > n) drops.length = n;
      ctx.lineCap = "round";
      for (const p of drops) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > H * 0.86 || p.x > W + 60 || p.x < -60) Object.assign(p, newDrop());
        ctx.strokeStyle = `rgba(168,196,238,${(p.a * (0.5 + wx.rain * 0.5)).toFixed(3)})`;
        ctx.lineWidth = p.w;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    } else if (wx.snow) {
      const n = Math.round((0.25 + wx.rain) * 90);
      while (flakes.length < n) flakes.push(newFlake());
      if (flakes.length > n) flakes.length = n;
      for (const p of flakes) {
        p.x += (p.vx + Math.sin(t * 1.3 + p.ph) * 9) * dt; p.y += p.vy * dt;
        if (p.y > H * 0.88 || p.x > W + 30 || p.x < -30) Object.assign(p, newFlake());
        ctx.globalAlpha = p.a;
        ctx.fillStyle = "rgba(240,246,255,0.9)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // thunderstorm: occasional branched bolt + scene flash
    if (wx.storm > 0) {
      if (now >= nextBolt) {
        bolts.push(genBolt());
        flashUntil = now + 170;
        nextBolt = now + (4200 + Math.random() * 5200) / wx.storm;
      }
      bolts = bolts.filter((b) => drawBolt(b, now));
      if (now < flashUntil) {
        const k = (flashUntil - now) / 170;
        const g = ctx.createRadialGradient(W * 0.5, H * 0.16, 0, W * 0.5, H * 0.16, W * 0.62);
        g.addColorStop(0, rgba([210, 226, 255], 0.16 * k)); g.addColorStop(1, "rgba(210,226,255,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.drawImage(vignette, 0, 0, W, H);
  }

  function frame() {
    if (!running) return;
    if (!hills) { build(); if (!hills) return; } // not laid out yet (canvas hidden at init)
    try { drawFrame(false); } catch (e) {
      try { console.warn("wxsky:", e.message); } catch { /* noop */ }
    }
    raf = requestAnimationFrame(frame);
  }

  function loopOn() {
    if (REDUCED || !running) { running = false; return; }
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  let rsz = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(rsz); rsz = requestAnimationFrame(() => { build(); loopOn(); });
  }, { passive: true });
  const io = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible && !running && !REDUCED) { running = true; raf = requestAnimationFrame(frame); }
      else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
    }, { rootMargin: "120px" }) : null;
  if (io) io.observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" && running) { running = false; cancelAnimationFrame(raf); }
    else if (document.visibilityState === "visible" && visible && !REDUCED) { running = true; raf = requestAnimationFrame(frame); }
  });

  build();
  loopOn();

  return {
    /* cur/daily: the open-meteo `current` and `daily` blocks weather.js renders */
    update(cur, daily) {
      if (!cur) return;
      const code = Number(cur.weather_code) || 0;
      wx.day = !!cur.is_day;
      wx.cloud = Math.min(1, Math.max(0.06, ((cur.cloud_cover ?? 40) / 100)));
      wx.rain = RAIN_LITE.includes(code) ? 0.3 : RAIN.includes(code) ? 0.6 : RAIN_HEAVY.includes(code) ? 1 : THUNDER.includes(code) ? 0.8
        : cur.precipitation > 0 ? Math.min(0.8, 0.3 + cur.precipitation / 10) : 0;
      wx.snow = SNOW.includes(code);
      wx.storm = THUNDER.includes(code) ? 1 : 0;
      wx.fog = FOG.includes(code) ? 1 : 0;
      wx.dark = THUNDER.includes(code) ? 0.55 : RAIN_HEAVY.includes(code) || code === 63 ? 0.25 : 0;
      wx.wind = Math.min(1.5, (cur.wind_speed_10m ?? 0) / 60);
      wx.dirDeg = cur.wind_direction_10m ?? 0;
      this._liveCaption = ["Current conditions", `${skyLabel(code)} · ${Math.round(cur.wind_speed_10m ?? 0)} km/h wind · ${Math.round(cur.cloud_cover ?? 0)}% cloud`];
      if (!this._saved) setCaption(...this._liveCaption);
      // the sky stays honest about night even if is_day is missing: sunset/sunrise bracket
      if (cur.is_day === undefined && daily && daily.sunrise && daily.sunset) {
        const nowMin = Date.now(), rise = new Date(daily.sunrise[0]).getTime(), set = new Date(daily.sunset[0]).getTime();
        wx.day = nowMin >= rise && nowMin <= set;
      }
      build(); loopOn(); // palette changed: re-bake
    },
    /* preview(day): hover a row of the 7-day outlook and the sky plays that
       day's conditions (daytime for previews — night is unknowable from a
       daily row). preview(null) restores the live current conditions. */
    preview(day) {
      if (!day) {
        if (!this._saved) return;
        Object.assign(wx, this._saved);
        this._saved = null;
        build(); loopOn();
        if (this._liveCaption) setCaption(...this._liveCaption);
        return;
      }
      if (!this._saved) this._saved = { day: wx.day, cloud: wx.cloud, rain: wx.rain, snow: wx.snow, storm: wx.storm, fog: wx.fog, dark: wx.dark, wind: wx.wind };
      const code = Number(day.code) || 0;
      wx.day = true; // previews show the day the row describes
      wx.cloud = FOG.includes(code) ? 0.95
        : THUNDER.includes(code) || RAIN_HEAVY.includes(code) ? 0.92
        : RAIN.includes(code) || SNOW.includes(code) ? 0.8
        : RAIN_LITE.includes(code) ? 0.6
        : code === 3 ? 0.9 : code === 2 ? 0.5 : code === 1 ? 0.25 : 0.1;
      wx.rain = RAIN_LITE.includes(code) ? 0.3 : RAIN.includes(code) ? 0.6 : RAIN_HEAVY.includes(code) ? 1 : THUNDER.includes(code) ? 0.8 : 0;
      wx.snow = SNOW.includes(code);
      wx.storm = THUNDER.includes(code) ? 1 : 0;
      wx.fog = FOG.includes(code) ? 1 : 0;
      wx.dark = THUNDER.includes(code) ? 0.55 : RAIN_HEAVY.includes(code) ? 0.25 : 0;
      wx.wind = Math.min(1.5, (day.windKmh ?? 0) / 60);
      setCaption("Forecast preview", `${skyLabel(code)} · peak wind ${Math.round(day.windKmh ?? 0)} km/h`);
      build(); loopOn();
    },
  };
}

/* module-level singleton for weather.js's lazy hook */
let view = null;
export function updateWxSky(cur, daily) {
  if (typeof document === "undefined") return;
  if (!view) {
    const ready = () => {
      try { view = initWxSky(); } catch { view = null; }
      if (view) view.update(cur, daily);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
    else ready();
    return;
  }
  view.update(cur, daily);
}
export function previewWxSky(day) {
  if (view) view.preview(day);
}
