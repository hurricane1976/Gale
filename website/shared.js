/* GALE — shared behaviours (vanilla ES module, no framework, no build step).
   Everything here is additive enhancement: pages are fully readable with
   JS off, and every animation respects the global reduced-motion switch. */

export const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
export const raf = (fn) => requestAnimationFrame(fn);

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const pad2 = (n) => String(n).padStart(2, "0");
const ENT = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "#39" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => "&" + ENT[c] + ";");

/* ---- signals: fine-grained reactive state (ROADMAP #9). ----
   `signal(v)` returns [get, set]; `effect(fn)` re-runs fn whenever any
   signal read inside it changes. Notifications are batched to a
   microtask, so N writes cause 1 re-run. Effects auto-dispose when the
   element they bind to leaves the DOM (bind* helpers below).

   Together with setHTML/setText/patchList this closes the wasted-work gap:
   a render effect recomputes a cheap string and only touches the DOM when
   the string actually differs. */
const STACK = [];
let flushQueued = false;
const dirty = new Set();

export function signal(value) {
  const subs = new Set();
  const get = () => {
    const fx = STACK[STACK.length - 1];
    if (fx) subs.add(fx);
    return value;
  };
  const set = (next) => {
    if (next === value) return;
    value = next;
    for (const fx of subs) dirty.add(fx);
    if (!flushQueued) {
      flushQueued = true;
      queueMicrotask(flushEffects);
    }
  };
  return [get, set];
}

function flushEffects() {
  flushQueued = false;
  const batch = [...dirty];
  dirty.clear();
  for (const fx of batch) {
    if (fx.dead) continue;
    fx.deps.forEach((s) => s.delete(fx));
    fx.deps.clear();
    STACK.push(fx);
    try { fx.fn(); } catch (e) { console.warn("effect error", e); }
    STACK.pop();
  }
}

export function effect(fn) {
  const fx = { fn, deps: new Set(), dead: false };
  STACK.push(fx);
  try { fx.fn(); } catch (e) { console.warn("effect error", e); }
  STACK.pop();
  return fx;
}

/* ---- W3C traceparent (ROADMAP #7): every data fetch carries a trace
   header so a page load + its polls form one reconstructible trace
   fleet_api.py spans into Loki. New root per page load, fresh child span
   per request. ---- */
