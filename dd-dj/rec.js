/* DD DJ 3.0 · Recorder (Space X Visuals canvas + master audio → WebM, codec fallback) + Uploader. Original code. */
(function () {
  'use strict';
  var A = window.DDA;
  var R = { on: false, t0: 0, chunks: [], mr: null, kind: 'av' };
  R.pick = function (video) {
    var c = video ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1,mp4a', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    if (!window.MediaRecorder) return null; for (var i = 0; i < c.length; i++) if (!MediaRecorder.isTypeSupported || MediaRecorder.isTypeSupported(c[i])) return c[i]; return '';
  };
  R.start = function (kind, fps) {
    if (R.on) return; A.init(); A.resume(); kind = kind || 'av'; R.kind = kind;
    if (!window.MediaRecorder) { A.emit('toast', '⚠️ Ta przeglądarka nie ma MediaRecorder — nagrywanie niedostępne'); return false; }
    var stream, at = A.recDest.stream.getAudioTracks();
    if (kind === 'av') { var cv = window.DDVis && DDVis.cv; if (!cv || !cv.captureStream) { A.emit('toast', '⚠️ Brak captureStream — nagrywam samo audio'); kind = R.kind = 'a'; }
      else { stream = cv.captureStream(fps || 30); at.forEach(function (t) { stream.addTrack(t); }); } }
    if (kind === 'a') stream = new MediaStream(at);
    var mime = R.pick(kind === 'av'), opt = mime ? { mimeType: mime } : {};
    if (kind === 'av') { opt.videoBitsPerSecond = (DDVis.res === '4k' ? 24 : DDVis.res === '1080' ? 10 : 6) * 1e6; opt.audioBitsPerSecond = 256000; } else opt.audioBitsPerSecond = 256000;
    var mr; try { mr = new MediaRecorder(stream, opt); } catch (e) { try { mr = new MediaRecorder(stream); } catch (e2) { A.emit('toast', '⚠️ Nagrywanie nie wystartowało: ' + e2.message); return false; } }
    R.chunks = []; R.mr = mr; R.mime = mr.mimeType || mime || (kind === 'av' ? 'video/webm' : 'audio/webm');
    mr.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); };
    mr.onstop = function () { var blob = new Blob(R.chunks, { type: R.mime }); R.last = blob; R.on = false; A.emit('rec', false); R.save(blob); };
    mr.onerror = function (e) { A.emit('toast', '⚠️ Błąd nagrywania: ' + (e.error && e.error.message || '')); };
    mr.start(1000); R.on = true; R.t0 = performance.now(); A.emit('rec', true); return true;
  };
  R.stop = function () { if (R.mr && R.on) try { R.mr.stop(); } catch (e) { R.on = false; A.emit('rec', false); } };
  R.time = function () { return R.on ? (performance.now() - R.t0) / 1000 : 0; };
  R.save = function (blob) {
    var ext = /mp4/.test(R.mime) ? 'mp4' : /ogg/.test(R.mime) ? 'ogg' : 'webm', d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'DD-DJ-' + (R.kind === 'av' ? 'show' : 'mix') + '-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.' + ext;
    if (window.D7Native && D7Native.saveFile) { var fr = new FileReader(); fr.onload = function () { var msg = D7Native.saveFile(name, String(fr.result).split(',')[1], R.mime.split(';')[0]); A.emit('toast', '💾 ' + msg); }; fr.readAsDataURL(blob); }
    else { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); A.emit('toast', '💾 Zapisano: ' + name + ' (' + (blob.size / 1048576).toFixed(1) + ' MB)'); }
    A.emit('saved', { name: name, size: blob.size });
  };
  window.DDRec = R;
})();
