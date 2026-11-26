/* DD DJ 3.0 · Endless Generator — arrangement (intro/groove/build/drop/break), fills, rolls, risers,
   drops, chord + melody mutation. Drives DDA.seq on the sample-accurate clock. Original code. */
(function () {
  'use strict';
  var A = window.DDA, ST = window.DDStyles, V = A.voice;
  var G = { style: null, energy: .7, bar: 0, layers: { k: 1, s: 1, h: 1, p: 1, b: 1, c: 1, l: 1, v: 1 }, mute: {}, endless: true, seed: 7 };
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var R = rng(Date.now() & 0xffff), Rm = Math.random;
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  // arrangement plan (bars) — endless loops with variation
  var PLAN = [['intro', 8], ['groove', 16], ['build', 8], ['drop', 16], ['break', 8], ['build', 8], ['drop', 16], ['groove', 8]];
  var MASK = { intro: 'khp', groove: 'kshpbc', build: 'shpclv', drop: 'kshpbclv', break: 'clvp', outro: 'khb' };
  G.SECT_PL = { intro: 'Intro', groove: 'Groove', build: 'Build-up', drop: 'DROP', break: 'Breakdown', outro: 'Outro' };
  G.section = 'intro'; G.secBar = 0; G.secLen = 8; G.planIdx = 0;
  G.play = function (id, opts) {
    var s = ST.BY[id] || ST.LIST[0]; opts = opts || {}; A.init();
    var first = !A.playing; G.pending = { s: s, opts: opts };
    if (first) { G.secBar = -1; apply(s, opts, false); A.setBpm(opts.bpm || s.bpm); A.seq = seq; A.start(); }
    else if (opts.now) { apply(s, opts, true); A.setBpm(opts.bpm || s.bpm); }
    else if (!opts.nextBar && opts.glide !== false) A.glideBpm(opts.bpm || s.bpm, 4);
    A.emit('style', s);
    return s;
  };
  function apply(s, opts, keep) {
    G.style = s; G.pending = null; G.seed = (opts.seed || Math.floor(Rm() * 1e9)); R = rng(G.seed);
    G.melody = mkMelody(s); G.progShift = 0;
    if (!keep || opts.section) { G.planIdx = opts.section === 'drop' ? 3 : opts.section === 'build' ? 2 : 0; var p = PLAN[G.planIdx]; G.section = opts.section || p[0]; G.secLen = p[1]; G.secBar = keep ? 0 : -1; }
    if (s.echoB) A.setEchoBeats(s.echoB); else A.setEchoBeats(.75);
    G.bassPat = s.b ? s.b.pat : null; G.hatExtra = '';
    A.emit('section', G.section);
  }
  function mkMelody(s) { var m = [], d = 0; for (var i = 0; i < 32; i++) { d += Math.floor(R() * 5) - 2; if (d > 7) d -= 4; if (d < -2) d += 3; m.push(d); } return m; }
  G.stop = function () { A.stop(); A.emit('style', null); };
  G.mutateNow = function () { if (!G.style) return; G.melody = mkMelody(G.style); G.progShift = (G.progShift + 1) % 4; mutateBass(); A.emit('mutate', 1); };
  G.jump = function (sec) { var i = PLAN.findIndex(function (p) { return p[0] === sec; }); if (i < 0) return; G.planIdx = i; G.section = sec; G.secLen = PLAN[i][1]; G.secBar = -1; G._jump = true; };
  function mutateBass() { var s = G.style; if (!s.b) return; var p = s.b.pat.split(''); for (var i = 0; i < 16; i++) { if (p[i] === '.' && R() < .08 * G.energy) p[i] = R() < .5 ? '0' : 'o'; else if (/[0-7o]/.test(p[i]) && R() < .1) p[i] = String([0, 2, 4, 6][Math.floor(R() * 4)]); } G.bassPat = p.join(''); }
  function has(l) { return G.layers[l] && !G.mute[l] && MASK[G.section].indexOf(l) >= 0; }
  function vel(c) { return c === 'X' ? 1 : c === 'x' ? .8 : c === 'o' ? .42 : c === 'r' || c === 'R' ? .7 : 0; }
  function hum(t) { var h = A.settings.human; return t + (Rm() - .5) * .008 * h; }
  function vh(v) { return Math.max(.1, Math.min(1, v * (1 - A.settings.human * .15 + Rm() * A.settings.human * .15))); }
  function scaleNote(root, deg) { var sc = ST.SC[G.style.sc] || ST.SC.minor, o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7; return root + sc[i] + 12 * o; }
  function chordRoot(bar) { var pr = G.style.prog; return pr[(bar + G.progShift) % pr.length]; }

  // ---- per-step sequencer (called by DDA scheduler with exact audio time t)
  function seq(step, t0, sd) {
    var s = G.style; if (!s) return; var i = step % 16;
    if (i === 0) barStart(step / 16 | 0, t0, sd);
    s = G.style; var swing = (s.sw + A.settings.swing * .5) * sd * .5; var t = (i % 2 === 1) ? t0 + swing : t0;
    var d = s.d, bar = G.bar, sec = G.section, lastBar = G.secBar === G.secLen - 1, e = G.energy;
    var buildRoll = sec === 'build' && G.secBar >= G.secLen - 2;
    // drums
    if (d.k && has('k') && !(buildRoll && G.secBar === G.secLen - 1 && i >= 8)) { var kv = vel(d.k[i]); if (kv) V.kick(t0, vh(kv), s.k); }
    if (d.s && has('s')) { var sv = vel(d.s[i]); if (sv) V.snare(hum(t), vh(sv), { rev: d.rev }); }
    if (d.c && has('s')) { var cv = vel(d.c[i]); if (cv) V.clap(hum(t), vh(cv)); }
    if (has('h')) {
      if (d.h) { var hc = d.h[i], hv = vel(hc); if (hv) { if (hc === 'r' || hc === 'R') { var n = hc === 'r' ? 3 : 2; for (var j = 0; j < n; j++) V.hat(t + j * sd / n, vh(hv * (.7 + .3 * j / n)), false, { metal: d.metal }); } else V.hat(hum(t), vh(hv), false, { metal: d.metal }); }
        else if (e > .75 && i % 2 === 1 && Rm() < .12 * e) V.hat(hum(t), .3, false); }
      if (d.o) { var ov = vel(d.o[i]); if (ov) V.hat(hum(t), vh(ov), true); }
      if (d.sh) { var shv = vel(d.sh[i]); if (shv) V.shaker(hum(t), vh(shv)); }
    }
    if (has('p')) {
      if (d.p) { var pv = vel(d.p[i]); if (pv) V.perc(hum(t), vh(pv), 320 + (i % 3) * 90, .12); }
      if (d.r) { var rv = vel(d.r[i]); if (rv) V.rim(hum(t), vh(rv)); }
      if (d.t) { var tv = vel(d.t[i]); if (tv) V.tom(hum(t), vh(tv), [110, 150, 190][i % 3]); }
    }
    // fills: last bar of each 8-bar phrase
    if (G.secBar % 8 === 7 && sec !== 'build' && i >= 12 && has('s') && R() < .85) { var fv = .45 + (i - 12) * .15; if (s.fill === 'tom' || (G.bar & 1)) V.tom(t, fv, [200, 170, 140, 110][i - 12]); else V.snare(t, fv); }
    // build: snare roll accelerating 8th → 16th → 32nd
    if (sec === 'build') { var bb = G.secBar, frac = (bb * 16 + i) / (G.secLen * 16);
      if (bb >= G.secLen - 4) { var div = bb >= G.secLen - 1 ? 2 : bb >= G.secLen - 2 ? 1 : (i % 2 === 0 ? 1 : 0); for (var q = 0; q < div; q++) V.snare(t0 + q * sd / div, .25 + .7 * frac, {}); } }
    // bass
    if (s.b && has('b') && G.bassPat) { var bc = G.bassPat[i];
      if (bc && bc !== '.' && bc !== '-') { var len = 1; while (i + len < 16 && G.bassPat[i + len] === '-') len++;
        var deg = bc === 'o' ? 7 : +bc, root = s.key + 0, m = scaleNote(root, chordRoot(bar) + deg) - (s.b.type === '808' || s.b.type === 'sub' || s.b.type === 'dub' ? 12 : 0);
        while (m > 52) m -= 12; while (m < 28) m += 12;
        var slide = (s.b.slide && G.prevBass && R() < s.b.slide) ? G.prevBass : null;
        var acc = (i % 4 === 0 || R() < .2) ? 1 : .75; V.bass(t, mtof(m), len * sd * (s.b.type === 'acid' ? .9 : .95), acc, s.b, slide); G.prevBass = mtof(m); } }
    // chords
    if (s.c && has('c')) { var cc = s.c.pat[i % s.c.pat.length];
      if (cc === 'x') { var cl = s.c.len || 2, cr = chordRoot(bar), base = s.key + 24; [0, 2, 4].concat(s.c.sev ? [6] : []).forEach(function (dg) { V.tone(t, mtof(scaleNote(base, cr + dg)), cl * sd, .8, s.c); }); } }
    // lead
    if (s.l && has('l') && (sec !== 'groove' || G.secBar >= 8)) { var lc = s.l.pat[i];
      if (lc === 'x') { var lroot = s.key + 12 * (s.l.oct || 3) - 12, note;
        if (s.l.mode === 'arp') { var tones = [0, 2, 4, 7, 9, 7, 4, 2]; G.arp = ((G.arp || 0) + 1) % tones.length; note = scaleNote(lroot, chordRoot(bar) + tones[G.arp]); }
        else note = scaleNote(lroot, chordRoot(bar) * 0 + G.melody[(bar % 2) * 16 + i]);
        V.tone(t, mtof(note), (s.l.mode === 'arp' ? 1 : 2) * sd, .75 + Rm() * .25, s.l); } }
    // voices (formant)
    if (s.v && has('v') && (!s.v.every || bar % s.v.every === 0)) { var vc = s.v.pat[i % s.v.pat.length];
      if (vc === 'x') { var vroot = s.key + 24, vn = scaleNote(vroot, chordRoot(bar) + (s.v.rnd ? [0, 2, 4, 7, 9][Math.floor(Rm() * 5)] : 0)), vw = s.v.rnd ? 'aeiou'[Math.floor(Rm() * 5)] : s.v.vowel;
        var vo = { type: s.v.type, vowel: vw, vowel2: s.v.vowel2, echo: s.v.echo, rev: s.v.rev, glide: s.v.type === 'chop' ? 1.06 : 0 };
        if (s.v.chord) [0, 2, 4].forEach(function (dg) { V.voice(t, mtof(scaleNote(vroot, chordRoot(bar) + dg)), (s.v.len || 2) * sd, .5, vo); });
        else V.voice(t, mtof(vn), (s.v.len || (s.v.type === 'chop' ? .9 : 2)) * sd, .9, vo); } }
    // magic FX
    if (s.siren && i === 0 && bar % 16 === 12 && sec !== 'intro') V.siren(t, 2.4 * sd * 16 / 4);
    if (s.laser && i === 14 && bar % 8 === 3 && sec === 'drop') V.laser(t);
    if (s.glitch && sec === 'drop' && i === 12 && bar % 4 === 3) A.at(t, function () { A.beatRepeat(true, .25); A.at(t + 4 * sd, function () { A.beatRepeat(false); }); });
  }
  function barStart(absBar, t, sd) {
    G.bar = absBar; G.secBar++;
    if (G.secBar >= G.secLen) { // next section
      G.planIdx = (G.planIdx + 1) % PLAN.length; var p = PLAN[G.planIdx], len = p[1];
      if (G.energy > .85 && p[0] === 'break') len = 4; if (G.energy < .35 && p[0] === 'drop') len = 8;
      G.section = p[0]; G.secLen = len; G.secBar = 0;
      if (G.pending) { A.setBpm(G.pending.opts.bpm || G.pending.s.bpm); apply(G.pending.s, G.pending.opts, true); } // style change lands on a phrase boundary
      var sec = G.section;
      if (sec === 'drop') { V.impact(t, 1); V.hat(t, 1, true, { od: 1.2 }); A.at(t, function () { A.setFilter(G.userFilter || 0); A.emit('drop', 1); }); }
      if (sec === 'build') { V.riser(t, G.secLen * 16 * sd, .9); A.sweep(0, .55, G.secLen * 16 * sd * .95, t); }
      if (sec === 'break') { A.at(t, function () { A.echoThrow(2); }); V.down(t, 16 * sd); }
      if (G.endless && G.planIdx === 0) G.mutateNow();
      A.at(t, function () { A.emit('section', sec); });
    } else if (G._jump) { G._jump = false; G.secBar = 0; var js = G.section; A.at(t, function () { A.emit('section', js); }); if (js === 'drop') V.impact(t, 1); if (js === 'build') { V.riser(t, G.secLen * 16 * sd); A.sweep(0, .55, G.secLen * 16 * sd * .95, t); } }
    if (G.pending && G.pending.opts.nextBar) { A.setBpm(G.pending.opts.bpm || G.pending.s.bpm); apply(G.pending.s, G.pending.opts, true); }
    // endless mutations every 4 bars
    if (G.endless && absBar % 4 === 0 && absBar > 0) { if (R() < .35) G.progShift = (G.progShift + 1) % 4; if (R() < .3) mutateBass(); if (absBar % 16 === 0) G.melody = mkMelody(G.style); }
    A.at(t, function () { A.emit('bar', { bar: absBar, sec: G.section, secBar: G.secBar, secLen: G.secLen }); });
  }
  G.random = function (cat) { var l = ST.LIST.filter(function (s) { return !cat || s.cat === cat; }); return l[Math.floor(Rm() * l.length)]; };
  G.banger = function () { var l = ST.LIST.filter(function (s) { return s.e >= 5; }); return G.play(l[Math.floor(Rm() * l.length)].id, { now: !A.playing, section: 'drop' }); };
  window.DDGen = G;
})();
