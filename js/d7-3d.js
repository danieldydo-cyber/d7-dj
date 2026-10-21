/* v71 · Super X G 3D: WebGL visual modes (tunnel, starfield flythrough, spectrum terrain, sacred geometry, MilkDrop on a sphere) + 🦈 shark swimming in 3D.
   Beat-synced (D7Ctl.level/spectrum), resolution from D7Res (auto = native × DPR, adaptive FPS). No text is ever drawn. */
(function(){'use strict';if(window.D73D)return;var D=document,H=D.documentElement,BASE=(window.D7Ctl&&D7Ctl.base)||'';
var MODES=['tunnel','stars','terrain','shapes','sphere'];var ST={on:false,mode:localStorage.getItem('d7_3dmode')||'tunnel',fps:0,frames:0,w:0,h:0};
var cv=D.createElement('canvas');cv.id='d7three';cv.style.cssText='position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:3;display:none';
var gl=null,prog=null,sprog=null,buf=null,sbuf=null,tex=null,stex=null,U={},SU={},img=new Image(),imgOk=false;img.onload=function(){imgOk=true;if(gl)upShark()};img.src=BASE+'img/rekin.png';
var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS=['precision highp float;uniform vec2 R;uniform float T,B,M;uniform float S[8];uniform sampler2D X;uniform float XT;',
'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
'vec3 pal(float t){return .5+.5*cos(6.2832*(t+vec3(0.,.33,.67)));}',
'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
'float sdOct(vec3 p,float s){p=abs(p);return (p.x+p.y+p.z-s)*.57735;}',
'float sdTor(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}',
'float bands(float x){int i=int(clamp(x,0.,7.));float v=0.;for(int k=0;k<8;k++){if(k==i)v=S[k];}return v;}',
'vec3 stars(vec2 p,float t){vec3 c=vec3(0.);for(int L=0;L<4;L++){float z=fract(float(L)*.25-t*.08*(1.+B*2.));float sc=mix(18.,1.5,z);vec2 q=p*sc+float(L)*7.3;vec2 id=floor(q),f=fract(q)-.5;float r=h1(id);if(r>.82){float d=length(f-vec2(h1(id+1.)-.5,h1(id+2.)-.5)*.6);c+=pal(r+T*.05)*smoothstep(.06*z+.01,0.,d)*z*2.;}}return c;}',
'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=(gl_FragCoord.xy-.5*R)/R.y;vec3 col=vec3(0.);float t=T;',
' if(M<.5){float a=atan(p.y,p.x),r=length(p)+.001;vec2 q=vec2(.35/r+t*(.6+B*1.5),a/3.1416*3.);float g=smoothstep(.45,.5,abs(fract(q.x*2.)-.5))+smoothstep(.45,.5,abs(fract(q.y*2.)-.5));',
'  col=pal(q.x*.1+t*.05+B*.3)*(g*.9+.15)*smoothstep(0.,.35,r)*(1.+B*1.5);col+=stars(p*rot(t*.1),t)*.7;}',
' else if(M<1.5){col=stars(p*rot(t*.05),t*1.6)*1.6+vec3(.02,.0,.05);col+=pal(t*.03)*.15*exp(-length(p)*3.)*(1.+B*3.);}',
' else if(M<2.5){vec3 ro=vec3(0.,1.2+B*.3,t*2.),rd=normalize(vec3(p.x,p.y-.25,1.));float d=0.;vec3 c=vec3(0.);for(int i=0;i<70;i++){vec3 q=ro+rd*d;float bx=bands(mod(abs(q.x)*1.3,8.));float hh=(sin(q.x*.8+t)*cos(q.z*.6)*.35+bx*1.4)*(.6+B);float s=q.y-hh;if(s<.01){float gl2=smoothstep(.06,0.,abs(fract(q.x)-.5)-.44)+smoothstep(.06,0.,abs(fract(q.z)-.5)-.44);c=mix(pal(hh*.4+t*.05),vec3(1.),gl2*.4)*(.3+gl2)*exp(-d*.06);break;}d+=max(s*.5,.03);if(d>40.)break;}',
'  col=c+vec3(.05,0.,.1)*(1.-uv.y)+stars(p,t)*.3*step(.0,p.y);}',
' else if(M<3.5){vec3 ro=vec3(0.,0.,-3.5),rd=normalize(vec3(p,1.3));float d=0.,gl3=0.;for(int i=0;i<64;i++){vec3 q=ro+rd*d;q.xz*=rot(t*.5);q.xy*=rot(t*.3);float s1=sdOct(q,1.+B*.4),s2=sdTor(q,vec2(1.6+B*.3,.05)),s3=sdTor(q.yxz,vec2(1.9,.03));float s=min(s1,min(s2,s3));gl3+=.012/(.02+abs(s));if(s<.002)break;d+=s;if(d>12.)break;}',
'  col=pal(t*.07+d*.05)*gl3*.25*(1.+B*1.5)+stars(p,t)*.4;}',
' else {vec3 ro=vec3(0.,0.,-3.),rd=normalize(vec3(p,1.4));float b=dot(ro,rd),c2=dot(ro,ro)-1.3-B*.3,h=b*b-c2;col=stars(p,t)*.6;if(h>0.){float d=-b-sqrt(h);vec3 n=normalize(ro+rd*d);vec3 m=n;m.xz*=rot(t*.4);vec2 su=vec2(atan(m.z,m.x)/6.2832+.5,acos(clamp(m.y,-1.,1.))/3.1416);',
'  vec3 tx=XT>.5?texture2D(X,su).rgb:vec3(0.);vec3 pl=pal(su.x*2.+su.y+t*.1)*(.5+.5*sin(su.y*30.+t*3.));float lum=dot(tx,vec3(.33));vec3 base=mix(pl,tx*1.4,smoothstep(.02,.15,lum));float l=max(dot(n,normalize(vec3(.5,.6,-1.))),0.);col=base*(.35+.9*l)*(1.+B)+pow(1.-abs(dot(n,-rd)),3.)*vec3(.6,.3,1.);}}',
' col*=1.-.35*length(uv-.5);gl_FragColor=vec4(pow(col,vec3(.9)),1.);}'].join('\n');
/* shark: segmented quad strip in 3D (perspective), tail bend in vertex shader */
var SVS='attribute vec2 a;uniform vec3 P;uniform float SZ,TT,DIR,AR,ASP,B;varying vec2 v;void main(){float u=a.x;v=vec2(DIR>0.?1.-u:u,1.-a.y);float bend=sin(TT*6.*(1.+B)+u*4.)*.12*pow(u,1.5);vec3 w=vec3(P.x+(u-.5)*SZ*DIR,P.y+(a.y-.5)*SZ*AR+bend*SZ,P.z+sin(u*3.+TT)*.2);float z=w.z+3.;gl_Position=vec4(w.x/z*1.6/ASP,w.y/z*1.6,0.,1.);}';
var SFS='precision highp float;uniform sampler2D K;uniform float HUE,B;varying vec2 v;vec3 hr(vec3 c,float h){const vec3 k=vec3(.57735);float ca=cos(h);return c*ca+cross(k,c)*sin(h)+k*dot(k,c)*(1.-ca);}void main(){vec4 c=texture2D(K,v);if(c.a<.05)discard;gl_FragColor=vec4(hr(c.rgb,HUE)*(1.+B*.6),c.a);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
function pg(v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
function init(){if(gl)return true;D.body.appendChild(cv);gl=cv.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false,powerPreference:'high-performance'});if(!gl)return false;
 prog=pg(VS,FS);buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);['R','T','B','M','S','X','XT'].forEach(function(n){U[n]=gl.getUniformLocation(prog,n)});
 tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE)});gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 sprog=pg(SVS,SFS);var N=24,a=[];for(var i=0;i<=N;i++){a.push(i/N,0,i/N,1)}sbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,sbuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);sbuf.n=(N+1)*2;
 ['P','SZ','TT','DIR','AR','ASP','B','K','HUE'].forEach(function(n){SU[n]=gl.getUniformLocation(sprog,n)});stex=gl.createTexture();if(imgOk)upShark();
 cv.addEventListener('webglcontextlost',function(e){e.preventDefault();gl=null},false);return true}
