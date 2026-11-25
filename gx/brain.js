/* Ghost X G 🐲 ⚡ Supercharger AI brain (v1.4)
   - offline in-browser LLM: WebLLM (WebGPU, q4f16) → transformers.js (WASM, q4); model files cached by the libs in Cache API
   - token streaming (local + Pollinations SSE), race online vs WebGPU-offline → first token wins
   - background prewarm on idle if model was downloaded, recent-answer cache, short system prompt
   - fallback: Pollinations online → rule-based offline. No keys, no secrets. */
(function(){
var G=window.GXBrain={engine:null,kind:'rules',status:'⚡ Supercharger AI · reguły offline (pobierz mózg, aby mieć AI bez internetu)',onstatus:null,last:null,label:'⚡ Supercharger AI'};
var TIER=+(localStorage.getItem('gx_tier')||(localStorage.getItem('gx_full')==='1'?1:0)),BG=localStorage.getItem('gx_big')||'0';if(BG==='3'&&TIER<2)BG='1';if(BG==='1'&&TIER<1)BG='0';G.big=BG;
var WEBLLM_MODEL={'0':'Qwen2.5-0.5B-Instruct-q4f16_1-MLC','1':'Qwen2.5-1.5B-Instruct-q4f16_1-MLC','3':'Qwen2.5-3B-Instruct-q4f16_1-MLC'}[BG], TJS_MODEL=BG==='0'?'onnx-community/Qwen2.5-0.5B-Instruct':'onnx-community/Qwen2.5-1.5B-Instruct';var MN={'0':'Qwen2.5-0.5B','1':'Qwen2.5-1.5B','3':'Qwen2.5-3B'}[BG];
var SYS='Jesteś Ghost X G 🐲, asystent DJ DaX (Kraków). Odpowiadaj krótko po polsku.';
function st(s){G.status=s;if(G.onstatus)G.onstatus(s)}
G.hasWebGPU=function(){return !!navigator.gpu};
G.isDownloaded=function(){return localStorage.getItem('gx_model')||''};
var loading=null;
G.load=function(){if(G.engine)return Promise.resolve(G.kind);if(loading)return loading;loading=(async function(){var t0=performance.now();
  var pref=G.isDownloaded()||(G.hasWebGPU()?'webllm':'tjs');
  if(pref==='webllm'&&G.hasWebGPU()){try{
    st('⚡ Ładuję WebLLM (WebGPU, q4)…');var w=await import('https://esm.run/@mlc-ai/web-llm');
    G.engine=await w.CreateMLCEngine(WEBLLM_MODEL,{initProgressCallback:function(p){st('⚡ '+MN+': '+Math.round((p.progress||0)*100)+'% '+(p.text||'').slice(0,50))}});
    G.kind='webllm';localStorage.setItem('gx_model','webllm');G.loadMs=Math.round(performance.now()-t0);st('⚡ Supercharger AI: '+MN+' (WebGPU) gotowy · '+G.loadMs+' ms');return G.kind}catch(e){console.warn('webllm',e);st('WebGPU niedostępne – WASM…')}}
  try{
    var t=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');t.env.allowLocalModels=false;t.env.useBrowserCache=true;G.tjs=t;
    G.engine=await t.pipeline('text-generation',TJS_MODEL,{dtype:'q4',device:G.hasWebGPU()?'webgpu':'wasm',progress_callback:function(p){if(p.status==='progress')st('⚡ '+MN+': '+(p.file||'')+' '+Math.round(p.progress||0)+'%')}});
    G.kind='tjs';localStorage.setItem('gx_model','tjs');G.loadMs=Math.round(performance.now()-t0);st('⚡ Supercharger AI: '+(BG==='3'?'Qwen2.5-1.5B':MN)+' (transformers.js q4) gotowy · '+G.loadMs+' ms');return G.kind}catch(e){console.warn('tjs',e);st('Nie udało się pobrać modelu: '+String(e.message||e).slice(0,80)+' – online/reguły')}
  loading=null;return 'rules'})();return loading};
async function local(msgs,tok,ab){
  if(G.kind==='webllm'){var s=await G.engine.chat.completions.create({messages:msgs,max_tokens:200,temperature:0.6,stream:true}),out='';
    for await(var ch of s){if(ab.stop){try{G.engine.interruptGenerate()}catch(e){}break}var d=ch.choices[0]&&ch.choices[0].delta&&ch.choices[0].delta.content;if(d){out+=d;tok(out)}}return out}
  if(G.kind==='tjs'){var out2='';var str=new G.tjs.TextStreamer(G.engine.tokenizer,{skip_prompt:true,skip_special_tokens:true,callback_function:function(x){out2+=x;tok(out2)}});
    var o=await G.engine(msgs,{max_new_tokens:140,do_sample:false,repetition_penalty:1.1,streamer:str});var g=o[0].generated_text;return out2||(Array.isArray(g)?g[g.length-1].content:String(g))}
  throw 0}
async function online(msgs,tok,ab){
  var c=new AbortController();ab.online=c;var to=setTimeout(function(){c.abort()},12000);
  var r=await fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'openai',messages:msgs,stream:true}),signal:c.signal});
  if(!r.ok)throw r.status;var out='';
  if(r.body&&/event-stream/.test(r.headers.get('content-type')||'')){var rd=r.body.getReader(),dec=new TextDecoder(),buf='';
    var done=false;try{while(!done){var x=await rd.read();if(x.done)break;buf+=dec.decode(x.value,{stream:true});var ls=buf.split('\n');buf=ls.pop();
      ls.forEach(function(l){l=l.trim();if(l.indexOf('data:')!==0)return;var d=l.slice(5).trim();if(d==='[DONE]'){done=true;return}try{var j=JSON.parse(d),t=j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content;if(t){out+=t;tok(out);clearTimeout(to);to=setTimeout(function(){c.abort()},8000)}}catch(e){}})}}catch(e){if(!out)throw e}try{rd.cancel()}catch(e){}}
  else{var j=await r.json();out=j.choices[0].message.content;tok(out)}
  clearTimeout(to);if(!out)throw 'empty';return out}
