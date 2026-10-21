/* Super Bot G Pro v55 — avatar expressions + synthetic lip-sync, PTT/continuous PL speech,
   fast-first then merge refine, localStorage history, Multiroom tabs, Multitool embed, build panel. */
(function(){'use strict';
var $=function(i){return document.getElementById(i)};
var ERR=0;window.addEventListener('error',function(e){ERR++;$('err').textContent='⚠ JS: '+(e.message||'').slice(0,90)});
window.addEventListener('unhandledrejection',function(e){ERR++;$('err').textContent='⚠ '+String(e.reason).slice(0,90)});
setInterval(function(){if(ERR>=5){var l=+sessionStorage.getItem('gpro.rl')||0;if(Date.now()-l>600000){sessionStorage.setItem('gpro.rl',Date.now());location.reload()}}},10000);

function jfetch(u,o,ms,tries){tries=tries==null?2:tries;var c=new AbortController(),t=setTimeout(function(){c.abort()},ms||15000);o=o||{};o.signal=c.signal;
 return fetch(u,o).then(function(r){clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).catch(function(e){clearTimeout(t);if(tries>0)return new Promise(function(res){setTimeout(res,700)}).then(function(){return jfetch(u,o,ms,tries-1)});throw e})}

document.querySelectorAll('nav button[data-s]').forEach(function(b){b.onclick=function(){document.querySelectorAll('section').forEach(function(s){s.classList.toggle('on',s.id==b.dataset.s)})}});
document.querySelectorAll('[data-emb]').forEach(function(b){b.onclick=function(){document.querySelectorAll('[data-emb]').forEach(function(x){x.classList.remove('on')});b.classList.add('on');$('emb').src=b.dataset.emb}});

function health(){var eps=['api/status','api/bot-mesh','api/bots'],ok=0;Promise.all(eps.map(function(e){return jfetch(e,{},6000,0).then(function(){ok++},function(){})})).then(function(){
 $('hd').style.background=ok==eps.length?'#2e2':ok?'#fa0':'#e22';$('ht').textContent='API '+ok+'/'+eps.length+(navigator.onLine?'':' · offline')+(ERR?' · JS err: '+ERR:'')})}
health();setInterval(health,30000);
jfetch('sync-manifest.json',{},8000,1).then(function(m){$('mst').textContent='liveUrl: '+m.liveUrl+' · APK: '+(m.apkUrl||'?')},function(){$('mst').textContent='manifest niedostępny'});

/* ---------- avatar: expressions + synthetic lip-sync (speechSynthesis has no audio level) ---------- */
var mood='idle',lip=0,lipTarget=0;
function setMood(m){mood=m;$('av').className=m;$('mood').textContent=m;
 var brow=$('brow'),cheek=$('cheek');
 if(m=='listen'){brow.setAttribute('d','M70 88 L110 86 M170 88 L130 86');cheek.setAttribute('opacity','0.35')}
 else if(m=='think'){brow.setAttribute('d','M70 78 L110 95 M170 78 L130 95');cheek.setAttribute('opacity','0')}
 else if(m=='talk'){brow.setAttribute('d','M70 82 L110 88 M170 82 L130 88');cheek.setAttribute('opacity','0.2')}
 else{brow.setAttribute('d','M70 82 L110 92 M170 82 L130 92');cheek.setAttribute('opacity','0')}}
(function anim(){requestAnimationFrame(anim);lip+=(lipTarget-lip)*.28;var ry=mood=='talk'?5+lip*28:mood=='listen'?8:4;
 $('mouth').setAttribute('ry',String(ry));$('teeth').setAttribute('opacity',ry>12?'.95':'.2');
 /* pupil glance */var t=performance.now()/800,ox=Math.sin(t)*3,oy=Math.cos(t*.7)*2;
 if(mood=='think'){ox=6;oy=-4}if(mood=='listen'){ox=0;oy=3}
 $('pL').setAttribute('cx',90+ox);$('pL').setAttribute('cy',108+oy);$('pR').setAttribute('cx',150+ox);$('pR').setAttribute('cy',108+oy)})();
setInterval(function(){if(mood=='idle'||mood=='listen'){['eL','eR'].forEach(function(i){$(i).setAttribute('ry','2');setTimeout(function(){$(i).setAttribute('ry','18')},140)})}},4200);

function speak(t){if(!$('tts').checked||!window.speechSynthesis){setMood('talk');lipTarget=1;setTimeout(function(){lipTarget=0;setMood('idle');afterSpeak()},1200);return}
 try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(String(t).replace(/\[[^\]]*\]/g,'').replace(/—.*$/gm,'').slice(0,500));
  u.lang='pl-PL';u.pitch=.55;u.rate=1.05;
  u.onstart=function(){setMood('talk');lipTarget=1;(function pulse(){if(mood!='talk')return;lipTarget=.35+.65*Math.random();setTimeout(pulse,90+Math.random()*80)})()};
  u.onend=u.onerror=function(){lipTarget=0;setMood('idle');afterSpeak()};
  speechSynthesis.speak(u);setTimeout(function(){if(!speechSynthesis.speaking){lipTarget=0;setMood('idle');afterSpeak()}},25000)}catch(e){lipTarget=0;setMood('idle');afterSpeak()}}
function afterSpeak(){if($('cont').checked&&!listening)startListen(true)}

/* ---------- history ---------- */
var HIST=JSON.parse(localStorage.getItem('gpro.hist')||'[]');
function saveHist(){try{localStorage.setItem('gpro.hist',JSON.stringify(HIST.slice(-80)))}catch(e){}}
function out(c,t,cls){var d=document.createElement('div');d.className=c+(cls?' '+cls:'');d.textContent=t;$('log').appendChild(d);$('log').scrollTop=1e9;return d}
function renderHist(){$('log').innerHTML='';HIST.forEach(function(h){out(h.r,h.t)});if(!HIST.length)out('b','😈 Super Bot G Pro — szybka odpowiedź pierwszego bota, potem refine ze wszystkich. PTT (przytrzymaj 🎤) albo rozmowa ciągła.')}
renderHist();$('clr').onclick=function(){HIST=[];saveHist();renderHist()};

/* ---------- offline + web ---------- */
var OFF=[[/bpm|tempo/,'BPM = uderzenia na minutę: house ~120–128, techno ~125–140.'],[/radio|dj/,'Otwórz Multitool → DJ (decki, looper, FX) albo Radio.'],[/mc.?707/,'Roland MC-707 — groovebox 8 ścieżek; D7 DJ jest jego companionem.'],[/(czesc|cześć|hej|siema)/,'Siema Daniel! 😈 Tu Super Bot G Pro.']];
function offline(q){var t=q.toLowerCase();for(var i=0;i<OFF.length;i++)if(OFF[i][0].test(t))return OFF[i][1];return null}
function web(q){var t=q.replace(/[?!.]+$/,'');return jfetch('https://pl.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch='+encodeURIComponent(t),{},7000,0).then(function(j){var h=j.query.search[0];if(!h)throw 0;return jfetch('https://pl.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(h.title.replace(/ /g,'_')),{},7000,0)}).then(function(p){if(!p.extract)throw 0;return p.extract.slice(0,500)+' [Wikipedia]'})
 .catch(function(){return jfetch('https://api.duckduckgo.com/?format=json&no_html=1&q='+encodeURIComponent(t),{},7000,0).then(function(d){if(!d.AbstractText)throw 0;return d.AbstractText.slice(0,500)+' [DuckDuckGo]'})})}

var ACK=/^\s*(\[[^\]]*\]\s*)?(odbieram|ok|okej|received|roger|ack)[\s.!…]*$/i,LOCAL=/Tryb lokalny|chwilowo niedostępne/;
function strip(a){return String(a||'').replace(/^\s*(\[[^\]]{1,40}\]\s*)+/,'').trim()}
function merge(replies){var seen={},u=[];replies.forEach(function(r){var t=strip(r.answer||r.reply);if(!t||ACK.test(r.answer||'')||LOCAL.test(t)||t.length<12)return;var k=t.toLowerCase().slice(0,60);if(seen[k]){seen[k].by.push(r.bot);return}seen[k]={t:t,by:[r.bot],src:r.source};u.push(seen[k])});
 u.sort(function(a,b){return b.by.length-a.by.length||b.t.length-a.t.length});return u}

var LAST={},BOTS=[];
function tabs(){var w=$('rtabs');w.innerHTML='';BOTS.forEach(function(b,i){var x=document.createElement('button');x.textContent=b.name;if(i==0)x.className='on';x.onclick=function(){w.querySelectorAll('button').forEach(function(y){y.classList.remove('on')});x.classList.add('on');$('rbody').textContent=(LAST[b.name]||'— brak odpowiedzi w tej sesji —')};w.appendChild(x)});if(BOTS[0])$('rbody').textContent=LAST[BOTS[0].name]||'—'}
jfetch('api/bots',{},6000,1).then(function(j){BOTS=j.bots||[];tabs()},function(){});

function logSrv(role,q,t){jfetch('api/chat-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:role,text:'Q: '+q+'\nA: '+String(t).slice(0,1500),tags:['learn','help']})},8000,0)
 .then(function(){$('slog').textContent='zapisano we wspólnym logu ✅'},function(){$('slog').textContent='log lokalny (token właściciela wymagany do /api/chat-log)';try{var L=JSON.parse(localStorage.getItem('gpro.log')||'[]');L.push({q:q,t:t,at:Date.now()});localStorage.setItem('gpro.log',JSON.stringify(L.slice(-100)))}catch(e){}})}

function ask(q){if(!q)return;HIST.push({r:'u',t:'Ty: '+q});saveHist();out('u','Ty: '+q);setMood('think');
 var wait=out('b','😈 G Pro: myślę… (szybka odpowiedź → refine)');
 var meshP=jfetch('api/bot-mesh',{},6000,1).then(function(j){return j.peers||[]},function(){return[]});
 var firstShown=false,streamEl=null,spoken=false;
 function showFirst(j){if(firstShown||!$('fast').checked)return;var a=strip(j.answer||j.reply);if(!a||ACK.test(j.answer||'')||LOCAL.test(a))return;
  firstShown=true;wait.remove();streamEl=out('b','😈 G Pro (szybko · '+(j.bot||'?')+'): '+a,'stream');HIST.push({r:'b',t:streamEl.textContent});saveHist();
  if(!spoken){spoken=true;speak(a)}}
 var first=jfetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q,bot:'megabot',lang:'pl'})},35000,1).then(function(j){showFirst(j);return j},function(){return null});
 var all=jfetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:q,bot:'all',lang:'pl'})},120000,0).then(function(j){return j.replies||[]})
  .catch(function(){return first.then(function(j){return j?[j]:[]})});
 Promise.all([meshP,all,first]).then(function(r){var peers=r[0],reps=r[1];reps.forEach(function(x){LAST[x.bot]=strip(x.answer||x.reply)});tabs();
  var u=merge(reps),txt;
  if(u.length){txt=u[0].t+'\n— zgoda: '+u[0].by.join(', ')+' ('+(u[0].src||'?')+') · boty: '+reps.length+' · mesh: '+peers.length+(u[1]?'\n➕ '+u[1].by.join(', ')+': '+u[1].t.slice(0,220):'')}
  else{var o=offline(q);return o?Promise.resolve(o+' [offline]'):web(q).catch(function(){return 'Nie mam pewnej odpowiedzi — spróbuj inaczej.'})}
  return txt}).then(function(txt){
  if(!firstShown){wait.remove();out('b','😈 G Pro: '+txt);HIST.push({r:'b',t:'😈 G Pro: '+txt});saveHist();if(!spoken)speak(txt)}
  else{var refined=out('b','😈 G Pro (refine): '+txt,'refine');HIST.push({r:'b',t:refined.textContent});saveHist();
   /* only re-speak if refine is clearly different from the stream */var s0=strip(streamEl?streamEl.textContent:'');if(Math.abs(s0.length-strip(txt).length)>40||strip(txt).slice(0,40)!=s0.slice(0,40)){if($('tts').checked)speak(txt)}}
  logSrv('super-bot-g-pro',q,txt);setMood(spoken||speechSynthesis&&speechSynthesis.speaking?'talk':'idle')
 },function(){wait.remove();var o=offline(q)||'Błąd połączenia — tryb offline.';out('b','😈 G Pro: '+o);HIST.push({r:'b',t:'😈 G Pro: '+o});saveHist();speak(o)})}

