/* WeDJ PRO · Super X G 🐲 — 2-deck web DJ engine (v1066). Web Audio only, no paid APIs, no /api writes (GET /api/playlist only). */
(function(){'use strict';
var $=function(s,r){return(r||document).querySelector(s)};
var RADIO=[['SomaFM Beat Blender','https://ice1.somafm.com/beatblender-128-mp3'],['SomaFM Groove Salad','https://ice1.somafm.com/groovesalad-128-mp3'],['SomaFM DEF CON','https://ice1.somafm.com/defcon-128-mp3'],['SomaFM Fluid (hip-hop)','https://ice1.somafm.com/fluid-128-mp3'],['SomaFM Space Station','https://ice1.somafm.com/spacestation-128-mp3']];
var DEMOS=[{name:'Demo 120 BPM',file:'samples/test-120bpm.wav',bpm:120},{name:'Kali · Hip-Hop 120',file:'samples/kali-hiphop-120.wav',bpm:120},{name:'Berlin Techno 128',file:'samples/berlin-techno-128.wav',bpm:128},{name:'Trance 120',file:'samples/trance-120.wav',bpm:120}];
var LOOPS=[0.25,0.5,1,2,4,8,16];
var AC=null,MASTER,PRE,ANA,XA,XB,FX={},decks=[],aiFx=false,autoMix=false,lastAuto=0,stat=function(t){var s=$('#stat');if(s)s.textContent=t};
function ctx(){if(AC){if(AC.state!='running')AC.resume();return AC}
 AC=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});
 MASTER=AC.createGain();MASTER.gain.value=+$('#mvol').value;PRE=AC.createGain();ANA=AC.createAnalyser();ANA.fftSize=1024;
 PRE.connect(MASTER);buildFx();MASTER.connect(ANA);ANA.connect(AC.destination);
 XA=AC.createGain();XB=AC.createGain();XA.connect(PRE);XB.connect(PRE);applyXf();
 decks.forEach(function(d){d.wire()});return AC}
/* ---------- FX (beat-synced, on master bus) ---------- */
function impulse(sec,decay){var n=AC.sampleRate*sec,b=AC.createBuffer(2,n,AC.sampleRate);for(var c=0;c<2;c++){var d=b.getChannelData(c);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)}return b}
function crushCurve(steps){var n=4096,c=new Float32Array(n);for(var i=0;i<n;i++){var x=i/(n-1)*2-1;c[i]=Math.round(x*steps)/steps}return c}
function buildFx(){var mk=function(name,inp,out){var wet=AC.createGain();wet.gain.value=0;PRE.connect(inp);out.connect(wet);wet.connect(MASTER);FX[name]={wet:wet,on:false,inp:inp}};
 var dl=AC.createDelay(4),fb=AC.createGain();fb.gain.value=.45;dl.connect(fb);fb.connect(dl);mk('echo',dl,dl);FX.echo.delay=dl;
 var cv=AC.createConvolver();cv.buffer=impulse(2.6,2.5);mk('reverb',cv,cv);
 var fd=AC.createDelay(.05),lfo=AC.createOscillator(),lg=AC.createGain(),ffb=AC.createGain();fd.delayTime.value=.004;lg.gain.value=.0032;ffb.gain.value=.55;lfo.connect(lg);lg.connect(fd.delayTime);fd.connect(ffb);ffb.connect(fd);lfo.start();mk('flanger',fd,fd);FX.flanger.lfo=lfo;
 var sw=AC.createBiquadFilter();sw.type='lowpass';sw.Q.value=8;sw.frequency.value=18000;mk('sweep',sw,sw);FX.sweep.f=sw;
 var ws=AC.createWaveShaper();ws.curve=crushCurve(6);var hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=150;ws.connect(hp);mk('crush',ws,hp);
 FX.roll={on:false}}
function beatSec(){var m=masterDeck();return 60/((m&&m.bpm*m.rate)||120)}
function setFx(name,on){if(!AC)ctx();var f=FX[name];if(!f)return;f.on=on;var b=document.querySelector('[data-fx="'+name+'"]');if(b)b.classList.toggle('on',on);var t=AC.currentTime,bs=beatSec();
 if(name=='roll'){var d=masterDeck();if(d){if(on){d._preRoll=d.loopLen;d.setLoop(0.125,true)}else d.setLoop(d._preRoll||0,true)}return}
 if(name=='echo')f.delay.delayTime.setTargetAtTime(bs*0.75,t,.01);
 if(name=='flanger')f.lfo.frequency.setTargetAtTime(1/(bs*4),t,.01);
 if(name=='sweep'){f.f.frequency.cancelScheduledValues(t);if(on){f.f.frequency.setValueAtTime(18000,t);f.f.frequency.exponentialRampToValueAtTime(220,t+bs*8)}else f.f.frequency.setValueAtTime(18000,t)}
 f.wet.gain.setTargetAtTime(on?(name=='reverb'?.6:name=='sweep'||name=='crush'?.9:.55):0,t,.05);
 if(name=='sweep'||name=='crush'){/* insert-style FX: duck the dry signal */PRE.gain.setTargetAtTime(on?0.15:1,t,.05)}}
