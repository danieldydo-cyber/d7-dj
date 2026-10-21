/* Super Bot D PRO v54 — devil-alien avatar + MilkDrop (butterchurn) + bot chat/commands + bots panel */
(function(){
var $=function(i){return document.getElementById(i)};
var log=$('log'),mouth=$('mouth'),st=$('st'),cv=$('viz'),ovl=$('ovl');
var LS=function(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v));}catch(e){return null}};
var muted=false,talkUntil=0,ac=null,an=null,viz=null,srcNode=null,audioEl=null,presets={},pkeys=[],pi=0;
var lang=LS('sgx-lang')||'pl',favs=LS('sgx-favs')||[],hist=LS('sgx-hist')||[],gain=null,vol=LS('sgx-vol')||0.9;
var STATIONS={radio:['DEF CON techno','https://ice1.somafm.com/defcon-128-mp3'],groove:['Groove Salad','https://ice1.somafm.com/groovesalad-128-mp3'],beat:['Beat Blender','https://ice1.somafm.com/beatblender-128-mp3'],space:['Space Station','https://ice1.somafm.com/spacestation-128-mp3']};
var T={pl:{hi:'Siema, tu Super Bot D PRO — diabeł-kosmita z wanny 2077. Mów albo pisz: „graj groove”, „następny preset”, „pełny ekran”, „głośniej”.',off:'Jestem offline, ale słyszę cię. Gdy wróci sieć, zapytam bota D.',ph:'Pogadaj z G… („graj techno”, „następny preset”)'},
       en:{hi:'Yo, Super Bot D PRO here — devil-alien from the 2077 bathtub. Say or type: "play groove", "next preset", "fullscreen", "louder".',off:'I am offline but I hear you. When the network is back I will ask bot D.',ph:'Talk to G… ("play techno", "next preset")'}};
function add(cls,who,t,save){var d=document.createElement('div');d.className=cls;d.textContent=who+': '+t;log.appendChild(d);log.scrollTop=1e9;
  if(save!==false){hist.push([cls,who,t]);hist=hist.slice(-30);LS('sgx-hist',hist);}}
