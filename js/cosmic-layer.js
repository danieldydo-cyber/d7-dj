/* v77 👽 cosmic layer: floating beat-synced star-shark + UFO/alien over any viz (MilkDrop/3D/shark). Toggle 👽 (also added to the 7D control bar).
   Overlay only (pointer-events:none) – v71 viz files untouched. GXCosmic.draw() is reused by Mix Visuals 778. */
(function(){if(window.GXCosmic)return;var s=document.currentScript&&document.currentScript.src||'',root=s?s.replace(/js\/[^/]*$/,''):'';
var shark=new Image();shark.src=root+'img/star-shark.png';
function lv(){return window.GXAudio?GXAudio.level():{level:0.3+0.3*Math.sin(performance.now()/250),beat:false}}
var C=window.GXCosmic={on:localStorage.getItem('gx_alien')==='1',shark:shark,pulse:0,
 draw:function(x,w,h,t,a,o){o=o||{};a=a||lv();if(a.beat)C.pulse=1;C.pulse*=0.9;var k=o.intensity||1,sp=o.speed||1,p=C.pulse;
  // star-shark swims a lissajous path
  if(o.shark!==false&&shark.complete&&shark.naturalWidth){var sz=Math.min(w,h)*(0.22+0.1*p*k),sx=w/2+Math.sin(t*0.00031*sp)*w*0.38,sy=h/2+Math.sin(t*0.00047*sp)*h*0.3,dir=Math.cos(t*0.00031*sp)>0?-1:1;
   x.save();x.translate(sx,sy);x.scale(dir,1);x.rotate(Math.sin(t*0.002*sp)*0.12);x.globalAlpha=0.92;x.shadowColor='#ffd23f';x.shadowBlur=20+40*p;x.drawImage(shark,-sz/2,-sz/2,sz,sz);x.restore()}
  if(o.alien===false)return;
  // UFO
  var ux=w/2+Math.sin(t*0.0006*sp+2)*w*0.35,uy=h*0.22+Math.sin(t*0.0013*sp)*h*0.08,r=Math.min(w,h)*(0.09+0.03*p*k);
  x.save();var g=x.createLinearGradient(ux,uy,ux,h);g.addColorStop(0,'rgba(120,255,160,'+(0.25+0.4*p)+')');g.addColorStop(1,'rgba(120,255,160,0)');x.fillStyle=g;x.beginPath();x.moveTo(ux-r*0.4,uy);x.lineTo(ux+r*0.4,uy);x.lineTo(ux+r*1.6,h);x.lineTo(ux-r*1.6,h);x.fill();
  x.fillStyle='#9ef7ff';x.beginPath();x.ellipse(ux,uy-r*0.25,r*0.45,r*0.4,0,Math.PI,0);x.fill();
  x.fillStyle='#7d8cff';x.shadowColor='#0ff';x.shadowBlur=15+30*p;x.beginPath();x.ellipse(ux,uy,r,r*0.32,0,0,Math.PI*2);x.fill();
  for(var i=0;i<6;i++){x.fillStyle='hsl('+((t/5+i*60)%360)+',100%,'+(55+30*p)+'%)';x.beginPath();x.arc(ux-r*0.75+i*r*0.3,uy+r*0.05,r*0.07,0,7);x.fill()}
  // alien in the beam, bouncing on beat
  var ay=uy+r*1.6+Math.sin(t*0.004*sp)*r*0.2-p*r*0.4,ar=r*0.45;x.shadowBlur=10;x.fillStyle='#5dff7a';x.beginPath();x.ellipse(ux,ay,ar*0.8,ar,0,0,7);x.fill();
  x.fillStyle='#000';x.beginPath();x.ellipse(ux-ar*0.32,ay-ar*0.1,ar*0.22,ar*0.34,-0.5,0,7);x.ellipse(ux+ar*0.32,ay-ar*0.1,ar*0.22,ar*0.34,0.5,0,7);x.fill();
  x.strokeStyle='#5dff7a';x.lineWidth=3;x.beginPath();x.moveTo(ux-ar*0.3,ay-ar*0.9);x.lineTo(ux-ar*0.5,ay-ar*1.4-p*8);x.moveTo(ux+ar*0.3,ay-ar*0.9);x.lineTo(ux+ar*0.5,ay-ar*1.4-p*8);x.stroke();x.restore()},
 toggle:function(v){C.on=v===undefined?!C.on:v;localStorage.setItem('gx_alien',C.on?'1':'0');cv.style.display=C.on?'block':'none';btns.forEach(function(b){b.style.background=C.on?'#00c853':'#222'});if(C.on)loop()}};
var cv=document.createElement('canvas'),x=cv.getContext('2d'),btns=[];cv.id='gxCosmic';cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:2147482000;pointer-events:none;display:none';
var raf=0;function loop(){cancelAnimationFrame(raf);if(!C.on)return;var w=cv.width=innerWidth*Math.min(devicePixelRatio,2),h=cv.height=innerHeight*Math.min(devicePixelRatio,2);x.clearRect(0,0,w,h);C.draw(x,w,h,performance.now());raf=requestAnimationFrame(loop)}
function mk(style){var b=document.createElement('button');b.type='button';b.textContent='👽';b.title='👽 Kosmita + gwiezdny rekin (warstwa viz)';b.style.cssText=style;b.onclick=function(){C.toggle()};btns.push(b);return b}
function init(){document.body.appendChild(cv);document.body.appendChild(mk('position:fixed;left:10px;bottom:128px;z-index:2147483001;border:0;border-radius:999px;padding:6px 10px;font:16px system-ui;color:#fff;background:#222'));
 var tries=0,iv=setInterval(function(){var bar=document.getElementById('d7ctl');if(bar&&!bar.querySelector('.gxAlienBtn')){var b=mk('border:0;border-radius:10px;padding:4px 8px;margin:2px;font:16px system-ui;color:#fff;background:#222');b.className='gxAlienBtn';bar.appendChild(b);var m=document.createElement('a');m.className='gxMixBtn';m.href=root+'mixviz.html';m.textContent='🌀778';m.title='Mix Visuals 778';m.style.cssText='display:inline-block;border-radius:10px;padding:4px 8px;margin:2px;font:700 13px system-ui;color:#fff;background:#6b21ff;text-decoration:none';bar.appendChild(m);C.toggle(C.on)}if(++tries>20||bar)clearInterval(iv)},700);C.toggle(C.on)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();
