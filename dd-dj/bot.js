/* DD DJ 3.0 · Bot D — offline command helper (PL/EN, rule-based). Apps-only info. Original code. */
(function () {
  'use strict';
  var SP = window.DDSpecials, A = window.DDA, G = window.DDGen, ST = window.DDStyles, SET = window.DDSet, AU = window.DDAuto, V = window.DDVis, REC = window.DDRec, U = window.DDUI;
  var log = document.getElementById('botLog'), inp = document.getElementById('botIn');
  function say(who, html) { var d = document.createElement('div'); d.className = 'msg ' + who; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; while (log.children.length > 80) log.firstChild.remove(); }
  var HELP = '<b>Bot D — komendy</b><br>▶ <i>graj</i> · <i>stop</i> · <i>banger</i> · <i>graj rasta techno</i> · <i>graj trap</i> · <i>space nova</i> · <i>losuj house</i><br>⏱ <i>set 77</i> · <i>stop set</i> · 🤖 <i>autonomic</i><br>💥 <i>drop</i> · <i>build</i> · <i>break</i> · <i>mutuj</i> · <i>bpm 128</i> · <i>echo</i><br>⏺ <i>nagrywaj</i> · <i>nagraj audio</i> · <i>stop nagrywania</i><br>🌌 <i>show</i> · <i>następna wizualizacja</i> · <i>1080p</i> · <i>4k</i> · <i>eco</i><br>🎰 <i>special</i> · <i>special 123</i> · <i>auto specials</i> · <i>tonacja +5</i><br>🔲 <i>pad 5</i> · 🛠 <i>test</i> · 💳 <i>płatność</i>';
  function need() { U.start(); }
  function findStyle(t) { var best = null, bs = 0; ST.LIST.forEach(function (s) { var words = (s.n + ' ' + s.id + ' ' + s.cat).toLowerCase().split(/[^a-z0-9ąćęłńóśźż]+/), sc = 0; words.forEach(function (w) { if (w.length > 2 && t.indexOf(w) >= 0) sc += w.length; }); if (sc > bs) { bs = sc; best = s; } });
    if (!best) { var cat = /hip|rap/.test(t) ? 'hiphop' : /techno/.test(t) ? 'techno' : /house/.test(t) ? 'house' : /synth/.test(t) ? 'synth' : /beat|break/.test(t) ? 'beats' : /bas/.test(t) ? 'bass' : /voic|wokal|głos|glos/.test(t) ? 'voices' : null; if (cat) best = G.random(cat); } return best; }
  var RULES = [
    [/^(pomoc|help|\?|komendy|co umiesz)/, function () { return HELP; }],
    [/^(cześć|czesc|hej|siema|elo|hi|hello)/, function () { return 'Siema DaX 👊 DD DJ gotowy. Napisz <i>banger</i>, <i>graj rasta techno</i> albo <i>pomoc</i>.'; }],
    [/^(stop set|koniec setu)/, function () { SET.stop(); G.stop(); return '⏹ Set zatrzymany.'; }],
    [/(set ?77|77 ?min)/, function () { need(); SET.start(); U.WM.open('set'); return '⏱ 77 min Set Pro wystartował.'; }],
    [/^(stop nagr|zatrzymaj nagr)/, function () { REC.stop(); return '💾 Zapisuję nagranie…'; }],
    [/^nagraj (audio|miks|mix)/, function () { need(); REC.start('a'); return '🎙 Nagrywam miks.'; }],
    [/^(nagrywaj|nagraj|rec)/, function () { need(); REC.start('av'); return '⏺ Nagrywam show (wideo + audio).'; }],
    [/^(stop|cisza|pauza)$/, function () { G.stop(); SET.stop(); return '⏹ Stop.'; }],
    [/^special\s*(\d{1,3})?$|^777$|^specials?$/, function (m) { need(); var inf = U.spFire(m && m[1] ? +m[1] : null); return '🎰 #' + inf.n + ' ' + inf.icon + ' ' + U.esc(inf.name) + ' — w rytmie i w tonacji.'; }],
    [/^auto special/, function () { SP.auto = !SP.auto; A.emit('spauto', SP.auto); return '♾ Auto specials ' + (SP.auto ? 'ON' : 'OFF'); }],
    [/^tonacja\s*([+-]?\d+)/, function (m) { var n = (G.root || 45) + (+m[1]); while (n > 47) n -= 12; while (n < 40) n += 12; G.setKey(n); return '🔑 Zmiana tonacji na następnej frazie.'; }],
    [/banger/, function () { need(); var s = G.banger(); return '⚡ ' + U.esc(s.n) + ' — drop od razu!'; }],
    [/auton|autopilot|auto ?dj/, function () { need(); AU.toggle(); return '🤖 Autonomic ' + (AU.on ? 'ON' : 'OFF'); }],
    [/^(drop|build|break|intro|groove)$/, function (m) { need(); if (!A.playing) G.play((G.style || ST.BY.peak).id, { now: true }); G.jump(m[1]); return '👌 ' + m[1].toUpperCase() + ' na następnym takcie.'; }],
    [/^mutuj|mutacja/, function () { G.mutateNow(); return '🧬 Nowe akordy, bas i melodia.'; }],
    [/^bpm (\d{2,3})/, function (m) { need(); A.setBpm(+m[1]); return '🎚 BPM ' + A.bpm; }],
    [/^echo|dub/, function () { need(); A.echoThrow(3); return '🌊 Dub echo throw!'; }],
    [/^(show|pełny ekran|pelny ekran)/, function () { need(); U.showMode(true); return '🌌 Tryb show.'; }],
    [/następn|nastepn|wizualiz/, function () { V.next(true); return '✨ Magiczne przejście.'; }],
    [/^(720p?|1080p?|4k|eco|auto)$/, function (m) { var r = m[1].replace('p', ''); document.querySelectorAll('.resSel').forEach(function (s) { s.value = r; s.dispatchEvent(new Event('change')); }); return '⚙️ Jakość: ' + m[1]; }],
    [/^pad (\d+)/, function (m) { need(); U.hitPad(+m[1] - 1); return '🔲 Pad ' + m[1]; }],
    [/^(test|diagnoz|napraw)/, function () { var r = U.selfTest(); return r.lines.map(U.esc).join('<br>'); }],
    [/(^|\s)(płat|plat|blik|nest|kup|cena)/, function () { return '💳 Aplikacje DJ DaX (DD DJ, D7 DJ ONE, PRO): płatność BLIK lub przelew Nest Bank — szczegóły i kod QR na <a href="https://danieldydo-cyber.github.io/d7-dj/pay/" target="_blank" rel="noopener">stronie płatności</a>. Pobieranie: <a href="https://danieldydo-cyber.github.io/d7-dj/download.html" target="_blank" rel="noopener">download</a>.'; }],
    [/^(graj|play|włącz|wlacz|losuj|zagraj)\s*(.*)$/, function (m) { need(); var t = m[2] || ''; if (!t) { if (!A.playing) U.togglePlay(); return '▶ Gramy: ' + U.esc(G.style ? G.style.n : ''); } var s = /losuj/.test(m[1]) ? null : findStyle(t); if (!s) s = G.random(); G.play(s.id, { nextBar: true }); return '▶ ' + U.esc(s.n) + ' · ' + s.bpm + ' BPM'; }],
    [/rasta|reggae/, function () { need(); G.play('rastatechno', { nextBar: true }); return '🌀 Rasta Techno Magic — offbeat skank, dub echo, sub.'; }],
    [/nova|kosmos|space/, function () { need(); G.play('spacenova', { nextBar: true }); V.next(true); return '✨ Space Nova Magic Sound.'; }]
  ];
  function handle(t) { var q = t.toLowerCase().trim(); if (!q) return; say('me', U.esc(t));
    for (var i = 0; i < RULES.length; i++) { var m = q.match(RULES[i][0]); if (m) { var r; try { r = RULES[i][1](m); } catch (e) { r = '⚠️ ' + U.esc(e.message); } say('bot', r); return; } }
    var s = findStyle(q); if (s) { need(); G.play(s.id, { nextBar: true }); say('bot', '▶ Pasuje: <b>' + U.esc(s.n) + '</b> (' + s.bpm + ' BPM)'); return; }
    say('bot', 'Nie łapię 🤔 Wpisz <i>pomoc</i>.'); }
  document.getElementById('botForm').addEventListener('submit', function (e) { e.preventDefault(); handle(inp.value); inp.value = ''; });
  ['banger', 'special', 'graj rasta techno', 'space nova', 'set 77', 'autonomic', 'drop', 'nagrywaj', 'pomoc'].forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { handle(c); }); document.getElementById('botQuick').appendChild(b); });
  say('bot', 'Siema DaX 👊 Jestem <b>Bot D</b> (offline). ' + HELP);
  window.DDBot = { handle: handle };
})();