/* ---------- BPM detection (onset envelope autocorrelation) ---------- */
function detectBpm(buf){try{var sr=buf.sampleRate,ch=buf.getChannelData(0),len=Math.min(ch.length,sr*40),hop=Math.round(sr/200),n=Math.floor(len/hop),env=new Float32Array(n),prev=0,lp=0;
 for(var i=0;i<n;i++){var e=0;for(var j=i*hop,k=j+hop;j<k;j++){lp+=.15*(ch[j]-lp);e+=lp*lp}e=Math.sqrt(e/hop);env[i]=Math.max(0,e-prev);prev=e}
 var best=0,bl=0;for(var bpm=70;bpm<=180;bpm+=.5){var lag=200*60/bpm,s=0;for(var i2=0;i2+lag*2<n;i2++){var l=Math.round(i2+lag);s+=env[i2]*env[l]}s*=1+.15*(bpm>=85&&bpm<=150);if(s>best){best=s;bl=bpm}}
 while(bl<80)bl*=2;while(bl>160)bl/=2;return Math.round(bl*10)/10}catch(e){return 120}}
function peaks(buf,N){var ch=buf.getChannelData(0),step=Math.max(1,Math.floor(ch.length/N)),p=new Float32Array(N);for(var i=0;i<N;i++){var m=0;for(var j=i*step,k=Math.min(ch.length,j+step);j<k;j+=4){var v=Math.abs(ch[j]);if(v>m)m=v}p[i]=m}return p}
/* ---------- Deck ---------- */
function Deck(id,el,mxEl,col){var D=this;D.id=id;D.el=el;D.col=col;D.buf=null;D.src=null;D.playing=false;D.offset=0;D.t0=0;D.rate=1;D.bend=0;D.bpm=0;D.name='—';D.cues=[null,null,null,null];D.loopLen=0;D.loopStart=0;D.radio=null;D.peaks=null;D.angle=0;
 el.innerHTML='<h3>'+id+' · <span class="tn">— załaduj utwór —</span></h3><div class="row"><span class="bpm">---.-</span><span class="small">BPM</span><span class="small rt">±0.0%</span><span class="small tm" style="margin-left:auto">0:00 / 0:00</span></div>'+
 '<canvas class="wf"></canvas><canvas class="ov"></canvas>'+
 '<div class="mid"><div class="jog"><i></i></div><input class="pitch" type="range" min="-0.16" max="0.16" step="0.0005" value="0" title="Tempo ±16% (dwuklik = 0)"></div>'+
 '<div class="row"><button class="cue">CUE</button><button class="play">▶ PLAY</button><button class="sync">SYNC</button><button class="tap">TAP</button></div>'+
 '<div class="pads">'+[1,2,3,4].map(function(i){return '<button class="hc" data-i="'+(i-1)+'">HOT '+i+'</button>'}).join('')+'</div>'+
 '<div class="row lp">'+LOOPS.map(function(l){return '<button data-l="'+l+'">'+(l<1?'1/'+(1/l):l)+'</button>'}).join('')+'</div>'+
 '<div class="row"><select class="src"><option value="">📂 Wybierz…</option>'+DEMOS.map(function(d,i){return '<option value="d'+i+'">🎵 '+d.name+'</option>'}).join('')+RADIO.map(function(r,i){return '<option value="r'+i+'">📻 '+r[0]+'</option>'}).join('')+'<option value="f">💾 Plik lokalny…</option></select><input type="file" accept="audio/*" class="file" hidden></div>';
 mxEl.innerHTML='<b class="small" style="color:'+col+'">Kanał '+id+'</b>'+[['gain','Gain',0,2,1],['hi','HI',-24,12,0],['mid','MID',-24,12,0],['lo','LOW',-24,12,0],['flt','FILTER',-1,1,0],['vol','Vol',0,1,.9]].map(function(k){return '<label>'+k[1]+'<input data-k="'+k[0]+'" type="range" min="'+k[2]+'" max="'+k[3]+'" step="0.01" value="'+k[4]+'"></label>'}).join('');
 D.q=function(s){return $(s,el)};D.wf=D.q('canvas.wf');D.ov=D.q('canvas.ov');
 D.q('.play').onclick=function(){ctx();D.playing?D.pause():D.play()};
 D.q('.cue').onclick=function(){ctx();if(D.playing){D.pause();D.seek(D.cuePt||0)}else{D.cuePt=D.pos()}};
 D.q('.sync').onclick=function(){D.sync()};
 var taps=[];D.q('.tap').onclick=function(){var t=performance.now();taps=taps.filter(function(x){return t-x<3000});taps.push(t);if(taps.length>3){D.bpm=Math.round(60000*(taps.length-1)/(t-taps[0])*10)/10;D.ui()}};
 var P=D.q('.pitch');P.oninput=function(){D.setRate(1+ +P.value)};P.ondblclick=function(){P.value=0;D.setRate(1)};
 el.querySelectorAll('.hc').forEach(function(b){var tm;b.onpointerdown=function(){tm=setTimeout(function(){D.cues[+b.dataset.i]=null;b.classList.remove('set');tm=-1},600)};b.onpointerup=function(){if(tm===-1)return;clearTimeout(tm);ctx();var i=+b.dataset.i;if(D.cues[i]==null){D.cues[i]=D.pos();b.classList.add('set')}else{D.seek(D.cues[i]);if(!D.playing)D.play()}}});
 el.querySelectorAll('.lp button').forEach(function(b){b.onclick=function(){var l=+b.dataset.l;D.setLoop(D.loopLen==l?0:l)}});
 var S=D.q('.src'),F=D.q('.file');S.onchange=function(){var v=S.value;S.value='';if(!v)return;ctx();if(v=='f')F.click();else if(v[0]=='d')D.loadUrl(DEMOS[+v.slice(1)].file,DEMOS[+v.slice(1)].name,DEMOS[+v.slice(1)].bpm);else D.loadRadio(+v.slice(1))};
 F.onchange=function(){var f=F.files[0];if(!f)return;D.name=f.name;f.arrayBuffer().then(function(a){return D.decode(a,f.name.replace(/\.[^.]+$/,''))});F.value=''};
 mxEl.querySelectorAll('input').forEach(function(i){i.oninput=function(){D.mix(i.dataset.k,+i.value)}});
 /* jog: drag = pitch bend while playing, scrub while paused */
 var J=D.q('.jog'),last=null;function ang(e){var r=J.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)}
 J.onpointerdown=function(e){ctx();J.setPointerCapture(e.pointerId);last=ang(e)};
 J.onpointermove=function(e){if(last==null)return;var a=ang(e),d=a-last;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;last=a;D.angle+=d;if(D.playing){D.bend=Math.max(-.5,Math.min(.5,d*4));D.applyRate()}else if(D.buf){D.seek(Math.max(0,D.pos()+d*0.6))}};
 J.onpointerup=J.onpointercancel=function(){last=null;D.bend=0;D.applyRate()};
 decks.push(D)}
