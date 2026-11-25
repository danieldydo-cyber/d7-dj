/* D7S · Sound Magic generators (original procedural Web Audio synthesis, no samples).
   77 presets (loops + full tracks), 21 styles, stems for 40 pads, remix, mega-mix, WAV export. */
(function () {
  'use strict';
  var SR = 48000;
  function rng(seed) { var s = (seed >>> 0) || 7; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function pickR(r, a) { return a[Math.floor(r() * a.length) % a.length]; }
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  var SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], phryg: [0, 1, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], major: [0, 2, 4, 5, 7, 9, 11], harm: [0, 2, 3, 5, 7, 8, 11] };
  var KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // style: bpm range, swing, scale, drums (16-step strings), bass mode, music elements, pump (sidechain), half (half-time feel)
  var STYLES = {
    techno:   { n: 'Techno', bpm: [128, 136], sc: 'minor', kick: ['x...x...x...x...'], snare: ['....x.......x...', '................'], clap: 1, hat: ['..x...x...x...x.', '.xx..xx..xx..xx.', 'xxxxxxxxxxxxxxxx'], ohat: ['..o...o...o...o.'], perc: ['...x..x....x..x.', '.x.....x..x.....'], bass: 'rolling', mus: ['stab', 'vox', 'acid'], pump: .55 },
    hiphop:   { n: 'Hip-Hop', bpm: [86, 96], swing: .16, sc: 'dorian', kick: ['x.....x...x.....', 'x......xx.x.....', 'x..x......x..x..'], snare: ['....x.......x...'], hat: ['x.x.x.x.x.x.x.x.', 'x.xxx.x.x.xxx.x.'], bass: 'follow', mus: ['keys', 'pad', 'vox'], pump: 0 },
    hood:     { n: 'Hood', bpm: [140, 146], half: 1, sc: 'harm', kick: ['x.........x.....', 'x......x...x....'], snare: ['........x.......'], hat: ['x.x.x.x.x.xxx.x.', 'x.x.xxx.x.x.x.xx'], roll: 1, bass: '808', mus: ['bell', 'pad'], pump: 0 },
    house:    { n: 'House', bpm: [122, 126], sc: 'minor', kick: ['x...x...x...x...'], snare: ['....x.......x...'], clap: 1, hat: ['..x...x...x...x.'], ohat: ['..o...o...o...o.'], perc: ['x..x..x...x..x..'], bass: 'offbeat', mus: ['chord', 'keys', 'vox'], pump: .5 },
    psy:      { n: 'Psytrance', bpm: [142, 146], sc: 'phryg', kick: ['x...x...x...x...'], snare: ['................', '....x.......x...'], hat: ['..x...x...x...x.'], ohat: ['..o...o...o...o.'], bass: 'psy', mus: ['acid', 'arp', 'fx'], pump: 0 },
    trap:     { n: 'Trap', bpm: [138, 144], half: 1, sc: 'minor', kick: ['x......x..x.....', 'x.....x...x..x..'], snare: ['........x.......'], clap: 1, hat: ['xxxxxxxxxxxxxxxx', 'x.x.x.x.xxxxx.x.'], roll: 1, bass: '808', mus: ['pad', 'bell'], pump: 0 },
    classic:  { n: 'Classic Boom Bap', bpm: [88, 94], swing: .22, sc: 'dorian', kick: ['x.......x.x.....', 'x..x....x.......'], snare: ['....x.......x...'], hat: ['x.x.x.x.x.x.x.x.'], bass: 'follow', mus: ['keys', 'vox'], pump: 0, vinyl: 1 },
    dnb:      { n: 'Drum & Bass', bpm: [172, 176], sc: 'minor', kick: ['x.........x.....', 'x.........xx....'], snare: ['....x.......x...'], hat: ['x.x.x.x.x.x.x.x.'], bass: 'reese', mus: ['pad', 'fx'], pump: .3 },
    dubstep:  { n: 'Dubstep', bpm: [140, 140], half: 1, sc: 'phryg', kick: ['x.........x.....'], snare: ['........x.......'], hat: ['x.x.x.x.x.x.x.x.'], bass: 'wobble', mus: ['pad', 'fx'], pump: .3 },
    lofi:     { n: 'Lo-Fi', bpm: [74, 84], swing: .26, sc: 'dorian', kick: ['x......x..x.....'], snare: ['....x.......x...'], hat: ['x.x.x.x.x.x.x.x.'], bass: 'follow', mus: ['keys', 'pad'], pump: .2, vinyl: 1 },
    acid:     { n: 'Acid', bpm: [128, 134], sc: 'phryg', kick: ['x...x...x...x...'], snare: ['....x.......x...'], clap: 1, hat: ['..x...x...x...x.'], bass: 'acid', mus: ['acid', 'fx'], pump: .4 },
    minimal:  { n: 'Minimal', bpm: [124, 128], sc: 'minor', kick: ['x...x...x...x...'], snare: ['................'], hat: ['..x...x...x...x.'], perc: ['.x..x.x...x..x.x', '..x..x...x..x...'], bass: 'offbeat', mus: ['bell', 'stab'], pump: .3 },
    electro:  { n: 'Electro', bpm: [118, 126], sc: 'minor', kick: ['x......x..x.....'], snare: ['....x.......x...'], hat: ['x.x.x.x.x.x.x.x.'], bass: 'rolling', mus: ['arp', 'vox'], pump: .2 },
    garage:   { n: 'UK Garage', bpm: [130, 134], swing: .2, sc: 'minor', kick: ['x......x..x.....', 'x.........x..x..'], snare: ['....x.......x...'], hat: ['..x...x...x...x.'], perc: ['.x..x..x.x..x...'], bass: 'reese', mus: ['chord', 'vox'], pump: .4 },
    dembow:   { n: 'Dembow / Reggaeton', bpm: [92, 98], sc: 'minor', kick: ['x...x...x...x...'], snare: ['...x..x....x..x.'], hat: ['x.x.x.x.x.x.x.x.'], bass: 'follow', mus: ['chord', 'bell'], pump: 0 },
    afro:     { n: 'Afro House', bpm: [120, 124], sc: 'dorian', kick: ['x...x...x...x...'], snare: ['................'], hat: ['..x...x...x...x.'], perc: ['x..x..x...x.x...', '..x.x..x.x..x.x.'], bass: 'offbeat', mus: ['chord', 'vox', 'bell'], pump: .4 },
    jersey:   { n: 'Jersey Club', bpm: [138, 142], sc: 'minor', kick: ['x..x..x.x...x...'], snare: ['....x.......x...'], clap: 1, hat: ['x.x.x.x.x.x.x.x.'], bass: '808', mus: ['vox', 'chord'], pump: 0 },
    phonk:    { n: 'Phonk', bpm: [128, 136], sc: 'phryg', kick: ['x.....x...x.....'], snare: ['....x.......x...'], hat: ['x.x.x.x.x.x.x.x.'], bass: '808', mus: ['bell', 'vox'], pump: 0, cowbell: 1 },
    hardstyle:{ n: 'Hardstyle', bpm: [150, 154], sc: 'minor', kick: ['x...x...x...x...'], snare: ['................'], clap: 1, hat: ['..x...x...x...x.'], bass: 'none', mus: ['lead', 'chord'], pump: .5, hardkick: 1 },
    trance:   { n: 'Trance', bpm: [136, 140], sc: 'minor', kick: ['x...x...x...x...'], snare: ['....x.......x...'], clap: 1, hat: ['..x...x...x...x.'], ohat: ['..o...o...o...o.'], bass: 'offbeat', mus: ['arp', 'chord', 'lead'], pump: .5 },
    ambient:  { n: 'Ambient', bpm: [84, 92], sc: 'major', kick: ['................'], snare: ['................'], hat: ['................'], bass: 'pad', mus: ['pad', 'bell', 'fx'], pump: 0 }
  };
  var STYLE_KEYS = Object.keys(STYLES);
  var ADJ = ['Neon', 'Dark', 'Magic', 'Nova', 'Holo', 'Cyber', 'Ghost', 'Dragon', 'Kraków', 'Night', 'Acid', 'Gold', 'Ultra', 'Deep', 'Wild', 'Cosmic', 'Turbo', 'Liquid', 'Mega', 'Seven'];
  var NOUN = ['Warehouse', 'Block', 'Groove', 'Storm', 'Machine', 'Orbit', 'Street', 'Pulse', 'Rave', 'Vision', 'Engine', 'Fire', 'Dream', 'Bounce', 'Drift', 'Tunnel', 'Laser', 'Wave', 'Sofia', 'Jam'];

  // 77 Sound Magic presets
  var PRESETS = [];
  for (var i = 0; i < 77; i++) {
    var st = STYLE_KEYS[i % STYLE_KEYS.length], r = rng(7777 + i * 77);
    var S = STYLES[st];
    PRESETS.push({ id: i + 1, style: st, seed: 1000 + i * 7919, mode: (i % 3 === 2) ? 'loop' : 'track',
      bpm: Math.round(S.bpm[0] + r() * (S.bpm[1] - S.bpm[0])), key: Math.floor(r() * 12),
      name: '#' + (i + 1) + ' ' + S.n + ' · ' + pickR(r, ADJ) + ' ' + pickR(r, NOUN) + ((i % 3 === 2) ? ' (loop)' : '') });
  }

  // ---------- voices ----------
  var NB = new WeakMap();
  function noise(ctx) { var b = NB.get(ctx); if (!b) { b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; NB.set(ctx, b); } return b; }
  function env(g, t, a, peak, dec, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
    if (sus != null) { g.gain.setTargetAtTime(peak * sus, t + a, dec / 3); g.gain.setValueAtTime(peak * sus, end); g.gain.exponentialRampToValueAtTime(0.0001, end + rel); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function nsrc(ctx, t, dur) { var s = ctx.createBufferSource(); s.buffer = noise(ctx); s.loop = true; s.start(t, Math.random() * .5); s.stop(t + dur + .05); return s; }
  var V = {
    kick: function (c, o, t, v, hard) {
      var os = c.createOscillator(), g = c.createGain(); os.type = 'sine';
      os.frequency.setValueAtTime(hard ? 260 : 180, t); os.frequency.exponentialRampToValueAtTime(hard ? 48 : 46, t + (hard ? .12 : .07));
      env(g, t, .002, v * 1.1, hard ? .5 : .38); os.connect(g);
      if (hard) { var ws = c.createWaveShaper(); ws.curve = curve(8); g.connect(ws); var g2 = c.createGain(); g2.gain.value = .55; ws.connect(g2); g2.connect(o); } else g.connect(o);
      os.start(t); os.stop(t + .7);
      var n = nsrc(c, t, .02), hg = c.createGain(), hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500; env(hg, t, .001, v * .25, .015); n.connect(hp); hp.connect(hg); hg.connect(o);
    },
    snare: function (c, o, t, v) {
      var n = nsrc(c, t, .25), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = .7; env(g, t, .001, v * .7, .2); n.connect(bp); bp.connect(g); g.connect(o);
      var os = c.createOscillator(), g2 = c.createGain(); os.type = 'triangle'; os.frequency.setValueAtTime(240, t); os.frequency.exponentialRampToValueAtTime(160, t + .08); env(g2, t, .001, v * .5, .1); os.connect(g2); g2.connect(o); os.start(t); os.stop(t + .2);
    },
    clap: function (c, o, t, v) {
      var n = nsrc(c, t, .4), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.2;
      g.gain.setValueAtTime(0.0001, t); [0, .011, .022].forEach(function (d) { g.gain.setValueAtTime(v * .8, t + d); g.gain.exponentialRampToValueAtTime(v * .1, t + d + .009); });
      g.gain.setValueAtTime(v * .7, t + .031); g.gain.exponentialRampToValueAtTime(0.0001, t + .25); n.connect(bp); bp.connect(g); g.connect(o);
    },
    hat: function (c, o, t, v, open) {
      var n = nsrc(c, t, open ? .35 : .06), hp = c.createBiquadFilter(), g = c.createGain(); hp.type = 'highpass'; hp.frequency.value = open ? 6500 : 8000; env(g, t, .001, v * (open ? .28 : .3), open ? .28 : .045); n.connect(hp); hp.connect(g); g.connect(o);
    },
    perc: function (c, o, t, v, f) {
      var os = c.createOscillator(), g = c.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(f, t); os.frequency.exponentialRampToValueAtTime(f * .7, t + .08); env(g, t, .001, v * .35, .09); os.connect(g); g.connect(o); os.start(t); os.stop(t + .15);
    },
    cowbell: function (c, o, t, v, note, dur) {
      [1, 1.48].forEach(function (m) { var os = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter(); os.type = 'square'; os.frequency.value = hz(note) * m; bp.type = 'bandpass'; bp.frequency.value = hz(note) * 2; env(g, t, .002, v * .12, Math.min(.35, dur)); os.connect(bp); bp.connect(g); g.connect(o); os.start(t); os.stop(t + .5); });
    },
    crash: function (c, o, t, v) { var n = nsrc(c, t, 2), hp = c.createBiquadFilter(), g = c.createGain(); hp.type = 'highpass'; hp.frequency.value = 5000; env(g, t, .002, v * .22, 1.8); n.connect(hp); hp.connect(g); g.connect(o); },
    riser: function (c, o, t, dur, v) {
      var n = nsrc(c, t, dur), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * .35, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .03); n.connect(bp); bp.connect(g); g.connect(o);
    },
    b808: function (c, o, t, note, dur, v, slideTo) {
      var os = c.createOscillator(), g = c.createGain(), ws = c.createWaveShaper(); os.type = 'sine'; ws.curve = curve(2.5);
      os.frequency.setValueAtTime(hz(note) * 1.6, t); os.frequency.exponentialRampToValueAtTime(hz(note), t + .04);
      if (slideTo != null) os.frequency.exponentialRampToValueAtTime(hz(slideTo), t + dur * .9);
      env(g, t, .004, v * .75, .2, .8, .08, t + Math.max(.05, dur - .08)); os.connect(ws); ws.connect(g); g.connect(o); os.start(t); os.stop(t + dur + .2);
    },
    bass: function (c, o, t, note, dur, v, p) {
      p = p || {}; var lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.Q.value = p.q || 3;
      var base = p.cut || 300; lp.frequency.setValueAtTime(base + (p.env || 900), t); lp.frequency.exponentialRampToValueAtTime(base, t + (p.decay || .15));
      var waves = p.reese ? [['sawtooth', -9], ['sawtooth', 9]] : [[p.wave || 'sawtooth', 0]];
      waves.forEach(function (w) { var os = c.createOscillator(); os.type = w[0]; os.frequency.value = hz(note); os.detune.value = w[1]; os.connect(lp); os.start(t); os.stop(t + dur + .15); });
      var sub = c.createOscillator(), sg = c.createGain(); sub.frequency.value = hz(note); sg.gain.value = .5; sub.connect(sg); sg.connect(g); sub.start(t); sub.stop(t + dur + .15);
      if (p.wobble) { var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = p.wobble; lg.gain.value = 700; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t); lfo.stop(t + dur + .15); lp.frequency.cancelScheduledValues(t); lp.frequency.setValueAtTime(800, t); lp.Q.value = 9; }
      lp.connect(g); env(g, t, .004, v * .5, .1, .7, .05, t + Math.max(.02, dur - .05)); g.connect(o);
    },
    acid: function (c, o, t, note, dur, v, acc) {
      var os = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); os.type = 'sawtooth'; os.frequency.value = hz(note); lp.type = 'lowpass'; lp.Q.value = 14;
      lp.frequency.setValueAtTime(acc ? 3200 : 1800, t); lp.frequency.exponentialRampToValueAtTime(220, t + (acc ? .25 : .14));
      env(g, t, .003, v * (acc ? .32 : .22), .08, .6, .03, t + Math.max(.02, dur - .03)); os.connect(lp); lp.connect(g); g.connect(o); os.start(t); os.stop(t + dur + .1);
    },
    chord: function (c, o, t, notes, dur, v, soft) {
      var lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = soft ? 1400 : 2600; lp.Q.value = 1;
      notes.forEach(function (n) { [-7, 7].forEach(function (d) { var os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.value = hz(n); os.detune.value = d; os.connect(lp); os.start(t); os.stop(t + dur + (soft ? 1 : .3)); }); });
      lp.connect(g); if (soft) env(g, t, Math.min(.6, dur * .4), v * .08, .5, .9, .8, t + dur); else env(g, t, .004, v * .14, .18); g.connect(o);
    },
    keys: function (c, o, t, notes, dur, v) {
      notes.forEach(function (n) { var os = c.createOscillator(), os2 = c.createOscillator(), g = c.createGain(); os.type = 'sine'; os2.type = 'triangle'; os.frequency.value = hz(n); os2.frequency.value = hz(n) * 2; os2.detune.value = 4;
        var g2 = c.createGain(); g2.gain.value = .25; os2.connect(g2); g2.connect(g); os.connect(g); env(g, t, .005, v * .14, .9, .4, .3, t + dur); g.connect(o); os.start(t); os.stop(t + dur + .4); os2.start(t); os2.stop(t + dur + .4); });
    },
    pluck: function (c, o, t, note, dur, v, wave) {
      var os = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); os.type = wave || 'square'; os.frequency.value = hz(note); lp.type = 'lowpass'; lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(500, t + .2);
      env(g, t, .003, v * .16, Math.min(.4, dur + .1)); os.connect(lp); lp.connect(g); g.connect(o); os.start(t); os.stop(t + .6);
    },
    bell: function (c, o, t, note, dur, v) {
      var car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain(); car.frequency.value = hz(note); mod.frequency.value = hz(note) * 3.5; mg.gain.setValueAtTime(hz(note) * 2, t); mg.gain.exponentialRampToValueAtTime(1, t + .8);
      mod.connect(mg); mg.connect(car.frequency); env(g, t, .002, v * .16, 1.1); car.connect(g); g.connect(o); car.start(t); mod.start(t); car.stop(t + 1.3); mod.stop(t + 1.3);
    },
    lead: function (c, o, t, note, dur, v) {
      var lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 3500;
      [-12, 0, 12].forEach(function (d) { var os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.value = hz(note); os.detune.value = d; os.connect(lp); os.start(t); os.stop(t + dur + .2); });
      lp.connect(g); env(g, t, .01, v * .1, .1, .8, .1, t + Math.max(.02, dur - .05)); g.connect(o);
    },
    vox: function (c, o, t, note, dur, v, vowel) {
      var F = [[800, 1150], [400, 2000], [350, 2600], [450, 800], [325, 700]][vowel % 5];
      var os = c.createOscillator(), g = c.createGain(); os.type = 'sawtooth'; os.frequency.setValueAtTime(hz(note) * .97, t); os.frequency.linearRampToValueAtTime(hz(note), t + .05);
      var vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.5; vg.gain.value = hz(note) * .012; vib.connect(vg); vg.connect(os.frequency);
      F.forEach(function (f, i) { var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 9; var fg = c.createGain(); fg.gain.value = i ? .5 : 1; os.connect(bp); bp.connect(fg); fg.connect(g); });
      env(g, t, .02, v * .9, .1, .7, .06, t + Math.max(.03, dur - .06)); g.connect(o); os.start(t); vib.start(t); os.stop(t + dur + .15); vib.stop(t + dur + .15);
    },
    vinyl: function (c, o, t, dur) { var n = nsrc(c, t, dur), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = .5; g.gain.value = .018; n.connect(bp); bp.connect(g); g.connect(o); }
  };
  var CC = {};
  function curve(k) { if (CC[k]) return CC[k]; var n = 2048, a = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; a[i] = Math.tanh(k * x) / Math.tanh(k); } return (CC[k] = a); }
  function impulse(c, sec, decay) { var len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate); for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }

  // ---------- pattern + arrangement ----------
  function makePlan(o) {
    var S = STYLES[o.style], r = rng(o.seed), sc = SCALES[S.sc], root = 36 + ((o.key == null ? Math.floor(r() * 12) : o.key) % 12);
    function deg(d, oct) { var n = sc.length, q = Math.floor(d / n), m = ((d % n) + n) % n; return root + 12 * (oct + q) + sc[m]; }
    var progs = [[0, 5, 3, 4], [0, 3, 4, 3], [0, 6, 5, 4], [0, 0, 5, 3], [0, 2, 5, 4], [0, 4, 5, 3]];
    var prog = pickR(r, progs);
    var P = {
      S: S, root: root, deg: deg, prog: prog,
      kick: pickR(r, S.kick), snare: pickR(r, S.snare), hat: pickR(r, S.hat), ohat: S.ohat ? pickR(r, S.ohat) : null, perc: S.perc ? pickR(r, S.perc) : null,
      percF: 300 + r() * 900, vowel: Math.floor(r() * 5), arpOrder: Math.floor(r() * 3),
      bassSeq: [], leadSeq: [], voxSeq: []
    };
    for (var i = 0; i < 16; i++) P.bassSeq.push(r() < .35 ? pickR(r, [0, 0, 0, 2, 4, 5, -1, 7]) : 0);
    for (i = 0; i < 32; i++) P.leadSeq.push(r() < .55 ? Math.floor(r() * 8) : null);
    for (i = 0; i < 16; i++) P.voxSeq.push(r() < .22 ? Math.floor(r() * 5) : null);
    P.accent = []; for (i = 0; i < 16; i++) P.accent.push(r() < .3);
    P.slides = []; for (i = 0; i < 16; i++) P.slides.push(r() < .25);
    return P;
  }
  // sections: which elements play (k kick, s snare, h hats, p perc, b bass, m music, v vox, f fx)
  function arrangement(bars, mode) {
    if (mode === 'loop') return function () { return 'kshpbmvf'; };
    var plan = [];
    var parts = [['kh', 'khp'], ['khpb', 'khspb'], ['kshpbmv', 'kshpbmvf'], ['mf', 'mvf'], ['kshpbmv', 'kshpbmvf'], ['khp', 'kh']];
    var per = Math.max(4, Math.round(bars / 6 / 4) * 4);
    for (var b = 0; b < bars; b++) { var s = Math.min(parts.length - 1, Math.floor(b / per)), half = (b % per) >= per / 2 ? 1 : 0; plan.push({ el: parts[s][half], sec: s, end: (b % per) === per - 1 }); }
    return function (b) { return plan[b] ? plan[b].el : ''; };
  }

  function schedule(c, bus, P, o) {
    var S = P.S, bpm = o.bpm, beat = 60 / bpm, step = beat / 4, bars = o.bars, arr = arrangement(bars, o.mode), stems = o.stems || 'kshpbmvf';
    var half = S.half ? 2 : 1; // half-time: musical bar spans 2 drum bars? keep drums per 16 steps but bass/music slower
    var r = rng(o.seed + 99);
    for (var b = 0; b < bars; b++) {
      var el = arr(b), bt = b * 16 * step;
      var has = function (ch) { return el.indexOf(ch) >= 0 && stems.indexOf(ch) >= 0; };
      var chordDeg = P.prog[Math.floor(b / half) % 4];
      if (S.vinyl && stems.indexOf('m') >= 0) V.vinyl(c, bus.mus, bt, 16 * step);
      for (var s = 0; s < 16; s++) {
        var t = bt + s * step + ((s % 2) ? (S.swing || 0) * step : 0);
        if (has('k') && P.kick[s] === 'x') { V.kick(c, bus.drum, t, 1, S.hardkick); if (bus.pump && S.pump) { var g = bus.pump.gain; g.setValueAtTime(1 - S.pump, t); g.linearRampToValueAtTime(1, t + beat * .45); } }
        if (has('s') && P.snare[s] === 'x') { if (S.clap) V.clap(c, bus.drum, t, .9); else V.snare(c, bus.drum, t, .9); }
        if (has('s') && S.clap && P.snare === '................' && (s === 4 || s === 12) && S.kick[0] === 'x...x...x...x...') V.clap(c, bus.drum, t, .8);
        if (has('h') && P.hat[s] === 'x') { V.hat(c, bus.hat, t, .7 + .3 * ((s % 4) === 2)); if (S.roll && (b % 2) && s >= 12 && r() < .5) { V.hat(c, bus.hat, t + step / 3, .5); V.hat(c, bus.hat, t + 2 * step / 3, .5); } }
        if (has('h') && P.ohat && P.ohat[s] === 'o') V.hat(c, bus.hat, t, .8, true);
        if (has('p') && P.perc && P.perc[s] === 'x') V.perc(c, bus.hat, t, .8, P.percF * (s % 3 ? 1 : 1.5));
        if (has('b')) bassStep(c, bus.bass, P, S, b, s, t, step, chordDeg);
        if (has('m')) musicStep(c, bus.mus, P, S, b, s, t, step, chordDeg, half);
        if (has('v') && S.mus.indexOf('vox') >= 0 && P.voxSeq[s] != null && (b % 2 === 1)) V.vox(c, bus.mus, t, P.deg(chordDeg + P.voxSeq[s], 2), step * 2, .5, P.vowel);
      }
      if (has('f') && o.mode !== 'loop' && (b % 8) === 7) V.riser(c, bus.fx, bt, 16 * step, .9);
      if (has('f') && o.mode !== 'loop' && (b % 8) === 0 && b > 0 && el.indexOf('k') >= 0) V.crash(c, bus.fx, bt, .9);
      if (has('f') && o.mode === 'loop' && S.mus.indexOf('fx') >= 0 && b === bars - 1) V.riser(c, bus.fx, bt, 16 * step, .6);
    }
  }
  function bassStep(c, o, P, S, b, s, t, step, cd) {
    var m = S.bass, root = P.deg(cd, 0) + 12 * (m === 'psy' || m === 'acid' ? 1 : 0);
    if (m === 'rolling') { if (P.kick[s] !== 'x' && (s % 2 === 1 || s % 4 === 2)) V.bass(c, o, t, root + (P.bassSeq[s] === 7 ? 12 : 0), step * .9, .8, { cut: 220, env: 700 }); }
    else if (m === 'offbeat') { if (s % 4 === 2) V.bass(c, o, t, root + 12, step * 1.6, .9, { cut: 350, env: 900, wave: 'square' }); }
    else if (m === 'psy') { if (s % 4 !== 0) V.bass(c, o, t, root, step * .7, .8, { cut: 260, env: 1400, decay: .08, q: 6 }); }
    else if (m === 'acid') { if (P.bassSeq[s] !== 0 || s % 2 === 0) V.acid(c, o, t, P.deg(cd + P.bassSeq[s], 1), step * (P.slides[s] ? 1.8 : .8), .9, P.accent[s]); }
    else if (m === '808') { if (P.kick[s] === 'x') { var nx = 16; for (var k = s + 1; k < 16; k++) if (P.kick[k] === 'x') { nx = k; break; } var len = (nx - s) * step * .95; V.b808(c, o, t, P.deg(cd + P.bassSeq[s], 0), len, 1, P.slides[s] ? P.deg(cd + P.bassSeq[(s + 4) % 16], 0) : null); } }
    else if (m === 'follow') { if (P.kick[s] === 'x' || (s === 14 && P.bassSeq[s])) V.bass(c, o, t, root + P.bassSeq[s] % 3, step * 3, .9, { cut: 180, env: 300, wave: 'triangle' }); }
    else if (m === 'reese') { if (s === 0 || s === 8) V.bass(c, o, t, root, step * 7.5, .9, { reese: 1, cut: 400, env: 300 }); }
    else if (m === 'wobble') { if (s === 0 || s === 8) V.bass(c, o, t, root, step * 7.8, .9, { wobble: [2, 4, 3, 6][b % 4] * (60 / (step * 16)) / 4, cut: 400 }); }
    else if (m === 'pad') { if (s === 0 && b % 2 === 0) V.chord(c, o, t, [root], step * 31, .9, true); }
  }
  function musicStep(c, o, P, S, b, s, t, step, cd, half) {
    var tri = [P.deg(cd, 2), P.deg(cd + 2, 2), P.deg(cd + 4, 2)], st = s + 16 * (b % 2);
    S.mus.forEach(function (m) {
      if (m === 'stab' && (s === 3 || s === 10) && b % 2 === 0) V.chord(c, o, t, tri, step, .9);
      else if (m === 'chord' && (S.bass === 'offbeat' ? s % 4 === 2 && s !== 14 : (s === 0 && (b % half === 0)))) V.chord(c, o, t, tri, S.bass === 'offbeat' ? step * 1.2 : step * 16 * half, .8, S.bass !== 'offbeat');
      else if (m === 'pad' && s === 0 && (b % (2 * half) === 0)) V.chord(c, o, t, tri, step * 32 * half - step, .9, true);
      else if (m === 'keys' && (s === 0 || (s === 10 && P.accent[s]))) V.keys(c, o, t, tri.map(function (n) { return n - 12; }), step * 6, .9);
      else if (m === 'arp' && s % 2 === 0) { var idx = [s / 2 % 3, (2 - s / 2 % 3), (s / 2 * 2) % 3][P.arpOrder]; V.pluck(c, o, t, tri[idx] + (s >= 8 ? 12 : 0), step, .8, 'sawtooth'); }
      else if (m === 'acid' && P.leadSeq[st] != null && S.bass !== 'acid') V.acid(c, o, t, P.deg(cd + P.leadSeq[st], 1), step * .9, .8, P.accent[s]);
      else if (m === 'bell' && P.leadSeq[st] != null && s % 2 === 0) { if (S.cowbell) V.cowbell(c, o, t, P.deg(cd + P.leadSeq[st], 3), step * 2, .9); else V.bell(c, o, t, P.deg(cd + P.leadSeq[st], 3), step * 2, .8); }
      else if (m === 'lead' && P.leadSeq[st] != null && s % 2 === 0) V.lead(c, o, t, P.deg(cd + P.leadSeq[st], 2), step * 2, .8);
      else if (m === 'fx' && s === 0 && b % 4 === 3) V.bell(c, o, t, P.deg(cd + 4, 3), step * 8, .5);
    });
  }

  function buildBus(c) {
    var master = c.createDynamicsCompressor(); master.threshold.value = -12; master.ratio.value = 4; master.attack.value = .005; master.release.value = .15;
    var out = c.createGain(); out.gain.value = .9; master.connect(out); out.connect(c.destination);
    var pump = c.createGain(); pump.connect(master);
    var rv = c.createConvolver(); rv.buffer = impulse(c, 2.2, 3); var rvg = c.createGain(); rvg.gain.value = .22; rv.connect(rvg); rvg.connect(master);
    var dl = c.createDelay(2); dl.delayTime.value = .375; var fb = c.createGain(); fb.gain.value = .3; var dg = c.createGain(); dg.gain.value = .15; dl.connect(fb); fb.connect(dl); dl.connect(dg); dg.connect(master);
    var drum = c.createGain(); drum.gain.value = .9; drum.connect(master);
    var hat = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); if (hat.pan) hat.pan.value = .18; var hg = c.createGain(); hg.gain.value = .8; hg.connect(hat); hat.connect(master); hg.connect(rv);
    var bass = c.createGain(); bass.gain.value = .85; bass.connect(pump);
    var mus = c.createGain(); mus.gain.value = .8; mus.connect(pump); mus.connect(rv); mus.connect(dl);
    var fx = c.createGain(); fx.gain.value = .7; fx.connect(master); fx.connect(rv);
    return { drum: drum, hat: hg, bass: bass, mus: mus, fx: fx, pump: pump, dl: dl };
  }

  // render(opts) -> Promise<{buffer,bpm,name,style}>
  function render(o) {
    o = Object.assign({}, o);
    var S = STYLES[o.style] || STYLES.techno; o.style = STYLES[o.style] ? o.style : 'techno';
    if (!o.bpm) o.bpm = Math.round(S.bpm[0] + rng(o.seed || 1)() * (S.bpm[1] - S.bpm[0]));
    if (!o.bars) o.bars = o.mode === 'loop' ? 4 : (o.bpm >= 115 ? 32 : 24);
    o.seed = o.seed || Math.floor(Math.random() * 1e9);
    var dur = o.bars * 4 * 60 / o.bpm, tail = o.mode === 'loop' ? 0 : 1.5;
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var c = new OAC(2, Math.ceil((dur + tail) * SR), SR);
    var bus = buildBus(c); bus.dl.delayTime.value = 60 / o.bpm * .75;
    var P = makePlan(o); schedule(c, bus, P, o);
    return c.startRendering().then(function (buf) {
      if (o.mode === 'loop') buf = wrapTail(buf, dur); else buf = normalize(buf);
      return { buffer: buf, bpm: o.bpm, style: o.style, name: o.name || (S.n + ' ' + o.bpm + ' BPM · ' + KEYS[P.root % 12]), key: KEYS[P.root % 12], seed: o.seed };
    });
  }
  // loop: cut exactly to loop length (tail is 0 so no wrap needed), normalize
  function wrapTail(buf, dur) { var n = Math.round(dur * SR), out = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: SR }); for (var ch = 0; ch < 2; ch++) out.copyToChannel(buf.getChannelData(ch).subarray(0, n), ch); return normalize(out); }
  function normalize(buf, target) {
    target = target || .89; var pk = 0; for (var ch = 0; ch < buf.numberOfChannels; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > pk) pk = a; } }
    if (pk > 0.001) { var g = target / pk; for (ch = 0; ch < buf.numberOfChannels; ch++) { d = buf.getChannelData(ch); for (i = 0; i < d.length; i++) d[i] *= g; } } return buf;
  }
  function renderPreset(p, extra) { return render(Object.assign({ style: p.style, seed: p.seed, mode: p.mode, bpm: p.bpm, key: p.key, name: p.name }, extra || {})); }

  // stems for pads: 8 columns x variations
  var STEM_COLS = [['Bębny', 'ks'], ['Hi-hat/Perc', 'hp'], ['Kick', 'k'], ['Bas', 'b'], ['Akordy/Synth', 'm'], ['Wokal', 'v'], ['FX', 'f'], ['Full loop', 'kshpbmvf']];
  function renderStem(style, seed, col, bpm, key, bars) {
    var stems = STEM_COLS[col][1], S = STYLES[style];
    if (stems === 'v' && S.mus.indexOf('vox') < 0) { S = null; }
    return render({ style: S ? style : 'house', seed: seed, mode: 'loop', bpm: bpm, key: key, bars: bars || 2, stems: stems, name: STEM_COLS[col][0] });
  }

  // concat with equal-power crossfade (seconds)
  function concat(bufs, xf) {
    var n = 0, x = Math.round(xf * SR); bufs.forEach(function (b, i) { n += b.length - (i ? x : 0); });
    var out = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: SR }), pos = 0;
    bufs.forEach(function (b, bi) {
      for (var ch = 0; ch < 2; ch++) { var src = b.getChannelData(Math.min(ch, b.numberOfChannels - 1)), dst = out.getChannelData(ch), start = bi ? pos - x : 0;
        for (var i = 0; i < b.length; i++) { var gi = 1; if (bi && i < x) gi = Math.sin(i / x * Math.PI / 2); var j = start + i; if (j >= n) break;
          if (bi && i < x) { var fo = Math.cos(i / x * Math.PI / 2); dst[j] = dst[j] * fo + src[i] * gi; } else dst[j] = src[i]; } }
      pos = (bi ? pos - x : 0) + b.length;
    });
    return normalize(out);
  }
  function megaMix(k, onProg) { // 7 mega mix generators: 4 styles, shared BPM, 16 bars each, crossfaded
    var r = rng(77 * (k + 1) + Math.floor(Math.random() * 1e6)), bpm = pickR(r, [124, 128, 132, 140, 126, 136, 145]), parts = [];
    var pool = STYLE_KEYS.filter(function (s) { return s !== 'ambient'; });
    var styles = [pickR(r, pool), pickR(r, pool), pickR(r, pool), pickR(r, pool)], chain = Promise.resolve();
    styles.forEach(function (st, i) { chain = chain.then(function () { onProg && onProg(i, styles.length, st); return render({ style: st, bpm: bpm, bars: 16, seed: Math.floor(r() * 1e9), mode: 'track' }).then(function (x) { parts.push(x.buffer); }); }); });
    return chain.then(function () { return { buffer: concat(parts, 60 / bpm * 8), bpm: bpm, style: 'mega', name: 'Mega Mix ' + (k + 1) + ' · ' + styles.map(function (s) { return STYLES[s].n; }).join(' → ') + ' · ' + bpm + ' BPM' }; });
  }
  // remix generator: slice a source buffer (beats) and re-sequence over generated drums
  function remix(srcBuf, srcBpm, style, seed) {
    seed = seed || Math.floor(Math.random() * 1e9); var r = rng(seed), bpm = Math.round(srcBpm || 120), beat = 60 / bpm, bars = 16;
    var OAC = window.OfflineAudioContext; var c = new OAC(2, Math.ceil((bars * 4 * beat + 1) * SR), SR);
    var bus = buildBus(c), P = makePlan({ style: style, seed: seed }); schedule(c, bus, P, { bpm: bpm, bars: bars, mode: 'track', stems: 'kshpf', seed: seed });
    var startAt = Math.min(srcBuf.duration * .3, Math.max(0, srcBuf.duration - 20)), nSl = Math.max(4, Math.min(32, Math.floor((srcBuf.duration - startAt) / beat) - 1));
    var g = c.createGain(); g.gain.value = .7; g.connect(bus.pump);
    for (var b = 0; b < bars; b++) { if (b % 8 < 2) continue; for (var q = 0; q < 4; q++) {
      var sl = (b % 4 === 3 && q >= 2) ? Math.floor(r() * nSl) : ((b * 4 + q) % 8 + Math.floor(b / 4) * 2) % nSl;
      var len = (r() < .2 ? .5 : 1) * beat, t = (b * 4 + q) * beat;
      var s = c.createBufferSource(); s.buffer = srcBuf; s.playbackRate.value = 1; var eg = c.createGain(); eg.gain.setValueAtTime(0, t); eg.gain.linearRampToValueAtTime(1, t + .004); eg.gain.setValueAtTime(1, t + len - .01); eg.gain.linearRampToValueAtTime(0, t + len);
      s.connect(eg); eg.connect(g); s.start(t, startAt + sl * beat, len); if (len < beat) { var s2 = c.createBufferSource(); s2.buffer = srcBuf; var e2 = c.createGain(); e2.gain.setValueAtTime(0, t + len); e2.gain.linearRampToValueAtTime(1, t + len + .004); e2.gain.setValueAtTime(1, t + 2 * len - .01); e2.gain.linearRampToValueAtTime(0, t + 2 * len); s2.connect(e2); e2.connect(g); s2.start(t + len, startAt + sl * beat, len); }
    } }
    return c.startRendering().then(function (buf) { return { buffer: normalize(buf), bpm: bpm, style: style, name: 'Remix ' + STYLES[style].n + ' · ' + bpm + ' BPM' }; });
  }

  function wav(buf, bits) {
    bits = bits || 24; var ch = buf.numberOfChannels, n = buf.length, by = bits / 8, size = 44 + n * ch * by, ab = new ArrayBuffer(size), v = new DataView(ab), p = 0;
    function s(str) { for (var i = 0; i < str.length; i++) v.setUint8(p++, str.charCodeAt(i)); } function u32(x) { v.setUint32(p, x, true); p += 4; } function u16(x) { v.setUint16(p, x, true); p += 2; }
    s('RIFF'); u32(size - 8); s('WAVE'); s('fmt '); u32(16); u16(1); u16(ch); u32(buf.sampleRate); u32(buf.sampleRate * ch * by); u16(ch * by); u16(bits); s('data'); u32(n * ch * by);
    var data = []; for (var c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    for (var i = 0; i < n; i++) for (c = 0; c < ch; c++) { var x = Math.max(-1, Math.min(1, data[c][i])); if (bits === 24) { var q = Math.round(x * 8388607); v.setUint8(p, q & 255); v.setUint8(p + 1, (q >> 8) & 255); v.setUint8(p + 2, (q >> 16) & 255); p += 3; } else { v.setInt16(p, Math.round(x * 32767), true); p += 2; } }
    return new Blob([ab], { type: 'audio/wav' });
  }

  window.D7Gen = { SR: SR, STYLES: STYLES, STYLE_KEYS: STYLE_KEYS, PRESETS: PRESETS, STEM_COLS: STEM_COLS, render: render, renderPreset: renderPreset, renderStem: renderStem, megaMix: megaMix, remix: remix, concat: concat, wav: wav, normalize: normalize, impulse: impulse, curve: curve, rng: rng };
})();
