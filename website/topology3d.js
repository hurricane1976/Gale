/* GALE — force-directed 3D topology (ROADMAP #5 + heat overlays). Reads
   the static topology SVG's nodes (data-name/data-host + resolved
   --node-color) and its mesh lines (A &harr; B titles), then renders the
   same roster as an interactive force-directed graph on WebGL: point
   repulsion + link springs + centering, orbit-drag, wheel zoom, hover
   tooltip. Heat overlays recolor nodes by 24h runs/cost/errors from
   /api/fleet/metrics. No chart library — one shader pair, a flat line
   buffer, tokens for color. The SVG stays the default (and print) view;
   this is the scaled-to-hundreds-of-nodes path, toggled by the "3d view"
   control. */


const NODE_VS = `
attribute vec3 a_pos;
attribute vec3 a_color;
attribute float a_scale;
uniform mat4 u_mvp;
uniform float u_size;
varying vec3 v_color;
void main() {
  gl_Position = u_mvp * vec4(a_pos, 1.0);
  gl_PointSize = u_size * a_scale;
  v_color = a_color;
}`;

// u_mode 0 = hard-edged core disc; 1 = soft gaussian halo, drawn additively
// (blendFunc ONE,ONE) so overlapping halos bloom into each other. A cheap
// bloom: no framebuffers / blur passes, so it stays free on phones.
const FRAG = `
precision mediump float;
varying vec3 v_color;
uniform float u_mode;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r2 = dot(d, d);
  if (u_mode > 0.5) {
    float a = exp(-r2 * 14.0) * 0.5;
    gl_FragColor = vec4(v_color * a, a);
    return;
  }
  if (r2 > 0.25) discard;
  gl_FragColor = vec4(v_color, 1.0);
}`;

const LINE_VS = `
attribute vec3 a_pos;
attribute vec4 a_color;
uniform mat4 u_mvp;
varying vec4 v_color;
void main() { gl_Position = u_mvp * vec4(a_pos, 1.0); v_color = a_color; }`;

const LINE_FRAG = `
precision mediump float;
varying vec4 v_color;
void main() { gl_FragColor = v_color; }`;