Deck.prototype.wire=function(){var D=this,a=AC;D.trim=a.createGain();D.lo=a.createBiquadFilter();D.lo.type='lowshelf';D.lo.frequency.value=220;D.md=a.createBiquadFilter();D.md.type='peaking';D.md.frequency.value=1000;D.md.Q.value=.8;D.hi=a.createBiquadFilter();D.hi.type='highshelf';D.hi.frequency.value=3800;D.flt=a.createBiquadFilter();D.flt.type='allpass';D.vol=a.createGain();D.vol.gain.value=.9;D.ana=a.createAnalyser();D.ana.fftSize=512;
 D.trim.connect(D.lo);D.lo.connect(D.md);D.md.connect(D.hi);D.hi.connect(D.flt);D.flt.connect(D.vol);D.vol.connect(D.ana);D.vol.connect(D.id=='A'?XA:XB)};
Deck.prototype.mix=function(k,v){var D=this;if(!AC)ctx();var t=AC.currentTime;if(k=='gain')D.trim.gain.setTargetAtTime(v,t,.02);else if(k=='vol'){D.vol.gain.setTargetAtTime(v,t,.02);if(D.radio&&D.radio.direct)D.radioVol()}else if(k=='flt'){if(Math.abs(v)<.03){D.flt.type='allpass'}else if(v<0){D.flt.type='lowpass';D.flt.Q.value=4;D.flt.frequency.setTargetAtTime(20000*Math.pow(0.008,-v),t,.02)}else{D.flt.type='highpass';D.flt.Q.value=4;D.flt.frequency.setTargetAtTime(20*Math.pow(400,v),t,.02)}}else{var f={hi:D.hi,mid:D.md,lo:D.lo}[k];f.gain.setTargetAtTime(v,t,.02)}};
Deck.prototype.dur=function(){return this.buf?this.buf.duration:0};
Deck.prototype.pos=function(){var D=this;if(!D.buf)return 0;if(!D.playing)return D.offset;var p=D.offset+(AC.currentTime-D.t0)*D.effRate();if(D.loopLen&&p>=D.loopStart+D.loopSec()){var L=D.loopSec();p=D.loopStart+((p-D.loopStart)%L)}else if(D.src&&D.src.loop&&!D.loopLen)p=p%D.dur();return p};
Deck.prototype.effRate=function(){return this.rate*(1+this.bend)};
Deck.prototype.loopSec=function(){return this.loopLen*60/(this.bpm||120)};
Deck.prototype.applyRate=function(){var D=this;if(D.playing&&D.src){D.offset=D.pos();D.t0=AC.currentTime;D.src.playbackRate.setTargetAtTime(D.effRate(),AC.currentTime,.01)}if(D.radio&&D.radio.el)D.radio.el.playbackRate=1;D.ui()};
Deck.prototype.setRate=function(r){this.rate=r;this.applyRate();if(this.q('.pitch').value!=r-1)this.q('.pitch').value=r-1};
Deck.prototype.play=function(){var D=this;ctx();if(D.radio){D.radio.el.play().catch(function(e){stat('Radio: '+e.message)});D.playing=true;D.ui();return}if(!D.buf){stat('Deck '+D.id+': najpierw załaduj utwór');return}
 D.stopSrc();var s=AC.createBufferSource();s.buffer=D.buf;s.playbackRate.value=D.effRate();s.loop=true;if(D.loopLen){s.loopStart=D.loopStart;s.loopEnd=D.loopStart+D.loopSec()}s.connect(D.trim);var off=D.offset%D.dur();s.start(0,off);D.offset=off;D.t0=AC.currentTime;D.src=s;D.playing=true;D.ui()};
