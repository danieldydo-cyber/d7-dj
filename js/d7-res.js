/* v71: static GitHub Pages has no /api server → answer locally (no 404 / JSON errors) */
(function(){if(!/github\.io$/.test(location.hostname)||window.__d7apiShim)return;window.__d7apiShim=1;var F=window.fetch;window.fetch=function(u,o){try{var a=new URL(typeof u=='string'?u:u.url,location.href);if(a.origin==location.origin&&/\/api\//.test(a.pathname))return Promise.resolve(new Response(JSON.stringify({ok:false,offline:true,static:true,bots:[],items:[],tracks:[],answer:''}),{status:200,headers:{'content-type':'application/json'}}))}catch(e){}return F.apply(this,arguments)}})();
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

