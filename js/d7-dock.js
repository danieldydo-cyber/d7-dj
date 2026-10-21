/* D7 Dock v1 — 📻 Radio + 🌀 Wizualizacja (shared, all pages). window.D7Dock */
(function(){
if(window.D7Dock)return;
var LS_FAV='d7dock-fav',LS_VOL='d7dock-vol',LS_LAST='d7dock-last';
var MIRRORS=['https://de1.api.radio-browser.info','https://de2.api.radio-browser.info','https://fi1.api.radio-browser.info','https://nl1.api.radio-browser.info','https://at1.api.radio-browser.info'];
var FALLBACK=[
['RMF FM','https://rs6-krk2.rmfstream.pl/RMFFM48','PL','pop,polish'],['RMF Classic','https://rs201-krk.rmfstream.pl/RMFCLASSIC48','PL','classical,polish'],
['Radio 357','https://stream.radio357.pl/','PL','rock,polish'],['Radio Nowy Świat','https://stream.rcs.revma.com/ypqt40u0x1zuv','PL','polish,rock'],
['Polskie Radio Trójka','https://stream3.polskieradio.pl:8904/','PL','polish,rock'],['Polskie Radio Jedynka','https://stream3.polskieradio.pl:8900/','PL','polish'],
['Open FM Kali','https://stream.open.fm/158','PL','kali,hiphop,polish'],['Open FM Polski Rap','https://stream.open.fm/71','PL','hiphop,polish,kali'],
['Open FM Techno','https://stream.open.fm/108','PL','techno'],['Open FM Chillout','https://stream.open.fm/3','PL','chill'],
['Radio ZET','https://zt.cdn.eurozet.pl/zet-net.mp3','PL','pop,polish'],['Chillizet','https://ch.cdn.eurozet.pl/chi-net.mp3','PL','chill,polish'],
['SomaFM Groove Salad','https://ice1.somafm.com/groovesalad-128-mp3','US','chill,ambient'],['SomaFM Drone Zone','https://ice1.somafm.com/dronezone-128-mp3','US','ambient'],
['SomaFM Deep Space One','https://ice1.somafm.com/deepspaceone-128-mp3','US','ambient'],['SomaFM Beat Blender','https://ice1.somafm.com/beatblender-128-mp3','US','house,chill'],
['SomaFM DEF CON','https://ice1.somafm.com/defcon-128-mp3','US','techno,electronic'],['SomaFM Space Station','https://ice1.somafm.com/spacestation-128-mp3','US','ambient,electronic'],
['SomaFM The Trip','https://ice1.somafm.com/thetrip-128-mp3','US','trance,psytrance'],['SomaFM Fluid','https://ice1.somafm.com/fluid-128-mp3','US','chill,hiphop'],
['SomaFM Sonic Universe','https://ice1.somafm.com/sonicuniverse-128-mp3','US','jazz'],['SomaFM Underground 80s','https://ice1.somafm.com/u80s-128-mp3','US','rock,80s'],
['SomaFM Lush','https://ice1.somafm.com/lush-128-mp3','US','chill'],['SomaFM Secret Agent','https://ice1.somafm.com/secretagent-128-mp3','US','chill,jazz'],
['SomaFM Dub Step Beyond','https://ice1.somafm.com/dubstep-128-mp3','US','dnb,dubstep'],['SomaFM Metal Detector','https://ice1.somafm.com/metal-128-mp3','US','rock,metal'],
['Radio Paradise Main','https://stream.radioparadise.com/mp3-192','US','rock'],['Radio Paradise Mellow','https://stream.radioparadise.com/mellow-192','US','chill'],
['Radio Paradise Rock','https://stream.radioparadise.com/rock-192','US','rock'],['Jazz24','https://live.wostreaming.net/direct/ppm-jazz24mp3-ibc1','US','jazz'],
['FIP','https://icecast.radiofrance.fr/fip-hifi.aac','FR','jazz,eclectic'],['FIP Electro','https://icecast.radiofrance.fr/fipelectro-hifi.aac','FR','electronic,house'],
['Intergalactic FM','https://radio.intergalactic.fm/1','NL','techno,electronic']
].map(function(a){return{name:a[0],url:a[1],url_resolved:a[1],countrycode:a[2],tags:a[3],stationuuid:'fb-'+a[0],favicon:'',bitrate:128,fb:1}});
var GENRES=[['⭐ Ulubione','fav'],['🏆 Top','top'],['techno','techno'],['trance','trance'],['house','house'],['psytrance','psytrance'],['dnb','drum and bass'],['ambient','ambient'],['🇵🇱 polish','polish'],['rock','rock'],['jazz','jazz'],['chill','chillout'],['🎤 Kali','kali'],['📦 Wbudowane','builtin']];
var COUNTRIES=[['','🌍 Wszystkie'],['PL','🇵🇱 Polska'],['DE','🇩🇪 Niemcy'],['GB','🇬🇧 UK'],['US','🇺🇸 USA'],['NL','🇳🇱 Holandia'],['FR','🇫🇷 Francja'],['IT','🇮🇹 Włochy'],['ES','🇪🇸 Hiszpania'],['CH','🇨🇭 Szwajcaria'],['RU','Rosja'],['UA','🇺🇦 Ukraina'],['CZ','🇨🇿 Czechy'],['BR','🇧🇷 Brazylia']];
function $(s,r){return(r||document).querySelector(s)}
function el(t,a,h){var e=document.createElement(t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(h!=null)e.innerHTML=h;return e}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function lsGet(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var css=`
#d7k-dock{position:fixed;right:12px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:2147483000;display:flex;flex-direction:column;gap:10px;font-family:system-ui,sans-serif}
#d7k-dock button{min-width:150px;padding:14px 18px;font-size:18px;font-weight:700;border-radius:18px;border:2px solid rgba(255,255,255,.25);color:#fff;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.5);backdrop-filter:blur(6px)}
#d7k-dock .r{background:linear-gradient(135deg,#ff2d7a,#ff8a00)}#d7k-dock .v{background:linear-gradient(135deg,#6a00ff,#00d4ff)}
#d7k-dock.min button{min-width:0;padding:12px;font-size:22px}#d7k-dock.min button span{display:none}
#d7k-dock .t{min-width:0!important;padding:4px 8px!important;font-size:12px!important;align-self:flex-end;background:#222c}
#d7k-np{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom));z-index:2147483000;background:#111d;color:#fff;border-radius:14px;padding:6px 12px;font:600 13px system-ui;display:none;align-items:center;gap:8px;max-width:92vw;border:1px solid #ff2d7a88}
#d7k-np.on{display:flex}#d7k-np b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50vw}#d7k-np button{background:#ff2d7a;border:0;color:#fff;border-radius:8px;padding:4px 10px;font-size:15px}
#d7k-modal{position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#fff}
#d7k-modal.on{display:flex}
#d7k-modal .box{width:min(980px,96vw);height:min(92vh,900px);background:#0d0f1a;border:1px solid #333a;border-radius:20px;display:flex;flex-direction:column;overflow:hidden}
#d7k-modal header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(90deg,#ff2d7a33,#6a00ff33)}
#d7k-modal header h2{margin:0;font-size:22px;flex:1}
#d7k-modal .x{font-size:22px;background:#222;color:#fff;border:0;border-radius:12px;padding:6px 14px;cursor:pointer}
#d7k-modal .ctl{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px}
#d7k-modal input[type=search],#d7k-modal select{font-size:17px;padding:10px 12px;border-radius:12px;border:1px solid #444;background:#181b2b;color:#fff}
#d7k-modal input[type=search]{flex:1;min-width:180px}
#d7k-tags{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}
#d7k-tags button{font-size:15px;padding:8px 12px;border-radius:999px;border:1px solid #555;background:#1b1e30;color:#fff;cursor:pointer}
#d7k-tags button.on{background:#ff2d7a;border-color:#ff2d7a}
#d7k-list{flex:1;overflow:auto;padding:6px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;align-content:start}
.d7k-st{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;background:#161a2c;border:1px solid #2a2f48;cursor:pointer;min-height:64px}
.d7k-st:hover{border-color:#ff2d7a}.d7k-st.cur{background:#3a1030;border-color:#ff2d7a}
.d7k-st img,.d7k-st .ph{width:44px;height:44px;border-radius:10px;object-fit:cover;background:#2a2f48;flex:none;display:flex;align-items:center;justify-content:center;font-size:22px}
.d7k-st .n{flex:1;min-width:0}.d7k-st .n b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.d7k-st .n small{color:#9aa;font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.d7k-st .fv{background:none;border:0;font-size:24px;cursor:pointer;color:#fff}
#d7k-modal footer{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#11142a;flex-wrap:wrap}
#d7k-modal footer .pl{font-size:22px;padding:10px 20px;border-radius:14px;border:0;background:#ff2d7a;color:#fff;cursor:pointer}
#d7k-modal footer .vz{font-size:16px;padding:10px 14px;border-radius:14px;border:0;background:#6a00ff;color:#fff;cursor:pointer}
#d7k-modal footer input[type=range]{width:160px}
#d7k-nowp{flex:1;min-width:150px;font-size:15px}#d7k-info{color:#9aa;font-size:13px;padding:0 14px 6px}
#d7k-viz{position:fixed;inset:0;z-index:2147483200;background:#000;display:none;touch-action:manipulation}
#d7k-viz.on{display:block}#d7k-viz canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#d7k-vc{position:absolute;left:0;right:0;bottom:0;padding:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:8px;justify-content:center;background:linear-gradient(transparent,#000c);transition:opacity .4s;font-family:system-ui}
#d7k-vc.hide{opacity:0;pointer-events:none}
#d7k-vc button{font-size:16px;padding:10px 14px;border-radius:12px;border:1px solid #fff4;background:#ffffff1a;color:#fff;cursor:pointer}
#d7k-vc button.on{background:#00d4ff55;border-color:#00d4ff}
#d7k-vinfo{position:absolute;top:10px;left:12px;right:12px;color:#fff;font:600 14px system-ui;text-shadow:0 0 6px #000;transition:opacity .4s;pointer-events:none}
#d7k-vinfo.hide{opacity:0}
`;
var audio,actx,src,analyser,gain,corsOk=null,cur=null,favs=lsGet(LS_FAV,[]),stations=[],filter={tag:'top',cc:'',q:''},reqId=0;
var corsAudio=null,plainAudio=null;
function mkAudio(cors){var a=new Audio();if(cors)a.crossOrigin='anonymous';a.preload='none';a.volume=lsGet(LS_VOL,0.8);
  a.addEventListener('playing',function(){upd();if(cors)probeCors()});a.addEventListener('pause',upd);
  a.addEventListener('error',function(){if(a!==audio||!a.getAttribute('src'))return;
    if(cors&&cur){ // CORS blocked: play via a plain element (not routed via WebAudio, so it is audible); viz uses simulated beat
      corsOk=false;var v=a.volume;a.removeAttribute('src');a.load();plainAudio=plainAudio||mkAudio(false);audio=plainAudio;audio.volume=v;audio.src=cur.url_resolved||cur.url;audio.play().catch(function(){});info('CORS zablokowany — gram bez analizy (symulacja 120 BPM)');return}
    info('Błąd strumienia: '+(cur?cur.name:''));upd()});
  return a}
function ensureAudio(){if(!audio){corsAudio=mkAudio(true);audio=corsAudio}return audio}
function setupGraph(){
  try{
    if(!actx){var AC=window.AudioContext||window.webkitAudioContext;actx=new AC()}
    if(!src&&corsAudio){src=actx.createMediaElementSource(corsAudio);analyser=actx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.8;src.connect(analyser);analyser.connect(actx.destination)}
    if(actx.state==='suspended')actx.resume();
  }catch(e){analyser=null}
}
function probeCors(){ // after some time data should be non-zero if CORS allowed
  if(!analyser||audio!==corsAudio){corsOk=false;return}
  setTimeout(function(){var d=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(d);var s=0;for(var i=0;i<d.length;i++)s+=d[i];corsOk=s>0;if(!corsOk)info('Analiza audio niedostępna (CORS) — symulowany beat 120 BPM')},2500)}
function play(st){
  ensureAudio();cur=st;lsSet(LS_LAST,st);
  var u=st.url_resolved||st.url;if(!/^https:/i.test(u)){info('Pomijam stację bez HTTPS');return}
  if(audio!==corsAudio){audio.pause();audio.removeAttribute('src');var vv=audio.volume;audio=corsAudio;audio.volume=vv}
  setupGraph();audio.src=u;corsOk=null;
  audio.play().then(function(){info('▶ '+st.name)}).catch(function(e){info('Nie można odtworzyć: '+e.message)});
  try{if(!st.fb)fetch(MIRRORS[0]+'/json/url/'+st.stationuuid).catch(function(){})}catch(e){}
  upd();render();
}
function stop(){if(audio){audio.pause();audio.removeAttribute('src');audio.load()}upd()}
function playing(){return audio&&!audio.paused&&audio.src}
function upd(){
  var p=playing(),n=cur?cur.name:'—';
  var np=$('#d7k-np');if(np){np.classList.toggle('on',!!p);$('b',np).textContent='📻 '+n}
  var w=$('#d7k-nowp');if(w)w.innerHTML=p?'🔊 <b>'+esc(n)+'</b>':(cur?'⏸ '+esc(n):'Wybierz stację');
  var b=$('#d7k-modal .pl');if(b)b.textContent=p?'⏹ Stop':'▶ Play';
}
function info(t){var i=$('#d7k-info');if(i)i.textContent=t;var v=$('#d7k-vinfo');if(v&&t)vInfoMsg=t}
function isFav(st){return favs.some(function(f){return f.stationuuid===st.stationuuid})}
function toggleFav(st){if(isFav(st))favs=favs.filter(function(f){return f.stationuuid!==st.stationuuid});else favs.unshift({name:st.name,url:st.url,url_resolved:st.url_resolved,countrycode:st.countrycode,tags:st.tags,stationuuid:st.stationuuid,favicon:st.favicon,bitrate:st.bitrate,fb:st.fb});lsSet(LS_FAV,favs);render()}
function apiFetch(path){
  var i=0;return new Promise(function(res,rej){(function next(){if(i>=MIRRORS.length)return rej(new Error('all mirrors failed'));var m=MIRRORS[i++];var ctl=window.AbortController?new AbortController():null;var to=setTimeout(function(){ctl&&ctl.abort()},7000);
    fetch(m+path,ctl?{signal:ctl.signal}:{}).then(function(r){clearTimeout(to);if(!r.ok)throw 0;return r.json()}).then(res).catch(function(){clearTimeout(to);next()})})()})}
function load(){
  var my=++reqId,t=filter.tag;
  if(t==='fav'){stations=favs.slice();render();return}
  if(t==='builtin'){stations=FALLBACK.filter(function(s){return !filter.cc||s.countrycode===filter.cc});render();return}
  var p='/json/stations/search?limit=300&order=clickcount&reverse=true&hidebroken=true&is_https=true';
  if(t!=='top')p+='&tag='+encodeURIComponent(t);
  if(filter.cc)p+='&countrycode='+filter.cc;
  if(filter.q)p+='&name='+encodeURIComponent(filter.q);
  info('Ładuję stacje…');
  apiFetch(p).then(function(d){if(my!==reqId)return;
    var seen={};stations=d.filter(function(s){var u=s.url_resolved||s.url;if(!/^https:/i.test(u)||seen[u])return false;seen[u]=1;return true});
    if(t==='kali'&&stations.length<5)stations=stations.concat(FALLBACK.filter(function(s){return/kali/.test(s.tags)}));
    if(!stations.length)stations=fbFilter();
    info(stations.length+' stacji (radio-browser.info)');render()})
  .catch(function(){if(my!==reqId)return;stations=fbFilter();info('Offline / API niedostępne — lista wbudowana ('+stations.length+')');render()});
}
function fbFilter(){var t=filter.tag,q=filter.q.toLowerCase();return FALLBACK.filter(function(s){return(!filter.cc||s.countrycode===filter.cc)&&(t==='top'||s.tags.indexOf(t.split(' ')[0])>=0||(t==='chillout'&&/chill/.test(s.tags)))&&(!q||s.name.toLowerCase().indexOf(q)>=0)})}
function render(){
  var L=$('#d7k-list');if(!L)return;L.innerHTML='';
  var arr=stations;if(filter.q&&(filter.tag==='fav'||filter.tag==='builtin')){var q=filter.q.toLowerCase();arr=arr.filter(function(s){return s.name.toLowerCase().indexOf(q)>=0})}
  if(!arr.length){L.innerHTML='<div style="opacity:.6;padding:20px">Brak stacji'+(filter.tag==='fav'?' — dodaj ☆ ulubione':'')+'</div>';return}
  arr.forEach(function(st){
    var d=el('div',{class:'d7k-st'+(cur&&cur.stationuuid===st.stationuuid?' cur':'')});
    var ic=st.favicon&&/^https:/.test(st.favicon)?'<img loading="lazy" referrerpolicy="no-referrer" src="'+esc(st.favicon)+'" onerror="this.outerHTML=\'<div class=ph>📻</div>\'">':'<div class="ph">📻</div>';
    d.innerHTML=ic+'<div class="n"><b>'+esc(st.name.trim())+'</b><small>'+esc((st.countrycode||'')+' · '+(st.bitrate?st.bitrate+'kbps · ':'')+String(st.tags||'').split(',').slice(0,4).join(', '))+'</small></div><button class="fv" title="Ulubione">'+(isFav(st)?'⭐':'☆')+'</button>';
    d.onclick=function(e){if(e.target.classList.contains('fv')){e.stopPropagation();toggleFav(st);return}play(st)};
    L.appendChild(d)});
}
function buildModal(){
  var m=el('div',{id:'d7k-modal'});
  m.innerHTML='<div class="box"><header><h2>📻 Radio</h2><button class="x" data-a="close">✕</button></header>'+
  '<div class="ctl"><input type="search" id="d7k-q" placeholder="🔎 Szukaj stacji…"><select id="d7k-cc">'+COUNTRIES.map(function(c){return'<option value="'+c[0]+'">'+c[1]+'</option>'}).join('')+'</select></div>'+
  '<div id="d7k-tags">'+GENRES.map(function(g){return'<button data-t="'+g[1]+'"'+(g[1]==='top'?' class="on"':'')+'>'+g[0]+'</button>'}).join('')+'</div>'+
  '<div id="d7k-info"></div><div id="d7k-list"></div>'+
  '<footer><button class="pl">▶ Play</button><span id="d7k-nowp">Wybierz stację</span>🔉<input type="range" id="d7k-vol" min="0" max="1" step="0.01"><button class="vz">🌀 Wizualizacja</button></footer></div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){if(e.target===m||e.target.dataset.a==='close')m.classList.remove('on')});
  $('#d7k-tags',m).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;[].forEach.call(this.children,function(x){x.classList.remove('on')});b.classList.add('on');filter.tag=b.dataset.t;load()});
  var tm;$('#d7k-q',m).addEventListener('input',function(){filter.q=this.value.trim();clearTimeout(tm);tm=setTimeout(load,350)});
  $('#d7k-cc',m).onchange=function(){filter.cc=this.value;load()};
  var v=$('#d7k-vol',m);v.value=lsGet(LS_VOL,0.8);v.oninput=function(){ensureAudio();[corsAudio,plainAudio].forEach(function(a){if(a)a.volume=+v.value});lsSet(LS_VOL,+v.value)};
  $('.pl',m).onclick=function(){if(playing())stop();else if(cur)play(cur);else if(stations[0])play(stations[0])};
  $('.vz',m).onclick=function(){m.classList.remove('on');openViz()};
  document.addEventListener('keydown',function(e){if(e.key==='Escape')m.classList.remove('on')});
}
function openRadio(){var m=$('#d7k-modal');if(!m){buildModal();m=$('#d7k-modal');cur=cur||lsGet(LS_LAST,null);load()}m.classList.add('on');upd()}

/* ---------------- Visualizer ---------------- */
var V={on:false,mode:'milk',raf:0,cv:null,cv2:null,g:null,bc:null,presets:null,keys:[],pi:0,auto:true,autoT:0,hideT:0,t0:0,parts:[],stars:[],lastTap:0,beatE:0,hist:[]};
var MODES=[['milk','🌀 MilkDrop'],['bars','📊 Spektrum'],['radial','⭕ Radial'],['tunnel','🌌 Tunel'],['wave','〰 Neon fala'],['stars','✨ Gwiazdy']];
var vInfoMsg='';
function loadScript(u){return new Promise(function(r){var s=document.createElement('script');s.src=u;s.onload=s.onerror=function(){r()};document.head.appendChild(s)})}
function libBase(){var s=document.querySelector('script[src*="d7-dock.js"]');return s?s.src.replace(/js\/d7-dock\.js.*$/,''):''}
function ensureBC(){
  if(window.butterchurn&&window.butterchurnPresets)return Promise.resolve();
  if(window.D7BC)return window.D7BC.then(function(){});
  var b=libBase()+'libs/';return loadScript(b+'butterchurn.min.js').then(function(){return loadScript(b+'butterchurnPresets.min.js')}).then(function(){return loadScript(b+'butterchurnPresetsExtra.min.js')});
}
function allPresets(){var o={};function add(x){if(!x)return;var p=x.getPresets?x.getPresets():(x.default&&x.default.getPresets?x.default.getPresets():x);for(var k in p)o[k]=p[k]}add(window.butterchurnPresets);add(window.butterchurnPresetsExtra);return o}
function buildViz(){
  var w=el('div',{id:'d7k-viz'});
  w.innerHTML='<canvas id="d7k-cv"></canvas><canvas id="d7k-cv2"></canvas><div id="d7k-vinfo"></div><div id="d7k-vc">'+
  MODES.map(function(m){return'<button data-m="'+m[0]+'">'+m[1]+'</button>'}).join('')+
  '<button data-a="prev">⏮ Preset</button><button data-a="rnd">🎲</button><button data-a="next">Preset ⏭</button><button data-a="auto">🔁 Auto 20s</button><button data-a="radio">📻</button><button data-a="fs">⛶</button><button data-a="close">✕ Zamknij</button></div>';
  document.body.appendChild(w);
  V.cv=$('#d7k-cv');V.cv2=$('#d7k-cv2');V.g=V.cv2.getContext('2d');
  $('#d7k-vc').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;e.stopPropagation();
    if(b.dataset.m)setMode(b.dataset.m);var a=b.dataset.a;
    if(a==='next')preset(1);if(a==='prev')preset(-1);if(a==='rnd')preset(0);if(a==='auto'){V.auto=!V.auto;V.autoT=performance.now()}
    if(a==='fs')toggleFS();if(a==='close')closeViz();if(a==='radio'){closeViz();openRadio()}showCtl()});
  w.addEventListener('pointermove',showCtl);
  w.addEventListener('click',function(e){if(e.target.closest('#d7k-vc'))return;var n=Date.now();if(n-V.lastTap<350){toggleFS();V.lastTap=0}else V.lastTap=n;showCtl()});
  w.addEventListener('dblclick',function(e){e.preventDefault()});
  document.addEventListener('keydown',function(e){if(!V.on)return;
    if(e.key==='Escape'&&!fsEl())closeViz();
    if(e.key==='ArrowRight'||e.key==='n')preset(1);if(e.key==='ArrowLeft'||e.key==='p')preset(-1);if(e.key==='r')preset(0);if(e.key==='f')toggleFS();
    var i=+e.key;if(i>=1&&i<=MODES.length)setMode(MODES[i-1][0])});
  document.addEventListener('fullscreenchange',onFsChange);document.addEventListener('webkitfullscreenchange',onFsChange);
  addEventListener('resize',resize);
}
function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement}
function goFS(){var e=$('#d7k-viz');try{var p=(e.requestFullscreen||e.webkitRequestFullscreen||e.webkitEnterFullscreen).call(e);if(p&&p.catch)p.catch(function(){})}catch(_){}}
function exitFS(){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(_){}}
function toggleFS(){fsEl()?exitFS():goFS()}
var wasFs=false;function onFsChange(){if(fsEl())wasFs=true;else if(wasFs&&V.on){wasFs=false;/* Esc from fullscreen keeps viz open; second Esc closes */}resize()}
function showCtl(){$('#d7k-vc').classList.remove('hide');$('#d7k-vinfo').classList.remove('hide');clearTimeout(V.hideT);V.hideT=setTimeout(function(){$('#d7k-vc').classList.add('hide');$('#d7k-vinfo').classList.add('hide')},3000)}
function resize(){if(!V.cv)return;var dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;
  [V.cv,V.cv2].forEach(function(c){c.width=W*dpr;c.height=H*dpr});
  if(V.bc)try{V.bc.setRendererSize(W*dpr,H*dpr)}catch(e){}}