Deck.prototype.stopSrc=function(){if(this.src){try{this.src.stop()}catch(e){}this.src.disconnect();this.src=null}};
Deck.prototype.pause=function(){var D=this;if(D.radio){D.radio.el.pause();D.playing=false;D.ui();return}D.offset=D.pos();D.stopSrc();D.playing=false;D.ui()};
Deck.prototype.seek=function(t){var D=this;if(!D.buf)return;D.offset=Math.max(0,Math.min(D.dur()-.01,t));if(D.loopLen)D.loopStart=D.offset;if(D.playing)D.play();else D.ui()};
Deck.prototype.setLoop=function(l,quiet){var D=this;if(!D.buf)return;var p=D.pos();if(l){var bs=60/(D.bpm||120),g=D.beatOff||0;D.loopStart=g+Math.floor((p-g)/bs)*bs;if(D.loopStart<0)D.loopStart=0}D.loopLen=l;D.offset=p;if(D.playing)D.play();D.el.querySelectorAll('.lp button').forEach(function(b){b.classList.toggle('on',+b.dataset.l==l)});if(!quiet)stat(l?'Loop '+(l<1?'1/'+1/l:l)+' beat · '+D.id:'Loop off · '+D.id)};
Deck.prototype.sync=function(){var D=this,o=decks[D.id=='A'?1:0];if(!o.bpm||!D.bpm){stat('SYNC: brak BPM');return}D.setRate(Math.max(.84,Math.min(1.16,(o.bpm*o.rate)/D.bpm)));
 if(D.buf&&o.buf&&o.playing&&D.playing){var bsO=60/o.bpm,bsD=60/D.bpm,phO=((o.pos()-(o.beatOff||0))/bsO)%1,phD=((D.pos()-(D.beatOff||0))/bsD)%1,dph=phO-phD;if(dph>.5)dph-=1;if(dph<-.5)dph+=1;D.seek(D.pos()+dph*bsD)}
 D.q('.sync').classList.add('on');setTimeout(function(){D.q('.sync').classList.remove('on')},600);stat('SYNC '+D.id+' → '+(o.bpm*o.rate).toFixed(1)+' BPM')};
Deck.prototype.loadUrl=function(url,name,bpm){var D=this;stat('Ładuję '+name+'…');return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(function(a){return D.decode(a,name,bpm)}).catch(function(e){stat('Błąd ładowania: '+e.message)})};
Deck.prototype.decode=function(arr,name,bpmHint){var D=this;ctx();return AC.decodeAudioData(arr).then(function(b){D.unRadio();var was=D.playing;D.pause();D.buf=b;D.name=name;D.offset=0;D.loopLen=0;D.cues=[null,null,null,null];D.el.querySelectorAll('.hc').forEach(function(x){x.classList.remove('set')});
 var go=function(){D.peaks=peaks(b,1600);var det=detectBpm(b);D.bpm=bpmHint&&Math.abs(det-bpmHint)<=4?bpmHint:det;D.beatOff=0;D.ui();stat(D.id+': '+name+' · '+D.bpm+' BPM');if(was)D.play()};(window.requestIdleCallback||setTimeout)(go,{timeout:400});D.ui()})};