$('go').onclick=function(){var q=$('q').value.trim();if(q){$('q').value='';ask(q)}};$('q').onkeydown=function(e){if(e.key=='Enter')$('go').onclick()};

/* ---------- speech: push-to-talk + continuous ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition,listening=false,rec=null;
if(!SR){$('mic').disabled=true;$('mic').title='SpeechRecognition niedostępne w tej przeglądarce';$('cont').disabled=true}
function startListen(continuous){if(!SR||listening)return;try{rec=new SR();rec.lang='pl-PL';rec.interimResults=false;rec.continuous=!!continuous;
  rec.onstart=function(){listening=true;setMood('listen');$('mic').classList.add('on');$('mic').textContent=continuous?'🔴 ON':'🔴 …'};
  rec.onresult=function(e){var t=e.results[e.results.length-1][0].transcript;if(t)ask(t.trim())};
  rec.onerror=function(e){$('err').textContent='🎤 '+e.error;if(e.error=='not-allowed')$('cont').checked=false};
  rec.onend=function(){listening=false;$('mic').classList.remove('on');$('mic').textContent='🎤 PTT';if($('cont').checked&&mood!='talk'&&mood!='think')setTimeout(function(){startListen(true)},400);else if(mood=='listen')setMood('idle')};
  rec.start()}catch(e){$('err').textContent='🎤 '+e.message}}
function stopListen(){try{if(rec)rec.stop()}catch(e){}$('cont').checked=false}
/* PTT: hold */
$('mic').addEventListener('pointerdown',function(e){e.preventDefault();if($('cont').checked)return;startListen(false)});
['pointerup','pointerleave','pointercancel'].forEach(function(ev){$('mic').addEventListener(ev,function(){if(!$('cont').checked)try{rec&&rec.stop()}catch(e){}})});
$('cont').onchange=function(){if(this.checked)startListen(true);else stopListen()};

/* ---------- build app panel ---------- */
$('bsave').onclick=function(){var t=($('bt').value||'bez tytułu').trim(),s=$('bs').value.trim();if(!s){$('bout').textContent='Wpisz specyfikację.';return}
 var body='[BUILD APP] '+t+'\n'+s;logSrv('build-app',t,s);
 try{var L=JSON.parse(localStorage.getItem('gpro.builds')||'[]');L.push({t:t,s:s,at:Date.now()});localStorage.setItem('gpro.builds',JSON.stringify(L.slice(-50)));$('bout').textContent='Zapisano lokalnie + próba /api/chat-log.\n\n'+L.map(function(x){return '• '+new Date(x.at).toLocaleString()+' — '+x.t}).join('\n')}catch(e){$('bout').textContent='zapisano (localStorage błąd: '+e.message+')'}};
$('blist').onclick=function(){try{var L=JSON.parse(localStorage.getItem('gpro.builds')||'[]');$('bout').textContent=L.length?L.map(function(x){return '══ '+x.t+' · '+new Date(x.at).toLocaleString()+'\n'+x.s}).join('\n\n'):'(brak lokalnych buildów)'}catch(e){$('bout').textContent=String(e)}};
})();
