/* GALE — Fleet Galaxy. A live, interactive 3D galaxy of the fleet in raw
   WebGL2 (no dependencies): each host is a spiral arm of tens of thousands
   of GPU-animated stars, each agent a bright star with diffraction spikes,
   live alerts flare red/amber, comets streak past, and the whole frame goes
   through a domain-warped nebula background and a multi-pass bloom.

   Safety rails (house style): nothing runs at import time, every browser
   access sits in init(), the scene is skipped without WebGL2 (the keyboard
   accessible agent list always works), prefers-reduced-motion renders a still
   frame that only redraws on interaction, and a frame-time governor lowers
   resolution and star count on slow GPUs instead of stuttering. */
import { boot, REDUCED, isDataSaver } from "./shared.js";
import { program, dprCap, motionPaused } from "./shared-gl.js";

boot();

const HOSTS = [
  { id: "tidal", name: "Tidal", col: [0.30, 0.80, 1.00], agents: ["Tidal", "River", "Creek", "Stream", "Meadow", "Brook", "Mist"] },
  { id: "beacon", name: "Beacon", col: [1.00, 0.78, 0.30], agents: ["Beacon", "Highbeam", "Lantern", "Lightning", "Radar", "Prism", "Pulsar"] },
  { id: "mountain", name: "Mountain", col: [0.72, 0.52, 1.00], agents: ["Mountain", "Canyon", "Ridge", "Harbor", "Delta", "Mesa", "Vista"] },
  { id: "gale", name: "Gale", col: [0.28, 0.62, 1.00], agents: ["Gale", "Zephyr", "Squall", "Tempest", "Vortex", "Chinook", "Cyclone", "Maistral", "Sirocco", "Bora", "Tramontane", "Ostro", "Poniente", "Levante"] },
];
const WARN = [1.0, 0.72, 0.2], CRIT = [1.0, 0.24, 0.22];
const WIND = 3.3; // total spiral winding in radians from core to rim

/* ---------- tiny math (column-major mat4) ---------- */
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
function perspective(fov, asp, n, f) {
  const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
  o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
}
function lookAt(e, c, up) {
  const f = v3.norm(v3.sub(c, e)), s = v3.norm(v3.cross(f, up)), u = v3.cross(s, f), o = new Float32Array(16);
  o[0] = s[0]; o[4] = s[1]; o[8] = s[2]; o[1] = u[0]; o[5] = u[1]; o[9] = u[2];
  o[2] = -f[0]; o[6] = -f[1]; o[10] = -f[2];
  o[12] = -(s[0] * e[0] + s[1] * e[1] + s[2] * e[2]); o[13] = -(u[0] * e[0] + u[1] * e[1] + u[2] * e[2]); o[14] = f[0] * e[0] + f[1] * e[1] + f[2] * e[2]; o[15] = 1;
  return { m: o, f, s, u };
}
function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
let seedState = 1337;
const rnd = () => { seedState = (seedState * 1664525 + 1013904223) >>> 0; return seedState / 4294967296; };
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.8660254; // ~N(0,1)

