/* D7 Visions GL v1 — „77 generatorów wizji” + MilkDrop + radio. Self-mounting hero (js/d7-visions-gl.js + css/d7-visions-gl.css).
   Mount: <div id="d7g-mount"></div> (else inserted before <main>/#sx-app/body first child). API: window.D7VisionsGL.
   Generators = 21 procedural GLSL families x 77 named variants (seeded params), single-pass WebGL uber-shader, 1-4 layered (multi-point). */
(function () {
  'use strict';
  if (window.D7VisionsGL) return;
  var SCRIPT = (document.currentScript && document.currentScript.src) || '';
  var BASE = SCRIPT ? new URL('../', SCRIPT).href : '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lsGet(k, d) { try { var v = localStorage.getItem('d7g.' + k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem('d7g.' + k, v); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- 77 generators ---------- */
  var GROUPS = [
    { id: 'kal', label: 'Kalejdoskop', icon: '🔮', fam: [
      ['Szklany Witraż', 'Lodowy Kalejdoskop', 'Różowe Płatki', 'Diamentowy Młyn'],
      ['Mandala Słońca', 'Mandala Księżyca', 'Lotos 777', 'Różyczka Neonowa'],
      ['Fraktal Katedra', 'Kryształowa Jaskinia', 'Fraktal Smoka', 'Złoty Labirynt'],
      ['Plaster Miodu', 'Hex Matrix', 'Mozaika Cyber', 'Szklane Płytki'],
      ['Spirala Hipnoza', 'Wir Kalejdoskopu', 'Ślimak Złoty', 'Spirala DaX']] },
    { id: 'for', label: 'Forest (las)', icon: '🌲', fam: [
      ['Las Świerkowy o Zmierzchu', 'Tatrzański Bór', 'Mglisty Las Nocą', 'Księżycowy Las', 'Czerwony Las Jesienią'],
      ['Świetliki w Puszczy', 'Magiczna Polana', 'Duchy Lasu', 'Las Elfów'],
      ['Promienie przez Korony', 'Poranek w Puszczy', 'Złota Godzina w Lesie'],
      ['Zorza nad Borem', 'Zorza Polarna', 'Północny Las', 'Zielona Zorza 7'],
      ['Neonowy Zagajnik', 'Cyber Las', 'Bambusowy Neon']] },
    { id: 'cos', label: 'Kosmos', icon: '🌌', fam: [
      ['Warp Gwiezdny', 'Hiperskok', 'Deszcz Gwiazd', 'Prędkość Światła'],
      ['Mgławica Oriona', 'Mgławica Różowa', 'Obłok Molekularny', 'Kosmiczny Pył'],
      ['Galaktyka Spiralna', 'Droga Mleczna', 'Andromeda', 'Dwa Ramiona'],
      ['Tunel Czasoprzestrzenny', 'Czarna Dziura', 'Portal Wymiarów', 'Wormhole DaX'],
      ['Gazowy Gigant', 'Pierścienie Saturna', 'Czerwona Planeta']] },
    { id: 'ai', label: 'Live AI-generate', icon: '🧠', fam: [
      ['Sen Sieci Neuronowej', 'Dyfuzja Cyfrowa', 'Płynne Myśli', 'Halucynacja AI'],
      ['Komórki Voronoi', 'Bioluminescencja', 'Skóra Smoka'],
      ['Metakulki Lawa', 'Plazma Żywa', 'Ciecz Rtęć'],
      ['Labirynt Turinga', 'Plamy Lamparta', 'Koral Cyfrowy'],
      ['Siatka Neuronów', 'Synapsy', 'Graf Wiedzy'],
      ['Deszcz Danych', 'Matrix Kali', 'Kod Źródłowy']] }
  ];
  var GENS = [], BASE_ID = 0;
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  GROUPS.forEach(function (g) {
    g.items = [];
    g.fam.forEach(function (names) {
      names.forEach(function (n) { var o = { id: GENS.length, name: n, group: g.id, base: BASE_ID }; GENS.push(o); g.items.push(o); });
      BASE_ID++;
    });
  });
  var NBASE = BASE_ID; /* 21 */
  function seedLayer(gid) {
    var G = GENS[gid], r = rng(hash(G.name));
    return { g: gid, p: [r(), r(), r(), r()], hue: r(), speed: .75 + r() * .6, zoom: .9 + r() * .35, op: 1 };
  }
  function randLayer(gid, op) {
    return { g: gid, p: [Math.random(), Math.random(), Math.random(), Math.random()], hue: Math.random(), speed: .6 + Math.random() * .9, zoom: .8 + Math.random() * .6, op: op == null ? 1 : op };
  }

  /* ---------- shader ---------- */
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
'#ifdef GL_FRAGMENT_PRECISION_HIGH','precision highp float;','#else','precision mediump float;','#endif',
'uniform vec2 uR;uniform float uT;uniform vec3 uA;uniform float uB;uniform float uF;uniform float uN;',
'uniform float uG[4];uniform vec4 uP[4];uniform vec4 uQ[4];',
'const float PI=3.14159265;',
'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}',
'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
'vec3 pal(float x,float h){return .5+.5*cos(6.2832*(x+h+vec3(0.,.33,.67)));}',
'float stars(vec2 uv,float t,float dens){vec2 g=uv*28.;vec2 id=floor(g);float r=h21(id);return step(dens,r)*smoothstep(.4,0.,length(fract(g)-.5))*(.55+.45*sin(t*3.+r*40.));}',
'float trees(vec2 uv,float y0,float sc,float seed,float t){float x=uv.x*sc+seed*7.31+t;float id=floor(x);float fx=abs(fract(x)-.5)*2.;float hh=.25+.4*h21(vec2(id,seed));float y=uv.y-y0;float w=(1.-y/hh)*(.5+.5*fract(y*7.))*.95;float m=smoothstep(0.,.05,w-fx)*step(y,hh);return max(m,step(y,0.));}',
/* --- Kalejdoskop --- */
'vec3 k0(vec2 u,float t,vec4 p,float h){float n=3.+floor(p.x*9.);float a=atan(u.y,u.x),r=length(u);float sg=6.2832/n;a=abs(mod(a,sg)-sg*.5);vec2 q=vec2(cos(a),sin(a))*r;q=rot(t*.2)*q*(1.+uA.x*.25);float f=sin(q.x*(6.+p.y*10.)+t)+sin(q.y*(6.+p.z*10.)-t*1.3)+sin(length(q)*(8.+p.w*12.)-t*2.);return pal(f*.2+r*.3,h)*(.25+.75*smoothstep(-1.5,1.5,f));}',
'vec3 k1(vec2 u,float t,vec4 p,float h){float a=atan(u.y,u.x),r=length(u);float pet=floor(3.+p.x*10.);float f=abs(sin(a*pet*.5+t*.3));vec3 c=vec3(0.);for(int i=0;i<3;i++){float fi=float(i);float d=abs(r-(.25+.2*fi)*(.7+.6*f*(.5+p.z))-.03*uA.x);c+=pal(fi*.2+r+f*.3,h)*.012/(d+.008);}float ring=sin(r*(10.+p.y*20.)-t*2.-uA.x*3.);return c*.55+pal(r*2.,h+.3)*(.5+.5*ring)*.12*f;}',
'vec3 k2(vec2 u,float t,vec4 p,float h){vec2 z=u*(1.2+p.x);vec3 acc=vec3(0.);for(int i=0;i<6;i++){z=abs(z)-vec2(.5+.3*p.y,.3+.3*p.z)*(1.+.1*sin(t*.3));z=rot(t*.1+p.w*3.+float(i)*.5+uA.y*.3)*z;z*=1.3;acc+=pal(length(z)*.3+float(i)*.1,h)*exp(-length(z)*1.2);}return acc*.6;}',
'vec3 k3(vec2 u,float t,vec4 p,float h){vec2 s=vec2(1.,1.7320508);vec2 q=u*(2.5+p.x*5.)+vec2(t*.1,0.);vec2 a=mod(q,s)-s*.5,b=mod(q-s*.5,s)-s*.5;vec2 gv=dot(a,a)<dot(b,b)?a:b;vec2 id=q-gv;float d=max(abs(gv.x)*.866+abs(gv.y)*.5,abs(gv.y));float rnd=h21(id);float pulse=.5+.5*sin(t*2.+rnd*30.)+uB*.5*step(.7,rnd);float edge=smoothstep(.04,.0,abs(d-.42));return pal(rnd+t*.05,h)*(edge*1.4+smoothstep(.4,.0,d)*.5*pulse);}',
'vec3 k4(vec2 u,float t,vec4 p,float h){float r=length(u)+.001,a=atan(u.y,u.x);float k=2.+floor(p.y*6.);float lx=log(r)*(1.+p.x*3.);float v=sin(lx*8.-t*2.-uA.x*2.+a*k)+sin(a*k*2.-lx*5.+t);float g=smoothstep(-1.,1.,v);return pal(lx*.3+.1*sin(a*k)+t*.05,h)*(.15+g*.9)*smoothstep(0.,.15,r);}',
/* --- Forest --- */
'vec3 f0(vec2 u,float t,vec4 p,float h){vec3 sky=mix(pal(.05+p.x*.5,h)*.15,pal(.3+p.x*.5,h)*.9,smoothstep(-.6,1.,u.y));vec2 mp=vec2(.5-p.y,.45);float md=length(u-mp);sky+=pal(.6,h)*(smoothstep(.12,.1,md)*1.2+.04/(md+.1)*(1.+uA.x*.6));vec3 col=sky;for(int i=0;i<5;i++){float fi=float(i);float m=trees(u,-fi*.18,2.5+fi*1.6,fi,t*(.02+.015*fi));vec3 fog=mix(sky*.9,pal(.55,h)*.25,.4);vec3 tc=mix(fog,vec3(.01,.03,.02)+pal(.4+fi*.05,h)*.03,.2+fi*.2);col=mix(col,tc,m);}col+=pal(.5,h)*.12*exp(-pow((u.y+.1)*3.,2.))*(1.+uB*.4);return col;}',
'vec3 f1(vec2 u,float t,vec4 p,float h){vec3 col=mix(pal(.35,h)*.05,pal(.5,h)*.2,smoothstep(-1.,1.,u.y));for(int i=0;i<3;i++){float fi=float(i);float x=u.x*(2.+fi*1.5)+fi*3.7+t*.01*(fi+1.);float id=floor(x);float lx=fract(x)-.5;float off=(h21(vec2(id,fi))-.5)*.6;float w=.04+.05*h21(vec2(id,fi+9.));float m=smoothstep(w,w*.6,abs(lx-off));col=mix(col,vec3(.01,.02,.015)*(1.+fi*.3),m*(.5+.2*fi));}for(int i=0;i<20;i++){float fi=float(i);vec2 pos=vec2(sin(fi*7.3+t*.2*(.5+h21(vec2(fi,1.))))*1.5,sin(fi*3.7+t*.15+fi)*.8);float d=length(u-pos);float bl=.5+.5*sin(t*(1.+h21(vec2(fi,2.))*2.)+fi*5.+uB*3.);col+=pal(.15+p.x*.5+fi*.01,h)*.0009/(d*d+.0006)*bl*(1.+uA.y);}return col;}',
'vec3 f2(vec2 u,float t,vec4 p,float h){vec2 c=vec2((p.x-.5)*1.6,1.3);vec2 d=u-c;float a=atan(d.x,-d.y);float r=length(d);float rays=smoothstep(.35,.8,fbm(vec2(a*(6.+p.y*14.),t*.3)));vec3 col=pal(.1+p.z*.3,h)*.1+pal(.12+p.z*.3,h)*rays*exp(-r*.6)*(1.1+uA.x*.6+uB*.3);float leaf=fbm(u*vec2(3.,2.5)+vec2(t*.05,0.));float cm=smoothstep(.45,.55,leaf+(u.y-.35)*.6);col=mix(col,vec3(0.,.02,.01),cm);float m=trees(u,-.75,4.,3.,t*.02);col=mix(col,vec3(0.),m);col+=pal(.15,h)*stars(u*1.5+t*.02,t,.97)*.4*(1.-cm);return col;}',
'vec3 f3(vec2 u,float t,vec4 p,float h){vec3 col=mix(vec3(0.,.01,.03),pal(.6,h)*.12,smoothstep(-.5,1.,u.y));col+=stars(u,t,.985)*.8;for(int i=0;i<3;i++){float fi=float(i);float y=.25+fi*.12+.18*sin(u.x*(1.5+p.x*2.)+t*.3*(1.+fi*.3)+fi*2.)+.08*fbm(vec2(u.x*3.+t*.2,fi));float band=exp(-pow((u.y-y)*(4.+p.y*4.),2.));float st=.6+.4*fbm(vec2(u.x*14.,t*.4+fi));col+=pal(.3+fi*.12+p.z*.4,h)*band*st*(.7+uA.y*.8+uB*.3);}float m=trees(u,-.6,3.5,5.,t*.015);return mix(col,vec3(0.,.005,.01),m);}',
'vec3 f4(vec2 u,float t,vec4 p,float h){vec3 col=pal(.7,h)*.04;for(int i=0;i<3;i++){float fi=float(i);float z=1.+fi*.7;float x=u.x*(3.+p.x*5.)*z+fi*5.+t*.05*(1.+fi);float id=floor(x);float lx=fract(x)-.5;float bend=.15*sin(u.y*2.+id*3.+t*.5+uA.x);float d=abs(lx-bend+(h21(vec2(id,fi))-.5)*.5);float gl=.008/(d+.01)*(1.-fi*.25);col+=pal(h21(vec2(id,fi))+t*.03,h)*gl*(.6+uB*.6+uA.x*.5);}col+=pal(.5,h)*.15*exp(-abs(u.y+.7)*4.);return col;}',
/* --- Kosmos --- */
'vec3 c0(vec2 u,float t,vec4 p,float h){vec3 col=pal(.6,h)*.02;for(int i=0;i<5;i++){float fi=float(i);float z=fract(fi/5.+t*.12*(1.+p.x*2.)+uA.x*.02);float sc=mix(12.,.5,z);vec2 q=u*sc+vec2(fi*13.7,fi*7.3);vec2 id=floor(q);vec2 f=fract(q)-.5;float rnd=h21(id);vec2 o=vec2(h21(id+1.3),h21(id+2.7))-.5;float d=length(f-o*.6);float s=smoothstep(.06*(.5+rnd),0.,d)*smoothstep(0.,.2,z)*smoothstep(1.,.8,z);col+=s*pal(rnd+p.y,h)*(1.+uB*.5)*1.6;}return col;}',
'vec3 c1(vec2 u,float t,vec4 p,float h){vec2 q=u*(1.2+p.x*1.5);float t2=t*.05;vec2 w=vec2(fbm(q+t2),fbm(q+vec2(3.1,1.7)-t2));float f=fbm(q+2.5*w+vec2(0.,t2));float f2=fbm(q*2.+w*3.);vec3 col=pal(f*1.2+p.y,h)*f*f*2.5+pal(f2+.4+p.z,h+.2)*f2*.5*smoothstep(.3,.9,f);col+=stars(u,t,.975)*.9;return col*(1.+uA.x*.5);}',
'vec3 c2(vec2 u,float t,vec4 p,float h){u=rot(p.w*3.)*u;u.y*=1.3;float r=length(u)+.001;float a=atan(u.y,u.x);float arms=2.+floor(p.x*4.);float ang=a+log(r)*(2.5+p.y*4.)-t*.3;float arm=pow(.5+.5*cos(ang*arms),2.+p.z*4.);float dens=arm*exp(-r*1.8)*(.5+fbm(vec2(ang*2.,r*6.)-t*.05));float core=exp(-r*(5.+uA.x*2.));vec3 col=pal(r*.8+p.w,h)*dens*3.+pal(.1,h)*core*3.;col+=stars(u*1.3,t,.98)*.7;return col;}',
'vec3 c3(vec2 u,float t,vec4 p,float h){float r=length(u)+.001;float a=atan(u.y,u.x)/PI;vec2 tq=vec2(a*(2.+floor(p.x*6.)),.35/r+t*(.6+p.y)+uA.x*.3);float v=sin(tq.x*PI*2.)*sin(tq.y*6.2832*(.5+p.z));float g=smoothstep(0.,.6,abs(v));vec3 col=pal(tq.y*.1+.15*sin(a*PI*2.),h)*(.2+.9*(1.-g));col*=smoothstep(0.,.5,r);col+=pal(.5,h)*.05/(r*r+.02)*(.4+uB);return col;}',
'vec3 c4(vec2 u,float t,vec4 p,float h){vec3 col=vec3(stars(u,t,.97)*.8);vec2 c=vec2((p.x-.5)*.8,(p.y-.5)*.3);vec2 q=u-c;float rad=.55+.08*p.z;float d=length(q);if(d<rad){float z=sqrt(rad*rad-d*d);vec3 n=normalize(vec3(q,z));float lon=atan(n.x,n.z)+t*.1;float lat=n.y;float tex=fbm(vec2(lon*2.,lat*4.)*(1.+p.w*2.)+fbm(vec2(lon,lat*3.))*1.5);vec3 b=mix(pal(tex*1.5+p.x,h),pal(tex+.3,h+.15),lat*.5+.5)*tex*1.6;float lit=clamp(dot(n,normalize(vec3(-.5+.3*sin(t*.2),.4,.7))),0.,1.);col=b*(.15+lit*1.1);col+=pal(.6,h)*pow(1.-n.z,3.)*.5;}else{col+=pal(.6,h)*exp(-(d-rad)*8.)*.3*(1.+uA.x*.5);}vec2 rq=vec2(q.x,q.y*3.2);float rd=length(rq);float ring=smoothstep(.08,0.,abs(rd-rad*1.7))*(.5+.5*sin(rd*80.));if(d<rad)ring*=step(q.y,0.);col+=ring*pal(.1,h)*.7;return col;}',
/* --- Live AI --- */
'vec3 a0(vec2 u,float t,vec4 p,float h){vec2 q=u*(1.2+p.x);vec2 w=vec2(fbm(q+t*.1),fbm(q+vec2(5.2,1.3)-t*.12));vec2 r=vec2(fbm(q+4.*w+vec2(1.7,9.2)+t*.15),fbm(q+4.*w+vec2(8.3,2.8)-t*.126));float f=fbm(q+4.*r);vec3 col=pal(f*1.4+p.y+length(r)*.3,h)*(.25+f*1.4);col+=pal(.5+p.z,h+.4)*smoothstep(.6,1.,length(w))*.4;return col*(1.+uA.x*.4+uB*.15);}',
'vec3 a1(vec2 u,float t,vec4 p,float h){vec2 g=u*(2.5+p.x*4.);vec2 id=floor(g),f=fract(g);float d1=9.,d2=9.;vec2 cid=vec2(0.);for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 hp=vec2(h21(id+o),h21(id+o+17.3));vec2 pt=o+.5+.45*sin(t*(.4+hp.x)+hp*6.2832)-f;float d=dot(pt,pt);if(d<d1){d2=d1;d1=d;cid=id+o;}else if(d<d2){d2=d;}}}float e=sqrt(d2)-sqrt(d1);vec3 col=pal(h21(cid)+p.y,h)*(.2+.8*smoothstep(0.,.6,sqrt(d1)))*(.7+.5*sin(t+h21(cid)*20.)+uB*.4*step(.6,h21(cid)));col+=pal(.5+p.z,h)*smoothstep(.12,0.,e)*(1.+uA.x*1.2);return col;}',
'vec3 a2(vec2 u,float t,vec4 p,float h){float s=0.;for(int i=0;i<7;i++){float fi=float(i);vec2 c=vec2(sin(t*(.3+.1*fi)+fi*2.1)*.9,cos(t*(.27+.08*fi)+fi*1.3)*.6);float r=.12+.08*h21(vec2(fi,3.))+.06*uA.x;s+=r*r/dot(u-c,u-c);}vec3 col=pal(s*.25+p.x,h)*smoothstep(.8,1.2,s)+pal(s*.1+.5,h)*.15*s;col+=pal(.9,h)*smoothstep(1.,.95,s)*smoothstep(.6,1.,s)*1.5;return col;}',
'vec3 a3(vec2 u,float t,vec4 p,float h){float v=0.;for(int i=0;i<5;i++){float fi=float(i);float ang=fi*1.2566+t*.05*(1.+fi*.2)+p.x*6.;v+=sin(dot(u,vec2(cos(ang),sin(ang)))*(5.+p.y*14.)+t*(.4+fi*.1)+fbm(u*2.+fi)*3.);}float m=smoothstep(0.,.3+uA.x*.3,sin(v*(1.+p.z)));return mix(pal(.1+p.w,h)*.15,pal(.5+p.w,h),m);}',
'vec3 a4(vec2 u,float t,vec4 p,float h){vec2 g=u*(3.+p.x*4.);vec2 id=floor(g),f=fract(g);vec2 hp0=vec2(h21(id),h21(id+9.7));vec2 c0=.5+.35*sin(t*.5+hp0*6.2832);vec3 col=vec3(0.);for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 hp=vec2(h21(id+o),h21(id+o+9.7));vec2 pt=o+.5+.35*sin(t*.5+hp*6.2832);float d=length(pt-f);col+=pal(hp.x+p.y,h)*.006/(d*d+.004)*(.5+.5*sin(t*2.+hp.y*20.)+uB*.6);vec2 pa=f-c0,ba=pt-c0;float hh=clamp(dot(pa,ba)/(dot(ba,ba)+.0001),0.,1.);float dl=length(pa-ba*hh);col+=pal(.5+p.y,h)*.0035/(dl+.008)*(.4+.6*sin(hh*12.566-t*3.));}}return col*.8;}',
'vec3 a5(vec2 u,float t,vec4 p,float h){vec2 g=vec2(u.x*(8.+p.x*20.),u.y*(6.+p.y*10.));float cid=floor(g.x);float sp=.5+h21(vec2(cid,1.))*2.;float ph=h21(vec2(cid,7.))*100.;float yy=fract(u.y*.5+.5+t*sp*.2+ph);float cell=floor(g.y);vec2 f=fract(g);float gl=step(.35,h21(vec2(cid,cell)+floor(t*3.)))*step(.15,f.x)*step(f.x,.85)*step(.1,f.y)*step(f.y,.9);vec3 col=pal(.35+p.z*.3,h)*pow(1.-yy,3.)*gl*(1.+uA.x);col+=vec3(.9)*smoothstep(.04,0.,yy)*gl;return col;}',
'void main(){vec2 uv=(gl_FragCoord.xy-.5*uR)/uR.y*2.;vec3 col=vec3(0.);',
'for(int i=0;i<4;i++){if(float(i)<uN){vec4 q=uQ[i];vec4 p=uP[i];float t=uT*q.y;vec2 u=uv*q.z;float g=uG[i];vec3 c;',
(function () { var o = '', k = 0; for (; k < NBASE; k++) { var nm = ['k0','k1','k2','k3','k4','f0','f1','f2','f3','f4','c0','c1','c2','c3','c4','a0','a1','a2','a3','a4','a5'][k]; o += (k ? 'else ' : '') + (k < NBASE - 1 ? 'if(g<' + (k + .5).toFixed(1) + ')' : '') + 'c=' + nm + '(u,t,p,q.x);'; } return o; })(),
'col=1.-(1.-col)*(1.-c*q.w);}}',
'float vg=1.-.35*dot(uv*.5,uv*.5);col*=vg*(1.+.2*uB);col=pow(max(col,0.),vec3(.92));gl_FragColor=vec4(col*uF,1.);}'
  ].join('\n');

  /* ---------- state ---------- */
  var S = {
    mode: 'gen', multi: lsGet('multi', '0') == '1', nLayers: +lsGet('nl', 3), layers: [], cur: +lsGet('gen', 0), milkName: lsGet('milk', ''),
    res: lsGet('res', IS_MOBILE ? '480' : '720'), auto: lsGet('auto', '1') == '1', every: +lsGet('every', 16), pool: lsGet('pool', 'all'),
    beats: 0, running: true, visible: true, fade: 1, fadeT: 0
  };
  if (!(S.cur >= 0 && S.cur < 77)) S.cur = 0;
  if (!(S.nLayers >= 2 && S.nLayers <= 4)) S.nLayers = 3;
  var root, stage, cv, mc, gl, prog, U = {}, hud, ctl, sel, fsBtn;
  var audioEl = null, elC = null, elP = null, actx = null, an = null, mix = null, simSrc = null, simGain = null, radioIdx = -1, live = false, radioOn = false;
  var fbuf = null, fbuf2 = null;
  var levels = { a: [0, 0, 0], bassAvg: .2, lastBeat: 0 };
  var sim = { t0: performance.now(), bpm: 128, lastBeatIdx: -1 };
  var bc = null, viz = null, presets = null, presetNames = [], milkLoading = false;
  var stationsList = [];

  /* ---------- UI ---------- */
  function mount() {
    var host = document.getElementById('d7g-mount');
    root = document.createElement('section'); root.id = 'd7g'; root.className = 'd7g'; root.setAttribute('aria-label', '77 generatorów wizji');
    root.innerHTML =
      '<div class="d7g-head"><b>✨ 77 generatorów wizji</b><span class="d7g-sub">Kalejdoskop · Forest (las) · Kosmos · Live AI-generate · MilkDrop</span><span class="d7g-now" id="d7g-now"></span></div>' +
      '<div class="d7g-stage" id="d7g-stage"><canvas id="d7g-gl" aria-label="Generator wizji"></canvas><canvas id="d7g-mc" aria-hidden="true" hidden></canvas>' +
      '<div class="d7g-hud" id="d7g-hud"></div><button type="button" class="d7g-x" id="d7g-x" aria-label="Wyjdź z pełnego ekranu">✕</button><span class="d7g-hint">dwuklik / double-tap = pełny ekran</span></div>' +
      '<div class="d7g-ctl" id="d7g-ctl">' +
      '<div class="d7g-row d7g-chips" id="d7g-chips"></div>' +
      '<div class="d7g-row"><select id="d7g-sel" aria-label="Generator wizji"></select>' +
      '<button type="button" class="d7g-b" id="d7g-prev" title="Poprzedni">◀</button><button type="button" class="d7g-b" id="d7g-rnd" title="Losowy generator">🎲 Losuj</button><button type="button" class="d7g-b" id="d7g-next" title="Następny">▶</button>' +
      '<button type="button" class="d7g-b" id="d7g-par" title="Losuj parametry (kolory, symetria, tempo)">🎛 Parametry</button></div>' +
      '<div class="d7g-row"><button type="button" class="d7g-b" id="d7g-auto" aria-pressed="false">AUTO w rytm</button>' +
      '<select id="d7g-every" aria-label="Co ile beatów"><option value="4">co 4 beaty</option><option value="8">co 8</option><option value="16">co 16</option><option value="32">co 32</option><option value="64">co 64</option></select>' +
      '<button type="button" class="d7g-b" id="d7g-multi" aria-pressed="false" title="Multi-point: miks 2–4 generatorów">Multi-point</button>' +
      '<select id="d7g-nl" aria-label="Liczba warstw"><option value="2">2 warstwy</option><option value="3">3 warstwy</option><option value="4">4 warstwy</option></select>' +
      '<select id="d7g-res" aria-label="Rozdzielczość"><option value="480">480p</option><option value="720">720p</option><option value="1080">1080p</option><option value="native">Natywna</option></select>' +
      '<button type="button" class="d7g-b d7g-fs" id="d7g-fs" title="Pełny ekran (F)">⛶ Fullscreen</button></div>' +
      '<div class="d7g-row d7g-radio"><span class="d7g-lab">📻 Radio</span><select id="d7g-st" aria-label="Stacja radiowa"></select>' +
      '<button type="button" class="d7g-b" id="d7g-play">▶ Play</button><button type="button" class="d7g-b" id="d7g-stop">⏹</button>' +
      '<input type="range" id="d7g-vol" min="0" max="100" value="80" aria-label="Głośność"><span class="d7g-stat" id="d7g-stat">demo 128 BPM (symulacja beatu)</span></div>' +
      '</div>';
    if (host) host.appendChild(root);
    else {
      var ref = document.querySelector('main') || document.getElementById('sx-app');
      if (ref && ref.parentNode) ref.parentNode.insertBefore(root, ref); else document.body.insertBefore(root, document.body.firstChild);
    }
    stage = $('#d7g-stage', root); cv = $('#d7g-gl', root); mc = $('#d7g-mc', root); hud = $('#d7g-hud', root); ctl = $('#d7g-ctl', root); sel = $('#d7g-sel', root); fsBtn = $('#d7g-fs', root);
    // generator select
    var h = '';
    GROUPS.forEach(function (g) {
      h += '<optgroup label="' + g.icon + ' ' + g.label + ' (' + g.items.length + ')">';
      g.items.forEach(function (it) { h += '<option value="g:' + it.id + '">' + (it.id + 1) + '. ' + esc(it.name) + '</option>'; });
      h += '</optgroup>';
    });
    h += '<optgroup label="🌀 MilkDrop (butterchurn)" id="d7g-milk-og"><option value="m:">— MilkDrop: wczytaj presety… —</option></optgroup>';
    sel.innerHTML = h;
    // chips: pools
    var ch = '<span class="d7g-lab">Losuj z:</span><button type="button" class="d7g-chip" data-pool="all">Wszystkie 77</button>';
    GROUPS.forEach(function (g) { ch += '<button type="button" class="d7g-chip" data-pool="' + g.id + '">' + g.icon + ' ' + g.label + '</button>'; });
    ch += '<button type="button" class="d7g-chip" data-pool="milk">🌀 MilkDrop</button>';
    $('#d7g-chips', root).innerHTML = ch;
    $('#d7g-every', root).value = String(S.every); $('#d7g-nl', root).value = String(S.nLayers); $('#d7g-res', root).value = S.res;
    wire();
    syncUI();
  }

  function syncUI() {
    $('#d7g-auto', root).classList.toggle('on', S.auto); $('#d7g-auto', root).setAttribute('aria-pressed', S.auto);
    $('#d7g-multi', root).classList.toggle('on', S.multi); $('#d7g-multi', root).setAttribute('aria-pressed', S.multi);
    $('#d7g-nl', root).style.display = S.multi ? '' : 'none';
    var cs = root.querySelectorAll('.d7g-chip'); for (var i = 0; i < cs.length; i++) cs[i].classList.toggle('on', cs[i].getAttribute('data-pool') === S.pool);
    if (S.mode === 'milk') sel.value = 'm:' + S.milkName; else sel.value = 'g:' + S.layers[0].g;
    updateHud();
  }
  function updateHud() {
    var name, grp;
    if (S.mode === 'milk') { name = S.milkName || 'MilkDrop'; grp = 'MilkDrop'; }
    else {
      var G = GENS[S.layers[0].g]; grp = GROUPS.filter(function (x) { return x.id === G.group; })[0].label; name = G.name;
      if (S.multi) name += ' + ' + S.layers.slice(1).map(function (l) { return GENS[l.g].name; }).join(' + ');
    }
    var tx = (S.mode === 'gen' ? '#' + (S.layers[0].g + 1) + ' ' : '') + name;
    $('#d7g-now', root).textContent = tx;
    hud.innerHTML = '<b>' + esc(name) + '</b><span>' + esc(grp) + (S.multi && S.mode === 'gen' ? ' · multi ×' + S.layers.length : '') + ' · ' + cv.width + '×' + cv.height + ' · ' + (live ? 'audio LIVE' : (radioOn ? 'radio (beat sym.)' : 'beat sym.')) + '</span>';
  }

  function wire() {
    sel.addEventListener('change', function () {
      var v = sel.value; if (v.indexOf('m:') === 0) { if (v.length > 2) setMilk(v.slice(2)); else loadMilk(function () { setMilk(randomMilkName()); }); }
      else setGen(+v.slice(2));
    });
    $('#d7g-prev', root).onclick = function () { stepGen(-1); };
    $('#d7g-next', root).onclick = function () { stepGen(1); };
    $('#d7g-rnd', root).onclick = function () { randomPick(); };
    $('#d7g-par', root).onclick = function () { randomizeParams(); };
    $('#d7g-auto', root).onclick = function () { S.auto = !S.auto; lsSet('auto', S.auto ? 1 : 0); syncUI(); };
    $('#d7g-every', root).onchange = function () { S.every = +this.value; lsSet('every', S.every); };
    $('#d7g-multi', root).onclick = function () { S.multi = !S.multi; lsSet('multi', S.multi ? 1 : 0); if (S.multi && S.mode === 'milk') showGen(); buildLayers(); syncUI(); };
    $('#d7g-nl', root).onchange = function () { S.nLayers = +this.value; lsSet('nl', S.nLayers); buildLayers(); syncUI(); };
    $('#d7g-res', root).onchange = function () { S.res = this.value; S.autoCap = 0; lsSet('res', S.res); resize(true); };
    fsBtn.onclick = toggleFs; $('#d7g-x', root).onclick = function () { exitFs(); };
    $('#d7g-chips', root).addEventListener('click', function (e) {
      var b = e.target.closest('.d7g-chip'); if (!b) return; S.pool = b.getAttribute('data-pool'); lsSet('pool', S.pool);
      if (S.pool === 'milk') loadMilk(function () { setMilk(randomMilkName()); }); else randomPick();
      syncUI();
    });
    $('#d7g-play', root).onclick = function () { playRadio(+$('#d7g-st', root).value); };
    $('#d7g-stop', root).onclick = stopRadio;
    $('#d7g-st', root).onchange = function () { if (radioOn) playRadio(+this.value); };
    $('#d7g-vol', root).oninput = function () { if (elC) elC.volume = this.value / 100; if (elP) elP.volume = this.value / 100; lsSet('vol', this.value); };
    var v = lsGet('vol', '80'); $('#d7g-vol', root).value = v;
    // double-tap / double-click fullscreen
    var lastTap = 0;
    stage.addEventListener('dblclick', function (e) { e.preventDefault(); toggleFs(); });
    stage.addEventListener('touchend', function (e) {
      var n = Date.now(); if (n - lastTap < 400) { e.preventDefault(); toggleFs(); lastTap = 0; } else lastTap = n;
      if (isFs()) showUi();
    }, { passive: false });
    ['mousemove', 'pointerdown', 'keydown'].forEach(function (ev) { root.addEventListener(ev, function () { if (isFs()) showUi(); }); });
    document.addEventListener('keydown', function (e) {
      if (/INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return;
      if (!isFs() && !(root.contains(e.target) || e.target === document.body)) return;
      if (e.key === 'f' || e.key === 'F') { if (isFs() || S.visible) toggleFs(); }
      else if (isFs() && e.key === 'ArrowRight') stepGen(1); else if (isFs() && e.key === 'ArrowLeft') stepGen(-1);
      else if (isFs() && (e.key === 'r' || e.key === 'R')) randomPick();
    });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, onFsChange); });
    window.addEventListener('resize', function () { resize(); });
    window.addEventListener('orientationchange', function () { setTimeout(function () { resize(true); }, 250); });
    document.addEventListener('visibilitychange', function () { S.visible = !document.hidden && S.inView !== false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { S.inView = es[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);
    }
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); S.glLost = true; });
    cv.addEventListener('webglcontextrestored', function () { S.glLost = false; initGL(); resize(true); });
  }

  /* ---------- fullscreen ---------- */
  var hideT = 0;
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement) || root.classList.contains('d7g-fake'); }
  function toggleFs() { isFs() ? exitFs() : enterFs(); }
  function enterFs() {
    var rq = root.requestFullscreen || root.webkitRequestFullscreen;
    if (rq) { var p; try { p = rq.call(root); } catch (e) { fakeFs(true); return; } if (p && p.catch) p.catch(function () { fakeFs(true); }); }
    else fakeFs(true);
  }
  function exitFs() {
    if (root.classList.contains('d7g-fake')) { fakeFs(false); return; }
    var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) try { var p = ex.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function fakeFs(on) { root.classList.toggle('d7g-fake', on); document.documentElement.classList.toggle('d7g-lock', on); onFsChange(); }
  function onFsChange() {
    var f = isFs(); root.classList.toggle('d7g-full', f); fsBtn.textContent = f ? '⛶ Wyjdź' : '⛶ Fullscreen';
    if (f) showUi(); else { clearTimeout(hideT); root.classList.remove('d7g-idle'); }
    setTimeout(function () { resize(true); }, 120);
  }
  function showUi() { root.classList.remove('d7g-idle'); clearTimeout(hideT); hideT = setTimeout(function () { if (isFs()) root.classList.add('d7g-idle'); }, 3500); }

  /* ---------- GL ---------- */
  function initGL() {
    try {
      gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: IS_MOBILE ? 'low-power' : 'high-performance', preserveDrawingBuffer: false }) || cv.getContext('experimental-webgl');
      if (!gl) throw new Error('no webgl');
      function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      ['uR', 'uT', 'uA', 'uB', 'uF', 'uN', 'uG', 'uP', 'uQ'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      S.glOk = true;
    } catch (e) {
      S.glOk = false; S.glErr = String(e && e.message || e).slice(0, 300);
      if (window.console) console.warn('[D7VisionsGL] WebGL init failed → tryb lekki 2D:', S.glErr);
    }
  }

  /* ---------- layers ---------- */
  function buildLayers() {
    var first = S.layers[0] || seedLayer(S.cur);
    var L = [first];
    if (S.multi) {
      var used = [GENS[first.g].group];
      for (var i = 1; i < S.nLayers; i++) {
        var gid, tries = 0;
        do { gid = Math.floor(Math.random() * 77); tries++; } while ((GENS[gid].base === GENS[L[L.length - 1].g].base || (used.indexOf(GENS[gid].group) >= 0 && tries < 12)) && tries < 30);
        used.push(GENS[gid].group); L.push(randLayer(gid, .55 + Math.random() * .35));
      }
    }
    S.layers = L; kickFade();
  }
  function kickFade() { S.fade = 0; S.fadeT = performance.now(); }
  function setGen(id, keep) {
    if (S.mode === 'milk') showGen();
    S.cur = id; lsSet('gen', id); S.layers[0] = seedLayer(id);
    if (S.multi) buildLayers(); else { S.layers = [S.layers[0]]; kickFade(); }
    syncUI();
  }
  function showGen() { S.mode = 'gen'; mc.hidden = true; cv.hidden = false; stage.classList.remove('d7g-milk'); resize(true); }
  function stepGen(d) { if (S.mode === 'milk') { var i = presetNames.indexOf(S.milkName); setMilk(presetNames[(i + d + presetNames.length) % presetNames.length]); return; } setGen((S.cur + d + 77) % 77); }
  function poolIds() {
    if (S.pool === 'all' || S.pool === 'milk') return GENS.map(function (g) { return g.id; });
    return GENS.filter(function (g) { return g.group === S.pool; }).map(function (g) { return g.id; });
  }
  function randomPick() {
    if (S.pool === 'milk' || S.mode === 'milk' && S.pool === 'all' && false) { loadMilk(function () { setMilk(randomMilkName()); }); return; }
    var ids = poolIds(), id; do { id = ids[Math.floor(Math.random() * ids.length)]; } while (id === S.cur && ids.length > 1);
    if (S.mode === 'milk') showGen();
    S.cur = id; lsSet('gen', id); S.layers[0] = randLayer(id); if (Math.random() < .5) S.layers[0] = seedLayer(id);
    if (S.multi) buildLayers(); else { S.layers = [S.layers[0]]; kickFade(); }
    syncUI();
  }
  function randomizeParams() {
    if (S.mode === 'milk') { setMilk(randomMilkName()); return; }
    S.layers = S.layers.map(function (l) { var n = randLayer(l.g, l.op); return n; }); kickFade(); S.cur = S.layers[0].g; syncUI();
  }

  /* ---------- sizing ---------- */
  function targetH(ch) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (S.res === 'native') return Math.round(ch * dpr);
    return Math.min(+S.res || 480, S.autoCap || 4320);
  }
  function resize(force) {
    var r = stage.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    var h = Math.max(120, targetH(r.height)), w = Math.max(160, Math.round(h * r.width / r.height));
    if (!force && cv.width === w && cv.height === h) return;
    cv.width = w; cv.height = h; mc.width = w; mc.height = h;
    perfAcc = 0; perfN = 0;
    if (viz) try { viz.setRendererSize(w, h); } catch (e) {}
    if (gl && S.glOk) gl.viewport(0, 0, w, h);
    updateHud();
  }

  /* ---------- audio ---------- */
  function ensureCtx() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return actx; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    actx = new AC(); mix = actx.createGain(); an = actx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = .6; mix.connect(an);
    // silent simulated 128 BPM source → only analysers (never destination), used by butterchurn when no live audio
    try {
      var sr = actx.sampleRate, bl = Math.round(sr * 60 / sim.bpm * 8), buf = actx.createBuffer(1, bl, sr), d = buf.getChannelData(0), beat = sr * 60 / sim.bpm;
      for (var i = 0; i < bl; i++) {
        var bt = (i % beat) / sr, v = Math.sin(2 * Math.PI * (45 * bt + 75 * (1 - Math.exp(-bt * 30)) / 30)) * Math.exp(-bt * 9) * .9;
        var ho = ((i + beat / 2) % beat) / sr; v += (Math.random() * 2 - 1) * Math.exp(-ho * 60) * .25;
        v += Math.sin(2 * Math.PI * 220 * i / sr) * .08 * (.6 + .4 * Math.sin(i / sr * 1.7)); d[i] = v;
      }
      simSrc = actx.createBufferSource(); simSrc.buffer = buf; simSrc.loop = true; simGain = actx.createGain(); simGain.gain.value = 1; simSrc.connect(simGain); simGain.connect(mix); simSrc.start();
    } catch (e) {}
    return actx;
  }
  function mkAudio(cors) {
    var a = new Audio(); if (cors) a.crossOrigin = 'anonymous'; a.preload = 'none'; a.volume = +$('#d7g-vol', root).value / 100;
    a.addEventListener('playing', function () { if (a !== audioEl) return; radioOn = true; statusText(); });
    a.addEventListener('error', function () {
      if (a !== audioEl || !a.getAttribute('src')) return;
      if (cors && stationsList[radioIdx]) { // CORS-less stream: play via plain element, simulate beat
        var u = stationsList[radioIdx].url; a.removeAttribute('src'); a.load(); elP = elP || mkAudio(false); audioEl = elP; live = false; setSimGain(1);
        audioEl.src = u; audioEl.play().catch(function () {}); statusText('radio (brak CORS → beat symulowany)');
      } else { radioOn = false; statusText('błąd strumienia: ' + (stationsList[radioIdx] ? stationsList[radioIdx].name : '')); }
    });
    return a;
  }
  function setSimGain(v) { if (simGain) simGain.gain.value = v; }
  function playRadio(i) {
    if (!stationsList.length) return; if (!(i >= 0)) i = 0;
    radioIdx = i; lsSet('st', i);
    var c = ensureCtx();
    stopEl();
    var st = stationsList[i];
    if (c && !elC) { elC = mkAudio(true); try { var ms = c.createMediaElementSource(elC); ms.connect(mix); ms.connect(c.destination); } catch (e) { elC = null; } }
    if (elC) { audioEl = elC; live = true; setSimGain(0); } else { elP = elP || mkAudio(false); audioEl = elP; live = false; setSimGain(1); }
    audioEl.src = st.url; statusText('łączę: ' + st.name);
    var p = audioEl.play(); if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') statusText('kliknij ▶ Play ponownie (blokada autoodtwarzania)'); });
    statusText();
  }
  function stopEl() { [elC, elP].forEach(function (a) { if (a) { try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {} } }); }
  function stopRadio() { stopEl(); radioOn = false; live = false; setSimGain(1); statusText(); }
  function statusText(msg) {
    var s = $('#d7g-stat', root); if (!s) return;
    if (msg) { s.textContent = msg; return; }
    var nm = stationsList[radioIdx] ? stationsList[radioIdx].name : '';
    s.textContent = radioOn ? (live ? '● ' + nm + ' · analizator LIVE' : '● ' + nm + ' · beat symulowany') : (audioEl && audioEl.getAttribute && audioEl.getAttribute('src') ? 'łączę…' : 'demo 128 BPM (symulacja beatu)');
    updateHud();
  }
  function buildStations() {
    var base = (window.D7_STATIONS || []).map(function (s) { return { name: s[0], url: s[1] }; });
    var seen = {}; base.forEach(function (s) { seen[s.url] = 1; });
    var ex = (window.D7Dock && window.D7Dock.fallback) || [];
    ex.forEach(function (s) { var u = s.url_resolved || s.url; if (u && !seen[u]) { seen[u] = 1; base.push({ name: s.name + (s.countrycode ? ' (' + s.countrycode + ')' : ''), url: u }); } });
    stationsList = base;
    var h = ''; base.forEach(function (s, i) { h += '<option value="' + i + '">' + esc(s.name) + '</option>'; });
    $('#d7g-st', root).innerHTML = h || '<option>brak stacji</option>';
    var last = +lsGet('st', 0); if (last >= 0 && last < base.length) $('#d7g-st', root).value = last;
  }
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('load ' + src)); }; document.head.appendChild(s); }); }

  /* analysis per frame */
  function analyse(now) {
    var a = levels.a, bass, mid, hi, beat = false;
    if (live && an && audioEl && !audioEl.paused) {
      var d = levels.d || (levels.d = new Uint8Array(an.frequencyBinCount)); an.getByteFrequencyData(d);
      var sum = function (x, y) { var s = 0; for (var i = x; i < y; i++) s += d[i]; return s / ((y - x) * 255); };
      bass = sum(1, 5); mid = sum(5, 40); hi = sum(40, 120);
      if (bass > levels.bassAvg * 1.35 && bass > .3 && now - levels.lastBeat > 260) { beat = true; levels.lastBeat = now; }
      levels.bassAvg = levels.bassAvg * .96 + bass * .04;
    } else {
      var bt = 60000 / sim.bpm, ph = ((now - sim.t0) % bt) / bt, idx = Math.floor((now - sim.t0) / bt);
      if (idx !== sim.lastBeatIdx) { sim.lastBeatIdx = idx; beat = true; }
      bass = Math.exp(-ph * 5) * .9 + .1; mid = .35 + .25 * Math.sin(now / 900) + .15 * Math.exp(-((ph + .5) % 1) * 8); hi = .25 + .2 * Math.sin(now / 330 + 1) + (ph > .45 && ph < .55 ? .3 : 0);
    }
    a[0] += (bass - a[0]) * .5; a[1] += (mid - a[1]) * .3; a[2] += (hi - a[2]) * .3;
    levels.beatEnv = beat ? 1 : (levels.beatEnv || 0) * .88;
    return beat;
  }

  /* ---------- MilkDrop ---------- */
  function loadMilk(cb) {
    if (viz) { cb && cb(); return; }
    if (milkLoading) return; milkLoading = true; statusText('ładuję MilkDrop…');
    var seq = Promise.resolve();
    if (!window.butterchurn) seq = seq.then(function () { return loadScript(BASE + 'libs/butterchurn.min.js'); });
    if (!window.butterchurnPresets) seq = seq.then(function () { return loadScript(BASE + 'libs/butterchurnPresets.min.js'); });
    if (!window.butterchurnPresetsExtra) seq = seq.then(function () { return loadScript(BASE + 'libs/butterchurnPresetsExtra.min.js').catch(function () {}); });
    seq.then(function () {
      var c = ensureCtx(); if (!c) throw new Error('brak AudioContext');
      bc = window.butterchurn.default || window.butterchurn; presets = {};
      [window.butterchurnPresets, window.butterchurnPresetsExtra].forEach(function (m) { try { if (m) Object.assign(presets, (m.default || m).getPresets()); } catch (e) {} });
      presetNames = Object.keys(presets).sort();
      viz = bc.createVisualizer(c, mc, { width: cv.width, height: cv.height, pixelRatio: 1, textureRatio: 1 });
      viz.connectAudio(mix);
      var og = $('#d7g-milk-og', root); var h = ''; presetNames.forEach(function (n) { h += '<option value="m:' + esc(n) + '">' + esc(n.slice(0, 70)) + '</option>'; }); og.innerHTML = h;
      og.label = '🌀 MilkDrop (' + presetNames.length + ' presetów)';
      milkLoading = false; statusText(); cb && cb();
    }).catch(function (e) { milkLoading = false; statusText('MilkDrop niedostępny: ' + (e && e.message)); if (window.console) console.warn('[D7VisionsGL] milk', e); });
  }
  function randomMilkName() { return presetNames[Math.floor(Math.random() * presetNames.length)]; }
  function setMilk(name) {
    if (!viz || !presets[name]) return;
    S.mode = 'milk'; S.milkName = name; lsSet('milk', name); cv.hidden = true; mc.hidden = false; stage.classList.add('d7g-milk'); resize(true);
    try { viz.loadPreset(presets[name], 1.5); } catch (e) { console.warn(e); }
    syncUI();
  }

  /* ---------- render loop ---------- */
  var lastFrame = 0, perfAcc = 0, perfN = 0, W = new Float32Array(4), UP = new Float32Array(16), UQ = new Float32Array(16), UG = new Float32Array(4);
  var fpsCap = IS_MOBILE ? 30 : 60, frames = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!S.running) return;
    var visible = (S.inView !== false) && !document.hidden; S.visible = visible;
    if (!visible && !isFs()) return;
    var minDt = 1000 / (REDUCED ? 12 : fpsCap); if (now - lastFrame < minDt - 2) return;
    var dt = now - lastFrame; lastFrame = now;
    var beat = analyse(now);
    if (beat) {
      S.beats++;
      if (S.auto && S.every > 0 && S.beats % S.every === 0) { if (S.mode === 'milk' || S.pool === 'milk') { if (viz) setMilk(randomMilkName()); else loadMilk(function () { setMilk(randomMilkName()); }); } else randomPick(); }
    }
    if (S.mode === 'milk' && viz) { try { viz.render(); } catch (e) {} }
    else if (S.glOk && !S.glLost) drawGL(now);
    else draw2D(now);
    // adaptive: if too slow on 2 seconds, lower res cap
    perfAcc += dt; perfN++;
    if (perfAcc > 2500) { var avg = perfAcc / perfN; if (avg > 55 && S.res !== '480' && !S.autoCap) { S.autoCap = 480; resize(true); statusText('Auto-eco: wolno → 480p'); setTimeout(function () { statusText(); }, 3000); } perfAcc = 0; perfN = 0; }
    if ((++frames % 45) === 0) updateHud();
  }
  function drawGL(now) {
    var tt = (now / 1000) % 3600;
    if (S.fade < 1) { S.fade = Math.min(1, (now - S.fadeT) / 450); }
    gl.uniform2f(U.uR, cv.width, cv.height); gl.uniform1f(U.uT, tt);
    gl.uniform3f(U.uA, levels.a[0], levels.a[1], levels.a[2]); gl.uniform1f(U.uB, levels.beatEnv || 0); gl.uniform1f(U.uF, S.fade);
    var n = S.layers.length; gl.uniform1f(U.uN, n);
    for (var i = 0; i < 4; i++) {
      var l = S.layers[Math.min(i, n - 1)]; UG[i] = GENS[l.g].base;
      UP[i * 4] = l.p[0]; UP[i * 4 + 1] = l.p[1]; UP[i * 4 + 2] = l.p[2]; UP[i * 4 + 3] = l.p[3];
      UQ[i * 4] = l.hue; UQ[i * 4 + 1] = l.speed; UQ[i * 4 + 2] = l.zoom * (1 + .08 * levels.a[0]); UQ[i * 4 + 3] = l.op;
    }
    gl.uniform1fv(U.uG, UG); gl.uniform4fv(U.uP, UP); gl.uniform4fv(U.uQ, UQ);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  var c2d = null;
  function draw2D(now) { /* light fallback when WebGL is missing */
    if (!c2d) c2d = cv.getContext('2d'); if (!c2d) return;
    var w = cv.width, h = cv.height, t = now / 1000, b = levels.beatEnv || 0, hue = (S.layers[0].hue * 360 + t * 20) % 360;
    c2d.fillStyle = 'rgba(0,0,0,.18)'; c2d.fillRect(0, 0, w, h);
    for (var i = 0; i < 6; i++) { c2d.strokeStyle = 'hsla(' + ((hue + i * 40) % 360) + ',90%,60%,.7)'; c2d.lineWidth = 2 + b * 6; c2d.beginPath(); c2d.arc(w / 2, h / 2, (i + 1) * h / 14 * (1 + .3 * levels.a[0]) + Math.sin(t + i) * 8, 0, 6.283); c2d.stroke(); }
  }

  /* ---------- init ---------- */
  function init() {
    S.layers = [seedLayer(S.cur)]; if (S.multi) buildLayers();
    mount();
    initGL(); resize(true);
    if (!S.glOk) { $('.d7g-hint', root).textContent = 'Tryb lekki 2D · WebGL niedostępny'; }
    buildStations();
    if (!(window.D7_STATIONS && window.D7_STATIONS.length)) loadScript(BASE + 'js/d7-stations.js').then(buildStations).catch(function () {});
    setTimeout(buildStations, 2500); /* pick up D7Dock.fallback once loaded */
    syncUI();
    requestAnimationFrame(frame);
    window.D7VisionsGL = {
      version: 1, count: 77, groups: GROUPS.map(function (g) { return { id: g.id, label: g.label, n: g.items.length }; }),
      list: function () { return GENS.map(function (g) { return { id: g.id, name: g.name, group: g.group }; }); },
      set: setGen, setAuto: function (on, every) { S.auto = !!on; if (every) { S.every = every; } syncUI(); }, random: randomPick, params: randomizeParams, fullscreen: toggleFs, setRes: function (r) { S.res = r; S.autoCap = 0; $('#d7g-res', root).value = r; lsSet('res', r); resize(true); },
      setMulti: function (on, n) { S.multi = !!on; if (n) S.nLayers = n; buildLayers(); syncUI(); },
      milk: function (n) { loadMilk(function () { setMilk(n || randomMilkName()); }); }, play: playRadio, stop: stopRadio, playUrl: function (url, name) { stationsList.push({ name: name || url, url: url }); var o = document.createElement('option'); o.value = stationsList.length - 1; o.textContent = name || url; $('#d7g-st', root).appendChild(o); $('#d7g-st', root).value = stationsList.length - 1; playRadio(stationsList.length - 1); },
      state: function () { return { mode: S.mode, gen: S.layers[0].g, layers: S.layers.map(function (l) { return l.g; }), res: S.res, canvas: [cv.width, cv.height], glOk: S.glOk, glErr: S.glErr, live: live, radioOn: radioOn, beats: S.beats, auto: S.auto, fs: isFs(), milk: S.milkName, milkPresets: presetNames.length, stations: stationsList.length, levels: levels.a.map(function (x) { return Math.round(x * 100) / 100; }), simBeat: !live }; }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
