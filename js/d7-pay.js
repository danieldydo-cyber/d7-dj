/* D7 💳 Wsparcie — shared dock button + modal (all pages). Info only: no payment processing, no external keys.
   Reuses pay/pay.js (ZBP QR przelew, copy buttons) + pay/qrcode.js (local QR generator). */
(function(){
  if (window.__d7pay2) return; window.__d7pay2 = 1;
  var base=(function(){var s=document.currentScript&&document.currentScript.src||'';return s?s.replace(/js\/d7-pay\.js.*$/,''):''})();
  var WA='https://wa.me/48730377357?text='+encodeURIComponent('Cześć DJ DaX! Wsparcie D7 DJ 💳');
  function load(src,css){return new Promise(function(r){var e=document.createElement(css?'link':'script');if(css){e.rel='stylesheet';e.href=src}else{e.src=src}e.onload=e.onerror=function(){r()};document.head.appendChild(e)})}
  var css='#d7p-btn{position:fixed;left:12px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:2147483000;background:linear-gradient(135deg,#ff2d7a,#7a2dff);color:#fff;border:0;border-radius:24px;padding:10px 14px;font:700 14px system-ui,sans-serif;box-shadow:0 0 14px #ff2d7a88;cursor:pointer}'+
   '#d7p-m{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.8);display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:14px 8px}'+
   '#d7p-m.on{display:flex}#d7p-m .bx{background:#07070d;border:1px solid #ff2d7a;border-radius:14px;max-width:640px;width:100%;padding:12px;color:#eef;font:14px system-ui,sans-serif;position:relative}'+
   '#d7p-m .x{position:absolute;right:8px;top:6px;background:none;border:0;color:#fff;font-size:24px;cursor:pointer}#d7p-m a.wa{display:inline-block;margin:8px 6px 0 0;padding:8px 12px;border-radius:10px;background:#25d366;color:#031;font-weight:700;text-decoration:none}'+
   '#d7p-m .soon{margin-top:8px;padding:8px;border:1px dashed #7a2dff;border-radius:10px;color:#cbf}';
  function ui(){
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var b=document.createElement('button');b.id='d7p-btn';b.type='button';b.textContent='💳 Wsparcie';b.title='Wesprzyj DJ DaX (BLIK / przelew)';
    var m=document.createElement('div');m.id='d7p-m';
    m.innerHTML='<div class="bx"><button class="x" aria-label="Zamknij">×</button><div class="slot"></div>'+
      '<a class="wa" href="'+WA+'" target="_blank" rel="noopener">💬 WhatsApp 730 377 357</a>'+
      '<a class="wa" style="background:#00f0ff" href="'+base+'pay.html">🔗 Strona płatności</a>'+
      '<a class="wa" style="background:#ff2d7a;color:#fff" href="'+base+'prezent.html">🎁 Prezent</a>'+
      '<a class="wa" style="background:linear-gradient(90deg,#00ffd5,#ff00e6);color:#000" href="'+base+'sklep.html">🛒 Sklep</a>'+
      '<div class="soon">💳 Płatności kartą (Stripe) — <b>wkrótce</b>.</div></div>';
    document.body.appendChild(b);document.body.appendChild(m);
    var loaded=false;
    function open(){m.classList.add('on');if(loaded)return;loaded=true;
      m.querySelector('.slot').setAttribute('data-d7pay','');
      load(base+'pay/pay.css',1);load(base+'pay/qrcode.js').then(function(){return load(base+'pay/pay.js')})}
    b.onclick=open;m.querySelector('.x').onclick=function(){m.classList.remove('on')};
    m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('on')});
    window.D7PayOpen=open; if(/[#&]pay\b/.test(location.hash))open();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ui);else ui();
})();
