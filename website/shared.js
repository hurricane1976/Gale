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

export function downloadFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
  if (opts.method && !["GET", "HEAD"].includes(opts.method.toUpperCase()) && !headers.has("Idempotency-Key")) headers.set("Idempotency-Key", crypto.randomUUID());
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


/* ---- animated number tickers (ROADMAP "vital card tickers").
   Tween an element's numeric core from a previous poll value to the new
   one (e.g. "12.5%" -> "13.2%", "17.5 GB" -> "17.8 GB"): the numeric core
   is eased over ~600ms while any prefix/suffix ("$", "%", " GB") stays.
   Non-numeric values ("2d 9h", "v0.34.4") and reduced-motion set instantly.
   `from` must be supplied by the caller *before* the DOM is rewritten --
   setHTML/patchList replace nodes, so the previous value can't be read
   from the element afterwards. Returns true if anything changed. */
const TWEEN_RAF = new WeakMap();
const NUM_CORE = /^(\D*?)(-?\d+(?:\.\d+)?)(\D*)$/s;

export function tweenText(el, to, { from = null, duration = 600 } = {}) {
  if (!el) return false;
  const toText = String(to);
  const m = toText.match(NUM_CORE);
  if (!m) return setText(el, toText);
  const target = parseFloat(m[2]);
  if (!Number.isFinite(target)) { el.textContent = toText; return true; }
  const decimals = (m[2].split(".")[1] || "").length;
  const start = from != null && Number.isFinite(from) ? from : target;
  if (REDUCED || start === target || typeof el.animate !== "function") {
    el.textContent = toText;
    return start !== target;
  }
  const prefix = m[1], suffix = m[3], t0 = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3); /* ease-out cubic */
    const v = start + (target - start) * eased;
    el.textContent = prefix + (decimals ? v.toFixed(decimals) : String(Math.round(v))) + suffix;
    if (t < 1) TWEEN_RAF.set(el, raf(tick));
    else TWEEN_RAF.delete(el);
  };
  cancelAnimationFrame(TWEEN_RAF.get(el) ?? 0);
  TWEEN_RAF.set(el, raf(tick));
  return true;
}

/* ---- tickers for headline stat rows. setVitals(el, html) replaces the
   .vital rows like innerHTML would, but tweens each .vital-value from the
   number previously shown in that slot when old and new share the same
   prefix/suffix shape ("$597.7700" -> "$581.8315" eases; "up" -> "down"
   or an agent-filter change swaps instantly). REDUCED: plain write. ---- */
export function setVitals(el, html) {
  if (!el) return;
  const old = typeof el.querySelectorAll === "function"
    ? [...el.querySelectorAll(".vital")].map((v) => ({
      label: (v.querySelector(".vital-label")?.textContent || "").trim(),
      text: (v.querySelector(".vital-value")?.textContent || "").trim(),
    })) : [];
  el.innerHTML = html;
  if (REDUCED || !old.length) return;
  el.querySelectorAll(".vital").forEach((v, i) => {
    const o = old[i];
    if (!o) return;
    const node = v.querySelector(".vital-value");
    const label = (v.querySelector(".vital-label")?.textContent || "").trim();
    const to = (node?.textContent || "").trim();
    if (!node || !o.text || o.text === to || label !== o.label) return;
    const fm = o.text.match(NUM_CORE), tm = to.match(NUM_CORE);
    if (!fm || !tm || fm[1] !== tm[1] || fm[3] !== tm[3]) return; // shape changed: swap, don't tween
    tweenText(node, to, { from: parseFloat(fm[2]), duration: 850 });
  });
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
        font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; }
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
      // upgrade order: attributeChangedCallback can fire before connectedCallback
      // has attached the shadow root -- connectedCallback renders afterwards
      if (!this.shadowRoot) return;
      const g = (n) => this.getAttribute(n) || "";
      const pct = this.getAttribute("pct");
      // default the level attribute once. (Unconditionally calling setAttribute
      // here re-fired attributeChangedCallback -> render -> setAttribute ...
      // until "Maximum call stack size exceeded".)
      if (!this.hasAttribute("level")) this.setAttribute("level", "ok");
      const val = g("value");
      const root = this.shadowRoot;
      const build = (valHtml) => {
        root.innerHTML =
          `<span class="label">${esc(g("label"))}</span>` + valHtml +
          (pct != null && pct !== "" ? `<div class="meter"><i style="width:${clamp(+pct, 0, 100).toFixed(1)}%"></i></div>` : "") +
          `<span class="sub">${esc(g("sub") || "")}</span>`;
      };
      // ticker: same-shape numeric values ease from the previously shown
      // number instead of snapping (label/sub still re-render immediately)
      const prev = this._valText;
      const pm = prev != null ? String(prev).trim().match(NUM_CORE) : null;
      const tm = String(val).trim().match(NUM_CORE);
      if (pm && tm && pm[1] === tm[1] && pm[3] === tm[3] && root.querySelector(".value")) {
        build(`<span class="value">${esc(String(prev).trim())}</span>`);
        tweenText(root.querySelector(".value"), val, { from: parseFloat(pm[2]), duration: 750 });
      } else {
        build(`<span class="value">${val}</span>`);
      }
      this._valText = String(val);
    }
  }
  if (!customElements.get("gale-stat")) customElements.define("gale-stat", GaleStat);
}

/* ---- <gale-sparkline>: animated SVG sparkline (ROADMAP "real-time charts").
   First attach: the line draws itself in (stroke-dashoffset ease). Every
   update(values): the previous y-values tween to the new ones (~450ms
   ease-out), so a live feed looks like breathing rather than flicker.
   API (imperative, so patchList nodes can persist):
     el.update([[v, ...], ...], [{ color, fill, width }, ...])
   one series array + one style object per polyline; values must share a
   length. Zero-dependency, rAF-driven, REDUCED skips straight to drawn. */
