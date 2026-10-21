/* Super G DJ HIPHOP X 🐲 — hip-hop hub (free tools only: WebAudio + Pollinations text) */
(function(){'use strict';
/* v1064: the PRO8 sub-page registers sw.js; on activation it asks every open window for its version and NAVIGATES (reloads) windows that don't answer.
   The launcher host answers "I'm current" so opening PRO8 no longer reloads the whole app / closes the overlay. */
try{if(navigator.serviceWorker){navigator.serviceWorker.addEventListener('message',function(e){var d=e.data;if(d&&d.type=='d7-version?'&&e.ports&&e.ports[0])e.ports[0].postMessage({v:d.v})});navigator.serviceWorker.startMessages&&navigator.serviceWorker.startMessages()}}catch(e){}
var TABS=[['bb','🐲 Start · Super Bot G 777',null],['brains','🧠 7 Mózgów',null],['agents','🤖 777 agentów',null],['bots','⚙️ Ustawienia botów',null],['fix','🛡 7777 Auto-Fix',null],['milk','🌌 MilkDrop',null],['hiphop','🎤 HIPHOP X',null],['dxf','💎 DXF','dxf/index.html'],['dl','⬇ Pobierz APK',null],['pay','💖 Wsparcie / Płatności',null],['super','🧠 D7 SUPER (boty)','super.html'],['pro8','🎧 D7 DJ PRO8','pro8-tile.html'],
['pioneer','🎚 Pioneer PRO DJ (WeDJ 2-deck)','wedj.html'],['remix','🎛 Remixlive X (pady, FX, Audio In)','remixlive.html'],['gpro2','😈 Super Bot G Pro v2','gpro.html'],['ubots','🤖 Universal Bots','bots.html'],['apk','⬇ Pobierz APK 7D','download.html'],['ios','📱 iPhone 7D (PWA)','ios.html'],['kalir','📻 Kali Radio (Butterchurn)','kali.html'],['dradio','📻 D Radio','d/radio.html'],['dsong','🎵 D Song','d/song.html'],['ddl','⬇ D Download','d/download.html'],['v38pro8','🏛 v38 PRO8 (oryginał)','index.html'],['v38kali','🏛 v38 Kali Live (oryginał)','kali-live.html'],['v38pro','🏛 v38 PRO DJ (oryginał)','pro-dj.html'],['dxfkali','DXF · Kali Live','dxf/kali-live.html'],['dxfkr','DXF · Kali Radio','dxf/kali.html'],['dxfpro','DXF · PRO DJ','dxf/pro-dj.html'],['pioneerold','🎚 Pioneer (stary)','pro-dj-tile.html'],['kali','📻 Kali Live','kali-live-tile.html'],['x7s','X71/X7S classic','classic.html'],
['sbg','🤖 SuperBot G','superbotg.html'],['g','G','g.html'],['gpro','G PRO','g-pro.html'],['gdj','G DJ Super PRO','g-dj-super-pro.html'],
['superapp','SuperApp','superapp.html'],['radiogen','📡 Radio Gen','radio-gen.html'],['dj','DJ','dj.html'],['app','App','app.html'],
['v51','v51','v51.html'],['dpage','D','d.html'],['mrd','💧 Mr D Fluid','public-chat.html'],['studio','🎛 D77 Studio','d/studio.html'],
['builder','🛠 D Builder','d/builder.html'],['dagents','🤖 D agenci','d/agents.html'],['kalic','Kali classic','kali-live-classic.html'],['proc','Pioneer classic','pro-dj-classic.html']];
var nav=document.getElementById('nav'),hh=document.getElementById('t-hiphop'),SCR=document.querySelector('script[src*=hiphopx]');
/* v1064 launcher: grid of tiles → ONE page at a time in a fullscreen overlay. Only one iframe alive (destroyed on close/switch).
   Toolbar: ⛶ fullscreen · ▶ AUTO (postMessage d7:auto) · 🔄 reload · ↗ new tab · ✕ close. Esc / Android back closes. */
var cur=null,busy=0,BTN={},OV,OVB,OVT,ifr=null,LD;
(function(){var g=document.createElement('div');g.id='launch';nav.appendChild(g);
 var top=document.createElement('div');top.className='row';top.innerHTML='<button type="button" class="b" id="gAuto" style="font-size:16px;background:#ff2d55">▶ AUTO: Super Bot G + MilkDrop + beat</button><button type="button" class="b" id="gFs">⛶ Pełny ekran</button>';nav.insertBefore(top,g);
 OV=document.createElement('div');OV.id='hxov';OV.innerHTML='<div id="hxbar"><b id="hxtitle"></b><span style="flex:1"></span><button type="button" class="b" id="hxFs" title="Pełny ekran">⛶</button><button type="button" class="b" id="hxAuto">▶ AUTO</button><button type="button" class="b" id="hxRe" title="Przeładuj">🔄</button><a class="b" id="hxNew" target="_blank" rel="noopener" style="text-decoration:none" title="Nowa karta">↗</a><button type="button" class="b" id="hxX" style="background:#ff2d55">✕ Zamknij</button></div><div id="hxbody"></div>';
 document.body.appendChild(OV);OVB=OV.querySelector('#hxbody');OVT=OV.querySelector('#hxtitle')})();
function T(id){return TABS.filter(function(x){return x[0]==id})[0]}
function fsEl(){return window.D7FS?D7FS.el():(document.fullscreenElement||document.webkitFullscreenElement)}
function fsOn(el){if(window.D7FS)return D7FS.on(el);var r=el.requestFullscreen||el.webkitRequestFullscreen;if(r){try{var p=r.call(el);if(p&&p.catch)p.catch(function(){});}catch(e){}}}
function fsOff(){if(window.D7FS)return D7FS.off();var e=document.exitFullscreen||document.webkitExitFullscreen;if(e&&fsEl())try{var p=e.call(document);if(p&&p.catch)p.catch(function(){})}catch(x){}}
function fsToggle(){if(fsEl())fsOff();else fsOn(cur?OV:document.documentElement)}
function killFrame(){if(!ifr)return;try{ifr.contentWindow.postMessage({type:'d7:stop'},'*')}catch(e){}try{ifr.src='about:blank'}catch(e){}ifr.remove();ifr=null}
function park(){var s=cur&&document.getElementById('t-'+cur);if(s&&s.parentNode===OVB){s.classList.remove('on');document.body.insertBefore(s,SCR)}}
function open(id,noFs){var t=T(id)||TABS[0],now=Date.now();if(cur===t[0]&&OV.classList.contains('on'))return;if(now-busy<250){clearTimeout(open._q);open._q=setTimeout(function(){open(id,noFs)},260-(now-busy));return}busy=now; /*v1066: serialized opens — same tile = no-op, rapid taps queue the last one; previous frame is torn down before the next starts*/
 park();killFrame();OVB.innerHTML='';cur=t[0];OVT.textContent=t[1];OV.classList.add('on');document.body.classList.add('ovon');
 var href=t[2]||('hiphopx.html#'+t[0]);OV.querySelector('#hxNew').href=href;
 if(t[2]){LD=document.createElement('div');LD.className='hxld';LD.innerHTML='<div class="hxspin"></div><div>Ładuję '+t[1]+'…</div>';OVB.appendChild(LD);
  /* v1065 smooth open: overlay + spinner paint first; iframe is created after 2 frames + a short idle gap, then fades in when its first frame is painted */
  var f=ifr=document.createElement('iframe');f.setAttribute('allow','microphone;autoplay;midi;fullscreen;compute-pressure');f.title=t[1];var HV=/^(dxf|pro8|pioneerold|kali|x7s|v51|kalic|proc|gpro|gdj)$/.test(t[0]);if(HV)f.className='hxfade';
  f.onload=function(){if(f!==ifr)return;try{var d=f.contentDocument;if(d&&d.location.href!='about:blank'&&d.body&&!d.body.children.length){LD.innerHTML='⚠️ Pusta strona — użyj ↗ lub 🔄';return}}catch(e){}
   if(!HV){LD.style.display='none';return}requestAnimationFrame(function(){requestAnimationFrame(function(){if(f!==ifr)return;f.classList.add('in');setTimeout(function(){if(f===ifr)LD.style.display='none'},260)})})};
  setTimeout(function(){if(f===ifr&&LD.style.display!='none')LD.innerHTML='⏳ Wolne łącze… 🔄 przeładuj albo ↗ otwórz w nowej karcie'},15000);
  if(HV)requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(function(){if(f!==ifr)return;OVB.appendChild(f);f.src=t[2]},30)})});else{OVB.appendChild(f);f.src=t[2]}}
 else{var s=document.getElementById('t-'+t[0]);OVB.appendChild(s);s.classList.add('on')}
 if(!noFs)fsOn(OV);
 try{if(!history.state||!history.state.hxov)history.pushState({hxov:1},'','#'+t[0]);else history.replaceState({hxov:1},'','#'+t[0])}catch(e){}
 try{window.SBDJ&&SBDJ.onTab(t[0])}catch(e){}}
