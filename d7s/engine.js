/* D7S engine: 48 kHz Web Audio core — 2 decks, mixer, FX units, 40 loop pads, clock, MIDI, recorder. Original code. */
(function () {
  'use strict';
  var E = {}, G = window.D7Gen;
  var ctx = null;
  E.listeners = {};
  E.on = function (ev, fn) { (E.listeners[ev] = E.listeners[ev] || []).push(fn); };
  E.emit = function (ev, a) { (E.listeners[ev] || []).forEach(function (f) { try { f(a); } catch (e) { console.error(e); } }); };

  E.init = function () {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    var SR0 = (window.D7S_SETTINGS && +window.D7S_SETTINGS.sr) || 48000; try { ctx = new AC({ sampleRate: SR0, latencyHint: (window.D7S_SETTINGS && window.D7S_SETTINGS.latency) || 'interactive' }); } catch (e) { ctx = new AC(); }
    E.ctx = ctx;
    // master chain: bus -> FX1 -> FX2 -> master -> limiter -> analyser -> out
    E.bus = ctx.createGain();
    E.fx1 = new FxUnit(1); E.fx2 = new FxUnit(2);
    E.master = ctx.createGain(); E.master.gain.value = .9;
    E.limiter = ctx.createDynamicsCompressor(); E.limiter.threshold.value = -3; E.limiter.knee.value = 0; E.limiter.ratio.value = 20; E.limiter.attack.value = .002; E.limiter.release.value = .1;
    E.analyser = ctx.createAnalyser(); E.analyser.fftSize = 2048; E.analyser.smoothingTimeConstant = .7;
    E.recDest = ctx.createMediaStreamDestination();
    E.bus.connect(E.fx1.input); E.fx1.output.connect(E.fx2.input); E.fx2.output.connect(E.master);
    E.master.connect(E.limiter); E.limiter.connect(E.analyser); E.analyser.connect(ctx.destination); E.analyser.connect(E.recDest);
    // shared send FX: echo + reverb (return into master)
    E.echoIn = ctx.createGain(); var dl = ctx.createDelay(4), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500; fb.gain.value = .45;
    E.echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(E.master); E.echoDelay = dl; E.echoFb = fb;
    E.revIn = ctx.createGain(); var cv = ctx.createConvolver(); cv.buffer = G.impulse(ctx, 3.2, 2.6); var rg = ctx.createGain(); rg.gain.value = .8; E.revIn.connect(cv); cv.connect(rg); rg.connect(E.master);
    E.cue = ctx.createGain(); // reserved
    E.decks = [new Deck(0), new Deck(1)];
    E.xfader(0);
    E.pads = new Pads();
    E.preview = ctx.createGain(); E.preview.gain.value = .9; E.preview.connect(E.bus);
    E.clock.t0 = ctx.currentTime + .05;
    setInterval(tick, 25);
    E.emit('ready');
    return ctx;
  };

  // ---------- clock (global tempo) ----------
  E.clock = { bpm: 128, t0: 0, running: true };
  E.beatLen = function () { return 60 / E.clock.bpm; };
  E.barLen = function () { return 4 * E.beatLen(); };
  E.beatPos = function (t) { return ((t == null ? ctx.currentTime : t) - E.clock.t0) / E.beatLen(); };
  E.nextBar = function (t) { t = t == null ? ctx.currentTime : t; var b = Math.ceil(E.beatPos(t + .02) / 4) * 4; return E.clock.t0 + b * E.beatLen(); };
  E.setBpm = function (bpm) {
    bpm = Math.max(40, Math.min(220, +bpm || 120)); if (!ctx) { E.clock.bpm = bpm; E.emit('bpm', bpm); return; }
    var now = ctx.currentTime, b = E.beatPos(now); E.clock.bpm = bpm; E.clock.t0 = now - b * 60 / bpm;
    E.pads && E.pads.retempo(); E.fx1 && E.fx1.retime(); E.fx2 && E.fx2.retime(); E.setEcho(E._echoBeats || .75);
    E.emit('bpm', bpm);
  };
  var taps = [];
  E.tap = function () { var t = performance.now(); if (taps.length && t - taps[taps.length - 1] > 2000) taps = []; taps.push(t); if (taps.length > 8) taps.shift(); if (taps.length >= 3) { var d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); E.setBpm(Math.round(60000 / d * 10) / 10); } };
  E.setEcho = function (beats) { E._echoBeats = beats; if (E.echoDelay) E.echoDelay.delayTime.setTargetAtTime(Math.min(3.9, beats * E.beatLen()), ctx.currentTime, .05); };
  var lastBeat = -1;
  function tick() {
    if (!ctx) return; var bp = Math.floor(E.beatPos()); if (bp !== lastBeat) { lastBeat = bp; E.emit('beat', bp); }
    E.decks.forEach(function (d) { d.tick(); });
    E.midi.clockTick();
    E.autodj.tick();
  }

  // ---------- crossfader ----------
  E.xf = 0; E.xfCurve = 'smooth';
  E.xfader = function (v) { // -1..1
    E.xf = v; var a, b, x = (v + 1) / 2;
    if (E.xfCurve === 'sharp') { a = x < .9 ? 1 : (1 - x) * 10; b = x > .1 ? 1 : x * 10; } else { a = Math.cos(x * Math.PI / 2); b = Math.sin(x * Math.PI / 2); }
    if (E.decks) { E.decks[0].xg.gain.setTargetAtTime(a, ctx.currentTime, .01); E.decks[1].xg.gain.setTargetAtTime(b, ctx.currentTime, .01); }
  };

  // ---------- deck ----------
  function Deck(i) {
    this.i = i; this.name = 'ABCD'[i];
    var c = ctx;
    this.trim = c.createGain();
    this.lo = c.createBiquadFilter(); this.lo.type = 'lowshelf'; this.lo.frequency.value = 220;
    this.mi = c.createBiquadFilter(); this.mi.type = 'peaking'; this.mi.frequency.value = 1000; this.mi.Q.value = .8;
    this.hi = c.createBiquadFilter(); this.hi.type = 'highshelf'; this.hi.frequency.value = 4500;
    this.flp = c.createBiquadFilter(); this.flp.type = 'lowpass'; this.flp.frequency.value = 22000; this.flp.Q.value = 1;
    this.fhp = c.createBiquadFilter(); this.fhp.type = 'highpass'; this.fhp.frequency.value = 10; this.fhp.Q.value = 1;
    this.fader = c.createGain(); this.fader.gain.value = .85;
    this.xg = c.createGain();
    this.an = c.createAnalyser(); this.an.fftSize = 512;
    this.echoSend = c.createGain(); this.echoSend.gain.value = 0; this.revSend = c.createGain(); this.revSend.gain.value = 0;
    this.trim.connect(this.lo); this.lo.connect(this.mi); this.mi.connect(this.hi); this.hi.connect(this.flp); this.flp.connect(this.fhp); this.fhp.connect(this.fader);
    this.fader.connect(this.xg); this.xg.connect(E.bus); this.fader.connect(this.an);
    this.xg.connect(this.echoSend); this.echoSend.connect(E.echoIn); this.xg.connect(this.revSend); this.revSend.connect(E.revIn);
    this.buffer = null; this.src = null; this.playing = false; this.pos0 = 0; this.t0 = 0; this.rate = 1; this.pitch = 0; this.range = 8;
    this.bpm = 0; this.phase = 0; this.cuePt = 0; this.hot = [null, null, null, null]; this.loop = null; this.title = '—'; this.media = null; this.peaks = null; this.ended = false;
  }
  Deck.prototype.position = function () {
    if (!this.buffer) return 0; var p = this.pos0 + (this.playing ? (ctx.currentTime - this.t0) * this.rate : 0);
    if (this.loop && this.playing && p > this.loop.end) { var L = this.loop.end - this.loop.start; p = this.loop.start + ((p - this.loop.start) % L); }
    return Math.max(0, Math.min(p, this.buffer.duration));
  };
  Deck.prototype.curBpm = function () { return this.bpm ? this.bpm * this.rate : 0; };
  Deck.prototype.stopMedia = function () { if (this.media) { try { this.media.el.pause(); this.media.el.src = ''; this.media.node && this.media.node.disconnect(); } catch (e) {} this.media = null; } };
  Deck.prototype.load = function (buf, title, bpm, phase) {
    this.stop(); this.stopMedia(); this.buffer = buf; this.title = title || 'Utwór'; this.pos0 = 0; this.cuePt = 0; this.loop = null; this.hot = [null, null, null, null]; this.ended = false;
    this.peaks = peaks(buf, 1000);
    if (bpm) { this.bpm = bpm; this.phase = phase || 0; } else { var d = detectBpm(buf); this.bpm = d.bpm; this.phase = d.phase; }
    E.emit('deck', this);
  };
  Deck.prototype.loadStream = function (url, title) {
    this.stop(); this.stopMedia(); this.buffer = null; this.peaks = null; this.bpm = 0; this.title = '📻 ' + title; var self = this;
    var el = new Audio(); el.crossOrigin = 'anonymous'; el.preload = 'none'; el.src = url; var m = { el: el, node: null, direct: false };
    this.media = m;
    try { m.node = ctx.createMediaElementSource(el); m.node.connect(this.trim); } catch (e) {}
    el.addEventListener('error', function () {
      if (self.media !== m || m.direct) return; // retry without CORS: plays directly (outside the mixer FX)
      m.direct = true; try { m.node && m.node.disconnect(); } catch (e) {}
      var el2 = new Audio(); el2.src = url; el2.volume = self.fader.gain.value; m.el = el2; el2.play().catch(function () {});
      E.emit('toast', 'Stacja nie pozwala na miksowanie (CORS) — gra bezpośrednio, bez EQ/FX. Głośność = fader ' + self.name + '.');
    });
    this.playing = true; el.play().catch(function (e) { E.emit('toast', 'Radio: ' + (e && e.message || 'błąd')); });
    E.emit('deck', this);
  };
  Deck.prototype.startSrc = function (when, pos) {
    var s = ctx.createBufferSource(); s.buffer = this.buffer; s.playbackRate.value = this.rate;
    if (this.loop) { s.loop = true; s.loopStart = this.loop.start; s.loopEnd = this.loop.end; }
    s.connect(this.trim); s.start(when, pos); this.src = s; this.t0 = when; this.pos0 = pos; this.playing = true; this.ended = false;
    var self = this; s.onended = function () { if (self.src === s && self.playing && !self.loop) { self.playing = false; self.pos0 = self.buffer.duration; self.ended = true; E.emit('deck', self); E.emit('ended', self); } };
  };
  Deck.prototype.play = function () {
    E.init();
    if (this.media) { if (this.media.el.paused) this.media.el.play(); this.playing = true; E.emit('deck', this); return; }
    if (!this.buffer || this.playing) return; var p = this.position(); if (p >= this.buffer.duration - .05) p = 0;
    this.startSrc(ctx.currentTime + .01, p); E.emit('deck', this);
  };
  Deck.prototype.stop = function () {
    if (this.media) { this.media.el.pause(); this.playing = false; E.emit('deck', this); return; }
    if (!this.src) { this.playing = false; return; } var p = this.position(); var s = this.src; this.src = null; try { s.stop(); } catch (e) {} this.playing = false; this.pos0 = p; E.emit('deck', this);
  };
  Deck.prototype.toggle = function () { if (this.playing) this.stop(); else this.play(); };
  Deck.prototype.seek = function (p) {
    if (!this.buffer) return; p = Math.max(0, Math.min(this.buffer.duration - .01, p));
    if (this.loop && (p < this.loop.start || p > this.loop.end)) this.loop = null;
    if (this.playing) { var s = this.src; this.src = null; try { s.stop(); } catch (e) {} this.startSrc(ctx.currentTime + .005, p); } else this.pos0 = p; E.emit('deck', this);
  };
  Deck.prototype.cue = function () { if (!this.buffer) return; if (this.playing) { this.stop(); this.seek(this.cuePt); } else this.cuePt = this.position(); E.emit('deck', this); };
  Deck.prototype.hotcue = function (k, clear) { if (clear) this.hot[k] = null; else if (this.hot[k] == null) this.hot[k] = this.position(); else { this.seek(this.hot[k]); if (!this.playing) this.play(); } E.emit('deck', this); };
  Deck.prototype.setPitch = function (pct) {
    this.pitch = pct; var r = 1 + pct / 100; if (this.playing && this.src) { this.pos0 = this.position(); this.t0 = ctx.currentTime; this.src.playbackRate.setValueAtTime(r, ctx.currentTime); }
    this.rate = r; if (this.media && this.media.el) this.media.el.playbackRate = r; E.emit('deck', this);
  };
  Deck.prototype.nudge = function (d) { var self = this, base = this.pitch; this.setPitch(base + d); setTimeout(function () { self.setPitch(base); }, 250); };
  Deck.prototype.beatLen = function () { return this.bpm ? 60 / this.bpm : E.beatLen(); };
  Deck.prototype.setLoop = function (beats) {
    if (!this.buffer) return; if (!beats) { this.loop = null; if (this.src) this.src.loop = false; E.emit('deck', this); return; }
    var bl = this.beatLen(), p = this.position(), st = this.bpm ? this.phase + Math.floor((p - this.phase) / bl) * bl : p; if (st < 0) st = 0;
    var en = Math.min(this.buffer.duration, st + beats * bl); this.loop = { start: st, end: en, beats: beats };
    if (this.playing) { var s = this.src; this.src = null; try { s.stop(); } catch (e) {} this.startSrc(ctx.currentTime + .005, Math.max(st, Math.min(p, en - .01))); }
    E.emit('deck', this);
  };
  Deck.prototype.loopScale = function (f) { if (this.loop) this.setLoopFrom(this.loop.start, this.loop.beats * f); };
  Deck.prototype.setLoopFrom = function (st, beats) { beats = Math.max(1 / 8, Math.min(64, beats)); var p = this.position(); this.loop = { start: st, end: Math.min(this.buffer.duration, st + beats * this.beatLen()), beats: beats };
    if (this.playing) { var s = this.src; this.src = null; try { s.stop(); } catch (e) {} var q = p >= this.loop.end ? this.loop.start : p; this.startSrc(ctx.currentTime + .005, q); } E.emit('deck', this); };
  Deck.prototype.sync = function () { // tempo + phase to other deck (if playing with bpm) else to global clock
    if (!this.bpm) { E.emit('toast', 'Deck ' + this.name + ': brak BPM (radio) — użyj TAP.'); return; }
    var o = E.decks[1 - this.i], target, refPhaseBeats;
    if (o.playing && o.bpm && o.buffer) { target = o.curBpm(); refPhaseBeats = ((o.position() - o.phase) / o.beatLen()) % 1; }
    else { target = E.clock.bpm; refPhaseBeats = E.beatPos() % 1; }
    var pct = [target, target / 2, target * 2].map(function (t) { return (t / this.bpm - 1) * 100; }, this).sort(function (a, b) { return Math.abs(a) - Math.abs(b); })[0];
    this.setPitch(Math.round(pct * 100) / 100);
    if (this.playing && this.buffer) { var bl = this.beatLen(), p = this.position(), myPh = ((p - this.phase) / bl) % 1, d = refPhaseBeats - myPh; if (d > .5) d -= 1; if (d < -.5) d += 1; this.seek(p + d * bl); }
    E.emit('toast', 'SYNC ' + this.name + ' → ' + target.toFixed(1) + ' BPM');
  };
  Deck.prototype.eq = function (band, db) { this[band].gain.setTargetAtTime(db, ctx.currentTime, .02); };
  Deck.prototype.filter = function (v) { // -1 LP .. 0 off .. +1 HP
    var t = ctx.currentTime; if (v < -0.02) { this.flp.frequency.setTargetAtTime(20000 * Math.pow(0.004, -v), t, .02); this.fhp.frequency.setTargetAtTime(10, t, .02); }
    else if (v > 0.02) { this.fhp.frequency.setTargetAtTime(10 * Math.pow(600, v), t, .02); this.flp.frequency.setTargetAtTime(22000, t, .02); }
    else { this.flp.frequency.setTargetAtTime(22000, t, .02); this.fhp.frequency.setTargetAtTime(10, t, .02); }
  };
  Deck.prototype.setFader = function (v) { this.fader.gain.setTargetAtTime(v, ctx.currentTime, .01); if (this.media && this.media.direct) this.media.el.volume = Math.min(1, v); };
  Deck.prototype.level = function () { var a = new Uint8Array(this.an.fftSize); this.an.getByteTimeDomainData(a); var m = 0; for (var i = 0; i < a.length; i++) { var x = Math.abs(a[i] - 128); if (x > m) m = x; } return m / 128; };
  Deck.prototype.tick = function () { };
  E.Deck = Deck;

  function peaks(buf, n) { var d0 = buf.getChannelData(0), d1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : d0, step = Math.floor(d0.length / n), out = new Float32Array(n);
    for (var i = 0; i < n; i++) { var m = 0, s = i * step; for (var j = 0; j < step; j += 16) { var x = Math.abs(d0[s + j]) + Math.abs(d1[s + j]); if (x > m) m = x; } out[i] = m / 2; } return out; }
  function detectBpm(buf) { // onset envelope + autocorrelation (70..180), phase by comb
    var sr = buf.sampleRate, d = buf.getChannelData(0), hop = 512, n = Math.min(Math.floor(d.length / hop), Math.floor(90 * sr / hop)), off = Math.floor(Math.min(d.length / 4, 20 * sr) / hop);
    if (d.length / hop < n + off) off = 0; n = Math.min(n, Math.floor(d.length / hop) - off);
    if (n < 200) return { bpm: 0, phase: 0 };
    var env = new Float32Array(n), lp = 0, prev = 0;
    for (var i = 0; i < n; i++) { var e = 0, s = (i + off) * hop; for (var j = 0; j < hop; j++) { lp += (d[s + j] - lp) * .02; e += lp * lp; } e = Math.sqrt(e / hop); env[i] = Math.max(0, e - prev); prev = e; }
    var fps = sr / hop, best = 0, bestLag = 0;
    for (var bpm = 70; bpm <= 180; bpm += .5) { var lag = fps * 60 / bpm, sc = 0; for (i = 0; i + lag * 2 < n; i++) { sc += env[i] * (interp(env, i + lag) + .5 * interp(env, i + lag * 2)); } if (sc > best) { best = sc; bestLag = lag; } }
    var bp = 60 * fps / bestLag; while (bp < 85) bp *= 2; while (bp > 175) bp /= 2; bp = Math.round(bp * 10) / 10;
    var per = fps * 60 / bp, bestP = 0, bs = -1; for (var ph = 0; ph < per; ph++) { var s2 = 0; for (var k = ph; k < n; k += per) s2 += env[Math.floor(k)]; if (s2 > bs) { bs = s2; bestP = ph; } }
    var phase = ((bestP + off) / fps) % (60 / bp);
    return { bpm: bp, phase: phase };
  }
  function interp(a, x) { var i = Math.floor(x), f = x - i; return i + 1 < a.length ? a[i] * (1 - f) + a[i + 1] * f : 0; }
  E.detectBpm = detectBpm;

  // ---------- FX unit (insert on master: dry + wet) ----------
  var FX_TYPES = ['Echo', 'Reverb', 'Flanger', 'Phaser', 'Filter LFO', 'Crush', 'Roll', 'Trans', 'Spiral', 'Noise'];
  E.FX_TYPES = FX_TYPES;
  function FxUnit(n) {
    this.n = n; this.input = ctx.createGain(); this.output = ctx.createGain(); this.dry = ctx.createGain(); this.wet = ctx.createGain(); this.wet.gain.value = 0;
    this.input.connect(this.dry); this.dry.connect(this.output); this.wet.connect(this.output);
    this.type = n === 1 ? 'Echo' : 'Reverb'; this.on = false; this.level = .6; this.depth = .5; this.beats = 1; this.node = null; this.build();
  }
  FxUnit.prototype.build = function () {
    if (this.node) { try { this.input.disconnect(this.node.in); } catch (e) {} this.node.out.disconnect(); (this.node.stop || function () {})(); }
    this.node = makeFx(this.type, this.depth, this.beats * E.beatLen()); this.input.connect(this.node.in); this.node.out.connect(this.wet); this.apply();
  };
  FxUnit.prototype.apply = function () {
    var t = ctx.currentTime, full = this.type === 'Roll' || this.type === 'Trans';
    this.wet.gain.setTargetAtTime(this.on ? this.level * (full ? 1 : 1) : 0, t, .015);
    this.dry.gain.setTargetAtTime(this.on && full ? 1 - this.level : 1, t, .015);
  };
  FxUnit.prototype.set = function (k, v) { this[k] = v; if (k === 'type' || k === 'beats' || k === 'depth') { if (k === 'depth' && this.node.depth) { this.node.depth(v); } else if (k === 'beats' && this.node.time) { this.node.time(this.beats * E.beatLen()); } else this.build(); } else this.apply(); E.emit('fx', this); };
  FxUnit.prototype.retime = function () { if (this.node && this.node.time) this.node.time(this.beats * E.beatLen()); };
  function lfo(f, amt, type) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = amt; o.connect(g); o.start(); return { o: o, g: g }; }
  function makeFx(type, depth, T) {
    var c = ctx, i = c.createGain(), o = c.createGain(), x;
    switch (type) {
      case 'Echo': { var d = c.createDelay(4), fb = c.createGain(), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 200; d.delayTime.value = Math.min(3.9, T * .75); fb.gain.value = .25 + depth * .65; i.connect(d); d.connect(f); f.connect(fb); fb.connect(d); f.connect(o);
        return { in: i, out: o, time: function (t) { d.delayTime.setTargetAtTime(Math.min(3.9, t * .75), c.currentTime, .05); }, depth: function (v) { fb.gain.value = .25 + v * .65; } }; }
      case 'Reverb': { var cv = c.createConvolver(); cv.buffer = G.impulse(c, .8 + depth * 5, 2.5); i.connect(cv); cv.connect(o); return { in: i, out: o }; }
      case 'Flanger': { var fd = c.createDelay(.05), ffb = c.createGain(); fd.delayTime.value = .004; ffb.gain.value = .5 + depth * .4; x = lfo(1 / (T * 4), .003); x.g.connect(fd.delayTime); i.connect(fd); fd.connect(ffb); ffb.connect(fd); fd.connect(o); i.connect(o);
        return { in: i, out: o, stop: function () { x.o.stop(); }, time: function (t) { x.o.frequency.value = 1 / (t * 4); }, depth: function (v) { ffb.gain.value = .5 + v * .4; } }; }
      case 'Phaser': { var last = i, aps = []; x = lfo(1 / (T * 2), 700 + depth * 1500); for (var k = 0; k < 6; k++) { var ap = c.createBiquadFilter(); ap.type = 'allpass'; ap.frequency.value = 900; ap.Q.value = .6; x.g.connect(ap.frequency); last.connect(ap); last = ap; aps.push(ap); } last.connect(o); i.connect(o);
        return { in: i, out: o, stop: function () { x.o.stop(); }, time: function (t) { x.o.frequency.value = 1 / (t * 2); } }; }
      case 'Filter LFO': { var bf = c.createBiquadFilter(); bf.type = 'lowpass'; bf.Q.value = 4 + depth * 12; bf.frequency.value = 1200; x = lfo(1 / T, 1000); x.g.connect(bf.frequency); i.connect(bf); bf.connect(o);
        return { in: i, out: o, stop: function () { x.o.stop(); }, time: function (t) { x.o.frequency.value = 1 / t; }, depth: function (v) { bf.Q.value = 4 + v * 12; } }; }
      case 'Crush': { var ws = c.createWaveShaper(); var bits = Math.round(2 + (1 - depth) * 8), lv = Math.pow(2, bits), n = 4096, cu = new Float32Array(n); for (var q = 0; q < n; q++) { var xx = q * 2 / n - 1; cu[q] = Math.round(xx * lv) / lv; } ws.curve = cu; var cl = c.createBiquadFilter(); cl.type = 'lowpass'; cl.frequency.value = 2000 + (1 - depth) * 8000; i.connect(ws); ws.connect(cl); cl.connect(o); return { in: i, out: o }; }
      case 'Roll': { var rd = c.createDelay(4), rfb = c.createGain(); rd.delayTime.value = Math.min(3.9, T / 2); rfb.gain.value = .9 + depth * .09; i.connect(rd); rd.connect(rfb); rfb.connect(rd); rd.connect(o); var ig = c.createGain(); ig.gain.value = 1; // capture briefly then let it repeat
        return { in: i, out: o, time: function (t) { rd.delayTime.setValueAtTime(Math.min(3.9, t / 2), c.currentTime); } }; }
      case 'Trans': { var tg = c.createGain(); tg.gain.value = .5; x = lfo(2 / T, .5, 'square'); x.g.connect(tg.gain); i.connect(tg); tg.connect(o); return { in: i, out: o, stop: function () { x.o.stop(); }, time: function (t) { x.o.frequency.value = 2 / t; } }; }
      case 'Spiral': { var sd = c.createDelay(4), sfb = c.createGain(), sf = c.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1500; sd.delayTime.value = Math.min(3.9, T / 4); sfb.gain.value = .6 + depth * .3; x = lfo(1 / (T * 4), 1200); x.g.connect(sf.frequency); i.connect(sd); sd.connect(sf); sf.connect(sfb); sfb.connect(sd); sf.connect(o);
        return { in: i, out: o, stop: function () { x.o.stop(); }, time: function (t) { sd.delayTime.setTargetAtTime(Math.min(3.9, t / 4), c.currentTime, .05); } }; }
      case 'Noise': { var ns = c.createBufferSource(), nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0); for (var z = 0; z < nd.length; z++) nd[z] = Math.random() * 2 - 1; ns.buffer = nb; ns.loop = true; var nf = c.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 500 + depth * 6000; var ng = c.createGain(); ng.gain.value = .25; ns.connect(nf); nf.connect(ng); ng.connect(o); ns.start(); i.connect(o);
        return { in: i, out: o, stop: function () { ns.stop(); } }; }
    }
    i.connect(o); return { in: i, out: o };
  }

  // ---------- 40 loop pads (8 columns x 5 rows, column = exclusive group) ----------
  var COLORS = ['#ff3d7f', '#ffb020', '#3dff9e', '#25c8ff', '#a26bff', '#ff6bd5', '#f5ff3d', '#ffffff'];
  function Pads() {
    this.pads = []; for (var i = 0; i < 40; i++) this.pads.push({ i: i, col: i % 8, row: Math.floor(i / 8), buffer: null, bpm: 0, name: '', color: COLORS[i % 8], on: false, pending: false, src: null, g: null, vol: 1, oneShot: false });
    this.sync = true; this.exclusive = true;
    this.out = ctx.createGain(); this.out.gain.value = .9;
    this.flt = ctx.createBiquadFilter(); this.flt.type = 'lowpass'; this.flt.frequency.value = 20000; this.flt.Q.value = 1;
    this.cols = []; for (var c = 0; c < 8; c++) { var g = ctx.createGain(); g.connect(this.flt); this.cols.push(g); }
    this.flt.connect(this.out); this.out.connect(E.bus);
  }
  Pads.prototype.trigger = function (i) {
    var p = this.pads[i]; if (!p.buffer) { E.emit('padEmpty', p); return; }
    if (p.on || p.pending) { this.stopPad(p); return; }
    if (this.exclusive) this.pads.forEach(function (q) { if (q !== p && q.col === p.col && (q.on || q.pending)) this.stopPad(q, true); }, this);
    var when = this.sync && !p.oneShot ? E.nextBar() : ctx.currentTime + .005, rate = p.bpm ? E.clock.bpm / p.bpm : 1;
    var s = ctx.createBufferSource(); s.buffer = p.buffer; s.playbackRate.value = rate; s.loop = !p.oneShot;
    var g = ctx.createGain(); g.gain.value = p.vol; s.connect(g); g.connect(this.cols[p.col]);
    var off = 0; if (this.sync && !p.oneShot) { var beats = E.beatPos(when), loopBeats = p.buffer.duration * rate / E.beatLen(); off = ((beats % loopBeats) + loopBeats) % loopBeats * E.beatLen() / rate; if (off >= p.buffer.duration) off = 0; }
    s.start(when, off); p.src = s; p.g = g; p.pending = when > ctx.currentTime + .03; p.on = !p.pending;
    var self = this; if (p.pending) setTimeout(function () { if (p.src === s) { p.pending = false; p.on = true; E.emit('pads', p); } }, (when - ctx.currentTime) * 1000);
    s.onended = function () { if (p.src === s) { p.on = false; p.pending = false; p.src = null; E.emit('pads', p); } };
    E.emit('pads', p);
  };
  Pads.prototype.stopPad = function (p, atBar) {
    if (!p.src) { p.on = p.pending = false; return; } var s = p.src, g = p.g, t = atBar && this.sync ? E.nextBar() : ctx.currentTime;
    g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + .02); try { s.stop(t + .03); } catch (e) {}
    p.src = null; p.on = false; p.pending = false; E.emit('pads', p);
  };
  Pads.prototype.stopAll = function () { this.pads.forEach(function (p) { this.stopPad(p); }, this); };
  Pads.prototype.retempo = function () { this.pads.forEach(function (p) { if (p.src && p.bpm) p.src.playbackRate.setTargetAtTime(E.clock.bpm / p.bpm, ctx.currentTime, .02); }); };
  Pads.prototype.set = function (i, buf, name, bpm, color) { var p = this.pads[i]; if (p.src) this.stopPad(p); p.buffer = buf; p.name = name; p.bpm = bpm || 0; if (color) p.color = color; E.emit('pads', p); };
  Pads.prototype.cutoff = function (v) { this.flt.frequency.setTargetAtTime(40 * Math.pow(500, v), ctx.currentTime, .02); };
  Pads.prototype.colVol = function (c, v) { this.cols[c].gain.setTargetAtTime(v, ctx.currentTime, .02); };
  Pads.prototype.bounce = function () { // mix active pads into one loop buffer (length = longest, resampled to clock tempo)
    var act = this.pads.filter(function (p) { return p.on && p.buffer; }); if (!act.length) return null;
    var sr = 48000, len = 0; act.forEach(function (p) { var r = p.bpm ? E.clock.bpm / p.bpm : 1; len = Math.max(len, Math.round(p.buffer.duration / r * sr)); });
    var out = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: sr }), colG = this.cols;
    act.forEach(function (p) { var r = p.bpm ? E.clock.bpm / p.bpm : 1, n = Math.round(p.buffer.duration / r * sr), vol = p.vol * colG[p.col].gain.value;
      for (var ch = 0; ch < 2; ch++) { var s = p.buffer.getChannelData(Math.min(ch, p.buffer.numberOfChannels - 1)), d = out.getChannelData(ch), ratio = p.buffer.sampleRate * r / sr;
        for (var i = 0; i < len; i++) { var x = ((i % n) * ratio), k = Math.floor(x), f = x - k; if (k + 1 < s.length) d[i] += (s[k] * (1 - f) + s[k + 1] * f) * vol; } } });
    return G.normalize(out);
  };
  E.PAD_COLORS = COLORS;

  // ---------- Auto-DJ ----------
  E.autodj = { on: false, queue: [], mixSec: 12, gen: true, busy: false, fading: null,
    tick: function () {
      var A = this; if (!A.on || !ctx || A.busy) return;
      var live = E.decks.filter(function (d) { return d.playing && d.buffer; });
      if (!live.length) { A.next(0); return; }
      var cur = live[live.length - 1], left = (cur.buffer.duration - cur.position()) / cur.rate;
      if (live.length === 1 && left < A.mixSec + 2 && !A.fading) A.next(1 - cur.i, cur);
    },
    next: function (deckIdx, from) {
      var A = this; A.busy = true;
      var item = A.queue.shift(), p;
      if (item) p = Promise.resolve(item.buffer ? item : item.make());
      else if (A.gen) { var pr = G.PRESETS.filter(function (x) { return x.mode === 'track'; }); var pk = pr[Math.floor(Math.random() * pr.length)]; E.emit('toast', 'Auto-DJ generuje: ' + pk.name); p = G.renderPreset(pk); }
      else { A.busy = false; A.on = false; E.emit('autodj', A); E.emit('toast', 'Auto-DJ: kolejka pusta.'); return; }
      p.then(function (it) {
        var d = E.decks[deckIdx]; d.load(it.buffer, it.name, it.bpm, it.phase || 0);
        if (from && from.bpm) { var pct = (from.curBpm() / d.bpm - 1) * 100; if (Math.abs(pct) <= 12) d.setPitch(pct); else d.setPitch(0); }
        d.setFader(.85); d.play(); if (from) setTimeout(function () { d.sync(); }, 60);
        if (from) A.fade(from, d); else { E.xfader(deckIdx ? 1 : -1); E.emit('xf', E.xf); }
        A.busy = false; E.emit('autodj', A);
      }).catch(function (e) { A.busy = false; E.emit('toast', 'Auto-DJ błąd: ' + e.message); });
    },
    fade: function (from, to) {
      var A = this, start = performance.now(), dur = A.mixSec * 1000, x0 = E.xf, x1 = to.i ? 1 : -1;
      A.fading = setInterval(function () { var k = Math.min(1, (performance.now() - start) / dur); E.xfader(x0 + (x1 - x0) * k); E.emit('xf', E.xf);
        // bass swap halfway
        from.eq('lo', k > .5 ? -26 : 0); to.eq('lo', k < .5 ? -26 : 0);
        if (k >= 1) { clearInterval(A.fading); A.fading = null; from.stop(); from.eq('lo', 0); to.eq('lo', 0); E.emit('autodj', A); } }, 50);
    }
  };

  // ---------- MIDI (Roland MC-707 & any controller) ----------
  E.midi = { access: null, map: JSON.parse(localStorage.getItem('d7s-midimap') || '{}'), learn: null, clockOut: false, clockIn: true, nextTick: 0, ticks: [], log: [],
    init: function () {
      var M = this; if (!navigator.requestMIDIAccess) { E.emit('toast', 'Web MIDI niedostępne w tej przeglądarce (działa w Chrome/Edge i w aplikacji Windows).'); return Promise.resolve(null); }
      return navigator.requestMIDIAccess({ sysex: false }).then(function (a) { M.access = a; a.inputs.forEach(function (i) { i.onmidimessage = M.onMsg.bind(M); }); a.onstatechange = function () { a.inputs.forEach(function (i) { i.onmidimessage = M.onMsg.bind(M); }); E.emit('midi', M); }; E.emit('midi', M); return a; })
        .catch(function (e) { E.emit('toast', 'MIDI: ' + e.message); });
    },
    onMsg: function (ev) {
      var d = ev.data, st = d[0] & 0xf0, M = this;
      if (d[0] === 0xF8 && M.clockIn) { M.ticks.push(ev.timeStamp); if (M.ticks.length > 49) M.ticks.shift(); if (M.ticks.length === 49) { var bpm = 60000 / ((M.ticks[48] - M.ticks[0]) / 48 * 24); if (Math.abs(bpm - E.clock.bpm) > .5) E.setBpm(Math.round(bpm * 10) / 10); } return; }
      if (d[0] >= 0xF8) return;
      var key = (st === 0xB0 ? 'cc' : 'n') + (d[0] & 15) + ':' + d[1];
      M.log.unshift(key + ' = ' + (d[2] || 0)); if (M.log.length > 8) M.log.pop(); E.emit('midilog', M);
      if (M.learn && (st === 0xB0 || (st === 0x90 && d[2] > 0))) { M.map[key] = M.learn; localStorage.setItem('d7s-midimap', JSON.stringify(M.map)); E.emit('toast', 'MIDI: ' + key + ' → ' + M.learn); M.learn = null; E.emit('midi', M); return; }
      if (M.map[key]) { E.emit('midiCtl', { id: M.map[key], v: st === 0xB0 ? d[2] / 127 : 1, note: st === 0x90 }); return; }
      if (st === 0x90 && d[2] > 0) { var pi = d[1] - 36; if (pi >= 0 && pi < 40) E.pads.trigger(pi); }
    },
    clockTick: function () {
      var M = this; if (!M.clockOut || !M.access || !ctx) return; var now = performance.now(), iv = 60000 / E.clock.bpm / 24;
      if (M.nextTick < now) M.nextTick = now; var outs = []; M.access.outputs.forEach(function (o) { outs.push(o); });
      while (M.nextTick < now + 60) { outs.forEach(function (o) { try { o.send([0xF8], M.nextTick); } catch (e) {} }); M.nextTick += iv; }
    },
    transport: function (start) { if (!this.access) return; this.access.outputs.forEach(function (o) { try { o.send([start ? 0xFA : 0xFC]); } catch (e) {} }); }
  };

  // ---------- master recorder (audio) ----------
  E.rec = { r: null, chunks: [], t0: 0,
    start: function () { var R = this; if (!window.MediaRecorder) { E.emit('toast', 'Nagrywanie niedostępne w tej przeglądarce.'); return; }
      var mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
      R.r = new MediaRecorder(E.recDest.stream, mt ? { mimeType: mt, audioBitsPerSecond: ((window.D7S_SETTINGS && +window.D7S_SETTINGS.abps) || 256) * 1000 } : {}); R.chunks = []; R.r.ondataavailable = function (e) { if (e.data.size) R.chunks.push(e.data); };
      R.r.onstop = function () { var b = new Blob(R.chunks, { type: (R.r.mimeType || 'audio/webm').split(';')[0] }); E.save(b, 'D7S-mix-' + stamp() + (/mp4/.test(b.type) ? '.m4a' : /ogg/.test(b.type) ? '.ogg' : '.webm')); R.r = null; E.emit('rec', R); };
      R.r.start(1000); R.t0 = Date.now(); E.emit('rec', R); },
    stop: function () { if (this.r) this.r.stop(); }
  };
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }
  E.stamp = stamp;
  // save blob: Android bridge > Electron/desktop download > browser download
  E.save = function (blob, name) {
    if (window.D7Native && D7Native.saveFile) { var fr = new FileReader(); fr.onload = function () { var r = D7Native.saveFile(name, String(fr.result).split(',')[1], blob.type || 'application/octet-stream'); E.emit('toast', r || ('Zapisano: ' + name)); }; fr.readAsDataURL(blob); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
    E.emit('toast', 'Zapisano: ' + name + ' (' + (blob.size / 1048576).toFixed(1) + ' MB)');
  };
  E.decodeFile = function (file) { E.init(); return file.arrayBuffer().then(function (ab) { return ctx.decodeAudioData(ab); }); };

  window.D7S = E;
})();
