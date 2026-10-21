/* Super Bot DJ Builder 🐲 — Bot Builder, 7 Mózgów, 777 agentów, MilkDrop. Free only: Pollinations (1 request at a time, queued) + Wikipedia + offline. */
(function(){'use strict';var $=function(i){return document.getElementById(i)},LS=window.localStorage,TEST=!!window.__D7_TEST__;
function esc(s){return String(s==null?'':s).replace(/[<>&"]/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]})}
function lsj(k,d){try{return JSON.parse(LS.getItem(k))||d}catch(e){return d}}function lss(k,v){try{LS.setItem(k,JSON.stringify(v))}catch(e){}}
/* ---- shared AI queue: strictly sequential, 402/429 backoff, timeout, offline fallback ---- */
var Q=Promise.resolve(),qlen=0,BS=window.D7BrainStat={ok:0,fail:0,last:'',t:0};
function tf(u,o,ms){var c=window.AbortController?new AbortController():null,t=setTimeout(function(){c&&c.abort()},ms);o=o||{};if(c)o.signal=c.signal;return fetch(u,o).then(function(r){clearTimeout(t);return r},function(e){clearTimeout(t);throw e})}
function ai(sys,q){if(navigator.onLine===false)return Promise.reject(new Error('offline'));qlen++;
 var run=Q.then(function(){var n=0;function go(){return tf('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'openai',messages:[{role:'system',content:sys},{role:'user',content:q}]})},25000).then(function(r){
  if((r.status==402||r.status==429||r.status>=500)&&n<5){n++;return new Promise(function(z){setTimeout(z,[2000,3500,5000,7000,9000][n-1])}).then(go)}if(!r.ok)throw new Error('http '+r.status);return r.json()}).then(function(j){var a=j&&j.choices?j.choices[0].message.content:j;if(!a)throw new Error('empty');return String(a).replace(/^\s*(\[[^\]]{1,40}\]\s*)+/,'').trim()})}
  var gap=Date.now()-(ai.last||0);return new Promise(function(z){setTimeout(z,Math.max(0,2500-gap))}).then(go).then(function(a){ai.last=Date.now();return a},function(e){ai.last=Date.now();throw e})});
 Q=run.catch(function(){});run.then(function(){qlen--;BS.ok++;BS.last='ok';BS.t=Date.now()},function(){qlen--;BS.fail++;BS.last='fail';BS.t=Date.now()});return run}
function srv(sys,q,bot){if(!/^https?:/.test(location.protocol)||window.D7APK)return Promise.reject(new Error('no server'));
 return tf('/api/brain',{method:'POST',headers:{'Content-Type':'application/json','X-D7-Test':TEST?'1':'0'},body:JSON.stringify({q:q,bot:bot||'supergrok',test:TEST||undefined,lang:'pl'})},40000).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){var a=j.answer||j.reply;if(!a||j.source=='local-rules')throw 0;return String(a).replace(/^\s*(\[[^\]]{1,40}\]\s*)+/,'')+' [serwer]'})}
