/* Ghost X G / 7D background audio helper (v72):
   - Media Session metadata + lock-screen controls (play/pause/stop/next) for <audio>/<video> and Web Audio contexts
   - iOS 17+: navigator.audioSession.type='playback' so audio is treated as media (keeps playing with screen off where iOS allows)
   - Screen Wake Lock toggle "Ekran zawsze włączony"
   - Android APK bridge (window.GXBg): tells the native foreground media service when audio plays/stops; native notification buttons call GXBgCmd(). */
(function(){if(window.__gxbg)return;window.__gxbg=1;
var ctxs=[],AC=window.AudioContext||window.webkitAudioContext;
if(AC){var W=function(a,b){var c=b!==undefined?new AC(a,b):(a!==undefined?new AC(a):new AC());ctxs.push(c);return c};W.prototype=AC.prototype;try{Object.setPrototypeOf(W,AC)}catch(e){}window.AudioContext=W;if(window.webkitAudioContext)window.webkitAudioContext=W}
// v77 beat tap: every node connected to a destination also feeds a per-context analyser (for 👽 cosmic layer / Mix Visuals 778)
if(window.AudioNode&&!AudioNode.prototype.__gxc){var oc=AudioNode.prototype.connect;AudioNode.prototype.__gxc=1;AudioNode.prototype.connect=function(d){var r=oc.apply(this,arguments);try{if(d&&d instanceof AudioDestinationNode){var c=this.context;if(!c.__gxAn){c.__gxAn=c.createAnalyser();c.__gxAn.fftSize=512;c.__gxAn.smoothingTimeConstant=0.6}if(this!==c.__gxAn)oc.call(this,c.__gxAn)}}catch(e){}return r}}
window.GXAudio={extra:[],analysers:function(){return ctxs.filter(function(c){return c.__gxAn&&c.state==='running'}).map(function(c){return c.__gxAn}).concat(this.extra)},
 _avg:0,_last:0,level:function(){var an=this.analysers(),e=0,n=0;an.forEach(function(a){var b=new Uint8Array(a.frequencyBinCount);a.getByteFrequencyData(b);for(var i=1;i<8;i++){e+=b[i];n++}});
  var lv=n?e/n/255:0,now=performance.now(),beat=false;if(!n){var bpm=window.GXFakeBpm||120,ph=(now/ (60000/bpm))%1;lv=Math.max(0,1-ph*3)*0.7;beat=ph<0.05&&now-this._last>200}else{beat=lv>this._avg*1.35&&lv>0.25&&now-this._last>180;this._avg=this._avg*0.95+lv*0.05}if(beat)this._last=now;return {level:lv,beat:beat,real:!!n}}};
try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
function media(){return Array.prototype.slice.call(document.querySelectorAll('audio,video'))}
function playing(){return media().some(function(m){return !m.paused&&!m.muted&&m.readyState>1})||ctxs.some(function(c){return c.state==='running'})}
function title(){var t=(window.D7Radio&&D7Radio.state&&(D7Radio.state().title||D7Radio.state().station))||document.title||'Ghost X G';return String(t).slice(0,80)}
var last=null;function sync(){var p=playing();
 if('mediaSession' in navigator){try{navigator.mediaSession.metadata=new MediaMetadata({title:title(),artist:'DJ DaX · Ghost X G 🐲',album:'7D · Kraków',artwork:[{src:new URL((location.pathname.indexOf('/gx/')>=0?'':'gx/')+'icon-512.png',location.href).href,sizes:'512x512',type:'image/png'}]});navigator.mediaSession.playbackState=p?'playing':'paused'}catch(e){}}
 if(p!==last){last=p;try{if(window.GXBg)GXBg.setPlaying(p,title())}catch(e){}}}
var paused=[];window.GXBgCmd=function(a){
 if(a==='pause'||a==='stop'){paused=media().filter(function(m){return !m.paused});paused.forEach(function(m){m.pause()});ctxs.forEach(function(c){if(c.state==='running')c.suspend()});if(window.D7Radio&&a==='stop'&&D7Radio.stop)try{D7Radio.stop()}catch(e){}}
 if(a==='play'){(paused.length?paused:media()).forEach(function(m){m.play().catch(function(){})});ctxs.forEach(function(c){if(c.state==='suspended')c.resume()})}
 if(a==='next'&&window.D7Radio&&D7Radio.next)try{D7Radio.next()}catch(e){}
 setTimeout(sync,300)};
if('mediaSession' in navigator)[['play','play'],['pause','pause'],['stop','stop'],['nexttrack','next']].forEach(function(x){try{navigator.mediaSession.setActionHandler(x[0],function(){GXBgCmd(x[1])})}catch(e){}});
document.addEventListener('play',sync,true);document.addEventListener('pause',sync,true);setInterval(sync,3000);
// Wake Lock toggle
var wl=null,want=localStorage.getItem('gx_wake')==='1';
async function lock(){if(!want||!('wakeLock' in navigator)||document.visibilityState!=='visible')return;try{wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',function(){wl=null})}catch(e){}}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){lock();sync()}});
function ui(){var b=document.createElement('button');b.id='gxWake';b.style.cssText='position:fixed;left:10px;bottom:56px;z-index:2147483000;background:'+(want?'#00c853':'#333')+';color:#fff;border:0;border-radius:999px;padding:6px 10px;font:700 12px system-ui;opacity:.9';
 b.textContent=(want?'☀️ ':'🌙 ')+'Ekran zawsze włączony';b.title=('wakeLock' in navigator)?'Screen Wake Lock':'Brak Wake Lock w tej przeglądarce';
 b.onclick=function(){want=!want;localStorage.setItem('gx_wake',want?'1':'0');b.style.background=want?'#00c853':'#333';b.textContent=(want?'☀️ ':'🌙 ')+'Ekran zawsze włączony';if(want)lock();else if(wl){wl.release();wl=null}};document.body.appendChild(b);lock();sync()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ui);else ui();
window.GXBgState=function(){return {playing:playing(),ctxs:ctxs.length,wake:!!wl,want:want,ms:'mediaSession' in navigator}};
})();
