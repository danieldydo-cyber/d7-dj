/* D7 verified radio stations (checked 2026-10-14: HTTP 200 audio + Access-Control-Allow-Origin, so WebAudio capture works) */
window.D7_STATIONS=[
 ['SomaFM DEF CON (techno/elektronika)','https://ice1.somafm.com/defcon-128-mp3'],
 ['SomaFM Beat Blender (deep house)','https://ice2.somafm.com/beatblender-128-mp3'],
 ['SomaFM Fluid (instrumental hip-hop)','https://ice2.somafm.com/fluid-128-mp3'],
 ['SomaFM Groove Salad (chill)','https://ice2.somafm.com/groovesalad-128-mp3'],
 ['SomaFM Space Station','https://ice2.somafm.com/spacestation-128-mp3'],
 ['Bassdrive (drum & bass)','https://ice.bassdrive.net/stream'],
 ['RMF MAXXX','https://rs101-krk.rmfstream.pl/RMFMAXXX48'],
 ['RMF FM','https://rs101-krk.rmfstream.pl/RMFFM48'],
 ['Radio Paradise','https://stream.radioparadise.com/mp3-128']];
/* play url on an <audio>, auto-failover to the next station on error/stall. onState(msg, idx) */
window.D7Radio=function(el,startIdx,onState){var S=window.D7_STATIONS,i=startIdx||0,tries=0,stallT;
 function go(k){i=(k+S.length)%S.length;clearTimeout(stallT);el.src=S[i][1];onState&&onState('łączę: '+S[i][0],i);
  var p=el.play();if(p&&p.catch)p.catch(function(e){if(e&&e.name=='NotAllowedError'){onState&&onState('kliknij ▶, aby włączyć dźwięk (blokada autoodtwarzania)',i);return}fail('play: '+(e&&e.message))});
  stallT=setTimeout(function(){if(el.readyState<3&&!el.paused)fail('timeout')},12000)}
 function fail(why){clearTimeout(stallT);if(++tries>S.length){onState&&onState('żadna stacja nie odpowiada ('+why+')',i);return}onState&&onState('✖ '+S[i][0]+' ('+why+') → następna',i);go(i+1)}
 el.addEventListener('error',function(){if(el.src)fail('błąd strumienia')});el.addEventListener('stalled',function(){stallT=setTimeout(function(){if(el.readyState<3)fail('zacięcie')},8000)});
 el.addEventListener('playing',function(){tries=0;clearTimeout(stallT);onState&&onState('▶ gra: '+S[i][0],i)});
 return{play:function(k){tries=0;go(k==null?i:k)},next:function(){tries=0;go(i+1)},stop:function(){clearTimeout(stallT);el.pause();el.removeAttribute('src');el.load();onState&&onState('stop',i)},idx:function(){return i}}};
