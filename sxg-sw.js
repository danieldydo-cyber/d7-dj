/* Super X G PWA service worker v70: network-first for pages (always fresh, offline fallback), cache-first for static assets.
   No skipWaiting/clients.claim → no reload loops; audio streams and APIs are never cached. */
var C='sxg-v71',CORE=['hiphopx.html','ios.html','manifest.json','js/d7-res.js','js/sbdj.js','js/d7-agents.js','js/hiphopx.js','js/d7-cosmos.js','js/d7-ctl.js','js/d7-ios.js','img/rekin.png','img/ios/icon-180.png','img/ios/icon-192.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){})}))}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x.indexOf('sxg-')==0&&x!=C}).map(function(x){return caches.delete(x)}))}))});
self.addEventListener('fetch',function(e){var r=e.request,u=new URL(r.url);if(r.method!='GET'||u.origin!=location.origin||/\/api\/|\.(mp3|wav|aac|apk)$/i.test(u.pathname)||r.headers.get('range'))return;
 if(r.mode=='navigate'||/\.html$/.test(u.pathname)){e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r,{ignoreSearch:true}).then(function(m){return m||caches.match('hiphopx.html')})}));return}
 e.respondWith(caches.match(r).then(function(m){var net=fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)})}return res});return m||net}))});
