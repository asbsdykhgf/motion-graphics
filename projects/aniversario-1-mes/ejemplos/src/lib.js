// ============================================================
//  lib.js: shared motion toolkit for the three examples
//  Contract: each scene defines DUR, draw(t) and buildAudio(ac); boot() exposes VIDEO / seek / buildAudio.
// ============================================================
const W = 1080, H = 1920;
const RENDER = new URLSearchParams(location.search).has('render');
if (RENDER) document.documentElement.classList.add('render');
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');

// ---------- maths & easing ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const expoOut = x => (x = clamp(x), x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const expoIn = x => (x = clamp(x), x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
const expoInOut = x => (x = clamp(x), x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2);
const quintOut = x => 1 - Math.pow(1 - clamp(x), 5);
const quintIn = x => Math.pow(clamp(x), 5);
const quintInOut = x => (x = clamp(x), x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
const cubicOut = x => 1 - Math.pow(1 - clamp(x), 3);
const cubicIn = x => Math.pow(clamp(x), 3);
const backOut = (x, s = 1.5) => (x = clamp(x) - 1, 1 + (s + 1) * x * x * x + s * x * x);
function spring(t, w = 14, z = 0.82) {
  if (t <= 0) return 0;
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}
const kf = keys => t => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, va] = keys[i - 1], [b, vb, e = ease] = keys[i]; if (t <= b) return lerp(va, vb, e((t - a) / (b - a))); } return keys[keys.length - 1][1]; };
const win = (t, a, fi, b, fo) => Math.min(seg(t, a, a + fi), 1 - seg(t, b, b + fo));
const rng = s => () => (s = (s + 0x6D2B79F5) | 0, s = Math.imul(s ^ (s >>> 15), 1 | s), s ^= s + Math.imul(s ^ (s >>> 7), 61 | s), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
// smooth 1D value noise in [-1, 1] (for drift / handheld camera)
function noise1(seed) {
  const r = rng(seed), v = Array.from({ length: 256 }, () => r() * 2 - 1);
  return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(v[i & 255], v[(i + 1) & 255], u); };
}

