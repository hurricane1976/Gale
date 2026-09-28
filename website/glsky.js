/* GALE — WebGPU ambient sky (improvements #2, progressive enhancement).
   A fullscreen WGSL value-noise sky behind everything (z -2): deep navy
   base, drifting slate clouds, teal + ember accents that brighten and hurry
   with STORM.level (live box load/temp). If WebGPU is missing it no-ops
   and the CSS blobs remain. Top-level is side-effect free so Node-based
   render-test imports stay safe; all browser access happens in initGlSky. */
import { STORM } from "./shared.js";

const WGSL = /* wgsl */`
struct U { time: f32, intensity: f32, aspect: f32, seed: f32 };
@group(0) @binding(0) var<uniform> u: U;

fn hash(p: vec2f) -> f32 {
  let h = fract(sin(dot(p, vec2f(127.1, 311.7)) + u.seed) * 43758.5453);
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

@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = vec2f(pos.x / 1280.0 * u.aspect, pos.y / 1280.0);
  let t = u.time * (0.008 + u.intensity * 0.03);
  let drift = vec2f(t * 1.7, t * 0.4);
  let n = fbm(uv * 3.0 + drift);
  let n2 = fbm(uv * 6.5 - drift * 1.6);
  // base: near-black navy -> slate; clouds lift the mids
  var col = mix(vec3f(0.008, 0.024, 0.051), vec3f(0.10, 0.15, 0.24), smoothstep(0.25, 0.85, n));
  // teal wash on the ridges, ember accent when hot
  col += vec3f(0.05, 0.35, 0.42) * smoothstep(0.55, 0.95, n2) * (0.25 + u.intensity * 0.9);
  col += vec3f(0.55, 0.16, 0.08) * smoothstep(0.72, 1.0, n * n2 * 1.6) * u.intensity;
  // vignette to keep content readable
  let d = distance(uv, vec2f(u.aspect * 0.5, 0.28));
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
    if (!ctx) return false;
    const format = navigator.gpu.getPreferredCanvasFormat();
    const module = device.createShaderModule({ code: WGSL });
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
    document.documentElement.classList.add("gl-sky-on");
    requestAnimationFrame(function loop() {
      if (document.hidden) { requestAnimationFrame(loop); return; }
      resize();
      const t = (performance.now() - t0) / 1000;
      device.queue.writeBuffer(uniformBuf, 0, new Float32Array([t, STORM.level, window.innerWidth / Math.max(1, window.innerHeight), 7.0]));
      const enc2 = device.createCommandEncoder();
      const pass2 = enc2.beginRenderPass({
        colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store" }],
      });
      pass2.setPipeline(pipeline);
      pass2.setBindGroup(0, bindGroup);
      pass2.draw(3);
      pass2.end();
      device.queue.submit([enc2.finish()]);
      requestAnimationFrame(loop);
    });
    return true;
  } catch (e) {
    console.warn("gl-sky unavailable", e);
    return false;
  }
}
