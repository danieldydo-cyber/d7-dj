/* Super DJ Bot v54 — 2 radio decks + generator + CC loops, looper, FX, BPM tap/auto, visualizer. All WebAudio, no server needed. */
(function(){'use strict';
var $=function(i){return document.getElementById(i)};
window.addEventListener('error',function(e){$('err').textContent='⚠ '+(e.message||'błąd')});
var ac,master,an,mix,fxIn,BPM=128;
function setBpm(b){if(!(b>40&&b<220))return;BPM=Math.round(b*10)/10;$('bpmv').textContent=BPM.toFixed(1);if(ac)setDelay()}
/* ---------- audio graph ---------- */
var F={};
function init(){if(ac)return ac.resume();
 ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createGain();an=ac.createAnalyser();an.fftSize=2048;
 mix=ac.createGain();               // everything that the looper can capture
 fxIn=ac.createGain();mix.connect(fxIn);
 // filter
 F.flt=ac.createBiquadFilter();F.flt.type='allpass';fxIn.connect(F.flt);
 // bitcrush (waveshaper quantizer) dry/wet
 F.crushDry=ac.createGain();F.crushWet=ac.createGain();F.crush=ac.createWaveShaper();F.crushWet.gain.value=0;
 F.flt.connect(F.crushDry);F.flt.connect(F.crush);F.crush.connect(F.crushWet);F.post1=ac.createGain();F.crushDry.connect(F.post1);F.crushWet.connect(F.post1);
 // flanger
 F.flD=ac.createDelay(0.05);F.flD.delayTime.value=.004;F.flLfo=ac.createOscillator();F.flLfo.frequency.value=.25;F.flDepth=ac.createGain();F.flDepth.gain.value=.003;
 F.flLfo.connect(F.flDepth);F.flDepth.connect(F.flD.delayTime);F.flLfo.start();F.flFb=ac.createGain();F.flFb.gain.value=.5;F.flWet=ac.createGain();F.flWet.gain.value=0;
 F.post1.connect(F.flD);F.flD.connect(F.flFb);F.flFb.connect(F.flD);F.flD.connect(F.flWet);F.post2=ac.createGain();F.post1.connect(F.post2);F.flWet.connect(F.post2);
 // echo synced to BPM
 F.dl=ac.createDelay(4);F.dlFb=ac.createGain();F.dlFb.gain.value=.45;F.dlWet=ac.createGain();F.dlWet.gain.value=0;
 F.post2.connect(F.dl);F.dl.connect(F.dlFb);F.dlFb.connect(F.dl);F.dl.connect(F.dlWet);F.post3=ac.createGain();F.post2.connect(F.post3);F.dlWet.connect(F.post3);
 // reverb (generated impulse)
 F.rv=ac.createConvolver();var len=ac.sampleRate*2.5,ir=ac.createBuffer(2,len,ac.sampleRate);for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}F.rv.buffer=ir;
 F.rvWet=ac.createGain();F.rvWet.gain.value=0;F.post3.connect(F.rv);F.rv.connect(F.rvWet);F.post3.connect(master);F.rvWet.connect(master);
 master.connect(an);an.connect(ac.destination);
 setDelay();setCrush(0);rec();xfade();draw();
 ['A','B'].forEach(function(k){D[k].g=ac.createGain();D[k].x=ac.createGain();D[k].g.connect(D[k].x);D[k].x.connect(mix);D[k].g.gain.value=+$('v'+k).value});
 G.g=ac.createGain();G.g.gain.value=+$('vG').value;G.g.connect(mix);L.g=ac.createGain();L.g.gain.value=+$('vL').value;L.g.connect(mix);xfade();
 $('start').classList.remove('on');$('start').textContent='🔊 audio ON'}
$('start').onclick=init;document.addEventListener('pointerdown',function(){init()},{once:true});
function setDelay(){if(F.dl)F.dl.delayTime.setTargetAtTime(Math.min(3.9,60/BPM*4*+$('fEd').value),ac.currentTime,.05)}
function setCrush(a){var bits=Math.round(16-a*13),st=Math.pow(2,bits),n=4096,cv=new Float32Array(n);for(var i=0;i<n;i++){var x=i/(n-1)*2-1;cv[i]=Math.round(x*st)/st}F.crush.curve=cv;F.crushWet.gain.value=a>0.01?1:0;F.crushDry.gain.value=a>0.01?0:1}
/* ---------- decks A/B: radio with CORS capture test + failover ---------- */
var D={A:{},B:{}};
['A','B'].forEach(function(k,ix){var s=$('s'+k);D7_STATIONS.forEach(function(x,j){var o=document.createElement('option');o.value=j;o.textContent=x[0];s.appendChild(o)});s.value=ix?1:0;
 function mk(cors){var el=new Audio();if(cors)el.crossOrigin='anonymous';el.preload='none';return el}
 var d=D[k];
 d.start=function(){init();if(!d.el){d.el=mk(true);d.cors=true;try{d.src=ac.createMediaElementSource(d.el);d.src.connect(d.g)}catch(e){d.cors=false}
   d.R=D7Radio(d.el,+s.value,function(m,j){s.value=j;$('t'+k).textContent=m+(d.cors?' · WebAudio: ✅ (FX/looper/visualizer działają)':'')});
   d.el.addEventListener('playing',function(){checkCapture(d,k)})}
  d.R.play(+s.value)};
 $('p'+k).onclick=d.start;$('x'+k).onclick=function(){d.R&&d.R.stop()};$('n'+k).onclick=function(){d.R?d.R.next():d.start()};
 s.onchange=function(){if(d.R)d.R.play(+s.value)};$('v'+k).oninput=function(){if(d.g)d.g.gain.value=+this.value}});
/* verify that the stream really delivers samples to WebAudio (CORS-tainted streams output silence) */
function checkCapture(d,k){var a=ac.createAnalyser();d.g.connect(a);var buf=new Float32Array(1024),n=0;var t=setInterval(function(){a.getFloatTimeDomainData(buf);var m=0;for(var i=0;i<buf.length;i++)m=Math.max(m,Math.abs(buf[i]));
 if(m>0.001){clearInterval(t);d.g.disconnect(a);$('t'+k).textContent+=' · sygnał OK';return}
 if(++n>16){clearInterval(t);d.g.disconnect(a);$('t'+k).innerHTML+='<br><span class="warn">⚠ Ta stacja nie pozwala na przechwycenie dźwięku przez WebAudio (CORS) albo jest cisza — wybierz inną (⏭).</span>'}},250)}
function xfade(){var v=+$('xf').value;if(D.A.x){D.A.x.gain.value=Math.cos(v*Math.PI/2);D.B.x.gain.value=Math.cos((1-v)*Math.PI/2)}}
$('xf').oninput=xfade;
/* ---------- Deck C: generator ---------- */
var G={},step=0,next=0,timer,pat;function rnd(p){return Math.random()<p}
function newPat(){pat={k:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,rnd(.3)?1:0,0],h:[],c:[],b:[],n:[36,36,39,41,43][Math.random()*5|0]};for(var i=0;i<16;i++){pat.h.push(i%4==2||rnd(.25)?1:0);pat.c.push(i==4||i==12?1:0);pat.b.push(rnd(.45)?[0,0,3,7,12,10][Math.random()*6|0]+1:0)}}newPat();
function kick(t){var o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(1,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(G.g);o.start(t);o.stop(t+.4)}
var nb;function noise(t,d,f,v){if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);var x=nb.getChannelData(0);for(var i=0;i<x.length;i++)x[i]=Math.random()*2-1}var s=ac.createBufferSource(),h=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;h.type='highpass';h.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(h);h.connect(g);g.connect(G.g);s.start(t);s.stop(t+d)}
function bass(t,n,d){var o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=440*Math.pow(2,(n-69)/12);f.type='lowpass';f.Q.value=12;f.frequency.setValueAtTime(1800,t);f.frequency.exponentialRampToValueAtTime(200,t+d);g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(f);f.connect(g);g.connect(G.g);o.start(t);o.stop(t+d)}
function sched(){var sp=60/BPM/4;while(next<ac.currentTime+.1){var i=step%16;if(pat.k[i])kick(next);if(pat.h[i])noise(next,.05,7000,.3);if(pat.c[i])noise(next,.2,1500,.5);if(pat.b[i])bass(next,pat.n+pat.b[i]-1,sp*.9);next+=sp;step++}}
function genOn(){init();if(timer)return;next=ac.currentTime+.05;timer=setInterval(sched,25);$('gP').classList.add('on')}
function genOff(){clearInterval(timer);timer=null;$('gP').classList.remove('on')}
$('gP').onclick=genOn;$('gS').onclick=genOff;$('gR').onclick=newPat;$('vG').oninput=function(){if(G.g)G.g.gain.value=+this.value};
/* ---------- internet loops: CC/PD files from Wikimedia Commons (CORS: *) ---------- */
var LOOPS=[['Funk carioca 8 bar (CC0, Zanahary)','https://upload.wikimedia.org/wikipedia/commons/b/b8/Funk_carioca_8_bar_loop.ogg'],
 ['Casio MT-40 drum pattern (public domain)','https://upload.wikimedia.org/wikipedia/commons/0/0c/Casio_MT-40_Drumpattern.mp3'],
 ['Dubstep loop (CC BY 4.0, WinnieTheMoog)','https://upload.wikimedia.org/wikipedia/commons/3/3c/Dubstep_Loop_by_WinnieTheMoog.ogg'],
 ['Reggae bultron (CC BY 3.0, Muffinman)','https://upload.wikimedia.org/wikipedia/commons/2/22/Reggae_bultron.ogg'],
 ['Synth-pop loop (CC BY-SA 4.0, Lwneal)','https://upload.wikimedia.org/wikipedia/commons/0/08/Encyclopedic-Synth-Pop-Loop.oga'],
 ['Drum loop Carrai Pass (CC BY-SA 3.0, Pannage)','https://upload.wikimedia.org/wikipedia/commons/8/80/Drum_loop_%28Carrai_Pass%29.wav']];
