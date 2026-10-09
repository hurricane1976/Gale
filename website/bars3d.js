/* GALE — bars3d: a small WebGL "city" renderer for bar fields (spend landscape, GPU skyline, VRAM vault).
   One lit-box program, no libraries. Orbit (drag), zoom (wheel / pinch), hover tooltip, grow-in animation,
   projected axis labels, idle drift. Phones/coarse pointers run a lite mode (30 fps, capped DPR) and keep
   vertical page scroll (touch-action: pan-y). Returns null when WebGL is unavailable so the caller can hide
   the panel; reduced motion gets a static scene (no growth, no drift).

   mountBars3D(canvas, { yLabel }) -> { setData(bars, meta), destroy() }
     bar  = { x, z, h, y0?, w?, d?, color:[r,g,b], tip:"line1\nline2" }   (world units; h = height)
     meta = { xLabels:[{x,text}], zLabels:[{z,text}] }                      (edge labels, keep to <= ~14 each) */

import { program, Quality, dprCap, LIGHT } from "./shared-gl.js";

const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

const VS = `attribute vec3 a_pos; attribute vec3 a_nrm; attribute vec3 a_col;
uniform mat4 u_mvp; varying vec3 v_col; varying vec3 v_n; varying float v_d;
void main() { gl_Position = u_mvp * vec4(a_pos, 1.0); v_col = a_col; v_n = a_nrm; v_d = gl_Position.w; }`;
const FS = `precision mediump float; varying vec3 v_col; varying vec3 v_n; varying float v_d;
uniform vec3 u_light; uniform float u_fog; uniform float u_alpha;
void main() {
  float l = max(dot(normalize(v_n), normalize(u_light)), 0.0);
  vec3 c = v_col * (0.34 + 0.78 * l);
  float f = clamp((v_d - u_fog) / (u_fog * 1.5), 0.0, 0.6);
  gl_FragColor = vec4(mix(c, vec3(0.03, 0.05, 0.10), f), u_alpha);
}`;

