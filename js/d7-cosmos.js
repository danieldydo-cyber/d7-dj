/* v66 · Super X G 🐲 cosmic start page: animated space + live MilkDrop X behind tiles, grouped categories, Kali radio bus (beat → every window),
   resolution selector, AI effects (chat + viz) through the 7-brain chain, online sync/status. Non-blocking: heavy work after first paint + idle. */
(function(){'use strict';var $=function(i){return document.getElementById(i)},LS=window.localStorage,TEST=!!window.__D7_TEST__;
function lsg(k,d){try{var v=LS.getItem(k);return v==null?d:v}catch(e){return d}}function lss(k,v){try{LS.setItem(k,v)}catch(e){}}
var css=document.createElement('style');css.textContent=
'body{background:#02010a}#cosmos,#cosmoMilk{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none}#cosmoMilk{opacity:0;transition:opacity 1.2s;mix-blend-mode:screen}#cosmoMilk.on{opacity:.75}'+
'body>header,body>section,#cxbar,#launch,#sgRec{position:relative;z-index:1}header{background:linear-gradient(180deg,#0a0214cc,#0a021400)!important}'+
'#cxbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:4px 10px;font-size:13px}#cxbar select,#cxbar button{background:#1a0830cc;color:#fff;border:1px solid #7b2cff;border-radius:10px;padding:5px 8px;font-size:13px}'+
'#cxbar .dot{width:10px;height:10px;border-radius:50%;display:inline-block;background:#888;margin-right:4px}#cxbar .dot.ok{background:#3f6;box-shadow:0 0 8px #3f6}#cxbar .dot.off{background:#f44}'+
'#launch{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))!important;gap:12px!important;padding:0 10px 20px}'+
'.cxg{background:linear-gradient(135deg,#1a0835b3,#06142bb3);border:1px solid #7b2cff88;border-radius:18px;padding:12px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 0 24px #7b2cff33}'+
'.cxg h3{margin:0 0 8px;font-size:18px;color:#ffcc00;text-shadow:0 0 12px #ff2d55}.cxg small{display:block;color:#bcd;margin:-4px 0 8px;font-size:12px}.cxg .chips{display:flex;flex-wrap:wrap;gap:6px}'+
'.cxg .tile{min-height:0!important;padding:8px 11px!important;font-size:14px!important;border-radius:12px!important;background:#2a0a4acc!important;box-shadow:none!important}.cxg .tile:hover{background:#ff2d55!important}'+
'body.d7fx-neon .card,body.d7fx-neon #lyr{text-shadow:0 0 8px #0ff,0 0 2px #fff}.d7tw{animation:d7tw .6s steps(20) both}@keyframes d7tw{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}'+
'#cxRadio.on{background:#ff2d55!important}.cxbeat{transition:transform .08s}';
document.head.appendChild(css);
/* ---------- groups (fewer top-level choices; every tile still reachable) ---------- */
var GROUPS=[['🎧 DJ & Decki','2 decki WeDJ, PRO8, DXF, klasyki',['pioneer','remix','pro8','dxf','pioneerold','dj','gdj','gpro','proc']],
 ['🌌 Wizualizacje','MilkDrop X, X7S, v51',['milk','x7s','v51','kalic']],['📻 Radio & Muzyka','Kali radio, beaty, studio',['kali','radiogen','hiphop','studio']],
 ['🤖 Boty & AI','Bot Builder, 7 mózgów, agenci, czat',['bb','brains','agents','bots','super','mrd','dpage','sbg','g','builder','dagents']],
 ['🛠 Narzędzia','Auto-Fix 7777, aplikacje',['fix','superapp','app']],['⬇ Aplikacja & Wsparcie','APK, iPhone, płatności (tylko informacje)',['dl','apk','ios','ddl','pay']],['🗂 Wszystko v38–v70','oryginały v38, DXF, D, dodatkowe strony',['v38pro8','v38kali','v38pro','dxfkali','dxfkr','dxfpro','kalir','dradio','dsong','gpro2','ubots']]];
function group(){var L=$('launch');if(!L||!L.querySelector('.tile'))return setTimeout(group,50);if(L.querySelector('.cxg'))return;var used={};
 GROUPS.forEach(function(g){var c=document.createElement('div');c.className='cxg';c.innerHTML='<h3>'+g[0]+'</h3><small>'+g[1]+'</small><div class="chips"></div>';var ch=c.querySelector('.chips');
  g[2].forEach(function(id){var t=L.querySelector('.tile[data-t="'+id+'"]');if(t&&!used[id]){used[id]=1;ch.appendChild(t)}});if(ch.children.length)L.appendChild(c)});
 var rest=[].filter.call(L.querySelectorAll(':scope>.tile'),function(t){return !used[t.dataset.t]});if(rest.length){var c=document.createElement('div');c.className='cxg';c.innerHTML='<h3>✨ Inne</h3><div class="chips"></div>';rest.forEach(function(t){c.querySelector('.chips').appendChild(t)});L.appendChild(c)}}
/* ---------- control bar ---------- */
var bar=document.createElement('div');bar.id='cxbar';
bar.innerHTML='<span id="cxNet"><span class="dot"></span><span id="cxNetT">sprawdzam…</span></span>'+
 '<button id="cxRadio">📻 Kali radio</button><select id="cxSt"></select>'+
 '<label>🖥 <select id="cxRes"><option value="auto">Auto</option><option value="720">720p</option><option value="1080">1080p</option><option value="1440">1440p</option><option value="4k">4K</option></select></label>'+
 '<label>💬 AI czat <select id="cxChat"><option value="none">zwykły</option><option value="neon">neon</option><option value="type">maszyna do pisania</option><option value="voice">głos</option><option value="rhyme">AI: rymy + emoji</option><option value="pro">AI: DJ-pro</option></select></label>'+
 '<label>🌌 AI wizualizacje <select id="cxViz"><option value="ai">AI nastrój (7 mózgów)</option><option value="beat">beat-sync</option><option value="off">wył.</option></select></label>'+
 '<button id="cxFs">⛶ Pełny ekran</button><button id="cxAuto">🤖 Auto online</button>';
var STN=[
 ['📻 KALI LIVE RADIO 24/7 (YouTube)','yt:jMRlCH3B6mY','kali',128],['📻 Kali · Hip-Hop 120 (lokalnie, analiza)','samples/kali-hiphop-120.wav','kali',120],
 ['🎛 Generator · Techno 128 (na urządzeniu)','gen:techno','gen',128],['🎛 Generator · Hip-Hop 90 (na urządzeniu)','gen:hiphop','gen',90],['🎛 Generator · AI mix (7 mózgów)','gen:ai','gen',0],
 ['SomaFM DEF CON','https://ice1.somafm.com/defcon-128-mp3','techno'],['SomaFM Beat Blender','https://ice1.somafm.com/beatblender-128-mp3','techno'],['SomaFM The Trip','https://ice1.somafm.com/thetrip-128-mp3','techno'],
 ['SomaFM Dub Step Beyond','https://ice1.somafm.com/dubstep-128-mp3','techno'],['SomaFM Space Station','https://ice1.somafm.com/spacestation-128-mp3','techno'],['SomaFM cliqhop IDM','https://ice1.somafm.com/cliqhop-128-mp3','techno'],
 ['Bassdrive DnB','https://ice.bassdrive.net/stream','techno'],['laut.fm Techno','https://stream.laut.fm/techno','techno'],['laut.fm Minimal','https://stream.laut.fm/minimal','techno'],['laut.fm Trance','https://stream.laut.fm/trance','techno'],
 ['Radio Record Techno','https://radiorecord.hostingradio.ru/techno96.aacp','techno'],['Radio Record Tech House','https://radiorecord.hostingradio.ru/techouse96.aacp','techno'],['Radio Record Deep','https://radiorecord.hostingradio.ru/deep96.aacp','techno'],
 ['Radio Record Minimal','https://radiorecord.hostingradio.ru/mini96.aacp','techno'],['Radio Record Hardstyle','https://radiorecord.hostingradio.ru/teo96.aacp','techno'],['TechnoBase.FM','https://listen.technobase.fm/tunein-mp3','techno'],
 ['HouseTime.FM','https://listen.housetime.fm/tunein-mp3','techno'],['Intergalactic FM','https://radio.intergalactic.fm/1','techno'],['RMF MAXXX','https://rs101-krk.rmfstream.pl/RMFMAXXX48','techno'],
 ['SomaFM Fluid (instrumental hip-hop)','https://ice1.somafm.com/fluid-128-mp3','hiphop'],['laut.fm Hip Hop','https://stream.laut.fm/hiphop','hiphop'],['laut.fm Rap','https://stream.laut.fm/rap','hiphop'],['laut.fm Lofi','https://stream.laut.fm/lofi','hiphop'],
 ['Radio Record Black (hip-hop/R&B)','https://radiorecord.hostingradio.ru/yo96.aacp','hiphop'],['Radio Record Gangsta','https://radiorecord.hostingradio.ru/gop96.aacp','hiphop'],['Radio Record Trap','https://radiorecord.hostingradio.ru/trap96.aacp','hiphop'],
 ['FluxFM Chillhop','https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/','hiphop'],['FluxFM Hip Hop','https://streams.fluxfm.de/hiphop/mp3-320/streams.fluxfm.de/','hiphop'],['BlackBeats.FM','https://stream.blackbeats.fm/stream.mp3','hiphop'],
 ['Hot 108 Jamz','https://live.powerhitz.com/hot108','hiphop'],['1Power Hip Hop','https://live.powerhitz.com/1power','hiphop'],['Radio 357','https://stream.radio357.pl/','inne']];
var GEN={kali:'📻 Kali',gen:'🎛 Generatory muzyki',techno:'⚡ Techno / elektronika',hiphop:'🎤 Hip-hop / rap',inne:'🌍 Inne'};window.D7Stations=STN;

function fillSt(sel){sel.innerHTML='';Object.keys(GEN).forEach(function(g){var og=document.createElement('optgroup');og.label=GEN[g];STN.forEach(function(x,i){if(x[2]!=g)return;var o=document.createElement('option');o.value=i;o.textContent=x[0];og.appendChild(o)});sel.appendChild(og)})}
window.D7FillSt=fillSt;
function mountBar(){var h=document.querySelector('body>header');if(!h)return setTimeout(mountBar,50);var h1=h.querySelector('h1');h.insertBefore(bar,h1?h1.nextSibling:h.firstChild);
 fillSt($('cxSt'));$('cxSt').value=lsg('d7radioSt','0');
 $('cxRes').value=lsg('d7res','auto');$('cxRes').onchange=function(){window.D7Res&&D7Res.set(this.value);startMilk(true)};
 $('cxChat').value=lsg('d7chatfx','none');$('cxChat').onchange=function(){lss('d7chatfx',this.value);chatFx()};chatFx();
 $('cxViz').value=lsg('d7vizfx','ai');$('cxViz').onchange=function(){lss('d7vizfx',this.value)};
 $('cxFs').onclick=function(){window.D7FS&&D7FS.toggle(document.documentElement)};
 $('cxRadio').onclick=function(){radio(!R.on)};$('cxSt').onchange=function(){lss('d7radioSt',this.value);radio(true)};
 $('cxAuto').onclick=function(){autoOnline(!AUTO)}}
/* ---------- cosmic background (2D stars + nebula, ≤30 fps, paused when a window is open or tab hidden) ---------- */
var cv=document.createElement('canvas');cv.id='cosmos';var mk=document.createElement('canvas');mk.id='cosmoMilk';
document.body.insertBefore(mk,document.body.firstChild);document.body.insertBefore(cv,document.body.firstChild);
var g=cv.getContext('2d'),stars=[],lastF=0,W=0,H=0;
function size(){var dpr=Math.min(devicePixelRatio||1,1.5),c=window.D7Res?D7Res.fit(innerWidth*dpr,innerHeight*dpr):[innerWidth,innerHeight];W=cv.width=Math.min(c[0],1280);H=cv.height=Math.round(W*innerHeight/Math.max(1,innerWidth));stars=[];for(var i=0;i<260;i++)stars.push([Math.random()*W,Math.random()*H,Math.random()*1.6+.2,Math.random()])}
size();addEventListener('resize',function(){size();if(MV)sizeMilk()});
function sky(t){requestAnimationFrame(sky);if(document.hidden||document.body.classList.contains('ovon')||t-lastF<33)return;lastF=t;var b=beatLvl;
 var gr=g.createRadialGradient(W*.5,H*.4,10,W*.5,H*.5,Math.max(W,H)*.75);gr.addColorStop(0,'hsl('+(260+40*Math.sin(t/9000))+',70%,'+(14+b*14)+'%)');gr.addColorStop(.55,'#090320');gr.addColorStop(1,'#010006');g.fillStyle=gr;g.fillRect(0,0,W,H);
 for(var i=0;i<stars.length;i++){var s=stars[i];s[0]-=s[2]*(.15+b*1.2);if(s[0]<0){s[0]=W;s[1]=Math.random()*H}g.fillStyle='rgba(255,255,255,'+(.35+.65*Math.abs(Math.sin(t/700+s[3]*9)))+')';g.fillRect(s[0],s[1],s[2],s[2])}}
requestAnimationFrame(sky);
/* ---------- audio bus: Kali radio in the launcher → beat analyser → MilkDrop X + d7:beat to the open window ---------- */
var R={on:false,el:null},beatLvl=0,avg=0,lastBeat=0,fb=null,lastPost=0;
function A(){return window.HIPHOPX&&HIPHOPX.audio()}
var YT=null,ytReady=false,GENS=null,clockT=0,carrier=null;
/* ---------- PRO master BPM clock: one tempo for decks, loops, generator and viz (auto-detect, tap, set) ---------- */
var CLK=window.D7Clock={bpm:+lsg('d7bpm','124')||124,t0:performance.now(),src:'manual',taps:[],
 set:function(b,src){b=Math.max(60,Math.min(190,+b||124));if(Math.abs(b-this.bpm)<.05&&src==this.src)return;this.bpm=Math.round(b*10)/10;this.src=src||'manual';lss('d7bpm',String(this.bpm));try{window.dispatchEvent(new CustomEvent('d7clock',{detail:{bpm:this.bpm,src:this.src}}))}catch(e){}var f=document.querySelector('#hxbody>iframe');if(f)try{f.contentWindow.postMessage({type:'d7:clock',bpm:this.bpm},'*')}catch(e){}},
 tap:function(){var t=performance.now();this.taps=this.taps.filter(function(x){return t-x<3000});this.taps.push(t);if(this.taps.length>3){this.set(60000*(this.taps.length-1)/(t-this.taps[0]),'tap');this.t0=t}return this.bpm},
 resync:function(){this.t0=performance.now()},beatMs:function(){return 60000/this.bpm},phase:function(){return((performance.now()-this.t0)/this.beatMs())%1},
 /* auto BPM from the live analyser: onset intervals → median → fold into 70–180 */
 _on:[],onset:function(t){var o=this._on;o.push(t);if(o.length>24)o.shift();if(o.length<8||this.src=='tap'||this.src=='manual-lock')return;var d=[];for(var i=1;i<o.length;i++){var x=o[i]-o[i-1];if(x>250&&x<1100)d.push(x)}if(d.length<6)return;d.sort(function(a,b){return a-b});var m=d[d.length>>1],b=60000/m;while(b<80)b*=2;while(b>170)b/=2;if(Math.abs(b-this.bpm)>1.5)this.set(b,'auto')}};
function stopAll(){if(R.el){try{R.el.pause();R.el.removeAttribute('src');R.el.load()}catch(e){}}if(YT&&YT.pauseVideo)try{YT.pauseVideo()}catch(e){}if(GENS)GENS.stop();clearInterval(clockT);clockT=0;document.body.classList.remove('cxyt')}
function label(t){var b=$('cxRadio');if(b)b.textContent=t;var v=$('vzNow');if(v)v.textContent=t}
/* beat clock for non-analysable sources (YouTube Kali LIVE): pulses at the master BPM into a silent carrier → MilkDrop + d7:beat (never to speakers) */
function clock(bpm){var a=A();clearInterval(clockT);CLK.set(bpm,'kali');if(!carrier){var o=a.ctx.createOscillator(),g=a.ctx.createGain();o.frequency.value=55;g.gain.value=0;o.connect(g);o.start();carrier=g;if(MV)try{MV.connectAudio(g)}catch(e){}}
 (function pulse(){clockT=setTimeout(pulse,CLK.beatMs());var t=a.ctx.currentTime;carrier.gain.cancelScheduledValues(t);carrier.gain.setValueAtTime(.9,t);carrier.gain.setTargetAtTime(.04,t+.05,.1);beatLvl=.8;lastBeat=Date.now();var f=document.querySelector('#hxbody>iframe');if(f)try{f.contentWindow.postMessage({type:'d7:beat',level:.8,beat:true},'*')}catch(x){}})()}
function ytPlay(id){var box=$('vzYT');if(!box){box=document.createElement('div');box.id='vzYT';box.innerHTML='<div id="vzYTp"></div>';document.body.appendChild(box)}
 function mk(){YT=new window.YT.Player('vzYTp',{width:'240',height:'135',videoId:id,playerVars:{autoplay:1,playsinline:1,controls:1},events:{onReady:function(e){ytReady=true;e.target.playVideo()},onError:function(){label('📻 Kali LIVE niedostępne → lokalny Kali Hip-Hop');$('cxSt').value=1;radio(true)}}})}
 if(YT&&ytReady){YT.loadVideoById(id);YT.playVideo();return}
 if(window.YT&&window.YT.Player)return mk();window.onYouTubeIframeAPIReady=mk;var sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.onerror=function(){label('📻 YouTube zablokowany → lokalny Kali');$('cxSt').value=1;radio(true)};document.head.appendChild(sc)}
function radio(on){var a=A();if(!a)return;stopAll();R.on=on;$('cxRadio').classList.toggle('on',on);if(!on){label('📻 Radio');return}
 a.ctx.resume&&a.ctx.resume();var i=+$('cxSt').value||0,s=STN[i]||STN[0];lss('d7radioSt',String(i));var vs=$('vzSt');if(vs)vs.value=i;startMilk();
 if(/^yt:/.test(s[1])){document.body.classList.add('cxyt');ytPlay(s[1].slice(3));clock(s[3]||128);label((/^\W/.test(s[0])?'':'📻 ')+s[0]+' · viz: zegar '+CLK.bpm+' BPM');return}
 if(/^gen:/.test(s[1])){GENS=GENS||makeGen(a);GENS.start(s[1].slice(4));return}
 if(s[3])CLK.set(s[3],'station');
 if(!R.el){R.el=new Audio();R.el.crossOrigin='anonymous';R.el.preload='none';try{a.ctx.createMediaElementSource(R.el).connect(a.node)}catch(e){}}
 R.hop=0;R.el.onerror=function(){if(!R.on||R.hop++>2)return;var st=$('cxSt'),n=(+st.value+1)%STN.length;while(/^(yt|gen):/.test(STN[n][1]))n=(n+1)%STN.length;st.value=n;label((/^\W/.test(s[0])?'':'📻 ')+s[0]+' nie gra → '+STN[n][0]);R.el.src=STN[n][1];R.el.play().catch(function(){})};
 R.el.src=s[1];R.el.play().then(function(){label((/^\W/.test(s[0])?'':'📻 ')+s[0])},function(e){if(e.name=='NotAllowedError'){label('▶ dotknij START');R.on=false;$('cxRadio').classList.remove('on')}})}
/* ---------- on-device music generator (techno / hip-hop / AI) — follows the master clock → analyser → MilkDrop ---------- */
function makeGen(a){var ctx=a.ctx,out=ctx.createGain();out.gain.value=.7;out.connect(a.node);var timer=0,step=0,next=0,mode='techno',pat=null,root=45;
 var NB=(function(){var b=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b})();
 function kick(t,v){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.45);o.connect(g);g.connect(out);o.start(t);o.stop(t+.5)}
 function noise(t,dur,f,v,type){var s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=NB;fl.type=type||'highpass';fl.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.02)}
 function bass(t,n,dur,v,wave){var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type=wave||'sawtooth';o.frequency.value=440*Math.pow(2,(n-69)/12);f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(160,t+dur);f.Q.value=6;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(f);f.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.02)}
 function pick(){if(mode=='hiphop'){pat={k:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],s:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],h:[1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1],b:[1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0],sw:.12};root=36+[0,3,5,7][Math.floor(Math.random()*4)]}
  else{pat={k:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],s:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],h:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1],b:[0,0,1,1,0,0,1,0,0,1,1,0,0,0,1,0],sw:0};root=33+[0,2,5,7][Math.floor(Math.random()*4)]}}
 function tick(){var sp=60/CLK.bpm/4;while(next<ctx.currentTime+.12){var i=step%16,t=next+(i%2?pat.sw*sp:0);if(pat.k[i])kick(t,mode=='hiphop'?.95:1);if(pat.s[i])noise(t,mode=='hiphop'?.18:.12,mode=='hiphop'?1500:2500,.5,'bandpass');if(pat.h[i])noise(t,.04,7000,.18);
   if(pat.b[i])mode=='hiphop'?bass(t,root,.5,.6,'sine'):bass(t,root+(i==10?12:0),.18,.35);if(step%64==63&&Math.random()<.5)pick();next+=sp;step++}}
 return{out:out,start:function(m){mode=m=='ai'?(Math.random()<.5?'techno':'hiphop'):m;CLK.set(mode=='hiphop'?90:128,'generator');pick();
   if(m=='ai'&&window.SBDJ)SBDJ.brain('music','Generator muzyki: zaproponuj styl (techno albo hiphop) i BPM dla seta teraz. Odpowiedz JSON {"style":"techno|hiphop","bpm":liczba}').then(function(t){try{var j=JSON.parse(String(t).match(/\{[\s\S]*\}/)[0]);if(/techno|hiphop/.test(j.style)){mode=j.style;pick();CLK.set(j.bpm,'ai');label('🎛 Generator AI: '+mode+' '+CLK.bpm+' BPM (mózg Muzyka)')}}catch(e){}});
   next=ctx.currentTime+.05;step=0;clearInterval(timer);timer=setInterval(tick,25);label('🎛 Generator '+mode+' · '+CLK.bpm+' BPM (zegar)')},stop:function(){clearInterval(timer);timer=0},state:function(){return{mode:mode,bpm:CLK.bpm,on:!!timer}}}}
