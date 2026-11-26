/* D7S v2 UI: Nova, Cosmos layers, sample library, settings, auto-fix panel. */
(function () {
  'use strict';
  var E = window.D7S, G = window.D7Gen, C = window.D7Cosmos, U = window.D7UI, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = U.esc, toast = U.toast;
  function need() { if (!U.isStarted()) U.start(); }

  // ---------- NOVA ----------
  var IDEAS = ['mroczne techno z wokalem 132 bpm', 'hip hop hood x trap, mocny bas', 'chill lofi 80 bpm 2 min', 'wesoły house z wokalem tonacja A', 'psy trance 145 bpm rave', 'melodic techno 122 bpm długi', 'drill 142 bpm mroczny', 'synthwave retro 80s', 'reggae chill wokal', 'funk disco 118', 'drum and bass jungle 174', 'techno x hip hop 128'];
  $('#novaIdeas').innerHTML = IDEAS.map(function (x) { return '<button class="chip">' + esc(x) + '</button>'; }).join('');
  $$('#novaIdeas .chip').forEach(function (b) { b.onclick = function () { $('#novaPrompt').value = b.textContent; }; });
  var lastNova = null;
  function planHtml(r) { return '<b>' + esc(r.name) + '</b> · ' + r.bpm + ' BPM · ' + r.key + ' · ' + U.fmt(r.buffer.duration) + '<div class="secs">' + r.sections.map(function (s) { return '<span style="flex:' + s.bars + '">' + esc(s.name) + '<small>' + s.bars + ' t.</small></span>'; }).join('') + '</div>'; }
  function novaRun(sameSeed) {
    need(); var p = $('#novaPrompt').value.trim() || IDEAS[Math.floor(Math.random() * IDEAS.length)]; $('#novaPrompt').value = p;
    var parsed = G.parsePrompt(p); $('#novaPlan').innerHTML = '⏳ Nova: <b>' + parsed.styles.map(function (k) { return G.STYLES[k].n; }).join(' × ') + '</b>' + (parsed.bpm ? ' · ' + parsed.bpm + ' BPM' : '') + (parsed.vox ? ' · wokal' : '') + (parsed.dark ? ' · mroczny' : '') + (parsed.happy ? ' · wesoły' : '') + ' — renderuję…';
    var box = $('#novaOut'); var t0 = performance.now();
    return G.nova(p, sameSeed && lastNova ? { seed: lastNova.seed } : {}).then(function (r) { lastNova = r; $('#novaPlan').innerHTML = planHtml(r) + '<small class="muted"> · render ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s</small>';
      U.showResult(r, box); U.play(r); return r; })
      .catch(function (e) { $('#novaPlan').textContent = 'Błąd: ' + e.message; E.logMsg('błąd', 'Nova: ' + e.message); });
  }
  E.novaRun = novaRun;
  $('#novaGo').onclick = function () { novaRun(false); };
  $('#novaAgain').onclick = function () { novaRun(false); };
  function stemsOf(cb) { if (!lastNova) { toast('Najpierw stwórz utwór (✨).'); return; } var o = lastNova.novaOpts;
    $('#novaPlan').insertAdjacentHTML('beforeend', '<div id="stemProg">⏳ stemy…</div>');
    G.stems(o, function (i, n, name) { var e = $('#stemProg'); if (e) e.textContent = '⏳ stem ' + (i + 1) + '/' + n + ': ' + name; }).then(function (st) { var e = $('#stemProg'); if (e) e.remove(); cb(st); }); }
  $('#novaStems').onclick = function () { stemsOf(function (st) { st.forEach(function (s, i) { setTimeout(function () { E.save(G.wav(s.buffer, E.wavBits()), 'D7S-NOVA-stem-' + (i + 1) + '-' + s.name + '.wav'); }, i * 700); }); toast('5 stemów: Bębny, Bas, Muzyka, Wokal, FX'); }); };
  $('#novaStemsPads').onclick = function () { stemsOf(function (st) { var bar = 240 / lastNova.bpm, cols = [0, 3, 4, 5, 6];
    st.forEach(function (s, i) { for (var row = 0; row < 5; row++) { var len = Math.round(2 * bar * s.buffer.sampleRate), start = Math.min(s.buffer.length - len, Math.floor((row + 1) * s.buffer.length / 7)); if (start < 0) continue;
      var b = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: s.buffer.sampleRate }); for (var ch = 0; ch < 2; ch++) b.copyToChannel(s.buffer.getChannelData(ch).subarray(start, start + len), ch); E.pads.set(row * 8 + cols[i], b, 'Nova ' + s.name + ' ' + (row + 1), lastNova.bpm); } });
    E.setBpm(lastNova.bpm); toast('Stemy Nova pocięte na pady (kolumny Bębny/Bas/Synth/Wokal/FX).'); U.showTab('pads'); }); };

  // ---------- COSMOS ----------
  var layers = {}, cosBus = null;
  function bus() { if (!cosBus) { cosBus = E.ctx.createGain(); cosBus.gain.value = +$('#cosVol').value; cosBus.connect(E.bus); } return cosBus; }
  $('#cosGrid').innerHTML = C.KEYS.map(function (k) { return '<div class="cos" data-k="' + k + '"><b>' + C.SOUNDS[k][0] + '</b><div class="bar"><button class="cl">▶</button><input class="cv" type="range" min="0" max="1.5" step="0.01" value="0.8"><button class="cp" title="Do padu">→ Pad</button><button class="cd" title="Do decka B">→ B</button><button class="cw" title="Zapisz WAV">💾</button></div></div>'; }).join('');
  var cache = {};
  function getCos(k) { var len = +$('#cosLen').value, key = k + ':' + len; if (cache[key]) return Promise.resolve(cache[key]); return C.render(k, len).then(function (r) { cache[key] = r; return r; }); }
  function layerToggle(k, force) { need(); var card = $('.cos[data-k="' + k + '"]'), btn = $('.cl', card);
    if (layers[k] && force !== true) { var L = layers[k]; L.g.gain.setTargetAtTime(0, E.ctx.currentTime, .3); setTimeout(function () { try { L.s.stop(); } catch (e) {} }, 1500); delete layers[k]; btn.classList.remove('on'); btn.textContent = '▶'; return Promise.resolve(); }
    if (layers[k]) return Promise.resolve();
    btn.textContent = '⏳'; return getCos(k).then(function (r) { var s = E.ctx.createBufferSource(), g = E.ctx.createGain(); s.buffer = r.buffer; s.loop = true; g.gain.value = 0; g.gain.setTargetAtTime(+$('.cv', card).value, E.ctx.currentTime, .4); s.connect(g); g.connect(bus()); s.start(); layers[k] = { s: s, g: g }; btn.classList.add('on'); btn.textContent = '⏸'; }); }
  $$('#cosGrid .cos').forEach(function (card) { var k = card.dataset.k;
    $('.cl', card).onclick = function () { layerToggle(k); };
    $('.cv', card).oninput = function () { if (layers[k]) layers[k].g.gain.setTargetAtTime(+this.value, E.ctx.currentTime, .05); };
    $('.cp', card).onclick = function () { need(); getCos(k).then(function (r) { var free = E.pads.pads.filter(function (p) { return p.col === 6 && !p.on; }); var p = free.find(function (x) { return !x.buffer; }) || free[0] || E.pads.pads[6]; E.pads.set(p.i, r.buffer, r.name.replace(/^\S+\s/, ''), 0); toast(r.name + ' → pad ' + (p.i + 1)); }); };
    $('.cd', card).onclick = function () { need(); getCos(k).then(function (r) { E.decks[1].load(r.buffer, r.name, 0, 0); E.decks[1].bpm = 0; toast(r.name + ' → Deck B'); }); };
    $('.cw', card).onclick = function () { need(); getCos(k).then(function (r) { E.save(G.wav(r.buffer, E.wavBits()), 'D7S-Cosmos-' + k + '.wav'); }); }; });
  $('#cosVol').oninput = function () { if (cosBus) cosBus.gain.setTargetAtTime(+this.value, E.ctx.currentTime, .05); };
  $('#cosStop').onclick = function () { Object.keys(layers).forEach(function (k) { layerToggle(k); }); };
  $('#cosScene').onclick = function () { $('#cosStop').click(); var ks = C.KEYS.slice().sort(function () { return Math.random() - .5; }).slice(0, 3); ks.reduce(function (p, k) { return p.then(function () { return layerToggle(k, true); }); }, Promise.resolve()); toast('Scena: ' + ks.map(function (k) { return C.SOUNDS[k][0]; }).join(' + ')); };
  E.cosmosLayer = layerToggle;

  // ---------- SAMPLES ----------
  var L = E.lib;
  function allItems() { return L.items.concat(L.manifest); }
  function paintLib() { var f = $('#libFilter').value, q = $('#libQ').value.toLowerCase();
    var arr = allItems().filter(function (x) { return (!f || x.src === f) && (!q || x.name.toLowerCase().indexOf(q) >= 0); });
    $('#libList').innerHTML = arr.length ? arr.slice(0, 400).map(function (x, i) { return '<div class="li" data-i="' + allItems().indexOf(x) + '"><span class="tg2 ' + x.src + '">' + (x.src === 'local' ? 'MOJE' : x.src === 'gen' ? 'GEN' : x.src === 'dax' ? 'DaX' : 'URL') + '</span><span class="nm">' + esc(x.name) + (x.size ? ' <small>' + (x.size / 1048576).toFixed(1) + ' MB</small>' : '') + (x.bpm ? ' <small>' + x.bpm + ' BPM</small>' : '') + (x.dur ? ' <small>' + x.dur.toFixed(0) + ' s</small>' : '') + '</span><button class="lp">▶</button><button class="la">A</button><button class="lb">B</button><button class="lpad">Pad</button>' + (x.src === 'local' ? '<button class="ld">🗑</button>' : '') + '</div>'; }).join('') : '<p class="muted">Brak sampli — zaimportuj pliki albo ZIP.</p>';
    $$('#libList .li').forEach(function (row) { var it = allItems()[+row.dataset.i];
      function dec(fn) { need(); row.classList.add('busy'); L.decode(it).then(function (b) { row.classList.remove('busy'); fn(b); }).catch(function (e) { row.classList.remove('busy'); toast('Nie udało się: ' + e.message); E.logMsg('błąd', 'Sample ' + it.name + ': ' + e.message); }); }
      $('.lp', row).onclick = function () { dec(function (b) { U.play({ buffer: b }); }); };
      $('.la', row).onclick = function () { dec(function (b) { E.decks[0].load(b, it.name, it.bpm || 0); toast('→ Deck A'); }); };
      $('.lb', row).onclick = function () { dec(function (b) { E.decks[1].load(b, it.name, it.bpm || 0); toast('→ Deck B'); }); };
      $('.lpad', row).onclick = function () { dec(function (b) { var p = E.pads.pads.filter(function (x) { return x.col === 7 && !x.buffer; })[0] || E.pads.pads.filter(function (x) { return x.col === 7; })[Math.floor(Math.random() * 5)]; var d = b.duration > 1.5 ? E.detectBpm(b) : { bpm: 0 }; E.pads.set(p.i, b, it.name.slice(0, 16), it.bpm || d.bpm || 0); if (b.duration < 1.5) p.oneShot = true; toast(it.name + ' → pad ' + (p.i + 1)); }); };
      var d = $('.ld', row); if (d) d.onclick = function () { if (confirm('Usunąć „' + it.name + '” z biblioteki aplikacji? (Plik na dysku/Drive zostaje)')) L.del(it.id); }; });
  }
  E.on('lib', paintLib); $('#libFilter').onchange = paintLib; $('#libQ').oninput = paintLib;
  function imp(files) { if (!files.length) return; L.importFiles(files, function (i, n, name) { $('#libProg').textContent = '⏳ ' + i + '/' + n + ' ' + name; }).then(function (k) { $('#libProg').textContent = '✅ dodano ' + k; toast('Zaimportowano ' + k + ' sampli'); }).catch(function (e) { $('#libProg').textContent = 'Błąd: ' + e.message; }); }
  $('#libFiles').onchange = function () { imp(this.files); this.value = ''; }; $('#libDir').onchange = function () { imp(this.files); this.value = ''; };
  $('#manGo').onclick = function () { var u = $('#manUrl').value.trim(); if (!u) return; L.loadManifest(u).then(function (it) { toast('Manifest: ' + it.length + ' sampli'); localStorage.setItem('d7s-manifest', u); }).catch(function (e) { toast('Manifest: ' + e.message); }); };
  var daxReady = L.loadManifest('samples/dax/manifest.json').catch(function (e) { E.logMsg('błąd', 'Bank DJ DaX: ' + e.message); return []; });
  L.loadManifest('samples/samples-manifest.json').catch(function (e) { E.logMsg('info', 'Manifest wbudowany: ' + e.message); });
  // ---- DJ DaX Drive pad bank: 26 own samples -> pads 1..26 (tempo-matched to master, x2 / /2 when closer) ----
  var daxBusy = false;
  function daxBank(quiet) { if (daxBusy) return Promise.resolve(0); need(); daxBusy = true;
    var btns = [$('#padDax'), $('#libDax')], set = function (t) { btns.forEach(function (b) { if (b) b.textContent = t; }); };
    return daxReady.then(function () { var it = L.manifest.filter(function (m) { return m.src === 'dax'; }), k = 0;
      if (!it.length) throw new Error('brak manifestu'); if (quiet || E.clock.bpm < 110 || E.clock.bpm > 135) E.setBpm(123);
      return it.reduce(function (p, x, i) { return p.then(function () { set('⏳ DaX ' + (i + 1) + '/' + it.length); return L.decode(x).then(function (b) {
        var bpm = x.bpm || 0, clk = E.clock.bpm; if (bpm) { [bpm * 2, bpm / 2].forEach(function (c) { if (Math.abs(Math.log(clk / c)) < Math.abs(Math.log(clk / bpm))) bpm = c; }); if (Math.abs(Math.log(clk / bpm)) > Math.log(1.2)) bpm = 0; }
        E.pads.set(i, b, x.name.replace(/^DaX /, 'DaX·'), bpm, '#ffd23f'); k++; }).catch(function (e) { E.logMsg('błąd', 'DaX ' + x.name + ': ' + e.message); }); }); }, Promise.resolve()).then(function () { return k; }); })
      .then(function (k) { daxBusy = false; set('🎛 Bank DJ DaX (26)'); if ($('#libDax')) $('#libDax').textContent = '🎛 Bank DJ DaX → pady'; if (!quiet) toast('🎛 Bank DJ DaX: ' + k + ' sampli na padach 1–' + k + ' (złote) · ' + E.clock.bpm + ' BPM'); E.emit('daxBank', k); return k; })
      .catch(function (e) { daxBusy = false; set('🎛 Bank DJ DaX (26)'); toast('Bank DJ DaX: ' + e.message); return 0; }); }
  E.daxBank = daxBank;
  $('#padDax').onclick = function () { daxBank(false); };
  $('#libDax').onclick = function () { daxBank(false).then(function () { U.showTab('pads'); }); };
  var daxStart = false; E.on('padsFilled', function () { if (!daxStart && E.settings.padBank === 'dax') { daxStart = true; daxBank(true); } });
  var mu = localStorage.getItem('d7s-manifest'); if (mu) { $('#manUrl').value = mu; L.loadManifest(mu).catch(function () {}); }
  L.list(); paintLib();
  document.addEventListener('dragover', function (e) { if ($('#t-samples.on')) e.preventDefault(); }); document.addEventListener('drop', function (e) { if ($('#t-samples.on')) { e.preventDefault(); imp(e.dataTransfer.files); } });

  // ---------- SETTINGS ----------
  var ST = E.settings;
  var FIELDS = [
    ['vizRes', 'Rozdzielczość wizualizacji', [['auto', 'Auto (ekran)'], ['720', '720p'], ['1080', '1080p (Full HD)'], ['1440', '1440p (2K)'], ['2160', '2160p (4K)']]],
    ['dpr', 'Gęstość pikseli (Auto)', [['auto', 'Auto'], ['0.75', '0.75× (szybciej)'], ['1', '1×'], ['1.5', '1.5×'], ['2', '2× (ostro)']]],
    ['recRes', 'Rozdzielczość nagrywania wideo', [['auto', 'Jak podgląd'], ['720', '720p'], ['1080', '1080p'], ['1440', '1440p'], ['2160', '4K']]],
    ['fps', 'Klatki nagrywania', [['30', '30 fps'], ['60', '60 fps']]],
    ['vbps', 'Bitrate wideo', [['4', '4 Mbps'], ['8', '8 Mbps'], ['12', '12 Mbps'], ['20', '20 Mbps'], ['40', '40 Mbps (4K)']]],
    ['abps', 'Bitrate audio nagrań', [['128', '128 kbps'], ['192', '192 kbps'], ['256', '256 kbps'], ['320', '320 kbps']]],
    ['sr', 'Częstotliwość audio (po restarcie)', [['44100', '44.1 kHz'], ['48000', '48 kHz']]],
    ['wavBits', 'Eksport WAV', [['16', '16-bit'], ['24', '24-bit']]],
    ['latency', 'Opóźnienie audio (po restarcie)', [['interactive', 'Niskie (DJ)'], ['balanced', 'Zbalansowane'], ['playback', 'Stabilne (słabszy telefon)']]],
    ['padBank', 'Bank padów na start', [['dax', 'DJ DaX Drive (26) + generowane'], ['gen', 'Tylko generowane (40)']]],
    ['big', 'Duże przyciski (dotyk)', [['false', 'Nie'], ['true', 'Tak']]],
    ['aiOnline', 'Bot D: AI online (opcjonalnie)', [['false', 'Wył. (offline)'], ['true', 'Wł. (serwer botów D7)']]]];
  $('#setForm').innerHTML = FIELDS.map(function (f) { return '<label>' + f[1] + '<select data-s="' + f[0] + '">' + f[2].map(function (o) { return '<option value="' + o[0] + '"' + (String(ST[f[0]]) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'; }).join('') +
    '<label>Adres AI (puste = auto)<input data-s="aiUrl" value="' + esc(ST.aiUrl || '') + '" placeholder="https://…/api/chat"></label><p class="hint">Bieżąco: <span id="curRes"></span></p>';
  $$('#setForm [data-s]').forEach(function (el) { el.onchange = function () { var k = el.dataset.s, v = el.value; ST[k] = v === 'true' ? true : v === 'false' ? false : v; E.saveSettings(); applySettings(); toast('Zapisano: ' + el.parentNode.firstChild.textContent + (k === 'sr' || k === 'latency' ? ' — zadziała po restarcie audio' : '')); }; });
  function applySettings() { document.body.classList.toggle('bigui', !!ST.big); G.setSR && G.setSR(ST.sr); var v = U.getViz && U.getViz(); if (v && v.resize) v.resize(); curRes(); }
  E.applySettings = applySettings;
  function curRes() { var c = document.querySelector('.d7ms canvas'); $('#curRes').textContent = (E.ctx ? E.ctx.sampleRate + ' Hz · ' : '') + (c ? 'wizualizacja ' + c.width + '×' + c.height : 'wizualizacja nieaktywna') + ' · WAV ' + ST.wavBits + '-bit'; }
  setInterval(function () { if ($('#t-settings.on')) curRes(); }, 1500); applySettings();

  // ---------- AUTO-FIX panel ----------
  function paintLog() { var errs = E.log.filter(function (x) { return x.level === 'błąd'; }).length; $('#fixN').textContent = errs; $('#fixBadge').classList.toggle('err', errs > 0);
    $('#fixLog').textContent = E.log.map(function (x) { return x.t + ' [' + x.level + '] ' + x.msg; }).join('\n') || 'Brak zdarzeń — wszystko działa.'; }
  E.on('log', paintLog); paintLog();
  $('#fixBadge').onclick = function () { U.showTab('settings'); };
  $('#logClear').onclick = function () { E.log.length = 0; paintLog(); };
  $('#fixNow').onclick = function () { need(); if (E.ctx) E.ctx.resume().then(function () { E.logMsg('naprawa', 'Ręczne wznowienie audio: ' + E.ctx.state); }); if (E.pads) E.pads.retempo(); toast('Naprawa: audio wznowione, tempo pad odświeżone'); };
  $('#restartAudio').onclick = function () { if (confirm('Restart audio przeładuje aplikację (pady/decki zostaną wyczyszczone). Kontynuować?')) E.restartAudio(); };
  $('#selfTest').onclick = function () { need(); $('#testOut').innerHTML = '⏳ test…'; E.selfTest().then(function (R) { var ok = R.filter(function (r) { return r.ok; }).length; $('#testOut').innerHTML = '<b>' + ok + '/' + R.length + ' OK</b><ul class="tests">' + R.map(function (r) { return '<li class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✅' : '⚠️') + ' ' + esc(r.n) + ' <small>' + esc(r.d) + '</small></li>'; }).join('') + '</ul>'; E.logMsg('info', 'Self-test: ' + ok + '/' + R.length); }); };
})();
