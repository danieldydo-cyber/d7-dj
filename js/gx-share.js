/* Ghost X G share bar + mirrors (manual sharing only – nothing is posted or sent automatically).
   <div id="gxShare" data-url="shop.html"></div>, <div id="gxMirrors"></div>. Incoming ?ref= is stored (gx_ref) for the shop WhatsApp confirmation;
   optional own referral nick (gx_myref) is appended to shared links (?ref=NAME). */
(function(){
var MIRRORS=['https://danieldydo-cyber.github.io/super-x-g/','https://danieldydo-cyber.github.io/dj-dragon/'];window.GX_MIRRORS=MIRRORS;
var here=MIRRORS.filter(function(m){return location.href.indexOf(m)===0})[0]||MIRRORS[0];
var q=new URLSearchParams(location.search).get('ref');if(q)localStorage.setItem('gx_ref',q.replace(/[^\w.-]/g,'').slice(0,32));
var T={pl:'🐲 Ghost X G / DJ Dragon – darmowa aplikacja DJ z AI działającym bez internetu (DJ DaX, Kraków). Decki, 2000 CC, Remixlive, radio, MilkDrop 3D. 💎 Ghost Open SI 5 zł · 👑 Maxi Ghost SI.',en:'🐲 Ghost X G / DJ Dragon – free DJ app with an AI brain that works offline (DJ DaX, Kraków). Decks, 2000 loops, Remixlive, radio, MilkDrop 3D. 💎 Ghost Open SI $1 · 👑 Maxi Ghost SI.'};
function lang(){var l=(localStorage.getItem('gx_lang')||navigator.language||'pl').slice(0,2);return l==='pl'?'pl':'en'}
function link(el){var u=new URL(el.getAttribute('data-url')||'ghostxg.html',here).href,r=localStorage.getItem('gx_myref');if(r)u+=(u.indexOf('?')<0?'?':'&')+'ref='+encodeURIComponent(r);return u}
function btn(el,t,c,f){var b=document.createElement('button');b.type='button';b.className='gxs';b.textContent=t;b.style.cssText='background:'+c+';color:#fff;border:0;border-radius:10px;padding:8px 11px;margin:3px;font:700 13px system-ui;cursor:pointer';b.onclick=f;el.appendChild(b);return b}
function render(el){var L=lang(),txt=T[L],enc=encodeURIComponent,u=function(){return link(el)};el.innerHTML='';el.style.textAlign='center';el.style.margin='12px auto';el.style.maxWidth='560px';
 var h=document.createElement('div');h.style.cssText='font:700 15px system-ui;margin:6px';h.textContent=L==='pl'?'📣 Poleć znajomym (udostępniasz sam):':'📣 Share with friends (you choose):';el.appendChild(h);
 var msg=document.createElement('small');
 function op(x){window.open(x,'_blank','noopener')}
 function copy(){var t=txt+' '+u();(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){msg.textContent=' ✅ '+(L==='pl'?'Skopiowano':'Copied')},function(){prompt('Copy:',t)})}
 btn(el,'📲 '+(L==='pl'?'Udostępnij':'Share'),'#6b21ff',function(){if(navigator.share)navigator.share({title:'Ghost X G 🐲',text:txt,url:u()}).catch(function(){});else copy()});
 btn(el,'WhatsApp','#25d366',function(){op('https://wa.me/?text='+enc(txt+' '+u()))});
 btn(el,'Facebook','#1877f2',function(){op('https://www.facebook.com/sharer/sharer.php?u='+enc(u()))});
 btn(el,'X','#000',function(){op('https://x.com/intent/post?text='+enc(txt)+'&url='+enc(u()))});
 btn(el,'Telegram','#229ed9',function(){op('https://t.me/share/url?url='+enc(u())+'&text='+enc(txt))});
 btn(el,'🔗 '+(L==='pl'?'Kopiuj link':'Copy link'),'#444',copy);el.appendChild(msg);
 var r=document.createElement('input');r.placeholder=L==='pl'?'Twój nick polecający → link ?ref=NICK':'Your referral nick → link ?ref=NICK';r.value=localStorage.getItem('gx_myref')||'';r.style.cssText='display:block;margin:8px auto;padding:7px;border-radius:8px;border:1px solid #555;background:#111;color:#fff;width:240px';
 var sh=document.createElement('small');sh.style.cssText='display:block;opacity:.75;word-break:break-all';function upd(){sh.textContent=u()}r.oninput=function(){localStorage.setItem('gx_myref',r.value.replace(/[^\w.-]/g,'').slice(0,32));upd()};el.appendChild(r);el.appendChild(sh);upd()}
function mirrors(el){var p=el.getAttribute('data-path')||location.pathname.replace(/^\/[^/]+\//,'');el.innerHTML='<b>🪞 '+(lang()==='pl'?'Mirrory (jeśli link nie działa)':'Mirrors (if a link is down)')+':</b><br>';
 MIRRORS.forEach(function(m,i){var a=document.createElement('a');a.href=m+p;a.textContent=(i?'Mirror '+i:'Główny')+': '+m.replace('https://','')+p;a.style.cssText='display:block;color:#0ef;margin:3px 0;word-break:break-all';el.appendChild(a)});
 var g=document.createElement('a');g.href='https://github.com/danieldydo-cyber/super-x-g/releases';g.textContent='📦 APK: GitHub Releases';g.style.cssText='display:block;color:#ffd23f;margin:3px 0';el.appendChild(g);el.style.cssText+='max-width:560px;margin:12px auto;font:13px system-ui;text-align:center'}
window.GXShare={render:render,mirrors:mirrors,text:T,link:link};
function init(){document.querySelectorAll('#gxShare,.gxShare').forEach(render);document.querySelectorAll('#gxMirrors,.gxMirrors').forEach(mirrors)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();