Deck.prototype.unRadio=function(){if(this.radio){try{this.radio.el.pause();this.radio.el.src=''}catch(e){}this.radio=null}};
Deck.prototype.radioVol=function(){var D=this;if(!D.radio||!D.radio.direct)return;var x=+$('#xf').value,xg=D.id=='A'?Math.cos((x+1)*Math.PI/4):Math.sin((x+1)*Math.PI/4);D.radio.el.volume=Math.max(0,Math.min(1,(+D.el.ownerDocument.querySelector('#mx'+D.id+' [data-k=vol]').value)*xg*(+$('#mvol').value)))};
Deck.prototype.loadRadio=function(i){var D=this,r=RADIO[i];D.pause();D.stopSrc();D.unRadio();D.buf=null;D.peaks=null;D.bpm=0;D.name=r[0];var el=new Audio();el.preload='none';el.crossOrigin='anonymous';var R=D.radio={el:el,direct:false};
 el.onerror=function(){if(R.retried||D.radio!==R)return;R.retried=true;/* no CORS → play directly, mix via element volume */var e2=new Audio(r[1]);R.el=e2;R.direct=true;D.radioVol();e2.play().catch(function(){});stat(r[0]+' (tryb bez EQ/FX — brak CORS)')};
 try{AC.createMediaElementSource(el).connect(D.trim)}catch(e){}el.src=r[1];D.playing=true;el.play().then(function(){stat('📻 '+r[0]+' · '+D.id)}).catch(function(){});D.ui()};
Deck.prototype.ui=function(){var D=this;D.q('.tn').textContent=D.name;D.q('.bpm').textContent=D.bpm?(D.bpm*D.rate).toFixed(1):'---.-';D.q('.rt').textContent=((D.rate-1)*100>=0?'+':'')+((D.rate-1)*100).toFixed(1)+'%';var p=D.q('.play');p.textContent=D.playing?'⏸ PAUSE':'▶ PLAY';p.classList.toggle('on',D.playing)};
function fmt(s){s=Math.max(0,s|0);return (s/60|0)+':'+('0'+s%60).slice(-2)}
function masterDeck(){var x=+$('#xf').value,a=decks[0],b=decks[1];if(a.playing&&!b.playing)return a;if(b.playing&&!a.playing)return b;return x<=0?a:b}
function applyXf(){if(!AC)return;var x=+$('#xf').value,t=AC.currentTime;XA.gain.setTargetAtTime(Math.cos((x+1)*Math.PI/4),t,.02);XB.gain.setTargetAtTime(Math.sin((x+1)*Math.PI/4),t,.02);decks.forEach(function(d){d.radioVol()})}
/* ---------- Sampler (synthesized, no downloads) ---------- */
var PADS=['Kick','Snare','Clap','Hat','Open Hat','808','Horn','Siren','Laser','Riser','Scratch','Vox Hey','Air Horn','Rim','Tom','Crash'],PADBUF={};
function synth(name){var sr=AC.sampleRate,len=Math.round(sr*({Riser:2,Siren:1.4,Crash:1.4,'Air Horn':1.2,'808':0.9}[name]||0.5)),b=AC.createBuffer(1,len,sr),d=b.getChannelData(0);
 for(var i=0;i<len;i++){var t=i/sr,n=Math.random()*2-1,v=0;switch(name){
 case'Kick':v=Math.sin(2*Math.PI*(50*t+90*(1-Math.exp(-t*30))/30))*Math.exp(-t*7);break;
 case'Snare':v=(n*.7+Math.sin(2*Math.PI*190*t)*.4)*Math.exp(-t*14);break;
 case'Clap':v=n*Math.exp(-((t%.012)*300))*Math.exp(-t*9)*(t<.04?1:.8);break;
 case'Hat':v=n*Math.exp(-t*60)*(i%2?1:-1)*.6;break;case'Open Hat':v=n*Math.exp(-t*9)*.5*(i%2?1:-1);break;
 case'808':v=Math.sin(2*Math.PI*(45*t+60*(1-Math.exp(-t*25))/25))*Math.exp(-t*2.5);v=Math.tanh(v*2);break;
 case'Horn':v=Math.sign(Math.sin(2*Math.PI*233*t))*.4*Math.min(1,t*30)*Math.exp(-t*3);break;
 case'Air Horn':v=(Math.sign(Math.sin(2*Math.PI*440*t))+Math.sign(Math.sin(2*Math.PI*554*t)))*.22*Math.min(1,t*40)*(t<1?1:Math.exp(-(t-1)*20));break;
 case'Siren':v=Math.sin(2*Math.PI*(600*t+150*Math.sin(2*Math.PI*1.5*t)/(2*Math.PI*1.5)))*.5*Math.exp(-t*.8);break;
 case'Laser':v=Math.sin(2*Math.PI*(2000*t-1800*t*t/0.5/2))*Math.exp(-t*6)*.6;break;
 case'Riser':v=n*.3*(t/2)+Math.sin(2*Math.PI*(200+800*t/2)*t)*.2*(t/2);break;
 case'Scratch':v=Math.sin(2*Math.PI*(300+250*Math.sin(t*40))*t)*n*.8*Math.exp(-t*4);break;
 case'Vox Hey':v=(Math.sin(2*Math.PI*220*t)+.5*Math.sin(2*Math.PI*660*t)+.3*Math.sin(2*Math.PI*1100*t)+.3*n)*.35*Math.min(1,t*50)*Math.exp(-t*8);break;
 case'Rim':v=Math.sin(2*Math.PI*1700*t)*Math.exp(-t*80);break;case'Tom':v=Math.sin(2*Math.PI*(120+80*Math.exp(-t*10))*t)*Math.exp(-t*7);break;
 case'Crash':v=n*Math.exp(-t*2.5)*.5;break}d[i]=v}return b}