/* ---------- shaders ---------- */
const FS_TRI = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const NEBULA_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec3 uF, uR, uU; uniform float uAsp, uT, uAlert; uniform vec3 uCol[4];
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * vn(p); p = p * 2.07 + 11.3; a *= 0.5; } return v; }
void main(){
  vec2 q = (vUv * 2.0 - 1.0) * vec2(uAsp, 1.0) * 0.62;
  vec3 d = normalize(uF + q.x * uR + q.y * uU);
  float t = uT * 0.012;
  vec3 w = vec3(fbm(d * 2.2 + t), fbm(d * 2.2 + 7.7 - t), fbm(d * 2.2 + 3.1 + t));
  float n = fbm(d * 1.8 + 2.4 * (w - 0.5));
  float n2 = fbm(d * 3.6 - 1.7 * (w - 0.5) + 9.0);
  vec3 c = vec3(0.012, 0.016, 0.040);
  c += uCol[0] * smoothstep(0.42, 0.95, n) * 0.20;
  c += uCol[2] * smoothstep(0.48, 1.00, n2) * 0.18;
  c += uCol[1] * smoothstep(0.55, 1.00, fbm(d * 2.9 + 20.0 + w)) * 0.10;
  c += vec3(0.30, 0.04, 0.05) * uAlert * smoothstep(0.5, 1.0, n * n2 * 2.0) * 0.30; // a stormy red tint while something is critical
  // starfield: three octaves of cell-hashed points
  for (int k = 0; k < 3; k++){
    float s = 55.0 + float(k) * 70.0;
    vec3 p = d * s, cell = floor(p), fr = fract(p) - 0.5;
    float hh = h31(cell + float(k) * 17.0);
    float on = step(0.985 - float(k) * 0.004, hh);
    float dist = length(fr + (vec3(h31(cell + 1.3), h31(cell + 2.7), h31(cell + 4.1)) - 0.5) * 0.6);
    float tw = 0.75 + 0.25 * sin(uT * (1.0 + hh * 4.0) + hh * 90.0);
    vec3 sc = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.85, 0.65), h31(cell + 9.0));
    c += sc * on * tw * smoothstep(0.16, 0.0, dist) * (0.8 - float(k) * 0.2);
  }
  o = vec4(c, 1.0);
}`;

const PART_VS = `#version 300 es
precision highp float;
in vec4 aA; in vec2 aB;
uniform mat4 uVP; uniform float uT, uPx; uniform vec3 uCol[4];
out vec3 vC;
void main(){
  float r = aA.x, rn = aA.w;
  float th = aA.y + uT * 0.05 + 0.07 * sin(uT * (0.25 + 0.7 / (0.2 + r)) + rn * 6.2831);
  vec3 p = vec3(cos(th) * r, aA.z + 0.012 * sin(uT * 0.6 + rn * 40.0), sin(th) * r);
  gl_Position = uVP * vec4(p, 1.0);
  float core = smoothstep(0.38, 0.0, r);
  vec3 c = mix(uCol[int(aB.x)], vec3(1.0, 0.84, 0.58), core);
  c = mix(c, vec3(0.78, 0.92, 1.0), step(0.94, rn) * 0.75);
  vC = c * (0.45 + 0.9 * rn);
  gl_PointSize = clamp(aB.y * uPx / max(gl_Position.w, 0.15), 1.0, 12.0);
}`;
const PART_FS = `#version 300 es
precision mediump float;
in vec3 vC; out vec4 o; uniform float uGain;
void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d * d * 4.5) * step(d, 1.0); o = vec4(vC * a * uGain, a); }`;

const SPR_VS = `#version 300 es
precision highp float;
in vec3 aP; in vec3 aC; in vec2 aS; // aS = size, kind
uniform mat4 uVP; uniform float uPx, uMax;
out vec3 vC; out float vK; out float vSz;
void main(){
  gl_Position = uVP * vec4(aP, 1.0);
  vC = aC; vK = aS.y; vSz = aS.x;
  gl_PointSize = clamp(aS.x * uPx / max(gl_Position.w, 0.15), 2.0, uMax);
}`;
const SPR_FS = `#version 300 es
precision mediump float;
in vec3 vC; in float vK; in float vSz; out vec4 o; uniform float uT;
void main(){
  vec2 p = (gl_PointCoord - 0.5) * 2.0; float r = length(p);
  if (r > 1.0) discard;
  float core = exp(-r * r * 26.0), halo = exp(-r * 5.0) * 0.32;
  float spikes = (exp(-abs(p.x) * 30.0) * exp(-abs(p.y) * 2.6) + exp(-abs(p.y) * 30.0) * exp(-abs(p.x) * 2.6)) * 0.55;
  vec3 col;
  if (vK < 0.5) { col = vC * (core * 2.4 + halo + spikes) + vec3(core * 0.8); }
  else if (vK < 1.5) { // alert flare: expanding double ring + pulsing core
    float ph = fract(uT * 0.55), ph2 = fract(uT * 0.55 + 0.5);
    float ring = exp(-pow((r - ph * 0.92) * 11.0, 2.0)) * (1.0 - ph) + exp(-pow((r - ph2 * 0.92) * 11.0, 2.0)) * (1.0 - ph2);
    float pulse = 0.75 + 0.25 * sin(uT * 6.0);
    col = vC * (core * 2.8 * pulse + halo * 1.6 + spikes * 1.4 + ring * 1.1) + vec3(core * 0.7);
  } else { col = vC * (core * 1.3 + halo * 1.2); }
  o = vec4(col, 1.0);
}`;

const BRIGHT_FS = `#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
void main(){
  vec3 c = texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, -1.0)).rgb
         + texture(uTex, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25; float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(0.30, 0.95, l), 1.0);
}`;
const BLUR_FS = `#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 c = texture(uTex, vUv).rgb * 0.2270;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0703;
  o = vec4(c, 1.0);
}`;
const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform sampler2D uScene, uBloom; uniform float uT, uBloomAmt, uAbe;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5; float rr = dot(c, c);
  vec2 off = c * rr * uAbe;
  vec3 s = vec3(texture(uScene, vUv - off).r, texture(uScene, vUv).g, texture(uScene, vUv + off).b);
  vec3 b = texture(uBloom, vUv).rgb;
  vec3 col = s + b * uBloomAmt;
  col = 1.0 - exp(-col * 1.35);
  col *= 1.0 - smoothstep(0.18, 0.62, rr) * 0.7;
  col += (h(vUv * 900.0 + uT) - 0.5) * 0.018;
  o = vec4(col, 1.0);
}`;