window.D7Radio={gen:function(){return GENS&&GENS.state()},genObj:function(){return GENS},stations:STN,set:function(i){$('cxSt').value=i;radio(true)},on:function(){radio(true)},off:function(){radio(false)},state:function(){return{on:R.on,st:+$('cxSt').value,level:beatLvl}}};
setInterval(function(){if(!R.on&&!MV)return;var a=A();if(!a||a.ctx.state!='running')return;var n=a.node;if(!fb||fb.length!=n.frequencyBinCount)fb=new Uint8Array(n.frequencyBinCount);n.getByteFrequencyData(fb);
 var e=0;for(var i=1;i<8;i++)e+=fb[i];e/=7*255;avg=avg*.92+e*.08;var now=Date.now(),beat=e>avg*1.06&&e-(R.pe||0)>.02&&e>.15&&now-lastBeat>280;R.pe=e;if(beat){lastBeat=now;if(!clockT&&!(GENS&&GENS.state().on))CLK.onset(now)}beatLvl=Math.max(e,beatLvl*.85);
 if(now-lastPost>60||beat){lastPost=now;var f=document.querySelector('#hxbody>iframe');if(f)try{f.contentWindow.postMessage({type:'d7:beat',level:+e.toFixed(3),beat:beat},'*')}catch(x){}}
 if(beat&&MV&&lsg('d7vizfx','ai')!='off'&&Math.random()<.04)nextPreset()},50);
