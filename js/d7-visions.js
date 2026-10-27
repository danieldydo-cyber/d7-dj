/* D7 VISIONS — '77 generatorów wizji' + MilkDrop (butterchurn, lokalnie) + radio -> wizualizacja.
   Nowy plik (x77). Bez zależności zewnętrznych. Offline-friendly. Tryb lekki na telefonach.
   Uwaga: "Live AI-generate" = losowanie parametrów (bez modelu AI) — uczciwa nazwa w UI. */
(function () {
  'use strict';
  if (window.D7Visions) return;
  var TAU = Math.PI * 2, M = Math;
  var SCRIPT = (document.currentScript && document.currentScript.src) || '';
  var BASE = SCRIPT ? SCRIPT.replace(/js\/d7-visions\.js.*$/, '') : '';
  var MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches && M.min(screen.width, screen.height) < 820);

  /* ------------------------------------------------------------ helpers */
  function rng(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = M.imul(a ^ a >>> 15, 1 | a); t = t + M.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hsl(h, s, l, a) { return 'hsla(' + (((h % 360) + 360) % 360 | 0) + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var lw = function (w) { return M.max(1, w / 520); };

  /* ------------------------------------------------------------ shared WebGL (shader generators) */
  var GL = { ok: null, c: null, gl: null, progs: {}, buf: null };
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var HEAD = 'precision mediump float;uniform vec2 R;uniform float T,B,L,H;uniform vec4 P;' +
    'vec3 pal(float t){return .5+.5*cos(6.2831*(t+vec3(0.,.33,.67)));}' +
    'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1.,0.)),f.x),mix(h1(i+vec2(0.,1.)),h1(i+vec2(1.,1.)),f.x),f.y);}' +
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p=p*2.02+7.3;a*=.5;}return v;}';
  var UV = 'vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;';
  var FS = {
    nebula: 'void main(){' + UV + 'float t=T*.05*P.x;vec2 q=vec2(fbm(uv*P.y*2.+t),fbm(uv*P.y*2.+5.2-t));float f=fbm(uv*P.y*2.+q*(2.+B*2.)+t);' +
      'vec3 col=pal(H+f*P.z+q.x*.3)*f*f*(2.2+L);col+=step(.985,h1(floor(uv*R.y*.5)))*.7;gl_FragColor=vec4(col,1.);}',
    tunnel: 'void main(){' + UV + 'float a=atan(uv.y,uv.x),r=length(uv);float z=.4/(r+.001)+T*.4*P.x;float k=floor(P.y*8.)+3.;' +
      'float v=sin(a*k+z*3.+B*3.)*.5+.5;float rings=smoothstep(.45,.5,abs(fract(z)-.5));' +
      'vec3 col=pal(H+z*.05+v*.3)*(v*.8+rings*.8)*(1.+B);col*=smoothstep(0.,.25,r);gl_FragColor=vec4(col,1.);}',
    plasma: 'void main(){vec2 p=(gl_FragCoord.xy/R.y)*(2.+P.y*4.);float t=T*P.x;' +
      'float v=sin(p.x*3.+t)+sin(p.y*4.-t*1.3)+sin((p.x+p.y)*2.+t*.7)+sin(length(p-vec2(2.,1.5)*(1.+.2*sin(t)))*5.-t*2.+B*4.);' +
      'gl_FragColor=vec4(pal(H+v*.15*P.z)*(.55+.25*L),1.);}',
    rings: 'void main(){' + UV + 'float r=length(uv);float d=abs(sin(r*(6.+P.y*20.)-T*P.x*2.-B*2.));float g=.03/(d+.02);' +
      'gl_FragColor=vec4(clamp(pal(H+r*.5)*g*(.6+L),0.,1.5),1.);}',
    voronoi: 'void main(){' + UV + 'vec2 p=uv*(4.+P.y*6.);vec2 ip=floor(p),fp=fract(p);float md=8.;vec2 mc=ip;' +
      'for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 g=vec2(float(i),float(j));vec2 o=vec2(h1(ip+g),h1(ip+g+17.));o=.5+.5*sin(T*P.x+6.28*o);vec2 d=g+o-fp;float dd=dot(d,d);if(dd<md){md=dd;mc=ip+g;}}' +
      'gl_FragColor=vec4(pal(H+h1(mc)*P.z)*(1.-sqrt(md)*1.2)*(.6+.8*B),1.);}',
    metaballs: 'void main(){' + UV + 'float s=0.;for(int i=0;i<6;i++){float fi=float(i);vec2 c=vec2(sin(T*P.x*.7+fi*1.7)*.6,cos(T*P.x*.5+fi*2.3)*.4);s+=.04*(1.+B)/(dot(uv-c,uv-c)+.002);}' +
      'gl_FragColor=vec4(pal(H+s*.05*P.z)*smoothstep(.6,2.5,s)*(.7+.3*L),1.);}'
  };
  function glInit() {
    if (GL.ok !== null) return GL.ok;
    try {
      GL.c = document.createElement('canvas');
      var gl = GL.c.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      if (!gl) { GL.ok = false; return false; }
      GL.gl = gl; GL.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, GL.buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      GL.c.addEventListener('webglcontextlost', function (e) { e.preventDefault(); GL.ok = false; });
      GL.ok = true;
    } catch (e) { GL.ok = false; }
    return GL.ok;
  }
  function glProg(name) {
    if (GL.progs[name]) return GL.progs[name];
    var gl = GL.gl;
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, HEAD + FS[name])); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link ' + name);
    var o = { p: p, u: {} }; ['R', 'T', 'B', 'L', 'H', 'P'].forEach(function (k) { o.u[k] = gl.getUniformLocation(p, k); });
    o.a = gl.getAttribLocation(p, 'a'); GL.progs[name] = o; return o;
  }
  function glDraw(name, w, h, t, A, hue, P) {
    var gl = GL.gl, pr = glProg(name);
    if (GL.c.width !== w || GL.c.height !== h) { GL.c.width = w; GL.c.height = h; }
    gl.viewport(0, 0, w, h); gl.useProgram(pr.p); gl.bindBuffer(gl.ARRAY_BUFFER, GL.buf);
    gl.enableVertexAttribArray(pr.a); gl.vertexAttribPointer(pr.a, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(pr.u.R, w, h); gl.uniform1f(pr.u.T, t); gl.uniform1f(pr.u.B, A.bass); gl.uniform1f(pr.u.L, A.level); gl.uniform1f(pr.u.H, hue / 360);
    gl.uniform4f(pr.u.P, P[0], P[1], P[2], P[3]); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function shaderGen(name, P) { /* P:{seed,hue,sp,sc,k} */
    var r = rng(P.seed || 1), prm = [P.sp || 1, P.sc != null ? P.sc : r(), P.k != null ? P.k : .5 + r() * 1.5, r()];
    return {
      fade: 1, params: function () { return name + ' hue=' + (P.hue | 0) + ' sp=' + prm[0].toFixed(2); },
      reroll: function () { P.hue = M.random() * 360; prm[1] = M.random(); prm[2] = .4 + M.random() * 1.6; },
      draw: function (c, w, h, t, A) {
        if (!glInit()) { var g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, M.max(w, h) * .6); g.addColorStop(0, hsl(P.hue + t * 10, 90, 45)); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, w, h); return; }
        try {
          var s = M.min(1, 800 / M.max(w, h)), gw = M.max(16, w * s | 0), gh = M.max(16, h * s | 0);
          glDraw(name, gw, gh, t, A, P.hue + t * (P.hs || 4), prm); c.drawImage(GL.c, 0, 0, w, h);
        } catch (e) { GL.ok = false; }
      }
    };
  }

  /* ------------------------------------------------------------ KALEJDOSKOP */
  function motif(c, m, R, tt, A, P, w) {
    var j, k, x, y, hue = P.hue + tt * 20; c.lineWidth = lw(w) * (1 + A.bass);
    if (m === 'petals') {
      for (j = 0; j < 4; j++) { c.strokeStyle = hsl(hue + j * P.hs, 90, 58, .55); c.beginPath(); c.moveTo(0, 0);
        c.bezierCurveTo(R * .3, -R * .25 * M.sin(tt + j), R * .6, R * .25 * M.cos(tt * 1.3 + j), R * (.45 + .35 * A.level + j * .06), 0); c.stroke(); }
    } else if (m === 'lines') {
      for (j = 0; j < 3; j++) { c.strokeStyle = hsl(hue + j * P.hs, 95, 60, .6); c.beginPath();
        for (k = 0; k < 12; k++) { x = k / 11 * R; y = M.sin(tt * 2 + k * .7 + j * 2) * R * .16 * (1 + A.bass * 1.5) * (k / 11); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    } else if (m === 'circles') {
      for (j = 0; j < 5; j++) { c.fillStyle = hsl(hue + j * P.hs, 90, 55, .35); c.beginPath(); c.arc(R * (.15 + .16 * j), R * .12 * M.sin(tt + j), R * .05 * (1 + A.bass * 2 + j * .1), 0, TAU); c.fill(); }
    } else if (m === 'tri') {
      for (j = 0; j < 3; j++) { c.strokeStyle = hsl(hue + j * P.hs, 90, 60, .6); var s = R * (.25 + j * .17) * (1 + A.bass * .3); c.save(); c.translate(s, 0); c.rotate(tt * (j + 1) * .5); c.beginPath(); c.moveTo(s * .3, 0); c.lineTo(-s * .15, s * .26); c.lineTo(-s * .15, -s * .26); c.closePath(); c.stroke(); c.restore(); }
    } else if (m === 'spiral') {
      c.strokeStyle = hsl(hue, 90, 60, .6); c.beginPath(); for (k = 0; k < 60; k++) { var a = k * .25 + tt, r2 = k / 60 * R; x = M.cos(a) * r2 * .5 + r2 * .5; y = M.sin(a) * r2 * .3; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    } else { /* waves */
      for (j = 0; j < 3; j++) { c.strokeStyle = hsl(hue + j * P.hs, 90, 60, .5); c.beginPath(); for (k = 0; k <= 20; k++) { x = k / 20 * R; y = M.sin(k * .6 - tt * 3 + j) * R * .1 * (1 + A.mid * 2); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    }
  }
  function kaleido(P) {
    return {
      fade: .2, params: function () { return 'n=' + P.n + ' ' + P.motif + ' hue=' + (P.hue | 0); },
      reroll: function () { P.hue = M.random() * 360; P.hs = 20 + M.random() * 90; P.n = 4 + (M.random() * 10 | 0); P.motif = ['petals', 'lines', 'circles', 'tri', 'spiral', 'waves'][M.random() * 6 | 0]; },
      draw: function (c, w, h, t, A) {
        var R = M.min(w, h) * .56, tt = t * P.speed, n = P.n; c.save(); c.translate(w / 2, h / 2); c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < n; i++) { c.save(); c.rotate(i * TAU / n + tt * .12); if (i & 1) c.scale(1, -1); motif(c, P.motif, R, tt, A, P, w); c.restore(); }
        c.restore();
      }
    };
  }

  /* ------------------------------------------------------------ FOREST */
  function forest(P) { /* trees:pine|birch|round overlay:fireflies|rain|rays|aurora|snow|mist|spores|none */
    var r = rng(P.seed), rows = P.rows || 4, rowsT = [], parts = [], k, i, stars = [];
    for (i = 0; i < 70; i++) stars.push([r(), r() * .55, r()]);
    for (k = 0; k < rows; k++) { var row = []; var n = 8 + k * 2; for (i = 0; i < n; i++) row.push([r(), .6 + r() * .8, r()]); rowsT.push(row); }
    var np = M.min(P.np || 60, MOBILE ? 36 : 90); for (i = 0; i < np; i++) parts.push([r(), r(), r(), .3 + r()]);
    function tree(c, type, x, base, hgt, wid, col, rim) {
      c.fillStyle = col;
      if (type === 'pine') { for (var q = 0; q < 3; q++) { var yy = base - hgt * (.25 + q * .28), ww = wid * (1 - q * .22); c.beginPath(); c.moveTo(x - ww, yy + hgt * .3); c.lineTo(x, yy - hgt * .3); c.lineTo(x + ww, yy + hgt * .3); c.closePath(); c.fill(); } c.fillRect(x - wid * .06, base - hgt * .1, wid * .12, hgt * .1); }
      else if (type === 'birch') { c.fillStyle = rim; c.fillRect(x - wid * .09, base - hgt, wid * .18, hgt); c.fillStyle = col; for (var m2 = 0; m2 < 5; m2++) c.fillRect(x - wid * .09, base - hgt * (.15 + m2 * .18), wid * .18, hgt * .025); c.beginPath(); c.arc(x, base - hgt, wid * .55, 0, TAU); c.fill(); }
      else { c.fillRect(x - wid * .07, base - hgt * .5, wid * .14, hgt * .5); c.beginPath(); c.arc(x, base - hgt * .6, wid * .6, 0, TAU); c.arc(x - wid * .35, base - hgt * .45, wid * .4, 0, TAU); c.arc(x + wid * .35, base - hgt * .45, wid * .4, 0, TAU); c.fill(); }
    }
    return {
      fade: 1, params: function () { return P.trees + '+' + P.overlay; },
      reroll: function () { P.sky = [M.random() * 360, M.random() * 360]; P.trees = ['pine', 'birch', 'round'][M.random() * 3 | 0]; P.overlay = ['fireflies', 'rain', 'rays', 'aurora', 'snow', 'mist', 'spores', 'none'][M.random() * 8 | 0]; },
      draw: function (c, w, h, t, A) {
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hsl(P.sky[0], 60, 6 + A.beat * 4)); g.addColorStop(1, hsl(P.sky[1], 55, 18 + A.bass * 10)); c.fillStyle = g; c.fillRect(0, 0, w, h);
        var i, k;
        if (P.overlay === 'aurora') { for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(0, 0); for (i = 0; i <= 24; i++) c.lineTo(i / 24 * w, h * (.18 + k * .06) + M.sin(i * .5 + t * (.6 + k * .2) + k) * h * .06 * (1 + A.mid)); c.lineTo(w, 0); c.closePath(); c.fillStyle = hsl(P.sky[0] + 100 + k * 25, 90, 55, .16); c.fill(); } }
        for (i = 0; i < stars.length; i++) { var s = stars[i]; c.fillStyle = 'rgba(255,255,255,' + (.3 + .5 * M.abs(M.sin(t * (1 + s[2] * 3) + i))) + ')'; c.fillRect(s[0] * w, s[1] * h, 1.5, 1.5); }
        if (P.moon) { var mx = w * .78, my = h * .2, mr = h * .07 * (1 + A.bass * .15); var mg = c.createRadialGradient(mx, my, mr * .2, mx, my, mr * 4); mg.addColorStop(0, hsl(P.sky[0] + 40, 40, 90, .5)); mg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = mg; c.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8); c.fillStyle = hsl(P.sky[0] + 40, 30, 92); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); }
        if (P.overlay === 'rays') { for (k = 0; k < 5; k++) { var rx = (r2(k) * w + M.sin(t * .3 + k) * w * .05); c.fillStyle = hsl(60, 80, 70, .06 + .05 * A.mid); c.beginPath(); c.moveTo(rx, 0); c.lineTo(rx + w * .06, 0); c.lineTo(rx + w * .22 + k * 8, h); c.lineTo(rx - w * .04, h); c.closePath(); c.fill(); } }
        for (k = 0; k < rows; k++) {
          var depth = k / (rows - 1 || 1), base = h * (.62 + depth * .38), sz = h * (.22 + depth * .42), sp = (t * (4 + depth * 22) * (P.drift || 1)), row = rowsT[k], span = w * 1.4;
          var col = hsl(P.hue, 35, 4 + (1 - depth) * 9 + A.bass * 3), rim = hsl(P.hue, 8, 78 - (1 - depth) * 30);
          for (i = 0; i < row.length; i++) { var x = ((row[i][0] * span - sp) % span + span) % span - w * .2; tree(c, P.trees, x + M.sin(t * .7 + i + k) * 2 * (1 + A.mid), base, sz * row[i][1], sz * .35 * row[i][1], col, rim); }
          c.fillStyle = hsl(P.hue, 35, 4 + (1 - depth) * 9); c.fillRect(0, base - 1, w, h - base + 1);
          if (P.overlay === 'mist' || k < rows - 1) { var fg = c.createLinearGradient(0, base - sz * .5, 0, base + 4); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, hsl(P.sky[1], 40, 22 + 8 * (P.overlay === 'mist' ? 1 : 0), .22)); c.fillStyle = fg; c.fillRect(0, base - sz * .5, w, sz * .5 + 4); }
        }
        c.globalCompositeOperation = 'lighter';
        for (i = 0; i < parts.length; i++) {
          var p = parts[i], px, py;
          if (P.overlay === 'fireflies') { px = (p[0] + M.sin(t * .3 * p[3] + i) * .06) * w; py = (.45 + p[1] * .5 + M.cos(t * .4 * p[3] + i * 2) * .04) * h; c.fillStyle = hsl(70 + p[2] * 30, 100, 60, .35 + .6 * M.abs(M.sin(t * 2 * p[3] + i)) * (.6 + A.bass)); c.beginPath(); c.arc(px, py, w * .003 * (1 + A.beat * 1.5), 0, TAU); c.fill(); }
          else if (P.overlay === 'rain') { px = ((p[0] * w - t * 60 * p[3]) % w + w) % w; py = ((p[1] * h + t * (500 + 400 * p[3])) % h); c.strokeStyle = 'rgba(160,200,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 4, py + h * .03); c.stroke(); }
          else if (P.overlay === 'snow') { px = (p[0] * w + M.sin(t * .5 + i) * 20) % w; py = (p[1] * h + t * 40 * p[3]) % h; c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(px, py, 1 + p[3] * 1.5, 0, TAU); c.fill(); }
          else if (P.overlay === 'spores') { px = (p[0] * w + M.sin(t * .6 + i) * 30) % w; py = h - ((p[1] * h + t * 30 * p[3]) % h); c.fillStyle = hsl(300 + p[2] * 60, 90, 65, .5); c.beginPath(); c.arc(px, py, 1.5 + p[3] * 2 * (1 + A.bass), 0, TAU); c.fill(); }
        }
        c.globalCompositeOperation = 'source-over';
        function r2(q) { return (M.sin(q * 91.7 + P.seed) * .5 + .5); }
      }
    };
  }
  function fractalTree(P) { /* depth, spread, hue, wind */
    var depth = MOBILE ? M.min(P.depth, 8) : P.depth;
    return {
      fade: 1, params: function () { return 'depth=' + depth + ' spread=' + P.spread.toFixed(2); },
      reroll: function () { P.hue = M.random() * 360; P.spread = .25 + M.random() * .5; P.sky = M.random() * 360; },
      draw: function (c, w, h, t, A) {
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, hsl(P.sky, 50, 5)); g.addColorStop(1, hsl(P.sky + 30, 50, 15 + A.bass * 8)); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.lineCap = 'round'; var base = h, len0 = h * .22; var sway = P.wind * (1 + A.mid * 2);
        function br(x, y, len, ang, d) {
          var x2 = x + M.cos(ang) * len, y2 = y + M.sin(ang) * len; c.lineWidth = M.max(.6, d * lw(w) * 1.1); c.strokeStyle = hsl(P.hue + (depth - d) * 14, 70, 30 + (depth - d) * 5, .95); c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
          if (d <= 1) { c.fillStyle = hsl(P.leaf + (x2 % 40), 90, 60, .55 + A.beat * .4); c.beginPath(); c.arc(x2, y2, w * .0035 * (1 + A.bass * 2), 0, TAU); c.fill(); return; }
          var s = M.sin(t * 1.2 + d * .8 + x * .01) * sway;
          br(x2, y2, len * .78, ang - P.spread + s, d - 1); br(x2, y2, len * .74, ang + P.spread + s, d - 1);
        }
        br(w * (P.x || .5), base, len0, -M.PI / 2, depth);
        if (P.x2) br(w * P.x2, base, len0 * .8, -M.PI / 2, depth - 1);
      }
    };
  }
  function vines(P) {
    var n = MOBILE ? 8 : 14, r = rng(P.seed), v = [], i;
    for (i = 0; i < n; i++) v.push({ x: r() * 1, y: r(), a: r() * TAU, s: .3 + r(), h: P.hue + r() * 60 });
    return {
      fade: .06, params: function () { return 'vines n=' + n; }, reroll: function () { P.hue = M.random() * 360; v.forEach(function (q) { q.h = P.hue + M.random() * 60; }); },
      draw: function (c, w, h, t, A) {
        c.lineWidth = lw(w) * 1.4; c.globalCompositeOperation = 'lighter';
        v.forEach(function (q, i) { var px = q.x * w, py = q.y * h; q.a += (M.sin(t * q.s + i) * .15) + (A.beat ? (M.random() - .5) * .8 : 0); q.x += M.cos(q.a) * .004 * (1 + A.level); q.y += M.sin(q.a) * .004 * (1 + A.level) - .0008; if (q.x < 0 || q.x > 1 || q.y < 0 || q.y > 1) { q.x = M.random(); q.y = 1; q.a = -M.PI / 2; }
          c.strokeStyle = hsl(q.h + t * 6, 80, 55, .7); c.beginPath(); c.moveTo(px, py); c.lineTo(q.x * w, q.y * h); c.stroke();
          if (A.beat) { c.fillStyle = hsl(q.h + 120, 90, 70, .7); c.beginPath(); c.arc(q.x * w, q.y * h, w * .004, 0, TAU); c.fill(); } });
      }
    };
  }
  function shrooms(P) {
    var r = rng(P.seed), n = 9, S = [], i; for (i = 0; i < n; i++) S.push([r(), .4 + r() * .6, r() * TAU, r()]);
    return {
      fade: 1, params: function () { return 'grzyby n=' + n; }, reroll: function () { P.hue = M.random() * 360; },
      draw: function (c, w, h, t, A) {
        var g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#02030a'); g.addColorStop(1, hsl(P.hue + 200, 50, 10)); c.fillStyle = g; c.fillRect(0, 0, w, h);
        for (i = 0; i < n; i++) { var s = S[i], x = (.06 + s[0] * .88) * w, base = h * (.75 + s[3] * .25), sz = h * .18 * s[1] * (1 + A.bass * .15 * (i % 2)), bob = M.sin(t + s[2]) * 4; c.fillStyle = hsl(P.hue + 30, 20, 70, .85); c.fillRect(x - sz * .06, base - sz * .8 + bob, sz * .12, sz * .8);
          var gg = c.createRadialGradient(x, base - sz * .8 + bob, 0, x, base - sz * .8 + bob, sz * 1.3); gg.addColorStop(0, hsl(P.hue + i * 18, 100, 60, .5 + A.bass * .4)); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - sz * 1.3, base - sz * 2.1 + bob, sz * 2.6, sz * 2.6);
          c.fillStyle = hsl(P.hue + i * 18, 85, 48 + A.bass * 12); c.beginPath(); c.ellipse(x, base - sz * .8 + bob, sz * .55, sz * .38, 0, M.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - sz * .2, base - sz * 1 + bob, sz * .05, 0, TAU); c.arc(x + sz * .15, base - sz * .95 + bob, sz * .04, 0, TAU); c.fill(); }
      }
    };
  }

  /* ------------------------------------------------------------ KOSMOS */
  function starwarp(P) {
    var n = M.min(P.n, MOBILE ? 220 : 520), r = rng(P.seed), S = [], i; for (i = 0; i < n; i++) S.push([r() * 2 - 1, r() * 2 - 1, r()]);
    return {
      fade: P.trail, params: function () { return 'gwiazdy n=' + n + ' v=' + P.speed; }, reroll: function () { P.hue = M.random() * 360; P.speed = .3 + M.random() * 1.5; },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; var sp = P.speed * (1 + A.bass * 3 + A.beat * 2) * .012;
        for (i = 0; i < n; i++) { var s = S[i], z0 = s[2]; s[2] -= sp; if (s[2] <= .01) { s[0] = M.random() * 2 - 1; s[1] = M.random() * 2 - 1; s[2] = 1; z0 = 1 + sp; }
          var x0 = s[0] / z0 * w * .5 + w / 2, y0 = s[1] / z0 * h * .5 + h / 2, x1 = s[0] / s[2] * w * .5 + w / 2, y1 = s[1] / s[2] * h * .5 + h / 2; c.strokeStyle = hsl(P.hue + s[2] * 60, 80, 70, 1 - s[2]); c.lineWidth = (1 - s[2]) * lw(w) * 2 + .5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
      }
    };
  }
  function galaxy(P) {
    var n = M.min(P.n || 700, MOBILE ? 380 : 900), r = rng(P.seed), S = [], i; for (i = 0; i < n; i++) { var arm = (i % P.arms) * TAU / P.arms, d = r(); S.push([arm, d, (r() - .5) * .35 * (1 - d * .5), r()]); }
    return {
      fade: .22, params: function () { return 'ramiona=' + P.arms; }, reroll: function () { P.hue = M.random() * 360; P.arms = 2 + (M.random() * 4 | 0); P.tilt = .25 + M.random() * .6; var rr = rng((M.random() * 1e9) | 0); S.forEach(function (s, i) { s[0] = (i % P.arms) * TAU / P.arms; s[2] = (rr() - .5) * .35 * (1 - s[1] * .5); }); },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; var R = M.min(w, h) * .46 * (1 + A.bass * .06);
        for (i = 0; i < n; i++) { var s = S[i], a = s[0] + s[1] * 5.5 + t * .18 * (1.2 - s[1]) + s[2], rr = s[1] * R, x = w / 2 + M.cos(a) * rr, y = h / 2 + M.sin(a) * rr * P.tilt; c.fillStyle = hsl(P.hue + s[1] * 80 + s[3] * 30, 85, 55 + (1 - s[1]) * 30, .5 + A.level * .4); c.fillRect(x, y, 1.5 + s[3] * 1.5, 1.5 + s[3] * 1.5); }
        var cg = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, R * .3); cg.addColorStop(0, hsl(P.hue + 40, 80, 80, .7 + A.bass * .3)); cg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = cg; c.fillRect(0, 0, w, h);
      }
    };
  }
  function blackhole(P) {
    return {
      fade: .3, params: function () { return 'czarna dziura'; }, reroll: function () { P.hue = M.random() * 360; },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; var R = M.min(w, h) * .3, cx = w / 2, cy = h / 2;
        for (var k = 0; k < 22; k++) { var rr = R * (.55 + k * .06) * (1 + A.bass * .04 * (k % 3)); c.strokeStyle = hsl(P.hue + k * 5 + t * 15, 90, 50 + k, .14); c.lineWidth = lw(w) * (1 + (22 - k) * .1); c.beginPath(); c.ellipse(cx, cy, rr * 1.8, rr * .45, t * .05 * (k % 2 ? 1 : -1) + .3, 0, TAU); c.stroke(); }
        c.globalCompositeOperation = 'source-over'; var g = c.createRadialGradient(cx, cy, R * .3, cx, cy, R * .62); g.addColorStop(0, '#000'); g.addColorStop(.85, '#000'); g.addColorStop(1, hsl(P.hue + 30, 100, 70, .0)); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * .62, 0, TAU); c.fill();
        c.strokeStyle = hsl(P.hue + 20, 100, 80, .5 + A.beat * .4); c.lineWidth = lw(w) * 2; c.beginPath(); c.arc(cx, cy, R * .38, 0, TAU); c.stroke();
      }
    };
  }
  function planets(P) {
    var r = rng(P.seed), n = P.n, pl = [], i; for (i = 0; i < n; i++) pl.push({ d: .12 + i * (.36 / n), sp: .15 + r() * .7, ph: r() * TAU, sz: .012 + r() * .03, h: r() * 360, m: r() < .5 });
    return {
      fade: .35, params: function () { return 'planety n=' + n; }, reroll: function () { P.hue = M.random() * 360; pl.forEach(function (p) { p.h = M.random() * 360; p.sp = .15 + M.random() * .7; }); },
      draw: function (c, w, h, t, A) {
        var R = M.min(w, h), cx = w / 2, cy = h / 2; c.globalCompositeOperation = 'lighter';
        var sg = c.createRadialGradient(cx, cy, 0, cx, cy, R * .09 * (1 + A.bass * .3)); sg.addColorStop(0, hsl(P.hue, 100, 85)); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R * .09 * (1 + A.bass * .3), 0, TAU); c.fill();
        pl.forEach(function (p) { var a = p.ph + t * p.sp, x = cx + M.cos(a) * p.d * R * 1.4, y = cy + M.sin(a) * p.d * R * .8; c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, p.d * R * 1.4, p.d * R * .8, 0, 0, TAU); c.stroke();
          c.fillStyle = hsl(p.h, 80, 60, .9); c.beginPath(); c.arc(x, y, p.sz * R * (1 + A.mid * .3), 0, TAU); c.fill(); if (p.m) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(x + M.cos(a * 4) * p.sz * R * 2, y + M.sin(a * 4) * p.sz * R * 2, p.sz * R * .3, 0, TAU); c.fill(); } });
      }
    };
  }
  function comets(P) {
    var C = [], n = P.n, i; for (i = 0; i < n; i++) C.push({ x: M.random(), y: M.random(), v: .002 + M.random() * .006, a: P.ang + (M.random() - .5) * .4, h: P.hue + M.random() * 60 });
    return {
      fade: .12, params: function () { return 'komety n=' + n; }, reroll: function () { P.hue = M.random() * 360; P.ang = M.random() * TAU; C.forEach(function (q) { q.a = P.ang + (M.random() - .5) * .4; q.h = P.hue + M.random() * 60; }); },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; C.forEach(function (q) { var sp = q.v * (1 + A.bass * 3), nx = q.x + M.cos(q.a) * sp, ny = q.y + M.sin(q.a) * sp; c.strokeStyle = hsl(q.h, 90, 70, .8); c.lineWidth = lw(w) * 2; c.beginPath(); c.moveTo(q.x * w, q.y * h); c.lineTo(nx * w, ny * h); c.stroke(); c.fillStyle = '#fff'; c.fillRect(nx * w - 1, ny * h - 1, 3, 3); q.x = nx; q.y = ny; if (q.x < -.1 || q.x > 1.1 || q.y < -.1 || q.y > 1.1) { q.x = M.random(); q.y = M.random(); } });
      }
    };
  }
  function pulsar(P) {
    return {
      fade: .2, params: function () { return 'pulsar beams=' + P.beams; }, reroll: function () { P.hue = M.random() * 360; P.beams = 2 + (M.random() * 4 | 0); },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; var cx = w / 2, cy = h / 2, R = M.max(w, h) * .7;
        for (var b = 0; b < P.beams; b++) { var a = t * P.speed + b * TAU / P.beams; var g = c.createLinearGradient(cx, cy, cx + M.cos(a) * R, cy + M.sin(a) * R); g.addColorStop(0, hsl(P.hue + b * 30, 100, 75, .6 + A.bass * .3)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.strokeStyle = g; c.lineWidth = w * .012 * (1 + A.bass * 2); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + M.cos(a) * R, cy + M.sin(a) * R); c.stroke(); }
        for (var k = 0; k < 6; k++) { var ph = ((t * .5 + k / 6) % 1); c.strokeStyle = hsl(P.hue + k * 20, 90, 60, (1 - ph) * .4); c.lineWidth = lw(w) * 2; c.beginPath(); c.arc(cx, cy, ph * M.min(w, h) * .55, 0, TAU); c.stroke(); }
      }
    };
  }
  function supernova(P) {
    var parts = [], max = MOBILE ? 260 : 600;
    return {
      fade: .16, params: function () { return 'supernowa'; }, reroll: function () { P.hue = M.random() * 360; },
      draw: function (c, w, h, t, A) {
        if (A.beat || (parts.length < 20 && M.random() < .1)) { var cx = (.25 + M.random() * .5) * w, cy = (.25 + M.random() * .5) * h, hu = P.hue + M.random() * 80; for (var i = 0; i < 70 && parts.length < max; i++) { var a = M.random() * TAU, s = (.5 + M.random()) * w * .004; parts.push({ x: cx, y: cy, vx: M.cos(a) * s, vy: M.sin(a) * s, l: 1, h: hu }); } }
        c.globalCompositeOperation = 'lighter'; for (var j = parts.length - 1; j >= 0; j--) { var p = parts[j]; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985; p.l -= .012; if (p.l <= 0) { parts.splice(j, 1); continue; } c.fillStyle = hsl(p.h + (1 - p.l) * 40, 100, 60 + p.l * 25, p.l); c.fillRect(p.x, p.y, 2.5 * p.l + 1, 2.5 * p.l + 1); }
      }
    };
  }
  function ringplanet(P) {
    var r = rng(P.seed), st = []; for (var i = 0; i < 90; i++) st.push([r(), r(), r()]);
    return {
      fade: 1, params: function () { return 'planeta z pierścieniami'; }, reroll: function () { P.hue = M.random() * 360; P.tilt = .15 + M.random() * .3; },
      draw: function (c, w, h, t, A) {
        c.fillStyle = '#02030b'; c.fillRect(0, 0, w, h); for (var i = 0; i < st.length; i++) { c.fillStyle = 'rgba(255,255,255,' + (.2 + .6 * st[i][2]) + ')'; c.fillRect(st[i][0] * w, st[i][1] * h, 1.5, 1.5); }
        var cx = w / 2, cy = h / 2, R = M.min(w, h) * .2 * (1 + A.bass * .03);
        function ring(front) { c.save(); c.beginPath(); c.rect(0, front ? cy : 0, w, front ? h : cy); c.clip(); for (var k = 0; k < 7; k++) { c.strokeStyle = hsl(P.hue + k * 6, 50, 55 + k * 3, .35 + .15 * (k % 2)); c.lineWidth = R * .07; c.beginPath(); c.ellipse(cx, cy, R * (1.5 + k * .12), R * (1.5 + k * .12) * P.tilt, -.25, 0, TAU); c.stroke(); } c.restore(); }
        ring(false); var g = c.createRadialGradient(cx - R * .4, cy - R * .4, R * .1, cx, cy, R); g.addColorStop(0, hsl(P.hue, 70, 70)); g.addColorStop(.7, hsl(P.hue + 20, 70, 35)); g.addColorStop(1, hsl(P.hue + 40, 60, 8)); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
        for (var b = 0; b < 5; b++) { c.strokeStyle = hsl(P.hue + b * 14, 50, 50, .18); c.lineWidth = R * .05; c.beginPath(); c.ellipse(cx, cy + (b - 2) * R * .28, R * M.sqrt(M.max(0, 1 - M.pow((b - 2) * .28, 2))) * .98, R * .05, 0, 0, TAU); c.stroke(); }
        ring(true);
      }
    };
  }

  /* ------------------------------------------------------------ LIVE AI-GENERATE (losowanie parametrów) */
  function flow(P) {
    var n = M.min(P.n || 420, MOBILE ? 220 : 500), pts = [], i; for (i = 0; i < n; i++) pts.push([M.random(), M.random(), M.random()]);
    return {
      fade: .07, params: function () { return 'flow scale=' + P.sc.toFixed(1) + ' hue=' + (P.hue | 0); }, reroll: function () { P.hue = M.random() * 360; P.sc = 1 + M.random() * 6; P.sw = M.random() * 2; },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; c.lineWidth = lw(w) * 1.3;
        for (i = 0; i < n; i++) { var p = pts[i], a = (M.sin(p[0] * P.sc * 3 + t * .3) + M.cos(p[1] * P.sc * 3 - t * .2)) * M.PI * (1 + P.sw), sp = .003 * (1 + A.bass * 3), nx = p[0] + M.cos(a) * sp, ny = p[1] + M.sin(a) * sp; c.strokeStyle = hsl(P.hue + p[2] * 90 + t * 8, 90, 58, .7); c.beginPath(); c.moveTo(p[0] * w, p[1] * h); c.lineTo(nx * w, ny * h); c.stroke(); p[0] = nx; p[1] = ny; if (nx < 0 || nx > 1 || ny < 0 || ny > 1) { p[0] = M.random(); p[1] = M.random(); } }
      }
    };
  }
  function lissa(P) {
    return {
      fade: .12, params: function () { return 'lissajous ' + P.a + ':' + P.b; }, reroll: function () { P.a = 1 + (M.random() * 7 | 0); P.b = 1 + (M.random() * 7 | 0); P.hue = M.random() * 360; P.d = M.random() * TAU; },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; c.lineWidth = lw(w) * 1.6; for (var k = 0; k < 3; k++) { c.strokeStyle = hsl(P.hue + k * 40 + t * 10, 95, 60, .6); c.beginPath(); for (var i = 0; i <= 220; i++) { var u = i / 220 * TAU, x = w / 2 + M.sin(P.a * u + t * .4 + k * .5 + P.d) * w * .4 * (1 + A.bass * .12), y = h / 2 + M.sin(P.b * u + t * .3 + k * .3) * h * .4; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
      }
    };
  }
  function attractor(P) { /* Clifford */
    var N = MOBILE ? 500 : 1400;
    return {
      fade: .06, params: function () { return 'atraktor a=' + P.a.toFixed(2) + ' b=' + P.b.toFixed(2); }, reroll: function () { P.a = -2 + M.random() * 4; P.b = -2 + M.random() * 4; P.c2 = -2 + M.random() * 4; P.d = -2 + M.random() * 4; P.hue = M.random() * 360; P.x = M.random(); P.y = M.random(); },
      draw: function (c, w, h, t, A) {
        c.globalCompositeOperation = 'lighter'; var x = P.x, y = P.y, a = P.a + M.sin(t * .1) * .05, b = P.b, cc = P.c2, d = P.d + A.bass * .03; c.fillStyle = hsl(P.hue + t * 6, 90, 60, .5);
        for (var i = 0; i < N; i++) { var nx = M.sin(a * y) + cc * M.cos(a * x), ny = M.sin(b * x) + d * M.cos(b * y); x = nx; y = ny; c.fillRect(w / 2 + x * w * .2, h / 2 + y * h * .2, 1.3, 1.3); } P.x = x; P.y = y;
      }
    };
  }
  /* AI meta-generator: co N beatów losuje typ + parametry */
  function ai(P) {
    var cur = null, beats = 0;
    function mk() {
      var kind = P.pool[M.random() * P.pool.length | 0], s = (M.random() * 1e9) | 0, hue = M.random() * 360;
      switch (kind) {
        case 'flow': return flow({ hue: hue, sc: 1 + M.random() * 6, sw: M.random() * 2 });
        case 'lissa': return lissa({ a: 1 + (M.random() * 7 | 0), b: 1 + (M.random() * 7 | 0), hue: hue, d: M.random() * TAU });
        case 'attr': return attractor({ a: -2 + M.random() * 4, b: -2 + M.random() * 4, c2: -2 + M.random() * 4, d: -2 + M.random() * 4, hue: hue, x: .1, y: .1 });
        case 'plasma': return shaderGen('plasma', { seed: s, hue: hue, sp: .3 + M.random() * 1.5 });
        case 'nebula': return shaderGen('nebula', { seed: s, hue: hue, sp: .5 + M.random() * 2 });
        case 'voronoi': return shaderGen('voronoi', { seed: s, hue: hue, sp: .3 + M.random() });
        case 'kaleido': return kaleido({ n: 4 + (M.random() * 10 | 0), motif: ['petals', 'lines', 'circles', 'tri', 'spiral', 'waves'][M.random() * 6 | 0], hue: hue, hs: 20 + M.random() * 90, speed: .4 + M.random() });
        case 'forest': return forest({ seed: s, sky: [M.random() * 360, M.random() * 360], hue: hue, trees: ['pine', 'birch', 'round'][M.random() * 3 | 0], overlay: ['fireflies', 'rain', 'rays', 'aurora', 'snow', 'mist', 'spores'][M.random() * 7 | 0], rows: 4, moon: M.random() < .5, np: 50 });
        case 'galaxy': return galaxy({ seed: s, arms: 2 + (M.random() * 4 | 0), hue: hue, tilt: .3 + M.random() * .5 });
        default: return starwarp({ seed: s, n: 400, speed: .5 + M.random(), hue: hue, trail: .2 });
      }
    }
    cur = mk();
    return {
      get fade() { return cur.fade; }, ai: true,
      params: function () { return 'AI-losowanie: ' + (cur.params ? cur.params() : ''); },
      reroll: function () { cur = mk(); },
      draw: function (c, w, h, t, A) { if (A.beat && ++beats >= P.every) { beats = 0; cur = mk(); } cur.draw(c, w, h, t, A); }
    };
  }

  /* ------------------------------------------------------------ REJESTR 77 */
  var REG = []; /* {id,name,group,make} */
  function add(group, name, make) { REG.push({ id: REG.length, group: group, name: name, make: make }); }
  var G_K = 'Kalejdoskop', G_F = 'Forest (las)', G_C = 'Kosmos', G_A = 'Live AI-generate';
  (function build() {
    var i, nm;
    /* Kalejdoskop x20 */
    var kn = ['Szafirowy 6', 'Rubinowy 8', 'Szmaragdowy 5', 'Złoty 12', 'Neon 7', 'Lodowy 9', 'Płomień 6', 'Fiolet 10', 'Toksyk 4', 'Różany 8', 'Kryształ 11', 'Mandala 12', 'Pająk 7', 'Fala 6', 'Gwiazdozbiór 9', 'Hipnoza 5', 'Wir 8', 'Cyberkwiat 10', 'Pryzmat 6', 'Rozbłysk 14'];
    var mo = ['petals', 'lines', 'circles', 'tri', 'spiral', 'waves'];
    kn.forEach(function (n, i) { var N = parseInt(n.split(' ').pop(), 10); add(G_K, 'Kalejdoskop ' + n, function () { return kaleido({ n: N, motif: mo[i % 6], hue: (i * 37) % 360, hs: 25 + (i * 13) % 80, speed: .5 + (i % 5) * .15 }); }); });
    /* Forest x19 */
    var fo = [
      ['Sosnowy zmierzch', { trees: 'pine', overlay: 'fireflies', sky: [250, 285], hue: 200, moon: 1 }], ['Świetliki w sośninie', { trees: 'pine', overlay: 'fireflies', sky: [190, 160], hue: 140, moon: 0 }],
      ['Deszczowy bór', { trees: 'pine', overlay: 'rain', sky: [210, 220], hue: 190, moon: 0 }], ['Zorza nad lasem', { trees: 'pine', overlay: 'aurora', sky: [160, 230], hue: 210, moon: 0 }],
      ['Brzozowy gaj we mgle', { trees: 'birch', overlay: 'mist', sky: [200, 190], hue: 180, moon: 1 }], ['Brzozy i świetliki', { trees: 'birch', overlay: 'fireflies', sky: [260, 300], hue: 260, moon: 1 }],
      ['Zimowy las', { trees: 'birch', overlay: 'snow', sky: [215, 200], hue: 210, moon: 1 }], ['Promienie w dębach', { trees: 'round', overlay: 'rays', sky: [90, 60], hue: 100, moon: 0 }],
      ['Zarodniki w gąszczu', { trees: 'round', overlay: 'spores', sky: [300, 270], hue: 290, moon: 1 }], ['Mglisty dąb', { trees: 'round', overlay: 'mist', sky: [150, 130], hue: 140, moon: 0 }],
      ['Księżycowy bór', { trees: 'pine', overlay: 'none', sky: [235, 255], hue: 220, moon: 1 }]
    ];
    fo.forEach(function (f, i) { add(G_F, 'Las: ' + f[0], function () { var p = JSON.parse(JSON.stringify(f[1])); p.seed = 100 + i * 7; p.rows = 4; p.np = 60; return forest(p); }); });
    [['Dąb na wietrze', 9, .42, 28, 100, .09, 205], ['Sakura', 8, .5, 330, 330, .06, 270], ['Neonowe drzewo', 9, .38, 180, 160, .12, 255], ['Drzewo życia', 9, .45, 40, 80, .07, 235]].forEach(function (f) { add(G_F, 'Drzewo fraktalne: ' + f[0], function () { return fractalTree({ depth: f[1], spread: f[2], hue: f[3], leaf: f[4], wind: f[5], sky: f[6], x: .5 }); }); });
    add(G_F, 'Winorośl w rytm', function () { return vines({ seed: 5, hue: 120 }); }); add(G_F, 'Winorośl toksyczna', function () { return vines({ seed: 9, hue: 290 }); });
    add(G_F, 'Grzyby bioluminescencyjne', function () { return shrooms({ seed: 3, hue: 170 }); }); add(G_F, 'Grzyby fioletowe', function () { return shrooms({ seed: 8, hue: 290 }); });
    /* Kosmos x20 */
    [['Hiperprzestrzeń', 500, 1.2, 200, .35], ['Pas gwiazd', 300, .5, 40, .15], ['Warp magenta', 450, 1.8, 310, .5]].forEach(function (f, i) { add(G_C, 'Warp: ' + f[0], function () { return starwarp({ seed: 20 + i, n: f[1], speed: f[2], hue: f[3], trail: f[4] }); }); });
    [['Spiralna 2 ramiona', 2, 200], ['Spiralna 4 ramiona', 4, 280], ['Galaktyka złota', 3, 40]].forEach(function (f, i) { add(G_C, 'Galaktyka: ' + f[0], function () { return galaxy({ seed: 30 + i, arms: f[1], hue: f[2], tilt: .35 + i * .12 }); }); });
    add(G_C, 'Czarna dziura', function () { return blackhole({ hue: 25 }); });
    add(G_C, 'Układ planetarny', function () { return planets({ seed: 41, n: 7, hue: 45 }); }); add(G_C, 'Układ binarny', function () { return planets({ seed: 42, n: 4, hue: 200 }); });
    add(G_C, 'Deszcz komet', function () { return comets({ n: 26, ang: .7, hue: 190 }); }); add(G_C, 'Komety ognia', function () { return comets({ n: 20, ang: 2.4, hue: 20 }); });
    add(G_C, 'Pulsar 3 wiązki', function () { return pulsar({ beams: 3, hue: 190, speed: .8 }); }); add(G_C, 'Pulsar 6 wiązek', function () { return pulsar({ beams: 6, hue: 310, speed: 1.4 }); });
    add(G_C, 'Supernowa', function () { return supernova({ hue: 20 }); });
    add(G_C, 'Planeta z pierścieniami', function () { return ringplanet({ seed: 7, hue: 35, tilt: .25 }); });
    add(G_C, 'Mgławica Oriona', function () { return shaderGen('nebula', { seed: 3, hue: 300, sp: 1, sc: .5, k: 1.2 }); }); add(G_C, 'Mgławica lodowa', function () { return shaderGen('nebula', { seed: 11, hue: 190, sp: 1.6, sc: .8, k: .9 }); });
    add(G_C, 'Tunel czasoprzestrzenny', function () { return shaderGen('tunnel', { seed: 5, hue: 220, sp: 1.2, sc: .4 }); }); add(G_C, 'Tunel hipnotyczny', function () { return shaderGen('tunnel', { seed: 6, hue: 320, sp: 2, sc: .9 }); });
    add(G_C, 'Plazma słoneczna', function () { return shaderGen('metaballs', { seed: 8, hue: 30, sp: 1, k: 1.5 }); });
    /* Live AI-generate x18 */
    var pools = [['flow'], ['lissa'], ['attr'], ['plasma'], ['kaleido'], ['forest'], ['galaxy', 'starwarp', 'nebula'], ['flow', 'lissa', 'attr'], ['plasma', 'nebula', 'voronoi'], ['kaleido', 'lissa'], ['flow', 'forest'], ['voronoi'], ['attr', 'galaxy'], ['plasma', 'kaleido', 'flow'], ['nebula', 'forest', 'kaleido'], ['lissa', 'plasma', 'attr', 'flow'], ['flow', 'lissa', 'attr', 'plasma', 'nebula', 'voronoi', 'kaleido', 'forest', 'galaxy', 'starwarp'], ['starwarp', 'flow', 'attr']];
    var an = ['Flow Seed', 'Lissajous Seed', 'Atraktor Seed', 'Plazma Seed', 'Kalejdoskop Seed', 'Las Seed', 'Kosmos Seed', 'Chaos Trio', 'Neon Plazma Mix', 'Symetria Mix', 'Przepływ+Las', 'Komórki Seed', 'Atraktor+Galaktyka', 'Psychodelia Mix', 'Sen Mix', 'Matematyka Mix', 'Mega Losowanie', 'Podróż Mix'];
    an.forEach(function (n, i) { add(G_A, 'AI·' + n, function () { return ai({ pool: pools[i], every: 8 + (i % 3) * 4 }); }); });
  })();

  /* ------------------------------------------------------------ AUDIO (radio) */
  var FALLBACK_ST = [['SomaFM DEF CON (techno/elektronika)', 'https://ice1.somafm.com/defcon-128-mp3'], ['SomaFM Beat Blender (deep house)', 'https://ice2.somafm.com/beatblender-128-mp3'], ['SomaFM Fluid (instrumental hip-hop)', 'https://ice2.somafm.com/fluid-128-mp3'], ['SomaFM Groove Salad (chill)', 'https://ice2.somafm.com/groovesalad-128-mp3'], ['SomaFM Space Station', 'https://ice2.somafm.com/spacestation-128-mp3'], ['Bassdrive (drum & bass)', 'https://ice.bassdrive.net/stream'], ['RMF MAXXX', 'https://rs101-krk.rmfstream.pl/RMFMAXXX48'], ['RMF FM', 'https://rs101-krk.rmfstream.pl/RMFFM48'], ['Radio Paradise', 'https://stream.radioparadise.com/mp3-128']];
  function stations() { return (window.D7_STATIONS && window.D7_STATIONS.length) ? window.D7_STATIONS : FALLBACK_ST; }

  /* ------------------------------------------------------------ UI + silnik */
  var ST = { sel: 0, layers: 1, mode: 'gen', auto: true, every: 16, res: MOBILE ? '480' : '720', fps: MOBILE ? 30 : 60, bpm: 128, station: -1 };
  try { var sv = JSON.parse(localStorage.getItem('d7.visions') || '{}'); ['sel', 'layers', 'auto', 'every', 'res'].forEach(function (k) { if (sv[k] != null) ST[k] = sv[k]; }); } catch (e) { }
  function save() { try { localStorage.setItem('d7.visions', JSON.stringify({ sel: ST.sel, layers: ST.layers, auto: ST.auto, every: ST.every, res: ST.res })); } catch (e) { } }

  function init(root) {
    if (root.__d7v) return root.__d7v; root.__d7v = 1;
    root.classList.add('d7v');
    root.innerHTML = '<div class="d7v-stage"><canvas class="d7v-main"></canvas><canvas class="d7v-md" hidden></canvas>' +
      '<div class="d7v-title"><b>77 generatorów wizji</b><span class="d7v-now">…</span></div>' +
      '<div class="d7v-info"><span class="d7v-src">beat: symulacja 128 BPM</span> · <span class="d7v-fps">– fps</span> · <span class="d7v-par"></span></div>' +
      '<button type="button" class="d7v-fsx" aria-label="Wyjdź z pełnego ekranu">✕</button></div>' +
      '<div class="d7v-bar"><div class="d7v-row">' +
      '<button type="button" class="d7v-b d7v-prev" title="Poprzedni">◀</button><select class="d7v-pick" aria-label="Wybierz generator wizji"></select><button type="button" class="d7v-b d7v-next" title="Następny">▶</button>' +
      '<button type="button" class="d7v-b d7v-rnd" title="Losuj generator">🎲 Losuj</button><button type="button" class="d7v-b d7v-mut" title="Mutuj parametry (losowanie parametrów)">🧬 Mutuj</button>' +
      '<label class="d7v-chk"><input type="checkbox" class="d7v-auto"> AUTO na beat co <select class="d7v-every"><option>4</option><option>8</option><option selected>16</option><option>32</option><option>64</option></select></label>' +
      '<button type="button" class="d7v-b d7v-fs" title="Pełny ekran (dwuklik / podwójny tap)">⛶ Fullscreen</button></div>' +
      '<div class="d7v-row"><label>Tryb <select class="d7v-layers"><option value="1">Pojedynczy</option><option value="2">Warstwy ×2</option><option value="3">Warstwy ×3</option><option value="4">Warstwy ×4</option></select></label>' +
      '<label>Rozdzielczość <select class="d7v-res"><option value="480">480p</option><option value="720">720p</option><option value="1080">1080p</option><option value="native">natywna</option></select></label>' +
      '<label>Radio <select class="d7v-radio"></select></label><button type="button" class="d7v-b d7v-play">▶ Radio</button><button type="button" class="d7v-b d7v-md-btn" title="Przełącz na MilkDrop (butterchurn)">🌀 MilkDrop</button>' +
      '<span class="d7v-msg" role="status"></span></div></div>';
    var $ = function (s) { return root.querySelector(s); };
    var stage = $('.d7v-stage'), cv = $('.d7v-main'), mdc = $('.d7v-md'), ctx = cv.getContext('2d', { alpha: false }), pick = $('.d7v-pick');
    var nowEl = $('.d7v-now'), srcEl = $('.d7v-src'), fpsEl = $('.d7v-fps'), parEl = $('.d7v-par'), msg = $('.d7v-msg');

    /* picker */
    var groups = [G_K, G_F, G_C, G_A];
    groups.forEach(function (g) { var og = document.createElement('optgroup'); og.label = g + ' (' + REG.filter(function (r) { return r.group === g; }).length + ')'; REG.filter(function (r) { return r.group === g; }).forEach(function (r) { var o = document.createElement('option'); o.value = 'g' + r.id; o.textContent = r.name; og.appendChild(o); }); pick.appendChild(og); });
    var mdg = document.createElement('optgroup'); mdg.label = 'MilkDrop (butterchurn)'; var mo0 = document.createElement('option'); mo0.value = 'm:'; mo0.textContent = '🌀 MilkDrop — losowy preset'; mdg.appendChild(mo0); pick.appendChild(mdg);
    var radioSel = $('.d7v-radio'), o0 = document.createElement('option'); o0.value = '-1'; o0.textContent = '— bez radia (symulacja beatu) —'; radioSel.appendChild(o0);
    stations().forEach(function (s, i) { var o = document.createElement('option'); o.value = i; o.textContent = s[0]; radioSel.appendChild(o); });
    $('.d7v-layers').value = ST.layers; $('.d7v-res').value = ST.res; $('.d7v-auto').checked = !!ST.auto; $('.d7v-every').value = String(ST.every);

    /* audio state */
    var A = { bass: 0, mid: 0, high: 0, level: 0, beat: 0, beats: 0 };
    var actx = null, analyser = null, fdata = null, audioEl = null, realAudio = false, sim = { next: 0 };
    var energyAvg = 0, lastBeat = 0;
    function toast(m) { msg.textContent = m; clearTimeout(toast.t); toast.t = setTimeout(function () { msg.textContent = ''; }, 5000); }

    /* layers / current gens */
    var layers = []; var curIdx = ST.sel; var mdMode = false;
    function mkLayer(idx) { var c = document.createElement('canvas'); return { cv: c, cx: c.getContext('2d'), gen: REG[idx].make(), idx: idx }; }
    function pickIdx(excl) { var i; do { i = M.random() * REG.length | 0; } while (excl && excl.indexOf(i) >= 0); return i; }
    function setLayers(first, n) {
      layers = [mkLayer(first)]; var used = [first];
      for (var i = 1; i < n; i++) { var j = pickIdx(used); used.push(j); layers.push(mkLayer(j)); }
      curIdx = first; ST.sel = first; pick.value = 'g' + first; updateNow();
    }
    function updateNow() { nowEl.textContent = layers.map(function (l) { return REG[l.idx].name; }).join(' + '); parEl.textContent = layers[0] && layers[0].gen.params ? layers[0].gen.params() : ''; }
    function sizeCanvas() {
      var r = stage.getBoundingClientRect(), cw = M.max(2, r.width), ch = M.max(2, r.height), dpr = M.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2), w, h;
      if (ST.res === 'native') { w = cw * dpr; h = ch * dpr; var cap = MOBILE ? 1280 : 2560; if (w > cap) { h = h * cap / w; w = cap; } }
      else { h = +ST.res; w = h * cw / ch; }
      w = M.max(64, w | 0); h = M.max(64, h | 0);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; layers.forEach(function (l) { l.cv.width = w; l.cv.height = h; l.cx.fillStyle = '#000'; l.cx.fillRect(0, 0, w, h); }); }
      if (mdViz) { try { mdc.width = w; mdc.height = h; mdViz.setRendererSize(w, h); } catch (e) { } }
    }

    /* MilkDrop */
    var mdViz = null, mdPresets = null, mdKeys = [], mdCtx = null, mdFake = null, mdLoading = false;
    function resolveBc() { var m = window.butterchurn; if (!m) return null; if (typeof m.createVisualizer === 'function') return m; if (m.default && typeof m.default.createVisualizer === 'function') return m.default; return null; }
    function loadScript(src) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('404 ' + src)); }; document.head.appendChild(s); }); }
    function ensureMD() {
      if (mdViz) return Promise.resolve(true); if (mdLoading) return Promise.resolve(false); mdLoading = true; toast('ładuję MilkDrop (butterchurn)…');
      var p = Promise.resolve();
      if (!resolveBc()) p = p.then(function () { return loadScript(BASE + 'libs/butterchurn.min.js'); });
      if (!window.butterchurnPresets) p = p.then(function () { return loadScript(BASE + 'libs/butterchurnPresets.min.js'); });
      return p.then(function () {
        var bc = resolveBc(); if (!bc) throw new Error('butterchurn niedostępny');
        mdPresets = {}; try { Object.assign(mdPresets, butterchurnPresets.getPresets()); } catch (e) { } try { if (window.butterchurnPresetsExtra) Object.assign(mdPresets, butterchurnPresetsExtra.getPresets()); } catch (e) { }
        mdKeys = Object.keys(mdPresets); if (!mdKeys.length) throw new Error('brak presetów');
        mdCtx = getACtx(); mdc.width = cv.width; mdc.height = cv.height;
        mdViz = bc.createVisualizer(mdCtx, mdc, { width: cv.width, height: cv.height, pixelRatio: 1, textureRatio: 1 });
        connectMD();
        mdKeys.forEach(function (k) { var o = document.createElement('option'); o.value = 'm:' + k; o.textContent = '🌀 ' + k; mdg.appendChild(o); });
        mdg.label = 'MilkDrop (' + mdKeys.length + ' presetów)'; mdLoading = false; return true;
      }).catch(function (e) { mdLoading = false; toast('MilkDrop: ' + e.message); return false; });
    }
    function getACtx() { if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); } if (actx.state === 'suspended') actx.resume().catch(function () { }); return actx; }
    function ensureFake() { /* cicha ścieżka beatowa dla MilkDropa (nie trafia do głośników) */
      if (mdFake || !actx) return; var o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 60; g.gain.value = 0; o.connect(g); o.start(); mdFake = { o: o, g: g };
    }
    function connectMD() { if (!mdViz || !actx) return; try { if (realAudio && analyser) mdViz.connectAudio(analyser); else { ensureFake(); mdViz.connectAudio(mdFake.g); } } catch (e) { } }
    function mdLoad(key, blend) { if (!mdViz) return; if (!key) key = mdKeys[M.random() * mdKeys.length | 0]; try { mdViz.loadPreset(mdPresets[key], blend == null ? 2 : blend); } catch (e) { } nowEl.textContent = '🌀 ' + key; parEl.textContent = ''; pick.value = 'm:' + key; }
    function setMD(on, key) {
      if (on) { ensureMD().then(function (ok) { if (!ok) return; mdMode = true; mdc.hidden = false; cv.hidden = true; sizeCanvas(); getACtx(); connectMD(); mdLoad(key, 0); }); }
      else { mdMode = false; mdc.hidden = true; cv.hidden = false; }
    }

    /* radio */
    function stopRadio() { if (audioEl) { try { audioEl.pause(); audioEl.removeAttribute('src'); audioEl.load(); } catch (e) { } audioEl = null; } analyser = null; realAudio = false; $('.d7v-play').textContent = '▶ Radio'; srcEl.textContent = 'beat: symulacja ' + ST.bpm + ' BPM'; if (mdViz) connectMD(); }
    function playRadio(idx, noCors) {
      stopRadio(); var S = stations()[idx]; if (!S) return; var el = new Audio(); audioEl = el; el.preload = 'none';
      if (!noCors) el.crossOrigin = 'anonymous'; el.volume = .9; el.src = S[1]; var gotCors = !noCors;
      var ac = getACtx();
      if (gotCors && ac) { try { var node = ac.createMediaElementSource(el); analyser = ac.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = .6; node.connect(analyser); analyser.connect(ac.destination); fdata = new Uint8Array(analyser.frequencyBinCount); } catch (e) { analyser = null; gotCors = false; } }
      el.addEventListener('error', function () { if (el !== audioEl) return; if (!noCors) { toast('CORS/stream: próbuję bez analizatora (beat symulowany)'); playRadio(idx, true); } else { toast('Stacja niedostępna — wybierz inną'); stopRadio(); } });
      el.addEventListener('playing', function () { if (el !== audioEl) return; realAudio = !!(analyser && gotCors); srcEl.textContent = realAudio ? 'beat: audio z radia (analizator)' : 'beat: symulacja (stacja bez CORS)'; $('.d7v-play').textContent = '⏹ Radio'; if (mdViz) connectMD(); });
      var pr = el.play(); if (pr && pr.catch) pr.catch(function (e) { toast(e && e.name === 'NotAllowedError' ? 'Kliknij ▶ Radio, aby włączyć dźwięk' : 'play: ' + (e && e.message)); });
      toast('łączę: ' + S[0]); ST.station = idx;
    }
    $('.d7v-play').onclick = function () { if (audioEl) { stopRadio(); return; } var i = +radioSel.value; if (i < 0) { i = 0; radioSel.value = '0'; } playRadio(i); };
    radioSel.onchange = function () { var i = +radioSel.value; if (i < 0) stopRadio(); else playRadio(i); };

    /* analiza + beat */
    function analyse(now) {
      A.beat = 0;
      if (realAudio && analyser && actx && !audioEl.paused) {
        analyser.getByteFrequencyData(fdata); var n = fdata.length, b = 0, m = 0, h = 0, i;
        for (i = 1; i < 6; i++) b += fdata[i]; b /= 5 * 255; for (i = 6; i < 40; i++) m += fdata[i]; m /= 34 * 255; for (i = 40; i < n; i++) h += fdata[i]; h /= (n - 40) * 255;
        A.bass += (b - A.bass) * .5; A.mid += (m - A.mid) * .4; A.high += (h - A.high) * .4; A.level = (A.bass + A.mid + A.high) / 3 * 1.6;
        energyAvg += (b - energyAvg) * .04; if (b > energyAvg * 1.25 + .04 && now - lastBeat > 280) { A.beat = 1; lastBeat = now; }
      } else {
        var per = 60000 / ST.bpm; if (now >= sim.next) { sim.next = now + per; A.beat = 1; lastBeat = now; }
        var ph = (now - lastBeat) / per, env = M.exp(-ph * 4);
        A.bass = .15 + .75 * env; A.mid = .25 + .2 * M.abs(M.sin(now * .004)); A.high = .2 + .15 * M.abs(M.sin(now * .011)); A.level = (A.bass + A.mid + A.high) / 3 * 1.3;
        if (A.beat && mdFake && actx) { try { var g = mdFake.g.gain, tt = actx.currentTime; g.cancelScheduledValues(tt); g.setValueAtTime(1, tt); g.exponentialRampToValueAtTime(.001, tt + .25); } catch (e) { } }
      }
      if (A.beat) { A.beats++; if (ST.auto && A.beats % (+ST.every || 16) === 0) nextRandom(true); }
    }

    /* kontrola wyboru */
    function selectGen(idx) { if (mdMode) setMD(false); setLayers(idx, +ST.layers); save(); sizeCanvas(); }
    function nextRandom(auto) {
      if (mdMode || (pick.value || '').indexOf('m:') === 0) { if (mdViz) mdLoad(null, 2.5); return; }
      setLayers(pickIdx([curIdx]), +ST.layers); sizeCanvas(); if (!auto) save();
    }
    pick.onchange = function () { var v = pick.value; if (v.indexOf('m:') === 0) { var key = v.slice(2); setMD(true, key || null); } else selectGen(+v.slice(1)); };
    $('.d7v-prev').onclick = function () { if (mdMode) { mdLoad(null); return; } selectGen((curIdx + REG.length - 1) % REG.length); };
    $('.d7v-next').onclick = function () { if (mdMode) { mdLoad(null); return; } selectGen((curIdx + 1) % REG.length); };
    $('.d7v-rnd').onclick = function () { nextRandom(false); };
    $('.d7v-mut').onclick = function () { layers.forEach(function (l) { l.gen.reroll && l.gen.reroll(); }); updateNow(); toast('Mutacja parametrów (losowanie)'); };
    $('.d7v-auto').onchange = function () { ST.auto = this.checked; save(); };
    $('.d7v-every').onchange = function () { ST.every = +this.value; save(); };
    $('.d7v-layers').onchange = function () { ST.layers = +this.value; if (mdMode) setMD(false); setLayers(curIdx, ST.layers); sizeCanvas(); save(); };
    $('.d7v-res').onchange = function () { ST.res = this.value; sizeCanvas(); save(); };
    $('.d7v-md-btn').onclick = function () { if (mdMode) setMD(false); else setMD(true, null); };

    /* fullscreen: API + dwuklik/double-tap; iPhone → pseudo-fullscreen CSS */
    function isFS() { return document.fullscreenElement === root || document.webkitFullscreenElement === root || root.classList.contains('d7v-fake'); }
    function enterFS() { var rq = root.requestFullscreen || root.webkitRequestFullscreen; if (rq) { try { var p = rq.call(root); if (p && p.catch) p.catch(function () { fake(true); }); } catch (e) { fake(true); } } else fake(true); }
    function exitFS() { if (root.classList.contains('d7v-fake')) { fake(false); return; } var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) { try { ex.call(document); } catch (e) { } } }
    function fake(on) { root.classList.toggle('d7v-fake', on); document.documentElement.classList.toggle('d7v-lock', on); setTimeout(sizeCanvas, 60); }
    function toggleFS() { isFS() ? exitFS() : enterFS(); }
    $('.d7v-fs').onclick = toggleFS; $('.d7v-fsx').onclick = exitFS;
    stage.addEventListener('dblclick', toggleFS);
    var lastTap = 0; stage.addEventListener('touchend', function (e) { var n = Date.now(); if (n - lastTap < 350) { e.preventDefault(); toggleFS(); lastTap = 0; } else lastTap = n; });
    function fsChange() { var on = isFS(); root.classList.toggle('d7v-fs-on', on); setTimeout(sizeCanvas, 80); }
    document.addEventListener('fullscreenchange', fsChange); document.addEventListener('webkitfullscreenchange', fsChange);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('d7v-fake')) fake(false); });
    var idleT; function wake() { root.classList.remove('d7v-idle'); clearTimeout(idleT); idleT = setTimeout(function () { if (isFS()) root.classList.add('d7v-idle'); }, 3500); }
    ['mousemove', 'touchstart', 'keydown'].forEach(function (ev) { root.addEventListener(ev, wake, { passive: true }); });

    /* pętla */
    var vis = true, running = true, lastT = 0, t0 = performance.now(), fcount = 0, ftime = 0, slow = 0, lastFpsT = performance.now();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: .02 }).observe(root);
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(frame); });
    window.addEventListener('resize', function () { clearTimeout(sizeCanvas.t); sizeCanvas.t = setTimeout(sizeCanvas, 150); });
    function frame(ts) {
      if (!running) return; requestAnimationFrame(frame);
      if (!vis) return; var minDt = 1000 / ST.fps; if (ts - lastT < minDt - 2) return; var dt = ts - lastT; lastT = ts;
      var t = (ts - t0) / 1000; analyse(ts);
      var w = cv.width, h = cv.height;
      if (mdMode && mdViz) { try { mdViz.render(); } catch (e) { } }
      else {
        for (var i = 0; i < layers.length; i++) { var L = layers[i], g = L.gen, c = L.cx; c.globalCompositeOperation = 'source-over'; var f = g.fade == null ? 1 : g.fade; c.fillStyle = f >= 1 ? '#000' : 'rgba(0,0,0,' + f + ')'; c.fillRect(0, 0, w, h); try { g.draw(c, w, h, t + i * 17, A, i); } catch (e) { g.draw = function () { }; toast('Błąd generatora ' + REG[L.idx].name); } c.globalCompositeOperation = 'source-over'; }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(layers[0].cv, 0, 0);
        for (var j = 1; j < layers.length; j++) { ctx.globalCompositeOperation = j % 2 ? 'lighter' : 'screen'; ctx.globalAlpha = .75; ctx.drawImage(layers[j].cv, 0, 0); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      /* auto-jakość: jeśli klatki > 45 ms przez ~2 s, zejdź niżej z rozdzielczością */
      fcount++; ftime += dt; if (ts - lastFpsT > 1000) { var fps = fcount * 1000 / (ts - lastFpsT); fpsEl.textContent = fps.toFixed(0) + ' fps · ' + w + '×' + h; if (!isFS() && ftime / fcount > 45) slow++; else slow = 0; fcount = 0; ftime = 0; lastFpsT = ts;
        if (slow >= 3 && (ST.res === '1080' || ST.res === 'native' || ST.res === '720')) { ST.res = ST.res === '720' ? '480' : '720'; $('.d7v-res').value = ST.res; sizeCanvas(); toast('Auto-jakość: zmniejszono do ' + ST.res + 'p'); slow = 0; } }
    }
    setLayers(ST.sel >= 0 && ST.sel < REG.length ? ST.sel : 0, +ST.layers); sizeCanvas();
    requestAnimationFrame(frame);
    var api = { registry: REG, state: ST, A: A, select: selectGen, random: function () { nextRandom(false); }, setLayers: function (n) { $('.d7v-layers').value = n; $('.d7v-layers').onchange(); }, fullscreen: toggleFS, md: setMD, play: playRadio, stop: stopRadio, root: root, resize: sizeCanvas, isMilkdrop: function () { return mdMode; }, beatSource: function () { return realAudio ? 'audio' : 'sim'; } };
    return api;
  }

  var D7V = { REG: REG, groups: function () { var o = {}; REG.forEach(function (r) { o[r.group] = (o[r.group] || 0) + 1; }); return o; }, count: REG.length, init: init, instance: null };
  window.D7Visions = D7V;
  function boot() {
    var root = document.getElementById('d7-visions'); if (!root) return;
    if (!window.D7_STATIONS && !document.querySelector('script[src*="d7-stations"]')) { var s = document.createElement('script'); s.src = BASE + 'js/d7-stations.js'; s.onload = function () { D7V.instance = init(root); }; s.onerror = function () { D7V.instance = init(root); }; document.head.appendChild(s); }
    else D7V.instance = init(root);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