if (typeof HTMLElement !== "undefined" && !customElements.get("gale-sparkline")) {
  class GaleSparkline extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: "open" });
      this._viewBox = this.getAttribute("view-box") || "0 0 220 40";
      /* viewBox = "min-x min-y WIDTH HEIGHT" -- width/height live at [2]/[3] */
      const vb = this._viewBox.split(/[\s,]+/).map(Number);
      this._w = vb[2] || 220; this._h = vb[3] || 40;
      this._pad = 3;
      root.innerHTML = `<div class="spark-wrap" style="position:relative;display:block;width:100%;height:100%">` +
        `<svg viewBox="${this._viewBox}" preserveAspectRatio="none" aria-hidden="true"` +
        ` style="display:block;width:100%;height:100%"></svg>` +
        `<div class="spark-tip" style="display:none;position:absolute;top:2px;z-index:2;pointer-events:none;` +
        `background:rgba(10,16,30,.92);border:1px solid rgba(160,185,230,.35);border-radius:6px;` +
        `padding:3px 7px;font:11px/1.4 var(--font-mono,monospace);color:#e8eaed;white-space:nowrap"></div></div>`;
      this._svg = root.querySelector("svg");
      this._tip = root.querySelector(".spark-tip");
      this._cur = []; this._styles = [];
      this._hover = null; this._labels = null; this._tipFmt = null;
      if (!REDUCED) {
        this._svg.addEventListener("pointermove", (e) => {
          const r = this._svg.getBoundingClientRect();
          if (!r.width || !this._n) return;
          const fx = (e.clientX - r.left) / r.width;
          const i = Math.max(0, Math.min(this._n - 1, Math.round(fx * (this._n - 1))));
          if (i !== this._hover) { this._hover = i; this._redraw(); }
          const wr = this._svg.parentElement.getBoundingClientRect();
          this._tip.style.left = `min(max(${(e.clientX - wr.left + 10).toFixed(0)}px, 2px), calc(100% - 4px))`;
        });
        this._svg.addEventListener("pointerleave", () => { this._hover = null; this._redraw(); });
      }
      this._raf = 0;
      if (!REDUCED) {
        this._svg.style.opacity = "0";
        this._svg.style.transition = "opacity .5s ease .1s";
        requestAnimationFrame(() => { this._svg.style.opacity = "1"; });
      }
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); this._raf = 0; }
    /* draw series arrays into <polyline>/<polygon> pairs, tweening y when
       prior values exist for the same series count. opts.labels[i] names
       index i in the hover readout; opts.tipFmt(i, values, label) formats
       it (default: label + values). Backward compatible: update(s, st). */
    update(series, styles = [], opts = {}) {
      if (!this.isConnected || !this._svg) return;
      const data = (series || []).map((a) => (Array.isArray(a) ? a : []));
      if (!data.length || !data[0].length) { this._svg.innerHTML = ""; return; }
      const from = this._cur.length === data.length ? this._cur : null;
      this._cur = data.map((a) => a.slice());
      this._styles = styles;
      this._labels = Array.isArray(opts.labels) ? opts.labels : null;
      this._tipFmt = typeof opts.tipFmt === "function" ? opts.tipFmt : null;
      const n = data[0].length;
      this._n = n;
      const all = data.flat().filter(Number.isFinite);
      if (!all.length) { this._svg.innerHTML = ""; return; }
      this._min = Math.min(...all, 0); this._max = Math.max(...all, 0.000001);
      const target = data.map((a) => this._pts(a, this._min, this._max, n));
      this._target = target;
      if (from && !REDUCED && typeof this._svg.firstChild?.animate === "function") {
        const startPts = from.map((a) => this._pts(a, this._min, this._max, n));
        this._tween(startPts, target);
      } else {
        this._render(target);
        if (!REDUCED && from === null) this._drawIn();
      }
    }
    _pts(vals, min, max, n) {
      const W = this._w, H = this._h, pad = this._pad;
      const step = (W - pad * 2) / Math.max(n - 1, 1);
      const span = max - min || 1;
      const out = [];
      for (let i = 0; i < n; i++) {
        const v = Number.isFinite(vals[i]) ? vals[i] : min;
        out.push([pad + i * step, H - pad - ((v - min) / span) * (H - pad * 2)]);
      }
      return out;
    }
    _redraw() {
      if (this._target) this._render(this._target);
      else if (this._tip) this._tip.style.display = "none";
    }
    _render(ptsArr) {
      const parts = [];
      (this._styles || []).forEach((s, si) => {
        const pts = ptsArr[si];
        if (!pts) return;
        const str = pts.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ");
        if (s && s.fill) parts.push(`<polygon points="${this._pad},${this._h - this._pad} ${str} ${this._w - this._pad},${this._h - this._pad}" fill="${s.fill}" stroke="none"/>`);
        parts.push(`<polyline points="${str}" fill="none" stroke="${s && s.color || "currentColor"}" stroke-width="${s && s.width || 1.6}" stroke-linejoin="round" stroke-linecap="round" ${s && s.dash ? `stroke-dasharray="${s.dash}"` : ""}/>`);
      });
      // hover readout (#2): crosshair + per-series dots + tip text
      const hi = this._hover;
      if (hi != null && ptsArr.length && ptsArr[0][hi] && this._tip) {
        const x = ptsArr[0][hi][0].toFixed(1);
        parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${this._h}" stroke="rgba(232,234,237,.45)" stroke-width="1" stroke-dasharray="3 3" pointer-events="none"/>`);
        const vals = [];
        ptsArr.forEach((pts, si) => {
          const p = pts[hi];
          if (!p) return;
          vals.push(this._cur[si] ? this._cur[si][hi] : null);
          parts.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="${(this._styles[si] && this._styles[si].color) || "#fff"}" pointer-events="none"/>`);
        });
        const label = this._labels ? this._labels[hi] : null;
        this._tip.textContent = this._tipFmt
          ? String(this._tipFmt(hi, vals, label))
          : [label, ...vals.map((v) => v == null ? "–" : String(Math.round(v * 10) / 10))].filter((s) => s != null && s !== "").join(" · ");
        this._tip.style.display = "";
      } else if (this._tip) {
        this._tip.style.display = "none";
      }
      this._svg.innerHTML = parts.join("");
    }
    _tween(startPts, targetPts) {
      cancelAnimationFrame(this._raf);
      const t0 = performance.now(), dur = 450;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        this._render(startPts.map((sp, si) => sp.map((p, i) => [
          p[0], p[1] + (targetPts[si][i][1] - p[1]) * e,
        ])));
        if (t < 1) this._raf = requestAnimationFrame(step);
      };
      this._raf = requestAnimationFrame(step);
    }
    /* one-shot line-draw reveal on first paint */
    _drawIn() {
      for (const line of this._svg.querySelectorAll("polyline")) {
        let len = 0;
        try { len = line.getTotalLength(); } catch { continue; }
        if (!Number.isFinite(len) || len <= 0) continue;
        line.style.strokeDasharray = `${len}`;
        line.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: 800, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
        );
        /* dasharray would linger and clip later morphs */
        line.addEventListener("finish", () => { line.style.strokeDasharray = ""; }, { once: true });
      }
    }
  }
  customElements.define("gale-sparkline", GaleSparkline);
}

/* ---- ambient fleet health (ROADMAP "ambient theming"): the ops board sets
   a data-fleet-health attribute on <html> (ok / warn / crit) that pages
   style against (very subtle background tint), and repaints the favicon
   with a status dot so a downed fleet is readable from a browser tab
   strip. REDUCED only gates the transition, not the signal itself. ---- */
const FAVI_CACHE = new Map();
function tintedFavicon(level) {
  if (FAVI_CACHE.has(level)) return FAVI_CACHE.get(level);
  const src = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  const img = new Image();
  img.src = (src && src.href) || "/favicon.ico";
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const paint = () => {
    try { ctx.drawImage(img, 0, 0, 64, 64); } catch { /* opaque/cors ico */ }
    if (level && level !== "ok") {
      ctx.beginPath();
      ctx.arc(48, 16, 12, 0, Math.PI * 2);
      ctx.fillStyle = level === "crit" ? "#e8482c" : "#e0b45c";
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#10131c"; ctx.stroke();
    }
    const url = c.toDataURL("image/png");
    FAVI_CACHE.set(level, url);
    return url;
  };
  if (img.complete) return paint();
  return new Promise((res) => {
    img.onload = () => res(paint());
    img.onerror = () => res(null);
  });
}
/* ---- telemetry-coupled storm intensity (improvements #1): live box load
   (cpu %, load1, hottest sensor °C) drives the ambient FX instead of a
   fixed loop. Level 0..1 scales bolt rate, rain alpha and wind slant in
   initStormCanvas via STORM, plus CSS vars (--bolt-dur, --storm-level)
   that gale.css consumes for the lightning wash + blob opacity.
   REDUCED caps the level so motion stays minimal. ---- */
export const STORM = { level: 0.35, boltRate: 1, rain: 1, wind: 0 };
export function setStormIntensity(level, opts = {}) {
  const html = document.documentElement;
  const lv = clamp(Number(level) || 0, 0, 1);
  STORM.level = REDUCED ? Math.min(lv, 0.25) : lv;
  STORM.boltRate = 0.6 + STORM.level * 2.2;   // 0.6x .. 2.8x bolts
  STORM.rain = 0.7 + STORM.level * 0.7;       // 0.7x .. 1.4x alpha
  STORM.wind = (opts.windKmh || 0) > 0 ? clamp(opts.windKmh / 60, 0, 1.5) : STORM.level * 0.8;
  if (!html || !html.style) return;
  // 13s calm .. ~5s hot: bolt wash quickens as the box heats up
  html.style.setProperty("--bolt-dur", `${(13 - STORM.level * 8).toFixed(1)}s`);
  html.style.setProperty("--storm-level", STORM.level.toFixed(2));
}
/* Derive 0..1 intensity from a status-board host snapshot: cpu 40%,
   load1-per-core 30%, hottest-sensor 30%. Pure function for testability. */