const esc3d = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const REDUCED3D = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (seed + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function mat4LookAt(eye, center, up) {
  const z = norm(sub(eye, center));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}
function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

/* opts (all optional):
     nodes:    [{name, host, model, listener, color:[r,g,b]}] roster instead of reading the DOM (status host map)
     health:   hub colour/label follow host liveness (listener sweep) instead of the agents' average hue
     autoOpen: open the 3D view on load (default: wide screens only; `true` also on phones)
   Returns true once running. */
export function initTopology3D(opts = {}) {
  const toggle = document.getElementById("topo-3d-toggle");
  const canvas = document.getElementById("topo-3d-canvas");
  // fleet.html's SVG is #topo.fleet-topo-svg since the Tidal-style rebuild; the old
  // ".topo-svg" selector matched nothing, so this init silently returned and the
  // 3D toggle did nothing. Accept either.
  // the home page has no SVG: a hidden stub stands in for it and the roster comes from its host cards
  const svg = document.getElementById("topo") || document.querySelector(".fleet-topo-svg, .topo-svg") ||
    document.getElementById("topo-home-stub");
  if (!toggle || !canvas || !svg) return;

  // roster from the SVG's own markup — one source of truth, zero drift
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  const resolve = (css) => {
    probe.style.color = css || "#8899aa";
    const m = (getComputedStyle(probe).color.match(/\d+/g) || [136, 153, 170]).map(Number);
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  };
  let nodes = opts.nodes ? opts.nodes.slice() : [...document.querySelectorAll(".topo-node")].map((g) => ({
    name: g.dataset.name || "",
    host: g.dataset.host || "",
    model: g.getAttribute("data-model") || "",
    listener: g.getAttribute("data-listener") || "",
    state: g.getAttribute("data-state") || "",
    color: resolve(getComputedStyle(g).getPropertyValue("--node-color")),
  }));
  if (!nodes.length) { // home page: host cards (.host-card > .host-name + .agent chips)
    nodes = [...document.querySelectorAll(".host-card")].flatMap((card) => {
      const host = (card.querySelector(".host-name") || {}).textContent || "";
      return [...card.querySelectorAll(".agent")].map((a) => ({
        name: a.textContent.trim(), host: host.trim(), model: a.dataset.model || "", listener: "",
        color: resolve(`var(--m-${a.dataset.model || "claude"}, #8899aa)`),
      }));
    });
  }
  probe.remove();
  if (nodes.length < 2) return;

  // layout model: each host is a pinned hub, its agents orbit it on a shell, and
  // one trunk links every pair of hubs. (The old all-pairs mesh per host drew
  // hundreds of crossing lines and read as noise.) Hubs live at pos[N..N+H).
  const N = nodes.length;
  const hostNames = [...new Set(nodes.map((n) => n.host))];
  const H = hostNames.length;
  const hostOf = nodes.map((n) => hostNames.indexOf(n.host));
  const members = hostNames.map((_, h) => nodes.map((_n, i) => i).filter((i) => hostOf[i] === h));
  const edges = []; // [a, b, kind]  kind 0 = hub spoke, 1 = host-to-host trunk
  nodes.forEach((_, i) => edges.push([i, N + hostOf[i], 0]));
  for (let x = 0; x < H; x++) for (let y = x + 1; y < H; y++) edges.push([N + x, N + y, 1]);
  const hubColors = new Float32Array(H * 3);
  members.forEach((idxs, h) => {
    for (let c = 0; c < 3; c++) {
      const avg = idxs.reduce((t, i) => t + nodes[i].color[c], 0) / Math.max(1, idxs.length);
      hubColors[h * 3 + c] = Math.min(1, avg * 0.5 + 0.5); // lighter than its agents
    }
  });
  const SPOKE = [0.55, 0.66, 0.88, 0.26], TRUNK = [0.62, 0.82, 1.0, 0.6];
  // pairing state (fleet.html data-state) colours each agent's spoke: verified two-way = green, a host's own
  // verified internal mesh = cyan, half-minted / pending = amber (pulses). Other pages have no state -> default.
  const spokeFor = (i) => {
    const st = (nodes[i] && nodes[i].state) || "";
    if (/half minted|pending/i.test(st)) return [1.0, 0.72, 0.2, 0.7];
    if (/local mesh/i.test(st)) return [0.25, 0.85, 0.9, 0.5];
    if (/two-way/i.test(st)) return [0.3, 0.9, 0.55, 0.5];
    return SPOKE;
  };
  const hasPairing = nodes.some((n) => n.state);

  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) { toggle.hidden = true; return; }

  // --- simulation state: sphere-seeded positions settle into clusters ---
  const rng = mulberry32(0x6a1e);
  const pos = new Float32Array((N + H) * 3);
  const vel = new Float32Array(N * 3);
  const HUB_R = H > 1 ? 2.1 : 0;
  for (let h = 0; h < H; h++) { // hubs on a (slightly flattened) fibonacci sphere
    const y = H > 1 ? 1 - (2 * (h + 0.5)) / H : 0, r = Math.sqrt(1 - y * y), th = h * 2.399963;
    pos.set([HUB_R * r * Math.cos(th), HUB_R * y * 0.9, HUB_R * r * Math.sin(th)], (N + h) * 3);
  }
  const shellR = members.map((m) => 0.45 + 0.1 * Math.sqrt(m.length));
  for (let i = 0; i < N; i++) {
    const h = hostOf[i], th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1);
    pos[i * 3] = pos[(N + h) * 3] + shellR[h] * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = pos[(N + h) * 3 + 1] + shellR[h] * Math.cos(ph);
    pos[i * 3 + 2] = pos[(N + h) * 3 + 2] + shellR[h] * Math.sin(ph) * Math.sin(th);
  }

  // --- buffers ---
  const nodeProg = program(gl, NODE_VS, FRAG);
  const lineProg = program(gl, LINE_VS, LINE_FRAG);
  const posBuf = gl.createBuffer();
  const colBuf = gl.createBuffer();
  const lineBuf = gl.createBuffer();
  const lineData = new Float32Array(edges.length * 14); // 2 verts * (pos3+color4) = 7 floats/vert, matches the 28-byte stride
  const nodeColors = new Float32Array((N + H) * 3);
  nodes.forEach((n, i) => nodeColors.set(n.color, i * 3));
  nodeColors.set(hubColors, N * 3);

  /* live packet flow (#3): dots traverse each edge, count/speed follow
     measured tailscale throughput; edges touching a down node dim out.
     Skipped under reduced motion (static graph still renders). */
  // phones / coarse pointers: lighter render (fewer particles, 30 fps, capped DPR) so it stays smooth and cool
  const LITE = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || innerWidth < 700;
  const FLOW_DOTS = LITE ? 1 : 2;
  const flowT = new Float32Array(edges.length * FLOW_DOTS);
  const flowPos = new Float32Array(edges.length * FLOW_DOTS * 3);
  const flowCol = new Float32Array(edges.length * FLOW_DOTS * 3);
  const ptBuf = gl.createBuffer(), ptColBuf = gl.createBuffer();
  const scaleBuf = gl.createBuffer();
  const nodeScale = new Float32Array(N + H).fill(1); // heat modes grow busy/expensive agents (see applyHeat)
  const alertPos = new Float32Array(N * 3), alertCol = new Float32Array(N * 3);
  const ripples = []; // {i, t0, c}
  if (location.search.includes("debug3d")) window.__ripples = ripples; // test hook
  const flowBuf = gl.createBuffer();
  const flowColBuf = gl.createBuffer();
  const live3d = { mbps: 0.5, down: new Set() };
  /* ?simulate=tidal (whole host) or ?simulate=tidal:3,beacon:1 (first N agents) previews the outage
     states (dimmed nodes, amber/red hubs, "x/y up" labels) without anything actually being down */
  const simDown = new Set();
  (new URLSearchParams(location.search).get("simulate") || "").toLowerCase().split(",").filter(Boolean).forEach((spec) => {
    const [h, cnt] = spec.split(":");
    const idx = nodes.map((n, i) => i).filter((i) => nodes[i].host.toLowerCase().replace(/ host$/, "") === h);
    (cnt ? idx.slice(0, Number(cnt) || 0) : idx).forEach((i) => simDown.add(i));
  });
  // time-scrub (status page): window event "gale:scrub" {names:[lowercase agent names that are stale]|null}
  const scrubDown = new Set();
  window.addEventListener("gale:scrub", (e) => {
    scrubDown.clear();
    const names = e.detail && e.detail.names;
    if (names) nodes.forEach((n, i) => { if (names.includes(n.name.toLowerCase())) scrubDown.add(i); });
    applyHeat();
  });
  const isDown = (i) => simDown.has(i) || scrubDown.has(i) || (!!nodes[i].listener && live3d.down.has(nodes[i].listener));
  for (let i = 0; i < flowT.length; i++) flowT[i] = Math.random();

  // --- camera: orbit around origin ---
  let yaw = 0.6, pitch = 0.35, dist = 4.2;
  let dragging = false, lastX = 0, lastY = 0;
  let fitLocked = false; // user zoomed: stop auto-fitting
  const cam = [0, 0, 0], camGoal = [0, 0, 0];      // orbit target (eases to a focused node)
  let focusIdx = -1, focusDist = 4.2, lastInteract = performance.now();
  let pinchActive = false;
  const alertSev = new Uint8Array(N);              // 0 none, 1 warn, 2 crit (from /api/fleet/alerts)
  const alertText = new Map();                     // node index -> alert text
  const starN = LITE ? 90 : 260, starPos = new Float32Array(starN * 3), starCol = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) { // fixed world-space starfield: parallaxes as the camera orbits
    const th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1), r = 16 + rng() * 14, b = 0.12 + rng() * 0.3;
    starPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    starCol.set([b * 0.8, b * 0.9, b], i * 3);
  }

  const VMAX = 0.05;

  // agents repel their own host-mates and spring to a shell around the hub;
  // hubs are pinned, so the layout is stable and the same on every load
  const step = () => {
    for (let h = 0; h < H; h++) {
      const hx = pos[(N + h) * 3], hy = pos[(N + h) * 3 + 1], hz = pos[(N + h) * 3 + 2];
      for (const i of members[h]) {
        const f = [0, 0, 0];
        for (const j of members[h]) {
          if (i === j) continue;
          const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const d2 = Math.max(dx * dx + dy * dy + dz * dz, 0.01);
          const k = 0.003 / (d2 * Math.sqrt(d2));
          f[0] += dx * k; f[1] += dy * k; f[2] += dz * k;
        }
        const ox = pos[i * 3] - hx, oy = pos[i * 3 + 1] - hy, oz = pos[i * 3 + 2] - hz;
        const d = Math.hypot(ox, oy, oz) || 1, pull = (shellR[h] - d) * 0.1 / d;
        f[0] += ox * pull; f[1] += oy * pull; f[2] += oz * pull;
        for (let c = 0; c < 3; c++) {
          vel[i * 3 + c] = Math.max(-VMAX, Math.min(VMAX, (vel[i * 3 + c] + f[c]) * 0.85));
          pos[i * 3 + c] += vel[i * 3 + c];
        }
      }
    }
  };

  function camMatrix() {
    const eye = [
      cam[0] + dist * Math.cos(pitch) * Math.sin(yaw),
      cam[1] + dist * Math.sin(pitch),
      cam[2] + dist * Math.cos(pitch) * Math.cos(yaw),
    ];
    return mul4(mat4Perspective(0.9, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 80), mat4LookAt(eye, cam, [0, 1, 0]));
  }

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, LITE ? 1.5 : 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
  };

  // host labels: DOM text projected from each hub every frame (textContent only)
  const labelBox = document.createElement("div");
  labelBox.setAttribute("aria-hidden", "true");
  labelBox.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2";
  const labels = hostNames.map((h, i) => {
    const el = document.createElement("span");
    el.textContent = `${h || "host"} \u00b7 ${members[i].length}`;
    el.style.cssText = "position:absolute;transform:translate(-50%,0);padding:2px 8px;border-radius:999px;" +
      "font:600 0.7rem var(--font-mono,monospace);letter-spacing:.04em;white-space:nowrap;" +
      "color:#e8eefc;background:rgba(10,16,30,.62);border:1px solid rgba(160,185,230,.3)";
    labelBox.appendChild(el);
    return el;
  });
  if (canvas.parentElement) canvas.parentElement.appendChild(labelBox);

  let raf = 0, frameN = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    if (document.hidden) return;
    if (LITE && (frameN++ & 1)) return; // 30 fps on phones
    step();
    resize();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // auto-fit: ease the orbit distance toward the cluster's real extent so the
    // whole graph is always framed (layout size depends on roster/edge count)
    if (!fitLocked) {
      let maxR = 0;
      for (let i = 0; i < N + H; i++) maxR = Math.max(maxR, Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
      const want = Math.max(4.2, Math.min(30, maxR * 2.5));
      dist += (want - dist) * 0.04;
    }
    if (focusIdx >= 0) for (let c = 0; c < 3; c++) camGoal[c] = pos[focusIdx * 3 + c]; // follow the focused node
    for (let c = 0; c < 3; c++) cam[c] += (camGoal[c] - cam[c]) * 0.08;
    if (focusIdx >= 0) dist += (focusDist - dist) * 0.07;
    // idle auto-orbit: a slow drift after a few seconds without input (never under reduced motion)
    if (!REDUCED3D && !dragging && focusIdx < 0 && performance.now() - lastInteract > 4000) yaw += 0.0022;
    const m = camMatrix();

    // lines
    let k = 0;
    for (const [a, b, kind] of edges) {
      const col = kind ? TRUNK : spokeFor(a);
      const pend = !kind && /half minted|pending/i.test(nodes[a].state || "");
      const dimmed = !kind && isDown(a);
      for (const v of [a, b]) {
        lineData.set([pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], col[0], col[1], col[2], dimmed ? col[3] * 0.3 : pend && !REDUCED3D ? col[3] * (0.55 + 0.45 * Math.sin(performance.now() / 380)) : col[3]], k);
        k += 7;
      }
    }
    gl.useProgram(lineProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);
    const lp = lineProg;
    const la = gl.getAttribLocation(lp, "a_pos");
    const la2 = gl.getAttribLocation(lp, "a_color");
    gl.enableVertexAttribArray(la);
    gl.enableVertexAttribArray(la2);
    gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(la2, 4, gl.FLOAT, false, 28, 12);
    gl.uniformMatrix4fv(gl.getUniformLocation(lp, "u_mvp"), false, m);
    gl.drawArrays(gl.LINES, 0, edges.length * 2);

    // nodes
    gl.useProgram(nodeProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, nodeColors, gl.STATIC_DRAW);
    const np = nodeProg;
    const na = gl.getAttribLocation(np, "a_pos");
    const na2 = gl.getAttribLocation(np, "a_color");
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(na);
    gl.vertexAttribPointer(na, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.enableVertexAttribArray(na2);
    gl.vertexAttribPointer(na2, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(np, "u_mvp"), false, m);
    const dpr3 = Math.min(devicePixelRatio || 1, LITE ? 1.5 : 2);
    const uMode = gl.getUniformLocation(np, "u_mode");
    const uSize = gl.getUniformLocation(np, "u_size");
    const ns = gl.getAttribLocation(np, "a_scale");
    gl.bindBuffer(gl.ARRAY_BUFFER, scaleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, nodeScale, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(ns);
    gl.vertexAttribPointer(ns, 1, gl.FLOAT, false, 0, 0);
    // halo (additive, gently breathing) then crisp core on top
    const breathe = REDUCED3D ? 1 : 1 + 0.12 * Math.sin(performance.now() / 700);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniform1f(uMode, 1);
    gl.uniform1f(uSize, 30 * dpr3 * breathe);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.uniform1f(uSize, 70 * dpr3 * breathe); // hub bloom
    gl.drawArrays(gl.POINTS, N, H);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uMode, 0);
    gl.uniform1f(uSize, 9 * dpr3);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.uniform1f(uSize, 16 * dpr3);
    gl.drawArrays(gl.POINTS, N, H);

    // everything below (stars, alert halos, focus ring, flow dots) is unscaled: constant a_scale = 1
    gl.disableVertexAttribArray(ns);
    gl.vertexAttrib1f(ns, 1);
    // starfield: tiny dim cores
    const drawPts = (p, c, count, size, mode, additive) => {
      if (!count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf); gl.bufferData(gl.ARRAY_BUFFER, p, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(na); gl.vertexAttribPointer(na, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, ptColBuf); gl.bufferData(gl.ARRAY_BUFFER, c, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(na2); gl.vertexAttribPointer(na2, 3, gl.FLOAT, false, 0, 0);
      gl.blendFunc(additive ? gl.ONE : gl.SRC_ALPHA, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(uMode, mode); gl.uniform1f(uSize, size); gl.drawArrays(gl.POINTS, 0, count);
    };
    drawPts(starPos, starCol, starN, 2 * dpr3, 0, false);
    // alert halos: agents with an open warn/crit alert pulse amber/red (additive halo + tinted core)
    const tNow = performance.now(), pulse = REDUCED3D ? 1 : 1 + 0.35 * Math.sin(tNow / 330);
    let an = 0;
    for (let i = 0; i < N; i++) {
      if (!alertSev[i]) continue;
      alertPos.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], an * 3);
      alertCol.set(alertSev[i] === 2 ? [1.0, 0.27, 0.3] : [1.0, 0.68, 0.18], an * 3);
      an++;
    }
    if (an) {
      const ap = alertPos.subarray(0, an * 3), ac = alertCol.subarray(0, an * 3);
      drawPts(ap, ac, an, 62 * dpr3 * pulse, 1, true);
      drawPts(ap, ac, an, 12 * dpr3, 0, false);
    }
    // focus ring
    if (focusIdx >= 0) {
      const fp = new Float32Array([pos[focusIdx * 3], pos[focusIdx * 3 + 1], pos[focusIdx * 3 + 2]]);
      drawPts(fp, new Float32Array([0.55, 0.75, 1.0]), 1, 96 * dpr3 * pulse, 1, true);
      drawPts(fp, new Float32Array([1, 1, 1]), 1, (focusIdx >= N ? 20 : 12) * dpr3, 0, false);
    }

    // live-activity ripples: an expanding, fading ring from the agent that just did something
    if (ripples.length && !REDUCED3D) {
      const nowT = performance.now();
      for (let r = ripples.length - 1; r >= 0; r--) if (nowT - ripples[r].t0 > 2600) ripples.splice(r, 1);
      for (const rp of ripples) {
        const age = (nowT - rp.t0) / 2600, f = 1 - age;
        const rpos = new Float32Array([pos[rp.i * 3], pos[rp.i * 3 + 1], pos[rp.i * 3 + 2]]);
        drawPts(rpos, new Float32Array([rp.c[0] * f * 2.4, rp.c[1] * f * 2.4, rp.c[2] * f * 2.4]), 1, (30 + age * 190) * dpr3, 1, true);
      }
    }

    // flow dots (skip entirely under reduced motion)
    if (!REDUCED3D && edges.length) {
      const speed = 0.22 + Math.min(2.5, live3d.mbps / 2) * 0.22; // world units/s
      const dt = 1 / 60;
      for (let e = 0; e < edges.length; e++) {
        const [a, b, kind] = edges[e];
        const dx = pos[b * 3] - pos[a * 3], dy = pos[b * 3 + 1] - pos[a * 3 + 1], dz = pos[b * 3 + 2] - pos[a * 3 + 2];
        const len = Math.hypot(dx, dy, dz) || 1;
        const dim = !kind && isDown(a) ? 0.22 : 1;
        for (let k = 0; k < FLOW_DOTS; k++) {
          const fi = e * FLOW_DOTS + k;
          flowT[fi] = (flowT[fi] + (speed * dt) / len) % 1;
          // alternate direction per dot for duplex suggestion
          const t = k % 2 ? flowT[fi] : 1 - flowT[fi];
          flowPos[fi * 3] = pos[a * 3] + dx * t;
          flowPos[fi * 3 + 1] = pos[a * 3 + 1] + dy * t;
          flowPos[fi * 3 + 2] = pos[a * 3 + 2] + dz * t;
          const glow = kind ? 1 : 0.6;
          flowCol[fi * 3] = 0.13 * dim * glow; flowCol[fi * 3 + 1] = 0.9 * dim * glow; flowCol[fi * 3 + 2] = 1.0 * dim * glow;
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, flowBuf);
      gl.bufferData(gl.ARRAY_BUFFER, flowPos, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(na);
      gl.vertexAttribPointer(na, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, flowColBuf);
      gl.bufferData(gl.ARRAY_BUFFER, flowCol, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(na2);
      gl.vertexAttribPointer(na2, 3, gl.FLOAT, false, 0, 0);
      // comet glow behind each flow dot, then the dot itself
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform1f(uMode, 1);
      gl.uniform1f(uSize, 12 * dpr3);
      gl.drawArrays(gl.POINTS, 0, edges.length * FLOW_DOTS);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(uMode, 0);
      gl.uniform1f(uSize, 3 * dpr3);
      gl.drawArrays(gl.POINTS, 0, edges.length * FLOW_DOTS);
    }

    labelBox.style.display = canvas.hidden ? "none" : "";
    if (!canvas.hidden) {
      const kx = canvas.clientWidth / gl.drawingBufferWidth, ky = canvas.clientHeight / gl.drawingBufferHeight;
      // host labels sit under their hubs; when two would collide, nudge the lower one down (no overlap smear)
      const placed = labels.map((el, h) => { const [sx, sy] = project(N + h, m); return { el, x: sx * kx, y: sy * ky + 14, w: el.offsetWidth || 90 }; })
        .sort((a, b) => a.y - b.y);
      placed.forEach((p, i) => {
        for (let j = 0; j < i; j++) {
          const q = placed[j];
          if (Math.abs(p.x - q.x) < (p.w + q.w) / 2 + 4 && Math.abs(p.y - q.y) < 22) p.y = q.y + 22;
        }
        p.el.style.left = `${p.x}px`;
        p.el.style.top = `${p.y}px`;
      });
      if (focusIdx >= 0) {
        const [fx, fy] = project(focusIdx, m);
        focusLabel.style.left = `${fx * kx}px`;
        focusLabel.style.top = `${fy * ky - 46}px`;
      }
    }
  };

  function mul4(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }

  // --- interaction ---
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || pinchActive) return;
    yaw += (e.clientX - lastX) * 0.008;
    pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - lastY) * 0.008));
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    fitLocked = true;
    dist = Math.max(1.5, Math.min(30, dist + e.deltaY * 0.004));
  }, { passive: false });

  toggle.addEventListener("click", () => {
    const on = canvas.hidden;
    // the canvas is absolutely positioned inside the wrapper, which only has
    // height because the SVG is in flow -- pin it before taking the SVG out
    const wrap3d = svg.parentElement;
    if (on) wrap3d.style.minHeight = Math.max(360, Math.round(svg.getBoundingClientRect().height)) + "px";
    else wrap3d.style.minHeight = "";
    canvas.hidden = !on;
    svg.style.display = on ? "none" : "";
    toggle.textContent = on ? "← svg view" : "3d view";
    toggle.setAttribute("aria-pressed", String(on));
    if (on && !raf) draw();
  });
  if (!toggle.hidden) draw();

  /* ---- heat overlays (cost / runs / errors, 24h) ---- */
  const LAYERS = {
    none: null,
    runs: { pick: (a) => a.runs_24h, hue: [0.29, 0.83, 0.62], label: "runs 24h" },
    cost: { pick: (a) => a.cost_24h, hue: [1.0, 0.75, 0.29], label: "cost 24h" },
    errors: { pick: (a) => a.error_runs_24h, hue: [0.95, 0.32, 0.42], label: "errors 24h" },
    // hours since the agent's last wake (agents with no wake on record count as 48 h): stale = hot
    stale: { pick: (a) => (a.last_wake ? Math.min(48, (Date.now() - new Date(a.last_wake).getTime()) / 3.6e6) : 48), hue: [1.0, 0.45, 0.2], label: "hours since wake" },
  };
  let heatMode = "none";
  let heatStats = null; // Map(agentName_lower -> per_agent_24h entry)

  // selector chips under the toggle, visible only in 3d view
  let heatBar = null;
  const ensureHeatBar = () => {
    if (heatBar) return heatBar;
    heatBar = document.createElement("div");
    heatBar.id = "topo-heat";
    heatBar.setAttribute("role", "toolbar");
    heatBar.setAttribute("aria-label", "Heat overlay layer");
    heatBar.style.cssText = "position:absolute;bottom:12px;left:12px;z-index:3;display:flex;flex-wrap:wrap;gap:6px";
    heatBar.innerHTML = Object.keys(LAYERS).map((k) =>
      `<button type="button" data-heat="${k}" class="mini-toggle" aria-pressed="false"
        style="padding:6px 10px;min-height:32px;font-size:0.7rem">${LAYERS[k] ? LAYERS[k].label : "no heat"}</button>`).join("");
    heatBar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-heat]");
      if (!b) return;
      heatMode = b.dataset.heat;
      for (const btn of heatBar.querySelectorAll("[data-heat]"))
        btn.setAttribute("aria-pressed", String(btn.dataset.heat === heatMode));
      applyHeat();
    });
    const wrap = canvas.parentElement;
    if (wrap) wrap.appendChild(heatBar);
    return heatBar;
  };

  const hexToLinear = (hex) => {
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  async function loadHeat() {
    try {
      const r = await fetch("api/fleet/metrics", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      heatStats = new Map((d.per_agent_24h || [])
        .map((a) => [String(a.agent || "").toLowerCase(), a]));
      // liveness join (#3): fleet_status entries carry listener; nodes whose
      // listener sweep is down get dimmed in applyHeat + dim flow edges.
      live3d.down = new Set(Object.values(d.fleet_status || {})
        .filter((st) => !(st.state || "").startsWith("up"))
        .map((st) => st.listener));
      applyHeat();
    } catch { /* heat is optional decoration */ }
    try {
      const s = await fetch("api/status.json", { cache: "no-store" });
      if (!s.ok) return;
      const d = await s.json();
      const ifs = (d.network && d.network.interfaces) || [];
      const ts = ifs.find((i) => /tailscale/i.test(i.name || ""));
      if (ts) live3d.mbps = Math.max(0, (ts.rx_mbps || 0) + (ts.tx_mbps || 0));
    } catch { /* keep last rate */ }
  }

  function applyHeat() {
    const layer = LAYERS[heatMode];
    const colors = new Float32Array((N + H) * 3);
    if (!layer || !heatStats) {
      nodes.forEach((n, i) => {
        const dim = isDown(i) ? 0.3 : 1;
        colors.set([n.color[0] * dim, n.color[1] * dim, n.color[2] * dim], i * 3);
      });
    } else {
      // normalize this metric across nodes to [0.15, 1] heat intensity
      const raw = nodes.map((n) => {
        const a = heatStats.get(n.name.toLowerCase());
        return a ? (layer.pick(a) || 0) : 0;
      });
      const max = Math.max(...raw, 0.0001);
      nodes.forEach((n, i) => {
        const t = 0.15 + 0.85 * (raw[i] / max);
        const base = n.color;
        // liveness dim (#3): down-sweep nodes sink in every heat mode
        const dim = isDown(i) ? 0.3 : 1;
        colors.set([
          (base[0] * (1 - t) + layer.hue[0] * t) * dim,
          (base[1] * (1 - t) + layer.hue[1] * t) * dim,
          (base[2] * (1 - t) + layer.hue[2] * t) * dim,
        ], i * 3);
      });
    }
    colors.set(hubColors, N * 3);
    if (opts.health) { // hub colour + label follow the listener sweep: green all up, amber partial, red none
      hostNames.forEach((h, hi) => {
        const up = members[hi].filter((i) => !isDown(i)).length, tot = members[hi].length;
        colors.set(up === tot ? [0.2, 0.85, 0.55] : up === 0 ? [1.0, 0.3, 0.33] : [1.0, 0.72, 0.2], (N + hi) * 3);
        labels[hi].textContent = `${h || "host"} \u00b7 ${up}/${tot} up`;
      });
    }
    // size follows the metric too (0.8x .. 2.0x) so heavy agents read at a glance, not just by hue
    nodeScale.fill(1);
    if (layer && heatStats) {
      const raw2 = nodes.map((n) => { const a = heatStats.get(n.name.toLowerCase()); return a ? (layer.pick(a) || 0) : 0; });
      const max2 = Math.max(...raw2, 0.0001);
      raw2.forEach((v, i) => { nodeScale[i] = 0.8 + 1.2 * Math.sqrt(v / max2); });
    }
    // the draw loop re-uploads nodeColors every frame, so the result must land there (uploading `colors`
    // directly was overwritten on the next frame: heat hues, down-dimming and health hubs never stuck)
    nodeColors.set(colors);
  }

  // refresh heat each time the 3d view opens + every 60s while open
  const origToggle = toggle.onclick;
  toggle.addEventListener("click", () => {
    if (!canvas.hidden) {
      if (opts.noHeat) return;
      ensureHeatBar().style.display = "flex";
      if (!heatStats) loadHeat();
      else applyHeat();
    } else if (heatBar) heatBar.style.display = "none";
  });
  setInterval(() => { if (!canvas.hidden) loadHeat(); }, 60000);

  // tooltip: agent + its heat numbers on hover
  const tip = document.createElement("div");
  tip.id = "topo-3d-tip";
  tip.hidden = true;
  tip.style.cssText = "position:absolute;z-index:4;pointer-events:none;padding:6px 10px;" +
    "background:rgba(12,20,38,.94);border:1px solid rgba(160,185,230,.3);" +
    "border-radius:8px;font-family:var(--font-mono,monospace);font-size:0.72rem;color:#e8eefc";
  canvas.parentElement && canvas.parentElement.appendChild(tip);

  // pick nearest node by projected screen distance
  function project(i, m) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    const cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    return [(cx * 0.5 + 0.5) * gl.drawingBufferWidth,
            (0.5 - cy * 0.5) * gl.drawingBufferHeight];
  }

  canvas.addEventListener("pointermove", (e) => {
    if (dragging) { tip.hidden = true; return; }
    const rect = canvas.getBoundingClientRect();
    lastInteract = performance.now();
    const best = pickAt(e.clientX, e.clientY, false);
    canvas.style.cursor = best === -1 ? "grab" : "pointer";
    if (best === -1) { tip.hidden = true; return; }
    const n = nodes[best];
    const a = heatStats && heatStats.get(n.name.toLowerCase());
    const a2 = a ? `${a.runs_24h ?? "–"} runs · $${(a.cost_24h ?? 0).toFixed(2)} · ${a.error_runs_24h ?? 0} err` : "";
    const al = alertText.get(best);
    tip.innerHTML = `<strong>${esc3d(n.name)}</strong> · ${esc3d(n.model || "")}<br>${esc3d(n.host)}<br>${esc3d(n.listener)}${a2 ? `<br><span style="color:var(--text-faint,#6b7c94)">${esc3d(a2)}</span>` : ""}${al ? `<br><span style="color:${alertSev[best] === 2 ? "#ff7b80" : "#ffb54a"}">\u25cf ${esc3d(al)}</span>` : ""}<br><span style="color:var(--text-faint,#6b7c94)">click to focus</span>`;
    tip.hidden = false;
    tip.style.left = `${Math.min(e.clientX - rect.left + 14, rect.width - 190)}px`;
    tip.style.top = `${Math.max(e.clientY - rect.top - 10, 4)}px`;
  });
  canvas.addEventListener("pointerleave", () => { tip.hidden = true; });

  /* ---- picking, click-to-focus, alert halos, auto-open ---- */
  // nearest node (or, with hubs=true, host hub) to a client point, by projected screen distance
  function pickAt(clientX, clientY, hubs) {
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (gl.drawingBufferWidth / rect.width);
    const py = (clientY - rect.top) * (gl.drawingBufferHeight / rect.height);
    const m = camMatrix();
    let best = -1, bestD = 24 * 24 * (devicePixelRatio > 1 ? 2.2 : 1);
    const upto = hubs ? N + H : N;
    for (let i = 0; i < upto; i++) {
      const [sx, sy] = project(i, m);
      const dx = sx - px, dy = sy - py, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  if (hasPairing && canvas.parentElement) {
    const leg = document.createElement("div");
    leg.setAttribute("aria-hidden", "true");
    leg.style.cssText = "position:absolute;left:12px;top:44px;z-index:3;pointer-events:none;display:flex;flex-direction:column;gap:3px;padding:6px 10px;" +
      "border-radius:8px;background:rgba(8,14,28,.9);font:0.64rem var(--font-mono,monospace);color:#d4deef";
    leg.innerHTML = [["#4de68c", "two-way verified"], ["#40d9e6", "verified local mesh"], ["#ffb833", "half-minted / pending"]]
      .map(([c, t]) => `<span><i style="display:inline-block;width:14px;height:3px;background:${c};margin-right:6px;vertical-align:middle"></i>${t}</span>`).join("");
    canvas.parentElement.appendChild(leg);
  }

  const focusLabel = document.createElement("div");
  focusLabel.setAttribute("aria-live", "polite");
  focusLabel.hidden = true;
  focusLabel.style.cssText = "position:absolute;z-index:3;transform:translate(-50%,0);pointer-events:none;padding:4px 10px;" +
    "border-radius:10px;font:600 0.74rem var(--font-mono,monospace);white-space:nowrap;color:#fff;" +
    "background:rgba(20,40,90,.82);border:1px solid rgba(140,185,255,.6);box-shadow:0 0 18px rgba(110,168,245,.5)";
  canvas.parentElement && canvas.parentElement.appendChild(focusLabel);

  const hint = document.createElement("div");
  hint.setAttribute("aria-hidden", "true");
  hint.style.cssText = "position:absolute;right:12px;bottom:12px;z-index:3;pointer-events:none;font:0.66rem var(--font-mono,monospace);" +
    "color:#d4deef;background:rgba(8,14,28,.9);padding:3px 9px;border-radius:8px;text-align:right;line-height:1.5";
  hint.textContent = LITE ? "drag to orbit \u00b7 pinch to zoom \u00b7 tap a node"
                          : "drag to orbit \u00b7 scroll to zoom \u00b7 click a node or host to focus \u00b7 esc to reset";
  if (LITE) hint.hidden = true; // touch users know the gestures; the hint only covered the map
  canvas.parentElement && canvas.parentElement.appendChild(hint);

  function focusOn(i) {
    if (i < 0) return clearFocus();
    focusIdx = i;
    fitLocked = true;
    focusDist = i >= N ? 3.6 : 2.3;
    lastInteract = performance.now();
    const n = i < N ? nodes[i] : null;
    const al = alertText.get(i);
    focusLabel.textContent = i < N
      ? `${n.name} \u00b7 ${n.model || "agent"} \u00b7 ${n.host}${al ? " \u00b7 \u25cf " + al : ""}`
      : `${hostNames[i - N] || "host"} \u00b7 ${members[i - N].length} agents`;
    focusLabel.hidden = false;
    for (const g of svg.querySelectorAll(".topo-node")) g.classList.toggle("is-focus", i < N && g.dataset.name === n.name);
    if (opts.onActivate && i < N) setTimeout(() => { if (focusIdx === i) opts.onActivate(nodes[i]); }, 900); // e.g. the 404 map navigates to the picked page
  }
  function clearFocus() {
    focusIdx = -1; camGoal[0] = camGoal[1] = camGoal[2] = 0;
    fitLocked = false; focusLabel.hidden = true;
    for (const g of svg.querySelectorAll(".topo-node.is-focus")) g.classList.remove("is-focus");
  }
  const byName = (name) => nodes.findIndex((n) => n.name.toLowerCase() === String(name || "").toLowerCase());

  let downX = 0, downY = 0;
  canvas.addEventListener("pointerdown", (e) => { downX = e.clientX; downY = e.clientY; lastInteract = performance.now(); });
  canvas.addEventListener("pointerup", (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // that was a drag
    focusOn(pickAt(e.clientX, e.clientY, true));
  });
  canvas.addEventListener("wheel", () => { lastInteract = performance.now(); }, { passive: true });
  // keyboard: focus the canvas; arrows orbit, +/- zoom, Esc resets (the map is otherwise mouse/touch only)
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowLeft") yaw -= 0.12; else if (k === "ArrowRight") yaw += 0.12;
    else if (k === "ArrowUp") pitch = Math.max(-1.4, pitch - 0.08); else if (k === "ArrowDown") pitch = Math.min(1.4, pitch + 0.08);
    else if (k === "+" || k === "=") { dist = Math.max(1.5, dist * 0.9); fitLocked = true; }
    else if (k === "-" || k === "_") { dist = Math.min(30, dist * 1.1); fitLocked = true; }
    else return;
    e.preventDefault(); lastInteract = performance.now();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && focusIdx >= 0 && !canvas.hidden) clearFocus(); });
  // other parts of the page (the nav alert panel) can focus an agent
  window.addEventListener("gale:focus-agent", (e) => { const i = byName(e.detail && e.detail.agent); if (i >= 0) focusOn(i); });
  window.addEventListener("gale:focus-clear", () => clearFocus());

  // alert halos: any warn/crit alert text that names an agent lights that agent up
  async function loadAlerts() {
    try {
      const r = await fetch("api/fleet/alerts", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      alertSev.fill(0); alertText.clear();
      for (const a of d.alerts || []) {
        const sev = a.sev === "crit" ? 2 : a.sev === "warn" ? 1 : 0;
        if (!sev) continue;
        nodes.forEach((n, i) => {
          // (?<![-\w]) / (?![-\w]) so "gale-agent" or "GaleAgentSilent" don't match the agent "Gale"
          if (new RegExp(`(?<![-\\w])${n.name.replace(/[^\w]/g, "")}(?![-\\w])`, "i").test(a.text || "") && sev >= alertSev[i]) {
            alertSev[i] = sev; alertText.set(i, a.text);
          }
        });
      }
    } catch { /* decoration only */ }
  }
  loadAlerts();
  setInterval(loadAlerts, 60000);

  /* live activity: poll the activity feed; every event newer than the last one seen ripples from its agent
     (commit = cyan, waking = green, backup = blue, flag = red). Skipped when no node matches (e.g. the LAN map). */
  if (!opts.noActivity && !opts.nodes) {
    const KIND = { commit: [0.2, 0.9, 1.0], waking: [0.3, 1.0, 0.55], backup: [0.4, 0.6, 1.0], "peer-flag": [1.0, 0.35, 0.35], peer: [0.8, 0.6, 1.0], relay: [0.8, 0.6, 1.0] };
    let seen = null;
    const poll = async () => {
      try {
        if (canvas.hidden || document.hidden) return;
        const r = await fetch("api/fleet/activity", { cache: "no-store" });
        if (!r.ok) return;
        const evs = ((await r.json()).events || []).slice().sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
        if (seen === null) { seen = evs.length ? evs[evs.length - 1].ts : ""; return; }   // first poll: just remember where we are
        let n = 0;
        for (const e of evs) {
          if (String(e.ts) <= seen) continue;
          const i = nodes.findIndex((x) => x.name.toLowerCase() === String(e.agent || "").toLowerCase());
          if (i >= 0 && n++ < 6) ripples.push({ i, t0: performance.now() + n * 180, c: KIND[e.kind] || [0.8, 0.9, 1.0] });
        }
        if (evs.length) seen = evs[evs.length - 1].ts;
      } catch { /* decoration only */ }
    };
    poll();
    setInterval(poll, 15000);
  }

  /* touch: vertical swipes keep scrolling the page (pan-y), horizontal drags orbit, two fingers pinch-zoom */
  if (LITE) canvas.style.touchAction = "pan-y";
  const touches = new Map();
  let pinchStart = 0, pinchDist0 = 0;
  const tdist = () => { const [a, b] = [...touches.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  canvas.addEventListener("pointerdown", (e) => {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { pinchActive = true; pinchStart = tdist(); pinchDist0 = dist; fitLocked = true; }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchActive && touches.size === 2) {
      dist = Math.max(1.5, Math.min(30, pinchDist0 * (pinchStart / tdist()))); // fingers apart = closer
      lastInteract = performance.now();
    }
  });
  const endTouch = (e) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinchActive = false;
    if (e.type === "pointercancel") dragging = false;
  };
  canvas.addEventListener("pointerup", endTouch);
  canvas.addEventListener("pointercancel", endTouch);

  // open in 3D by default where it's cheap and expected: wide screens (or when the page asks, e.g. the
  // home/status maps, which run the lite renderer on phones), motion allowed, not data-saver
  const params = new URLSearchParams(location.search);
  const want = opts.autoOpen !== undefined ? opts.autoOpen : innerWidth >= 700;
  if (want && !REDUCED3D && document.documentElement.dataset.saver !== "1" && !params.has("svg") && canvas.hidden) {
    requestAnimationFrame(() => toggle.click());
  }
  return true;
}
