/* D7 Super SI hub: status auto-refresh, apps/bots cards, Drive manifest, Bot D chat (offline rules + live check) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var NTFY = 'https://ntfy.sh/d7dj-dydo-a6405ab14ae4/json?poll=1&since=24h';
  var H = { apps: [], apks: [], status: null, drive: null, live: null, liveStatus: null, cat: 'Wszystko' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1800); }
  function fetchT(url, ms, opt) {
    var c = window.AbortController ? new AbortController() : null, id = c && setTimeout(function () { c.abort(); }, ms || 8000);
    return fetch(url, Object.assign({ cache: 'no-store', signal: c && c.signal }, opt || {})).finally(function () { clearTimeout(id); });
  }
  function j(url, ms) { return fetchT(url, ms).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function pill(id, txt, ok) { var e = $(id); e.textContent = txt; e.className = 'pill' + (ok === true ? ' ok' : ok === false ? ' bad' : ''); }

  // ---------------------------------------------------------- live tunnel: ntfy -> status.json fallback -> /api/status
  function liveFromNtfy() {
    return fetchT(NTFY, 8000).then(function (r) { return r.text(); }).then(function (t) {
      var lines = t.trim().split('\n').reverse();
      for (var i = 0; i < lines.length; i++) {
        try { var m = JSON.parse(lines[i]), msg = JSON.parse(m.message || '{}'), p = typeof msg.p === 'string' ? JSON.parse(msg.p) : msg; if (p.liveUrl) return p.liveUrl; } catch (e) {}
      }
      return null;
    }).catch(function () { return null; });
  }
  // image ping (no CORS needed): live tunnel serves favicon.png, a dead one (530) fails
  function ping(u, ms) {
    return new Promise(function (res) { var im = new Image(), done = false, to = setTimeout(function () { if (!done) { done = true; res(false); } }, ms || 7000);
      im.onload = function () { if (!done) { done = true; clearTimeout(to); res(true); } }; im.onerror = function () { if (!done) { done = true; clearTimeout(to); res(false); } };
      im.src = u + '/favicon.png?ssi=' + Date.now(); });
  }
  function checkLive(urls) {
    urls = urls.filter(Boolean).filter(function (u, i, a) { return /^https:\/\//.test(u) && a.indexOf(u) === i; });
    var k = 0;
    function next() { if (k >= urls.length) return Promise.resolve(null); var u = urls[k++]; return ping(u).then(function (ok) { return ok ? { url: u } : next(); }); }
    return next();
  }
  function refresh() {
    pill('#st-time', 'Odświeżam…');
    return Promise.all([
      j('status.json?' + Date.now()).catch(function () { return null; }),
      j('apps.json?' + Date.now()).catch(function () { return null; }),
      liveFromNtfy()
    ]).then(function (r) {
      H.status = r[0]; if (r[1]) { H.apps = r[1].apps || []; H.apks = r[1].apks || []; renderApps(); }
      if (H.status) pill('#st-pages', 'Pages: ' + H.status.pagesOk + '/' + H.status.pagesTotal + ' OK', H.status.pagesOk === H.status.pagesTotal ? true : null);
      var cands = [r[2]].concat(H.status ? [H.status.liveUrl].concat(H.status.liveCandidates || []) : []);
      return checkLive(cands);
    }).then(function (live) {
      H.live = live && live.url;
      if (H.live) { var e = $('#st-live'); e.innerHTML = '🟢 Live: <a href="' + esc(H.live) + '" target="_blank" rel="noopener">' + esc(H.live.replace('https://', '').split('.')[0]) + '</a>'; e.className = 'pill ok'; $('#c-mode').textContent = 'tryb: online (live ' + H.live.replace('https://', '').split('.')[0] + ') + reguły'; }
      else { pill('#st-live', '⚪ Live offline – działa wersja stała (Pages)', null); $('#c-mode').textContent = 'tryb: offline (reguły)'; }
      var bs = H.status && H.status.bots, bots = bs && bs.count;
      pill('#st-bots', 'Boty: ' + (typeof bots === 'number' ? bots + ' online' : (H.live ? 'online' : 'rejestr Drive')), H.live ? true : null);
      pill('#st-time', 'Odświeżono ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + (H.status ? ' · generator ' + H.status.generated : ''));
      $('#f-gen').textContent = H.status ? 'status: ' + H.status.generated : '';
    });
  }

  // ---------------------------------------------------------- apps
  function renderApps() {
    var cats = ['Wszystko'].concat(H.apps.map(function (a) { return a.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    $('#a-cats').innerHTML = cats.map(function (c) { return '<button class="' + (c === H.cat ? 'on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    var q = ($('#a-q').value || '').toLowerCase();
    $('#a-list').innerHTML = H.apps.filter(function (a) { return (H.cat === 'Wszystko' || a.cat === H.cat) && (!q || (a.title + a.file).toLowerCase().indexOf(q) >= 0); }).map(function (a) {
      var ok = a.http === 200; return '<a class="card" href="' + esc(a.url) + '" target="_blank" rel="noopener"><b><span class="dot ' + (ok ? 'ok' : 'bad') + '"></span>' + esc(a.title) + '</b><small>' + esc(a.cat) + ' · ' + esc(a.file) + (ok ? '' : ' · offline ' + a.http) + '</small></a>';
    }).join('') || '<p class="hint">Brak wyników.</p>';
    $('#a-apk').innerHTML = H.apks.map(function (a) { return '<a class="card" href="' + esc(a.url) + '"><b>📦 ' + esc(a.name) + '</b><small>' + a.mb + ' MB · Android</small></a>'; }).join('') + '<a class="card" href="../download.html#pomoc"><b>❓ Pomoc instalacji</b><small>download.html</small></a>';
  }

  // ---------------------------------------------------------- drive
  function renderDrive(d) {
    if (!d || !d.items || !d.items.length) { $('#d-meta').textContent = 'Lista plików Drive niedostępna. Otwórz folder przyciskiem obok.'; return; }
    var ic = { folder: '📁', doc: '📄', sheet: '📊', json: '🧾', csv: '📊', html: '🌐', zip: '🗜', markdown: '📝' };
    function link(x) { return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + (ic[x.kind] || '📎') + ' ' + esc(x.name) + '<span class="k">' + esc(x.kind) + (x.size ? ' · ' + Math.round(x.size / 1024) + ' KB' : '') + ' · ' + esc(x.modified) + '</span></a>'; }
    $('#d-meta').textContent = 'Lista z Google Drive z ' + (d.cachedAt || d.generated) + '. Pliki otwierają się w Drive z Twoimi uprawnieniami.';
    $('#d-list').innerHTML = d.items.map(function (x) {
      if (x.kind !== 'folder') return link(x);
      return '<details><summary>📁 ' + esc(x.name) + ' <span class="k">' + (x.children ? x.children.length + ' pozycji' : '') + '</span></summary>' + link(x) + (x.children || []).map(link).join('') + '</details>';
    }).join('');
  }

  // ---------------------------------------------------------- Bot D chat (rule-based, Polish)
  var log = [];
  try { log = JSON.parse(localStorage.getItem('ssi-chat') || '[]').slice(-40); } catch (e) {}
  function say(who, t) { log.push({ w: who, t: t }); log = log.slice(-40); try { localStorage.setItem('ssi-chat', JSON.stringify(log)); } catch (e) {} draw(); }
  function draw() { var e = $('#c-log'); e.innerHTML = log.map(function (m) { return '<div class="msg ' + m.w + '">' + esc(m.t).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>') + '</div>'; }).join(''); e.scrollTop = e.scrollHeight; }
  function norm(s) { return String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  var BASE = 'https://danieldydo-cyber.github.io/d7-dj/';
  function find(q) {
    var w = norm(q).split(/\W+/).filter(function (x) { return x.length > 2 && ['jest', 'gdzie', 'otworz', 'pokaz', 'link', 'daj', 'strona', 'aplikacja', 'apke', 'apka'].indexOf(x) < 0; });
    if (!w.length) return [];
    return H.apps.map(function (a) { var t = norm(a.title + ' ' + a.file + ' ' + a.cat), sc = 0; w.forEach(function (x) { if (t.indexOf(x) >= 0) sc++; }); return { a: a, sc: sc }; }).filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 4).map(function (x) { return x.a; });
  }
  function answer(q) {
    var n = norm(q), S = window.SSI, m;
    if (/^(pomoc|help|\?|co umiesz)/.test(n)) return 'Umiem:\n• „graj techno 135”, „graj hip hop”, „stop”, „losuj”\n• „generuj mroczne techno acid 132 bpm”\n• „drop”, „build”, „nagraj”\n• „apk”, „sklep”, „blik”, „live”, „drive”\n• albo wpisz nazwę apki, np. „mk3”, „mega show”, „wedj”.';
    if (/^(siema|czesc|hej|elo|hello|hi)\b/.test(n)) return 'Siema DaX 💚 Super SI online. Napisz „pomoc”, a pokażę, co umiem.';
    if (/\bstop\b|zatrzymaj|cisza/.test(n)) { S && S.stop(); return '■ Stop.'; }
    if (/generuj|stworz|zrob (utwor|track|kawalek)|wygeneruj/.test(n)) { var d = S.generate(q); return d + '\n(Silnik 6 · zakładka „Generator utworu”)'; }
    if (/losuj|random|zaskocz/.test(n)) { var k = S.random(); S.start(); return '🎲 Losowo: ' + k + ' · ' + S.bpm + ' BPM'; }
    if (/\bdrop\b/.test(n)) { S.drop(); return '💥 Drop!'; }
    if (/build/.test(n)) { S.buildUp(); return '⤴ Build-up 8 taktów, potem drop.'; }
    if (/nagr|record/.test(n)) { S.rec(); return '⏺ Nagrywanie przełączone. Kolejne „nagraj” zapisze plik .webm.'; }
    if (/(graj|play|odpal|wlacz|start)/.test(n)) {
      var map = { 'hard': 'hardtechno', 'techno': 'techno', 'house': 'house', 'hip': 'hiphop', 'rap': 'hiphop', 'trap': 'trap', 'hood': 'trap', 'trance': 'trance', 'dnb': 'dnb', 'drum': 'dnb', 'shuffle': 'shuffle', '90': 'shuffle' }, st = null;
      Object.keys(map).forEach(function (k) { if (!st && n.indexOf(k) >= 0) st = map[k]; });
      if (st) S.setStyle(st); m = n.match(/\b(\d{2,3})\b/); if (m && +m[1] >= 60 && +m[1] <= 190) S.setBpm(+m[1]); S.start();
      return '▶ Gram ' + S.style + ' · ' + S.bpm + ' BPM.';
    }
    m = n.match(/bpm\s*(\d{2,3})|(\d{2,3})\s*bpm/); if (m) { S.setBpm(+(m[1] || m[2])); return 'BPM = ' + S.bpm; }
    if (/blik|platn|zaplac|przelew|iban|nest|wesprzyj|wsparcie|kup|cena|ile kosztuje/.test(n)) return 'Płatność 💚\nBLIK na telefon: 730 377 357\nPrzelew Nest Bank: PL45 1870 1045 2083 1058 7576 0001 (Daniel Dydo)\nSklep z aplikacjami: ' + BASE + 'sklep.html\nPłatności: ' + BASE + 'pay/';
    if (/apk|android|pobierz|download|instal/.test(n)) return 'Android: ' + BASE + 'download.html\nPomoc instalacji: ' + BASE + 'download.html#pomoc' + (H.apks.length ? '\nNajnowsze APK: ' + H.apks.slice(-3).map(function (a) { return a.name; }).join(', ') : '');
    if (/live|tunel|online|status/.test(n)) return H.live ? '🟢 Live działa: ' + H.live + '\nStała wersja: ' + BASE : '⚪ Live jest teraz offline. Stała wersja działa zawsze: ' + BASE + (H.status ? '\nPages: ' + H.status.pagesOk + '/' + H.status.pagesTotal + ' OK' : '');
    if (/drive|dysk|folder|mozg|agent/.test(n)) return 'Folder D7 Super SI Network na Google Drive: https://drive.google.com/drive/folders/15cMJ-94HUV-ZAJmOOFJjVLU0LDgl9sMP\nLista plików jest w sekcji 🗂 Drive niżej.';
    if (/bot|boty/.test(n) && !find(q).length) return 'Boty: ' + BASE + 'bots.html · HUB: ' + BASE + 'hub/ · D Unit: ' + BASE + 'dunit/';
    var f = find(q); if (f.length) return 'Znalazłem:\n' + f.map(function (a) { return '• ' + a.title + ' → ' + a.url; }).join('\n');
    return 'Nie rozumiem jeszcze tego polecenia 🤖 Napisz „pomoc”. Mogę grać muzykę, generować utwory, otwierać apki i pokazać BLIK.';
  }
  function wireChat() {
    if (!log.length) say('bot', 'Siema! Jestem Bot D · Super SI 🎛 Napisz „graj techno 132”, „generuj hip hop 90 bpm chill”, „apk” albo „pomoc”.'); else draw();
    $('#c-form').addEventListener('submit', function (e) { e.preventDefault(); var i = $('#c-in'), t = i.value.trim(); if (!t) return; i.value = ''; say('me', t); var a; try { a = answer(t); } catch (er) { a = 'Ups, błąd: ' + er.message; } setTimeout(function () { say('bot', a); }, 150); });
  }

  // ---------------------------------------------------------- init
  function init() {
    document.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { var v = b.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('Skopiowano ' + v); }).catch(function () { prompt('Skopiuj:', v); }); }); });
    $('#a-cats').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { H.cat = b.dataset.c; renderApps(); } });
    $('#a-q').addEventListener('input', renderApps);
    $('#st-refresh').addEventListener('click', refresh);
    j('drive-manifest.json?' + Date.now()).then(renderDrive).catch(function () { renderDrive(null); });
    wireChat(); refresh(); setInterval(refresh, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
