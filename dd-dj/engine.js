/* DD DJ 3.0.2 · Space X Sound Engine Club Pro — original Web Audio code (DJ DaX / Daniel Dydo).
   Buses: kick → warm sat │ top (hats/snare/perc, HPF 140) │ bass → warm sat → sidechain duck │ synth (HPF 170, mud cut) → duck │ fx/vox (HPF 220) → duck
   Club: engine/track blend (equal-power) → LR4 isolator (220 Hz / 2.6 kHz, kills) → Color FX → master
   Master: sum → 3-band EQ → DJ LP/HP → [dry + sub enhancer + air] → glue comp → warm saturator → limiter → ceiling −0.5 dB
   Clock: Web Worker heartbeat + 0.25 s lookahead on audioCtx.currentTime. Voices: tracked, auto-disconnected on end, budgeted. */
(function () {
  'use strict';
  var A = { ctx: null, ls: {}, version: '3.0.2', _bands: { b: 0, m: 0, h: 0, r: 0 } };
  A.on = function (e, f) { (A.ls[e] = A.ls[e] || []).push(f); };
  A.emit = function (e, a) { var l = A.ls[e]; if (!l) return; for (var i = 0; i < l.length; i++) { try { l[i](a); } catch (x) { console.error(x); } } };
  var ctx, noiseBuf, hatBuf, shapers = {};
  A.mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  A.CAP = A.mobile ? 56 : 120; // max simultaneously sounding voices
  A.active = 0; A.peakVoices = 0; A.dropped = 0;
  A.stats = { pumps: 0, maxGap: 0, late: 0, worker: false };
  function db(x) { return Math.pow(10, x / 20); }
  function clampN(v, lo, hi, d) { v = +v; if (!isFinite(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  A.clampN = clampN; A.db = db;
  function curve(kind, amt) {
    var k = kind + amt; if (shapers[k]) return shapers[k];
    var n = 4096, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1;
      if (kind === 'soft') c[i] = Math.tanh(x * amt) / Math.tanh(amt);
      else if (kind === 'warm') { var y = x * amt; c[i] = (y / (1 + Math.abs(y))) * (1 + 1 / amt) * .5 + Math.tanh(y) * .5; c[i] /= ((amt / (1 + amt)) * (1 + 1 / amt) * .5 + Math.tanh(amt) * .5); }
      else if (kind === 'harm') c[i] = Math.tanh(x * amt + 0.2 * x * x * amt) * 0.8;
      else c[i] = x; }
    return (shapers[k] = c);
  }
  function impulse(sec, decay, damp) {
    var sr = ctx.sampleRate, n = Math.floor(sr * sec), b = ctx.createBuffer(2, n, sr);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; lp += (w - lp) * (damp || .35); d[i] = lp * Math.pow(1 - i / n, decay); } }
    return b;
  }
  function biq(t, f, q) { var b = ctx.createBiquadFilter(); b.type = t; b.frequency.value = f; if (q) b.Q.value = q; if (VN) VN.n.push(b); return b; }
  function G(v, out) { var g = ctx.createGain(); g.gain.value = v; if (out) g.connect(out); if (VN) VN.n.push(g); return g; }
  function shaper(c, os) { var w = ctx.createWaveShaper(); w.curve = c; if (os) w.oversample = os; return w; }
  A.init = function () {
    if (ctx) { A.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    try { ctx = new AC({ latencyHint: 'playback', sampleRate: 48000 }); } catch (e) { try { ctx = new AC({ latencyHint: 'playback' }); } catch (e2) { ctx = new AC(); } }
    A.ctx = ctx;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iOS 17+: play even with the silent switch on
    var sr = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, sr * 2, sr); var nd = noiseBuf.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // pre-rendered metallic hat texture (6 square partials + noise) → 1 buffer source per hat instead of 6 oscillators
    hatBuf = ctx.createBuffer(1, sr, sr); var hd = hatBuf.getChannelData(0), fr = [263, 400, 421, 531, 588, 832];
    for (var j = 0; j < hd.length; j++) { var t = j / sr, s = 0; for (var q = 0; q < 6; q++) s += (Math.sin(2 * Math.PI * fr[q] * 2.6 * t) > 0 ? 1 : -1); hd[j] = s * .09 + (Math.random() * 2 - 1) * .5; }
    // ---- source buses (clean gain staging)
    A.genGain = ctx.createGain(); A.genLevel = 1;
    A.kickBus = ctx.createGain(); A.kickBus.gain.value = .95; A.kickPre = ctx.createGain(); A.kickPre.gain.value = 1.2;
    A.kickSat = shaper(curve('warm', 1.6), '2x'); A.kickPost = ctx.createGain(); A.kickPost.gain.value = .85;
    A.kickBus.connect(A.kickPre); A.kickPre.connect(A.kickSat); A.kickSat.connect(A.kickPost); A.kickPost.connect(A.genGain);
    A.drumBus = A.kickBus; // compat
    A.topBus = ctx.createGain(); A.topBus.gain.value = .72; A.topHP = biq('highpass', 140, .7); A.topBus.connect(A.topHP); A.topHP.connect(A.genGain);
    A.hatL = ctx.createGain(); A.hatR = ctx.createGain();
    if (ctx.createStereoPanner) { var pl = ctx.createStereoPanner(), pr = ctx.createStereoPanner(); pl.pan.value = -.28; pr.pan.value = .28; A.hatL.connect(pl); pl.connect(A.topBus); A.hatR.connect(pr); pr.connect(A.topBus); } else { A.hatL.connect(A.topBus); A.hatR.connect(A.topBus); }
    A.bassBus = ctx.createGain(); A.bassBus.gain.value = .8; A.bassPre = ctx.createGain(); A.bassPre.gain.value = 1.3;
    A.bassSat = shaper(curve('warm', 1.8), '2x'); A.bassLP = biq('lowpass', 7000, .5); A.bassDuck = ctx.createGain();
    A.bassBus.connect(A.bassPre); A.bassPre.connect(A.bassSat); A.bassSat.connect(A.bassLP); A.bassLP.connect(A.bassDuck); A.bassDuck.connect(A.genGain);
    A.synthBus = ctx.createGain(); A.synthBus.gain.value = .62; A.synthHP = biq('highpass', 170, .7); A.synthMud = biq('peaking', 340, 1); A.synthMud.gain.value = -3; A.synthDuck = ctx.createGain();
    A.synthBus.connect(A.synthHP); A.synthHP.connect(A.synthMud); A.synthMud.connect(A.synthDuck); A.synthDuck.connect(A.genGain);
    A.fxBus = ctx.createGain(); A.fxBus.gain.value = .62; A.fxHP = biq('highpass', 220, .7); A.fxDuck = ctx.createGain();
    A.fxBus.connect(A.fxHP); A.fxHP.connect(A.fxDuck); A.fxDuck.connect(A.genGain);
    A.instBus = A.synthBus; A.pump = A.synthDuck; // compat
    A.deckBus = ctx.createGain(); A.padBus = ctx.createGain(); A.padBus.gain.value = .85;
    A.bus = ctx.createGain(); A.genXf = ctx.createGain(); A.trkXf = ctx.createGain();
    A.genGain.connect(A.genXf); A.genXf.connect(A.bus); A.deckBus.connect(A.trkXf); A.padBus.connect(A.trkXf); A.trkXf.connect(A.bus);
    // ---- Club isolator: Linkwitz-Riley crossovers 220 Hz / 2.6 kHz + allpass compensation → bands sum flat; each band 0 (kill) … +6 dB
    function lr4(t, f) { var a = biq(t, f, -3.0103), b = biq(t, f, -3.0103); /* Web Audio LP/HP Q is in dB: −3.01 dB = Butterworth .7071 */ a.connect(b); return [a, b]; }
    // LR8 (48 dB/oct = Butterworth-4 squared, Q .5412 / 1.3066) → kills are deep; LP+HP sums to an allpass, low band gets the matching 2.6 kHz allpass pair
    function lr8(t, f) { var n = [biq(t, f, -5.333), biq(t, f, 2.322), biq(t, f, -5.333), biq(t, f, 2.322)]; n[0].connect(n[1]); n[1].connect(n[2]); n[2].connect(n[3]); return [n[0], n[3]]; }
    var iL = lr8('lowpass', 220), iH = lr8('highpass', 220), iM = lr8('lowpass', 2600), iT = lr8('highpass', 2600), iAP = biq('allpass', 2600, .5412), iAP2 = biq('allpass', 2600, 1.3066); iAP.connect(iAP2);
    A.isoLo = ctx.createGain(); A.isoMid = ctx.createGain(); A.isoHi = ctx.createGain(); A.isoSum = ctx.createGain();
    A.bus.connect(iL[0]); iL[1].connect(iAP); iAP2.connect(A.isoLo); A.bus.connect(iH[0]); iH[1].connect(iM[0]); iH[1].connect(iT[0]); iM[1].connect(A.isoMid); iT[1].connect(A.isoHi);
    A.isoLo.connect(A.isoSum); A.isoMid.connect(A.isoSum); A.isoHi.connect(A.isoSum);
    // ---- Club Color FX: bipolar resonant HPF/LPF + colour layer (noise / space / crush / dub echo)
    A.cfHP = biq('highpass', 20, .7); A.cfLP = biq('lowpass', 22000, .7); A.cfDry = ctx.createGain(); A.cfOut = ctx.createGain();
    A.isoSum.connect(A.cfHP); A.cfHP.connect(A.cfLP); A.cfLP.connect(A.cfDry); A.cfDry.connect(A.cfOut);
    A.crushSh = shaper((function () { var n = 4096, c = new Float32Array(n), st = 10; for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = Math.round(x * st) / st; } return c; })()); A.crushLP = biq('lowpass', 5200, .6);
    A.crushWet = ctx.createGain(); A.crushWet.gain.value = 0; A.cfLP.connect(A.crushSh); A.crushSh.connect(A.crushLP); A.crushLP.connect(A.crushWet); A.crushWet.connect(A.cfOut);
    A.cfNoise = ctx.createBufferSource(); A.cfNoise.buffer = noiseBuf; A.cfNoise.loop = true; A.cfNoiseBP = biq('bandpass', 2000, 1.2); A.cfNoiseG = ctx.createGain(); A.cfNoiseG.gain.value = 0;
    A.cfNoise.connect(A.cfNoiseBP); A.cfNoiseBP.connect(A.cfNoiseG); A.cfNoiseG.connect(A.cfOut); A.cfNoise.start();
    A.cfRev = ctx.createGain(); A.cfRev.gain.value = 0; A.cfEcho = ctx.createGain(); A.cfEcho.gain.value = 0; A.cfLP.connect(A.cfRev); A.cfLP.connect(A.cfEcho);
    // ---- master EQ + DJ filter
    A.eqLo = biq('lowshelf', 110); A.eqMid = biq('peaking', 1100, .7); A.eqHi = biq('highshelf', 6500);
    A.lpf = biq('lowpass', 22000, .8); A.hpf = biq('highpass', 20, .8);
    A.cfOut.connect(A.eqLo); A.eqLo.connect(A.eqMid); A.eqMid.connect(A.eqHi); A.eqHi.connect(A.hpf); A.hpf.connect(A.lpf);
    A.sum = ctx.createGain(); A.lpf.connect(A.sum);
    // sub enhancer (parallel harmonics of 45–85 Hz so phones "hear" the sub) + air
    var sHP = biq('highpass', 40, .7), sLP = biq('lowpass', 85, .8), sSh = shaper(curve('harm', 2), '2x'), sPost = biq('bandpass', 150, .6);
    A.subAmt = ctx.createGain(); A.subAmt.gain.value = .18;
    A.lpf.connect(sHP); sHP.connect(sLP); sLP.connect(sSh); sSh.connect(sPost); sPost.connect(A.subAmt); A.subAmt.connect(A.sum);
    var xHP = biq('highshelf', 9000); xHP.gain.value = 0; var xh = biq('highpass', 6000, .6); A.excAmt = ctx.createGain(); A.excAmt.gain.value = .05; A.lpf.connect(xh); xh.connect(A.excAmt); A.excAmt.connect(A.sum);
    // ---- sends: dub echo (tape wow + warm sat), spring, reverb, beat repeat
    A.echoIn = ctx.createGain(); A.echo = ctx.createDelay(4); A.echoFb = ctx.createGain(); A.echoFb.gain.value = .48;
    var eLP = biq('lowpass', 2800, .7), eHP = biq('highpass', 280, .6), eSat = shaper(curve('warm', 1.4));
    A.echoRet = ctx.createGain(); A.echoRet.gain.value = .6;
    A.echoLfo = ctx.createOscillator(); A.echoLfoG = ctx.createGain(); A.echoLfo.frequency.value = .33; A.echoLfoG.gain.value = .0012; A.echoLfo.connect(A.echoLfoG); A.echoLfoG.connect(A.echo.delayTime); A.echoLfo.start();
    A.echoIn.connect(A.echo); A.echo.connect(eLP); eLP.connect(eHP); eHP.connect(eSat); eSat.connect(A.echoFb); A.echoFb.connect(A.echo); eSat.connect(A.echoRet); A.echoRet.connect(A.sum);
    A.revIn = ctx.createGain(); A.rev = ctx.createConvolver(); A.rev.buffer = impulse(3, 2.6); A.revRet = ctx.createGain(); A.revRet.gain.value = .45;
    var rHP = biq('highpass', 260, .6); A.revIn.connect(rHP); rHP.connect(A.rev); A.rev.connect(A.revRet); A.revRet.connect(A.sum);
    A.springIn = ctx.createGain(); var spr = ctx.createConvolver(); spr.buffer = impulse(1.4, 3.2, .6); var sprBP = biq('bandpass', 1800, .7), sprG = ctx.createGain(); sprG.gain.value = .6; A.springIn.connect(sprBP); sprBP.connect(spr); spr.connect(sprG); sprG.connect(A.sum);
    A.echoThrowG = ctx.createGain(); A.echoThrowG.gain.value = 0; A.revThrowG = ctx.createGain(); A.revThrowG.gain.value = 0;
    [A.topHP, A.synthDuck, A.fxDuck].forEach(function (n) { n.connect(A.echoThrowG); n.connect(A.revThrowG); });
    A.echoThrowG.connect(A.echoIn); A.revThrowG.connect(A.revIn); A.cfRev.connect(A.revIn); A.cfEcho.connect(A.echoIn);
    A.dry = ctx.createGain(); A.sum.connect(A.dry);
    // ---- master: glue → makeup → warm saturator → limiter → ceiling −0.5 dB → safety
    A.glue = ctx.createDynamicsCompressor(); A.glue.threshold.value = -14; A.glue.knee.value = 10; A.glue.ratio.value = 2.5; A.glue.attack.value = .015; A.glue.release.value = .16;
    A.makeup = ctx.createGain();
    A.satPre = ctx.createGain(); A.sat = shaper(curve('warm', 1.25), '4x'); A.satPost = ctx.createGain();
    A.master = ctx.createGain(); A.master.gain.value = .9;
    A.limiter = ctx.createDynamicsCompressor(); A.limiter.threshold.value = -4; A.limiter.knee.value = 1; A.limiter.ratio.value = 20; A.limiter.attack.value = .001; A.limiter.release.value = .09;
    A.ceiling = ctx.createGain(); A.ceiling.gain.value = db(-0.5) / db(-1.2);
    A.safety = shaper((function () { var n = 2048, c = new Float32Array(n), L = db(-0.5); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1, ax = Math.abs(x), k = .85 * L; c[i] = ax < k ? x : Math.sign(x) * (k + (L - k) * Math.tanh((ax - k) / (L - k))); } return c; })());
    A.analyser = ctx.createAnalyser(); A.analyser.fftSize = 2048; A.analyser.smoothingTimeConstant = .6;
    A.recDest = ctx.createMediaStreamDestination();
    // mono sub < 110 Hz (LR4, summed to mono) + M/S stereo width on everything above
    A.msIn = ctx.createGain(); A.dry.connect(A.msIn);
    var mL = lr4('lowpass', 110), mH = lr4('highpass', 110); A.monoSub = ctx.createGain(); A.monoSub.channelCount = 1; A.monoSub.channelCountMode = 'explicit'; A.monoSub.channelInterpretation = 'speakers';
    A.msIn.connect(mL[0]); mL[1].connect(A.monoSub); A.monoSub.connect(A.glue); A.msIn.connect(mH[0]);
    var spl = ctx.createChannelSplitter(2), mrg = ctx.createChannelMerger(2); A.wLL = ctx.createGain(); A.wLR = ctx.createGain(); A.wRL = ctx.createGain(); A.wRR = ctx.createGain();
    mH[1].connect(spl); spl.connect(A.wLL, 0); spl.connect(A.wRL, 0); spl.connect(A.wLR, 1); spl.connect(A.wRR, 1);
    A.wLL.connect(mrg, 0, 0); A.wLR.connect(mrg, 0, 0); A.wRL.connect(mrg, 0, 1); A.wRR.connect(mrg, 0, 1); mrg.connect(A.glue); A.glue.connect(A.makeup); A.makeup.connect(A.satPre); A.satPre.connect(A.sat); A.sat.connect(A.satPost); A.satPost.connect(A.master);
    A.master.connect(A.limiter); A.limiter.connect(A.ceiling); A.ceiling.connect(A.safety); A.safety.connect(A.analyser);
    A.analyser.connect(ctx.destination); A.analyser.connect(A.recDest);
    A.fd = new Uint8Array(A.analyser.frequencyBinCount);
    A.decks = [new Deck(0), new Deck(1)]; A.xfader(0); A.blend(A.blendVal || 0); A.setWidth(A.width); A.setIso('lo', 0); A.setIso('mid', 0); A.setIso('hi', 0);
    A.loudness(A.settings.punch);
    startClock();
    ctx.onstatechange = function () { A.emit('state', ctx.state); A.emit('audiostate', ctx.state); if (ctx.state !== 'running' && ctx.state !== 'closed' && !document.hidden && A.want) setTimeout(A.resume, 250); };
    setInterval(function () { if (!ctx || ctx.state === 'closed') return; if (ctx.state !== 'running' && !document.hidden && A.want) { A.stats.recover = (A.stats.recover || 0) + 1; A.resume(); } }, 1000); // auto-recovery (interruptions, BT switch, focus loss)
    A.emit('ready');
    return ctx;
  };
  A.want = false; // user has asked for audio at least once
  A.resume = function () { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') return ctx.resume().then(function () { A.emit('audiostate', ctx.state); }).catch(function (e) { A.emit('audiostate', ctx.state); A.emit('audioerr', e && e.message || String(e)); }); };
  // gesture unlock: resume + 1-sample silent buffer (iOS Safari / Android WebView need a sound started inside the gesture)
  A.unlock = function () { A.want = true; if (!ctx) return; try { var b = ctx.createBuffer(1, 1, ctx.sampleRate), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); s.onended = function () { try { s.disconnect(); } catch (e) {} }; } catch (e) {} return A.resume(); };
  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { if (ctx && ctx.state !== 'running') A.unlock(); }, { capture: true, passive: true }); });
  ['visibilitychange', 'focus', 'pageshow'].forEach(function (ev) { (ev === 'visibilitychange' ? document : window).addEventListener(ev, function () { if (ctx && !document.hidden && A.want) A.resume(); }); });
  A.settings = { punch: .5, swing: .1, human: .3, pump: .55, trans: .5 };
  A.loudness = function (p) { // 0..1 — clean at 0, club-loud at 1, limiter keeps peaks ≤ −0.5 dBFS
    p = clampN(p, 0, 1, .5); A.settings.punch = p; if (!ctx) return; var t = ctx.currentTime;
    A.glue.threshold.setTargetAtTime(-8 - p * 10, t, .05); A.glue.ratio.setTargetAtTime(1.8 + p * 1.8, t, .05);
    A.makeup.gain.setTargetAtTime(db(p * 3.5), t, .05); A.satPre.gain.setTargetAtTime(.6 + p * .35, t, .05); A.satPost.gain.setTargetAtTime(1 / (.75 + p * .25), t, .05);
    A.subAmt.gain.setTargetAtTime(.1 + p * .18, t, .05); A.excAmt.gain.setTargetAtTime(.03 + p * .04, t, .05);
  };
  A.setEQ = function (band, v) { if (!ctx) return; v = clampN(v, -26, 12, 0); var n = band === 'lo' ? A.eqLo : band === 'mid' ? A.eqMid : A.eqHi; n.gain.setTargetAtTime(v, ctx.currentTime, .02); };
  A.filterVal = 0;
  A.setFilter = function (v) { if (!ctx) return; v = clampN(v, -1, 1, 0); var t = ctx.currentTime;
    if (v < -0.02) { A.lpf.frequency.setTargetAtTime(22000 * Math.pow(70 / 22000, -v), t, .03); A.hpf.frequency.setTargetAtTime(20, t, .03); }
    else if (v > 0.02) { A.hpf.frequency.setTargetAtTime(20 * Math.pow(8000 / 20, v), t, .03); A.lpf.frequency.setTargetAtTime(22000, t, .03); }
    else { A.lpf.frequency.setTargetAtTime(22000, t, .03); A.hpf.frequency.setTargetAtTime(20, t, .03); }
    A.filterVal = v; };
  // ---- Club API
  A.iso = { lo: 0, mid: 0, hi: 0 }; A.kill = { lo: false, mid: false, hi: false };
  function isoGain(v) { return v < 0 ? Math.pow(1 + v, 2) : db(v * 6); }
  A.setIso = function (b, v) { if (v != null) A.iso[b] = clampN(v, -1, 1, 0); if (!ctx) return; var n = b === 'lo' ? A.isoLo : b === 'mid' ? A.isoMid : A.isoHi; n.gain.setTargetAtTime(A.kill[b] ? 0 : isoGain(A.iso[b]), ctx.currentTime, .006); };
  A.setKill = function (b, on) { A.kill[b] = on == null ? !A.kill[b] : !!on; A.setIso(b); A.emit('kill', b); return A.kill[b]; };
  A.color = { v: 0, mode: 'filter', res: .5 };
  A.setColor = function (v, mode, res) { var c = A.color; if (v != null) c.v = clampN(v, -1, 1, 0); if (mode) c.mode = mode; if (res != null) c.res = clampN(res, 0, 1, .5); if (!ctx) return; var t = ctx.currentTime, x = c.v, ax = Math.abs(x), q = .7 + c.res * 9;
    var lpF = x < -.01 ? 22000 * Math.pow(90 / 22000, -x) : 22000, hpF = x > .01 ? 20 * Math.pow(9000 / 20, x) : 20;
    A.cfLP.frequency.setTargetAtTime(lpF, t, .02); A.cfHP.frequency.setTargetAtTime(hpF, t, .02); A.cfLP.Q.setTargetAtTime(x < -.01 ? q : .7, t, .02); A.cfHP.Q.setTargetAtTime(x > .01 ? q : .7, t, .02);
    var m = c.mode, k = ax > .02 ? ax : 0;
    A.cfNoiseBP.frequency.setTargetAtTime(x < 0 ? Math.max(200, lpF * .8) : Math.max(400, hpF * 1.2), t, .03);
    A.cfNoiseG.gain.setTargetAtTime(m === 'noise' ? k * .16 : 0, t, .03); A.cfRev.gain.setTargetAtTime(m === 'space' ? k * .9 : 0, t, .04); A.cfEcho.gain.setTargetAtTime(m === 'dub' ? k * .8 : 0, t, .04);
    A.crushWet.gain.setTargetAtTime(m === 'crush' ? k : 0, t, .02); A.cfDry.gain.setTargetAtTime(m === 'crush' ? 1 - k * .75 : 1, t, .02); };
  A.blendVal = 0;
  A.blend = function (v) { v = clampN(v, -1, 1, 0); A.blendVal = v; if (!ctx) return; var x = (v + 1) / 2, ge = Math.min(1, Math.SQRT2 * Math.cos(x * Math.PI / 2)), gt = Math.min(1, Math.SQRT2 * Math.sin(x * Math.PI / 2)); A.genXf.gain.setTargetAtTime(ge, ctx.currentTime, .012); A.trkXf.gain.setTargetAtTime(gt, ctx.currentTime, .012); return [ge, gt]; };
  A.width = 1.2;
  A.setWidth = function (w) { A.width = clampN(w, 0, 2, 1.2); if (!ctx) return; var a = .5 * (1 + A.width), b = .5 * (1 - A.width), t = ctx.currentTime; A.wLL.gain.setTargetAtTime(a, t, .03); A.wRR.gain.setTargetAtTime(a, t, .03); A.wLR.gain.setTargetAtTime(b, t, .03); A.wRL.gain.setTargetAtTime(b, t, .03); };
  var timed = []; function at(t, fn) { timed.push({ t: t, fn: fn }); } A.at = at;
  A.sweep = function (from, to, sec, t0) { t0 = t0 || ctx.currentTime; var steps = Math.max(8, Math.min(32, Math.round(sec * 6)));
    for (var i = 0; i <= steps; i++) (function (v) { at(t0 + sec * i / steps, function () { A.setFilter(v); A.emit('filter', v); }); })(from + (to - from) * i / steps); };
  A.setSend = function (w, v) { if (!ctx) return; v = clampN(v, 0, 1, 0); (w === 'echo' ? A.echoRet : A.revRet).gain.setTargetAtTime(w === 'echo' ? v : v * .85, ctx.currentTime, .05); };
  A.setEchoBeats = function (b) { A._echoBeats = b; if (ctx) A.echo.delayTime.setTargetAtTime(Math.min(3.9, b * 60 / A.bpm), ctx.currentTime, .08); };
  A.echoThrow = function (sec, t) { if (!ctx) return; t = t || ctx.currentTime; sec = sec || 2; var f = A.echoFb.gain;
    f.cancelScheduledValues(t); f.setTargetAtTime(.8, t, .02); f.setTargetAtTime(.48, t + sec, .5);
    var g = A.echoThrowG.gain; g.cancelScheduledValues(t); g.setTargetAtTime(.85, t, .01); g.setTargetAtTime(0, t + sec * .5, .15); };
  // beat repeat / beat loop / beat roll: fresh delay line per engage (no stale audio), quantized start, dry crossfade at loop point
  A.beatRepeat = function (on, beats, t, fbv) { if (!ctx) return; t = Math.max(t || 0, ctx.currentTime);
    if (on) { var len = Math.min(15.9, (beats || .5) * 60 / A.bpm); if (A._brN) A._brKill(t);
      var d = ctx.createDelay(len + .05), fb = ctx.createGain(), gi = ctx.createGain(), out = ctx.createGain(); d.delayTime.value = len; fb.gain.value = 0; gi.gain.value = 0; out.gain.value = 0;
      A.lpf.connect(gi); gi.connect(d); d.connect(fb); fb.connect(d); d.connect(out); out.connect(A.msIn);
      gi.gain.setValueAtTime(1, t); gi.gain.setValueAtTime(0, t + len); fb.gain.setValueAtTime(fbv == null ? (beats >= 1 ? .998 : .97) : fbv, t);
      out.gain.setValueAtTime(0, t + len - .003); out.gain.linearRampToValueAtTime(1, t + len + .003); A.dry.gain.setValueAtTime(1, t + len - .003); A.dry.gain.linearRampToValueAtTime(0, t + len + .003);
      A._brN = { d: d, fb: fb, gi: gi, out: out, len: len, t: t }; A._br = true; A.loopInfo = { beats: beats, len: len, t: t }; A.emit('loop', A.loopInfo); }
    else { if (A._brN) A._brKill(t); A._br = false; A.loopInfo = null; A.emit('loop', null); } };
  A._brKill = function (t) { var n = A._brN; if (!n) return; A._brN = null; n.gi.gain.cancelScheduledValues(t); n.gi.gain.setValueAtTime(0, t); n.out.gain.cancelScheduledValues(t); n.out.gain.setTargetAtTime(0, t, .006); n.fb.gain.setTargetAtTime(0, t, .01);
    A.dry.gain.cancelScheduledValues(t); A.dry.gain.setTargetAtTime(1, t, .005); at(t + .25, function () { try { A.lpf.disconnect(n.gi); } catch (e) {} [n.gi, n.d, n.fb, n.out].forEach(function (x) { try { x.disconnect(); } catch (e) {} }); }); };
  A.setMaster = function (v) { if (ctx) A.master.gain.setTargetAtTime(clampN(v, 0, 1.2, .9), ctx.currentTime, .03); };
  A.setGen = function (v) { A.genLevel = clampN(v, 0, 1.2, 1); if (ctx && !A._muting) A.genGain.gain.setTargetAtTime(A.genLevel, ctx.currentTime, .02); };
  A.bands = function () { var o = A._bands; if (!ctx) return o; A.analyser.getByteFrequencyData(A.fd); var f = A.fd, bin = ctx.sampleRate / A.analyser.fftSize;
    function s(a, b) { var i0 = Math.max(1, Math.floor(a / bin)), i1 = Math.floor(b / bin), t = 0; for (var i = i0; i <= i1; i++) t += f[i]; return t / ((i1 - i0 + 1) * 255); }
    o.b = s(30, 150); o.m = s(300, 2500); o.h = s(5000, 14000); o.r = (o.b + o.m + o.h) / 3; return o; };

  // ================= voice system: track nodes, disconnect on end, enforce budget =================
  var VN = null;
  function vbegin(prio) { if (A.active >= A.CAP && prio < 2) { A.dropped++; return false; } if (A.active >= A.CAP * .8 && prio < 1) { A.dropped++; return false; } VN = { n: [], s: [], end: 0 }; return true; }
  function vend() { var v = VN; VN = null; if (!v || !v.s.length) return; var last = v.s[0]; for (var i = 1; i < v.s.length; i++) if (v.s[i]._end > last._end) last = v.s[i];
    A.active++; if (A.active > A.peakVoices) A.peakVoices = A.active;
    last.onended = function () { A.active = Math.max(0, A.active - 1); for (var i = 0; i < v.s.length; i++) try { v.s[i].disconnect(); } catch (e) {} for (var j = 0; j < v.n.length; j++) try { v.n[j].disconnect(); } catch (e) {} }; }
  function src(node, t, end) { node._end = end; node.start(t); node.stop(end); if (VN) VN.s.push(node); return node; }
  function osc(type, f, t, dur, out) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(out); return src(o, t, t + dur + .05); }
  function noise(t, dur, out, rate, buf) { var s = ctx.createBufferSource(); s.buffer = buf || noiseBuf; s.loop = true; s.playbackRate.value = rate || 1; s.connect(out); s._end = t + dur + .05; s.start(t, Math.random() * .9); s.stop(s._end); if (VN) VN.s.push(s); return s; }
  function lfo(f, t, end, target, depth, type) { var o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = f; var g = G(depth); o.connect(g); g.connect(target); return src(o, t, end + .05); }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function wrap(fn, prio) { return function () { if (!ctx || !vbegin(prio)) return; try { fn.apply(null, arguments); } finally { vend(); } }; }
  var V = A.voice = {};
  // kick: sine sub with pitch env + controlled click transient; shared warm saturation on the kick bus
  V.kick = wrap(function (t, vel, k) { k = k || {};
    var g = G(0, A.kickBus), o = osc('sine', k.f0 || 170, t, (k.dec || .42) + .08, g), f1 = k.f1 || 49;
    o.frequency.exponentialRampToValueAtTime(f1 * 1.6, t + (k.pd || .04) * .45); o.frequency.exponentialRampToValueAtTime(f1, t + (k.pd || .04) * 1.6);
    if (k.tail) o.frequency.exponentialRampToValueAtTime(f1 * .88, t + k.dec);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + .0015); g.gain.setTargetAtTime(vel * .75, t + .01, .05); g.gain.exponentialRampToValueAtTime(.0001, t + (k.dec || .42));
    var cg = G(0, A.kickBus), ch = biq('bandpass', k.tone || 3200, .9); ch.connect(cg); noise(t, .012, ch); env(cg, t, .0004, (k.click == null ? .3 : k.click) * (.55 + A.settings.trans * .55) * vel, .01);
    A.kickAt(t, vel); }, 2);
  V.snare = wrap(function (t, vel, k) { k = k || {}; var g = G(0, A.topBus), bp = biq('bandpass', k.sf || 2000, .7), hp = biq('highpass', 900, .7); bp.connect(hp); hp.connect(g); noise(t, k.sd || .19, bp); env(g, t, .001, .62 * vel, k.sd || .17);
    var tg = G(0, A.topBus), o = osc('triangle', k.st || 195, t, .11, tg); o.frequency.exponentialRampToValueAtTime((k.st || 195) * .62, t + .07); env(tg, t, .001, .42 * vel, .08);
    var trg = G(0, A.topBus), trh = biq('highpass', 3500, .7); trh.connect(trg); noise(t, .008, trh); env(trg, t, .0003, A.settings.trans * .45 * vel, .006); // transient snap
    if (k.rev) hp.connect(G(.22 * vel, A.revIn)); }, 1);
  V.clap = wrap(function (t, vel, k) { var g = G(0, A.topBus), bp = biq('bandpass', (k && k.cf) || 1350, 1.1); bp.connect(g); noise(t, .3, bp);
    g.gain.setValueAtTime(0.0001, t); [0, .010, .021].forEach(function (o) { g.gain.setValueAtTime(.7 * vel, t + o); g.gain.exponentialRampToValueAtTime(.1 * vel, t + o + .008); });
    g.gain.setValueAtTime(.55 * vel, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + .03 + ((k && k.cd) || .17)); var trg = G(0, A.topBus), trh = biq('highpass', 2800, .7); trh.connect(trg); noise(t, .006, trh); env(trg, t, .0003, A.settings.trans * .35 * vel, .005); bp.connect(G(.14, A.revIn)); }, 1);
  var hatSide = 0;
  V.hat = wrap(function (t, vel, open, k) { k = k || {}; var dur = open ? (k.od || .3) : (k.hd || .042), out = (hatSide++ & 1) ? A.hatR : A.hatL, g = G(0, out), hp = biq('highpass', open ? 6500 : 7800, .7); hp.connect(g);
    noise(t, dur, hp, k.metal ? 1.15 : 1, k.metal || open ? hatBuf : noiseBuf); var pk = (open ? .3 : .26) * (.55 + .45 * vel * vel); env(g, t, .0006, pk, dur); }, 0);
  V.perc = wrap(function (t, vel, f, dec, type) { var g = G(0, A.topBus), o = osc(type || 'sine', f * 1.5, t, dec, g); o.frequency.exponentialRampToValueAtTime(f, t + .018); env(g, t, .001, .36 * vel, dec); }, 0);
  V.rim = wrap(function (t, vel) { var g = G(0, A.topBus), bp = biq('bandpass', 1750, 5); bp.connect(g); osc('square', 1750, t, .025, bp); noise(t, .015, bp); env(g, t, .0005, .5 * vel, .028); }, 0);
  V.shaker = wrap(function (t, vel) { var out = (hatSide++ & 1) ? A.hatR : A.hatL, g = G(0, out), hp = biq('highpass', 5800, .7); hp.connect(g); noise(t, .07, hp); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.14 * vel, t + .025); g.gain.exponentialRampToValueAtTime(.0001, t + .07); }, 0);
  V.tom = wrap(function (t, vel, f) { var g = G(0, A.topBus), o = osc('sine', f * 1.7, t, .36, g); o.frequency.exponentialRampToValueAtTime(f, t + .05); env(g, t, .001, .5 * vel, .32); }, 0);
  // bass → bass bus (warm sat + sidechain duck)
  V.bass = wrap(function (t, f, dur, vel, b, slideFrom) {
    b = b || {}; var type = b.type || 'sub', g = G(0, A.bassBus), lp = biq('lowpass', b.cut || 900, b.res || .9); lp.connect(g);
    var end = t + dur, a = b.att || .004, rel = b.rel || .07;
    function mk(tp, mul, det) { var o = osc(tp, f * mul, t, dur + rel + .05, lp); if (det) o.detune.value = det; if (slideFrom) { o.frequency.setValueAtTime(slideFrom * mul, t); o.frequency.exponentialRampToValueAtTime(f * mul, t + (b.glide || .06)); } return o; }
    if (type === 'acid') { lp.Q.value = b.res || 14; mk('sawtooth', 1); var c = b.cut || 400, acc = vel > .9; lp.frequency.setValueAtTime(c * (acc ? 6 : 3.5), t); lp.frequency.exponentialRampToValueAtTime(c, t + (acc ? .18 : .12)); vel *= .7; rel = .03; }
    else if (type === 'sub') { mk('sine', 1); mk('triangle', 2).detune.value = 3; lp.frequency.value = 380; }
    else if (type === '808') { var o = mk('sine', 1); if (!slideFrom) { o.frequency.setValueAtTime(f * 2, t); o.frequency.exponentialRampToValueAtTime(f, t + .03); } lp.frequency.value = 1800; a = .002; rel = .12; }
    else if (type === 'reese') { mk('sawtooth', 1, -13); mk('sawtooth', 1, 13); mk('sine', .5); lp.frequency.value = b.cut || 600; lfo(.35, t, end + rel, lp.frequency, 220); }
    else if (type === 'wobble') { mk('sawtooth', 1, -6); mk('square', 1, 6); mk('sine', .5); lp.Q.value = 6; lp.frequency.value = 320; lfo((b.wob || 2) * A.bpm / 120, t, end + rel, lp.frequency, 1300); }
    else if (type === 'growl') { var car = mk('sawtooth', 1); lfo(f * 1.5, t, end + rel, car.frequency, f * 2.5); lp.Q.value = 7; lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(2200, t + dur * .5); lp.frequency.linearRampToValueAtTime(420, end); }
    else if (type === 'slap') { mk('square', 1); mk('sawtooth', 2); lp.Q.value = 3.5; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(480, t + .1); }
    else if (type === 'dub') { mk('sine', 1); mk('sine', 2).detune.value = -2; lp.frequency.value = 260; a = .012; }
    else { mk('square', 1); mk('sawtooth', 1, 7); lp.frequency.value = b.cut || 700; }
    var pk = (b.gain || .55) * vel;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setValueAtTime(pk, Math.max(t + a + .001, end - .01)); g.gain.exponentialRampToValueAtTime(.0001, Math.max(t + a + .002, end) + rel);
  }, 2);
  // synth / chords / leads → synth bus (HPF + mud cut + duck)
  V.tone = wrap(function (t, f, dur, vel, s) {
    s = s || {}; var type = s.type || 'pluck', out = s.bus === 'fx' ? A.fxBus : A.synthBus, g = G(0, out), lp = biq('lowpass', s.cut || 3200, s.res || .7); lp.connect(g);
    var a = s.att || .005, rel = s.rel || .15, end = t + dur, pk = (s.gain || .17) * vel, tap = lp;
    function o(tp, mul, det) { var x = osc(tp, f * mul, t, dur + rel + .1, lp); if (det) x.detune.value = det; return x; }
    if (type === 'supersaw') { (A.mobile ? [-15, 0, 15] : [-22, -10, 0, 10, 22]).forEach(function (d) { o('sawtooth', 1, d); }); pk *= A.mobile ? .7 : .5; }
    else if (type === 'pluck') { o('sawtooth', 1, -6); o('square', 1, 6); lp.frequency.setValueAtTime((s.cut || 3000) * 2, t); lp.frequency.exponentialRampToValueAtTime(Math.max(250, (s.cut || 3000) * .25), t + .17); }
    else if (type === 'fmbell' || type === 'fm') { var c = o('sine', 1), m = ctx.createOscillator(), mg = G(f * (s.idx || 4)); m.frequency.value = f * (s.ratio || 3.5); m.connect(mg); mg.connect(c.frequency); src(m, t, end + rel + .1); mg.gain.setValueAtTime(f * (s.idx || 4), t); mg.gain.exponentialRampToValueAtTime(f * .15 + 1, t + .4); }
    else if (type === 'pad') { o('sawtooth', 1, -7); o('sawtooth', 1, 7); a = s.att || .35; rel = s.rel || .8; pk *= .62; lp.frequency.value = s.cut || 2200; }
    else if (type === 'skank') { o('square', 1, -4); o('sawtooth', 1, 4); var bp = biq('bandpass', 1500, 1.3); lp.disconnect(); lp.connect(bp); bp.connect(g); tap = bp; dur = Math.min(dur, .085); end = t + dur; rel = .045; }
    else if (type === 'organ') { o('sine', 1); o('sine', 2); o('sine', 3).detune.value = 2; pk *= .55; }
    else if (type === 'acidlead') { o('sawtooth', 1); lp.Q.value = 9; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(420, t + .2); }
    else if (type === 'stab') { o('sawtooth', 1, -9); o('sawtooth', 1, 9); lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(650, t + .15); dur = Math.min(dur, .2); end = t + dur; }
    else if (type === 'retro') { o('square', 1, -5); o('sawtooth', 1, 5); }
    else o('triangle', 1);
    if (s.echo) tap.connect(G(s.echo, A.echoIn)); if (s.rev) tap.connect(G(s.rev, A.revIn)); if (s.spring) tap.connect(G(s.spring, A.springIn));
    var sus = s.sus == null ? .6 : s.sus;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setTargetAtTime(pk * sus, t + a, .12);
    g.gain.setValueAtTime(pk * sus + .0001, Math.max(t + a + .01, end)); g.gain.exponentialRampToValueAtTime(.0001, Math.max(t + a + .02, end) + rel);
  }, 0);
  // honest formant voice synthesis (no real singing) → fx bus
  var VOW = { a: [800, 1150, 2900], e: [400, 1600, 2700], i: [300, 2200, 3000], o: [450, 800, 2830], u: [325, 700, 2530] };
  V.voice = wrap(function (t, f, dur, vel, v) {
    v = v || {}; var type = v.type || 'choir', vow = VOW[v.vowel || 'a'] || VOW.a, g = G(0, A.fxBus), sIn = G(1), end = t + dur, pk = (v.gain || .5) * vel, a = v.att || .03;
    if (type === 'whisper' || type === 'crowd') noise(t, dur + .3, sIn, type === 'crowd' ? .6 : 1);
    else { var dets = type === 'choir' ? (A.mobile ? [-8, 8] : [-12, -4, 4, 12]) : [0], vib = (type === 'chant' || type === 'choir') ? G(f * .012) : null;
      if (vib) { var vl = ctx.createOscillator(); vl.frequency.value = 5.2; vl.connect(vib); src(vl, t, end + .4); }
      dets.forEach(function (d) { var o = osc(type === 'robot' ? 'square' : 'sawtooth', f, t, dur + .35, sIn); o.detune.value = d; if (vib) vib.connect(o.frequency); if (v.glide) { o.frequency.setValueAtTime(f * v.glide, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); } }); }
    vow.forEach(function (fr, i) { var bp = biq('bandpass', fr * (v.shift || 1), type === 'whisper' ? 12 : 9); sIn.connect(bp); bp.connect(G([1, .5, .25][i], g));
      if (type === 'talkbox' && v.vowel2 && VOW[v.vowel2]) bp.frequency.linearRampToValueAtTime(VOW[v.vowel2][i] * (v.shift || 1), t + dur * .6); });
    if (v.echo) g.connect(G(v.echo, A.echoIn)); if (v.rev) g.connect(G(v.rev, A.revIn));
    if (type === 'chop' || type === 'crowd') a = .005;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setValueAtTime(pk, Math.max(t + a + .001, end - .02)); g.gain.exponentialRampToValueAtTime(.0001, Math.max(t + a + .002, end) + (v.rel || .12));
  }, 0);
  // FX / specials → fx bus
  V.riser = wrap(function (t, dur, vel) { var g = G(0, A.fxBus), bp = biq('bandpass', 400, 2.5); bp.connect(g); noise(t, dur, bp); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.3 * (vel || 1), t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .04); bp.connect(G(.25, A.revIn)); }, 1);
  V.down = wrap(function (t, dur, f) { var g = G(0, A.fxBus), o = osc('sawtooth', f || 800, t, dur, g); o.frequency.exponentialRampToValueAtTime(40, t + dur); env(g, t, .01, .1, dur); }, 0);
  V.impact = wrap(function (t, vel) { var g = G(0, A.kickBus), o = osc('sine', 85, t, 1.5, g); o.frequency.exponentialRampToValueAtTime(32, t + 1.3); env(g, t, .002, .75 * (vel || 1), 1.4); var ng = G(0, A.revIn); noise(t, .45, ng); env(ng, t, .001, .4, .45); }, 2);
  V.siren = wrap(function (t, dur, f) { f = f || 600; var g = G(0, A.fxBus), lp = biq('lowpass', 2600, 1); lp.connect(g); var o = osc('square', f, t, dur, lp); lfo(4, t, t + dur, o.frequency, f * .55); g.connect(G(.45, A.echoIn)); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + .03); g.gain.setValueAtTime(.12, t + dur - .05); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }, 1);
  V.laser = wrap(function (t, f) { f = f || 3000; var g = G(0, A.fxBus), o = osc('sawtooth', f, t, .35, g); o.frequency.exponentialRampToValueAtTime(f * .03, t + .3); env(g, t, .001, .16, .3); g.connect(G(.35, A.echoIn)); }, 0);
  V.horn = wrap(function (t, f) { f = f || 466; var g = G(0, A.fxBus), lp = biq('lowpass', 2400, 1.5); lp.connect(g); [1, 1.26, 1.5].forEach(function (m) { var o = osc('sawtooth', f * m, t, 1, lp); o.frequency.setValueAtTime(f * m * .8, t); o.frequency.linearRampToValueAtTime(f * m, t + .06); });
    g.gain.setValueAtTime(.0001, t); [0, .18, .36].forEach(function (o) { g.gain.setValueAtTime(.18, t + o); g.gain.setValueAtTime(.0001, t + o + .15); }); g.gain.setValueAtTime(.18, t + .54); g.gain.exponentialRampToValueAtTime(.0001, t + 1.15); lp.connect(G(.28, A.echoIn)); }, 1);
  V.dive = wrap(function (t, f, dur) { var g = G(0, A.bassBus), o = osc('sine', f * 2, t, dur, g); o.frequency.exponentialRampToValueAtTime(f / 2, t + dur); var o2 = osc('triangle', f * 2, t, dur, g); o2.frequency.exponentialRampToValueAtTime(f / 2, t + dur); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.6, t + .01); g.gain.setValueAtTime(.6, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur); }, 2);
  // smooth sidechain: bass ducks deep + fast, pads/synth breathe, fx lightly — on every kick
  A.kicks = [];
  A.kickAt = function (t, vel) { var p = A.settings.pump * vel, bl = 60 / A.bpm;
    if (p > .01) { duck(A.bassDuck.gain, t, p * .8, bl * .17); duck(A.synthDuck.gain, t, p * .55, bl * .3); duck(A.fxDuck.gain, t, p * .3, bl * .3); }
    A.kicks.push(t); if (A.kicks.length > 32) A.kicks.shift(); };
  function duck(pm, t, d, rel) { pm.setTargetAtTime(Math.max(.08, 1 - d), t, .0035); pm.setTargetAtTime(1, t + .035, rel); }

  // ================= clock: worker heartbeat + lookahead =================
  A.bpm = 128; A.playing = false; A.step = 0; A.nextT = 0; A.LOOK = .25;
  A.stepDur = function () { return 60 / A.bpm / 4; };
  A.setBpm = function (b, keepGlide) { if (!keepGlide) A._glide = null; A.bpm = clampN(b, 50, 200, 128); if (ctx && A._echoBeats) A.setEchoBeats(A._echoBeats); A.emit('bpm', A.bpm); };
  A.glideBpm = function (to, bars) { to = clampN(to, 50, 200, A.bpm); if (Math.abs(to - A.bpm) < .05) return; A._glide = { from: A.bpm, to: to, steps: Math.max(1, (bars || 8) * 16), n: 0 }; };
  var taps = []; A.tap = function () { var t = performance.now(); if (taps.length && t - taps[taps.length - 1] > 2000) taps = []; taps.push(t); if (taps.length > 8) taps.shift(); if (taps.length >= 3) { var d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); A.setBpm(Math.round(60000 / d * 10) / 10); } return A.bpm; };
  A.start = function () { A.init(); A.want = true; A.resume(); if (A.playing) return; A._muting = false; A.genGain.gain.cancelScheduledValues(ctx.currentTime); A.genGain.gain.setTargetAtTime(A.genLevel, ctx.currentTime, .01); A.playing = true; A.step = 0; A.nextT = ctx.currentTime + .1; A.emit('play', true); };
  A.stop = function () { if (!A.playing) return; A.playing = false; if (ctx) { var t = ctx.currentTime; A._muting = true; A.genGain.gain.cancelScheduledValues(t); A.genGain.gain.setTargetAtTime(0, t, .025); // fade tails of already-scheduled notes
      at(t + A.LOOK + .4, function () { if (!A.playing) { A.genGain.gain.setTargetAtTime(A.genLevel, ctx.currentTime, .01); A._muting = false; } }); if (A._br) A.beatRepeat(false); }
    A.emit('play', false); };
  A.seq = null;
  var worker = null;
  function startClock() {
    var tick = function () { try { pump(); } catch (e) { console.error(e); A.emit('error', e); } };
    try { var code = 'var iv=null;onmessage=function(e){if(e.data==="go"){clearInterval(iv);iv=setInterval(function(){postMessage(0)},25)}};';
      worker = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))); worker.onmessage = tick; worker.postMessage('go'); A.stats.worker = true; }
    catch (e) { A.stats.worker = false; setInterval(tick, 25); }
    setInterval(function () { if (performance.now() - (A._lastPump || 0) > 200) tick(); }, 200); // watchdog if worker stalls
  }
  function pump() {
    var pn = performance.now(); if (A._lastPump) { var gap = pn - A._lastPump; if (gap > A.stats.maxGap && A.stats.pumps > 20) A.stats.maxGap = gap; } A._lastPump = pn; A.stats.pumps++;
    var now = ctx.currentTime;
    if (timed.length) { var due = []; for (var i = timed.length - 1; i >= 0; i--) if (timed[i].t <= now) { due.push(timed[i]); timed.splice(i, 1); } due.sort(function (a, b) { return a.t - b.t; }); due.forEach(function (d) { try { d.fn(); } catch (e) { console.error(e); } }); }
    if (A.playing) {
      if (A.nextT < now - .3) { A.nextT = now + .03; A.stats.resync = (A.stats.resync || 0) + 1; } // recovered from suspend: no burst
      var guard = 0;
      while (A.nextT < now + A.LOOK && guard++ < 64) {
        if (A._glide) { var g = A._glide; g.n++; A.bpm = g.from + (g.to - g.from) * Math.min(1, g.n / g.steps); if (g.n >= g.steps) { A._glide = null; A.setBpm(g.to); } }
        if (A._rephase && A.step % 4 === 0) { A._rephase = false; if (A.step % 16) A.step = (A.step / 16 | 0) * 16 + 16; } // hot cue: this beat becomes a downbeat
        var sd = A.stepDur(); if (A.nextT < now) A.stats.late++;
        if (A.seq) try { A.seq(A.step, A.nextT, sd); } catch (e) { console.error(e); A.emit('error', e); }
        if (A.step % 4 === 0) (function (bn) { at(A.nextT, function () { A.emit('beat', bn); }); })(A.step / 4);
        A.nextT += sd; A.step++;
      }
    }
    A.emit('tick', now);
  }
  // next beat/bar time on the running grid (for quantized pads, specials, style switches)
  A.nextGrid = function (div) { if (!ctx) return 0; var now = ctx.currentTime + .03; if (!A.playing) return now; var sd = A.stepDur();
    var k = A.step - Math.floor((A.nextT - now) / sd); if (k < 0) k = 0; var tk = A.nextT - (A.step - k) * sd; var n = 0; while (tk < now && n++ < 64) { k++; tk += sd; } n = 0; while (k % div && n++ < 64) { k++; tk += sd; } return tk; };
  A.nextBeatTime = function () { return A.nextGrid(4); }; A.nextBarTime = function () { return A.nextGrid(16); };

  // ================= decks (uploaded tracks) =================
  // BPM estimate from onset envelope autocorrelation (first ≤60 s), folded to 80–170
  function detectBpm(buf) { try { var sr = buf.sampleRate, hop = Math.round(sr / 100), n = Math.min(buf.length, sr * 60), ch = buf.getChannelData(0), env = [], prev = 0, lp = 0;
      for (var i = 0; i + hop <= n; i += hop) { var e = 0; for (var j = i; j < i + hop; j += 4) { lp += (ch[j] - lp) * .08; e += lp * lp; } e = Math.sqrt(e); env.push(Math.max(0, e - prev)); prev = e; }
      var best = 0, bl = 0; for (var L = 35; L <= 75; L++) { var c = 0; for (var k = L; k < env.length; k++) c += env[k] * env[k - L]; if (c > best) { best = c; bl = L; } }
      if (!bl) return 0; var bpm = 6000 / bl; while (bpm < 80) bpm *= 2; while (bpm > 170) bpm /= 2; return Math.round(bpm * 10) / 10; } catch (e) { return 0; } }
  A.detectBpm = detectBpm;
  function Deck(i) { this.i = i; this.out = ctx.createGain(); this.out.gain.value = .9; this.out.connect(A.deckBus); this.x = ctx.createGain(); this.x.connect(this.out); this.buf = null; this.src = null; this.rate = 1; this.off = 0; this.t0 = 0; this.playing = false; this.name = ''; this.bpm = 0; this.el = null; this.direct = false; }
  Deck.prototype._mkEl = function (url, cors) { var self = this; if (this.el) { try { this.el.pause(); } catch (e) {} } var el = new Audio(); if (cors) el.crossOrigin = 'anonymous'; el.preload = 'auto'; el.src = url; el.preservesPitch = el.mozPreservesPitch = el.webkitPreservesPitch = true;
    el.onended = function () { if (self.playing && self.mode === 'el') { self.playing = false; self.off = 0; A.emit('deck', self); } }; this.el = el; this.mes = null; return el; };
  Deck.prototype._route = function () { if (this.mes || !this.el || this.direct) return; try { this.mes = ctx.createMediaElementSource(this.el); this.mes.connect(this.x); } catch (e) { this.direct = true; } };
  Deck.prototype._ready = function (b, name, url) { this.stop(); if (this.url && this.url.indexOf('blob:') === 0) try { URL.revokeObjectURL(this.url); } catch (e) {} this.buf = b; this.off = 0; this.name = name; this.direct = false; this.url = url; this.bpm = b ? detectBpm(b) : 0; if (url) { this._mkEl(url, url.indexOf('blob:') !== 0); } if (A.syncLock) this.sync(); A.emit('deck', this); return this; };
  Deck.prototype.load = function (file) { var self = this; A.init();
    return file.arrayBuffer().then(function (ab) { return new Promise(function (res, rej) { var p = ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }); })
      .then(function (b) { return self._ready(b, file.name.replace(/\.[^.]+$/, ''), URL.createObjectURL(file)); }); };
  // link loader: direct/CORS URL → decoded buffer (full FX); Drive/Dropbox links normalised; if the host blocks CORS → plain streaming (audible, no FX/visual sync) — never silent
  A.normLink = function (u) { u = String(u || '').trim(); var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/) || u.match(/[?&]id=([\w-]{20,})/);
    if (m && /google\./.test(u)) return { url: 'https://drive.usercontent.google.com/download?id=' + m[1] + '&export=download&confirm=t', drive: m[1] };
    if (/dropbox\.com\//.test(u)) { var d = u.replace(/([?&])dl=[01]/, '$1raw=1'); return { url: /raw=1/.test(d) ? d : d + (d.indexOf('?') > 0 ? '&' : '?') + 'raw=1' }; }
    return { url: u }; };
  Deck.prototype.loadUrl = function (link) { var self = this; A.init(); var n = A.normLink(link), u = n.url, name = decodeURIComponent((u.split('?')[0].split('/').pop() || 'link')).replace(/\.[^.]+$/, '').slice(0, 40) || 'link';
    if (n.drive) name = 'Drive ' + n.drive.slice(0, 6);
    return fetch(u, { mode: 'cors' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { var p = ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }); })
      .then(function (b) { self._ready(b, name, u); self.how = 'buffer'; return self; })
      .catch(function (err) { // CORS-blocked or not decodable via fetch → stream it through a media element
        return new Promise(function (res, rej) { self._ready(null, name, null); var el = self._mkEl(u, false); self.direct = true; self.how = 'stream';
          var done = false; el.oncanplay = function () { if (done) return; done = true; self.dur = el.duration; A.emit('deck', self); res(self); };
          el.onerror = function () { if (done) return; done = true; rej(new Error('Link nie gra (' + (err && err.message || 'błąd') + '). Plik musi być publiczny (Drive: „Każdy z linkiem”).')); };
          el.load(); setTimeout(function () { if (!done) { done = true; rej(new Error('Timeout linku — sprawdź udostępnianie')); } }, 15000); }); }); };
  Deck.prototype.useEl = function () { return !!this.el && (this.direct || (A.masterTempo && Math.abs(this.rate - 1) > .001) || !this.buf); };
  Deck.prototype.play = function (t) { if ((!this.buf && !this.el) || this.playing) return; A.unlock(); var self = this; t = Math.max(t || 0, ctx.currentTime + .01);
    if (this.useEl()) { this._route(); var el = this.el; this.mode = 'el'; el.playbackRate = this.rate; try { el.currentTime = this.off || 0; } catch (e) {} var dl = Math.max(0, (t - ctx.currentTime) * 1000);
      setTimeout(function () { var p = el.play(); if (p && p.catch) p.catch(function (e) { A.emit('toast', '⚠️ Deck ' + 'AB'[self.i] + ': ' + e.message); self.playing = false; A.emit('deck', self); }); }, dl);
      this.out.gain.setValueAtTime(.9, t); this.playing = true; this.t0 = t; A.emit('deck', this); return; }
    this.mode = 'buf'; var s = ctx.createBufferSource(); s.buffer = this.buf; s.playbackRate.value = this.rate; s.connect(this.x);
    this.x.gain.cancelScheduledValues(t); this.out.gain.setValueAtTime(0, t); this.out.gain.linearRampToValueAtTime(.9, t + .015);
    s.start(t, this.off % this.buf.duration); this.src = s; this.t0 = t; this.playing = true;
    s.onended = function () { try { s.disconnect(); } catch (e) {} if (self.src === s && self.playing) { self.playing = false; self.off = 0; self.src = null; A.emit('deck', self); } }; A.emit('deck', this); };
  Deck.prototype._halt = function () { if (this.mode === 'el' && this.el) { try { this.el.pause(); } catch (e) {} return; } if (!this.src) return; var s = this.src, t = ctx.currentTime; this.out.gain.setTargetAtTime(0, t, .006); try { s.stop(t + .04); } catch (e) {} this.src = null; var o = this.out; at(t + .06, function () { o.gain.setTargetAtTime(.9, ctx.currentTime, .005); }); };
  Deck.prototype.pause = function () { if (!this.playing) return; this.off = this.pos(); this._halt(); this.playing = false; A.emit('deck', this); };
  Deck.prototype.stop = function () { this._halt(); this.playing = false; this.off = 0; A.emit('deck', this); };
  Deck.prototype.toggle = function () { this.playing ? this.pause() : this.play(); };
  Deck.prototype.pos = function () { if (this.mode === 'el' && this.el && this.playing) return this.el.currentTime; return this.playing ? this.off + Math.max(0, ctx.currentTime - this.t0) * this.rate : this.off; };
  Deck.prototype.setRate = function (r) { var p = this.pos(); this.rate = clampN(r, .5, 1.5, 1); if (!this.playing) return;
    if (this.mode !== (this.useEl() ? 'el' : 'buf')) { this.off = p; this._halt(); this.playing = false; this.play(); return; } // switch engine (master tempo needs the pitch-preserving element)
    if (this.mode === 'el') { this.el.playbackRate = this.rate; return; }
    if (this.src) { this.off = p; this.t0 = ctx.currentTime; this.src.playbackRate.setTargetAtTime(this.rate, ctx.currentTime, .02); } A.emit('deck', this); };
  Deck.prototype.sync = function () { if (!this.bpm) return false; this.setRate(clampN(A.bpm / this.bpm, .5, 1.5, 1)); A.emit('deck', this); return true; };
  A.syncLock = false; A.masterTempo = true;
  A.setSync = function (on) { A.syncLock = on == null ? !A.syncLock : !!on; if (A.syncLock && A.decks) A.decks.forEach(function (d) { d.sync(); }); A.emit('sync', A.syncLock); return A.syncLock; };
  A.setMasterTempo = function (on) { A.masterTempo = on == null ? !A.masterTempo : !!on; if (A.decks) A.decks.forEach(function (d) { d.setRate(d.rate); }); A.emit('mt', A.masterTempo); return A.masterTempo; };
  A.on('bpm', function () { if (A.syncLock && A.decks) A.decks.forEach(function (d) { if (d.bpm) d.setRate(clampN(A.bpm / d.bpm, .5, 1.5, 1)); }); });
  A.xfader = function (v) { v = clampN(v, -1, 1, 0); A.xf = v; if (!A.decks) return; var x = (v + 1) / 2; A.decks[0].x.gain.setTargetAtTime(Math.cos(x * Math.PI / 2), ctx.currentTime, .01); A.decks[1].x.gain.setTargetAtTime(Math.sin(x * Math.PI / 2), ctx.currentTime, .01); };

  // ================= sample pads =================
  A.loadSample = function (url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(function (ab) { return new Promise(function (res, rej) { var p = ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }); }); };
  A.playBuf = function (buf, t, vol, out) { var s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = 0; g.connect(out || A.padBus); s.buffer = buf; s.connect(g); t = Math.max(t || 0, ctx.currentTime);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol == null ? 1 : vol, t + .004); s.start(t); s._g = g;
    s.fadeStop = function () { var n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0, n, .01); try { s.stop(n + .06); } catch (e) {} };
    s.addEventListener('ended', function () { try { s.disconnect(); g.disconnect(); } catch (e) {} }); return s; };

  window.DDA = A;
})();