export function stormLevelFromHost(host = {}) {
  const cpu = clamp((host.cpu_pct || 0) / 100, 0, 1);
  const cores = Math.max(1, host.cpu_count || 1);
  const load = clamp(((host.load && host.load[0]) || 0) / cores / 2, 0, 1);
  const hw = host.hardware || {};
  const hot = clamp(((hw.hottest_c ?? 55) - 45) / 40, 0, 1);
  return clamp(cpu * 0.4 + load * 0.3 + hot * 0.3, 0.05, 1);
}
export function setAmbientHealth(level) {
  const html = document.documentElement;
  if (!html || !html.dataset) return; /* test-stub / detached environment */
  if (html.dataset.fleetHealth !== (level || "ok")) {
    html.dataset.fleetHealth = level || "ok";
    if (level && level !== "ok") {
      tintedFavicon(level).then((url) => {
        if (!url) return;
        let link = document.querySelector('link[rel="icon"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = url;
      });
    }
  }
}

/* ---- chart crosshair + tooltip (improvements #2): pointer-tracked readout
   for plain-SVG charts. points = [{x}] in SVG units (derive from the DOM
   or recompute from chart geometry); format(i) returns plain text (set via
   textContent, so no HTML-injection surface). Re-attach after every render
   that replaces the <svg> node -- old listeners die with the old node, and
   any orphaned tip div in the host is swept here. No-op under reduced
   motion (the static <title>/aria-label content remains). ---- */
export function chartTooltip(svg, points, format) {
  const noop = () => {};
  if (!svg || !points || !points.length || typeof format !== "function") return noop;
  const NS = "http://www.w3.org/2000/svg";
  const vb = (svg.viewBox && svg.viewBox.baseVal) || { width: 300, height: 100 };
  const host = svg.parentElement;
  svg._tipState?.refs?.line?.remove();
  svg._tipState?.refs?.tip?.remove();
  if (host) host.querySelectorAll(":scope > .chart-tip").forEach((n) => n.remove());
  const line = document.createElementNS(NS, "line");
  line.setAttribute("y1", "0");
  line.setAttribute("y2", String(vb.height || 100));
  line.setAttribute("class", "chart-cross");
  line.style.display = "none";
  svg.appendChild(line);
  const tip = document.createElement("div");
  tip.className = "chart-tip";
  tip.style.display = "none";
  tip.id = `gale-chart-tip-${Math.random().toString(36).slice(2)}`;
  tip.setAttribute("role", "status");
  tip.setAttribute("aria-live", "off");
  if (host) {
    if (host.style && getComputedStyle(host).position === "static") host.style.position = "relative";
    host.appendChild(tip);
  }
  // Live data lives on the node so re-renders that keep the <svg> element
  // (weather's hourly curve sets innerHTML on the same node) only ever
  // attach listeners once -- otherwise every poll stacks another pair.
  const st = (svg._tipState = svg._tipState || {});
  st.points = points;
  st.format = format;
  st.vbWidth = vb.width || 100;
  if (st.pinnedIndex != null) st.pinnedIndex = Math.min(st.pinnedIndex, points.length - 1);
  st.refs = { line, tip, host };
  st.index = Math.min(st.index || 0, points.length - 1);
  if (!svg.hasAttribute?.("tabindex")) svg.setAttribute("tabindex", "0");
  svg.setAttribute("aria-describedby", tip.id);
  svg.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight Home End");
  const showAt = (index, clientX = null, keyboard = false) => {
    const cur = svg._tipState;
    if (!cur?.points?.length) return;
    const i = Math.max(0, Math.min(cur.points.length - 1, index));
    cur.index = i;
    const { line: ln, tip: tp, host: h } = cur.refs || {};
    if (!ln?.isConnected || !tp?.isConnected) return;
    const x = cur.points[i].x;
    ln.setAttribute("x1", String(x));
    ln.setAttribute("x2", String(x));
    ln.style.display = "";
    tp.textContent = String(cur.format(i, cur.points[i]));
    tp.setAttribute("aria-live", keyboard ? "polite" : "off");
    tp.style.display = "";
    const rect = svg.getBoundingClientRect();
    const hostRect = h ? h.getBoundingClientRect() : { left: 0 };
    const left = clientX == null ? rect.left + rect.width * (x / (cur.vbWidth || rect.width)) - hostRect.left + 12 : clientX - hostRect.left + 12;
    tp.style.left = `min(max(${Math.round(left)}px, 4px), calc(100% - 8px))`;
    tp.style.top = "8px";
  };
  if (!st.wired) {
    st.wired = true;
    const onMove = (e) => {
      const cur = svg._tipState;
      if (!cur || !cur.points || !cur.points.length) return;
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const sx = ((e.clientX - r.left) / r.width) * (cur.vbWidth || r.width);
      const xs = cur.points.map((p) => p.x);
      let bi = 0, bd = Infinity;
      for (let i = 0; i < xs.length; i++) {
        const d = Math.abs(xs[i] - sx);
        if (d < bd) { bd = d; bi = i; }
      }
      showAt(bi, e.clientX, false);
    };
    const hide = () => {
      const { line: ln, tip: tp } = (svg._tipState && svg._tipState.refs) || {};
      if (svg._tipState?.pinnedIndex != null) return;
      if (ln) ln.style.display = "none";
      if (tp) tp.style.display = "none";
    };
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", (event) => {
      if (event.pointerType !== "touch") return;
      onMove(event);
      const cur = svg._tipState;
      if (cur.pinnedIndex === cur.index) {
        cur.pinnedIndex = null;
        hide();
      } else {
        cur.pinnedIndex = cur.index;
        const tp = cur.refs?.tip;
        if (tp) { tp.textContent = `Pinned · ${tp.textContent} · tap the same point to close`; tp.setAttribute("aria-live", "polite"); }
      }
    });
    svg.addEventListener("pointerleave", hide);
    svg.addEventListener("focus", () => showAt(svg._tipState?.index || 0, null, true));
    svg.addEventListener("keydown", (event) => {
      const cur = svg._tipState;
      if (!cur?.points?.length) return;
      let next = cur.index || 0;
      if (event.key === "ArrowRight" || event.key === "ArrowUp") next++;
      else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next--;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = cur.points.length - 1;
      else if (event.key === "Escape") { cur.pinnedIndex = null; hide(); return; }
      else return;
      event.preventDefault();
      showAt(next, null, true);
    });
  }
  return () => { line.remove(); tip.remove(); };
}

/* ---- skeleton screens (improvements #6): shimmer placeholders painted at
   boot, wiped by the first real render (every wired container is fully
   overwritten via setHTML/innerHTML, so no cleanup call is needed). Static
   under reduced motion. ---- */
export function skeleton(el, n = 3, h = 54) {
  if (!el || !el.dataset || el.dataset.skel === "1") return; /* test-stub safe */
  el.dataset.skel = "1";
  el.innerHTML = Array.from({ length: n },
    () => `<div class="skel" style="height:${h}px" aria-hidden="true"></div>`).join("");
  if (typeof MutationObserver === "undefined") return;
  const clear = () => { try { delete el.dataset.skel; } catch {} };
  new MutationObserver((muts, obs) => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && !node.classList.contains("skel")) { obs.disconnect(); clear(); return; }
      }
    }
  }).observe(el, { childList: true });
}

/* ---- data morphs (improvements #6): wrap DOM re-renders so value changes
   cross-fade via the View Transition API when available. Identical pixels
   produce no animation, so steady-state ticks are visually free; reduced
   motion and old browsers fall back to a plain call. Update-callback
   exceptions are still reported by the UA (spec behavior) -- the
   finished.catch only silences the mirrored promise rejection. ---- */
export function morph(fn) {
  try {
    if (!REDUCED && typeof document !== "undefined" && document.startViewTransition) {
      const t = document.startViewTransition(() => { fn(); });
      if (t) for (const k of ["finished", "ready", "updateCallbackDone"]) if (t[k] && t[k].catch) t[k].catch(() => {});
      return;
    }
  } catch { /* fall through to plain call */ }
  fn();
}

/* ---- high-contrast + reduced-transparency (improvements #6): auto from
   prefers-contrast, manual override via the ◐ button (off -> high),
   persisted. Sets html[data-contrast] which gale.css consumes: solid
   surfaces, no blur layers, full-opacity text, ambient FX retired. The
   audit contrast gates keep passing because content tokens only get
   darker/lighter, never lower-contrast. ---- */
/* one fixed, wrapping dock for the floating controls (saver/contrast/display/theme/alerts) so they
   never overlap each other or page content; layout lives in mobile.css (#gale-dock) */
function dockAdd(el) {
  let dock = document.getElementById("gale-dock");
  if (!dock) {
    dock = document.createElement("div");
    dock.id = "gale-dock";
    dock.setAttribute("role", "group");
    dock.setAttribute("aria-label", "Display and alert controls");
    // collapsed to one gear button by default; the open state is a per-viewer convenience
    let open = false;
    try { open = localStorage.getItem("gale-dock-open") === "1"; } catch {}
    const tg = document.createElement("button");
    tg.id = "dock-toggle"; tg.type = "button"; tg.className = "mini-toggle";
    const paint = () => {
      dock.dataset.open = open ? "1" : "";
      tg.textContent = open ? "✕ close" : "⚙ controls";
      tg.setAttribute("aria-expanded", String(open));
      tg.setAttribute("aria-controls", "gale-dock");
    };
    tg.addEventListener("click", () => {
      open = !open; paint();
      try { localStorage.setItem("gale-dock-open", open ? "1" : "0"); } catch {}
    });
    paint();
    dock.appendChild(tg);
    document.body.appendChild(dock);
  }
  dock.appendChild(el);
}

export function initContrastMode() {
  if (typeof document === "undefined" || !document.body || document.getElementById("contrast-toggle")) return;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const mq = window.matchMedia ? window.matchMedia("(prefers-contrast: more)") : null;
  let manual = store.get("gale-contrast", null); // null = auto
  const apply = () => {
    const high = manual === true || (manual == null && !!(mq && mq.matches));
    document.documentElement.dataset.contrast = high ? "high" : "";
    btn.textContent = high ? "◐ standard" : "◐ contrast";
    btn.setAttribute("aria-pressed", String(high));
  };
  const btn = document.createElement("button");
  btn.id = "contrast-toggle";
  btn.type = "button";
  btn.className = "mini-toggle";
  btn.style.cssText = "padding:8px 12px;min-height:32px";
  btn.addEventListener("click", () => {
    const high = document.documentElement.dataset.contrast === "high";
    manual = high ? null : true;
    if (manual == null && mq && mq.matches) manual = false; // auto-high -> explicit standard
    store.set("gale-contrast", manual);
    apply();
  });
  dockAdd(btn);
  if (mq && mq.addEventListener) mq.addEventListener("change", () => { if (manual == null) apply(); });
  apply();
}

/* ---- live theme engine (improvements #5, engine half): a small Display
   control tunes the ambient layers only (never content): hue rotation and
   glow saturation on body::after + .blob via --theme-hue / --theme-glow,
   persisted in localStorage. Content palette tokens are untouched, so this
   can't regress contrast gates. ---- */