function pad(i){ctx();var n=PADS[i];var b=PADBUF[n]||(PADBUF[n]=synth(n));var s=AC.createBufferSource(),g=AC.createGain();g.gain.value=.8;s.buffer=b;s.connect(g);g.connect(PRE);s.start();var el=document.querySelector('#sampler [data-p="'+i+'"]');if(el){el.classList.add('on');setTimeout(function(){el.classList.remove('on')},150)}}

/* ---------- 7 brains link (single queue: parent SBDJ when in launcher; own serialized Pollinations queue standalone). Never blocks: local heuristics act first, AI refines when it answers. ---------- */
var BQ=Promise.resolve(),aiPending=false,aiLog=[];
function brainAsk(id,q){var SB=null;try{SB=(window.parent!==window&&window.parent.SBDJ)||window.SBDJ}catch(e){}
 if(SB&&SB.brain)return SB.brain(id,q);
 var run=BQ.then(function(){return fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'openai',messages:[{role:'system',content:'Jesteś mózgiem Muzyka/DJ w WeDJ PRO. Odpowiadaj TYLKO zwięzłym JSON.'},{role:'user',content:q}]})}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(function(j){return j.choices[0].message.content})});BQ=run.catch(function(){}).then(function(){return new Promise(function(z){setTimeout(z,2500)})});return run}
function parseJ(t){try{var m=String(t).match(/\{[\s\S]*\}/);return m?JSON.parse(m[0]):null}catch(e){return null}}
function aiMusic(ctxTxt,apply){if(aiPending)return;aiPending=true;var t0=Date.now();
 brainAsk('music','WeDJ: '+ctxTxt+' Zwróć JSON: {"fx":"echo|reverb|flanger|sweep|crush|none","loop":0|0.5|1|2|4,"next":<indeks utworu 0-'+(DEMOS.length-1)+'>,"why":"krótko"}. Utwory: '+DEMOS.map(function(d,i){return i+':'+d.name+' '+d.bpm+'BPM'}).join(', '))
 .then(function(a){aiPending=false;if(/\[offline\]/.test(a))return;var j=parseJ(a);if(!j)return;aiLog.unshift({t:Date.now()-t0,j:j});apply(j)},function(){aiPending=false})}
/* ---------- AI FX (energy-driven, free & local) + Auto-mix ---------- */
var fxBuf=new Uint8Array(512),beatTimer=0;
function energy(){if(!ANA)return{rms:0,hi:0};ANA.getByteFrequencyData(fxBuf);var lo=0,hi=0;for(var i=0;i<512;i++){if(i<40)lo+=fxBuf[i];else if(i>120)hi+=fxBuf[i]}return{rms:(lo/40+hi/392)/510,hi:hi/392/(lo/40+1)}}
function aiTick(){var e=energy(),pick;if(e.rms<.08){var m0=masterDeck();if(m0&&m0.playing)aiMusic('cicho (energia '+Math.round(e.rms*100)+'%), start seta. Dobierz efekt.',function(j){if(!aiFx)return;var f=String(j.fx||'').toLowerCase();if(FX[f]&&f!='roll'&&!FX[f].on)setFx(f,true);stat('🧠 Mózg Muzyka: '+f+(j.why?' — '+String(j.why).slice(0,60):''))});return}if(e.rms>.5)pick=e.hi>.45?'flanger':'echo';else if(e.rms>.3)pick=Math.random()<.5?'sweep':'echo';else pick=Math.random()<.7?'reverb':'crush';
 ['echo','reverb','flanger','sweep','crush'].forEach(function(n){if(FX[n]&&FX[n].on&&n!=pick)setFx(n,false)});if(!FX[pick].on)setFx(pick,true);stat('✨ AI FX: '+pick+' (energia '+Math.round(e.rms*100)+'%, lokalnie)');
 var m=masterDeck();aiMusic('energia '+Math.round(e.rms*100)+'%, jasność '+Math.round(e.hi*100)+'%, BPM '+(m&&m.bpm?(m.bpm*m.rate).toFixed(1):'?')+', aktywny FX '+pick+'. Dobierz efekt i ewentualnie auto-loop.',function(j){if(!aiFx)return;var f=String(j.fx||'').toLowerCase();if(FX[f]&&f!='roll'){['echo','reverb','flanger','sweep','crush'].forEach(function(n){if(FX[n].on&&n!=f)setFx(n,false)});if(!FX[f].on)setFx(f,true)}else if(f=='none')['echo','reverb','flanger','sweep','crush'].forEach(function(n){if(FX[n].on)setFx(n,false)});var L=+j.loop,d=masterDeck();if(d&&d.buf&&LOOPS.indexOf(L)>=0&&L<=2)d.setLoop(L,true);if(typeof j.next=='number'&&DEMOS[j.next])decks._aiNext=j.next;stat('🧠 Mózg Muzyka: '+(f||'—')+(L?' · loop '+L:'')+(j.why?' — '+String(j.why).slice(0,60):''))})}