const TRACE_ID = (crypto && crypto.getRandomValues)
  ? [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("")
  : String(Date.now()).padEnd(32, "0");

export function tracedFetch(url, opts = {}) {
  const spanId = (crypto && crypto.getRandomValues)
    ? [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join("")
    : String(Math.random()).slice(2, 18).padEnd(16, "0");
  const headers = new Headers(opts.headers || {});
  headers.set("traceparent", `00-${TRACE_ID}-${spanId}-01`);
  return fetch(url, { ...opts, headers });
}

/* Effect variants bound to an element: recompute via setText/setHTML (which
   already no-op on identical content), and die when the element leaves the
   DOM -- checked on every run, no observers needed. */
export function bindText(el, fn) {
  if (!el) return;
  effect(() => { if (el.isConnected) setText(el, fn()); });
}

export function bindHTML(el, fn) {
  if (!el) return;
  effect(() => { if (el.isConnected) setHTML(el, fn()); });
}


/* ---- fine-grained DOM patching (ROADMAP #9)
   setHTML / setText: write-through-with-guards so unchanged SSE/poll payloads
   leave the DOM untouched (focus, scroll, hover state and DOM identity survive).
   patchList: reconcile a keyed list of pre-rendered HTML rows: insert only new
   keys, update only rows whose markup changed (via innerHTML on a temp
   element, then replaceChild to keep the keyed node map honest), remove only
   gone keys, and re-order survivors in place. Falls back to a plain
   innerHTML write when the element is a test stub with no live DOM, so
   render-test.mjs keeps working under plain Node. */

const LAST_HTML = new WeakMap();

export function setHTML(el, html) {
  if (!el) return false;
  const next = String(html ?? "");
  if (LAST_HTML.get(el) === next) return false;
  LAST_HTML.set(el, next);
  el.innerHTML = next;
  return true;
}

export function setText(el, text) {
  if (!el) return false;
  const next = String(text ?? "");
  if (el.textContent === next) return false;
  el.textContent = next;
  return true;
}

/* Contract: item.html must be a single root element (a <tr>, a <div> row,
   an <option>, ...). A <template> parses content in a context-free fragment
   (unlike a <div> holder, which would strip <tr>/<td>/<option> tags). */
function nodeFromHtml(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const node = tpl.content && tpl.content.firstElementChild;
  if (node) node.__galeHtml = html;
  return node;
}

export function patchList(el, items) {
  const list = (Array.isArray(items) ? items : []).map((it) => ({
    key: String((it && it.key) ?? ""),
    html: String((it && it.html) ?? ""),
  }));
  if (!el) return { added: 0, changed: 0, removed: 0 };
  /* render-test.mjs stubs (mkEl) have no appendChild — keep the
     innerHTML-as-string contract exactly as the pages always wrote it. */
  if (typeof el.appendChild !== "function") {
    el.innerHTML = list.map((it) => it.html).join("");
    return { added: list.length, changed: list.length, removed: 0 };
  }
  let nodes = el.__galeNodes;
  if (!nodes) {
    nodes = new Map();
    el.__galeNodes = nodes;
    while (el.firstChild) el.removeChild(el.firstChild);
  }
  let added = 0, changed = 0, removed = 0;
  const seen = new Set();
  for (const it of list) {
    seen.add(it.key);
    const node = nodes.get(it.key);
    if (!node) {
      const fresh = nodeFromHtml(it.html);
      nodes.set(it.key, fresh);
      if (fresh) { el.appendChild(fresh); added++; }
    } else if (node.__galeHtml !== it.html) {
      const fresh = nodeFromHtml(it.html);
      nodes.set(it.key, fresh);
      if (fresh) { el.replaceChild(fresh, node); changed++; }
    }
  }
  for (const [key, node] of [...nodes.entries()]) {
    if (!seen.has(key)) {
      nodes.delete(key);
      if (node.parentNode) node.parentNode.removeChild(node);
      removed++;
    }
  }
  list.forEach((it, i) => {
    if (it.key && el.children[i] !== nodes.get(it.key)) el.appendChild(nodes.get(it.key));
  });
  return { added, changed, removed };
}

/* ---- <agent-card>: one fleet member card. Light DOM on purpose (no shadow
   root) so the existing .member-card/.mc-* rules in gale.css/fleet-tidal.css
   style it unchanged -- this upgrades the *tag*, not the styling contract.
   Attributes: name, model, role, listener, state, color (a CSS color/var
   for --mc), index (stagger position for --i), pending (boolean attr).
   Usage: <agent-card name="Gale" model="Claude" role="..." listener="host:port"
     state="hub · this page's vantage point" color="var(--fleet-claude)" index="0"></agent-card>

   Guarded behind a HTMLElement check: render-test.mjs imports this module
   under plain Node (no DOM), where HTMLElement doesn't exist -- `class X
   extends HTMLElement` would throw at module-evaluation time, before any
   test even runs, and take every page's render tests down with it. */
if (typeof HTMLElement !== "undefined") {
  class AgentCard extends HTMLElement {
    static get observedAttributes() {
      return ["name", "model", "job", "listener", "state", "color", "index", "pending"];
    }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      const name = this.getAttribute("name") || "";
      const model = this.getAttribute("model") || "";
      // "job" not "role": role= is the ARIA role attribute and a custom
      // element's plain role="..." collides with it (axe-core flagged all 35)
      const role = this.getAttribute("job") || this.getAttribute("role") || "";
      const listener = this.getAttribute("listener") || "";
      const state = this.getAttribute("state") || "";
      const color = this.getAttribute("color") || "var(--text-dim)";
      const index = this.getAttribute("index") || "0";
      const pending = this.hasAttribute("pending");
      this.classList.add("member-card");
      this.style.setProperty("--mc", color);
      this.style.setProperty("--i", index);
      this.innerHTML =
        `<div class="mc-top"><strong class="mc-name">${esc(name)}</strong><span class="mc-chip">${esc(model)}</span></div>` +
        `<p class="mc-role">${esc(role)}</p>` +
        `<div class="mc-meta"><code>${esc(listener)}</code></div>` +
        `<div class="mc-state${pending ? " pending" : ""}">${esc(state)}</div>`;
    }
  }
  if (!customElements.get("agent-card")) customElements.define("agent-card", AgentCard);
}

/* ---- <gale-stat>: encapsulated stat tile (ROADMAP #4). Same content as
   statCard() markup but in a shadow root with its own constructable
   stylesheet, so page CSS can't fight it and theme changes propagate via
   inherited custom properties (--ok/--warn/--flag, --font-* resolve from
   the page's :root). Attributes: label, value (HTML), sub, level, pct
   (draws a .meter bar). One shared CSSStyleSheet for every instance. ---- */
if (typeof HTMLElement !== "undefined") {
  const GALE_STAT_SHEET = typeof CSSStyleSheet !== "undefined"
    ? new CSSStyleSheet() : null;
  if (GALE_STAT_SHEET) {
    GALE_STAT_SHEET.replaceSync(`
      :host { display: flex; flex-direction: column; gap: 6px;
        border: 1px solid var(--line, rgba(160,185,230,.08));
        border-radius: 12px; padding: 14px 16px; background: var(--surface-2, #1f2a47);
        container-type: inline-size; }
      .label { font-family: var(--font-mono, monospace); font-size: 0.72rem;
        letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-faint); }
      .value { font-family: var(--font-heading, inherit); font-size: 1.65rem;
        font-weight: 600; line-height: 1; }
      :host([level="warn"]) .value { color: var(--warn, #e0b45c); }
      :host([level="crit"]) .value { color: var(--flag-soft, #6ea8f5); }
      .sub { font-size: 0.78rem; color: var(--text-faint); }
      .meter { height: 5px; border-radius: 3px; background: var(--line, rgba(160,185,230,.08)); overflow: clip; }
      .meter i { display: block; height: 100%; border-radius: 3px; background: var(--ok, #4fd1a5);
        transition: width .6s var(--ease-out, ease); }
      @container (max-width: 560px) { .sub { font-size: 0.72rem; } .value { font-size: 1.3rem; } }
    `);
  }

  class GaleStat extends HTMLElement {
    static get observedAttributes() {
      return ["label", "value", "sub", "level", "pct"];
    }
    connectedCallback() {
      if (!this.shadowRoot) {
        const root = this.attachShadow({ mode: "open" });
        if (GALE_STAT_SHEET) root.adoptedStyleSheets = [GALE_STAT_SHEET];
      }
      this.render();
    }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      const g = (n) => this.getAttribute(n) || "";
      const pct = this.getAttribute("pct");
      const level = g("level") || "ok";
      if (g("level")) this.setAttribute("level", g("level"));
      this.shadowRoot.innerHTML =
        `<span class="label">${esc(g("label"))}</span>` +
        `<span class="value">${g("value")}</span>` +
        (pct != null && pct !== "" ? `<div class="meter"><i style="width:${clamp(+pct, 0, 100).toFixed(1)}%"></i></div>` : "") +
        `<span class="sub">${esc(g("sub") || "")}</span>`;
    }
  }
  if (!customElements.get("gale-stat")) customElements.define("gale-stat", GaleStat);
}

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

