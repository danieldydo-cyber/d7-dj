/* Bot D · super mózg — offline command brain for D7S (rule-based, PL/EN), optional online AI. */
(function () {
  'use strict';
  var E = window.D7S, G = window.D7Gen, C = window.D7Cosmos, U = window.D7UI, $ = function (s) { return document.querySelector(s); };
  var log = $('#botLog'), inp = $('#botIn'), hist = [];
  function say(who, html) { var d = document.createElement('div'); d.className = 'msg ' + who; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; while (log.children.length > 120) log.firstChild.remove(); }
  function esc(s) { return U.esc(String(s)); }
  function need() { if (!U.isStarted()) U.start(); }
  function click(sel) { var b = $(sel); if (b) b.click(); return !!b; }
  var COS = { deszcz: 'rain', rain: 'rain', burza: 'storm', storm: 'storm', grzmot: 'thunder', piorun: 'thunder', thunder: 'thunder', wiatr: 'wind', wind: 'wind', ocean: 'ocean', morze: 'ocean', fale: 'ocean', ptaki: 'birds', birds: 'birds', ogień: 'fire', ogien: 'fire', ognisko: 'fire', fire: 'fire', miasto: 'city', city: 'city', tłum: 'crowd', tlum: 'crowd', crowd: 'crowd', brawa: 'applause', oklaski: 'applause', applause: 'applause', winyl: 'vinyl', vinyl: 'vinyl', płyta: 'vinyl', serce: 'heartbeat', heartbeat: 'heartbeat', kosmos: 'space', space: 'space', rzeka: 'river', strumień: 'river', river: 'river', świerszcze: 'crickets', swierszcze: 'crickets', crickets: 'crickets', zegar: 'clock', clock: 'clock', pociąg: 'train', pociag: 'train', train: 'train', helikopter: 'heli', heli: 'heli', 'sci-fi': 'scifi', scifi: 'scifi', laser: 'scifi' };
  var HELP = ['<b>Bot D — co umiem</b> (pisz po polsku albo angielsku):',
    '✨ <i>zrób mroczne techno 132 bpm z wokalem</i> · <i>nova: chill lofi 2 min</i> — tworzy utwór (Nova)',
    '▶ <i>graj</i> / <i>graj b</i> / <i>stop</i> / <i>stop wszystko</i> · <i>sync</i> · <i>crossfader a | b | środek</i>',
    '🤖 <i>miksuj</i> (następny utwór z przejściem) · <i>auto dj start</i> / <i>auto dj stop</i>',
    '🔲 <i>pady techno</i> · <i>pady hip hop</i> · <i>stop pady</i> · <i>bpm 128</i>',
    '🪐 <i>deszcz</i>, <i>burza</i>, <i>ocean</i>, <i>ptaki</i>, <i>ognisko</i>, <i>kosmos</i>… (warstwa tła) · <i>cisza</i> (stop warstw) · <i>scena</i>',
    '🎛 <i>echo on</i> · <i>fx1 reverb</i> · <i>fx off</i> · <i>głośność 80</i>',
    '⏺ <i>nagrywaj</i> / <i>stop nagrywania</i> · 🌌 <i>show</i> · <i>pełny ekran</i>',
    '📻 <i>radio techno</i> · ⚙️ <i>1080p</i>, <i>4k</i>, <i>60 fps</i>, <i>24 bit</i>, <i>44.1 khz</i>, <i>duże przyciski</i> · 🛠 <i>test</i>, <i>napraw</i>, <i>log</i>'].join('<br>');

  function styleFrom(t) { var p = G.parsePrompt(t); return p.styles[0]; }
  function setS(k, v, label) { E.settings[k] = v; E.saveSettings(); E.applySettings && E.applySettings(); var el = document.querySelector('[data-s="' + k + '"]'); if (el) el.value = String(v); return '⚙️ ' + label + (k === 'sr' || k === 'latency' ? ' (zadziała po „restart audio”)' : ''); }

  var RULES = [
    [/^(pomoc|help|\?|co umiesz|komendy)/, function () { return HELP; }],
    [/^(cześć|czesc|hej|siema|elo|hello|hi)\b/, function () { return 'Siema DaX 👊 Bot D gotowy. Napisz np. <i>zrób techno 130</i> albo <i>pomoc</i>.'; }],
    [/^(nova:?|zrób|zrob|stwórz|stworz|generuj|wygeneruj|make|create|generate)\s*(.*)$/, function (m) {
      var p = (m[2] || '').replace(/^(utwór|utwor|kawałek|kawalek|track|song|bit|beat)\s*/, '') || 'techno';
      if (/\b(loop|pętl|petl)/.test(p)) { need(); var st = styleFrom(p), pp = G.parsePrompt(p); U.showTab('gen'); U.busy('Bot D: loop ' + G.STYLES[st].n, G.render({ style: st, mode: 'loop', bpm: pp.bpm, seed: Math.floor(Math.random() * 1e9) })); return '🧪 Robię loop <b>' + esc(G.STYLES[st].n) + '</b>…'; }
      $('#novaPrompt').value = p; var pr = G.parsePrompt(p); E.novaRun(false).then(function (r) { if (r) say('bot', '✅ Gotowe: <b>' + esc(r.name) + '</b> · ' + r.bpm + ' BPM · ' + U.fmt(r.buffer.duration) + ' · ' + r.sections.map(function (s) { return s.name; }).join(' → ') + '<br>Gra podgląd. Dalej: <i>do decka a</i>, <i>stemy</i>, <i>zapisz</i>, <i>otwórz nova</i>.'); });
      return '✨ Nova tworzy: <b>' + esc(pr.styles.map(function (k) { return G.STYLES[k].n; }).join(' × ')) + '</b>' + (pr.bpm ? ' · ' + pr.bpm + ' BPM' : '') + ' — zagra automatycznie. Potem: <i>do decka</i>, <i>stemy</i>, <i>zapisz</i>.'; }],
    [/^(do decka|na deck|deck) ?(a|b)?$/, function (m) { var r = U.lastResult(); if (!r) return 'Najpierw coś wygeneruj.'; need(); var i = m[2] === 'b' ? 1 : 0; E.decks[i].load(r.buffer, r.name, r.bpm, 0); return '→ Deck ' + 'AB'[i] + ': ' + esc(r.name); }],
    [/^(stemy|stems)/, function () { $('#novaStems').click(); return '🎛 Eksportuję 5 stemów ostatniego utworu Nova.'; }],
    [/^(zapisz|save|wav|eksport)/, function () { var r = U.lastResult(); if (!r) return 'Nie ma czego zapisać.'; E.save(G.wav(r.buffer, E.wavBits()), 'D7S-' + r.name.replace(/[^\w\-]+/g, '_').slice(0, 50) + '.wav'); return '💾 Zapisano WAV ' + E.wavBits() + '-bit.'; }],
    [/^(stop wszystko|stop all|cisza wszystko|panic)/, function () { if (!E.decks) return 'Cisza.'; E.decks.forEach(function (d) { d.stop(); }); E.pads.stopAll(); U.stopPreview(); click('#cosStop'); return '⏹ Wszystko zatrzymane.'; }],
    [/^(graj|play|start)\s*(a|b)?$/, function (m) { need(); var i = m[2] === 'b' ? 1 : 0, d = E.decks[i];
      if (!d.buffer && !d.media) { var r = U.lastResult(); if (r) d.load(r.buffer, r.name, r.bpm, 0); else { E.autodj.on = true; E.autodj.next(i); U.paintQueue(); return '🤖 Decki puste — Auto-DJ generuje i gra.'; } }
      d.play(); return '▶ Deck ' + 'AB'[i] + (d.title ? ': ' + esc(d.title) : ''); }],
    [/^(stop|pauza|pause)\s*(a|b)?$/, function (m) { if (!E.decks) return 'Nic nie gra.'; if (m[2]) { E.decks[m[2] === 'b' ? 1 : 0].stop(); return '⏸ Deck ' + m[2].toUpperCase(); } E.decks.forEach(function (d) { d.stop(); }); U.stopPreview(); return '⏸ Decki zatrzymane.'; }],
    [/^sync\s*(a|b)?/, function (m) { need(); var i = m[1] === 'a' ? 0 : 1; E.decks[i].sync(); return '🔗 Sync deck ' + 'AB'[i]; }],
    [/^(crossfader|xf|fader)\s*(a|b|środek|srodek|mid|center)/, function (m) { need(); var v = m[2] === 'a' ? -1 : m[2] === 'b' ? 1 : 0; E.xfader(v); var x = $('#xf'); if (x) x.value = v; return '🎚 Crossfader: ' + m[2]; }],
    [/^(miksuj|mix|następny|nastepny|next|przejście|przejscie)/, function () { need(); click('#adNow'); return '🤖 Miksuję następny utwór (przejście ' + E.autodj.mixSec + ' s).'; }],
    [/^auto ?dj\s*(start|on|wł|wl|włącz|wlacz)?\s*(stop|off|wył|wyl|wyłącz|wylacz)?/, function (m) { need(); var A = E.autodj, want = m[2] ? false : true; if (A.on !== want) click('#adOn'); return '🤖 Auto-DJ: ' + (A.on ? 'WŁ' : 'WYŁ'); }],
    [/^(pady|pads)\s*(.*)$/, function (m) { need(); var st = styleFrom(m[2] || 'techno'); U.fillPads(st); return '🔲 40 padów: <b>' + esc(G.STYLES[st].n) + '</b>'; }],
    [/^stop pad/, function () { if (E.pads) E.pads.stopAll(); return '🔲 Pady stop.'; }],
    [/^(bpm|tempo)\s*(\d{2,3})/, function (m) { need(); var b = Math.max(60, Math.min(200, +m[2])); E.setBpm(b); return '⏱ BPM ' + b; }],
    [/^(cisza|stop warstw|stop cosmos|stop tła|stop tla)/, function () { click('#cosStop'); return '🪐 Warstwy Cosmos wyciszone.'; }],
    [/^(scena|scene|losowa scena)/, function () { need(); click('#cosScene'); return '🪐 Losowa scena z 3 warstw.'; }],
    [/^(echo|reverb|flanger|phaser|crush|roll|trans|spiral|noise|filter)\s*(on|off|wł|wył)?$/, function (m) { need(); var t = { echo: 'Echo', reverb: 'Reverb', flanger: 'Flanger', phaser: 'Phaser', crush: 'Crush', roll: 'Roll', trans: 'Trans', spiral: 'Spiral', noise: 'Noise', filter: 'Filter LFO' }[m[1]], off = /off|wył/.test(m[2] || '');
      if (off) { E.fx1.set('on', false); return '🎛 FX1 off'; } E.fx1.set('type', t); E.fx1.set('on', true); return '🎛 FX1: ' + t + ' ON'; }],
    [/^fx ?([12])?\s*(\w+)?/, function (m) { need(); var u = m[1] === '2' ? E.fx2 : E.fx1, w = (m[2] || '').toLowerCase(); if (!w || /off|wył|wyl/.test(w)) { u.set('on', !u.on && !w); return '🎛 FX' + (m[1] || 1) + ': ' + (u.on ? 'ON' : 'OFF'); }
      var t = E.FX_TYPES.filter(function (x) { return x.toLowerCase().indexOf(w) === 0; })[0]; if (!t) return 'Nie znam FX „' + esc(w) + '”. Mam: ' + E.FX_TYPES.join(', '); u.set('type', t); u.set('on', true); return '🎛 FX' + (m[1] || 1) + ': ' + t + ' ON'; }],
    [/^(głośność|glosnosc|volume|vol)\s*(\d{1,3})/, function (m) { need(); var v = Math.min(120, +m[2]) / 100; E.master.gain.setTargetAtTime(v, E.ctx.currentTime, .05); var e = $('#mvol'); if (e) e.value = v; return '🔊 ' + m[2] + '%'; }],
    [/^(stop nagryw|koniec nagryw|stop rec)/, function () { if (E.rec.r) { E.rec.stop(); return '⏹ Nagranie zapisane.'; } var v = U.getViz(); return '⏹ Nie było nagrania miksu.'; }],
    [/^(nagrywaj|nagraj|record|rec)\s*(wideo|video|show)?/, function (m) { need(); if (m[2]) { U.showTab('viz'); return '🎥 Show otwarte — kliknij ⏺ REC na wizualizacji (' + (E.settings.recRes === 'auto' ? 'rozdzielczość ekranu' : E.settings.recRes + 'p') + ', ' + E.settings.fps + ' fps).'; } if (!E.rec.r) E.rec.start(); return '⏺ Nagrywam miks (audio ' + E.settings.abps + ' kbps). Napisz <i>stop nagrywania</i>.'; }],
    [/^(show|wizual|mega show|visual)/, function () { need(); U.showTab('viz'); return '🌌 Mega Show 777.'; }],
    [/^(pełny ekran|pelny ekran|fullscreen|fs)$/, function () { click('#fsBtn'); return '⛶ Pełny ekran.'; }],
    [/^radio\s*(.*)$/, function (m) { need(); U.showTab('radio'); U.search(m[1] || 'techno', true); return '📻 Szukam stacji: ' + esc(m[1] || 'techno') + ' — wybierz z listy.'; }],
    [/(\d{3,4})\s*p\b|\b4k\b|\b2k\b/, function (m, t) { var r = /4k|2160/.test(t) ? '2160' : /2k|1440/.test(t) ? '1440' : /1080/.test(t) ? '1080' : /720/.test(t) ? '720' : 'auto'; var out = setS('vizRes', r, 'Wizualizacja: ' + (r === 'auto' ? 'Auto' : r + 'p')); if (/nagr|rec/.test(t)) out += '<br>' + setS('recRes', r, 'Nagrywanie: ' + r + 'p'); return out; }],
    [/^(30|60)\s*fps/, function (m) { return setS('fps', m[1], 'Nagrywanie ' + m[1] + ' fps'); }],
    [/^(16|24)\s*-?\s*bit/, function (m) { return setS('wavBits', +m[1], 'WAV ' + m[1] + '-bit'); }],
    [/^(44[.,]?1|48)\s*k?hz/, function (m) { var v = /44/.test(m[1]) ? 44100 : 48000; return setS('sr', v, 'Audio ' + v / 1000 + ' kHz'); }],
    [/^(duże|duze|big)\s*(przyciski|ui)?/, function () { return setS('big', !E.settings.big, 'Duże przyciski: ' + (!E.settings.big ? 'nie' : 'tak')); }],
    [/^(test|self ?test|sprawdź|sprawdz|diagnoz)/, function () { need(); E.selfTest().then(function (R) { var ok = R.filter(function (r) { return r.ok; }).length; say('bot', '🛠 Self-test: <b>' + ok + '/' + R.length + ' OK</b><br>' + R.map(function (r) { return (r.ok ? '✅ ' : '⚠️ ') + esc(r.n); }).join(' · ')); }); return '🛠 Testuję…'; }],
    [/^(napraw|fix|auto ?fix)/, function () { $('#fixNow').click(); var n = E.log.filter(function (x) { return x.level === 'błąd'; }).length; return '🔧 Audio wznowione (' + (E.ctx ? E.ctx.state : '—') + '). Błędów w logu: ' + n + '.'; }],
    [/^(log|błędy|bledy|errors)/, function () { return E.log.length ? E.log.slice(0, 8).map(function (x) { return esc(x.t + ' [' + x.level + '] ' + x.msg); }).join('<br>') : 'Log pusty — zero błędów ✅'; }],
    [/^(status|stan|co gra)/, function () { if (!E.decks) return 'Audio jeszcze nie wystartowało — napisz <i>graj</i>.'; return E.decks.map(function (d) { return 'Deck ' + 'AB'[d.i] + ': ' + (d.playing ? '▶ ' : '⏸ ') + esc(d.title || '—') + (d.bpm ? ' · ' + (d.bpm * d.rate).toFixed(1) + ' BPM' : ''); }).join('<br>') + '<br>Master ' + E.clock.bpm + ' BPM · ' + E.ctx.sampleRate + ' Hz · Auto-DJ ' + (E.autodj.on ? 'WŁ' : 'WYŁ'); }],
    [/^(otwórz|otworz|pokaż|pokaz|open|idź|idz)\s*(\w+)/, function (m) { var map = { dj: 'dj', decki: 'dj', pady: 'pads', nova: 'nova', cosmos: 'cosmos', generatory: 'gen', sample: 'samples', sampli: 'samples', radio: 'radio', show: 'viz', midi: 'midi', ustawienia: 'settings', hub: 'hub', auto: 'auto' }, t = map[m[2]]; if (!t) return 'Nie znam zakładki „' + esc(m[2]) + '”.'; U.showTab(t); return '→ ' + m[2]; }]
  ];

  function cosmosCmd(t) { var w = t.split(/[\s,]+/), hit = []; w.forEach(function (x) { if (COS[x] && hit.indexOf(COS[x]) < 0) hit.push(COS[x]); }); return hit.length && w.length <= hit.length + 2 ? hit : null; }

  // optional online AI (server of D7 bots) — test:true means talk only, no server-side actions
  var aiUrl = null;
  function findAi() { if (E.settings.aiUrl) return Promise.resolve(E.settings.aiUrl); if (aiUrl) return Promise.resolve(aiUrl);
    return fetch('https://ntfy.sh/d7dj-dydo-a6405ab14ae4/json?poll=1&since=all').then(function (r) { return r.text(); }).then(function (t) { var u = null; t.trim().split('\n').forEach(function (l) { try { var j = JSON.parse(l), m = JSON.parse(j.message); var p = typeof m.p === 'string' ? JSON.parse(m.p) : m.p; if (p && p.liveUrl) u = p.liveUrl; } catch (e) {} }); if (!u) throw new Error('brak adresu'); aiUrl = u.replace(/\/$/, '') + '/api/chat'; return aiUrl; }); }
  function online(q) { var ctl = new AbortController(); setTimeout(function () { ctl.abort(); }, 15000);
    return findAi().then(function (u) { return fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: q, bot: 'D', lang: 'pl', test: true }), signal: ctl.signal }); }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) { return j.answer || j.reply || JSON.stringify(j).slice(0, 400); }); }

  function handle(raw) {
    var t = raw.trim(); if (!t) return; hist.push(t); say('me', esc(t)); var low = t.toLowerCase().replace(/[!.]+$/, '');
    try {
      var parts = low.split(/\s*(?:;|\boraz\b|\ba potem\b|\bthen\b)\s*/).filter(Boolean), outs = [];
      parts.forEach(function (p) {
        var cs = cosmosCmd(p); if (cs) { need(); cs.forEach(function (k) { E.cosmosLayer(k, true); }); outs.push('🪐 Warstwa: ' + cs.map(function (k) { return C.SOUNDS[k][0]; }).join(' + ') + ' (<i>cisza</i> = stop)'); return; }
        for (var i = 0; i < RULES.length; i++) { var m = p.match(RULES[i][0]); if (m) { outs.push(RULES[i][1](m, p)); return; } }
        outs.push(null);
      });
      var known = outs.filter(function (x) { return x !== null; });
      if (known.length) { say('bot', known.join('<br>')); return; }
    } catch (e) { E.logMsg('błąd', 'Bot D: ' + e.message); say('bot', '⚠️ ' + esc(e.message) + ' — spróbuj <i>napraw</i>.'); return; }
    if (E.settings.aiOnline) { say('bot', '<span class="muted">🌐 pytam AI online…</span>'); online(t).then(function (a) { log.lastChild.remove(); say('bot', esc(a)); }).catch(function (e) { log.lastChild.remove(); say('bot', 'AI online niedostępne (' + esc(e.message) + '). Offline mogę: ' + HELP.split('<br>').slice(1, 3).join(' ')); }); return; }
    var p = G.parsePrompt(t); if (p.styles && p.styles.length && /techno|house|hip|trap|lofi|psy|trance|drill|reggae|disco|funk|dnb|drum|synth|dub|phonk|ambient|rock|jazz/.test(low)) { say('bot', RULES[2][1](['', 'zrób', t])); return; }
    say('bot', 'Nie łapię 🤔 Napisz <i>pomoc</i>. Przykłady: <i>zrób techno 130</i>, <i>deszcz</i>, <i>miksuj</i>, <i>1080p</i>.');
  }
  E.bot = handle;
  ['pomoc', 'zrób mroczne techno 132 bpm', 'hip hop hood z wokalem', 'graj', 'miksuj', 'auto dj start', 'pady techno', 'deszcz ocean', 'cisza', 'nagrywaj', 'stop nagrywania', 'show', '1080p', 'status', 'test'].forEach(function (c) { var b = document.createElement('button'); b.className = 'chip'; b.textContent = c; b.onclick = function () { handle(c); }; $('#botChips').appendChild(b); });
  $('#botSend').onclick = function () { handle(inp.value); inp.value = ''; };
  inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { handle(inp.value); inp.value = ''; } if (e.key === 'ArrowUp' && hist.length) inp.value = hist[hist.length - 1]; });
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) $('#botMic').style.display = 'none'; else $('#botMic').onclick = function () { var r = new SR(); r.lang = 'pl-PL'; r.onresult = function (e) { handle(e.results[0][0].transcript); }; r.onerror = function (e) { say('bot', '🎤 ' + esc(e.error)); }; r.start(); say('bot', '<span class="muted">🎤 słucham…</span>'); };
  say('bot', '🧠 <b>Bot D · super mózg</b> online (offline 😉). Steruję całą aplikacją: tworzę utwory, miksuję, gram, nagrywam, ustawiam. Napisz <i>pomoc</i>.');
})();
