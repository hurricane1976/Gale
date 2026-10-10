/* GALE — pulse wall: the fleet heartbeat as one WebGL strip. Four host
   lanes recede into depth; each carries the shared ECG waveform with a
   bright pulse head and a decaying trail that travels at the host's beat
   rate (fresh = brisk, stale = slow), and warn/crit lanes fall back and
   desaturate. Data comes from heartbeat.js's render (same telemetry
   summary, zero extra requests). No WebGL, coarse pointers, reduced
   motion or data-saver: nothing mounts and the per-card SVG ECGs stay.
   Node-safe: no top-level DOM access (render-test imports stay green). */

import { program, Quality, dprCap, createGraphicsHud, motionPaused } from "./shared-gl.js";

const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

const LINE_VS = `
attribute vec3 a_pos; attribute vec4 a_color;
uniform mat4 u_mvp; varying vec4 v_col;
void main() { gl_Position = u_mvp * vec4(a_pos, 1.0); v_col = a_color; }`;
const LINE_FS = `precision mediump float; varying vec4 v_col;
void main() { gl_FragColor = vec4(v_col.rgb, v_col.a); }`;

// soft gaussian point sprite for the pulse heads (same trick as topology3d)
const PT_VS = `
attribute vec3 a_pos; attribute vec3 a_color;
uniform mat4 u_mvp; uniform float u_size; varying vec3 v_color;
void main() { gl_Position = u_mvp * vec4(a_pos, 1.0); gl_PointSize = u_size; v_color = a_color; }`;
const PT_FS = `precision mediump float; varying vec3 v_color;
void main() { vec2 d = gl_PointCoord - vec2(0.5); float a = exp(-dot(d, d) * 14.0) * 0.6;
  gl_FragColor = vec4(v_color * a, a); }`;

const perspective = (fov, asp, n, f) => {
  const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
  o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = (2 * f * n) / (n - f);
  return o;
};
const lookAt = (e, c) => {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
  let xx = -zz, xy = 0, xz = zx, xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xz /= xl; // right = up x fwd, up = (0,1,0)
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
};
const mul = (a, b) => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
};

/* the shared ECG complex (heartbeat.js BEAT path, viewBox 400x40) as a
   normalized point list: one beat of width 1, baseline 0, amplitude ±1 */
const BEAT_PTS = [[0, 0], [0.26, 0], [0.29, -0.167], [0.32, 0], [0.39, 0], [0.42, 0.333], [0.46, -1.0], [0.50, 1.0], [0.54, 0], [0.62, 0], [0.67, 0.333], [0.73, 0], [1, 0]];

const LEVELS = {
  ok: { rgb: [0.184, 0.659, 0.455], fade: 0, back: 0 },
  warn: { rgb: [0.851, 0.588, 0.169], fade: 0.4, back: 0.5 },
  crit: { rgb: [0.898, 0.282, 0.302], fade: 0.65, back: 1.0 },
};
const GREY = [0.45, 0.52, 0.62];
const LANE_LEN = 26, LANE_AMP = 0.55, BEATS = 15, SEGS = 10; // SEGS = segments per beat
const TRAIL = 1.7; // trail length in beat units