/* ---- reveal: slide-only, one-shot IntersectionObserver.
   Re-scan safe: call again after client-side renders (see refreshEffects). ---- */
let revealIO = null;
export function initReveals() {
  const els = document.querySelectorAll(".reveal:not(.in-view)");
  if (!els.length) return;
  if (REDUCED || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  if (!revealIO) {
    revealIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add("in-view"); revealIO.unobserve(e.target); }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
  }
  els.forEach((el) => revealIO.observe(el));
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

/* ---- count-up numbers (reads the static value, keeps prefix/suffix).
   Re-scan safe: already-animated elements are marked and skipped. ---- */
let countIO = null;
export function initCountUps() {
  if (REDUCED) return;
  const els = document.querySelectorAll("[data-countup]:not([data-countbound])");
  if (!els.length) return;
  const run = (el) => {
    if (el.dataset.countbound) return;
    el.dataset.countbound = "1";
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
    // backstop: guarantee the exact static value even if rAF stalls
    setTimeout(() => { el.textContent = raw; }, dur + 500);
    const step = (t) => {
      const p = clamp((t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased);
      if (p < 1) raf(step); else el.textContent = raw;
    };
    raf(step);
  };
  if (!("IntersectionObserver" in window)) return els.forEach(run);
  if (!countIO) {
    countIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { countIO.unobserve(e.target); run(e.target); }
        }
      },
      { threshold: 0.5 }
    );
  }
  els.forEach((el) => countIO.observe(el));
}