/* ---------- scene data ---------- */
function buildParticles(n) {
  const A = new Float32Array(n * 4), B = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const bulge = rnd() < 0.14;
    const arm = Math.floor(rnd() * 4);
    let r, th, y;
    if (bulge) { r = Math.pow(rnd(), 1.7) * 0.34; th = rnd() * 6.2832; y = gauss() * 0.075 * (1 - r); }
    else {
      r = 0.08 + Math.pow(rnd(), 0.82) * 0.92;
      th = arm * Math.PI / 2 + r * WIND + gauss() * (0.05 + 0.28 * (1 - r) * (1 - r) + 0.07 * r);
      y = gauss() * 0.028 * (1.15 - r);
    }
    A[i * 4] = r; A[i * 4 + 1] = th; A[i * 4 + 2] = y; A[i * 4 + 3] = rnd();
    B[i * 2] = arm; B[i * 2 + 1] = 5 + rnd() * rnd() * 22;
  }
  return { A, B };
}

function layoutAgents() {
  const out = [];
  HOSTS.forEach((h, hi) => {
    const n = h.agents.length;
    h.agents.forEach((name, i) => {
      const r = 0.2 + 0.7 * (i + 0.5) / n;
      const th = hi * Math.PI / 2 + r * WIND + (i % 2 ? 0.07 : -0.07);
      out.push({ name, host: h.name, hostIdx: hi, r, th, y: ((i * 37) % 7 - 3) * 0.006, col: h.col, alert: 0, alertText: "" });
    });
  });
  return out;
}
const agentPos = (a, t) => {
  const th = a.th + t * 0.05;
  return [Math.cos(th) * a.r, a.y, Math.sin(th) * a.r];
};