var L={cache:{}};LOOPS.forEach(function(x,j){var o=document.createElement('option');o.value=j;o.textContent=x[0];$('lS').appendChild(o)});
$('lP').onclick=function(){init();var j=+$('lS').value,u=LOOPS[j][1];$('lT').textContent='pobieram…';
 (L.cache[u]?Promise.resolve(L.cache[u]):fetch(u).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()}).then(function(a){return new Promise(function(res,rej){ac.decodeAudioData(a,res,rej)})}).then(function(b){L.cache[u]=b;return b}))
 .then(function(b){if(L.s)try{L.s.stop()}catch(e){}L.s=ac.createBufferSource();L.s.buffer=b;L.s.loop=true;L.s.connect(L.g);L.s.start();$('lT').textContent='▶ '+LOOPS[j][0]+' · '+b.duration.toFixed(2)+' s · źródło: Wikimedia Commons'})
 .catch(function(e){$('lT').textContent='✖ nie mogę pobrać/odtworzyć pętli ('+(e&&e.message||'format nieobsługiwany — np. OGG w Safari')+')'})};
$('lX').onclick=function(){if(L.s)try{L.s.stop()}catch(e){}L.s=null;$('lT').textContent='stop'};$('vL').oninput=function(){if(L.g)L.g.gain.value=+this.value};
/* ---------- recorder ring buffer (last 16 s of the mix) ---------- */
var RB,RL,RW=0,RN=0;
function rec(){var sec=16;RL=Math.floor(ac.sampleRate*sec);RB=[new Float32Array(RL),new Float32Array(RL)];
 var sp=ac.createScriptProcessor(2048,2,2);mix.connect(sp);var z=ac.createGain();z.gain.value=0;sp.connect(z);z.connect(ac.destination);
 sp.onaudioprocess=function(e){var a=e.inputBuffer.getChannelData(0),b=e.inputBuffer.numberOfChannels>1?e.inputBuffer.getChannelData(1):a;for(var i=0;i<a.length;i++){RB[0][RW]=a[i];RB[1][RW]=b[i];RW=(RW+1)%RL}RN=Math.min(RL,RN+a.length)}}
