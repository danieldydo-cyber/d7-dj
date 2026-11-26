/* D7S v2 core: settings, auto-fix (error log + AudioContext recovery + self-test), sample library (IndexedDB + manifest + ZIP import). */
(function () {
  'use strict';
  var E = window.D7S, G = window.D7Gen;
  // ---------- settings ----------
  var DEF = { sr: 48000, wavBits: 24, vizRes: 'auto', dpr: 'auto', recRes: 'auto', fps: 60, vbps: 12, abps: 256, latency: 'interactive', aiOnline: false, aiUrl: '', theme: 'cosmos', big: false };
  var ST = Object.assign({}, DEF); try { Object.assign(ST, JSON.parse(localStorage.getItem('d7s-settings') || '{}')); } catch (e) {}
  window.D7S_SETTINGS = ST; E.settings = ST;
  E.saveSettings = function () { localStorage.setItem('d7s-settings', JSON.stringify(ST)); E.emit('settings', ST); };
  E.wavBits = function () { return +ST.wavBits || 24; };

  // ---------- auto-fix ----------
  var LOG = []; E.log = LOG;
  function log(level, msg) { var t = new Date(); LOG.unshift({ t: t.toLocaleTimeString('pl-PL'), level: level, msg: String(msg).slice(0, 300) }); if (LOG.length > 60) LOG.pop(); E.emit('log', LOG); }
  E.logMsg = log;
  window.addEventListener('error', function (e) { if (e && e.target && e.target !== window && (e.target.tagName === 'AUDIO' || e.target.tagName === 'IMG')) return; log('błąd', (e.message || 'error') + (e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '')); fix('js'); }, true);
  window.addEventListener('unhandledrejection', function (e) { log('błąd', 'Promise: ' + (e.reason && (e.reason.message || e.reason) || 'odrzucone')); fix('promise'); });
  var started = false, gestureHook = false;
  E.on('ready', function () { started = true; var c = E.ctx; c.onstatechange = function () { log('info', 'AudioContext: ' + c.state); if (c.state !== 'running') fix('audio'); }; });
  function fix(why) {
    var c = E.ctx; if (!c || !started) return;
    if (c.state === 'suspended' || c.state === 'interrupted') { c.resume().then(function () { log('naprawa', 'Audio wznowione (' + why + ')'); }).catch(function () { hook(); }); if (c.state !== 'running') hook(); }
    if (c.state === 'closed') log('błąd', 'AudioContext zamknięty — kliknij „Restart audio”.');
  }
  function hook() { if (gestureHook) return; gestureHook = true; var h = function () { gestureHook = false; document.removeEventListener('pointerdown', h, true); document.removeEventListener('keydown', h, true); if (E.ctx) E.ctx.resume().then(function () { log('naprawa', 'Audio wznowione po dotknięciu'); }); }; document.addEventListener('pointerdown', h, true); document.addEventListener('keydown', h, true); }
  setInterval(function () { if (E.ctx && started && E.ctx.state !== 'running' && !document.hidden) fix('watchdog'); }, 3000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) fix('powrót'); });
  E.restartAudio = function () { location.reload(); };
  E.selfTest = function () {
    var R = [], ok = function (n, v, d) { R.push({ n: n, ok: !!v, d: d || '' }); };
    var c = E.ctx; ok('AudioContext', c && c.state === 'running', c ? c.state + ' · ' + c.sampleRate + ' Hz' : 'brak (kliknij START)');
    ok('Decki A/B', E.decks && E.decks.length === 2); ok('FX 1/2', E.fx1 && E.fx2); ok('40 padów', E.pads && E.pads.pads.length === 40, E.pads ? E.pads.pads.filter(function (p) { return p.buffer; }).length + ' z dźwiękiem' : '');
    ok('Generatory', G && G.PRESETS.length === 77, G.STYLE_KEYS.length + ' stylów'); ok('Cosmos', window.D7Cosmos && D7Cosmos.KEYS.length > 10, window.D7Cosmos ? D7Cosmos.KEYS.length + ' dźwięków' : '');
    var cv = document.createElement('canvas'), gl = cv.getContext('webgl'); ok('WebGL (wizualizacje)', !!gl);
    ok('Nagrywanie (MediaRecorder)', !!window.MediaRecorder); ok('Web MIDI', !!navigator.requestMIDIAccess, navigator.requestMIDIAccess ? '' : 'niedostępne (Android/Safari)');
    ok('Mikrofon API', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)); ok('IndexedDB (biblioteka)', !!window.indexedDB);
    var ls = false; try { localStorage.setItem('d7s-t', '1'); ls = true; } catch (e) {} ok('localStorage', ls);
    ok('Online', navigator.onLine, navigator.onLine ? '' : 'offline — radio/AI wyłączone');
    var p = G.render({ style: 'techno', mode: 'loop', bars: 1, seed: 7 }).then(function (r) { var m = 0, d = r.buffer.getChannelData(0); for (var i = 0; i < d.length; i += 64) m = Math.max(m, Math.abs(d[i])); ok('Render audio offline', m > .1, 'peak ' + m.toFixed(2)); return R; }).catch(function (e) { ok('Render audio offline', false, e.message); return R; });
    return p;
  };

  // ---------- sample library ----------
  var DB = null;
  function db() { if (DB) return DB; DB = new Promise(function (res, rej) { if (!window.indexedDB) return rej(new Error('brak IndexedDB')); var r = indexedDB.open('d7s', 1); r.onupgradeneeded = function () { r.result.createObjectStore('samples', { keyPath: 'id' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); return DB; }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('samples', mode), st = t.objectStore('samples'), out = fn(st); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); }; t.onerror = function () { rej(t.error); }; }); }); }
  var L = E.lib = { items: [], manifest: [] };
  L.list = function () { return tx('readonly', function (st) { return st.getAll(); }).then(function (a) { L.items = (a || []).map(function (x) { return { id: x.id, name: x.name, size: x.size, type: x.type, src: 'local' }; }); E.emit('lib', L); return L.items; }).catch(function (e) { log('info', 'Biblioteka: ' + e.message); return []; }); };
  L.add = function (name, ab, type) { var id = 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); return tx('readwrite', function (st) { st.put({ id: id, name: name, data: ab, type: type || '', size: ab.byteLength, added: Date.now() }); }).then(function () { return id; }); };
  L.del = function (id) { return tx('readwrite', function (st) { st.delete(id); }).then(L.list); };
  L.get = function (id) { return tx('readonly', function (st) { return st.get(id); }); };
  L.decode = function (item) { E.init();
    if (item.src === 'local') return L.get(item.id).then(function (x) { return E.ctx.decodeAudioData(x.data.slice(0)); });
    if (item.gen) { var g = item.gen.split(':'); if (g[0] === 'cosmos') return D7Cosmos.render(g[1], +g[2] || 12).then(function (r) { return r.buffer; }); if (g[0] === 'stem') return G.renderStem(g[1], +g[3] || 7, +g[2], E.clock.bpm, null, 2).then(function (r) { item.bpm = E.clock.bpm; return r.buffer; }); }
    return fetch(item.url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(function (ab) { return E.ctx.decodeAudioData(ab); });
  };
  L.importFiles = function (files, onProg) { var arr = Array.prototype.slice.call(files), n = 0, added = 0, ch = Promise.resolve();
    arr.forEach(function (f) { ch = ch.then(function () { n++; onProg && onProg(n, arr.length, f.name);
      if (/\.zip$/i.test(f.name)) return f.arrayBuffer().then(function (ab) { var ents = unzip(ab), c2 = Promise.resolve(); ents.forEach(function (e) { if (/\.(mp3|wav|ogg|flac|m4a|aif+)$/i.test(e.name)) c2 = c2.then(function () { added++; return L.add(e.name.split('/').pop(), e.data, ''); }); }); return c2; });
      if (!/^audio\//.test(f.type) && !/\.(mp3|wav|ogg|flac|m4a|aif+)$/i.test(f.name)) return null;
      return f.arrayBuffer().then(function (ab) { added++; return L.add(f.name, ab, f.type); }); }); });
    return ch.then(function () { return L.list().then(function () { return added; }); });
  };
  function unzip(ab) { // ZIP reader (stored + deflate via DecompressionStream is async → stored only; D7 pack is stored)
    var v = new DataView(ab), out = [], eocd = -1; for (var i = ab.byteLength - 22; i >= Math.max(0, ab.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('to nie jest ZIP'); var n = v.getUint16(eocd + 10, true), p = v.getUint32(eocd + 16, true);
    for (var k = 0; k < n; k++) { var method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      var name = new TextDecoder().decode(new Uint8Array(ab, p + 46, nl)); var lnl = v.getUint16(lo + 26, true), lel = v.getUint16(lo + 28, true), start = lo + 30 + lnl + lel;
      if (method === 0) out.push({ name: name, data: ab.slice(start, start + csize) }); else log('info', 'ZIP: pominięto skompresowany plik ' + name + ' (rozpakuj ZIP ręcznie)');
      p += 46 + nl + el + cl; }
    return out;
  }
  L.loadManifest = function (url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) { var base = new URL(url, location.href);
      var items = (j.items || []).map(function (x) { return Object.assign({}, x, { url: x.url ? new URL(x.url, base).href : null, src: x.gen ? 'gen' : 'url', pack: j.name || 'Manifest' }); }); L.manifest = L.manifest.filter(function (m) { return m.pack !== (j.name || 'Manifest'); }).concat(items); E.emit('lib', L); return items; }); };
})();
