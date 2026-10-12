import{a as V,b as Yt,c as qt}from"./chunks/chunk-PA37XBAA.js";import{A as Gt,C as $t,a as lt}from"./chunks/chunk-ZX77XVOG.js";$t();var H=[{id:"tidal",name:"Tidal",col:[.3,.8,1],agents:["Tidal","River","Creek","Stream","Meadow","Brook","Mist"]},{id:"beacon",name:"Beacon",col:[1,.78,.3],agents:["Beacon","Highbeam","Lantern","Lightning","Radar","Prism","Pulsar"]},{id:"mountain",name:"Mountain",col:[.72,.52,1],agents:["Mountain","Canyon","Ridge","Harbor","Delta","Mesa","Vista"]},{id:"gale",name:"Gale",col:[.28,.62,1],agents:["Gale","Zephyr","Squall","Tempest","Vortex","Chinook","Cyclone","Maistral","Sirocco","Bora","Tramontane","Ostro","Poniente","Levante"]}],oe=[1,.72,.2],re=[1,.24,.22],Rt=3.3,J={sub:(r,s)=>[r[0]-s[0],r[1]-s[1],r[2]-s[2]],cross:(r,s)=>[r[1]*s[2]-r[2]*s[1],r[2]*s[0]-r[0]*s[2],r[0]*s[1]-r[1]*s[0]],norm:r=>{let s=Math.hypot(r[0],r[1],r[2])||1;return[r[0]/s,r[1]/s,r[2]/s]}};function ae(r,s,x,c){let u=1/Math.tan(r/2),h=new Float32Array(16);return h[0]=u/s,h[5]=u,h[10]=(c+x)/(x-c),h[11]=-1,h[14]=2*c*x/(x-c),h}function ie(r,s,x){let c=J.norm(J.sub(s,r)),u=J.norm(J.cross(c,x)),h=J.cross(u,c),m=new Float32Array(16);return m[0]=u[0],m[4]=u[1],m[8]=u[2],m[1]=h[0],m[5]=h[1],m[9]=h[2],m[2]=-c[0],m[6]=-c[1],m[10]=-c[2],m[12]=-(u[0]*r[0]+u[1]*r[1]+u[2]*r[2]),m[13]=-(h[0]*r[0]+h[1]*r[1]+h[2]*r[2]),m[14]=c[0]*r[0]+c[1]*r[1]+c[2]*r[2],m[15]=1,{m,f:c,s:u,u:h}}function se(r,s){let x=new Float32Array(16);for(let c=0;c<4;c++)for(let u=0;u<4;u++)x[c*4+u]=r[u]*s[c*4]+r[4+u]*s[c*4+1]+r[8+u]*s[c*4+2]+r[12+u]*s[c*4+3];return x}var Mt=1337,b=()=>(Mt=Mt*1664525+1013904223>>>0,Mt/4294967296),wt=()=>(b()+b()+b()+b()-2)*.8660254,ft=`#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,ce=`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec3 uF, uR, uU; uniform float uAsp, uT, uAlert; uniform vec3 uCol[4];
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * vn(p); p = p * 2.07 + 11.3; a *= 0.5; } return v; }
void main(){
  vec2 q = (vUv * 2.0 - 1.0) * vec2(uAsp, 1.0) * 0.62;
  vec3 d = normalize(uF + q.x * uR + q.y * uU);
  float t = uT * 0.012;
  vec3 w = vec3(fbm(d * 2.2 + t), fbm(d * 2.2 + 7.7 - t), fbm(d * 2.2 + 3.1 + t));
  float n = fbm(d * 1.8 + 2.4 * (w - 0.5));
  float n2 = fbm(d * 3.6 - 1.7 * (w - 0.5) + 9.0);
  vec3 c = vec3(0.012, 0.016, 0.040);
  c += uCol[0] * smoothstep(0.42, 0.95, n) * 0.20;
  c += uCol[2] * smoothstep(0.48, 1.00, n2) * 0.18;
  c += uCol[1] * smoothstep(0.55, 1.00, fbm(d * 2.9 + 20.0 + w)) * 0.10;
  c += vec3(0.30, 0.04, 0.05) * uAlert * smoothstep(0.5, 1.0, n * n2 * 2.0) * 0.30; // a stormy red tint while something is critical
  // starfield: three octaves of cell-hashed points
  for (int k = 0; k < 3; k++){
    float s = 55.0 + float(k) * 70.0;
    vec3 p = d * s, cell = floor(p), fr = fract(p) - 0.5;
    float hh = h31(cell + float(k) * 17.0);
    float on = step(0.985 - float(k) * 0.004, hh);
    float dist = length(fr + (vec3(h31(cell + 1.3), h31(cell + 2.7), h31(cell + 4.1)) - 0.5) * 0.6);
    float tw = 0.75 + 0.25 * sin(uT * (1.0 + hh * 4.0) + hh * 90.0);
    vec3 sc = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.85, 0.65), h31(cell + 9.0));
    c += sc * on * tw * smoothstep(0.16, 0.0, dist) * (0.8 - float(k) * 0.2);
  }
  o = vec4(c, 1.0);
}`,le=`#version 300 es
precision highp float;
in vec4 aA; in vec2 aB;
uniform mat4 uVP; uniform float uT, uPx; uniform vec3 uCol[4];
out vec3 vC;
void main(){
  float r = aA.x, rn = aA.w;
  float th = aA.y + uT * 0.05 + 0.07 * sin(uT * (0.25 + 0.7 / (0.2 + r)) + rn * 6.2831);
  vec3 p = vec3(cos(th) * r, aA.z + 0.012 * sin(uT * 0.6 + rn * 40.0), sin(th) * r);
  gl_Position = uVP * vec4(p, 1.0);
  float core = smoothstep(0.38, 0.0, r);
  vec3 c = mix(uCol[int(aB.x)], vec3(1.0, 0.84, 0.58), core);
  c = mix(c, vec3(0.78, 0.92, 1.0), step(0.94, rn) * 0.75);
  vC = c * (0.45 + 0.9 * rn);
  gl_PointSize = clamp(aB.y * uPx / max(gl_Position.w, 0.15), 1.0, 12.0);
}`,fe=`#version 300 es
precision mediump float;
in vec3 vC; out vec4 o; uniform float uGain;
void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d * d * 4.5) * step(d, 1.0); o = vec4(vC * a * uGain, a); }`,ue=`#version 300 es
precision highp float;
in vec3 aP; in vec3 aC; in vec2 aS; // aS = size, kind
uniform mat4 uVP; uniform float uPx, uMax;
out vec3 vC; out float vK; out float vSz;
void main(){
  gl_Position = uVP * vec4(aP, 1.0);
  vC = aC; vK = aS.y; vSz = aS.x;
  gl_PointSize = clamp(aS.x * uPx / max(gl_Position.w, 0.15), 2.0, uMax);
}`,me=`#version 300 es
precision mediump float;
in vec3 vC; in float vK; in float vSz; out vec4 o; uniform float uT;
void main(){
  vec2 p = (gl_PointCoord - 0.5) * 2.0; float r = length(p);
  if (r > 1.0) discard;
  float core = exp(-r * r * 26.0), halo = exp(-r * 5.0) * 0.32;
  float spikes = (exp(-abs(p.x) * 30.0) * exp(-abs(p.y) * 2.6) + exp(-abs(p.y) * 30.0) * exp(-abs(p.x) * 2.6)) * 0.55;
  vec3 col;
  if (vK < 0.5) { col = vC * (core * 2.4 + halo + spikes) + vec3(core * 0.8); }
  else if (vK < 1.5) { // alert flare: expanding double ring + pulsing core
    float ph = fract(uT * 0.55), ph2 = fract(uT * 0.55 + 0.5);
    float ring = exp(-pow((r - ph * 0.92) * 11.0, 2.0)) * (1.0 - ph) + exp(-pow((r - ph2 * 0.92) * 11.0, 2.0)) * (1.0 - ph2);
    float pulse = 0.75 + 0.25 * sin(uT * 6.0);
    col = vC * (core * 2.8 * pulse + halo * 1.6 + spikes * 1.4 + ring * 1.1) + vec3(core * 0.7);
  } else { col = vC * (core * 1.3 + halo * 1.2); }
  o = vec4(col, 1.0);
}`,pe=`#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
void main(){
  vec3 c = texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, -1.0)).rgb
         + texture(uTex, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25; float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(0.30, 0.95, l), 1.0);
}`,de=`#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 c = texture(uTex, vUv).rgb * 0.2270;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0703;
  o = vec4(c, 1.0);
}`,ve=`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform sampler2D uScene, uBloom; uniform float uT, uBloomAmt, uAbe;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5; float rr = dot(c, c);
  vec2 off = c * rr * uAbe;
  vec3 s = vec3(texture(uScene, vUv - off).r, texture(uScene, vUv).g, texture(uScene, vUv + off).b);
  vec3 b = texture(uBloom, vUv).rgb;
  vec3 col = s + b * uBloomAmt;
  col = 1.0 - exp(-col * 1.35);
  col *= 1.0 - smoothstep(0.18, 0.62, rr) * 0.7;
  col += (h(vUv * 900.0 + uT) - 0.5) * 0.018;
  o = vec4(col, 1.0);
}`;function he(r){let s=new Float32Array(r*4),x=new Float32Array(r*2);for(let c=0;c<r;c++){let u=b()<.14,h=Math.floor(b()*4),m,M,I;u?(m=Math.pow(b(),1.7)*.34,M=b()*6.2832,I=wt()*.075*(1-m)):(m=.08+Math.pow(b(),.82)*.92,M=h*Math.PI/2+m*Rt+wt()*(.05+.28*(1-m)*(1-m)+.07*m),I=wt()*.028*(1.15-m)),s[c*4]=m,s[c*4+1]=M,s[c*4+2]=I,s[c*4+3]=b(),x[c*2]=h,x[c*2+1]=5+b()*b()*22}return{A:s,B:x}}function xe(){let r=[];return H.forEach((s,x)=>{let c=s.agents.length;s.agents.forEach((u,h)=>{let m=.2+.7*(h+.5)/c,M=x*Math.PI/2+m*Rt+(h%2?.07:-.07);r.push({name:u,host:s.name,hostIdx:x,r:m,th:M,y:(h*37%7-3)*.006,col:s.col,alert:0,alertText:""})})}),r}var ut=(r,s)=>{let x=r.th+s*.05;return[Math.cos(x)*r.r,r.y,Math.sin(x)*r.r]};function ge(){let r=document.getElementById("galaxy-canvas"),s=document.getElementById("galaxy-stage");if(!r||!s)return;let x=document.getElementById("galaxy-list"),c=document.getElementById("galaxy-card"),u=document.getElementById("galaxy-feed-state"),h=document.getElementById("galaxy-reset"),m=document.getElementById("galaxy-labels"),M=document.getElementById("galaxy-fallback"),I=xe(),o=null,O=new Map,T=null,w=null,mt=new Map;x&&H.forEach(e=>{let n=document.createElement("div");n.className="galaxy-group";let i=document.createElement("h2");i.textContent=e.name,n.appendChild(i),I.filter(f=>f.host===e.name).forEach(f=>{let p=document.createElement("button");p.type="button",p.className="galaxy-pick",p.dataset.host=e.id,p.textContent=f.name;let d=document.createElement("span");d.className="galaxy-tag",p.appendChild(d),p.addEventListener("click",()=>G(f)),n.appendChild(p),mt.set(f.name,p)}),x.appendChild(n)}),I.forEach(e=>O.set(e.name.toLowerCase(),e));function Pt(e){return`${e.name} \xB7 ${e.host} host`+(e.alertText?` \xB7 ${e.alertText}`:" \xB7 no open alerts")}function G(e){T=e,c&&(c.textContent=e?Pt(e):"Nothing selected."),mt.forEach((n,i)=>n.setAttribute("aria-pressed",String(!!e&&e.name===i))),e&&o&&(o.fly=1),R=!0}h?.addEventListener("click",()=>{G(null),o&&(o.fly=0,o.flyHome=!0,o.vy=0,o.vp=0)}),document.addEventListener("keydown",e=>{e.key==="Escape"&&(G(null),o&&(o.flyHome=!0))});let pt=0;function dt(e=""){if(!u)return;if(!pt){u.dataset.state=e?"error":"loading",u.textContent=e?`Alert feed unavailable \xB7 ${e}`:"Alert feed \xB7 connecting";return}let n=Math.max(0,Math.floor((Date.now()-pt)/1e3)),i=n>90?"stale":e?"error":"ok";u.dataset.state=i;let f=n<60?`${n}s ago`:`${Math.floor(n/60)}m ago`;u.textContent=`Alert feed \xB7 ${i==="ok"?"updated":i==="stale"?"stale":"refresh failed"} ${f}${e?` \xB7 ${e}`:""}`}async function Ft(){try{let e=new AbortController,n=setTimeout(()=>e.abort(),8e3),i;try{i=await fetch("/api/fleet/alerts",{cache:"no-store",signal:e.signal})}finally{clearTimeout(n)}if(!i.ok)throw new Error(`HTTP ${i.status}`);let f=await i.json();pt=Date.now(),I.forEach(d=>{d.alert=0,d.alertText=""});let p=0;for(let d of f.alerts||[]){let A=O.get(String(d.agent||"").toLowerCase());if(!A)continue;let y=d.sev==="crit"?2:d.sev==="warn"?1:0;y>A.alert&&(A.alert=y,A.alertText=`${d.sev}: ${String(d.text||"").replace(/^AM /,"").slice(0,90)}`),y===2&&(p=1)}vt=p,mt.forEach((d,A)=>{let y=O.get(A.toLowerCase());d.firstChild&&(d.querySelector(".galaxy-tag").textContent=y.alert?y.alert===2?" crit":" warn":""),d.dataset.alert=String(y.alert)}),T&&c&&(c.textContent=Pt(T)),dt(),R=!0}catch(e){dt(String(e?.message||"network error").slice(0,50))}}let vt=0,R=!0;Ft(),setInterval(()=>{document.hidden||Ft()},3e4),setInterval(()=>dt(),1e4);let t=null;try{t=r.getContext("webgl2",{antialias:!1,alpha:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1})}catch{t=null}if(!t){M&&(M.hidden=!1),s.dataset.mode="list";return}s.dataset.mode="webgl";let Q=Math.min(innerWidth,innerHeight)<700||Gt?.(),z=Q?16e3:64e3,_;try{_={neb:V(t,ft,ce,"nebula"),part:V(t,le,fe,"stars"),spr:V(t,ue,me,"sprites"),bright:V(t,ft,pe,"bright"),blur:V(t,ft,de,"blur"),comp:V(t,ft,ve,"composite")}}catch(e){console.warn("galaxy shaders",e),M&&(M.hidden=!1),s.dataset.mode="list";return}let Wt={},v=(e,n)=>(Wt[e]||={})[n]??=t.getUniformLocation(_[e],n),Kt=Math.min(t.getParameter(t.ALIASED_POINT_SIZE_RANGE)[1]||64,220),{A:Ct,B:jt}=he(z),ht=(e,n=t.STATIC_DRAW)=>{let i=t.createBuffer();return t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,e,n),i},Ut=t.createVertexArray();t.bindVertexArray(Ut);let Zt=ht(Ct),Jt=ht(jt),$=(e,n)=>t.getAttribLocation(_[e],n);t.bindBuffer(t.ARRAY_BUFFER,Zt),t.enableVertexAttribArray($("part","aA")),t.vertexAttribPointer($("part","aA"),4,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,Jt),t.enableVertexAttribArray($("part","aB")),t.vertexAttribPointer($("part","aB"),2,t.FLOAT,!1,0,0);let St=128,tt=8,U=new Float32Array(St*tt),Bt=t.createVertexArray();t.bindVertexArray(Bt);let Qt=ht(U,t.DYNAMIC_DRAW);[["aP",3,0],["aC",3,3],["aS",2,6]].forEach(([e,n,i])=>{let f=$("spr",e);t.enableVertexAttribArray(f),t.vertexAttribPointer(f,n,t.FLOAT,!1,tt*4,i*4)});let _t=t.createVertexArray(),xt=(e,n)=>{let i=t.createTexture();t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,n,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);let f=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,f),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,i,0),{tex:i,fb:f,w:e,h:n}},g=null,k=0,L=0,D=1,te=()=>{g&&(Object.values(g).forEach(e=>{t.deleteTexture(e.tex),t.deleteFramebuffer(e.fb)}),g=null)};function Y(){let e=Yt(Q?1.25:1.75)*D,n=Math.max(2,Math.round(s.clientWidth*e)),i=Math.max(2,Math.round(s.clientHeight*e));if(n===k&&i===L&&g)return;k=n,L=i,r.width=n,r.height=i,te();let f=p=>Math.max(2,Math.round(p));g={scene:xt(n,i),a:xt(f(n/4),f(i/4)),b:xt(f(n/4),f(i/4))},R=!0}o={yaw:.6,pitch:1.15,dist:6,tx:0,ty:0,tz:0,vy:0,vp:0,fly:0,flyHome:!1,intro:lt?1:0,last:0};let X={yaw:.6,pitch:.62,dist:2.15};lt&&(o.pitch=X.pitch,o.dist=X.dist);let P=new Map,q=0,N=!1,It=performance.now(),gt=()=>{It=performance.now(),R=!0};r.addEventListener("pointerdown",e=>{if(r.setPointerCapture?.(e.pointerId),P.set(e.pointerId,[e.clientX,e.clientY]),N=!0,o.vy=o.vp=0,P.size===2){let[n,i]=[...P.values()];q=Math.hypot(n[0]-i[0],n[1]-i[1])}W=[e.clientX,e.clientY],gt()});let W=null;r.addEventListener("pointermove",e=>{let n=r.getBoundingClientRect();if(F.x=e.clientX-n.left,F.y=e.clientY-n.top,F.in=!0,P.has(e.pointerId)){let i=P.get(e.pointerId),f=e.clientX-i[0],p=e.clientY-i[1];if(P.set(e.pointerId,[e.clientX,e.clientY]),P.size===2){let[d,A]=[...P.values()],y=Math.hypot(d[0]-A[0],d[1]-A[1]);q&&(o.dist=Math.min(4.8,Math.max(.7,o.dist*q/y))),q=y}else N&&(o.yaw-=f*.0052,o.pitch=Math.min(1.45,Math.max(-1.45,o.pitch+p*.0052)),o.vy=-f*.0052,o.vp=p*.0052,o.fly=0)}gt()});let Lt=e=>{if(P.delete(e.pointerId),P.size<2&&(q=0),P.size===0){if(N=!1,W&&Math.hypot(e.clientX-W[0],e.clientY-W[1])<5){let n=Dt();G(n),n||(o.flyHome=!0)}W=null}};r.addEventListener("pointerup",Lt),r.addEventListener("pointercancel",Lt),r.addEventListener("pointerleave",()=>{F.in=!1,w=null,r.style.cursor=""}),r.addEventListener("wheel",e=>{let n=Math.min(4.8,Math.max(.7,o.dist*Math.exp(e.deltaY*.0012)));n!==o.dist&&(o.dist=n,e.preventDefault(),gt())},{passive:!1});let F={x:0,y:0,in:!1},yt=(e,n)=>{let i=document.createElement("span");return i.className="galaxy-label "+e,i.textContent=n,m?.appendChild(i),i},et=H.map(e=>yt("is-host",e.name));et.forEach((e,n)=>{e.dataset.host=H[n].id});let K=yt("is-tip","");K.hidden=!0;let j=yt("is-sel","");j.hidden=!0;let nt=null,bt=[],ee=Array.from({length:3},()=>({p:[0,0,0],v:[0,0,0],life:0,wait:b()*6})),At=(e,n,i=0,f=-16)=>{let p=(n[0]*.5+.5)*s.clientWidth,d=(1-(n[1]*.5+.5))*s.clientHeight;e.style.transform=`translate(${p.toFixed(1)}px, ${d.toFixed(1)}px) translate(-50%, 0) translate(${i}px, ${f}px)`};function ot(e){let n=nt,i=e[0],f=e[1],p=e[2],d=n[0]*i+n[4]*f+n[8]*p+n[12],A=n[1]*i+n[5]*f+n[9]*p+n[13],y=n[3]*i+n[7]*f+n[11]*p+n[15];return y<=.05?null:[d/y,A/y,y]}function Dt(){let e=null,n=26;for(let i of bt){let f=(i.p[0]*.5+.5)*s.clientWidth,p=(1-(i.p[1]*.5+.5))*s.clientHeight,d=Math.hypot(f-F.x,p-F.y);d<n&&(n=d,e=i.a)}return e}let S=0,kt=0,Z=0,rt=0,Nt=performance.now(),at=0,it=0,Vt=new Float32Array(H.flatMap(e=>e.col));function ne(e){let n=Math.min(.1,(e-Nt)/1e3);Nt=e;let i=!lt&&!qt();if(i&&(S+=n),document.hidden)return;if(i&&(n>.034?(Z++,rt=0):n<.02&&(rt++,Z=Math.max(0,Z-1)),Z>40&&D>.5?(D=Math.max(.5,D*.8),Z=0,Y(),z>2e4&&(z=Math.round(z*.7))):rt>600&&D<1&&(D=Math.min(1,D*1.15),rt=0,Y())),o.intro<1){o.intro=Math.min(1,o.intro+n/3.4);let a=1-Math.pow(1-o.intro,3);o.dist=6+(X.dist-6)*a,o.pitch=1.15+(X.pitch-1.15)*a,o.yaw+=n*.12*(1-a),R=!0}N||(o.yaw+=o.vy,o.pitch=Math.min(1.45,Math.max(-1.45,o.pitch+o.vp)),o.vy*=.94,o.vp*=.94,Math.abs(o.vy)+Math.abs(o.vp)>1e-4&&(R=!0));let f=performance.now()-It>4e3;if(i&&f&&!T&&!N&&o.intro>=1&&(o.yaw+=n*.045),i&&f&&!N&&!T&&o.intro>=1&&F.in?(at+=((F.x/Math.max(1,k)-.5)*.22-at)*(1-Math.pow(.05,n)),it+=((.5-F.y/Math.max(1,L))*.16-it)*(1-Math.pow(.05,n))):(at*=Math.pow(.05,n),it*=Math.pow(.05,n)),T){let a=ut(T,S),l=1-Math.pow(.001,n);o.tx+=(a[0]-o.tx)*l,o.ty+=(a[1]-o.ty)*l,o.tz+=(a[2]-o.tz)*l,o.fly&&(o.dist+=(1.15-o.dist)*l,Math.abs(o.dist-1.15)<.02&&(o.fly=0)),R=!0}else{let a=1-Math.pow(.02,n);o.tx*=1-a,o.ty*=1-a,o.tz*=1-a,o.flyHome&&(o.dist+=(X.dist-o.dist)*a,Math.abs(o.dist-X.dist)<.02&&(o.flyHome=!1))}if(i&&(R=!0),!R)return;R=!1,Y();let p=k/L,d=[o.tx+at+o.dist*Math.cos(o.pitch)*Math.sin(o.yaw),o.ty+it+o.dist*Math.sin(o.pitch),o.tz+o.dist*Math.cos(o.pitch)*Math.cos(o.yaw)],A=ie(d,[o.tx,o.ty,o.tz],[0,1,0]);nt=se(ae(.9,p,.05,40),A.m);let y=0,Tt=(a,l,E,C)=>{let B=y++*tt;U[B]=a[0],U[B+1]=a[1],U[B+2]=a[2],U[B+3]=l[0],U[B+4]=l[1],U[B+5]=l[2],U[B+6]=E,U[B+7]=C};Tt([0,0,0],[1,.82,.55],340,2),bt=[];for(let a of I){let l=ut(a,S),E=T===a,C=w===a,B=a.alert===2?re:a.alert===1?oe:a.col;Tt(l,B,(a.alert?120:84)*(E?1.6:C?1.3:1),a.alert?1:0);let Ot=ot(l);Ot&&bt.push({a,p:Ot})}for(let a of ee){if(a.life<=0){if(!i||(a.wait-=n,a.wait>0))continue;let l=b()*6.28,E=1.6+b();a.p=[Math.cos(l)*E,(b()-.5)*.9,Math.sin(l)*E];let C=l+Math.PI+(b()-.5)*.9;a.v=[Math.cos(C)*.9,(b()-.5)*.12,Math.sin(C)*.9],a.life=3.2}i&&(a.life-=n,a.p[0]+=a.v[0]*n,a.p[1]+=a.v[1]*n,a.p[2]+=a.v[2]*n,a.life<=0&&(a.wait=2+b()*7));for(let l=0;l<14&&y<St;l++){let E=l*.05;Tt([a.p[0]-a.v[0]*E,a.p[1]-a.v[1]*E,a.p[2]-a.v[2]*E],[.7-l*.03,.85-l*.04,1-l*.05],l===0?24:15-l,2)}}if(t.bindBuffer(t.ARRAY_BUFFER,Qt),t.bufferSubData(t.ARRAY_BUFFER,0,U,0,y*tt),F.in&&!N){let a=Dt();a!==w&&(w=a,r.style.cursor=a?"pointer":"")}else F.in||(w=null);let Xt=L/900*1*(Q?1.1:1);t.bindFramebuffer(t.FRAMEBUFFER,g.scene.fb),t.viewport(0,0,k,L),t.disable(t.BLEND),t.useProgram(_.neb),t.bindVertexArray(_t),t.uniform3fv(v("neb","uF"),A.f),t.uniform3fv(v("neb","uR"),A.s),t.uniform3fv(v("neb","uU"),A.u),t.uniform1f(v("neb","uAsp"),p),t.uniform1f(v("neb","uT"),S),t.uniform1f(v("neb","uAlert"),vt),t.uniform3fv(v("neb","uCol[0]"),Vt),t.drawArrays(t.TRIANGLES,0,3),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE),t.useProgram(_.part),t.bindVertexArray(Ut),t.uniformMatrix4fv(v("part","uVP"),!1,nt),t.uniform1f(v("part","uT"),S),t.uniform1f(v("part","uPx"),Xt*1.35),t.uniform3fv(v("part","uCol[0]"),Vt),t.uniform1f(v("part","uGain"),Q?.4:.22),t.drawArrays(t.POINTS,0,Math.min(z,Ct.length/4)),t.useProgram(_.spr),t.bindVertexArray(Bt),t.uniformMatrix4fv(v("spr","uVP"),!1,nt),t.uniform1f(v("spr","uT"),S),t.uniform1f(v("spr","uPx"),Xt),t.uniform1f(v("spr","uMax"),Kt),t.drawArrays(t.POINTS,0,y),t.disable(t.BLEND),t.bindVertexArray(_t);let st=(a,l)=>{t.activeTexture(t.TEXTURE0+a),t.bindTexture(t.TEXTURE_2D,l.tex)};t.bindFramebuffer(t.FRAMEBUFFER,g.a.fb),t.viewport(0,0,g.a.w,g.a.h),t.useProgram(_.bright),st(0,g.scene),t.uniform1i(v("bright","uTex"),0),t.uniform2f(v("bright","uTexel"),1/k,1/L),t.drawArrays(t.TRIANGLES,0,3),t.useProgram(_.blur),t.uniform1i(v("blur","uTex"),0);let ct=(a,l,E,C)=>{t.bindFramebuffer(t.FRAMEBUFFER,l.fb),t.viewport(0,0,l.w,l.h),st(0,a),t.uniform2f(v("blur","uDir"),E/a.w,C/a.h),t.drawArrays(t.TRIANGLES,0,3)};ct(g.a,g.b,1,0),ct(g.b,g.a,0,1),ct(g.a,g.b,2.2,0),ct(g.b,g.a,0,2.2),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,k,L),t.useProgram(_.comp),st(0,g.scene),st(1,g.a),t.uniform1i(v("comp","uScene"),0),t.uniform1i(v("comp","uBloom"),1),t.uniform1f(v("comp","uT"),S%100),t.uniform1f(v("comp","uBloomAmt"),1.6+vt*.3),t.uniform1f(v("comp","uAbe"),.012),t.drawArrays(t.TRIANGLES,0,3),t.activeTexture(t.TEXTURE0),H.forEach((a,l)=>{let E=l*Math.PI/2+1*Rt+S*.05,C=ot([Math.cos(E)*1,.02,Math.sin(E)*1]);C?(et[l].hidden=!1,At(et[l],C,0,-8)):et[l].hidden=!0});let Ht=w&&w!==T;if(K.hidden=!Ht,Ht){K.textContent=w.name+(w.alert?" \xB7 "+(w.alert===2?"crit":"warn"):"");let a=ot(ut(w,S));a?At(K,a,0,14):K.hidden=!0}if(j.hidden=!T,T){j.textContent=T.name;let a=ot(ut(T,S));a?At(j,a,0,22):j.hidden=!0}++kt===2&&(document.documentElement.dataset.galaxy="ready",window.__galaxy={frames:()=>kt,particles:()=>z,quality:()=>D})}let zt=e=>{try{ne(e)}catch(n){console.warn("galaxy frame",n),s.dataset.mode="list",M&&(M.hidden=!1);return}requestAnimationFrame(zt)};new ResizeObserver(()=>{g&&Y(),R=!0}).observe(s),r.addEventListener("webglcontextlost",e=>{e.preventDefault(),s.dataset.mode="list"}),Y(),requestAnimationFrame(zt);let Et=new URLSearchParams(location.search).get("focus");Et&&O.get(Et.toLowerCase())&&G(O.get(Et.toLowerCase()))}try{ge()}catch(r){console.warn("galaxy init",r)}
//# sourceMappingURL=galaxy-DKRLVLYX.js.map