export function initPulseWall(canvas) {
  if (typeof document === "undefined") return null;
  if (REDUCED || document.documentElement.dataset.saver === "1") return null;
  if (matchMedia("(pointer: coarse)").matches || innerWidth < 700) return null; // cards keep their SVG ECGs
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) return null;
  let lineProg, ptProg;
  try {
    lineProg = program(gl, LINE_VS, LINE_FS, "pulsewall/line");
    ptProg = program(gl, PT_VS, PT_FS, "pulsewall/pt");
  } catch { return null; }

  const q = new Quality();
  const hud = createGraphicsHud(canvas, "pulsewall", q);
  let lastFrame = 0, lastRumSample = 0, frameN = 0, raf = 0, visible = true, running = true, contextLost = false;
  let hover = -1;
  const LANES = 4;
  const lanes = Array.from({ length: LANES }, (_, i) => ({
    z0: -i * 2.3, z: -i * 2.3,
    y0: (i - 1.5) * 0.42, // explicit vertical stagger (front lane lowest): four distinct rows in depth
    rgb: GREY.slice(), alpha: 0.55,
    period: 1.6, u: (0.22 + i * 0.31) % 1, // staggered phase so the wall never strobes
    flash: 0, // brightness bloom when the host logs a mesh event (gale:activity-event)
  }));
  let laneData = [];

  // per lane: a triangle-strip ribbon along the tiled waveform; verts [x,y,z,r,g,b,a]
  const vertsPerLane = (BEATS * SEGS + 1) * 2;
  const lineData = new Float32Array(LANES * vertsPerLane * 7);
  const heads = new Float32Array(LANES * 3), headCols = new Float32Array(LANES * 3);
  const lineBuf = gl.createBuffer(), headBuf = gl.createBuffer(), headColBuf = gl.createBuffer();
  const aPosL = gl.getAttribLocation(lineProg, "a_pos"), aColL = gl.getAttribLocation(lineProg, "a_color");
  const uMvpL = gl.getUniformLocation(lineProg, "u_mvp");
  const aPosP = gl.getAttribLocation(ptProg, "a_pos"), aColP = gl.getAttribLocation(ptProg, "a_color");
  const uMvpP = gl.getUniformLocation(ptProg, "u_mvp"), uSizeP = gl.getUniformLocation(ptProg, "u_size");

  const xAt = (v) => (v / (BEATS * SEGS)) * LANE_LEN - LANE_LEN / 2;
  const waveAt = (bt) => { // bt = position within one beat [0,1)
    const p = bt * (BEAT_PTS.length - 1);
    const i = Math.min(BEAT_PTS.length - 2, Math.floor(p));
    const f = p - i;
    return (BEAT_PTS[i][1] + (BEAT_PTS[i + 1][1] - BEAT_PTS[i][1]) * f) * LANE_AMP;
  };
  const yAt = (v) => waveAt((v / SEGS) % 1);

  function buildLineData() {
    let k = 0;
    for (let l = 0; l < LANES; l++) {
      const L = lanes[l];
      const hoverK = hover === l ? 1.5 : 1;
      const boost = 1 + (L.flash || 0) * 3.2;
      const rgb = L.rgb, a = L.alpha * hoverK * boost;
      const headBeat = L.u * BEATS; // pulse-front position in beat units
      for (let v = 0; v <= BEATS * SEGS; v++) {
        const vBeat = v / SEGS;
        const d = ((headBeat - vBeat) % BEATS + BEATS) % BEATS; // distance behind the front
        const glow = Math.exp(-d * 3.0 / TRAIL);
        const spike = yAt(v) > 0.02 ? 1.3 : 1; // QRS complexes read even when dim
        const e = (0.42 + glow * 2.8) * boost;
        const r = Math.min(1, rgb[0] * e * spike), g = Math.min(1, rgb[1] * e * spike), b = Math.min(1, rgb[2] * e * spike);
        const al = Math.min(1, a * (0.55 + glow * 0.9));
        const y = yAt(v);
        for (const dy of [0, 0.09]) {
          lineData[k++] = xAt(v); lineData[k++] = y + L.y0 + dy * LANE_AMP; lineData[k++] = L.z;
          lineData[k++] = r; lineData[k++] = g; lineData[k++] = b; lineData[k++] = al;
        }
      }
    }
  }

  function resize() {
    const dpr = dprCap((innerWidth < 1200 ? 1.5 : 2) * q.scale());
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 2 || h < 2) return false;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    return true;
  }
  function camMatrix(aspect) {
    const yaw = 0.10 * Math.sin(performance.now() / 5200); // slow drift for depth readability
    const eye = [Math.sin(yaw) * 7.0, 1.55, 7.0 * Math.cos(yaw)];
    return mul(perspective(0.92, aspect, 0.1, 80), lookAt(eye, [0, 0.18, -2.6]));
  }
  function project(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [((m[0] * x + m[4] * y + m[8] * z + m[12]) / w * 0.5 + 0.5) * canvas.width,
            (0.5 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w * 0.5) * canvas.height];
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if (motionPaused()) return;
    if ((frameN++ & 1) && q.tier >= 2) return; // tier-2 rescue: 30 fps
    const nowMs = performance.now();
    const fdt = lastFrame ? Math.min(100, Math.max(1, nowMs - lastFrame)) : 16.7;
    q.tick(fdt, nowMs); lastFrame = nowMs;
    hud.update(nowMs, lanes.length);
    if (nowMs - lastRumSample >= 15000) { window.__galeRUMRecord?.("SCENE_FPS", q.fps(), "fps", "pulsewall"); lastRumSample = nowMs; }
    if (!resize()) return;
    const dt = fdt / 1000;
    for (const L of lanes) {
      L.u = (L.u + dt / L.period) % 1; // one lap per beat cycle
      if (L.flash) L.flash = Math.max(0, L.flash - dt * 0.8); // event bloom decays ~1.2 s
    }
    buildLineData();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const m = camMatrix(gl.drawingBufferWidth / gl.drawingBufferHeight);
    gl.useProgram(lineProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPosL); gl.vertexAttribPointer(aPosL, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(aColL); gl.vertexAttribPointer(aColL, 4, gl.FLOAT, false, 28, 12);
    gl.uniformMatrix4fv(uMvpL, false, m);
    for (let l = 0; l < LANES; l++) gl.drawArrays(gl.TRIANGLE_STRIP, l * vertsPerLane, vertsPerLane);
    // pulse heads: one additive halo + crisp core per lane at the wave front
    const dpr = canvas.width / canvas.clientWidth;
    for (let l = 0; l < LANES; l++) {
      const L = lanes[l];
      heads[l * 3] = L.u * LANE_LEN - LANE_LEN / 2; heads[l * 3 + 1] = L.y0 + 0.06; heads[l * 3 + 2] = L.z;
      headCols[l * 3] = L.rgb[0]; headCols[l * 3 + 1] = L.rgb[1]; headCols[l * 3 + 2] = L.rgb[2];
    }
    gl.useProgram(ptProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, headBuf); gl.bufferData(gl.ARRAY_BUFFER, heads, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aPosP); gl.vertexAttribPointer(aPosP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, headColBuf); gl.bufferData(gl.ARRAY_BUFFER, headCols, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aColP); gl.vertexAttribPointer(aColP, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(uMvpP, false, m);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniform1f(uSizeP, 30 * dpr);
    gl.drawArrays(gl.POINTS, 0, LANES);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uSizeP, 7 * dpr);
    gl.drawArrays(gl.POINTS, 0, LANES);
  }

  // hover: pick the lane whose projected baseline is nearest the pointer
  const tip = document.createElement("div");
  tip.hidden = true;
  tip.style.cssText = "position:absolute;z-index:4;pointer-events:none;padding:4px 9px;border-radius:8px;white-space:nowrap;" +
    "font:0.7rem var(--font-mono,monospace);color:#e8eefc;background:rgba(12,20,38,.94);border:1px solid rgba(160,185,230,.3)";
  (canvas.parentElement || document.body).appendChild(tip);
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const m = camMatrix(canvas.width / Math.max(1, canvas.height));
    const py = (e.clientY - r.top) * (canvas.height / r.height);
    let best = -1, bd = 56 * 56 * (canvas.height / r.height) ** 2;
    for (let l = 0; l < LANES; l++) {
      const [, sy] = project(m, 0, lanes[l].y0, lanes[l].z);
      const d = (sy - py) ** 2;
      if (d < bd) { bd = d; best = l; }
    }
    hover = best;
    if (best >= 0 && laneData[best]) {
      const d = laneData[best];
      tip.textContent = `${d.host} · ${d.ageText} · ${d.level}`;
      tip.hidden = false;
      tip.style.left = `${Math.min(e.clientX - r.left + 12, r.width - 170)}px`;
      tip.style.top = `${Math.max(e.clientY - r.top - 26, 4)}px`;
    } else tip.hidden = true;
  };
  const onLeave = () => { hover = -1; tip.hidden = true; };
  canvas.style.touchAction = "pan-y"; // vertical scroll always wins on touch
  canvas.addEventListener("pointermove", onMove, { passive: true });
  canvas.addEventListener("pointerleave", onLeave, { passive: true });
  const io = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); syncLoop(); }, { rootMargin: "120px" }) : null;
  if (io) io.observe(canvas);
  function syncLoop() {
    const shouldRun = visible && document.visibilityState === "visible" && !contextLost;
    if (shouldRun && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!shouldRun && running) { running = false; cancelAnimationFrame(raf); }
  }
  document.addEventListener("visibilitychange", syncLoop);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLost = true;
    running = false;
    cancelAnimationFrame(raf);
    hud.status("WebGL context lost · SVG heartbeats active");
    // The per-host SVG heartbeats remain the readable, live fallback.
    canvas.closest("#heartbeat")?.classList.remove("hb-wall-live");
  });

  // mesh events light their host's lane: main.js dispatches gale:activity-event
  // on the home page's SSE push; the lane blooms and decays over ~0.7 s so the
  // wall visibly reacts to the same live feed the pulse list below renders
  window.addEventListener("gale:activity-event", (e) => {
    const host = String((e.detail && e.detail.host) || "").toLowerCase();
    if (!host) return;
    const l = laneData.findIndex((d) => String(d.host || "").toLowerCase() === host);
    if (l >= 0) lanes[l].flash = 1;
  });

  resize();
  if (visible && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
  else running = false;

  return {
    /* list: [{ host, age (hours), ageText, level: ok|warn|crit }] — heartbeat.js
       computes these for its cards; the wall reuses them verbatim. */
    update(list) {
      laneData = list || [];
      for (let l = 0; l < LANES; l++) {
        const d = laneData[l] || {}, L = lanes[l], lv = LEVELS[d.level] || LEVELS.ok;
        L.period = Math.min(4, 1.1 + Math.max(0, d.age || 0) * 0.18); // same formula as the SVG cards
        L.rgb = lv.rgb.map((c, i) => c * (1 - lv.fade) + GREY[i] * lv.fade);
        L.z = L.z0 - lv.back; // unhealthy lanes fall back into the dark
        L.alpha = 0.68 * (1 - lv.fade * 0.4);
      }
    },
    destroy() {
      cancelAnimationFrame(raf); io && io.disconnect(); document.removeEventListener("visibilitychange", syncLoop); tip.remove(); hud.destroy();
    },
  };
}
