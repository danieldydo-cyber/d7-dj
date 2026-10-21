/* Super G · Kali Radio + MilkDrop x777 v2: lazy butterchurn, adaptive hi-res, themes 🦈😈👽 + 777 mix. Stations: js/d7-stations.js */
(function(){var $=id=>document.getElementById(id),S=window.D7_STATIONS||[],i=+(localStorage.getItem('sg.st')||0)%Math.max(S.length,1);
var A=$('kr-a'),C=$('mk-c'),O=$('mk-o'),ox=O.getContext('2d'),W=$('mk-w'),N=$('mk-n'),G=$('mk-g'),Q=$('mk-q'),ctx,an,viz,P={},K=[],cur=-1,auto=true,lastSw=0,src=null,data,bcP=null;
var THEMES={shark:{re:/ocean|sea|water|aqua|blue|deep|fish|wave|liquid|tide|jelly|swim/i,cur:['Flexi - alien fish pond','Martin - liquid arrows','Flexi + stahlregen - jelly showoff parade']},
 diablo:{re:/fire|flame|hell|\bred\b|burn|demon|lava|inferno|blood|devil/i,cur:['Cope - The Neverending Explosion of Red Liquid Fire','beta106i - Burning Form','martin - into the fireworks']},
 alien:{re:/alien|ufo|space|star|cosmic|galax|planet|nebula|martian|orb/i,cur:['Flexi - alien fish pond','Fumbling_Foo & Flexi, Martin, Orb, Unchained - Star Nova','TonyMilkdrop - Magellan']}};
var theme=localStorage.getItem('sg.theme')||'mix',live=theme=='mix'?'shark':theme,mixT=0,qual=localStorage.getItem('sg.q')||'auto';
var STEPS=[.5,.75,1,1.25,1.5,2,2.5,3],si=2,fr=0,fT=0,good=0,fps=0;
/* ---- radio ---- */
$('kr-l').innerHTML=S.map((s,k)=>`<option value="${k}">${s[0]}</option>`).join('');$('kr-l').value=i;
A.crossOrigin='anonymous';A.preload='none';A.volume=+(localStorage.getItem('sg.vol')||.8);$('kr-v').value=A.volume;
function st(t){$('kr-s').textContent=t}
function ac(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();an=ctx.createAnalyser();an.fftSize=512;data=new Uint8Array(an.frequencyBinCount);an.connect(ctx.destination)}if(ctx.state=='suspended')ctx.resume();return ctx}
function hook(){ac();if(!src){try{src=ctx.createMediaElementSource(A);src.connect(an)}catch(e){}}return initViz()}
function useMic(){navigator.mediaDevices&&navigator.mediaDevices.getUserMedia({audio:true}).then(s=>{ac();var m=ctx.createMediaStreamSource(s),g=ctx.createGain();m.connect(g);m.connect(an);an.disconnect();hook().then(()=>viz&&viz.connectAudio(g));st('🎤 wizualizacja z mikrofonu (CORS blokuje stream)')}).catch(()=>st('⚠ brak audio do wizualizacji'))}
function play(k){if(k!=null){i=k;localStorage.setItem('sg.st',i);$('kr-l').value=i}hook();A.src=S[i][1];st('⏳ '+S[i][0]);A.play().then(()=>{st('▶ '+S[i][0]);$('kr-p').textContent='⏸'}).catch(e=>st('⚠ '+e.name+' — kliknij ▶ / następna'))}
A.onerror=()=>{if(A.src)st('⚠ stacja nie odpowiada')};
$('kr-p').onclick=()=>{if(A.paused){if(!A.src)play();else{hook();A.play();$('kr-p').textContent='⏸'}}else{A.pause();$('kr-p').textContent='▶'}};
$('kr-n').onclick=()=>play((i+1)%S.length);$('kr-l').onchange=()=>play(+$('kr-l').value);
$('kr-v').oninput=()=>{A.volume=+$('kr-v').value;localStorage.setItem('sg.vol',A.volume)};$('mk-mic').onclick=useMic;
/* ---- lazy butterchurn ---- */
function js(u){return new Promise((ok,no)=>{var s=document.createElement('script');s.src=u;s.async=false;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function loadBC(){return bcP||(bcP=Promise.all(['js/butterchurn.min.js','js/butterchurnPresets.min.js','js/butterchurnPresetsExtra.min.js'].map(js)))}
if('IntersectionObserver' in window){var io=new IntersectionObserver(e=>{if(e[0].isIntersecting){io.disconnect();(window.requestIdleCallback||setTimeout)(loadBC)}},{rootMargin:'200px'});io.observe(W)}
function initViz(){if(viz)return Promise.resolve();return loadBC().then(()=>{if(viz)return;var B=butterchurn.default||butterchurn;
 [window.butterchurnPresets,window.butterchurnPresetsExtra].forEach(m=>{try{Object.assign(P,(m.default||m).getPresets())}catch(e){}});K=Object.keys(P);
 si=startStep();size();viz=B.createVisualizer(ctx,C,{width:C.width,height:C.height,pixelRatio:1,textureRatio:1});viz.connectAudio(src||an);rnd(0);requestAnimationFrame(loop)})}
/* ---- adaptive resolution ---- */
function fs(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
function maxStep(){var d=devicePixelRatio||1,m=qual=='eco'?.75:qual=='ultra'?Math.min(3,d*(fs()?1.5:1.25)):Math.min(fs()?3:2,d);var k=0;STEPS.forEach((s,j)=>{if(s<=m+1e-3)k=j});return k}
function startStep(){if(qual=='eco')return 1;var d=devicePixelRatio||1,k=0;STEPS.forEach((s,j)=>{if(s<=Math.min(d,qual=='ultra'?3:2)+1e-3)k=j});return Math.min(k,maxStep())}
function size(){var r=W.getBoundingClientRect(),s=STEPS[si],w=Math.max(160,r.width*s|0),h=Math.max(100,r.height*s|0);if(C.width!=w||C.height!=h){C.width=w;C.height=h;if(viz)viz.setRendererSize(w,h)}
 var os=Math.min(s,1.5);O.width=r.width*os|0;O.height=r.height*os|0;Q.textContent=(qual.toUpperCase())+' · '+s+'x · '+w+'×'+h+(fps?' · '+fps+' fps':'')}
var rz;function resize(){clearTimeout(rz);rz=setTimeout(()=>{si=Math.min(Math.max(si,qual=='auto'&&fs()?si:si),maxStep());if(fs()&&qual!='eco')si=maxStep();size()},120)}
addEventListener('resize',resize);addEventListener('orientationchange',resize);document.addEventListener('fullscreenchange',resize);document.addEventListener('webkitfullscreenchange',resize);
function adapt(t){fr++;if(!fT)fT=t;if(t-fT<2000)return;fps=Math.round(fr*1000/(t-fT));fr=0;fT=t;if(qual=='auto'){
 if(fps<50&&si>0){si--;good=0;size()}else if(fps>=57&&si<maxStep()){if(++good>=3){si++;good=0;size()}}else good=0}size()}
document.querySelectorAll('[data-q]').forEach(b=>{b.classList.toggle('on',b.dataset.q==qual);b.onclick=()=>{qual=b.dataset.q;localStorage.setItem('sg.q',qual);document.querySelectorAll('[data-q]').forEach(x=>x.classList.toggle('on',x==b));si=startStep();if(fs()&&qual!='eco')si=maxStep();size()}});
/* ---- presets per theme ---- */
function pool(){if(theme=='none'||!THEMES[live])return K;var T=THEMES[live],c=K.filter(k=>T.cur.some(x=>k.indexOf(x)==0)),f=K.filter(k=>T.re.test(k));return c.concat(f).length?c.concat(f,c):K}
function load(name,b){if(!name)return;cur=K.indexOf(name);viz.loadPreset(P[name],b);N.textContent='777 · '+(theme=='none'?'':ICON[live]+' ')+name;lastSw=performance.now()}
function rnd(b){var L=pool();load(L[Math.random()*L.length|0],b==null?2.7:b)}
$('mk-r').onclick=()=>viz&&rnd();$('mk-x').onclick=()=>viz&&load(K[(cur+1)%K.length],2.7);
$('mk-7').onclick=()=>{auto=!auto;$('mk-7').classList.toggle('on',auto)};
$('mk-f').onclick=()=>{hook();var f=W.requestFullscreen||W.webkitRequestFullscreen;fs()?(document.exitFullscreen||document.webkitExitFullscreen).call(document):f&&f.call(W)};
$('mk-start').onclick=()=>{hook();if(A.paused)play();$('mk-start').style.display='none'};
var ICON={shark:'🦈',diablo:'😈',alien:'👽'};
document.querySelectorAll('[data-th]').forEach(b=>{b.classList.toggle('on',b.dataset.th==theme);b.onclick=()=>{theme=b.dataset.th;localStorage.setItem('sg.theme',theme);live=theme=='mix'?'shark':theme;mixT=performance.now();document.querySelectorAll('[data-th]').forEach(x=>x.classList.toggle('on',x==b));if(viz)rnd()}});
/* ---- overlays: one canvas, pooled objects ---- */
var SH=[],FL=[],ST=[],bassAvg=.2,kick=0;for(var n=0;n<6;n++)SH.push({x:Math.random(),y:.2+Math.random()*.6,v:(.0006+Math.random()*.0012)*(n%2?1:-1),s:.5+Math.random()*.7,m:0});
for(n=0;n<140;n++)FL.push({on:0,x:0,y:0,vx:0,vy:0,l:0});for(n=0;n<160;n++)ST.push({a:Math.random()*6.283,r:Math.random(),z:Math.random()});
function shark(x,y,s,dir,m){ox.save();ox.translate(x,y);ox.scale(s*dir,s);ox.fillStyle='rgba(10,40,70,.85)';ox.strokeStyle='#4ff0ff';ox.lineWidth=1.5;ox.beginPath();
 ox.moveTo(60,0);ox.quadraticCurveTo(20,-22,-40,-6);ox.lineTo(-70,-26);ox.lineTo(-58,0);ox.lineTo(-70,24);ox.lineTo(-40,6);ox.quadraticCurveTo(10,20,48,10+m*10);ox.lineTo(60,0);ox.closePath();ox.fill();ox.stroke();
 ox.beginPath();ox.moveTo(0,-14);ox.lineTo(-12,-42);ox.lineTo(-20,-10);ox.fill();ox.stroke();ox.fillStyle='#fff';ox.beginPath();ox.arc(40,-5,2.5,0,7);ox.fill();
 if(m>.2){ox.fillStyle='#fff';for(var t=0;t<4;t++){ox.beginPath();ox.moveTo(52-t*6,2);ox.lineTo(49-t*6,2+6*m);ox.lineTo(46-t*6,2);ox.fill()}}ox.restore()}
function draw(t,b,k){var w=O.width,h=O.height,u=Math.min(w,h)/360;ox.clearRect(0,0,w,h);if(theme=='none')return;
 if(live=='shark'){var g=ox.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,30,60,.15)');g.addColorStop(1,'rgba(0,60,80,.45)');ox.fillStyle=g;ox.fillRect(0,0,w,h);
  SH.forEach(s=>{s.x+=s.v*(1+b*2);if(s.x>1.2)s.x=-.2;if(s.x<-.2)s.x=1.2;s.m=Math.max(s.m*.85,k);shark(s.x*w,(s.y+Math.sin(t/900+s.s*9)*.03)*h,s.s*u,s.v>0?1:-1,s.m)})}
 else if(live=='diablo'){var g2=ox.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,h*.8);g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(90,0,0,'+(.45+b*.3)+')');ox.fillStyle=g2;ox.fillRect(0,0,w,h);
  var spawn=Math.round(b*10+k*20);FL.forEach(p=>{if(!p.on&&spawn>0){spawn--;p.on=1;p.x=Math.random()*w;p.y=h+5;p.vx=(Math.random()-.5)*u;p.vy=-(2+Math.random()*4+b*6)*u;p.l=1}
   if(p.on){p.x+=p.vx;p.y+=p.vy;p.l-=.018;if(p.l<=0)p.on=0;else{ox.fillStyle='rgba(255,'+(80+p.l*150|0)+',0,'+p.l.toFixed(2)+')';ox.beginPath();ox.arc(p.x,p.y,(3+p.l*6)*u,0,7);ox.fill()}}});
  [[w*.12,h*.18],[w*.88,h*.18]].forEach(c=>{ox.save();ox.translate(c[0],c[1]);ox.scale(u*(1+k*.2),u*(1+k*.2));ox.fillStyle='#ff1a1a';ox.beginPath();ox.moveTo(-22,0);ox.quadraticCurveTo(-30,-30,-14,-42);ox.quadraticCurveTo(-18,-20,-8,-6);ox.moveTo(22,0);ox.quadraticCurveTo(30,-30,14,-42);ox.quadraticCurveTo(18,-20,8,-6);ox.fill();ox.fillStyle='#ffcc00';ox.fillRect(-12,4,8,4);ox.fillRect(4,4,8,4);ox.restore()})}
 else if(live=='alien'){ox.fillStyle='rgba(0,10,0,.25)';ox.fillRect(0,0,w,h);var cx=w/2,cy=h/2,R=Math.hypot(w,h)/2;ST.forEach(s=>{s.z+=.004+b*.03;if(s.z>1){s.z=.02;s.a=Math.random()*6.283}var r=s.z*s.z*R;ox.fillStyle='rgba(180,255,190,'+s.z.toFixed(2)+')';ox.fillRect(cx+Math.cos(s.a)*r,cy+Math.sin(s.a)*r,1+s.z*2*u,1+s.z*2*u)});
  var ux=w/2+Math.sin(t/1400)*w*.3,uy=h*.18+Math.sin(t/700)*8*u,bw=(40+b*120)*u;if(b>.25){var bg=ox.createLinearGradient(0,uy,0,h);bg.addColorStop(0,'rgba(57,255,136,'+(b*.7).toFixed(2)+')');bg.addColorStop(1,'rgba(57,255,136,0)');ox.fillStyle=bg;ox.beginPath();ox.moveTo(ux-16*u,uy);ox.lineTo(ux+16*u,uy);ox.lineTo(ux+bw,h);ox.lineTo(ux-bw,h);ox.fill()}
  ox.save();ox.translate(ux,uy);ox.scale(u,u);ox.shadowColor='#39ff88';ox.shadowBlur=18;ox.fillStyle='#1b3';ox.beginPath();ox.ellipse(0,0,46,12,0,0,7);ox.fill();ox.fillStyle='#9fffc8';ox.beginPath();ox.ellipse(0,-9,18,13,0,3.14,6.29);ox.fill();ox.shadowBlur=0;
  for(var q=0;q<5;q++){ox.fillStyle=(q+(t/150|0))%2?'#ffee58':'#39ff88';ox.beginPath();ox.arc(-32+q*16,3,3,0,7);ox.fill()}ox.restore();ox.font=(28*u|0)+'px serif';ox.fillText('👽',ux-14*u,uy-22*u)}}
function loop(t){requestAnimationFrame(loop);if(document.hidden)return;if(qual=='eco'&&t-(loop.l||0)<31)return;loop.l=t;viz.render();adapt(t);
 if(auto&&t-lastSw>15000)rnd();if(theme=='mix'&&t-mixT>30000){mixT=t;live={shark:'diablo',diablo:'alien',alien:'shark'}[live];rnd()}
 var b=0,k=0;if(an){an.getByteFrequencyData(data);for(var q=0;q<8;q++)b+=data[q];b/=2040;bassAvg=bassAvg*.95+b*.05;k=b>bassAvg*1.3&&b>.35?1:0}
 G.style.transform='translate(-50%,-50%) scale('+(1+b*.45).toFixed(3)+')';G.style.filter='drop-shadow(0 0 '+(8+b*40|0)+'px '+(live=='alien'?'#39ff88':live=='shark'?'#4ff0ff':'#ff4d00')+')';draw(t,b,k)}
})();