function setMode(m){V.mode=m;[].forEach.call(document.querySelectorAll('#d7k-vc [data-m]'),function(b){b.classList.toggle('on',b.dataset.m===m)});
  V.cv.style.display=m==='milk'?'block':'none';V.cv2.style.display=m==='milk'?'none':'block';
  if(m==='milk')initMilk();try{localStorage.setItem('d7dock-mode',m)}catch(e){}}
function initMilk(){
  if(V.bc||V.bcBusy)return;V.bcBusy=1;
  ensureBC().then(function(){V.bcBusy=0;var B=window.butterchurn&&(window.butterchurn.default||window.butterchurn);
    if(!B||!B.createVisualizer){vInfoMsg='MilkDrop niedostępny — tryb natywny';setMode('bars');return}
    ensureAudio();setupGraph();if(!actx){var AC=window.AudioContext||window.webkitAudioContext;actx=new AC()}
    var dpr=Math.min(devicePixelRatio||1,2);
    try{V.bc=B.createVisualizer(actx,V.cv,{width:innerWidth*dpr,height:innerHeight*dpr,pixelRatio:1})}catch(e){vInfoMsg='WebGL niedostępny';setMode('bars');return}
    if(src&&corsOk!==false)try{V.bc.connectAudio(src)}catch(e){}
    else{V.simOsc=simSource();try{V.bc.connectAudio(V.simOsc)}catch(e){}}
    V.presets=allPresets();V.keys=Object.keys(V.presets);preset(0)});
}
function simSource(){ // quiet synthetic kick+hat at 120 BPM routed only to visualizer (not speakers)
  var g=actx.createGain();g.gain.value=0;var o=actx.createOscillator();o.frequency.value=55;var og=actx.createGain();og.gain.value=0;o.connect(og);og.connect(g);o.start();
  var n=actx.createOscillator();n.type='sawtooth';n.frequency.value=3000;var ng=actx.createGain();ng.gain.value=0;n.connect(ng);ng.connect(g);n.start();
  var out=actx.createGain();og.connect(out);ng.connect(out);
  setInterval(function(){var t=actx.currentTime;og.gain.cancelScheduledValues(t);og.gain.setValueAtTime(1,t);og.gain.exponentialRampToValueAtTime(.01,t+.25);ng.gain.setValueAtTime(.3,t+.25);ng.gain.exponentialRampToValueAtTime(.01,t+.32)},500);
  return out;
}
function preset(dir){if(!V.bc||!V.keys.length)return;V.pi=dir===0?Math.floor(Math.random()*V.keys.length):(V.pi+dir+V.keys.length)%V.keys.length;
  try{V.bc.loadPreset(V.presets[V.keys[V.pi]],2.0)}catch(e){}V.autoT=performance.now();vInfoMsg='🌀 '+(V.pi+1)+'/'+V.keys.length+' · '+V.keys[V.pi]}
