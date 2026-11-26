/* DD DJ 3.0 · 77 min Set Pro + Autonomic Mode (auto-mix, auto-visuals, self-diagnostic auto-fix). Original code. */
(function () {
  'use strict';
  var A = window.DDA, G = window.DDGen, ST = window.DDStyles;
  var SET = { on: false, len: 77 * 60, t0: 0, plan: [], idx: -1, paused: 0 };
  // energy curve: warm-up → build → peak bangers → cosmic breakdown → climax → outro
  var ARC = [
    [0, 12, .35, 'Warm-up', ['deep', 'dubtechno', 'lofi', 'subdub', 'novaarps', 'rastachant', 'choir', 'boombap']],
    [12, 28, .6, 'Rozgrzewka', ['techhouse', 'afro', 'melodic', 'rastatechno', 'garage', 'minimal', 'spacenova', 'french', 'gfunk', 'talkbox']],
    [28, 50, .95, 'Peak bangers', ['peak', 'hardgroove', 'basshouse', 'trap', 'acid', 'phonk', 'dnb', 'rastasteppers', 'squelch', 'hype', 'wobble', 'electro', 'chops']],
    [50, 58, .3, 'Cosmic breakdown', ['nebula', 'novaarps', 'spacenova', 'retrowave', 'fmbells', 'dubtechno']],
    [58, 72, 1, 'Climax', ['industrial', 'novahyper', 'anthem', 'trance', 'neuro', 'jungle', 'peak', 'rastasteppers', 'drill', 'slide808']],
    [72, 77, .45, 'Outro', ['melodic', 'deep', 'rastatechno', 'nebula']]
  ];
  SET.ARC = ARC;
  var EP = [[0, .3], [12, .55], [28, .8], [40, 1], [50, .9], [53, .3], [58, .5], [66, 1], [72, .9], [77, .3]];
  SET.EP = EP;
  SET.energyAt = function (min) { for (var i = 1; i < EP.length; i++) if (min <= EP[i][0]) { var a = EP[i - 1], b = EP[i]; return a[1] + (b[1] - a[1]) * (min - a[0]) / (b[0] - a[0]); } return .3; };
  SET.build = function () { // ~4–6 min segments, no repeats back to back
    var plan = [], t = 0, last = '';
    while (t < 77) { var arc = ARC.filter(function (a) { return t >= a[0] && t < a[1]; })[0] || ARC[ARC.length - 1];
      var pool = arc[4].filter(function (id) { return id !== last && ST.BY[id]; }), id = pool[Math.floor(Math.random() * pool.length)], dur = Math.min(77 - t, 4 + Math.random() * 2.5);
      if (77 - t - dur < 2) dur = 77 - t; plan.push({ id: id, at: t, dur: dur, phase: arc[3], e: arc[2] }); last = id; t += dur; }
    SET.plan = plan; return plan;
  };
  SET.start = function () { A.init(); SET.build(); SET.on = true; SET.t0 = A.ctx.currentTime; SET.idx = -1; G.endless = true; next(true); A.emit('set', SET); };
  SET.stop = function () { SET.on = false; A.emit('set', SET); };
  SET.elapsed = function () { return SET.on ? A.ctx.currentTime - SET.t0 : 0; };
  function next(first) {
    SET.idx++; var seg = SET.plan[SET.idx]; if (!seg) { SET.on = false; G.jump('break'); A.at(A.ctx.currentTime + 16 * 60 / A.bpm, function () { G.stop(); }); A.emit('set', SET); A.emit('toast', '🏁 77 min Set Pro zakończony — respect!'); return; }
    G.energy = seg.e;
    if (first) G.play(seg.id, { now: true });
    else { G.play(seg.id, { glide: true }); G.jump('build'); } // 8-bar build → style lands on drop phrase
    A.emit('setseg', seg);
  }
  A.on('tick', function () {
    if (!SET.on) return; var el = SET.elapsed(), min = el / 60, seg = SET.plan[SET.idx];
    G.energy = SET.energyAt(min);
    if (seg && min >= seg.at + seg.dur - .25 && !seg._x) { seg._x = 1; next(false); }
  });
  // ---------- Autonomic ----------
  var AU = { on: false, log: [], fixes: 0 };
  AU.note = function (m) { AU.log.unshift(new Date().toLocaleTimeString('pl-PL') + ' · ' + m); AU.log.length = Math.min(AU.log.length, 40); A.emit('autolog', AU.log); };
  AU.toggle = function (v) { AU.on = v == null ? !AU.on : !!v; if (window.DDSpecials) { DDSpecials.auto = AU.on; A.emit('spauto', AU.on); } AU.note(AU.on ? 'Autonomic ON' : 'Autonomic OFF'); if (AU.on && !A.playing && !SET.on) G.play(G.random().id, { now: true }); A.emit('auto', AU.on); };
  A.on('section', function (sec) { if (!AU.on) return; if (sec === 'drop' || sec === 'break') A.emit('vischange', sec); });
  var barsOnStyle = 0;
  A.on('bar', function (b) { if (!AU.on || SET.on) return; barsOnStyle++;
    if (b.sec === 'groove' && b.secBar === b.secLen - 1 && barsOnStyle > 48) { barsOnStyle = 0; var cur = G.style, pool = ST.LIST.filter(function (s) { return s.id !== cur.id && Math.abs(s.bpm - cur.bpm) <= 18; }), nx = pool[Math.floor(Math.random() * pool.length)] || G.random(); G.play(nx.id, {}); AU.note('Auto-mix → ' + nx.n); }
    if (b.bar % 32 === 31) G.energy = .5 + Math.random() * .5; });
  // self-diagnostic auto-fix (runs always; reports when Autonomic is on)
  setInterval(function () {
    if (!A.ctx) return; var fixed = [];
    if (A.ctx.state === 'suspended' && (A.playing || SET.on)) { A.resume(); fixed.push('AudioContext wznowiony'); }
    try { [A.master.gain, A.genGain.gain, A.pump.gain].forEach(function (p) { if (!isFinite(p.value)) { p.cancelScheduledValues(0); p.value = 1; fixed.push('NaN gain naprawiony'); } }); } catch (e) {}
    if (!isFinite(A.bpm) || A.bpm < 50 || A.bpm > 200) { A.setBpm(128); fixed.push('BPM przywrócone'); }
    if (A.playing && A.nextT < A.ctx.currentTime - 1) { A.nextT = A.ctx.currentTime + .05; fixed.push('Zegar zsynchronizowany'); }
    if (!A.playing && A.active > A.CAP * .9) { A.active = 0; fixed.push('Licznik głosów zresetowany'); }
    if (A.ctx.state === 'running' && !A.playing && A._muting && A.genGain.gain.value < .01) { A._muting = false; A.genGain.gain.setTargetAtTime(A.genLevel, A.ctx.currentTime, .01); }
    if (window.DDVis && DDVis.lost) { DDVis.recover(); fixed.push('WebGL odzyskany'); }
    if (fixed.length) { AU.fixes += fixed.length; fixed.forEach(AU.note); A.emit('fix', AU.fixes); }
  }, 2000);
  window.addEventListener('error', function (e) { AU.note('Błąd JS złapany: ' + (e.message || '').slice(0, 80)); });
  window.DDSet = SET; window.DDAuto = AU;
})();
