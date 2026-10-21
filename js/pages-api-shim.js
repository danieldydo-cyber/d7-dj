/* Static-host /api shim (GitHub Pages & mirrors have no backend → /api/* was 404).
   Answers /api/status, /api/bots, /api/brain locally; /api/brain uses GXBrain (Pollinations online → offline model → rules). Only active on *.github.io / file:. */
(function(){if(!/github\.io$/.test(location.hostname)&&location.protocol!=='file:'&&!window.GX_FORCE_SHIM)return;
var BOTS=window.GX_STATIC_BOTS=[
 {id:'dragon-sales',name:'🤖 Dragon Sprzedawca SI',role:'Pomoc w wyborze wersji i płatności (PL/EN/DE/ES/FR/UA)'},
 {id:'ghost',name:'🐲 Ghost X G',role:'Czat AI DJ DaX (offline/online)'},
 {id:'dj777',name:'🧠 DJ 777 SI',role:'Porady DJ, BPM, miks'},
 {id:'botd',name:'😈 Bot D „Daniel”',role:'Super-bot 7D'},
 {id:'djmix',name:'🎛 DJ Mix',role:'Setlisty i przejścia'},
 {id:'radiokali',name:'📻 Radio Kali',role:'Stacje radiowe i gatunki'},
 {id:'visualizer',name:'🌌 Visualizer',role:'MilkDrop, 3D, rekin'},
 {id:'autoboty',name:'🤖 Autoboty AI SI',role:'Opis imprezy, Playlista, Post FB, Plan dnia, Tekst rap'}];
var SYS={'dragon-sales':'Jesteś Dragon Sprzedawca SI. Ghost X G jest darmowy; Ghost Open SI 5 zł, Maxi Ghost SI 99 €/50 zł. Odpowiadaj krótko.',dj777:'Jesteś DJ 777 SI. Krótkie porady DJ po polsku.',djmix:'Jesteś DJ Mix – setlisty i przejścia, krótko po polsku.',radiokali:'Jesteś Radio Kali – polecasz stacje radiowe i gatunki, krótko.',visualizer:'Jesteś Visualizer – wizualizacje MilkDrop/3D, krótko.',botd:'Jesteś Bot D „Daniel” z 7D. Krótko po polsku.'};
function J(o,s){return new Response(JSON.stringify(o),{status:s||200,headers:{'Content-Type':'application/json'}})}
function brain(){if(window.GXBrain)return Promise.resolve(GXBrain);return new Promise(function(r){var s=document.createElement('script');s.src=(location.pathname.indexOf('/gx/')>=0?'':'gx/')+'brain.js';s.onload=function(){r(window.GXBrain)};s.onerror=function(){r(null)};document.head.appendChild(s)})}
var F=window.fetch.bind(window);
window.fetch=function(u,o){var url;try{url=new URL(typeof u==='string'?u:u.url,location.href)}catch(e){return F(u,o)}
 if(url.origin!==location.origin||url.pathname.indexOf('/api/')<0)return F(u,o);var p=url.pathname.slice(url.pathname.indexOf('/api/'));
 if(p==='/api/status')return Promise.resolve(J({ok:true,mode:'static-pages',online:BOTS.map(function(b){return b.id})}));
 if(p==='/api/bots')return Promise.resolve(J({bots:BOTS,mode:'static-pages'}));
 if(p==='/api/brain'){var b={};try{b=JSON.parse(o&&o.body||'{}')}catch(e){}var q=b.message||b.q||'';return brain().then(function(G){if(!G)return J({answer:'Tryb statyczny: brak mózgu.',source:'rules'});return G.ask(q,[],{system:SYS[b.bot]||undefined}).then(function(r){return J({answer:r.a,source:r.src,ms:r.ms,bot:b.bot})})})}
 return Promise.resolve(J({ok:false,error:'static host – no backend for '+p,mode:'static-pages'},200))};
})();
