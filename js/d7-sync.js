/* D7 Mobile Sync — favourites/settings/chat history per device.
   Server mode: GET/POST /api/sync (needs sync_store.py hook in serve.py — active after next serve.py restart).
   Until then: client mode — local snapshot + "kod synchronizacji" export/import between devices. */
(function(){
  if(window.D7Sync)return;
  var KEYS=['d7dock-fav','d7dock-vol','d7dock-last','d7v51.bots','d7-lang','d7one.settings','d7one.chat','d7v51.chat'];
  function g(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return localStorage.getItem(k)}}
  function s(k,v){try{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))}catch(e){}}
  var id=localStorage.getItem('d7sync.device');if(!id){id='dev-'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);localStorage.setItem('d7sync.device',id)}
  function snap(){var o={};KEYS.forEach(function(k){var v=g(k);if(v!=null)o[k]=v});return{device:id,at:new Date().toISOString(),data:o}}
  function mergeFav(a,b){var seen={},out=[];(a||[]).concat(b||[]).forEach(function(f){var k=f&&(f.stationuuid||f.url);if(k&&!seen[k]){seen[k]=1;out.push(f)}});return out}
  function apply(remote){if(!remote||!remote.data)return 0;var n=0;Object.keys(remote.data).forEach(function(k){if(KEYS.indexOf(k)<0)return;var v=remote.data[k];
    if(k==='d7dock-fav'){v=mergeFav(g(k),v)}else if(Array.isArray(v)&&Array.isArray(g(k))){var L=g(k),J=L.map(function(x){return JSON.stringify(x)});v=L.concat(v.filter(function(x){return J.indexOf(JSON.stringify(x))<0})).slice(-300)}
    else if(g(k)!=null)return; s(k,v);n++});return n}
  var base=(function(){var c=document.currentScript&&document.currentScript.src||'';return c?c.replace(/js\/d7-sync\.js.*$/,''):''})();
  var api=/^https?:/.test(location.protocol)?base+'api/sync':null, mode='client';
  function server(){if(!api)return Promise.resolve(false);
    return fetch(api+'?device='+encodeURIComponent(id),{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){mode='server';apply(j.state);
      return fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snap())}).then(function(){return true})}).catch(function(){mode='client';return false})}
  function exportCode(){return btoa(unescape(encodeURIComponent(JSON.stringify(snap()))))}
  function importCode(c){var o=JSON.parse(decodeURIComponent(escape(atob(String(c).trim()))));return apply(o)}
  s('d7sync.local',snap());
  window.D7Sync={device:id,keys:KEYS,snapshot:snap,apply:apply,sync:server,exportCode:exportCode,importCode:importCode,mode:function(){return mode}};
  server(); setInterval(server,120000);
  window.addEventListener('storage',function(e){if(KEYS.indexOf(e.key)>=0)s('d7sync.local',snap())});
})();