/* ---- pointer glow + 3D tilt on cards.
   Re-scan safe: already-bound cards are marked and skipped. ---- */
export function initPointerCards() {
  if (!FINE || REDUCED) return;
  document.querySelectorAll("[data-glow]:not([data-glowbound])").forEach((card) => {
    card.dataset.glowbound = "1";
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

/* ---- hero scene parallax: decorative layers drift at different scroll
   rates (transform-only, rAF-throttled, skipped under reduced motion). ---- */
function initHeroParallax() {
  if (REDUCED || initHeroParallax.bound) return;
  initHeroParallax.bound = true;
  const layers = [...document.querySelectorAll(".blob, .bolt, .glow")];
  if (!layers.length) return;
  let pending = false;
  const update = () => {
    pending = false;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.5) return;
    layers.forEach((el, i) => {
      const speed = 0.06 + (i % 3) * 0.05;
      el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
    });
  };
  window.addEventListener("scroll", () => { if (!pending) { pending = true; raf(update); } }, { passive: true });
  update();
}

/* ---- magnetic buttons: pull toward the pointer, spring back on leave ---- */
export function initMagnetic() {
  const magnets = document.querySelectorAll("[data-magnet]");
  if (!magnets.length || !FINE || REDUCED) return;
  for (const el of magnets) {
    if (el.dataset.magnetbound) continue;
    el.dataset.magnetbound = "1";
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

/* ---- focus trap for modal dialogs: cycle Tab within the container.
   Attach once; only acts on Tab keypresses inside it. ---- */
export function trapFocus(container) {
  if (!container || container.dataset.trapbound) return;
  container.dataset.trapbound = "1";
  container.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter((el) => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/* ---- re-scan dynamic content: call after client-side renders so newly
   added .reveal / [data-countup] / [data-glow] elements get wired. ---- */
export function refreshEffects() {
  initReveals();
  initCountUps();
  initPointerCards();
  initMagnetic();
}

/* ---- shared boot for both pages ---- */
function registerServiceWorker() {
  // Guarded the same way as <agent-card>: render-test.mjs imports this
  // module under plain Node, where `navigator` doesn't exist (or exists
  // partially, without serviceWorker) -- reference it unconditionally and
  // every page's render tests go down with it.
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("sw registration failed", e));
    // Force the active worker to update immediately rather than waiting on
    // navigation heuristics (installed PWAs can sit on an old worker for
    // days otherwise): check on every load, activate new versions at once.
    navigator.serviceWorker.ready.then((reg) => {
      reg.update().catch(() => {});
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) {
            w.postMessage("gale:skip-waiting");
          }
        });
      });
    });
    initPushBell();
  });
}

/* ---- push enablement (gale_push.py): a small bell next to the brand.
   Hidden until the SW + push APIs exist on a secure context; when
   subscribed it turns solid and shows subscription state. Badge clears
   while any page is visible. ---- */
