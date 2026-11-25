/* Kosmos Sounds · D DJ X · v1.0
 * Oryginalny generator dźwięków kosmosu (WebAudio).
 * Wszystko syntezowane proceduralnie — bez sampli z YouTube i bez cudzych nagrań.
 * Hybrid Magic = silnik regułowy (nie model AI): łączy warstwy Kosmos z bębnami/basem.
 * Paczka Launch: brzmienia inspirowane startem rakiety, w całości proceduralne.
 * Brak plików SpaceX (ich media nie są domeną publiczną) i brak sampli z YouTube.
 */
(function (root) {
  'use strict';

  var VERSION = '1.0.0';
  var SOUNDS = [
    { id: 'drone',  name: 'Drone',       pl: 'Drone · głębia',   kind: 'cont', defDiv: 1 },
    { id: 'pulsar', name: 'Pulsar',      pl: 'Pulsar · klik',    kind: 'shot', defDiv: 16 },
    { id: 'wind',   name: 'Star Wind',   pl: 'Wiatr gwiazd',     kind: 'cont', defDiv: 4 },
    { id: 'signal', name: 'Signal',      pl: 'Sygnał radiowy',   kind: 'shot', defDiv: 8 },
    { id: 'sweep',  name: 'Sweep',       pl: 'Obcy sweep',       kind: 'shot', defDiv: 4 },
    { id: 'hole',   name: 'Black Hole',  pl: 'Czarna dziura',    kind: 'shot', defDiv: 1 }
  ];
  var LAUNCH_SOUNDS = [
    { id: 'count',  name: 'Countdown',   pl: 'Countdown · beep',     kind: 'shot', defDiv: 4 },
    { id: 'ignite', name: 'Ignition',    pl: 'Zapłon · rumble',      kind: 'shot', defDiv: 1 },
    { id: 'roar',   name: 'Engine Roar', pl: 'Ryk silnika',          kind: 'cont', defDiv: 4 },
    { id: 'sep',    name: 'Separation',  pl: 'Separacja stopnia',    kind: 'shot', defDiv: 1 },
    { id: 'boom',   name: 'Sonic Boom',  pl: 'Tłum akustyczny',      kind: 'shot', defDiv: 1 },
    { id: 'mars',   name: 'Mars Wind',   pl: 'Wiatr na Marsie',      kind: 'cont', defDiv: 4 },
    { id: 'comms',  name: 'Comms',       pl: 'Radio / static',       kind: 'shot', defDiv: 8 }
  ];
  function allMeta() { return SOUNDS.concat(LAUNCH_SOUNDS); }
  function metaById(id) { return allMeta().filter(function (s) { return s.id === id; })[0]; }
  var DIVS = [1, 4, 8, 16];
  var LICENSE = 'Wszystkie dźwięki są syntezowane w przeglądarce. Brak sampli z YouTube. Paczka Launch jest inspirowana startem rakiety — to nie są nagrania SpaceX (materiały SpaceX nie są domeną publiczną). Nie wgrano plików audio NASA; nagrania NASA z wyraźną domeną publiczną można dodać później z atrybucją.';
  var PRESETS = {
    'Kosmos Techno': {
      pack: 'kosmos', bpm: 128, level: 0.5,
      sounds: {
        drone:  { on: true,  div: 1,  level: 0.55, offset: 0 },
        pulsar: { on: true,  div: 16, level: 0.72, offset: 0 },
        wind:   { on: true,  div: 4,  level: 0.22, offset: 0 },
        signal: { on: true,  div: 8,  level: 0.55, offset: 2 },
        sweep:  { on: true,  div: 1,  level: 0.4,  offset: 8 },
        hole:   { on: true,  div: 4,  level: 0.62, offset: 0 }
      }
    },
    'Pulsar Minimal': {
      pack: 'kosmos', bpm: 124, level: 0.46,
      sounds: {
        drone:  { on: true,  div: 1,  level: 0.48, offset: 0 },
        pulsar: { on: true,  div: 8,  level: 0.7,  offset: 2 },
        wind:   { on: true,  div: 1,  level: 0.18, offset: 0 },
        signal: { on: true,  div: 1,  level: 0.45, offset: 12 },
        sweep:  { on: false, div: 1,  level: 0.3,  offset: 8 },
        hole:   { on: true,  div: 1,  level: 0.7,  offset: 0 }
      }
    },
    'Deep Space Ambient': {
      pack: 'kosmos', bpm: 120, level: 0.52,
      sounds: {
        drone:  { on: true,  div: 1,  level: 0.7,  offset: 0 },
        pulsar: { on: true,  div: 1,  level: 0.28, offset: 0 },
        wind:   { on: true,  div: 4,  level: 0.4,  offset: 0 },
        signal: { on: true,  div: 1,  level: 0.35, offset: 8 },
        sweep:  { on: true,  div: 1,  level: 0.38, offset: 0 },
        hole:   { on: true,  div: 1,  level: 0.55, offset: 0 }
      }
    },
    'Launch Sequence': {
      pack: 'launch', bpm: 120, level: 0.52,
      sounds: {
        count:  { on: true,  div: 4,  level: 0.72, offset: 0 },
        ignite: { on: true,  div: 1,  level: 0.8,  offset: 0, everyBars: 4 },
        roar:   { on: true,  div: 4,  level: 0.58, offset: 0 },
        sep:    { on: true,  div: 1,  level: 0.62, offset: 8, everyBars: 2 },
        boom:   { on: true,  div: 1,  level: 0.7,  offset: 12, everyBars: 4 },
        mars:   { on: true,  div: 4,  level: 0.28, offset: 0 },
        comms:  { on: true,  div: 8,  level: 0.48, offset: 2 }
      }
    }
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function noiseBuf(ctx, sec) {
    var n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, w;
    for (var i = 0; i < n; i++) {
      w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      d[i] = (b0 + b1 + b2 + w * 0.268) * 0.22;
    }
    return b;
  }
  function hits(step, div, offset) {
    var s = ((step % 16) + 16) % 16, off = offset || 0;
    if (div <= 1) return s === off;
    var period = 16 / div;
    if (period < 1) period = 1;
    return ((s - off) % period + period) % period === 0;
  }
  function accent(step, div) {
    var s = ((step % 16) + 16) % 16;
    if (div >= 16) return s % 4 === 0 ? 1 : s % 2 === 0 ? 0.7 : 0.45;
    if (div === 8) return s % 4 === 0 ? 1 : 0.65;
    return s === 0 ? 1 : 0.75;
  }
  function defSounds() {
    var o = {};
    allMeta().forEach(function (s) { o[s.id] = { on: false, div: s.defDiv, level: 0.6, offset: 0, everyBars: 1 }; });
    return o;
  }

  function KosmosEngine() {
    this.bpm = 128;
    this.level = 0.5;
    this.running = false;
    this.enabled = false;
    this.preset = 'Kosmos Techno';
    this.pack = 'kosmos';
    this.sounds = defSounds();
    this.ctx = null;
    this.master = null;
    this.t0 = 0;
    this.step = 0;
    this.nextTime = null;
    this._timer = null;
    this._ownClock = false;
    this._voices = {};
    this._noise = null;
    this.onStep = null;
    this.loadPreset('Kosmos Techno', { keepBpm: true, silent: true });
  }

  KosmosEngine.prototype.attach = function (ctx, dest) {
    if (this.ctx === ctx && this.master) return this;
    this.ctx = ctx;
    this._noise = noiseBuf(ctx, 2.4);
    this.master = ctx.createGain();
    this.master.gain.value = this.level;
    var lp = this._lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 12000; lp.Q.value = 0.7;
    var dly = this._dly = ctx.createDelay(1.2), fb = this._fb = ctx.createGain(), ds = this._ds = ctx.createGain();
    dly.delayTime.value = 0.28; fb.gain.value = 0.22; ds.gain.value = 0.22;
    this.master.connect(lp); lp.connect(dest || ctx.destination);
    lp.connect(ds); ds.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(dest || ctx.destination);
    return this;
  };
  KosmosEngine.prototype.setLevel = function (v) {
    this.level = clamp(+v, 0, 1);
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.level, this.ctx.currentTime, 0.03);
  };
  KosmosEngine.prototype.setBpm = function (b) {
    this.bpm = clamp(Math.round(+b || 128), 60, 200);
    if (this._ownClock && this.running && this.ctx) {
      var dur = 60 / this.bpm / 4, ph = this.nextTime != null ? (this.nextTime - this.t0) / (60 / Math.max(60, this.bpm) / 4) : this.step;
      // keep nextTime aligned to new grid from t0
      var now = this.ctx.currentTime;
      var st = Math.ceil((now - this.t0 + 0.001) / dur);
      this.step = Math.max(0, st);
      this.nextTime = this.t0 + this.step * dur;
      if (this.nextTime < now) { this.step++; this.nextTime += dur; }
    }
    return this.bpm;
  };
  KosmosEngine.prototype.syncOrigin = function (t0) { this.t0 = t0; this.nextTime = null; };
  KosmosEngine.prototype.setPack = function (pack) { if (pack === 'launch' || pack === 'kosmos') this.pack = pack; return this.pack; };
  KosmosEngine.prototype.soundList = function () { return this.pack === 'launch' ? LAUNCH_SOUNDS : SOUNDS; };
  KosmosEngine.prototype.setSound = function (id, patch) {
    if (!this.sounds[id]) return;
    var s = this.sounds[id];
    if (patch.on != null) s.on = !!patch.on;
    if (patch.div != null && DIVS.indexOf(+patch.div) >= 0) s.div = +patch.div;
    if (patch.level != null) s.level = clamp(+patch.level, 0, 1);
    if (patch.offset != null) s.offset = clamp(patch.offset | 0, 0, 15);
    if (patch.everyBars != null) s.everyBars = clamp(patch.everyBars | 0, 1, 16);
    if (this.running && this.ctx) {
      var meta = metaById(id);
      if (s.on && meta && meta.kind === 'cont') this._ensureCont(id, this.ctx.currentTime);
      if (!s.on) this._stopCont(id, this.ctx.currentTime);
    }
  };
  KosmosEngine.prototype.loadPreset = function (name, opt) {
    opt = opt || {};
    var p = PRESETS[name]; if (!p) return false;
    this.preset = name;
    if (!opt.keepBpm) this.setBpm(p.bpm);
    this.setLevel(p.level);
    this.pack = p.pack || 'kosmos';
    var self = this;
    allMeta().forEach(function (s) {
      var src = p.sounds[s.id] || { on: false, div: s.defDiv, level: 0.5, offset: 0, everyBars: 1 };
      self.sounds[s.id] = { on: !!src.on, div: src.div, level: src.level, offset: src.offset || 0, everyBars: src.everyBars || 1 };
    });
    if (this.running && this.ctx && !opt.silent) this._refreshCont(this.ctx.currentTime);
    return true;
  };
  KosmosEngine.prototype.start = function (ownClock) {
    if (!this.ctx) return false;
    if (this.ctx.state !== 'running') this.ctx.resume();
    this.running = true; this.enabled = true;
    var t = this.ctx.currentTime;
    if (this.nextTime == null) {
      if (!this.t0) this.t0 = t + 0.06;
      var dur = 60 / this.bpm / 4;
      var st = Math.ceil((t - this.t0 + 0.02) / dur);
      if (st < 0) st = 0;
      this.step = st;
      this.nextTime = this.t0 + st * dur;
      if (this.nextTime < t) { this.step++; this.nextTime += dur; }
    }
    this._refreshCont(t);
    this._ownClock = !!ownClock;
    if (this._ownClock) {
      var self = this;
      clearInterval(this._timer);
      this._timer = setInterval(function () { self.pump(); }, 20);
      this.pump();
    }
    return true;
  };
  KosmosEngine.prototype.stop = function () {
    this.running = false; this._ownClock = false;
    clearInterval(this._timer); this._timer = null; this.nextTime = null;
    if (this.ctx) this._stopAllCont(this.ctx.currentTime);
  };
  KosmosEngine.prototype.pump = function () {
    if (!this.running || !this._ownClock || !this.ctx) return;
    var now = this.ctx.currentTime, dur = 60 / this.bpm / 4;
    if (this.nextTime == null) this.nextTime = now + 0.04;
    while (this.nextTime < now + 0.12) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += dur;
      this.step++;
    }
  };
  KosmosEngine.prototype.schedule = function (step, t) {
    if (!this.running || !this.ctx || !this.master) return;
    var self = this;
    allMeta().forEach(function (meta) {
      var s = self.sounds[meta.id];
      if (!s || !s.on) return;
      if (s.everyBars && s.everyBars > 1 && (Math.floor(step / 16) % s.everyBars) !== 0) return;
      if (!hits(step, s.div, s.offset)) return;
      var vel = accent(step, s.div) * s.level;
      if (meta.kind === 'cont') self._pulseCont(meta.id, t, vel);
      else self._fire(meta.id, t, vel);
    });
    if (this.onStep) {
      var d = Math.max(0, (t - this.ctx.currentTime) * 1000);
      var st = step;
      setTimeout(function () { try { self.onStep(st); } catch (e) {} }, d);
    }
  };
  KosmosEngine.prototype.trigger = function (id, t, vel) {
    if (!this.ctx || !this.master) return;
    t = t == null ? this.ctx.currentTime : t;
    var meta = metaById(id);
    if (!meta) return;
    if (meta.kind === 'cont') { this._ensureCont(id, t); this._pulseCont(id, t, vel == null ? 0.8 : vel); }
    else this._fire(id, t, vel == null ? 0.8 : vel);
  };
  KosmosEngine.prototype._refreshCont = function (t) {
    var self = this;
    allMeta().forEach(function (meta) {
      if (meta.kind !== 'cont') return;
      var s = self.sounds[meta.id];
      if (self.running && s && s.on) self._ensureCont(meta.id, t);
      else self._stopCont(meta.id, t);
    });
  };
  KosmosEngine.prototype._stopAllCont = function (t) {
    var self = this;
    Object.keys(this._voices).forEach(function (id) { self._stopCont(id, t); });
  };
  KosmosEngine.prototype._ensureCont = function (id, t) {
    if (this._voices[id]) return this._voices[id];
    var ctx = this.ctx, dest = this.master, v;
    if (id === 'drone') {
      var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 41.2;
      var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 41.2 * 1.007;
      var o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 82.4;
      var g3 = ctx.createGain(); g3.gain.value = 0.18;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
      var lfoG = ctx.createGain(); lfoG.gain.value = 0.12;
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 1.8);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 2;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      o1.connect(g); o2.connect(g); o3.connect(g3).connect(g);
      g.connect(lp).connect(dest);
      o1.start(t); o2.start(t); o3.start(t); lfo.start(t);
      v = { osc: [o1, o2, o3, lfo], g: g, pulse: lp };
    } else if (id === 'wind') {
      var src = ctx.createBufferSource(); src.buffer = this._noise; src.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 720; bp.Q.value = 0.7;
      var lfo2 = ctx.createOscillator(); lfo2.type = 'sine'; lfo2.frequency.value = 0.05;
      var lfo2g = ctx.createGain(); lfo2g.gain.value = 480;
      lfo2.connect(lfo2g); lfo2g.connect(bp.frequency);
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 2.4);
      src.connect(bp).connect(g).connect(dest);
      src.start(t); lfo2.start(t);
      v = { osc: [lfo2], src: src, g: g, pulse: bp };
    } else if (id === 'roar') {
      var rs = ctx.createBufferSource(); rs.buffer = this._noise; rs.loop = true;
      var rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 280; rlp.Q.value = 1.4;
      var rbp = ctx.createBiquadFilter(); rbp.type = 'bandpass'; rbp.frequency.value = 180; rbp.Q.value = 1.1;
      var ro1 = ctx.createOscillator(); ro1.type = 'sine'; ro1.frequency.value = 48;
      var ro2 = ctx.createOscillator(); ro2.type = 'sawtooth'; ro2.frequency.value = 54.2;
      var rog = ctx.createGain(); rog.gain.value = 0.08;
      var rlfo = ctx.createOscillator(); rlfo.frequency.value = 0.13;
      var rlfoG = ctx.createGain(); rlfoG.gain.value = 90;
      rlfo.connect(rlfoG); rlfoG.connect(rbp.frequency);
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 1.2);
      rs.connect(rlp).connect(rbp).connect(g); ro1.connect(rog).connect(g); ro2.connect(rog);
      g.connect(dest);
      rs.start(t); ro1.start(t); ro2.start(t); rlfo.start(t);
      v = { osc: [ro1, ro2, rlfo], src: rs, g: g, pulse: rbp, base: 0.22 };
    } else if (id === 'mars') {
      var ms = ctx.createBufferSource(); ms.buffer = this._noise; ms.loop = true;
      var mhp = ctx.createBiquadFilter(); mhp.type = 'highpass'; mhp.frequency.value = 220;
      var mbp = ctx.createBiquadFilter(); mbp.type = 'bandpass'; mbp.frequency.value = 560; mbp.Q.value = 0.55;
      var mlfo = ctx.createOscillator(); mlfo.frequency.value = 0.04;
      var mlfoG = ctx.createGain(); mlfoG.gain.value = 260;
      mlfo.connect(mlfoG); mlfoG.connect(mbp.frequency);
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 2.8);
      ms.connect(mhp).connect(mbp).connect(g).connect(dest);
      ms.start(t); mlfo.start(t);
      v = { osc: [mlfo], src: ms, g: g, pulse: mbp, base: 0.14 };
    } else return null;
    this._voices[id] = v;
    return v;
  };
  KosmosEngine.prototype._stopCont = function (id, t) {
    var v = this._voices[id]; if (!v) return;
    try { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, 0.25); } catch (e) {}
    var stopAt = t + 1.2;
    (v.osc || []).forEach(function (o) { try { o.stop(stopAt); } catch (e) {} });
    if (v.src) try { v.src.stop(stopAt); } catch (e) {}
    delete this._voices[id];
  };
  KosmosEngine.prototype._pulseCont = function (id, t, vel) {
    var v = this._ensureCont(id, t); if (!v) return;
    var base = v.base || (id === 'drone' ? 0.2 : id === 'roar' ? 0.22 : id === 'mars' ? 0.14 : 0.16);
    var peak = base + vel * 0.14;
    try {
      v.g.gain.setValueAtTime(base, t);
      v.g.gain.linearRampToValueAtTime(peak, t + 0.03);
      v.g.gain.exponentialRampToValueAtTime(Math.max(0.0008, base), t + 0.35);
    } catch (e) {}
    if (id === 'wind' && v.pulse) {
      try { v.pulse.frequency.setValueAtTime(480 + vel * 900, t); v.pulse.frequency.exponentialRampToValueAtTime(700, t + 0.4); } catch (e) {}
    }
    if (id === 'roar' && v.pulse) {
      try { v.pulse.frequency.setValueAtTime(140 + vel * 220, t); v.pulse.frequency.exponentialRampToValueAtTime(180, t + 0.35); } catch (e) {}
    }
  };
  KosmosEngine.prototype._fire = function (id, t, vel) {
    var ctx = this.ctx, dest = this.master, v = vel || 0.6;
    if (id === 'pulsar') {
      var src = ctx.createBufferSource(); src.buffer = this._noise;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800; hp.Q.value = 0.8;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 3.2;
      var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      src.connect(hp).connect(bp).connect(g).connect(dest); src.start(t); src.stop(t + 0.06);
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(2100, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
      var og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.0015); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      o.connect(og).connect(dest); o.start(t); o.stop(t + 0.04);
    } else if (id === 'signal') {
      var freqs = [880, 1174], i;
      for (i = 0; i < freqs.length; i++) {
        var tt = t + i * 0.09, so = ctx.createOscillator(), sg = ctx.createGain(), flt = ctx.createBiquadFilter();
        so.type = 'sine'; so.frequency.value = freqs[i];
        flt.type = 'bandpass'; flt.frequency.value = freqs[i]; flt.Q.value = 14;
        sg.gain.setValueAtTime(0.0001, tt); sg.gain.exponentialRampToValueAtTime(0.28 * v, tt + 0.008); sg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07);
        so.connect(flt).connect(sg).connect(dest); so.start(tt); so.stop(tt + 0.09);
      }
    } else if (id === 'sweep') {
      var sw = ctx.createOscillator(); sw.type = 'sawtooth';
      var slp = ctx.createBiquadFilter(); slp.type = 'lowpass'; slp.frequency.value = 1800; slp.Q.value = 6;
      var sg2 = ctx.createGain();
      var up = (Math.floor(t * 7) % 2) === 0;
      sw.frequency.setValueAtTime(up ? 180 : 2400, t);
      sw.frequency.exponentialRampToValueAtTime(up ? 2400 : 160, t + 0.55);
      slp.frequency.setValueAtTime(up ? 600 : 3200, t);
      slp.frequency.exponentialRampToValueAtTime(up ? 4000 : 400, t + 0.55);
      sg2.gain.setValueAtTime(0.0001, t); sg2.gain.linearRampToValueAtTime(0.12 * v, t + 0.08); sg2.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      sw.connect(slp).connect(sg2).connect(dest); sw.start(t); sw.stop(t + 0.72);
    } else if (id === 'hole') {
      var h1 = ctx.createOscillator(); h1.type = 'sine'; h1.frequency.setValueAtTime(36, t); h1.frequency.exponentialRampToValueAtTime(22, t + 1.8);
      var h2 = ctx.createOscillator(); h2.type = 'sine'; h2.frequency.setValueAtTime(18.2, t);
      var hg = ctx.createGain(), h2g = ctx.createGain(); h2g.gain.value = 0.45;
      var sh = ctx.createWaveShaper(), cv = new Float32Array(256), k;
      for (k = 0; k < 256; k++) { var x = k / 128 - 1; cv[k] = Math.tanh(x * 2.2); }
      sh.curve = cv; sh.oversample = '2x';
      hg.gain.setValueAtTime(0.0001, t); hg.gain.exponentialRampToValueAtTime(0.7 * v, t + 0.04); hg.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
      h1.connect(hg); h2.connect(h2g).connect(hg); hg.connect(sh).connect(dest);
      h1.start(t); h2.start(t); h1.stop(t + 2.2); h2.stop(t + 2.2);
    } else if (id === 'count') {
      var cf = (Math.round(t * 100) % 4 === 0) ? 880 : 1200;
      var co = ctx.createOscillator(); co.type = 'sine'; co.frequency.value = cf;
      var cg = ctx.createGain();
      cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.004); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      co.connect(cg).connect(dest); co.start(t); co.stop(t + 0.1);
    } else if (id === 'ignite') {
      var isrc = ctx.createBufferSource(); isrc.buffer = this._noise;
      var ilp = ctx.createBiquadFilter(); ilp.type = 'lowpass'; ilp.frequency.setValueAtTime(70, t); ilp.frequency.exponentialRampToValueAtTime(240, t + 0.7);
      var ig = ctx.createGain(); ig.gain.setValueAtTime(0.0001, t); ig.gain.exponentialRampToValueAtTime(0.7 * v, t + 0.12); ig.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      var io = ctx.createOscillator(); io.type = 'sine'; io.frequency.setValueAtTime(42, t); io.frequency.exponentialRampToValueAtTime(28, t + 1.4);
      var iog = ctx.createGain(); iog.gain.setValueAtTime(0.0001, t); iog.gain.exponentialRampToValueAtTime(0.45 * v, t + 0.08); iog.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      isrc.connect(ilp).connect(ig).connect(dest); io.connect(iog).connect(dest);
      isrc.start(t); isrc.stop(t + 1.7); io.start(t); io.stop(t + 1.7);
    } else if (id === 'sep') {
      var pings = [1450, 2310, 980], pi;
      for (pi = 0; pi < pings.length; pi++) {
        var po = ctx.createOscillator(); po.type = 'triangle'; po.frequency.setValueAtTime(pings[pi], t); po.frequency.exponentialRampToValueAtTime(pings[pi] * 0.5, t + 0.18);
        var pg = ctx.createGain(); pg.gain.setValueAtTime(0.0001, t + pi * 0.012); pg.gain.exponentialRampToValueAtTime(0.22 * v, t + pi * 0.012 + 0.003); pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        po.connect(pg).connect(dest); po.start(t); po.stop(t + 0.3);
      }
      var nsrc = ctx.createBufferSource(); nsrc.buffer = this._noise;
      var nhp = ctx.createBiquadFilter(); nhp.type = 'highpass'; nhp.frequency.setValueAtTime(800, t); nhp.frequency.exponentialRampToValueAtTime(4000, t + 0.35);
      var ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.4 * v, t + 0.02); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      nsrc.connect(nhp).connect(ng).connect(dest); nsrc.start(t); nsrc.stop(t + 0.42);
    } else if (id === 'boom') {
      function thud(tt, f0, amp) {
        var bo = ctx.createOscillator(); bo.type = 'sine'; bo.frequency.setValueAtTime(f0, tt); bo.frequency.exponentialRampToValueAtTime(28, tt + 0.35);
        var bg = ctx.createGain(); bg.gain.setValueAtTime(0.0001, tt); bg.gain.exponentialRampToValueAtTime(amp, tt + 0.006); bg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.55);
        bo.connect(bg).connect(dest); bo.start(tt); bo.stop(tt + 0.6);
      }
      thud(t, 90, 0.8 * v); thud(t + 0.09, 70, 0.55 * v);
      var bns = ctx.createBufferSource(); bns.buffer = this._noise;
      var blp = ctx.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 600;
      var bng = ctx.createGain(); bng.gain.setValueAtTime(0.0001, t); bng.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.008); bng.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      bns.connect(blp).connect(bng).connect(dest); bns.start(t); bns.stop(t + 0.25);
    } else if (id === 'comms') {
      var bursts = 2 + ((Math.floor(t * 17) % 2)), bi;
      for (bi = 0; bi < bursts; bi++) {
        var ct = t + bi * 0.07;
        var csrc = ctx.createBufferSource(); csrc.buffer = this._noise;
        var cbp = ctx.createBiquadFilter(); cbp.type = 'bandpass'; cbp.frequency.value = 1800 + (bi * 400); cbp.Q.value = 4.5;
        var cgg = ctx.createGain(); cgg.gain.setValueAtTime(0.0001, ct); cgg.gain.exponentialRampToValueAtTime(0.28 * v, ct + 0.004); cgg.gain.exponentialRampToValueAtTime(0.0001, ct + 0.09);
        csrc.connect(cbp).connect(cgg).connect(dest); csrc.start(ct); csrc.stop(ct + 0.11);
      }
      var sq = ctx.createOscillator(); sq.type = 'sine'; sq.frequency.value = 520 + (Math.floor(t * 13) % 5) * 40;
      var sqg = ctx.createGain(); sqg.gain.setValueAtTime(0.0001, t); sqg.gain.exponentialRampToValueAtTime(0.08 * v, t + 0.01); sqg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      sq.connect(sqg).connect(dest); sq.start(t); sq.stop(t + 0.06);
    }
  };
  KosmosEngine.prototype.getState = function () {
    var snd = {};
    Object.keys(this.sounds).forEach(function (k) { snd[k] = Object.assign({}, this.sounds[k]); }, this);
    return { v: 1, preset: this.preset, pack: this.pack, bpm: this.bpm, level: this.level, enabled: this.enabled, running: this.running, sounds: snd };
  };
  KosmosEngine.prototype.setState = function (s) {
    if (!s) return;
    if (s.preset && PRESETS[s.preset]) this.preset = s.preset;
    if (s.pack) this.pack = s.pack;
    if (s.bpm) this.setBpm(s.bpm);
    if (s.level != null) this.setLevel(s.level);
    if (s.sounds) {
      var self = this;
      Object.keys(s.sounds).forEach(function (id) { if (self.sounds[id]) self.sounds[id] = Object.assign(self.sounds[id], s.sounds[id]); });
    }
    this.enabled = !!s.enabled;
  };

  /* ---------- Hybrid Magic: silnik regułowy, nie model AI ---------- */
  var STYLES = {
    techno: {
      label: 'techno', bpmHint: 128, preset: 'Kosmos Techno',
      dens: [100, 95, 55, 88, 42, 22, 32], vary: [28, 45, 50, 40, 35, 25, 40]
    },
    minimal: {
      label: 'minimal', bpmHint: 124, preset: 'Pulsar Minimal',
      dens: [72, 52, 32, 58, 18, 12, 16], vary: [22, 30, 38, 28, 22, 15, 22]
    },
    trance: {
      label: 'trance', bpmHint: 132, preset: 'Kosmos Techno',
      dens: [100, 110, 40, 82, 55, 88, 48], vary: [20, 55, 36, 44, 48, 30, 50],
      kosmosExtra: { wind: { on: true, div: 4, level: 0.35 }, sweep: { on: true, div: 4, level: 0.45, offset: 0 }, drone: { on: true, div: 1, level: 0.65 } }
    },
    'hip-hop': {
      label: 'hip-hop', bpmHint: 92, preset: 'Pulsar Minimal',
      dens: [82, 70, 62, 92, 22, 10, 38], vary: [48, 58, 62, 50, 30, 18, 44],
      kosmosExtra: { hole: { on: true, div: 4, level: 0.8, offset: 0 }, pulsar: { on: true, div: 8, level: 0.55, offset: 4 }, signal: { on: true, div: 4, level: 0.4, offset: 2 } }
    }
  };

  var FLAVOR = {
    start: [
      "Yo G, Hybrid Magic on the boards — let's ride.",
      "Aight bro, AUTO is live. Keep it clean, keep it bumpin'.",
      "Hood rules, G — engine's up, hands on the decks."
    ],
    stop: [
      "Hold up, bro — AUTO parked. We still in the studio.",
      "That's a wrap on AUTO, G. Hit it when you're ready."
    ],
    evolve: [
      "Yo G, droppin' a fresh pattern on the 1.",
      "Mutatin' the groove, bro — new seed, same heart.",
      "Switchin' the hats and bass, G — stay with me.",
      "Yo G, droppin' the pulsar on the 1.",
      "Evolution on the bar, brother — ears open."
    ],
    techno: [
      "Four on the floor, G — warehouse heat.",
      "Kick punchin', pulsar on the grid, bro."
    ],
    minimal: [
      "Keepin' it slim, G — space in the mix, that's the move.",
      "Minimal pocket, bro. Let the drone breathe."
    ],
    trance: [
      "Hands up energy, G — sweeps and that long pad.",
      "Trance lane, bro — ride the filter, don't rush it."
    ],
    'hip-hop': [
      "Head nod tempo, G — sub in the trunk, hood rules.",
      "Hip-hop pocket, bro. Boom on the one, leave room to rhyme."
    ],
    energyUp: [
      "Energy up, bro, hood rules.",
      "Turnin' it up, G — more hats, more fire."
    ],
    energyDown: [
      "Takin' it smooth, G — low energy, deep pocket.",
      "Dialin' back, bro. Let the sub talk."
    ]
  };
  function pickLine(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function HybridMagic(engine, kosmos) {
    this.engine = engine;
    this.kosmos = kosmos;
    this.auto = false;
    this.style = 'techno';
    this.energy = 64;
    this.evolveBars = 8;
    this.syncBpm = true;
    this.lastEvolveBar = -1;
    this.status = 'wyłączony';
    this.flavor = '';
    this.evolves = 0;
    this.onChange = null;
  }
  HybridMagic.prototype._emit = function () { if (this.onChange) try { this.onChange(this.getState()); } catch (e) {} };
  HybridMagic.prototype.say = function (kind) {
    var arr = FLAVOR[kind] || FLAVOR.evolve;
    this.flavor = pickLine(arr);
    return this.flavor;
  };
  HybridMagic.prototype.getState = function () {
    return { auto: this.auto, style: this.style, energy: this.energy, evolveBars: this.evolveBars, syncBpm: this.syncBpm, status: this.status, flavor: this.flavor, evolves: this.evolves, lastEvolveBar: this.lastEvolveBar };
  };
  HybridMagic.prototype.setState = function (s) {
    if (!s) return;
    if (s.style && STYLES[s.style]) this.style = s.style;
    if (s.energy != null) this.energy = clamp(s.energy | 0, 0, 127);
    if (s.evolveBars != null) this.evolveBars = clamp(s.evolveBars | 0, 1, 32);
    if (s.syncBpm != null) this.syncBpm = !!s.syncBpm;
    if (s.auto) this.setAuto(true, { silentBpm: true });
  };
  HybridMagic.prototype.setStyle = function (id) { if (!STYLES[id]) return; this.style = id; this.say(id); if (this.auto) this.apply(); this._emit(); };
  HybridMagic.prototype.setEnergy = function (v) {
    var old = this.energy;
    this.energy = clamp(v | 0, 0, 127);
    if (this.energy !== old) this.say(this.energy > old ? 'energyUp' : 'energyDown');
    if (this.auto) this.apply({ skipKosmosPreset: true, skipBpm: true });
    this._emit();
  };
  HybridMagic.prototype.setEvolveBars = function (n) { this.evolveBars = clamp(n | 0, 1, 32); this._emit(); };
  HybridMagic.prototype.setAuto = function (on, opt) {
    opt = opt || {};
    this.auto = !!on;
    if (this.auto) {
      this.apply({ skipBpm: !!opt.silentBpm });
      this.say('start');
      this.status = 'AUTO · ' + this.style;
      var E = this.engine, K = this.kosmos;
      if (E && E.ctx && K) {
        K.attach(E.ctx, E.mix || E.ctx.destination);
        K.setBpm(E.bpm);
        K.start(false);
      }
    } else {
      this.status = 'wyłączony';
      this.say('stop');
      this.lastEvolveBar = -1;
    }
    this._emit();
  };
  HybridMagic.prototype.apply = function (opt) {
    opt = opt || {};
    var st = STYLES[this.style]; if (!st || !this.engine) return;
    var e = this.energy / 127, scale = 0.45 + 0.7 * e, vary = 18 + e * 72, E = this.engine, i, d, va;
    for (i = 0; i < 7; i++) {
      d = clamp(Math.round(st.dens[i] * scale), 0, 127);
      va = clamp(Math.round((st.vary[i] + vary) * 0.5), 0, 127);
      if (E.gens && E.gens[i]) {
        E.gens[i].on = d > 8;
        if (E.setParam) {
          E.setParam('gen' + (i + 1) + '.density', d, 'hybrid');
          E.setParam('gen' + (i + 1) + '.variation', va, 'hybrid');
        } else {
          E.gens[i].density = d; E.gens[i].variation = va;
        }
      }
    }
    if (E.genOn === false) E.genOn = true;
    var K = this.kosmos;
    if (K && !opt.skipKosmosPreset) {
      K.loadPreset(st.preset, { keepBpm: true });
      if (st.kosmosExtra) Object.keys(st.kosmosExtra).forEach(function (id) { K.setSound(id, st.kosmosExtra[id]); });
      K.setLevel(clamp(0.28 + e * 0.4, 0.15, 0.75));
    }
    if (this.syncBpm && !opt.skipBpm && E.setBpm && st.bpmHint) {
      // tylko podpowiedź tempa stylu, gdy AUTO właśnie włączono / zmieniono styl — nie przy każdym energy
      if (!opt.skipStyleBpm) E.setBpm(st.bpmHint);
    }
    this.status = (this.auto ? 'AUTO · ' : '') + this.style + ' · E' + this.energy;
    this._emit();
  };
  HybridMagic.prototype.onSchedule = function (step) {
    if (!this.auto) return;
    var bar = Math.floor(step / 16), s = step % 16;
    if (s !== 0 || bar <= 0) return;
    if (bar % this.evolveBars !== 0) return;
    if (bar === this.lastEvolveBar) return;
    this.lastEvolveBar = bar;
    this.evolve();
  };
  HybridMagic.prototype.evolve = function () {
    var E = this.engine, e = this.energy / 127;
    if (!E || !E.magic) return;
    E.magic(1); E.magic(2);
    if (e > 0.35) E.magic(3);
    if (e > 0.55) E.magic(4);
    if (e > 0.7) { E.magic(5); E.magic(6); }
    if (e > 0.85 && Math.random() < 0.35) E.magic(0);
    if (this.kosmos && this.kosmos.sounds) {
      var ids = ['signal', 'sweep', 'pulsar'];
      var id = ids[(Math.random() * ids.length) | 0], snd = this.kosmos.sounds[id];
      if (snd) this.kosmos.setSound(id, { offset: (snd.offset + [0, 2, 4, 8][(Math.random() * 4) | 0]) % 16 });
    }
    this.evolves++;
    this.say('evolve');
    this.status = 'AUTO · ' + this.style + ' · ewolucja #' + this.evolves;
    this._emit();
  };

  function mountSimple(root, hooks) {
    hooks = hooks || {};
    var el = typeof root === 'string' ? document.querySelector(root) : root;
    if (!el) return null;
    var K = hooks.engine || api.create();
    function divLab(d) { return d === 1 ? '1 takt' : '1/' + d; }
    function paint() {
      var packs = '<option value="kosmos"' + (K.pack === 'kosmos' ? ' selected' : '') + '>Kosmos</option><option value="launch"' + (K.pack === 'launch' ? ' selected' : '') + '>Launch</option>';
      var presets = Object.keys(PRESETS).map(function (n) { return '<option' + (n === K.preset ? ' selected' : '') + '>' + n + '</option>'; }).join('');
      var pads = K.soundList().map(function (s) {
        var st = K.sounds[s.id];
        return '<button class="kos-pad' + (st.on ? ' on' : '') + '" data-kos="' + s.id + '" type="button"><b>' + s.pl + '</b><select data-kosdiv="' + s.id + '">' +
          [1, 4, 8, 16].map(function (d) { return '<option value="' + d + '"' + (st.div === d ? ' selected' : '') + '>' + divLab(d) + '</option>'; }).join('') +
          '</select></button>';
      }).join('');
      el.innerHTML = '<div class="kos-hero"><button type="button" data-kosrun class="kos-cta' + (K.enabled ? ' on' : '') + '">' + (K.enabled ? '🪐 Kosmos ON' : '🪐 Włącz Kosmos') + '</button>' +
        '<label>Paczka <select data-kospack>' + packs + '</select></label><label>Preset <select data-kospreset>' + presets + '</select></label>' +
        '<label>Poziom <input data-koslvl type="range" min="0" max="100" value="' + Math.round(K.level * 100) + '"></label><span class="chip" data-kosst>' + (K.enabled ? 'włączony · ' + K.preset : 'wyłączony') + '</span></div>' +
        '<div class="kos-layers">' + pads + '</div><p class="note">' + LICENSE + '</p>';
    }
    function ensure() {
      var ctx = hooks.getCtx && hooks.getCtx();
      if (!ctx) return null;
      K.attach(ctx, (hooks.getDest && hooks.getDest()) || ctx.destination);
      if (hooks.getBpm) K.setBpm(hooks.getBpm());
      if (hooks.getT0) K.syncOrigin(hooks.getT0());
      return ctx;
    }
    el.addEventListener('click', function (e) {
      var run = e.target.closest('[data-kosrun]');
      if (run) {
        if (!ensure()) return;
        K.enabled = !K.enabled;
        if (K.enabled) K.start(true); else K.stop();
        paint(); return;
      }
      var pad = e.target.closest('[data-kos]');
      if (pad && e.target.tagName !== 'SELECT') {
        var id = pad.getAttribute('data-kos');
        if (!ensure()) return;
        K.setSound(id, { on: !K.sounds[id].on });
        K.trigger(id, null, 0.8);
        paint();
      }
    });
    el.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.kospack) { K.setPack(t.value); paint(); }
      if (t.dataset.kospreset) { K.loadPreset(t.value, { keepBpm: true }); if (hooks.getBpm) K.setBpm(hooks.getBpm()); paint(); }
      if (t.dataset.kosdiv) { K.setSound(t.dataset.kosdiv, { div: +t.value }); }
      if (t.dataset.koslvl) { K.setLevel(+t.value / 100); }
    });
    paint();
    return K;
  }

  var api = {
    VERSION: VERSION,
    SOUNDS: SOUNDS,
    LAUNCH_SOUNDS: LAUNCH_SOUNDS,
    PRESETS: PRESETS,
    STYLES: STYLES,
    DIVS: DIVS,
    LICENSE: LICENSE,
    hits: hits,
    create: function () { return new KosmosEngine(); },
    createHybrid: function (engine, kosmos) { return new HybridMagic(engine, kosmos); },
    mountSimple: mountSimple
  };
  root.Kosmos = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
