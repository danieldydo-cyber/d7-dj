/* x77: pływający link do D Unit · Super SI + Visions (dodawany na stronach głównych). Względne ścieżki. */
(function(){if(window.__x77link)return;window.__x77link=1;function go(){if(document.getElementById('x77-dlink')||!document.body)return;
var s=document.currentScript||document.querySelector('script[src*="x77-dunit-link"]');var base=s&&s.src?s.src.replace(/js\/x77-dunit-link\.js.*$/,''):'/';
var d=document.createElement('div');d.id='x77-dlink';d.style.cssText='position:fixed;left:10px;top:calc(10px + env(safe-area-inset-top));z-index:2147482990;display:flex;gap:6px;font:800 12px system-ui,sans-serif';
d.innerHTML='<a href="'+base+'dunit/" style="background:#ffcc00;color:#000;padding:6px 10px;border:2px solid #000;box-shadow:3px 3px 0 #ff2bd6;text-decoration:none;text-transform:uppercase">🏛 D Unit · Super SI</a><a href="'+base+'visions.html" style="background:#00e5ff;color:#000;padding:6px 10px;border:2px solid #000;box-shadow:3px 3px 0 #ff6a1a;text-decoration:none;text-transform:uppercase">✨ Visions 77</a>';
document.body.appendChild(d)}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