export function initThemeEngine() {
  if (typeof document === "undefined" || !document.body || document.getElementById("fx-theme")) return;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const apply = (fx) => {
    const html = document.documentElement;
    html.style.setProperty("--theme-hue", `${clamp(+fx.hue || 0, -40, 40)}deg`);
    html.style.setProperty("--theme-glow", `${clamp(+(fx.glow ?? 1), 0.4, 1.6)}`);
    html.style.setProperty("--ambient-intensity", `${clamp(+(fx.intensity ?? 1), 0, 1.2)}`);
  };
  // time-of-day auto-mode (#10): dawn/day/dusk/night ambient presets while
  // the user has no stored manual prefs; first slider touch pins to manual
  // (checkbox re-enables auto). Recomputed on boot + every 10 min.
  const TOD = (h) => h >= 21 || h < 5 ? { hue: -18, glow: 0.8, intensity: 0.8, name: "night" }
    : h < 8 ? { hue: 12, glow: 1.1, intensity: 1.0, name: "dawn" }
    : h < 17 ? { hue: 0, glow: 1.0, intensity: 0.9, name: "day" } : { hue: 22, glow: 1.2, intensity: 1.05, name: "dusk" };
  const stored = store.get("gale-fx", null);
  let auto = store.get("gale-fx-auto", stored == null);
  const density = store.get("gale-density", "comfortable");
  document.documentElement.dataset.density = density === "compact" ? "compact" : "comfortable";
  const fx = Object.assign({ hue: 0, glow: 1, intensity: 1 }, auto ? TOD(new Date().getHours()) : (stored || {}));
  apply(fx);
  const box = document.createElement("details");
  box.id = "fx-theme";
  box.style.cssText = "";
  box.innerHTML = `<summary class="mini-toggle" style="list-style:none;cursor:pointer;padding:8px 12px;min-height:32px">🎨 display</summary>
    <div class="card" style="position:absolute;bottom:44px;left:0;width:220px;padding:12px 14px;display:flex;flex-direction:column;gap:10px">
      <label style="font-size:.75rem;display:flex;gap:6px;align-items:center"><input type="checkbox" id="fx-auto"${auto ? " checked" : ""}> auto · time of day <span id="fx-tod" class="mono-dim"></span></label>
      <label style="font-size:.75rem;display:flex;flex-direction:column;gap:4px">ambient hue
        <input type="range" id="fx-hue" min="-40" max="40" step="1" value="${fx.hue}"></label>
      <label style="font-size:.75rem;display:flex;flex-direction:column;gap:4px">ambient glow
        <input type="range" id="fx-glow" min="40" max="160" step="5" value="${Math.round(fx.glow * 100)}"></label>
      <label style="font-size:.75rem;display:flex;flex-direction:column;gap:4px">ambient intensity
        <input type="range" id="fx-intensity" min="0" max="120" step="5" value="${Math.round(fx.intensity * 100)}"></label>
      <label style="font-size:.75rem;display:flex;gap:6px;align-items:center">screen density
        <select id="fx-density" aria-label="Screen density"><option value="comfortable"${density !== "compact" ? " selected" : ""}>comfortable</option><option value="compact"${density === "compact" ? " selected" : ""}>compact</option></select></label>
      <label style="font-size:.75rem;display:flex;flex-direction:column;gap:4px">3D graphics quality
        <select id="fx-quality" aria-label="3D graphics quality"><option value="auto">Auto · adaptive</option><option value="battery">Battery saver</option><option value="balanced">Balanced</option><option value="detail">Detail</option></select></label>
      <small class="mono-dim">Auto follows measured frame time; manual modes persist on this device.</small>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px" aria-label="Display presets">
        <button type="button" class="mini-toggle fx-preset" data-hue="0" data-glow="0.65" data-intensity="0.5">calm</button>
        <button type="button" class="mini-toggle fx-preset" data-hue="-18" data-glow="1.15" data-intensity="1">aurora</button>
        <button type="button" class="mini-toggle fx-preset" data-hue="22" data-glow="1.35" data-intensity="1.2">cinema</button>
        <button type="button" class="mini-toggle fx-preset" data-hue="8" data-glow="0.9" data-intensity="0.8">warm</button>
      </div>
      <button type="button" class="mini-toggle" id="fx-reset-auto">↺ reset to time of day</button>
      <label style="font-size:.75rem;display:flex;gap:6px;align-items:flex-start"><input type="checkbox" id="fx-graphics-debug"> show renderer diagnostics <span class="mono-dim">local</span></label>
    </div>`;
  dockAdd(box);
  const hue = box.querySelector("#fx-hue"), glow = box.querySelector("#fx-glow"), intensity = box.querySelector("#fx-intensity"),
        autoBox = box.querySelector("#fx-auto"), tod = box.querySelector("#fx-tod");
  const graphicsDebug = box.querySelector("#fx-graphics-debug");
  try { graphicsDebug.checked = new URLSearchParams(location.search).get("graphics") === "debug"; } catch {}
  graphicsDebug.addEventListener("change", () => {
    const url = new URL(location.href);
    if (graphicsDebug.checked) url.searchParams.set("graphics", "debug");
    else url.searchParams.delete("graphics");
    location.assign(url.href);
  });
  box.querySelector("#fx-density").addEventListener("change", (event) => {
    const value = event.currentTarget.value === "compact" ? "compact" : "comfortable";
    document.documentElement.dataset.density = value;
    store.set("gale-density", value);
  });
  const qualityMode = box.querySelector("#fx-quality");
  try { qualityMode.value = localStorage.getItem("gale-graphics-quality") || "auto"; } catch { qualityMode.value = "auto"; }
  qualityMode.addEventListener("change", () => {
    const mode = ["auto", "battery", "balanced", "detail"].includes(qualityMode.value) ? qualityMode.value : "auto";
    try { localStorage.setItem("gale-graphics-quality", mode); } catch {}
    window.dispatchEvent(new CustomEvent("gale:graphics-quality", { detail: { mode } }));
  });
  const paintTod = () => { if (tod) tod.textContent = auto ? `(${TOD(new Date().getHours()).name})` : ""; };
  const paintPresets = () => box.querySelectorAll(".fx-preset").forEach((preset) => {
    const selected = !auto && +preset.dataset.hue === +fx.hue && +preset.dataset.glow === +fx.glow && +preset.dataset.intensity === +fx.intensity;
    preset.setAttribute("aria-pressed", String(selected));
    preset.style.borderColor = selected ? "var(--accent, #65d6ff)" : "";
    preset.style.color = selected ? "var(--accent, #65d6ff)" : "";
  });
  const save = () => {
    fx.hue = +hue.value; fx.glow = +glow.value / 100;
    fx.intensity = +intensity.value / 100;
    auto = false; autoBox.checked = false;
    store.set("gale-fx", fx); store.set("gale-fx-auto", false);
    apply(fx); paintTod(); paintPresets();
  };
  hue.addEventListener("input", save);
  glow.addEventListener("input", save);
  intensity.addEventListener("input", save);
  box.querySelectorAll(".fx-preset").forEach((preset) => preset.addEventListener("click", () => {
    fx.hue = +preset.dataset.hue;
    fx.glow = +preset.dataset.glow;
    fx.intensity = +preset.dataset.intensity;
    hue.value = fx.hue;
    glow.value = Math.round(fx.glow * 100);
    intensity.value = Math.round(fx.intensity * 100);
    auto = false;
    autoBox.checked = false;
    store.set("gale-fx", fx);
    store.set("gale-fx-auto", false);
    apply(fx);
    paintTod(); paintPresets();
  }));
  box.querySelector("#fx-reset-auto").addEventListener("click", () => {
    auto = true;
    autoBox.checked = true;
    store.set("gale-fx-auto", true);
    const p = TOD(new Date().getHours());
    fx.hue = p.hue; fx.glow = p.glow;
    fx.intensity = p.intensity;
    hue.value = p.hue; glow.value = Math.round(p.glow * 100); intensity.value = Math.round(p.intensity * 100);
    store.set("gale-fx", fx);
    apply(fx); paintTod(); paintPresets();
  });
  autoBox.addEventListener("change", () => {
    auto = autoBox.checked;
    store.set("gale-fx-auto", auto);
    if (auto) {
      const p = TOD(new Date().getHours());
      fx.hue = p.hue; fx.glow = p.glow;
      fx.intensity = p.intensity;
      hue.value = p.hue; glow.value = Math.round(p.glow * 100); intensity.value = Math.round(p.intensity * 100);
      apply(fx);
    }
    paintTod(); paintPresets();
  });
  paintTod(); paintPresets();
  setInterval(() => {
    if (!auto || document.hidden) return;
    const p = TOD(new Date().getHours());
    fx.hue = p.hue; fx.glow = p.glow;
    hue.value = p.hue; glow.value = Math.round(p.glow * 100);
    apply(fx); paintTod();
  }, 600000);
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
  let flashSet = false; // tracks whether --flash is currently applied
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
     palettes: [top highlight, mid body, base shade]. Storm picks get a
     darker, higher-contrast belly so bolts read against them. */
  const CLOUD_LAYERS = [
    { n: 6, s: [0.5, 0.75], v: [0.04, 0.08], a: [0.5, 0.7], y: [0.0, 0.2],
      col: ["178,194,224", "132,152,186", "88,106,140"],
      storm: ["112,130,164", "78,96,128", "54,68,96"] },
    { n: 4, s: [0.8, 1.15], v: [0.09, 0.16], a: [0.65, 0.85], y: [-0.05, 0.28],
      col: ["190,205,234", "142,162,196", "96,116,152"],
      storm: ["120,138,172", "84,102,136", "60,76,104"] },
    { n: 3, s: [1.15, 1.6], v: [0.16, 0.28], a: [0.75, 0.92], y: [-0.1, 0.34],
      col: ["202,214,242", "156,176,208", "110,132,168"],
      storm: ["134,152,184", "96,114,146", "70,86,114"] },
  ];

  const makePuffs = (s) => {
    const R = (64 + Math.random() * 70) * s;
    const n = 10 + Math.floor(Math.random() * 5);
    const span = R * 3.0;
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const taper = 0.62 + 0.38 * Math.sin(t * Math.PI); // flatter ends
      puffs.push({
        x: t * span + (Math.random() - 0.5) * R * 0.5,
        y: (Math.random() - 0.58) * R * 0.6,
        r: R * (0.52 + Math.random() * 0.42) * taper,
        a: 0.30 + Math.random() * 0.22,
        lit: Math.max(0, t - 0.35) * 0.9 + 0.25, // moon side brighter
      });
    }
    return puffs;
  };

  /* one cloud = pre-rendered sprite of overlapping soft puffs with
     moonlit top-rim shading (light from upper-right) and a dark storm
     belly, plus wispy turbulence offsets so edges stop looking round.
     Per-frame cost stays one drawImage. */
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
      const lit = p.lit ?? 0.5;
      // moonlit rim toward upper-right, dark belly below
      const g = c2.createRadialGradient(
        px + p.r * 0.22, py - p.r * 0.34, p.r * 0.06, px, py, p.r);
      const hi = Math.round(178 + lit * 30);
      g.addColorStop(0, `rgba(${hi},${hi + 8},${Math.min(255, hi + 22)}, ${p.a})`);
      g.addColorStop(0.45, `rgba(${col[1]}, ${p.a * 0.55})`);
      g.addColorStop(0.75, `rgba(${col[2]}, ${p.a * 0.3})`);
      g.addColorStop(1, `rgba(${col[2]}, 0)`);
      c2.fillStyle = g;
      c2.beginPath();
      c2.arc(px, py, p.r, 0, Math.PI * 2);
      c2.fill();
      // wispy turbulence: break the round edge with small offsets
      for (let k = 0; k < 2; k++) {
        const wx = px + (Math.random() - 0.5) * p.r * 1.6;
        const wy = py + (Math.random() - 0.5) * p.r;
        const wr = p.r * (0.22 + Math.random() * 0.2);
        const wg = c2.createRadialGradient(wx, wy, 0, wx, wy, wr);
        wg.addColorStop(0, `rgba(160, 178, 208, ${p.a * 0.32})`);
        wg.addColorStop(1, "rgba(160, 178, 208, 0)");
        c2.fillStyle = wg;
        c2.beginPath();
        c2.arc(wx, wy, wr, 0, Math.PI * 2);
        c2.fill();
      }
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

  const cloud = (c, now = 0, flashK = 0) => {
    const y = c.y + Math.sin(now * c.bobS + c.bobP) * c.bobA;
    // storm level deepens the cloud body so bolts read against it
    ctx.globalAlpha = Math.min(1, c.a * (0.6 + STORM.level * 0.5));
    ctx.drawImage(c.cv, c.x, y);
    if (flashK > 0) {
      // lightning underlight: warm belly glow, screen-blended
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.25 * flashK;
      ctx.drawImage(c.cv, c.x, y + 6);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  const boltPath = (b, alpha) => {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // outer glow pass, then hot white core — reads as real lightning
    ctx.shadowColor = "rgba(160, 185, 245, 0.9)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = `rgba(150, 180, 250, ${alpha * 0.55})`;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
    ctx.stroke();
    ctx.shadowBlur = 16;
    ctx.strokeStyle = `rgba(214, 229, 255, ${alpha})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
    ctx.lineWidth = 0.9;
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
      const flashK = now < flashUntil ? (flashUntil - now) / 170 : 0;
      cloud(c, now, flashK);
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
      const windBase = 0.6 + STORM.wind * 1.6;  // telemetry wind slant (#1)
      p.vx += (windBase - p.vx) * 0.02;
      p.vy += (3.2 - p.vy) * 0.008;
      p.x += p.vx + Math.sin(p.ph) * 0.18;
      p.y += p.vy;
      if (p.y > h + 14) { p.y = -14; p.x = Math.random() * w; }
      if (p.x > w + 14) p.x = -10;
      if (p.x < -14) p.x = w + 10;
      const hold = p.a; p.a = Math.min(0.5, p.a * STORM.rain); raindrop(p); p.a = hold;
    }

    if (now >= nextBolt) {
      bolts.push(makeBolt(w, h));
      flashUntil = now + 170;
      nextBolt = now + (4200 + Math.random() * 5200) / STORM.boltRate;
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
      // lightning-synced ambient flash (cinematic layer): blobs + rays +
      // flares brighten with the same 170ms envelope, 1 -> 0.
      try {
        document.documentElement.style.setProperty(
          "--flash", ((flashUntil - now) / 170).toFixed(2));
        flashSet = true;
      } catch { /* test-stub safe */ }
    } else if (flashSet) {
      flashSet = false;
      try { document.documentElement.style.removeProperty("--flash"); } catch {}
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
let WAKE_SECONDS = []; // fetched from the live scheduler; never guessed
export function initClocks() {
  const timeEl = document.querySelector("[data-clock]");
  const nextEl = document.querySelector("[data-nextwake]");
  if (!timeEl || !nextEl) return;
  const barEl = document.querySelector("[data-wakebar]");
  const tick = () => {
    const now = new Date();
    timeEl.textContent = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())}`;
    if (!WAKE_SECONDS.length) { nextEl.textContent = "next wake: schedule unavailable"; return; }
    const nowSec = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    let idx = WAKE_SECONDS.findIndex((s) => s > nowSec);
    let left, prev;
    if (idx === -1) { idx = 0; left = WAKE_SECONDS[0] + 86400 - nowSec; prev = WAKE_SECONDS.at(-1) - 86400; }
    else { left = WAKE_SECONDS[idx] - nowSec; prev = idx === 0 ? WAKE_SECONDS.at(-1) - 86400 : WAKE_SECONDS[idx - 1]; }
    const hh = Math.floor(left / 3600), mm = Math.floor((left % 3600) / 60), ss = left % 60;
    const wt = WAKE_SECONDS[idx];
    const hhmmss = `${pad2(Math.floor(wt / 3600))}:${pad2(Math.floor((wt % 3600) / 60))}:${pad2(wt % 60)}`;
    nextEl.textContent = `next wake ${hhmmss} UTC · in ${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
    if (barEl) barEl.style.setProperty("--wake-fill", (clamp((nowSec - prev) / (WAKE_SECONDS[idx] - prev)) * 100).toFixed(1) + "%");
  };
  const schedule = async () => {
    try {
      const r = await fetch("api/fleet/registry", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error("schedule unavailable");
      const d = await r.json();
      WAKE_SECONDS = d.agents.find((a) => a.name === "gale")?.schedule?.seconds || [];
    } catch { WAKE_SECONDS = []; }
    tick();
  };
  schedule();
  setInterval(schedule, 60000);
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
        window.__galeRUMRecord?.("PWA_SW_UPDATE_FOUND", 1, "events");
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) {
            w.postMessage("gale:skip-waiting");
          }
        });
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => window.__galeRUMRecord?.("PWA_SW_CONTROLLER_CHANGE", 1, "events"), { once: true });
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
      bell.style.cssText = "padding:8px 12px;min-height:32px";
      bell.addEventListener("click", togglePush);
      dockAdd(bell);
      const test = document.createElement("button");
      test.id = "push-test";
      test.type = "button";
      test.className = "mini-toggle";
      test.textContent = "test";
      test.hidden = true;
      test.style.cssText = "padding:8px 12px;min-height:32px";
      test.addEventListener("click", async () => {
        test.disabled = true;
        try {
          const r = await fetch("api/push/test", { method: "POST" });
          const d = await r.json();
          console.log("test push:", r.status, d);
        } catch {}
        setTimeout(() => { test.disabled = false; }, 5000);
      });
      dockAdd(test);
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
      // Ping via broadcast: send the message plainly (no MessageChannel
      // port transfer — iOS PWAs have been flaky with transferred ports),
      // and listen on navigator.serviceWorker for the SW's broadcast reply.
      if (reg.active) {
        const pong = await new Promise((resolve) => {
          const onMsg = (e) => {
            const d = e.data || {};
            if (d.type === "gale:pong") {
              navigator.serviceWorker.removeEventListener("message", onMsg);
              resolve(d);
            }
          };
          navigator.serviceWorker.addEventListener("message", onMsg);
          setTimeout(() => {
            navigator.serviceWorker.removeEventListener("message", onMsg);
            resolve({ version: "?", push: false });
          }, 1500);
          reg.active.postMessage("gale:ping");
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
        window.__galeRUMRecord?.("PUSH_UNSUBSCRIBED", 1, "events");
        paint();
        return;
      }
      const perm = await Notification.requestPermission();
      window.__galeRUMRecord?.(perm === "granted" ? "PUSH_PERMISSION_GRANTED" : "PUSH_PERMISSION_DENIED", 1, "events");
      if (perm !== "granted") return;
      const res = await fetch("api/push/vapid-key").then((r) => r.json());
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: res.public,
      });
      await fetch("api/push/subscribe", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub.toJSON()) });
      window.__galeRUMRecord?.("PUSH_SUBSCRIBED", 1, "events");
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

/* ---- light/dark theme (ROADMAP-modern): stored choice in localStorage
   ("light" | "dark"), absent = follow prefers-color-scheme. Applied
   pre-render via the inline snippet the pages carry; this toggle just
   cycles + persists. ---- */
export function initThemeToggle() {
  if (document.getElementById("theme-toggle")) return;
  const btn = document.createElement("button");
  btn.id = "theme-toggle";
  btn.type = "button";
  btn.className = "mini-toggle";
  btn.style.cssText = "padding:8px 12px;min-height:32px";
  const preferred = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)");
  const systemTheme = () => preferred?.matches ? "light" : "dark";
  const mode = () => {
    try { const saved = localStorage.getItem("gale-theme"); return saved === "light" || saved === "dark" ? saved : "auto"; } catch { return "auto"; }
  };
  const label = () => {
    const current = mode();
    btn.textContent = current === "auto" ? `◐ auto · ${systemTheme()}` : current === "light" ? "☀️ light" : "🌙 dark";
    btn.setAttribute("aria-pressed", String(current !== "auto"));
    btn.setAttribute("aria-label", `Appearance mode: ${current}${current === "auto" ? `, following system ${systemTheme()} theme` : ""}`);
  };
  btn.addEventListener("click", () => {
    const cur = mode();
    const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    if (next === "auto") {
      delete document.documentElement.dataset.theme;
      try { localStorage.removeItem("gale-theme"); } catch {}
    } else {
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("gale-theme", next); } catch {}
    }
    label();
  });
  dockAdd(btn);
  if (preferred?.addEventListener) preferred.addEventListener("change", () => { if (mode() === "auto") label(); });
  label();
}

/* ---- reduced-data mode (improvements #8): Save-Data header (via
   NetworkInformation.saveData) or the manual ⏾ toggle enables data-saver:
   canvases (storm/gl-sky) never init, CSS retires blobs/grain/particles,
   and heavy 60s samplers are skipped by their pages via isDataSaver().
   Toggle persists + reloads (loops are boot-bound, so reload is the clean
   apply). ---- */
export function isDataSaver() {
  try {
    if (localStorage.getItem("gale-datasaver") === "1") return true;
  } catch {}
  try {
    if (navigator.connection && navigator.connection.saveData) return true;
  } catch {}
  return false;
}
function initDataSaver() {
  if (typeof document === "undefined" || !document.body || document.getElementById("saver-toggle")) return;
  if (isDataSaver()) document.documentElement.dataset.saver = "1";
  const btn = document.createElement("button");
  btn.id = "saver-toggle";
  btn.type = "button";
  btn.className = "mini-toggle";
  btn.style.cssText = "padding:8px 12px;min-height:32px";
  const paint = () => {
    const on = isDataSaver();
    btn.textContent = on ? "⏾ saver on" : "⏾ saver";
    btn.setAttribute("aria-pressed", String(on));
  };
  btn.addEventListener("click", () => {
    try {
      const on = localStorage.getItem("gale-datasaver") === "1";
      localStorage.setItem("gale-datasaver", on ? "0" : "1");
    } catch {}
    location.reload();
  });
  dockAdd(btn);
  paint();
}

function initCssMotionControl() {
  if (typeof document === "undefined" || !document.body || document.getElementById("css-motion-toggle")) return;
  const btn = document.createElement("button");
  btn.id = "css-motion-toggle";
  btn.type = "button";
  btn.className = "mini-toggle";
  btn.style.cssText = "padding:8px 12px;min-height:32px";
  const paint = () => {
    let paused = false;
    try { paused = localStorage.getItem("gale-css-motion") === "paused"; } catch {}
    document.documentElement.dataset.cssMotion = paused ? "paused" : "";
    btn.textContent = paused ? "▶ CSS motion paused" : "Ⅱ pause CSS motion";
    btn.setAttribute("aria-pressed", String(paused));
  };
  btn.addEventListener("click", () => {
    const paused = document.documentElement.dataset.cssMotion === "paused";
    try { localStorage.setItem("gale-css-motion", paused ? "running" : "paused"); } catch {}
    paint();
  });
  dockAdd(btn);
  paint();
}

function initCodeCopy() {
  if (typeof document === "undefined" || !document.body) return;
  document.querySelectorAll("code[data-copy]").forEach((code) => {
    if (code.dataset.copyReady) return;
    code.dataset.copyReady = "1";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code-btn";
    button.textContent = "copy";
    button.setAttribute("aria-label", `Copy ${code.textContent.trim()}`);
    button.addEventListener("click", async () => {
      const text = code.textContent.trim();
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else {
          const field = document.createElement("textarea");
          field.value = text; field.setAttribute("readonly", "");
          field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
          document.body.appendChild(field); field.select();
          const copied = document.execCommand("copy"); field.remove();
          if (!copied) throw new Error("Clipboard unavailable");
        }
        button.textContent = "copied";
      } catch { button.textContent = "copy failed"; }
      button.setAttribute("aria-label", button.textContent === "copied" ? "Copied to clipboard" : "Copy command");
      setTimeout(() => { button.textContent = "copy"; button.setAttribute("aria-label", `Copy ${text}`); }, 1800);
    });
    code.insertAdjacentElement("afterend", button);
  });
}

/* ---- mobile PWA wayfinding and install/share help ---- */
const MOBILE_PAGES = [
  ["Overview", "index.html", "home"], ["Status", "status.html", "status"],
  ["Fleet", "fleet.html", "fleet"], ["Operations", "operations.html", "ops"],
  ["Metrics", "metrics.html"], ["Observability", "observability.html"],
  ["Ollama", "ollama.html"], ["Agora", "agora.html"], ["Weather", "weather.html"],
  ["Network", "network.html"], ["Reliability", "reliability.html"],
  ["Runbooks", "runbooks.html"], ["My Home", "home.html"],
];
let deferredInstallPrompt = null;

function initMobileNavigation() {
  if (!document.body || document.getElementById("gale-mobile-nav") || new URLSearchParams(location.search).has("kiosk")) return;
  const path = location.pathname.split("/").pop() || "index.html";
  const dialog = document.createElement("dialog");
  dialog.id = "gale-page-menu";
  dialog.className = "gale-page-menu";
  dialog.setAttribute("aria-labelledby", "gale-page-menu-title");
  const heading = document.createElement("h2");
  heading.id = "gale-page-menu-title"; heading.textContent = "Navigate Gale";
  const close = document.createElement("button");
  close.type = "button"; close.className = "gale-menu-close"; close.textContent = "Close";
  close.addEventListener("click", () => typeof dialog.close === "function" ? dialog.close() : dialog.removeAttribute("open"));
  const pageList = document.createElement("nav");
  pageList.className = "gale-page-links"; pageList.setAttribute("aria-label", "All Gale pages");
  for (const [label, href] of MOBILE_PAGES) {
    const link = document.createElement("a");
    link.href = href; link.textContent = label;
    if (href === path) link.setAttribute("aria-current", "page");
    pageList.append(link);
  }
  const tools = document.createElement("div"); tools.className = "gale-pwa-tools";
  const install = document.createElement("button");
  install.type = "button"; install.id = "gale-install-app"; install.textContent = "Install Gale";
  const share = document.createElement("button");
  share.type = "button"; share.id = "gale-share-page"; share.textContent = "Share this page";
  const update = document.createElement("button");
  update.type = "button"; update.id = "gale-check-update"; update.textContent = "Check app update";
  const applyUpdate = document.createElement("button");
  applyUpdate.type = "button"; applyUpdate.id = "gale-apply-update"; applyUpdate.textContent = "Reload with update"; applyUpdate.hidden = true;
  const copyStatus = document.createElement("button");
  copyStatus.type = "button"; copyStatus.id = "gale-copy-pwa-status"; copyStatus.textContent = "Copy PWA status";
  const displayControls = document.createElement("button");
  displayControls.type = "button"; displayControls.id = "gale-open-controls"; displayControls.textContent = "Display & accessibility controls";
  const toolStatus = document.createElement("p");
  toolStatus.id = "gale-pwa-tool-status"; toolStatus.className = "mini-note";
  toolStatus.setAttribute("role", "status"); toolStatus.setAttribute("aria-live", "polite");
  tools.append(install, share, update, applyUpdate, copyStatus, displayControls, toolStatus);
  dialog.append(close, heading, pageList, tools);
  document.body.append(dialog);
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); deferredInstallPrompt = event;
    install.textContent = "Install Gale · ready";
    window.__galeRUMRecord?.("PWA_INSTALL_PROMPT", 1, "events");
  });
  addEventListener("appinstalled", () => {
    deferredInstallPrompt = null; install.textContent = "Gale installed";
    toolStatus.textContent = "Gale is ready from your home screen or app launcher.";
    window.__galeRUMRecord?.("PWA_INSTALLED", 1, "events");
  });
  if (window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone) {
    install.textContent = "Gale installed";
    window.__galeRUMRecord?.("PWA_STANDALONE", 1, "events");
  }

  const more = document.createElement("button");
  more.type = "button"; more.className = "gale-mobile-tab"; more.id = "gale-mobile-more";
  more.setAttribute("aria-haspopup", "dialog"); more.setAttribute("aria-controls", dialog.id);
  more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg><span>More</span>';
  if (!MOBILE_PAGES.slice(0, 4).some(([, href]) => href === path)) more.setAttribute("aria-current", "page");
  more.addEventListener("click", () => dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", ""));
  const nav = document.createElement("nav");
  nav.id = "gale-mobile-nav"; nav.className = "gale-mobile-nav"; nav.setAttribute("aria-label", "Primary mobile navigation");
  const mainPages = MOBILE_PAGES.slice(0, 4);
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    status: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
    fleet: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M11 7 6 16m7-9 5 9M7 18h10"/>',
    ops: '<path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/>'
  };
  for (const [label, href, key] of mainPages) {
    const link = document.createElement("a"); link.className = "gale-mobile-tab"; link.href = href;
    link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]}</svg><span>${label}</span>`;
    if (href === path) link.setAttribute("aria-current", "page");
    nav.append(link);
  }
  nav.append(more); document.body.append(nav);
  document.documentElement.dataset.mobileNav = "ready";

  const viewport = window.visualViewport;
  const syncKeyboardSpace = () => {
    const active = document.activeElement;
    const typing = active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
    const keyboard = typing && viewport && viewport.height < window.innerHeight * 0.76;
    if (keyboard) document.documentElement.dataset.keyboardOpen = "true";
    else delete document.documentElement.dataset.keyboardOpen;
  };
  viewport?.addEventListener("resize", syncKeyboardSpace);
  viewport?.addEventListener("scroll", syncKeyboardSpace);
  document.addEventListener("focusin", syncKeyboardSpace);
  document.addEventListener("focusout", () => setTimeout(syncKeyboardSpace, 120));

  // Give phone users a one-time orientation hint on pages that actually host
  // a WebGL scene. Keep it dismissible and remember that choice on this device.
  const hasScene = [...document.querySelectorAll('canvas[role="img"], canvas#storm-canvas, canvas#storm-scene, canvas[data-scene]')]
    .some((canvas) => !canvas.hidden && canvas.getClientRects().length > 0);
  let orientationHintSeen = false;
  try { orientationHintSeen = localStorage.getItem("gale-scene-orientation-hint") === "1"; } catch {}
  if (hasScene && !orientationHintSeen && matchMedia("(max-width: 700px)").matches) {
    const hint = document.createElement("aside");
    hint.className = "gale-orientation-hint";
    hint.setAttribute("role", "status");
    hint.innerHTML = '<span><strong>More room for this scene</strong><br>Rotate your phone to landscape, or use Focus scene for full screen.</span>';
    const dismissHint = document.createElement("button");
    dismissHint.type = "button"; dismissHint.textContent = "Got it";
    dismissHint.setAttribute("aria-label", "Dismiss landscape tip");
    dismissHint.addEventListener("click", () => {
      try { localStorage.setItem("gale-scene-orientation-hint", "1"); } catch {}
      hint.remove();
    });
    hint.append(dismissHint); document.body.append(hint);
    window.__galeRUMRecord?.("PWA_ORIENTATION_HINT", 1, "events");
  }

  install.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      const prompt = deferredInstallPrompt; deferredInstallPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        window.__galeRUMRecord?.(choice?.outcome === "accepted" ? "PWA_INSTALL_ACCEPT" : "PWA_INSTALL_DISMISS", 1, "events");
        toolStatus.textContent = choice?.outcome === "accepted" ? "Gale was added to your apps." : "Install dismissed. You can install later from this menu.";
      } catch { toolStatus.textContent = "Install prompt unavailable. Use your browser menu to install Gale."; }
      return;
    }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installed = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone;
    toolStatus.textContent = installed ? "Gale is already installed on this device." : ios
      ? "To install: tap Share in Safari, then choose Add to Home Screen."
      : "To install: open your browser menu and choose Install app or Add to Home screen.";
  });
  update.addEventListener("click", async () => {
    update.disabled = true; toolStatus.textContent = "Checking for a Gale update…";
    try {
      const registration = await navigator.serviceWorker?.getRegistration("/");
      if (!registration) throw new Error("service worker is unavailable");
      await registration.update();
      if (registration.waiting) {
        applyUpdate.hidden = false;
        toolStatus.textContent = "An update is ready. Reload to apply it to this page.";
      } else toolStatus.textContent = "Gale is up to date.";
    } catch { toolStatus.textContent = "Could not check for an update. Try again when online."; }
    finally { update.disabled = false; }
  });
  applyUpdate.addEventListener("click", async () => {
    const registration = await navigator.serviceWorker?.getRegistration("/");
    if (!registration?.waiting) { toolStatus.textContent = "No waiting update was found. Check again."; applyUpdate.hidden = true; return; }
    toolStatus.textContent = "Applying update…";
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
    registration.waiting.postMessage("gale:skip-waiting");
  });
  copyStatus.addEventListener("click", async () => {
    let cacheNames = [];
    try { cacheNames = await caches.keys(); } catch {}
    const standalone = !!(window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone);
    const shell = cacheNames.find((name) => name.endsWith("-shell"))?.replace(/-shell$/, "") || "unknown";
    const summary = `Gale PWA · mode ${standalone ? "standalone" : "browser"} · network ${navigator.onLine ? "online" : "offline"} · worker ${navigator.serviceWorker?.controller ? "controlling" : "not controlling"} · shell ${shell} · caches ${cacheNames.length || "unavailable"}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(summary);
      else throw new Error("clipboard unavailable");
      toolStatus.textContent = "PWA status copied. It contains no page URL or device identifiers.";
    } catch { toolStatus.textContent = summary; }
    window.__galeRUMRecord?.("PWA_DIAGNOSTICS_COPY", 1, "events");
  });
  displayControls.addEventListener("click", () => {
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
    const toggle = document.querySelector("#gale-dock #dock-toggle");
    if (toggle?.getAttribute("aria-expanded") !== "true") toggle?.click();
    else toggle?.focus();
  });
  share.addEventListener("click", async () => {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href });
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(location.href); toolStatus.textContent = "Page link copied."; }
      else throw new Error("share unavailable");
      window.__galeRUMRecord?.("PWA_SHARE", 1, "events");
    } catch (error) {
      if (error.name !== "AbortError") toolStatus.textContent = "Sharing is unavailable in this browser.";
    }
  });
}

function initConnectivityStatus() {
  if (!document.body || document.getElementById("gale-connectivity")) return;
  const banner = document.createElement("div");
  banner.id = "gale-connectivity"; banner.className = "gale-connectivity";
  banner.setAttribute("role", "status"); banner.setAttribute("aria-live", "polite"); banner.hidden = true;
  const message = document.createElement("span");
  const refresh = document.createElement("button"); refresh.type = "button"; refresh.textContent = "Reload current page";
  refresh.addEventListener("click", () => location.reload());
  banner.append(message, refresh);
  const main = document.querySelector("main");
  if (main) document.body.insertBefore(banner, main); else document.body.prepend(banner);
  let wasOffline = !navigator.onLine;
  const update = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const limited = !!connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType);
    if (!navigator.onLine) {
      wasOffline = true; banner.dataset.state = "offline";
      message.textContent = "Offline · live telemetry is paused. Cached pages remain available."; refresh.hidden = true; banner.hidden = false;
    } else if (wasOffline) {
      wasOffline = false; banner.dataset.state = "restored";
      message.textContent = "Connection restored · reload to refresh live data."; refresh.hidden = false; banner.hidden = false;
      setTimeout(() => { if (navigator.onLine && banner.dataset.state === "restored") banner.hidden = true; }, 15000);
    } else if (limited) {
      banner.dataset.state = "limited"; message.textContent = "Limited connection · open More → Display & accessibility controls for Data saver."; refresh.hidden = true; banner.hidden = false;
    } else { banner.hidden = true; }
  };
  addEventListener("online", update); addEventListener("offline", update);
  connectionEvent(update); update();
}

function initMobileTableHints() {
  if (!document.body) return;
  const init = (wrap) => {
    if (wrap._galeScrollReady) { wrap._galeScrollUpdate?.(); return; }
    wrap._galeScrollReady = true;
    if (wrap.tabIndex < 0) wrap.tabIndex = 0;
    if (!wrap.hasAttribute("role")) wrap.setAttribute("role", "region");
    if (!wrap.hasAttribute("aria-label")) {
      const heading = wrap.closest("section,article,.ops-panel")?.querySelector("h2,h3,.panel-title");
      wrap.setAttribute("aria-label", `${heading?.textContent?.trim() || "Data table"} · horizontally scrollable`);
    }
    const hint = document.createElement("div"); hint.className = "table-scroll-hint"; hint.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    const progress = document.createElement("progress"); progress.max = 1; progress.value = 0;
    hint.append(label, progress);
    wrap.insertAdjacentElement("afterend", hint);
    const update = () => {
      const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      hint.hidden = max < 8;
      if (max < 8) return;
      const end = wrap.scrollLeft >= max - 4;
      label.textContent = end ? "End of table" : wrap.scrollLeft > 4 ? "Scroll for more columns" : "Swipe for more columns";
      progress.max = max; progress.value = Math.max(0, Math.min(max, wrap.scrollLeft));
    };
    wrap._galeScrollUpdate = update;
    wrap.addEventListener("scroll", update, { passive: true });
    wrap.addEventListener("keydown", (event) => {
      if (event.target !== wrap) return;
      const step = Math.max(80, Math.round(wrap.clientWidth * 0.7));
      const direction = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : event.key === "End" ? wrap.scrollWidth : event.key === "Home" ? -wrap.scrollWidth : 0;
      if (!direction) return;
      event.preventDefault(); wrap.scrollBy({ left: direction, behavior: REDUCED ? "auto" : "smooth" });
    });
    if (typeof ResizeObserver === "function") new ResizeObserver(update).observe(wrap);
    update();
  };
  const scan = (root) => {
    if (root.nodeType !== 1) return;
    const owner = root.closest?.(".table-wrap");
    if (owner) init(owner);
    if (root.matches?.(".table-wrap")) init(root);
    root.querySelectorAll?.(".table-wrap").forEach(init);
  };
  document.querySelectorAll(".table-wrap").forEach(init);
  if (typeof MutationObserver === "function") new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
}
function connectionEvent(callback) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  connection?.addEventListener?.("change", callback);
}

function initPWAChromeTheme() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const update = () => {
    if (typeof getComputedStyle !== "function") return;
    const color = getComputedStyle(document.documentElement).getPropertyValue("--bg-deep").trim();
    if (/^#[0-9a-f]{3,8}$/i.test(color)) meta.content = color;
  };
  update();
  if (typeof MutationObserver === "function") new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", update);
}

/* Nav status pulse: a small dot at the end of the site nav showing the worst open fleet alert
   (crit / warn / ok), linking to the ops board. Same /api/fleet/alerts the status page uses. */
function initNavPulse() {
  if (typeof document === "undefined") return;
  let a = document.getElementById("nav-pulse");
  if (!a) { // page not yet re-synced with tools/sync_nav.py
    const nav = document.querySelector(".site-links, .fleet-links, .topnav-links");
    if (!nav) return;
    a = document.createElement("a");
    a.id = "nav-pulse"; a.href = "status.html"; a.className = "nav-pulse"; a.dataset.level = "unknown";
    a.innerHTML = '<span class="nav-pulse-dot" aria-hidden="true"></span><span class="nav-pulse-txt">…</span>';
    nav.appendChild(a);
  }
  const paint = async () => {
    try {
      const r = await fetch("api/fleet/alerts", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      const list = d.alerts || [];
      const crit = list.filter((x) => x.sev === "crit").length, warn = list.filter((x) => x.sev === "warn").length;
      const lv = crit ? "crit" : warn ? "warn" : "ok";
      const txt = crit ? `${crit} critical` : warn ? `${warn} warning${warn > 1 ? "s" : ""}` : "all clear";
      a.dataset.level = lv;
      const mobileStatus = document.querySelector('#gale-mobile-nav a[href="status.html"]');
      if (mobileStatus) { mobileStatus.dataset.level = lv; mobileStatus.setAttribute("aria-label", `Status · ${txt}`); }
      // ambient: the whole page picks up a barely-there tint from this state (gale.css)
      try { document.documentElement.dataset.fleet = lv; } catch { /* noop */ }
      a.querySelector(".nav-pulse-txt").textContent = txt;
      a.setAttribute("aria-label", `Fleet health: ${txt}. Open ops status.`);
      // hover/focus panel (hidden on phones, where the pill just links to the ops board)
      let pop = a.querySelector(".nav-pulse-pop");
      if (!pop) { pop = document.createElement("span"); pop.className = "nav-pulse-pop"; pop.setAttribute("aria-hidden", "true"); a.appendChild(pop); }
      // recent open/close transitions (backend /alerts/history; absent on older backends -> block omitted)
      let histHTML = "";
      try {
        const hr = await fetch("api/fleet/alerts/history", { cache: "no-store" });
        if (hr.ok) {
          const hd = await hr.json();
          const ago = (iso) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m}m ago` : m < 2880 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };
          // 24 hourly cells (oldest -> newest): amber = alerts opened that hour, green = cleared only, grey = quiet
          const cells = new Array(24).fill(null).map(() => ({ o: 0, c: 0 })), nowH = Math.floor(Date.now() / 3.6e6);
          for (const e of hd.events || []) {
            const back = nowH - Math.floor(new Date(e.ts).getTime() / 3.6e6);
            if (back >= 0 && back < 24) cells[23 - back][e.event === "open" ? "o" : "c"]++;
          }
          const strip = '<span class="np-strip" role="img" aria-label="alert opens and clears per hour, last 24 hours">' + cells.map((c, i) =>
            `<i data-k="${c.o ? "o" : c.c ? "c" : ""}" title="${23 - i}h ago: ${c.o} opened, ${c.c} cleared"></i>`).join("") + "</span>";
          const ev = (hd.events || []).slice(0, 5);
          if (ev.length) histHTML = '<span class="np-hist-h">Recent changes</span>' + strip + ev.map((e) =>
            `<span class="np-hist" data-ev="${esc(e.event)}"><b>${e.event === "open" ? "opened" : "cleared"}</b> ${esc(ago(e.ts))} · ${esc(String(e.text || "").slice(0, 70))}</span>`).join("");
        }
      } catch { /* history is optional */ }
      const rank = { crit: 0, warn: 1 };
      const top = list.slice().sort((x, y) => (rank[x.sev] ?? 2) - (rank[y.sev] ?? 2)).slice(0, 6);
      // alert text -> agent name for the deep link ("AM GaleAgentSilent: Brook (...)", "mesa missed ...", "vista overdue ...")
      const who = (t) => { const m = /Silent:\s*([A-Za-z0-9_-]+)/.exec(t) || /^([a-z][a-z0-9_-]*)\s+(?:missed|overdue|last woke)/i.exec(t); return m ? m[1] : ""; };
      pop.innerHTML = (top.length
        ? top.map((x) => { const w = who(x.text);
            return `<span class="np-row" data-sev="${esc(x.sev)}"${w ? ` data-agent="${esc(w)}" role="link"` : ""}><i></i><span>${esc(x.text)}${x.note ? `<em class="np-note">${esc(x.note)}</em>` : ""}</span></span>`; }).join("")
        : '<span class="np-row" data-sev="ok"><i></i>No open alerts</span>') +
        (list.length > top.length ? `<span class="np-more">+${list.length - top.length} more · open ops status</span>` : '<span class="np-more">open ops status →</span>') + histHTML;
    } catch {
      a.dataset.level = "unknown";
      try { document.documentElement.dataset.fleet = "unknown"; } catch { /* noop */ }
      a.querySelector(".nav-pulse-txt").textContent = "offline";
    }
  };
  a.addEventListener("click", (e) => { // rows deep-link to the agent on the fleet page; the pill itself goes to ops status
    const row = e.target.closest && e.target.closest(".np-row[data-agent]");
    if (!row) return;
    e.preventDefault();
    location.href = "fleet.html?agent=" + encodeURIComponent(row.dataset.agent);
  });
  // hovering an alert row focuses that agent in the fleet page's topology (3D camera fly-to / SVG highlight)
  a.addEventListener("mouseover", (e) => {
    const row = e.target.closest && e.target.closest(".np-row[data-agent]");
    if (row) window.dispatchEvent(new CustomEvent("gale:focus-agent", { detail: { agent: row.dataset.agent } }));
  });
  a.addEventListener("mouseleave", () => window.dispatchEvent(new CustomEvent("gale:focus-clear")));
  paint();
  setInterval(paint, 60000);
}

