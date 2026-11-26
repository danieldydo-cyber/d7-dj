/* DD DJ 3.0.1 · Specials 777 — 777 seeded DJ moments (beat/bar-quantized, key-locked). Original code. */
(function () {
  'use strict';
  var A = window.DDA, G = window.DDGen, V = A.voice;
  var SP = { auto: false, quant: 'beat', log: [], fired: 0 };
  function bl() { return 60 / A.bpm; }
  function key(deg, oct) { return G.mtof(G.scaleNote(G.root == null ? 45 : G.root, G.chordRoot() + deg) + 12 * (oct || 0)); }
  // each type: [name, icon, quantDiv(beat=4|bar=16), fn(t, sd, r)]
  var T = [
    ['Dub Echo Throw', '🌊', 4, function (t, sd, r) { A.echoThrow(2 + r() * 3, t); V.tone(t, key(pick(r, [0, 2, 4]), 3), sd, .9, { type: 'skank', echo: .7, spring: .5, bus: 'fx' }); }],
    ['Rasta Siren', '🚨', 4, function (t, sd, r) { V.siren(t, (2 + Math.floor(r() * 3)) * bl(), key(0, 2 + Math.floor(r() * 2))); }],
    ['Space Riser', '🚀', 16, function (t, sd, r) { var bars = pick(r, [1, 2, 4]), d = bars * 16 * sd; V.riser(t, d, 1); A.sweep(G.userFilter || 0, .45, d * .9, t); A.at(t + d, function () { A.setFilter(G.userFilter || 0); A.emit('filter', G.userFilter || 0); A.emit('drop', 1); }); V.impact(t + d, 1); return bars + ' t.'; }],
    ['Beat Repeat Stutter', '🔁', 4, function (t, sd, r) { var fr = pick(r, [.25, .125, .5]), beats = pick(r, [1, 2]); A.beatRepeat(true, fr, t); A.at(t + beats * bl(), function () { A.beatRepeat(false); }); return '1/' + Math.round(4 / fr) + ' × ' + beats; }],
    ['Breakdown Flip', '🌀', 16, function (t, sd, r) { G.jump('break', 4); return '4 t. → build'; }],
    ['Bass Drop', '💣', 16, function (t, sd, r) { V.dive(t, key(0, -1), 2 * bl()); V.impact(t, 1); A.echoThrow(1.5, t); }],
    ['Filter Sweep', '🎛', 16, function (t, sd, r) { var dn = r() < .5, d = 16 * sd; A.sweep(0, dn ? -.85 : .7, d, t); A.sweep(dn ? -.85 : .7, G.userFilter || 0, d, t + d); return dn ? 'LP' : 'HP'; }],
    ['Pattern Mutation', '🧬', 16, function (t, sd, r) { G.mutateNow(true); }],
    ['Laser Volley', '🔫', 4, function (t, sd, r) { var n = 4 + Math.floor(r() * 5); for (var i = 0; i < n; i++) V.laser(t + i * sd, key(pick(r, [0, 2, 4, 7]), 4)); return n + '×'; }],
    ['Air Horn Salvo', '📯', 4, function (t, sd, r) { V.horn(t, key(4, 2)); }],
    ['Kick Out → Slam', '🥁', 16, function (t, sd, r) { G.tmpMute = { k: 1, b: 1 }; G.tmpMuteNext = {}; V.riser(t, 16 * sd, .7); V.impact(t + 16 * sd, 1); }],
    ['Tape Stop', '📼', 4, function (t, sd, r) { var d = 2 * bl(); A.sweep(G.userFilter || 0, -.9, d, t); V.down(t, d, key(0, 3)); A.at(t, function () { A.genGain.gain.setTargetAtTime(.15 * A.genLevel, A.ctx.currentTime, d / 3); }); A.at(t + d, function () { A.genGain.gain.setTargetAtTime(A.genLevel, A.ctx.currentTime, .01); A.setFilter(G.userFilter || 0); A.emit('filter', G.userFilter || 0); }); }],
    ['Key Lift', '🔑', 16, function (t, sd, r) { var up = pick(r, [2, 5, 7, -5]); var n = G.root + up; while (n > 47) n -= 12; while (n < 40) n += 12; G.setKey(n); V.riser(t, 8 * sd, .6); return (up > 0 ? '+' : '') + up; }],
    ['Snare Roll → Drop', '🥁', 16, function (t, sd, r) { G.jump('build', 2); }],
    ['Chant Echo', '🗣', 4, function (t, sd, r) { V.voice(t, key(0, 2), 4 * sd, .9, { type: 'chant', vowel: pick(r, ['o', 'a', 'e']), echo: .7, rev: .3 }); }],
    ['Cosmic Arp Burst', '✨', 16, function (t, sd, r) { var tones = [0, 2, 4, 7, 9, 11, 14, 11, 9, 7, 4, 2, 0, 4, 7, 14], o = 3 + Math.floor(r() * 2); for (var i = 0; i < 16; i++) V.tone(t + i * sd, key(tones[i], o), sd, .8, { type: 'fmbell', ratio: 3, idx: 2.5, echo: .35, rev: .3, gain: .13 }); }]
  ];
  SP.TYPES = T;
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  SP.info = function (n) { n = ((Math.floor(+n) - 1) % 777 + 777) % 777 + 1; var r = G.rng(n * 7919 + 77), ti = Math.floor(r() * T.length); return { n: n, type: ti, name: T[ti][0], icon: T[ti][1], r: r }; };
  SP.fire = function (n, typeIdx) {
    A.init(); if (n == null) n = 1 + Math.floor(Math.random() * 777);
    var inf = SP.info(n); if (typeIdx != null) { inf.type = typeIdx; inf.name = T[typeIdx][0]; inf.icon = T[typeIdx][1]; }
    var tp = T[inf.type], div = SP.quant === 'bar' ? 16 : SP.quant === 'now' ? 1 : Math.max(4, tp[2]);
    if (!A.playing && (tp[2] === 16 && /Flip|Roll|Mutation|Kick/.test(tp[0]))) { G.play((G.style || window.DDStyles.BY.rastatechno).id, { now: true }); }
    G.queue(function (t, sd) { var extra = tp[3](t, sd, inf.r); SP.fired++; var e = { n: inf.n, name: inf.name, icon: inf.icon, extra: extra || '', at: t };
      A.at(t, function () { SP.log.unshift(e); SP.log.length = Math.min(SP.log.length, 12); A.emit('special', e); }); }, div);
    A.emit('specialq', inf); return inf;
  };
  A.on('bar', function (b) { if (!SP.auto || !A.playing) return; if (b.bar % 8 === 6 && Math.random() < .35 + G.energy * .4) SP.fire(); });
  window.DDSpecials = SP;
})();
