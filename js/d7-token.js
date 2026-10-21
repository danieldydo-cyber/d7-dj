/* v71: static GitHub Pages has no /api server → answer locally (no 404 / JSON errors) */
(function(){if(!/github\.io$/.test(location.hostname)||window.__d7apiShim)return;window.__d7apiShim=1;var F=window.fetch;window.fetch=function(u,o){try{var a=new URL(typeof u=='string'?u:u.url,location.href);if(a.origin==location.origin&&/\/api\//.test(a.pathname))return Promise.resolve(new Response(JSON.stringify({ok:false,offline:true,static:true,bots:[],items:[],tracks:[],answer:''}),{status:200,headers:{'content-type':'application/json'}}))}catch(e){}return F.apply(this,arguments)}})();
/* D7 admin token shim: adds X-Admin-Token (localStorage d7.tok) to same-origin /api/ calls; degrades silently on 401. */
(function(){if(window.__d7tok)return;window.__d7tok=1;var F=window.fetch;if(!F)return;
window.fetch=function(u,o){try{var s=typeof u=='string'?u:(u&&u.url)||'';var a=new URL(s,location.href);
 if(a.origin==location.origin&&a.pathname.indexOf('/api/')==0){var t=localStorage.getItem('d7.tok');if(!t&&/^\/api\/(grok-bridge|owner-session|remote-queue|bot-learn)$/.test(a.pathname)&&(!o||!o.method||/^get$/i.test(o.method)))return Promise.resolve(new Response('{"ok":false,"locked":true,"inbox":[],"items":[],"queue":[]}',{status:200,headers:{'Content-Type':'application/json','X-D7-Locked':'1'}}));if(t){o=o||{};var h=new Headers(o.headers||(typeof u!='string'&&u.headers)||{});h.set('X-Admin-Token',t);o.headers=h}}}catch(e){}
 return F.call(this,u,o)}})();
/* D7 shared nav (one nav across all apps) */
(function(){function go(){if(document.getElementById('d7nav')||!document.body)return;
var L=[['/superapp.html','⚡ Super App'],['/app.html','🎛 App ONE'],['/index.html','🎚 DJ Pro Fly'],['/super.html','🚀 D7 SUPER'],['/pro-dj.html','💿 Pro DJ'],['/kali-live.html','📻 Kali Live'],['/d.html','🤖 Bot D'],['/public-chat.html','💬 Chat'],['/D7-SuperApp.apk','📱 APK']];
var n=document.createElement('div');n.id='d7nav';n.style.cssText='position:fixed;right:10px;bottom:10px;z-index:2147483000;font:13px system-ui,sans-serif';
var b=document.createElement('button');b.textContent='D7 ☰';b.title='Nawigacja D7';b.style.cssText='background:linear-gradient(90deg,#00f0ff,#ff2bd6);border:0;border-radius:18px;padding:8px 12px;font-weight:700;color:#000;cursor:pointer;box-shadow:0 0 12px #00f0ff88';
var m=document.createElement('div');m.style.cssText='display:none;position:absolute;right:0;bottom:42px;background:#0b0b14f2;border:1px solid #333;border-radius:10px;padding:6px;min-width:170px';
m.innerHTML=L.map(function(x){var on=location.pathname==x[0];return'<a href="'+x[0]+'" style="display:block;padding:6px 8px;border-radius:6px;text-decoration:none;color:'+(on?'#ff2bd6':'#00f0ff')+'">'+x[1]+'</a>'}).join('')+'<a href="#" id="d7navtok" style="display:block;padding:6px 8px;color:#aaa;text-decoration:none">🔑 Token: '+(localStorage.getItem('d7.tok')?'✅':'—')+'</a>';
b.onclick=function(){m.style.display=m.style.display=='none'?'block':'none'};n.appendChild(m);n.appendChild(b);document.body.appendChild(n);
document.getElementById('d7navtok').onclick=function(e){e.preventDefault();var t=prompt('Token admina D7 (wspólny dla wszystkich aplikacji):',localStorage.getItem('d7.tok')||'');if(t!==null){t.trim()?localStorage.setItem('d7.tok',t.trim()):localStorage.removeItem('d7.tok');this.textContent='🔑 Token: '+(t.trim()?'✅':'—')}}}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
/* v1063: (1) hidden-tab freeze guard: when the HIPHOP X host hides this iframe, requestAnimationFrame loops are parked (audio keeps playing) and resume on show.
   (2) ⛶ fullscreen button on every standalone page (Fullscreen API + webkit; APK WebChromeClient handles it; CSS fallback). */
(function(){if(window.__d7fs)return;window.__d7fs=1;var R=window.requestAnimationFrame,C=window.cancelAnimationFrame;
/* v1065 smooth-open pump (only inside the Super X G launcher iframe): rAF callbacks are queued and run by ONE real rAF pump that
   (a) waits for first paint + load + idle before starting render loops (WebGL/MilkDrop/avatars start after the page is visible),
   (b) caps frame rate (30 fps phone / 50 fps desktop) so visualizers never starve input, (c) parks everything while the host hides the frame. */
if(R&&window.parent!==window){var Q=[],ids=0,map={},hidden=false,warm=false,last=0,pending=false,FPS=/Android|iPhone|iPad/i.test(navigator.userAgent)?30:50;
 function pump(ts){pending=false;if(hidden||!warm||!Q.length)return;if(ts-last<1000/FPS-2){sched();return}last=ts;var q=Q;Q=[];for(var i=0;i<q.length;i++){var e=q[i];if(map[e.id]){delete map[e.id];try{e.cb(ts)}catch(x){setTimeout(function(){throw x})}}}if(Q.length)sched()}
 function sched(){if(!pending&&!hidden&&warm){pending=true;R.call(window,pump)}}
 window.requestAnimationFrame=function(cb){var id=++ids;map[id]=1;Q.push({id:id,cb:cb});sched();return id};
 window.cancelAnimationFrame=function(id){delete map[id]};
 function goWarm(){if(warm)return;warm=true;sched()}
 function afterLoad(){R.call(window,function(){R.call(window,function(){if(window.requestIdleCallback)requestIdleCallback(goWarm,{timeout:700});else setTimeout(goWarm,250)})})}
 if(document.readyState=='complete')afterLoad();else window.addEventListener('load',afterLoad);setTimeout(goWarm,4000);
 window.addEventListener('message',function(e){var d=e.data;if(!d||typeof d.hxVisible!='boolean')return;hidden=!d.hxVisible;if(!hidden)sched()});
 window.D7Pump={fps:function(n){if(n)FPS=n;return FPS},warm:function(){return warm}};window.addEventListener('message',function(e){if(e.data&&e.data.type=='d7:lowpower'&&e.source===parent)FPS=Math.min(FPS,24)})}
function go(){if(window.parent!==window||!document.body||document.getElementById('d7fsb'))return;var b=document.createElement('button');b.id='d7fsb';b.textContent='⛶';b.title='Pełny ekran';
 b.style.cssText='position:fixed;top:8px;right:8px;z-index:2147483001;background:#2a1060cc;color:#fff;border:1px solid #7b2cff;border-radius:8px;padding:4px 9px;font-size:16px;cursor:pointer';
 b.onclick=function(){var d=document,el=d.documentElement;if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return}var r=el.requestFullscreen||el.webkitRequestFullscreen;if(r){var p=r.call(el);if(p&&p.catch)p.catch(function(){})}};document.body.appendChild(b)}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
/* v1064: host overlay protocol. 'd7:auto' → window.D7Auto() if a page defines it, else press the page's main ▶/Play/Start/Auto button.
   'd7:stop' → pause media + suspend every AudioContext created by this page (tracked here). */
(function(){if(window.__d7auto)return;window.__d7auto=1;var ACS=window.__d7ACS=[];['AudioContext','webkitAudioContext'].forEach(function(n){var C=window[n];if(!C||C.__d7w)return;
 var W=function(){var c=new (Function.prototype.bind.apply(C,[null].concat([].slice.call(arguments))))();ACS.push(c);return c};W.prototype=C.prototype;W.__d7w=1;try{window[n]=W}catch(e){}});
function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!='hidden'}
function autoBtn(){var re=/(^\s*[▶⏵►]|\bplay\b|\bstart\b|graj|odtw[oó]rz|auto[- ]?mix|\bauto\b|w[lł][aą]cz radio|radio on)/i,no=/stop|pauza|pause|nagraj|rec\b|⏸|pe[lł]ny|fullscreen|ekran|1080p/i,c=[].filter.call(document.querySelectorAll('button,[role=button],a.b'),function(b){var t=(b.textContent||b.title||'').trim();return t.length<40&&re.test(t)&&!no.test(t)&&vis(b)&&!b.classList.contains('on')&&b.getAttribute('aria-pressed')!='true'&&!b.closest('a[href]:not([href^="#"])')});
 c.sort(function(a,b){var s=function(x){var t=x.textContent;return(/auto/i.test(t)?0:/play|▶|⏵/i.test(t)?1:2)};return s(a)-s(b)});if(c[0]){c[0].click();return c[0].textContent.trim()}return null}
window.D7AutoRun=function(){ACS.forEach(function(c){try{c.resume()}catch(e){}});if(typeof window.D7Auto=='function'){try{return window.D7Auto()||'D7Auto'}catch(e){}}return autoBtn()};
window.addEventListener('message',function(e){var d=e.data;if(!d||typeof d!='object')return;
 if(d.type=='d7:auto'){var r=window.D7AutoRun();try{e.source&&e.source.postMessage({type:'d7:auto:done',result:r||null},'*')}catch(x){}}
 if(d.type=='d7:stop'){[].forEach.call(document.querySelectorAll('audio,video'),function(m){try{m.pause()}catch(x){}});ACS.forEach(function(c){try{c.suspend()}catch(x){}})}})})();
/* v1065: fullscreen/resize propagation → every page's own canvas-resize code runs (no stretched/black frames after ⛶) */
(function(){if(window.__d7rz)return;window.__d7rz=1;var t;function kick(){clearTimeout(t);t=setTimeout(function(){try{window.dispatchEvent(new Event('resize'))}catch(e){}},120)}
['fullscreenchange','webkitfullscreenchange'].forEach(function(ev){document.addEventListener(ev,kick)});
window.addEventListener('message',function(e){if(e.data&&e.data.type=='d7:resize')kick()})})();
/* v66: shared resolution setting (auto/720/1080/1440/4k, localStorage d7res), beat bus from launcher radio, robust fullscreen with CSS fallback */
(function(){if(window.D7Res)return;var M={'720':[1280,720],'1080':[1920,1080],'1440':[2560,1440],'4k':[3840,2160]};
 function key(){var k='auto';try{k=localStorage.getItem('d7res')||'auto'}catch(e){}return M[k]||k=='auto'?k:'auto'}
 window.D7Res={key:key,cap:function(){var k=key();if(M[k])return M[k];var ph=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||Math.min(screen.width,screen.height)<700;return ph?M['720']:M['1080']},
  fit:function(w,h){var c=this.cap(),s=Math.min(1,c[0]/Math.max(w,h,1),c[1]/Math.max(Math.min(w,h),1));return[Math.max(2,Math.round(w*s)),Math.max(2,Math.round(h*s))]},
  set:function(k){try{localStorage.setItem('d7res',k)}catch(e){}window.dispatchEvent(new Event('d7res'));window.dispatchEvent(new Event('resize'));try{[].forEach.call(document.querySelectorAll('iframe'),function(f){f.contentWindow.postMessage({type:'d7:res',key:k},'*')})}catch(e){}}};
 window.D7Beat={level:0,beat:0,t:0};
 window.addEventListener('message',function(e){var d=e.data;if(!d||e.source!==window.parent)return;
  if(d.type=='d7:res'){window.dispatchEvent(new Event('d7res'));window.dispatchEvent(new Event('resize'))}
  if(d.type=='d7:beat'){D7Beat.level=d.level;D7Beat.t=Date.now();if(d.beat){D7Beat.beat++;document.documentElement.style.setProperty('--d7beat',String(d.level));try{window.dispatchEvent(new CustomEvent('d7beat',{detail:d}))}catch(x){}}}});
 var css=document.createElement('style');css.textContent='.d7fsfake{position:fixed!important;inset:0!important;z-index:2147483000!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;background:#000}';(document.head||document.documentElement).appendChild(css);
 window.D7FS={el:function(){return document.fullscreenElement||document.webkitFullscreenElement||document.querySelector('.d7fsfake')},
  on:function(el){el=el||document.documentElement;var r=el.requestFullscreen||el.webkitRequestFullscreen||el.webkitEnterFullscreen,fake=function(){el.classList.add('d7fsfake');window.dispatchEvent(new Event('resize'))};
   if(!r)return fake();try{var p=r.call(el,{navigationUI:'hide'});if(p&&p.catch)p.catch(fake)}catch(e){fake()}},
  off:function(){var f=document.querySelector('.d7fsfake');if(f){f.classList.remove('d7fsfake');window.dispatchEvent(new Event('resize'))}var x=document.exitFullscreen||document.webkitExitFullscreen;if(x&&(document.fullscreenElement||document.webkitFullscreenElement))try{var p=x.call(document);if(p&&p.catch)p.catch(function(){})}catch(e){}},
  toggle:function(el){if(this.el())this.off();else this.on(el)}};
})();
/* v71 Auto resolution: native screen × devicePixelRatio, capped by GPU limits, adaptive scale from measured FPS (target 60, floor 30) */
(function(){var R=window.D7Res;if(!R||R.__adapt)return;R.__adapt=1;var M={'720':[1280,720],'1080':[1920,1080],'1440':[2560,1440],'4k':[3840,2160]},S=1,fps=60,gmax=4096,lastCh=0,res=null;
 try{var c=document.createElement('canvas'),g=c.getContext('webgl');if(g){gmax=Math.min(g.getParameter(g.MAX_RENDERBUFFER_SIZE),g.getParameter(g.MAX_TEXTURE_SIZE),8192);var l=g.getExtension('WEBGL_lose_context');l&&l.loseContext()}}catch(e){}
 function native(){var d=Math.min(window.devicePixelRatio||1,3),w=Math.round(Math.max(innerWidth,1)*d),h=Math.round(Math.max(innerHeight,1)*d);var k=Math.min(1,gmax/Math.max(w,h),3840/Math.max(w,h,1)*(Math.max(w,h)>=Math.min(w,h)?1:1));return[Math.round(w*k),Math.round(h*k)]}
 R.cap=function(){var k=R.key();if(M[k])return M[k];var n=native(),a=Math.max(n[0],n[1]),b=Math.min(n[0],n[1]);return[Math.max(320,Math.round(a*S)),Math.max(180,Math.round(b*S))]};
 R.fit=function(w,h){var k=R.key();if(k=='auto'){var n=native(),sw=Math.max(2,Math.round(Math.min(w,n[0])*S)),sh=Math.max(2,Math.round(Math.min(h,n[1])*S));return[sw,sh]}var c=M[k],s=Math.min(1,c[0]/Math.max(w,h,1),c[1]/Math.max(Math.min(w,h),1));return[Math.max(2,Math.round(w*s)),Math.max(2,Math.round(h*s))]};
 R.stats=function(){return{key:R.key(),fps:Math.round(fps),scale:+S.toFixed(2),native:native(),gpuMax:gmax,cap:R.cap()}};
 var fr=0,t0=performance.now(),low=0,hi=0;function tick(t){requestAnimationFrame(tick);if(document.hidden){t0=t;fr=0;return}fr++;if(t-t0<2000)return;fps=fr*1000/(t-t0);fr=0;t0=t;if(R.key()!='auto')return;
  var o=S;if(fps<50){low++;hi=0;if(low>=1)S=Math.max(.35,S*(fps<30?.7:.85))}else if(fps>=57){hi++;low=0;if(hi>=2&&S<1)S=Math.min(1,S*1.12)}else{low=hi=0}
  if(Math.abs(o-S)>.01&&t-lastCh>3000){lastCh=t;window.__d7fpsLog=(window.__d7fpsLog||[]).concat([[Math.round(t/1000),Math.round(fps),+S.toFixed(2)]]).slice(-60);try{window.dispatchEvent(new Event('d7res'));window.dispatchEvent(new Event('resize'))}catch(e){}}else if(Math.abs(o-S)>.01)S=o}
 requestAnimationFrame(tick);
 ['fullscreenchange','webkitfullscreenchange','orientationchange'].forEach(function(e){document.addEventListener(e,function(){setTimeout(function(){window.dispatchEvent(new Event('d7res'))},200)})});})();

/* v66: launcher radio beat → every MilkDrop (butterchurn) in this window. A silent 55 Hz "beat carrier" in the page's own AudioContext is
   amplitude-modulated by d7:beat messages and fed into each visualizer (connectAudio), never to the speakers. */
(function(){if(window.parent===window||window.__d7bc)return;window.__d7bc=1;var vizs=[],bc;
 function wrap(m){if(!m||m.__d7w)return m;var root=m.default&&m.default.createVisualizer?m.default:m;if(!root.createVisualizer||root.__d7w)return m;var orig=root.createVisualizer.bind(root);
  root.createVisualizer=function(ctx){var v=orig.apply(null,arguments);try{(window.__d7bv=window.__d7bv||[]).push({v:v,c:arguments[1]})}catch(e){}try{var o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=55;g.gain.value=0;o.connect(g);o.start();v.connectAudio(g);vizs.push({ctx:ctx,g:g})}catch(e){}return v};root.__d7w=1;return m}
 try{bc=window.butterchurn;Object.defineProperty(window,'butterchurn',{configurable:true,enumerable:true,get:function(){return bc},set:function(v){bc=wrap(v)}});if(bc)wrap(bc)}catch(e){}
 window.addEventListener('d7beat',function(e){var d=e.detail||{};vizs.forEach(function(x){try{var t=x.ctx.currentTime;x.g.gain.cancelScheduledValues(t);x.g.gain.setValueAtTime(Math.min(1,(d.level||0)*1.4),t);x.g.gain.setTargetAtTime(0.05,t+0.04,0.12)}catch(z){}})});
})();

/* v69: universal controls (Play/AUTO/Stop all/bots/🦈/pure viz) */
(function(){if(window.__d7ctlL)return;window.__d7ctlL=1;var pn=location.pathname;if(!/\/(dxf|d)\//.test(pn)&&/(\/|\/index\.html|\/kali-live\.html|\/pro-dj\.html)$/.test(pn))return;/* original Special X v38 pages stay untouched */var s=document.currentScript&&document.currentScript.src||'',b=s?s.replace(/js\/d7-token\.js.*$/,''):'';var e=document.createElement('script');e.src=b+'js/d7-ctl.js?v=1071';e.async=true;(document.head||document.documentElement).appendChild(e)})();
