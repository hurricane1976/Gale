/* GALE — storm-mountain night scene (mountainwake-inspired, storm-themed).
   Hero-local canvas: night sky + twinkling stars + moon glow + three
   procedural mountain ridges (atmospheric perspective + snow rims) + three
   bands of realistic volumetric storm clouds + valley fog + wind-slanted
   rain + branched lightning (stepped-leader draw, double return stroke)
   synced to the global --flash lighting channel.

   The storm is the fleet: hosts are laid out alphabetically across the
   ridge skyline; agents with open incidents charge their span, so the next
   bolt seeks it and an ember burns at the strike point (warm for crit,
   electric blue for warn) until the incident resolves. Cloud darkness /
   bolt rate / fog density / rain all follow live telemetry (STORM.level,
   STORM.wind). Node-safe: no top-level DOM access (render-test imports
   stay green). */
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
    /* normalized to 0..1 by the total octave weight: the ridged transform
       below assumes a unit-range input. Un-normalized, 2*noise-1 exploded
       past 1 and Math.pow(negative, 1.6) returned NaN — every skyline
       point was NaN, the ridges silently never rendered (canvas drops NaN
       path points), and any consumer of the skyline got NaN. */
    return s / amp;
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
  let stars = [], clouds = [], fog = [], mist = [], bolts = [], rain = [], meteors = [];
  let ridges = [];
  /* baked static layers: rebuilt only on resize, drawn as one drawImage
     per frame — gradients are never re-created inside the loop */
  let skyLayer = null, moonSprite = null, fogSprite = null, vignette = null;
  let starSprite = null, starWarm = null, spikeSprite = null, emberCrit = null, emberWarn = null;
  let nextBolt = performance.now() + 5000 + Math.random() * 5000;
  let flashUntil = 0, flashSet = false;
  let scrollP = 0, mx = 0.5, my = 0.5;
  let running = true, rafId = 0, lastFrame = 0;
  const now0 = performance.now();
  lastFrame = now0;

  /* ---- geography: the fleet lives in the mountains. Roster (fleet
     metrics) laid out alphabetically across the skyline; open incidents
     (fleet incidents) charge an agent's span so bolts seek it and an ember
     burns until the incident clears. Refreshed ~60s, failures keep last
     known state. Display names on both feeds share one namespace. ---- */
  const geo = { names: [], idx: new Map(), hot: new Map(), weight: 0 };
  const geoX = (name) => {
    const i = geo.idx.get(name);
    return i == null ? null : ((i + 0.5) / geo.names.length) * (W * 0.92) + W * 0.04;
  };
  async function refreshGeo() {
    try {
      const m = await fetch("api/fleet/metrics", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const names = [...new Set((m.per_agent_24h || []).map((a) => a.agent).filter(Boolean))];
      if (names.length) {
        names.sort();
        geo.names = names;
        geo.idx = new Map(names.map((n, i) => [n, i]));
      }
    } catch { /* keep last roster */ }
    try {
      const inc = await fetch("api/fleet/incidents", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const hot = new Map();
      for (const a of (inc && inc.alerts) || []) {
        if (!a.agent) continue;
        const rank = { crit: 3, warn: 2, info: 1 }[a.sev] || 1;
        if (rank > ((hot.get(a.agent) || {}).rank || 0)) hot.set(a.agent, { rank, sev: a.sev });
      }
      geo.hot = hot;
      geo.weight = [...hot.values()].reduce((s, v) => s + v.rank, 0);
    } catch { /* keep last incidents */ }
  }

  /* ---- shooting stars: one meteor per agent wake observed between polls.
     The first fetch baselines silently (no flood when the page opens);
     each later advance spawns a meteor, capped per refresh so a backlog
     replays as a modest shower, never a blizzard. Failed wakes earn
     nothing. ---- */
  const wakesSeen = new Map();
  function spawnMeteor() {
    const fromLeft = Math.random() < 0.5;
    const speed = 700 + Math.random() * 600;
    const ang = (35 + Math.random() * 20) * Math.PI / 180;
    return {
      x: fromLeft ? -40 : W + 40,
      y: H * (0.05 + Math.random() * 0.2),
      vx: (fromLeft ? 1 : -1) * speed * Math.cos(ang),
      vy: speed * Math.sin(ang),
      born: performance.now(), life: 1000 + Math.random() * 500,
      len: 90 + Math.random() * 70,
    };
  }
  function drawMeteor(mt, now) {
    const t = (now - mt.born) / mt.life;
    if (t >= 1) return false;
    const fade = Math.sin(t * Math.PI);
    const hx = mt.x + mt.vx * (now - mt.born) / 1000, hy = mt.y + mt.vy * (now - mt.born) / 1000;
    const k = mt.len / Math.hypot(mt.vx, mt.vy);
    ctx.save();
    ctx.lineCap = "round";
    const g = ctx.createLinearGradient(hx - mt.vx * k, hy - mt.vy * k, hx, hy);
    g.addColorStop(0, "rgba(200,220,255,0)");
    g.addColorStop(1, `rgba(230,240,255,${(0.85 * fade).toFixed(3)})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx - mt.vx * k, hy - mt.vy * k);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.shadowColor = "rgba(190,210,255,0.8)"; ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(240,246,255,${(0.9 * fade).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(hx, hy, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return true;
  }
  async function refreshWakes() {
    let runs = null;
    try {
      const w = await fetch("api/fleet/wakes", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      runs = (w && w.runs) || [];
    } catch { return; /* keep last seen-state */ }
    const latest = new Map();
    for (const r of runs) {
      if (!r.agent || !r.ts || r.is_error) continue;
      const prev = latest.get(r.agent);
      if (!prev || r.ts > prev) latest.set(r.agent, r.ts);
    }
    const baseline = wakesSeen.size === 0;
    let spawned = 0;
    for (const [agent, ts] of latest) {
      const old = wakesSeen.get(agent);
      wakesSeen.set(agent, ts);
      const fresh = old === undefined ? !baseline : ts > old;
      if (fresh && spawned < 4) { meteors.push(spawnMeteor()); spawned++; }
    }
  }

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

  /* bake an offscreen layer at device resolution; draw() works in CSS px */
  function bake(w, h, draw) {
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(w * DPR));
    cv.height = Math.max(1, Math.round(h * DPR));
    const c2 = cv.getContext("2d");
    c2.scale(DPR, DPR);
    draw(c2);
    return cv;
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
    rain = [];

    /* ---- bake the static layers ---- */
    skyLayer = bake(W, H, (c) => {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#04060c"); g.addColorStop(0.42, "#0a1120");
      g.addColorStop(0.62, "#131c33"); g.addColorStop(0.78, "#1a2440");
      g.addColorStop(1, "#0d1322");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });
    const mR = Math.min(W, H) * 0.055 + 26, mS = Math.ceil(mR * 8.4);
    moonSprite = { cv: bake(mS, mS, (c) => {
      const x = mS / 2, y = mS / 2;
      const halo = c.createRadialGradient(x, y, 0, x, y, mR * 4.2);
      halo.addColorStop(0, "rgba(214,228,255,0.5)");
      halo.addColorStop(0.25, "rgba(170,196,240,0.18)");
      halo.addColorStop(1, "rgba(170,196,240,0)");
      c.fillStyle = halo; c.fillRect(0, 0, mS, mS);
      const disc = c.createRadialGradient(x - mR * 0.25, y - mR * 0.25, mR * 0.1, x, y, mR);
      disc.addColorStop(0, "#f4f7ff"); disc.addColorStop(0.8, "#d7e2f7");
      disc.addColorStop(1, "rgba(215,226,247,0.85)");
      c.fillStyle = disc; c.beginPath(); c.arc(x, y, mR, 0, Math.PI * 2); c.fill();
    }), s: mS };
    fogSprite = bake(256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(150,170,200,1)");
      g.addColorStop(1, "rgba(150,170,200,0)");
      c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    });
    const starBake = (rgb) => bake(10, 10, (c) => {
      const g = c.createRadialGradient(5, 5, 0, 5, 5, 5);
      g.addColorStop(0, `rgba(${rgb},1)`);
      g.addColorStop(0.5, `rgba(${rgb},0.4)`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g; c.fillRect(0, 0, 10, 10);
    });
    starSprite = starBake("210,226,255");
    starWarm = starBake("255,220,180");
    spikeSprite = bake(26, 26, (c) => {          // diffraction cross for the brightest stars
      c.strokeStyle = "rgba(210,226,255,0.9)";
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(1, 13); c.lineTo(25, 13);
      c.moveTo(13, 1); c.lineTo(13, 25);
      c.stroke();
    });
    const emberBake = (col) => bake(64, 64, (c) => {
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 30);
      g.addColorStop(0, `rgba(${col},1)`);
      g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    });
    emberCrit = emberBake("255,112,80");
    emberWarn = emberBake("172,198,246");
    vignette = bake(W, H, (c) => {
      const g = c.createRadialGradient(W / 2, H * 0.42, Math.min(W, H) * 0.32, W / 2, H * 0.42, Math.max(W, H) * 0.72);
      g.addColorStop(0, "rgba(3,5,10,0)");
      g.addColorStop(1, "rgba(3,5,10,0.5)");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    });

    if (REDUCED) drawStatic();
  }

  function sky() {
    if (skyLayer) { ctx.drawImage(skyLayer, 0, 0, W, H); return; }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#04060c");
    g.addColorStop(0.42, "#0a1120");
    g.addColorStop(0.62, "#131c33");
    g.addColorStop(0.78, "#1a2440");
    g.addColorStop(1, "#0d1322");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function moon() {
    const x = W * 0.76 + (mx - 0.5) * -14, y = H * 0.20 + (my - 0.5) * -10;
    if (moonSprite) { ctx.drawImage(moonSprite.cv, x - moonSprite.s / 2, y - moonSprite.s / 2, moonSprite.s, moonSprite.s); return; }
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
  }

  /* parallax offset for a ridge layer: the one definition of where the
     skyline sits on screen — bolts and embers reuse it so strikes always
     land exactly on the drawn ridgeline */
  function ridgeOff(layer, scrollOff) {
    return [
      (mx - 0.5) * -22 * layer.par * 10 + scrollOff * layer.par,
      scrollOff * layer.par * 0.6,
    ];
  }

  /* skyline y for ridge-local x (linear interp over the traced points) */
  function ridgeY(layer, x) {
    const pts = layer.pts, n = pts.length - 1;
    const t = Math.min(1, Math.max(0, x / W)) * n;
    const i = Math.min(n - 1, Math.floor(t));
    return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (t - i);
  }

  function ridge(layer, scrollOff) {
    const [dx, dy] = ridgeOff(layer, scrollOff);
    ctx.save();
    ctx.translate(dx, dy);
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

  /* ---- lightning synthesis: a branched channel drawn in three passes
     (glow / core / white-hot, matching the shared storm canvas), revealed
     by a stepped leader climbing down over ~90ms, branches igniting only
     once their attach point is visible, then two return-stroke pulses
     re-brightening the decaying channel. Charged (incident-targeted)
     strikes get an extra branch and a longer burn. ---- */
  const LEADER_MS = 90;
  function genBolt(w, h, strikeX, charged) {
    const [ox, oy] = ridgeOff(ridges[2], scrollP * 130);
    const ex = strikeX != null ? strikeX + ox : ox + (0.05 + Math.random() * 0.9) * W;
    const eyRaw = ridgeY(ridges[2], ex - ox) + oy;
    const ey = Number.isFinite(eyRaw) ? eyRaw : h * 0.66;
    const x0 = ex + (Math.random() - 0.5) * 110;
    const y0 = h * (0.07 + Math.random() * 0.09);
    const drop = ey - y0;
    const segs = 9 + Math.floor(Math.random() * 5);
    const pts = [[x0, y0]];
    for (let i = 1; i <= segs; i++) {
      const tt = i / segs;
      // jitter windows in mid-channel: ends stay pinned (cloud / strike point)
      pts.push([x0 + (ex - x0) * tt + (Math.random() - 0.5) * 52 * Math.sin(tt * Math.PI), y0 + drop * tt]);
    }
    const branches = [];
    const nb = (charged ? 2 : 1) + Math.floor(Math.random() * 2);
    for (let k = 0; k < nb; k++) {
      const i = 2 + Math.floor(Math.random() * (segs - 2));
      const [bx, by] = pts[i];
      const dir = Math.random() < 0.5 ? -1 : 1;
      const bp = [[bx, by]];
      let bxx = bx;
      const bn = 2 + Math.floor(Math.random() * 3);
      for (let j = 1; j <= bn; j++) {
        bxx += dir * (12 + Math.random() * 30);
        bp.push([bxx, by + (drop * (1 - i / segs) * 0.5 * j) / bn]);
      }
      branches.push({ pts: bp, at: i / segs, alpha: 0.5 - k * 0.12 });
    }
    return { pts, branches, born: performance.now(), life: charged ? 520 : 420, charged };
  }

  function boltAlpha(b, now) {
    const t = now - b.born;
    if (t < 0 || t > b.life) return 0;
    if (t < LEADER_MS) return 0.3 + 0.65 * (t / LEADER_MS);
    const dt = t - LEADER_MS;
    const base = Math.max(0, 1 - dt / (b.life - LEADER_MS));
    const rs = Math.exp(-Math.pow((dt - 45) / 26, 2)) * 0.5
             + Math.exp(-Math.pow((dt - 140) / 34, 2)) * 0.38;
    return Math.min(1, 0.55 * base + rs);
  }

  function drawBolt(b, now) {
    const a = boltAlpha(b, now);
    if (a < 0.02) return;
    const lead = Math.min(1, (now - b.born) / LEADER_MS);
    const nMain = Math.max(2, Math.round(lead * (b.pts.length - 1)) + 1);
    ctx.save();
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    const pass = (pts, n, width, style, blur) => {
      if (n < 2) return;
      ctx.shadowBlur = blur;
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };
    ctx.shadowColor = "rgba(160,185,245,0.9)";
    pass(b.pts, nMain, 5.0, `rgba(150,180,250,${(a * 0.5).toFixed(3)})`, 18);
    pass(b.pts, nMain, 2.2, `rgba(224,236,255,${a.toFixed(3)})`, 14);
    pass(b.pts, nMain, 1.0, `rgba(255,255,255,${(a * 0.85).toFixed(3)})`, 0);
    for (const br of b.branches) {
      if (lead <= br.at) continue;
      const frac = Math.min(1, (lead - br.at) / Math.max(0.05, 1 - br.at));
      const n = Math.max(2, Math.round(frac * (br.pts.length - 1)) + 1);
      pass(br.pts, n, 1.4, `rgba(190,208,250,${(a * br.alpha).toFixed(3)})`, 10);
    }
    ctx.restore();
  }

  function newDrop(scatter) {
    const vx = 16 + STORM.wind * 250 * (0.85 + Math.random() * 0.3);
    return {
      x: Math.random() * (W + 140) - 70,
      y: scatter ? Math.random() * H : -20 - Math.random() * 60,
      vx, vy: 360 + Math.random() * 260,
      w: 0.8 + Math.random() * 0.9,
      a: 0.05 + Math.random() * 0.11,
    };
  }

  function frame() {
    if (!running) return;
    try {
      drawFrame();
    } catch (e) {
      // decor must never take the loop down: log, keep breathing
      try { console.warn("storm-scene:", e.message); } catch { /* noop */ }
    }
    rafId = requestAnimationFrame(frame);
  }

  function drawFrame() {
    const now = performance.now();
    const t = (now - now0) / 1000;
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
    lastFrame = now;
    const w = W, h = H;
    ctx.clearRect(0, 0, w, h);
    sky();

    // stars with twinkle, dimmed by storm level
    const starA = 1 - STORM.level * 0.45;
    for (const s of stars) {
      const tw = 0.45 + 0.55 * Math.sin(t * s.sp + s.ph);
      const a = (s.warm ? 0.5 : 0.6) * tw * starA;
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      const d = s.r * 4;
      ctx.drawImage(s.warm ? starWarm : starSprite, s.x - d / 2, s.y - d / 2, d, d);
      if (s.r > 1.25) {                            // brightest few get a diffraction cross
        ctx.globalAlpha = a * 0.4;
        const sd = s.r * 14;
        ctx.drawImage(spikeSprite, s.x - sd / 2, s.y - sd / 2, sd, sd);
      }
    }
    ctx.globalAlpha = 1;

    moon();

    // shooting stars: one per agent wake observed since the last poll
    meteors = meteors.filter((mt) => drawMeteor(mt, now));

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
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.a * (0.6 + STORM.level * 0.6));
      ctx.translate(0, Math.sin(t * 0.3 + f.ph) * 3);
      ctx.drawImage(fogSprite, f.x, f.y - f.h, f.w, f.h * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

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

    // incident embers: one per agent carrying an open alert, burning on its
    // skyline span until the incident clears. Crit burns warm (gale-warning
    // red), warn burns electric blue. The storm points at the problem.
    if (geo.hot.size) {
      const [ox, oy] = ridgeOff(ridges[2], scrollP * 130);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const [name, v] of geo.hot) {
        const x = geoX(name);
        if (x == null) continue;
        const gx = x + ox, gy = ridgeY(ridges[2], x) + oy;
        if (!Number.isFinite(gx) || !Number.isFinite(gy)) continue;
        const pulse = 0.72 + 0.28 * Math.sin(t * 2.2 + x * 0.05);
        const crit = v.rank >= 3;
        ctx.globalAlpha = 0.6 * pulse;
        ctx.drawImage(crit ? emberCrit : emberWarn, gx - 32, gy - 32, 64, 64);
      }
      ctx.restore();
    }

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

    // wind-slanted rain: density follows storm level, slant follows wind
    const rainN = STORM.level > 0.12 ? Math.round(30 + 190 * STORM.level) : 0;
    while (rain.length < rainN) rain.push(newDrop(true));
    if (rain.length > rainN) rain.length = rainN;
    for (const p of rain) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y > h * 0.92 || p.x > w + 40) Object.assign(p, newDrop(false));
      ctx.strokeStyle = `rgba(165,195,240,${(p.a * STORM.rain).toFixed(3)})`;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // lightning: ~2/3 of strikes seek a charged (incident) span, weighted
    // by severity; the rest fall where the sky pleases. All bolts land on
    // the near ridgeline.
    if (now >= nextBolt) {
      let strikeX = null, charged = false;
      if (geo.weight && Math.random() < 0.68) {
        let r = Math.random() * geo.weight;
        for (const [name, v] of geo.hot) {
          r -= v.rank;
          if (r <= 0) { strikeX = geoX(name); charged = strikeX != null; break; }
        }
        if (!charged) strikeX = null;
      }
      bolts.push(genBolt(w, h, strikeX, charged));
      flashUntil = now + 180;
      try {
        document.documentElement.style.setProperty("--flash", "1");
        flashSet = true;
      } catch { /* noop */ }
      nextBolt = now + (5200 + Math.random() * 5200) / (0.6 + STORM.level * 2.2);
    }
    bolts = bolts.filter((b) => now - b.born < b.life);
    for (const b of bolts) drawBolt(b, now);
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

    if (vignette) ctx.drawImage(vignette, 0, 0, W, H);
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

  refreshGeo();
  setInterval(refreshGeo, 60000);
  refreshWakes();
  setInterval(refreshWakes, 45000);
  rafId = requestAnimationFrame(frame);
}
