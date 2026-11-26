/* DD DJ 3.0.1 · Endless Generator Pro — key/scale lock, genre groove templates, fill library, euclidean polyrhythms,
   chord voicings, stab rhythms, bass/acid/dub mutations, 4/8/16-bar builds, quantized event queue. Original code. */
(function () {
  'use strict';
  var A = window.DDA, ST = window.DDStyles, V = A.voice;
  var G = { style: null, energy: .7, bar: 0, layers: { k: 1, s: 1, h: 1, p: 1, b: 1, c: 1, l: 1, v: 1 }, mute: {}, tmpMute: {}, endless: true, seed: 7, keyLock: true, root: null, q: [] };
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  G.rng = rng;
  var R = rng(Date.now() & 0xffff), Rm = Math.random;
  function pick(a, r) { return a[Math.floor((r || R)() * a.length)]; }
  var mtof = G.mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  // ---- genre groove templates: swing, snare lay-back (s), chord push (c), hat accent curve
  var GROOVE = {
    hiphop: { sw: .16, s: .012, c: .006, acc: [1, .55, .75, .5, 1, .55, .8, .5, 1, .55, .75, .5, 1, .6, .8, .55] },
    house: { sw: .1, s: .002, c: -.002, acc: [.7, .5, 1, .55, .7, .5, 1, .55, .7, .5, 1, .55, .7, .5, 1, .6] },
    techno: { sw: .0, s: 0, c: 0, acc: [.85, .6, .9, .65, .85, .6, .9, .65, .85, .6, .9, .65, .85, .6, .95, .7] },
    synth: { sw: .03, s: 0, c: 0, acc: [.9, .6, .85, .6, .9, .6, .85, .6, .9, .6, .85, .6, .9, .6, .85, .65] },
    beats: { sw: .08, s: .004, c: 0, acc: [1, .6, .8, .6, 1, .6, .85, .6, 1, .6, .8, .6, 1, .65, .85, .6] },
    bass: { sw: .02, s: .002, c: 0, acc: [1, .6, .8, .6, 1, .6, .8, .6, 1, .6, .8, .6, 1, .6, .8, .6] },
    voices: { sw: .06, s: .003, c: 0, acc: [.9, .55, .8, .55, .9, .55, .8, .55, .9, .55, .8, .55, .9, .55, .8, .6] },
    rasta: { sw: .12, s: .008, c: .009, acc: [.7, .45, 1, .5, .7, .45, 1, .5, .7, .45, 1, .5, .7, .45, 1, .55] }
  };
  function groove(s) { return (s.id.indexOf('rasta') === 0 || (s.c && s.c.type === 'skank')) ? GROOVE.rasta : (GROOVE[s.cat] || GROOVE.techno); }
  // ---- arrangement
  var PLAN = [['intro', 8], ['groove', 16], ['build', 8], ['drop', 16], ['break', 8], ['build', 8], ['drop', 16], ['groove', 8]];
  var MASK = { intro: 'khp', groove: 'kshpbc', build: 'shpclv', drop: 'kshpbclv', break: 'clvp', outro: 'khb' };
  G.SECT_PL = { intro: 'Intro', groove: 'Groove', build: 'Build-up', drop: 'DROP', break: 'Breakdown', outro: 'Outro' };
  G.section = 'intro'; G.secBar = 0; G.secLen = 8; G.planIdx = 0;
  var STABS = ['x..x..x.........', '...x.....x......', 'x.x...x.x.......', '..x...x...x...x.', 'x.....x...x.....', 'x..x..x...x..x..', '.x..x..x..x..x..', 'x...x.x...x.x...'];
  var VOICING = { triad: [0, 2, 4], inv1: [2, 4, 7], inv2: [4, 7, 9], sus2: [0, 1, 4], sus4: [0, 3, 4], add9: [0, 2, 4, 8], sev: [0, 2, 4, 6], open: [0, 4, 9] };
  var FILLS = ['roll16', 'roll32', 'toms', 'kickdbl', 'hatstut', 'claptrip', 'gap', 'flam', 'rimrun', 'snarebuild'];
  G.FILLS = FILLS;
  function euclid(k, n, rot) { var p = [], b = 0; for (var i = 0; i < n; i++) { var v = Math.floor((i + 1) * k / n) - Math.floor(i * k / n); p.push(v); } if (rot) p = p.slice(rot).concat(p.slice(0, rot)); return p; }
  G.euclid = euclid;
  G.play = function (id, opts) {
    var s = ST.BY[id] || ST.LIST[0]; opts = opts || {}; A.init();
    var first = !A.playing; G.pending = { s: s, opts: opts };
    if (first) { G.secBar = -1; apply(s, opts, false); A.setBpm(opts.bpm || s.bpm); A.seq = seq; A.start(); }
    else if (opts.now) { apply(s, opts, true); A.setBpm(opts.bpm || s.bpm); }
    else if (!opts.nextBar && opts.glide !== false) A.glideBpm(opts.bpm || s.bpm, 4);
    A.emit('style', s); return s;
  };
  function apply(s, opts, keep) {
    G.style = s; G.pending = null; G.seed = opts.seed || Math.floor(Rm() * 1e9); R = rng(G.seed); G.groove = groove(s);
    if (!G.keyLock || G.root == null) G.root = s.key; // harmonic lock: keep the running root across style changes
    if (s.k) { A.kickPre && A.kickPre.gain.setTargetAtTime(.9 + (s.k.drv || 2) * .18, A.ctx.currentTime, .05); }
    G.melody = mkMelody(); G.progShift = 0; G.voicing = s.c && s.c.sev ? 'sev' : 'triad'; G.chordPat = s.c ? s.c.pat : null; G.hatPat = s.d.h || null; G.poly = null; G.fill = null;
    if (!keep || opts.section) { G.planIdx = opts.section === 'drop' ? 3 : opts.section === 'build' ? 2 : 0; var p = PLAN[G.planIdx]; G.section = opts.section || p[0]; G.secLen = p[1]; G.secBar = keep ? 0 : -1; }
    A.setEchoBeats(s.echoB || .75); G.bassPat = s.b ? s.b.pat : null;
    A.emit('section', G.section);
  }
  function mkMelody() { var m = [], d = 0; for (var i = 0; i < 32; i++) { d += Math.floor(R() * 5) - 2; if (d > 7) d -= 4; if (d < -2) d += 3; m.push(d); } return m; }
  G.stop = function () { A.stop(); G.q.length = 0; A.emit('style', null); };
  // ---- mutations (more random patterns)
  G.mutateNow = function (heavy) { if (!G.style) return; var n = heavy ? 4 : 2; G.melody = mkMelody(); G.progShift = (G.progShift + 1) % 4;
    mutateBass(); mutateHats(); if (R() < .6 || heavy) mutatePoly(); if (R() < .5 || heavy) mutateChords(); if (heavy) G.fill = pick(FILLS); A.emit('mutate', n); };
  G.jump = function (sec, len) { var i = PLAN.findIndex(function (p) { return p[0] === sec; }); if (i < 0) return; G.planIdx = i; G.section = sec; G.secLen = len || PLAN[i][1]; G.secBar = -1; G._jump = true; };
  function mutateBass() { var s = G.style; if (!s.b) return; var p = s.b.pat.split(''), r = R(), e = G.energy;
    if (r < .2) { var k = 4 + Math.floor(R() * 4), eu = euclid(k, 16, Math.floor(R() * 4)); p = eu.map(function (v, i) { return v ? (i % 8 === 0 ? '0' : pick(['0', '0', '4', 'o', '2'])) : '.'; }); } // euclid bass
    else for (var i = 0; i < 16; i++) { if (p[i] === '.' && R() < .07 * e) p[i] = R() < .5 ? '0' : 'o'; else if (/[0-7o]/.test(p[i]) && R() < .12) p[i] = pick(['0', '2', '4', '6', 'o']); }
    if (R() < .35 && p[14] === '.') p[14] = pick(['4', '6', '1']); // passing note into next chord
    if (s.b.type === 'dub' && R() < .3) p[0] = '.'; // dub drop on the one
    G.bassPat = p.join(''); }
  function mutateHats() { var h = G.style.d.h; if (!h) return; var p = h.split(''), e = G.energy;
    for (var i = 0; i < 16; i++) { if (p[i] === '.' && R() < .12 * e) p[i] = 'o'; else if (p[i] === 'x' && R() < .05 * e) p[i] = pick(['R', 'r']); }
    G.hatPat = p.join(''); G.openFlip = R() < .4; }
  function mutatePoly() { var n = pick([3, 5, 6, 7, 12, 10]), k = Math.max(2, Math.min(n - 1, Math.round(n * (.3 + R() * .35)))); G.poly = { n: n, p: euclid(k, n, Math.floor(R() * n)), v: pick(['perc', 'rim', 'tom', 'shaker', 'perc']), f: pick([280, 340, 420, 520, 640]) }; }
  function mutateChords() { var s = G.style; if (!s.c) return; G.voicing = pick(Object.keys(VOICING)); if ((s.c.len || 2) <= 2 && R() < .5) G.chordPat = pick(STABS); }
  function has(l) { return G.layers[l] && !G.mute[l] && !G.tmpMute[l] && MASK[G.section].indexOf(l) >= 0; }
  function vel(c) { return c === 'X' ? 1 : c === 'x' ? .8 : c === 'o' ? .42 : c === 'r' || c === 'R' ? .7 : 0; }
  function hum(t) { return t + (Rm() - .5) * .006 * A.settings.human; }
  function vh(v) { var h = A.settings.human; return Math.max(.1, Math.min(1, v * (1 - h * .12 + Rm() * h * .12))); }
  var scaleNote = G.scaleNote = function (root, deg) { var sc = ST.SC[G.style ? G.style.sc : 'minor'] || ST.SC.minor, o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7; return root + sc[i] + 12 * o; };
  function chordRoot(bar) { var pr = G.style.prog; return pr[(bar + G.progShift) % pr.length]; }
  G.chordRoot = function () { return G.style ? chordRoot(G.bar) : 0; };
  // quantized event queue: fn(t, stepDur) runs inside the scheduler on the exact beat/bar step
  G.queue = function (fn, div) { G.q.push({ fn: fn, div: div || 4 }); if (!A.playing && A.ctx) { try { fn(A.ctx.currentTime + .02, A.stepDur()); } catch (e) { console.error(e); } G.q.pop(); } };

  // ---- per-step sequencer (exact audio time t0)
  function seq(step, t0, sd) {
    var s = G.style; if (!s) return; var i = step % 16;
    if (i === 0) barStart(step / 16 | 0, t0, sd);
    s = G.style; var gr = G.groove, sw = (s.sw + gr.sw * .5 + A.settings.swing * .5) * sd * .5, t = (i % 2 === 1) ? t0 + sw : t0;
    if (G.q.length) { for (var qi = 0; qi < G.q.length; qi++) { var qe = G.q[qi]; if (step % qe.div === 0) { G.q.splice(qi--, 1); try { qe.fn(t0, sd); } catch (e) { console.error(e); } } } }
    var d = s.d, bar = G.bar, sec = G.section, e = G.energy, acc = gr.acc[i];
    var lastBarOfBuild = sec === 'build' && G.secBar === G.secLen - 1, fillBar = G.fillNow;
    // kick
    if (d.k && has('k') && !(lastBarOfBuild && i >= 8) && !(fillBar === 'gap' && i >= 12)) { var kv = vel(d.k[i]); if (kv) V.kick(t0, kv, s.k); else if (fillBar === 'kickdbl' && i >= 12 && i % 2 === 0) V.kick(t0, .75, s.k); }
    if (d.s && has('s')) { var sv = vel(d.s[i]); if (sv) V.snare(hum(t + gr.s), vh(sv), { rev: d.rev }); }
    if (d.c && has('s')) { var cv = vel(d.c[i]); if (cv) V.clap(hum(t + gr.s), vh(cv)); }
    if (has('h') && !(fillBar === 'gap' && i >= 12)) {
      var hp = G.hatPat;
      if (hp) { var hc = hp[i], hv = vel(hc) * (.6 + .4 * acc); if (hv) { if (hc === 'r' || hc === 'R' || (fillBar === 'hatstut' && i >= 12)) { var n = hc === 'R' ? 2 : 3; for (var j = 0; j < n; j++) V.hat(t + j * sd / n, vh(hv * (.65 + .35 * j / n)), false, { metal: d.metal }); } else V.hat(hum(t), vh(hv), false, { metal: d.metal }); } }
      if (d.o) { var ov = vel(d.o[i]); if (ov) V.hat(hum(t), vh(ov), true); else if (G.openFlip && i === 14 && bar % 2 === 1) V.hat(t, .6, true); }
      if (d.sh) { var shv = vel(d.sh[i]); if (shv) V.shaker(hum(t), vh(shv * (.6 + .4 * acc))); }
    }
    if (has('p')) {
      if (d.p) { var pv = vel(d.p[i]); if (pv) V.perc(hum(t), vh(pv), 320 + (i % 3) * 90, .11); }
      if (d.r) { var rv = vel(d.r[i]); if (rv) V.rim(hum(t), vh(rv)); }
      if (d.t) { var tv = vel(d.t[i]); if (tv) V.tom(hum(t), vh(tv), [110, 150, 190][i % 3]); }
      if (G.poly && (sec === 'groove' || sec === 'drop' || sec === 'break')) { var P = G.poly; if (P.p[step % P.n]) { var pvv = .45 + .25 * acc; if (P.v === 'rim') V.rim(hum(t), pvv); else if (P.v === 'tom') V.tom(hum(t), pvv, P.f / 2.5); else if (P.v === 'shaker') V.shaker(hum(t), pvv); else V.perc(hum(t), pvv, P.f, .09); } }
    }
    // fills (library) on the last bar of an 8-bar phrase / before section change
    if (fillBar && i >= 8 && has('s')) fill(fillBar, i, t0, sd);
    // build: snare roll accelerating over the last 4 bars of the build (works for 4/8/16-bar builds)
    if (sec === 'build') { var bb = G.secBar, frac = (bb * 16 + i) / (G.secLen * 16), left = G.secLen - bb;
      if (left <= 4) { var div = left === 1 ? (i >= 8 ? 4 : 2) : left === 2 ? 1 : (i % 2 === 0 ? 1 : 0); for (var q = 0; q < div; q++) V.snare(t0 + q * sd / div, .22 + .68 * frac, {}); } }
    // bass (key-locked)
    if (s.b && has('b') && G.bassPat) { var bc = G.bassPat[i];
      if (bc && bc !== '.' && bc !== '-') { var len = 1; while (i + len < 16 && G.bassPat[i + len] === '-') len++;
        var deg = bc === 'o' ? 7 : +bc, m = scaleNote(G.root, chordRoot(bar) + deg) - (s.b.type === '808' || s.b.type === 'sub' || s.b.type === 'dub' ? 12 : 0);
        while (m > 52) m -= 12; while (m < 28) m += 12;
        var slide = (s.b.slide && G.prevBass && R() < s.b.slide) ? G.prevBass : null, ac = (i % 4 === 0 || R() < .2) ? 1 : .75;
        V.bass(t, mtof(m), len * sd * (s.b.type === 'acid' ? .9 : .95), ac, s.b, slide); G.prevBass = mtof(m); } }
    // chords (voicings + stab rhythms)
    if (s.c && has('c') && G.chordPat) { var cc = G.chordPat[i % G.chordPat.length];
      if (cc === 'x') { var cl = s.c.len || 2, cr = chordRoot(bar), base = G.root + 24, vc = VOICING[G.voicing] || VOICING.triad, tc = t + gr.c;
        for (var vi = 0; vi < vc.length; vi++) V.tone(tc, mtof(scaleNote(base, cr + vc[vi])), cl * sd, .78, s.c); } }
    // lead
    if (s.l && has('l') && (sec !== 'groove' || G.secBar >= 8)) { var lc = s.l.pat[i];
      if (lc === 'x') { var lroot = G.root + 12 * (s.l.oct || 3) - 12, note;
        if (s.l.mode === 'arp') { var tones = [0, 2, 4, 7, 9, 7, 4, 2]; G.arp = ((G.arp || 0) + 1) % tones.length; note = scaleNote(lroot, chordRoot(bar) + tones[G.arp]); }
        else note = scaleNote(lroot, G.melody[(bar % 2) * 16 + i]);
        V.tone(t, mtof(note), (s.l.mode === 'arp' ? 1 : 2) * sd, .72 + Rm() * .25, s.l); } }
    // formant voices
    if (s.v && has('v') && (!s.v.every || bar % s.v.every === 0)) { var vch = s.v.pat[i % s.v.pat.length];
      if (vch === 'x') { var vroot = G.root + 24, vn = scaleNote(vroot, chordRoot(bar) + (s.v.rnd ? pick([0, 2, 4, 7, 9]) : 0)), vw = s.v.rnd ? pick(['a', 'e', 'i', 'o', 'u']) : s.v.vowel;
        var vo = { type: s.v.type, vowel: vw, vowel2: s.v.vowel2, echo: s.v.echo, rev: s.v.rev, glide: s.v.type === 'chop' ? 1.06 : 0 };
        if (s.v.chord) [0, 2, 4].forEach(function (dg) { V.voice(t, mtof(scaleNote(vroot, chordRoot(bar) + dg)), (s.v.len || 2) * sd, .45, vo); });
        else V.voice(t, mtof(vn), (s.v.len || (s.v.type === 'chop' ? .9 : 2)) * sd, .85, vo); } }
    if (s.siren && i === 0 && bar % 16 === 12 && sec !== 'intro') V.siren(t, 8 * sd, mtof(scaleNote(G.root + 36, chordRoot(bar))));
    if (s.laser && i === 14 && bar % 8 === 3 && sec === 'drop') V.laser(t, mtof(scaleNote(G.root + 48, 4)));
    if (s.glitch && sec === 'drop' && i === 12 && bar % 4 === 3) { A.beatRepeat(true, .25, t0); A.at(t0 + 4 * sd, function () { A.beatRepeat(false); }); }
  }
  function fill(type, i, t0, sd) { var k = i - 8, v = .35 + k * .07;
    if (type === 'roll16' && i >= 12) V.snare(t0, v);
    else if (type === 'roll32' && i >= 12) { V.snare(t0, v); V.snare(t0 + sd / 2, v * .9); }
    else if (type === 'toms' && i >= 10 && i % 2 === 0) V.tom(t0, .55, [200, 170, 140, 115, 95][(i - 10) / 2 | 0] || 95);
    else if (type === 'claptrip' && i >= 12) { if (i % 2 === 0) for (var j = 0; j < 3; j++) V.clap(t0 + j * sd * 2 / 3, .5 + j * .1); }
    else if (type === 'flam' && (i === 12 || i === 14)) { V.snare(t0 - .018, .35); V.snare(t0, .8); }
    else if (type === 'rimrun' && i >= 12) { V.rim(t0, .6); V.rim(t0 + sd / 2, .45); }
    else if (type === 'snarebuild' && i >= 8 && i % 2 === 0) V.snare(t0, .3 + k * .06); }
  function barStart(absBar, t, sd) {
    G.bar = absBar; G.secBar++; G.tmpMute = G.tmpMuteNext || {}; G.tmpMuteNext = null;
    if (G.secBar >= G.secLen) {
      G.planIdx = (G.planIdx + 1) % PLAN.length; var p = PLAN[G.planIdx], len = p[1];
      if (p[0] === 'build') len = G.energy > .85 ? pick([4, 8]) : G.energy < .4 ? pick([8, 16]) : pick([4, 8, 8, 16]);
      if (G.energy > .85 && p[0] === 'break') len = 4; if (G.energy < .35 && p[0] === 'drop') len = 8;
      G.section = p[0]; G.secLen = len; G.secBar = 0;
      if (G.keyTarget != null) { G.root = G.keyTarget; G.keyTarget = null; A.at(t, function () { A.emit('key', G.root); }); } // key change lands on a phrase
      if (G.pending) { A.setBpm(G.pending.opts.bpm || G.pending.s.bpm); apply(G.pending.s, G.pending.opts, true); }
      var sec = G.section; sectionFx(sec, t, sd);
      if (G.endless && G.planIdx === 0) { G.mutateNow(); if (G.keyLock && R() < .3) G.keyTarget = keyMove(); }
      A.at(t, function () { A.emit('section', sec); });
    } else if (G._jump) { G._jump = false; G.secBar = 0; var js = G.section; A.at(t, function () { A.emit('section', js); }); sectionFx(js, t, sd); }
    if (G.pending && G.pending.opts.nextBar) { var po = G.pending.opts; A.setBpm(po.bpm || G.pending.s.bpm); apply(G.pending.s, po, true); if (po.section) { var ps = G.section; sectionFx(ps, t, sd); A.at(t, function () { A.emit('section', ps); }); } }
    // fills: last bar of 8-bar phrase (not in builds) or forced
    G.fillNow = G.fill || ((G.secBar % 8 === 7 || G.secBar === G.secLen - 1) && G.section !== 'build' && R() < .85 ? pick(FILLS) : null); G.fill = null;
    if (G.endless && absBar % 4 === 0 && absBar > 0) { if (R() < .3) G.progShift = (G.progShift + 1) % 4; if (R() < .3) mutateBass(); if (R() < .35) mutateHats(); if (R() < .2 * G.energy + .05) mutatePoly(); if (R() < .2) mutateChords(); if (absBar % 16 === 0) G.melody = mkMelody(); }
    A.at(t, function () { A.emit('bar', { bar: absBar, sec: G.section, secBar: G.secBar, secLen: G.secLen }); });
  }
  function sectionFx(sec, t, sd) {
    if (sec === 'drop') { V.impact(t, 1); V.hat(t, 1, true, { od: 1.1 }); A.at(t, function () { A.setFilter(G.userFilter || 0); A.emit('filter', G.userFilter || 0); A.emit('drop', 1); }); }
    if (sec === 'build') { var dur = G.secLen * 16 * sd; V.riser(t, dur, .9); A.sweep(G.userFilter || 0, .5, dur * .95, t); }
    if (sec === 'break') { A.echoThrow(2, t); V.down(t, 16 * sd); }
  }
  function keyMove() { var r = G.root, mv = pick([5, -5, 7, -7, 2, -2, 3, -3]), n = r + mv; while (n > 47) n -= 12; while (n < 40) n += 12; return n; }
  G.setKey = function (midi) { G.keyTarget = midi; };
  G.random = function (cat) { var l = ST.LIST.filter(function (s) { return !cat || s.cat === cat; }); return l[Math.floor(Rm() * l.length)]; };
  G.banger = function () { var l = ST.LIST.filter(function (s) { return s.e >= 5; }); return G.play(l[Math.floor(Rm() * l.length)].id, A.playing ? { nextBar: true, section: 'drop' } : { now: true, section: 'drop' }); };
  window.DDGen = G;
})();