function close(fromPop){if(!cur)return;if(cur=='milk'&&window.SBMilk)SBMilk.on=false;park();killFrame();OVB.innerHTML='';cur=null;OV.classList.remove('on');document.body.classList.remove('ovon');fsOff();
 if(!fromPop)try{if(history.state&&history.state.hxov)history.back();else history.replaceState(null,'',location.pathname)}catch(e){}}
function auto(){var id=cur;if(!id)return;
 if(id=='hiphop'||id=='bb'){var p=document.getElementById('play');if(p&&/Play/.test(p.textContent))p.click()}
 else if(id=='milk'){var a=document.getElementById('mkAuto');if(a)a.checked=true;window.SBMilk&&SBMilk.start(false);var p2=document.getElementById('play');if(p2&&/Play/.test(p2.textContent))p2.click()}
 else if(id=='brains'){var q=document.getElementById('brQ');if(q&&!q.value)q.value='Zaproponuj plan setu hip-hop 90–95 BPM na 30 minut';document.getElementById('brGo').click()}
 else if(id=='agents'){var aq=document.getElementById('agQ');aq.value='mix';aq.oninput()}
 else if(ifr){try{ifr.contentWindow.postMessage({type:'d7:auto'},'*')}catch(e){}}}
var XB=OV.querySelector('#hxX');XB.onclick=function(){close()};XB.addEventListener('pointerup',function(e){if(e.button===0||e.pointerType!='mouse')close()});OV.querySelector('#hxFs').onclick=fsToggle;OV.querySelector('#hxAuto').onclick=auto;
OV.querySelector('#hxRe').onclick=function(){var id=cur;if(!id)return;if(T(id)[2]&&ifr){LD.style.display='';LD.textContent='⏳ Ładuję…';ifr.src=T(id)[2]}};
document.getElementById('gFs').onclick=fsToggle;
document.getElementById('gAuto').onclick=function(){var p=(window.HIPHOPX&&HIPHOPX.audio(),document.getElementById('play'));if(p&&/Play/.test(p.textContent))p.click();open('milk');setTimeout(function(){window.SBMilk&&SBMilk.start(false)},50)};
window.addEventListener('message',function(e){var d=e.data;if(d&&d.type=='d7:auto:done'&&cur){var b=OV.querySelector('#hxAuto');b.textContent=d.result?'✔ AUTO: '+String(d.result).slice(0,24):'▶ AUTO (brak akcji)';setTimeout(function(){b.textContent='▶ AUTO'},4000)}});
['fullscreenchange','webkitfullscreenchange'].forEach(function(ev){document.addEventListener(ev,function(){setTimeout(function(){try{ifr&&ifr.contentWindow.postMessage({type:'d7:resize'},'*')}catch(x){}window.dispatchEvent(new Event('resize'))},150);var e=fsEl();if(e&&e.tagName=='IFRAME'){fsOff();setTimeout(function(){fsOn(OV)},60)}})}); /* keep toolbar (✕) reachable when a sub-page goes fullscreen */
window.addEventListener('popstate',function(){if(cur&&location.hash.slice(1)!==cur)close(true)});
document.addEventListener('keydown',function(e){if(e.key=='Escape'&&cur)close()});
TABS.forEach(function(t){var b=document.createElement('button');b.type='button';b.className='tile';b.innerHTML='<span>'+t[1]+'</span>';b.dataset.t=t[0];document.getElementById('launch').appendChild(b);BTN[t[0]]=b;
 b.addEventListener('click',function(){open(t[0])})});
