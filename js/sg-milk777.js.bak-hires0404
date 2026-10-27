/* Super G · Kali Radio + MilkDrop x777 (butterchurn, local). Stations: js/d7-stations.js */
(function(){var $=id=>document.getElementById(id),S=window.D7_STATIONS||[],i=+(localStorage.getItem('sg.st')||0)%Math.max(S.length,1);
var A=$('kr-a'),C=$('mk-c'),W=$('mk-w'),N=$('mk-n'),G=$('mk-g'),ctx,an,viz,P={},K=[],cur=-1,auto=true,lastSw=0,src=null,mic=null,data;
$('kr-l').innerHTML=S.map((s,k)=>`<option value="${k}">${s[0]}</option>`).join('');$('kr-l').value=i;
A.crossOrigin='anonymous';A.preload='none';A.volume=+(localStorage.getItem('sg.vol')||.8);$('kr-v').value=A.volume;
function st(t){$('kr-s').textContent=t}
function ac(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();an=ctx.createAnalyser();an.fftSize=512;data=new Uint8Array(an.frequencyBinCount);an.connect(ctx.destination)}if(ctx.state=='suspended')ctx.resume();return ctx}
function hook(){ac();if(!src){try{src=ctx.createMediaElementSource(A);src.connect(an)}catch(e){}}initViz()}
function useMic(){navigator.mediaDevices&&navigator.mediaDevices.getUserMedia({audio:true}).then(s=>{ac();mic=ctx.createMediaStreamSource(s);var g=ctx.createGain();mic.connect(g);if(viz)viz.connectAudio(g);mic.connect(an);an.disconnect();st('🎤 wizualizacja z mikrofonu (CORS blokuje stream)')}).catch(()=>st('⚠ brak audio do wizualizacji'))}
function play(k){if(k!=null){i=k;localStorage.setItem('sg.st',i);$('kr-l').value=i}hook();A.src=S[i][1];st('⏳ '+S[i][0]);A.play().then(()=>{st('▶ '+S[i][0]);$('kr-p').textContent='⏸'}).catch(e=>{st('⚠ '+e.name+' — kliknij ▶ / następna');})}
A.onerror=()=>{if(A.src)st('⚠ stacja nie odpowiada');};
$('kr-p').onclick=()=>{if(A.paused){if(!A.src)play();else{hook();A.play();$('kr-p').textContent='⏸'}}else{A.pause();$('kr-p').textContent='▶'}};
$('kr-n').onclick=()=>play((i+1)%S.length);$('kr-l').onchange=()=>play(+$('kr-l').value);
$('kr-v').oninput=()=>{A.volume=+$('kr-v').value;localStorage.setItem('sg.vol',A.volume)};
$('mk-mic').onclick=useMic;
function initViz(){if(viz||!window.butterchurn)return;var B=butterchurn.default||butterchurn;
 [window.butterchurnPresets,window.butterchurnPresetsExtra].forEach(m=>{try{Object.assign(P,(m.default||m).getPresets())}catch(e){}});K=Object.keys(P);
 size();viz=B.createVisualizer(ctx,C,{width:C.width,height:C.height,pixelRatio:1,textureRatio:1});
 viz.connectAudio(src||an);rnd(0);requestAnimationFrame(loop)}
function size(){var d=Math.min(devicePixelRatio||1,1.5),r=W.getBoundingClientRect();C.width=Math.max(320,r.width*d|0);C.height=Math.max(200,r.height*d|0);if(viz)viz.setRendererSize(C.width,C.height)}
addEventListener('resize',size);document.addEventListener('fullscreenchange',()=>setTimeout(size,100));
function load(k,b){if(!K.length)return;cur=(k+K.length)%K.length;viz.loadPreset(P[K[cur]],b);N.textContent='777 · '+K[cur];lastSw=performance.now()}
function rnd(b){load(Math.random()*K.length|0,b==null?2.7:b)}
$('mk-r').onclick=()=>viz&&rnd();$('mk-x').onclick=()=>viz&&load(cur+1,2.7);
$('mk-7').onclick=()=>{auto=!auto;$('mk-7').classList.toggle('on',auto)};
$('mk-f').onclick=()=>{hook();var f=W.requestFullscreen||W.webkitRequestFullscreen;document.fullscreenElement?document.exitFullscreen():f&&f.call(W)};
$('mk-start').onclick=()=>{hook();if(A.paused)play();$('mk-start').style.display='none'};
function loop(t){requestAnimationFrame(loop);if(document.hidden)return;viz.render();
 if(auto&&t-lastSw>15000)rnd();if(an){an.getByteFrequencyData(data);var b=0;for(var q=0;q<8;q++)b+=data[q];b/=2040;G.style.transform='translate(-50%,-50%) scale('+(1+b*.45).toFixed(3)+')';G.style.filter='drop-shadow(0 0 '+(8+b*40|0)+'px #ff4d00)'}}
})();
