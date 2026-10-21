/* v77 Super Core: Auto-Fix self-check + online sync across mirrors/builds.
   - checks key pages/assets, service worker, caches; deletes caches holding broken (non-200) entries; retries failed scripts once; offers a mirror if this host is down
   - compares local version.json with all mirrors → if newer: registration.update() + "Aktualizuj" pill. Nothing is sent anywhere except plain GET requests to own hosts. */
(function(){if(window.GXCore)return;var s=document.currentScript&&document.currentScript.src||'',root=s?s.replace(/js\/[^/]*$/,''):'';
var MIR=['https://danieldydo-cyber.github.io/super-x-g/','https://danieldydo-cyber.github.io/dj-dragon/'];
var KEY=['v77.html','hiphopx.html','gx/index.html','gx/brain.js','shop.html','js/gx-bg.js','js/dragon-sales-bot.js','version.json'];
var C=window.GXCore={log:[],state:'⏳',report:null};function L(m){C.log.push(m)}
var retried={};window.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='SCRIPT'&&t.src&&!retried[t.src]){retried[t.src]=1;L('↻ ponawiam '+t.src.split('/').pop());var n=document.createElement('script');n.src=t.src.split('?')[0]+'?fix='+Date.now();document.head.appendChild(n)}},true);
function head(u){var t0=performance.now();return fetch(u,{cache:'no-store'}).then(function(r){return {u:u,ok:r.ok,st:r.status,ms:Math.round(performance.now()-t0)}}).catch(function(){return {u:u,ok:false,st:0,ms:0}})}
async function cacheFix(){var fixed=0;if(!window.caches)return 0;try{var ks=await caches.keys();for(var k of ks){if(/webllm|transformers/.test(k))continue;var c=await caches.open(k),rq=await c.keys();for(var r of rq.slice(0,300)){var m=await c.match(r);if(m&&!m.ok&&m.type!=='opaque'){await c.delete(r);fixed++}}}}catch(e){}return fixed}
async function run(){var rep={at:new Date().toLocaleString('pl-PL'),local:null,remote:[],assets:[],sw:'brak',fixedCache:0,online:navigator.onLine};
 try{rep.local=await (await fetch(root+'version.json',{cache:'no-cache'})).json()}catch(e){rep.local=window.GXVersion||{version:'77'}}
 if(navigator.onLine){rep.assets=await Promise.all(KEY.map(function(k){return head(root+k)}));
  rep.remote=await Promise.all(MIR.map(function(m){return fetch(m+'version.json?'+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(v){return {m:m,ok:true,v:v.version}}).catch(function(){return {m:m,ok:false}})}))}
 if('serviceWorker' in navigator){try{var regs=await navigator.serviceWorker.getRegistrations();rep.sw=regs.length?regs.length+' aktywne':'brak';rep.regs=regs}catch(e){}}
 rep.fixedCache=await cacheFix();
 var bad=rep.assets.filter(function(a){return !a.ok}),newest=rep.remote.filter(function(r){return r.ok}).map(function(r){return +r.v||0}).reduce(function(a,b){return Math.max(a,b)},0);
 rep.update=newest>(+rep.local.version||0);if(rep.update&&rep.regs)rep.regs.forEach(function(r){try{r.update()}catch(e){}});
 var hereDown=bad.length>=KEY.length/2,alt=rep.remote.filter(function(r){return r.ok&&location.href.indexOf(r.m)!==0})[0];
 rep.mirror=hereDown&&alt?alt.m:null;
 C.state=!navigator.onLine?'📴 offline (cache)':bad.length?'🟠 '+bad.length+' problem(y)':rep.update?'🔄 aktualizacja v'+newest:'🟢 OK v'+rep.local.version;C.report=rep;pill();return rep}
function pill(){var p=document.getElementById('gxCore');if(!p){p=document.createElement('a');p.id='gxCore';p.href=root+'autofix.html';p.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 4px);left:170px;z-index:2147483003;background:#0009;color:#9ef;padding:2px 8px;border-radius:999px;font:700 11px system-ui;text-decoration:none';document.body.appendChild(p)}
 p.textContent='🛠 Super Core Auto-Fix: '+C.state;var r=C.report;if(r&&r.update){p.onclick=function(e){e.preventDefault();location.reload()}}if(r&&r.mirror){p.href=r.mirror+location.pathname.replace(/^\/[^/]+\//,'');p.textContent+=' → mirror'}}
C.run=run;function go(){pill();setTimeout(run,2500)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
