/* Ghost X G SW: app shell cache + caches CDN AI libraries so the offline brain works without internet. Model weights are cached by the libs themselves (Cache API). */
var C='gx-v77',CORE=['./','index.html','brain.js','unlock.js','manifest.json','icon-192.png','icon-512.png','../dj777si.html'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){})}))}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x.indexOf('gx-')==0&&x!=C}).map(function(x){return caches.delete(x)}))}))});
self.addEventListener('fetch',function(e){var r=e.request,u=new URL(r.url);if(r.method!='GET')return;
 var cdn=/(esm\.run|cdn\.jsdelivr\.net)$/.test(u.hostname);
 if(cdn){e.respondWith(caches.open('gx-lib').then(function(c){return c.match(r).then(function(m){return m||fetch(r).then(function(res){if(res.ok)c.put(r,res.clone());return res})})}));return}
 if(u.origin!=location.origin)return;
 e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r,{ignoreSearch:true}).then(function(m){return m||caches.match('index.html')})}))});
