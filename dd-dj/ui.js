/* DD DJ 3.0 · Smart Simple UI — rock-solid window manager (X / Esc / backdrop / dock / Android back), studio, panels. Original code. */
(function () {
  'use strict';
  var A = window.DDA, G = window.DDGen, ST = window.DDStyles, SET = window.DDSet, AU = window.DDAuto, V = window.DDVis, REC = window.DDRec;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var U = { started: false };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  U.esc = esc;
  function toast(m) { var d = document.createElement('div'); d.textContent = m; $('#toast').appendChild(d); setTimeout(function () { d.remove(); }, 3200); while ($('#toast').children.length > 3) $('#toast').firstChild.remove(); }
  U.toast = toast; A.on('toast', toast);
  function fmt(s) { s = Math.max(0, Math.floor(s)); return (s / 60 < 10 ? '0' : '') + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
  U.fmt = fmt;
  // ---------- settings ----------
  var CFG = { res: 'auto', big: false, flat: false, visMode: '7+13', visSync: 1 };
  try { Object.assign(CFG, JSON.parse(localStorage.getItem('ddj3') || '{}')); } catch (e) {}
  function saveCfg() { try { localStorage.setItem('ddj3', JSON.stringify(CFG)); } catch (e) {} }

  // ================= WINDOW MANAGER =================
  // One window at a time. Close paths: ✕, Esc, backdrop click, dock re-tap, opening another, Android/Browser back (history).
  var WM = { cur: null };
  var wl = $('#wl');
  function showWin(id) { $$('.win').forEach(function (w) { w.hidden = w.id !== 'w-' + id; }); wl.hidden = false; WM.cur = id; $$('#dock button').forEach(function (b) { b.classList.toggle('on', b.dataset.w === id); }); A.emit('win', id); var w = $('#w-' + id); var f = w && w.querySelector('.x'); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }
  function hideAll() { $$('.win').forEach(function (w) { w.hidden = true; }); wl.hidden = true; var was = WM.cur; WM.cur = null; $$('#dock button').forEach(function (b) { b.classList.remove('on'); }); if (was) A.emit('win', null); }
  WM.open = function (id) {
    if (!$('#w-' + id)) return;
    if (WM.cur === id) return;
    var had = !!WM.cur; showWin(id);
    try { if (had && history.state && history.state.ddw) history.replaceState({ ddw: id }, ''); else history.pushState({ ddw: id }, ''); } catch (e) {}
  };
  WM.close = function () {
    if (!WM.cur) return; hideAll();
    try { if (history.state && history.state.ddw) { WM._skipPop = true; history.back(); setTimeout(function () { WM._skipPop = false; }, 400); } } catch (e) {}
  };
  WM.toggle = function (id) { WM.cur === id ? WM.close() : WM.open(id); };
  window.addEventListener('popstate', function () { if (WM._skipPop) { WM._skipPop = false; return; } if (WM.cur) hideAll(); else if (document.body.classList.contains('show')) document.body.classList.remove('show'); });
  $('#backdrop').addEventListener('click', WM.close);
  $$('.win .x').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); WM.close(); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (WM.cur) { e.preventDefault(); WM.close(); } else if (document.body.classList.contains('show')) showMode(false); return; }
    if (e.target.matches('input,select,textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); } else if (e.key === 'f' || e.key === 'F') fullscreen(); else if (e.key === 'v' || e.key === 'V') V.next(true); else if (e.key === 't' || e.key === 'T') $('#tap').click();
  });
  $$('#dock button').forEach(function (b) { b.addEventListener('click', function () { WM.toggle(b.dataset.w); }); });
  U.WM = WM; window.DDWM = WM;

  // ================= START =================
  function start() {
    if (U.started) return; U.started = true; A.init(); A.resume(); $('#start').hidden = true; loadPads(); toast('🚀 DD DJ gotowy — wybierz styl albo ⚡ BANGER');
  }
  U.start = start; U.isStarted = function () { return U.started; };
  $('#startBtn').addEventListener('click', start);
  document.addEventListener('pointerdown', function () { if (A.ctx) A.resume(); }, true);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && A.ctx) A.resume(); });

  // ================= STUDIO =================
  function togglePlay() { start(); if (A.playing) { G.stop(); SET.stop(); } else G.play((G.style || ST.BY.rastatechno).id, { now: true }); }
  U.togglePlay = togglePlay;
  $('#playBtn').addEventListener('click', togglePlay);
  $('#bangerBtn').addEventListener('click', function () { start(); var s = G.banger(); toast('⚡ BANGER: ' + s.n); });
  $('#rastaBtn').addEventListener('click', function () { start(); var id = G.style && G.style.id === 'rastatechno' ? 'rastasteppers' : 'rastatechno'; G.play(id, { nextBar: true }); toast('🌀 ' + ST.BY[id].n); });
  $('#novaBtn').addEventListener('click', function () { start(); var id = G.style && G.style.id === 'spacenova' ? 'novahyper' : 'spacenova'; G.play(id, { nextBar: true }); V.next(true); toast('✨ ' + ST.BY[id].n); });
  $('#set77Btn').addEventListener('click', function () { start(); WM.open('set'); if (!SET.on) SET.start(); });
  $('#autoBtn').addEventListener('click', function () { start(); AU.toggle(); });
  A.on('auto', function (on) { $('#autoBtn').classList.toggle('on', on); toast(on ? '🤖 Autonomic ON — auto-mix, auto-visuals, auto-fix' : '🤖 Autonomic OFF'); });
  A.on('play', function (on) { var b = $('#playBtn'); b.classList.toggle('on', on); b.textContent = on ? '⏹ STOP' : '▶ GRAJ'; if (!on) { $('#secBadge').textContent = 'STOP'; $('#secBadge').className = 'badge'; } });
  A.on('style', function (s) { if (!s) return; $('#styleName').textContent = s.n; var c = ST.CATS.filter(function (c) { return c[0] === s.cat; })[0]; $('#catName').textContent = (c ? c[2] + ' ' + c[1] : '') + ' · ' + s.bpm + ' BPM'; markStyle(); });
  A.on('section', function (sec) { var b = $('#secBadge'); b.textContent = (G.SECT_PL[sec] || sec).toUpperCase(); b.className = 'badge ' + sec; });
  A.on('bar', function (b) { $('#phraseBar').style.width = ((b.secBar + 1) / b.secLen * 100) + '%'; });
  A.on('bpm', function (b) { $('#bpmV').textContent = (Math.round(b * 10) / 10); });
  A.on('beat', function (n) { $$('#beats i').forEach(function (e, i) { e.classList.toggle('on', i === n % 4); }); });
  $('#bpmDn').addEventListener('click', function () { start(); A.setBpm(Math.round(A.bpm) - 1); });
  $('#bpmUp').addEventListener('click', function () { start(); A.setBpm(Math.round(A.bpm) + 1); });
  $('#tap').addEventListener('click', function () { start(); A.tap(); });
  ST.CATS.forEach(function (c) { var b = document.createElement('button'); b.innerHTML = c[2] + ' ' + c[1] + (c[0] === 'magic' ? '' : ' ×7'); b.addEventListener('click', function () { genCat = c[0]; renderStyles(); WM.open('gen'); }); $('#catChips').appendChild(b); });
  $('#mFilter').addEventListener('input', function (e) { start(); G.userFilter = +e.target.value; A.setFilter(+e.target.value); $('#xFilter').value = e.target.value; });
  $('#mFilter').addEventListener('dblclick', function (e) { e.target.value = 0; A.setFilter(0); G.userFilter = 0; });
  $('#mPunch').addEventListener('input', function (e) { start(); A.loudness(+e.target.value); $('#xPunch').value = e.target.value; });
  A.on('filter', function (v) { $('#mFilter').value = v; $('#xFilter').value = v; });
  $('#mBuild').addEventListener('click', function () { start(); if (A.playing) { G.jump('build'); toast('📈 Build-up na następnym takcie'); } });
  $('#mDrop').addEventListener('click', function () { start(); if (A.playing) { G.jump('drop'); toast('💥 DROP na następnym takcie'); } else G.banger(); });
  $('#mThrow').addEventListener('click', function () { start(); A.echoThrow(2.5); });
  $('#mMutate').addEventListener('click', function () { start(); G.mutateNow(); toast('🧬 Mutacja: nowe akordy, bas i melodia'); });
  holdBtn($('#mRepeat'), .5);
  function holdBtn(b, frac) { var on = false; function dn(e) { e.preventDefault(); start(); on = true; b.classList.add('on'); A.beatRepeat(true, frac); } function up() { if (!on) return; on = false; b.classList.remove('on'); A.beatRepeat(false); }
    b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up); }
  // 3D jogs + ring + pulse
  var rot = 0, ring = $('#ring'), rx = ring.getContext('2d'), root = document.documentElement, lastT = performance.now();
  function anim(now) {
    requestAnimationFrame(anim); var dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    var playingAny = A.playing || (A.decks && (A.decks[0].playing || A.decks[1].playing));
    if (playingAny) rot = (rot + dt * A.bpm / 60 * 90) % 360; root.style.setProperty('--rot', rot.toFixed(1) + 'deg'); root.style.setProperty('--pulse', Math.min(1, V.pulse || 0).toFixed(2));
    if (!U.started || document.hidden || WM.cur === 'vis' || document.body.classList.contains('show')) return;
    var w = ring.width, h = ring.height, cx = w / 2, cy = h / 2; rx.clearRect(0, 0, w, h); if (!A.fd) return;
    var n = 96, r0 = w * .26, p = V.pulse || 0;
    rx.lineWidth = 3; for (var i = 0; i < n; i++) { var v = A.fd[2 + Math.floor(Math.pow(i / n, 1.6) * 380)] / 255, a = i / n * Math.PI * 2 - Math.PI / 2 + rot * .002, r1 = r0 + 6 + v * w * .2;
      rx.strokeStyle = 'hsl(' + (190 + i * 2 + v * 80) + ',100%,' + (50 + v * 20) + '%)'; rx.beginPath(); rx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); rx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); rx.stroke(); }
    var g = rx.createRadialGradient(cx, cy, 0, cx, cy, r0); g.addColorStop(0, 'rgba(255,79,216,' + (.25 + p * .5) + ')'); g.addColorStop(1, 'rgba(20,10,50,.1)'); rx.fillStyle = g; rx.beginPath(); rx.arc(cx, cy, r0 - 4, 0, 7); rx.fill();
    rx.fillStyle = '#fff'; rx.font = 'bold ' + (w * .11) + 'px system-ui'; rx.textAlign = 'center'; rx.textBaseline = 'middle'; rx.fillText(Math.round(A.bpm), cx, cy - w * .03); rx.font = (w * .045) + 'px system-ui'; rx.fillStyle = '#9fe8ff'; rx.fillText('SPACE X', cx, cy + w * .07);
    $('#energyBar').style.width = (G.energy * 100) + '%';
  }
  requestAnimationFrame(anim);
  // show mode / fullscreen
  function showMode(on) { var was = document.body.classList.contains('show'); if (on === was) return; document.body.classList.toggle('show', on);
    if (on) { WM.close(); setTimeout(function () { try { history.pushState({ ddshow: 1 }, ''); } catch (e) {} }, 450); toast('🌌 Tryb show — Esc / wstecz / dotknij ekranu aby wrócić'); }
    else { try { if (history.state && history.state.ddshow) { WM._skipPop = true; history.back(); setTimeout(function () { WM._skipPop = false; }, 400); } } catch (e) {} } }
  function fullscreen() { var d = document; if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || function () {}).call(d.documentElement); } else (d.exitFullscreen || d.webkitExitFullscreen).call(d); }
  U.showMode = showMode; U.fullscreen = fullscreen;
  $('#showBtn').addEventListener('click', function () { start(); showMode(true); });
  $('#fsBtn').addEventListener('click', fullscreen);
  $('#vis').addEventListener('click', function () { if (document.body.classList.contains('show')) showMode(false); });
  A.on('viscanvas', function (c) { c.addEventListener('click', function () { if (document.body.classList.contains('show')) showMode(false); }); });
  $('#fixB').addEventListener('click', function () { WM.open('cfg'); runTest(); });
  A.on('fix', function (n) { $('#fixN').textContent = n; });

  // ================= VISUALS WINDOW =================
  V.scenes.forEach(function (n, i) { var b = document.createElement('button'); b.textContent = n; b.dataset.i = i; b.addEventListener('click', function () { V.go(i, null, false, 1.2); }); $('#sceneGrid').appendChild(b); });
  A.on('visscene', function (s) { $('#visNow').textContent = s.scene + ' · wariant ' + (s.variant + 1) + '/777'; $$('#sceneGrid button').forEach(function (b) { b.classList.toggle('on', V.scenes[+b.dataset.i] === s.scene); }); });
  $('#visNext').addEventListener('click', function () { V.next(false); });
  $('#visMagic').addEventListener('click', function () { V.next(true, 3); });
  $('#visShow').addEventListener('click', function () { start(); showMode(true); fullscreen(); });
  $('#visMode').addEventListener('change', function (e) { V.mode = CFG.visMode = e.target.value; saveCfg(); });
  $('#visSync').addEventListener('change', function (e) { V.sync = CFG.visSync = +e.target.value; saveCfg(); });
  $('#visAuto').addEventListener('click', function (e) { V.auto = !V.auto; e.currentTarget.classList.toggle('on', V.auto); });
  $('#visLock').addEventListener('click', function (e) { V.lock = !V.lock; e.currentTarget.classList.toggle('on', V.lock); });
  var RES = [['auto', 'Auto (ekran)'], ['720', '720p'], ['1080', '1080p Full HD'], ['4k', '4K UHD'], ['eco', 'Low-Battery (eco 30 fps)']];
  $$('.resSel').forEach(function (s) { RES.forEach(function (r) { var o = document.createElement('option'); o.value = r[0]; o.textContent = r[1]; s.appendChild(o); }); s.addEventListener('change', function () { setRes(s.value); }); });
  function setRes(r) { CFG.res = r; saveCfg(); V.setRes(r); $$('.resSel').forEach(function (s) { s.value = r; }); }
  A.on('visres', function (sz) { $('#visInfo').textContent = 'Canvas ' + sz; $('#cfgRes').textContent = 'Canvas ' + sz; });
  function loadImg(f) { if (!f) return; var img = new Image(); img.onload = function () { V.setImage(img); toast('🖼 Obraz w wizualizacjach'); }; img.onerror = function () { toast('⚠️ Nie mogę wczytać obrazu'); }; img.src = URL.createObjectURL(f); }
  $('#imgIn').addEventListener('change', function (e) { loadImg(e.target.files[0]); e.target.value = ''; });
  $('#upImg').addEventListener('change', function (e) { loadImg(e.target.files[0]); e.target.value = ''; });
  $('#imgMix').addEventListener('input', function (e) { V.imgMix = +e.target.value; });
  $('#imgClr').addEventListener('click', function () { V.clearImage(); });

  // ================= GENERATORS WINDOW =================
  var genCat = 'magic';
  ST.CATS.forEach(function (c) { var b = document.createElement('button'); b.dataset.c = c[0]; b.textContent = c[2] + ' ' + c[1]; b.addEventListener('click', function () { genCat = c[0]; renderStyles(); }); $('#genCats').appendChild(b); });
  function renderStyles() {
    $$('#genCats button').forEach(function (b) { b.classList.toggle('on', b.dataset.c === genCat); });
    var g = $('#styleGrid'); g.innerHTML = '';
    ST.LIST.filter(function (s) { return s.cat === genCat; }).forEach(function (s) { var b = document.createElement('button'); b.dataset.id = s.id; b.innerHTML = '<b>' + esc(s.n) + '</b><small>' + s.bpm + ' BPM · energia ' + '●'.repeat(s.e) + '</small>'; b.className = s.cat === 'magic' ? (s.id.indexOf('rasta') === 0 ? 'rasta' : 'nova') : '';
      b.addEventListener('click', function () { start(); var bp = +$('#gBpm').value || 0; G.play(s.id, { nextBar: true, bpm: bp || undefined }); }); g.appendChild(b); });
    markStyle();
  }
  function markStyle() { var id = G.style && G.style.id; $$('#styleGrid button').forEach(function (b) { b.classList.toggle('on', b.dataset.id === id); }); }
  renderStyles();
  $('#gEndless').addEventListener('click', function (e) { G.endless = !G.endless; e.currentTarget.classList.toggle('on', G.endless); });
  $('#gEnergy').addEventListener('input', function (e) { G.energy = +e.target.value; });
  $('#gRandom').addEventListener('click', function () { start(); var s = G.random(genCat === 'magic' ? null : genCat); G.play(s.id, { nextBar: true }); toast('🎲 ' + s.n); });
  $('#gMut').addEventListener('click', function () { start(); G.mutateNow(); });
  [['k', 'Kick'], ['s', 'Snare/Clap'], ['h', 'Hats'], ['p', 'Perc'], ['b', 'Bass'], ['c', 'Akordy'], ['l', 'Lead'], ['v', 'Voice']].forEach(function (l) { var b = document.createElement('button'); b.className = 'tg on'; b.textContent = l[1]; b.addEventListener('click', function () { G.mute[l[0]] = !G.mute[l[0]]; b.classList.toggle('on', !G.mute[l[0]]); }); $('#layers').appendChild(b); });
  $$('[data-j]').forEach(function (b) { b.addEventListener('click', function () { start(); if (!A.playing) G.play((G.style || ST.BY.peak).id, { now: true }); G.jump(b.dataset.j); }); });

  // ================= SET 77 WINDOW =================
  function renderSet() {
    var tl = $('#setTl'); $$('span', tl).forEach(function (s) { s.remove(); }); var ol = $('#segList'); ol.innerHTML = '';
    if (!SET.plan.length) SET.build();
    SET.plan.forEach(function (seg, i) { var s = document.createElement('span'), st = ST.BY[seg.id]; s.style.width = (seg.dur / 77 * 100) + '%'; s.style.background = 'hsl(' + (260 - seg.e * 260) + ',90%,60%)'; s.textContent = st.n; s.title = fmt(seg.at * 60) + ' ' + st.n; tl.appendChild(s);
      var li = document.createElement('li'); li.textContent = fmt(seg.at * 60) + ' · ' + seg.phase + ' · ' + st.n + ' (' + st.bpm + ' BPM)'; ol.appendChild(li); });
    var c = $('#setCurve'), x = c.getContext('2d'), w = c.width, h = c.height; x.clearRect(0, 0, w, h); x.beginPath();
    for (var m = 0; m <= 77; m += .5) { var y = h - 10 - SET.energyAt(m) * (h - 25); m === 0 ? x.moveTo(m / 77 * w, y) : x.lineTo(m / 77 * w, y); }
    var gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2bff88'); gr.addColorStop(.5, '#ff4fd8'); gr.addColorStop(.7, '#6ef3ff'); gr.addColorStop(.9, '#ff4757'); gr.addColorStop(1, '#ffc83d'); x.strokeStyle = gr; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#9a90c8'; x.font = '12px system-ui'; SET.ARC.forEach(function (a) { x.fillText(a[3], a[0] / 77 * w + 4, 14); });
  }
  renderSet();
  $('#setGo').addEventListener('click', function () { start(); SET.start(); renderSet(); toast('⏱ 77 min Set Pro start — warm-up → bangery → kosmos → climax'); });
  $('#setStop').addEventListener('click', function () { SET.stop(); G.stop(); });
  $('#setNew').addEventListener('click', function () { if (SET.on) { toast('Najpierw zatrzymaj set'); return; } SET.build(); renderSet(); });
  A.on('set', function () { $('#set77Btn').classList.toggle('on', SET.on); renderSet(); });
  A.on('setseg', function (seg) { $('#setPhase').textContent = seg.phase; $('#setNow').textContent = '→ ' + ST.BY[seg.id].n; $$('#segList li').forEach(function (li, i) { li.classList.toggle('on', i === SET.idx); }); });
  setInterval(function () { if (!SET.on) return; var el = SET.elapsed(); $('#setT').textContent = fmt(el); $('#setHead').style.left = Math.min(100, el / SET.len * 100) + '%'; }, 500);

  // ================= PADS =================
  var PADS = [], padQ = true, FXP = [['🚀 Riser', function (t) { A.voice.riser(t, 4 * 60 / A.bpm); }], ['💥 Impact', function (t) { A.voice.impact(t); }], ['📯 Air Horn', function (t) { A.voice.horn(t); }], ['🚨 Dub Siren', function (t) { A.voice.siren(t, 2); }], ['🔫 Laser', function (t) { A.voice.laser(t); }], ['🥁 Snare Roll', function (t) { var sd = 60 / A.bpm / 4; for (var i = 0; i < 16; i++) A.voice.snare(t + i * sd * (i < 8 ? 1 : .5) + (i >= 8 ? 4 * sd : 0), .3 + i * .04); }]];
  function loadPads() {
    fetch('samples/dax/manifest.json').then(function (r) { return r.json(); }).then(function (m) {
      PADS = m.items.slice(0, 26).map(function (it, i) { return { name: it.name.replace('DaX ', ''), url: 'samples/dax/' + it.url, buf: null, src: null, i: i }; }); renderPads(); $('#padInfo').textContent = '26 sampli DJ DaX (Drive, własne) · ładowanie w tle…';
      var k = 0; (function nx() { if (k >= PADS.length) { $('#padInfo').textContent = '26 sampli DJ DaX gotowe'; return; } var p = PADS[k++]; A.loadSample(p.url).then(function (b) { p.buf = b; markPad(p); nx(); }).catch(function () { nx(); }); })();
    }).catch(function () { $('#padInfo').textContent = 'Brak manifestu sampli'; renderPads(); });
  }
  function renderPads() { var g = $('#padGrid'); g.innerHTML = '';
    PADS.forEach(function (p) { var b = document.createElement('button'); b.className = 'dax'; b.innerHTML = '<span>' + (p.i + 1) + '</span><small>' + esc(p.name) + '</small>'; p.el = b; b.addEventListener('click', function () { hitPad(p); }); g.appendChild(b); });
    FXP.forEach(function (f, i) { var b = document.createElement('button'); b.className = 'fx'; b.innerHTML = '<span>' + (27 + i) + '</span><small>' + f[0] + '</small>'; b.addEventListener('click', function () { start(); f[1](padQ ? A.nextBeatTime() : A.ctx.currentTime); }); g.appendChild(b); }); }
  function markPad(p) { if (p.el) p.el.style.opacity = 1; }
  function hitPad(p) { start(); if (p.src) { try { p.src.stop(); } catch (e) {} p.src = null; p.el.classList.remove('play'); return; }
    var go = function () { var t = padQ ? A.nextBeatTime() : A.ctx.currentTime; var s = A.playBuf(p.buf, t, 1); p.src = s; p.el.classList.add('play'); s.onended = function () { if (p.src === s) { p.src = null; p.el.classList.remove('play'); } }; };
    if (p.buf) go(); else { p.el.style.opacity = .5; A.loadSample(p.url).then(function (b) { p.buf = b; p.el.style.opacity = 1; go(); }).catch(function () { toast('⚠️ Sample ' + p.name + ' nie wczytany'); }); } }
  $('#padQ').addEventListener('click', function (e) { padQ = !padQ; e.currentTarget.classList.toggle('on', padQ); });
  $('#padVol').addEventListener('input', function (e) { start(); A.padBus.gain.setTargetAtTime(+e.target.value, A.ctx.currentTime, .02); });
  $('#padStop').addEventListener('click', function () { PADS.forEach(function (p) { if (p.src) { try { p.src.stop(); } catch (e) {} p.src = null; p.el.classList.remove('play'); } }); });
  renderPads();
  U.pads = function () { return PADS; }; U.hitPad = function (i) { if (PADS[i]) hitPad(PADS[i]); };

  // ================= MIXER =================
  function rng(id, fn) { $(id).addEventListener('input', function (e) { start(); fn(+e.target.value); }); }
  rng('#xMaster', A.setMaster); rng('#xGen', function (v) { A.genGain.gain.setTargetAtTime(v, A.ctx.currentTime, .02); });
  $$('[data-eq]').forEach(function (s) { s.addEventListener('input', function () { start(); A.setEQ(s.dataset.eq, +s.value); }); s.addEventListener('dblclick', function () { s.value = 0; A.setEQ(s.dataset.eq, 0); }); });
  rng('#xFilter', function (v) { G.userFilter = v; A.setFilter(v); $('#mFilter').value = v; });
  rng('#xPunch', function (v) { A.loudness(v); $('#mPunch').value = v; });
  rng('#xPump', function (v) { A.settings.pump = v; }); rng('#xSwing', function (v) { A.settings.swing = v; }); rng('#xHuman', function (v) { A.settings.human = v; });
  rng('#xEcho', function (v) { A.setSend('echo', v); }); rng('#xRev', function (v) { A.setSend('rev', v); });
  $('#xEchoT').addEventListener('change', function (e) { start(); A.setEchoBeats(+e.target.value); });
  $$('[data-br]').forEach(function (b) { holdBtn(b, +b.dataset.br); });
  $('#xThrow').addEventListener('click', function () { start(); A.echoThrow(3); });
  $('#xSiren').addEventListener('click', function () { start(); A.voice.siren(A.ctx.currentTime, 2.5); });
  rng('#xXf', A.xfader);
  function deckLoad(i, f) { if (!f) return; start(); toast('⏳ Wczytuję ' + f.name); A.decks[i].load(f).then(function (d) { toast('🎵 Deck ' + 'AB'[i] + ': ' + d.name + ' (' + fmt(d.buf.duration) + ')'); d.play(); }).catch(function () { toast('⚠️ Nie mogę zdekodować pliku (MP3/WAV/OGG/M4A)'); }); }
  $$('.deck').forEach(function (el) { var i = +el.dataset.d; $('input[type=file]', el).addEventListener('change', function (e) { deckLoad(i, e.target.files[0]); e.target.value = ''; });
    $('.dp', el).addEventListener('click', function () { start(); A.decks[i].toggle(); }); $('.ds', el).addEventListener('click', function () { A.decks[i].stop(); }); $('.dr', el).addEventListener('input', function (e) { A.decks[i].setRate(+e.target.value); }); });
  A.on('deck', function (d) { var el = $('.deck[data-d="' + d.i + '"] .dn'); if (el) el.textContent = d.name ? (d.playing ? '▶ ' : '❚❚ ') + d.name : 'pusty'; });
  $('#upA').addEventListener('change', function (e) { deckLoad(0, e.target.files[0]); e.target.value = ''; });
  $('#upB').addEventListener('change', function (e) { deckLoad(1, e.target.files[0]); e.target.value = ''; });

  // ================= RECORDER =================
  function recStart(kind) { start(); if (REC.on) return; if (REC.start(kind)) toast(kind === 'av' ? '⏺ Nagrywam show (wideo + audio)' : '🎙 Nagrywam miks (audio)'); }
  $('#recAV').addEventListener('click', function () { recStart('av'); }); $('#recA').addEventListener('click', function () { recStart('a'); });
  $('#recStop').addEventListener('click', function () { REC.stop(); });
  $('#recQuick').addEventListener('click', function () { REC.on ? REC.stop() : recStart('av'); });
  A.on('rec', function (on) { $('#recQuick').classList.toggle('on', on); $('#recAV').classList.toggle('recording', on && REC.kind === 'av'); $('#recA').classList.toggle('recording', on && REC.kind === 'a'); if (!on) { $('#recT').textContent = 'REC'; } });
  A.on('saved', function (s) { $('#recLast').textContent = 'Ostatnie nagranie: ' + s.name + ' · ' + (s.size / 1048576).toFixed(1) + ' MB'; });
  setInterval(function () { if (!REC.on) return; var t = fmt(REC.time()); $('#recT').textContent = t; $('#recTime').textContent = t; }, 500);

  // ================= SETTINGS / SELF-TEST =================
  function applyCfg() { document.body.classList.toggle('big', !!CFG.big); document.body.classList.toggle('flat', !!CFG.flat); $('#cfgBig').classList.toggle('on', !!CFG.big); $('#cfg3d').classList.toggle('on', !CFG.flat);
    setRes(CFG.res || 'auto'); V.mode = CFG.visMode; $('#visMode').value = CFG.visMode; V.sync = +CFG.visSync || 1; $('#visSync').value = String(V.sync); }
  $('#cfgBig').addEventListener('click', function () { CFG.big = !CFG.big; saveCfg(); applyCfg(); });
  $('#cfg3d').addEventListener('click', function () { CFG.flat = !CFG.flat; saveCfg(); applyCfg(); });
  $('#cfgReset').addEventListener('click', function () { localStorage.removeItem('ddj3'); CFG = { res: 'auto', big: false, flat: false, visMode: '7+13', visSync: 1 }; applyCfg(); toast('↺ Ustawienia zresetowane'); });
  $('#cfgTest').addEventListener('click', runTest);
  function runTest() { var r = U.selfTest(); $('#cfgOut').textContent = r.lines.join('\n'); return r; }
  U.selfTest = function () { var L = [], ok = 0, n = 0; function chk(name, c) { n++; if (c) ok++; L.push((c ? '✅ ' : '❌ ') + name); }
    chk('AudioContext ' + (A.ctx ? A.ctx.state + ' · ' + A.ctx.sampleRate + ' Hz' : 'brak'), A.ctx && A.ctx.state !== 'closed');
    chk('Master chain: glue comp + saturator + limiter −0.3 dB', !!(A.glue && A.sat && A.limiter && A.ceiling));
    chk('Style: ' + ST.LIST.length + ' (7×7 + ' + (ST.LIST.length - 49) + ' Magic)', ST.LIST.length >= 53 && ST.CATS.slice(0, 7).every(function (c) { return ST.LIST.filter(function (s) { return s.cat === c[0]; }).length === 7; }));
    chk('Space X Visuals WebGL ' + (V.gl ? 'OK ' + V.size : 'fallback 2D'), !!V.gl && !V.err);
    chk('Recorder: ' + (REC.pick(true) || 'brak MediaRecorder'), !!window.MediaRecorder);
    chk('Pady DJ DaX: ' + PADS.length + ' (' + PADS.filter(function (p) { return p.buf; }).length + ' w pamięci)', PADS.length === 26);
    chk('Okna: ' + $$('.win').length + ', otwarte: ' + (WM.cur || 'brak'), $$('.win').length === 8);
    chk('Set 77: ' + SET.plan.length + ' segmentów', SET.plan.length > 8);
    L.push('— ' + ok + '/' + n + ' OK · FPS ' + V.fps + ' · auto-fix ' + AU.fixes); return { ok: ok, n: n, lines: L }; };
  A.on('autolog', function (l) { $('#autoLog').textContent = l.join('\n'); });
  // ---------- boot ----------
  V.init($('#vis')); applyCfg(); V.go(0, 7, false, .1);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !/androidplatform/.test(location.host)) navigator.serviceWorker.register('sw.js').catch(function () {});
  if (/autostart=1/.test(location.search)) setTimeout(start, 300);
  window.DDUI = U;
})();