const perspective = (fov, asp, n, f) => {
  const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
  o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = (2 * f * n) / (n - f);
  return o;
};
const lookAt = (e, c, u) => {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
  let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx, xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
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

export function mountBars3D(canvas, opts = {}) {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: true });
  if (!gl) return null;
  let prog;
  try {
    prog = program(gl, VS, FS, "bars3d");
  } catch { return null; }
  const LITE = (matchMedia && matchMedia("(pointer: coarse)").matches) || innerWidth < 700;
  if (LITE) canvas.style.touchAction = "pan-y";
  /* runtime quality: measured fps shrinks backing resolution (and skips
     frames at tier 2+) instead of stuttering; frozen for reduced motion */
  const q = REDUCED ? null : new Quality();
  let lastFrame = 0;

  const aPos = gl.getAttribLocation(prog, "a_pos"), aNrm = gl.getAttribLocation(prog, "a_nrm"), aCol = gl.getAttribLocation(prog, "a_col");
  const uMvp = gl.getUniformLocation(prog, "u_mvp"), uLight = gl.getUniformLocation(prog, "u_light"), uFog = gl.getUniformLocation(prog, "u_fog"), uAlpha = gl.getUniformLocation(prog, "u_alpha");
  const boxBuf = gl.createBuffer(), gridBuf = gl.createBuffer(), shadowBuf = gl.createBuffer();

  let bars = [], meta = {}, cur = [], tgt = [], hover = -1, hoverK = 0;
  let boxCount = 0, gridCount = 0, shadowCount = 0, dirty = true;
  let center = [0, 0, 0], extent = 6, topY = 1, grow = 0, growStart = 0;
  let yaw = opts.yaw ?? 0.5, pitch = opts.pitch ?? 0.5, dist = 12, userDist = false, sway = 0, lastInteract = performance.now(), visible = true, running = true, contextLost = false, frameN = 0, raf = 0;
  let dragging = false, lx = 0, ly = 0, down = [0, 0];
  let vyaw = 0, vpitch = 0, inertia = false, lastMoveT = 0; // flick momentum (rad/ms)
  const pointers = new Map(); let pinch0 = 0, dist0 = 0;

  // overlay: edge labels + tooltip (textContent only)
  const host = canvas.parentElement;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2";
  const tip = document.createElement("div");
  tip.hidden = true;
  tip.style.cssText = "position:absolute;z-index:4;pointer-events:none;padding:6px 10px;border-radius:8px;white-space:pre;" +
    "font:0.72rem/1.4 var(--font-mono,monospace);color:#e8eefc;background:rgba(12,20,38,.94);border:1px solid rgba(160,185,230,.3)";
  host.appendChild(layer); host.appendChild(tip);
  let labelEls = [];

  const pushFace = (out, p, n, c) => { for (const v of p) out.push(v[0], v[1], v[2], n[0], n[1], n[2], c[0], c[1], c[2]); };
  function buildBoxes() {
    const out = [];
    const lift = Math.min(0.35, topY * 0.05) * hoverK; // eased hover rise (pick() uses the same)
    bars.forEach((b, i) => {
      const w = (b.w ?? 0.8) / 2, d = (b.d ?? 0.8) / 2, y0 = b.y0 || 0, y1 = y0 + Math.max(0.001, cur[i]) + (i === hover ? lift : 0);
      const k = i === hover ? 1 + 0.4 * hoverK : 1, c = b.color.map((v) => Math.min(1, v * k));
      const x0 = b.x - w, x1 = b.x + w, z0 = b.z - d, z1 = b.z + d;
      const q = (a, bb, cc, dd) => [a, bb, cc, a, cc, dd]; // two triangles from a quad
      pushFace(out, q([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]), [0, 1, 0], c.map((v) => Math.min(1, v * 1.1)));
      pushFace(out, q([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]), [1, 0, 0], c);
      pushFace(out, q([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]), [-1, 0, 0], c);
      pushFace(out, q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]), [0, 0, 1], c);
      pushFace(out, q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]), [0, 0, -1], c);
    });
    boxCount = out.length / 9;
    gl.bindBuffer(gl.ARRAY_BUFFER, boxBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.DYNAMIC_DRAW);
    // contact shadows: one soft dark quad per bar on the ground plane,
    // stretched away from the shared light rig (shared-gl LIGHT) — grounds
    // the city and gives the fog depth without any framebuffer work
    const sh = [];
    const UP = [0, 1, 0], BLACK = [0, 0, 0];
    const pv = (p) => sh.push(p[0], p[1], p[2], UP[0], UP[1], UP[2], BLACK[0], BLACK[1], BLACK[2]);
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i], h = cur[i] || 0;
      const w = ((b.w ?? 0.8) / 2) * 1.35, d = ((b.d ?? 0.8) / 2) * 1.35;
      const ox = -LIGHT[0] * h * 0.22, oz = -LIGHT[2] * h * 0.22;
      const x0 = b.x - w + ox, x1 = b.x + w + ox, z0 = b.z - d + oz, z1 = b.z + d + oz, y = 0.004;
      const a = [x0, y, z0], bb = [x0, y, z1], cc = [x1, y, z1], dd = [x1, y, z0];
      pv(a); pv(bb); pv(cc); pv(a); pv(cc); pv(dd);
    }
    shadowCount = sh.length / 9;
    gl.bindBuffer(gl.ARRAY_BUFFER, shadowBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sh), gl.DYNAMIC_DRAW);
  }
  function buildGrid() {
    const out = [], c = [0.22, 0.30, 0.46], push = (x, z, x2, z2) => { out.push(x, 0, z, 0, 1, 0, ...c, x2, 0, z2, 0, 1, 0, ...c); };
    const xs = bars.map((b) => b.x), zs = bars.map((b) => b.z);
    if (!xs.length) { gridCount = 0; return; }
    const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, z0 = Math.min(...zs) - 1, z1 = Math.max(...zs) + 1;
    for (let x = Math.ceil(x0); x <= x1; x += Math.max(1, Math.round((x1 - x0) / 12))) push(x, z0, x, z1);
    for (let z = Math.ceil(z0); z <= z1; z += Math.max(1, Math.round((z1 - z0) / 8))) push(x0, z, x1, z);
    push(x0, z0, x1, z0); push(x0, z1, x1, z1); push(x0, z0, x0, z1); push(x1, z0, x1, z1);
    gridCount = out.length / 9;
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.STATIC_DRAW);
  }

  function setData(b, m = {}) {
    const fresh = !bars.length;
    bars = b || []; meta = m || {};
    tgt = bars.map((x) => x.h);
    if (fresh || cur.length !== bars.length) { cur = REDUCED ? tgt.slice() : bars.map(() => 0); grow = REDUCED ? 1 : 0; growStart = performance.now(); }
    const xs = bars.map((x) => x.x), zs = bars.map((x) => x.z), ys = bars.map((x) => (x.y0 || 0) + x.h);
    if (bars.length) {
      center = [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2];
      extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 4);
      topY = Math.max(...ys, 1);
    }
    buildGrid();
    labelEls.forEach((e) => e.remove());
    labelEls = [];
    const mk = (kind, v, text) => {
      const el = document.createElement("span");
      el.textContent = text;
      el.style.cssText = "position:absolute;transform:translate(-50%,-50%);font:0.62rem var(--font-mono,monospace);white-space:nowrap;" +
        "color:#c3d0e8;background:rgba(8,14,28,.72);padding:1px 6px;border-radius:6px";
      el._l = { kind, v };
      layer.appendChild(el); labelEls.push(el);
    };
    (meta.xLabels || []).forEach((l) => mk("x", l.x, l.text));
    (meta.zLabels || []).forEach((l) => mk("z", l.z, l.text));
    dirty = true;
  }

  function matrix() {
    const yw = yaw + sway * 0.4 * Math.sin(performance.now() / 3200);
    const eye = [center[0] + dist * Math.cos(pitch) * Math.sin(yw), dist * Math.sin(pitch) + topY * 0.2, center[2] + dist * Math.cos(pitch) * Math.cos(yw)];
    return mul(perspective(0.85, canvas.width / Math.max(1, canvas.height), 0.1, 200), lookAt(eye, [center[0], topY * 0.3, center[2]], [0, 1, 0]));
  }
  const project = (m, x, y, z) => {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [((m[0] * x + m[4] * y + m[8] * z + m[12]) / w * 0.5 + 0.5) * canvas.width, (0.5 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w * 0.5) * canvas.height];
  };

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    if ((LITE || (q && q.tier >= 2)) && (frameN++ & 1)) return;
    const nowMs = performance.now();
    // fdt spans skipped (tier-2 / 30fps) frames, so every ease below stays
    // frame-rate independent instead of running double-speed at 120 Hz
    const fdt = lastFrame ? Math.min(100, Math.max(1, nowMs - lastFrame)) : 16.7;
    if (q) q.tick(fdt, nowMs);
    lastFrame = nowMs;
    const dpr = dprCap((LITE ? 1.5 : 2) * (q ? q.scale() : 1)), w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 2 || h < 2) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); dirty = true; }
    // grow-in / morph toward the target heights (dt-aware: 12%/frame at 60 Hz)
    const EASE = REDUCED ? 1 : 1 - Math.pow(0.88, fdt / 16.7);
    let moving = false;
    for (let i = 0; i < cur.length; i++) {
      const d = tgt[i] - cur[i];
      if (Math.abs(d) > 0.002) { cur[i] += d * EASE; moving = true; }
    }
    // hover: the highlight and lift ease in/out (REDUCED snaps to the old hard toggle)
    const hkT = hover >= 0 ? 1 : 0;
    hoverK = REDUCED ? hkT : hoverK + (hkT - hoverK) * (1 - Math.pow(0.6, fdt / 16.7));
    if (Math.abs(hkT - hoverK) > 0.001) moving = true;
    // flick momentum: glide after release, ~130 ms half-life
    if (inertia && !dragging && !REDUCED) {
      yaw += vyaw * fdt;
      pitch = Math.max(0.08, Math.min(1.45, pitch + vpitch * fdt));
      const dec = Math.pow(0.5, fdt / 130);
      vyaw *= dec; vpitch *= dec;
      if (Math.hypot(vyaw, vpitch) < 1e-5) { inertia = false; vyaw = vpitch = 0; }
    }
    // idle: a gentle sway around the framing (full spins turn a wide skyline end-on and unreadable)
    const idle = !REDUCED && !dragging && pointers.size === 0 && performance.now() - lastInteract > 5000;
    sway += ((idle ? 1 : 0) - sway) * (1 - Math.pow(0.97, fdt / 16.7));
    if (!userDist && bars.length) {
      const t = Math.tan(0.85 / 2), asp = w / h;
      const need = Math.max(((extent / 2) + 3.5) / (t * Math.min(asp, 2.4)), (topY * 0.9 + 2) / t);
      dist += (need * (opts.fit || 1.3) * (asp < 1 ? (opts.narrow || 0.62) : 1) - dist) * (1 - Math.pow(0.92, fdt / 16.7));
    }
    if (moving) dirty = true;
    if (dirty) { buildBoxes(); dirty = false; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    const m = matrix();
    gl.useProgram(prog);
    gl.uniformMatrix4fv(uMvp, false, m);
    gl.uniform3f(uLight, LIGHT[0], LIGHT[1], LIGHT[2]);
    gl.uniform1f(uFog, dist * 1.1);
    const bind = (buf) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 36, 0);
      gl.enableVertexAttribArray(aNrm); gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 36, 12);
      gl.enableVertexAttribArray(aCol); gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 36, 24);
    };
    if (gridCount) { bind(gridBuf); gl.drawArrays(gl.LINES, 0, gridCount); }
    if (shadowCount) { // soft ground shadows under the bars (translucent, no depth write)
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.uniform1f(uAlpha, 0.26);
      bind(shadowBuf); gl.drawArrays(gl.TRIANGLES, 0, shadowCount);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    gl.uniform1f(uAlpha, 1.0);
    if (boxCount) { bind(boxBuf); gl.drawArrays(gl.TRIANGLES, 0, boxCount); }
    // edge labels
    const kx = w / canvas.width, ky = h / canvas.height;
    const xs = bars.map((b) => b.x), zs = bars.map((b) => b.z);
    const xmin = Math.min(...xs) - 1, zmax = Math.max(...zs) + 1.2;
    labelEls.forEach((el) => {
      const l = el._l; if (!l) return;
      const [sx, sy] = l.kind === "x" ? project(m, l.v, 0, zmax) : project(m, xmin - 0.4, 0, l.v);
      el.style.left = `${sx * kx}px`; el.style.top = `${sy * ky + (l.kind === "x" ? 8 : 0)}px`;
    });
  }

  // interaction
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect(), px = (cx - r.left) * (canvas.width / r.width), py = (cy - r.top) * (canvas.height / r.height);
    const m = matrix(); let best = -1, bd = (26 * (canvas.width / r.width)) ** 2;
    const lift = Math.min(0.35, topY * 0.05) * hoverK;
    bars.forEach((b, i) => {
      const [sx, sy] = project(m, b.x, (b.y0 || 0) + cur[i] + (i === hover ? lift : 0), b.z), d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  const onDown = (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = [e.clientX, e.clientY]; lastInteract = performance.now();
    inertia = false; vyaw = vpitch = 0; lastMoveT = e.timeStamp || 0; // grabbing stops any glide
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; dist0 = dist; dragging = false; }
    else { dragging = true; lx = e.clientX; ly = e.clientY; }
  };
  const onMove = (e) => {
    lastInteract = performance.now();
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; dist = Math.max(3, Math.min(120, dist0 * (pinch0 / (Math.hypot(a.x - b.x, a.y - b.y) || 1)))); userDist = true; return; }
    if (dragging) {
      const nowE = e.timeStamp || performance.now(), dtE = Math.max(1, nowE - (lastMoveT || nowE - 16)); lastMoveT = nowE;
      vyaw = Math.max(-0.003, Math.min(0.003, vyaw * 0.7 + (((e.clientX - lx) * 0.008) / dtE) * 0.3));
      vpitch = Math.max(-0.002, Math.min(0.002, vpitch * 0.7 + (((e.clientY - ly) * 0.006) / dtE) * 0.3));
      yaw += (e.clientX - lx) * 0.008; pitch = Math.max(0.08, Math.min(1.45, pitch + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; tip.hidden = true; return;
    }
    const i = pick(e.clientX, e.clientY);
    if (i !== hover) { hover = i; dirty = true; }
    if (i < 0) { tip.hidden = true; canvas.style.cursor = "grab"; return; }
    canvas.style.cursor = "pointer";
    const r = canvas.getBoundingClientRect();
    tip.textContent = bars[i].tip || "";
    tip.hidden = !bars[i].tip;
    tip.style.left = `${Math.min(e.clientX - r.left + 14, r.width - 220)}px`;
    tip.style.top = `${Math.max(e.clientY - r.top - 10, 4)}px`;
  };
  const onUp = (e) => {
    pointers.delete(e.pointerId);
    dragging = false;
    if (pointers.size === 1) { const [p] = [...pointers.values()]; lx = p.x; ly = p.y; dragging = true; vyaw = vpitch = 0; lastMoveT = 0; return; }
    // release mid-flick -> keep gliding (damped in frame()); pointercancel never glides
    if (!REDUCED && e.type !== "pointercancel" && Math.hypot(vyaw, vpitch) > 2.5e-4) inertia = true;
  };
  const onLeave = () => { tip.hidden = true; if (hover !== -1) { hover = -1; dirty = true; } };
  const onWheel = (e) => { e.preventDefault(); userDist = true; dist = Math.max(3, Math.min(120, dist + e.deltaY * 0.01 * (dist / 12))); lastInteract = performance.now(); };
  canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp); canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave); canvas.addEventListener("wheel", onWheel, { passive: false });
  const fallback = document.createElement("p");
  fallback.className = "mini-note bars3d-fallback";
  fallback.setAttribute("role", "status");
  fallback.hidden = true;
  fallback.textContent = "3D view unavailable. Use the labeled summary and tables on this page.";
  host.appendChild(fallback);
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); syncLoop(); }, { rootMargin: "100px" }) : null;
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
    canvas.hidden = true;
    fallback.hidden = false;
  });
  // keyboard: focus the canvas, arrows orbit, +/- zoom, Home resets (the view is otherwise mouse/touch only)
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowLeft") yaw -= 0.12; else if (k === "ArrowRight") yaw += 0.12;
    else if (k === "ArrowUp") pitch = Math.min(1.45, pitch + 0.08); else if (k === "ArrowDown") pitch = Math.max(0.08, pitch - 0.08);
    else if (k === "+" || k === "=") { dist = Math.max(3, dist * 0.9); userDist = true; }
    else if (k === "-" || k === "_") { dist = Math.min(120, dist * 1.1); userDist = true; }
    else if (k === "Home") { yaw = opts.yaw ?? 0.5; pitch = opts.pitch ?? 0.5; userDist = false; }
    else return;
    e.preventDefault(); lastInteract = performance.now();
  });
  canvas.style.outlineOffset = "-3px";
  if (visible && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
  else running = false;

  return {
    setData,
    destroy() { cancelAnimationFrame(raf); io && io.disconnect(); document.removeEventListener("visibilitychange", syncLoop); layer.remove(); tip.remove(); fallback.remove(); },
  };
}