/* v66 chain: own key (only if filled + enabled) > Pollinations queue > /api/brain > offline */
function own(sys,q){var K=LS.getItem('d7s.key');if(!K||LS.getItem('d7s.usekey')!='1')return Promise.reject(new Error('nokey'));return tf(LS.getItem('d7s.keyurl')||'https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+K},body:JSON.stringify({model:LS.getItem('d7s.keymodel')||'gpt-4o-mini',messages:[{role:'system',content:sys},{role:'user',content:q}]})},25000).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(j){BS.own=(BS.own||0)+1;return j.choices[0].message.content+' [własny klucz]'})}
function aiAny(sys,q,bot){var st=window.D7ChatStyle&&window.D7ChatStyle();if(st)sys+=' Styl odpowiedzi: '+st+'.';return own(sys,q).catch(function(){return ai(sys,q)}).catch(function(){return srv(sys,q,bot)})}
function wiki(q){var t=q.replace(/^(co to (jest|są|sa)|kim (jest|był|byl)|what is|who is)\s*/i,'').replace(/[?!.]+$/,'').trim();if(t.split(/\s+/).length>4)t=t.split(/[^\wąćęłńóśźż]+/i).filter(function(w){return w.length>4}).slice(0,3).join(' ')||t;
 return tf('https://pl.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch='+encodeURIComponent(t),{},8000).then(function(r){return r.json()}).then(function(j){var h=j.query&&j.query.search[0];if(!h)throw 0;
  return tf('https://pl.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(h.title.replace(/ /g,'_')),{},8000).then(function(r){return r.json()}).then(function(p){if(!p.extract)throw 0;var kw=t.toLowerCase().split(/\s+/).filter(function(w){return w.length>3}).map(function(w){return w.slice(0,5)}),ex=(p.title+' '+p.extract).toLowerCase();if(kw.length&&!kw.some(function(w){return ex.indexOf(w)>=0}))throw 0;return p.extract.slice(0,450)+' [Wikipedia: '+((p.content_urls&&p.content_urls.desktop.page)||h.title)+']'})})}
var FACTS=function(){return lsj('sbdj.facts',[])};
function memBrain(q){var w=q.toLowerCase().split(/\W+/).filter(function(x){return x.length>3}),bots=lsj('sbdj.bots',[]);
 var hits=FACTS().concat(bots.map(function(b){return 'Bot '+b.name+': '+b.role})).filter(function(f){f=f.toLowerCase();return w.some(function(x){return f.indexOf(x)>=0})});
 return Promise.resolve(hits.length?'Z pamięci: '+hits.slice(-4).join(' · '):'Pamięć lokalna: brak pasujących faktów ('+FACTS().length+' faktów, '+bots.length+' botów).')}
var OFF={logic:'Rozbij problem na kroki: cel → dane → plan → test.',music:'DJ: miksuj na frazach 16/32 taktów, trzymaj BPM ±6%, bass swap na takcie.',code:'Kod: małe kroki, test po każdej zmianie, backup przed deployem.',visual:'FX: synchronizuj zmiany presetów MilkDrop z frazą, kolory pod nastrój.'};
var BRAINS=[['logic','🧮 Logika','analityczny mózg logiki i planowania'],['music','🎧 Muzyka/DJ','mózg muzyki, DJ-ingu, hip-hopu, BPM, miksowania'],['code','🛠 Kod/Builder','mózg programowania i budowania aplikacji'],
 ['web','🔎 Web (Wikipedia)',null],['visual','🌈 Wizualizacje/FX','mózg wizualizacji, MilkDrop, światła, FX'],['memory','💾 Pamięć',null],['grok','🐲 SuperGrok (koordynator)','koordynator SuperGrok, łączy odpowiedzi mózgów w jedną']];
function sysFor(id,persona){var b=BRAINS.filter(function(x){return x[0]==id})[0]||BRAINS[1];return 'Jesteś '+(persona||b[1])+' — '+(b[2]||'')+' w aplikacji Super Bot DJ Builder 🐲 Daniela Dydo (DJ, Kraków). Odpowiadaj po polsku, max 3 zdania, konkretnie. Nie wymyślaj faktów.'}
function brain(id,q,persona){if(id=='web')return wiki(q).catch(function(){return 'Brak wyniku w Wikipedii.'});if(id=='memory')return memBrain(q);
 return aiAny(sysFor(id,persona),q,{logic:'77',music:'d',code:'autofix',visual:'dargonmoon',grok:'supergrok'}[id]).catch(function(){return (OFF[id]||'Brak połączenia — tryb offline.')+' [offline]'})}
/* ---- DOM sections (created before hiphopx.js builds the nav) ---- */
var SCR=document.querySelector('script[src*=hiphopx]');function sec(id,html){var s=document.createElement('section');s.id='t-'+id;s.innerHTML=html;document.body.insertBefore(s,SCR);return s}
sec('bb','<div class="card"><b>🛠 Bot Builder</b> — opisz bota, a ja go zbuduję. Bot od razu gada i umie sterować DJ (beat, FX, MilkDrop).'+
 '<div class="row"><input id="bbDesc" style="flex:1" placeholder="np. „raper z Krakowa, robi trap 140 BPM i odpala airhorny”"><button class="b" id="bbGen">✨ Zbuduj z opisu</button></div>'+
 '<div class="row"><input id="bbName" placeholder="Nazwa"><input id="bbRole" style="flex:1" placeholder="Rola"><select id="bbBrain"></select></div><div class="row"><input id="bbPersona" style="flex:1" placeholder="Persona / styl mówienia"><label><input type="checkbox" id="bbDj" checked> 🎛 DJ (beat/FX/wizualizacje)</label><button class="b" id="bbSave">💾 Zapisz bota</button></div><small id="bbSt"></small></div>'+
 '<div class="card"><div class="row"><b>Twoje boty:</b> <span id="bbList"></span></div><div id="bbLog" style="height:38vh;overflow:auto;background:#0008;border-radius:8px;padding:6px"></div>'+
 '<div class="row"><select id="bbWho"></select><input id="bbQ" style="flex:1" placeholder="Napisz do bota… (np. „odpal trap beat”, „airhorn”, „wizualizacje”)"><button class="b" id="bbSend">Wyślij</button></div></div>');
sec('brains','<div class="card"><b>🧠 7 Mózgów online</b> <small>Wszystkie korzystają z tego samego darmowego Pollinations.ai po kolei (1 zapytanie naraz) + Wikipedia + pamięć lokalna; offline → wiedza lokalna.</small>'+
 '<div class="row"><input id="brQ" style="flex:1" placeholder="Pytanie do 7 mózgów"><label><input type="checkbox" id="brFast"> ⚡ szybko (3 mózgi)</label><button class="b" id="brGo">🧠 Zapytaj</button><button class="b" id="brStop">⏹</button></div><div id="brOut"></div></div>');
sec('agents','<div class="card"><b>🤖 777 agentów</b> <small>Uczciwie: to lekkie profile (nazwa + rola + przypisany mózg) generowane na żądanie — wszystkie korzystają z tych samych 7 mózgów / darmowego AI.</small>'+
 '<div class="row"><input id="agQ" style="flex:1" placeholder="Szukaj agenta (np. trap, mix, kod, 512)"><span id="agN"></span></div><div id="agList" style="display:flex;flex-wrap:wrap;gap:4px;max-height:30vh;overflow:auto"></div>'+
 '<div class="row"><b id="agCur">—</b><input id="agAsk" style="flex:1" placeholder="Zadanie dla wybranego agenta"><button class="b" id="agGo">▶</button></div><div id="agOut" class="card"></div></div>');
sec('milk','<div class="card" style="padding:4px"><div class="row"><b>🌌 MilkDrop</b><button class="b" id="mkStart">▶ Start (audio aplikacji)</button><button class="b" id="mkMic">🎤 Mikrofon</button><button class="b" id="mkNext">⏭ Preset</button><label><input type="checkbox" id="mkAuto" checked> auto 15 s</label><span id="mkName" style="font-size:12px"></span></div>'+
 '<canvas id="mkCv" style="width:100%;height:calc(100vh - 210px);min-height:300px;background:#000;border-radius:8px;display:block"></canvas></div>');
/* ---- Download + Wsparcie (display only: no payment processing, no APIs) ---- */
var LIVE=(function(){try{return window.D7APK||/^file:|appassets/.test(location.href)?((window.D7_APK_CONFIG&&D7_APK_CONFIG.liveUrl)||'').replace(/\/$/,'')+'/':''}catch(e){return''}})();
sec('dl','<div class="card"><b>⬇ Pobierz aplikację Android</b><div class="row"><a class="b" style="font-size:18px;text-decoration:none" href="'+LIVE+'downloads/7D-v71.apk" download>🐲 7D — najnowsza (v71)</a></div>'+
 '<div class="row">Poprzednie: <a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v70.apk" download>v70</a> <a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v69.apk" download>v69</a> <a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v68.apk" download>v68</a> <a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v67.apk" download>v67</a> <a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v66.apk" download>v66</a><a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v65.apk" download>v65</a><a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v64.apk" download>v64</a><a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v63.apk" download>v63</a><a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v62.apk" download>v62</a><a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v61.apk" download>v61</a><a class="b" style="text-decoration:none" href="'+LIVE+'downloads/Super-G-DJ-HIPHOP-X-v60.apk" download>v60</a></div>'+
 '<small>Instalacja: pobierz → otwórz plik → zezwól na instalację z tego źródła. Aktualizuje się w miejscu (ten sam pakiet com.danieldydo.d7dj).</small></div>');
function payRow(label,val){return '<div class="row"><span style="min-width:150px">'+label+'</span><b style="font-size:17px;letter-spacing:.5px">'+val+'</b><button class="b sbcopy" data-v="'+val.replace(/\s/g,'')+'">📋 Kopiuj</button></div>'}
sec('pay','<div class="card"><b>💖 Wsparcie / Płatności</b> <small>(tylko informacje — aplikacja niczego nie pobiera ani nie przetwarza)</small>'+
 payRow('📱 BLIK na telefon:','730 377 357')+payRow('🏦 Przelew Nest Bank:','PL45 1870 1045 2083 1058 7576 0001')+'<div class="row">Odbiorca: <b>Daniel Dydo / DJ DaX</b><button class="b sbcopy" data-v="Daniel Dydo">📋 Kopiuj</button></div><small id="payMsg"></small></div>');
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.sbcopy');if(!b)return;var v=b.dataset.v,ok=function(){$('payMsg').textContent='✔ Skopiowano: '+v};
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(v).then(ok,fb);else fb();function fb(){var t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok()}catch(x){$('payMsg').textContent='Zaznacz i skopiuj ręcznie: '+v}t.remove()}});
/* ---- 7 brains (sequential, progressive, cancellable; UI never blocked) ---- */
var runId=0;
function sevenBrains(q,out,fast){var my=++runId,ids=fast?['music','web','grok']:BRAINS.map(function(b){return b[0]}),parts=[],t0=Date.now();out.innerHTML='';
 return ids.reduce(function(p,id){return p.then(function(){if(my!=runId)return;var b=BRAINS.filter(function(x){return x[0]==id})[0],d=document.createElement('div');d.className='card';d.dataset.brain=id;d.innerHTML='<b>'+b[1]+'</b>: ⏳…';out.appendChild(d);var t1=Date.now();
  var pr=id=='grok'?brain('grok','Pytanie: '+q+'\nOdpowiedzi mózgów:\n'+parts.join('\n')+'\nPołącz to w jedną najlepszą, krótką odpowiedź.'):brain(id,q);
  return pr.then(function(a){if(my!=runId)return;parts.push(b[1]+': '+a);d.innerHTML='<b>'+b[1]+'</b> <small>('+((Date.now()-t1)/1000).toFixed(1)+' s)</small>: '+esc(a)})})},Promise.resolve())
  .then(function(){if(my==runId){var d=document.createElement('small');d.textContent='Gotowe w '+((Date.now()-t0)/1000).toFixed(1)+' s';out.appendChild(d)}return parts})}
$('brGo').onclick=function(){var q=$('brQ').value.trim();if(q)sevenBrains(q,$('brOut'),$('brFast').checked)};$('brStop').onclick=function(){runId++};
$('brQ').onkeydown=function(e){if(e.key=='Enter')$('brGo').onclick()};
/* ---- 777 agents: deterministic, generated lazily ---- */
var AP=['Neon','Bass','Wawel','Smok','Trap','Lofi','Drill','Vinyl','Scratch','Echo','Pulse','Groove','Kick','Snare','Hat','Synth','Laser','Beat','Flow','Rymo','Kod','Pixel','Turbo','Nova'],
 AR=[['mix','miksowanie i przejścia','music'],['beat','układanie bitów','music'],['rap','teksty i rymy','music'],['kod','naprawa kodu aplikacji','code'],['build','budowanie stron i APK','code'],['plan','planowanie setu','logic'],['analiza','analiza i logika','logic'],['fx','efekty i wizualizacje','visual'],['milkdrop','presety MilkDrop','visual'],['research','wyszukiwanie w sieci','web'],['pamięć','pamięć i notatki','memory'],['koordynacja','koordynacja zespołu','grok']];
function agent(i){var r=AR[i%AR.length];return{i:i,name:AP[(i*7)%AP.length]+' '+AP[(i*13+5)%AP.length]+' #'+(i+1),role:r[1],tag:r[0],brain:r[2]}}
var AG={n:777,cur:null};$('agN').textContent='777 agentów';
function agSearch(){var q=$('agQ').value.toLowerCase().trim(),L=$('agList'),res=[];for(var i=0;i<AG.n&&res.length<60;i++){var a=agent(i);if(!q||(a.name+' '+a.role+' '+a.tag+' '+a.brain).toLowerCase().indexOf(q)>=0)res.push(a)}
 L.innerHTML='';res.forEach(function(a){var b=document.createElement('button');b.className='b';b.textContent=a.name+' · '+a.tag;b.onclick=function(){AG.cur=a;$('agCur').textContent=a.name+' ('+a.role+', mózg: '+a.brain+')'};L.appendChild(b)});$('agN').textContent=res.length+' z 777 pokazanych'}
var agT;$('agQ').oninput=function(){clearTimeout(agT);agT=setTimeout(agSearch,150)};
$('agGo').onclick=function(){var a=AG.cur||agent(0),q=$('agAsk').value.trim();if(!q)return;AG.cur=a;$('agOut').textContent='⏳ '+a.name+' pyta mózg '+a.brain+'…';
 brain(a.brain,q,a.name+' (agent: '+a.role+')').then(function(x){$('agOut').textContent=a.name+': '+x+'  [mózg: '+a.brain+' · wspólne darmowe AI]'})};
/* ---- DJ actions (bots can drive the HIPHOP X engine) ---- */
function click(id){var e=$(id);if(e)e.click()}
function djAct(t){t=t.toLowerCase();var did=[];
 var st=t.match(/\b(trap|drill|lofi|lo-fi|boom-?bap)\b/);if(st){$('style').value=st[1].replace('lo-fi','lofi').replace('-','');$('style').onchange({target:$('style')});did.push('styl '+st[1])}
 var bpm=t.match(/(\d{2,3})\s*bpm/);if(bpm){$('bpm').value=Math.max(70,Math.min(100,+bpm[1]));$('bpm').oninput();did.push('BPM '+$('bpm').value)}
 if(/(odpal|graj|play|start|włącz|wlacz).*(beat|bit)|\bbeat\b/.test(t)&&$('play').textContent.indexOf('Play')>=0){click('play');did.push('beat ▶')}
 if(/\bstop\b|zatrzymaj/.test(t)&&$('play').textContent.indexOf('Stop')>=0){click('play');did.push('beat ⏸')}
 [['airhorn','📯'],['scratch','Scratch ⇢'],['riser','Riser'],['808','808 drop'],['clap','Clap'],['tape stop','Tape stop']].forEach(function(f){if(t.indexOf(f[0])>=0){[].some.call(document.querySelectorAll('#pad button'),function(b){if(b.textContent.indexOf(f[1])==0){b.click();return true}});did.push('FX '+f[0])}});
 if(/wizualiz|milkdrop|visual/.test(t)){window.HXTabs&&HXTabs.show('milk');setTimeout(function(){MK.start()},300);did.push('MilkDrop')}
 return did}
/* ---- Bot Builder ---- */
BRAINS.forEach(function(b){var o=document.createElement('option');o.value=b[0];o.textContent=b[1];$('bbBrain').appendChild(o)});$('bbBrain').value='music';
function bots(){return lsj('sbdj.bots',[])}
function paint(){var B=bots();$('bbList').textContent=B.length?B.map(function(b){return b.name}).join(' · '):'(brak — zbuduj pierwszego)';var w=$('bbWho'),v=w.value;w.innerHTML='';
 [{name:'SuperGrok 🐲',role:'koordynator',brain:'grok',dj:true}].concat(B).forEach(function(b,i){var o=document.createElement('option');o.value=i;o.textContent=b.name;w.appendChild(o)});if(v)w.value=v}
function who(){return [{name:'SuperGrok 🐲',role:'koordynator',brain:'grok',dj:true,persona:'pewny siebie smok'}].concat(bots())[+$('bbWho').value||0]}
function blog(cls,t){var d=document.createElement('div');d.className='m '+cls;d.style.margin='4px 0';d.textContent=t;$('bbLog').appendChild(d);$('bbLog').scrollTop=1e9;return d}
$('bbGen').onclick=function(){var d=$('bbDesc').value.trim();if(!d)return;$('bbSt').textContent='⏳ projektuję bota…';
 ai('Projektujesz bota. Zwróć TYLKO JSON {"name":"...","role":"...","persona":"...","brain":"logic|music|code|web|visual|memory|grok"} po polsku.',d).then(function(a){var j=JSON.parse(a.slice(a.indexOf('{'),a.lastIndexOf('}')+1));return j}).catch(function(){var w=d.split(/\s+/);return{name:'Bot '+(w[0]||'D7').replace(/\W/g,'').slice(0,12),role:d.slice(0,80),persona:'luźny, techno',brain:/rap|beat|dj|mix|trap|muz/i.test(d)?'music':/kod|app|stron/i.test(d)?'code':/wizual|fx|milk/i.test(d)?'visual':'logic'}})
 .then(function(j){$('bbName').value=j.name||'';$('bbRole').value=j.role||'';$('bbPersona').value=j.persona||'';if(j.brain&&BRAINS.some(function(b){return b[0]==j.brain}))$('bbBrain').value=j.brain;$('bbSt').textContent='✔ Gotowy projekt — popraw i zapisz.'})};
$('bbSave').onclick=function(){var b={name:$('bbName').value.trim(),role:$('bbRole').value.trim(),persona:$('bbPersona').value.trim(),brain:$('bbBrain').value,dj:$('bbDj').checked,at:Date.now()};if(!b.name){$('bbSt').textContent='Podaj nazwę.';return}
 var B=bots().filter(function(x){return x.name!=b.name});B.push(b);lss('sbdj.bots',B);var F=FACTS();F.push('Bot '+b.name+' ('+b.role+', mózg '+b.brain+')');lss('sbdj.facts',F.slice(-200));paint();$('bbWho').value=B.length;
 $('bbSt').textContent='💾 Zapisano lokalnie'+(TEST?' (test: bez zapisu na serwer)':'')+'.';
 if(!TEST&&/^https?:/.test(location.protocol))fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q:'zapamiętaj: bot '+b.name+' — '+b.role+' (persona: '+b.persona+', mózg: '+b.brain+', DJ: '+(b.dj?'tak':'nie')+')',bot:'botpamiec'})}).then(function(r){if(r.ok)$('bbSt').textContent+=' + pamięć wspólna ✔'}).catch(function(){});
 blog('b',b.name+': Gotowy! Jestem '+b.role+'.'+(b.dj?' Powiedz „odpal beat”, „airhorn” albo „wizualizacje”.':''))};