/* stamp the print header with the print time (CSS reads data-printed; see mobile.css @media print) */
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("beforeprint", () => {
    const stamp = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    document.querySelectorAll(".ops-head").forEach((el) => el.setAttribute("data-printed", stamp));
  });
}

/* resolves once `el` is within `margin` of the viewport (immediately without IntersectionObserver). Used so the
   below-the-fold 3D panels don't create WebGL contexts / paint canvases during the initial load. */
export function whenNear(el, margin = "400px 0px") {
  return new Promise((res) => {
    if (!el || typeof IntersectionObserver !== "function") return res();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); res(); } }, { rootMargin: margin });
    io.observe(el);
  });
}

export function boot() {
  // WebGPU ambient sky (improvements #2): progressive enhancement -- the
  // CSS blobs stay as the fallback when WebGPU is missing or fails.
  if (typeof navigator !== "undefined" && navigator.gpu && !REDUCED && !isDataSaver()) {
    import("./glsky.js").then((m) => m.initGlSky()).catch(() => {});
  }
  if (!isDataSaver()) initStormCanvas();
  initProgressFallback();
  initClocks();
  // command palette (Ctrl/Cmd+K), dynamically imported so plain-Node
  // render-test imports of this module stay DOM-free
  if (typeof document !== "undefined" && document.body) {
    initMobileNavigation();
    initConnectivityStatus();
    initPWAChromeTheme();
    initMobileTableHints();
    initNavPulse();
    initThemeToggle();
    initContrastMode();
    initDataSaver();
    initCssMotionControl();
    initCodeCopy();
    initThemeEngine();
    import("./palette.js").then((m) => m.initPalette()).catch(() => {});
    // cinematic layer site-wide (Apple/ILM): dynamic so Node render-tests stay DOM-free
    import("./cinematic.js").then((m) => { try { m.initCinematic && m.initCinematic(); } catch {} }).catch(() => {});
    if (new URLSearchParams(location.search).has("kiosk")) {
      import("./kiosk.js").then((m) => m.initKiosk()).catch(() => {});
    }
  }
  initHeroParallax();
  refreshEffects();
  registerServiceWorker();
}


/* Operator controls follow verified server capabilities, including newly rendered buttons. */
if (typeof window !== "undefined" && typeof MutationObserver !== "undefined") {
  let writable = false;
  const selector = "[data-fw-pause],[data-fw-resume],[data-fw-block],[data-fw-unblock],.wake-chip,[data-act],#pull-btn,#chat-send,#unload-all";
  const applyAccess = () => {
    if (writable) return;
    for (const button of document.querySelectorAll(selector)) {
      if (!button.disabled) button.disabled = true;
      if (button.title !== "Read-only: use an authorized Tailscale user device") button.title = "Read-only: use an authorized Tailscale user device";
    }
  };
  const observer = new MutationObserver(applyAccess);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  applyAccess();
  fetch("api/fleet/access", {cache:"no-store"}).then(r=>r.ok?r.json():null).then(a=>{
    writable = !!a?.can_write;
    if (writable) {
      observer.disconnect();
      for (const b of document.querySelectorAll(selector)) if (b.title === "Read-only: use an authorized Tailscale user device") {b.disabled=false;b.title="";}
    }
  }).catch(()=>{});
}
