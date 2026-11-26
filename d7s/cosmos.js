/* D7S · Cosmos real-life sounds generator — procedural synthesis of real-world sounds (no recordings). Seamless loops. */
(function () {
  'use strict';
  var G = window.D7Gen;
  function nb(c, sec, color) { // noise buffer: white / pink / brown
    var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1;
      if (color === 'pink') { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2; }
      else if (color === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function src(c, buf, t, dur, loop) { var s = c.createBufferSource(); s.buffer = buf; s.loop = loop !== false; s.start(t || 0); if (dur) s.stop((t || 0) + dur); return s; }
  function filt(c, type, f, q) { var x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q != null) x.Q.value = q; return x; }
  function gain(c, v) { var g = c.createGain(); g.gain.value = v; return g; }
  function pan(c, p) { if (!c.createStereoPanner) return gain(c, 1); var x = c.createStereoPanner(); x.pan.value = p; return x; }
  function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }
  function blip(c, o, t, f0, f1, dur, v, type) { var os = c.createOscillator(), g = c.createGain(); os.type = type || 'sine'; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.01, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); os.connect(g); g.connect(o); os.start(t); os.stop(t + dur + .02); }
  function burst(c, o, t, dur, v, f, q, nbuf) { var s = src(c, nbuf, t, dur + .05, true), bp = filt(c, 'bandpass', f, q || 1), g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); chain(s, bp, g, o); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var S = {
    rain: ['🌧 Deszcz', function (c, o, D) { var w = nb(c, 2, 'pink'); chain(src(c, w), filt(c, 'highpass', 500), filt(c, 'lowpass', 7000), gain(c, .9), o); var wn = nb(c, 1);
      for (var t = 0; t < D; t += rnd(.005, .04)) burst(c, o, t, rnd(.004, .02), rnd(.05, .25), rnd(2500, 9000), 2, wn); }],
    storm: ['⛈ Burza (deszcz + grzmoty)', function (c, o, D) { S.rain[1](c, o, D); var br = nb(c, 4, 'brown'); for (var t = rnd(.5, 2); t < D - 3; t += rnd(4, 9)) { var s = src(c, br, t, 5), lp = filt(c, 'lowpass', rnd(120, 300)), g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(1.5, 3), t + .05); g.gain.exponentialRampToValueAtTime(.001, t + rnd(3, 5)); chain(s, lp, g, o); burst(c, o, t, rnd(.3, .8), 1.2, 1800, .5, nb(c, 1)); } }],
    thunder: ['🌩 Grzmot', function (c, o, D) { var br = nb(c, 4, 'brown'); for (var t = .2; t < D - 2; t += rnd(3, 6)) { var s = src(c, br, t, 5), lp = filt(c, 'lowpass', 220), g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(3, t + .08); for (var k = 1; k < 6; k++) g.gain.linearRampToValueAtTime(rnd(.8, 2.5), t + k * .35); g.gain.exponentialRampToValueAtTime(.001, t + 4.5); chain(s, lp, g, o); } }],
    wind: ['🌬 Wiatr', function (c, o, D) { var w = nb(c, 3, 'pink'); for (var k = 0; k < 2; k++) { var s = src(c, w), bp = filt(c, 'bandpass', 500, 1.5), g = gain(c, .0), p = pan(c, k ? .5 : -.5); bp.frequency.setValueAtTime(400, 0); g.gain.setValueAtTime(.3, 0);
      for (var t = 0; t < D; t += rnd(1.5, 3)) { bp.frequency.linearRampToValueAtTime(rnd(250, 1400), t); g.gain.linearRampToValueAtTime(rnd(.4, 1.6), t); } chain(s, bp, g, p, o); } }],
    ocean: ['🌊 Ocean / fale', function (c, o, D) { var w = nb(c, 3, 'pink'); for (var k = 0; k < 2; k++) { var s = src(c, w), lp = filt(c, 'lowpass', 600), g = gain(c, .1), p = pan(c, k ? .4 : -.4);
      for (var t = k * 1.7; t < D; ) { var per = rnd(5, 8); g.gain.linearRampToValueAtTime(.15, t); g.gain.linearRampToValueAtTime(rnd(1.2, 2), t + per * .45); g.gain.linearRampToValueAtTime(.2, t + per); lp.frequency.linearRampToValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(2500, t + per * .45); lp.frequency.linearRampToValueAtTime(500, t + per); t += per; } chain(s, lp, g, p, o); } }],
    birds: ['🐦 Ptaki (las)', function (c, o, D) { for (var t = .1; t < D - .5; t += rnd(.15, .9)) { var p = pan(c, rnd(-.8, .8)); p.connect(o); var sp = Math.floor(rnd(0, 4)), f = rnd(2200, 5200);
      if (sp === 0) for (var k = 0; k < 3; k++) blip(c, p, t + k * .09, f, f * 1.4, .07, .12);
      else if (sp === 1) blip(c, p, t, f * 1.3, f * .7, .25, .1);
      else if (sp === 2) for (k = 0; k < 6; k++) blip(c, p, t + k * .045, f, f * .9, .035, .08);
      else { blip(c, p, t, f, f * 1.6, .12, .1); blip(c, p, t + .14, f * 1.6, f, .18, .09); } } }],
    fire: ['🔥 Ogień / ognisko', function (c, o, D) { chain(src(c, nb(c, 3, 'brown')), filt(c, 'lowpass', 400), gain(c, .9), o); var w = nb(c, 1);
      for (var t = 0; t < D; t += rnd(.01, .12)) { var p = pan(c, rnd(-.6, .6)); p.connect(o); burst(c, p, t, rnd(.002, .012), rnd(.2, .9), rnd(1500, 6000), 1, w); } }],
    city: ['🏙 Miasto / ruch uliczny', function (c, o, D) { chain(src(c, nb(c, 3, 'brown')), filt(c, 'lowpass', 300), gain(c, 1.2), o); var w = nb(c, 3, 'pink');
      for (var t = rnd(0, 2); t < D - 4; t += rnd(2.5, 6)) { var s = src(c, w, t, 5), bp = filt(c, 'bandpass', 600, .8), g = c.createGain(), p = pan(c, -1); var d = rnd(2.5, 4.5);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(.8, 1.6), t + d / 2); g.gain.linearRampToValueAtTime(0, t + d); bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(450, t + d); if (p.pan) { p.pan.setValueAtTime(-1, t); p.pan.linearRampToValueAtTime(1, t + d); } chain(s, bp, g, p, o); }
      for (t = rnd(3, 6); t < D - 1; t += rnd(7, 14)) { [370, 440].forEach(function (f) { blip(c, o, t, f, f, .5, .05, 'sawtooth'); }); } }],
    crowd: ['👥 Tłum / klub (gwar)', function (c, o, D) { for (var v = 0; v < 18; v++) { var os = c.createOscillator(), g = gain(c, 0), p = pan(c, rnd(-.9, .9)); os.type = 'sawtooth'; os.frequency.value = rnd(95, 240);
      var F1 = filt(c, 'bandpass', rnd(400, 800), 6), F2 = filt(c, 'bandpass', rnd(1100, 2400), 8); os.connect(F1); os.connect(F2); F1.connect(g); F2.connect(g); g.connect(p); p.connect(o);
      for (var t = 0; t < D; t += rnd(.12, .35)) { g.gain.linearRampToValueAtTime(Math.random() < .6 ? rnd(.02, .07) : 0, t); os.frequency.linearRampToValueAtTime(rnd(95, 240), t); F1.frequency.linearRampToValueAtTime(rnd(350, 850), t); } os.start(0); os.stop(D + .5); }
      chain(src(c, nb(c, 2, 'pink')), filt(c, 'bandpass', 900, .7), gain(c, .15), o); }],
    applause: ['👏 Brawa', function (c, o, D) { var w = nb(c, 1); for (var t = 0; t < D; t += rnd(.003, .012)) { var p = pan(c, rnd(-.9, .9)); p.connect(o); burst(c, p, t, rnd(.01, .03), rnd(.1, .35), rnd(900, 2500), 1.5, w); } }],
    vinyl: ['💿 Winyl (trzaski)', function (c, o, D) { chain(src(c, nb(c, 2, 'pink')), filt(c, 'bandpass', 3500, .4), gain(c, .08), o); chain(src(c, nb(c, 2, 'brown')), filt(c, 'lowpass', 60), gain(c, .5), o); var w = nb(c, 1);
      for (var t = 0; t < D; t += rnd(.02, .25)) burst(c, o, t, rnd(.001, .004), rnd(.2, .8), rnd(2000, 7000), 1, w); }],
    heartbeat: ['❤️ Bicie serca (70 BPM)', function (c, o, D) { var per = 60 / 70; for (var t = .05; t < D; t += per) { blip(c, o, t, 70, 40, .16, 1.2); blip(c, o, t + .28, 62, 38, .14, .8); } }],
    space: ['🪐 Kosmiczny dron', function (c, o, D) { var lp = filt(c, 'lowpass', 600, 4), g = gain(c, .25); var lfo = c.createOscillator(), lg = gain(c, 400); lfo.frequency.value = .07; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(0); lfo.stop(D + 1);
      [41.2, 61.7, 82.4, 123.5].forEach(function (f, i) { [-8, 8].forEach(function (d) { var os = c.createOscillator(), p = pan(c, d > 0 ? .6 : -.6); os.type = i % 2 ? 'triangle' : 'sawtooth'; os.frequency.value = f; os.detune.value = d; chain(os, p, lp); os.start(0); os.stop(D + 1); }); });
      var cv = c.createConvolver(); cv.buffer = G.impulse(c, 4, 2); chain(lp, g, o); chain(lp, cv, gain(c, .3), o);
      for (var t = 1; t < D - 2; t += rnd(2, 5)) blip(c, o, t, rnd(800, 2400), rnd(300, 4000), rnd(.8, 2), .03); }],
    river: ['🏞 Strumień / rzeka', function (c, o, D) { var w = nb(c, 3, 'pink'); for (var k = 0; k < 3; k++) { var s = src(c, w), bp = filt(c, 'bandpass', 900, 1), g = gain(c, .35), p = pan(c, k - 1);
      for (var t = 0; t < D; t += rnd(.2, .6)) bp.frequency.linearRampToValueAtTime(rnd(500, 2500), t); chain(s, bp, g, p, o); }
      for (t = 0; t < D; t += rnd(.05, .3)) blip(c, o, t, rnd(300, 900), rnd(900, 2500), rnd(.02, .06), .08); }],
    crickets: ['🦗 Świerszcze (noc)', function (c, o, D) { for (var k = 0; k < 4; k++) { var f = rnd(3800, 5200), p = pan(c, rnd(-.8, .8)); p.connect(o);
      for (var t = rnd(0, 1); t < D; t += rnd(.6, 1.4)) for (var n = 0; n < 3; n++) blip(c, p, t + n * .055, f, f, .04, .06); } }],
    clock: ['🕰 Zegar (tik-tak)', function (c, o, D) { var w = nb(c, 1); for (var t = 0, i = 0; t < D; t += .5, i++) burst(c, o, t, .015, .9, i % 2 ? 2600 : 3400, 6, w); }],
    train: ['🚆 Pociąg', function (c, o, D) { chain(src(c, nb(c, 3, 'brown')), filt(c, 'lowpass', 250), gain(c, 1.4), o); var w = nb(c, 1);
      for (var t = 0; t < D; t += 1.6) { [0, .14, .8, .94].forEach(function (d) { burst(c, o, t + d, .06, .9, 400, 2, w); blip(c, o, t + d, 120, 60, .08, .5); }); } }],
    heli: ['🚁 Helikopter', function (c, o, D) { var w = nb(c, 2, 'pink'); for (var t = 0; t < D; t += 1 / 4.7) burst(c, o, t, .12, .9, 180, .8, w); chain(src(c, nb(c, 2)), filt(c, 'bandpass', 2500, 2), gain(c, .05), o); }],
    scifi: ['📡 Sci-fi / radio', function (c, o, D) { chain(src(c, nb(c, 2)), filt(c, 'bandpass', 2000, .7), gain(c, .05), o); for (var t = .2; t < D; t += rnd(.15, .8)) { var f = rnd(600, 3000); blip(c, o, t, f, Math.random() < .5 ? f : f * rnd(.5, 2), rnd(.05, .3), .08, Math.random() < .5 ? 'square' : 'sine'); } }]
  };
  var KEYS = Object.keys(S);
  function render(key, sec) {
    sec = sec || 12; var sr = G.getSR ? G.getSR() : 48000, xf = 1.5, OAC = window.OfflineAudioContext, c = new OAC(2, Math.ceil((sec + xf) * sr), sr), out = c.createDynamicsCompressor(); out.threshold.value = -6; out.ratio.value = 3; out.connect(c.destination);
    S[key][1](c, out, sec + xf);
    return c.startRendering().then(function (b) { // crossfade tail into head -> seamless loop
      var n = Math.round(sec * sr), x = Math.round(xf * sr), o = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: sr });
      for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), od = o.getChannelData(ch); for (var i = 0; i < n; i++) { var v = d[i]; if (i < x) { var k = i / x; v = d[i] * Math.sin(k * Math.PI / 2) + d[n + i] * Math.cos(k * Math.PI / 2); } od[i] = v; } }
      return { buffer: G.normalize(o, .8), name: S[key][0], bpm: 0, key: key };
    });
  }
  window.D7Cosmos = { SOUNDS: S, KEYS: KEYS, render: render };
})();
