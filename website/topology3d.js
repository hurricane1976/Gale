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
uniform mat4 u_mvp;
uniform float u_size;
varying vec3 v_color;
void main() {
  gl_Position = u_mvp * vec4(a_pos, 1.0);
  gl_PointSize = u_size;
  v_color = a_color;
}`;

const FRAG = `
precision mediump float;
varying vec3 v_color;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  if (dot(d, d) > 0.25) discard;
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

export function initTopology3D() {
  const toggle = document.getElementById("topo-3d-toggle");
  const canvas = document.getElementById("topo-3d-canvas");
  const svg = document.querySelector(".topo-svg");
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
  const nodes = [...document.querySelectorAll(".topo-node")].map((g) => ({
    name: g.dataset.name || "",
    host: g.dataset.host || "",
    model: g.getAttribute("data-model") || "",
    listener: g.getAttribute("data-listener") || "",
    color: resolve(getComputedStyle(g).getPropertyValue("--node-color")),
  }));
  probe.remove();
  if (nodes.length < 2) return;

  const byName = new Map(nodes.map((n, i) => [n.name.toLowerCase(), i]));
  const edges = [];
  for (const line of document.querySelectorAll(".topo-svg line")) {
    const t = (line.querySelector("title") || {}).textContent || "";
    const m = t.match(/^([A-Za-z]+)\s*(?:&amp;harr;|&harr;|↔)\s*([A-Za-z]+)/);
    if (!m) continue;
    const a = byName.get(m[1].toLowerCase()), b = byName.get(m[2].toLowerCase());
    if (a != null && b != null && a !== b) edges.push([a, b]);
  }

  const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) { toggle.hidden = true; return; }

  // --- simulation state: sphere-seeded positions settle into clusters ---
  const rng = mulberry32(0x6a1e);
  const pos = new Float32Array(nodes.length * 3);
  const vel = new Float32Array(nodes.length * 3);
  for (let i = 0; i < nodes.length; i++) {
    const th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1), r = 1.2;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }

  // --- buffers ---
  const nodeProg = program(gl, NODE_VS, FRAG);
  const lineProg = program(gl, LINE_VS, LINE_FRAG);
  const posBuf = gl.createBuffer();
  const colBuf = gl.createBuffer();
  const lineBuf = gl.createBuffer();
  const lineData = new Float32Array(edges.length * 8); // 2 verts * (pos3+color4)
  const nodeColors = new Float32Array(nodes.length * 3);
  nodes.forEach((n, i) => nodeColors.set(n.color, i * 3));

  /* live packet flow (#3): dots traverse each edge, count/speed follow
     measured tailscale throughput; edges touching a down node dim out.
     Skipped under reduced motion (static graph still renders). */
  const FLOW_DOTS = 3;
  const flowT = new Float32Array(edges.length * FLOW_DOTS);
  const flowPos = new Float32Array(edges.length * FLOW_DOTS * 3);
  const flowCol = new Float32Array(edges.length * FLOW_DOTS * 3);
  const flowBuf = gl.createBuffer();
  const flowColBuf = gl.createBuffer();
  const live3d = { mbps: 0.5, down: new Set() };
  for (let i = 0; i < flowT.length; i++) flowT[i] = Math.random();

  // --- camera: orbit around origin ---
  let yaw = 0.6, pitch = 0.35, dist = 4.2;
  let dragging = false, lastX = 0, lastY = 0;

  const step = () => {
    // forces: pair repulsion, spring links, mild centering, damping
    const N = nodes.length;
    for (let i = 0; i < N; i++) {
      const fx = [0, 0, 0];
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d2 = Math.max(dx * dx + dy * dy + dz * dz, 0.01);
        const f = 0.02 / d2;
        const inv = 1 / Math.sqrt(d2);
        fx[0] += dx * inv * f; fx[1] += dy * inv * f; fx[2] += dz * inv * f;
      }
      fx[1] -= pos[i * 3 + 1] * 0.002; // centering
      fx[0] -= pos[i * 3] * 0.002;
      fx[2] -= pos[i * 3 + 2] * 0.002;
      vel[i * 3] = (vel[i * 3] + fx[0]) * 0.85;
      vel[i * 3 + 1] = (vel[i * 3 + 1] + fx[1]) * 0.85;
      vel[i * 3 + 2] = (vel[i * 3 + 2] + fx[2]) * 0.85;
      pos[i * 3] += vel[i * 3];
      pos[i * 3 + 1] += vel[i * 3 + 1];
      pos[i * 3 + 2] += vel[i * 3 + 2];
    }
    for (const [a, b] of edges) {
      const dx = pos[b * 3] - pos[a * 3], dy = pos[b * 3 + 1] - pos[a * 3 + 1], dz = pos[b * 3 + 2] - pos[a * 3 + 2];
      const d = Math.hypot(dx, dy, dz) || 1;
      const f = (d - 0.9) * 0.01; // spring toward rest length 0.9
      const ux = dx / d * f, uy = dy / d * f, uz = dz / d * f;
      vel[a * 3] += ux; vel[a * 3 + 1] += uy; vel[a * 3 + 2] += uz;
      vel[b * 3] -= ux; vel[b * 3 + 1] -= uy; vel[b * 3 + 2] -= uz;
    }
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
  };

  let raf = 0;
  const draw = () => {
    raf = requestAnimationFrame(draw);
    if (document.hidden) return;
    step();
    resize();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const eye = [
      dist * Math.cos(pitch) * Math.sin(yaw),
      dist * Math.sin(pitch),
      dist * Math.cos(pitch) * Math.cos(yaw),
    ];
    const mvp = mat4Perspective(0.9, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 50);
    // fold lookAt into a single matrix (column-major multiply)
    const view = mat4LookAt(eye, [0, 0, 0], [0, 1, 0]);
    const m = mul4(mvp, view);

    // lines
    let k = 0;
    for (const [a, b] of edges) {
      lineData.set([pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], 0.25], k); k += 4;
      lineData.set([pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2], 0.25], k); k += 4;
    }
    // also same-host grouping lines would go here (edges from host map)
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
    gl.uniform1f(gl.getUniformLocation(np, "u_size"), 10 * (devicePixelRatio || 1));
    gl.drawArrays(gl.POINTS, 0, nodes.length);

    // flow dots (skip entirely under reduced motion)
    if (!REDUCED3D && edges.length) {
      const speed = 0.22 + Math.min(2.5, live3d.mbps / 2) * 0.22; // world units/s
      const dt = 1 / 60;
      for (let e = 0; e < edges.length; e++) {
        const [a, b] = edges[e];
        const dx = pos[b * 3] - pos[a * 3], dy = pos[b * 3 + 1] - pos[a * 3 + 1], dz = pos[b * 3 + 2] - pos[a * 3 + 2];
        const len = Math.hypot(dx, dy, dz) || 1;
        const dim = (live3d.down.has(nodes[a].listener) || live3d.down.has(nodes[b].listener)) ? 0.22 : 1;
        for (let k = 0; k < FLOW_DOTS; k++) {
          const fi = e * FLOW_DOTS + k;
          flowT[fi] = (flowT[fi] + (speed * dt) / len) % 1;
          // alternate direction per dot for duplex suggestion
          const t = k % 2 ? flowT[fi] : 1 - flowT[fi];
          flowPos[fi * 3] = pos[a * 3] + dx * t;
          flowPos[fi * 3 + 1] = pos[a * 3 + 1] + dy * t;
          flowPos[fi * 3 + 2] = pos[a * 3 + 2] + dz * t;
          flowCol[fi * 3] = 0.13 * dim; flowCol[fi * 3 + 1] = 0.9 * dim; flowCol[fi * 3 + 2] = 1.0 * dim;
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
      gl.uniform1f(gl.getUniformLocation(np, "u_size"), 5 * (devicePixelRatio || 1));
      gl.drawArrays(gl.POINTS, 0, edges.length * FLOW_DOTS);
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
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.008;
    pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - lastY) * 0.008));
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(1.5, Math.min(12, dist + e.deltaY * 0.004));
  }, { passive: false });

  toggle.addEventListener("click", () => {
    const on = canvas.hidden;
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
    heatBar.style.cssText = "position:absolute;top:10px;right:110px;z-index:3;display:flex;gap:4px";
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
    const colors = new Float32Array(nodes.length * 3);
    if (!layer || !heatStats) {
      nodes.forEach((n, i) => {
        const dim = live3d.down.has(n.listener) ? 0.3 : 1;
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
        const dim = live3d.down.has(n.listener) ? 0.3 : 1;
        colors.set([
          (base[0] * (1 - t) + layer.hue[0] * t) * dim,
          (base[1] * (1 - t) + layer.hue[1] * t) * dim,
          (base[2] * (1 - t) + layer.hue[2] * t) * dim,
        ], i * 3);
      });
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  }

  // refresh heat each time the 3d view opens + every 60s while open
  const origToggle = toggle.onclick;
  toggle.addEventListener("click", () => {
    if (!canvas.hidden) {
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
    "background:var(--surface,#18213a);border:1px solid var(--line-strong,rgba(160,185,230,.2));" +
    "border-radius:8px;font-family:var(--font-mono,monospace);font-size:0.72rem;color:var(--text,#e8eaed)";
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
    const px = (e.clientX - rect.left) * (gl.drawingBufferWidth / rect.width);
    const py = (e.clientY - rect.top) * (gl.drawingBufferHeight / rect.height);
    const eye = [
      dist * Math.cos(pitch) * Math.sin(yaw),
      dist * Math.sin(pitch),
      dist * Math.cos(pitch) * Math.cos(yaw),
    ];
    const view = mat4LookAt(eye, [0, 0, 0], [0, 1, 0]);
    const m = mul4(mat4Perspective(0.9, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 50), view);
    let best = -1, bestD = 24 * 24;
    for (let i = 0; i < nodes.length; i++) {
      const [sx, sy] = project(i, m);
      const dx = sx - px, dy = sy - py;
      if (dx * dx + dy * dy < bestD) { bestD = dx * dx + dy * dy; best = i; }
    }
    if (best === -1) { tip.hidden = true; return; }
    const n = nodes[best];
    const a = heatStats && heatStats.get(n.name.toLowerCase());
    const a2 = a ? `${a.runs_24h ?? "–"} runs · $${(a.cost_24h ?? 0).toFixed(2)} · ${a.error_runs_24h ?? 0} err` : "";
    tip.innerHTML = `<strong>${esc3d(n.name)}</strong> · ${esc3d(n.model || "")}<br>${esc3d(n.host)}<br>${esc3d(n.listener)}${a2 ? `<br><span style="color:var(--text-faint,#6b7c94)">${esc3d(a2)}</span>` : ""}`;
    tip.hidden = false;
    tip.style.left = `${Math.min(e.clientX - rect.left + 14, rect.width - 190)}px`;
    tip.style.top = `${Math.max(e.clientY - rect.top - 10, 4)}px`;
  });
  canvas.addEventListener("pointerleave", () => { tip.hidden = true; });
}
