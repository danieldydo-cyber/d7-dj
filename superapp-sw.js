// D7 Super G SW v3: precache shell, stale-while-revalidate for static, network-only for /api and APK
const C='d7-superapp-v4',A=['/','/superapp.html','/js/d7-token.js','/superapp.webmanifest','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('d7-superapp')&&x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/')||/\.(apk|zip|aab|ipa|gz)$/i.test(u.pathname)||u.pathname.startsWith('/downloads/'))return;
 e.respondWith(caches.open(C).then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok&&res.type==='basic')c.put(r,res.clone());return res}).catch(()=>hit||(r.mode==='navigate'&&!/\.[a-z0-9]{2,5}$/i.test(u.pathname.replace(/\.html$/,''))?c.match('/superapp.html'):Response.error()));
  return hit?(e.waitUntil(net),hit):net})))});