function grab(sec){var n=Math.min(RN,Math.floor(sec*ac.sampleRate));if(n<256)return null;var buf=ac.createBuffer(2,n,ac.sampleRate);for(var c=0;c<2;c++){var o=buf.getChannelData(c),s=(RW-n+RL)%RL;for(var i=0;i<n;i++)o[i]=RB[c][(s+i)%RL]}return buf}
/* ---------- looper ---------- */
var LP={src:null,buf:null,rate:1,ov:false,gain:null};
function playLoop(buf){if(!ac)return;if(LP.src)try{LP.src.stop()}catch(e){}if(!LP.gain){LP.gain=ac.createGain();LP.gain.connect(fxIn)}
 LP.buf=buf;LP.src=ac.createBufferSource();LP.src.buffer=buf;LP.src.loop=true;LP.src.playbackRate.value=LP.rate;LP.src.connect(LP.gain);LP.src.start();
 // duck the live mix while looping, like a DJM/RMX loop
 mix.gain.setTargetAtTime(LP.ov?1:0,ac.currentTime,.01)}
function stopLoop(){if(LP.src)try{LP.src.stop()}catch(e){}LP.src=null;if(mix)mix.gain.setTargetAtTime(1,ac.currentTime,.01);document.querySelectorAll('.pad[data-b]').forEach(function(b){b.classList.remove('on')});$('lpT').textContent='pętla zatrzymana'}
function capture(beats,el){init();var sec=beats*60/BPM;
 if(LP.ov&&LP.buf){var nb=grab(LP.buf.duration);if(!nb)return;for(var c=0;c<2;c++){var o=LP.buf.getChannelData(c),x=nb.getChannelData(c);for(var i=0;i<o.length&&i<x.length;i++)o[i]=Math.max(-1,Math.min(1,o[i]+x[i]*.8))}$('lpT').textContent='overdub dodany do pętli';return}
 var b=grab(sec);if(!b){$('lpT').textContent='za mało nagranego dźwięku — włącz deck/generator';return}
 playLoop(b);document.querySelectorAll('.pad[data-b]').forEach(function(x){x.classList.toggle('on',x==el)});$('lpT').textContent='🔁 pętla '+beats+' beat(ów) = '+sec.toFixed(2)+' s @ '+BPM+' BPM'}