/* ---- TTS with lip-sync envelope ---- */
var lipQ=[];
function speak(t){t=String(t).replace(/^\[[A-Z]+\]\s*/,'').replace(/[*_#`]/g,'');if(muted)return;
  var L=lang==='en'?'en-US':'pl-PL';
  // syllable-ish envelope for smoother lip sync
  var now=Date.now(),ms=lang==='en'?62:68;lipQ=[];for(var i=0;i<t.length;i++){var c=t[i].toLowerCase();lipQ.push([now+i*ms,/[aeiouyąęó]/.test(c)?1:/[\s.,!?]/.test(c)?0.05:0.45]);}
  talkUntil=now+t.length*ms;
  var N=window.D7Native;if(N&&N.speak){try{N.speak(t,L);return;}catch(e){}}
  if(!window.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang=L;u.pitch=.6;u.rate=1.02;
  var v=speechSynthesis.getVoices().filter(function(x){return x.lang.toLowerCase().indexOf(L.slice(0,2))===0})[0];if(v)u.voice=v;
  u.onend=u.onerror=function(){talkUntil=0;lipQ=[]};speechSynthesis.speak(u);}
/* ---- audio analysis: bass + beat detection ---- */
var fd=null,bassAvg=0,lastBeat=0,beats=0,bass=0,lipS=0,blinkAt=Date.now()+2500,gestAt=0;
function analyse(){if(!an)return;if(!fd)fd=new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(fd);var s=0;for(var i=1;i<8;i++)s+=fd[i];bass=s/7/255;
  bassAvg=bassAvg*.95+bass*.05;var now=Date.now();if(bass>bassAvg*1.25&&bass>.35&&now-lastBeat>280){lastBeat=now;beats++;onBeat();}}
function onBeat(){if(beats%64===0)nextPreset(2.7);if(beats%32===0)flash('SUPER BOT D PRO');}
function flash(txt,ms){ovl.textContent=txt;ovl.style.opacity=1;clearTimeout(flash.t);flash.t=setTimeout(function(){ovl.style.opacity=0},ms||1400);}
/* ---- avatar animation ---- */
function hsl(h,s,l){return 'hsl('+h+','+s+'%,'+l+'%)'}
(function anim(){requestAnimationFrame(anim);var now=Date.now();analyse();
  var target=0;if(talkUntil>now){while(lipQ.length>1&&lipQ[1][0]<=now)lipQ.shift();target=lipQ.length?lipQ[0][1]:0.3;target*=.75+.25*Math.sin(now/45);}
  else target=bass*.4;
  lipS+= (target-lipS)*.35;mouth.setAttribute('ry',(5+lipS*30).toFixed(1));mouth.setAttribute('rx',(42-lipS*8).toFixed(1));
  var beatK=Math.max(0,1-(now-lastBeat)/250);
  $('head').setAttribute('transform','translate(0 '+(Math.sin(now/400)*3-beatK*6).toFixed(1)+') rotate('+(Math.sin(now/900)*2+(talkUntil>now?Math.sin(now/300)*2:0)).toFixed(2)+' 200 165)');
  // mood colors: calm red → hot magenta/orange on bass
  var h=345+bass*40,l=55+beatK*15;$('sk0').setAttribute('stop-color',hsl(h%360,100,l));$('sk1').setAttribute('stop-color',hsl((h-10)%360,80,38+bass*12));
  // glints sweep
  var g=(now/1600)%1;$('glint').setAttribute('opacity',(g<.15?g/.15:Math.max(0,1-(g-.15)*4))*.9);$('glint2').setAttribute('opacity',Math.max(0,.9-Math.abs(g-.5)*6));
  // blink (lid under lenses) + pupils follow
  var bl=now>blinkAt?Math.min(1,(now-blinkAt)/80):0;if(now>blinkAt+180){blinkAt=now+2000+Math.random()*4000;}
  $('lid').setAttribute('height',(bl>0&&now<blinkAt+180?Math.max(0,60*Math.sin(Math.PI*Math.min(1,Math.max(0,now-blinkAt)/180))):0).toFixed(0));
  var px=Math.sin(now/1300)*5;$('pl').setAttribute('cx',145+px);$('pr').setAttribute('cx',255+px);
  $('brows').setAttribute('transform','translate(0 '+(-beatK*5-(talkUntil>now?lipS*4:0)).toFixed(1)+')');
  // gesture: phone arm waves on beats / when talking
  var wave=talkUntil>now?Math.sin(now/220)*10:beatK*8;$('arm').setAttribute('transform','translate(330 '+(250-beatK*4)+') rotate('+(18+wave).toFixed(1)+')');
  $('ember').setAttribute('r',(4+2*Math.abs(Math.sin(now/300))+beatK*3).toFixed(1));
  var b=$('bubbles').children;for(var j=0;j<b.length;j++)b[j].setAttribute('transform','translate(0 '+(Math.sin(now/500+j)*4-beatK*3).toFixed(1)+')');
})();
/* ---- commands (voice/chat control) ---- */
function cmd(q){q=q.toLowerCase();var r=null,pl=lang==='pl';
  var m=q.match(/(graj|włącz|play|zagraj)\s*(radio\s*)?(techno|def ?con|groove|beat|blender|space|kosmos)?/);
  if(m&&(m[3]||/radio|muzyk|music/.test(q))){var k=/groove/.test(q)?'groove':/beat|blender/.test(q)?'beat':/space|kosmos/.test(q)?'space':'radio';setSrc(k);r=(pl?'Gram ':'Playing ')+STATIONS[k][0]+' 🔥';}
  else if(/(stop|cisza|wyłącz|pause|pauza)/.test(q)){stopSrc();$('go').textContent='▶ Wizualizacja';r=pl?'Cisza w wannie.':'Silence in the tub.';}
  else if(/(następn|next|zmień preset|preset)/.test(q)){ensure();nextPreset();r=pl?'Nowy preset MilkDrop!':'New MilkDrop preset!';}
  else if(/(pełny ekran|fullscreen|full screen)/.test(q)){fullscreen();r=pl?'Pełny ekran — odlot!':'Fullscreen — liftoff!';}
  else if(/(głośniej|louder|volume up)/.test(q)){setVol(vol+.15);r=(pl?'Głośność ':'Volume ')+Math.round(vol*100)+'%';}
  else if(/(ciszej|quieter|volume down)/.test(q)){setVol(vol-.15);r=(pl?'Głośność ':'Volume ')+Math.round(vol*100)+'%';}
  else if(/(ulubion|favorite|zapisz preset)/.test(q)){toggleFav();r=pl?'Preset w ulubionych ⭐':'Preset saved ⭐';}
  else if(/(boty|bots|status)/.test(q)){showBots(true);r=pl?'Pokazuję status botów.':'Showing bots status.';}
  else if(/(english|angielsk)/.test(q)){setLang('en');r='English on.';}
  else if(/(polski|polish)/.test(q)){setLang('pl');r='Polski włączony.';}
  return r;}
function local(q){var l=q.toLowerCase(),pl=lang==='pl';
  if(/cze|hej|siema|elo|hello|hi\b|yo\b/.test(l))return pl?'Siema! Tu Super Bot D PRO. Odpalamy bit?':'Yo! Super Bot D PRO here. Drop the beat?';
  if(/kim|kto|who/.test(l))return pl?'Jestem G — diabelski kosmita-DJ, kumpel bota D i całej ekipy D7.':'I am G — the devil-alien DJ, buddy of bot D and the D7 crew.';
  return T[lang].off;}
/* ---- chat routed to main bot (all bots) with memory ---- */
function ask(q){if(!q)return;add('u',lang==='pl'?'Ty':'You',q);$('q').value='';
  var c=cmd(q);if(c){add('g','G',c);speak(c);return;}
  var ctx=hist.slice(-8).map(function(h){return h[1]+': '+h[2]}).join('\n');
  var ctl=new AbortController();setTimeout(function(){ctl.abort()},20000);
  fetch('/api/bots/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,text:q,bot:'G',lang:lang,context:ctx,persona:'Super Bot D PRO — wesoły diabeł-kosmita DJ, odpowiadaj krótko'+(lang==='en'?' in English':' po polsku'),source:'supergx'}),signal:ctl.signal})
  .then(function(r){return r.json()}).then(function(j){var a=j&&(j.reply||j.answer);if(!a||j.offline)throw 0;st.textContent='online · bot '+(j.bot||'D');a=String(a).replace(/^\[[A-Z]+\]\s*/,'');add('g','G',a);speak(a);})
  .catch(function(){st.textContent='offline · lokalny mózg';var a=local(q);add('g','G',a);speak(a);});}
$('send').onclick=function(){ask($('q').value.trim())};
$('q').onkeydown=function(e){if(e.key==='Enter')ask($('q').value.trim())};
$('mute').onclick=function(){muted=!muted;this.textContent=muted?'🔇':'🔊';if(muted&&window.speechSynthesis)speechSynthesis.cancel();};
function setLang(l){lang=l;LS('sgx-lang',l);$('lang').textContent=l.toUpperCase();$('q').placeholder=T[l].ph;}
$('lang').onclick=function(){setLang(lang==='pl'?'en':'pl');var a=T[lang].hi;add('g','G',a,false);speak(a);};
/* ---- voice input ---- */
$('mic').onclick=function(){var N=window.D7Native,L=lang==='en'?'en-US':'pl-PL';
  if(N&&N.startListening){var prev=window.__d7Voice;window.__d7Voice=function(ev){if(ev&&ev.type==='result'){window.__d7Voice=prev;ask(ev.text||ev.transcript||'');}else if(prev)try{prev(ev)}catch(e){}};try{N.startListening(L);}catch(e){}return;}
  var R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){add('g','G',lang==='pl'?'Rozpoznawanie mowy niedostępne — pisz.':'Speech recognition unavailable — type.');return;}
  var r=new R();r.lang=L;r.onresult=function(e){ask(e.results[0][0].transcript)};r.start();};
/* ---- MilkDrop ---- */
function bc(){var m=window.butterchurn;if(!m)return null;if(m.createVisualizer)return m;if(m.default&&m.default.createVisualizer)return m.default;return null;}
function size(){var w=innerWidth,h=innerHeight,d=Math.min(devicePixelRatio||1,1.5);cv.width=w*d;cv.height=h*d;if(viz)viz.setRendererSize(cv.width,cv.height);}
addEventListener('resize',size);
function ensure(){if(ac)return true;ac=new (window.AudioContext||window.webkitAudioContext)();an=ac.createAnalyser();an.fftSize=512;gain=ac.createGain();gain.gain.value=vol;gain.connect(ac.destination);
  var B=bc();if(B){try{size();viz=B.createVisualizer(ac,cv,{width:cv.width,height:cv.height,pixelRatio:1});viz.connectAudio(an);
    try{presets=window.butterchurnPresets.getPresets();}catch(e){presets={};}pkeys=Object.keys(presets);
    var fav=pkeys.filter(function(k){return /flexi|geiss|martin|shifter|rovastar|cope/i.test(k)});pkeys=fav.concat(pkeys.filter(function(k){return fav.indexOf(k)<0}));
    nextPreset(0);(function r(){requestAnimationFrame(r);try{viz.render()}catch(e){}})();}catch(e){viz=null;st.textContent='WebGL niedostępny';}}
  return true;}
function nextPreset(bl){if(!viz||!pkeys.length)return;var list=favs.filter(function(k){return presets[k]});
  var k;if(list.length&&Math.random()<.6)k=list[Math.floor(Math.random()*list.length)];else{pi=(pi+1)%pkeys.length;k=pkeys[pi];}
  viz.loadPreset(presets[k],bl===undefined?2:bl);nextPreset.cur=k;$('fav').textContent=favs.indexOf(k)>=0?'⭐':'☆';}
function toggleFav(){var k=nextPreset.cur;if(!k)return;var i=favs.indexOf(k);if(i>=0)favs.splice(i,1);else favs.push(k);LS('sgx-favs',favs);$('fav').textContent=i>=0?'☆':'⭐';}
$('next').onclick=function(){ensure();nextPreset()};$('fav').onclick=toggleFav;
function fullscreen(){var e=document.documentElement;if(document.fullscreenElement){document.exitFullscreen();document.body.classList.remove('fsx');}else{(e.requestFullscreen||e.webkitRequestFullscreen||function(){}).call(e);document.body.classList.add('fsx');}flash('SUPER BOT D PRO',2000);}
$('fs').onclick=fullscreen;
function setVol(v){vol=Math.max(0,Math.min(1,v));LS('sgx-vol',vol);if(gain)gain.gain.value=vol;}
function stopSrc(){if(audioEl){audioEl.pause();audioEl.src='';audioEl=null;}if(srcNode){try{srcNode.disconnect();srcNode.stop&&srcNode.stop()}catch(e){}srcNode=null;}}
function setSrc(k){$('src').value=k;ensure();ac.resume();stopSrc();
  if(STATIONS[k]){audioEl=new Audio();audioEl.crossOrigin='anonymous';audioEl.src=STATIONS[k][1];
    srcNode=ac.createMediaElementSource(audioEl);srcNode.connect(an);srcNode.connect(gain);audioEl.play().catch(function(){add('g','G',lang==='pl'?'Dotknij ▶ jeszcze raz.':'Tap ▶ again.',false)});}
  else if(k==='mic'){navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){srcNode=ac.createMediaStreamSource(s);srcNode.connect(an);}).catch(function(){add('g','G','Brak dostępu do mikrofonu.',false)});}
  else{var o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';o.frequency.value=55;o.connect(g);g.connect(an);g.connect(gain);g.gain.value=0;o.start();
    var t=ac.currentTime;for(var i=0;i<480;i++){var b=t+i*0.46875;g.gain.setValueAtTime(.5,b);g.gain.exponentialRampToValueAtTime(.01,b+.3);o.frequency.setValueAtTime(i%8<4?55:41,b);}srcNode=o;}
  $('go').textContent='■ Stop';flash('SUPER BOT D PRO');}
$('go').onclick=function(){if(audioEl||srcNode){stopSrc();this.textContent='▶ Wizualizacja';}else setSrc($('src').value)};
$('src').onchange=function(){if(audioEl||srcNode)setSrc(this.value)};
/* ---- bots live status panel ---- */
function showBots(force){var p=$('bots');if(!force&&p.style.display!=='none'){p.style.display='none';return;}p.style.display='block';p.textContent='⏳ …';
  Promise.all([fetch('/api/bots').then(function(r){return r.json()}),fetch('/api/status').then(function(r){return r.json()}).catch(function(){return {}})])
  .then(function(a){var bots=(a[0]&&a[0].bots)||[],on=(a[1]&&a[1].online)||[];p.innerHTML='';
    var h=document.createElement('div');h.style.cssText='color:#0ff;font-weight:700;margin-bottom:4px';h.textContent='🤖 '+bots.length+' botów · online '+on.length+' · '+new Date().toLocaleTimeString();p.appendChild(h);
    bots.forEach(function(b){var d=document.createElement('div');var ok=on.indexOf(b.id)>=0;d.textContent=(ok?'🟢 ':'⚪ ')+b.name+' — '+(b.role||'')+(b.subBots&&b.subBots.length?' (+'+b.subBots.length+')':'');d.style.margin='2px 0';p.appendChild(d);});})
  .catch(function(){p.textContent=lang==='pl'?'❌ Brak połączenia z serwerem botów (offline).':'❌ Bots server unreachable (offline).';});}
$('botsBtn').onclick=function(){showBots(false)};
setInterval(function(){if($('bots').style.display!=='none')showBots(true)},30000);
/* ---- v55: online status with auto-retry + onboarding ---- */
var online=null;
function checkNet(cb){var ctl=new AbortController();setTimeout(function(){ctl.abort()},8000);
  Promise.all([fetch('/api/status',{cache:'no-store',signal:ctl.signal}).then(function(r){if(!r.ok)throw 0;return r.json()}),fetch('/api/bots',{cache:'no-store',signal:ctl.signal}).then(function(r){return r.json()}).catch(function(){return {}})])
  .then(function(a){if(!a[0]||a[0].offline||a[0].ok===false)throw 0;online=true;var on=a[0].online||[],bots=(a[1]&&a[1].bots)||[];
     st.textContent='🟢 online · '+on.length+' botów';cb&&cb(true,on,bots);})
  .catch(function(){online=false;st.textContent='⚪ offline · ponawiam';cb&&cb(false,[],[]);});}
setInterval(function(){checkNet()},30000);
addEventListener('online',function(){setTimeout(checkNet,1500)});
checkNet(function(ok,on,bots){var n=$('onbNet'),b=$('onbBots');if(!n)return;
  var live='';try{live=(window.D7APK&&D7APK.live&&D7APK.live())||location.origin;}catch(e){}
  n.textContent=ok?'🟢 ONLINE — połączono z serwerem botów':'⚪ OFFLINE — tryb lokalny, ponawiam automatycznie co 30 s';
  n.style.color=ok?'#7f7':'#ffd23f';
  b.textContent=ok?('Boty online ('+on.length+'): '+bots.map(function(x){return x.name}).join(', ')):'';});
var onb=$('onb');if(onb)$('onbGo').onclick=function(){onb.style.display='none';try{(window.AudioContext||window.webkitAudioContext)&&ensure()&&ac.resume();}catch(e){}speak(T[lang].hi);};
/* ---- init ---- */
setLang(lang);
var css=document.createElement('style');css.textContent='body.fsx #log,body.fsx #bar,body.fsx header{opacity:.15;transition:opacity .4s}body.fsx #log:hover,body.fsx #bar:hover,body.fsx header:hover{opacity:1}';document.head.appendChild(css);
if(hist.length){hist.slice(-6).forEach(function(h){add(h[0],h[1],h[2],false)});}
add('g','G',T[lang].hi,false);
window.SuperGX={ask:ask,speak:speak,setSrc:setSrc,cmd:cmd};
})();
