/* DD DJ 3.0.2 · Club Pro DJ — isolator + kills, Color FX, beat loop/roll, hot cues, crossfader blend, sync / master tempo,
   link loader, one-tap sound status. Original code (DJ DaX / Daniel Dydo). */
(function () {
  'use strict';
  var A = window.DDA, G = window.DDGen, U = window.DDUI, ST = window.DDStyles, WM = window.DDWM;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var C = { loopMode: 'loop', active: null };
  function st() { U.start(); }
  function toast(m) { U.toast(m); }
  // ---------- sound status pill: never fail silently ----------
  var pill = $('#sndPill');
  function showSnd() { var s = A.ctx ? A.ctx.state : 'none', bad = U.isStarted() && s !== 'running'; pill.hidden = !bad; if (bad) pill.querySelector('b').textContent = s === 'interrupted' ? 'Dźwięk przerwany (połączenie / inna aplikacja)' : 'Dźwięk wstrzymany przez przeglądarkę'; }
  pill.addEventListener('click', function () { st(); var p = A.unlock(); setTimeout(function () { showSnd(); if (A.ctx && A.ctx.state === 'running') toast('🔊 Dźwięk włączony'); else toast('⚠️ Przeglądarka nadal blokuje dźwięk — sprawdź głośność / tryb cichy i dotknij ponownie'); }, 350); });
  A.on('audiostate', showSnd); A.on('audioerr', function (m) { toast('⚠️ Audio: ' + m); showSnd(); });
  setInterval(showSnd, 1500);
  $('#startBtn').addEventListener('click', function () { A.unlock(); setTimeout(function () { showSnd(); if (A.ctx && A.ctx.state !== 'running') toast('🔇 Dotknij czerwonego paska, aby włączyć dźwięk'); }, 700); });
  // ---------- isolator ----------
  $$('[data-iso]').forEach(function (s) { s.addEventListener('input', function () { st(); A.setIso(s.dataset.iso, +s.value); }); s.addEventListener('dblclick', function () { s.value = 0; A.setIso(s.dataset.iso, 0); }); });
  $$('[data-kill]').forEach(function (b) { b.addEventListener('click', function () { st(); b.classList.toggle('on', A.setKill(b.dataset.kill)); }); });
  A.on('kill', function (k) { var b = $('[data-kill="' + k + '"]'); if (b) b.classList.toggle('on', A.kill[k]); });
  // ---------- color fx ----------
  $('#cfKnob').addEventListener('input', function (e) { st(); A.setColor(+e.target.value); });
  $('#cfKnob').addEventListener('dblclick', function (e) { e.target.value = 0; A.setColor(0); });
  $('#cfRes').addEventListener('input', function (e) { st(); A.setColor(null, null, +e.target.value); });
  $$('[data-cf]').forEach(function (b) { b.addEventListener('click', function () { st(); A.setColor(null, b.dataset.cf); $$('[data-cf]').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
  // ---------- beat loop / roll ----------
  function loopTime(bars) { return bars < 1 ? A.nextBeatTime() : A.nextBarTime(); }
  C.loop = function (bars) { st(); if (!A.playing && !(A.decks && (A.decks[0].playing || A.decks[1].playing))) { toast('▶ Najpierw włącz muzykę'); return false; } A.beatRepeat(true, bars * 4, loopTime(bars)); C.active = bars; mark(); return true; };
  C.exit = function () { A.beatRepeat(false); C.active = null; mark(); };
  function mark() { $$('[data-lp]').forEach(function (b) { b.classList.toggle('on', +b.dataset.lp === C.active); }); }
  $$('[data-lp]').forEach(function (b) { var bars = +b.dataset.lp, held = false;
    b.addEventListener('pointerdown', function (e) { if (C.loopMode !== 'roll') return; e.preventDefault(); held = C.loop(bars); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { if (held) { held = false; C.exit(); } }); });
    b.addEventListener('click', function () { if (C.loopMode === 'roll') return; if (C.active === bars) C.exit(); else C.loop(bars); }); });
  $('#lpMode').addEventListener('click', function (e) { C.loopMode = C.loopMode === 'loop' ? 'roll' : 'loop'; e.currentTarget.textContent = C.loopMode === 'loop' ? '🔁 LOOP' : '🌀 ROLL'; C.exit(); });
  $('#lpExit').addEventListener('click', C.exit);
  A.on('loop', function (l) { $('#lpInfo').textContent = l ? (l.beats / 4 >= 1 ? l.beats / 4 + ' takt' : '1/' + Math.round(4 / l.beats) + ' taktu') + ' · ' + l.len.toFixed(2) + ' s' : '—'; if (!l) { C.active = null; mark(); } });
  // ---------- hot cues ----------
  C.cue = function (sec) { st(); if (!A.playing) G.play((G.style || ST.BY.rastatechno).id, { now: true }); G.jump(sec); A._rephase = true; toast('🎯 ' + (G.SECT_PL[sec] || sec) + ' na następnym beacie'); };
  $$('[data-cue]').forEach(function (b) { b.addEventListener('click', function () { C.cue(b.dataset.cue); }); });
  // ---------- blend / sync / master tempo ----------
  function setBlend(v) { st(); A.blend(v); $('#clBlend').value = v; }
  $('#clBlend').addEventListener('input', function (e) { setBlend(+e.target.value); });
  $('#clCut').addEventListener('click', function () { setBlend(-1); }); $('#clMid').addEventListener('click', function () { setBlend(0); }); $('#clTrk').addEventListener('click', function () { setBlend(1); });
  $('#clSync').addEventListener('click', function () { st(); var on = A.setSync(); if (on && !(A.decks[0].bpm || A.decks[1].bpm)) toast('🔗 Sync włączony — wgraj utwór (BPM wykrywane automatycznie)'); });
  $('#clMT').addEventListener('click', function () { st(); A.setMasterTempo(); });
  A.on('sync', function (on) { $('#clSync').classList.toggle('on', on); decks(); });
  A.on('mt', function (on) { $('#clMT').classList.toggle('on', on); });
  function decks() { if (!A.decks) return; $('#clDecks').textContent = A.decks.map(function (d, i) { return 'Deck ' + 'AB'[i] + ': ' + (d.name ? d.name + (d.bpm ? ' · ' + d.bpm + ' BPM' : '') + ' · ×' + d.rate.toFixed(3) + (d.direct ? ' · stream' : '') + (d.playing ? ' ▶' : '') : '—'); }).join('  ·  '); }
  A.on('deck', decks); A.on('bpm', decks);
  function linkTo(i) { st(); var u = $('#clLink').value.trim(); if (!/^https?:\/\//i.test(u)) { toast('Wklej pełny link https://…'); return; } toast('⏳ Wczytuję link…');
    A.decks[i].loadUrl(u).then(function (d) { toast('🎵 Deck ' + 'AB'[i] + ': ' + d.name + (d.direct ? ' (stream — host blokuje CORS: gra bez FX)' : ' · ' + (d.bpm || '?') + ' BPM')); A.blend(Math.max(A.blendVal, 0)); $('#clBlend').value = A.blendVal; d.play(); })
      .catch(function (e) { toast('⚠️ ' + e.message); }); }
  $('#clLinkA').addEventListener('click', function () { linkTo(0); }); $('#clLinkB').addEventListener('click', function () { linkTo(1); });
  // ---------- club sound ----------
  $('#clWidth').addEventListener('input', function (e) { st(); A.setWidth(+e.target.value); });
  $('#clTrans').addEventListener('input', function (e) { A.settings.trans = +e.target.value; });
  setInterval(function () { if (WM.cur !== 'club' || !A.ctx) return; $('#clStat').textContent = 'Głosy ' + A.active + '/' + A.CAP + ' · spóźnione kroki ' + A.stats.late + ' · latencja ' + Math.round((A.ctx.baseLatency || 0) * 1000) + ' ms · ' + A.ctx.state; }, 500);
  C.state = function () { return { iso: A.iso, kill: A.kill, color: A.color, blend: A.blendVal, loop: A.loopInfo, sync: A.syncLock, mt: A.masterTempo, width: A.width }; };
  window.DDClub = C;
})();
