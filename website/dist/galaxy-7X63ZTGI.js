import{a as V,b as qt,c as Wt}from"./chunks/chunk-PA37XBAA.js";import{T as $t,V as Yt,a as ft}from"./chunks/chunk-Z2GG5H3P.js";import{b as Gt}from"./chunks/chunk-54MPTCD7.js";Yt();var H=[{id:"tidal",name:"Tidal",col:[.3,.8,1],agents:["Tidal","River","Creek","Stream","Meadow","Brook","Mist"]},{id:"beacon",name:"Beacon",col:[1,.78,.3],agents:["Beacon","Highbeam","Lantern","Lightning","Radar","Prism","Pulsar"]},{id:"mountain",name:"Mountain",col:[.72,.52,1],agents:["Mountain","Canyon","Ridge","Harbor","Delta","Mesa","Vista"]},{id:"gale",name:"Gale",col:[.28,.62,1],agents:["Gale","Zephyr","Squall","Tempest","Vortex","Chinook","Cyclone","Maistral","Sirocco","Bora","Tramontane","Ostro","Poniente","Levante"]}],re=[1,.72,.2],ae=[1,.24,.22],Rt=3.3,Q={sub:(a,s)=>[a[0]-s[0],a[1]-s[1],a[2]-s[2]],cross:(a,s)=>[a[1]*s[2]-a[2]*s[1],a[2]*s[0]-a[0]*s[2],a[0]*s[1]-a[1]*s[0]],norm:a=>{let s=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/s,a[1]/s,a[2]/s]}};function ie(a,s,g,c){let u=1/Math.tan(a/2),x=new Float32Array(16);return x[0]=u/s,x[5]=u,x[10]=(c+g)/(g-c),x[11]=-1,x[14]=2*c*g/(g-c),x}function se(a,s,g){let c=Q.norm(Q.sub(s,a)),u=Q.norm(Q.cross(c,g)),x=Q.cross(u,c),m=new Float32Array(16);return m[0]=u[0],m[4]=u[1],m[8]=u[2],m[1]=x[0],m[5]=x[1],m[9]=x[2],m[2]=-c[0],m[6]=-c[1],m[10]=-c[2],m[12]=-(u[0]*a[0]+u[1]*a[1]+u[2]*a[2]),m[13]=-(x[0]*a[0]+x[1]*a[1]+x[2]*a[2]),m[14]=c[0]*a[0]+c[1]*a[1]+c[2]*a[2],m[15]=1,{m,f:c,s:u,u:x}}function ce(a,s){let g=new Float32Array(16);for(let c=0;c<4;c++)for(let u=0;u<4;u++)g[c*4+u]=a[u]*s[c*4]+a[4+u]*s[c*4+1]+a[8+u]*s[c*4+2]+a[12+u]*s[c*4+3];return g}var wt=1337,b=()=>(wt=wt*1664525+1013904223>>>0,wt/4294967296),Mt=()=>(b()+b()+b()+b()-2)*.8660254,ut=`#version 300 es
precision highp float;
out vec2 vUv;
void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,le=`#version 300 es
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
}`,fe=`#version 300 es
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
}`,ue=`#version 300 es
precision mediump float;
in vec3 vC; out vec4 o; uniform float uGain;
void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d * d * 4.5) * step(d, 1.0); o = vec4(vC * a * uGain, a); }`,me=`#version 300 es
precision highp float;
in vec3 aP; in vec3 aC; in vec2 aS; // aS = size, kind
uniform mat4 uVP; uniform float uPx, uMax;
out vec3 vC; out float vK; out float vSz;
void main(){
  gl_Position = uVP * vec4(aP, 1.0);
  vC = aC; vK = aS.y; vSz = aS.x;
  gl_PointSize = clamp(aS.x * uPx / max(gl_Position.w, 0.15), 2.0, uMax);
}`,pe=`#version 300 es
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
}`,de=`#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
void main(){
  vec3 c = texture(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, -1.0)).rgb
         + texture(uTex, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uTex, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25; float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(0.30, 0.95, l), 1.0);
}`,ve=`#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec3 c = texture(uTex, vUv).rgb * 0.2270;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0703;
  o = vec4(c, 1.0);
}`,he=`#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform sampler2D uScene, uBloom, uNeb; uniform float uT, uBloomAmt, uAbe;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5; float rr = dot(c, c);
  vec2 off = c * rr * uAbe;
  vec3 s = vec3(texture(uScene, vUv - off).r, texture(uScene, vUv).g, texture(uScene, vUv + off).b);
  vec3 b = texture(uBloom, vUv).rgb;
  vec3 n = texture(uNeb, vUv).rgb;
  vec3 col = s + b * uBloomAmt + n;
  col = 1.0 - exp(-col * 1.35);
  col *= 1.0 - smoothstep(0.18, 0.62, rr) * 0.7;
  col += (h(vUv * 900.0 + uT) - 0.5) * 0.018;
  o = vec4(col, 1.0);
}`;function xe(a){let s=new Float32Array(a*4),g=new Float32Array(a*2);for(let c=0;c<a;c++){let u=b()<.14,x=Math.floor(b()*4),m,w,I;u?(m=Math.pow(b(),1.7)*.34,w=b()*6.2832,I=Mt()*.075*(1-m)):(m=.08+Math.pow(b(),.82)*.92,w=x*Math.PI/2+m*Rt+Mt()*(.05+.28*(1-m)*(1-m)+.07*m),I=Mt()*.028*(1.15-m)),s[c*4]=m,s[c*4+1]=w,s[c*4+2]=I,s[c*4+3]=b(),g[c*2]=x,g[c*2+1]=5+b()*b()*22}return{A:s,B:g}}function ge(){let a=[];return H.forEach((s,g)=>{let c=s.agents.length;s.agents.forEach((u,x)=>{let m=.2+.7*(x+.5)/c,w=g*Math.PI/2+m*Rt+(x%2?.07:-.07);a.push({name:u,host:s.name,hostIdx:g,r:m,th:w,y:(x*37%7-3)*.006,col:s.col,alert:0,alertText:""})})}),a}var mt=(a,s)=>{let g=a.th+s*.05;return[Math.cos(g)*a.r,a.y,Math.sin(g)*a.r]};function ye(){let a=document.getElementById("galaxy-canvas"),s=document.getElementById("galaxy-stage");if(!a||!s)return;let g=document.getElementById("galaxy-list"),c=document.getElementById("galaxy-card"),u=document.getElementById("galaxy-feed-state"),x=document.getElementById("galaxy-reset"),m=document.getElementById("galaxy-labels"),w=document.getElementById("galaxy-fallback"),I=ge(),o=null,O=new Map,T=null,M=null,pt=new Map;g&&H.forEach(e=>{let n=document.createElement("div");n.className="galaxy-group";let i=document.createElement("h2");i.textContent=e.name,n.appendChild(i),I.filter(l=>l.host===e.name).forEach(l=>{let p=document.createElement("button");p.type="button",p.className="galaxy-pick",p.dataset.host=e.id,p.textContent=l.name;let d=document.createElement("span");d.className="galaxy-tag",p.appendChild(d),p.addEventListener("click",()=>G(l)),n.appendChild(p),pt.set(l.name,p)}),g.appendChild(n)}),I.forEach(e=>O.set(e.name.toLowerCase(),e));function Pt(e){return`${e.name} \xB7 ${e.host} host`+(e.alertText?` \xB7 ${e.alertText}`:" \xB7 no open alerts")}function G(e){T=e,c&&(c.textContent=e?Pt(e):"Nothing selected."),pt.forEach((n,i)=>n.setAttribute("aria-pressed",String(!!e&&e.name===i))),e&&o&&(o.fly=1),R=!0}x?.addEventListener("click",()=>{G(null),o&&(o.fly=0,o.flyHome=!0,o.vy=0,o.vp=0)}),document.addEventListener("keydown",e=>{e.key==="Escape"&&(G(null),o&&(o.flyHome=!0))});let dt=0;function vt(e=""){if(!u)return;if(!dt){u.dataset.state=e?"error":"loading",u.textContent=e?`Alert feed unavailable \xB7 ${e}`:"Alert feed \xB7 connecting";return}let n=Math.max(0,Math.floor((Date.now()-dt)/1e3)),i=n>90?"stale":e?"error":"ok";u.dataset.state=i;let l=n<60?`${n}s ago`:`${Math.floor(n/60)}m ago`;u.textContent=`Alert feed \xB7 ${i==="ok"?"updated":i==="stale"?"stale":"refresh failed"} ${l}${e?` \xB7 ${e}`:""}`}async function Ft(){try{let e=new AbortController,n=setTimeout(()=>e.abort(),8e3),i;try{i=await fetch("/api/fleet/alerts",{cache:"no-store",signal:e.signal})}finally{clearTimeout(n)}if(!i.ok)throw new Error(`HTTP ${i.status}`);let l=await i.json();dt=Date.now(),I.forEach(d=>{d.alert=0,d.alertText=""});let p=0;for(let d of Gt(l.alerts)){let E=O.get(String(d.agent||"").toLowerCase());if(!E)continue;let y=d.sev==="crit"?2:d.sev==="warn"?1:0;y>E.alert&&(E.alert=y,E.alertText=`${d.sev}: ${String(d.text||"").replace(/^AM /,"").slice(0,90)}`),y===2&&(p=1)}ht=p,pt.forEach((d,E)=>{let y=O.get(E.toLowerCase());d.firstChild&&(d.querySelector(".galaxy-tag").textContent=y.alert?y.alert===2?" crit":" warn":""),d.dataset.alert=String(y.alert)}),T&&c&&(c.textContent=Pt(T)),vt(),R=!0}catch(e){vt(String(e?.message||"network error").slice(0,50))}}let ht=0,R=!0;Ft(),setInterval(()=>{document.hidden||Ft()},3e4),setInterval(()=>vt(),1e4);let t=null;try{t=a.getContext("webgl2",{antialias:!1,alpha:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1})}catch{t=null}if(!t){w&&(w.hidden=!1),s.dataset.mode="list";return}s.dataset.mode="webgl";let tt=Math.min(innerWidth,innerHeight)<700||$t?.(),z=tt?16e3:64e3,_;try{_={neb:V(t,ut,le,"nebula"),part:V(t,fe,ue,"stars"),spr:V(t,me,pe,"sprites"),bright:V(t,ut,de,"bright"),blur:V(t,ut,ve,"blur"),comp:V(t,ut,he,"composite")}}catch(e){console.warn("galaxy shaders",e),w&&(w.hidden=!1),s.dataset.mode="list";return}let Kt={},v=(e,n)=>(Kt[e]||={})[n]??=t.getUniformLocation(_[e],n),jt=Math.min(t.getParameter(t.ALIASED_POINT_SIZE_RANGE)[1]||64,220),{A:Ct,B:Zt}=xe(z),xt=(e,n=t.STATIC_DRAW)=>{let i=t.createBuffer();return t.bindBuffer(t.ARRAY_BUFFER,i),t.bufferData(t.ARRAY_BUFFER,e,n),i},Ut=t.createVertexArray();t.bindVertexArray(Ut);let Jt=xt(Ct),Qt=xt(Zt),$=(e,n)=>t.getAttribLocation(_[e],n);t.bindBuffer(t.ARRAY_BUFFER,Jt),t.enableVertexAttribArray($("part","aA")),t.vertexAttribPointer($("part","aA"),4,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,Qt),t.enableVertexAttribArray($("part","aB")),t.vertexAttribPointer($("part","aB"),2,t.FLOAT,!1,0,0);let Bt=128,et=8,U=new Float32Array(Bt*et),St=t.createVertexArray();t.bindVertexArray(St);let te=xt(U,t.DYNAMIC_DRAW);[["aP",3,0],["aC",3,3],["aS",2,6]].forEach(([e,n,i])=>{let l=$("spr",e);t.enableVertexAttribArray(l),t.vertexAttribPointer(l,n,t.FLOAT,!1,et*4,i*4)});let _t=t.createVertexArray(),nt=(e,n)=>{let i=t.createTexture();t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,n,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);let l=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,l),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,i,0),{tex:i,fb:l,w:e,h:n}},h=null,N=0,L=0,D=1,ee=()=>{h&&(Object.values(h).forEach(e=>{t.deleteTexture(e.tex),t.deleteFramebuffer(e.fb)}),h=null)};function Y(){let e=qt(tt?1.25:1.75)*D,n=Math.max(2,Math.round(s.clientWidth*e)),i=Math.max(2,Math.round(s.clientHeight*e));if(n===N&&i===L&&h)return;N=n,L=i,a.width=n,a.height=i,ee();let l=p=>Math.max(2,Math.round(p));h={scene:nt(n,i),a:nt(l(n/4),l(i/4)),b:nt(l(n/4),l(i/4)),c:nt(l(n/4),l(i/4))},R=!0}o={yaw:.6,pitch:1.15,dist:6,tx:0,ty:0,tz:0,vy:0,vp:0,fly:0,flyHome:!1,intro:ft?1:0,last:0};let X={yaw:.6,pitch:.62,dist:2.15};ft&&(o.pitch=X.pitch,o.dist=X.dist);let P=new Map,q=0,k=!1,It=performance.now(),gt=()=>{It=performance.now(),R=!0};a.addEventListener("pointerdown",e=>{if(a.setPointerCapture?.(e.pointerId),P.set(e.pointerId,[e.clientX,e.clientY]),k=!0,o.vy=o.vp=0,P.size===2){let[n,i]=[...P.values()];q=Math.hypot(n[0]-i[0],n[1]-i[1])}W=[e.clientX,e.clientY],gt()});let W=null;a.addEventListener("pointermove",e=>{let n=a.getBoundingClientRect();if(F.x=e.clientX-n.left,F.y=e.clientY-n.top,F.in=!0,P.has(e.pointerId)){let i=P.get(e.pointerId),l=e.clientX-i[0],p=e.clientY-i[1];if(P.set(e.pointerId,[e.clientX,e.clientY]),P.size===2){let[d,E]=[...P.values()],y=Math.hypot(d[0]-E[0],d[1]-E[1]);q&&(o.dist=Math.min(4.8,Math.max(.7,o.dist*q/y))),q=y}else k&&(o.yaw-=l*.0052,o.pitch=Math.min(1.45,Math.max(-1.45,o.pitch+p*.0052)),o.vy=-l*.0052,o.vp=p*.0052,o.fly=0)}gt()});let Lt=e=>{if(P.delete(e.pointerId),P.size<2&&(q=0),P.size===0){if(k=!1,W&&Math.hypot(e.clientX-W[0],e.clientY-W[1])<5){let n=Dt();G(n),n||(o.flyHome=!0)}W=null}};a.addEventListener("pointerup",Lt),a.addEventListener("pointercancel",Lt),a.addEventListener("pointerleave",()=>{F.in=!1,M=null,a.style.cursor=""}),a.addEventListener("wheel",e=>{let n=Math.min(4.8,Math.max(.7,o.dist*Math.exp(e.deltaY*.0012)));n!==o.dist&&(o.dist=n,e.preventDefault(),gt())},{passive:!1});let F={x:0,y:0,in:!1},yt=(e,n)=>{let i=document.createElement("span");return i.className="galaxy-label "+e,i.textContent=n,m?.appendChild(i),i},ot=H.map(e=>yt("is-host",e.name));ot.forEach((e,n)=>{e.dataset.host=H[n].id});let K=yt("is-tip","");K.hidden=!0;let j=yt("is-sel","");j.hidden=!0;let rt=null,bt=[],ne=Array.from({length:3},()=>({p:[0,0,0],v:[0,0,0],life:0,wait:b()*6})),Et=(e,n,i=0,l=-16)=>{let p=(n[0]*.5+.5)*s.clientWidth,d=(1-(n[1]*.5+.5))*s.clientHeight;e.style.transform=`translate(${p.toFixed(1)}px, ${d.toFixed(1)}px) translate(-50%, 0) translate(${i}px, ${l}px)`};function at(e){let n=rt,i=e[0],l=e[1],p=e[2],d=n[0]*i+n[4]*l+n[8]*p+n[12],E=n[1]*i+n[5]*l+n[9]*p+n[13],y=n[3]*i+n[7]*l+n[11]*p+n[15];return y<=.05?null:[d/y,E/y,y]}function Dt(){let e=null,n=26;for(let i of bt){let l=(i.p[0]*.5+.5)*s.clientWidth,p=(1-(i.p[1]*.5+.5))*s.clientHeight,d=Math.hypot(l-F.x,p-F.y);d<n&&(n=d,e=i.a)}return e}let B=0,Nt=0,Z=0,it=0,kt=performance.now(),st=0,ct=0,Vt=new Float32Array(H.flatMap(e=>e.col));function oe(e){let n=Math.min(.1,(e-kt)/1e3);kt=e;let i=!ft&&!Wt();if(i&&(B+=n),document.hidden)return;if(i&&(n>.034?(Z++,it=0):n<.02&&(it++,Z=Math.max(0,Z-1)),Z>40&&D>.5?(D=Math.max(.5,D*.8),Z=0,Y(),z>2e4&&(z=Math.round(z*.7))):it>600&&D<1&&(D=Math.min(1,D*1.15),it=0,Y())),o.intro<1){o.intro=Math.min(1,o.intro+n/3.4);let r=1-Math.pow(1-o.intro,3);o.dist=6+(X.dist-6)*r,o.pitch=1.15+(X.pitch-1.15)*r,o.yaw+=n*.12*(1-r),R=!0}if(!k){o.yaw+=o.vy,o.pitch=Math.min(1.45,Math.max(-1.45,o.pitch+o.vp));let r=Math.pow(.94,n*60);o.vy*=r,o.vp*=r,Math.abs(o.vy)+Math.abs(o.vp)>1e-4&&(R=!0)}let l=performance.now()-It>4e3;if(i&&l&&!T&&!k&&o.intro>=1&&(o.yaw+=n*.045),i&&l&&!k&&!T&&o.intro>=1&&F.in?(st+=((F.x/Math.max(1,N)-.5)*.22-st)*(1-Math.pow(.05,n)),ct+=((.5-F.y/Math.max(1,L))*.16-ct)*(1-Math.pow(.05,n))):(st*=Math.pow(.05,n),ct*=Math.pow(.05,n)),T){let r=mt(T,B),f=1-Math.pow(.001,n);o.tx+=(r[0]-o.tx)*f,o.ty+=(r[1]-o.ty)*f,o.tz+=(r[2]-o.tz)*f,o.fly&&(o.dist+=(1.15-o.dist)*f,Math.abs(o.dist-1.15)<.02&&(o.fly=0)),R=!0}else{let r=1-Math.pow(.02,n);o.tx*=1-r,o.ty*=1-r,o.tz*=1-r,o.flyHome&&(o.dist+=(X.dist-o.dist)*r,Math.abs(o.dist-X.dist)<.02&&(o.flyHome=!1))}if(i&&(R=!0),!R)return;R=!1,Y();let p=N/L,d=[o.tx+st+o.dist*Math.cos(o.pitch)*Math.sin(o.yaw),o.ty+ct+o.dist*Math.sin(o.pitch),o.tz+o.dist*Math.cos(o.pitch)*Math.cos(o.yaw)],E=se(d,[o.tx,o.ty,o.tz],[0,1,0]);rt=ce(ie(.9,p,.05,40),E.m);let y=0,Tt=(r,f,A,C)=>{let S=y++*et;U[S]=r[0],U[S+1]=r[1],U[S+2]=r[2],U[S+3]=f[0],U[S+4]=f[1],U[S+5]=f[2],U[S+6]=A,U[S+7]=C};Tt([0,0,0],[1,.82,.55],340,2),bt=[];for(let r of I){let f=mt(r,B),A=T===r,C=M===r,S=r.alert===2?ae:r.alert===1?re:r.col;Tt(f,S,(r.alert?120:84)*(A?1.6:C?1.3:1),r.alert?1:0);let Ot=at(f);Ot&&bt.push({a:r,p:Ot})}for(let r of ne){if(r.life<=0){if(!i||(r.wait-=n,r.wait>0))continue;let f=b()*6.28,A=1.6+b();r.p=[Math.cos(f)*A,(b()-.5)*.9,Math.sin(f)*A];let C=f+Math.PI+(b()-.5)*.9;r.v=[Math.cos(C)*.9,(b()-.5)*.12,Math.sin(C)*.9],r.life=3.2}i&&(r.life-=n,r.p[0]+=r.v[0]*n,r.p[1]+=r.v[1]*n,r.p[2]+=r.v[2]*n,r.life<=0&&(r.wait=2+b()*7));for(let f=0;f<14&&y<Bt;f++){let A=f*.05;Tt([r.p[0]-r.v[0]*A,r.p[1]-r.v[1]*A,r.p[2]-r.v[2]*A],[.7-f*.03,.85-f*.04,1-f*.05],f===0?24:15-f,2)}}if(t.bindBuffer(t.ARRAY_BUFFER,te),t.bufferSubData(t.ARRAY_BUFFER,0,U,0,y*et),F.in&&!k){let r=Dt();r!==M&&(M=r,a.style.cursor=r?"pointer":"")}else F.in||(M=null);let Xt=L/900*1*(tt?1.1:1);t.bindFramebuffer(t.FRAMEBUFFER,h.b.fb),t.viewport(0,0,h.b.w,h.b.h),t.disable(t.BLEND),t.useProgram(_.neb),t.bindVertexArray(_t),t.uniform3fv(v("neb","uF"),E.f),t.uniform3fv(v("neb","uR"),E.s),t.uniform3fv(v("neb","uU"),E.u),t.uniform1f(v("neb","uAsp"),p),t.uniform1f(v("neb","uT"),B),t.uniform1f(v("neb","uAlert"),ht),t.uniform3fv(v("neb","uCol[0]"),Vt),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,h.scene.fb),t.viewport(0,0,N,L),t.disable(t.BLEND),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE),t.useProgram(_.part),t.bindVertexArray(Ut),t.uniformMatrix4fv(v("part","uVP"),!1,rt),t.uniform1f(v("part","uT"),B),t.uniform1f(v("part","uPx"),Xt*1.35),t.uniform3fv(v("part","uCol[0]"),Vt),t.uniform1f(v("part","uGain"),tt?.4:.22),t.drawArrays(t.POINTS,0,Math.min(z,Ct.length/4)),t.useProgram(_.spr),t.bindVertexArray(St),t.uniformMatrix4fv(v("spr","uVP"),!1,rt),t.uniform1f(v("spr","uT"),B),t.uniform1f(v("spr","uPx"),Xt),t.uniform1f(v("spr","uMax"),jt),t.drawArrays(t.POINTS,0,y),t.disable(t.BLEND),t.bindVertexArray(_t);let J=(r,f)=>{t.activeTexture(t.TEXTURE0+r),t.bindTexture(t.TEXTURE_2D,f.tex)};t.bindFramebuffer(t.FRAMEBUFFER,h.a.fb),t.viewport(0,0,h.a.w,h.a.h),t.useProgram(_.bright),J(0,h.scene),t.uniform1i(v("bright","uTex"),0),t.uniform2f(v("bright","uTexel"),1/N,1/L),t.drawArrays(t.TRIANGLES,0,3),t.useProgram(_.blur),t.uniform1i(v("blur","uTex"),0);let lt=(r,f,A,C)=>{t.bindFramebuffer(t.FRAMEBUFFER,f.fb),t.viewport(0,0,f.w,f.h),J(0,r),t.uniform2f(v("blur","uDir"),A/r.w,C/r.h),t.drawArrays(t.TRIANGLES,0,3)};lt(h.a,h.c,1,0),lt(h.c,h.a,0,1),lt(h.a,h.c,2.2,0),lt(h.c,h.a,0,2.2),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,N,L),t.useProgram(_.comp),J(0,h.scene),J(1,h.a),J(2,h.b),t.uniform1i(v("comp","uScene"),0),t.uniform1i(v("comp","uBloom"),1),t.uniform1i(v("comp","uNeb"),2),t.uniform1f(v("comp","uT"),B%100),t.uniform1f(v("comp","uBloomAmt"),1.6+ht*.3),t.uniform1f(v("comp","uAbe"),.012),t.drawArrays(t.TRIANGLES,0,3),t.activeTexture(t.TEXTURE0),H.forEach((r,f)=>{let A=f*Math.PI/2+1*Rt+B*.05,C=at([Math.cos(A)*1,.02,Math.sin(A)*1]);C?(ot[f].hidden=!1,Et(ot[f],C,0,-8)):ot[f].hidden=!0});let Ht=M&&M!==T;if(K.hidden=!Ht,Ht){K.textContent=M.name+(M.alert?" \xB7 "+(M.alert===2?"crit":"warn"):"");let r=at(mt(M,B));r?Et(K,r,0,14):K.hidden=!0}if(j.hidden=!T,T){j.textContent=T.name;let r=at(mt(T,B));r?Et(j,r,0,22):j.hidden=!0}++Nt===2&&(document.documentElement.dataset.galaxy="ready",window.__galaxy={frames:()=>Nt,particles:()=>z,quality:()=>D})}let zt=e=>{try{oe(e)}catch(n){console.warn("galaxy frame",n),s.dataset.mode="list",w&&(w.hidden=!1);return}requestAnimationFrame(zt)};new ResizeObserver(()=>{h&&Y(),R=!0}).observe(s),a.addEventListener("webglcontextlost",e=>{e.preventDefault(),s.dataset.mode="list"}),Y(),requestAnimationFrame(zt);let At=new URLSearchParams(location.search).get("focus");At&&O.get(At.toLowerCase())&&G(O.get(At.toLowerCase()))}try{ye()}catch(a){console.warn("galaxy init",a)}
//# sourceMappingURL=galaxy-7X63ZTGI.js.map