[].forEach.call(document.querySelectorAll('body>section'),function(s){s.classList.remove('on')});
(function(){var h=location.hash.slice(1);if(h&&BTN[h])open(h,true)})();
window.HXTabs={fs:fsToggle,show:function(id){open(id,true)},open:open,close:close,auto:auto,current:function(){return cur},live:function(){return ifr?[cur]:[]}};
var ctx=null,master,flt,dly,dfb,ana,recDest;
function ac(){if(ctx)return ctx;ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.8;flt=ctx.createBiquadFilter();flt.type='lowpass';flt.frequency.value=18000;
 dly=ctx.createDelay(1);dfb=ctx.createGain();dfb.gain.value=0;var dw=ctx.createGain();dw.gain.value=1;ana=ctx.createAnalyser();ana.fftSize=256;
 master.connect(flt);flt.connect(ana);flt.connect(dly);dly.connect(dfb);dfb.connect(dly);dfb.connect(ana);ana.connect(ctx.destination);recDest=ctx.createMediaStreamDestination();ana.connect(recDest);return ctx;}
var noiseBuf=null;function noise(){if(noiseBuf)return noiseBuf;var n=ctx.sampleRate;noiseBuf=ctx.createBuffer(1,n,n);var d=noiseBuf.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;return noiseBuf;}
function env(g,t,a,v,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);}
function kick(t){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);env(g,t,.002,1,.35);o.connect(g);g.connect(master);o.start(t);o.stop(t+.4);}
function snare(t){var s=ctx.createBufferSource();s.buffer=noise();var f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1200;var g=ctx.createGain();env(g,t,.002,.7,.2);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.25);
 var o=ctx.createOscillator(),g2=ctx.createGain();o.frequency.value=190;env(g2,t,.002,.4,.1);o.connect(g2);g2.connect(master);o.start(t);o.stop(t+.12);}