document.querySelectorAll('.pad[data-b]').forEach(function(b){b.onclick=function(){capture(+b.dataset.b,b)}});
$('ov').onclick=function(){LP.ov=!LP.ov;this.classList.toggle('on',LP.ov);if(LP.src)mix.gain.setTargetAtTime(LP.ov?1:0,ac.currentTime,.01)};
$('rv').onclick=function(){if(!LP.buf)return;for(var c=0;c<LP.buf.numberOfChannels;c++)LP.buf.getChannelData(c).reverse();playLoop(LP.buf);this.classList.toggle('on')};
function rate(r){LP.rate=LP.rate==r?1:r;if(LP.src)LP.src.playbackRate.value=LP.rate;$('hf').classList.toggle('on',LP.rate==.5);$('db').classList.toggle('on',LP.rate==2)}
$('hf').onclick=function(){rate(.5)};$('db').onclick=function(){rate(2)};$('ls').onclick=stopLoop;
/* roll / stutter: hold to repeat the last 1/4,1/8,1/16 beat */
var rolling=null,saved=null;
function rollOn(fr){init();if(rolling)return;var b=grab(fr*60/BPM);if(!b)return;saved=LP.src?{buf:LP.buf}:null;var o=LP.ov;LP.ov=false;playLoop(b);LP.ov=o;rolling=fr}
function rollOff(){if(!rolling)return;rolling=null;if(saved)playLoop(saved.buf);else stopLoop();saved=null}
document.querySelectorAll('.roll').forEach(function(b){b.addEventListener('pointerdown',function(e){e.preventDefault();rollOn(+b.dataset.r)});['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,rollOff)})});
/* ---------- FX controls ---------- */
$('fF').oninput=function(){init();var v=+this.value;if(Math.abs(v)<.03){F.flt.type='allpass';return}
 if(v<0){F.flt.type='lowpass';F.flt.frequency.setTargetAtTime(20000*Math.pow(10,v*2.7),ac.currentTime,.02)}else{F.flt.type='highpass';F.flt.frequency.setTargetAtTime(20*Math.pow(10,v*2.7),ac.currentTime,.02)}F.flt.Q.value=6};
$('fE').oninput=function(){init();F.dlWet.gain.value=+this.value*.8;F.dlFb.gain.value=.3+ +this.value*.4};$('fEd').onchange=function(){if(ac)setDelay()};
$('fR').oninput=function(){init();F.rvWet.gain.value=+this.value*1.2};
$('fL').oninput=function(){init();var v=+this.value;F.flWet.gain.value=v*.8;F.flFb.gain.value=.3+v*.5};
$('fB').oninput=function(){init();setCrush(+this.value)};
$('fx0').onclick=function(){['fF','fE','fR','fL','fB'].forEach(function(i){$(i).value=0;$(i).oninput()})};
/* ---------- BPM: tap + auto-detect (energy-envelope autocorrelation on the recorded mix) ---------- */
var taps=[];$('tap').onclick=function(){var t=performance.now();taps=taps.filter(function(x){return t-x<3000});taps.push(t);if(taps.length>1){var s=0;for(var i=1;i<taps.length;i++)s+=taps[i]-taps[i-1];setBpm(60000/(s/(taps.length-1)));$('bpms').textContent='tap ×'+taps.length}};
function autoBpm(){if(!ac||RN<ac.sampleRate*6){$('bpms').textContent='auto: potrzebuję ≥6 s dźwięku';return}
 var sec=Math.min(12,RN/ac.sampleRate),b=grab(sec),x=b.getChannelData(0),hop=512,env=[],lp=0,prev=0;
 for(var i=0;i+hop<x.length;i+=hop){var e=0;for(var j=0;j<hop;j++){lp+=.02*(x[i+j]-lp);e+=lp*lp}var d=Math.max(0,e-prev);prev=e;env.push(d)}
 var fps=ac.sampleRate/hop,best=0,bl=0;for(var bpm=80;bpm<=170;bpm+=.5){var lag=fps*60/bpm,s=0,n=0;for(var k=0;k+lag*2<env.length;k++){var l1=Math.round(k+lag),l2=Math.round(k+lag*2);s+=env[k]*(env[l1]+.5*env[l2]);n++}s/=n||1;if(s>best){best=s;bl=bpm}}
 if(bl){if(bl<95)bl*=2;setBpm(bl);$('bpms').textContent='auto: '+bl.toFixed(1)+' BPM (z '+sec.toFixed(0)+' s)'}}
$('auto').onclick=autoBpm;
/* ---------- visualizer ---------- */
function draw(){var c=$('cv'),x=c.getContext('2d'),fd=new Uint8Array(an.frequencyBinCount),td=new Uint8Array(an.fftSize);
 (function f(){requestAnimationFrame(f);var w=c.width=c.clientWidth,h=c.height=(document.documentElement.classList.contains('d7pure')?c.clientHeight||140:140);an.getByteFrequencyData(fd);an.getByteTimeDomainData(td);x.fillStyle='#000';x.fillRect(0,0,w,h);
  var n=160,bw=w/n;for(var i=0;i<n;i++){var v=fd[Math.floor(Math.pow(i/n,1.6)*fd.length*.7)]/255;x.fillStyle='hsl('+(160+i)%360+',90%,'+(25+v*45)+'%)';x.fillRect(i*bw,h-v*h,bw-1,v*h)}
  x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();for(var i=0;i<td.length;i+=4){var X=i/td.length*w,Y=td[i]/255*h;i?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke()})()}
/* ---------- keyboard ---------- */
document.addEventListener('keydown',function(e){if(e.target.tagName=='INPUT'||e.target.tagName=='SELECT'||e.repeat)return;var k=e.key.toLowerCase(),pads=document.querySelectorAll('.pad[data-b]');
 if(k>='1'&&k<='4'){pads[+k-1].click()}else if(k=='q'||k=='w'||k=='e'){rollOn({q:.25,w:.125,e:.0625}[k])}else if(k=='o')$('ov').click();else if(k=='r')$('rv').click();else if(k=='h')$('hf').click();else if(k=='d')$('db').click();
 else if(k==' '){e.preventDefault();stopLoop()}else if(k=='t')$('tap').click();else if(k=='a'){$('xf').value=0;xfade()}else if(k=='b'){$('xf').value=1;xfade()}else if(k=='g'){timer?genOff():genOn()}});
document.addEventListener('keyup',function(e){if('qwe'.indexOf(e.key.toLowerCase())>=0)rollOff()});
})();
