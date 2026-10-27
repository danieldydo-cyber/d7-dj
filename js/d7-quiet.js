/* D7 quiet-401 (x77): bez tokenu admina POST do endpointów zablokowanych (bot-mesh/register, grok-bridge, bot-learn, remote-queue)
   nie generuje 401 w konsoli — zwraca {locked:true} 200 lokalnie. Z tokenem (localStorage d7.tok) nic nie zmienia. Ładować PO d7-token.js. */
(function(){if(window.__d7quiet)return;window.__d7quiet=1;var F=window.fetch;if(!F)return;
var RX=/^\/api\/(bot-mesh\/register|grok-bridge|bot-learn|remote-queue|owner-session)$/;
window.fetch=function(u,o){try{var s=typeof u=='string'?u:(u&&u.url)||'';var a=new URL(s,location.href);
 if(a.origin==location.origin&&RX.test(a.pathname)){var t='';try{t=localStorage.getItem('d7.tok')}catch(e){}
  if(!t)return Promise.resolve(new Response('{"ok":false,"locked":true}',{status:200,headers:{'Content-Type':'application/json','X-D7-Locked':'1'}}))}}catch(e){}
 return F.apply(this,arguments)}})();
