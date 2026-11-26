/* D7S UI (Polish). Every control wired to the engine. */
(function () {
  'use strict';
  var E = window.D7S, G = window.D7Gen, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function h(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) { if (k === 'on') { for (var ev in attrs.on) e.addEventListener(ev, attrs.on[ev]); } else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { s = Math.max(0, s || 0); var m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ':' + (x < 10 ? '0' : '') + x; }
  function toast(t, ms) { var d = h('div', null, esc(t)); $('#toast').appendChild(d); setTimeout(function () { d.remove(); }, ms || 3500); }
  E.on('toast', function (t) { toast(t, 5000); });
  window.addEventListener('error', function (e) { toast('Błąd: ' + (e.message || e)); });

  // ---------- start ----------
  var started = false; function start() { if (started) return; started = true; E.init(); $('#start').classList.add('hidden'); buildDJ(); buildPads(); engines(); requestAnimationFrame(loop); }
  $('#startBtn').onclick = start;

  // ---------- tabs ----------
  var viz = null;
  $$('#tabs button').forEach(function (b) { b.onclick = function () { showTab(b.dataset.t); }; });
  function showTab(t) {
    $$('#tabs button').forEach(function (x) { x.classList.toggle('on', x.dataset.t === t); });
    $$('.tab').forEach(function (x) { x.classList.toggle('on', x.id === 't-' + t); });
    if (t === 'viz') { if (!viz && E.ctx) viz = D7MegaShow.create($('#vizMount'), { ctx: E.ctx, input: E.analyser, recDest: E.recDest }); }
    else if (viz && !viz.root.querySelector('.d7ms-rec.on') && !document.fullscreenElement) { try { viz.destroy(); } catch (e) {} viz = null; }
  }

  // ---------- header ----------
  $('#bpm').addEventListener('change', function () { E.setBpm(+this.value); });
  $('#tap').onclick = function () { E.tap(); };
  E.on('bpm', function (b) { $('#bpm').value = b; });
  $('#mvol').addEventListener('input', function () { if (E.master) E.master.gain.setTargetAtTime(+this.value, E.ctx.currentTime, .02); });
  $('#recMix').onclick = function () { if (E.rec.r) E.rec.stop(); else E.rec.start(); };
  E.on('rec', function (R) { $('#recMix').classList.toggle('on', !!R.r); $('#recMix').textContent = R.r ? '⏹ STOP REC' : '⏺ REC MIX'; if (!R.r) $('#recTime').textContent = ''; });
  $('#fsBtn').onclick = function () { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(function () {}); };
  E.on('beat', function (b) { var d = $$('#beats i'); d.forEach(function (x, i) { x.className = i === ((b % 4) + 4) % 4 ? (i === 0 ? 'b1' : 'b') : ''; }); });

  var ENG = [['DECK', 'Silnik decków: 2 decki, pitch ±8/16/50%, BPM auto, SYNC tempo+faza, hot cue, loopy'], ['MIX', 'Mikser: EQ 3-pasmowy, filtr LP/HP, echo + reverb send, crossfader'], ['FX', 'FX: 10 efektów (Echo, Reverb, Flanger, Phaser, Filter LFO, Crush, Roll, Trans, Spiral, Noise) z faderami, sync z BPM'], ['LOOP', 'Loop station: 40 padów, kwantyzacja do taktu, kolumny, bounce'], ['GEN', 'Generatory: 77 presetów, 21 stylów, remix, mega-mix, set'], ['VIZ', 'Mega Show 777: WebGL, przejścia 7/13 s, sync 2/4 bity, nagrywanie wideo'], ['MIDI', 'MIDI: MC-707 i kontrolery, learn, clock in/out']];
  function engines() {
    $('#engines').innerHTML = ENG.map(function (e) { return '<span class="ok" title="' + esc(e[1]) + '">' + e[0] + '</span>'; }).join('');
    $('#engList').innerHTML = ENG.map(function (e, i) { return '<div><b>' + (i + 1) + '. ' + e[0] + '</b><br>' + esc(e[1]) + '</div>'; }).join('');
  }
  engines();

  // ---------- DJ ----------
  function buildDJ() {
    $$('.deck').forEach(function (el) {
      var i = +el.dataset.d, n = 'AB'[i];
      el.innerHTML = '<div class="dtitle">Deck ' + n + ' · <span class="tt">pusty</span></div>' +
        '<div class="dinfo"><span class="bpmv">— BPM</span><span class="tm">0:00 / 0:00</span></div><canvas class="wave" width="1000" height="84"></canvas>' +
        '<div class="dbtns"><button class="play" data-midi="play' + n + '">▶</button><button class="cue" data-midi="cue' + n + '">CUE</button><button class="sync" data-midi="sync' + n + '">SYNC</button>' +
        '<label class="filebtn">📂 Wczytaj<input type="file" accept="audio/*,video/*" hidden></label><button class="gen">🧪 Generuj</button><button class="tempo" title="Ustaw globalne BPM z tego decka">BPM→zegar</button></div>' +
        '<div class="dbtns hc">' + [1, 2, 3, 4].map(function (k) { return '<button data-h="' + (k - 1) + '" data-midi="hot' + n + k + '" title="Hot cue ' + k + ' (prawy klik = usuń)">' + k + '</button>'; }).join('') +
        '<span class="sep"></span><span class="loopb">' + [1, 2, 4, 8, 16].map(function (b) { return '<button data-l="' + b + '" data-midi="loop' + n + b + '">' + b + '</button>'; }).join('') + '<button data-l="0">OFF</button><button data-ls=".5">½</button><button data-ls="2">×2</button></span></div>' +
        '<div class="drow"><label>Pitch <input class="pitch" type="range" min="-8" max="8" step="0.01" value="0" data-midi="pitch' + n + '" style="width:180px"></label><span class="pv">0.00%</span>' +
        '<select class="range"><option value="8">±8%</option><option value="16">±16%</option><option value="50">±50%</option></select><button class="nd" data-n="-2">◀</button><button class="nd" data-n="2">▶</button><button class="p0">0</button></div>';
      var d = E.decks[i];
      $('.play', el).onclick = function () { d.toggle(); };
      $('.cue', el).onclick = function () { d.cue(); };
      $('.sync', el).onclick = function () { d.sync(); };
      $('input[type=file]', el).onchange = function () { var f = this.files[0]; if (f) loadFileTo(i, f); this.value = ''; };
      $('.gen', el).onclick = function () { var p = randPreset('track'); toast('Generuję: ' + p.name); G.renderPreset(p).then(function (r) { d.load(r.buffer, r.name, r.bpm, 0); }); };
      $('.tempo', el).onclick = function () { if (d.curBpm()) E.setBpm(Math.round(d.curBpm() * 10) / 10); };
      $$('.hc [data-h]', el).forEach(function (b) { b.onclick = function () { d.hotcue(+b.dataset.h); }; b.oncontextmenu = function (e) { e.preventDefault(); d.hotcue(+b.dataset.h, true); }; });
      $$('[data-l]', el).forEach(function (b) { b.onclick = function () { d.setLoop(+b.dataset.l); }; });
      $$('[data-ls]', el).forEach(function (b) { b.onclick = function () { d.loopScale(+b.dataset.ls); }; });
      var pitch = $('.pitch', el);
      pitch.oninput = function () { d.setPitch(+pitch.value); };
      pitch.ondblclick = function () { pitch.value = 0; d.setPitch(0); };
      $('.range', el).onchange = function () { var r = +this.value; pitch.min = -r; pitch.max = r; };
      $$('.nd', el).forEach(function (b) { b.onclick = function () { d.nudge(+b.dataset.n); }; });
      $('.p0', el).onclick = function () { pitch.value = 0; d.setPitch(0); };
      var cv = $('.wave', el); cv.onclick = function (e) { if (!d.buffer) return; var r = cv.getBoundingClientRect(); d.seek((e.clientX - r.left) / r.width * d.buffer.duration); };
      cv.addEventListener('dragover', function (e) { e.preventDefault(); }); cv.addEventListener('drop', function (e) { e.preventDefault(); var f = e.dataTransfer.files[0]; if (f) loadFileTo(i, f); });
    });
    // mixer
    var mx = $('#mixer');
    mx.innerHTML = '<div class="chs">' + [0, 1].map(function (i) { var n = 'AB'[i]; return '<div class="ch" data-c="' + i + '"><b style="color:' + (i ? 'var(--b)' : 'var(--a)') + '">' + n + '</b>' +
      '<label>TRIM<input data-k="trim" data-midi="trim' + n + '" type="range" min="0" max="2" step="0.01" value="1"></label>' +
      '<label>HI<input data-k="hi" data-midi="hi' + n + '" type="range" min="-26" max="8" step="0.1" value="0"></label>' +
      '<label>MID<input data-k="mi" data-midi="mid' + n + '" type="range" min="-26" max="8" step="0.1" value="0"></label>' +
      '<label>LOW<input data-k="lo" data-midi="low' + n + '" type="range" min="-26" max="8" step="0.1" value="0"></label>' +
      '<label>FILTER (LP ◀ ▶ HP)<input data-k="flt" data-midi="flt' + n + '" type="range" min="-1" max="1" step="0.01" value="0"></label>' +
      '<label>ECHO<input data-k="echo" data-midi="echo' + n + '" type="range" min="0" max="1" step="0.01" value="0"></label>' +
      '<label>REVERB<input data-k="rev" data-midi="rev' + n + '" type="range" min="0" max="1" step="0.01" value="0"></label>' +
      '<div class="vfad"><input class="vert" data-k="fad" data-midi="fader' + n + '" type="range" min="0" max="1" step="0.01" value="0.85"><div class="vu"><i></i></div></div></div>'; }).join('') + '</div>' +
      '<div class="xf"><label class="small">CROSSFADER</label><input id="xf" type="range" min="-1" max="1" step="0.01" value="0" data-midi="xfader"><div class="bar" style="justify-content:center"><select id="xfc"><option value="smooth">Krzywa: miękka</option><option value="sharp">Krzywa: ostra (cut)</option></select><button id="xf0">◀ A</button><button id="xfm">Środek</button><button id="xf1">B ▶</button></div>' +
      '<div class="bar" style="justify-content:center"><span class="small">Echo:</span>' + [['1/4', .25], ['1/2', .5], ['3/4', .75], ['1', 1], ['2', 2]].map(function (x) { return '<button class="eb' + (x[1] === .75 ? ' on' : '') + '" data-b="' + x[1] + '">' + x[0] + '</button>'; }).join('') + '</div></div>';
    $$('.ch', mx).forEach(function (ch) { var d = E.decks[+ch.dataset.c];
      $$('input', ch).forEach(function (inp) { inp.addEventListener('input', function () { var v = +inp.value, k = inp.dataset.k, t = E.ctx.currentTime;
        if (k === 'trim') d.trim.gain.setTargetAtTime(v, t, .02); else if (k === 'hi' || k === 'mi' || k === 'lo') d.eq(k, v); else if (k === 'flt') d.filter(v);
        else if (k === 'echo') d.echoSend.gain.setTargetAtTime(v * .9, t, .02); else if (k === 'rev') d.revSend.gain.setTargetAtTime(v * .9, t, .02); else if (k === 'fad') d.setFader(v); });
        inp.addEventListener('dblclick', function () { inp.value = inp.defaultValue; inp.dispatchEvent(new Event('input')); }); }); });
    $('#xf').addEventListener('input', function () { E.xfader(+this.value); });
    E.on('xf', function (v) { $('#xf').value = v; });
    $('#xfc').onchange = function () { E.xfCurve = this.value; E.xfader(E.xf); };
    $('#xf0').onclick = function () { $('#xf').value = -1; E.xfader(-1); }; $('#xf1').onclick = function () { $('#xf').value = 1; E.xfader(1); }; $('#xfm').onclick = function () { $('#xf').value = 0; E.xfader(0); };
    $$('.eb', mx).forEach(function (b) { b.onclick = function () { $$('.eb', mx).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); E.setEcho(+b.dataset.b); }; });
    E.setEcho(.75);
    // FX units
    $$('.fx').forEach(function (el) {
      var u = el.dataset.fx === '1' ? E.fx1 : E.fx2, n = el.dataset.fx;
      el.innerHTML = '<h4>FX ' + n + ' · BEAT FX</h4><div class="fxt">' + E.FX_TYPES.map(function (t) { return '<button data-t="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
        '<div class="ctl"><span class="small">Beat:</span>' + [['1/4', .25], ['1/2', .5], ['3/4', .75], ['1', 1], ['2', 2], ['4', 4]].map(function (x) { return '<button class="bb" data-b="' + x[1] + '">' + x[0] + '</button>'; }).join('') + '</div>' +
        '<div class="ctl"><label>LEVEL/WET <input class="lv" type="range" min="0" max="1" step="0.01" value="0.6" data-midi="fx' + n + 'lvl"></label><label>DEPTH <input class="dp" type="range" min="0" max="1" step="0.01" value="0.5" data-midi="fx' + n + 'dep"></label>' +
        '<button class="fxon" data-midi="fx' + n + 'on">OFF</button><button class="hold" title="Przytrzymaj = efekt chwilowo">HOLD</button></div>';
      function paint() { $$('.fxt button', el).forEach(function (b) { b.classList.toggle('sel', b.dataset.t === u.type); }); $$('.bb', el).forEach(function (b) { b.classList.toggle('on', +b.dataset.b === u.beats); }); var o = $('.fxon', el); o.classList.toggle('on', u.on); o.textContent = u.on ? 'ON' : 'OFF'; }
      $$('.fxt button', el).forEach(function (b) { b.onclick = function () { u.set('type', b.dataset.t); paint(); }; });
      $$('.bb', el).forEach(function (b) { b.onclick = function () { u.set('beats', +b.dataset.b); paint(); }; });
      $('.lv', el).oninput = function () { u.set('level', +this.value); };
      $('.dp', el).onchange = function () { u.set('depth', +this.value); };
      $('.fxon', el).onclick = function () { u.set('on', !u.on); paint(); };
      var hold = $('.hold', el); hold.onpointerdown = function () { u.set('on', true); paint(); }; hold.onpointerup = hold.onpointerleave = function () { if (u.on) { u.set('on', false); paint(); } };
      paint();
    });
  }
  function loadFileTo(i, f) {
    toast('Wczytuję: ' + f.name);
    E.decodeFile(f).then(function (buf) { E.decks[i].load(buf, f.name.replace(/\.[^.]+$/, '')); toast('Deck ' + 'AB'[i] + ': ' + f.name + ' · ' + (E.decks[i].bpm || '?') + ' BPM'); })
      .catch(function () { toast('Nie udało się odczytać pliku (spróbuj MP3/WAV/M4A/OGG).'); });
  }
  $$('[data-load]').forEach(function (inp) { inp.onchange = function () { if (this.files[0]) { E.init(); if (!E.decks) start(); loadFileTo(+this.dataset.load, this.files[0]); } this.value = ''; }; });
  E.on('deck', function (d) {
    var el = $('.deck[data-d="' + d.i + '"]'); if (!el) return;
    $('.tt', el).textContent = d.title; $('.play', el).textContent = d.playing ? '⏸' : '▶'; $('.play', el).classList.toggle('on', d.playing);
    $('.bpmv', el).textContent = d.bpm ? (d.curBpm().toFixed(1) + ' BPM') : '— BPM';
    $$('.hc [data-h]', el).forEach(function (b, k) { b.classList.toggle('set', d.hot[k] != null); });
    $$('[data-l]', el).forEach(function (b) { b.classList.toggle('on', !!d.loop && +b.dataset.l === d.loop.beats); });
    $('.pv', el).textContent = (d.pitch >= 0 ? '+' : '') + d.pitch.toFixed(2) + '%'; var pi = $('.pitch', el); if (Math.abs(+pi.value - d.pitch) > .001) { if (Math.abs(d.pitch) > +pi.max) { var r = Math.abs(d.pitch) > 16 ? 50 : 16; $('.range', el).value = r; pi.min = -r; pi.max = r; } pi.value = d.pitch; }
  });
  function drawWave(d, cv) {
    var c = cv.getContext('2d'), W = cv.width, H = cv.height; c.fillStyle = '#05010d'; c.fillRect(0, 0, W, H);
    if (!d.peaks) { c.fillStyle = '#2a1d55'; c.fillText(d.media ? 'Stream na żywo' : 'Wczytaj plik lub wygeneruj utwór', 10, H / 2); return; }
    var n = d.peaks.length, col = d.i ? '#25e0ff' : '#ff2fb3', pos = d.position() / d.buffer.duration;
    for (var x = 0; x < n; x++) { var v = d.peaks[x] * H * .95; c.fillStyle = x / n < pos ? col : (d.i ? '#1b5f73' : '#6a1a52'); c.fillRect(x * W / n, (H - v) / 2, Math.max(1, W / n), v); }
    if (d.loop) { c.fillStyle = 'rgba(61,255,158,.18)'; c.fillRect(d.loop.start / d.buffer.duration * W, 0, (d.loop.end - d.loop.start) / d.buffer.duration * W, H); }
    d.hot.forEach(function (t, k) { if (t != null) { c.fillStyle = '#ffd23f'; c.fillRect(t / d.buffer.duration * W, 0, 2, H); c.fillText(k + 1, t / d.buffer.duration * W + 3, 10); } });
    c.fillStyle = '#fff'; c.fillRect(pos * W - 1, 0, 3, H);
  }
  var mvu = $('#mvu').getContext('2d'), mbuf = null, lastRec = 0;
  function loop() {
    requestAnimationFrame(loop); if (!E.decks) return;
    E.decks.forEach(function (d) { var el = $('.deck[data-d="' + d.i + '"]'); drawWave(d, $('.wave', el)); var dur = d.buffer ? d.buffer.duration : 0, p = d.position();
      $('.tm', el).textContent = d.media ? 'LIVE' : fmt(p) + ' / ' + fmt(dur) + (dur ? '  −' + fmt((dur - p) / d.rate) : '');
      var vu = $('.ch[data-c="' + d.i + '"] .vu i'); if (vu) vu.style.height = Math.min(100, d.level() * 110) + '%'; });
    if (!mbuf) mbuf = new Uint8Array(E.analyser.fftSize); E.analyser.getByteTimeDomainData(mbuf); var m = 0; for (var i = 0; i < mbuf.length; i += 4) m = Math.max(m, Math.abs(mbuf[i] - 128)); m /= 128;
    mvu.fillStyle = '#130b2a'; mvu.fillRect(0, 0, 90, 14); mvu.fillStyle = m > .95 ? '#ff2f4f' : m > .7 ? '#ffd23f' : '#3dff9e'; mvu.fillRect(0, 0, 90 * m, 14);
    if (E.rec.r && Date.now() - lastRec > 500) { lastRec = Date.now(); $('#recTime').textContent = fmt((Date.now() - E.rec.t0) / 1000); }
  }

  // ---------- PADS ----------
  var sel = -1, editMode = false;
  function buildPads() {
    var P = E.pads;
    $('#padHead').innerHTML = G.STEM_COLS.map(function (c, i) { return '<div>' + c[0] + '<input type="range" min="0" max="1.2" step="0.01" value="1" data-col="' + i + '" data-midi="col' + (i + 1) + '"></div>'; }).join('');
    $$('#padHead input').forEach(function (inp) { inp.oninput = function () { P.colVol(+inp.dataset.col, +inp.value); }; });
    $('#padGrid').innerHTML = P.pads.map(function (p) { return '<div class="pad empty" data-p="' + p.i + '" style="--c:' + p.color + '"><span class="n">' + (p.i + 1) + '</span><span class="k"></span></div>'; }).join('');
    $$('#padGrid .pad').forEach(function (el) { el.addEventListener('pointerdown', function (e) { e.preventDefault(); var i = +el.dataset.p; if (editMode) { selectPad(i); return; } P.trigger(i); }); });
    P.pads.forEach(paintPad);
    fillPads(G.STYLE_KEYS[0], true);
  }
  function paintPad(p) { var el = $('.pad[data-p="' + p.i + '"]'); if (!el) return; el.style.setProperty('--c', p.color); el.classList.toggle('on', p.on); el.classList.toggle('pend', p.pending); el.classList.toggle('empty', !p.buffer); el.classList.toggle('sel', p.i === sel);
    $('.k', el).textContent = p.buffer ? (p.name + (p.oneShot ? ' · 1×' : '')) : '—'; }
  E.on('pads', paintPad);
  E.on('padEmpty', function (p) { toast('Pad ' + (p.i + 1) + ' pusty — ✏️ Edycja → wczytaj sample / 🎤 / generuj.'); });
  var padBusy = false;
  function fillPads(style, quiet) {
    if (padBusy) return; padBusy = true; var bpm = E.clock.bpm, key = Math.floor(Math.random() * 12), base = Math.floor(Math.random() * 1e8), jobs = [];
    var btn = $('#padGen'); btn.disabled = true;
    for (var row = 0; row < 5; row++) for (var col = 0; col < 8; col++) jobs.push([row, col]);
    var k = 0;
    (function next() {
      if (k >= jobs.length) { padBusy = false; btn.disabled = false; btn.textContent = '⚡ Generuj 40 loopów'; if (!quiet) toast('40 loopów gotowe: ' + G.STYLES[style].n + ' · ' + bpm + ' BPM'); return; }
      var j = jobs[k++], row = j[0], col = j[1], st = row === 0 ? style : (row < 3 ? style : G.STYLE_KEYS[(G.STYLE_KEYS.indexOf(style) + row * 3) % G.STYLE_KEYS.length]);
      if (G.STYLES[st].bpm[0] < 100 !== G.STYLES[style].bpm[0] < 100) st = style;
      btn.textContent = '⏳ ' + k + '/40';
      G.renderStem(st, base + row * 101, col, bpm, key, (col === 4 || col === 5 || row === 4) ? 4 : 2).then(function (r) {
        E.pads.set(row * 8 + col, r.buffer, G.STYLES[st].n.split(' ')[0] + ' ' + (row + 1), bpm, E.PAD_COLORS[col]); next();
      }).catch(function (e) { console.error(e); next(); });
    })();
  }
  function selectPad(i) {
    sel = i; E.pads.pads.forEach(paintPad); var p = E.pads.pads[i], box = $('#padSel'); box.classList.remove('hidden');
    box.innerHTML = '<b>Pad ' + (i + 1) + '</b> <span class="muted">' + esc(p.name || 'pusty') + '</span>' +
      '<label>Głośność <input id="psVol" type="range" min="0" max="1.5" step="0.01" value="' + p.vol + '"></label>' +
      '<label>Kolor <input id="psCol" type="color" value="' + p.color + '"></label><button id="psOne" class="tg' + (p.oneShot ? ' on' : '') + '">1× one-shot</button>' +
      '<label class="filebtn">📂 Sample<input id="psFile" type="file" accept="audio/*" hidden></label><button id="psMic">🎤 Głos do beatu (1 takt)</button><button id="psGen">🧪 Generuj loop</button><button id="psDeck">→ z Decka A (loop)</button><button id="psClr">🗑 Wyczyść</button><button id="psPlay">▶ Test</button>';
    $('#psVol').oninput = function () { p.vol = +this.value; if (p.g) p.g.gain.value = p.vol; };
    $('#psCol').oninput = function () { p.color = this.value; paintPad(p); };
    $('#psOne').onclick = function () { p.oneShot = !p.oneShot; this.classList.toggle('on', p.oneShot); paintPad(p); };
    $('#psFile').onchange = function () { var f = this.files[0]; if (!f) return; E.decodeFile(f).then(function (b) { var d = E.detectBpm(b); E.pads.set(i, b, f.name.slice(0, 14), b.duration > 1.5 && d.bpm ? d.bpm : 0); if (b.duration < 1.5) { p.oneShot = true; paintPad(p); } toast('Pad ' + (i + 1) + ': ' + f.name); }); };
    $('#psMic').onclick = function () { micToPad(i); };
    $('#psGen').onclick = function () { var st = $('#padStyle').value; G.renderStem(st, Math.floor(Math.random() * 1e9), p.col, E.clock.bpm, null, 2).then(function (r) { E.pads.set(i, r.buffer, G.STYLES[st].n.split(' ')[0] + ' ' + r.name, E.clock.bpm); }); };
    $('#psDeck').onclick = function () { var d = E.decks[0]; if (!d.buffer) { toast('Deck A pusty.'); return; } var bl = d.beatLen(), st = d.loop ? d.loop.start : Math.max(0, d.phase + Math.floor((d.position() - d.phase) / bl) * bl), beats = d.loop ? d.loop.beats : 4;
      var n = Math.round(beats * bl * d.buffer.sampleRate), s0 = Math.round(st * d.buffer.sampleRate), b = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: d.buffer.sampleRate });
      for (var ch = 0; ch < 2; ch++) b.copyToChannel(d.buffer.getChannelData(Math.min(ch, d.buffer.numberOfChannels - 1)).subarray(s0, s0 + n), ch); E.pads.set(i, b, 'Deck A ' + beats + 'b', d.bpm); };
    $('#psClr').onclick = function () { E.pads.set(i, null, '', 0); };
    $('#psPlay').onclick = function () { E.pads.trigger(i); };
  }
  function micToPad(i) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('Mikrofon niedostępny.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      var ctx = E.ctx, src = ctx.createMediaStreamSource(stream), sp = ctx.createScriptProcessor(4096, 1, 1), when = E.nextBar(), len = E.barLen(), N = Math.round(len * ctx.sampleRate), buf = new Float32Array(N), w = 0, mute = ctx.createGain(); mute.gain.value = 0;
      toast('🎤 Nagrywam 1 takt od następnej „1”…', len * 2000);
      sp.onaudioprocess = function (e) { var t = e.playbackTime; if (t + 4096 / ctx.sampleRate < when || w >= N) return; var d = e.inputBuffer.getChannelData(0), s = Math.max(0, Math.round((when - t) * ctx.sampleRate)); for (var k = s; k < d.length && w < N; k++) buf[w++] = d[k];
        if (w >= N) { sp.disconnect(); src.disconnect(); stream.getTracks().forEach(function (x) { x.stop(); }); var b = ctx.createBuffer(2, N, ctx.sampleRate); b.copyToChannel(buf, 0); b.copyToChannel(buf, 1); G.normalize(b); E.pads.set(i, b, '🎤 Głos', E.clock.bpm); toast('Głos w padzie ' + (i + 1) + ' (zsynchronizowany z beatem).'); } };
      src.connect(sp); sp.connect(mute); mute.connect(ctx.destination);
    }).catch(function (e) { toast('Mikrofon: ' + e.message); });
  }
  $('#padStyle').innerHTML = G.STYLE_KEYS.map(function (k) { return '<option value="' + k + '">' + G.STYLES[k].n + '</option>'; }).join('');
  $('#padGen').onclick = function () { var st = $('#padStyle').value, b = G.STYLES[st].bpm; if (E.clock.bpm < b[0] - 10 || E.clock.bpm > b[1] + 10) E.setBpm(Math.round((b[0] + b[1]) / 2)); fillPads(st); };
  $('#padSync').onclick = function () { E.pads.sync = !E.pads.sync; this.classList.toggle('on', E.pads.sync); };
  $('#padExcl').onclick = function () { E.pads.exclusive = !E.pads.exclusive; this.classList.toggle('on', E.pads.exclusive); };
  $('#padEdit').onclick = function () { editMode = !editMode; this.classList.toggle('on', editMode); if (!editMode) { sel = -1; $('#padSel').classList.add('hidden'); E.pads.pads.forEach(paintPad); } else toast('Edycja: kliknij pad, żeby go ustawić.'); };
  $('#padCut').oninput = function () { E.pads.cutoff(+this.value); };
  $('#padVol').oninput = function () { E.pads.out.gain.setTargetAtTime(+this.value, E.ctx.currentTime, .02); };
  $('#padStop').onclick = function () { E.pads.stopAll(); };
  $('#padColors').onclick = function () { var sh = Math.floor(Math.random() * 360); E.pads.pads.forEach(function (p) { p.color = 'hsl(' + ((sh + p.col * 45 + p.row * 9) % 360) + ',95%,60%)'; paintPad(p); }); };
  function bounce(to) { var b = E.pads.bounce(); if (!b) { toast('Włącz najpierw pady do bounce.'); return; } var name = 'Bounce ' + E.clock.bpm + ' BPM';
    if (to === 'w') E.save(G.wav(b, E.wavBits()), 'D7S-bounce-' + E.stamp() + '.wav'); else { var reps = Math.max(1, Math.round(64 / (b.duration / E.barLen() * 4))), arr = []; for (var r = 0; r < reps; r++) arr.push(b); var long = concatPlain(arr); E.decks[to].load(long, name, E.clock.bpm, 0); toast('Bounce → Deck ' + 'AB'[to]); } }
  function concatPlain(arr) { var n = arr.reduce(function (a, b) { return a + b.length; }, 0), o = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: arr[0].sampleRate }), p = 0; arr.forEach(function (b) { for (var c = 0; c < 2; c++) o.getChannelData(c).set(b.getChannelData(Math.min(c, b.numberOfChannels - 1)), p); p += b.length; }); return o; }
  $('#bounceA').onclick = function () { bounce(0); }; $('#bounceB').onclick = function () { bounce(1); }; $('#bounceW').onclick = function () { bounce('w'); };

  // ---------- GENERATORS ----------
  function randPreset(mode) { var a = G.PRESETS.filter(function (p) { return !mode || p.mode === mode; }); return a[Math.floor(Math.random() * a.length)]; }
  var last = null, previewSrc = null;
  function stopPreview() { if (previewSrc) { try { previewSrc.stop(); } catch (e) {} previewSrc = null; } }
  function showResult(r, box) {
    last = r; box = box || $('#genOut'); var q = function (c) { return box.querySelector('.' + c); };
    box.innerHTML = '<b>' + esc(r.name) + '</b> <span class="muted">' + r.bpm + ' BPM · ' + fmt(r.buffer.duration) + ' · ' + (r.buffer.sampleRate / 1000) + ' kHz</span><canvas width="1000" height="70"></canvas>' +
      '<div class="bar"><button class="goPlay hot">▶ Podgląd</button><button class="goStop">⏹</button><button class="goA">→ Deck A</button><button class="goB">→ Deck B</button><button class="goQ">→ Auto-DJ</button><button class="goPads">→ Pady (pocięte)</button><button class="goWav">💾 WAV</button><button class="goRemix">🔀 Remix tego</button></div>';
    var pk = new Float32Array(1000), d = r.buffer.getChannelData(0), st = Math.floor(d.length / 1000); for (var i = 0; i < 1000; i++) { var m = 0; for (var j = 0; j < st; j += 32) m = Math.max(m, Math.abs(d[i * st + j])); pk[i] = m; }
    var c = box.querySelector('canvas').getContext('2d'); c.fillStyle = '#3dff9e'; for (i = 0; i < 1000; i++) c.fillRect(i, 35 - pk[i] * 34, 1, pk[i] * 68);
    if (r.sections) { c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '13px sans-serif'; var tot = r.sections.reduce(function (a, s) { return a + s.bars; }, 0); r.sections.forEach(function (s) { var x = s.start / tot * 1000; c.fillRect(x, 0, 1, 70); c.fillText(s.name, x + 3, 12); }); }
    q('goPlay').onclick = function () { play(r); }; q('goStop').onclick = stopPreview;
    q('goA').onclick = function () { stopPreview(); E.decks[0].load(r.buffer, r.name, r.bpm, 0); toast('→ Deck A'); };
    q('goB').onclick = function () { stopPreview(); E.decks[1].load(r.buffer, r.name, r.bpm, 0); toast('→ Deck B'); };
    q('goQ').onclick = function () { E.autodj.queue.push(r); paintQueue(); toast('Dodano do Auto-DJ'); };
    q('goPads').onclick = function () { slicesToPads(r); };
    q('goWav').onclick = function () { E.save(G.wav(r.buffer, E.wavBits()), 'D7S-' + r.name.replace(/[^\w\-]+/g, '_').slice(0, 50) + '.wav'); };
    q('goRemix').onclick = function () { showTab('gen'); busy('Remix…', G.remix(r.buffer, r.bpm, $('#rxStyle').value)); };
  }
  function lastResult() { return last; }
  function play(r) { stopPreview(); E.init(); var s = E.ctx.createBufferSource(); s.buffer = r.buffer; s.loop = r.buffer.duration < 20; s.connect(E.preview); s.start(); previewSrc = s; }
  function slicesToPads(r) { // cut into 2-bar slices -> free column (col 7) + row
    var bar = 4 * 60 / r.bpm, n = Math.round(2 * bar * r.buffer.sampleRate), total = Math.floor(r.buffer.length / n), k = 0;
    for (var i = 0; i < 5 && i < total; i++) { var s0 = Math.floor((i * total / 5)) * n, b = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: r.buffer.sampleRate }); for (var ch = 0; ch < 2; ch++) b.copyToChannel(r.buffer.getChannelData(ch).subarray(s0, s0 + n), ch); E.pads.set(i * 8 + 7, b, 'Slice ' + (i + 1), r.bpm); k++; }
    if (E.clock.bpm !== r.bpm) E.setBpm(r.bpm); toast(k + ' fragmentów w kolumnie „Full loop” (pady 8,16,24,32,40).');
  }
  function busy(label, p) { E.init(); var box = $('#genOut'); box.innerHTML = '<b>⏳ ' + esc(label) + '</b> <span class="muted">renderuję offline…</span>'; return p.then(function (r) { showResult(r); play(r); return r; }).catch(function (e) { box.innerHTML = 'Błąd: ' + esc(e.message); }); }
  var QUICK = [['🎤 Hip-Hop beat', 'hiphop', 'loop'], ['⚙️ Techno', 'techno', 'track'], ['🏚 Hood', 'hood', 'loop'], ['📼 Classic', 'classic', 'loop'], ['🏠 House', 'house', 'track'], ['🍄 Psy', 'psy', 'track'], ['🔥 Trap', 'trap', 'loop'], ['💿 Set (track)', 'trance', 'track']];
  $('#genQuick').innerHTML = QUICK.map(function (q, i) { return '<button class="hot" data-q="' + i + '">' + q[0] + '</button>'; }).join('');
  $$('#genQuick button').forEach(function (b) { b.onclick = function () { var q = QUICK[+b.dataset.q]; busy(q[0], G.render({ style: q[1], mode: q[2], seed: Math.floor(Math.random() * 1e9) })); }; });
  $('#gStyle').innerHTML = $('#rxStyle').innerHTML = G.STYLE_KEYS.map(function (k) { return '<option value="' + k + '">' + G.STYLES[k].n + '</option>'; }).join('');
  $('#pFilter').innerHTML += G.STYLE_KEYS.map(function (k) { return '<option value="' + k + '">' + G.STYLES[k].n + '</option>'; }).join('');
  $('#gKey').innerHTML = '<option value="">auto</option>' + ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(function (k, i) { return '<option value="' + i + '">' + k + '</option>'; }).join('');
  $('#gGo').onclick = function () { busy('Generator', G.render({ style: $('#gStyle').value, bpm: +$('#gBpm').value || 0, key: $('#gKey').value === '' ? null : +$('#gKey').value, mode: $('#gMode').value, seed: Math.floor(Math.random() * 1e9) })); };
  $('#gMagic').onclick = function () { var p = randPreset(); busy(p.name, G.render({ style: p.style, mode: p.mode, seed: Math.floor(Math.random() * 1e9) })); };
  $('#megaBtns').innerHTML = [1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<button data-m="' + (k - 1) + '">🌀 ' + k + '</button>'; }).join('');
  $$('#megaBtns button').forEach(function (b) { b.onclick = function () { var box = $('#genOut'); busy('Mega Mix ' + (+b.dataset.m + 1), G.megaMix(+b.dataset.m, function (i, n, st) { box.innerHTML = '<b>⏳ Mega Mix ' + (+b.dataset.m + 1) + '</b> część ' + (i + 1) + '/' + n + ': ' + G.STYLES[st].n; })); }; });
  $('#rxGo').onclick = function () { var d = E.decks[+$('#rxSrc').value]; if (!d || !d.buffer) { toast('Wczytaj najpierw utwór na deck (plik lub generator).'); return; } busy('Remix generator', G.remix(d.buffer, d.bpm || 120, $('#rxStyle').value)); };
  $('#setGo').onclick = function () { var n = +$('#setN').value, base = G.STYLE_KEYS.filter(function (k) { return G.STYLES[k].bpm[0] >= 118 && k !== 'ambient'; }), bpm = 124;
    for (var i = 0; i < n; i++) (function (i) { var st = base[Math.floor(Math.random() * base.length)], b = Math.min(150, 124 + i * 3), seed = Math.floor(Math.random() * 1e9);
      E.autodj.queue.push({ name: 'Set ' + (i + 1) + '/' + n + ' · ' + G.STYLES[st].n + ' ' + b + ' BPM', make: function () { return G.render({ style: st, bpm: b, seed: seed, mode: 'track' }); } }); })(i);
    paintQueue(); toast('Set ' + n + ' utworów (124 → ' + Math.min(150, 124 + (n - 1) * 3) + ' BPM) w kolejce Auto-DJ.'); showTab('auto'); };
  function paintPresets() { var f = $('#pFilter').value; $('#presets').innerHTML = G.PRESETS.filter(function (p) { return !f || p.style === f; }).map(function (p) { return '<div class="preset" data-id="' + p.id + '"><b>' + esc(p.name) + '</b><span>' + p.bpm + ' BPM · ' + (p.mode === 'loop' ? 'loop' : 'utwór') + '</span></div>'; }).join('');
    $$('#presets .preset').forEach(function (el) { el.onclick = function () { var p = G.PRESETS[+el.dataset.id - 1]; el.classList.add('busy'); busy(p.name, G.renderPreset(p)).then(function () { el.classList.remove('busy'); }); window.scrollTo({ top: 0, behavior: 'smooth' }); }; }); }
  $('#pFilter').onchange = paintPresets; paintPresets();

  // ---------- AUTO-DJ ----------
  function paintQueue() { var A = E.autodj; $('#adQueue').innerHTML = A.queue.length ? A.queue.map(function (q, i) { return '<li>' + esc(q.name) + (q.buffer ? '' : ' <span class="muted">(generuje się przy odtworzeniu)</span>') + '<button data-x="' + i + '">✕</button></li>'; }).join('') : '<li class="muted">Kolejka pusta' + (A.gen ? ' — Auto-DJ będzie generował utwory z 77 presetów.' : '.') + '</li>';
    $$('#adQueue [data-x]').forEach(function (b) { b.onclick = function () { A.queue.splice(+b.dataset.x, 1); paintQueue(); }; });
    var on = $('#adOn'); on.classList.toggle('on', A.on); on.textContent = '🤖 Auto-DJ: ' + (A.on ? 'WŁ' : 'WYŁ'); }
  E.on('autodj', paintQueue);
  $('#adOn').onclick = function () { E.init(); var A = E.autodj; A.on = !A.on; if (!A.on && A.fading) { clearInterval(A.fading); A.fading = null; } paintQueue(); if (A.on) toast('Auto-DJ start'); };
  $('#adMix').oninput = function () { E.autodj.mixSec = +this.value; $('#adMixV').textContent = this.value + ' s'; };
  $('#adGen').onchange = function () { E.autodj.gen = this.checked; paintQueue(); };
  $('#adNow').onclick = function () { var A = E.autodj; if (A.busy || A.fading) return; var live = E.decks.filter(function (d) { return d.playing && d.buffer; }); if (!live.length) A.next(0); else A.next(1 - live[0].i, live[0]); };
  $('#adFiles').onchange = function () { Array.prototype.forEach.call(this.files, function (f) { E.autodj.queue.push({ name: f.name, make: function () { return E.decodeFile(f).then(function (b) { var d = E.detectBpm(b); return { buffer: b, name: f.name, bpm: d.bpm, phase: d.phase }; }); } }); }); paintQueue(); this.value = ''; };
  $('#adClear').onclick = function () { E.autodj.queue = []; paintQueue(); };
  paintQueue();

  // ---------- RADIO + YOUTUBE ----------
  var stations = [];
  function baseStations() { return (window.D7_STATIONS || []).map(function (s) { return { name: s[0], url: s[1], tags: 'D7 ✓ sprawdzona', ok: true }; }); }
  function paintStations(list) {
    stations = list; $('#rCount').textContent = list.length + ' stacji';
    $('#rList').innerHTML = list.map(function (s, i) { return '<div class="st"><span title="' + esc(s.url) + '">' + (s.ok ? '✅ ' : '') + esc(s.name) + ' <small>' + esc(s.tags || '') + '</small></span><button data-a="' + i + '">→ A</button><button data-b="' + i + '">→ B</button></div>'; }).join('');
    $$('#rList [data-a]').forEach(function (b) { b.onclick = function () { radioTo(0, stations[+b.dataset.a]); }; });
    $$('#rList [data-b]').forEach(function (b) { b.onclick = function () { radioTo(1, stations[+b.dataset.b]); }; });
  }
  function radioTo(i, s) { if (!E.decks) start(); E.decks[i].loadStream(s.url, s.name); toast('📻 Deck ' + 'AB'[i] + ': ' + s.name); }
  var RB = ['https://de1.api.radio-browser.info', 'https://fi1.api.radio-browser.info', 'https://de2.api.radio-browser.info'];
  function rbFetch(path) { var i = 0; return (function tryNext() { var u = RB[i++]; if (!u) return Promise.reject(new Error('radio-browser offline')); return fetch(u + path).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(tryNext); })(); }
  function search(q, byTag) {
    $('#rCount').textContent = 'szukam…';
    var path = byTag ? '/json/stations/bytag/' + encodeURIComponent(q) + '?hidebroken=true&order=clickcount&reverse=true&limit=200' : '/json/stations/search?name=' + encodeURIComponent(q) + '&hidebroken=true&order=clickcount&reverse=true&limit=200';
    rbFetch(path).then(function (arr) { var seen = {}, list = baseStations().filter(function (s) { return !q || (s.name.toLowerCase().indexOf(q.toLowerCase()) >= 0); });
      arr.forEach(function (s) { var u = s.url_resolved || s.url; if (!/^https:/.test(u) || seen[u]) return; seen[u] = 1; list.push({ name: s.name.trim(), url: u, tags: [s.countrycode, s.codec, s.bitrate ? s.bitrate + 'k' : '', (s.tags || '').split(',').slice(0, 3).join(', ')].filter(Boolean).join(' · ') }); });
      paintStations(list.slice(0, 777)); }).catch(function (e) { paintStations(baseStations()); toast('Katalog radio-browser niedostępny (' + e.message + ') — pokazuję sprawdzone stacje D7.'); });
  }
  var TAGS = ['techno', 'house', 'hip hop', 'drum and bass', 'trance', 'psytrance', 'club', 'dance', 'electronic', 'minimal', 'trap', 'deep house'];
  $('#rTags').innerHTML = TAGS.map(function (t) { return '<button data-t="' + t + '">' + t + '</button>'; }).join('') + '<button id="rAll">🌍 777 klubowych</button>';
  $$('#rTags [data-t]').forEach(function (b) { b.onclick = function () { search(b.dataset.t, true); }; });
  $('#rAll').onclick = function () { $('#rCount').textContent = 'zbieram 777…'; var seen = {}, all = baseStations();
    Promise.all(['techno', 'house', 'club', 'dance', 'electronic', 'hip hop', 'trance', 'drum and bass'].map(function (t) { return rbFetch('/json/stations/bytag/' + encodeURIComponent(t) + '?hidebroken=true&order=clickcount&reverse=true&limit=150').catch(function () { return []; }); }))
      .then(function (res) { res.forEach(function (arr) { arr.forEach(function (s) { var u = s.url_resolved || s.url; if (!/^https:/.test(u) || seen[u]) return; seen[u] = 1; all.push({ name: s.name.trim(), url: u, tags: [s.countrycode, s.codec, (s.tags || '').split(',').slice(0, 2).join(', ')].filter(Boolean).join(' · ') }); }); }); paintStations(all.slice(0, 777)); }); };
  $('#rGo').onclick = function () { search($('#rq').value.trim(), false); };
  $('#rq').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#rGo').click(); });
  paintStations(baseStations());
  function ytId(u) { var m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(u) ? u : null); }
  $('#ytGo').onclick = function () { var id = ytId($('#yt').value.trim()); if (!id) { toast('Wklej link YouTube.'); return; } $('#ytBox').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'; };
  $('#ytOpen').onclick = function () { var id = ytId($('#yt').value.trim()); window.open(id ? 'https://www.youtube.com/watch?v=' + id : 'https://www.youtube.com/results?search_query=techno+dj+set', '_blank'); };

  // ---------- MIDI ----------
  var M = E.midi;
  $('#midiOn').onclick = function () { E.init(); M.init(); };
  E.on('midi', function () { var ins = [], outs = []; if (M.access) { M.access.inputs.forEach(function (i) { ins.push(i.name); }); M.access.outputs.forEach(function (o) { outs.push(o.name); }); }
    $('#midiDev').innerHTML = M.access ? ('<b>Wejścia:</b> ' + (ins.map(esc).join(', ') || 'brak') + '<br><b>Wyjścia:</b> ' + (outs.map(esc).join(', ') || 'brak')) : 'Nie połączono.';
    $('#midiMap').innerHTML = Object.keys(M.map).map(function (k) { return '<div>' + k + ' → <b>' + esc(M.map[k]) + '</b></div>'; }).join('') || '<span class="muted">Domyślnie: nuty 36–75 → pady.</span>';
    $('#midiLearn').classList.toggle('on', !!M.learn); });
  E.on('midilog', function () { $('#midiLog').textContent = M.log.join('\n'); });
  var learning = false;
  $('#midiLearn').onclick = function () { if (!M.access) M.init(); learning = !learning; this.classList.toggle('on', learning); M.learn = null; if (learning) toast('MIDI Learn: kliknij kontrolkę w D7S (np. crossfader, fader, FX ON), potem ruszaj gałką.', 6000); };
  document.addEventListener('pointerdown', function (e) { if (!learning) return; var t = e.target.closest('[data-midi]'); if (!t) return; M.learn = t.dataset.midi; learning = false; $('#midiLearn').classList.remove('on'); toast('Teraz ruszaj kontrolerem dla: ' + M.learn); }, true);
  $('#midiClear').onclick = function () { M.map = {}; localStorage.removeItem('d7s-midimap'); E.emit('midi', M); };
  $('#clkOut').onclick = function () { if (!M.access) M.init(); M.clockOut = !M.clockOut; this.classList.toggle('on', M.clockOut); };
  $('#clkIn').onclick = function () { M.clockIn = !M.clockIn; this.classList.toggle('on', M.clockIn); };
  $('#clkStart').onclick = function () { M.transport(true); }; $('#clkStop').onclick = function () { M.transport(false); };
  E.on('midiCtl', function (m) { var el = document.querySelector('[data-midi="' + m.id + '"]'); if (!el) return;
    if (el.type === 'range') { el.value = +el.min + m.v * (+el.max - +el.min); el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }
    else if (el.type === 'number') { el.value = Math.round(60 + m.v * 120); el.dispatchEvent(new Event('change')); }
    else if (m.note || m.v > .5) el.click(); });

  // ---------- HUB ----------
  var BASE = 'https://danieldydo-cyber.github.io/d7-dj/';
  var LINKS = [['D7 DJ (web)', 'app.html', 'główna aplikacja web'], ['Pobierz (APK / Windows / Mac)', 'download.html', 'wszystkie instalki'], ['Sklep aplikacji', 'sklep.html', 'wersje PRO'], ['Boty D7', 'bots.html', 'Universal Bots'], ['D Unit · Super SI', 'dunit/', 'hub botów'], ['Hub sieci D7', 'hub/', 'wszystko połączone'], ['Agenci', 'agents.html', 'agenci SI'], ['Bot Factory', 'botfactory.html', 'budowa botów'], ['App Builder / Generator', 'app-gen.html', 'generator aplikacji'], ['MK3 Pads', 'mk3.html', '16 padów, MC-707'], ['weDJ', 'wedj.html', 'mikser web'], ['Music Gen', 'music-gen.html', 'generator web'], ['Remixlive', 'remixlive.html', 'loop pady'], ['Radio Gen', 'radio-gen.html', 'radio + generator'], ['Mega Show 777', 'mega-show.html', 'wizualizacje'], ['Visions GL', 'visions-gl.html', 'wizualizacje WebGL'], ['KALI Live', 'kali-live.html', 'radio na żywo'], ['Suto (todo)', 'suto.html', 'zadania'], ['Promo', 'promo.html', 'teksty i grafiki'], ['Udostępnij', 'udostepnij.html', 'gotowe ogłoszenia'], ['Płatności', 'pay/', 'BLIK / przelew']];
  $('#hubLinks').innerHTML = LINKS.map(function (l) { return '<a href="' + BASE + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + '<small>' + esc(l[2]) + '</small></a>'; }).join('');

  // keyboard
  document.addEventListener('keydown', function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || !E.decks) return; var k = e.key.toLowerCase();
    if (k === 'q') E.decks[0].toggle(); else if (k === 'p') E.decks[1].toggle(); else if (k === 'w') E.decks[0].cue(); else if (k === 'o') E.decks[1].cue(); else if (k === 't') E.tap();
    else if (k === 'f') { var u = E.fx1; u.set('on', !u.on); $$('.fx[data-fx="1"] .fxon').forEach(function (b) { b.classList.toggle('on', u.on); b.textContent = u.on ? 'ON' : 'OFF'; }); }
    else if (/^[1-8]$/.test(k)) { var col = +k - 1, pads = E.pads.pads.filter(function (p) { return p.col === col && p.buffer; }), on = pads.findIndex(function (p) { return p.on || p.pending; }); var nx = pads[(on + 1) % pads.length]; if (nx) E.pads.trigger(nx.i); } });

  // PWA (web only)
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/androidplatform/.test(location.host)) navigator.serviceWorker.register('sw.js').catch(function () {});
  window.D7UI = { lastResult: lastResult, start: start, showTab: showTab, toast: toast, busy: busy, showResult: showResult, play: play, stopPreview: stopPreview, fillPads: fillPads, loadFileTo: loadFileTo, slicesToPads: slicesToPads, paintQueue: paintQueue, search: search, radioTo: radioTo, esc: esc, fmt: fmt, getViz: function () { return viz; }, isStarted: function () { return started; } };
  if (/[?&]autostart/.test(location.search)) start();
})();
