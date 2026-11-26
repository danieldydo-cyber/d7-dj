/* DD DJ 3.0 · Space X Sound Engine — original Web Audio code (DJ DaX / Daniel Dydo).
   Master: bus → 3-band EQ → DJ filter → [dry + sub enhancer + exciter] → glue comp → saturator → limiter (-0.3 dB) → out
   Clock: sample-accurate lookahead scheduler on audioCtx.currentTime (Worker tick, no setInterval timing). */
(function () {
  'use strict';
  var A = { ctx: null, ls: {} };
  A.on = function (e, f) { (A.ls[e] = A.ls[e] || []).push(f); };
  A.emit = function (e, a) { (A.ls[e] || []).forEach(function (f) { try { f(a); } catch (x) { console.error(x); } }); };
  var ctx, noiseBuf, shapers = {};
  function db(x) { return Math.pow(10, x / 20); }
  function clampN(v, lo, hi, d) { v = +v; if (!isFinite(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  A.clampN = clampN;
  function curve(kind, amt) {
    var k = kind + amt; if (shapers[k]) return shapers[k];
    var n = 2048, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1;
      if (kind === 'soft') c[i] = Math.tanh(x * amt) / Math.tanh(amt);
      else if (kind === 'warm') c[i] = (1 + amt) * x / (1 + amt * Math.abs(x));
      else if (kind === 'harm') c[i] = Math.tanh(x * amt + 0.25 * x * x * amt) * 0.8; // even+odd harmonics
      else c[i] = x; }
    return (shapers[k] = c);
  }
  function impulse(sec, decay, damp) {
    var sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; lp += (w - lp) * (damp || .35); d[i] = lp * Math.pow(1 - i / n, decay); } }
    return b;
  }
  A.init = function () {
    if (ctx) { A.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    try { ctx = new AC({ latencyHint: 'interactive', sampleRate: 48000 }); } catch (e) { ctx = new AC(); }
    A.ctx = ctx;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // ---- buses
    A.drumBus = ctx.createGain(); A.drumBus.gain.value = .9;
    A.instBus = ctx.createGain(); A.pump = ctx.createGain(); A.instBus.connect(A.pump);
    A.deckBus = ctx.createGain(); A.padBus = ctx.createGain(); A.padBus.gain.value = .9;
    A.genGain = ctx.createGain(); A.genGain.gain.value = 1; A.drumBus.connect(A.genGain); A.pump.connect(A.genGain);
    A.bus = ctx.createGain(); A.genGain.connect(A.bus); A.deckBus.connect(A.bus); A.padBus.connect(A.bus);
    // ---- master EQ + DJ filter
    A.eqLo = biq('lowshelf', 110); A.eqMid = biq('peaking', 1100, .7); A.eqHi = biq('highshelf', 6500);
    A.lpf = biq('lowpass', 22000, .9); A.hpf = biq('highpass', 18, .9);
    A.bus.connect(A.eqLo); A.eqLo.connect(A.eqMid); A.eqMid.connect(A.eqHi); A.eqHi.connect(A.hpf); A.hpf.connect(A.lpf);
    A.sum = ctx.createGain(); A.lpf.connect(A.sum);
    // sub enhancer: tight 45–80 Hz punch (parallel, harmonics so it translates on phones)
    var sLP = biq('lowpass', 85, .9), sHP = biq('highpass', 38, .7), sSh = ctx.createWaveShaper(); sSh.curve = curve('harm', 2.2); sSh.oversample = '2x';
    var sPost = biq('lowpass', 160, .7); A.subAmt = ctx.createGain(); A.subAmt.gain.value = .32;
    A.lpf.connect(sHP); sHP.connect(sLP); sLP.connect(sSh); sSh.connect(sPost); sPost.connect(A.subAmt); A.subAmt.connect(A.sum);
    // exciter: air + crisp hats
    var xHP = biq('highpass', 3200, .7), xSh = ctx.createWaveShaper(); xSh.curve = curve('soft', 3); A.excAmt = ctx.createGain(); A.excAmt.gain.value = .08;
    A.lpf.connect(xHP); xHP.connect(xSh); xSh.connect(A.excAmt); A.excAmt.connect(A.sum);
    // sends: dub echo (tape/spring style) + reverb + beat repeat
    A.echoIn = ctx.createGain(); A.echo = ctx.createDelay(4); A.echoFb = ctx.createGain(); A.echoFb.gain.value = .5;
    var eLP = biq('lowpass', 2600, .8), eHP = biq('highpass', 260, .6), eSat = ctx.createWaveShaper(); eSat.curve = curve('warm', 1.5);
    A.echoRet = ctx.createGain(); A.echoRet.gain.value = .7;
    A.echoLfo = ctx.createOscillator(); A.echoLfoG = ctx.createGain(); A.echoLfo.frequency.value = .35; A.echoLfoG.gain.value = .0015; A.echoLfo.connect(A.echoLfoG); A.echoLfoG.connect(A.echo.delayTime); A.echoLfo.start(); // tape wow
    A.echoIn.connect(A.echo); A.echo.connect(eLP); eLP.connect(eHP); eHP.connect(eSat); eSat.connect(A.echoFb); A.echoFb.connect(A.echo); eSat.connect(A.echoRet); A.echoRet.connect(A.sum);
    A.revIn = ctx.createGain(); A.rev = ctx.createConvolver(); A.rev.buffer = impulse(3.4, 2.4); A.revRet = ctx.createGain(); A.revRet.gain.value = .55;
    var rHP = biq('highpass', 220, .6); A.revIn.connect(rHP); rHP.connect(A.rev); A.rev.connect(A.revRet); A.revRet.connect(A.sum);
    A.springIn = ctx.createGain(); var spr = ctx.createConvolver(); spr.buffer = impulse(1.6, 3.2, .6); var sprBP = biq('bandpass', 1800, .7); A.springIn.connect(sprBP); sprBP.connect(spr); spr.connect(A.sum);
    A.brIn = ctx.createGain(); A.brIn.gain.value = 0; A.br = ctx.createDelay(2); A.brFb = ctx.createGain(); A.brFb.gain.value = 0; A.brOut = ctx.createGain(); A.brOut.gain.value = 0;
    A.lpf.connect(A.brIn); A.brIn.connect(A.br); A.br.connect(A.brFb); A.brFb.connect(A.br); A.br.connect(A.brOut);
    A.dry = ctx.createGain(); // dry duck for beat repeat
    A.sum.connect(A.dry);
    A.echoThrowG = ctx.createGain(); A.echoThrowG.gain.value = 0; A.instBus.connect(A.echoThrowG); A.echoThrowG.connect(A.echoIn);
    A.revThrowG = ctx.createGain(); A.revThrowG.gain.value = 0; A.instBus.connect(A.revThrowG); A.revThrowG.connect(A.revIn);
    // glue bus compressor → makeup → warm saturator → brickwall limiter → ceiling -0.3 dB
    A.glue = ctx.createDynamicsCompressor(); A.glue.threshold.value = -16; A.glue.knee.value = 8; A.glue.ratio.value = 3.2; A.glue.attack.value = .012; A.glue.release.value = .14;
    A.makeup = ctx.createGain(); A.makeup.gain.value = db(4.5);
    A.sat = ctx.createWaveShaper(); A.sat.curve = curve('soft', 1.6); A.sat.oversample = '4x';
    A.satPre = ctx.createGain(); A.satPre.gain.value = .9; A.satPost = ctx.createGain(); A.satPost.gain.value = 1.0;
    A.limiter = ctx.createDynamicsCompressor(); A.limiter.threshold.value = -2.5; A.limiter.knee.value = 0; A.limiter.ratio.value = 20; A.limiter.attack.value = .001; A.limiter.release.value = .06;
    A.ceiling = ctx.createGain(); A.ceiling.gain.value = db(-0.3);
    A.master = ctx.createGain(); A.master.gain.value = .9;
    A.safety = ctx.createWaveShaper(); A.safety.curve = (function () { var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = Math.max(-0.966, Math.min(0.966, x)); } return c; })(); // hard brickwall at -0.3 dBFS
    A.analyser = ctx.createAnalyser(); A.analyser.fftSize = 2048; A.analyser.smoothingTimeConstant = .6;
    A.recDest = ctx.createMediaStreamDestination();
    A.dry.connect(A.glue); A.brOut.connect(A.glue); A.glue.connect(A.makeup); A.makeup.connect(A.satPre); A.satPre.connect(A.sat); A.sat.connect(A.satPost); A.satPost.connect(A.master);
    A.master.connect(A.limiter); A.limiter.connect(A.ceiling); A.ceiling.connect(A.safety); A.safety.connect(A.analyser);
    A.analyser.connect(ctx.destination); A.analyser.connect(A.recDest);
    A.fd = new Uint8Array(A.analyser.frequencyBinCount); A.td = new Uint8Array(A.analyser.fftSize);
    A.decks = [new Deck(0), new Deck(1)]; A.xfader(0);
    A.loudness(A.settings.punch);
    startClock();
    ctx.onstatechange = function () { A.emit('state', ctx.state); };
    A.emit('ready');
    return ctx;
  };
  function biq(t, f, q) { var b = ctx.createBiquadFilter(); b.type = t; b.frequency.value = f; if (q) b.Q.value = q; return b; }
  A.resume = function () { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') return ctx.resume().catch(function () {}); };
  A.settings = { punch: .65, swing: .12, human: .35, pump: .55 };
  // punch 0..1 → glue/makeup/drive/sub. Tuned so 1.0 is loud but limiter catches peaks.
  A.loudness = function (p) {
    p = clampN(p, 0, 1, .7); A.settings.punch = p; if (!ctx) return; var t = ctx.currentTime;
    A.glue.threshold.setTargetAtTime(-10 - p * 10, t, .05); A.glue.ratio.setTargetAtTime(2 + p * 2.5, t, .05);
    A.makeup.gain.setTargetAtTime(db(1.5 + p * 4.5), t, .05); A.satPre.gain.setTargetAtTime(.65 + p * .55, t, .05); A.satPost.gain.setTargetAtTime(1 / (0.85 + p * .35), t, .05);
    A.subAmt.gain.setTargetAtTime(.15 + p * .35, t, .05); A.excAmt.gain.setTargetAtTime(.04 + p * .08, t, .05);
  };
  A.setEQ = function (band, v) { // v -12..+12 dB (kill at -24)
    v = clampN(v, -26, 12, 0); var n = band === 'lo' ? A.eqLo : band === 'mid' ? A.eqMid : A.eqHi; n.gain.setTargetAtTime(v, ctx.currentTime, .02);
  };
  A.setFilter = function (v) { // -1 LP .. 0 off .. +1 HP
    v = clampN(v, -1, 1, 0); var t = ctx.currentTime;
    if (v < -0.02) { A.lpf.frequency.setTargetAtTime(22000 * Math.pow(60 / 22000, -v), t, .03); A.hpf.frequency.setTargetAtTime(18, t, .03); }
    else if (v > 0.02) { A.hpf.frequency.setTargetAtTime(18 * Math.pow(9000 / 18, v), t, .03); A.lpf.frequency.setTargetAtTime(22000, t, .03); }
    else { A.lpf.frequency.setTargetAtTime(22000, t, .03); A.hpf.frequency.setTargetAtTime(18, t, .03); }
    A.filterVal = v;
  };
  A.sweep = function (from, to, sec, at) { // automated filter sweep (for builds)
    var t0 = at || ctx.currentTime, steps = 24;
    for (var i = 0; i <= steps; i++) (function (i) { var v = from + (to - from) * i / steps; setTimeoutAt(t0 + sec * i / steps, function () { A.setFilter(v); A.emit('filter', v); }); })(i);
  };
  var timed = []; function setTimeoutAt(t, fn) { timed.push({ t: t, fn: fn }); }
  A.at = setTimeoutAt;
  A.setSend = function (which, v) { v = clampN(v, 0, 1, 0); if (which === 'echo') A.echoRet.gain.setTargetAtTime(v * 1.1, ctx.currentTime, .05); else A.revRet.gain.setTargetAtTime(v, ctx.currentTime, .05); };
  A.setEchoBeats = function (b) { A._echoBeats = b; if (ctx) A.echo.delayTime.setTargetAtTime(Math.min(3.9, b * 60 / A.bpm), ctx.currentTime, .08); };
  A.echoThrow = function (sec) { // dub throw: feedback up then decay
    var t = ctx.currentTime; A.echoFb.gain.cancelScheduledValues(t); A.echoFb.gain.setValueAtTime(A.echoFb.gain.value, t); A.echoFb.gain.linearRampToValueAtTime(.82, t + .05); A.echoFb.gain.setTargetAtTime(.5, t + (sec || 2), .6);
    A.genSend('echo', .9, sec || 2);
  };
  A.genSend = function (w, v, sec) { var g = w === 'echo' ? A.echoThrowG : A.revThrowG; if (!g) return; var t = ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(v, t); g.gain.setTargetAtTime(0, t + sec, .4); };
  A.beatRepeat = function (on, frac) { // frac of beat: 1/4, 1/2, 1
    var t = ctx.currentTime, len = (frac || .5) * 60 / A.bpm;
    if (on) { A.br.delayTime.setValueAtTime(len, t); A.brIn.gain.setValueAtTime(1, t); A.brIn.gain.setValueAtTime(0, t + len); A.brFb.gain.setValueAtTime(.97, t); A.brOut.gain.setTargetAtTime(1, t, .005); A.dry.gain.setTargetAtTime(.0, t + len, .01); }
    else { A.brFb.gain.setTargetAtTime(0, t, .02); A.brOut.gain.setTargetAtTime(0, t, .03); A.dry.gain.setTargetAtTime(1, t, .01); A.brIn.gain.setValueAtTime(0, t); }
  };
  A.setMaster = function (v) { A.master.gain.setTargetAtTime(clampN(v, 0, 1.2, .9), ctx.currentTime, .03); };
  A.bands = function () { // bass / mid / high 0..1 + rms
    if (!ctx) return { b: 0, m: 0, h: 0, r: 0 };
    A.analyser.getByteFrequencyData(A.fd); var f = A.fd, bin = ctx.sampleRate / A.analyser.fftSize, s = function (a, b) { var i0 = Math.max(1, Math.floor(a / bin)), i1 = Math.floor(b / bin), t = 0; for (var i = i0; i <= i1; i++) t += f[i]; return t / ((i1 - i0 + 1) * 255); };
    return { b: s(30, 150), m: s(300, 2500), h: s(5000, 14000), r: s(30, 14000) };
  };

  // ================= voices (synthesis) =================
  function env(g, t, a, peak, d, sus) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + d); }
  function noise(t, dur, out, rate) { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = rate || 1; s.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05); return s; }
  function osc(type, f, t, dur, out) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(out); o.start(t); o.stop(t + dur + .05); return o; }
  function gain(v, out) { var g = ctx.createGain(); g.gain.value = v; if (out) g.connect(out); return g; }
  function drive(amt, out) { var w = ctx.createWaveShaper(); w.curve = curve('soft', amt); w.connect(out); return w; }
  var V = A.voice = {};
  // kick with pitch envelope; kit: {f0,f1,pd,dec,click,drv,tone}
  V.kick = function (t, vel, k) {
    k = k || {}; var g = gain(0, A.drumBus), d = drive(k.drv || 1.6, g), o = osc('sine', k.f0 || 160, t, (k.dec || .45) + .1, d);
    o.frequency.exponentialRampToValueAtTime(k.f1 || 48, t + (k.pd || .045));
    if (k.tail) o.frequency.exponentialRampToValueAtTime((k.f1 || 48) * .85, t + k.dec);
    env(g, t, .002, 1.05 * vel, k.dec || .45);
    var cg = gain(0, A.drumBus), ch = biq('highpass', k.tone || 2500, .7); ch.connect(cg); noise(t, .02, ch); env(cg, t, .0005, (k.click == null ? .35 : k.click) * vel, .018);
    A.kickAt(t, vel);
  };
  V.snare = function (t, vel, k) {
    k = k || {}; var g = gain(0, A.drumBus), bp = biq('bandpass', k.sf || 1900, .8); bp.connect(g); noise(t, k.sd || .2, bp); env(g, t, .001, .75 * vel, k.sd || .18);
    var tg = gain(0, A.drumBus); var o = osc('triangle', k.st || 190, t, .12, tg); o.frequency.exponentialRampToValueAtTime((k.st || 190) * .6, t + .08); env(tg, t, .001, .5 * vel, .09);
    if (k.rev) { var s = gain(.25 * vel, A.revIn); bp.connect(s); }
  };
  V.clap = function (t, vel, k) {
    var g = gain(0, A.drumBus), bp = biq('bandpass', (k && k.cf) || 1300, 1.2); bp.connect(g); noise(t, .35, bp);
    g.gain.setValueAtTime(0.0001, t); [0, .011, .022].forEach(function (o) { g.gain.setValueAtTime(.8 * vel, t + o); g.gain.exponentialRampToValueAtTime(.12 * vel, t + o + .009); });
    g.gain.setValueAtTime(.65 * vel, t + .031); g.gain.exponentialRampToValueAtTime(.0001, t + .031 + ((k && k.cd) || .2));
    bp.connect(gain(.18, A.revIn));
  };
  var HATR = [2, 3, 4.16, 5.43, 6.79, 8.21];
  V.hat = function (t, vel, open, k) {
    k = k || {}; var dur = open ? (k.od || .32) : (k.hd || .045), g = gain(0, A.drumBus), hp = biq('highpass', k.hf || 7200, .6); hp.connect(g);
    var bp = biq('bandpass', 10500, .5); bp.connect(hp); noise(t, dur, bp);
    if (k.metal) { var mg = gain(.18, hp); HATR.forEach(function (r) { osc('square', 40 * r * (k.metal || 1), t, dur, mg); }); }
    env(g, t, .0007, (open ? .38 : .32) * vel, dur);
  };
  V.perc = function (t, vel, f, dec, type) { var g = gain(0, A.drumBus), o = osc(type || 'sine', f * 1.5, t, dec, g); o.frequency.exponentialRampToValueAtTime(f, t + .02); env(g, t, .001, .45 * vel, dec); var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; };
  V.rim = function (t, vel) { var g = gain(0, A.drumBus), bp = biq('bandpass', 1700, 6); bp.connect(g); osc('square', 1700, t, .03, bp); noise(t, .02, bp); env(g, t, .0005, .6 * vel, .03); };
  V.shaker = function (t, vel) { var g = gain(0, A.drumBus), hp = biq('highpass', 5500, .7); hp.connect(g); noise(t, .08, hp); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.18 * vel, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + .08); };
  V.tom = function (t, vel, f) { var g = gain(0, A.drumBus), o = osc('sine', f * 1.8, t, .4, g); o.frequency.exponentialRampToValueAtTime(f, t + .06); env(g, t, .001, .55 * vel, .35); };
  // bass
  V.bass = function (t, f, dur, vel, b, slideFrom) {
    b = b || {}; var type = b.type || 'sub', g = gain(0, A.instBus), lp = biq('lowpass', b.cut || 900, b.res || 1), out = lp; lp.connect(g);
    var oscs = [], end = t + dur, a = b.att || .004;
    if (type === 'acid') { // 303-style: saw → resonant LP with accent env → amp env → drive
      lp.disconnect(); var ag = gain(0, null), dv = drive(2, A.instBus); lp.connect(ag); ag.connect(dv); lp.Q.value = b.res || 14;
      var ao = osc('sawtooth', f, t, dur + .15, lp); if (slideFrom) { ao.frequency.setValueAtTime(slideFrom, t); ao.frequency.exponentialRampToValueAtTime(f, t + (b.glide || .06)); }
      var c = b.cut || 400, acc = vel > .9; lp.frequency.setValueAtTime(c * (acc ? 6 : 3.5), t); lp.frequency.exponentialRampToValueAtTime(c, t + (acc ? .18 : .12));
      var apk = (b.gain || .5) * vel * .55; ag.gain.setValueAtTime(.0001, t); ag.gain.linearRampToValueAtTime(apk, t + .003); ag.gain.setValueAtTime(apk, Math.max(t + .004, end - .01)); ag.gain.exponentialRampToValueAtTime(.0001, end + .03);
      return; }
    function mk(tp, mul, det) { var o = osc(tp, f * mul, t, dur + (b.rel || .08) + .1, lp); if (det) o.detune.value = det; if (slideFrom) { o.frequency.setValueAtTime(slideFrom * mul, t); o.frequency.exponentialRampToValueAtTime(f * mul, t + (b.glide || .06)); } oscs.push(o); return o; }
    if (type === 'sub') { mk('sine', 1); mk('triangle', 2).detune.value = 3; lp.frequency.value = 400; }
    else if (type === '808') { var sh = drive(2.4, lp); lp.disconnect(); lp.connect(g); var o = osc('sine', f, t, dur + .3, sh); oscs.push(o); if (slideFrom) { o.frequency.setValueAtTime(slideFrom, t); o.frequency.exponentialRampToValueAtTime(f, t + (b.glide || .12)); } else { o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + .03); } lp.frequency.value = 2200; }
    else if (type === 'reese') { mk('sawtooth', 1, -14); mk('sawtooth', 1, 14); mk('sine', .5); lp.frequency.setValueAtTime(b.cut || 600, t); var l = ctx.createOscillator(), lg = gain(250, lp.frequency); l.frequency.value = .4; l.connect(lg); l.start(t); l.stop(end + .2); }
    else if (type === 'wobble') { mk('sawtooth', 1, -6); mk('square', 1, 6); mk('sine', .5); lp.Q.value = 6; lp.frequency.value = 300; var w = ctx.createOscillator(), wg = gain(1400, lp.frequency); w.type = 'sine'; w.frequency.value = (b.wob || 2) * A.bpm / 60 / 2; w.connect(wg); w.start(t); w.stop(end + .2); }
    else if (type === 'growl') { var car = mk('sawtooth', 1), mod = ctx.createOscillator(), mg = gain(f * 3, car.frequency); mod.frequency.value = f * 1.5; mod.connect(mg); mod.start(t); mod.stop(end + .2); lp.Q.value = 8; lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(2400, t + dur * .5); lp.frequency.linearRampToValueAtTime(400, end); }
    else if (type === 'slap') { mk('square', 1); mk('sawtooth', 2); lp.Q.value = 4; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + .1); }
    else if (type === 'dub') { mk('sine', 1); mk('sine', 2).detune.value = -2; lp.frequency.value = 280; a = .012; }
    else { mk('square', 1); lp.frequency.value = b.cut || 700; }
    var pk = (b.gain || .55) * vel;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setValueAtTime(pk, Math.max(t + a + .001, end - .01)); g.gain.exponentialRampToValueAtTime(.0001, Math.max(t + a + .002, end) + (b.rel || .08));
  };
  // leads / chords
  V.tone = function (t, f, dur, vel, s) {
    s = s || {}; var type = s.type || 'pluck', g = gain(0, A.instBus), lp = biq('lowpass', s.cut || 3000, s.res || .8); lp.connect(g);
    var a = s.att || .005, rel = s.rel || .15, end = t + dur, pk = (s.gain || .18) * vel;
    if (s.echo) lp.connect(gain(s.echo, A.echoIn)); if (s.rev) lp.connect(gain(s.rev, A.revIn)); if (s.spring) lp.connect(gain(s.spring, A.springIn));
    function o(tp, mul, det) { var x = osc(tp, f * mul, t, dur + rel + .1, lp); if (det) x.detune.value = det; return x; }
    if (type === 'supersaw') { [-24, -11, 0, 11, 24].forEach(function (d) { o('sawtooth', 1, d); }); o('sawtooth', .5, 5); pk *= .55; }
    else if (type === 'pluck') { o('sawtooth', 1, -6); o('square', 1, 6); lp.frequency.setValueAtTime((s.cut || 3000) * 2, t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, (s.cut || 3000) * .25), t + .18); }
    else if (type === 'fmbell' || type === 'fm') { var c = o('sine', 1), m = ctx.createOscillator(), mg = gain(f * (s.idx || 4), c.frequency); m.frequency.value = f * (s.ratio || 3.5); m.connect(mg); m.start(t); m.stop(end + rel + .1); mg.gain.setValueAtTime(f * (s.idx || 4), t); mg.gain.exponentialRampToValueAtTime(f * .2, t + .4); }
    else if (type === 'pad') { o('sawtooth', 1, -8); o('sawtooth', 1, 8); o('triangle', 2, 0); a = s.att || .35; rel = s.rel || .8; pk *= .6; }
    else if (type === 'skank') { o('square', 1, -4); o('sawtooth', 1, 4); var bp = biq('bandpass', 1400, 1.4); lp.disconnect(); lp.connect(bp); bp.connect(g); if (s.echo) bp.connect(gain(s.echo, A.echoIn)); if (s.spring) bp.connect(gain(s.spring, A.springIn)); dur = Math.min(dur, .09); end = t + dur; rel = .05; }
    else if (type === 'organ') { o('sine', 1); o('sine', 2); o('sine', 3).detune.value = 2; o('sine', 4); pk *= .5; }
    else if (type === 'acidlead') { o('sawtooth', 1); lp.Q.value = 10; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(400, t + .2); }
    else if (type === 'stab') { o('sawtooth', 1, -10); o('sawtooth', 1, 10); o('square', .5); lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(600, t + .15); dur = Math.min(dur, .2); end = t + dur; }
    else if (type === 'retro') { o('square', 1, -5); o('sawtooth', 1, 5); }
    else o('triangle', 1);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setTargetAtTime(pk * (s.sus == null ? .6 : s.sus), t + a, .12);
    g.gain.setValueAtTime(pk * (s.sus == null ? .6 : s.sus) + .0001, Math.max(t + a + .01, end)); g.gain.exponentialRampToValueAtTime(.0001, Math.max(t + a + .02, end) + rel);
  };
  // honest formant voice synthesis (no real singing)
  var VOW = { a: [800, 1150, 2900], e: [400, 1600, 2700], i: [300, 2200, 3000], o: [450, 800, 2830], u: [325, 700, 2530] };
  V.voice = function (t, f, dur, vel, v) {
    v = v || {}; var type = v.type || 'choir', vow = VOW[v.vowel || 'a'], g = gain(0, A.instBus), src = gain(1);
    var end = t + dur, pk = (v.gain || .5) * vel, a = v.att || .03;
    if (type === 'whisper' || type === 'crowd') noise(t, dur + .3, src, type === 'crowd' ? .6 : 1);
    else { var dets = type === 'choir' ? [-12, -4, 4, 12] : [0]; dets.forEach(function (d) { var o = osc(type === 'robot' ? 'square' : 'sawtooth', f, t, dur + .4, src); o.detune.value = d;
      if (type === 'chant' || type === 'choir') { var vb = ctx.createOscillator(), vg = gain(f * .012, o.frequency); vb.frequency.value = 5.2; vb.connect(vg); vb.start(t); vb.stop(end + .4); }
      if (v.glide) { o.frequency.setValueAtTime(f * v.glide, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); } }); }
    vow.forEach(function (fr, i) { var bp = biq('bandpass', fr * (v.shift || 1), type === 'whisper' ? 12 : 9); src.connect(bp); bp.connect(gain([1, .5, .25][i], g));
      if (type === 'talkbox' && v.vowel2) { var f2 = VOW[v.vowel2][i] * (v.shift || 1); bp.frequency.setValueAtTime(fr, t); bp.frequency.linearRampToValueAtTime(f2, t + dur * .6); } });
    if (v.echo) g.connect(gain(v.echo, A.echoIn)); if (v.rev) g.connect(gain(v.rev, A.revIn));
    if (type === 'chop' || type === 'crowd') { a = .005; }
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setValueAtTime(pk, Math.max(t + a, end - .02)); g.gain.exponentialRampToValueAtTime(.0001, end + (v.rel || .12));
  };
  // FX
  V.riser = function (t, dur, vel) { var g = gain(0, A.instBus), bp = biq('bandpass', 400, 3); bp.connect(g); noise(t, dur, bp); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35 * (vel || 1), t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .03); bp.connect(gain(.3, A.revIn)); };
  V.down = function (t, dur) { var g = gain(0, A.instBus), o = osc('sawtooth', 800, t, dur, g); o.frequency.exponentialRampToValueAtTime(40, t + dur); env(g, t, .01, .12, dur); };
  V.impact = function (t, vel) { var g = gain(0, A.drumBus), o = osc('sine', 90, t, 1.6, g); o.frequency.exponentialRampToValueAtTime(30, t + 1.4); env(g, t, .002, .9 * (vel || 1), 1.5); var ng = gain(0, A.revIn); noise(t, .5, ng); env(ng, t, .001, .5, .5); };
  V.siren = function (t, dur) { var g = gain(0, A.instBus), o = osc('square', 600, t, dur, biq('lowpass', 2500)); var lp = o; var lfo = ctx.createOscillator(), lg = gain(350, o.frequency); lfo.frequency.value = 4; lfo.connect(lg); lfo.start(t); lfo.stop(t + dur + .1); o.disconnect(); o.connect(g); g.connect(gain(.5, A.echoIn)); env(g, t, .02, .14, dur); };
  V.laser = function (t) { var g = gain(0, A.instBus), o = osc('sawtooth', 3000, t, .4, g); o.frequency.exponentialRampToValueAtTime(80, t + .35); env(g, t, .001, .2, .35); g.connect(gain(.4, A.echoIn)); };
  V.horn = function (t) { var g = gain(0, A.instBus), lp = biq('lowpass', 2400, 2); lp.connect(g); [1, 1.26, 1.5].forEach(function (m) { var o = osc('sawtooth', 466 * m, t, .9, lp); o.frequency.setValueAtTime(466 * m * .8, t); o.frequency.linearRampToValueAtTime(466 * m, t + .06); }); g.gain.setValueAtTime(.0001, t); [0, .18, .36].forEach(function (o) { g.gain.setValueAtTime(.22, t + o); g.gain.setValueAtTime(.0001, t + o + .15); }); g.gain.setValueAtTime(.22, t + .54); g.gain.exponentialRampToValueAtTime(.0001, t + 1.2); lp.connect(gain(.3, A.echoIn)); };

  // sidechain pump (ducks instruments on each kick) + kick event queue for visuals
  A.kicks = [];
  A.kickAt = function (t, vel) {
    var d = A.settings.pump * .75 * vel, bl = 60 / A.bpm; if (d > .01) { A.pump.gain.setValueAtTime(Math.max(.05, 1 - d), t); A.pump.gain.setTargetAtTime(1, t + .012, bl * .16); }
    A.kicks.push(t); if (A.kicks.length > 64) A.kicks.shift();
  };

  // ================= clock / lookahead scheduler =================
  A.bpm = 128; A.playing = false; A.step = 0; A.nextT = 0; A.LOOK = .14;
  A.stepDur = function () { return 60 / A.bpm / 4; };
  A.setBpm = function (b) { A.bpm = clampN(b, 50, 200, 128); if (ctx && A._echoBeats) A.setEchoBeats(A._echoBeats); A.emit('bpm', A.bpm); };
  A.glideBpm = function (to, bars) { A._glide = { from: A.bpm, to: clampN(to, 50, 200, A.bpm), steps: Math.max(1, (bars || 8) * 16), n: 0 }; };
  var taps = []; A.tap = function () { var t = performance.now(); if (taps.length && t - taps[taps.length - 1] > 2000) taps = []; taps.push(t); if (taps.length > 8) taps.shift(); if (taps.length >= 3) { var d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); A.setBpm(Math.round(60000 / d * 10) / 10); } return A.bpm; };
  A.start = function () { A.init(); A.resume(); if (A.playing) return; A.playing = true; A.step = 0; A.nextT = ctx.currentTime + .08; A.emit('play', true); };
  A.stop = function () { A.playing = false; A.emit('play', false); };
  A.seq = null; // function(step, time, stepDur) set by generator
  var worker = null, lastBeat = -1;
  function startClock() {
    var tick = function () { try { pump(); } catch (e) { console.error(e); A.emit('error', e); } };
    try { var src = 'var iv=null;onmessage=function(e){if(e.data==="go"){clearInterval(iv);iv=setInterval(function(){postMessage(0)},20)}};';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); worker.onmessage = tick; worker.postMessage('go'); }
    catch (e) { setInterval(tick, 20); }
    A._fallback = setInterval(function () { if (performance.now() - (A._lastPump || 0) > 250) tick(); }, 250); // safety if worker stalls
  }
  function pump() {
    A._lastPump = performance.now(); var now = ctx.currentTime;
    for (var i = timed.length - 1; i >= 0; i--) if (timed[i].t <= now) { var f = timed[i].fn; timed.splice(i, 1); try { f(); } catch (e) { console.error(e); } }
    if (A.playing) {
      if (A.nextT < now - .25) A.nextT = now + .02; // recovered from suspend: no burst
      while (A.nextT < now + A.LOOK) {
        if (A._glide) { var G = A._glide; G.n++; A.bpm = G.from + (G.to - G.from) * Math.min(1, G.n / G.steps); if (G.n >= G.steps) { A._glide = null; A.setBpm(G.to); } }
        var sd = A.stepDur();
        if (A.seq) try { A.seq(A.step, A.nextT, sd); } catch (e) { console.error(e); A.emit('error', e); }
        if (A.step % 4 === 0) { var bt = A.nextT, bn = A.step / 4; A.at(bt, function () { A.emit('beat', bn); }); }
        A.nextT += sd; A.step++;
      }
    }
    A.decks && A.decks.forEach(function (d) { d.tick(); });
    A.emit('tick', now);
  }

  // ================= decks (uploaded tracks) =================
  function Deck(i) { this.i = i; this.out = gain(.9, A.deckBus); this.x = gain(1, this.out); this.buf = null; this.src = null; this.rate = 1; this.off = 0; this.t0 = 0; this.playing = false; this.name = ''; }
  Deck.prototype.load = function (file) {
    var self = this; A.init();
    return file.arrayBuffer().then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); })
      .then(function (b) { self.stop(); self.buf = b; self.off = 0; self.name = file.name.replace(/\.[^.]+$/, ''); A.emit('deck', self); return self; });
  };
  Deck.prototype.play = function () { if (!this.buf || this.playing) return; A.resume(); var s = ctx.createBufferSource(); s.buffer = this.buf; s.playbackRate.value = this.rate; s.connect(this.x); s.start(0, this.off % this.buf.duration); this.src = s; this.t0 = ctx.currentTime; this.playing = true; var self = this; s.onended = function () { if (self.src === s && self.playing) { self.playing = false; self.off = 0; A.emit('deck', self); } }; A.emit('deck', this); };
  Deck.prototype.pause = function () { if (!this.playing) return; this.off = this.pos(); try { this.src.stop(); } catch (e) {} this.src = null; this.playing = false; A.emit('deck', this); };
  Deck.prototype.stop = function () { if (this.src) try { this.src.stop(); } catch (e) {} this.src = null; this.playing = false; this.off = 0; A.emit('deck', this); };
  Deck.prototype.toggle = function () { this.playing ? this.pause() : this.play(); };
  Deck.prototype.pos = function () { return this.playing ? this.off + (ctx.currentTime - this.t0) * this.rate : this.off; };
  Deck.prototype.setRate = function (r) { var p = this.pos(); this.rate = clampN(r, .5, 1.5, 1); if (this.playing) { this.off = p; this.t0 = ctx.currentTime; this.src.playbackRate.setTargetAtTime(this.rate, ctx.currentTime, .02); } };
  Deck.prototype.tick = function () {};
  A.xfader = function (v) { v = clampN(v, -1, 1, 0); A.xf = v; var x = (v + 1) / 2; if (!A.decks) return; A.decks[0].x.gain.setTargetAtTime(Math.cos(x * Math.PI / 2), ctx.currentTime, .01); A.decks[1].x.gain.setTargetAtTime(Math.sin(x * Math.PI / 2), ctx.currentTime, .01); };

  // ================= sample pads =================
  A.pads = [];
  A.loadSample = function (url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); }); };
  A.playBuf = function (buf, t, vol, out) { var s = ctx.createBufferSource(), g = gain(vol == null ? 1 : vol, out || A.padBus); s.buffer = buf; s.connect(g); s.start(t || 0); s._g = g; return s; };
  A.nextBeatTime = function () { if (!A.playing) return ctx.currentTime; var sd = A.stepDur(), rem = (4 - A.step % 4) % 4; return A.nextT + rem * sd; };

  window.DDA = A;
})();
