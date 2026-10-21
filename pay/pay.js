/* D7 Wesprzyj / Płatności — info only. No payment processing, no external APIs. */
(function(){
var BLIK='730377357',IBAN='PL45187010452083105875760001',NAME='Daniel Dydo';
function fmtIban(s){return s.replace(/(.{4})/g,'$1 ').trim()}
function copy(t,b){var done=function(){if(b){var o=b.textContent;b.textContent='✔ Skopiowano';setTimeout(function(){b.textContent=o},1500)}};
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,function(){fb(t);done()});else{fb(t);done()}}
function fb(t){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove()}
function svg(text){if(!window.qrcode)return'<b>QR lib missing</b>';qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];var q=qrcode(0,'M');q.addData(text,'Byte');q.make();return q.createSvgTag({cellSize:4,margin:4,scalable:true})}
function clean(s,n){return (s||'').replace(/\|/g,' ').trim().slice(0,n)}
/* ZBP "QR przelew": NIP|PL|NRB(26)|kwota w groszach (6 cyfr)|nazwa (max 20)|tytul (max 32)||| */
function zbp(amountZl,title){var g=Math.round((parseFloat(String(amountZl).replace(',','.'))||0)*100);if(g<0)g=0;if(g>999999)g=999999;
 return '|PL|'+IBAN.slice(2)+'|'+('000000'+g).slice(-6)+'|'+clean(NAME,20)+'|'+clean(title||'Wsparcie D7 DJ',32)+'|||'}
window.D7Pay={zbp:zbp,svg:svg,copy:copy};
function mount(el){
 el.classList.add('d7pay');
 el.innerHTML='<h3>💸 Wesprzyj / Płatności</h3>'+
 '<div class="row"><span class="lab">BLIK (przelew na telefon)</span><span class="val">730 377 357</span><span>· '+NAME+'</span><button class="d7b" data-c="'+BLIK+'">📋 Kopiuj numer</button></div>'+
 '<div class="row"><span class="lab">Nest Bank IBAN</span><span class="val">'+fmtIban(IBAN)+'</span><button class="d7b" data-c="'+IBAN+'">📋 Kopiuj IBAN</button><button class="d7b" data-c="'+IBAN.slice(2)+'">📋 Bez PL</button></div>'+
 '<div class="row"><span class="lab">Odbiorca</span><span class="val">'+NAME+'</span><button class="d7b" data-c="'+NAME+'">📋 Kopiuj</button></div>'+
 '<div class="row"><span class="lab">Kwota</span><button class="d7b am" data-a="10">10 zł</button><button class="d7b am on" data-a="20">20 zł</button><button class="d7b am" data-a="50">50 zł</button><button class="d7b am" data-a="100">100 zł</button><input class="amt" type="number" min="0" max="9999" step="1" value="20" aria-label="Własna kwota"> zł</div>'+
 '<div class="row"><span class="lab">Tytuł</span><input class="t" maxlength="32" value="Wsparcie D7 DJ"><button class="d7b pk tc">📋 Kopiuj tytuł</button></div>'+
 '<div class="qrs"><div class="qr"><div class="q1"></div><b>QR przelew (ZBP)</b><br>zeskanuj w aplikacji banku</div><div class="qr"><div class="q2"></div><b>Numer telefonu BLIK</b><br>(tylko numer – wpisz w BLIK „przelew na telefon”)</div></div>'+
 '<div class="note">Dane QR: <code class="raw"></code><br>Tylko informacja – strona nie przetwarza płatności, nie zbiera danych kart i nie łączy się z żadnym zewnętrznym API płatności.</div>';
 var amt=el.querySelector('.amt'),t=el.querySelector('input.t');
 function upd(){var s=zbp(amt.value,t.value);el.querySelector('.q1').innerHTML=svg(s);el.querySelector('.raw').textContent=s;el.dataset.zbp=s}
 el.querySelector('.q2').innerHTML=svg(BLIK);
 el.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.c)copy(b.dataset.c,b);
  if(b.dataset.a){amt.value=b.dataset.a;el.querySelectorAll('.am').forEach(function(x){x.classList.toggle('on',x===b)});upd()}
  if(b.classList.contains('tc'))copy(t.value,b)});
 amt.addEventListener('input',function(){el.querySelectorAll('.am').forEach(function(x){x.classList.toggle('on',x.dataset.a===amt.value)});upd()});t.addEventListener('input',upd);upd()}
function init(){var els=document.querySelectorAll('[data-d7pay]');els.forEach(mount)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
