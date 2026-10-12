import{x}from"./chunks/chunk-HNAZ5L2Y.js";var P=`
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
// every window size and DPR \u2014 the old code divided by a hardcoded 1280, so
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
`;async function U(){try{if(!navigator.gpu)return!1;let s=await navigator.gpu.requestAdapter({powerPreference:"low-power"});if(!s)return!1;let t=await s.requestDevice(),e=document.getElementById("gl-sky");e||(e=document.createElement("canvas"),e.id="gl-sky",e.setAttribute("aria-hidden","true"),document.body.prepend(e));let c=e.getContext("webgpu");if(!c)return e.remove(),!1;let u=navigator.gpu.getPreferredCanvasFormat(),f=t.createShaderModule({code:P}),v=(await f.getCompilationInfo()).messages.filter(n=>n.type==="error");if(v.length)throw new Error(`WGSL compilation failed (${v.length} errors)`);let m=t.createRenderPipeline({layout:"auto",vertex:{module:f,entryPoint:"vs"},fragment:{module:f,entryPoint:"fs",targets:[{format:u}]}}),h=t.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),E=t.createBindGroup({layout:m.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}}]}),d=()=>{let n=Math.min(window.devicePixelRatio||1,1.5),o=Math.max(1,Math.floor(window.innerWidth*n)),i=Math.max(1,Math.floor(window.innerHeight*n));(e.width!==o||e.height!==i)&&(e.width=o,e.height=i,c.configure({device:t,format:u,alphaMode:"opaque"}))};d(),window.addEventListener("resize",d,{passive:!0});let R=performance.now(),a=!0,r=!1,l=0,p=!1;t.addEventListener("uncapturederror",()=>{window.__galeRUMRecord?.("WEBGPU_UNCAPTURED_ERROR",1,"events","glsky")});let g=()=>{r&&(r=!1,cancelAnimationFrame(l))},w=()=>{a&&!r&&!document.hidden&&(r=!0,l=requestAnimationFrame(b))},y=()=>{document.hidden?g():w()};document.addEventListener("visibilitychange",y),t.lost.then(n=>{a&&(a=!1,g(),document.removeEventListener("visibilitychange",y),document.documentElement.classList.remove("gl-sky-on"),e.remove(),window.__galeRUMRecord?.("WEBGPU_DEVICE_LOSS",1,"events","glsky"),console.warn("gl-sky device lost",n.reason),p||(p=!0,setTimeout(()=>{U().catch(()=>{})},2e3)))}).catch(()=>{}),document.documentElement.classList.add("gl-sky-on");let b=()=>{if(!a||document.hidden){r=!1;return}d();let n=(performance.now()-R)/1e3;t.queue.writeBuffer(h,0,new Float32Array([n,x.level,e.width,e.height]));let o=t.createCommandEncoder(),i=o.beginRenderPass({colorAttachments:[{view:c.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store"}]});i.setPipeline(m),i.setBindGroup(0,E),i.draw(3),i.end(),t.queue.submit([o.finish()]),l=requestAnimationFrame(b)};return w(),!0}catch(s){return window.__galeRUMRecord?.("WEBGPU_INIT_FAILURE",1,"events","glsky"),document.documentElement.classList.remove("gl-sky-on"),document.getElementById("gl-sky")?.remove(),console.warn("gl-sky unavailable",s),!1}}export{U as initGlSky};
//# sourceMappingURL=glsky-JU2EV7IO.js.map
