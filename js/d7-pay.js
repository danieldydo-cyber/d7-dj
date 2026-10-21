/* D7 Wesprzyj / Kup — manual payments info only. No checkout; payments are confirmed manually. */
(function(){
  if (window.__d7pay) return; window.__d7pay = 1;
  var BLIK='730377357', IBAN='PL45 1870 1045 2083 1058 7576 0001', NAME='Daniel Dydo', WA='https://wa.me/48730377357';
  function copy(t,b){var done=function(){var o=b.textContent;b.textContent='✓ Skopiowano';setTimeout(function(){b.textContent=o},1500)};
    if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(done,function(){fb(t);done()})}else{fb(t);done()}}
  function fb(t){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove()}
  function build(){
    var s=document.createElement('section');s.id='d7-pay';
    s.setAttribute('style','display:block;max-width:560px;margin:16px auto;padding:14px;border:1px solid #f4a;border-radius:12px;background:#1a0a14;color:#fde;font-family:system-ui,sans-serif;font-size:14px;line-height:1.4');
    s.innerHTML='<h3 style="margin:0 0 8px;color:#f8c">💖 Wesprzyj / Kup</h3>'+
      '<p style="margin:4px 0">BLIK na telefon: <b>730 377 357</b> <button data-c="'+BLIK+'">📋 Kopiuj</button></p>'+
      '<p style="margin:4px 0">Przelew (Nest Bank): <b>'+IBAN+'</b><br>Odbiorca: <b>'+NAME+'</b> <button data-c="'+IBAN.replace(/ /g,'')+'">📋 Kopiuj IBAN</button></p>'+
      '<p style="margin:8px 0"><a href="'+WA+'" target="_blank" rel="noopener" style="background:#25d366;color:#000;padding:8px 12px;border-radius:8px;text-decoration:none;font-weight:bold">💬 WhatsApp</a></p>'+
      '<p style="margin:4px 0;font-size:12px;opacity:.8">W tytule wpisz, za co płacisz. Płatności są sprawdzane ręcznie — po przelewie napisz na WhatsApp.</p>';
    s.querySelectorAll('button[data-c]').forEach(function(b){b.setAttribute('style','background:#511;color:#fcc;border:1px solid #f44;border-radius:6px;padding:4px 8px;cursor:pointer');b.onclick=function(){copy(b.getAttribute('data-c'),b)}});
    document.body.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