var fbuf=new Uint8Array(1024),tbuf=new Uint8Array(2048);
function audioData(t){ // returns {f,w,bass,beat}
  var real=analyser&&corsOk!==false&&playing();
  if(real){analyser.getByteFrequencyData(fbuf);analyser.getByteTimeDomainData(tbuf)}
  else{var ph=(t/500)%1,kick=Math.exp(-ph*7),hat=Math.exp(-((ph+.5)%1)*20)*.4;
    for(var i=0;i<1024;i++){var x=i/1024;fbuf[i]=Math.max(0,Math.min(255,(kick*230*Math.exp(-x*12)+hat*160*Math.exp(-Math.abs(x-.5)*6)+60*Math.exp(-x*3)*(.6+.4*Math.sin(t/300+i*.05)))*(.85+.15*Math.random())))}
    for(i=0;i<2048;i++)tbuf[i]=128+Math.round(90*kick*Math.sin(i/2048*Math.PI*2*3+t/90)+25*Math.sin(i*.09+t/40)*(.5+hat))}
  var b=0;for(i=0;i<16;i++)b+=fbuf[i];b/=16*255;
  V.hist.push(b);if(V.hist.length>43)V.hist.shift();var avg=V.hist.reduce(function(a,c){return a+c},0)/V.hist.length;
  var beat=b>avg*1.15&&b>.3&&t-V.lastBeat>250;if(beat)V.lastBeat=t;V.beatE=Math.max(V.beatE*.92,beat?1:0);
  return{f:fbuf,w:tbuf,bass:b,beat:beat,sim:!real};
}
V.lastBeat=0;
function frame(t){
  if(!V.on)return;V.raf=requestAnimationFrame(frame);
  if(V.auto&&V.mode==='milk'&&t-V.autoT>20000)preset(1);
  var vi=$('#d7k-vinfo');if(vi)vi.textContent=(cur&&playing()?'📻 '+cur.name+' · ':'')+(V.mode==='milk'?vInfoMsg:MODES.filter(function(m){return m[0]===V.mode})[0][1])+(V.auto&&V.mode==='milk'?' · auto 20s':'')+(corsOk===false||!playing()?' · beat sym. 120 BPM':'');
  if(V.mode==='milk'){if(V.bc)try{V.bc.render()}catch(e){}return}
  var g=V.g,W=V.cv2.width,H=V.cv2.height,a=audioData(t),f=a.f,hue=(t/40)%360;
  if(V.mode==='bars'){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,W,H);var n=96,bw=W/n;g.shadowBlur=20*(1+V.beatE);
    for(var i=0;i<n;i++){var v=f[Math.floor(Math.pow(i/n,1.6)*600)]/255,h=v*H*.85;var c='hsl('+((hue+i*3)%360)+',100%,'+(45+v*25)+'%)';g.fillStyle=c;g.shadowColor=c;g.fillRect(i*bw+1,H-h,bw-2,h);g.globalAlpha=.25;g.fillRect(i*bw+1,0,bw-2,h*.25);g.globalAlpha=1}
    g.shadowBlur=0}
  else if(V.mode==='radial'){g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,0,W,H);var cx=W/2,cy=H/2,R=Math.min(W,H)*(.18+.05*V.beatE),N=180;g.save();g.translate(cx,cy);g.rotate(t/4000);g.lineWidth=Math.max(2,W/500);g.shadowBlur=15;
    for(i=0;i<N;i++){v=f[Math.floor(i/N*400)]/255;var ang=i/N*Math.PI*2,l=R+v*Math.min(W,H)*.32;c='hsl('+((hue+i*2)%360)+',100%,60%)';g.strokeStyle=c;g.shadowColor=c;g.beginPath();g.moveTo(Math.cos(ang)*R,Math.sin(ang)*R);g.lineTo(Math.cos(ang)*l,Math.sin(ang)*l);g.stroke()}
    g.beginPath();g.arc(0,0,R*(.9+a.bass*.3),0,7);g.fillStyle='hsla('+hue+',100%,50%,'+(.15+V.beatE*.4)+')';g.fill();g.restore();g.shadowBlur=0}
  else if(V.mode==='tunnel'){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,W,H);cx=W/2;cy=H/2;var sp=1+a.bass*6+V.beatE*8;
    if(V.parts.length<900)for(i=0;i<12;i++)V.parts.push({a:Math.random()*7,z:1,h:hue+Math.random()*60});
    g.globalCompositeOperation='lighter';
    V.parts=V.parts.filter(function(p){p.z+=.012*sp*p.z;p.a+=.004*sp;var r=p.z*Math.max(W,H)*.06;var x=cx+Math.cos(p.a)*r,y=cy+Math.sin(p.a)*r;var s=Math.min(8,p.z*.5)*(W/1000+.5);g.fillStyle='hsla('+p.h%360+',100%,60%,.8)';g.fillRect(x,y,s,s);return r<Math.max(W,H)});
    for(var k=0;k<8;k++){var rr=((t/8*sp/100+k*80)%640)/640;rr=Math.pow(rr,2)*Math.max(W,H);g.strokeStyle='hsla('+(hue+k*40)%360+',100%,55%,'+(.25+V.beatE*.4)+')';g.lineWidth=2;g.beginPath();g.arc(cx,cy,rr,0,7);g.stroke()}
    g.globalCompositeOperation='source-over'}
  else if(V.mode==='wave'){g.fillStyle='rgba(0,0,10,.25)';g.fillRect(0,0,W,H);var w=a.w;g.lineWidth=Math.max(3,W/300)*(1+V.beatE);
    for(var L=0;L<3;L++){c='hsl('+((hue+L*120)%360)+',100%,60%)';g.strokeStyle=c;g.shadowColor=c;g.shadowBlur=25;g.beginPath();
      for(i=0;i<w.length;i+=4){var x=i/w.length*W,y=H/2+(w[i]-128)/128*H*.38*(1-L*.25)+(L-1)*H*.08*Math.sin(t/700);i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
    g.shadowBlur=0}
  else if(V.mode==='stars'){g.fillStyle='rgba(0,0,0,'+(.35-V.beatE*.2)+')';g.fillRect(0,0,W,H);cx=W/2;cy=H/2;
    if(!V.stars.length)for(i=0;i<700;i++)V.stars.push({x:(Math.random()-.5)*2,y:(Math.random()-.5)*2,z:Math.random()});
    sp=.004+a.bass*.02+V.beatE*.04;
    V.stars.forEach(function(s){var pz=s.z;s.z-=sp;if(s.z<=.01){s.x=(Math.random()-.5)*2;s.y=(Math.random()-.5)*2;s.z=1;pz=1}
      var x1=cx+s.x/pz*W*.5,y1=cy+s.y/pz*H*.5,x2=cx+s.x/s.z*W*.5,y2=cy+s.y/s.z*H*.5;g.strokeStyle='hsla('+(hue+s.x*90)%360+',100%,'+(60+V.beatE*30)+'%,'+(1-s.z)+')';g.lineWidth=(1-s.z)*4+1;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()});
    if(V.beatE>.5){g.fillStyle='hsla('+hue+',100%,70%,'+V.beatE*.12+')';g.fillRect(0,0,W,H)}}
}
function openViz(mode){
  if(!$('#d7k-viz'))buildViz();ensureAudio();setupGraph();
  V.on=true;$('#d7k-viz').classList.add('on');resize();
  var m=mode||(function(){try{return localStorage.getItem('d7dock-mode')}catch(e){}})()||'milk';setMode(m);
  goFS();showCtl();cancelAnimationFrame(V.raf);V.raf=requestAnimationFrame(frame);
}
function closeViz(){V.on=false;cancelAnimationFrame(V.raf);if(fsEl())exitFS();var w=$('#d7k-viz');if(w)w.classList.remove('on')}

function init(){
  if($('#d7k-dock'))return;
  var st=el('style',{id:'d7k-css'});st.textContent=css;document.head.appendChild(st);
  var d=el('div',{id:'d7k-dock'});
  d.innerHTML='<button class="t" title="Zwiń/rozwiń">↕</button><button class="r" data-a="radio">📻<span> Radio</span></button><button class="v" data-a="viz">🌀<span> Wizualizacja</span></button>';
  if(lsGet('d7dock-min',innerWidth<600))d.classList.add('min');
  d.onclick=function(e){var b=e.target.closest('button');if(!b)return;if(b.classList.contains('t')){d.classList.toggle('min');lsSet('d7dock-min',d.classList.contains('min'))}else if(b.dataset.a==='radio')openRadio();else openViz()};
  document.body.appendChild(d);
  var np=el('div',{id:'d7k-np'},'<b></b><button data-a="o">📻</button><button data-a="s">⏹</button>');
  np.onclick=function(e){var a=e.target.dataset.a;if(a==='s')stop();if(a==='o')openRadio()};document.body.appendChild(np);
}
window.D7Dock={openRadio:openRadio,openViz:openViz,closeViz:closeViz,play:play,stop:stop,setMode:setMode,preset:preset,fallback:FALLBACK,modes:MODES.map(function(m){return m[0]}),state:function(){return{playing:!!playing(),station:cur&&cur.name,stations:stations.length,favs:favs.length,mode:V.mode,viz:V.on,presets:V.keys.length,cors:corsOk}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