async function initPushBell() {
  if (!("PushManager" in window) || !navigator.serviceWorker) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const mk = () => {
      if (document.getElementById("push-bell")) return;
      const bell = document.createElement("button");
      bell.id = "push-bell";
      bell.type = "button";
      bell.className = "mini-toggle push-bell";
      bell.textContent = "🔔 alerts off";
      bell.setAttribute("aria-pressed", "false");
      bell.style.cssText = "position:fixed;bottom:14px;right:14px;z-index:60;padding:8px 12px;min-height:32px";
      bell.addEventListener("click", togglePush);
      document.body.appendChild(bell);
      const test = document.createElement("button");
      test.id = "push-test";
      test.type = "button";
      test.className = "mini-toggle";
      test.textContent = "test";
      test.hidden = true;
      test.style.cssText = "position:fixed;bottom:14px;right:110px;z-index:60;padding:8px 12px;min-height:32px";
      test.addEventListener("click", async () => {
        test.disabled = true;
        try {
          const r = await fetch("api/push/test", { method: "POST" });
          const d = await r.json();
          console.log("test push:", r.status, d);
        } catch {}
        setTimeout(() => { test.disabled = false; }, 5000);
      });
      document.body.appendChild(test);
    };
    const paint = async () => {
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      const bell = document.getElementById("push-bell");
      const test = document.getElementById("push-test");
      if (bell) {
        bell.textContent = sub ? "🔔 alerts on" : "🔔 alerts off";
        bell.setAttribute("aria-pressed", String(!!sub));
      }
      if (test) test.hidden = !sub;
      // diagnostic: confirm the ACTIVE service worker actually has the push
      // handler (a stale pre-push sw would silently swallow deliveries)
      // ping the ACTIVE worker via the registration (not .controller, which
      // is null on the first load after a SW activates — that race produced
      // a misleading "sw ? ✗" right after every update)
      if (reg.active) {
        const pong = await new Promise((resolve) => {
          const ch = new MessageChannel();
          ch.port1.onmessage = (e) => resolve(e.data || {});
          setTimeout(() => resolve({ version: "?", push: false }), 1500);
          reg.active.postMessage("gale:ping", [ch.port2]);
        });
        const t = document.getElementById("push-test");
        if (t) {
          // visible, not just tooltip: sw version + handler presence
          t.textContent = `test (sw ${pong.version} ${pong.push ? "✓" : "✗ no push handler"})`;
        }
        console.log(`sw: ${pong.version}, push handler: ${pong.push ? "yes" : "MISSING — close and reopen the app"}`);
        // phone-home the diagnostic (best-effort): sw state per subscription,
        // so the server log shows exactly what each device is running
        const sub = await reg.pushManager.getSubscription().catch(() => null);
        if (sub) {
          fetch("api/push/diag", { method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint_tail: sub.endpoint.slice(-24),
              sw_version: pong.version, push_handler: pong.push }) }).catch(() => {});
        }
      }
    };
    async function togglePush() {
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      if (sub) {
        await fetch("api/push/unsubscribe", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
        paint();
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const res = await fetch("api/push/vapid-key").then((r) => r.json());
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: res.public,
      });
      await fetch("api/push/subscribe", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub.toJSON()) });
      paint();
    }
    mk();
    paint();
    // badge mirrors open crit alerts while the page is visible
    if (navigator.setAppBadge || navigator.clearAppBadge) {
      const clear = () => {
        navigator.clearAppBadge && navigator.clearAppBadge().catch(() => {});
        navigator.serviceWorker.controller &&
          navigator.serviceWorker.controller.postMessage("gale:clear-badge");
      };
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") clear();
      });
    }
  } catch { /* push is enhancement-only; never break boot */ }
}

export function boot() {
  initStormCanvas();
  initProgressFallback();
  initClocks();
  // command palette (Ctrl/Cmd+K), dynamically imported so plain-Node
  // render-test imports of this module stay DOM-free
  if (typeof document !== "undefined" && document.body) {
    import("./palette.js").then((m) => m.initPalette()).catch(() => {});
    if (new URLSearchParams(location.search).has("kiosk")) {
      import("./kiosk.js").then((m) => m.initKiosk()).catch(() => {});
    }
  }
  initHeroParallax();
  refreshEffects();
  registerServiceWorker();
}
