import{l as v}from"./chunks/chunk-FFV35YFU.js";var h=`
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
`;async function w(){try{if(!navigator.gpu)return!1;let i=await navigator.gpu.requestAdapter({powerPreference:"low-power"});if(!i)return!1;let t=await i.requestDevice(),e=document.getElementById("gl-sky");e||(e=document.createElement("canvas"),e.id="gl-sky",e.setAttribute("aria-hidden","true"),document.body.prepend(e));let s=e.getContext("webgpu");if(!s)return!1;let f=navigator.gpu.getPreferredCanvasFormat(),u=t.createShaderModule({code:h}),d=t.createRenderPipeline({layout:"auto",vertex:{module:u,entryPoint:"vs"},fragment:{module:u,entryPoint:"fs",targets:[{format:f}]}}),l=t.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),p=t.createBindGroup({layout:d.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}}]}),c=()=>{let n=Math.min(window.devicePixelRatio||1,1.5),o=Math.max(1,Math.floor(window.innerWidth*n)),r=Math.max(1,Math.floor(window.innerHeight*n));(e.width!==o||e.height!==r)&&(e.width=o,e.height=r,s.configure({device:t,format:f,alphaMode:"opaque"}))};c(),window.addEventListener("resize",c,{passive:!0});let m=performance.now();return document.documentElement.classList.add("gl-sky-on"),requestAnimationFrame(function n(){if(document.hidden){requestAnimationFrame(n);return}c();let o=(performance.now()-m)/1e3;t.queue.writeBuffer(l,0,new Float32Array([o,v.level,window.innerWidth/Math.max(1,window.innerHeight),7]));let r=t.createCommandEncoder(),a=r.beginRenderPass({colorAttachments:[{view:s.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store"}]});a.setPipeline(d),a.setBindGroup(0,p),a.draw(3),a.end(),t.queue.submit([r.finish()]),requestAnimationFrame(n)}),!0}catch(i){return console.warn("gl-sky unavailable",i),!1}}export{w as initGlSky};
//# sourceMappingURL=glsky-SDG2QQCU.js.map