function upShark(){if(!stex)return;gl.bindTexture(gl.TEXTURE_2D,stex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE)});gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);stex.ok=true}
var fish=[];function spawn(){var n=1+(Math.random()*3|0);fish=[];for(var i=0;i<n;i++)fish.push({z:-1+Math.random()*4,y:(Math.random()-.5)*1.6,ph:Math.random()*6,sp:.25+Math.random()*.35,dir:Math.random()<.5?1:-1,sz:.7+Math.random()*.9,x:-4+Math.random()*8});ST.nextVar=performance.now()+15000+Math.random()*15000}spawn();
function level(){try{return window.D7Ctl?D7Ctl.level():0}catch(e){return 0}}
function spec(L){try{if(window.D7Ctl&&D7Ctl.spectrum)return D7Ctl.spectrum()}catch(e){}var a=[];for(var i=0;i<8;i++)a.push(Math.max(0,L*(1-i/9)+.15*Math.sin(performance.now()/300+i)));return a}
function target(){var pure=window.D7Ctl&&D7Ctl.pure();if(pure)return{x:0,y:0,w:innerWidth,h:innerHeight,pure:true};var c=window.D7Ctl&&D7Ctl.vizCanvas();if(!c)return null;var r=c.getBoundingClientRect();if(r.width<40||r.height<40)return null;return{x:Math.max(0,r.left),y:Math.max(0,r.top),w:Math.min(innerWidth,r.right)-Math.max(0,r.left),h:Math.min(innerHeight,r.bottom)-Math.max(0,r.top),c:c}}
var last=0,fc=0,ft=0,t0=performance.now();
function frame(t){if(!ST.on)return;requestAnimationFrame(frame);if(D.hidden)return;var tg=target();if(!tg){cv.style.display='none';return}cv.style.display='block';
 if(!gl&&!init())return;if(!gl)return;
 cv.style.left=tg.x+'px';cv.style.top=tg.y+'px';cv.style.width=tg.w+'px';cv.style.height=tg.h+'px';cv.style.zIndex=tg.pure?'2147483002':(tg.c&&tg.c.id=='cosmoMilk'?'2':'3');
 var dpr=Math.min(devicePixelRatio||1,3),wh=window.D7Res?D7Res.fit(Math.round(tg.w*dpr),Math.round(tg.h*dpr)):[tg.w,tg.h];if(cv.width!=wh[0]||cv.height!=wh[1]){cv.width=wh[0];cv.height=wh[1]}ST.w=cv.width;ST.h=cv.height;
 fc++;if(t-ft>=1000){ST.fps=Math.round(fc*1000/(t-ft));fc=0;ft=t}
 var T=(t-t0)/1000,Lv=level(),S=spec(Lv),mi=MODES.indexOf(ST.mode);gl.viewport(0,0,cv.width,cv.height);gl.disable(gl.BLEND);gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,buf);var lp=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
 gl.uniform2f(U.R,cv.width,cv.height);gl.uniform1f(U.T,T);gl.uniform1f(U.B,Lv);gl.uniform1f(U.M,mi);gl.uniform1fv(U.S,new Float32Array(S));var hasX=0;
 if(ST.mode=='sphere'){var src=(tg.c&&tg.c!==cv)?tg.c:(window.D7Ctl&&D7Ctl.vizCanvas());if(src&&src.width>2){try{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,src);hasX=1}catch(e){}}}
 gl.uniform1i(U.X,0);gl.uniform1f(U.XT,hasX);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 if(window.D7Ctl&&D7Ctl.sharkState().on&&stex&&stex.ok){if(t>ST.nextVar)spawn();gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(sprog);gl.bindBuffer(gl.ARRAY_BUFFER,sbuf);var la=gl.getAttribLocation(sprog,'a');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,stex);gl.uniform1i(SU.K,1);gl.uniform1f(SU.ASP,cv.width/cv.height);gl.uniform1f(SU.B,Lv);gl.uniform1f(SU.HUE,T*.25);gl.uniform1f(SU.AR,img.naturalHeight/img.naturalWidth||1);
  fish.forEach(function(f){f.x+=f.dir*f.sp*(1+Lv)*(1/60);if(Math.abs(f.x)>5){f.x=-5*f.dir;f.z=-1+Math.random()*4;f.y=(Math.random()-.5)*1.6}gl.uniform3f(SU.P,f.x,f.y+Math.sin(T*.7+f.ph)*.3,f.z+Math.sin(T*.4+f.ph)*.8);gl.uniform1f(SU.SZ,f.sz*(1+Lv*.2));gl.uniform1f(SU.TT,T+f.ph);gl.uniform1f(SU.DIR,f.dir);gl.drawArrays(gl.TRIANGLE_STRIP,0,sbuf.n)})}}
function on(v){ST.on=!!v;localStorage.setItem('d7_3d',v?'1':'0');if(v){if(init())requestAnimationFrame(frame)}else cv.style.display='none';H.classList.toggle('d73d',ST.on)}
function mode(m){if(MODES.indexOf(m)<0)m=MODES[(MODES.indexOf(ST.mode)+1)%MODES.length];ST.mode=m;localStorage.setItem('d7_3dmode',m);return m}
window.D73D={on:on,mode:mode,modes:MODES,state:function(){return{on:ST.on,mode:ST.mode,fps:ST.fps,w:ST.w,h:ST.h,visible:cv.style.display=='block',gl:!!gl}}};
if(localStorage.getItem('d7_3d')=='1')on(true);})();
