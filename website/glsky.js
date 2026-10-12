/* GALE — WebGPU ambient sky (improvements #2, progressive enhancement).
   A fullscreen WGSL value-noise sky behind everything (z -2): deep navy
   base, drifting slate clouds, teal + ember accents that brighten and hurry
   with STORM.level (live box load/temp). If WebGPU is missing it no-ops
   and the CSS blobs remain. Top-level is side-effect free so Node-based
   render-test imports stay safe; all browser access happens in initGlSky. */
import { STORM } from "./shared.js";

const WGSL = /* wgsl */`
struct U { time: f32, intensity: f32, width: f32, height: f32 };
@group(0) @binding(0) var<uniform> u: U;

fn hash(p: vec2f) -> f32 {
  let h = fract(sin(dot(p, vec2f(127.1, 311.7)) + 7.0) * 43758.5453);
  return h;
}
fn vnoise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p);
  let s = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2f(1.0, 0.0)), s.x),
             mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), s.x), s.y);
}
fn fbm(p: vec2f) -> f32 {
  var v = 0.0; var a = 0.5;
  for (var i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}

@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(p[i], 0.0, 1.0);
}

// uv is normalized by the ACTUAL framebuffer size (width/height travel in
// the uniform), so pattern density and vignette centering are identical at
// every window size and DPR — the old code divided by a hardcoded 1280, so
// at DPR 2 the noise field compressed 2x and the vignette drifted off-center.
@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let fsize = max(vec2f(u.width, u.height), vec2f(1.0));
  let uv = pos.xy / fsize * 720.0; // fixed 720p-tall reference world scale
  let t = u.time * (0.008 + u.intensity * 0.03);
  let drift = vec2f(t * 1.7, t * 0.4);
  let n = fbm(uv * 3.0 + drift);
  let n2 = fbm(uv * 6.5 - drift * 1.6);
  // base: near-black navy -> slate; clouds lift the mids
  var col = mix(vec3f(0.008, 0.024, 0.051), vec3f(0.10, 0.15, 0.24), smoothstep(0.25, 0.85, n));
  // teal wash on the ridges, ember accent when hot
  col += vec3f(0.05, 0.35, 0.42) * smoothstep(0.55, 0.95, n2) * (0.25 + u.intensity * 0.9);
  col += vec3f(0.55, 0.16, 0.08) * smoothstep(0.72, 1.0, n * n2 * 1.6) * u.intensity;
  // vignette to keep content readable (centered on the true framebuffer)
  let d = distance(pos.xy / fsize, vec2f(0.5, 0.28));
  col *= 1.0 - 0.55 * smoothstep(0.2, 0.95, d);
  return vec4f(col, 1.0);
}
`;

export async function initGlSky() {
  try {
    if (!navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "low-power" });
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    let canvas = document.getElementById("gl-sky");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "gl-sky";
      canvas.setAttribute("aria-hidden", "true");
      document.body.prepend(canvas);
    }
    const ctx = canvas.getContext("webgpu");
    if (!ctx) { canvas.remove(); return false; }
    const format = navigator.gpu.getPreferredCanvasFormat();
    const module = device.createShaderModule({ code: WGSL });
    const compilation = await module.getCompilationInfo();
    const shaderErrors = compilation.messages.filter((message) => message.type === "error");
    if (shaderErrors.length) throw new Error(`WGSL compilation failed (${shaderErrors.length} errors)`);
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module, entryPoint: "vs" },
      fragment: { module, entryPoint: "fs", targets: [{ format }] },
    });
    const uniformBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuf } }],
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        ctx.configure({ device, format, alphaMode: "opaque" });
      }
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    const t0 = performance.now();
    let active = true, running = false, frameId = 0, lostRetried = false;
    device.addEventListener("uncapturederror", () => {
      window.__galeRUMRecord?.("WEBGPU_UNCAPTURED_ERROR", 1, "events", "glsky");
    });
    // hidden tabs stop scheduling entirely (#21): the old loop re-armed rAF
    // and only skipped the draw, waking the GPU process for nothing.
    const stop = () => { if (running) { running = false; cancelAnimationFrame(frameId); } };
    const start = () => { if (active && !running && !document.hidden) { running = true; frameId = requestAnimationFrame(loop); } };
    const onVis = () => { if (document.hidden) stop(); else start(); };
    document.addEventListener("visibilitychange", onVis);
    // transient device loss gets ONE retry (#21): a driver reset used to
    // kill the sky for the whole session; a fresh init recovers the common
    // case (guarded so a persistent loss can't loop).
    device.lost.then((info) => {
      if (!active) return;
      active = false; stop();
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.classList.remove("gl-sky-on");
      canvas.remove();
      window.__galeRUMRecord?.("WEBGPU_DEVICE_LOSS", 1, "events", "glsky");
      console.warn("gl-sky device lost", info.reason);
      if (!lostRetried) {
        lostRetried = true;
        setTimeout(() => { initGlSky().catch(() => {}); }, 2000);
      }
    }).catch(() => {});
    document.documentElement.classList.add("gl-sky-on");
    const loop = () => {
      if (!active || document.hidden) { running = false; return; }
      resize();
      const t = (performance.now() - t0) / 1000;
      // uniform now carries the real framebuffer size (width, height) for
      // the size-correct uv in the shader (see WGSL fs comment)
      device.queue.writeBuffer(uniformBuf, 0, new Float32Array([t, STORM.level, canvas.width, canvas.height]));
      const enc2 = device.createCommandEncoder();
      const pass2 = enc2.beginRenderPass({
        colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store" }],
      });
      pass2.setPipeline(pipeline);
      pass2.setBindGroup(0, bindGroup);
      pass2.draw(3);
      pass2.end();
      device.queue.submit([enc2.finish()]);
      frameId = requestAnimationFrame(loop);
    };
    start();
    return true;
  } catch (e) {
    window.__galeRUMRecord?.("WEBGPU_INIT_FAILURE", 1, "events", "glsky");
    document.documentElement.classList.remove("gl-sky-on");
    document.getElementById("gl-sky")?.remove();
    console.warn("gl-sky unavailable", e);
    return false;
  }
}