function hat(t,open){var s=ctx.createBufferSource();s.buffer=noise();var f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=7000;var g=ctx.createGain();env(g,t,.001,.3,open?.25:.05);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.3);}
function clap(t){for(var k=0;k<3;k++)snare(t+k*.012);}
function b808(t,semi){var o=ctx.createOscillator(),g=ctx.createGain(),ws=ctx.createWaveShaper(),c=new Float32Array(256);for(var i=0;i<256;i++){var x=i/128-1;c[i]=Math.tanh(2.5*x);}ws.curve=c;
 var fq=32.7*Math.pow(2,(+keyEl.value+semi)/12);o.frequency.setValueAtTime(fq*1.6,t);o.frequency.exponentialRampToValueAtTime(fq,t+.05);env(g,t,.005,.9,.9);o.connect(ws);ws.connect(g);g.connect(master);o.start(t);o.stop(t+1);}
var ROWS=[['Kick',kick],['Snare',snare],['Clap',clap],['HiHat',function(t){hat(t,0)}],['OpenHat',function(t){hat(t,1)}],['808',function(t){b808(t,0)}]];
var PRE={boombap:['1000000010100000','0000100000001000','0000000000000000','1010101010101010','0000000000000010','1000000000100000'],
 trap:['1000000100100000','0000000010000000','0000000010000000','1111111111111111','0000000000000000','1000000100100100'],
 lofi:['1000001000100000','0000100000001000','0000000000000000','1010101010101010','0000000000000000','1000000000000000'],
 drill:['1000001000000000','0000000100000001','0000000000000000','1011010110110101','0000000000000000','1000001000010000']};
var pat=[],gridEl=document.getElementById('grid'),cells=[],keyEl=document.getElementById('key'),bpmEl=document.getElementById('bpm');
function load(name){pat=PRE[name].map(function(r){return r.split('').map(Number)});draw();}
function draw(){gridEl.innerHTML='';cells=[];ROWS.forEach(function(r,ri){var l=document.createElement('div');l.textContent=r[0];l.style.fontSize='12px';gridEl.appendChild(l);cells[ri]=[];
 for(var s=0;s<16;s++){(function(s){var c=document.createElement('div');c.className='cell'+(pat[ri][s]?' on':'');c.onclick=function(){pat[ri][s]^=1;c.classList.toggle('on')};gridEl.appendChild(c);cells[ri][s]=c;})(s);}});}
