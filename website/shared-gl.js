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
  let el = null, windowAt = 0, frameCount = 0, lastTierSampleAt = 0;
  const sceneStartedAt = performance.now();
  let hiddenAt = document.hidden ? Date.now() : 0;
  let lastCanvasSampleAt = 0;
  const visibility = () => {
    if (document.hidden) { hiddenAt = Date.now(); window.__galeRUMRecord?.("SCENE_PAUSE", 1, "events", scene); }
    else if (hiddenAt) {
      window.__galeRUMRecord?.("SCENE_RESUME", 1, "events", scene);
      hiddenAt = 0;
    }
  };
  document.addEventListener("visibilitychange", visibility);
  const tierBadge = document.createElement("output");
  tierBadge.className = "graphics-tier";
  tierBadge.setAttribute("aria-live", "off");
  const sceneRoot = canvas.parentElement || document.body;
  sceneRoot.appendChild(tierBadge);
  const focusButton = document.createElement("button");
  focusButton.type = "button"; focusButton.className = "scene-focus-btn"; focusButton.textContent = "Focus scene";
  focusButton.setAttribute("aria-label", `Focus ${scene} scene full screen`);
  focusButton.hidden = !(document.fullscreenEnabled && sceneRoot.requestFullscreen);
  const updateFocusLabel = () => {
    const focused = document.fullscreenElement === sceneRoot;
    focusButton.textContent = focused ? "Exit focus" : "Focus scene";
    focusButton.setAttribute("aria-label", focused ? `Exit full screen for ${scene} scene` : `Focus ${scene} scene full screen`);
  };
  const onQualityMode = (event) => {
    if (!quality) return;
    quality.setMode(event.detail?.mode);
    const modes = { auto: 0, battery: 1, balanced: 2, detail: 3 };
    window.__galeRUMRecord?.("SCENE_QUALITY_MODE", modes[quality.mode] ?? 0, "mode (auto/battery/balanced/detail)", scene);
  };
  window.addEventListener("gale:graphics-quality", onQualityMode);
  const onFullscreen = () => updateFocusLabel();
  document.addEventListener("fullscreenchange", onFullscreen);
  focusButton.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === sceneRoot) await document.exitFullscreen();
      else await sceneRoot.requestFullscreen({ navigationUI: "hide" });
      window.__galeRUMRecord?.("SCENE_FOCUS", 1, "events", scene);
    } catch {
      try { if (!document.fullscreenElement) await sceneRoot.requestFullscreen(); } catch {}
    }
  });
  sceneRoot.appendChild(focusButton);
  window.__galeRUMRecord?.("SCENE_START", 1, "events", scene);
  if (quality) {
    const modes = { auto: 0, battery: 1, balanced: 2, detail: 3 };
    window.__galeRUMRecord?.("SCENE_QUALITY_MODE", modes[quality.mode] ?? 0, "mode (auto/battery/balanced/detail)", scene);
  }
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
      const elapsed = Math.max(0, Math.floor((now - sceneStartedAt) / 1000));
      const elapsedText = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
      const tierText = quality ? `${quality.mode === "auto" ? "auto" : quality.mode} · tier ${quality.tier + 1}/4 · ${["full", "reduced", "half-rate", "minimum"][quality.tier] || "adaptive"} · ${elapsedText}` : "static quality · motion reduced";
      if (tierBadge.textContent !== `${scene} · ${tierText}`) {
        tierBadge.textContent = `${scene} · ${tierText}`;
        tierBadge.title = "Adaptive WebGL quality steps down under sustained slow frames; local display only.";
      }
      if (quality && now - lastTierSampleAt >= 15000) {
        window.__galeRUMRecord?.("SCENE_TIER", quality.tier + 1, "quality tier (1=full)", scene);
        lastTierSampleAt = now;
      }
      if (now - lastCanvasSampleAt >= 15000 && canvas.width > 0 && canvas.height > 0) {
        const dpr = canvas.clientWidth ? canvas.width / canvas.clientWidth : window.devicePixelRatio || 1;
        window.__galeRUMRecord?.("SCENE_DPR", dpr, "effective DPR", scene);
        window.__galeRUMRecord?.("SCENE_PIXELS", canvas.width * canvas.height / 1e6, "megapixels", scene);
        lastCanvasSampleAt = now;
      }
      if (!el) return;
      if (!windowAt) windowAt = now;
      frameCount++;
      if (now - windowAt < 1000) return;
      const dpr = canvas.clientWidth ? canvas.width / canvas.clientWidth : 0;
      const fps = quality ? quality.fps() : frameCount * 1000 / Math.max(1, now - windowAt);
      el.textContent = `${scene} · ${Math.round(fps)} fps · tier ${quality ? quality.tier : "fixed"} · DPR ${dpr.toFixed(2)} · ${Math.round(canvas.width * canvas.height / 1000)}k px · ${active} active elements`;
      windowAt = now; frameCount = 0;
    },
    status(message) {
      if (/fallback|context lost/i.test(message)) window.__galeRUMRecord?.("SCENE_FALLBACK", 1, "events", scene);
      if (el) el.textContent = `${scene} · ${message}`;
    },
    destroy() { document.removeEventListener("visibilitychange", visibility); document.removeEventListener("fullscreenchange", onFullscreen); window.removeEventListener("gale:graphics-quality", onQualityMode); el?.remove(); el = null; tierBadge.remove(); focusButton.remove(); },
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
    let mode = "auto";
    try { mode = localStorage.getItem("gale-graphics-quality") || "auto"; } catch {}
    this.setMode(mode);
  }

  setMode(mode) {
    this.mode = ["auto", "battery", "balanced", "detail"].includes(mode) ? mode : "auto";
    if (this.mode === "battery") this.tier = this.maxTier;
    else if (this.mode === "balanced") this.tier = Math.min(1, this.maxTier);
    else if (this.mode === "detail") this.tier = 0;
    this._slow = 0; this._fast = 0;
    return this.scale();
  }

  scale() { return Quality.SCALES[Math.min(this.tier, Quality.SCALES.length - 1)]; }
  fps() { return 1000 / Math.max(1, this.ema); }

  tick(dtMs, now) {
    if (!(dtMs > 0) || dtMs > 250) return this.scale();
    this.ema += (dtMs - this.ema) * 0.1;
    if (this.mode !== "auto") return this.scale();
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
