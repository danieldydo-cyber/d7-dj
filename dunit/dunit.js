/* D Unit · Super SI — statusy: live z /api/status (+/api/bots) gdy dostępne, inaczej snapshot data.json. Bez zmyślonych liczników. */
(function(){'use strict';
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var key=function(n){return String(n).toLowerCase().replace(/[^a-z0-9]/g,'')};
var LAUNCH=[
 ['D7 DJ ONE','../app.html','Wszystko w jednej aplikacji: decki, radio, boty','A'],
 ['D7 DJ · decki PRO8','../index.html','Decki PRO8 + hero Visions (77 generatorów)','A'],
 ['Wizje · 77 generatorów','../visions.html','Kalejdoskop · Las · Kosmos · AI-losowanie · MilkDrop · fullscreen','A'],
 ['Radio online','../radio-gen.html','Radio + generator techno','A'],
 ['Kali Live','../kali-live.html','Kali radio + wizualizacja','A'],
 ['Mobile Bridge','../mobile/','Statusy same-origin, QR, Command Center','A'],
 ['Wesprzyj','../pay/','BLIK / przelew / QR — tylko info','A'],
 ['Pobierz APK / aplikacje','../download.html','Android APK, iPhone PWA, Mac/Win/Linux','A'],
 ['Super X DJ 60','../dx60/','Wersja web aplikacji Android','A'],
 ['Hub Bots × Brains','../hub/','Multi-brain czat i lista botów','A'],
 ['Boty','../bots.html','Czat z botami, bot builder','A'],
 ['Sklep','../sklep.html','Sklep DJ DaX','A'],
 ['Stabilna wersja (GitHub Pages)','https://danieldydo-cyber.github.io/d7-dj/','Statyczna kopia D7 DJ','X']
];
var L=$('#launcher');
L.innerHTML=LAUNCH.map(function(x,i){return '<a class="card" href="'+esc(x[1])+'" data-i="'+i+'"><b>'+esc(x[0])+'</b><span>'+esc(x[2])+'</span><i class="st">…</i></a>'}).join('');
/* prawdziwy test linków wewnętrznych (HEAD → GET fallback) */
LAUNCH.forEach(function(x,i){ if(x[3]!=='A')return; var el=L.querySelector('[data-i="'+i+'"] .st');
  fetch(x[1],{method:'HEAD',cache:'no-store'}).then(function(r){ if(r.status===405||r.status===501)return fetch(x[1],{cache:'no-store'}); return r}).then(function(r){el.textContent=r.ok?'OK '+r.status:'✗ '+r.status;el.className='st '+(r.ok?'ok':'bad')}).catch(function(){el.textContent='✗';el.className='st bad'}) });
L.querySelectorAll('[data-i]').forEach(function(a){var x=LAUNCH[+a.getAttribute('data-i')];if(x[3]==='X'){var s=a.querySelector('.st');s.textContent='zewn.';}});
var DATA=null,LIVE=null,ROLES={};
function jf(u,ms){return new Promise(function(ok,bad){var t=setTimeout(function(){bad(new Error('timeout'))},ms||6000);fetch(u,{cache:'no-store'}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(ok,bad)})}
function render(){
  var bots=DATA.bots,onl={};
  if(LIVE&&LIVE.online)LIVE.online.forEach(function(i){onl[key(i)]=1});
  var nOn=0;
  var html=bots.map(function(b){
    var on=!!(onl[key(b.id)]||onl[key(b.name)]),cls=on?'on':(b.static_status==='online'?'snap':''),badge=on?'ONLINE (live)':(b.static_status==='online'?'RAPORT':(b.static_status==='mentioned'?'WZMIANKA':(b.static_status==='api-roster'?'ROSTER':'BRAK RAPORTU')));
    if(on)nOn++;
    var role=b.role||(ROLES[key(b.id)]||'');
    var links=(b.links||[]).map(function(l){return '<a href="'+esc(l[1])+'">'+esc(l[0])+'</a>'}).join('');
    return '<div class="bot '+cls+'"><span class="badge">'+badge+'</span><h4>'+esc(b.name)+'</h4><div class="role">'+esc(role)+'</div>'+(b.summary?'<div class="sum">'+esc(b.summary)+(b.updated?' · '+esc(b.updated):'')+'</div>':'')+(links?'<div class="links">'+links+'</div>':'')+'</div>'}).join('');
  $('#bots').innerHTML=html;
  $('#botcount').textContent=bots.length+' botów w rejestrze'+(LIVE?' · '+nOn+' online wg /api/status':' · brak live /api — tylko snapshot');
  $('#hubdate').textContent=DATA.hubGenerated;
  $('#gen').textContent=DATA.generated;
  $('#brain').innerHTML=DATA.brain.slice().reverse().map(function(e){return '<li><b>'+esc(e.title)+'</b><span>'+esc(e.first)+'</span></li>'}).join('');
}
jf('data.json').then(function(d){DATA=d;render();return Promise.all([jf('../api/status').catch(function(){return null}),jf('../api/bots').catch(function(){return null})])}).then(function(r){
  var st=r[0],bt=r[1],lv=$('#live');
  if(bt&&bt.bots)bt.bots.forEach(function(b){ROLES[key(b.id)]=b.role||''});
  if(st&&st.ok){LIVE=st;lv.className='live ok';lv.textContent='LIVE · /api/status OK · online: '+(st.online||[]).length+' botów · backend: '+(st.backend||'?')+' · odpowiedź serwera: '+(st.time||'?');$('#mode').textContent='tryb: live + snapshot';}
  else{lv.className='live static';lv.textContent='STATYCZNY SNAPSHOT · brak /api (hosting statyczny lub serwer niedostępny) — statusy botów pochodzą z raportów z '+(DATA?DATA.hubGenerated:'?')+'. Funkcje wymagające /api (czat AI, sync) działają w trybie lokalnych odpowiedzi.';$('#mode').textContent='tryb: snapshot'}
  if(DATA)render();
}).catch(function(e){var lv=$('#live');lv.className='live static';lv.textContent='Błąd wczytania data.json: '+e.message});
})();
