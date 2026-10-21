/* D7 Udostępnij — Web Share API + plain intent links (no auto-posting) */
(function(){
function mount(el){
 var path=el.getAttribute('data-d7share')||'/mobile/',url=location.origin+path,txt='D7 DJ · D-BOT Mobile Sync – Daniel Dydo';
 var e=encodeURIComponent,u=e(url),t=e(txt);
 el.classList.add('d7share');
 el.innerHTML='<h3>🔗 Udostępnij</h3><div class="row">'+
  (navigator.share?'<button class="d7b on" data-s>📤 Udostępnij…</button>':'')+
  '<button class="d7b" data-cp>📋 Kopiuj link</button>'+
  '<a class="d7b" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url='+u+'&text='+t+'">X</a>'+
  '<a class="d7b" target="_blank" rel="noopener" href="https://wa.me/?text='+t+'%20'+u+'">WhatsApp</a>'+
  '<a class="d7b" target="_blank" rel="noopener" href="https://t.me/share/url?url='+u+'&text='+t+'">Telegram</a>'+
  '<a class="d7b" target="_blank" rel="noopener" href="https://www.reddit.com/submit?url='+u+'&title='+t+'">Reddit</a>'+
  '<a class="d7b" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u='+u+'">Facebook</a>'+
  '</div><div class="note">Link: <span class="lnk"></span> · nic nie jest publikowane automatycznie.</div>';
 el.querySelector('.lnk').textContent=url;
 el.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-s'))navigator.share({title:txt,url:url}).catch(function(){});
  if(b.hasAttribute('data-cp')){if(window.D7Pay)D7Pay.copy(url,b);else if(navigator.clipboard)navigator.clipboard.writeText(url)}})}
function init(){document.querySelectorAll('[data-d7share]').forEach(mount)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
