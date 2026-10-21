/* v70 iOS / PWA: safe-area insets (Dynamic Island), standalone CSS fullscreen, audio unlock on first tap, SW registration (Pages/web only, top window, once). */
(function(){var D=document,H=D.documentElement,ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1),sa=window.navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
 if(ios)H.classList.add('d7ios');if(sa)H.classList.add('d7standalone');
 var s=D.createElement('style');s.textContent='html.d7ios body{padding-top:env(safe-area-inset-top);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);-webkit-text-size-adjust:100%}html.d7ios #d7ctl{left:calc(8px + env(safe-area-inset-left));bottom:calc(8px + env(safe-area-inset-bottom))}'+
 'html.d7ios #vz{padding-top:calc(18px + env(safe-area-inset-top));padding-bottom:calc(18px + env(safe-area-inset-bottom))}html.d7ios .d7fsfake,html.d7ios .d7purec{height:100dvh!important}html.d7standalone body{overscroll-behavior:none}';(D.head||H).appendChild(s);
 /* iOS has no element fullscreen on iPhone: D7FS falls back to CSS fullscreen (.d7fsfake); in standalone the app already has no browser UI */
 if(ios&&window.D7FS){var on=D7FS.on;D7FS.on=function(el){el=el||H;if(!(el.requestFullscreen||el.webkitRequestFullscreen)){el.classList.add('d7fsfake');dispatchEvent(new Event('resize'));return}return on.call(D7FS,el)}}
 /* audio unlock: first touch resumes every AudioContext and plays a silent buffer (WebKit autoplay rule) */
 function unlock(){var L=(window.__d7ACS||[]).slice();try{var a=window.HIPHOPX&&HIPHOPX.audio();if(a)L.push(a.ctx)}catch(e){}L.forEach(function(c){try{c.resume();var b=c.createBuffer(1,1,22050),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);src.start(0)}catch(e){}});window.D7AudioUnlocked=true;D.removeEventListener('touchend',unlock,true);D.removeEventListener('click',unlock,true)}
 D.addEventListener('touchend',unlock,true);D.addEventListener('click',unlock,true);
 var web=/^https?:/.test(location.protocol)&&!window.D7APK&&!/appassets/.test(location.host);
 /* one SW per scope: on GitHub Pages sw.js IS the PWA worker (legacy pages also register sw.js → no competing scripts) */if(web&&/github\.io$/.test(location.hostname)&&window.parent===window&&'serviceWorker' in navigator&&!window.__D7_TEST__)addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(function(){})});
 window.D7iOS={ios:ios,standalone:sa,unlock:unlock};})();
