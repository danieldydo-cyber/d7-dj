/* v77 single version: every page/build reads version.json and shows "v77 · C Mass G Unit 🐲". */
(function(){if(window.__gxver)return;window.__gxver=1;var s=document.currentScript&&document.currentScript.src||'',root=s?s.replace(/js\/[^/]*$/,''):'';
function show(v){window.GXVersion=v;var b=document.createElement('a');b.id='gxVer';b.href=root+(v.entry||'v77.html');b.textContent=v.brand||('v'+v.version);b.style.cssText='position:fixed;top:calc(env(safe-area-inset-top,0px) + 4px);left:6px;z-index:2147483003;background:#0009;color:#ffd23f;padding:2px 8px;border-radius:999px;font:700 11px system-ui;text-decoration:none;pointer-events:auto';document.body.appendChild(b)}
function go(){fetch(root+'version.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(show).catch(function(){show({version:'77',brand:'v77 · C Mass G Unit 🐲',entry:'v77.html'})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go()})();