function init() {
  const canvas = document.getElementById("galaxy-canvas");
  const stage = document.getElementById("galaxy-stage");
  if (!canvas || !stage) return;
  const listEl = document.getElementById("galaxy-list");
  const cardEl = document.getElementById("galaxy-card");
  const feedStateEl = document.getElementById("galaxy-feed-state");
  const resetButton = document.getElementById("galaxy-reset");
  const labelsEl = document.getElementById("galaxy-labels");
  const fallback = document.getElementById("galaxy-fallback");
  const agents = layoutAgents();
  let cam = null; // set up with the WebGL scene; null keeps the list-only mode safe

  /* keyboard/AT accessible list: always built, scene or not */
  const byName = new Map();
  let selected = null, hover = null;
  const buttons = new Map();
  if (listEl) {
    HOSTS.forEach((h) => {
      const g = document.createElement("div"); g.className = "galaxy-group";
      const t = document.createElement("h2"); t.textContent = h.name; g.appendChild(t);
      agents.filter((a) => a.host === h.name).forEach((a) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "galaxy-pick";
        b.dataset.host = h.id; b.textContent = a.name;
        const tag = document.createElement("span"); tag.className = "galaxy-tag"; b.appendChild(tag);
        b.addEventListener("click", () => select(a));
        g.appendChild(b); buttons.set(a.name, b);
      });
      listEl.appendChild(g);
    });
  }
  agents.forEach((a) => byName.set(a.name.toLowerCase(), a));

  function describe(a) {
    return `${a.name} · ${a.host} host` + (a.alertText ? ` · ${a.alertText}` : " · no open alerts");
  }
  function select(a) {
    selected = a;
    if (cardEl) cardEl.textContent = a ? describe(a) : "Nothing selected.";
    buttons.forEach((b, n) => b.setAttribute("aria-pressed", String(!!a && a.name === n)));
    if (a && cam) cam.fly = 1;
    dirty = true;
  }
  resetButton?.addEventListener("click", () => {
    select(null);
    if (cam) { cam.fly = 0; cam.flyHome = true; cam.vy = 0; cam.vp = 0; }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { select(null); if (cam) cam.flyHome = true; } });

  /* live alerts */
  let alertUpdatedAt = 0;
  function paintAlertFreshness(problem = "") {
    if (!feedStateEl) return;
    if (!alertUpdatedAt) {
      feedStateEl.dataset.state = problem ? "error" : "loading";
      feedStateEl.textContent = problem ? `Alert feed unavailable · ${problem}` : "Alert feed · connecting";
      return;
    }
    const age = Math.max(0, Math.floor((Date.now() - alertUpdatedAt) / 1000));
    const state = age > 90 ? "stale" : problem ? "error" : "ok";
    feedStateEl.dataset.state = state;
    const freshness = age < 60 ? `${age}s ago` : `${Math.floor(age / 60)}m ago`;
    feedStateEl.textContent = `Alert feed · ${state === "ok" ? "updated" : state === "stale" ? "stale" : "refresh failed"} ${freshness}${problem ? ` · ${problem}` : ""}`;
  }
  async function loadAlerts() {
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
      let r;
      try { r = await fetch("/api/fleet/alerts", { cache: "no-store", signal: ctl.signal }); }
      finally { clearTimeout(to); }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      alertUpdatedAt = Date.now();
      agents.forEach((a) => { a.alert = 0; a.alertText = ""; });
      let crit = 0;
      for (const al of (d.alerts || [])) {
        const a = byName.get(String(al.agent || "").toLowerCase());
        if (!a) continue;
        const lvl = al.sev === "crit" ? 2 : al.sev === "warn" ? 1 : 0;
        if (lvl > a.alert) { a.alert = lvl; a.alertText = `${al.sev}: ${String(al.text || "").replace(/^AM /, "").slice(0, 90)}`; }
        if (lvl === 2) crit = 1;
      }
      alertLevel = crit;
      buttons.forEach((b, n) => {
        const a = byName.get(n.toLowerCase());
        b.firstChild && (b.querySelector(".galaxy-tag").textContent = a.alert ? (a.alert === 2 ? " crit" : " warn") : "");
        b.dataset.alert = String(a.alert);
      });
      if (selected && cardEl) cardEl.textContent = describe(selected);
      paintAlertFreshness();
      dirty = true;
    } catch (error) {
      paintAlertFreshness(String(error?.message || "network error").slice(0, 50));
      /* alerts are decoration here: the scene still works without them */
    }
  }
  let alertLevel = 0, dirty = true;
  loadAlerts(); setInterval(() => { if (!document.hidden) loadAlerts(); }, 30000);
  setInterval(() => paintAlertFreshness(), 10000);

  /* ---------- WebGL2 ---------- */
  let gl = null;
  try {
    gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
  } catch { gl = null; }
  if (!gl) { if (fallback) fallback.hidden = false; stage.dataset.mode = "list"; return; }
  stage.dataset.mode = "webgl";

  const lite = Math.min(innerWidth, innerHeight) < 700 || isDataSaver?.();
  let nParts = lite ? 16000 : 64000;
  let progs;
  try {
    progs = {
      neb: program(gl, FS_TRI, NEBULA_FS, "nebula"),
      part: program(gl, PART_VS, PART_FS, "stars"),
      spr: program(gl, SPR_VS, SPR_FS, "sprites"),
      bright: program(gl, FS_TRI, BRIGHT_FS, "bright"),
      blur: program(gl, FS_TRI, BLUR_FS, "blur"),
      comp: program(gl, FS_TRI, COMP_FS, "composite"),
    };
  } catch (e) { console.warn("galaxy shaders", e); if (fallback) fallback.hidden = false; stage.dataset.mode = "list"; return; }
  const U = {}; // uniform lookup cache
  const u = (p, n) => ((U[p] ||= {})[n] ??= gl.getUniformLocation(progs[p], n));
  const maxPt = Math.min(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64, 220);

  const { A, B } = buildParticles(nParts);
  const mkBuf = (data, usage = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; };
  const vaoPart = gl.createVertexArray(); gl.bindVertexArray(vaoPart);
  const bA = mkBuf(A), bB = mkBuf(B);
  const aLoc = (p, n) => gl.getAttribLocation(progs[p], n);
  gl.bindBuffer(gl.ARRAY_BUFFER, bA); gl.enableVertexAttribArray(aLoc("part", "aA")); gl.vertexAttribPointer(aLoc("part", "aA"), 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bB); gl.enableVertexAttribArray(aLoc("part", "aB")); gl.vertexAttribPointer(aLoc("part", "aB"), 2, gl.FLOAT, false, 0, 0);

  const MAXSPR = 128, SPRF = 8; // pos3 col3 size kind
  const sprData = new Float32Array(MAXSPR * SPRF);
  const vaoSpr = gl.createVertexArray(); gl.bindVertexArray(vaoSpr);
  const bS = mkBuf(sprData, gl.DYNAMIC_DRAW);
  [["aP", 3, 0], ["aC", 3, 3], ["aS", 2, 6]].forEach(([n, sz, off]) => {
    const l = aLoc("spr", n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sz, gl.FLOAT, false, SPRF * 4, off * 4);
  });
  const vaoEmpty = gl.createVertexArray();

  /* render targets */
  const mkTarget = (w, h) => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  };
  let T = null, W = 0, H = 0, quality = 1;
  const freeTargets = () => { if (!T) return; Object.values(T).forEach((t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }); T = null; };
  function resize() {
    const dpr = dprCap(lite ? 1.25 : 1.75) * quality;
    const w = Math.max(2, Math.round(stage.clientWidth * dpr)), h = Math.max(2, Math.round(stage.clientHeight * dpr));
    if (w === W && h === H && T) return;
    W = w; H = h; canvas.width = w; canvas.height = h;
    freeTargets();
    const q = (k) => Math.max(2, Math.round(k));
    T = { scene: mkTarget(w, h), a: mkTarget(q(w / 4), q(h / 4)), b: mkTarget(q(w / 4), q(h / 4)) };
    dirty = true;
  }

  /* ---------- camera ---------- */
  cam = { yaw: 0.6, pitch: 1.15, dist: 6.0, tx: 0, ty: 0, tz: 0, vy: 0, vp: 0, fly: 0, flyHome: false, intro: REDUCED ? 1 : 0, last: 0 };
  const HOME = { yaw: 0.6, pitch: 0.62, dist: 2.15 };
  if (REDUCED) { cam.pitch = HOME.pitch; cam.dist = HOME.dist; }
  const pointers = new Map(); let pinch0 = 0, dragging = false, lastInteract = performance.now();
  const touch = () => { lastInteract = performance.now(); dirty = true; };
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture?.(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]);
    dragging = true; cam.vy = cam.vp = 0;
    if (pointers.size === 2) { const [p, q] = [...pointers.values()]; pinch0 = Math.hypot(p[0] - q[0], p[1] - q[1]); }
    downAt = [e.clientX, e.clientY]; touch();
  });
  let downAt = null;
  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect(); pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top; pointer.in = true;
    if (pointers.has(e.pointerId)) {
      const prev = pointers.get(e.pointerId); const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [p, q] = [...pointers.values()]; const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (pinch0) cam.dist = Math.min(4.8, Math.max(0.7, cam.dist * pinch0 / d)); pinch0 = d;
      } else if (dragging) { cam.yaw -= dx * 0.0052; cam.pitch = Math.min(1.45, Math.max(-1.45, cam.pitch + dy * 0.0052)); cam.vy = -dx * 0.0052; cam.vp = dy * 0.0052; cam.fly = 0; }
    }
    touch();
  });
  const up = (e) => {
    pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = 0;
    if (pointers.size === 0) {
      dragging = false;
      if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 5) { const hit = pick(); select(hit); if (!hit) cam.flyHome = true; }
      downAt = null;
    }
  };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", () => { pointer.in = false; hover = null; canvas.style.cursor = ""; });
  canvas.addEventListener("wheel", (e) => {
    const nd = Math.min(4.8, Math.max(0.7, cam.dist * Math.exp(e.deltaY * 0.0012)));
    if (nd !== cam.dist) { cam.dist = nd; e.preventDefault(); touch(); }
  }, { passive: false });
  const pointer = { x: 0, y: 0, in: false };

  /* ---------- labels ---------- */
  const mkLabel = (cls, text) => { const el = document.createElement("span"); el.className = "galaxy-label " + cls; el.textContent = text; labelsEl?.appendChild(el); return el; };
  const hostLabels = HOSTS.map((h) => mkLabel("is-host", h.name)); hostLabels.forEach((el, i) => { el.dataset.host = HOSTS[i].id; });
  const tipEl = mkLabel("is-tip", ""); tipEl.hidden = true;
  const selEl = mkLabel("is-sel", ""); selEl.hidden = true;

  /* ---------- per-frame ---------- */
  let VP = null, screenPts = [];
  const comets = Array.from({ length: 3 }, () => ({ p: [0, 0, 0], v: [0, 0, 0], life: 0, wait: rnd() * 6 }));
  const place = (el, p, dx = 0, dy = -16) => {
    const x = (p[0] * 0.5 + 0.5) * stage.clientWidth, y = (1 - (p[1] * 0.5 + 0.5)) * stage.clientHeight;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, 0) translate(${dx}px, ${dy}px)`;
  };
  function project(wp) {
    const m = VP, x = wp[0], y = wp[1], z = wp[2];
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (cw <= 0.05) return null; return [cx / cw, cy / cw, cw];
  }
  function pick() {
    let best = null, bd = 26;
    for (const s of screenPts) {
      const px = (s.p[0] * 0.5 + 0.5) * stage.clientWidth, py = (1 - (s.p[1] * 0.5 + 0.5)) * stage.clientHeight;
      const d = Math.hypot(px - pointer.x, py - pointer.y);
      if (d < bd) { bd = d; best = s.a; }
    }
    return best;
  }

  let t = 0, frames = 0, slow = 0, fast = 0, lastNow = performance.now();
  let plx = 0, ply = 0; // pointer parallax (#34), eased so it reads as depth not jitter
  const colArr = new Float32Array(HOSTS.flatMap((h) => h.col));
  function frame(now) {
    const dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
    const animate = !REDUCED && !motionPaused();
    if (animate) t += dt;
    if (document.hidden) return;

    /* governor: a sustained slow frame average costs resolution, never smoothness */
    if (animate) {
      if (dt > 0.034) { slow++; fast = 0; } else if (dt < 0.02) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 40 && quality > 0.5) { quality = Math.max(0.5, quality * 0.8); slow = 0; resize(); if (nParts > 20000) nParts = Math.round(nParts * 0.7); }
      else if (fast > 600 && quality < 1) { quality = Math.min(1, quality * 1.15); fast = 0; resize(); }
    }

    /* camera motion */
    if (cam.intro < 1) { cam.intro = Math.min(1, cam.intro + dt / 3.4); const e = 1 - Math.pow(1 - cam.intro, 3); cam.dist = 6 + (HOME.dist - 6) * e; cam.pitch = 1.15 + (HOME.pitch - 1.15) * e; cam.yaw += dt * 0.12 * (1 - e); dirty = true; }
    if (!dragging) { cam.yaw += cam.vy; cam.pitch = Math.min(1.45, Math.max(-1.45, cam.pitch + cam.vp)); cam.vy *= 0.94; cam.vp *= 0.94; if (Math.abs(cam.vy) + Math.abs(cam.vp) > 1e-4) dirty = true; }
    const idle = performance.now() - lastInteract > 4000;
    if (animate && idle && !selected && !dragging && cam.intro >= 1) { cam.yaw += dt * 0.045; }
    // pointer parallax (#34): while idle (not dragging, nothing selected), the
    // star field eases a fraction of the pointer offset so the galaxy gains a
    // second depth layer distinct from the orbit drag. Reduced motion: frozen.
    if (animate && idle && !dragging && !selected && cam.intro >= 1 && pointer.in) {
      plx += (((pointer.x / Math.max(1, W)) - 0.5) * 0.22 - plx) * (1 - Math.pow(0.05, dt));
      ply += ((0.5 - (pointer.y / Math.max(1, H))) * 0.16 - ply) * (1 - Math.pow(0.05, dt));
    } else { plx *= Math.pow(0.05, dt); ply *= Math.pow(0.05, dt); }
    if (selected) {
      const p = agentPos(selected, t);
      const k = 1 - Math.pow(0.001, dt);
      cam.tx += (p[0] - cam.tx) * k; cam.ty += (p[1] - cam.ty) * k; cam.tz += (p[2] - cam.tz) * k;
      if (cam.fly) { cam.dist += (1.15 - cam.dist) * k; if (Math.abs(cam.dist - 1.15) < 0.02) cam.fly = 0; }
      dirty = true;
    } else {
      const k = 1 - Math.pow(0.02, dt);
      cam.tx *= 1 - k; cam.ty *= 1 - k; cam.tz *= 1 - k;
      if (cam.flyHome) { cam.dist += (HOME.dist - cam.dist) * k; if (Math.abs(cam.dist - HOME.dist) < 0.02) cam.flyHome = false; }
    }
    if (animate) dirty = true;
    if (!dirty) return;
    dirty = false;

    resize();
    const asp = W / H;
    const eye = [cam.tx + plx + cam.dist * Math.cos(cam.pitch) * Math.sin(cam.yaw), cam.ty + ply + cam.dist * Math.sin(cam.pitch), cam.tz + cam.dist * Math.cos(cam.pitch) * Math.cos(cam.yaw)];
    const view = lookAt(eye, [cam.tx, cam.ty, cam.tz], [0, 1, 0]);
    VP = mul(perspective(0.9, asp, 0.05, 40), view.m);

    /* sprites: agents, galactic core, comets */
    let ns = 0;
    const put = (p, c, size, kind) => { const o = ns++ * SPRF; sprData[o] = p[0]; sprData[o + 1] = p[1]; sprData[o + 2] = p[2]; sprData[o + 3] = c[0]; sprData[o + 4] = c[1]; sprData[o + 5] = c[2]; sprData[o + 6] = size; sprData[o + 7] = kind; };
    put([0, 0, 0], [1.0, 0.82, 0.55], 340, 2);
    screenPts = [];
    for (const a of agents) {
      const p = agentPos(a, t); const sel = selected === a, hov = hover === a;
      const col = a.alert === 2 ? CRIT : a.alert === 1 ? WARN : a.col;
      put(p, col, (a.alert ? 120 : 84) * (sel ? 1.6 : hov ? 1.3 : 1), a.alert ? 1 : 0);
      const sp = project(p); if (sp) screenPts.push({ a, p: sp });
    }
    for (const c of comets) {
      if (c.life <= 0) {
        if (!animate) continue;
        c.wait -= dt; if (c.wait > 0) continue;
        const th = rnd() * 6.28, rr = 1.6 + rnd();
        c.p = [Math.cos(th) * rr, (rnd() - 0.5) * 0.9, Math.sin(th) * rr];
        const ta = th + Math.PI + (rnd() - 0.5) * 0.9; c.v = [Math.cos(ta) * 0.9, (rnd() - 0.5) * 0.12, Math.sin(ta) * 0.9]; c.life = 3.2;
      }
      if (animate) { c.life -= dt; c.p[0] += c.v[0] * dt; c.p[1] += c.v[1] * dt; c.p[2] += c.v[2] * dt; if (c.life <= 0) c.wait = 2 + rnd() * 7; }
      for (let k = 0; k < 14 && ns < MAXSPR; k++) {
        const f = k * 0.05; put([c.p[0] - c.v[0] * f, c.p[1] - c.v[1] * f, c.p[2] - c.v[2] * f], [0.7 - k * 0.03, 0.85 - k * 0.04, 1.0 - k * 0.05], (k === 0 ? 24 : 15 - k) , 2);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, bS); gl.bufferSubData(gl.ARRAY_BUFFER, 0, sprData, 0, ns * SPRF);

    /* hover */
    if (pointer.in && !dragging) { const h = pick(); if (h !== hover) { hover = h; canvas.style.cursor = h ? "pointer" : ""; } } else if (!pointer.in) hover = null;

    const px = H / 900 * 1.0 * (lite ? 1.1 : 1);
    /* pass 1: scene */
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.scene.fb); gl.viewport(0, 0, W, H); gl.disable(gl.BLEND);
    gl.useProgram(progs.neb); gl.bindVertexArray(vaoEmpty);
    gl.uniform3fv(u("neb", "uF"), view.f); gl.uniform3fv(u("neb", "uR"), view.s); gl.uniform3fv(u("neb", "uU"), view.u);
    gl.uniform1f(u("neb", "uAsp"), asp); gl.uniform1f(u("neb", "uT"), t); gl.uniform1f(u("neb", "uAlert"), alertLevel);
    gl.uniform3fv(u("neb", "uCol[0]"), colArr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(progs.part); gl.bindVertexArray(vaoPart);
    gl.uniformMatrix4fv(u("part", "uVP"), false, VP); gl.uniform1f(u("part", "uT"), t); gl.uniform1f(u("part", "uPx"), px * 1.35);
    gl.uniform3fv(u("part", "uCol[0]"), colArr); gl.uniform1f(u("part", "uGain"), lite ? 0.4 : 0.22);
    gl.drawArrays(gl.POINTS, 0, Math.min(nParts, A.length / 4));

    gl.useProgram(progs.spr); gl.bindVertexArray(vaoSpr);
    gl.uniformMatrix4fv(u("spr", "uVP"), false, VP); gl.uniform1f(u("spr", "uT"), t); gl.uniform1f(u("spr", "uPx"), px); gl.uniform1f(u("spr", "uMax"), maxPt);
    gl.drawArrays(gl.POINTS, 0, ns);
    gl.disable(gl.BLEND); gl.bindVertexArray(vaoEmpty);

    /* bloom: bright-pass to 1/4 res, then two separable blur rounds */
    const tex = (unit, target) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, target.tex); };
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.a.fb); gl.viewport(0, 0, T.a.w, T.a.h);
    gl.useProgram(progs.bright); tex(0, T.scene); gl.uniform1i(u("bright", "uTex"), 0); gl.uniform2f(u("bright", "uTexel"), 1 / W, 1 / H); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(progs.blur); gl.uniform1i(u("blur", "uTex"), 0);
    const blur = (src, dst, dx, dy) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, dst.w, dst.h); tex(0, src); gl.uniform2f(u("blur", "uDir"), dx / src.w, dy / src.h); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    blur(T.a, T.b, 1, 0); blur(T.b, T.a, 0, 1); blur(T.a, T.b, 2.2, 0); blur(T.b, T.a, 0, 2.2);

    /* composite to screen */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(progs.comp); tex(0, T.scene); tex(1, T.a);
    gl.uniform1i(u("comp", "uScene"), 0); gl.uniform1i(u("comp", "uBloom"), 1);
    gl.uniform1f(u("comp", "uT"), t % 100); gl.uniform1f(u("comp", "uBloomAmt"), 1.6 + alertLevel * 0.3); gl.uniform1f(u("comp", "uAbe"), 0.012);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);

    /* DOM labels follow the stars */
    HOSTS.forEach((h, i) => {
      const th = i * Math.PI / 2 + 1.0 * WIND + t * 0.05; const sp = project([Math.cos(th) * 1.0, 0.02, Math.sin(th) * 1.0]);
      if (sp) { hostLabels[i].hidden = false; place(hostLabels[i], sp, 0, -8); } else hostLabels[i].hidden = true;
    });
    const showTip = hover && hover !== selected;
    tipEl.hidden = !showTip; if (showTip) { tipEl.textContent = hover.name + (hover.alert ? " · " + (hover.alert === 2 ? "crit" : "warn") : ""); const sp = project(agentPos(hover, t)); sp ? place(tipEl, sp, 0, 14) : (tipEl.hidden = true); }
    selEl.hidden = !selected; if (selected) { selEl.textContent = selected.name; const sp = project(agentPos(selected, t)); sp ? place(selEl, sp, 0, 22) : (selEl.hidden = true); }

    if (++frames === 2) { document.documentElement.dataset.galaxy = "ready"; window.__galaxy = { frames: () => frames, particles: () => nParts, quality: () => quality }; }
  }
  const loop = (now) => { try { frame(now); } catch (e) { console.warn("galaxy frame", e); stage.dataset.mode = "list"; if (fallback) fallback.hidden = false; return; } requestAnimationFrame(loop); };
  new ResizeObserver(() => { if (T) { resize(); } dirty = true; }).observe(stage);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stage.dataset.mode = "list"; });
  resize();
  requestAnimationFrame(loop);
  const focus = new URLSearchParams(location.search).get("focus");
  if (focus && byName.get(focus.toLowerCase())) select(byName.get(focus.toLowerCase()));
}

try { init(); } catch (e) { console.warn("galaxy init", e); }
