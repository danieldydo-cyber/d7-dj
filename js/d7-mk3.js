/* D7 MK3 Pads — Maschine MK3 / Akai MPC style pads for D7 DJ core (D · 2026-11-18)
   16 velocity pads x 8 banks (A-H), synthesized WebAudio kits (techno / hip-hop / trance), local samples,
   step sequencer 16/32, swing, note repeat, D7Clock/d7bpm sync, Web MIDI in (36-51) + MIDI out notes/clock (MC-707),
   keyboard fallback (1234/QWER/ASDF/ZXCV), localStorage patterns. API: window.D7MK3. Free, no server needed. */
(function () {
  'use strict';
  if (window.D7MK3) return;
  var LSK = 'd7mk3.v1', BANKS = 'ABCDEFGH'.split('');
  var KEYMAP = { '1': 12, '2': 13, '3': 14, '4': 15, q: 8, w: 9, e: 10, r: 11, a: 4, s: 5, d: 6, f: 7, z: 0, x: 1, c: 2, v: 3 };
  var KEYLBL = ['Z', 'X', 'C', 'V', 'A', 'S', 'D', 'F', 'Q', 'W', 'E', 'R', '1', '2', '3', '4'];
  var BANKNAME = { A: 'Drums', B: 'Perc', C: 'Bass', D: 'Stabs', E: 'Lead', F: 'FX', G: 'User 1', H: 'User 2' };
  var BANKCOL = { A: '#ff2bd6', B: '#ff6a1a', C: '#00f0ff', D: '#b84dff', E: '#39ff14', F: '#ffcc00', G: '#ff3355', H: '#4d7cff' };
  var KITS = {
    techno: { name: 'Techno (Berlin)', kick: [150, 42, 0.42, 1], root: 45, swing: 50, bpm: 128, stab: [0, 3, 7], wave: 'sawtooth', hatDec: 0.05 },
    hiphop: { name: 'Hip-Hop (boom bap)', kick: [115, 48, 0.6, 0.7], root: 48, swing: 62, bpm: 90, stab: [0, 3, 7, 10], wave: 'triangle', hatDec: 0.07 },
    trance: { name: 'Trance (supersaw)', kick: [175, 48, 0.33, 1.1], root: 42, swing: 50, bpm: 138, stab: [0, 3, 7, 12], wave: 'sawtooth', hatDec: 0.04 }
  };
  var MINOR = [0, 2, 3, 5, 7, 8, 10];
  function scaleNote(root, i) { return root + MINOR[i % 7] + 12 * Math.floor(i / 7); }
  function mtof(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------------- state ---------------- */
  var S = {
    kit: 'techno', bank: 'A', sel: 0, steps: 16, bpm: 120, swing: 50, sync: true, playing: false, rec: false,
    nr: false, nrDiv: 4, step: 0, vol: 0.85, filter: 1, delay: 0, reverb: 0.12, fullVel: false,
    midiCh: 10, clockOut: false, notesOut: false, midiStatus: 'MIDI: nie połączono', bars: 0,
    pat: {}, slots: {}
  };
  BANKS.forEach(function (b) { S.pat[b] = emptyBank(); });
  function emptyBank() { var a = []; for (var i = 0; i < 16; i++) { var r = []; for (var j = 0; j < 32; j++) r.push(0); a.push(r); } return a; }
  function load() {
    try { var o = JSON.parse(localStorage.getItem(LSK) || 'null'); if (!o) return false;
      ['kit', 'bank', 'steps', 'bpm', 'swing', 'sync', 'nrDiv', 'vol', 'filter', 'delay', 'reverb', 'midiCh', 'fullVel'].forEach(function (k) { if (o[k] != null) S[k] = o[k]; });
      if (o.pat) BANKS.forEach(function (b) { if (o.pat[b]) S.pat[b] = o.pat[b]; });
      if (o.slots) S.slots = o.slots; return true;
    } catch (e) { return false; }
  }
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(LSK, JSON.stringify({ kit: S.kit, bank: S.bank, steps: S.steps, bpm: S.bpm, swing: S.swing, sync: S.sync, nrDiv: S.nrDiv, vol: S.vol, filter: S.filter, delay: S.delay, reverb: S.reverb, midiCh: S.midiCh, fullVel: S.fullVel, pat: S.pat, slots: S.slots, at: new Date().toISOString() })); } catch (e) {} }, 250); }

  /* ---------------- audio ---------------- */
  var A = null, samples = {}; // samples['A3'] = AudioBuffer
  function audio() {
    if (A) { if (A.ctx.state === 'suspended') A.ctx.resume(); return A; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    var ctx = new C(), a = { ctx: ctx };
    a.in = ctx.createGain();
    a.filter = ctx.createBiquadFilter(); a.filter.type = 'lowpass'; a.filter.Q.value = 4;
    a.dry = ctx.createGain();
    a.delay = ctx.createDelay(2); a.dfb = ctx.createGain(); a.dfb.gain.value = 0.38; a.dsend = ctx.createGain();
    a.conv = ctx.createConvolver(); a.conv.buffer = impulse(ctx, 2.4); a.rsend = ctx.createGain();
    a.master = ctx.createGain(); a.comp = ctx.createDynamicsCompressor(); a.comp.threshold.value = -10; a.comp.ratio.value = 4;
    a.analyser = ctx.createAnalyser(); a.analyser.fftSize = 2048; a.analyser.smoothingTimeConstant = 0.78;
    a.in.connect(a.filter); a.filter.connect(a.dry); a.dry.connect(a.master);
    a.filter.connect(a.dsend); a.dsend.connect(a.delay); a.delay.connect(a.dfb); a.dfb.connect(a.delay); a.delay.connect(a.master);
    a.filter.connect(a.rsend); a.rsend.connect(a.conv); a.conv.connect(a.master);
    a.master.connect(a.comp); a.comp.connect(a.analyser); a.analyser.connect(ctx.destination);
    a.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = a.noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A = a; applyFx(); if (!timer) timer = setInterval(tick, 25); return a;
  }
  function impulse(ctx, sec) { var n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate); for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); } return b; }
  function applyFx() {
    if (!A) return; var t = A.ctx.currentTime;
    A.filter.frequency.setTargetAtTime(80 * Math.pow(250, S.filter), t, 0.04);
    A.dsend.gain.setTargetAtTime(S.delay * 0.7, t, 0.05);
    A.delay.delayTime.setTargetAtTime(Math.min(1.9, 60 / S.bpm * 0.75), t, 0.05);
    A.rsend.gain.setTargetAtTime(S.reverb * 0.9, t, 0.05);
    A.master.gain.setTargetAtTime(S.vol, t, 0.03);
  }
  function env(g, t, peak, dec, att) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + (att || 0.002)); g.gain.exponentialRampToValueAtTime(0.0001, t + (att || 0.002) + dec); }
  function osc(type, f, t, dur, dest, gain, dec, f2, sweep, att) {
    var o = A.ctx.createOscillator(), g = A.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (sweep || 0.1)); env(g, t, gain, dec, att);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(t, dest, gain, dec, type, freq, q) {
    var s = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain(); s.buffer = A.noise;
    f.type = type || 'highpass'; f.frequency.value = freq || 7000; if (q) f.Q.value = q; env(g, t, gain, dec);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + dec + 0.1);
  }
  function lpSynth(notes, t, v, dest, wave, dur, cut, detune) {
    var f = A.ctx.createBiquadFilter(), g = A.ctx.createGain(); f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(cut * 4, t); f.frequency.exponentialRampToValueAtTime(cut, t + dur * 0.8); env(g, t, v * 0.35, dur, 0.004);
    f.connect(g); g.connect(dest);
    notes.forEach(function (n) { (detune ? [-detune, 0, detune] : [0]).forEach(function (dt) { var o = A.ctx.createOscillator(); o.type = wave; o.frequency.value = mtof(n); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + 0.1); }); });
  }
  /* voice per bank/pad: returns name + play fn */
  function voiceName(bank, i) {
    if (samples[bank + i]) return '🎵 ' + samples[bank + i].name.slice(0, 10);
    var K = KITS[S.kit];
    if (bank === 'A') return ['Kick', 'Kick 2', 'Snare', 'Clap', 'CH Hat', 'OH Hat', 'Rim', 'Tom L', 'Tom M', 'Tom H', 'Ride', 'Crash', 'Cowbell', 'Shaker', 'Snap', 'Sub'][i];
    if (bank === 'B') return ['Kick lo', 'Kick hi', 'Snr tight', 'Clap wide', 'Hat 16', 'Hat open L', 'Conga', 'Bongo', 'Clave', 'Tamb', 'Zap', 'Click', 'Metal', 'Wood', 'Perc', 'Boom'][i];
    if (bank === 'C') return 'Bass ' + noteName(scaleNote(K.root - 12, i));
    if (bank === 'D') return 'Stab ' + noteName(scaleNote(K.root + 12, i));
    if (bank === 'E') return 'Lead ' + noteName(scaleNote(K.root + 24, i));
    if (bank === 'F') return ['Riser', 'Down', 'Laser', 'Noise up', 'Impact', 'Sub drop', 'Siren', 'Blip', 'Vinyl', 'Gate', 'Reverse', 'Sweep', 'Ping', 'Alarm', 'Glitch', 'Hit 707'][i];
    return '— wczytaj';
  }
  var NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function noteName(n) { return NN[n % 12] + (Math.floor(n / 12) - 1); }
  function play(bank, i, vel, t) {
    var a = audio(); if (!a) return; t = t || a.ctx.currentTime; var v = clamp(vel == null ? 1 : vel, 0.05, 1), d = a.in, K = KITS[S.kit];
    var sm = samples[bank + i];
    if (sm) { var s = a.ctx.createBufferSource(), g = a.ctx.createGain(); s.buffer = sm.buf; g.gain.value = v; s.connect(g); g.connect(d); s.start(t); return; }
    if (bank === 'A' || bank === 'B') return drum(bank === 'B' ? i + 16 : i, v, t, d, K);
    if (bank === 'C') return lpSynth([scaleNote(K.root - 12, i)], t, v * 1.4, d, K.wave === 'triangle' ? 'square' : 'sawtooth', S.kit === 'hiphop' ? 0.5 : 0.22, S.kit === 'trance' ? 500 : 260);
    if (bank === 'D') { var r = scaleNote(K.root + 12, i); return lpSynth(K.stab.map(function (x) { return r + x; }), t, v * 0.8, d, 'sawtooth', S.kit === 'hiphop' ? 0.6 : 0.28, S.kit === 'trance' ? 2400 : 1100, S.kit === 'trance' ? 14 : 6); }
    if (bank === 'E') return lpSynth([scaleNote(K.root + 24, i)], t, v, d, S.kit === 'hiphop' ? 'triangle' : 'square', 0.3, 1800, S.kit === 'trance' ? 10 : 0);
    if (bank === 'F') return fx(i, v, t, d);
    osc('sine', 880 + i * 40, t, 0.08, d, v * 0.2, 0.07); // empty user pad blip
  }
  function drum(i, v, t, d, K) {
    var k = K.kick;
    switch (i) {
      case 0: osc('sine', k[0], t, k[2], d, v * k[3], k[2], k[1], 0.11); noise(t, d, v * 0.25, 0.012, 'highpass', 3000); break;
      case 1: osc('sine', k[0] * 1.2, t, k[2] * 0.7, d, v * k[3], k[2] * 0.7, k[1] * 1.1, 0.07); osc('square', 90, t, 0.03, d, v * 0.15, 0.02); break;
      case 2: noise(t, d, v * 0.7, S.kit === 'hiphop' ? 0.24 : 0.16, 'bandpass', 2200, 0.8); osc('triangle', 190, t, 0.1, d, v * 0.5, 0.09, 140, 0.08); break;
      case 3: [0, 0.011, 0.023].forEach(function (o, n) { noise(t + o, d, v * (n === 2 ? 0.8 : 0.5), n === 2 ? 0.18 : 0.01, 'bandpass', 1300, 1.4); }); break;
      case 4: noise(t, d, v * 0.45, K.hatDec, 'highpass', 8000); break;
      case 5: noise(t, d, v * 0.4, 0.32, 'highpass', 7000); break;
      case 6: osc('square', 1700, t, 0.03, d, v * 0.25, 0.025); osc('triangle', 820, t, 0.04, d, v * 0.3, 0.035); break;
      case 7: case 8: case 9: var tf = [95, 140, 200][i - 7]; osc('sine', tf * 1.6, t, 0.35, d, v * 0.8, 0.3, tf, 0.2); break;
      case 10: noise(t, d, v * 0.22, 0.6, 'bandpass', 9000, 3); osc('square', 520, t, 0.5, d, v * 0.04, 0.4); break;
      case 11: noise(t, d, v * 0.45, 1.4, 'highpass', 4500); break;
      case 12: osc('square', 540, t, 0.3, d, v * 0.18, 0.25); osc('square', 800, t, 0.3, d, v * 0.15, 0.25); break;
      case 13: noise(t, d, v * 0.3, 0.07, 'bandpass', 6000, 2, 0.02); break;
      case 14: noise(t, d, v * 0.6, 0.06, 'bandpass', 3000, 3); break;
      case 15: osc('sine', 55, t, 0.8, d, v * 0.9, 0.7, 40, 0.5); break;
      case 16: osc('sine', k[0] * 0.8, t, k[2] * 1.3, d, v * k[3], k[2] * 1.3, k[1] * 0.85, 0.14); break;
      case 17: osc('sine', k[0] * 1.5, t, 0.22, d, v, 0.2, k[1] * 1.4, 0.05); noise(t, d, v * 0.35, 0.01, 'highpass', 4000); break;
      case 18: noise(t, d, v * 0.6, 0.08, 'bandpass', 3500, 1.2); osc('triangle', 240, t, 0.06, d, v * 0.4, 0.05); break;
      case 19: [0, 0.015, 0.03, 0.045].forEach(function (o) { noise(t + o, d, v * 0.5, 0.05, 'bandpass', 1000, 1); }); break;
      case 20: noise(t, d, v * 0.35, 0.025, 'highpass', 10000); break;
      case 21: noise(t, d, v * 0.3, 0.5, 'highpass', 6000); break;
      case 22: osc('sine', 420, t, 0.25, d, v * 0.6, 0.2, 300, 0.05); break;
      case 23: osc('sine', 620, t, 0.15, d, v * 0.6, 0.12, 480, 0.04); break;
      case 24: osc('sine', 2500, t, 0.05, d, v * 0.4, 0.04); break;
      case 25: noise(t, d, v * 0.35, 0.18, 'bandpass', 7000, 1); osc('square', 4000, t, 0.1, d, v * 0.05, 0.1); break;
      case 26: osc('sawtooth', 2000, t, 0.12, d, v * 0.3, 0.1, 100, 0.1); break;
      case 27: osc('square', 3000, t, 0.01, d, v * 0.3, 0.008); break;
      case 28: osc('square', 330, t, 0.4, d, v * 0.12, 0.35); osc('square', 467, t, 0.4, d, v * 0.12, 0.35); osc('square', 690, t, 0.4, d, v * 0.08, 0.35); break;
      case 29: osc('triangle', 1100, t, 0.06, d, v * 0.5, 0.05, 900, 0.04); break;
      case 30: osc('sine', 300 + Math.random() * 500, t, 0.1, d, v * 0.5, 0.08); noise(t, d, v * 0.2, 0.04, 'bandpass', 2500, 4); break;
      case 31: osc('sine', 120, t, 1.2, d, v, 1.1, 30, 1); noise(t, d, v * 0.3, 0.3, 'lowpass', 400); break;
    }
  }
  function fx(i, v, t, d) {
    var b = 60 / S.bpm;
    switch (i) {
      case 0: noise(t, d, v * 0.25, b * 4, 'bandpass', 500, 2); osc('sawtooth', 100, t, b * 4, d, v * 0.12, b * 4, 1600, b * 4, b * 3.5); break;
      case 1: osc('sawtooth', 1400, t, b * 2, d, v * 0.2, b * 2, 60, b * 2); break;
      case 2: osc('square', 3000, t, 0.25, d, v * 0.2, 0.22, 200, 0.2); break;
      case 3: noise(t, d, v * 0.35, b * 2, 'highpass', 2000, 0, b * 1.8); break;
      case 4: osc('sine', 80, t, 1.2, d, v, 1.1, 30, 0.6); noise(t, d, v * 0.6, 0.9, 'lowpass', 1200); break;
      case 5: osc('sine', 110, t, 1.6, d, v, 1.5, 28, 1.5); break;
      case 6: osc('sawtooth', 600, t, 1, d, v * 0.15, 0.95, 1200, 0.5); break;
      case 7: osc('sine', 1760, t, 0.08, d, v * 0.4, 0.07); break;
      case 8: noise(t, d, v * 0.12, 0.8, 'bandpass', 1800, 6); break;
      case 9: for (var k = 0; k < 8; k++) noise(t + k * b / 4, d, v * 0.3, b / 8, 'bandpass', 1500, 1); break;
      case 10: osc('sawtooth', 200, t, b, d, v * 0.25, 0.04, 1200, b, b * 0.95); break;
      case 11: noise(t, d, v * 0.3, b * 2, 'bandpass', 300, 8); break;
      case 12: osc('sine', 1320, t, 0.6, d, v * 0.35, 0.55); osc('sine', 1980, t, 0.6, d, v * 0.15, 0.5); break;
      case 13: for (var j = 0; j < 4; j++) osc('square', j % 2 ? 900 : 1200, t + j * 0.12, 0.1, d, v * 0.12, 0.1); break;
      case 14: for (var m = 0; m < 6; m++) osc('square', 200 + Math.random() * 3000, t + m * 0.03, 0.03, d, v * 0.2, 0.025); break;
      case 15: drum(0, v, t, d, KITS[S.kit]); drum(3, v, t, d, KITS[S.kit]); drum(11, v * 0.7, t, d, KITS[S.kit]); break;
    }
  }

  /* ---------------- clock sync (D7Clock / d7bpm / postMessage) ---------------- */
  function extClock() { try { if (window.D7Clock) return window.D7Clock; } catch (e) {} try { if (window.parent !== window && window.parent.D7Clock) return window.parent.D7Clock; } catch (e) {} return null; }
  var lastSyncSrc = 'własny zegar';
  function setBpm(b, src, noPush) {
    b = clamp(Math.round((+b || 120) * 10) / 10, 60, 190); var ch = Math.abs(b - S.bpm) > 0.04; S.bpm = b;
    if (src) lastSyncSrc = src;
    if (!noPush && S.sync) { var c = extClock(); if (c && c.set) try { c.set(b, 'mk3'); } catch (e) {} try { localStorage.setItem('d7bpm', String(b)); } catch (e) {} }
    applyFx(); save(); if (ch || src) emit('bpm'); renderTop();
  }
  function pullClock() {
    if (!S.sync) return; var c = extClock();
    if (c && c.bpm && Math.abs(c.bpm - S.bpm) > 0.04) return setBpm(c.bpm, 'D7Clock (' + (c.src || 'zegar') + ')', true);
    if (!c) { var v = +localStorage.getItem('d7bpm'); if (v && Math.abs(v - S.bpm) > 0.04) setBpm(v, 'zegar D7 (d7bpm)', true); }
  }
  window.addEventListener('d7clock', function (e) { if (S.sync && e.detail && e.detail.bpm) setBpm(e.detail.bpm, 'D7Clock ' + (e.detail.src || ''), true); });
  window.addEventListener('storage', function (e) { if (S.sync && e.key === 'd7bpm' && +e.newValue) setBpm(+e.newValue, 'zegar D7 (inna karta)', true); });
  window.addEventListener('message', function (e) { var d = e.data; if (S.sync && d && d.type === 'd7:clock' && d.bpm) setBpm(d.bpm, 'zegar rodzica', true); });

  /* ---------------- sequencer ---------------- */
  var nextT = 0, timer = 0, nrNext = 0, held = {}, lastBar = -1;
  function stepDur() { return 60 / S.bpm / 4; }
  function swingOff(step) { return step % 2 ? (S.swing / 100 * 2 - 1) * stepDur() : 0; }
  function start() { var a = audio(); if (!a || S.playing) return; S.playing = true; S.step = 0; nextT = a.ctx.currentTime + 0.06; nrNext = nextT; midiSend([0xFA], nextT); if (!timer) timer = setInterval(tick, 25); tick(); emit('play'); renderTop(); }
  function stop() { S.playing = false; midiSend([0xFC]); emit('stop'); renderTop(); $$('.mk3-cell.now').forEach(function (c) { c.classList.remove('now'); }); }
  function tick() {
    var a = A; if (!a) return; var ahead = a.ctx.currentTime + 0.12;
    while (S.playing && nextT < ahead) {
      var st = S.step, t = nextT + swingOff(st);
      BANKS.forEach(function (b) { var P = S.pat[b]; for (var p = 0; p < 16; p++) { var v = P[p][st]; if (v) { play(b, p, v / 127, t); midiNote(b, p, v, t); } } });
      if (S.clockOut) for (var k = 0; k < 6; k++) midiSend([0xF8], nextT + k * stepDur() / 6);
      uiAt(t, st);
      nextT += stepDur(); S.step = (st + 1) % S.steps;
    }
    if (S.nr) { var iv = 60 / S.bpm / S.nrDiv; if (nrNext < a.ctx.currentTime) nrNext = a.ctx.currentTime; while (nrNext < ahead) { Object.keys(held).forEach(function (k) { var h = held[k]; play(h.b, h.p, h.v, nrNext); midiNote(h.b, h.p, Math.round(h.v * 127), nrNext); if (S.rec) recAt(h.b, h.p, h.v, nrNext); }); nrNext += iv; } }
  }
  function uiAt(t, st) {
    var ms = Math.max(0, (t - A.ctx.currentTime) * 1000);
    setTimeout(function () {
      if (!S.playing) return; $$('.mk3-cell.now').forEach(function (c) { c.classList.remove('now'); }); $$('.mk3-cell[data-s="' + st + '"]').forEach(function (c) { c.classList.add('now'); });
      if (st % 4 === 0) { try { if (window.parent !== window) window.parent.postMessage({ type: 'd7:beat', level: st % 16 === 0 ? 1 : 0.6, beat: true, src: 'mk3' }, '*'); } catch (e) {} }
      if (st === 0 || (S.steps === 32 && st === 16)) { S.bars++; emit('bar', { bar: S.bars }); }
      emit('step', { step: st });
      var bb = $('#mk3-pos'); if (bb) bb.textContent = 'takt ' + (S.bars || 0) + ' · krok ' + (st + 1) + '/' + S.steps;
    }, ms);
  }
  function recAt(b, p, v, t) {
    if (!S.playing) return; var sd = stepDur(), rel = (t - (nextT - sd)) / sd; var st = (S.step - 1 + S.steps + Math.round(rel)) % S.steps;
    S.pat[b][p][st] = Math.max(8, Math.round(v * 127)); save(); renderGrid();
  }
  /* ---------------- pattern generators (presets) ---------------- */
  function gen(style, bank, variation) {
    style = style || S.kit; var P = emptyBank(), n = S.steps, r = Math.random, v = variation == null ? 0.3 : variation;
    function set(p, s, vel) { if (s < n) P[p][s] = vel; }
    for (var s = 0; s < n; s++) {
      var q = s % 16;
      if (style === 'techno') {
        if (q % 4 === 0) set(0, s, 120); if (q % 4 === 2) set(5, s, 95); if (q === 4 || q === 12) set(3, s, r() < v ? 0 : 105);
        set(4, s, q % 2 ? 70 : 100 - (r() * 30 | 0)); if (r() < v * 0.4) set(6, s, 70 + (r() * 40 | 0)); if (q === 15 && r() < v) set(0, s, 80);
        if (r() < v * 0.25) set(12, s, 60);
      } else if (style === 'hiphop') {
        if (q === 0 || q === 10 || (q === 7 && r() < 0.6) || (q === 13 && r() < v)) set(0, s, 120); if (q === 4 || q === 12) set(2, s, 118);
        if (q % 2 === 0) set(4, s, 70 + (r() * 35 | 0)); if (q === 14 && r() < v) set(5, s, 80); if (r() < v * 0.2) set(6, s, 60);
      } else { // trance
        if (q % 4 === 0) set(0, s, 125); if (q % 4 === 2) set(5, s, 100); if (q === 4 || q === 12) set(3, s, 110); set(4, s, 60 + (q % 4 === 2 ? 40 : 0));
        if (q === 14 && r() < v) set(13, s, 70); if (q % 16 === 0 && s === 0) set(11, s, 90);
      }
    }
    return P;
  }
  function genBass(style) { var P = emptyBank(), n = S.steps, r = Math.random, notes = style === 'hiphop' ? [0, 0, 3, 4] : [0, 0, 0, 3, 4, 7];
    for (var s = 0; s < n; s++) { var q = s % 16; var hit = style === 'trance' ? q % 4 === 2 || q % 4 === 3 : style === 'hiphop' ? (q === 0 || q === 6 || q === 10) : (q % 4 === 2 || (r() < 0.25 && q % 2)); if (hit) P[notes[(r() * notes.length) | 0]][s] = 100; } return P; }
  function loadPreset(style, keepKit) {
    style = style || S.kit; if (!keepKit && KITS[style]) S.kit = style;
    S.pat.A = gen(style, 'A'); S.pat.C = genBass(style); var D = emptyBank(); if (style === 'trance') { D[0][2] = 90; D[0][10] = 90; D[3][14] = 80; } else if (style === 'techno') { if (Math.random() < 0.6) D[(Math.random() * 5) | 0][6] = 85; } else { D[0][0] = 80; D[4][8] = 80; } S.pat.D = D;
    save(); renderAll(); emit('pattern', { style: style }); return style;
  }
  function randomize(amount, bank) { var b = BANKS.indexOf(bank) >= 0 ? bank : S.bank, P = S.pat[b]; for (var p = 0; p < 16; p++) for (var s = 0; s < S.steps; s++) if (Math.random() < (amount || 0.08)) P[p][s] = P[p][s] ? 0 : 50 + (Math.random() * 77 | 0); save(); renderGrid(); emit('pattern', { style: 'random', bank: b }); }

  /* ---------------- MIDI ---------------- */
  var M = { access: null, out: null, ins: [] };
  function midiInit() {
    if (!navigator.requestMIDIAccess) { setMidi('Brak Web MIDI w tej przeglądarce (Chrome/Edge na komputerze lub Androidzie). Pady, klawiatura i sekwencer działają normalnie.'); return Promise.resolve(false); }
    return navigator.requestMIDIAccess({ sysex: false }).then(function (acc) { M.access = acc; acc.onstatechange = midiPorts; midiPorts(); return true; })
      .catch(function (e) { setMidi('MIDI zablokowane / brak zgody (' + (e && e.name || 'błąd') + '). Pady i klawiatura działają.'); return false; });
  }
  function midiPorts() {
    var acc = M.access; if (!acc) return; var ins = [], outs = []; acc.inputs.forEach(function (i) { ins.push(i); }); acc.outputs.forEach(function (o) { outs.push(o); });
    ins.forEach(function (i) { i.onmidimessage = onMidi; }); M.ins = ins;
    var sel = $('#mk3-mout'); if (sel) { var cur = sel.value; sel.innerHTML = '<option value="">— brak wyjścia —</option>' + outs.map(function (o) { return '<option value="' + o.id + '">' + esc(o.name) + '</option>'; }).join(''); var mc = outs.filter(function (o) { return /707|MC-|MPC|Maschine/i.test(o.name); })[0]; sel.value = cur || (mc ? mc.id : ''); M.out = acc.outputs.get(sel.value) || null; }
    setMidi(ins.length || outs.length ? 'MIDI OK · wejścia: ' + (ins.map(function (i) { return i.name; }).join(', ') || 'brak') + ' · wyjścia: ' + (outs.map(function (o) { return o.name; }).join(', ') || 'brak') : 'MIDI dostępne, ale nie widzę urządzeń. Podłącz kontroler / MC-707 (USB) i odśwież.');
  }
  function onMidi(e) {
    var d = e.data, st = d[0] & 0xf0;
    if (d[0] === 0xFA) return start(); if (d[0] === 0xFC) return stop();
    if (st === 0x90 && d[2] > 0) { var p = d[1] >= 36 && d[1] <= 51 ? d[1] - 36 : ((d[1] % 16) + 16) % 16; hit(S.bank, p, d[2] / 127, 'midi' + d[1]); }
    else if (st === 0x80 || (st === 0x90 && d[2] === 0)) { var p2 = d[1] >= 36 && d[1] <= 51 ? d[1] - 36 : d[1] % 16; release('midi' + d[1]); }
    else if (st === 0xB0) { if (d[1] === 74) setFx('filter', d[2] / 127); if (d[1] === 91) setFx('reverb', d[2] / 127); if (d[1] === 94) setFx('delay', d[2] / 127); }
  }
  function midiSend(arr, audioT) { if (!M.out) return; try { if (audioT != null && A) { M.out.send(arr, performance.now() + Math.max(0, (audioT - A.ctx.currentTime) * 1000)); } else M.out.send(arr); } catch (e) {} }
  function midiNote(b, p, vel, t) { if (!S.notesOut || !M.out) return; var ch = (S.midiCh - 1) & 15, n = 36 + p; midiSend([0x90 | ch, n, clamp(vel | 0, 1, 127)], t); midiSend([0x80 | ch, n, 0], t + 0.1); }
  function setMidi(t) { S.midiStatus = t; var e = $('#mk3-midi'); if (e) e.textContent = t; }

  /* ---------------- pad input ---------------- */
  function hit(b, p, v, key) {
    if (S.fullVel) v = 1; play(b, p, v); if (!S.playing || !S.nr) midiNote(b, p, Math.round(v * 127), A ? A.ctx.currentTime : 0);
    if (S.rec) recAt(b, p, v, A.ctx.currentTime);
    if (key) held[key] = { b: b, p: p, v: v };
    if (b === S.bank && p !== S.sel) { S.sel = p; renderGrid(); }
    var el = $('.mk3-pad[data-p="' + p + '"]'); if (el && b === S.bank) { el.classList.add('hit'); el.style.setProperty('--v', v.toFixed(2)); setTimeout(function () { el.classList.remove('hit'); }, 110); }
    emit('hit', { bank: b, pad: p, vel: v });
  }
  function release(key) { delete held[key]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setFx(k, v) { S[k] = clamp(v, 0, 1); applyFx(); save(); var el = $('#mk3-' + k); if (el) el.value = S[k]; emit('fx', { k: k, v: S[k] }); }

  /* ---------------- events ---------------- */
  var L = {};
  function on(ev, fn) { (L[ev] = L[ev] || []).push(fn); }
  function emit(ev, d) { (L[ev] || []).forEach(function (f) { try { f(d || {}); } catch (e) {} }); try { window.dispatchEvent(new CustomEvent('d7mk3:' + ev, { detail: d || {} })); } catch (e) {} }

  /* ---------------- UI ---------------- */
  var root = null;
  function mount(el) {
    root = typeof el === 'string' ? $(el) : el; if (!root) return; load(); root.classList.add('mk3');
    root.innerHTML =
      '<div class="mk3-top">' +
      '<div class="mk3-logo">D7 <b>MK3</b> PADS<small>Maschine · MPC style</small></div>' +
      '<button class="mk3-b mk3-play" id="mk3-play">▶ PLAY</button><button class="mk3-b" id="mk3-stop">■ STOP</button><button class="mk3-b mk3-rec" id="mk3-rec">● REC</button>' +
      '<label class="mk3-l">BPM <input id="mk3-bpmn" type="number" min="60" max="190" step="0.1"><input id="mk3-bpm" type="range" min="79" max="140" step="1"></label>' +
      '<button class="mk3-b" id="mk3-tap">TAP</button><label class="mk3-l"><input type="checkbox" id="mk3-sync"> SYNC zegar D7</label>' +
      '<label class="mk3-l">SWING <input id="mk3-swing" type="range" min="50" max="75" step="1"><span id="mk3-swv"></span></label>' +
      '<label class="mk3-l">KROKI <select id="mk3-steps"><option>16</option><option>32</option></select></label>' +
      '<label class="mk3-l">KIT <select id="mk3-kit"></select></label>' +
      '<button class="mk3-b" id="mk3-nr">NOTE REPEAT</button><select id="mk3-nrdiv" class="mk3-sel"><option value="2">1/8</option><option value="4">1/16</option><option value="6">1/16T</option><option value="8">1/32</option></select>' +
      '<span class="mk3-pos" id="mk3-pos">stop</span><span class="mk3-src" id="mk3-src"></span></div>' +
      '<div class="mk3-banks" id="mk3-banks"></div>' +
      '<div class="mk3-main"><div class="mk3-left"><div class="mk3-pads" id="mk3-pads"></div>' +
      '<div class="mk3-fx"><label>FILTER<input type="range" id="mk3-filter" min="0" max="1" step="0.01"></label><label>DELAY<input type="range" id="mk3-delay" min="0" max="1" step="0.01"></label><label>REVERB<input type="range" id="mk3-reverb" min="0" max="1" step="0.01"></label><label>VOL<input type="range" id="mk3-vol" min="0" max="1" step="0.01"></label><label class="mk3-l"><input type="checkbox" id="mk3-fullvel"> 100% velocity</label></div>' +
      '<canvas id="mk3-scope" height="90"></canvas></div>' +
      '<div class="mk3-right"><div class="mk3-tools"><b>Pattern:</b> <button class="mk3-b" data-gen="techno">Techno</button><button class="mk3-b" data-gen="hiphop">Hip-Hop</button><button class="mk3-b" data-gen="trance">Trance</button><button class="mk3-b" id="mk3-rand">🎲 Random bank</button><button class="mk3-b" id="mk3-clr">Wyczyść bank</button><button class="mk3-b" id="mk3-clrall">Wyczyść wszystko</button></div>' +
      '<div class="mk3-grid" id="mk3-grid"></div>' +
      '<div class="mk3-tools"><b>Sloty:</b> <select id="mk3-slot" class="mk3-sel"></select><button class="mk3-b" id="mk3-ssave">💾 Zapisz</button><button class="mk3-b" id="mk3-sload">📂 Wczytaj</button><button class="mk3-b" id="mk3-exp">⬇ Eksport JSON</button><label class="mk3-b mk3-file">⬆ Import JSON<input type="file" id="mk3-imp" accept=".json,application/json"></label></div>' +
      '<div class="mk3-tools"><b>Sample:</b> <label class="mk3-b mk3-file">📁 Wczytaj plik do wybranego pada<input type="file" id="mk3-smp" accept="audio/*"></label><button class="mk3-b" id="mk3-smpclr">Usuń sample</button><span class="mk3-hint" id="mk3-smpinfo"></span></div>' +
      '<div class="mk3-midi-box"><b>MIDI</b> <button class="mk3-b" id="mk3-midion">🎹 Połącz MIDI</button> Wyjście <select id="mk3-mout" class="mk3-sel"><option value="">— brak —</option></select> Kanał <select id="mk3-ch" class="mk3-sel"></select>' +
      '<label class="mk3-l"><input type="checkbox" id="mk3-clk"> Clock OUT (MC-707)</label><label class="mk3-l"><input type="checkbox" id="mk3-nout"> Nuty OUT</label><div class="mk3-hint" id="mk3-midi"></div></div>' +
      '<div class="mk3-hint">Klawiatura: 1 2 3 4 / Q W E R / A S D F / Z X C V = pady 13-16 / 9-12 / 5-8 / 1-4 · SPACJA = play/stop · MIDI nuty 36-51 = pady 1-16 (jak MPC) · CC74 filtr, CC91 reverb, CC94 delay. Siła uderzenia: góra pada = głośniej.</div></div></div>';
    var ks = $('#mk3-kit', root); Object.keys(KITS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = KITS[k].name; ks.appendChild(o); });
    var ch = $('#mk3-ch', root); for (var i = 1; i <= 16; i++) { var o = document.createElement('option'); o.value = i; o.textContent = i; ch.appendChild(o); }
    var sl = $('#mk3-slot', root); for (var j = 1; j <= 8; j++) { var o2 = document.createElement('option'); o2.value = j; o2.textContent = 'Slot ' + j; sl.appendChild(o2); }
    wire(); pullClock(); renderAll(); drawScope();
    setMidi(navigator.requestMIDIAccess ? 'MIDI: kliknij „Połącz MIDI” (przeglądarka zapyta o zgodę).' : 'Brak Web MIDI w tej przeglądarce (Safari/iOS). Pady, klawiatura i sekwencer działają normalnie.');
    setInterval(pullClock, 1500);
  }
  function wire() {
    $('#mk3-play', root).onclick = function () { S.playing ? stop() : start(); };
    $('#mk3-stop', root).onclick = function () { stop(); S.bars = 0; };
    $('#mk3-rec', root).onclick = function () { S.rec = !S.rec; renderTop(); };
    $('#mk3-bpm', root).oninput = function () { setBpm(this.value, 'ręcznie'); };
    $('#mk3-bpmn', root).onchange = function () { setBpm(this.value, 'ręcznie'); };
    var taps = []; $('#mk3-tap', root).onclick = function () { var t = performance.now(); taps = taps.filter(function (x) { return t - x < 3000; }); taps.push(t); if (taps.length > 2) setBpm(60000 * (taps.length - 1) / (t - taps[0]), 'TAP'); };
    $('#mk3-sync', root).onchange = function () { S.sync = this.checked; save(); if (S.sync) { lastSyncSrc = 'sync…'; pullClock(); } else lastSyncSrc = 'własny zegar'; renderTop(); };
    $('#mk3-swing', root).oninput = function () { S.swing = +this.value; save(); renderTop(); };
    $('#mk3-steps', root).onchange = function () { S.steps = +this.value; S.step %= S.steps; save(); renderGrid(); };
    $('#mk3-kit', root).onchange = function () { S.kit = this.value; save(); renderPads(); renderGrid(); emit('kit', { kit: S.kit }); };
    $('#mk3-nr', root).onclick = function () { S.nr = !S.nr; renderTop(); };
    $('#mk3-nrdiv', root).onchange = function () { S.nrDiv = +this.value; save(); };
    ['filter', 'delay', 'reverb', 'vol'].forEach(function (k) { $('#mk3-' + k, root).oninput = function () { setFx(k, +this.value); }; });
    $('#mk3-fullvel', root).onchange = function () { S.fullVel = this.checked; save(); };
    $$('[data-gen]', root).forEach(function (b) { b.onclick = function () { loadPreset(b.getAttribute('data-gen')); }; });
    $('#mk3-rand', root).onclick = function () { randomize(0.08); };
    $('#mk3-clr', root).onclick = function () { S.pat[S.bank] = emptyBank(); save(); renderGrid(); };
    $('#mk3-clrall', root).onclick = function () { if (!confirm('Wyczyścić wszystkie banki A-H?')) return; BANKS.forEach(function (b) { S.pat[b] = emptyBank(); }); save(); renderGrid(); };
    $('#mk3-ssave', root).onclick = function () { var k = $('#mk3-slot', root).value; S.slots[k] = { at: new Date().toISOString(), kit: S.kit, bpm: S.bpm, swing: S.swing, steps: S.steps, pat: JSON.parse(JSON.stringify(S.pat)) }; save(); toast('Zapisano slot ' + k); };
    $('#mk3-sload', root).onclick = function () { var k = $('#mk3-slot', root).value, o = S.slots[k]; if (!o) return toast('Slot ' + k + ' pusty'); applySnap(o); toast('Wczytano slot ' + k); };
    $('#mk3-exp', root).onclick = function () { var b = new Blob([JSON.stringify({ d7mk3: 1, kit: S.kit, bpm: S.bpm, swing: S.swing, steps: S.steps, pat: S.pat }, null, 0)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'd7-mk3-pattern-' + Date.now() + '.json'; a.click(); };
    $('#mk3-imp', root).onchange = function () { var f = this.files[0]; if (!f) return; f.text().then(function (t) { applySnap(JSON.parse(t)); toast('Zaimportowano'); }).catch(function () { toast('Zły plik JSON'); }); };
    $('#mk3-smp', root).onchange = function () { var f = this.files[0], a = audio(); if (!f || !a) return; var bk = S.bank, pd = S.sel; f.arrayBuffer().then(function (ab) { return a.ctx.decodeAudioData(ab); }).then(function (buf) { samples[bk + pd] = { buf: buf, name: f.name }; renderPads(); renderGrid(); toast('Sample ' + f.name + ' → ' + bk + (pd + 1)); }).catch(function () { toast('Nie umiem odczytać tego pliku audio'); }); this.value = ''; };
    $('#mk3-smpclr', root).onclick = function () { delete samples[S.bank + S.sel]; renderPads(); renderGrid(); };
    $('#mk3-midion', root).onclick = function () { audio(); midiInit(); };
    $('#mk3-mout', root).onchange = function () { M.out = M.access ? M.access.outputs.get(this.value) || null : null; };
    $('#mk3-ch', root).onchange = function () { S.midiCh = +this.value; save(); };
    $('#mk3-clk', root).onchange = function () { S.clockOut = this.checked; if (!M.out && this.checked) toast('Wybierz wyjście MIDI (np. MC-707)'); };
    $('#mk3-nout', root).onchange = function () { S.notesOut = this.checked; };
    document.addEventListener('keydown', function (e) {
      if (!root || !root.offsetParent || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
      if (e.code === 'Space') { e.preventDefault(); S.playing ? stop() : start(); return; }
      var p = KEYMAP[(e.key || '').toLowerCase()]; if (p == null || e.repeat || e.ctrlKey || e.metaKey) return; e.preventDefault(); hit(S.bank, p, 0.85, 'key' + p);
    });
    document.addEventListener('keyup', function (e) { var p = KEYMAP[(e.key || '').toLowerCase()]; if (p != null) release('key' + p); });
    window.addEventListener('blur', function () { held = {}; });
  }
  function applySnap(o) { if (!o || !o.pat) return; ['kit', 'bpm', 'swing', 'steps'].forEach(function (k) { if (o[k] != null) S[k] = o[k]; }); BANKS.forEach(function (b) { if (o.pat[b]) S.pat[b] = o.pat[b]; }); save(); setBpm(S.bpm, 'pattern'); renderAll(); }
  function toast(t) { var e = $('#mk3-smpinfo', root); if (e) { e.textContent = t; clearTimeout(e._t); e._t = setTimeout(function () { e.textContent = ''; }, 3500); } }
  function renderAll() { renderTop(); renderBanks(); renderPads(); renderGrid(); }
  function renderTop() {
    if (!root) return; var g = function (s) { return $(s, root); };
    g('#mk3-play').classList.toggle('on', S.playing); g('#mk3-play').textContent = S.playing ? '❚❚ PAUZA' : '▶ PLAY'; g('#mk3-rec').classList.toggle('on', S.rec); g('#mk3-nr').classList.toggle('on', S.nr);
    if (document.activeElement !== g('#mk3-bpmn')) g('#mk3-bpmn').value = S.bpm; g('#mk3-bpm').value = clamp(S.bpm, 79, 140); g('#mk3-sync').checked = S.sync;
    g('#mk3-swing').value = S.swing; g('#mk3-swv').textContent = S.swing + '%'; g('#mk3-steps').value = S.steps; g('#mk3-kit').value = S.kit; g('#mk3-nrdiv').value = S.nrDiv;
    ['filter', 'delay', 'reverb', 'vol'].forEach(function (k) { g('#mk3-' + k).value = S[k]; }); g('#mk3-fullvel').checked = S.fullVel;
    g('#mk3-src').textContent = 'zegar: ' + (S.sync ? lastSyncSrc : 'własny');
    if (!S.playing) g('#mk3-pos').textContent = 'stop';
  }
  function renderBanks() { var e = $('#mk3-banks', root); e.innerHTML = BANKS.map(function (b) { var used = S.pat[b].some(function (r) { return r.some(Boolean); }); return '<button class="mk3-bank' + (b === S.bank ? ' on' : '') + (used ? ' used' : '') + '" data-b="' + b + '" style="--c:' + BANKCOL[b] + '">' + b + '<small>' + BANKNAME[b] + '</small></button>'; }).join(''); $$('.mk3-bank', e).forEach(function (x) { x.onclick = function () { S.bank = x.getAttribute('data-b'); save(); renderAll(); }; }); }
  function renderPads() {
    var e = $('#mk3-pads', root), order = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];
    e.style.setProperty('--c', BANKCOL[S.bank]);
    e.innerHTML = order.map(function (p) { return '<div class="mk3-pad' + (p === S.sel ? ' sel' : '') + (samples[S.bank + p] ? ' smp' : '') + '" data-p="' + p + '"><i>' + S.bank + (p + 1) + '</i><span>' + esc(voiceName(S.bank, p)) + '</span><kbd>' + KEYLBL[p] + '</kbd></div>'; }).join('');
    $$('.mk3-pad', e).forEach(function (el) {
      var p = +el.getAttribute('data-p');
      el.addEventListener('pointerdown', function (ev) { ev.preventDefault(); try { el.setPointerCapture(ev.pointerId); } catch (x) {} var r = el.getBoundingClientRect(), v = ev.pressure && ev.pressure !== 0.5 && ev.pointerType === 'pen' ? ev.pressure : 1 - clamp((ev.clientY - r.top) / r.height, 0, 1) * 0.8; hit(S.bank, p, v, 'ptr' + ev.pointerId); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { el.addEventListener(t, function (ev) { release('ptr' + ev.pointerId); }); });
    });
  }
  function renderGrid() {
    var e = $('#mk3-grid', root); if (!e) return; var P = S.pat[S.bank], h = '';
    for (var p = 15; p >= 0; p--) {
      h += '<div class="mk3-row' + (p === S.sel ? ' sel' : '') + '"><span class="mk3-rn" data-p="' + p + '">' + (p + 1) + ' ' + esc(voiceName(S.bank, p)) + '</span>';
      for (var s = 0; s < S.steps; s++) { var v = P[p][s]; h += '<b class="mk3-cell' + (v ? ' on' : '') + (s % 4 === 0 ? ' q' : '') + '" data-p="' + p + '" data-s="' + s + '"' + (v ? ' style="opacity:' + (0.35 + v / 127 * 0.65).toFixed(2) + '"' : '') + '></b>'; }
      h += '</div>';
    }
    e.innerHTML = h; e.style.setProperty('--c', BANKCOL[S.bank]); e.style.setProperty('--n', S.steps);
    $$('.mk3-cell', e).forEach(function (c) { c.onclick = function (ev) { var p = +c.getAttribute('data-p'), s = +c.getAttribute('data-s'); P[p][s] = P[p][s] ? 0 : (ev.shiftKey ? 60 : 110); S.sel = p; save(); renderGrid(); if (P[p][s]) play(S.bank, p, P[p][s] / 127); var bks = $('#mk3-banks', root); if (bks) renderBanks(); }; });
    $$('.mk3-rn', e).forEach(function (c) { c.onclick = function () { S.sel = +c.getAttribute('data-p'); play(S.bank, S.sel, 0.9); renderGrid(); renderPads(); }; });
    var si = $('.mk3-pad.sel', root); $$('.mk3-pad', root).forEach(function (x) { x.classList.toggle('sel', +x.getAttribute('data-p') === S.sel); });
  }
  function drawScope() {
    var cv = $('#mk3-scope', root); if (!cv) return; var g = cv.getContext('2d'), buf = new Uint8Array(1024), fb = new Uint8Array(512);
    (function fr() {
      requestAnimationFrame(fr); var w = cv.width = cv.clientWidth || 300, h = cv.height; g.fillStyle = 'rgba(5,6,12,.9)'; g.fillRect(0, 0, w, h);
      if (!A) { g.fillStyle = '#556'; g.font = '12px monospace'; g.fillText('analyser MK3 · uderz w pad', 8, h / 2); return; }
      A.analyser.getByteFrequencyData(fb); var bw = w / 64; for (var i = 0; i < 64; i++) { var v = fb[i * 4] / 255; g.fillStyle = 'hsl(' + (300 - i * 3) + ',100%,55%)'; g.fillRect(i * bw, h - v * h, bw - 1, v * h); }
      A.analyser.getByteTimeDomainData(buf); g.strokeStyle = '#00f0ff'; g.lineWidth = 2; g.beginPath(); for (var j = 0; j < buf.length; j++) { var x = j / buf.length * w, y = buf[j] / 255 * h; j ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    })();
  }

  window.D7MK3 = {
    version: 1, banks: BANKS, kits: Object.keys(KITS), mount: mount, start: start, stop: stop, play: play, hit: hit, setBpm: setBpm, setFx: setFx,
    loadPreset: loadPreset, randomize: randomize, midi: midiInit, on: on, audio: audio,
    analyser: function () { return A && A.analyser; },
    setBank: function (b) { if (BANKS.indexOf(b) >= 0) { S.bank = b; renderAll(); } },
    setKit: function (k) { if (KITS[k]) { S.kit = k; save(); renderAll(); } },
    state: function () { return { kit: S.kit, bank: S.bank, sel: S.sel, steps: S.steps, bpm: S.bpm, swing: S.swing, sync: S.sync, clockSrc: lastSyncSrc, playing: S.playing, rec: S.rec, nr: S.nr, step: S.step, bars: S.bars, fx: { filter: S.filter, delay: S.delay, reverb: S.reverb, vol: S.vol }, midi: S.midiStatus, midiOut: M.out ? M.out.name : null, ctx: A ? A.ctx.state : 'none', samples: Object.keys(samples), activeSteps: BANKS.reduce(function (n, b) { return n + S.pat[b].reduce(function (m, r) { return m + r.slice(0, S.steps).filter(Boolean).length; }, 0); }, 0) }; }
  };
})();