/* ---------- MilkDrop X behind tiles (lazy libs, low res, idle start) ---------- */
var MV=null,MKeys=[],MP={},mlast=0,mStarting=false;
function load(src){return new Promise(function(ok,no){var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function sizeMilk(){var c=window.D7Res?D7Res.fit(innerWidth,innerHeight):[innerWidth,innerHeight],w=c[0],h=Math.round(w*innerHeight/Math.max(1,innerWidth));mk.width=w;mk.height=h;if(MV)try{MV.setRendererSize(w,h)}catch(e){}}
function nextPreset(match){if(!MV||!MKeys.length)return;var pool=MKeys;if(match){var re=new RegExp(match,'i'),m=MKeys.filter(function(k){return re.test(k)});if(m.length)pool=m}var k=pool[Math.floor(Math.random()*pool.length)];try{MV.loadPreset(MP[k],2.5)}catch(e){}window.D7MilkPreset=k}
function startMilk(resize){if(MV){if(resize)sizeMilk();return}if(mStarting)return;mStarting=true;var a=A();if(!a)return;
 (window.butterchurn?Promise.resolve():load('libs/butterchurn.min.js').then(function(){return load('libs/butterchurnPresets.min.js')})).then(function(){return new Promise(function(r){(window.requestIdleCallback||setTimeout)(r,{timeout:2000})})}).then(function wait(){ /* never compile MilkDrop while a window is open (keeps every window smooth) */ if(document.body.classList.contains('ovon'))return new Promise(function(r){setTimeout(r,1500)}).then(wait);
  }).then(function(){
  var bc=window.butterchurn.default||window.butterchurn;sizeMilk();MV=bc.createVisualizer(a.ctx,mk,{width:mk.width,height:mk.height,pixelRatio:1,textureRatio:1});(window.__d7bv=window.__d7bv||[]).push({v:MV,c:mk});MV.connectAudio(a.node);if(carrier)try{MV.connectAudio(carrier)}catch(e){}
  var pp=window.butterchurnPresets;pp=pp&&(pp.getPresets?pp:pp.default);MP=pp.getPresets();MKeys=Object.keys(MP);nextPreset('geiss|flexi|martin');mk.classList.add('on');
  (function loop(t){requestAnimationFrame(loop);if(document.hidden||document.body.classList.contains('ovon')||t-mlast<33)return;mlast=t;try{MV.render()}catch(e){}})(0);
  setInterval(function(){if(!document.body.classList.contains('ovon')&&lsg('d7vizfx','ai')!='off')nextPreset()},25000)}).catch(function(e){mStarting=false;console.warn('[cosmos] milk',e)})}
/* MilkDrop starts on first interaction (AudioContext needs a gesture) or right away when it is already running — never during page load */
['pointerdown','keydown'].forEach(function(ev){document.addEventListener(ev,function k(e){if(e.target.closest&&e.target.closest('#launch .tile,#hxov'))return;if(document.body.classList.contains('ovon'))return;document.removeEventListener(ev,k,true);setTimeout(startMilk,30)},true)});
/* ---------- AI effects: chat style + viz mood via the 7-brain chain (own key > Pollinations queue > /api/brain > offline) ---------- */
window.D7ChatStyle=function(){var v=lsg('d7chatfx','none');return v=='rhyme'?'rymowany hip-hop z emoji 🔥🎧':v=='pro'?'profesjonalny DJ, konkretne liczby BPM/tonacja':''};
function chatFx(){var v=lsg('d7chatfx','none');document.body.classList.toggle('d7fx-neon',v=='neon')}
new MutationObserver(function(ms){var v=lsg('d7chatfx','none');if(v!='type'&&v!='voice')return;ms.forEach(function(m){[].forEach.call(m.addedNodes,function(n){if(n.nodeType!=1||!n.closest||!n.closest('section')||!n.textContent||n.textContent.length<20)return;
 if(v=='type')n.classList.add('d7tw');if(v=='voice'&&window.speechSynthesis&&!TEST){var u=new SpeechSynthesisUtterance(n.textContent.slice(0,300));u.lang='pl-PL';speechSynthesis.cancel();speechSynthesis.speak(u)}})})}).observe(document.body,{childList:true,subtree:true});
var moodBusy=false;function aiMood(){if(moodBusy||!MV||lsg('d7vizfx','ai')!='ai'||!window.SBDJ||document.body.classList.contains('ovon'))return;moodBusy=true;var h=new Date().getHours();
 SBDJ.brain('visual','Godzina '+h+':00, energia muzyki '+Math.round(beatLvl*100)+'%, stacja: '+(R.on?STN[+$('cxSt').value][0]:'cisza')+'. Podaj JEDNO angielskie słowo-klucz nastroju wizualizacji MilkDrop (np. tunnel, fractal, plasma, spiral, galaxy, flower, neon). Tylko to słowo.').then(function(a){moodBusy=false;var w=(String(a).match(/tunnel|fractal|plasma|spiral|galaxy|flower|neon|geiss|flexi|martin|kaleido|warp|cosmic|star|fire|water/i)||[])[0];if(w&&!/\[offline\]/.test(a)){nextPreset(w);window.D7MilkMood=w}},function(){moodBusy=false})}
setInterval(aiMood,90000);
/* ---------- online sync + status ---------- */
var isApk=/^(file|content):|appassets/.test(location.href)||!!window.D7APK,BASE=isApk?((window.D7_APK_CONFIG&&D7_APK_CONFIG.liveUrl)||'').replace(/\/$/,''):'',SY={online:null,server:null,t:0,facts:null,bots:null};
function net(){var d=bar.querySelector('.dot'),t=$('cxNetT');if(!d)return;if(navigator.onLine===false){d.className='dot off';t.textContent='offline · tryb lokalny';return}
 var ctl=new AbortController(),tm=setTimeout(function(){ctl.abort()},6000);fetch(BASE+'/api/status',{signal:ctl.signal,cache:'no-store'}).then(function(r){return r.json()}).then(function(j){clearTimeout(tm);if(j&&j.static)throw 0;SY={online:true,server:true,t:Date.now(),facts:j.facts,bots:j.bots,mem:j.messages};d.className='dot ok';t.textContent='online · serwer ✔ · '+(j.bots||0)+' botów · pamięć '+(j.facts||0)+' faktów';lss('d7sync',JSON.stringify(SY))},
  function(){clearTimeout(tm);SY.server=false;SY.online=navigator.onLine!==false;d.className='dot '+(SY.online?'':'off');t.textContent=SY.online?'online · serwer niedostępny (Pollinations/offline)':'offline'})}
window.D7Sync={status:function(){return SY},now:net};addEventListener('online',net);addEventListener('offline',net);
/* ---------- full automation online ---------- */
var AUTO=false,autoT=0;function autoOnline(on){AUTO=on;$('cxAuto').classList.toggle('on',on);$('cxAuto').textContent=on?'🤖 Auto online: WŁ':'🤖 Auto online';clearInterval(autoT);if(!on)return;
 radio(true);startMilk();net();aiMood();autoT=setInterval(function(){net();aiMood()},60000)}
window.D7Cosmos={group:group,startMilk:startMilk,auto:autoOnline,milk:function(){return{on:!!MV,preset:window.D7MilkPreset,w:mk.width,h:mk.height,mood:window.D7MilkMood}}};
/* ---------- v68 start stage: fullscreen MilkDrop + Kali radio, one big START AUTO, simple page menu on top ---------- */
var st=document.createElement('style');st.textContent='#vz{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px;text-align:center;background:radial-gradient(#0000 40%,#000a);transition:opacity .4s}'+
'body.vzoff #vz{opacity:0;pointer-events:none}body:not(.vzoff) #cosmoMilk.on{opacity:1;mix-blend-mode:normal}body:not(.vzoff)>header,body:not(.vzoff)>section,body:not(.vzoff) #launch,body:not(.vzoff) #sgRec{visibility:hidden}body.ovon #vz{display:none}'+
'#vz h1{margin:0;font:800 clamp(26px,5vw,56px) system-ui;background:linear-gradient(90deg,#ffd23f,#ff2d95,#8a5cff,#2de2ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px #ff2d9588)}'+
'#vzGo{font:800 clamp(22px,4vw,40px) system-ui;padding:18px 44px;border-radius:999px;border:0;color:#fff;background:linear-gradient(135deg,#ff2d95,#8a5cff);box-shadow:0 0 40px #ff2d9599;cursor:pointer;animation:vzP 1.6s ease-in-out infinite}#vzGo.on{animation:none;background:linear-gradient(135deg,#00c853,#00b8d4)}@keyframes vzP{50%{transform:scale(1.05)}}'+
'#vz .r{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}#vz select,#vz button.s,#vz label{background:#0d0620cc;color:#fff;border:1px solid #8a5cff88;border-radius:999px;padding:7px 12px;font-size:14px}#vzNow{color:#cfc6ff;font-size:14px;min-height:18px}'+
'#vzMenu{display:flex;flex-direction:column;gap:4px;max-height:38vh;overflow:auto;min-width:min(92vw,360px);background:#0a041acc;border:1px solid #8a5cff55;border-radius:16px;padding:8px;backdrop-filter:blur(6px)}#vzMenu button{text-align:left;background:none;border:0;color:#fff;padding:8px 12px;border-radius:10px;font-size:15px;cursor:pointer}#vzMenu button:hover{background:#ff2d9555}#vzMenu b{color:#ffd23f;font-size:12px;padding:6px 12px 0;text-align:left}'+
'#vzYT{position:fixed;right:8px;bottom:8px;z-index:6;width:240px;height:135px;opacity:.85}body:not(.cxyt) #vzYT{display:none}#vzBack{position:fixed;right:10px;bottom:10px;z-index:4;display:none}body.vzoff #vzBack{display:block}';document.head.appendChild(st);
var vz=document.createElement('div');vz.id='vz';vz.innerHTML='<h1>Super X G 🐲</h1><div id="vzNow">📻 Kali radio + MilkDrop</div><button id="vzGo">▶ START AUTO</button>'+
 '<div class="r"><select id="vzSt"></select><label><input type="checkbox" id="vzFsA"> auto pełny ekran</label><button class="s" id="vzFs">⛶</button><button class="s" id="vzPrev">🎨 następna wizualizacja</button><button class="s" id="vzTiles">▦ kafelki</button></div><div id="vzMenu"></div>';
var vb=document.createElement('button');vb.id='vzBack';vb.className='s';vb.textContent='🌌 scena';vb.style.cssText='background:#1a0830;color:#fff;border:1px solid #8a5cff;border-radius:999px;padding:8px 14px';
function stage(on,init){document.body.classList.toggle('vzoff',!on);lss('d7stage',on?'on':'off');if(on&&!init)startMilk()}
function menu(){var m=$('vzMenu'),L=$('launch');if(!L||!L.querySelector('.tile'))return setTimeout(menu,80);var h='';[].forEach.call(L.querySelectorAll('.cxg'),function(g){h+='<b>'+g.querySelector('h3').textContent+'</b>';[].forEach.call(g.querySelectorAll('.tile'),function(t){h+='<button data-t="'+t.dataset.t+'">'+t.textContent.trim()+'</button>'})});if(!h)return setTimeout(menu,80);m.innerHTML=h;
 m.onclick=function(e){var b=e.target.closest('button');if(!b)return;var t=$('launch').querySelector('.tile[data-t="'+b.dataset.t+'"]');if(t)t.click();else if(window.HXTabs)HXTabs.open(b.dataset.t)}}
function go(){var a=A();if(a&&a.ctx.resume)a.ctx.resume();if(!R.on)radio(true);startMilk(true);if(lsg('d7autofs','1')=='1'&&window.D7FS&&!D7FS.el())D7FS.on(document.documentElement);$('vzGo').classList.add('on');$('vzGo').textContent='🔊 AUTO gra';lss('d7started','1')}
function mountStage(){document.body.appendChild(vz);document.body.appendChild(vb);fillSt($('vzSt'));$('vzSt').value=lsg('d7radioSt','0');$('vzSt').onchange=function(){$('cxSt').value=this.value;lss('d7radioSt',this.value);radio(true)};
 $('vzFsA').checked=lsg('d7autofs','1')=='1';$('vzFsA').onchange=function(){lss('d7autofs',this.checked?'1':'0')};$('vzGo').onclick=function(){if(R.on&&$('vzGo').classList.contains('on')){radio(false);$('vzGo').classList.remove('on');$('vzGo').textContent='▶ START AUTO'}else go()};
 $('vzFs').onclick=function(){window.D7FS&&D7FS.toggle(document.documentElement)};$('vzPrev').onclick=function(){startMilk(true);if(MV)nextPreset()};$('vzTiles').onclick=function(){stage(false)};vb.onclick=function(){stage(true)};
 stage(lsg('d7stage','on')!='off',true);menu();
 /* auto-attempt on load (works in APK / when autoplay allowed); otherwise the big button waits for a tap */
 if(!TEST)setTimeout(function(){var a=A();if(!a)return;try{a.ctx.resume()}catch(e){}setTimeout(function(){if(a.ctx.state=='running'&&!R.on){radio(true);startMilk(true);$('vzGo').classList.add('on');$('vzGo').textContent='🔊 AUTO gra'}else if(!R.on)$('vzNow').textContent='▶ dotknij START AUTO (przeglądarka wymaga dotknięcia)'},300)},900)}
window.D7Stage={on:function(){stage(true)},off:function(){stage(false)},go:go,state:function(){return{stage:!document.body.classList.contains('vzoff'),menu:$('vzMenu').querySelectorAll('button').length,autofs:lsg('d7autofs','1')}}};

/* ---------- v70 hero: "S ver G 🐲 S Dragon" + animated glowing original dragon logo (hidden in pure viz) + SuperGrok next-action bar ---------- */
var hs=document.createElement('style');hs.textContent='#vzHero{display:flex;flex-direction:column;align-items:center;gap:4px}#vzLogo{width:clamp(110px,18vw,200px);height:auto;filter:drop-shadow(0 0 14px #ff2d95) drop-shadow(0 0 28px #8a5cff);animation:dgFloat 4s ease-in-out infinite}'+
'@keyframes dgFloat{50%{transform:translateY(-8px) rotate(-2deg)}}#vzLogo .wing{transform-origin:100px 92px;animation:dgWing 1.6s ease-in-out infinite}#vzLogo .wing2{animation-delay:-.8s}@keyframes dgWing{50%{transform:scaleY(.72) rotate(-6deg)}}'+
'#vzLogo .eye{animation:dgEye 3s infinite}@keyframes dgEye{0%,92%,100%{opacity:1}95%{opacity:.1}}#vzLogo .fire{animation:dgFire .9s ease-in-out infinite alternate;transform-origin:150px 74px}@keyframes dgFire{to{transform:scaleX(1.25);opacity:.6}}'+
'#vzHero h1 .s2{display:block;font-size:.42em;letter-spacing:.3em;-webkit-text-fill-color:#ffd23f;text-shadow:0 0 12px #ff2d95}html.d7pure #vzHero{display:none!important}'+
'#sgNext{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center;max-width:min(94vw,820px)}#sgNext b{color:#2de2ff;font-size:13px}#sgNext button{background:linear-gradient(135deg,#2a1356,#0d2a4a);color:#fff;border:1px solid #2de2ff88;border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer;box-shadow:0 0 10px #2de2ff33}#sgNext button:hover{box-shadow:0 0 16px #ff2d95}#sgNext small{color:#a9b4d6}';
document.head.appendChild(hs);
var LOGO='<svg id="vzLogo" viewBox="0 0 200 160" aria-label="S Dragon logo"><defs><linearGradient id="dgG" x1="0" x2="1"><stop offset="0" stop-color="#2de2ff"/><stop offset=".5" stop-color="#8a5cff"/><stop offset="1" stop-color="#ff2d95"/></linearGradient><linearGradient id="dgW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2d95"/><stop offset="1" stop-color="#8a5cff" stop-opacity=".4"/></linearGradient></defs>'+
 '<path class="wing" d="M100 92 L60 22 L74 52 L46 40 L66 70 L34 66 L78 92 Z" fill="url(#dgW)" stroke="#ffd23f" stroke-width="1.5"/><path class="wing wing2" d="M108 90 L120 30 L124 58 L146 40 L134 72 Z" fill="url(#dgW)" opacity=".75"/>'+
 '<path d="M30 130 C 10 110, 40 92, 64 104 C 88 116, 98 96, 104 84 C 110 70, 128 62, 146 66 L 162 60 L 156 72 C 162 76, 162 84, 152 88 L 132 90 C 120 104, 112 124, 84 132 C 64 138, 44 142, 30 130 Z" fill="#160733" stroke="url(#dgG)" stroke-width="4" stroke-linejoin="round"/>'+
 '<path d="M30 130 C 20 140, 8 138, 4 128 C 14 132, 22 128, 30 130" fill="url(#dgG)"/><path d="M146 66 L 150 50 L 156 64 M 136 66 L 136 52 L 144 64" stroke="#ffd23f" stroke-width="3" fill="none" stroke-linecap="round"/>'+
 '<circle class="eye" cx="146" cy="74" r="3.2" fill="#ffd23f"/><path class="fire" d="M162 80 C 176 74, 186 82, 196 76 C 188 86, 178 88, 162 84 Z" fill="#ff8a00" opacity=".9"/>'+
 '<path d="M60 112 l6 -8 l2 9 l7 -7 l1 9 l7 -6" stroke="#2de2ff" stroke-width="2" fill="none" stroke-linecap="round"/><text x="0" y="0" font-size="0"></text></svg>';
function mountHero(){var h=vz.querySelector('h1');if(!h)return;var w=document.createElement('div');w.id='vzHero';h.parentNode.insertBefore(w,h);w.innerHTML=LOGO;h.innerHTML='7D <span class="s2">S ver G 🐲</span>';w.appendChild(h);
 var sg=document.createElement('div');sg.id='sgNext';sg.innerHTML='<b>🧠 SuperGrok:</b> <small>myślę…</small>';var mn=$('vzMenu');mn.parentNode.insertBefore(sg,mn);suggest();setInterval(suggest,120000)}
/* SuperGrok next-action suggestions: 7-brain chain (grok brain) → validated action ids; offline heuristic fallback */
var ACT={radio:['📻 Włącz Kali radio',function(){$('vzSt').value='0';$('cxSt').value='0';radio(true)}],techno:['⚡ Stacja techno',function(){var i=STN.findIndex(function(s){return s[2]=='techno'});$('cxSt').value=i;radio(true)}],hiphop:['🎤 Stacja hip-hop',function(){var i=STN.findIndex(function(s){return s[2]=='hiphop'});$('cxSt').value=i;radio(true)}],
 gen:['🎛 Generator beatów',function(){var i=STN.findIndex(function(s){return s[1]=='gen:ai'});$('cxSt').value=i;radio(true)}],mega:['🤖 AI DJ Mega Set',function(){if(window.HXTabs)HXTabs.open('pioneer');setTimeout(function(){try{var f=document.querySelector('#hxbody>iframe');f.contentWindow.WeDJMega.start()}catch(e){}},3500)}],
 decks:['🎚 Decki WeDJ',function(){HXTabs.open('pioneer')}],viz:['🌌 Czysta wizualizacja',function(){if(window.D7Ctl)D7Ctl.pureOn(mk,true)}],shark:['🦈 Rekin MilkDrop',function(){if(window.D7Ctl)D7Ctl.shark(true)}],bots:['🤖 Uruchom boty',function(){if(window.D7Ctl)D7Ctl.bots()}],chat:['💬 Pogadaj z Bot D',function(){HXTabs.open('dpage')}],x7s:['✨ X7S klasyk',function(){HXTabs.open('x7s')}]};
var SG={src:'',ids:[]};
function offlineSug(){var h=new Date().getHours(),o=[];o.push(R.on?'viz':'radio');o.push(h>=20||h<4?'techno':h<12?'hiphop':'gen');o.push(R.on?'mega':'decks');o.push(lsg('d7shark','1')=='1'?'chat':'shark');o.push('bots');return o.filter(function(x,i,a){return a.indexOf(x)==i}).slice(0,4)}
function paintSug(ids,src){SG={src:src,ids:ids};var sg=$('sgNext');if(!sg)return;sg.innerHTML='<b>🧠 SuperGrok poleca:</b>'+ids.map(function(k){return '<button data-a="'+k+'">'+ACT[k][0]+'</button>'}).join('')+'<small>'+src+'</small>';sg.onclick=function(e){var b=e.target.closest('button');if(b&&ACT[b.dataset.a]){ACT[b.dataset.a][1]();lss('d7lastAct',b.dataset.a);setTimeout(suggest,1500)}}}
function suggest(){paintSug(offlineSug(),'offline (zasady)');if(!window.SBDJ||TEST)return;var keys=Object.keys(ACT),st='radio '+(R.on?'gra: '+STN[+$('cxSt').value][0]:'wyłączone')+', godzina '+new Date().getHours()+', ostatnia akcja '+lsg('d7lastAct','brak');
 Promise.race([SBDJ.brain('grok','Jesteś SuperGrok, koordynator aplikacji DJ. Stan: '+st+'. Wybierz 4 najlepsze NASTĘPNE akcje dla użytkownika z listy id: '+keys.join(', ')+'. Odpowiedz tylko JSON: {"next":["id","id","id","id"]}'),new Promise(function(r){setTimeout(function(){r('[offline]')},20000)})]).then(function(a){var j=null;try{j=JSON.parse(String(a).match(/\{[\s\S]*\}/)[0])}catch(e){}var ids=j&&Array.isArray(j.next)?j.next.filter(function(k){return ACT[k]}).slice(0,4):[];if(ids.length>=2&&!/\[offline\]/.test(a))paintSug(ids,'7 mózgów · live');},function(){})}
window.D7Suggest={now:suggest,state:function(){return SG},run:function(k){ACT[k]&&ACT[k][1]()}};

mountBar();group();mountStage();mountHero();setTimeout(net,1200);setInterval(net,60000);
})();
/* v67 polish: typography, glow, glass cards, staggered entrance, smooth hovers (visual only — all v66 functions unchanged) */
(function(){var s=document.createElement('style');s.textContent=
'body{font-family:"Inter","Segoe UI",system-ui,-apple-system,Roboto,sans-serif;letter-spacing:.01em;-webkit-font-smoothing:antialiased}'+
'body>header h1{font-size:clamp(22px,3.2vw,38px)!important;font-weight:800;letter-spacing:.02em;background:linear-gradient(90deg,#ffd23f,#ff2d95 45%,#8a5cff 75%,#2de2ff);-webkit-background-clip:text;background-clip:text;color:transparent!important;text-shadow:none!important;filter:drop-shadow(0 0 14px #ff2d9566);animation:cxHue 12s ease-in-out infinite alternate}'+
'body>header h1 small{-webkit-text-fill-color:#cfc6ff;font-weight:500;letter-spacing:.06em;text-transform:uppercase;font-size:.38em!important}'+
'@keyframes cxHue{to{filter:drop-shadow(0 0 22px #2de2ff77) hue-rotate(25deg)}}'+
'#cxbar{gap:8px!important;padding:8px 12px!important;margin:4px 8px 10px;border-radius:16px;background:linear-gradient(135deg,#ffffff0d,#ffffff04);border:1px solid #ffffff1a;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}'+
'#cxbar select,#cxbar button,#sgRec .b{border-radius:999px!important;border:1px solid #8a5cff66!important;background:#120a2acc!important;padding:6px 12px!important;transition:transform .18s ease,box-shadow .18s ease,background .18s}'+
'#cxbar button:hover,#cxbar select:hover,#sgRec .b:hover{transform:translateY(-1px);box-shadow:0 0 14px #8a5cff88}#cxbar label{color:#cfc6ff;font-size:12px}'+
'#launch{gap:16px!important;padding:4px 14px 28px!important;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))!important}'+
'.cxg{position:relative;border:0!important;border-radius:22px!important;padding:16px 16px 14px!important;background:linear-gradient(160deg,#1b0d3ccc,#0a1630cc)!important;box-shadow:0 10px 40px #0008,inset 0 1px 0 #ffffff14!important;opacity:0;transform:translateY(14px) scale(.98);animation:cxIn .6s cubic-bezier(.2,.8,.2,1) forwards;transition:transform .25s ease,box-shadow .25s ease}'+
'.cxg::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(135deg,#ff2d95aa,#8a5cff55 40%,#2de2ff88);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}'+
'.cxg:hover{transform:translateY(-3px)!important;box-shadow:0 16px 50px #0009,0 0 30px #8a5cff44!important}'+
'.cxg:nth-child(1){animation-delay:.03s}.cxg:nth-child(2){animation-delay:.09s}.cxg:nth-child(3){animation-delay:.15s}.cxg:nth-child(4){animation-delay:.21s}.cxg:nth-child(5){animation-delay:.27s}.cxg:nth-child(6){animation-delay:.33s}.cxg:nth-child(7){animation-delay:.39s}'+
'@keyframes cxIn{to{opacity:1;transform:none}}'+
'.cxg h3{font-size:19px!important;font-weight:750;letter-spacing:.02em;color:#fff!important;text-shadow:0 0 18px #ff2d9566!important}.cxg small{color:#a9b4d6!important;font-size:12.5px!important}'+
'.cxg .chips{gap:8px!important}.cxg .tile{border:1px solid #ffffff1f!important;background:linear-gradient(135deg,#2a1356e6,#16234ae6)!important;border-radius:14px!important;padding:9px 13px!important;font-weight:600;transition:transform .16s ease,background .2s,box-shadow .2s!important}'+
'.cxg .tile:hover,.cxg .tile:focus-visible{transform:translateY(-2px) scale(1.03);background:linear-gradient(135deg,#ff2d95,#8a5cff)!important;box-shadow:0 6px 22px #ff2d9566!important;outline:none}'+
'.cxg .tile:active{transform:scale(.97)}#cosmoMilk.on{opacity:.62}'+
'@media (prefers-reduced-motion:reduce){.cxg,body>header h1{animation:none!important;opacity:1!important;transform:none!important}}';
document.head.appendChild(s)})();
