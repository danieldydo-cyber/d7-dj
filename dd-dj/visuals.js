/* DD DJ 3.0 · Space X Visuals Engine (Grok X Visuals) — WebGL 3D shaders reactive to bass/mid/high + beat,
   12 scenes × 777 variants, 7 s / 13 s / magic / 2-beat / 4-beat transitions, custom image layer, resolution scaling. Original code. */
(function () {
  'use strict';
  var A = window.DDA;
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 R;uniform float T,B,M,H,P,E,SA,SB,X,VA,VB,TM,UI,IM;uniform sampler2D IMG;',
    'float h1(float n){return fract(sin(n)*43758.5453);}float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*nz(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'vec3 pal(float t,float s){return .5+.5*cos(6.2832*(vec3(1.,1.,1.)*t+vec3(h1(s),h1(s+1.3),h1(s+2.7))+vec3(0.,.33,.67)));}',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    // 0 tunnel warp
    'vec3 s0(vec2 p,float t,float v){float r=length(p),a=atan(p.y,p.x);float z=.35/(r+.02)+t*(1.2+B*2.5);float n=floor(3.+h1(v)*9.);float w=sin(a*n+z*2.+sin(z*.5)*2.)*.5+.5;float ring=smoothstep(.7,1.,sin(z*6.)*.5+.5);vec3 c=pal(z*.08+w*.2,v)*(w*.8+ring*(.6+P));return c*smoothstep(0.,.35,r)*(1.2+B);}',
    // 1 nebula
    'vec3 s1(vec2 p,float t,float v){p*=1.4+sin(t*.1)*.2;vec2 q=vec2(fbm(p+t*.05),fbm(p+vec2(5.2,1.3)-t*.04));float f=fbm(p+3.*q+B*.8);vec3 c=mix(pal(f+t*.02,v)*.2,pal(f*1.5+.3,v+4.),f*f*1.4);float st=step(.997,h2(floor(p*150.)))*(.5+H*2.);return c*(.8+M*1.2+P*.5)+st;}',
    // 2 cyber grid (synthwave 3D floor + sun)
    'vec3 s2(vec2 p,float t,float v){vec3 c=vec3(0.);if(p.y<-.05){float z=.6/(-p.y);vec2 g=vec2(p.x*z,z+t*(2.+B*4.));vec2 l=abs(fract(g)-.5);float line=smoothstep(.06*z*.15+.01,0.,min(l.x,l.y));c=pal(.8,v)*line*(1.5+P)/(z*.25+.5);c+=pal(.9,v)*.15*exp(-z*.3);}else{float d=length(p-vec2(0.,.35));float sun=smoothstep(.42,.4,d)*step(.0,sin((p.y-t*.05)*60.)+.6-p.y*2.2);c=mix(pal(.05,v),pal(.6,v),p.y*1.5)*sun*(1.+B);c+=pal(.7,v)*.25*exp(-d*3.)*(1.+P);c+=step(.996,h2(floor(p*200.)))*.8;}return c;}',
    // 3 raymarched spheres/tori
    'float map3(vec3 q,float t){q.xy*=rot(q.z*.1+t*.2);vec3 r=mod(q,4.)-2.;float s=length(r)-(.55+B*.35);vec2 tq=vec2(length(r.xz)-1.,r.y);float to=length(tq)-.12;return min(s,to);}',
    'vec3 s3(vec2 p,float t,float v){vec3 ro=vec3(0.,0.,t*(2.+B*3.)),rd=normalize(vec3(p,1.2));float d=0.,g=0.;for(int i=0;i<44;i++){float h=map3(ro+rd*d,t);g+=.02/(.05+abs(h));if(h<.002||d>30.)break;d+=h*.9;}vec3 c=pal(d*.05+t*.03,v)*g*.18*(1.+P);return c*exp(-d*.04)+pal(.5,v)*.05;}',
    // 4 sacred geometry (flower of life rotating)
    'vec3 s4(vec2 p,float t,float v){p*=rot(t*.1);float k=0.;float rr=.28+B*.06;for(int i=0;i<7;i++){float a=float(i)*1.0472;vec2 c=i==6?vec2(0.):vec2(cos(a),sin(a))*rr;k+=smoothstep(.012,0.,abs(length(p-c)-rr));}for(int j=0;j<6;j++){float a=float(j)*1.0472+.5236;k+=.6*smoothstep(.01,0.,abs(length(p-vec2(cos(a),sin(a))*rr*1.732)-rr));}float N=6.+floor(h1(v)*6.)*2.;float a=atan(p.y,p.x),r=length(p);float m=smoothstep(.02,0.,abs(sin(a*N*.5)*r-.02*sin(t+r*20.)));vec3 c=pal(r+t*.05,v)*(k*(1.+P)+m*.4)+pal(.3,v)*.08/(r+.2);return c*(1.+M);}',
    // 5 planet rings
    'vec3 s5(vec2 p,float t,float v){vec3 c=vec3(step(.995,h2(floor(p*180.)))*.7);vec2 q=p*rot(-.35);float pr=.42+B*.05;float d=length(q);if(d<pr){vec3 n=normalize(vec3(q,sqrt(pr*pr-d*d)));float l=max(dot(n,normalize(vec3(-.5,.4,.7))),0.);float band=fbm(vec2(n.y*8.,t*.1+n.x*2.));c=pal(band*.6+.1,v)*l*1.3+pal(.6,v)*.1;}vec2 e=q*vec2(1.,3.2);float rd=length(e);float ring=smoothstep(.04,0.,abs(rd-.75-sin(rd*80.)*.01))*(.3+.7*nz(vec2(rd*40.,0.)));if(!(d<pr&&q.y>0.))c+=pal(rd+.2,v)*ring*(1.+P+H);c+=pal(.7,v)*.25*exp(-abs(d-pr)*12.)*(1.+B);return c;}',
    // 6 laser dome
    'vec3 s6(vec2 p,float t,float v){vec3 c=vec3(0.);vec2 o=vec2(0.,-1.1);vec2 d=p-o;float a=atan(d.x,d.y);for(int i=0;i<12;i++){float fi=float(i);float ba=sin(t*(.4+h1(fi+v)*.8)+fi*1.7)*1.1;float w=.004+.012*P;float beam=w/abs(sin(a-ba)+.0001*0.)/(length(d)+.3);c+=pal(fi*.08+t*.02,v)*min(beam*.6,3.)*step(.5,fract(fi*.37+floor(t*2.+B*3.)*.13)+.3);}float dome=smoothstep(.02,0.,abs(length(p*vec2(1.,1.6)-vec2(0.,-.9))-1.4));c+=pal(.5,v)*dome*.5*(1.+M);float fog=fbm(p*3.+t*.2)*.15;return c+pal(.2,v)*fog*(1.+B);}',
    // 7 starfield hyperspace
    'vec3 s7(vec2 p,float t,float v){vec3 c=vec3(0.);float sp=.6+B*2.+P;for(int l=0;l<4;l++){float fl=float(l);float z=fract(t*.12*sp+fl*.25);vec2 q=p*(1.6-z*1.4)*rot(fl);vec2 g=floor(q*12.),f=fract(q*12.)-.5;float s=h2(g+fl*7.);if(s>.85){vec2 dir=normalize(g+.5+.001);float streak=smoothstep(.06,0.,abs(dot(f,vec2(-dir.y,dir.x))))*smoothstep(.5,0.,abs(dot(f,dir)));c+=pal(s+fl*.2,v)*streak*z*2.;}}c+=pal(.6,v)*.12/(length(p)+.4)*(1.+P);return c;}',
    // 8 kaleido fractal
    'vec3 s8(vec2 p,float t,float v){float N=5.+floor(h1(v)*7.);float a=atan(p.y,p.x),r=length(p);a=mod(a,6.2832/N);a=abs(a-3.1416/N);p=vec2(cos(a),sin(a))*r;vec2 z=p*1.5;float acc=0.;for(int i=0;i<8;i++){z=abs(z)/dot(z,z)-vec2(.9+sin(t*.1)*.1+B*.1,.6+M*.2);acc+=exp(-abs(length(z)-1.)*3.);}return pal(acc*.1+t*.03,v)*acc*.16*(1.+P);}',
    // 9 rasta dub waves (red/gold/green) + speaker pulses
    'vec3 s9(vec2 p,float t,float v){vec3 c=vec3(0.);for(int i=0;i<3;i++){float fi=float(i);float y=p.y+.45-fi*.45+sin(p.x*3.+t*(1.+fi*.3))*.08*(1.+B*2.);float band=smoothstep(.2,.0,abs(y));vec3 col=fi<.5?vec3(.0,.85,.3):fi<1.5?vec3(1.,.8,.05):vec3(.95,.1,.1);c+=col*band*(.6+.4*sin(p.x*20.-t*4.+fi));}float r=length(p);float ring=smoothstep(.03,0.,abs(fract(r*2.-t*.8-P*.3)-.5)-.45);c+=vec3(1.,.85,.2)*ring*.4*(1.+B);return c*(.9+M)*(1.-r*.25);}',
    // 10 supernova burst
    'vec3 s10(vec2 p,float t,float v){float r=length(p),a=atan(p.y,p.x);float rays=pow(abs(sin(a*12.+fbm(vec2(a*3.,t))*4.)),8.)*exp(-r*1.5);float core=.06/(r+.02)*(1.+B*2.);float shock=smoothstep(.05,0.,abs(r-fract(t*.25+P*.1)*1.8))*(1.-fract(t*.25));vec3 c=pal(.1+r*.4,v)*core+pal(.5+a*.05,v)*rays*(1.+M*2.)+pal(.8,v)*shock*2.;c+=pal(.3,v)*fbm(p*4.-t*.2)*.25*exp(-r);return c;}',
    // 11 hex hyperspace
    'vec3 s11(vec2 p,float t,float v){float r=length(p),a=atan(p.y,p.x);vec2 q=vec2(a*3./3.1416*2.,.4/(r+.03)+t*(1.5+B*3.));q.x+=floor(q.y)*.5;vec2 f=fract(q)-.5;float hx=max(abs(f.x)*1.1547+abs(f.y)*.5774,abs(f.y)*1.1547);float e=smoothstep(.04,.0,abs(hx-.42));float fill=h2(floor(q))>.8?(.5+P):0.;vec3 c=pal(floor(q.y)*.05+t*.05,v)*(e*1.5+fill*.4);return c*smoothstep(0.,.3,r)*(1.+B);}',
    'vec3 sc(float id,vec2 p,float t,float v){if(id<.5)return s0(p,t,v);if(id<1.5)return s1(p,t,v);if(id<2.5)return s2(p,t,v);if(id<3.5)return s3(p,t,v);if(id<4.5)return s4(p,t,v);if(id<5.5)return s5(p,t,v);if(id<6.5)return s6(p,t,v);if(id<7.5)return s7(p,t,v);if(id<8.5)return s8(p,t,v);if(id<9.5)return s9(p,t,v);if(id<10.5)return s10(p,t,v);return s11(p,t,v);}',
    'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=(gl_FragCoord.xy*2.-R)/min(R.x,R.y);p*=1.-P*.04;',
    'float k=X*(1.-X);vec2 pa=p,pb=p;if(TM>.5){pa=p*rot(k*6.)*(1.+k*2.);pb=p*rot(-k*6.)*(1.+k*1.5);}',
    'vec3 c;if(X<.001)c=sc(SA,pa,T,VA);else if(X>.999)c=sc(SB,pb,T,VB);else c=mix(sc(SA,pa,T,VA),sc(SB,pb,T,VB),smoothstep(0.,1.,X));',
    'if(TM>.5)c+=vec3(k*k*6.);',
    'if(UI>.5){vec2 iu=vec2(uv.x,1.-uv.y)+(p*B*.02);vec3 ic=texture2D(IMG,iu).rgb;c=mix(c,1.-(1.-c)*(1.-ic*(.7+B*.6)),IM);}',
    'c*=1.+P*.35;c=c/(1.+c*.35);c*=1.-.35*dot(uv-.5,uv-.5)*2.;c=pow(max(c,0.),vec3(.95));gl_FragColor=vec4(c,1.);}'
  ].join('\n');
  var SCN = ['Tunel Warp', 'Mgławica Nova', 'Cyber Grid 3D', 'Raymarch Orbs', 'Święta Geometria', 'Pierścienie Planety', 'Laser Dome', 'Hyperspace Stars', 'Kalejdo Fraktal', 'Rasta Dub Waves', 'Supernova', 'Hex Hyperdrive'];
  var V = { scenes: SCN, a: 0, b: 1, va: 7, vb: 77, x: 0, mode: '7+13', tmode: 0, res: 'auto', pulse: 0, lost: false, gl: null, img: false, imgMix: .55, auto: true, fps: 0, sync: 1, lock: false };
  var cv, gl, prog, U = {}, tex, lastSwitch = 0, nextIsMagic = false, trans = null, t0 = performance.now(), avgB = .2;
  V.init = function (canvas) {
    cv = canvas; V.cv = cv;
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); V.lost = true; gl = null; }, false);
    cv.addEventListener('webglcontextrestored', function () { V.lost = false; setup(); }, false);
    setup(); V.resize(); window.addEventListener('resize', V.resize); requestAnimationFrame(frame);
  };
  function setup() {
    gl = cv.getContext('webgl', { antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl');
    V.gl = gl; if (!gl) { V.fallback = cv.getContext('2d'); return; }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { V.err = gl.getShaderInfoLog(s); console.error(V.err); } return s; }
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { V.err = gl.getProgramInfoLog(prog); console.error('link', V.err); }
    gl.useProgram(prog);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    'R T B M H P E SA SB X VA VB TM UI IM IMG'.split(' ').forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    texParams(); if (V._imgEl) V.setImage(V._imgEl);
    V.ok = !V.err;
  }
  function texParams() { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
  V.recover = function () { if (!gl || (gl.isContextLost && gl.isContextLost())) { var c2 = cv.cloneNode(); cv.parentNode.replaceChild(c2, cv); cv = c2; V.cv = c2; V.lost = false; setup(); V.resize(); A.emit('viscanvas', c2); } };
  V.setImage = function (img) { V._imgEl = img; if (!gl) return; var c = document.createElement('canvas'), s = 1024; c.width = s; c.height = s; var x = c.getContext('2d'); var r = Math.max(s / img.width, s / img.height); x.drawImage(img, (s - img.width * r) / 2, (s - img.height * r) / 2, img.width * r, img.height * r);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); texParams(); V.img = true; };
  V.clearImage = function () { V.img = false; V._imgEl = null; };
  // resolution / quality: auto · 720 · 1080 · 4k · eco
  V.scaleFor = function (res, cssW, cssH) { var dpr = window.devicePixelRatio || 1, mob = /Android|iPhone|iPad/i.test(navigator.userAgent);
    var h = (res === 'auto' ? (V.dyn || 1) : 1) * (res === '720' ? 720 : res === '1080' ? 1080 : res === '4k' ? 2160 : res === 'eco' ? Math.min(cssH * .5, 480) : cssH * Math.min(dpr, mob ? 1.25 : 2)); return Math.min(h / cssH, 4096 / Math.max(cssW, cssH)); };
  V.resize = function () { if (!cv) return; var w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight, s = V.scaleFor(V.res, w, h); cv.width = Math.max(2, Math.round(w * s)); cv.height = Math.max(2, Math.round(h * s)); V.size = cv.width + '×' + cv.height; A.emit('visres', V.size); };
  V.setRes = function (r) { V.res = r; V.resize(); };
  function rv() { return Math.floor(Math.random() * 777); }
  V.next = function (magic, dur) { var nb; do { nb = Math.floor(Math.random() * SCN.length); } while (nb === V.a && SCN.length > 1); V.go(nb, rv(), magic, dur); };
  V.go = function (scene, variant, magic, dur) { if (trans) { V.a = V.b; V.va = V.vb; } V.b = scene; V.vb = variant == null ? rv() : variant; V.tmode = magic ? 1 : 0; trans = { t: performance.now(), d: (dur || (magic ? 3 : 1.4)) * 1000 }; lastSwitch = performance.now(); A.emit('visscene', { scene: SCN[scene], variant: V.vb }); };
  A.on('beat', function (n) { var s = V.sync; if (s === 1 || n % s === 0) V.pulse = Math.max(V.pulse, n % 4 === 0 ? 1 : .7);
    if (!V.auto || V.lock) return; var bl = V.mode === 'b2' ? 8 : V.mode === 'b4' ? 16 : 0; if (bl && n % bl === 0 && n > 0) V.next(V.mode === 'b4', (V.mode === 'b2' ? 2 : 4) * 60 / A.bpm); });
  A.on('drop', function () { V.pulse = 1.4; if (V.auto && !V.lock) V.next(true, 1.2); });
  A.on('vischange', function () { if (!V.lock) V.next(true); });
  var lastF = 0, fc = 0, fpsT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (V.res === 'eco' && now - lastF < 32) return; var dt = Math.min(.1, (now - lastF) / 1000); lastF = now;
    fc++; if (now - fpsT > 1000) { V.fps = fc; fc = 0; fpsT = now; // adaptive quality in Auto: keep it smooth on weak GPUs
      if (V.res === 'auto' && !document.hidden) { V.dyn = V.dyn || 1; if (V.fps < 24 && V.dyn > .4) { V.dyn = Math.max(.4, V.dyn * .8); V.good = 0; V.resize(); } else if (V.fps > 50 && V.dyn < 1 && ++V.good > 5) { V.dyn = Math.min(1, V.dyn * 1.15); V.good = 0; V.resize(); } } }
    var bd = A.bands ? A.bands() : { b: 0, m: 0, h: 0 }; V.bands = bd;
    if (!A.playing) { if (bd.b > avgB * 1.45 && bd.b > .25 && V.pulse < .3) V.pulse = .9; avgB += (bd.b - avgB) * .05; } // onset for uploaded tracks
    V.pulse *= Math.pow(.02, dt);
    if (V.auto && !V.lock && (V.mode === '7' || V.mode === '13' || V.mode === '7+13')) { var iv = V.mode === '7' ? 7000 : V.mode === '13' ? 13000 : (nextIsMagic ? 13000 : 7000);
      if (now - lastSwitch > iv) { var mg = V.mode === '13' || (V.mode === '7+13' && nextIsMagic); V.next(mg); nextIsMagic = !nextIsMagic; } }
    if (trans) { V.x = Math.min(1, (now - trans.t) / trans.d); if (V.x >= 1) { V.a = V.b; V.va = V.vb; V.x = 0; trans = null; } }
    var t = (now - t0) / 1000;
    if (!gl) { draw2d(t, bd); return; }
    if (gl.isContextLost && gl.isContextLost()) { V.lost = true; return; }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, t); gl.uniform1f(U.B, bd.b); gl.uniform1f(U.M, bd.m); gl.uniform1f(U.H, bd.h); gl.uniform1f(U.P, Math.min(1.4, V.pulse)); gl.uniform1f(U.E, window.DDGen ? DDGen.energy : .5);
    gl.uniform1f(U.SA, V.a); gl.uniform1f(U.SB, V.b); gl.uniform1f(U.X, V.x); gl.uniform1f(U.VA, V.va); gl.uniform1f(U.VB, V.vb); gl.uniform1f(U.TM, V.tmode); gl.uniform1f(U.UI, V.img ? 1 : 0); gl.uniform1f(U.IM, V.imgMix); gl.uniform1i(U.IMG, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function draw2d(t, bd) { var x = V.fallback; if (!x) return; var w = cv.width, h = cv.height; x.fillStyle = 'rgba(5,1,13,.25)'; x.fillRect(0, 0, w, h); var n = 64; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2 + t * .2, r = h * (.15 + bd.b * .25 + (A.fd ? A.fd[i * 4] / 255 : 0) * .2); x.strokeStyle = 'hsl(' + (i * 6 + t * 40) + ',90%,60%)'; x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); x.stroke(); } }
  window.DDVis = V;
})();