$('bbSend').onclick=function(){var q=$('bbQ').value.trim();if(!q)return;$('bbQ').value='';var b=who();blog('u','Ty: '+q);var acts=b.dj?djAct(q):[];var d=blog('b',b.name+': '+(acts.length?'🎛 '+acts.join(', ')+' · ':'')+'⏳');
 brain(b.brain,q,b.name+' ('+b.role+(b.persona?'; styl: '+b.persona:'')+')').then(function(a){d.textContent=b.name+': '+(acts.length?'🎛 '+acts.join(', ')+' · ':'')+a})};
$('bbQ').onkeydown=function(e){if(e.key=='Enter')$('bbSend').onclick()};paint();
/* ---- MilkDrop (butterchurn, lazy, local libs, beat-synced to app audio or mic, pauses when hidden) ---- */
function load(src){return new Promise(function(ok,no){if(document.querySelector('script[src="'+src+'"]'))return ok();var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=function(){no(new Error(src))};document.head.appendChild(s)})}
var MK={v:null,keys:[],pi:0,raf:0,last:0,on:false,
 libs:function(){return load('libs/butterchurn.min.js').then(function(){return load('libs/butterchurnPresets.min.js')}).then(function(){return load('libs/butterchurnPresetsExtra.min.js').catch(function(){})})},
 start:function(useMic){var self=this;$('mkName').textContent='⏳ ładuję MilkDrop…';return self.libs().then(function(){var A=window.HIPHOPX&&HIPHOPX.audio();if(!A)throw new Error('audio');var ctx=A.ctx;ctx.resume&&ctx.resume();
  if(!self.v){var cv=$('mkCv'),bc=window.butterchurn.default||window.butterchurn;var dp=Math.min(devicePixelRatio||1,2);var RC=window.D7Res?D7Res.fit(Math.round(cv.clientWidth*dp)||1280,Math.round(cv.clientHeight*dp)||720):[Math.min(1920,Math.round(cv.clientWidth*dp))||1280,Math.min(1080,Math.round(cv.clientHeight*dp))||720];cv.width=RC[0];cv.height=RC[1];
   self.v=bc.createVisualizer(ctx,cv,{width:cv.width,height:cv.height,pixelRatio:1});var P={},pp=window.butterchurnPresets;pp=pp&&(pp.getPresets?pp:pp.default);Object.assign(P,pp.getPresets());var px=window.butterchurnPresetsExtra;px=px&&(px.getPresets?px:px.default);if(px)Object.assign(P,px.getPresets());
   self.P=P;self.keys=Object.keys(P);self.pi=Math.floor(Math.random()*self.keys.length);self.next(0);self.v.connectAudio(A.node)}
  if(useMic&&navigator.mediaDevices)navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){self.v.connectAudio(ctx.createMediaStreamSource(s));$('mkName').textContent+=' · 🎤'}).catch(function(){$('mkName').textContent+=' · brak mikrofonu'});
  self.on=true;self.loop()}).catch(function(e){$('mkName').textContent='⚠️ MilkDrop: '+e.message})},
 next:function(blend){if(!this.v)return;this.pi=(this.pi+1)%this.keys.length;this.v.loadPreset(this.P[this.keys[this.pi]],blend==null?2:blend);$('mkName').textContent=this.keys[this.pi].slice(0,60);this.last=Date.now()},
 loop:function(){var self=this;cancelAnimationFrame(self.raf);(function f(){if(!self.on)return;var s=document.getElementById('t-milk');if(document.hidden||!s.classList.contains('on')){self.raf=0;return}
  self.v.render();if($('mkAuto').checked&&Date.now()-self.last>15000)self.next(2.5);self.raf=requestAnimationFrame(f)})()}};