function autoTick(){var a=decks[0],b=decks[1],x=$('#xf');if(!a.playing&&!b.playing){(a.buf?Promise.resolve():a.loadUrl(DEMOS[0].file,DEMOS[0].name,DEMOS[0].bpm)).then(function(){a.play();x.value=-1;applyXf()});return}
 var cur=+x.value<=0?a:b,nxt=cur===a?b:a,k=(cur===a?0:1);var idx=(typeof decks._aiNext=='number'&&decks._aiNext!==decks._ai)?decks._aiNext:(decks._ai||0)+1;idx=idx%DEMOS.length;decks._ai=idx;decks._aiNext=null;var d=DEMOS[idx];aiMusic('auto-mix: gra '+cur.name+' '+(cur.bpm*cur.rate).toFixed(1)+' BPM, energia '+Math.round(energy().rms*100)+'%. Wybierz następny utwór (next) pasujący BPM/energią.',function(j){if(typeof j.next=='number'&&DEMOS[j.next])decks._aiNext=j.next});
 nxt.loadUrl(d.file,d.name,d.bpm).then(function(){nxt.sync();nxt.offset=0;nxt.play();nxt.sync();var from=k?1:-1,to=-from,steps=40,i=0,bs=beatSec();var iv=setInterval(function(){i++;x.value=from+(to-from)*i/steps;applyXf();if(i>=steps){clearInterval(iv);cur.pause()}},bs*16*1000/steps);stat('🤖 Auto-mix → '+d.name)})}
function startAuto(on){autoMix=on==null?!autoMix:on;$('#aimix').classList.toggle('on',autoMix);if(autoMix){ctx();lastAuto=0;autoTick()}stat(autoMix?'🤖 Auto-mix ON':'Auto-mix OFF');return autoMix?'auto-mix on':'auto-mix off'}
/* ---------- Render (≤30 fps, DPR-aware, 1080p cap) ---------- */
function fit(c){var r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr),s=Math.min(1,(window.D7Res?D7Res.cap()[0]:1920)/Math.max(w,1));w=Math.max(2,w*s|0);h=Math.max(2,h*s|0);if(c.width!=w||c.height!=h){c.width=w;c.height=h}return c.getContext('2d')}
function drawDeck(D){var g=fit(D.wf),W=D.wf.width,H=D.wf.height;g.fillStyle='#000';g.fillRect(0,0,W,H);var p=D.pos(),dur=D.dur();
 if(D.peaks&&dur){var win=8,N=D.peaks.length,pps=N/dur;var bh=D.id=='A'?185:295;for(var x=0;x<W;x+=2){var t=p-win/2+x/W*win;if(t<0||t>dur)continue;var ix=Math.min(N-1,(t*pps)|0),v=D.peaks[ix],pv=D.peaks[Math.max(0,ix-1)],hf=Math.min(1,Math.abs(v-pv)*9);/* frequency colour: smooth/bass = deck hue, transient/high = warm */g.fillStyle='hsl('+Math.round(bh+hf*110+v*30)%360+',100%,'+Math.round(42+v*28+hf*12)+'%)';g.fillRect(x,H/2-v*H/2,2,v*H)}
  if(D.bpm){var bs=60/D.bpm;g.fillStyle='rgba(255,255,255,.35)';for(var bt=Math.ceil((p-win/2)/bs)*bs;bt<p+win/2;bt+=bs)g.fillRect((bt-p+win/2)/win*W,0,1,H)}
  D.cues.forEach(function(c,i){if(c!=null&&Math.abs(c-p)<win/2){g.fillStyle='#ffb300';g.fillRect((c-p+win/2)/win*W-1,0,3,H)}});
  if(D.loopLen){g.fillStyle='rgba(0,229,255,.18)';g.fillRect((D.loopStart-p+win/2)/win*W,0,D.loopSec()/win*W,H)}
  var o=fit(D.ov),OW=D.ov.width,OH=D.ov.height;if(!D._ovd||D._ovd!==D.peaks){D._ovd=D.peaks;D._ovImg=null}o.fillStyle='#000';o.fillRect(0,0,OW,OH);o.fillStyle='#556';for(var i=0;i<OW;i++){var v2=D.peaks[(i/OW*N)|0];o.fillRect(i,OH/2-v2*OH/2,1,v2*OH)}o.fillStyle='#fff';o.fillRect(p/dur*OW,0,2,OH)}
 else if(D.radio){g.fillStyle='#334';g.font=(H/4|0)+'px system-ui';g.fillText('📻 LIVE '+D.name,10,H/2)}
 g.fillStyle='#fff';g.fillRect(W/2-1,0,2,H);D.q('.tm').textContent=fmt(p)+' / '+fmt(dur);
 if(D.playing)D.angle+=(D.effRate()*2*Math.PI*33.3/60)/30;D.q('.jog i').style.transform='rotate('+D.angle+'rad)';var J=D.q('.jog');J.style.setProperty('--ang',D.angle+'rad');J.classList.toggle('spin',D.playing)}
