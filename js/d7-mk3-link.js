/* D · 2026-11-18: pływające linki do MK3 Pads + Multitool Studio (pod linkami x77). Względne ścieżki. */
(function(){if(window.__d7mk3link)return;window.__d7mk3link=1;var s=document.currentScript;var base=s&&s.src?s.src.replace(/js\/d7-mk3-link\.js.*$/,''):'./';
function go(){if(document.getElementById('d7-mk3-link')||!document.body)return;var d=document.createElement('div');d.id='d7-mk3-link';
d.style.cssText='position:fixed;left:10px;top:calc(46px + env(safe-area-inset-top));z-index:2147482989;display:flex;gap:6px;font:800 12px system-ui,sans-serif';
var b='color:#000;padding:6px 10px;border:2px solid #000;text-decoration:none;text-transform:uppercase;';
d.innerHTML='<a id="d7-mk3-btn" href="'+base+'mk3.html" style="'+b+'background:#ff2bd6;box-shadow:3px 3px 0 #00f0ff">🥁 MK3 Pads</a><a id="d7-studio-btn" href="'+base+'studio/" style="'+b+'background:#39ff14;box-shadow:3px 3px 0 #b84dff">🧪 Multitool Studio</a>';
if(/github\.io$/.test(location.hostname)){var sb=d.querySelector('#d7-studio-btn');if(sb)sb.remove()}/* 2026-11-24: studio/ tylko na tunelu */
document.body.appendChild(d)}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