load('boombap');document.getElementById('style').onchange=function(e){load(e.target.value)};
bpmEl.oninput=function(){document.getElementById('bpmv').textContent=bpmEl.value};
document.getElementById('rnd').onclick=function(){pat=pat.map(function(r,ri){return r.map(function(v,s){var p=[.25,.15,.1,.6,.08,.2][ri];return (ri==0&&s==0)?1:(Math.random()<p?1:0)})});draw();};
var playing=false,step=0,next=0,timer=null,beatPulse=0;
function sched(){var spb=60/+bpmEl.value/4,sw=+document.getElementById('swing').value/100;while(next<ctx.currentTime+.12){var t=next+(step%2?spb*sw:0);
 ROWS.forEach(function(r,ri){if(pat[ri][step])r[1](t)});(function(s,tt){setTimeout(function(){mark(s)},Math.max(0,(tt-ctx.currentTime)*1000))})(step,t);
 next+=spb;step=(step+1)%16;}}
function mark(s){cells.forEach(function(r){r.forEach(function(c,i){c.classList.toggle('cur',i==s)})});if(pat[0][s]||pat[1][s])beatPulse=1;}
document.getElementById('play').onclick=function(e){ac();ctx.resume();playing=!playing;e.target.textContent=playing?'⏸ Stop':'▶ Play';
 if(playing){step=0;next=ctx.currentTime+.05;timer=setInterval(sched,25);}else clearInterval(timer);};
document.getElementById('rec').onclick=function(e){ac();if(!window.MediaRecorder){e.target.textContent='brak MediaRecorder';return;}
 var mr=new MediaRecorder(recDest.stream),ch=[];mr.ondataavailable=function(x){ch.push(x.data)};mr.onstop=function(){var u=URL.createObjectURL(new Blob(ch,{type:mr.mimeType}));
 document.getElementById('recout').innerHTML='<audio controls src="'+u+'"></audio> <a download="hiphopx-beat.webm" href="'+u+'" style="color:#fc0">⬇ pobierz</a>';};
 mr.start();e.target.textContent='⏺ nagrywam 8 taktów…';setTimeout(function(){mr.stop();e.target.textContent='⏺ Nagraj'},8*4*60000/+bpmEl.value);};
/* FX pad */
function scratch(dir){ac();ctx.resume();var t=ctx.currentTime,s=ctx.createBufferSource();s.buffer=noise();var f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=8;
 f.frequency.setValueAtTime(dir>0?400:2500,t);f.frequency.exponentialRampToValueAtTime(dir>0?2500:400,t+.18);var g=ctx.createGain();env(g,t,.005,.9,.2);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.22);}
function airhorn(){var t=ctx.currentTime;[440,554,659].forEach(function(fq){var o=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(fq,t);env(g,t,.01,.15,.6);o.connect(g);g.connect(master);o.start(t);o.stop(t+.65);});}
function riser(){var t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(100,t);o.frequency.exponentialRampToValueAtTime(2000,t+2);env(g,t,1.5,.2,2.1);o.connect(g);g.connect(master);o.start(t);o.stop(t+2.2);}
var PAD=[['Scratch ⇢',function(){scratch(1)}],['Scratch ⇠',function(){scratch(-1)}],['Baby scratch',function(){scratch(1);setTimeout(function(){scratch(-1)},120)}],['Transformer',function(){for(var i=0;i<4;i++)setTimeout(function(){scratch(1)},i*70)}],
 ['📯 Airhorn',airhorn],['Riser',riser],['808 drop',function(){b808(ctx.currentTime,-5)}],['Clap',function(){clap(ctx.currentTime)}],
 ['Kick',function(){kick(ctx.currentTime)}],['Snare',function(){snare(ctx.currentTime)}],['Stutter',function(){for(var i=0;i<8;i++)(function(i){setTimeout(function(){hat(ctx.currentTime,0)},i*60)})(i)}],['Tape stop',function(){var t=ctx.currentTime;master.gain.setValueAtTime(.8,t);master.gain.linearRampToValueAtTime(0,t+.8);master.gain.setValueAtTime(.8,t+1.2);}]];