var lastF=0,vu,beatN=-1;
function loop(t){requestAnimationFrame(loop);if(document.hidden||t-lastF<33)return;lastF=t;decks.forEach(drawDeck);
 if(ANA){var g=fit(vu),W=vu.width,H=vu.height,e=energy();g.fillStyle='#000';g.fillRect(0,0,W,H);g.fillStyle=e.rms>.7?'#ff4081':'#00e5ff';g.fillRect(0,0,W*Math.min(1,e.rms*1.4),H)}
 var m=masterDeck();if(m&&m.playing&&AC){var b=Math.floor(AC.currentTime/beatSec());if(b!==beatN){beatN=b;if(aiFx&&b%8==0)aiTick();if(autoMix&&b-lastAuto>=64){lastAuto=b;if(lastAuto)autoTick()}}}}
/* ---------- boot ---------- */
function boot(){new Deck('A',$('#dA'),$('#mxA'),'#ffb300');new Deck('B',$('#dB'),$('#mxB'),'#ff4081');vu=$('#vu');
 $('#fxbar').innerHTML='<span class="small" style="align-self:center">FX (beat-sync):</span>'+[['echo','Echo ¾'],['reverb','Reverb'],['flanger','Flanger'],['sweep','Filter sweep'],['crush','Bitcrush'],['roll','Roll ⅛']].map(function(f){return '<button data-fx="'+f[0]+'">'+f[1]+'</button>'}).join('');
 document.querySelectorAll('#fxbar [data-fx]').forEach(function(b){var n=b.dataset.fx;if(n=='roll'){b.onpointerdown=function(){setFx('roll',true)};b.onpointerup=b.onpointerleave=function(){if(FX.roll&&FX.roll.on)setFx('roll',false)}}else b.onclick=function(){setFx(n,!(FX[n]&&FX[n].on))}});
 $('#sampler').innerHTML=PADS.map(function(p,i){return '<button data-p="'+i+'">'+p+'</button>'}).join('');document.querySelectorAll('#sampler button').forEach(function(b){b.onpointerdown=function(e){e.preventDefault();pad(+b.dataset.p)}});
 $('#xf').oninput=applyXf;$('#mvol').oninput=function(){if(AC)MASTER.gain.setTargetAtTime(+this.value,AC.currentTime,.02);decks.forEach(function(d){d.radioVol()})};
 $('#aifx').onclick=function(){aiFx=!aiFx;this.classList.toggle('on',aiFx);ctx();if(aiFx)aiTick();else{['echo','reverb','flanger','sweep','crush'].forEach(function(n){if(FX[n]&&FX[n].on)setFx(n,false)});stat('AI FX OFF')}};
 $('#aimix').onclick=function(){startAuto()};
 $('#fs').onclick=function(){var d=document;if(d.fullscreenElement)d.exitFullscreen();else(d.documentElement.requestFullscreen||function(){}).call(d.documentElement)};
 document.addEventListener('keydown',function(e){if(e.target.tagName=='INPUT'||e.target.tagName=='SELECT')return;var k=e.key.toLowerCase();if(k=='q')decks[0].q('.play').click();if(k=='p')decks[1].q('.play').click();var pi='12345678'.indexOf(k);if(pi>=0)pad(pi)});
 window.D7Auto=function(){if(!autoMix)startAuto(true);return 'auto-mix'};
 window.WeDJ={pre:function(){ctx();return PRE},master:function(){return masterDeck()},stat:function(t){stat(t)},xf:function(v){if(v==null)return +$('#xf').value;$('#xf').value=v;applyXf()},aiLog:aiLog,brainAsk:brainAsk,decks:decks,fx:setFx,pad:pad,auto:startAuto,ctx:function(){return AC},detectBpm:detectBpm};
 requestAnimationFrame(loop);stat('gotowe · wybierz utwór (🎵 demo / 📻 radio / 💾 plik)')}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