var RULES=[[/cze|hej|siema|witam/i,'Siema! Tu Ghost X G 🐲 – DJ DaX z Krakowa. W czym pomóc?'],[/bpm|tempo/i,'Hip-hop: 85–100 BPM, house: 120–128, techno: 128–140, DnB: 170–175. Miksuj w zakresie ±6%.'],[/mix|miks|przej/i,'Przejście: zgraj BPM, wejdź na 16 lub 32 takcie, utnij basy (EQ low) w jednym utworze i płynnie zamień.'],[/kraków|krakow/i,'Kraków 🐉 – Smok Wawelski pozdrawia! Kluby: Kazimierz, Rynek, Zabłocie.'],[/płat|kup|pełn|cena|sklep/i,'Ghost X G jest w 100% darmowy. 💎 Ghost Open SI 5 zł / 1 € / 1 $, 👑 Maxi Ghost SI 99 € / 50 zł – 🛒 Sklep.'],[/godz|czas|data/i,function(){return 'Teraz: '+new Date().toLocaleString('pl-PL')}],[/pomoc|help|co umiesz/i,'Umiem: czat, autoboty, porady DJ. Offline po pobraniu mózgu AI.']];
function rules(q){for(var i=0;i<RULES.length;i++)if(RULES[i][0].test(q)){var a=RULES[i][1];return typeof a=='function'?a():a}return 'Jestem offline bez modelu. Pobierz 🧠 mózg AI (jednorazowo), a odpowiem bez internetu. Zapytaj o: BPM, miks, Kraków, pomoc.'}
// recent-answer cache (only single-turn questions; 60 entries, 24 h)
function ck(q,s){return (s||'')+'|'+q.trim().toLowerCase().replace(/\s+/g,' ')}
function cget(k){try{var c=JSON.parse(localStorage.getItem('gx_acache')||'{}'),e=c[k];return e&&Date.now()-e.t<864e5?e:null}catch(e){return null}}
function cput(k,a,src){try{var c=JSON.parse(localStorage.getItem('gx_acache')||'{}');c[k]={a:a,src:src,t:Date.now()};var ks=Object.keys(c);if(ks.length>60){ks.sort(function(x,y){return c[x].t-c[y].t});ks.slice(0,ks.length-60).forEach(function(x){delete c[x]})}localStorage.setItem('gx_acache',JSON.stringify(c))}catch(e){}}
G.ask=async function(q,hist,opts){opts=opts||{};var t0=performance.now(),tok=opts.onToken||function(){};var sys=opts.system||SYS;
  var single=!(hist&&hist.length),key=ck(q,opts.system);if(single&&!opts.nocache){var c=cget(key);if(c){tok(c.a);return G.last={a:c.a,src:c.src+' · ⚡ cache',ms:Math.round(performance.now()-t0),first:0}}}
  var msgs=[{role:'system',content:sys}].concat((hist||[]).slice(-6)).concat([{role:'user',content:q}]);
  var allowLocal=opts.local!==false,ab={},winner=null,first=null;
  function mk(name){return function(txt){if(!winner){winner=name;first=Math.round(performance.now()-t0);if(name!=='online'&&ab.online)try{ab.online.abort()}catch(e){} if(name==='online')ab.stop=true}if(winner===name)tok(txt)}}
  var lsrc=G.kind==='webllm'?'🧠 offline '+MN+' (WebGPU)':'🧠 offline '+MN;
  var tasks=[];
  if(allowLocal&&G.engine&&(G.kind==='webllm'||!navigator.onLine))tasks.push(local(msgs,mk('local'),ab).then(function(a){return {a:a,src:lsrc,n:'local'}}));
  if(navigator.onLine&&opts.online!==false)tasks.push(online(msgs,mk('online'),ab).then(function(a){return {a:a,src:'🌐 Pollinations',n:'online'}}));
  if(allowLocal&&G.engine&&G.kind==='tjs'&&navigator.onLine)tasks.push(new Promise(function(res,rej){setTimeout(function(){if(winner)return rej('late');local(msgs,mk('local'),ab).then(function(a){res({a:a,src:lsrc,n:'local'})},rej)},6000)}));
  var r=null;if(tasks.length){var settled=tasks.map(function(p){return p.then(function(v){return v},function(){return null})});
    r=await new Promise(function(res){var left=settled.length;settled.forEach(function(p){p.then(function(v){if(v&&(!winner||v.n===winner)&&v.a)res(v);else if(--left===0)res(null)})})})}
  if(!r){var a=rules(q);tok(a);r={a:a,src:'📘 reguły offline'};first=Math.round(performance.now()-t0)}
  r.ms=Math.round(performance.now()-t0);r.first=first;if(single&&r.src.indexOf('reguły')<0)cput(key,r.a,r.src);return G.last=r};
G.autoload=function(){if(!G.isDownloaded())return;var go=function(){G.load()};if(window.requestIdleCallback)requestIdleCallback(go,{timeout:3000});else setTimeout(go,1500)};
})();
