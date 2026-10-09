/* GALE — shared WebGL plumbing for the hand-rolled 3D engines (bars3d,
   topology3d). Three pipelines had grown identical compile/link code,
   identical LITE logic and identical DPR caps; this is the one copy, plus
   a runtime quality governor: devices lie about what they can do, so the
   engines MEASURE frame time and degrade resolution/skip frames instead of
   stuttering. Pure timing logic — testable without a GL context.

   Deliberately NOT here (yet): matrix math (each engine's is working and
   subtly different), WebGPU (glsky lives on its own happy island). */

export function compile(gl, type, src, label = "shader") {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(`${label}: ${gl.getShaderInfoLog(s) || "compile failed"}`);
  }
  return s;
}

export function program(gl, vs, fs, label = "program") {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, `${label}/vs`));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, `${label}/fs`));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`${label}: ${gl.getProgramInfoLog(p) || "link failed"}`);
  }
  return p;
}

export const dprCap = (base) => Math.min(window.devicePixelRatio || 1, base);

/* Optional diagnostics HUD for local renderer triage: append ?graphics=debug.
   It is absent from normal views and never writes telemetry by itself. */
export function createGraphicsHud(canvas, scene, quality) {
  let el = null, windowAt = 0, frameCount = 0;
  try {
    if (new URLSearchParams(location.search).get("graphics") === "debug") {
      el = document.createElement("output");
      el.className = "graphics-hud";
      el.setAttribute("aria-live", "off");
      el.textContent = `${scene} · waiting for frame data`;
      (canvas.parentElement || document.body).appendChild(el);
    }
  } catch {}
  return {
    update(now, active = 0) {
      if (!el) return;
      if (!windowAt) windowAt = now;
      frameCount++;
      if (now - windowAt < 1000) return;
      const dpr = canvas.clientWidth ? canvas.width / canvas.clientWidth : 0;
      const fps = quality ? quality.fps() : frameCount * 1000 / Math.max(1, now - windowAt);
      el.textContent = `${scene} · ${Math.round(fps)} fps · tier ${quality ? quality.tier : "fixed"} · DPR ${dpr.toFixed(2)} · ${Math.round(canvas.width * canvas.height / 1000)}k px · ${active} active elements`;
      windowAt = now; frameCount = 0;
    },
    status(message) { if (el) el.textContent = `${scene} · ${message}`; },
    destroy() { el?.remove(); el = null; },
  };
}

/* the one light rig every GALE engine shares: a low warm-cool key from the
   upper left. bars3d shades with it; contact shadows fall away from it. */
export const LIGHT = [-0.45, 0.85, 0.35];

/* Quality: EMA of frame delta drives a tier ladder. Sustained slowness
   (hold frames over downMs) steps DOWN; sustained ease (longer hold over
   upMs) steps back UP; cooldown between moves stops flapping. dt spikes
   over 250ms are tab-return artifacts and ignored. */
export class Quality {
  static SCALES = [1, 0.8, 0.65, 0.5];

  constructor({ downMs = 23, upMs = 14, hold = 60, coolMs = 2000, maxTier = 3 } = {}) {
    this.downMs = downMs; this.upMs = upMs; this.hold = hold;
    this.coolMs = coolMs; this.maxTier = maxTier;
    this.ema = 16.7; this.tier = 0;
    this._slow = 0; this._fast = 0; this._coolAt = -1e9;
  }

  scale() { return Quality.SCALES[Math.min(this.tier, Quality.SCALES.length - 1)]; }
  fps() { return 1000 / Math.max(1, this.ema); }

  tick(dtMs, now) {
    if (!(dtMs > 0) || dtMs > 250) return this.scale();
    this.ema += (dtMs - this.ema) * 0.1;
    if (now - this._coolAt < this.coolMs) return this.scale();
    if (this.ema > this.downMs) {
      this._slow++; this._fast = 0;
      if (this._slow >= this.hold && this.tier < this.maxTier) {
        this.tier++; this._slow = 0; this._coolAt = now;
      }
    } else if (this.ema < this.upMs) {
      this._fast++; this._slow = 0;
      if (this._fast >= this.hold * 2 && this.tier > 0) {
        this.tier--; this._fast = 0; this._coolAt = now;
      }
    } else {
      this._slow = 0; this._fast = 0;
    }
    return this.scale();
  }
}
