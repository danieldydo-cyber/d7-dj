/* 7D v71 · Endless visualizations: every N s (default 7) switch through ALL MilkDrop presets + 3D modes + shark variations,
   smooth blends, shuffled bag (no repeats until everything has been seen). Works in pure fullscreen and in background tabs. */
(function(){if(window.D7Endless)return;var D=document,LS=window.localStorage,TEST=!!window.__D7_TEST__;
function g(k,d){try{var v=LS.getItem(k);return v==null?d:v}catch(e){return d}}function s(k,v){if(TEST)return;try{LS.setItem(k,v)}catch(e){}}
var ST={on:g('d7_endless','1')=='1',sec:+g('d7_endless_s','7')||7,bag:[],seen:0,total:0,cur:null,count:0,t:null};
function presets(){var pp=window.butterchurnPresets;pp=pp&&(pp.getPresets?pp:pp.default);var P={};try{Object.assign(P,pp.getPresets())}catch(e){}['butterchurnPresetsExtra'].forEach(function(n){try{var x=window[n];x=x&&(x.getPresets?x:x.default);Object.assign(P,x.getPresets())}catch(e){}});return P}
function viz(){return (window.__d7bv||[]).filter(function(o){return o.c&&o.c.isConnected})}
var MODES=['tunnel','stars','terrain','shapes','sphere'],SHARK=['off','2d','2d-hue120','2d-hue240','3d'];
function build(){var P=presets(),names=Object.keys(P),b=[];names.forEach(function(n){b.push({k:'milk',n:n})});MODES.forEach(function(m){b.push({k:'3d',n:m})});SHARK.forEach(function(v){b.push({k:'shark',n:v})});
 for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=b[i];b[i]=b[j];b[j]=t}
 if(ST.cur&&b.length>1&&b[b.length-1].k==ST.cur.k&&b[b.length-1].n==ST.cur.n){var z=b.pop();b.unshift(z)}ST.bag=b;ST.total=b.length;ST.seen=0;ST.P=P}
function three(on,m){if(!window.D7Ctl)return;var c=D.getElementById('d7three');if(on){D7Ctl.three(true);setTimeout(function(){if(window.D73D){if(m){while(D73D.state().mode!=m&&MODES.indexOf(m)>=0){D73D.mode()}}var e=D.getElementById('d7three');if(e){e.style.transition='opacity 1.2s';e.style.opacity=1}}},350)}
 else if(c&&window.D73D&&D73D.state().on){c.style.transition='opacity 1.2s';c.style.opacity=0;setTimeout(function(){if(ST.cur&&ST.cur.k!='3d')D7Ctl.three(false)},1250)}}
function shark(v){var c=D.getElementById('d7shark');try{if(v=='off'){D7Ctl.shark(false);return}D7Ctl.shark(true)}catch(e){}if(c)c.style.filter=v.indexOf('hue')>0?'hue-rotate('+v.split('hue')[1]+'deg)':'';if(v=='3d')three(true)}
function step(){if(!ST.on)return;if(!ST.bag.length)build();var it=ST.bag.pop();if(!it)return;ST.seen++;ST.count++;ST.cur=it;
 try{if(it.k=='milk'){var p=ST.P[it.n];three(false);viz().forEach(function(o){try{o.v.loadPreset(p,2.5)}catch(e){}});try{if(window.D7Cosmos&&D7Cosmos.preset)D7Cosmos.preset(it.n)}catch(e){}}
 else if(it.k=='3d')three(true,it.n);else shark(it.n)}catch(e){}
 try{dispatchEvent(new CustomEvent('d7endless',{detail:it}))}catch(e){}}
function loop(){clearTimeout(ST.t);if(!ST.on)return;ST.t=setTimeout(function(){step();loop()},ST.sec*1000)}
function on(v){ST.on=v==null?!ST.on:!!v;s('d7_endless',ST.on?'1':'0');if(ST.on){more();step();loop()}else clearTimeout(ST.t);return ST.on}
function sec(n){ST.sec=Math.max(2,Math.min(600,+n||7));s('d7_endless_s',String(ST.sec));loop();return ST.sec}
window.D7Endless={on:on,sec:sec,next:function(){step();loop()},state:function(){return{on:ST.on,sec:ST.sec,seen:ST.seen,total:ST.total,left:ST.bag.length,cur:ST.cur,count:ST.count}}};
function more(){var B=(window.D7Ctl&&D7Ctl.base)||'',L=['butterchurnPresets','butterchurnPresetsExtra'].filter(function(n){return !window[n]});L.forEach(function(n){var e=D.createElement('script');e.src=B+'libs/'+n+'.min.js';e.onload=function(){ST.bag=[]};D.head.appendChild(e)})}
if(ST.on)setTimeout(function(){more();loop()},1500)})();