// ---------- fonts ----------
const FAM = { serif: "'Fraunces', Georgia, serif", sans: "'Geist', system-ui, sans-serif", hand: "'Caveat', cursive", script: "'Vibes', cursive" };
function setFont(size, fam = 'serif', weight = 400, italic = false, track = 0) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${FAM[fam]}`;
  ctx.letterSpacing = track + 'px';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}
const textW = (s, track = 0) => ctx.measureText(s).width - (s.length ? track : 0);

// Masked kinetic text: each char/word rises out of an invisible line mask and leaves upward.
// o: {size, fam, weight, italic, color, track, align, by:'char'|'word', stagger, dur, outAt, outDur, rise, alpha}
function maskText(text, x, y, t, tin, o = {}) {
  const size = o.size || 80, track = o.track || 0, by = o.by || 'char';
  setFont(size, o.fam || 'serif', o.weight || 400, o.italic, track);
  const units = by === 'word' ? text.split(/(?<= )/) : [...text];
  const total = textW(text, track);
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  const st = o.stagger ?? (by === 'word' ? 0.08 : 0.035), dur = o.dur ?? 0.9, rise = (o.rise ?? 1.1) * size;
  const outAt = o.outAt, outDur = o.outDur ?? 0.6;
  if (t < tin) return { x0, w: total };
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - size, y - size * 1.08, total + size * 2, size * 1.42); ctx.clip();
  ctx.fillStyle = o.color || '#fff';
  let acc = '';
  units.forEach((u, i) => {
    const ux = x0 + (acc.length ? ctx.measureText(acc).width : 0); acc += u;
    const pin = expoOut(seg(t, tin + i * st, tin + i * st + dur));
    const pout = outAt != null ? quintIn(seg(t, outAt + i * st * 0.6, outAt + i * st * 0.6 + outDur)) : 0;
    if (pin <= 0 || pout >= 1) return;
    ctx.globalAlpha = (o.alpha ?? 1) * clamp(pin * 2) * (1 - pout * 0.3);
    ctx.fillText(u, ux, y + (1 - pin) * rise - pout * rise);
  });
  ctx.restore();
  return { x0, w: total };
}
// left→right wipe reveal (for script lettering)
function wipeText(text, x, y, t, t0, dur, o = {}) {
  const size = o.size || 120;
  setFont(size, o.fam || 'script', o.weight || 400, o.italic, o.track || 0);
  const w = textW(text, o.track || 0), x0 = o.align === 'left' ? x : x - w / 2;
  const p = (o.e || quintInOut)(seg(t, t0, t0 + dur));
  const fade = o.outAt != null ? 1 - seg(t, o.outAt, o.outAt + (o.outDur ?? 0.5)) : 1;
  if (p <= 0 || fade <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - size * 0.5, y - size * 1.4, (w + size) * p, size * 2.2); ctx.clip();
  ctx.globalAlpha = fade; ctx.fillStyle = o.color || '#fff'; ctx.fillText(text, x0, y); ctx.restore();
}
// decoder/scramble text: characters flicker through glyphs, then lock in left→right
const SCR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/—';
function scramble(text, t, t0, dur = 0.7, seed = 1) {
  if (t < t0) return '';
  const n = text.length, r = rng(seed * 7919 + Math.floor(t * 24)); let s = '';
  for (let i = 0; i < n; i++) {
    const a = t0 + (i / n) * dur * 0.5, b = a + dur * 0.5;
    if (t < a) break;
    s += (t >= b || text[i] === ' ') ? text[i] : SCR[Math.floor(r() * SCR.length)];
  }
  return s;
}
function label(text, x, y, o = {}) {
  setFont(o.size || 24, 'sans', o.weight || 500, false, o.track ?? 5);
  ctx.fillStyle = o.color || '#fff'; ctx.globalAlpha = o.alpha ?? 1;
  const w = textW(text, o.track ?? 5);
  ctx.fillText(text, o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x, y);
  ctx.globalAlpha = 1; return w;
}
// line that draws on (from one end or from its centre)
function drawLine(x1, y1, x2, y2, p, o = {}) {
  if (p <= 0) return;
  let a = 0, b = p;
  if (o.from === 'center') { a = 0.5 - p / 2; b = 0.5 + p / 2; }
  if (o.from === 'end') { a = 1 - p; b = 1; }
  ctx.save(); ctx.strokeStyle = o.color || '#fff'; ctx.lineWidth = o.width || 2; ctx.globalAlpha = o.alpha ?? 1; ctx.lineCap = o.cap || 'butt';
  ctx.beginPath(); ctx.moveTo(lerp(x1, x2, a), lerp(y1, y2, a)); ctx.lineTo(lerp(x1, x2, b), lerp(y1, y2, b)); ctx.stroke(); ctx.restore();
}

// ---------- hearts ----------
// classic parametric heart, u in [0,1): u=0 top cusp, u=.5 bottom tip; returns unit coords (width ≈ 2, centred)
function heartPt(u) {
  const a = u * Math.PI * 2, s = Math.sin(a);
  return [16 * s * s * s / 16, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16 - 0.156];
}
const HEART = (() => { const p = new Path2D(); for (let i = 0; i <= 240; i++) { const [x, y] = heartPt(i / 240); i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); return p; })();
// draw a filled heart of width w centred at (x, y)
function heart(x, y, w, color, alpha = 1) {
  if (w <= 0 || alpha <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 2, w / 2); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill(HEART); ctx.restore();
}
// n points evenly spaced by arc length along the heart, starting at u0
function heartSamples(n, u0 = 0) {
  const fine = 2000, pts = [], len = [0];
  for (let i = 0; i <= fine; i++) pts.push(heartPt((u0 + i / fine) % 1));
  for (let i = 1; i <= fine; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = len[fine], out = []; let j = 0;
  for (let k = 0; k < n; k++) { const target = (k / n) * L; while (len[j + 1] < target) j++; const f = (target - len[j]) / (len[j + 1] - len[j] || 1); out.push([lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)]); }
  return out;
}

// ---------- sprites, texture, post ----------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function makeGlow(size, stops) {
  const g = makeCanvas(size, size), x = g.getContext('2d'), gr = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, c]) => gr.addColorStop(o, c)); x.fillStyle = gr; x.fillRect(0, 0, size, size); return g;
}
function sprite(img, x, y, w, h = w, alpha = 1, op = 'source-over') {
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, alpha); ctx.globalCompositeOperation = op; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); ctx.restore();
}
const GRAIN = Array.from({ length: 8 }, (_, k) => {
  const g = makeCanvas(540, 960), x = g.getContext('2d'), d = x.createImageData(540, 960), r = rng(300 + k);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return g;
});
function vignetteCanvas(strength = 0.55, color = '0,0,0') {
  const g = makeCanvas(W, H), x = g.getContext('2d');
  const gr = x.createRadialGradient(W / 2, H * 0.48, H * 0.22, W / 2, H * 0.48, H * 0.78);
  gr.addColorStop(0, `rgba(${color},0)`); gr.addColorStop(1, `rgba(${color},${strength})`);
  x.fillStyle = gr; x.fillRect(0, 0, W, H); return g;
}
// film grain at 24 fps cadence + vignette
function post(t, o = {}) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (o.vignette) ctx.drawImage(o.vignette, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.grain ?? 0.07;
  ctx.drawImage(GRAIN[Math.floor(t * 24) % GRAIN.length], 0, 0, W, H); ctx.restore();
  if (o.fade != null && o.fade > 0) { ctx.globalAlpha = o.fade; ctx.fillStyle = o.fadeColor || '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

// ============================================================
//  AUDIO toolkit
// ============================================================
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const b64buf = b => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
async function mixer(ac, o = {}) {
  const sr = ac.sampleRate, R = rng(o.seed || 77);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.25; comp.connect(ac.destination);
  const master = ac.createGain(); master.gain.value = o.master ?? 0.8; master.connect(comp);
  const irLen = Math.floor(sr * (o.verb ?? 3.2)), ir = ac.createBuffer(2, irLen, sr);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < irLen; i++) d[i] = (R() * 2 - 1) * Math.pow(1 - i / irLen, 2.4) * Math.exp(-i / sr * 1.4); }
  const verb = ac.createConvolver(); verb.buffer = ir; const wet = ac.createGain(); wet.gain.value = o.wet ?? 0.5; verb.connect(wet); wet.connect(master);
  const bus = (send = 0.4, vol = 1, pan = 0) => {
    const g = ac.createGain(); g.gain.value = vol; let node = g;
    if (pan) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    node.connect(master); const s = ac.createGain(); s.gain.value = send; node.connect(s); s.connect(verb); return g;
  };
  const SAMPLES = {};
  for (const [k, v] of Object.entries(typeof SFX_B64 !== 'undefined' ? SFX_B64 : {})) { try { SAMPLES[k] = await ac.decodeAudioData(b64buf(v)); } catch (e) { console.warn('sfx', k, e); } }
  const nbuf = ac.createBuffer(1, sr * 4, sr); { const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; }
  const env = (g, t0, a, peak, hold, rel) => { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); if (hold) g.gain.setValueAtTime(peak, t0 + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel); };
  const M = {
    ac, sr, R, master, bus, SAMPLES,
    sample(name, t, vol = 0.5, out = M.fx, rate = 1, pan = 0) {
      const b = SAMPLES[name]; if (!b) return; const s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
      const g = ac.createGain(); g.gain.value = vol; s.connect(g);
      if (pan) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(out); } else g.connect(out);
      s.start(Math.max(0, t));
    },
    pad(notes, t0, dur, vol = 0.5, out = M.padB, cutoff = 1100) {
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.3;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(1.2, dur * 0.4)); g.gain.setValueAtTime(vol, t0 + dur); g.gain.linearRampToValueAtTime(0, t0 + dur + 1.5);
      f.connect(g); g.connect(out);
      notes.forEach(n => [-8, 8].forEach(det => { const os = ac.createOscillator(); os.type = 'sawtooth'; os.frequency.value = mtof(n); os.detune.value = det; const og = ac.createGain(); og.gain.value = 0.04; os.connect(og); og.connect(f); os.start(t0); os.stop(t0 + dur + 1.6); }));
    },
    // soft felt-piano: decaying harmonics + low-pass that closes
    piano(m, t0, vol = 0.15, len = 2.5, out = M.keys) {
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(Math.min(9000, mtof(m) * 7), t0); f.frequency.exponentialRampToValueAtTime(Math.max(300, mtof(m) * 1.6), t0 + len * 0.6);
      const g = ac.createGain(); env(g, t0, 0.006, vol, 0, len); f.connect(g); g.connect(out);
      [[1, 1, 0], [2, 0.42, 3], [3, 0.18, -4], [4, 0.09, 6], [5, 0.05, 0]].forEach(([h, a, det]) => {
        const os = ac.createOscillator(); os.type = 'sine'; os.frequency.value = mtof(m) * h; os.detune.value = det;
        const og = ac.createGain(); og.gain.setValueAtTime(a, t0); og.gain.exponentialRampToValueAtTime(0.0005, t0 + len / Math.sqrt(h)); os.connect(og); og.connect(f); os.start(t0); os.stop(t0 + len + 0.1);
      });
    },
    bell(m, t0, vol = 0.1, len = 2.2, out = M.keys) {
      const g = ac.createGain(); env(g, t0, 0.003, vol, 0, len); g.connect(out);
      [[1, 1], [2.0, 0.3], [3.01, 0.12], [4.17, 0.06]].forEach(([h, a]) => { const os = ac.createOscillator(); os.frequency.value = mtof(m) * h; const og = ac.createGain(); og.gain.setValueAtTime(a, t0); og.gain.exponentialRampToValueAtTime(0.0005, t0 + len / h); os.connect(og); og.connect(g); os.start(t0); os.stop(t0 + len + 0.1); });
    },
    // Karplus–Strong plucked string (nylon guitar / harp)
    _ks: {},
    pluck(m, t0, vol = 0.25, out = M.keys, bright = 0.5) {
      const key = m + ':' + bright;
      if (!M._ks[key]) {
        const f = mtof(m), N = Math.max(2, Math.round(sr / f - 0.5)), len = Math.floor(sr * 3.2), b = ac.createBuffer(1, len, sr), d = b.getChannelData(0), r = rng(m * 31 + 7);
        const decay = 0.9965 + 0.0025 * clamp((60 - m) / 40 + 0.5);
        let lp = 0; for (let i = 0; i < N; i++) { lp = lp * (1 - bright) + (r() * 2 - 1) * bright; d[i] = lp; }
        for (let i = N; i < len; i++) d[i] = decay * 0.5 * (d[i - N] + d[i - N - 1 >= 0 ? i - N - 1 : 0]);
        let mx = 0; for (let i = 0; i < len; i++) mx = Math.max(mx, Math.abs(d[i])); for (let i = 0; i < len; i++) d[i] /= mx || 1;
        M._ks[key] = { b, rate: f / (sr / (N + 0.5)) };
      }
      const { b, rate } = M._ks[key], s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = rate;
      const g = ac.createGain(); g.gain.value = vol; s.connect(g); g.connect(out); s.start(t0);
    },
    bass(m, t0, dur, vol = 0.25, out = M.low) {
      const os = ac.createOscillator(); os.type = 'triangle'; os.frequency.value = mtof(m);
      const os2 = ac.createOscillator(); os2.type = 'sine'; os2.frequency.value = mtof(m - 12);
      const g = ac.createGain(); env(g, t0, 0.015, vol, dur * 0.3, dur * 0.7); os.connect(g); os2.connect(g); g.connect(out);
      os.start(t0); os2.start(t0); os.stop(t0 + dur + 0.1); os2.stop(t0 + dur + 0.1);
    },
    kick(t0, vol = 0.6, out = M.low) {
      const os = ac.createOscillator(); os.frequency.setValueAtTime(120, t0); os.frequency.exponentialRampToValueAtTime(42, t0 + 0.12);
      const g = ac.createGain(); env(g, t0, 0.004, vol, 0, 0.35); os.connect(g); g.connect(out); os.start(t0); os.stop(t0 + 0.4);
    },
    hat(t0, vol = 0.05, out = M.fx, len = 0.05) {
      const s = ac.createBufferSource(); s.buffer = nbuf; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = ac.createGain(); env(g, t0, 0.002, vol, 0, len); s.connect(f); f.connect(g); g.connect(out); s.start(t0, R() * 3); s.stop(t0 + len + 0.05);
    },
    noise(t0, dur, f0, f1, vol, shape = 'swell', out = M.fx, type = 'bandpass', q = 1.0) {
      const s = ac.createBufferSource(); s.buffer = nbuf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const g = ac.createGain();
      if (shape === 'swell') { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.25); }
      else if (shape === 'hit') { g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); }
      else { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.45); g.gain.linearRampToValueAtTime(0, t0 + dur); }
      s.connect(f); f.connect(g); g.connect(out); s.start(t0, R() * 2); s.stop(t0 + dur + 0.3);
    },
    boom(t0, vol = 0.7, out = M.low) {
      const os = ac.createOscillator(); os.frequency.setValueAtTime(95, t0); os.frequency.exponentialRampToValueAtTime(30, t0 + 1.1);
      const g = ac.createGain(); env(g, t0, 0.01, vol, 0, 1.5); os.connect(g); g.connect(out); os.start(t0); os.stop(t0 + 1.7);
    },
  };
  M.padB = bus(0.55, 1); M.keys = bus(0.45, 1); M.low = bus(0.08, 1); M.fx = bus(0.35, 1);
  return M;
}

// ============================================================
//  boot: fonts, contract, preview player
// ============================================================
function boot(DUR, draw, buildAudio, fontsToLoad) {
  const seek = t => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; draw(clamp(t, 0, DUR)); };
  (async () => {
    try { await Promise.all(fontsToLoad.map(f => document.fonts.load(f))); } catch (e) {}
    await document.fonts.ready;
    window.VIDEO = { w: W, h: H, duration: DUR };
    window.seek = seek; window.buildAudio = buildAudio;
    seek(0);
    if (RENDER) return;
    const stage = document.getElementById('stage');
    const fit = () => { const k = Math.min(innerWidth / W, (innerHeight - 60) / H); stage.style.transform = `translate(${(innerWidth - W * k) / 2}px, 0) scale(${k})`; };
    addEventListener('resize', fit); fit();
    let buf, ac, src, startAt = 0, offset = 0, playing = false;
    const pp = document.getElementById('pp'), sc = document.getElementById('scrub'), tc = document.getElementById('tc');
    async function play() {
      ac ??= new AudioContext();
      if (!buf) { pp.textContent = '…'; const off = new OfflineAudioContext(2, Math.ceil(48000 * (DUR + 1)), 48000); await buildAudio(off); buf = await off.startRendering(); }
      if (offset >= DUR - 0.05) offset = 0;
      src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
      src.start(0, offset); startAt = ac.currentTime; playing = true; pp.textContent = '❚❚ Pausa';
    }
    function pause() { if (!playing) return; offset += ac.currentTime - startAt; src.stop(); playing = false; pp.textContent = '▶ Reproducir'; }
    const now = () => playing ? offset + ac.currentTime - startAt : offset;
    pp.onclick = () => playing ? pause() : play();
    sc.oninput = () => { const was = playing; pause(); offset = sc.value / 1000 * DUR; if (was) play(); };
    (function loop() {
      let t = now(); if (playing && t >= DUR) { pause(); offset = DUR - 0.001; t = offset; }
      seek(t); sc.value = Math.round(t / DUR * 1000); tc.textContent = t.toFixed(1) + ' s';
      requestAnimationFrame(loop);
    })();
  })();
}
