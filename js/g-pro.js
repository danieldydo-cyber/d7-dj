/* Super Bot G Pro: G hero chat, multibot (bots.json + /api/bots), hands-free AUTO mode (G talks, cycles MilkDrop + radio). */
(function () {
  var O = window.ONE, P = window.ONEPRO; if (!O) return;
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ICON = { G: '👑', SuperGrok: '🔭', '77': '7️⃣', DargonMoon: '🌙', AutoFix: '🩺', SuperCharger: '⚡', D: '👽', Dragon: '🐉', SuperBotD: '🦸', MoePieseDevil: '😈' };
  var SERVER_ID = { G: 'superg', SuperGrok: 'supergrok', '77': '77', DargonMoon: 'dargonmoon', AutoFix: 'autofix', SuperCharger: 'supercharger', D: 'd', Dragon: 'dragon', SuperBotD: 'superbotd' };
  var PERSONA = { MoePieseDevil: 'You are MoePieseDevil, the devilish hype-man of the D7 crew: cheeky, funny, short, but always helpful.', G: 'You are G (Super Bot G), the leader and auto-host DJ of the D7 crew from Kraków.' };
  var G = window.GPRO = { bots: [], auto: false, timers: [], log: [] };
  var BOTS_DEFAULT = ['G', 'SuperGrok', 'SuperBotD', 'SuperCharger', 'AutoFix', 'DargonMoon', 'D', 'Dragon', '77', 'MoePieseDevil'];

  function ask(name, q, lang) {
    var sid = SERVER_ID[name], ctx = (P && P.askBot) ? null : null;
    function client() { return O.pollClient({ name: name, persona: PERSONA[name] || '' }, q, lang || 'pl').then(function (a) { return { text: a, src: 'pollinations-client' }; }); }
    if (!sid) return client().catch(function () { return { text: window.D7Answers.answer(q, { lang: lang || 'pl' }), src: 'local' }; });
    var ctl = new AbortController(); setTimeout(function () { ctl.abort(); }, 40000);
    return fetch('/api/brain', { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: q, bot: sid, lang: lang || 'pl' }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { var a = (j.answer || j.reply || '').replace(/^\s*(\[[^\]]{1,40}\]\s*)+/, ''); if (!a || j.source === 'local-rules') throw new Error('no-ai'); return { text: a, src: j.source || 'server' }; })
      .catch(function () { return client().catch(function () { return { text: window.D7Answers.answer(q, { lang: lang || 'pl' }), src: 'local' }; }); });
  }
  G.ask = ask;

  // ---- TTS
  function speak(t) { if (!$('#gTts').checked || !window.speechSynthesis) return; try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(t).replace(/https?:\/\/\S+/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').slice(0, 400)); u.lang = 'pl-PL'; u.rate = 1.05; speechSynthesis.speak(u); } catch (_) {} }
  function say(t, src) { var el = $('#gSay'); el.textContent = t; $('#gAvatar').classList.add('talk'); setTimeout(function () { $('#gAvatar').classList.remove('talk'); }, 2500); G.log.push({ t: t, src: src, at: Date.now() }); speak(t); }
  G.say = say;
  function deckCtx() { var a = []; ['A', 'B'].forEach(function (k) { var d = O.decks[k]; if (d && d.buf) a.push('Deck ' + k + ' ' + (d.bpm * d.rate).toFixed(0) + ' BPM' + (d.key ? ' ' + d.key.key : '')); }); var np = $('#np') ? $('#np').textContent : ''; return (a.length ? a.join(', ') + '. ' : '') + (/▶/.test(np) ? 'Radio: ' + np.replace('▶', '').trim() + '. ' : ''); }
  G.askG = function (q) {
    $('#gSay').textContent = '…'; $('#gAvatar').classList.add('talk');
    return ask('G', q + (deckCtx() ? ' (Kontekst: ' + deckCtx() + ')' : ''), 'pl').then(function (r) { say(r.text, r.src); return r; });
  };
  $('#gForm').onsubmit = function (e) { e.preventDefault(); var q = $('#gIn').value.trim(); if (!q) return; $('#gIn').value = ''; G.askG(q); };
  $('#gMic').onclick = function () { var R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) { $('#gSay').textContent = '🎤 Rozpoznawanie mowy niedostępne w tej przeglądarce.'; return; } var r = new R(); r.lang = 'pl-PL'; r.onresult = function (e) { var t = e.results[0][0].transcript; $('#gIn').value = t; G.askG(t); }; r.start(); };

  // ---- multibot grid
  function paintBots(list) {
    G.bots = list;
    $('#gBots').innerHTML = list.map(function (b) { return '<div class="gb" data-n="' + esc(b.name) + '"><b>' + (ICON[b.name] || '🤖') + ' ' + esc(b.name) + '</b><small>' + esc(b.role || '') + '</small><small class="gst">' + (SERVER_ID[b.name] ? '● serwer /api/brain' : '● AI w przeglądarce') + '</small></div>'; }).join('');
    $('#gBots').querySelectorAll('.gb').forEach(function (el) { el.onclick = function () { var q = $('#gAllIn').value.trim() || 'Przedstaw się w jednym zdaniu i powiedz, w czym pomożesz DJ-owi.'; var out = document.createElement('div'); out.className = 'm bot'; out.textContent = (ICON[el.dataset.n] || '🤖') + ' ' + el.dataset.n + ': …'; $('#gAllOut').prepend(out); ask(el.dataset.n, q, 'pl').then(function (r) { out.textContent = (ICON[el.dataset.n] || '🤖') + ' ' + el.dataset.n + ': ' + r.text; out.title = r.src; }); }; });
  }
  fetch('g-bots.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { return j.bots; }).catch(function () { return BOTS_DEFAULT.map(function (n) { return { name: n }; }); })
    .then(function (list) { BOTS_DEFAULT.forEach(function (n) { if (!list.some(function (b) { return b.name === n; })) list.push({ name: n }); }); paintBots(list);
      O.j0('/api/bots').then(function (r) { var ids = (r.bots || []).map(function (b) { return b.id; }); $('#gBots').querySelectorAll('.gb').forEach(function (el) { var sid = SERVER_ID[el.dataset.n]; if (sid) el.querySelector('.gst').textContent = ids.indexOf(sid) !== -1 ? '🟢 online (/api/bots)' : '🟠 brak na serwerze → AI w przeglądarce'; }); }).catch(function () {});
    });
  G.all = function (q) {
    var names = G.bots.map(function (b) { return b.name; }); $('#gAllOut').innerHTML = '';
    return Promise.all(names.map(function (n, i) { var out = document.createElement('div'); out.className = 'm bot'; out.textContent = (ICON[n] || '🤖') + ' ' + n + ': …'; $('#gAllOut').appendChild(out);
      return new Promise(function (r) { setTimeout(r, i * 700); }).then(function () { return ask(n, q, 'pl'); }).then(function (r) { out.textContent = (ICON[n] || '🤖') + ' ' + n + ': ' + r.text; out.title = r.src; return { bot: n, text: r.text, src: r.src }; }); }));
  };
  $('#gAllGo').onclick = function () { var q = $('#gAllIn').value.trim(); if (q) G.all(q); };

  // ---- G is the default bot in the Chat tab too
  var fix = setInterval(function () { var sel = $('#cBot'); if (sel && sel.querySelector('option[value="superg"]')) { if (!G.chatSet) { sel.value = 'superg'; G.chatSet = true; } clearInterval(fix); } }, 800);

  // ---- AUTO mode: hands-free host
  function status(t) { $('#gAutoSt').textContent = t; }
  function nextViz() { try { O.initViz(); if (O.viz()) { document.querySelector('#vNext').click(); G.vizCount = (G.vizCount || 0) + 1; } } catch (_) {} }
  function nextRadio() {
    var genre = $('#gGenre').value;
    O.query(genre);
    var tries = 0, t = setInterval(function () {
      var st = document.querySelectorAll('#stations .st:not(.libt)');
      if (st.length || ++tries > 40) { clearInterval(t); if (st.length) { var pick = st[Math.floor(Math.random() * Math.min(st.length, 40))]; pick.click(); G.radioCount = (G.radioCount || 0) + 1; setTimeout(function () { status('🤖 AUTO · radio: ' + ($('#np').textContent || '') + ' · viz #' + (G.vizCount || 0)); }, 1500); } }
    }, 300);
  }
  var TALK = ['Zapowiedz krótko, co teraz gra, i podkręć klimat na parkiecie (2 zdania).', 'Daj jedną szybką radę DJ-ską na teraz (1–2 zdania).', 'Powiedz ciekawostkę o muzyce elektronicznej w 2 zdaniach.', 'Krótki shout-out do ludzi na imprezie w Krakowie (1–2 zdania).'];
  function talk() { G.askG(TALK[Math.floor(Math.random() * TALK.length)]); G.talkCount = (G.talkCount || 0) + 1; }
  G.setAuto = function (on) {
    G.auto = !!on; G.timers.forEach(clearInterval); G.timers = [];
    var b = $('#gAuto'); b.classList.toggle('on', G.auto); b.textContent = G.auto ? '🤖 AUTO: ON' : '🤖 AUTO: OFF';
    if (!G.auto) { status('AUTO wyłączone.'); try { speechSynthesis.cancel(); } catch (_) {} return; }
    try { O.ctx().resume(); } catch (_) {}
    var vAuto = document.querySelector('#vAuto'); if (vAuto) vAuto.checked = false; // G drives presets itself
    nextViz(); nextRadio(); talk();
    G.timers.push(setInterval(nextViz, Math.max(8, +$('#gVizSec').value || 25) * 1000));
    G.timers.push(setInterval(nextRadio, Math.max(1, +$('#gRadMin').value || 6) * 60000));
    G.timers.push(setInterval(talk, Math.max(1, +$('#gTalkMin').value || 2) * 60000));
    status('🤖 AUTO ON — G prowadzi: wizualizacje co ' + $('#gVizSec').value + ' s, radio co ' + $('#gRadMin').value + ' min, komentarz co ' + $('#gTalkMin').value + ' min.');
  };
  G.nextViz = nextViz; G.nextRadio = nextRadio; G.talk = talk;
  $('#gAuto').onclick = function () { G.setAuto(!G.auto); };
  ['#gVizSec', '#gRadMin', '#gTalkMin'].forEach(function (s) { $(s).onchange = function () { if (G.auto) G.setAuto(true); }; });
  // AUTO answers: while AUTO is on, anything typed in the Chat tab also gets G's answer in the hero + voice
  document.addEventListener('submit', function (e) { if (!G.auto || !e.target || e.target.id !== 'cForm') return; var v = ($('#cIn').value || '').trim(); if (v) { G.autoAnswered = (G.autoAnswered || 0) + 1; G.askG(v); } }, true);
  // lazy G DJ iframe
  var tb = document.querySelector('#tabs button[data-t="gdj"]'); if (tb) tb.addEventListener('click', function () { var f = $('#gdjFrame'); if (!f.src) f.src = f.dataset.src; });
  if (/[?&]auto=1\b/.test(location.search)) setTimeout(function () { G.setAuto(true); }, 1500);
})();
