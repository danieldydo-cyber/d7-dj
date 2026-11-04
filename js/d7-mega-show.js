/* D7 Mega Show 777 · Nova technology (2026-11-04)
   WebGL2/1 visualizer: 12 base effects x 8 palettes x seeded params = 777 variants,
   crossfade every 7 s, magic transition every 13 s, beat detection (bass onset + BPM, default 120),
   pulses on 2 beats, accents on 4, recording canvas + audio (radio / local file). */
(function () {
  'use strict';
  if (window.D7MegaShow) return;
  var BASE = (function () { var s = document.currentScript && document.currentScript.src || ''; return s.replace(/js\/d7-mega-show\.js.*$/, ''); })();
  var FALLBACK_ST = [
    ['SomaFM DEF CON (techno)', 'https://ice1.somafm.com/defcon-128-mp3'],
    ['SomaFM Beat Blender (deep house)', 'https://ice2.somafm.com/beatblender-128-mp3'],
    ['Bassdrive (drum & bass)', 'https://ice.bassdrive.net/stream'],
    ['Radio Paradise', 'https://stream.radioparadise.com/mp3-128']];
  var EFFECTS = ['Tunel neonowy', 'Plazma fraktal', 'Pierścienie fali', 'Neonowa siatka', 'Cząsteczki galaktyki', 'Kalejdoskop', 'Julia fraktal', 'Komórki Voronoi', 'Spirala hipnozy', 'Zorza', 'Hiper-sfery', 'Laserowe promienie'];
  var PALETTES = ['Cyber', 'Zachód słońca', 'Ocean', 'Toxic', 'Złoto', 'Ultrafiolet', 'Lód', 'Ogień'];
  var TRANS = ['Morph', 'Kalejdoskop', 'Flash', 'Wir', 'Pikselowy rozpad'];
  var N = 777;

  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function preset(i) { // seeded 777 variants
    i = ((i % N) + N) % N;
    return { id: i + 1, eff: i % EFFECTS.length, pal: Math.floor(i / EFFECTS.length) % PALETTES.length,
      p: [hash(i + 1), hash(i + 2.3), hash(i + 5.7), hash(i + 9.1)],
      name: 'Nova #' + (i + 1) + ' · ' + EFFECTS[i % EFFECTS.length] + ' · ' + PALETTES[Math.floor(i / EFFECTS.length) % PALETTES.length] };
  }

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 R;uniform float T,BASS,MID,HI,PULSE2,ACC4,MIXV,TRT,BEATPH;',
    'uniform float EA,EB,PA,PB;uniform vec4 QA,QB;uniform sampler2D WAVE;',
    '#define PI 3.14159265',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    'float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'vec3 pal(float t,float k){vec3 a=vec3(.5),b=vec3(.5),c=vec3(1.),d;',
    ' if(k<.5)d=vec3(.0,.33,.67);else if(k<1.5){d=vec3(.0,.1,.2);c=vec3(1.,1.,.5);}else if(k<2.5)d=vec3(.5,.6,.7);else if(k<3.5){d=vec3(.25,.0,.55);c=vec3(1.,.7,.4);}',
    ' else if(k<4.5){d=vec3(.0,.15,.3);b=vec3(.5,.4,.2);}else if(k<5.5)d=vec3(.7,.9,.3);else if(k<6.5){d=vec3(.55,.6,.65);b=vec3(.3,.4,.5);}else{d=vec3(.0,.08,.15);c=vec3(1.,.5,.25);}',
    ' return a+b*cos(6.2831*(c*t+d));}',
    'float wave(float x){return texture2D(WAVE,vec2(x,.5)).r*2.-1.;}',
    'vec3 eff(float e,float k,vec4 q,vec2 uv){float t=T*(.3+q.x*.7);vec3 c=vec3(0.);float b=BASS,l=length(uv),an=atan(uv.y,uv.x);',
    ' if(e<.5){float z=1./(l+.05)+t*2.+b;float s=floor(3.+q.y*8.);float m=sin(an*s+z*3.)*.5+.5;c=pal(z*.1+m*.2,k)*m*(1.-exp(-l*3.))*(1.5+b);c+=pal(z*.05,k)*.25/(l*6.+.2);}',
    ' else if(e<1.5){vec2 p=uv*(2.+q.y*3.);for(int i=0;i<6;i++){p=abs(p)/dot(p,p)-(.6+.3*q.z+.1*sin(t*.3));p*=rot(t*.05);}c=pal(length(p)*.15+t*.05,k)*(.6+b);}',
    ' else if(e<2.5){for(int i=0;i<6;i++){float fi=float(i);float r=.15+fi*.13+wave(fract(an/6.2831+fi*.1))*.06*(1.+b*2.);float d=abs(l-r-.03*sin(t+fi));c+=pal(fi*.12+t*.1,k)*.006/(d+.002)*(.4+MID);}}',
    ' else if(e<3.5){vec2 p=uv;p.y+=.35;float persp=1./max(.04,abs(p.y));vec2 g=vec2(p.x*persp,persp+t*(2.+q.y*3.));vec2 f=abs(fract(g)-.5);float line=min(f.x,f.y);c=pal(g.y*.05,k)*(.02/(line+.02))*smoothstep(.0,.6,abs(p.y))*(1.+b);float sun=smoothstep(.32,.3,length(uv-vec2(0.,.25)));c+=pal(.1+uv.y,k)*sun*step(.0,sin(uv.y*60.-t*4.)+.6)*.9;}',
    ' else if(e<4.5){for(int i=0;i<40;i++){float fi=float(i);vec2 s=vec2(h21(vec2(fi,q.x)),h21(vec2(q.y,fi)))*2.-1.;float z=fract(h21(vec2(fi,fi))+t*.15*(1.+q.z));s/=z*1.5+.1;s*=rot(t*.1);float d=length(uv-s*.3);c+=pal(fi*.03+t*.03,k)*.0016/(d*d+.0004)*(1.-z)*(.5+b);}c+=pal(l+t*.1,k)*.06/(l+.3);}',
    ' else if(e<5.5){float s=floor(4.+q.y*8.);float a=mod(an,2.*PI/s);a=abs(a-PI/s);vec2 p=vec2(cos(a),sin(a))*l;p*=rot(t*.2);p=fract(p*(2.+q.z*3.)+t*.1)-.5;float d=length(p);c=pal(d+l+t*.1,k)*smoothstep(.5,.0,d)*(1.+b*1.4);c+=pal(an*.1,k)*.3*sin(d*30.-t*4.);}',
    ' else if(e<6.5){vec2 z=uv*1.6;vec2 cc=vec2(-.75+.2*sin(t*.2+q.y*6.),.15+.15*cos(t*.17+q.z*6.));float it=0.;for(int i=0;i<64;i++){z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+cc;if(dot(z,z)>8.)break;it++;}c=pal(it/64.*2.+t*.05,k)*(it<63.?sqrt(it/64.)*1.6:0.)*(.8+b);}',
    ' else if(e<7.5){vec2 p=uv*(3.+q.y*4.);vec2 ip=floor(p),fp=fract(p);float md=9.,md2=9.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(x,y);vec2 r=o+.5+.45*sin(t+6.2831*vec2(h21(ip+o),h21(ip+o+3.)))-fp;float d=dot(r,r);if(d<md){md2=md;md=d;}else if(d<md2)md2=d;}float e2=sqrt(md2)-sqrt(md);c=pal(md+t*.1,k)*(.03/(e2+.02))*(.5+b);}',
    ' else if(e<8.5){float s=sin(l*(20.+q.y*30.)-t*5.+an*floor(1.+q.z*6.)+b*4.);c=pal(l-t*.1+an/6.2831,k)*smoothstep(.0,1.,s)*(1.2-l*.5)*(1.+b);}',
    ' else if(e<9.5){vec2 p=uv;for(int i=1;i<6;i++){float fi=float(i);p.y+=.25*sin(p.x*fi*1.3+t*(.5+q.y)+fi)*(.4+b*.4)/fi;c+=pal(fi*.15+p.x*.2+t*.04,k)*.025/abs(p.y-.2*fi+.6);}}',
    ' else if(e<10.5){vec3 ro=vec3(0.,0.,-3.+sin(t*.3)),rd=normalize(vec3(uv,1.5));float d0=0.;for(int i=0;i<48;i++){vec3 p=ro+rd*d0;p.xy*=rot(t*.2);p.xz*=rot(t*.15);p=mod(p+1.5,3.)-1.5;float d=length(p)-(.5+.25*b+.1*q.y);if(d<.001)break;d0+=d;if(d0>20.)break;}float f=exp(-d0*.15);c=pal(d0*.08+t*.05,k)*f*1.6;}',
    ' else{float s=floor(6.+q.y*18.);float a=an+t*(.2+q.z);float ray=pow(abs(sin(a*s*.5)),20.+q.x*60.);c=pal(a*.05+t*.1,k)*ray*(.3/(l+.1))*(.6+HI*2.+b);c+=pal(.5,k)*.02/(l*l+.01)*b;}',
    ' return c;}',
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y);',
    ' uv*=1.-.06*PULSE2-.1*ACC4;',
    ' float m=MIXV;vec2 ua=uv,ub=uv;',
    ' if(TRT>.5&&TRT<1.5){float s=6.;float an=atan(uv.y,uv.x),l=length(uv);float k2=mod(an,2.*PI/s);k2=abs(k2-PI/s);vec2 kv=vec2(cos(k2),sin(k2))*l;float w=sin(m*PI);ua=mix(uv,kv,w);ub=ua;}',
    ' else if(TRT>2.5&&TRT<3.5){float w=sin(m*PI);ua=uv*rot(w*4.*(1.-length(uv)));ub=uv*rot(-w*4.*(1.-length(uv)));}',
    ' else if(TRT>3.5){float w=sin(m*PI);float px=mix(1.,60.,1.-w)+1.;ua=floor(uv*px*4.)/(px*4.);ub=ua;}',
    ' vec3 ca=eff(EA,PA,QA,ua),cb=eff(EB,PB,QB,ub);',
    ' float mm=smoothstep(0.,1.,m);',
    ' if(TRT<.5){mm=smoothstep(m-.2,m+.2,length(uv)*.7+.15*sin(atan(uv.y,uv.x)*5.+T));}',
    ' vec3 c=mix(ca,cb,mm);',
    ' if(TRT>1.5&&TRT<2.5)c+=vec3(1.)*pow(sin(m*PI),8.)*2.;',
    ' c*=1.+.25*PULSE2+.5*ACC4;c+=vec3(.9,.6,1.)*ACC4*.08;',
    ' c*=1.-.35*dot(uv*.8,uv*.8);',
    ' c=aces(c*1.15);c=pow(c,vec3(.92));',
    ' c+=(h21(gl_FragCoord.xy+fract(T))-.5)/255.;',
    ' gl_FragColor=vec4(c,1.);}'].join('\n');

  var CSS = '.d7ms{position:relative;width:100%;height:100%;background:#000;overflow:hidden;font:14px system-ui;color:#eaf6ff}' +
    '.d7ms.d7ms-ov{position:fixed;inset:0;z-index:2147483000}.d7ms canvas{position:absolute;inset:0;width:100%;height:100%;display:block}' +
    '.d7ms-bar{position:absolute;left:0;right:0;top:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;background:linear-gradient(#000c,#0000);transition:opacity .4s;z-index:2}' +
    '.d7ms-idle .d7ms-bar,.d7ms-idle .d7ms-info{opacity:0}.d7ms button,.d7ms select,.d7ms label.d7ms-f{background:#111a;border:1px solid #3fc8;color:#eaf6ff;border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer;backdrop-filter:blur(6px)}' +
    '.d7ms button.on{background:#3fc;color:#000}.d7ms .d7ms-rec.on{background:#f24;color:#fff;border-color:#f24}.d7ms select{max-width:220px}' +
    '.d7ms-nova{font-weight:800;letter-spacing:.12em;background:linear-gradient(90deg,#3ff,#a6f,#f3a,#ffd23f);-webkit-background-clip:text;background-clip:text;color:transparent;margin-right:6px}' +
    '.d7ms-info{position:absolute;left:10px;bottom:10px;right:10px;display:flex;gap:12px;flex-wrap:wrap;font-size:12px;text-shadow:0 0 6px #000;transition:opacity .4s;z-index:2}' +
    '.d7ms-msg{position:absolute;left:50%;top:64px;transform:translateX(-50%);max-width:90%;background:#200c;border:1px solid #f668;padding:8px 12px;border-radius:10px;z-index:3;display:none}' +
    '.d7ms-beat{display:inline-block;width:10px;height:10px;border-radius:50%;background:#333;margin-right:3px}.d7ms-beat.b{background:#3fc;box-shadow:0 0 8px #3fc}' +
    '.d7ms-launch{position:fixed;right:14px;bottom:14px;z-index:99990;background:linear-gradient(135deg,#3ff,#a6f,#f3a);color:#000;font:700 14px system-ui;border:0;border-radius:24px;padding:10px 16px;box-shadow:0 4px 20px #a6f8;cursor:pointer}';

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function create(host, opts) {
    opts = opts || {};
    if (!document.getElementById('d7ms-css')) { var st = el('style', { id: 'd7ms-css' }); st.textContent = CSS; document.head.appendChild(st); }
    var root = el('div', { 'class': 'd7ms' + (opts.overlay ? ' d7ms-ov' : '') });
    var cv = el('canvas'); root.appendChild(cv);
    var bar = el('div', { 'class': 'd7ms-bar' });
    bar.innerHTML = '<span class="d7ms-nova">NOVA TECHNOLOGY · MEGA SHOW 777</span>' +
      '<select class="d7ms-st" title="Stacja radiowa"></select>' +
      '<label class="d7ms-f" title="Własny utwór z urządzenia">🎵 Utwór<input type="file" accept="audio/*,video/*" hidden></label>' +
      '<button class="d7ms-play">▶ Graj</button>' +
      '<button class="d7ms-prev" title="Poprzednia">⏮</button><button class="d7ms-next" title="Następna">⏭</button>' +
      '<button class="d7ms-rnd on" title="Losowe wizje z 777">🎲 Losowo 777</button>' +
      '<button class="d7ms-auto on" title="Przejścia 7 s / magia 13 s">✨ Przejścia 7/13 s</button>' +
      '<button class="d7ms-fs">⛶ Pełny ekran</button>' +
      '<button class="d7ms-rec">⏺ Nagraj</button>' +
      '<button class="d7ms-mega">🌌 MEGA SHOW</button>' +
      (opts.overlay ? '<button class="d7ms-close">✕ Zamknij</button>' : '');
    root.appendChild(bar);
    var info = el('div', { 'class': 'd7ms-info' }, '<span class="d7ms-name"></span><span class="d7ms-bpm"></span><span class="d7ms-beats"><i class="d7ms-beat"></i><i class="d7ms-beat"></i><i class="d7ms-beat"></i><i class="d7ms-beat"></i></span><span class="d7ms-src"></span><span class="d7ms-time"></span>');
    root.appendChild(info);
    var msg = el('div', { 'class': 'd7ms-msg' }); root.appendChild(msg);
    host.appendChild(root);
    var $ = function (s) { return root.querySelector(s); };

    function say(t, ms) { msg.textContent = t; msg.style.display = t ? 'block' : 'none'; clearTimeout(say.t); if (t && ms) say.t = setTimeout(function () { msg.style.display = 'none'; }, ms); }

    // --- WebGL ---
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) { say('Twoja przeglądarka nie obsługuje WebGL.'); return null; }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['R', 'T', 'BASS', 'MID', 'HI', 'PULSE2', 'ACC4', 'MIXV', 'TRT', 'BEATPH', 'EA', 'EB', 'PA', 'PB', 'QA', 'QB', 'WAVE'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var waveBytes = new Uint8Array(512); for (var wi = 0; wi < 512; wi++) waveBytes[wi] = 128;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, waveBytes);
    gl.uniform1i(U.WAVE, 0);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5), w = Math.max(2, Math.round(root.clientWidth * dpr)), h = Math.max(2, Math.round(root.clientHeight * dpr));
      var px = w * h, max = 3840 * 2160; if (px > max) { var k = Math.sqrt(max / px); w = Math.round(w * k); h = Math.round(h * k); }
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    }

    // --- state ---
    var S = { cur: preset(Math.floor(Math.random() * N)), nxt: null, mix: 0, trType: 0, trDur: 1.6, trStart: 0, random: true, auto: true, idx: 0,
      lastSwitch: 0, lastMagic: 0, bpm: 120, beat: 0, lastBeatT: 0, onsets: [], bassAvg: 0, pulse2: 0, acc4: 0, bass: 0, mid: 0, hi: 0 };
    S.idx = S.cur.id - 1;
    function pick() { if (S.random) S.idx = Math.floor(Math.random() * N); else S.idx = (S.idx + 1) % N; return preset(S.idx); }
    function go(p, type, dur) { if (S.nxt) S.cur = S.nxt; S.nxt = p; S.mix = 0; S.trType = type; S.trDur = dur; S.trStart = now(); showName(); }
    function showName() { var p = S.nxt || S.cur; $('.d7ms-name').textContent = p.name + (S.nxt ? ' · przejście: ' + TRANS[S.trType] : ''); }
    function now() { return performance.now() / 1000; }

    // --- audio ---
    var AC = null, an = null, dest = null, audio = null, srcNode = null, fileUrl = null, fft, td, playing = false, corsOK = true, silentSince = 0;
    function ensureCtx() {
      if (AC) return;
      AC = new (window.AudioContext || window.webkitAudioContext)();
      an = AC.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = .6;
      dest = AC.createMediaStreamDestination();
      an.connect(AC.destination); an.connect(dest);
      fft = new Uint8Array(an.frequencyBinCount); td = new Uint8Array(an.fftSize);
      audio = new Audio(); audio.crossOrigin = 'anonymous'; audio.preload = 'none';
      srcNode = AC.createMediaElementSource(audio); srcNode.connect(an);
      audio.addEventListener('error', function () {
        if (!audio.src || audio.src === location.href) return;
        playing = false; $('.d7ms-play').textContent = '▶ Graj';
        if (audio.dataset.kind === 'radio') say('Ta stacja blokuje dostęp (CORS) albo jest offline — nie da się jej analizować ani nagrać z dźwiękiem. Wybierz inną stację z listy albo wczytaj własny utwór (🎵 Utwór).', 9000);
        else say('Nie udało się odtworzyć pliku. Spróbuj MP3/M4A/WAV/OGG.', 6000);
      });
      audio.addEventListener('playing', function () { playing = true; $('.d7ms-play').textContent = '⏸ Stop'; silentSince = now(); say(''); });
    }
    var stations = [];
    function buildStations() {
      var list = (window.D7_STATIONS && window.D7_STATIONS.length ? window.D7_STATIONS : FALLBACK_ST);
      stations = list.map(function (s) { return Array.isArray(s) ? { name: s[0], url: s[1] } : { name: s.name, url: s.url }; });
      var sel = $('.d7ms-st'); sel.innerHTML = '<option value="-1">📻 Wybierz radio…</option>' + stations.map(function (s, i) { return '<option value="' + i + '">' + s.name.replace(/</g, '&lt;') + '</option>'; }).join('');
    }
    function playRadio(i) {
      ensureCtx(); AC.resume(); var s = stations[i]; if (!s) return;
      audio.dataset.kind = 'radio'; audio.src = s.url; $('.d7ms-src').textContent = '📻 ' + s.name;
      say('Łączenie z: ' + s.name + '…', 3000);
      audio.play().catch(function (e) { if (e && e.name === 'NotAllowedError') say('Kliknij ▶ Graj, aby uruchomić dźwięk.', 5000); });
    }
    function playFile(f) {
      ensureCtx(); AC.resume(); if (fileUrl) URL.revokeObjectURL(fileUrl); fileUrl = URL.createObjectURL(f);
      audio.dataset.kind = 'file'; audio.src = fileUrl; audio.loop = true; $('.d7ms-src').textContent = '🎵 ' + f.name;
      audio.play().catch(function () {});
    }
    function togglePlay() {
      ensureCtx(); AC.resume();
      if (playing) { audio.pause(); playing = false; $('.d7ms-play').textContent = '▶ Graj'; return; }
      if (!audio.src || audio.src === location.href) { var v = +$('.d7ms-st').value; playRadio(v >= 0 ? v : 0); if (v < 0) $('.d7ms-st').value = '0'; }
      else audio.play().catch(function () {});
    }

    // --- beat detection: bass energy onset + BPM estimate ---
    function onBeat(t, real) {
      S.beat++; S.lastBeatT = t;
      if (S.beat % 2 === 0) S.pulse2 = 1;
      if (S.beat % 4 === 0) { S.acc4 = 1; }
      if (S.beat % 16 === 0 && S.auto && !S.nxt && t - S.lastSwitch > 3) { S.lastSwitch = t; go(pick(), 0, 1.2); } // phrase accent
      var dots = root.querySelectorAll('.d7ms-beat'); for (var i = 0; i < 4; i++) dots[i].className = 'd7ms-beat' + (i === (S.beat - 1) % 4 ? ' b' : '');
    }
    function analyse(t, dt) {
      var bass = 0, mid = 0, hi = 0, active = false;
      if (an && playing) {
        an.getByteFrequencyData(fft); an.getByteTimeDomainData(td);
        var sr = AC.sampleRate, bin = sr / an.fftSize, b1 = Math.max(1, Math.round(150 / bin)), m1 = Math.round(2000 / bin), h1 = Math.round(8000 / bin);
        for (var i = 1; i < b1; i++) bass += fft[i]; bass /= (b1 - 1) * 255;
        for (i = b1; i < m1; i++) mid += fft[i]; mid /= (m1 - b1) * 255;
        for (i = m1; i < h1; i++) hi += fft[i]; hi /= (h1 - m1) * 255;
        for (i = 0; i < 512; i++) waveBytes[i] = td[i * 2];
        active = bass + mid > 0.02;
        if (!active && audio.dataset.kind === 'radio' && t - silentSince > 6 && !S.warnedSilent) { S.warnedSilent = true; say('Brak sygnału do analizy (stacja może blokować CORS). Wizje działają na wirtualnym beacie 120 BPM. Wybierz inną stację lub własny utwór.', 9000); }
        if (active) { silentSince = t; S.warnedSilent = false; }
      }
      S.bass += (bass - S.bass) * .5; S.mid += (mid - S.mid) * .3; S.hi += (hi - S.hi) * .3;
      var period = 60 / S.bpm;
      if (active) {
        var thr = S.bassAvg * 1.25 + .03;
        if (bass > thr && t - S.lastBeatT > period * .55) {
          if (S.lastOnset) { var iv = t - S.lastOnset; if (iv > .3 && iv < 1.4) { S.onsets.push(iv); if (S.onsets.length > 16) S.onsets.shift(); } }
          S.lastOnset = t;
          if (S.onsets.length >= 4) { var a = S.onsets.slice().sort(); var med = a[a.length >> 1], bpm = 60 / med; while (bpm < 85) bpm *= 2; while (bpm > 175) bpm /= 2; S.bpm += (bpm - S.bpm) * .25; }
          onBeat(t, true);
        } else if (t - S.lastBeatT > period * 1.02) onBeat(t, false); // keep the grid when onsets drop out
        S.bassAvg += (bass - S.bassAvg) * .05;
      } else {
        if (t - S.lastBeatT >= period) onBeat(t, false); // default ~120 BPM virtual beat
        var vt = (t - S.lastBeatT) / period; S.bass = Math.max(S.bass, Math.exp(-vt * 6) * .5);
        for (var j = 0; j < 512; j++) waveBytes[j] = 128 + 60 * Math.sin(j * .05 + t * 3) * Math.exp(-vt * 3);
      }
      S.pulse2 *= Math.exp(-dt * 7); S.acc4 *= Math.exp(-dt * 4);
      $('.d7ms-bpm').textContent = '♩ ' + Math.round(S.bpm) + ' BPM' + (active ? '' : ' (wirtualny)');
    }

    // --- recording ---
    var rec = null, chunks = [], recStart = 0, recMime = '';
    function pickMime() {
      var c = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'];
      if (!window.MediaRecorder) return null;
      for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[i])) return c[i];
      return '';
    }
    function startRec() {
      var mime = pickMime(); if (mime === null || !cv.captureStream) { say('Ta przeglądarka nie obsługuje nagrywania (MediaRecorder / captureStream). Użyj Chrome, Edge lub Firefox.', 7000); return; }
      ensureCtx(); AC.resume();
      if (!playing) say('Nagrywam obraz — włącz radio lub utwór, żeby nagrać też dźwięk.', 6000);
      else if (audio.dataset.kind === 'radio' && S.warnedSilent) say('Uwaga: ta stacja nie przekazuje dźwięku do nagrania (CORS). Wybierz inną lub własny utwór.', 8000);
      var vs = cv.captureStream(60), tracks = vs.getVideoTracks().concat(dest.stream.getAudioTracks());
      var stream = new MediaStream(tracks);
      try { rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 12000000, audioBitsPerSecond: 192000 }); }
      catch (e) { try { rec = new MediaRecorder(stream); } catch (e2) { say('Nie udało się uruchomić nagrywania: ' + e2.message, 7000); return; } }
      recMime = rec.mimeType || mime || 'video/webm'; chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        var blob = new Blob(chunks, { type: recMime.split(';')[0] }), d = new Date();
        var ext = /mp4/.test(recMime) ? 'mp4' : 'webm';
        var name = 'D7-mega-show-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.' + ext;
        var a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        say('Zapisano: ' + name + ' (' + (blob.size / 1048576).toFixed(1) + ' MB)', 6000);
        $('.d7ms-time').textContent = '';
      };
      rec.start(1000); recStart = now();
      $('.d7ms-rec').classList.add('on'); $('.d7ms-rec').textContent = '⏹ Zatrzymaj';
    }
    function stopRec() { if (rec && rec.state !== 'inactive') rec.stop(); rec = null; $('.d7ms-rec').classList.remove('on'); $('.d7ms-rec').textContent = '⏺ Nagraj'; }

    // --- fullscreen ---
    function fs(on) {
      var isFs = document.fullscreenElement || document.webkitFullscreenElement;
      if (on === undefined) on = !isFs;
      if (on && !isFs) { var r = root.requestFullscreen || root.webkitRequestFullscreen; if (r) { var p = r.call(root); if (p && p.catch) p.catch(function () {}); } else root.classList.add('d7ms-ov'); }
      else if (!on && isFs) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
    function mega() {
      fs(true); S.random = true; S.auto = true; $('.d7ms-rnd').classList.add('on'); $('.d7ms-auto').classList.add('on');
      if (!playing) togglePlay();
      go(pick(), 1, 2.2); S.lastMagic = S.lastSwitch = now();
      if (!rec && confirm('MEGA SHOW: nagrywać pokaz do pliku wideo?')) startRec();
    }

    // --- UI wiring ---
    $('.d7ms-st').onchange = function () { var v = +this.value; if (v >= 0) playRadio(v); };
    $('input[type=file]').onchange = function () { if (this.files[0]) playFile(this.files[0]); };
    $('.d7ms-play').onclick = togglePlay;
    $('.d7ms-next').onclick = function () { go(pick(), 0, 1.2); S.lastSwitch = now(); };
    $('.d7ms-prev').onclick = function () { S.idx = (S.idx - 2 + N) % N; var r = S.random; S.random = false; go(pick(), 0, 1.2); S.random = r; };
    $('.d7ms-rnd').onclick = function () { S.random = !S.random; this.classList.toggle('on', S.random); };
    $('.d7ms-auto').onclick = function () { S.auto = !S.auto; this.classList.toggle('on', S.auto); };
    $('.d7ms-fs').onclick = function () { fs(); };
    $('.d7ms-rec').onclick = function () { rec ? stopRec() : startRec(); };
    $('.d7ms-mega').onclick = mega;
    if ($('.d7ms-close')) $('.d7ms-close').onclick = function () { destroy(); };
    cv.ondblclick = function () { fs(); };
    var idleT; function wake() { root.classList.remove('d7ms-idle'); clearTimeout(idleT); idleT = setTimeout(function () { if (document.fullscreenElement || opts.overlay) root.classList.add('d7ms-idle'); }, 3500); }
    root.addEventListener('mousemove', wake); root.addEventListener('touchstart', wake, { passive: true }); wake();

    if (!(window.D7_STATIONS && window.D7_STATIONS.length)) { var sc = el('script', { src: BASE + 'js/d7-stations.js' }); sc.onload = buildStations; sc.onerror = buildStations; document.head.appendChild(sc); }
    buildStations(); showName();

    // --- loop ---
    var alive = true, lastT = now(), t0 = lastT;
    S.lastSwitch = S.lastMagic = t0;
    function frame() {
      if (!alive) return; requestAnimationFrame(frame);
      var t = now(), dt = Math.min(.1, t - lastT); lastT = t;
      resize(); analyse(t, dt);
      if (S.auto) {
        if (t - S.lastMagic >= 13) { S.lastMagic = t; S.lastSwitch = t; go(pick(), 1 + Math.floor(Math.random() * 4), 2.0); } // magic every 13 s
        else if (t - S.lastSwitch >= 7) { S.lastSwitch = t; go(pick(), 0, 1.6); } // smooth crossfade every 7 s
      }
      if (S.nxt) { S.mix = Math.min(1, (t - S.trStart) / S.trDur); if (S.mix >= 1) { S.cur = S.nxt; S.nxt = null; S.mix = 0; showName(); } }
      var A = S.cur, B = S.nxt || S.cur;
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, waveBytes);
      gl.uniform2f(U.R, cv.width, cv.height); gl.uniform1f(U.T, t - t0);
      gl.uniform1f(U.BASS, S.bass); gl.uniform1f(U.MID, S.mid); gl.uniform1f(U.HI, S.hi);
      gl.uniform1f(U.PULSE2, S.pulse2); gl.uniform1f(U.ACC4, S.acc4); gl.uniform1f(U.MIXV, S.nxt ? S.mix : 0); gl.uniform1f(U.TRT, S.trType);
      gl.uniform1f(U.BEATPH, ((t - S.lastBeatT) * S.bpm / 60) % 1);
      gl.uniform1f(U.EA, A.eff); gl.uniform1f(U.EB, B.eff); gl.uniform1f(U.PA, A.pal); gl.uniform1f(U.PB, B.pal);
      gl.uniform4fv(U.QA, A.p); gl.uniform4fv(U.QB, B.p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (rec) { var s = Math.floor(t - recStart); $('.d7ms-time').textContent = '⏺ ' + pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
    }
    requestAnimationFrame(frame);
    function destroy() { alive = false; stopRec(); if (audio) audio.pause(); if (AC) AC.close(); fs(false); root.remove(); inst = null; }
    var api = { root: root, destroy: destroy, mega: mega, fullscreen: fs, startRec: startRec, stopRec: stopRec, next: function () { go(pick(), 0, 1.2); }, preset: preset, state: S };
    return api;
  }

  var inst = null;
  function open() { if (inst) return inst; inst = create(document.body, { overlay: true }); return inst; }
  window.D7MegaShow = { create: create, open: open, preset: preset, count: N, effects: EFFECTS, palettes: PALETTES };

  function boot() {
    var m = document.getElementById('d7ms-mount');
    if (m) { create(m, {}); return; }
    var css = document.getElementById('d7ms-css'); if (!css) { css = el('style', { id: 'd7ms-css' }); css.textContent = CSS; document.head.appendChild(css); }
    var b = el('button', { 'class': 'd7ms-launch', title: 'Mega Show 777 · Nova technology' }, '🌌 Mega Show 777');
    b.onclick = function () { open(); }; document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