var padEl=document.getElementById('pad');PAD.forEach(function(p){var b=document.createElement('button');b.textContent=p[0];b.onclick=function(){ac();ctx.resume();p[1]()};padEl.appendChild(b);});
document.getElementById('flt').oninput=function(e){ac();flt.frequency.value=+e.target.value};
document.getElementById('dly').oninput=function(e){ac();dly.delayTime.value=60/+bpmEl.value*.75;dfb.gain.value=+e.target.value/100};
/* beat-synced visuals */
var cv=document.getElementById('viz'),g2=cv.getContext('2d'),hue=330;
function frame(){if(document.hidden||!hh.classList.contains('on')){setTimeout(function(){requestAnimationFrame(frame)},250);return}var dpr=Math.min(window.devicePixelRatio||1,2),w=Math.min(window.D7Res?D7Res.cap()[0]:1920,Math.round(cv.clientWidth*dpr)),h=Math.min(1080,Math.round(cv.clientHeight*dpr));if(cv.width!=w)cv.width=w;if(cv.height!=h)cv.height=h;g2.fillStyle='rgba(0,0,0,.35)';g2.fillRect(0,0,w,h);beatPulse*=.9;hue=(hue+.5+beatPulse*8)%360;
 if(ana){var d=new Uint8Array(ana.frequencyBinCount);ana.getByteFrequencyData(d);var bw=w/d.length;for(var i=0;i<d.length;i++){var v=d[i]/255*h;g2.fillStyle='hsl('+((hue+i*3)%360)+',90%,55%)';g2.fillRect(i*bw,h-v,bw-1,v);}}
 g2.beginPath();g2.arc(w/2,h/2,20+beatPulse*55,0,7);g2.strokeStyle='hsl('+hue+',100%,60%)';g2.lineWidth=4;g2.stroke();g2.fillStyle='#fc0';g2.font='bold 26px system-ui';g2.textAlign='center';g2.fillText('🐲',w/2,h/2+9);
 requestAnimationFrame(frame);}requestAnimationFrame(frame);
/* rap lyrics bot (Pollinations free text; offline fallback) */
var RH=['na bicie jak smok nad Wisłą lecę','Kraków nocą, w głośnikach bas się niesie','z Wawelu ogień, rymy płoną w mikrofonie','808 dudni, cały blok w tym tonie','skrecz na winylu, ręce tańczą po płycie','boom-bap w sercu, to jest moje życie','DJ Dydo za deckami, tłum podnosi ręce','każdy werbel trafia prosto w serce'];
function offline(topic){var o=[];for(var i=0;i<8;i++)o.push(RH[(i*3+topic.length)%RH.length]);return '('+topic+' — tryb offline)\n'+o.join('\n');}
var lyr=document.getElementById('lyr');
document.getElementById('gen').onclick=function(){var topic=document.getElementById('topic').value||'Kraków i DJ-ing',lang=document.getElementById('lang').value;
 lyr.textContent='✍ piszę…';var prompt='Napisz 8-wersową zwrotkę rapową ('+lang+'), styl '+document.getElementById('style').value+', '+bpmEl.value+' BPM, temat: '+topic+'. Tylko tekst, z rymami, bez wulgaryzmów.';
 var ctl=window.AbortController?new AbortController():null;var to=setTimeout(function(){if(ctl)ctl.abort()},35000);
 (function go(n){return fetch('https://text.pollinations.ai/'+encodeURIComponent(prompt),ctl?{signal:ctl.signal}:{}).then(function(r){if((r.status==402||r.status==429)&&n<3)return new Promise(function(z){setTimeout(z,[1500,3000,5000][n])}).then(function(){return go(n+1)});if(!r.ok)throw 0;return r.text()})})(0).then(function(t){clearTimeout(to);lyr.textContent=t.trim()||offline(topic)}).catch(function(){lyr.textContent=offline(topic)});};
document.getElementById('say').onclick=function(){if(!window.speechSynthesis)return;var u=new SpeechSynthesisUtterance(lyr.textContent);u.lang=document.getElementById('lang').value=='English'?'en-US':'pl-PL';u.rate=1.1;speechSynthesis.cancel();speechSynthesis.speak(u);};
window.HIPHOPX={version:2,tabs:TABS.length,audio:function(){ac();return{ctx:ctx,node:ana}}};})();