window.SBMilk=MK;$('mkStart').onclick=function(){MK.start(false)};$('mkMic').onclick=function(){MK.start(true)};$('mkNext').onclick=function(){MK.next()};
var rzT;window.addEventListener('resize',function(){clearTimeout(rzT);rzT=setTimeout(function(){if(MK.v){var c=$('mkCv'),dp=Math.min(devicePixelRatio||1,2),w=Math.min(1920,Math.round(c.clientWidth*dp)),h=Math.min(1080,Math.round(c.clientHeight*dp));if(w&&h){c.width=w;c.height=h;MK.v.setRendererSize(w,h)}}},200)});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&MK.on)MK.loop()});
/* ---- 🐲 Super Bot G 777 Agent: main coordinator on the home tab ---- */
(function(){var bb=$('t-bb'),c=document.createElement('div');c.className='card';c.style.cssText='border:2px solid #ffcc00;background:linear-gradient(135deg,#3a0a28cc,#1c0a3acc)';
 c.innerHTML='<div class="row"><b style="font-size:18px;color:#ffcc00">🐲 Super Bot G 777 Agent</b><small>koordynator: 7 mózgów · 777 agentów · budowanie botów · akcje DJ</small></div>'+
 '<div class="row"><button class="b" data-go="dxf">💎 DXF</button><button class="b" data-go="milk">🌌 MilkDrop</button><button class="b" data-go="hiphop">🎤 Beat</button><button class="b" data-go="dl">⬇ Pobierz APK</button><button class="b" data-go="pay">💖 Wsparcie</button></div>'+
 '<div id="sgLog" style="max-height:30vh;overflow:auto;background:#0008;border-radius:8px;padding:6px"><div class="m b">Super Bot G: Siema! Napisz np. „zbuduj bota: raper drill 95 BPM”, „agent milkdrop: daj preset na drop”, „7 mózgów: jak zrobić przejście 90→95 BPM”, „odpal trap beat i airhorn”.</div></div>'+
 '<div class="row"><input id="sgQ" style="flex:1" placeholder="Polecenie dla Super Bot G 777…"><button class="b" id="sgGo">🐲 Wyślij</button></div>';
 bb.insertBefore(c,bb.children[1]||null);
 c.addEventListener('click',function(e){var g=e.target.dataset&&e.target.dataset.go;if(g&&window.HXTabs)HXTabs.show(g)});
 function log(cls,t){var d=document.createElement('div');d.className='m '+cls;d.textContent=t;$('sgLog').appendChild(d);$('sgLog').scrollTop=1e9;return d}
 function route(q){var t=q.toLowerCase(),d=log('b','Super Bot G: ⏳');
  var m=q.match(/^(zbuduj|stwórz|stworz|utwórz|nowy)\s+bota[:\s]*(.*)$/i);
  if(m){$('bbDesc').value=m[2]||q;$('bbGen').click();var w=setInterval(function(){if(/Gotowy/.test($('bbSt').textContent)){clearInterval(w);$('bbSave').click();d.textContent='Super Bot G: 🛠 zbudowałem i zapisałem bota „'+$('bbName').value+'” ('+$('bbRole').value+', mózg: '+$('bbBrain').value+'). Możesz z nim gadać niżej w Bot Builderze.'}},300);setTimeout(function(){clearInterval(w)},60000);return}
  m=q.match(/^agent\s+([^:]+):\s*(.+)$/i);
  if(m){var k=m[1].toLowerCase().trim(),a=null;for(var i=0;i<777&&!a;i++){var x=agent(i);if((x.name+' '+x.tag+' '+x.role).toLowerCase().indexOf(k)>=0||String(i+1)==k.replace('#',''))a=x}a=a||agent(0);
   d.textContent='Super Bot G → '+a.name+' ('+a.role+', mózg '+a.brain+'): ⏳';brain(a.brain,m[2],a.name+' (agent: '+a.role+')').then(function(r){d.textContent='Super Bot G → '+a.name+': '+r});return}
  m=q.match(/^(7|siedem)\s*mózg\w*[:\s]*(.+)$/i);
  if(m){var out=document.createElement('div');d.textContent='Super Bot G: pytam 7 mózgów po kolei (wyniki w zakładce 🧠 7 Mózgów)…';sevenBrains(m[2],$('brOut'),false).then(function(parts){d.textContent='Super Bot G (7 mózgów): '+(parts[parts.length-1]||'').replace(/^[^:]*:\s*/,'')});return}
  var acts=djAct(q);brain('grok',acts.length?q+'\n(Aplikacja JUŻ wykonała akcje DJ: '+acts.join(', ')+'. Potwierdź krótko i dodaj 1 wskazówkę; nie pisz, że nie możesz odtwarzać dźwięku.)':q,'Super Bot G 777 Agent (główny koordynator 777 agentów i 7 mózgów)').then(function(r){d.textContent='Super Bot G: '+(acts.length?'🎛 '+acts.join(', ')+' · ':'')+r})}
 $('sgGo').onclick=function(){var q=$('sgQ').value.trim();if(!q)return;$('sgQ').value='';log('u','Ty: '+q);route(q)};$('sgQ').onkeydown=function(e){if(e.key=='Enter')$('sgGo').onclick()};
 window.SuperBotG=route})();
window.SBDJ={ai:ai,brain:brain,sevenBrains:sevenBrains,agent:agent,djAct:djAct,onTab:function(id){if(id=='milk'&&MK.on)MK.loop();if(id=='agents'&&!$('agList').firstChild)agSearch()}};
})();
