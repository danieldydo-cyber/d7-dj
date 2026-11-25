/* D7 Super SI · 7 Engines (Web Audio, original code, no samples) · DJ DaX
   1 Beat (16-step drum machine) · 2 Bass (acid/sub) · 3 Synth (poly) · 4 Loop station (16 loops, bar-quantised)
   5 FX (DJ filter, echo, reverb, drive, comp) · 6 Song generator (text prompt -> arrangement) · 7 Visuals + recorder
   API: window.SSI {start, stop, toggle, setBpm, setStyle, random, generate(prompt), playing, bpm, style} */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var TR = ['kick', 'snare', 'clap', 'chh', 'ohh', 'perc'];
  var TRL = { kick: 'Kick', snare: 'Snare', clap: 'Clap', chh: 'Hi-hat', ohh: 'Open hat', perc: 'Perc' };
  function P(s) { return s.replace(/\s/g, '').split('').map(function (c) { return c !== '.'; }); }
  var STYLES = {
    techno:     { bpm: 130, swing: 0,  root: 33, scale: [0, 3, 5, 7, 10], dist: 10, rev: 20, p: { kick: 'x...x...x...x...', snare: '................', clap: '....x.......x...', chh: '..x...x...x...x.', ohh: '..x...x...x...x.', perc: '...x.....x....x.' }, bass: 'offbeat', loops: [0, 5] },
    hardtechno: { bpm: 150, swing: 0,  root: 31, scale: [0, 1, 3, 7, 8], dist: 45, rev: 15, p: { kick: 'x...x...x...x...', snare: '................', clap: '....x.......x...', chh: 'xxxxxxxxxxxxxxxx', ohh: '..x...x...x...x.', perc: 'x..x..x..x..x.x.' }, bass: 'rumble', loops: [5, 9] },
    house:      { bpm: 124, swing: 18, root: 36, scale: [0, 3, 5, 7, 10], dist: 0, rev: 30, p: { kick: 'x...x...x...x...', snare: '................', clap: '....x.......x...', chh: 'x.x.x.x.x.x.x.x.', ohh: '..x...x...x...x.', perc: '.....x.......x..' }, bass: 'house', loops: [1, 2] },
    hiphop:     { bpm: 90,  swing: 30, root: 34, scale: [0, 3, 5, 7, 10], dist: 5, rev: 25, p: { kick: 'x.....x.x.......', snare: '....x.......x...', clap: '................', chh: 'x.x.x.x.x.x.x.x.', ohh: '..............x.', perc: '.......x........' }, bass: 'boombap', loops: [3, 14] },
    trap:       { bpm: 140, swing: 0,  root: 30, scale: [0, 1, 3, 7, 8], dist: 15, rev: 20, p: { kick: 'x......x..x.....', snare: '........x.......', clap: '........x.......', chh: 'x.xxx.x.x.xxx.xx', ohh: '................', perc: '...x.........x..' }, bass: '808', loops: [12, 4] },
    trance:     { bpm: 138, swing: 0,  root: 33, scale: [0, 2, 3, 7, 8], dist: 5, rev: 45, p: { kick: 'x...x...x...x...', snare: '................', clap: '....x.......x...', chh: 'x.x.x.x.x.x.x.x.', ohh: '..x...x...x...x.', perc: '................' }, bass: 'rolling', loops: [0, 10, 6] },
    dnb:        { bpm: 172, swing: 0,  root: 31, scale: [0, 3, 5, 7, 10], dist: 20, rev: 25, p: { kick: 'x.........x.....', snare: '....x.......x...', clap: '................', chh: 'x.x.x.x.x.x.x.x.', ohh: '.......x........', perc: '..x.......x..x..' }, bass: 'reese', loops: [7, 11] },
    shuffle:    { bpm: 128, swing: 16, root: 33, scale: [0, 3, 5, 7, 10], dist: 0, rev: 30, p: { kick: 'x...x...x...x...', snare: '................', clap: '....x.......x...', chh: 'xxxxxxxxxxxxxxxx', ohh: '..x...x...x...x.', perc: '................' }, bass: 'offbeat', loops: [1, 13] }
  };
  var ORIG = JSON.parse(JSON.stringify(STYLES));
  var S = { bpm: 128, style: 'techno', swing: 0, step: 0, bar: 0, playing: false, pat: {}, bass: [], bassOn: true, chords: false,
    loopsOn: {}, loopsWait: {}, arr: null, arrIdx: -1, arrBar: 0, mute: {} };
  var A = null; // audio graph
  var rnd = Math.random, pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function toast(t) { var e = $('#toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }

  // ---------------------------------------------------------------- audio graph
  function impulse(ctx, sec, decay) {
    var n = ctx.sampleRate * sec, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function curve(k) { var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
  function init() {
    if (A) return A;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) { toast('Ta przeglądarka nie obsługuje Web Audio'); return null; }
    var ctx = new AC(); A = { ctx: ctx };
    A.mix = ctx.createGain();
    A.lp = ctx.createBiquadFilter(); A.lp.type = 'lowpass'; A.lp.frequency.value = 20000; A.lp.Q.value = 1;
    A.hp = ctx.createBiquadFilter(); A.hp.type = 'highpass'; A.hp.frequency.value = 20; A.hp.Q.value = 1;
    A.drive = ctx.createWaveShaper(); A.drive.curve = curve(0); A.drive.oversample = '2x';
    A.comp = ctx.createDynamicsCompressor(); A.comp.threshold.value = -14; A.comp.ratio.value = 4;
    A.master = ctx.createGain(); A.master.gain.value = 0.8;
    A.an = ctx.createAnalyser(); A.an.fftSize = 2048; A.an.smoothingTimeConstant = 0.75;
    A.delay = ctx.createDelay(2); A.fb = ctx.createGain(); A.fb.gain.value = 0.38; A.dsend = ctx.createGain(); A.dsend.gain.value = 0.15;
    A.dfilt = ctx.createBiquadFilter(); A.dfilt.type = 'bandpass'; A.dfilt.frequency.value = 1800; A.dfilt.Q.value = 0.6;
    A.rev = ctx.createConvolver(); A.rev.buffer = impulse(ctx, 2.8, 3); A.rsend = ctx.createGain(); A.rsend.gain.value = 0.2;
    A.mix.connect(A.lp); A.lp.connect(A.hp); A.hp.connect(A.drive); A.drive.connect(A.comp);
    A.drive.connect(A.dsend); A.dsend.connect(A.delay); A.delay.connect(A.dfilt); A.dfilt.connect(A.fb); A.fb.connect(A.delay); A.dfilt.connect(A.comp);
    A.drive.connect(A.rsend); A.rsend.connect(A.rev); A.rev.connect(A.comp);
    A.comp.connect(A.master); A.master.connect(A.an); A.an.connect(ctx.destination);
    A.rec = ctx.createMediaStreamDestination ? ctx.createMediaStreamDestination() : null; if (A.rec) A.master.connect(A.rec);
    A.drums = ctx.createGain(); A.drums.gain.value = 0.9; A.drums.connect(A.mix);
    A.bassG = ctx.createGain(); A.bassG.gain.value = 0.7; A.bassG.connect(A.mix);
    A.syn = ctx.createGain(); A.syn.gain.value = 0.35; A.syn.connect(A.mix);
    A.lg = ctx.createGain(); A.lg.gain.value = 0.5; A.lg.connect(A.mix);
    var nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; A.noise = nb;
    applyFx(); return A;
  }
  function env(g, t, a, peak, dec, sus) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(sus || 0.0001, t + a + dec); }
  function noise(t, dur, type, f, q, vol, out) {
    var c = A.ctx, s = c.createBufferSource(); s.buffer = A.noise; var fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1;
    var g = c.createGain(); env(g, t, 0.001, vol, dur); s.connect(fl); fl.connect(g); g.connect(out || A.drums); s.start(t, rnd() * 0.5); s.stop(t + dur + 0.05);
  }
  function tone(t, f0, f1, dur, vol, type, out) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    env(g, t, 0.002, vol, dur); o.connect(g); g.connect(out || A.drums); o.start(t); o.stop(t + dur + 0.05);
  }
  var DR = {
    kick: function (t, v) { var st = S.style; if (st === 'trap') tone(t, 120, 40, 0.9, v, 'sine'); else if (st === 'hardtechno') { tone(t, 190, 45, 0.35, v, 'sine'); tone(t, 160, 50, 0.3, v * 0.35, 'triangle'); } else tone(t, 160, 48, 0.42, v, 'sine'); tone(t, 1800, 400, 0.012, v * 0.3, 'square'); },
    snare: function (t, v) { tone(t, 220, 160, 0.12, v * 0.5, 'triangle'); noise(t, 0.18, 'highpass', 1500, 0.7, v * 0.6); },
    clap: function (t, v) { for (var i = 0; i < 3; i++) noise(t + i * 0.011, 0.03, 'bandpass', 1300, 1.5, v * 0.5); noise(t + 0.033, 0.2, 'bandpass', 1200, 1.2, v * 0.55); },
    chh: function (t, v) { noise(t, 0.035, 'highpass', 8000, 0.8, v * 0.32); },
    ohh: function (t, v) { noise(t, 0.22, 'highpass', 7000, 0.8, v * 0.28); },
    perc: function (t, v) { tone(t, S.style === 'hiphop' ? 800 : 520, 0, 0.08, v * 0.35, 'triangle'); }
  };

  // ---------------------------------------------------------------- bass
  function genBass() {
    var st = STYLES[S.style], sc = st.scale, b = [];
    for (var i = 0; i < 16; i++) {
      var n = null;
      switch (st.bass) {
        case 'offbeat': n = (i % 4 === 2) ? (rnd() < 0.8 ? 0 : pick(sc)) : (rnd() < 0.12 ? pick(sc) + 12 : null); break;
        case 'rumble': n = (i % 4 !== 0) ? 0 : null; break;
        case 'house': n = ([0, 3, 6, 10, 14].indexOf(i) >= 0 || rnd() < 0.15) ? pick(sc) : null; break;
        case 'boombap': n = ([0, 7, 8, 11].indexOf(i) >= 0) ? pick([0, 0, sc[1], sc[3]]) : null; break;
        case '808': n = ([0, 7, 10].indexOf(i) >= 0) ? pick([0, 0, 7, sc[2]]) : null; break;
        case 'rolling': n = (i % 4 !== 0) ? (i % 8 === 6 ? pick(sc) : 0) : null; break;
        case 'reese': n = (i === 0 || i === 6 || i === 10) ? pick([0, sc[1], sc[3]]) : null; break;
      }
      b.push(n);
    }
    S.bass = b; drawBass();
  }
  function playBass(t, n, dur) {
    var c = A.ctx, st = STYLES[S.style], f = mtof(st.root + n), o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    var wave = ($('#b-wave') || {}).value || 'sawtooth'; o.type = st.bass === '808' ? 'sine' : wave;
    o.frequency.setValueAtTime(f, t); if (st.bass === '808') o.frequency.exponentialRampToValueAtTime(f * 0.98, t + dur);
    var cut = +(($('#b-cut') || {}).value || 900), res = +(($('#b-res') || {}).value || 8);
    fl.type = 'lowpass'; fl.Q.value = res; fl.frequency.setValueAtTime(cut * 2.5, t); fl.frequency.exponentialRampToValueAtTime(Math.max(80, cut * 0.4), t + dur * 0.9);
    var vol = +(($('#b-vol') || {}).value || 70) / 100 * 0.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(A.bassG); o.start(t); o.stop(t + dur + 0.05);
    if (st.bass === 'reese') { var o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.012; o2.connect(fl); o2.start(t); o2.stop(t + dur + 0.05); }
  }

  // ---------------------------------------------------------------- poly synth
  var KEYS = 'asdfghjk', DEG = [0, 2, 3, 5, 7, 8, 10, 12];
  function synthNote(midi, t, dur, vol, out) {
    if (!A) return; var c = A.ctx; t = t || c.currentTime;
    var att = +(($('#s-att') || {}).value || 5) / 1000, rel = +(($('#s-rel') || {}).value || 60) / 100, det = +(($('#s-det') || {}).value || 12), wave = ($('#s-wave') || {}).value || 'sawtooth';
    var g = c.createGain(), fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(5000, t); fl.frequency.exponentialRampToValueAtTime(900, t + att + 0.4);
    [-det, det].forEach(function (d) { var o = c.createOscillator(); o.type = wave; o.frequency.value = mtof(midi); o.detune.value = d; o.connect(fl); o.start(t); o.stop(t + att + (dur || 0.3) + rel + 0.1); });
    var v = vol || 0.25; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + att); g.gain.setValueAtTime(v, t + att + (dur || 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + att + (dur || 0.3) + rel);
    fl.connect(g); g.connect(out || A.syn);
  }
  function playKey(i) {
    if (!init()) return; A.ctx.resume(); var st = STYLES[S.style], base = st.root + 24, m = base + DEG[i];
    if (S.chords) { synthNote(m, 0, 0.4, 0.14); synthNote(m + 3 + (i % 2), 0, 0.4, 0.12); synthNote(m + 7, 0, 0.4, 0.12); } else synthNote(m, 0, 0.35, 0.22);
    var b = document.querySelectorAll('#keys button')[i]; if (b) { b.classList.add('hit'); setTimeout(function () { b.classList.remove('hit'); }, 150); }
  }

  // ---------------------------------------------------------------- loop station (16 generative loops)
  function sc(i) { var s = STYLES[S.style].scale; return s[((i % s.length) + s.length) % s.length] + 12 * Math.floor(i / s.length); }
  var LOOPS = [
    { n: 'Arp 1/16', f: function (s, t, d) { synthNote(STYLES[S.style].root + 36 + sc([0, 2, 4, 2, 1, 3, 5, 3][s % 8]), t, d * 0.5, 0.09, A.lg); } },
    { n: 'Stab offbeat', f: function (s, t, d) { if (s % 4 === 2) { var r = STYLES[S.style].root + 36; [0, 3, 7].forEach(function (x) { synthNote(r + x, t, d * 0.6, 0.06, A.lg); }); } } },
    { n: 'Pad akordy', f: function (s, t, d) { if (s === 0) { var r = STYLES[S.style].root + 24 + sc((S.bar % 4) * [0, 3, 1, 4][S.bar % 4] % 5); [0, 7, 12, 15].forEach(function (x) { synthNote(r + x, t, d * 14, 0.035, A.lg); }); } } },
    { n: 'Keys soul', f: function (s, t, d) { if (s === 0 || s === 6 || s === 10) { var r = STYLES[S.style].root + 36; [0, 3, 7, 10].forEach(function (x) { synthNote(r + x + (S.bar % 2 ? 5 : 0), t, d * 2, 0.04, A.lg); }); } } },
    { n: 'Bell pluck', f: function (s, t, d) { if ([0, 3, 6, 9, 12].indexOf(s) >= 0) tone(t, mtof(STYLES[S.style].root + 48 + sc(s % 5)), 0, 0.5, 0.08, 'sine', A.lg); } },
    { n: 'Rolling hats', f: function (s, t, d) { noise(t, 0.02, 'highpass', 9000, 1, s % 2 ? 0.06 : 0.12, A.lg); } },
    { n: 'Trance gate', f: function (s, t, d) { if ([0, 2, 3, 5, 6, 8, 10, 11, 13, 14].indexOf(s) >= 0) synthNote(STYLES[S.style].root + 36 + sc(S.bar % 3), t, d * 0.4, 0.05, A.lg); } },
    { n: 'Break perc', f: function (s, t, d) { if ([3, 7, 9, 13, 15].indexOf(s) >= 0) noise(t, 0.06, 'bandpass', 2500 + s * 100, 3, 0.25, A.lg); } },
    { n: 'Sub drone', f: function (s, t, d) { if (s === 0) tone(t, mtof(STYLES[S.style].root - 12 + 24), 0, d * 15, 0.12, 'sine', A.lg); } },
    { n: 'Acid 303', f: function (s, t, d) { if (rnd() < 0.6) { var c = A.ctx, o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(STYLES[S.style].root + 24 + sc(Math.floor(rnd() * 6))); fl.type = 'lowpass'; fl.Q.value = 18; fl.frequency.setValueAtTime(300 + rnd() * 3000, t); fl.frequency.exponentialRampToValueAtTime(200, t + d); env(g, t, 0.003, 0.08, d); o.connect(fl); fl.connect(g); g.connect(A.lg); o.start(t); o.stop(t + d + 0.05); } } },
    { n: 'Lead hook', f: function (s, t, d) { var m = [0, null, 4, null, 3, null, 2, 1, 0, null, null, 4, null, 5, 4, null][s]; if (m !== null && S.bar % 2 === 0) synthNote(STYLES[S.style].root + 48 + sc(m), t, d * 0.8, 0.07, A.lg); } },
    { n: 'Vox chop', f: function (s, t, d) { if (s === 4 || s === 11) { [700, 1150, 2600].forEach(function (f, i) { noise(t, 0.12, 'bandpass', f * (S.bar % 2 ? 1.2 : 1), 12, 0.35 / (i + 1), A.lg); }); } } },
    { n: '808 slide', f: function (s, t, d) { if (s === 0 || s === 11) { var c = A.ctx, o = c.createOscillator(), g = c.createGain(), f = mtof(STYLES[S.style].root + 12); o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); env(g, t, 0.003, 0.3, d * 5); o.connect(g); g.connect(A.lg); o.start(t); o.stop(t + d * 5 + 0.1); } } },
    { n: 'Shaker', f: function (s, t, d) { noise(t, 0.04, 'bandpass', 6000, 2, s % 4 === 2 ? 0.16 : 0.07, A.lg); } },
    { n: 'Conga', f: function (s, t, d) { if ([2, 5, 7, 10, 14].indexOf(s) >= 0) tone(t, s % 2 ? 330 : 240, 200, 0.18, 0.22, 'sine', A.lg); } },
    { n: 'Riser', f: function (s, t, d) { if (s === 0 && S.bar % 4 === 3) { var c = A.ctx, src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), L = d * 16; src.buffer = A.noise; src.loop = true; fl.type = 'bandpass'; fl.Q.value = 4; fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(9000, t + L); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + L); src.connect(fl); fl.connect(g); g.connect(A.lg); src.start(t); src.stop(t + L); } } }
  ];

  // ---------------------------------------------------------------- scheduler
  var nextT = 0, timer = null, uiQ = [];
  function stepDur() { return 60 / S.bpm / 4; }
  function schedule() {
    var c = A.ctx;
    while (nextT < c.currentTime + 0.12) {
      var s = S.step, d = stepDur(), t = nextT + (s % 2 ? S.swing / 100 * d : 0);
      if (s === 0) onBar();
      TR.forEach(function (k) { if (S.pat[k][s] && !S.mute[k] && !S.mute.drums) DR[k](t, k === 'kick' ? 0.95 : 0.8); });
      if (S.bassOn && !S.mute.bass && S.bass[s] !== null && S.bass[s] !== undefined) { var len = 1; while (len < 4 && (S.bass[(s + len) % 16] === null)) len++; playBass(t, S.bass[s], d * Math.min(len, STYLES[S.style].bass === '808' ? 4 : 2) * 0.95); }
      Object.keys(S.loopsOn).forEach(function (k) { if (S.loopsOn[k] && !S.mute.loops) try { LOOPS[k].f(s, t, d); } catch (e) {} });
      uiQ.push({ s: s, t: t, kick: S.pat.kick[s] && !S.mute.kick && !S.mute.drums });
      nextT += d; S.step = (s + 1) % 16;
    }
  }
  function onBar() {
    S.bar++;
    Object.keys(S.loopsWait).forEach(function (k) { if (S.loopsWait[k] !== undefined) { S.loopsOn[k] = S.loopsWait[k]; delete S.loopsWait[k]; } });
    if (S.arr) arrBar();
    setTimeout(drawLoops, 0);
  }
  function start() { if (!init()) return; A.ctx.resume(); if (S.playing) return; S.playing = true; S.step = 0; nextT = A.ctx.currentTime + 0.06; timer = setInterval(schedule, 25); schedule(); ui(); }
  function stop() { S.playing = false; clearInterval(timer); timer = null; S.arr = null; S.mute = {}; ui(); drawArr(); }
  function toggle() { S.playing ? stop() : start(); }
  function setBpm(b) { S.bpm = Math.max(60, Math.min(190, +b || 128)); var e = $('#e-bpm'); if (e) e.value = S.bpm; }
  function setStyle(k, keepBpm) {
    if (!STYLES[k]) return; var st = STYLES[k]; st.scale = ORIG[k].scale.slice(); st.root = ORIG[k].root; S.style = k; var e = $('#e-style'); if (e) e.value = k;
    TR.forEach(function (t) { S.pat[t] = P(st.p[t]); });
    if (!keepBpm) setBpm(st.bpm); S.swing = st.swing; var sw = $('#e-swing'); if (sw) sw.value = st.swing;
    S.loopsOn = {}; S.loopsWait = {}; st.loops.forEach(function (i) { S.loopsOn[i] = true; });
    var dEl = $('#f-dist'), rEl = $('#f-rev'); if (dEl) dEl.value = st.dist; if (rEl) rEl.value = st.rev; applyFx();
    genBass(); drawGrid(); drawLoops();
  }
  function random() {
    var k = pick(Object.keys(STYLES)); setStyle(k);
    TR.forEach(function (t) { if (t !== 'kick' || k === 'hiphop' || k === 'trap' || k === 'dnb') S.pat[t] = S.pat[t].map(function (v, i) { return rnd() < 0.12 ? !v : v; }); });
    S.loopsOn = {}; for (var i = 0; i < 3; i++) S.loopsOn[Math.floor(rnd() * LOOPS.length)] = true;
    setBpm(STYLES[k].bpm + Math.round(rnd() * 8 - 4)); drawGrid(); drawLoops(); toast('🎲 ' + k.toUpperCase() + ' · ' + S.bpm + ' BPM'); return k;
  }

  // ---------------------------------------------------------------- FX
  function applyFx() {
    if (!A) return; var c = A.ctx, t = c.currentTime, v = function (id, d) { var e = $(id); return e ? +e.value : d; };
    var f = v('#f-filter', 0);
    A.lp.frequency.setTargetAtTime(f < 0 ? 20000 * Math.pow(0.012, -f / 100) : 20000, t, 0.03);
    A.hp.frequency.setTargetAtTime(f > 0 ? 20 * Math.pow(250, f / 100) : 20, t, 0.03);
    A.dsend.gain.setTargetAtTime(v('#f-echo', 15) / 100 * 0.6, t, 0.05);
    A.delay.delayTime.setTargetAtTime(stepDur() * 4 * +((($('#f-echot') || {}).value) || 0.75), t, 0.05);
    A.rsend.gain.setTargetAtTime(v('#f-rev', 20) / 100 * 0.7, t, 0.05);
    A.drive.curve = curve(v('#f-dist', 0) / 100 * 40);
    A.master.gain.setTargetAtTime(v('#f-master', 80) / 100, t, 0.05);
    document.querySelectorAll('.faders label').forEach(function (l) { var i = l.querySelector('input'), s = l.querySelector('span'); if (i && s) s.textContent = i.value; });
  }
  function buildUp() {
    if (!S.playing) start(); var c = A.ctx, t = c.currentTime, L = stepDur() * 16 * 8;
    A.hp.frequency.cancelScheduledValues(t); A.hp.frequency.setValueAtTime(20, t); A.hp.frequency.exponentialRampToValueAtTime(1800, t + L);
    S.loopsOn[15] = true; toast('⤴ Build-up 8 taktów'); setTimeout(drop, L * 1000);
  }
  function drop() { if (!A) return; var t = A.ctx.currentTime; A.hp.frequency.cancelScheduledValues(t); A.hp.frequency.setValueAtTime(20, t); delete S.loopsOn[15]; tone(t, 60, 30, 1.2, 0.7, 'sine', A.mix); noise(t, 1.5, 'lowpass', 3000, 1, 0.3, A.mix); toast('💥 DROP'); var e = $('#f-filter'); if (e) { e.value = 0; applyFx(); } }
  function stutter() { if (!A) return; var t = A.ctx.currentTime, g = A.master.gain, base = g.value, d = stepDur() / 2; for (var i = 0; i < 8; i++) { g.setValueAtTime(0.0001, t + i * d); g.setValueAtTime(base, t + i * d + d / 2); } }

  // ---------------------------------------------------------------- song generator (prompt -> arrangement)
  var KW = [
    [/hard|hardtechno|industrial|rave|ostre|twarde|schranz/, 'hardtechno'], [/trap|hood|drill|808/, 'trap'], [/hip.?hop|boom.?bap|rap|lofi|lo-fi/, 'hiphop'],
    [/house|deep|disco|funky/, 'house'], [/trance|psy|uplift|goa/, 'trance'], [/dnb|drum.?(and|&|n).?bass|jungle|neuro/, 'dnb'], [/shuffle|90s|eurodance|nostalg/, 'shuffle'], [/techno|minimal|warehouse|berlin/, 'techno']
  ];
  function generate(prompt) {
    var p = String(prompt || '').toLowerCase(), style = null;
    KW.forEach(function (k) { if (!style && k[0].test(p)) style = k[1]; }); if (!style) style = pick(Object.keys(STYLES));
    setStyle(style);
    var m = p.match(/(\d{2,3})\s*bpm/) || p.match(/\b(\d{2,3})\b/); if (m && +m[1] >= 60 && +m[1] <= 190) setBpm(+m[1]);
    var dark = /mrocz|dark|ciemn|noc|night|evil/.test(p), chill = /chill|spok|relax|lofi|lo-fi|ambient|soft/.test(p), acid = /acid|303|kwas/.test(p), hard = /hard|ostr|mocn|heavy|agres/.test(p), happy = /happy|wesol|radosn|summer|lato/.test(p);
    var st = STYLES[style];
    if (dark) st.scale = [0, 1, 3, 7, 8]; if (happy) st.scale = [0, 2, 4, 7, 9];
    if (chill) { var r = $('#f-rev'); if (r) r.value = 55; setBpm(S.bpm - (m ? 0 : 8)); }
    if (hard) { var di = $('#f-dist'); if (di) di.value = Math.max(+di.value, 40); }
    var key = p.match(/\b([a-g])(#|is)?\s?(moll|minor|min|m)?\b/); if (key && /\b[a-g](#|is)?\s?(moll|minor|min|m)\b/.test(p)) st.root = 24 + 'c d ef g a b'.indexOf(key[1]) + (key[2] ? 1 : 0);
    genBass(); applyFx();
    var L = [acid ? 9 : st.loops[0], st.loops[1] !== undefined ? st.loops[1] : 5, pick([2, 4, 6, 10, 11, 13])];
    S.arr = [
      { n: 'Intro', bars: 8, mute: { kick: false, bass: true, snare: true, clap: true }, loops: [5] },
      { n: 'Groove', bars: 8, mute: {}, loops: [L[1]] },
      { n: 'Build', bars: 4, mute: { kick: true, bass: true }, loops: [L[0], 15], build: true },
      { n: 'DROP', bars: 16, mute: {}, loops: L },
      { n: 'Break', bars: 8, mute: { drums: true, bass: true }, loops: [2, L[2]] },
      { n: 'DROP 2', bars: 16, mute: {}, loops: L.concat([pick([7, 13, 14])]) },
      { n: 'Outro', bars: 8, mute: { bass: true, clap: true }, loops: [5] }
    ];
    S.arrIdx = -1; S.arrBar = 0;
    var desc = '✨ ' + style.toUpperCase() + ' · ' + S.bpm + ' BPM · ' + (dark ? 'mroczny' : happy ? 'jasny' : 'klasyczny') + ' klimat' + (acid ? ' · acid' : '') + (chill ? ' · chill' : '') + (hard ? ' · hard' : '') +
      '\nPętle: ' + L.map(function (i) { return LOOPS[i].n; }).join(', ') + '\nAranżacja: ' + S.arr.map(function (a) { return a.n + ' ' + a.bars; }).join(' → ') + ' taktów';
    var o = $('#g-out'); if (o) o.textContent = desc;
    if (S.playing) { S.bar = 0; } else start();
    arrBar(true); drawArr(); return desc;
  }
  function arrBar(first) {
    if (!S.arr) return;
    if (!first && --S.arrBar > 0) return;
    S.arrIdx++; if (S.arrIdx >= S.arr.length) { S.arr = null; S.mute = {}; toast('🏁 Koniec utworu, gra dalej pętla'); drawArr(); return; }
    var sec = S.arr[S.arrIdx]; S.arrBar = sec.bars; S.mute = Object.assign({}, sec.mute); S.loopsOn = {}; sec.loops.forEach(function (i) { S.loopsOn[i] = true; });
    if (sec.build && A) { var t = A.ctx.currentTime, L = stepDur() * 16 * sec.bars; A.hp.frequency.cancelScheduledValues(t); A.hp.frequency.setValueAtTime(20, t); A.hp.frequency.exponentialRampToValueAtTime(1500, t + L); }
    else if (A && S.arrIdx > 0 && S.arr[S.arrIdx - 1].build) drop();
    setTimeout(function () { drawArr(); drawLoops(); }, 0);
  }

  // ---------------------------------------------------------------- UI drawing
  function drawGrid() {
    var g = $('#grid'); if (!g) return; g.innerHTML = '';
    TR.forEach(function (k) {
      var l = document.createElement('div'); l.className = 'lab'; l.textContent = TRL[k]; g.appendChild(l);
      for (var i = 0; i < 16; i++) { var c = document.createElement('div'); c.className = 'c' + (i % 4 === 0 ? ' q' : '') + (S.pat[k][i] ? ' on' : ''); c.dataset.k = k; c.dataset.i = i; g.appendChild(c); }
    });
  }
  function drawBass() { var e = $('#b-line'); if (!e) return; var N = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; e.innerHTML = S.bass.map(function (n) { return '<div class="' + (n !== null ? 'on' : '') + '">' + (n !== null ? N[(STYLES[S.style].root + n) % 12] : '') + '</div>'; }).join(''); }
  function drawLoops() { var e = $('#loops'); if (!e) return; e.innerHTML = LOOPS.map(function (l, i) { var w = S.loopsWait[i] !== undefined; return '<button data-l="' + i + '" class="' + (w ? 'wait' : S.loopsOn[i] ? 'on' : '') + '">' + (i + 1) + ' · ' + l.n + '</button>'; }).join(''); }
  function drawArr() { var e = $('#g-arr'); if (!e) return; if (!S.arr) { e.innerHTML = ''; return; } e.innerHTML = S.arr.map(function (a, i) { return '<div class="' + (i === S.arrIdx ? 'now' : '') + '" style="flex:' + a.bars + '">' + a.n + '</div>'; }).join(''); }
  function ui() { var b = $('#e-play'); if (b) b.textContent = S.playing ? '■ STOP' : '▶ START'; }

  // ---------------------------------------------------------------- visuals (7 modes, change every 7 s)
  var V = { mode: 0, last: 0, beat: 0, names: ['Spektrum', 'Pierścień', 'Tunel fali', 'Cząstki', 'Kalejdoskop', 'Siatka 3D', 'Plazma'], parts: [], hue: 160 };
  function viz(ts) {
    requestAnimationFrame(viz);
    var cv = $('#viz'); if (!cv) return; var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var x = cv.getContext('2d'); w = cv.width; h = cv.height;
    if (ts - V.last > 7000) { V.last = ts; V.mode = (V.mode + 1) % 7; var n = $('#v-name'); if (n) n.textContent = '🌌 ' + V.names[V.mode]; }
    var fr = new Uint8Array(512), wv = new Uint8Array(1024), lvl = 0;
    if (A && S.playing) { A.an.getByteFrequencyData(fr); A.an.getByteTimeDomainData(wv); for (var i = 0; i < 32; i++) lvl += fr[i]; lvl /= 32 * 255; } else for (var j = 0; j < 1024; j++) wv[j] = 128 + Math.sin(ts / 600 + j / 40) * 10;
    while (uiQ.length && A && uiQ[0].t <= A.ctx.currentTime) { var q = uiQ.shift(); if (q.kick) V.beat = 1; markStep(q.s); }
    V.beat *= 0.9; V.hue = (V.hue + 0.3 + V.beat * 2) % 360;
    x.fillStyle = 'rgba(0,0,0,' + (V.mode === 3 || V.mode === 2 ? 0.18 : 0.3) + ')'; x.fillRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) * (0.25 + V.beat * 0.08), hue = V.hue;
    x.lineWidth = 2 * dpr;
    switch (V.mode) {
      case 0: for (var b = 0; b < 96; b++) { var v = fr[b * 2] / 255, bw = w / 96; x.fillStyle = 'hsl(' + (hue + b * 3) + ',100%,' + (40 + v * 30) + '%)'; x.fillRect(b * bw, h - v * h * 0.95, bw - 1, v * h * 0.95); } break;
      case 1: x.beginPath(); for (var a = 0; a <= 180; a++) { var vv = fr[a % 180] / 255, ang = a / 180 * Math.PI * 2 + ts / 3000, rr = R + vv * R; x.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); } x.strokeStyle = 'hsl(' + hue + ',100%,60%)'; x.shadowBlur = 20; x.shadowColor = x.strokeStyle; x.stroke(); x.shadowBlur = 0; break;
      case 2: for (var k = 0; k < 6; k++) { x.beginPath(); var sc2 = 1 - k * 0.14; for (var p = 0; p < 1024; p += 8) { var px = cx + (p / 1024 - 0.5) * w * sc2, py = cy + ((wv[p] - 128) / 128) * h * 0.45 * sc2; p ? x.lineTo(px, py) : x.moveTo(px, py); } x.strokeStyle = 'hsla(' + (hue + k * 40) + ',100%,60%,' + (1 - k * 0.15) + ')'; x.stroke(); } break;
      case 3: if (V.beat > 0.8 || V.parts.length < 60) for (var n2 = 0; n2 < 12; n2++) V.parts.push({ x: cx, y: cy, vx: (rnd() - 0.5) * 14 * dpr, vy: (rnd() - 0.5) * 14 * dpr, l: 1, c: hue + rnd() * 80 });
        V.parts = V.parts.filter(function (q) { q.x += q.vx * (1 + lvl * 2); q.y += q.vy * (1 + lvl * 2); q.l -= 0.012; x.fillStyle = 'hsla(' + q.c + ',100%,60%,' + q.l + ')'; x.fillRect(q.x, q.y, 3 * dpr, 3 * dpr); return q.l > 0; }).slice(-600); break;
      case 4: x.save(); x.translate(cx, cy); for (var s2 = 0; s2 < 8; s2++) { x.rotate(Math.PI / 4); x.beginPath(); for (var p2 = 0; p2 < 64; p2++) { var v2 = fr[p2 * 3] / 255; x.lineTo(p2 * R / 24, Math.sin(p2 / 5 + ts / 400) * v2 * R * 0.6); } x.strokeStyle = 'hsl(' + (hue + s2 * 20) + ',100%,60%)'; x.stroke(); } x.restore(); break;
      case 5: x.strokeStyle = 'hsla(' + hue + ',100%,60%,0.7)'; for (var gz = 0; gz < 20; gz++) { var z = ((gz * 20 + ts / 20 * (1 + lvl)) % 400) / 400, yy = cy + Math.pow(z, 2) * h * 0.5; x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); } for (var gx = -10; gx <= 10; gx++) { x.beginPath(); x.moveTo(cx + gx * w / 40, cy); x.lineTo(cx + gx * w / 4, h); x.stroke(); } x.fillStyle = 'hsl(' + (hue + 180) + ',100%,' + (50 + V.beat * 30) + '%)'; x.beginPath(); x.arc(cx, cy * 0.8, R * 0.5, 0, Math.PI * 2); x.fill(); break;
      case 6: var cs = 24 * dpr; for (var yy2 = 0; yy2 < h; yy2 += cs) for (var xx = 0; xx < w; xx += cs) { var val = Math.sin(xx / 90 + ts / 900) + Math.sin(yy2 / 70 - ts / 1100) + Math.sin((xx + yy2) / 120 + ts / 700) + lvl * 4; x.fillStyle = 'hsl(' + (hue + val * 40) + ',100%,' + (20 + Math.abs(val) * 12) + '%)'; x.fillRect(xx, yy2, cs, cs); } break;
    }
  }
  var lastMark = null;
  function markStep(s) { var g = $('#grid'); if (!g) return; if (lastMark) lastMark.forEach(function (c) { c.classList.remove('now'); }); lastMark = Array.prototype.slice.call(g.querySelectorAll('.c[data-i="' + s + '"]')); lastMark.forEach(function (c) { c.classList.add('now'); }); }

  // ---------------------------------------------------------------- recorder (canvas + audio -> webm)
  var REC = null;
  function rec() {
    var b = $('#e-rec');
    if (REC) { REC.stop(); return; }
    if (!init() || !A.rec || !window.MediaRecorder) { toast('Nagrywanie nie jest wspierane w tej przeglądarce'); return; }
    if (!S.playing) start();
    var cv = $('#viz'), vs = cv.captureStream ? cv.captureStream(30) : null, st = new MediaStream();
    if (vs) vs.getVideoTracks().forEach(function (t) { st.addTrack(t); }); A.rec.stream.getAudioTracks().forEach(function (t) { st.addTrack(t); });
    var types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'audio/webm'], mt = types.filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0];
    var chunks = []; REC = new MediaRecorder(st, mt ? { mimeType: mt, videoBitsPerSecond: 6e6 } : undefined);
    REC.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
    REC.onstop = function () { var blob = new Blob(chunks, { type: mt || 'video/webm' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'D7-SuperSI-' + S.style + '-' + S.bpm + 'bpm-' + Date.now() + '.webm'; document.body.appendChild(a); a.click(); a.remove(); REC = null; if (b) { b.classList.remove('on'); b.textContent = '⏺ Nagraj'; } toast('💾 Zapisano nagranie'); };
    REC.start(1000); if (b) { b.classList.add('on'); b.textContent = '⏹ Zapisz'; } toast('⏺ Nagrywam obraz + dźwięk');
  }

  // ---------------------------------------------------------------- wiring
  function on(id, ev, fn) { var e = $(id); if (e) e.addEventListener(ev, fn); }
  function wire() {
    var kd = $('#keys'); if (kd) kd.innerHTML = KEYS.split('').map(function (k, i) { return '<button data-k="' + i + '">' + k.toUpperCase() + '<br><small>' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i] + '</small></button>'; }).join('');
    on('#e-play', 'click', toggle);
    on('#e-bpm', 'change', function (e) { setBpm(e.target.value); applyFx(); });
    on('#e-style', 'change', function (e) { setStyle(e.target.value); });
    on('#e-random', 'click', function () { random(); if (!S.playing) start(); });
    on('#e-rec', 'click', rec);
    on('#e-swing', 'input', function (e) { S.swing = +e.target.value; });
    on('#e-clear', 'click', function () { TR.forEach(function (k) { S.pat[k] = S.pat[k].map(function () { return false; }); }); drawGrid(); });
    on('#grid', 'click', function (e) { var c = e.target.closest('.c'); if (!c) return; var k = c.dataset.k, i = +c.dataset.i; S.pat[k][i] = !S.pat[k][i]; c.classList.toggle('on', S.pat[k][i]); if (A && S.pat[k][i]) { A.ctx.resume(); DR[k](A.ctx.currentTime, 0.8); } });
    on('#b-new', 'click', genBass);
    on('#b-on', 'click', function (e) { S.bassOn = !S.bassOn; e.target.classList.toggle('on', S.bassOn); e.target.textContent = S.bassOn ? 'ON' : 'OFF'; });
    on('#s-chords', 'click', function (e) { S.chords = !S.chords; e.target.classList.toggle('on', S.chords); e.target.textContent = 'Akordy ' + (S.chords ? 'ON' : 'OFF'); });
    on('#keys', 'pointerdown', function (e) { var b = e.target.closest('button'); if (b) playKey(+b.dataset.k); });
    document.addEventListener('keydown', function (e) { if (/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return; var i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0 && !e.repeat) playKey(i); if (e.code === 'Space') { e.preventDefault(); toggle(); } });
    on('#loops', 'click', function (e) { var b = e.target.closest('button'); if (!b) return; var i = +b.dataset.l; if (!S.playing) { S.loopsOn[i] = !S.loopsOn[i]; start(); } else S.loopsWait[i] = !S.loopsOn[i]; drawLoops(); });
    document.querySelectorAll('.faders input, #f-echot').forEach(function (i) { i.addEventListener('input', applyFx); });
    on('#f-filter', 'dblclick', function (e) { e.target.value = 0; applyFx(); });
    on('#f-build', 'click', buildUp); on('#f-drop', 'click', drop); on('#f-stutter', 'click', stutter);
    on('#g-go', 'click', function () { generate($('#g-prompt').value); });
    on('#g-prompt', 'keydown', function (e) { if (e.key === 'Enter') generate(e.target.value); });
    on('#v-full', 'click', function () { var c = $('#viz'); (c.requestFullscreen || c.webkitRequestFullscreen || function () {}).call(c); });
    on('#v-next', 'click', function () { V.last = 0; });
    on('#e-tabs', 'click', function (e) { var b = e.target.closest('button'); if (!b) return; document.querySelectorAll('#e-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.t === b.dataset.t); }); });
    setStyle('techno'); requestAnimationFrame(viz);
  }
  window.SSI = { start: start, stop: stop, toggle: toggle, setBpm: setBpm, setStyle: setStyle, random: random, generate: generate, rec: rec, drop: drop, buildUp: buildUp, styles: Object.keys(STYLES), loops: LOOPS.map(function (l) { return l.n; }), get playing() { return S.playing; }, get bpm() { return S.bpm; }, get style() { return S.style; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
